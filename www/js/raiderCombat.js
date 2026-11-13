window.Game = window.Game || {};

// ==========================================================
// Räuber-Angriff auf das Spielerlager
//
// Verantwortlich für:
//  - Räuber-Krieger, die im inAttack-State sind (rv.attackState gesetzt)
//  - Bewegung zum nächsten Dropoff (Schloss/Lager)
//  - Beute klauen (claimLoot)
//  - Flucht (retreating) → zurück ins Räuber-Territorium
//  - Rückkehr zum Haus (returning_to_house)
//  - Kollisions-Kampf mit Spieler-Kriegern (0.6 Tiles)
//
// NICHT verantwortlich für:
//  - Räuber-Verteidigung (raiderDefense.js)
//  - Spieler-Krieger-Bewegung (playerCombat.js)
//
// Wichtige Regeln:
//  - Diebstahl hat Priorität: Räuber laufen weiter zum Dropoff,
//    auch wenn Spieler-Krieger in der Nähe sind.
//  - Kollision → einmaliger Kampf (kein Stehenbleiben, kein Zielwechsel).
//  - retreating wird NUR ausgelöst, wenn Beute geclaimt wurde.
//  - Räuber, die von raiderDefense.js verwaltet werden (hidden=true,
//    nicht inAttack), werden hier ignoriert.
// ==========================================================
Game.RaiderCombat = {
  create(game, world, vm, rv, renderer, audioManager) {
    if (!rv) {
      return { update() {}, reset() {} };
    }

    const COLLISION_DIST_SQ = Game.Combat.COLLISION_DIST_SQ;

    // ==========================================================
    // Dropoff finden (nächstes Lager/Schloss vom Räuber aus)
    // ==========================================================
    function findNearestDropoff(rx, ry) {
      let best = null;
      let bestDistSq = Infinity;
      for (const b of world.dropoffBuildings) {
        if (!b.built || b.ruined) continue;
        const targetX = b.x + (b.w || 1) / 2;
        const targetY = b.y + (b.h || 1);
        const dx = targetX - rx;
        const dy = targetY - ry;
        const distSq = dx * dx + dy * dy;
        if (distSq < bestDistSq) {
          bestDistSq = distSq;
          best = {
            x: targetX,
            y: targetY,
            targetTileY: b.y + (b.h || 1),
            minX: b.x,
            maxX: b.x + (b.w || 1),
            minY: b.y,
            buildingId: b.id
          };
        }
      }
      return best;
    }

    // ==========================================================
    // Bewegung mit Kollisionsvermeidung (Räuber ↔ Räuber)
    // ==========================================================
    function moveRaiderToward(w, tx, ty, dtSec) {
      const dx = tx - w.x;
      const dy = ty - w.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 0.01) return true;

      const step = Math.min(rv.WARRIOR_SPEED * dtSec, dist);
      const newX = w.x + (dx / dist) * step;
      const newY = w.y + (dy / dist) * step;

      // Kollision mit anderen Räubern vermeiden
      let blocked = false;
      for (const other of rv.warriors.values()) {
        if (other === w || other.dead || other.hidden) continue;
        if (other.id > w.id) continue;
        const ox = newX - other.x;
        const oy = newY - other.y;
        if (ox * ox + oy * oy < 0.64) { blocked = true; break; }
      }

      if (!blocked) {
        w.x = newX;
        w.y = newY;
      }

      w.targetX = tx;
      w.targetY = ty;
      w.renderX = w.x;
      w.renderY = w.y;

      return dist <= 0.5;
    }

    // ==========================================================
    // Kollisions-Kampf mit Spieler-Kriegern
    // Wird pro Frame pro Räuber einmal geprüft.
    // ==========================================================
    function checkCombatCollision(w) {
      const grid = game.spatialGrid;
      if (!grid) return;

      const nearby = grid.queryByType(w.x, w.y, 1.5, 'warrior');

      for (const v of nearby) {
        if (!vm.villagers.has(v.id)) continue;
        if (v.state === 'dragon_attack') continue;
        if (v.hidden) continue;

        const dx = v.x - w.x;
        const dy = v.y - w.y;
        if (dx * dx + dy * dy > COLLISION_DIST_SQ) continue;

        // Kampf auswürfeln
        const winChance = v.winChanceRaider !== undefined ? v.winChanceRaider : 0.60;

        if (Math.random() < winChance) {
          // Spieler gewinnt
          rv.markWarriorDead(w.id);
          if (renderer && renderer.spawnHarvestParticles) {
            renderer.spawnHarvestParticles(Math.floor(w.x), Math.floor(w.y), 'stone');
          }
          if (vm && typeof vm.addKill === 'function') {
            vm.addKill(v);
          }
        } else {
          // Räuber gewinnt
          vm.killVillager(v);
          if (audioManager) audioManager.playOneShot('audio/schrei.mp3');
        }

        // Nur ein Kampf pro Frame pro Räuber
        return;
      }
    }

    // ==========================================================
    // retreating: Räuber flieht mit Beute zurück ins Räuber-Territorium
    // ==========================================================
    function updateRetreating(w, dtSec) {
      const center = rv.getCenter();
      if (!center) {
        // Kein Zentrum mehr (Lager zerstört?) → einfach heimwärts
        w.state = 'returning_to_house';
        w.inAttack = false;
        return;
      }

      // Zum Räuber-Zentrum laufen
      const dx = center.x - w.x;
      const dy = center.y - w.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0.5) {
        moveRaiderToward(w, center.x, center.y, dtSec);
      }

      // Kollisions-Kampf auch beim Rückzug (Spieler kann hinterherlaufen)
      checkCombatCollision(w);

      // Im Räuber-Territorium angekommen? → returning_to_house
      if (rv.isInRaiderTerritory(w.x, w.y)) {
        w.inAttack = false;
        w.carryingLoot = false;
        w.state = 'returning_to_house';
        w.hidden = false;
      }
    }

    // ==========================================================
    // returning_to_house: Räuber läuft zum Gebäude zurück
    // ==========================================================
    function updateReturningToHouse(w, dtSec) {
      // Sonderfall: Räuber ist im Räuber-Territorium und das Lager
      // hat alarmActive → raiderDefense.js übernimmt ihn ab jetzt.
      // Wir setzen hidden = false, damit er sichtbar bleibt.
      // Sobald er am Gebäude ankommt, wird er in raiderDefense.js
      // ggf. versteckt (wenn kein Alarm) oder zum Verteidigungspunkt
      // geschickt (wenn Alarm).

      const home = rv.buildings.find(b => b.id === w.homeBuildingId);
      if (!home || home.isDestroyed || home.isBurning) {
        w.hidden = true;
        w.state = 'idle';
        w.inAttack = false;
        return;
      }

      const hx = home.x + (home.w || 1) / 2;
      const hy = home.y + (home.h || 1) / 2;
      const dx = hx - w.x;
      const dy = hy - w.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= 0.5) {
        // Angekommen: je nach Situation verstecken oder warten
        w.x = hx;
        w.y = hy;
        w.targetX = hx;
        w.targetY = hy;
        w.renderX = w.x;
        w.renderY = w.y;
        w.state = 'idle';
        w.inAttack = false;

        // Wenn alarmActive → raiderDefense.js kümmert sich
        // Wenn nicht → hidden = true
        if (!rv.alarmActive) {
          w.hidden = true;
        }
        return;
      }

      // Bewegung (Kollision mit anderen Räubern vermeiden)
      const step = Math.min(rv.WARRIOR_SPEED * dtSec, dist);
      const newX = w.x + (dx / dist) * step;
      const newY = w.y + (dy / dist) * step;

      let blocked = false;
      for (const other of rv.warriors.values()) {
        if (other === w || other.dead || other.hidden) continue;
        if (other.id > w.id) continue;
        const ox = newX - other.x;
        const oy = newY - other.y;
        if (ox * ox + oy * oy < 0.64) { blocked = true; break; }
      }

      if (!blocked) {
        w.x = newX;
        w.y = newY;
      }

      w.targetX = hx;
      w.targetY = hy;
      w.renderX = w.x;
      w.renderY = w.y;
    }

    // ==========================================================
    // Angreifer: Räuber läuft zum Dropoff
    // (Diebstahl hat Priorität, Kampf nur bei Kollision)
    // ==========================================================
    function updateAttacker(w, dtSec) {
      // Wenn Beute getragen → sofort retreating
      if (w.carryingLoot) {
        w.state = 'retreating';
        return;
      }

      // Wenn kein attackState mehr → inAttack aufheben, heimwärts
      if (!rv.attackState) {
        w.inAttack = false;
        w.state = 'returning_to_house';
        return;
      }

      // Nächstes Dropoff ermitteln (jeden Frame neu, weil der Räuber
      // sich bewegt und das nächste Dropoff sich ändern kann)
      const dropoff = findNearestDropoff(w.x, w.y);

      if (!dropoff) {
        // Kein Dropoff mehr da (alle zerstört?) → zurück
        w.inAttack = false;
        w.state = 'returning_to_house';
        return;
      }

      // Ziel: Dropoff-Position
      const targetX = dropoff.x;
      const targetY = dropoff.y;

      // Bewegung
      const moveDx = targetX - w.x;
      const moveDy = targetY - w.y;
      const moveDist = Math.sqrt(moveDx * moveDx + moveDy * moveDy);

      // Angekommen? (Toleranz 0.5 Tiles ums Dropoff-Ziel)
      const hasReachedTarget = (
        w.x >= dropoff.minX - 0.5 &&
        w.x <= dropoff.maxX + 0.5 &&
        w.y >= dropoff.targetTileY - 0.5 &&
        w.y <= dropoff.targetTileY + 0.5
      );

      if (!hasReachedTarget) {
        if (moveDist > 0.01) {
          const step = Math.min(rv.WARRIOR_SPEED * dtSec, moveDist);
          const newX = w.x + (moveDx / moveDist) * step;
          const newY = w.y + (moveDy / moveDist) * step;

          // Kollision mit anderen Räubern vermeiden
          let blocked = false;
          for (const other of rv.warriors.values()) {
            if (other === w || other.dead || other.hidden) continue;
            if (other.id > w.id) continue;
            const ox = newX - other.x;
            const oy = newY - other.y;
            if (ox * ox + oy * oy < 0.64) { blocked = true; break; }
          }

          if (!blocked) {
            w.x = newX;
            w.y = newY;
          }
        }

        w.targetX = targetX;
        w.targetY = targetY;
        w.renderX = w.x;
        w.renderY = w.y;

        // Kollisions-Kampf mit Spieler-Kriegern (parallel zur Bewegung)
        checkCombatCollision(w);
      } else {
        // Dropoff erreicht → Beute klauen
        w.targetX = targetX;
        w.targetY = targetY;
        w.renderX = w.x;
        w.renderY = w.y;

        if (rv.attackState && !rv.attackState.lootClaimed) {
          rv.claimLoot();
        }

        // Nach dem Klauen: alle Räuber mit Beute → retreating
        for (const other of rv.warriors.values()) {
          if (other.dead || other.hidden) continue;
          if (!other.inAttack) continue;
          if (other.carryingLoot) continue;
          other.state = 'retreating';
        }
      }
    }

    // ==========================================================
    // Update pro Frame
    // ==========================================================
    function update(dt) {
      if (world.castleId === null) return;

      const dtSec = dt / 1000;

      // Lager zerstört → nichts mehr zu tun
      if (rv.isDestroyed) {
        for (const w of rv.warriors.values()) {
          if (w.dead) continue;
          if (w.inAttack) {
            w.inAttack = false;
            w.carryingLoot = false;
            w.state = 'returning_to_house';
          }
        }
        return;
      }

      // Räuber, die im Angriff sind, werden hier verwaltet
      for (const w of rv.warriors.values()) {
        if (w.dead) continue;

        // Nur Räuber im inAttack-State werden hier behandelt
        if (!w.inAttack) continue;

        // Rückzug mit Beute
        if (w.state === 'retreating' || w.carryingLoot) {
          updateRetreating(w, dtSec);
          continue;
        }

        // Angriff aufs Lager
        if (w.state === 'marching_to_player') {
          updateAttacker(w, dtSec);
          continue;
        }
      }

      // Räuber, die "returning_to_house" sind (nach Rückzug),
      // werden auch hier verwaltet (Bewegung zum Gebäude)
      for (const w of rv.warriors.values()) {
        if (w.dead) continue;
        if (w.inAttack) continue; // nicht inAttack → gehört zu Defense/Idle
        if (w.state === 'returning_to_house') {
          updateReturningToHouse(w, dtSec);
        }
      }
    }

    function reset() {
      // Nichts zu resetten — Zustand liegt in rv.warriors
    }

    return { update, reset };
  }
};
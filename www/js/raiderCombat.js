window.Game = window.Game || {};

// ==========================================================
// Räuber-Angriff auf das Spielerlager
// ==========================================================
Game.RaiderCombat = {
  create(game, world, vm, rv, renderer, audioManager) {
    if (!rv) {
      return { update() {}, reset() {} };
    }

    const COLLISION_DIST_SQ = Game.Combat.COLLISION_DIST_SQ;

    // Best-of-3 Rundendauer
    const COMBAT_ROUND_MS = 500;

    // Frame-Zähler (pro Modul) — verhindert Kettenreaktion im selben Frame
    let _combatFrame = 0;

    // Kämpfe, die im letzten Frame geendet haben, werden hier gesammelt
    // und am Anfang des nächsten update() ausgewertet.
    const _pendingResolutions = [];

    // ==========================================================
    // Kampf-Status-Helfer
    // ==========================================================
    function isInActiveCombat(entity) {
      return !!(entity && entity._combatUntil && entity._combatUntil > performance.now());
    }

    function clearWarriorsTargetingRaider(raiderId) {
      for (const v of vm.villagers.values()) {
        if (v._combatTargetId !== raiderId) continue;
        v._combatUntil = 0;
        v._combatWin = undefined;
        v._combatTargetId = undefined;
      }
    }

    function clearRaiderTargetingWarrior(warriorId) {
      for (const w of rv.warriors.values()) {
        if (w._combatWith !== warriorId) continue;
        w._combatUntil = 0;
        w._combatWith = undefined;
        w._combatTargetId = undefined;
      }
    }

    // ==========================================================
    // Dropoff finden
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

    function moveRaiderToward(w, tx, ty, dtSec) {
      const dx = tx - w.x;
      const dy = ty - w.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 0.01) return true;

      const step = Math.min(rv.WARRIOR_SPEED * dtSec, dist);
      const newX = w.x + (dx / dist) * step;
      const newY = w.y + (dy / dist) * step;

      let blocked = false;
      for (const other of rv.warriors.values()) {
        if (other === w || other.dead || other.hidden) continue;
        if (other.id > w.id) continue;
        if (isInActiveCombat(other)) continue;
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
    // Kampf auslösen (Best-of-3)
    // ==========================================================
    function startCombat(w, v) {
      const now = performance.now();

      // Guard: kein neuer Kampf, wenn eine Entität in diesem Frame
      // bereits aufgelöst wurde (verhindert Kettenreaktion).
      if (v._combatFrame === _combatFrame) return;
      if (w._combatFrame === _combatFrame) return;

      const winChance = v.winChanceRaider !== undefined ? v.winChanceRaider : 0.60;

      // Best-of-3
      let roundWins = 0;
      let roundLosses = 0;
      for (let round = 0; round < 3 && roundWins < 2 && roundLosses < 2; round++) {
        if (Math.random() < winChance) roundWins++;
        else roundLosses++;
      }
      v._combatWin = roundWins >= 2;

      const roundsPlayed = roundWins + roundLosses;
      const combatDuration = roundsPlayed * COMBAT_ROUND_MS;

      v._combatUntil = now + combatDuration;
      v._combatTargetId = w.id;

      w._combatUntil = now + combatDuration;
      w._combatWith = v.id;
      w._combatTargetId = v.id;
      w._combatWin = !v._combatWin;

      if (renderer && renderer.particles) {
        for (let k = 0; k < 8; k++) {
          const ang = Math.random() * Math.PI * 2;
          renderer.particles.push({
            x: w.x + Math.random() * 0.6 - 0.3,
            y: w.y + Math.random() * 0.6 - 0.3,
            vx: Math.cos(ang) * 0.3,
            vy: Math.sin(ang) * 0.3 - 0.2,
            life: 0.5,
            color: 'rgba(180,180,180,0.5)',
            size: 3 + Math.random() * 2,
            _shape: 'mist',
            _grow: 0.3
          });
        }
      }
    }

    // ==========================================================
    // Kampf in die Pending-Queue legen (wird nächsten Frame ausgewertet)
    // ==========================================================
    function queueResolution(w, v) {
      if (!w || !v) return;
      // Nur einmal pro Paar einreihen
      for (const p of _pendingResolutions) {
        if (p.a === w && p.b === v) return;
      }
      _pendingResolutions.push({ a: w, b: v });
    }

    // ==========================================================
    // Kampf auswerten (wird nur aus der Resolve-Phase aufgerufen)
    // ==========================================================
    function resolveCombat(w, v) {
      const targetAlive = v && vm.villagers.has(v.id);

      const spawnMist = (x, y) => {
        if (!renderer || !renderer.particles) return;
        for (let k = 0; k < 14; k++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = 0.4 + Math.random() * 0.8;
          renderer.particles.push({
            x: x + Math.random() * 0.8 - 0.4,
            y: y + Math.random() * 0.8 - 0.4,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd - 0.3,
            life: 1.0,
            color: 'rgba(200,200,200,0.6)',
            size: 4 + Math.random() * 3,
            _shape: 'mist',
            _grow: 0.5
          });
        }
      };

      if (w._combatWin && targetAlive) {
        spawnMist(v.x, v.y);
        clearRaiderTargetingWarrior(v.id);
        vm.killVillager(v);
        if (audioManager) audioManager.playOneShot('audio/schrei.mp3');
      } else if (w._combatWin && !targetAlive) {
        clearRaiderTargetingWarrior(v.id);
      } else {
        rv.markWarriorDead(w.id);
        w._combatUntil = 0;
        w._combatWith = undefined;
        w._combatTargetId = undefined;
        clearWarriorsTargetingRaider(w.id);
        if (renderer && renderer.spawnHarvestParticles) {
          renderer.spawnHarvestParticles(Math.floor(w.x), Math.floor(w.y), 'stone');
        }
        if (vm && typeof vm.addKill === 'function') {
          vm.addKill(v);
        }
      }

      w._combatUntil = 0;
      w._combatWin = undefined;
      w._combatTargetId = undefined;

      // Frame-Marker: verhindert neuen Kampf im selben Frame
      w._combatFrame = _combatFrame;
      if (v) v._combatFrame = _combatFrame;
    }

    // ==========================================================
    // Kollisions-Kampf mit Spieler-Kriegern
    // ==========================================================
    function checkCombatCollision(w) {
      const grid = game.spatialGrid;
      if (!grid) return;

      const now = performance.now();

      // Läuft bereits ein Kampf?
      if (w._combatUntil && w._combatUntil > now) return;
      if (w._combatUntil && w._combatUntil <= now) {
        let v = w._combatTargetId !== undefined
          ? vm.villagers.get(w._combatTargetId)
          : null;
        if (!v) {
          w._combatUntil = 0;
          w._combatWin = undefined;
          w._combatTargetId = undefined;
        } else {
          queueResolution(w, v);
          return;
        }
      }

      const nearby = grid.queryByType(w.x, w.y, 1.5, 'warrior');

      for (const v of nearby) {
        if (!vm.villagers.has(v.id)) continue;
        if (v.state === 'dragon_attack') continue;
        if (v.hidden) continue;
        if (isInActiveCombat(v)) continue;
        if (v._combatFrame === _combatFrame) continue;

        const dx = v.x - w.x;
        const dy = v.y - w.y;
        if (dx * dx + dy * dy > COLLISION_DIST_SQ) continue;

        startCombat(w, v);
        return;
      }
    }

    function updateRetreating(w, dtSec) {
      const center = rv.getCenter();
      if (!center) {
        w.state = 'returning_to_house';
        w.inAttack = false;
        return;
      }

      const dx = center.x - w.x;
      const dy = center.y - w.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0.5) {
        moveRaiderToward(w, center.x, center.y, dtSec);
      }

      checkCombatCollision(w);

      if (rv.isInRaiderTerritory(w.x, w.y)) {
        w.inAttack = false;
        w.carryingLoot = false;
        w.state = 'returning_to_house';
        w.hidden = false;
      }
    }

    function updateReturningToHouse(w, dtSec) {
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
        w.x = hx;
        w.y = hy;
        w.targetX = hx;
        w.targetY = hy;
        w.renderX = w.x;
        w.renderY = w.y;
        w.state = 'idle';
        w.inAttack = false;

        if (!rv.alarmActive) {
          w.hidden = true;
        }
        return;
      }

      const step = Math.min(rv.WARRIOR_SPEED * dtSec, dist);
      const newX = w.x + (dx / dist) * step;
      const newY = w.y + (dy / dist) * step;

      let blocked = false;
      for (const other of rv.warriors.values()) {
        if (other === w || other.dead || other.hidden) continue;
        if (other.id > w.id) continue;
        if (isInActiveCombat(other)) continue;
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

    function updateAttacker(w, dtSec) {
      if (w.carryingLoot) {
        w.state = 'retreating';
        return;
      }

      if (!rv.attackState) {
        w.inAttack = false;
        w.state = 'returning_to_house';
        return;
      }

      const now = performance.now();

      if (w._combatUntil && w._combatUntil > now) {
        w.renderX = w.x;
        w.renderY = w.y;
        return;
      }
      if (w._combatUntil && w._combatUntil <= now) {
        let v = w._combatTargetId !== undefined
          ? vm.villagers.get(w._combatTargetId)
          : null;
        if (!v) {
          w._combatUntil = 0;
          w._combatWin = undefined;
          w._combatTargetId = undefined;
        } else {
          queueResolution(w, v);
          return;
        }
      }

      const dropoff = findNearestDropoff(w.x, w.y);

      if (!dropoff) {
        w.inAttack = false;
        w.state = 'returning_to_house';
        return;
      }

      const targetX = dropoff.x;
      const targetY = dropoff.y;

      const moveDx = targetX - w.x;
      const moveDy = targetY - w.y;
      const moveDist = Math.sqrt(moveDx * moveDx + moveDy * moveDy);

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

          let blocked = false;
          for (const other of rv.warriors.values()) {
            if (other === w || other.dead || other.hidden) continue;
            if (other.id > w.id) continue;
            if (isInActiveCombat(other)) continue;
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

        checkCombatCollision(w);
      } else {
        w.targetX = targetX;
        w.targetY = targetY;
        w.renderX = w.x;
        w.renderY = w.y;

        if (rv.attackState && !rv.attackState.lootClaimed) {
          rv.claimLoot();
        }

        for (const other of rv.warriors.values()) {
          if (other.dead || other.hidden) continue;
          if (!other.inAttack) continue;
          if (other.carryingLoot) continue;
          other.state = 'retreating';
        }
      }
    }

    function update(dt) {
      if (world.castleId === null) return;

      _combatFrame++;

      // Resolve-Phase: zuerst alle Kämpfe auswerten, die im letzten
      // Frame geendet haben. Danach erst normale Logik.
      if (_pendingResolutions.length > 0) {
        const toResolve = _pendingResolutions.slice();
        _pendingResolutions.length = 0;
        for (const p of toResolve) {
          resolveCombat(p.a, p.b);
        }
      }

      const dtSec = dt / 1000;

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

      for (const w of rv.warriors.values()) {
        if (w.dead) continue;
        if (!w.inAttack) continue;

        if (w.state === 'retreating' || w.carryingLoot) {
          updateRetreating(w, dtSec);
          continue;
        }

        if (w.state === 'marching_to_player') {
          updateAttacker(w, dtSec);
          continue;
        }
      }

      for (const w of rv.warriors.values()) {
        if (w.dead) continue;
        if (w.inAttack) continue;
        if (w.state === 'returning_to_house') {
          updateReturningToHouse(w, dtSec);
        }
      }
    }

    function reset() {
      _combatFrame = 0;
      _pendingResolutions.length = 0;
    }

    return { update, reset };
  }
};
window.Game = window.Game || {};

// ==========================================================
// Magier-Kampf
//
// Der Magier lebt im Magierturm (1 Slot). Sobald ein FLIEGENDER
// Drache das Territorium betritt:
//   1. Magier verlässt den Turm (state = 'mage_walking_to_target')
//   2. Läuft zum Drachen, bis Entfernung <= attackRange (5 Felder)
//   3. Wechselt in 'mage_attacking', wirft alle fireInterval ms
//      eine Frostkugel (weißer Pixel, wächst bis 0.25 Tile,
//      fliegt mit 3x Laufgeschwindigkeit)
//   4. Bei Treffer: 25 Schaden (= 25 Pfeiltreffer-Äquivalente)
//   5. Wenn Drache tot/weg/am Boden: zurück in den Turm
//      (state = 'mage_returning'), dann 'working'
//
// Drachen am Boden (grounded) werden IGNORIERT.
// ==========================================================
Game.MageCombat = {
  create(game, world, vm, renderer, audioManager) {

    // villagerId -> dragonId
    const mageTargets = new Map();

    // ==========================================================
    // Findet den nächsten FLIEGENDEN Drachen in Reichweite
    // des Magiers. Gibt { dragon, dist } oder null zurück.
    // ==========================================================
    function findNearestFlyingDragonInRange(mage, range) {
      const dm = game.dragonManager;
      if (!dm || !dm.dragons || dm.dragons.length === 0) return null;

      let best = null;
      let bestDistSq = range * range;

      for (const d of dm.dragons) {
        if (d.state !== 'flying' && d.state !== 'attacking') continue;
        const dx = d.x - mage.x;
        const dy = d.y - mage.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestDistSq) {
          bestDistSq = d2;
          best = d;
        }
      }
      return best ? { dragon: best, dist: Math.sqrt(bestDistSq) } : null;
    }

    // ==========================================================
    // Findet den nächsten fliegenden Drachen (egal wie weit weg),
    // damit der Magier loslaufen kann.
    // ==========================================================
    function findNearestFlyingDragon(mage) {
      const dm = game.dragonManager;
      if (!dm || !dm.dragons || dm.dragons.length === 0) return null;

      let best = null;
      let bestDistSq = Infinity;

      for (const d of dm.dragons) {
        if (d.state !== 'flying' && d.state !== 'attacking') continue;
        const dx = d.x - mage.x;
        const dy = d.y - mage.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestDistSq) {
          bestDistSq = d2;
          best = d;
        }
      }
      return best;
    }

    // ==========================================================
    // Prüft, ob ein fliegender Drache im Territorium ist.
    // ==========================================================
    function anyFlyingDragonInTerritory() {
      const dm = game.dragonManager;
      if (!dm || !dm.dragons) return false;

      for (const d of dm.dragons) {
        if (d.state !== 'flying' && d.state !== 'attacking') continue;
        if (world.isInTerritory(d.x, d.y)) return true;
      }
      return false;
    }

    // ==========================================================
    // Bewegung: Magier läuft ein Stück Richtung Ziel.
    // Gibt true zurück, wenn er angekommen ist (dist <= 0.1).
    // ==========================================================
    function moveMageToward(mage, tx, ty, dtSec) {
      const dx = tx - mage.x;
      const dy = ty - mage.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 0.01) return true;

      let speed = mage.speed;
      const step = Math.min(speed * dtSec, dist);
      mage.x += (dx / dist) * step;
      mage.y += (dy / dist) * step;
      mage.renderX = mage.x;
      mage.renderY = mage.y;
      mage.targetX = tx;
      mage.targetY = ty;

      return dist <= 0.1;
    }

    // ==========================================================
    // Frostkugel abfeuern.
    // ==========================================================
    function fireFrostbolt(mage, dragon) {
      if (!dragon) return;

      const startX = mage.renderX;
      const startY = mage.renderY;

      const onImpact = () => {
        if (!dragon || dragon.state === 'crashing' || dragon.state === 'grounded') return;
        if (!game.dragonManager || !game.dragonManager.dragons) return;
        if (!game.dragonManager.dragons.includes(dragon)) return;

        // 25 Schaden = 25 Pfeiltreffer
        dragon.hp = (dragon.hp || 0) + 25;

        if (audioManager) {
          audioManager.playOneShot('audio/explosion.mp3');
        }

        if (dragon.hp >= dragon.maxHp) {
          game.dragonManager._crash(dragon);
        }
      };

      if (renderer && typeof renderer.spawnFrostbolt === 'function') {
        renderer.spawnFrostbolt(startX, startY, dragon, onImpact);
      } else {
        // Fallback: sofortiger Treffer
        onImpact();
      }
    }

    // ==========================================================
    // Haupt-Update
    // ==========================================================
    function update(dt) {
      if (world.castleId === null) return;

      const dtSec = dt / 1000;
      const now = performance.now();

      for (const b of world.buildings.values()) {
        if (b.def.id !== 'magierturm') continue;
        if (!b.built || b.ruined || b.paused) continue;
        if (b.workerId === null) continue;

        const mage = vm.villagers.get(b.workerId);
        if (!mage) continue;
        if (mage.isSick) continue;

        // 1. Magier ist im Turm und wartet
        if (mage.state === 'working' || mage.state === 'idle') {
          if (anyFlyingDragonInTerritory()) {
            const target = findNearestFlyingDragon(mage);
            if (target) {
              mageTargets.set(mage.id, target.id);
              mage.state = 'mage_walking_to_target';
              mage.hidden = false;
              mage.asset = 'images/magier.webp';
              mage.x = b.x + (b.w || 1) / 2;
              mage.y = b.y + (b.h || 1) / 2;
              mage.renderX = mage.x;
              mage.renderY = mage.y;
            }
          }
          continue;
        }

        // 2. Magier läuft zum Drachen
        if (mage.state === 'mage_walking_to_target') {
          const target = findNearestFlyingDragon(mage);

          if (!target) {
            mage.state = 'mage_returning';
            mage.hidden = false;
            mageTargets.delete(mage.id);
            continue;
          }

          const inRange = findNearestFlyingDragonInRange(mage, b.def.attackRange || 5);
          if (inRange) {
            mage.state = 'mage_attacking';
            mage._mageNextShotAt = now;
            continue;
          }

          moveMageToward(mage, target.x, target.y, dtSec);
          continue;
        }

        // 3. Magier feuert
        if (mage.state === 'mage_attacking') {
          const inRange = findNearestFlyingDragonInRange(mage, b.def.attackRange || 5);

          if (!inRange) {
            mage.state = 'mage_walking_to_target';
            continue;
          }

          if (now >= (mage._mageNextShotAt || 0)) {
            mage._mageNextShotAt = now + (b.def.fireInterval || 5000);
            fireFrostbolt(mage, inRange.dragon);
          }
          continue;
        }

        // 4. Magier läuft zurück
        if (mage.state === 'mage_returning') {
          const homeX = b.x + (b.w || 1) / 2;
          const homeY = b.y + (b.h || 1) / 2;
          const arrived = moveMageToward(mage, homeX, homeY, dtSec);

          if (arrived) {
            mage.state = 'working';
            mage.hidden = true;
            mage.x = homeX;
            mage.y = homeY;
            mage.renderX = homeX;
            mage.renderY = homeY;
            mageTargets.delete(mage.id);
          }
          continue;
        }
      }
    }

    function reset() {
      mageTargets.clear();
    }

    return { update, reset };
  }
};
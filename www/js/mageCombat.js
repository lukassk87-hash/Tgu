window.Game = window.Game || {};

Game.MageCombat = {
  create(game, world, vm, renderer, audioManager) {

    const mageTargets = new Map();

    // ==========================================================
    // Findet den nächsten FLIEGENDEN Drachen INNERHALB des Territoriums
    // ==========================================================
    function findNearestFlyingDragonInRange(mage, range) {
      const dm = game.dragonManager;
      if (!dm || !dm.dragons || dm.dragons.length === 0) return null;

      let best = null;
      let bestDistSq = range * range;

      for (const d of dm.dragons) {
        if (d.state !== 'flying' && d.state !== 'attacking') continue;
        // NEU: Nur innerhalb des Territoriums
        if (!world.isInTerritory(d.x, d.y)) continue;

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
    // Findet den nächsten fliegenden Drachen (nur im Territorium)
    // ==========================================================
    function findNearestFlyingDragon(mage) {
      const dm = game.dragonManager;
      if (!dm || !dm.dragons || dm.dragons.length === 0) return null;

      let best = null;
      let bestDistSq = Infinity;

      for (const d of dm.dragons) {
        if (d.state !== 'flying' && d.state !== 'attacking') continue;
        // NEU: Nur innerhalb des Territoriums
        if (!world.isInTerritory(d.x, d.y)) continue;

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
    // Findet einen Zombie in Reichweite des Magiers (nur im Territorium)
    // ==========================================================
    function findZombieInRange(mage, range) {
      if (!game.zombieManager || !game.zombieManager.zombies) return null;
      
      let best = null;
      let bestDistSq = range * range;
      
      for (const z of game.zombieManager.zombies) {
        if (z.state === 'dead') continue;
        // NEU: Nur innerhalb des Territoriums
        if (!world.isInTerritory(z.x, z.y)) continue;

        const dx = z.x - mage.x;
        const dy = z.y - mage.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestDistSq) {
          bestDistSq = d2;
          best = z;
        }
      }
      return best ? { zombie: best, dist: Math.sqrt(bestDistSq) } : null;
    }

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
    // Bewegung: Magier läuft, aber NIEMALS aus dem Territorium
    // ==========================================================
    function moveMageToward(mage, tx, ty, dtSec) {
      const dx = tx - mage.x;
      const dy = ty - mage.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 0.01) return true;

      let speed = mage.speed;
      const step = Math.min(speed * dtSec, dist);
      
      const newX = mage.x + (dx / dist) * step;
      const newY = mage.y + (dy / dist) * step;

      // NEU: Nicht ins Ausland laufen
      if (!world.isInTerritory(newX, newY)) {
        mage.targetX = mage.x;
        mage.targetY = mage.y;
        return true; // Erreicht (an der Grenze gestoppt)
      }

      mage.x = newX;
      mage.y = newY;
      mage.renderX = mage.x;
      mage.renderY = mage.y;
      mage.targetX = tx;
      mage.targetY = ty;

      return dist <= 0.1;
    }

    function fireFrostbolt(mage, dragon) {
      if (!dragon) return;
      const startX = mage.renderX;
      const startY = mage.renderY;

      const onImpact = () => {
        if (!dragon || dragon.state === 'crashing' || dragon.state === 'grounded') return;
        if (!game.dragonManager || !game.dragonManager.dragons) return;
        if (!game.dragonManager.dragons.includes(dragon)) return;

        dragon.hp = (dragon.hp || 0) + 25;

        if (game.zombieManager && game.zombieManager.zombies) {
          const impactX = Math.floor(dragon.x);
          const impactY = Math.floor(dragon.y);
          for (const z of game.zombieManager.zombies) {
            if (z.state === 'dead') continue;
            const zx = Math.floor(z.x);
            const zy = Math.floor(z.y);
            if (Math.abs(zx - impactX) <= 10 && Math.abs(zy - impactY) <= 10) {
              z.state = 'dead';
              if (game.zombieManager.onZombieKilled) {
                game.zombieManager.onZombieKilled(z);
              }
            }
          }
        }

        if (audioManager) audioManager.playOneShot('audio/explosion.mp3');
        if (dragon.hp >= dragon.maxHp) game.dragonManager._crash(dragon);
      };

      if (renderer && typeof renderer.spawnFrostbolt === 'function') {
        renderer.spawnFrostbolt(startX, startY, dragon, onImpact);
      } else {
        onImpact();
      }
    }

    function fireFrostboltAtZombie(mage, zombie) {
      if (!zombie) return;
      const startX = mage.renderX;
      const startY = mage.renderY;
      const targetX = zombie.x;
      const targetY = zombie.y;

      const onImpact = () => {
        if (!zombie || zombie.state === 'dead') return;
        zombie.state = 'dead';
        if (game.zombieManager && game.zombieManager.onZombieKilled) {
          game.zombieManager.onZombieKilled(zombie);
        }
        
        if (game.zombieManager && game.zombieManager.zombies) {
          const impactX = Math.floor(targetX);
          const impactY = Math.floor(targetY);
          for (const z of game.zombieManager.zombies) {
            if (z.state === 'dead' || z === zombie) continue;
            const zx = Math.floor(z.x);
            const zy = Math.floor(z.y);
            if (Math.abs(zx - impactX) <= 10 && Math.abs(zy - impactY) <= 10) {
              z.state = 'dead';
              if (game.zombieManager.onZombieKilled) {
                game.zombieManager.onZombieKilled(z);
              }
            }
          }
        }

        if (audioManager) audioManager.playOneShot('audio/explosion.mp3');
      };

      if (renderer && typeof renderer.spawnFrostbolt === 'function') {
        renderer.spawnFrostbolt(startX, startY, { x: targetX, y: targetY, state: 'flying', maxHp: 1, hp: 0 }, onImpact);
      } else {
        onImpact();
      }
    }

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

        const attackRange = b.def.attackRange || 5;

        // 1. Warten (im Turm)
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

        // 2. Läuft zum Drachen (nur im Territorium)
        if (mage.state === 'mage_walking_to_target') {
          const zombieInRange = findZombieInRange(mage, attackRange);
          if (zombieInRange) {
            if (now >= (mage._mageNextShotAt || 0)) {
              mage._mageNextShotAt = now + (b.def.fireInterval || 5000);
              fireFrostboltAtZombie(mage, zombieInRange.zombie);
            }
            continue;
          }

          const target = findNearestFlyingDragon(mage);
          if (!target) {
            mage.state = 'mage_returning';
            mage.hidden = false;
            mageTargets.delete(mage.id);
            continue;
          }

          const inRange = findNearestFlyingDragonInRange(mage, attackRange);
          if (inRange) {
            mage.state = 'mage_attacking';
            mage._mageNextShotAt = now;
            continue;
          }

          moveMageToward(mage, target.x, target.y, dtSec);
          continue;
        }

        // 3. Feuert auf Drachen (aber checkt Zombies)
        if (mage.state === 'mage_attacking') {
          const zombieInRange = findZombieInRange(mage, attackRange);
          if (zombieInRange) {
            if (now >= (mage._mageNextShotAt || 0)) {
              mage._mageNextShotAt = now + (b.def.fireInterval || 5000);
              fireFrostboltAtZombie(mage, zombieInRange.zombie);
            }
            continue;
          }

          const inRange = findNearestFlyingDragonInRange(mage, attackRange);
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

        // 4. Läuft zurück
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
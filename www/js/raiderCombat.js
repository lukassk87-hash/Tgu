window.Game = window.Game || {};

Game.RaiderCombat = {
  create(game, world, vm, raiderVillage, renderer, audioManager) {
    if (!raiderVillage) {
      return { update() {} };
    }

    const rv = raiderVillage;

    if (rv.alarmActive === undefined) rv.alarmActive = false;

    let alarmCheckCooldown = 0;
    let playerRaidActive = false;

    function findDragon() {
      const dm = game.dragonManager;
      if (!dm) return null;
      const d = dm.dragon;
      if (!d) return null;
      if (d.state !== 'grounded') return null;
      return d;
    }

    function findNearestDropoff(rx, ry) {
      let best = null;
      let bestDistSq = Infinity;
      for (const b of world.dropoffBuildings) {
        const targetX = b.x + (b.w || 1) / 2;
        const targetY = b.y + (b.h || 1);
        const dx = targetX - rx;
        const dy = targetY - ry;
        const distSq = dx * dx + dy * dy;
        if (distSq < bestDistSq) {
          bestDistSq = distSq;
          best = { x: targetX, y: targetY, targetTileY: b.y + (b.h || 1), minX: b.x, maxX: b.x + (b.w || 1), minY: b.y };
        }
      }
      return best;
    }

    function findNearestPlayerWarrior(rx, ry, maxDist) {
      const grid = game.spatialGrid;
      if (grid) {
        return grid.findNearest(rx, ry, maxDist, 'warrior', (v) => v.state !== 'returning_to_post');
      }

      const maxD2 = maxDist * maxDist;
      let best = null;
      let bestD2 = maxD2;

      const nearby = vm.getNearbyWarriors(rx, ry);
      for (const v of nearby) {
        if (v.state === 'returning_to_post') continue;
        const dx = v.x - rx;
        const dy = v.y - ry;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestD2) {
          bestD2 = d2;
          best = v;
        }
      }
      return best;
    }

    function findNearestRaiderToChase(px, py) {
      let best = null;
      let bestD2 = Infinity;
      
      for (const w of rv.warriors.values()) {
        if (w.dead) continue;
        if (!rv.isInRaiderTerritory(w.x, w.y)) continue;
        
        const dx = w.x - px;
        const dy = w.y - py;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestD2) {
          bestD2 = d2;
          best = w;
        }
      }
      return best;
    }

    function findAnyRaiderToChase() {
      let best = null;
      
      for (const w of rv.warriors.values()) {
        if (w.dead) continue;
        if (!rv.isInRaiderTerritory(w.x, w.y)) continue;
        
        if (!best || w.id < best.id) {
          best = w;
        }
      }
      return best;
    }

    function findNearestRaiderInPlayerTerritory(px, py, maxDist) {
      const maxD2 = maxDist * maxDist;
      let best = null;
      let bestD2 = maxD2;
      
      for (const w of rv.warriors.values()) {
        if (w.dead || w.hidden) continue;
        if (!world.isInTerritory(w.x, w.y)) continue;
        
        const dx = w.x - px;
        const dy = w.y - py;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestD2) {
          bestD2 = d2;
          best = w;
        }
      }
      return best;
    }

    /**
     * ⚠️ DEAKTIVIERT: Kein Sofort-Einsteigen mehr.
     * Krieger läuft immer sichtbar über startReturnToPost zurück und
     * kommt erst über onArrive im Turm an. Verhindert den "Beamer".
     */
    function tryReturnToOwnSlot(v) {
      return false;
    }

    function startReturnToPost(v) {
      const post = v.warriorBuildingId ? world.buildings.get(v.warriorBuildingId) : null;
      if (!post) {
        v.state = 'returning_to_post';
        return;
      }
      
      v.task = 'returning_to_post';
      v.state = 'moving';
      vm.startMove(v, post.x, post.y + (post.h || 1) - 1);
      v.hidden = false;
      v.asset = 'images/villager-krieger-rot.webp';
    }

    function checkTerritoryAlarm() {
      if (alarmCheckCooldown > 0) {
        alarmCheckCooldown--;
        return;
      }
      alarmCheckCooldown = 3;

      let intruderFound = false;
      const grid = game.spatialGrid;
      
      if (grid && rv._centerCache) {
        const centerX = rv._centerCache.x;
        const centerY = rv._centerCache.y;
        const radius = Math.max(rv.bounds.maxX - rv.bounds.minX, rv.bounds.maxY - rv.bounds.minY) / 2 + 10;
        
        const candidates = grid.queryByType(centerX, centerY, radius, 'warrior');
        for (const v of candidates) {
          if (v.state === 'vdefend' || v.state === 'vfightback' || v.state === 'dragon_attack') {
            if (rv.isInRaiderTerritory(v.x, v.y)) {
              intruderFound = true;
              break;
            }
          }
        }
      } else {
        for (const v of vm.villagers.values()) {
          if (v.job !== 'warrior' || v.hidden) continue;
          if (v.state === 'vdefend' || v.state === 'vfightback' || v.state === 'dragon_attack') {
            if (rv.isInRaiderTerritory(v.x, v.y)) {
              intruderFound = true;
              break;
            }
          }
        }
      }

      if (intruderFound && !rv.alarmActive) {
        rv.alarmActive = true;
        for (const w of rv.warriors.values()) {
          if (w.dead) continue;
          if (w.hidden && w.state === 'idle') {
            w.hidden = false;
            w.state = 'idle';
            w.inAttack = false;
          }
        }
      } else if (!intruderFound && rv.alarmActive) {
        rv.alarmActive = false;
      }
    }

    function anyWarriorInRaid() {
      for (const v of vm.villagers.values()) {
        if (v.job !== 'warrior') continue;
        if (v.state === 'vfightback') return true;
      }
      return false;
    }

    function update(dt) {
      const dtSec = dt / 1000;
      const grid = game.spatialGrid;

      if (world.castleId === null) return;

      const raidActiveNow = anyWarriorInRaid();
      
      if (raidActiveNow && !playerRaidActive) {
        playerRaidActive = true;
        rv.freezeAttackTimer();
      } else if (!raidActiveNow && playerRaidActive) {
        playerRaidActive = false;
        rv.unfreezeAttackTimer();
      }

      if (rv.isDestroyed) {
        for (const v of vm.villagers.values()) {
          if (v.job !== 'warrior') continue;
          
          if (v.state === 'vdefend' || v.state === 'vfightback' || v.state === 'attacking_raiders') {
            startReturnToPost(v);
          }
        }
        return;
      }

      checkTerritoryAlarm();

      const dragon = findDragon();
      const allWarriors = vm.getAllVillagers();

      let anyRaiderOutsideBase = false;
      let anyRaiderInPlayerTerritory = false;

      for (const w of rv.warriors.values()) {
        if (w.dead || w.hidden) continue;
        if (!rv.isInRaiderTerritory(w.x, w.y)) {
          anyRaiderOutsideBase = true;
          if (world.isInTerritory(w.x, w.y)) {
            anyRaiderInPlayerTerritory = true;
          }
        }
      }

      const myWarriors = [];
      for (const v of allWarriors) {
        if (v.job === 'warrior' && vm.villagers.has(v.id)) {
          myWarriors.push(v);
        }
      }

      // ==========================================================
      // 1) Räuber-Bogenschützen
      // ==========================================================
      for (const b of rv.towers) {
        if (b.isDestroyed || b.isBurning) continue;
        
        let anyEnemyInTerritory = false;
        if (grid) {
          const candidates = grid.queryByType(b.x, b.y, b.def.attackRange + 5, 'warrior');
          for (const v of candidates) {
            if (v.state === 'returning_to_post' || v.state === 'dragon_attack') continue;
            if (rv.isInRaiderTerritory(v.x, v.y)) {
              anyEnemyInTerritory = true;
              break;
            }
          }
        }
        
        if (!anyEnemyInTerritory) {
          b.arrowTowerCooldown = 0;
          continue;
        }

        b.arrowTowerCooldown = (b.arrowTowerCooldown || 0) - dt;
        if (b.arrowTowerCooldown > 0) continue;

        const range = b.def.attackRange || 10;
        const rangeSq = range * range;
        const bx = b.x + (b.w || 1) / 2;
        const by = b.y + (b.h || 1) / 2;

        let target = null;
        let bestDistSq = rangeSq;

        if (grid) {
          const candidates = grid.queryByType(bx, by, range, 'warrior');
          for (const v of candidates) {
            if (v.state === 'returning_to_post') continue;
            if (v.state === 'dragon_attack') continue;
            if (!rv.isInRaiderTerritory(v.x, v.y)) continue;
            const dx = v.x - bx;
            const dy = v.y - by;
            const d2 = dx * dx + dy * dy;
            if (d2 < bestDistSq) {
              bestDistSq = d2;
              target = v;
            }
          }
        } else {
          for (const v of myWarriors) {
            if (v.state === 'returning_to_post') continue;
            if (v.state === 'dragon_attack') continue;
            if (!rv.isInRaiderTerritory(v.x, v.y)) continue;
            const dx = v.x - bx;
            const dy = v.y - by;
            const d2 = dx * dx + dy * dy;
            if (d2 < bestDistSq) {
              bestDistSq = d2;
              target = v;
            }
          }
        }

        if (!target) continue;

        const dist = Math.sqrt(bestDistSq);
        const hitChanceBase = b.def.hitChanceBase ?? 1.00;
        const hitChancePerTile = b.def.hitChancePerTile ?? 0.10;
        const hitChanceMin = b.def.hitChanceMin ?? 0.10;
        const hitChance = Math.max(hitChanceMin, hitChanceBase - dist * hitChancePerTile);
        const didHit = Math.random() < hitChance;

        if (renderer && typeof renderer.spawnArrow === 'function') {
          const targetSnapshot = target;
          const onImpact = () => {
            if (!didHit) return;
            if (!vm.villagers.has(targetSnapshot.id)) return;
            vm.killVillager(targetSnapshot);
            if (audioManager) audioManager.playOneShot('audio/schrei.mp3');
          };
          renderer.spawnArrow(bx, by, target.x, target.y, didHit, onImpact);
        } else {
          if (didHit) {
            vm.killVillager(target);
            if (audioManager) audioManager.playOneShot('audio/schrei.mp3');
          }
        }

        b.arrowTowerCooldown = b.def.fireInterval || 1000;
      }

      // ==========================================================
      // 2) Räuber-Krieger
      // ==========================================================
      for (const w of rv.warriors.values()) {
        if (w.dead) continue;

        if (w.state === 'returning_to_house' && !w.inAttack) {
          const home = rv.buildings.find(b => b.id === w.homeBuildingId);
          if (home && !home.isDestroyed && !home.isBurning) {
            const hx = home.x + (home.w || 1) / 2;
            const hy = home.y + (home.h || 1) / 2;
            const dx = hx - w.x;
            const dy = hy - w.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= 0.5) {
              w.x = hx;
              w.y = hy;
              w.renderX = w.x;
              w.renderY = w.y;
              w.state = 'idle';
              w.hidden = true;
              continue;
            }

            const step = Math.min(rv.WARRIOR_SPEED * dtSec, dist);
            w.x += (dx / dist) * step;
            w.y += (dy / dist) * step;
            w.renderX = w.x;
            w.renderY = w.y;
            w.hidden = false;
            continue;
          }
        }

        let enemy = null;
        if (rv.alarmActive) {
          enemy = findNearestPlayerWarrior(w.x, w.y, 100);
        } else {
          enemy = findNearestPlayerWarrior(w.x, w.y, 10);
        }

        if (enemy && enemy.state !== 'dragon_attack' && rv.isInRaiderTerritory(enemy.x, enemy.y)) {
          w.hidden = false;
          w.inAttack = false;
          w.state = 'fighting';

          const distSq = (enemy.x - w.x) ** 2 + (enemy.y - w.y) ** 2;
          if (distSq <= 1.0) {
            if (Math.random() < 0.60) {
              rv.markWarriorDead(w.id);
              renderer.spawnHarvestParticles(Math.floor(w.x), Math.floor(w.y), 'stone');
            } else {
              vm.killVillager(enemy);
              if (audioManager) audioManager.playOneShot('audio/schrei.mp3');
            }
          } else {
            const dx = enemy.x - w.x, dy = enemy.y - w.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const step = Math.min(rv.WARRIOR_SPEED * dtSec, dist);
            const newX = w.x + (dx / dist) * step;
            const newY = w.y + (dy / dist) * step;

            let blocked = false;
            for (const other of rv.warriors.values()) {
              if (other === w || other.dead || other.hidden) continue;
              if (other.id > w.id) continue;
              const ox = newX - other.x, oy = newY - other.y;
              if (ox * ox + oy * oy < 0.64) { blocked = true; break; }
            }
            if (!blocked) { w.x = newX; w.y = newY; }
          }
          w.renderX = w.x;
          w.renderY = w.y;
          continue;
        }

        if (w.state === 'fighting' && !w.inAttack) {
          w.state = 'returning_to_house';
          w.hidden = false;
          continue;
        }

        if (w.hidden) continue;

        if (w.inAttack) {
          let targetX, targetY, targetDropoff = null;
          let isRetreating = w.carryingLoot || w.state === 'retreating';

          if (!isRetreating) {
            const playerW = findNearestPlayerWarrior(w.x, w.y, 0.5);
            if (playerW && playerW.state !== 'dragon_attack') {
              targetX = playerW.x;
              targetY = playerW.y;
            }
          }

          if (targetX === undefined) {
            if (isRetreating) {
              const home = rv.getCenter();
              targetX = home.x;
              targetY = home.y;
            } else {
              const dropoff = findNearestDropoff(w.x, w.y);
              if (dropoff) {
                targetX = dropoff.x;
                targetY = dropoff.y;
                targetDropoff = dropoff;
              } else {
                const castle = world.buildings.get(world.castleId);
                targetX = castle.x + (castle.w || 1) / 2;
                targetY = castle.y + (castle.h || 1) + 1;
                targetDropoff = { targetTileY: castle.y + (castle.h || 1) + 1, minX: castle.x, maxX: castle.x + (castle.w || 1), minY: castle.y };
              }
            }
          }

          const moveDx = targetX - w.x, moveDy = targetY - w.y;
          const moveDist = Math.sqrt(moveDx * moveDx + moveDy * moveDy);

          let hasReachedTarget = false;
          if (targetDropoff) {
            if (w.x >= targetDropoff.minX && w.x <= targetDropoff.maxX &&
                w.y >= targetDropoff.targetTileY - 0.5 && w.y <= targetDropoff.targetTileY + 0.5) {
              hasReachedTarget = true;
            }
          } else if (moveDist <= 1.0) {
            hasReachedTarget = true;
          }

          if (!hasReachedTarget) {
            const step = Math.min(rv.WARRIOR_SPEED * dtSec, moveDist);
            const newX = w.x + (moveDx / moveDist) * step;
            const newY = w.y + (moveDy / moveDist) * step;

            let blocked = false;
            for (const other of rv.warriors.values()) {
              if (other === w || other.dead || other.hidden) continue;
              if (other.id > w.id) continue;
              const ox = newX - other.x, oy = newY - other.y;
              if (ox * ox + oy * oy < 0.64) { blocked = true; break; }
            }
            if (!blocked) { w.x = newX; w.y = newY; }
          }

          if (!isRetreating && hasReachedTarget) {
            if (rv.attackState && !rv.attackState.lootClaimed) rv.claimLoot();
            for (const other of rv.warriors.values()) {
              if (other.dead || other.hidden || !other.inAttack || other.carryingLoot) continue;
              other.state = 'retreating';
            }
          }

          if (isRetreating && rv.isInRaiderTerritory(w.x, w.y)) {
            w.inAttack = false;
            w.state = 'returning_to_house';
          }
          w.renderX = w.x;
          w.renderY = w.y;
        }
      }

      // ==========================================================
      // 3) Spielerkrieger
      // ==========================================================
      for (const v of myWarriors) {

        // ⚠️ NEU: Krieger auf dem Rückweg nicht in Kampf-Logik eingreifen
        if (v.state === 'moving' && v.task === 'returning_to_post') {
          v.hidden = false;
          v.asset = 'images/villager-krieger-rot.webp';
          continue;
        }

        if (v.state === 'dragon_attack') {
          continue;
        }

        if (v.state === 'vdefend') {
          if (!anyRaiderInPlayerTerritory) {
            startReturnToPost(v);
            continue;
          }

          const raider = findNearestRaiderInPlayerTerritory(v.x, v.y, 30);

          if (!raider) {
            startReturnToPost(v);
            continue;
          }

          const distSq = (raider.x - v.x) ** 2 + (raider.y - v.y) ** 2;
          if (distSq <= 1.0) {
            if (Math.random() < 0.60) {
              rv.markWarriorDead(raider.id);
              renderer.spawnHarvestParticles(Math.floor(raider.x), Math.floor(raider.y), 'stone');
            } else {
              vm.killVillager(v);
              if (audioManager) audioManager.playOneShot('audio/schrei.mp3');
            }
          } else {
            const dx = raider.x - v.x, dy = raider.y - v.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const step = Math.min(v.speed * dtSec, dist);
            const newX = v.x + (dx / dist) * step;
            const newY = v.y + (dy / dist) * step;

            if (world.isInTerritory(newX, newY)) {
              let blocked = false;
              if (grid) {
                const nearbyWarriors = grid.queryByType(newX, newY, 1, 'warrior');
                for (const other of nearbyWarriors) {
                  if (other === v || other.hidden) continue;
                  if (other.id > v.id) continue;
                  const ox = newX - other.x, oy = newY - other.y;
                  if (ox * ox + oy * oy < 0.64) { blocked = true; break; }
                }
              }
              if (!blocked) { v.x = newX; v.y = newY; }
            }
          }
          v.renderX = v.x;
          v.renderY = v.y;
          continue;
        }

        if (v.state === 'vfightback') {
          const center = rv.getCenter();
          const raider = findNearestRaiderToChase(v.x, v.y) || findAnyRaiderToChase();

          if (raider) {
            const distSq = (raider.x - v.x) ** 2 + (raider.y - v.y) ** 2;
            if (distSq <= 1.0) {
              if (Math.random() < 0.60) {
                rv.markWarriorDead(raider.id);
                renderer.spawnHarvestParticles(Math.floor(raider.x), Math.floor(raider.y), 'stone');
              } else {
                vm.killVillager(v);
                if (audioManager) audioManager.playOneShot('audio/schrei.mp3');
              }
            } else {
              const dx = raider.x - v.x, dy = raider.y - v.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const step = Math.min(v.speed * dtSec, dist);
              const newX = v.x + (dx / dist) * step;
              const newY = v.y + (dy / dist) * step;

              let blocked = false;
              if (grid) {
                const nearbyWarriors = grid.queryByType(newX, newY, 1, 'warrior');
                for (const other of nearbyWarriors) {
                  if (other === v || other.hidden) continue;
                  if (other.id > v.id) continue;
                  const ox = newX - other.x, oy = newY - other.y;
                  if (ox * ox + oy * oy < 0.64) { blocked = true; break; }
                }
              } else {
                for (const other of myWarriors) {
                  if (other === v || other.hidden || other.id > v.id) continue;
                  const ox = newX - other.x, oy = newY - other.y;
                  if (ox * ox + oy * oy < 0.64) { blocked = true; break; }
                }
              }
              if (!blocked) { v.x = newX; v.y = newY; }
            }
            v.renderX = v.x;
            v.renderY = v.y;
          } else {
            startReturnToPost(v);
          }
          continue;
        }

        if (v.state === 'working') {
          if (dragon) {
            v.state = 'dragon_attack';
            continue;
          }

          if (anyRaiderInPlayerTerritory) {
            v.state = 'vdefend';
          }
          continue;
        }
      }
    }

    return { update };
  }
};
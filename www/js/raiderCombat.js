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
      if (!dm.dragons || dm.dragons.length === 0) return null;
      for (const d of dm.dragons) {
        if (d.state === 'grounded') return d;
      }
      return null;
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

    // Findet einen Krieger im Räuber-Territorium (OHNE Grid, wie gewünscht)
    function findWarriorInRaiderTerritory() {
      for (const v of vm.villagers.values()) {
        if (v.job !== 'warrior') continue;
        if (v.hidden || v.state === 'returning_to_post' || v.state === 'dragon_attack') continue;
        if (rv.isInRaiderTerritory(v.x, v.y)) {
          return v;
        }
      }
      return null;
    }

    // Findet den nächsten Krieger in der Nähe (nur für den Kampf, wenn Räuber im Spielergebiet sind)
    function findNearestPlayerWarrior(rx, ry, maxDist) {
      const grid = game.spatialGrid;
      if (grid) {
        return grid.findNearest(rx, ry, maxDist, 'warrior', (v) => v.state !== 'returning_to_post');
      }
      // Fallback (sollte nicht passieren)
      const maxD2 = maxDist * maxDist;
      let best = null, bestD2 = maxD2;
      for (const v of vm.villagers.values()) {
        if (v.job !== 'warrior' || v.state === 'returning_to_post') continue;
        const dx = v.x - rx, dy = v.y - ry;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestD2) { bestD2 = d2; best = v; }
      }
      return best;
    }

    // Slot-Sicherung: Wird aufgerufen, bevor der Krieger zurückläuft.
    function tryRestoreSlot(v) {
      if (!v.warriorBuildingId) return;
      const post = world.buildings.get(v.warriorBuildingId);
      if (!post || !post.built || post.ruined || !post.warriorSlots) return;
      
      if (v.warriorSlotIndex >= 0) {
        if (post.warriorSlots[v.warriorSlotIndex] === null) {
          post.warriorSlots[v.warriorSlotIndex] = v.id;
          return;
        } else if (post.warriorSlots[v.warriorSlotIndex] === v.id) {
          return;
        }
      }
      
      for (let i = 0; i < post.warriorSlots.length; i++) {
        if (post.warriorSlots[i] === null) {
          post.warriorSlots[i] = v.id;
          v.warriorSlotIndex = i;
          return;
        }
      }
    }

    function startReturnToPost(v) {
      tryRestoreSlot(v); 
      v.hidden = false;
      v.task = 'returning_to_post';
      
      if (vm && typeof vm.startReturnToPost === 'function') {
        vm.startReturnToPost(v);
        return;
      }
      v.state = 'idle';
    }

    function checkTerritoryAlarm() {
      if (alarmCheckCooldown > 0) {
        alarmCheckCooldown--;
        return;
      }
      alarmCheckCooldown = 3;

      // Wenn EIN Krieger im Räubergebiet ist, wird Alarm ausgelöst
      const intruder = findWarriorInRaiderTerritory();
      
      if (intruder && !rv.alarmActive) {
        rv.alarmActive = true;
        for (const w of rv.warriors.values()) {
          if (w.dead) continue;
          if (w.hidden && w.state === 'idle') {
            w.hidden = false;
            w.state = 'idle';
            w.inAttack = false;
            // Räuber im Lager greifen sofort an
            w.cachedTargetX = intruder.x;
            w.cachedTargetY = intruder.y;
          }
        }
      } else if (!intruder && rv.alarmActive) {
        rv.alarmActive = false;
        // Wenn der Alarm vorbei ist, löschen wir die gecachten Ziele, damit sie neu suchen
        for (const w of rv.warriors.values()) {
          w.cachedTargetX = null;
          w.cachedTargetY = null;
        }
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

      let anyRaiderInPlayerTerritory = false;

      for (const w of rv.warriors.values()) {
        if (w.dead || w.hidden) continue;
        if (world.isInTerritory(w.x, w.y)) {
          anyRaiderInPlayerTerritory = true;
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
        
        // Bogenschützen schießen nur auf Krieger, die im Räubergebiet sind
        let target = null;
        for (const v of myWarriors) {
          if (v.state === 'returning_to_post' || v.state === 'dragon_attack') continue;
          if (rv.isInRaiderTerritory(v.x, v.y)) {
            target = v;
            break; 
          }
        }
        
        if (!target) {
          b.arrowTowerCooldown = 0;
          continue;
        }

        b.arrowTowerCooldown = (b.arrowTowerCooldown || 0) - dt;
        if (b.arrowTowerCooldown > 0) continue;

        const range = b.def.attackRange || 10;
        const bx = b.x + (b.w || 1) / 2;
        const by = b.y + (b.h || 1) / 2;
        const dist = Math.sqrt((target.x - bx) ** 2 + (target.y - by) ** 2);
        
        if (dist > range) continue;

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
      // 2) Räuber-Krieger (Angreifer)
      // ==========================================================
      for (const w of rv.warriors.values()) {
        if (w.dead) continue;

        if (w.state === 'returning_to_house' && !w.inAttack) {
          const home = rv.buildings.find(b => b.id === w.homeBuildingId);
          if (home && !home.isDestroyed && !home.isBurning) {
            const hx = home.x + (home.w || 1) / 2;
            const hy = home.y + (home.h || 1) / 2;
            const dx = hx - w.x, dy = hy - w.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= 0.5) {
              w.x = hx; w.y = hy; w.targetX = hx; w.targetY = hy;
              w.renderX = w.x; w.renderY = w.y;
              w.state = 'idle'; w.hidden = true;
              continue;
            }

            const step = Math.min(rv.WARRIOR_SPEED * dtSec, dist);
            w.x += (dx / dist) * step; w.y += (dy / dist) * step;
            w.targetX = hx; w.targetY = hy;
            w.renderX = w.x; w.renderY = w.y;
            w.hidden = false;
            continue;
          }
        }

        if (w.inAttack) {
          let isRetreating = w.carryingLoot || w.state === 'retreating';

          // 1. Ziel cachen, wenn noch nicht geschehen
          if (!w.cachedTargetX && !isRetreating) {
            const dropoff = findNearestDropoff(w.x, w.y);
            if (dropoff) {
              w.cachedTargetX = dropoff.x;
              w.cachedTargetY = dropoff.y;
              w.cachedTargetDropoff = dropoff;
            } else {
              const castle = world.buildings.get(world.castleId);
              w.cachedTargetX = castle.x + (castle.w || 1) / 2;
              w.cachedTargetY = castle.y + (castle.h || 1) + 1;
              w.cachedTargetDropoff = { targetTileY: castle.y + (castle.h || 1) + 1, minX: castle.x, maxX: castle.x + (castle.w || 1), minY: castle.y };
            }
          }

          let targetX = w.cachedTargetX;
          let targetY = w.cachedTargetY;
          let targetDropoff = w.cachedTargetDropoff;

          if (isRetreating) {
            const home = rv.getCenter();
            targetX = home.x; targetY = home.y;
            targetDropoff = null;
          } else {
            // Nur im SPIELER-Territorium nach Kriegern suchen
            if (world.isInTerritory(w.x, w.y)) {
              const playerW = findNearestPlayerWarrior(w.x, w.y, 1.5);
              if (playerW && playerW.state !== 'dragon_attack') {
                targetX = playerW.x;
                targetY = playerW.y;
                targetDropoff = null; // Kämpfen hat Vorrang
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

          if (!hasReachedTarget && moveDist > 0.001) {
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

          w.targetX = targetX;
          w.targetY = targetY;

          if (!isRetreating && hasReachedTarget && targetDropoff) {
            if (rv.attackState && !rv.attackState.lootClaimed) rv.claimLoot();
            for (const other of rv.warriors.values()) {
              if (other.dead || other.hidden || !other.inAttack || other.carryingLoot) continue;
              other.state = 'retreating';
              other.cachedTargetX = null; // Ziel löschen für Rückzug
              other.cachedTargetY = null;
            }
          }

          if (isRetreating && rv.isInRaiderTerritory(w.x, w.y)) {
            w.inAttack = false;
            w.state = 'returning_to_house';
            w.cachedTargetX = null;
            w.cachedTargetY = null;
          }
          w.renderX = w.x;
          w.renderY = w.y;
          continue;
        }
      }

      // ==========================================================
      // 3) Spielerkrieger (Verteidiger)
      // ==========================================================
      for (const v of myWarriors) {

        if (v.state === 'moving' && v.task === 'returning_to_post') {
          v.hidden = false;
          v.asset = 'images/villager-krieger-rot.webp';
          continue;
        }

        if (v.state === 'dragon_attack') continue;

        // 3a) Räuber im Spieler-Territorium
        if (v.state === 'vdefend' || anyRaiderInPlayerTerritory) {
          
          if (!anyRaiderInPlayerTerritory) {
            startReturnToPost(v);
            continue;
          }

          // Suche nächsten Räuber im Spieler-Territorium (mit Grid für Performance)
          const maxD2 = 50 * 50;
          let best = null;
          let bestD2 = maxD2;
          for (const w of rv.warriors.values()) {
            if (w.dead || w.hidden) continue;
            if (!world.isInTerritory(w.x, w.y)) continue;
            const dx = w.x - v.x, dy = w.y - v.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < bestD2) { bestD2 = d2; best = w; }
          }

          if (!best) {
            startReturnToPost(v);
            continue;
          }

          v.hidden = false;
          v.state = 'vdefend';
          v.task = null;

          const distSq = (best.x - v.x) ** 2 + (best.y - v.y) ** 2;
          
          if (distSq <= 1.0) {
            if (Math.random() < 0.60) {
              rv.markWarriorDead(best.id);
              renderer.spawnHarvestParticles(Math.floor(best.x), Math.floor(best.y), 'stone');
            } else {
              vm.killVillager(v);
              if (audioManager) audioManager.playOneShot('audio/schrei.mp3');
            }
          } else {
            const dx = best.x - v.x, dy = best.y - v.y;
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
            v.targetX = best.x; v.targetY = best.y;
          }
          v.renderX = v.x; v.renderY = v.y;
          continue;
        }

        // 3b) Gegenangriff (Spieler hat Räuber-Territorium betreten)
        if (v.state === 'vfightback') {
          let best = null;
          let bestD2 = Infinity;
          
          // Suche im Räuber-Territorium
          for (const w of rv.warriors.values()) {
            if (w.dead) continue;
            if (!rv.isInRaiderTerritory(w.x, w.y)) continue;
            const dx = w.x - v.x, dy = w.y - v.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < bestD2) { bestD2 = d2; best = w; }
          }

          if (best) {
            v.hidden = false;
            v.task = null;

            const distSq = (best.x - v.x) ** 2 + (best.y - v.y) ** 2;
            if (distSq <= 1.0) {
              if (Math.random() < 0.60) {
                rv.markWarriorDead(best.id);
                renderer.spawnHarvestParticles(Math.floor(best.x), Math.floor(best.y), 'stone');
              } else {
                vm.killVillager(v);
                if (audioManager) audioManager.playOneShot('audio/schrei.mp3');
              }
            } else {
              const dx = best.x - v.x, dy = best.y - v.y;
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
              }
              if (!blocked) { v.x = newX; v.y = newY; }
            }
            v.targetX = best.x; v.targetY = best.y;
            v.renderX = v.x; v.renderY = v.y;
          } else {
            startReturnToPost(v);
          }
          continue;
        }

        // 3c) Normaler Zustand (im Turm)
        if (v.state === 'working') {
          if (dragon) {
            v.state = 'dragon_attack';
            v.hidden = false;
            continue;
          }

          if (anyRaiderInPlayerTerritory) {
            v.state = 'vdefend';
            v.hidden = false;
            v.task = null;
          }
          continue;
        }
      }
    }

    return { update };
  }
};
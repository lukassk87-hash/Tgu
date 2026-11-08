window.Game = window.Game || {};

Game.ZombieCombat = {
  create(game, world, vm, zombieManager, renderer, audioManager) {
    if (!zombieManager) {
      return { update() {} };
    }

    function findDragon() {
      const dm = game.dragonManager;
      if (!dm) return null;
      const d = dm.dragon;
      if (!d) return null;
      if (d.state !== 'grounded') return null;
      return d;
    }

    // ⚠️ NEU (übernommen aus raiderCombat.js): Prüft, ob der Krieger schon
    // nah genug an seinem Posten ist, um direkt wieder einzusteigen.
    function tryReturnToOwnSlot(v) {
      if (!v.warriorBuildingId || v.warriorSlotIndex < 0) return false;

      const post = world.buildings.get(v.warriorBuildingId);
      if (!post || !post.built || post.ruined) return false;
      if (!post.warriorSlots) return false;

      const postX = post.x + (post.w || 1) / 2;
      const postY = post.y + (post.h || 1) / 2;
      const dx = postX - v.x;
      const dy = postY - v.y;
      const distSq = dx * dx + dy * dy;

      // Nur wenn schon NAH am Posten: direkt einsteigen
      if (distSq > 2.25) return false;

      if (post.warriorSlots[v.warriorSlotIndex] === v.id) return true;
      if (post.warriorSlots[v.warriorSlotIndex] === null) {
        post.warriorSlots[v.warriorSlotIndex] = v.id;
        return true;
      }
      return false;
    }

    // ⚠️ NEU (übernommen aus raiderCombat.js): Schickt den Krieger mit dem
    // normalen Bewegungs-System (startMove) zurück zu seinem Posten.
    // Setzt task = 'returning_to_post' und state = 'moving', damit der
    // Renderer interpoliert und onArrive in villagers.js den Task behandelt.
    function startReturnToPost(v) {
      const post = v.warriorBuildingId ? world.buildings.get(v.warriorBuildingId) : null;
      if (!post || !post.built || post.ruined) {
        // Posten weg → freier Bürger, unsichtbar
        v.state = 'idle';
        v.hidden = true;
        v.task = null;
        v.job = 'free';
        v.workplaceId = null;
        v.warriorBuildingId = null;
        v.warriorSlotIndex = -1;
        vm._idleVillagers.add(v.id);
        return;
      }
      v.task = 'returning_to_post';
      v.state = 'moving';
      vm.startMove(v, post.x, post.y + (post.h || 1) - 1);
      v.hidden = false;
      v.asset = 'images/villager-krieger-rot.webp';
    }

    function update(dt) {
      const dtSec = dt / 1000;
      const grid = game.spatialGrid;

      const allVillagers = vm.getAllVillagers();

      const warriors = [];
      for (const v of allVillagers) {
        if (v.job === 'warrior') warriors.push(v);
      }

      const zombiesOnTerritory = [];
      for (const z of zombieManager.zombies) {
        if (z.state === 'dead') continue;
        if (world.isInTerritory(z.x, z.y)) zombiesOnTerritory.push(z);
      }

      const dragon = findDragon();

      // ==========================================================
      // 1) Zombie-Bewegung
      // ==========================================================
      const zombieList = zombieManager.zombies;
      const zombieCount = zombieList.length;

      for (let zi = 0; zi < zombieCount; zi++) {
        const z = zombieList[zi];
        if (z.state === 'dead') continue;

        let nearestVillager = null;
        let nearestDistSq = zombieManager.detectRadius * zombieManager.detectRadius;

        const nearbyVillagers = grid
          ? grid.queryByType(z.x, z.y, zombieManager.detectRadius, 'villager')
          : vm.getNearbyVillagers(z.x, z.y);

        for (const v of nearbyVillagers) {
          if (v.job === 'warrior') continue;
          if (v.hidden) continue;
          const ddx = v.renderX - z.x;
          const ddy = v.renderY - z.y;
          const distSq = ddx * ddx + ddy * ddy;
          if (distSq < nearestDistSq) {
            nearestDistSq = distSq;
            nearestVillager = v;
          }
        }

        let targetX, targetY;
        if (nearestVillager) {
          targetX = nearestVillager.renderX;
          targetY = nearestVillager.renderY;
        } else {
          const cc = zombieManager.getCastleCenter();
          if (cc) {
            targetX = cc.x;
            targetY = cc.y;
          } else {
            continue;
          }
        }

        const moveDx = targetX - z.x;
        const moveDy = targetY - z.y;
        const moveDist = Math.sqrt(moveDx * moveDx + moveDy * moveDy);
        if (moveDist > 0.001) {
          const step = Math.min(zombieManager.speed * dtSec, moveDist);
          const newX = z.x + (moveDx / moveDist) * step;
          const newY = z.y + (moveDy / moveDist) * step;

          let blocked = false;

          if (grid) {
            const nearbyZombies = grid.queryByType(newX, newY, 1, 'zombie');
            for (const other of nearbyZombies) {
              if (other === z || other.state === 'dead') continue;
              if (other.id > z.id) continue;
              const ox = newX - other.x;
              const oy = newY - other.y;
              if (ox * ox + oy * oy < 0.64) {
                blocked = true;
                break;
              }
            }
          } else {
            for (let i = zi + 1; i < zombieCount; i++) {
              const other = zombieList[i];
              if (other.state === 'dead') continue;
              const ox = newX - other.x;
              const oy = newY - other.y;
              if (ox * ox + oy * oy < 0.64) {
                blocked = true;
                break;
              }
            }
          }

          if (!blocked) {
            if (grid) {
              const nearbyWarriors = grid.queryByType(newX, newY, 1, 'warrior');
              for (const w of nearbyWarriors) {
                if (w.hidden) continue;
                if (w.id > z.id) continue;
                const ox = newX - w.x;
                const oy = newY - w.y;
                if (ox * ox + oy * oy < 0.64) {
                  blocked = true;
                  break;
                }
              }
            } else {
              for (const w of warriors) {
                if (w.hidden) continue;
                if (w.id > z.id) continue;
                const ox = newX - w.x;
                const oy = newY - w.y;
                if (ox * ox + oy * oy < 0.64) {
                  blocked = true;
                  break;
                }
              }
            }
          }

          if (!blocked) {
            z.x = newX;
            z.y = newY;
          }
        }

        const nearbyForCollision = grid
          ? grid.queryByType(z.x, z.y, 5, 'villager')
          : vm.getNearbyVillagers(z.x, z.y);

        for (const v of nearbyForCollision) {
          if (v.job === 'warrior') continue;
          if (v.hidden) continue;
          if (!vm.villagers.has(v.id)) continue;

          const vdx = v.renderX - z.x;
          const vdy = v.renderY - z.y;
          if (vdx * vdx + vdy * vdy > 25) continue;

          if (Math.abs(vdx) <= 0.8 && Math.abs(vdy) <= 0.8) {
            const infectX = v.renderX;
            const infectY = v.renderY;

            if (game.zombieInfects) {
              v._diedFromZombie = true;
            }

            vm.killVillager(v);
            if (game.zombieInfects) {
              zombieManager.spawnZombieAt(infectX, infectY);
            }
            break;
          }
        }

        z.renderX = z.x;
        z.renderY = z.y;

        const zTileX = Math.floor(z.renderX);
        const zTileY = Math.floor(z.renderY);
        const zFeetTerrain = world.getTerrainId(zTileX, zTileY);
        const zIsInWater = zFeetTerrain === 'water';
        const zPrevDepth = z.waterDepth || 0;
        let zNewDepth = zPrevDepth;
        if (zIsInWater) {
          const zSpeed = 3.0 * (dt / 1000);
          if (zPrevDepth < 1.0) zNewDepth = Math.min(1.0, zPrevDepth + zSpeed);
        } else {
          zNewDepth = 0;
        }
        z.waterDepth = zNewDepth;
      }

      // ==========================================================
      // 2) Spielerkrieger
      // ==========================================================
      for (const v of warriors) {
        if (!vm.villagers.has(v.id)) continue;

        // ⚠️ NEU: Wenn der Krieger gerade auf dem Rückweg ist, nicht in die
        // Kampf-Logik eingreifen – das übernimmt startMove + onArrive.
        if (v.state === 'moving' && v.task === 'returning_to_post') {
          v.hidden = false;
          v.asset = 'images/villager-krieger-rot.webp';
          continue;
        }

        if (v.state === 'dragon_attack') {
          if (!dragon) {
            // ⚠️ FIX: Drache weg → normal zurücklaufen
            if (tryReturnToOwnSlot(v)) {
              v.state = 'working';
              v.hidden = true;
            } else {
              startReturnToPost(v);
            }
            continue;
          }

          const dx = dragon.x - v.x;
          const dy = dragon.y - v.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist <= 1.2) { 
            v.renderX = v.x;
            v.renderY = v.y;
            v.hidden = false;
            v.asset = 'images/villager-krieger-rot.webp';

            if (grid) {
                const closeWarriors = grid.queryByType(v.x, v.y, 1, 'warrior');
                for(const other of closeWarriors) {
                    if(other === v) continue;
                    const ox = v.x - other.x;
                    const oy = v.y - other.y;
                    const d2 = ox*ox + oy*oy;
                    if(d2 > 0.01 && d2 < 0.8) {
                        const d = Math.sqrt(d2);
                        const push = (0.8 - d) * 0.1;
                        v.x += (ox/d) * push;
                        v.y += (oy/d) * push;
                    }
                }
            }
            continue;
          }

          let speed = v.speed;
          if (v.beerBuff) speed = v.speed * 1.25;

          const angleToDragon = Math.atan2(dy, dx);
          const ringOffset = 1.0;
          const targetX = dragon.x - Math.cos(angleToDragon) * ringOffset;
          const targetY = dragon.y - Math.sin(angleToDragon) * ringOffset;

          const moveDx = targetX - v.x;
          const moveDy = targetY - v.y;
          const moveDist = Math.sqrt(moveDx * moveDx + moveDy * moveDy);

          let step = Math.min(speed * dtSec, moveDist);
          let newX = v.x + (moveDx / moveDist) * step;
          let newY = v.y + (moveDy / moveDist) * step;

          let blocked = false;

          if (grid) {
            const nearbyWarriors = grid.queryByType(newX, newY, 1, 'warrior');
            for (const other of nearbyWarriors) {
              if (other === v || other.hidden) continue;
              if (other.id > v.id) continue;
              const ox = newX - other.x;
              const oy = newY - other.y;
              if (ox * ox + oy * oy < 0.64) { blocked = true; break; }
            }
          } else {
            for (const other of warriors) {
              if (other === v || other.hidden || other.id > v.id) continue;
              const ox = newX - other.x;
              const oy = newY - other.y;
              if (ox * ox + oy * oy < 0.64) { blocked = true; break; }
            }
          }

          if (blocked) {
            const perpX = -moveDy;
            const perpY = moveDx;

            const slideWeight = 0.6;
            const forwardWeight = 0.4;

            let slideDir = 1;

            let checkX = v.x + (perpX * slideDir * slideWeight + moveDx * forwardWeight) * dtSec * speed;
            let checkY = v.y + (perpY * slideDir * slideWeight + moveDy * forwardWeight) * dtSec * speed;

            let perpBlocked = false;
            if (grid) {
                const pWarriors = grid.queryByType(checkX, checkY, 1, 'warrior');
                for (const other of pWarriors) {
                    if (other === v || other.hidden || other.id > v.id) continue;
                    if ((checkX - other.x)**2 + (checkY - other.y)**2 < 0.64) { perpBlocked = true; break; }
                }
            }

            if (perpBlocked) {
                slideDir = -1;
                checkX = v.x + (perpX * slideDir * slideWeight + moveDx * forwardWeight) * dtSec * speed;
                checkY = v.y + (perpY * slideDir * slideWeight + moveDy * forwardWeight) * dtSec * speed;
            }

            newX = checkX;
            newY = checkY;
            blocked = false;
          }

          if (!blocked) {
            v.x = newX;
            v.y = newY;
            v.renderX = v.x;
            v.renderY = v.y;
          }

          v.hidden = false;
          v.asset = 'images/villager-krieger-rot.webp';
          continue;
        }

        if (v.state === 'attacking_raiders' || v.state === 'vfightback' || v.state === 'vdefend' || v.state === 'vfighting') {
          continue;
        }

        if (v.state === 'zfighting') {
          let nearestZombie = null;
          let nearestZDistSq = Infinity;

          let zombieCandidates;
          if (grid) {
            zombieCandidates = grid.queryByType(v.x, v.y, 20, 'zombie');
          } else {
            zombieCandidates = zombiesOnTerritory;
          }

          for (const z of zombieCandidates) {
            if (z.state === 'dead') continue;
            if (grid && !world.isInTerritory(z.x, z.y)) continue;
            const dx = z.x - v.x;
            const dy = z.y - v.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < nearestZDistSq) {
              nearestZDistSq = distSq;
              nearestZombie = z;
            }
          }

          if (!nearestZombie) {
            // ⚠️ FIX: Kein Zombie mehr → normal zurücklaufen (nicht nur State setzen)
            if (tryReturnToOwnSlot(v)) {
              v.state = 'working';
              v.hidden = true;
            } else {
              startReturnToPost(v);
            }
            continue;
          }

          const dist = Math.sqrt(nearestZDistSq);

          if (dist <= 1.0) {
            const winChance = v.beerBuff ? 0.9 : 0.75;
            if (Math.random() < winChance) {
              nearestZombie.state = 'dead';
              if (zombieManager.onZombieKilled) zombieManager.onZombieKilled(nearestZombie);
              v.state = 'zfighting';
            } else {
              vm.killVillager(v);
            }
            continue;
          }

          let speed = v.speed;
          if (v.beerBuff) speed = v.speed * 1.25;
          const moveStep = Math.min(speed * dtSec, dist);
          const moveDx = (nearestZombie.x - v.x) / dist;
          const moveDy = (nearestZombie.y - v.y) / dist;
          const newX = v.x + moveDx * moveStep;
          const newY = v.y + moveDy * moveStep;

          let blocked = false;

          if (grid) {
            const nearbyWarriors = grid.queryByType(newX, newY, 1, 'warrior');
            for (const other of nearbyWarriors) {
              if (other === v || other.hidden) continue;
              if (other.id > v.id) continue;
              const ox = newX - other.x;
              const oy = newY - other.y;
              if (ox * ox + oy * oy < 0.64) { blocked = true; break; }
            }
          } else {
            for (const other of warriors) {
              if (other === v || other.hidden || other.id > v.id) continue;
              const ox = newX - other.x;
              const oy = newY - other.y;
              if (ox * ox + oy * oy < 0.64) { blocked = true; break; }
            }
          }

          if (!blocked) {
            if (grid) {
              const nearbyZ = grid.queryByType(newX, newY, 1, 'zombie');
              for (const z of nearbyZ) {
                if (z.state === 'dead') continue;
                if (z.id > v.id) continue;
                const ox = newX - z.x;
                const oy = newY - z.y;
                if (ox * ox + oy * oy < 0.64) { blocked = true; break; }
              }
            } else {
              for (const z of zombieManager.zombies) {
                if (z.state === 'dead' || z.id > v.id) continue;
                const ox = newX - z.x;
                const oy = newY - z.y;
                if (ox * ox + oy * oy < 0.64) { blocked = true; break; }
              }
            }
          }

          if (!blocked) {
            v.x = newX;
            v.y = newY;
            v.renderX = v.x;
            v.renderY = v.y;
          }
          v.hidden = false;
          v.asset = 'images/villager-krieger-rot.webp';
          continue;
        }

        if (v.state === 'working') {
          const myBuilding = v.warriorBuildingId ? world.buildings.get(v.warriorBuildingId) : null;
          if (!myBuilding) {
            v.state = 'idle';
            v.workerId = null;
            continue;
          }

          if (myBuilding._attackRadiusSq === undefined) {
            const r = myBuilding.def.attackRadius || 10;
            myBuilding._attackRadiusSq = r * r;
          }

          const bCenterX = myBuilding.x + (myBuilding.w || 1) / 2;
          const bCenterY = myBuilding.y + (myBuilding.h || 1) / 2;

          let zombieInRange = false;

          for (const z of zombieManager.zombies) {
            if (z.state === 'dead') continue;
            if (!world.isInTerritory(z.x, z.y)) continue;
            
            const dx = z.x - bCenterX;
            const dy = z.y - bCenterY;
            if (dx * dx + dy * dy <= myBuilding._attackRadiusSq) {
              zombieInRange = true;
              break;
            }
          }

          if (!zombieInRange) {
            continue;
          }

          v.x = bCenterX;
          v.y = bCenterY;
          v.renderX = bCenterX;
          v.renderY = bCenterY;
          v.state = 'zfighting';
          v.asset = 'images/villager-krieger-rot.webp';
          continue;
        }

        if (v.state === 'idle') {
          let zombieInRange = false;
          if (grid) {
            const radius = 10;
            const zombieCandidates = grid.queryByType(v.x, v.y, radius, 'zombie');
            for (const z of zombieCandidates) {
              if (z.state === 'dead') continue;
              if (!world.isInTerritory(z.x, z.y)) continue;
              const dx = z.x - v.x;
              const dy = z.y - v.y;
              if (dx * dx + dy * dy <= radius * radius) {
                zombieInRange = true;
                break;
              }
            }
          } else {
            for (const z of zombiesOnTerritory) {
              if (z.state === 'dead') continue;
              const dx = z.x - v.x;
              const dy = z.y - v.y;
              if (dx * dx + dy * dy <= 100) {
                zombieInRange = true;
                break;
              }
            }
          }

          if (zombieInRange) {
            v.state = 'zfighting';
            v.hidden = false;
            v.asset = 'images/villager-krieger-rot.webp';
          }
          continue;
        }

        // ⚠️ FIX: Alten 'returning_to_post'-Branch komplett ersetzt.
        // Der Krieger ist entweder in 'moving' (wird oben abgefangen) oder
        // hier nur noch als Fallback, falls der State manuell gesetzt wurde.
        if (v.state === 'returning_to_post') {
          // Normalerweise sollte state === 'moving' + task === 'returning_to_post'
          // sein. Falls der State trotzdem hier landet:
          if (tryReturnToOwnSlot(v)) {
            v.state = 'working';
            v.hidden = true;
            continue;
          }

          if (dragon) {
            v.state = 'dragon_attack';
            v.hidden = false;
            v.asset = 'images/villager-krieger-rot.webp';
            continue;
          }

          if (zombiesOnTerritory.length > 0) {
            v.state = 'zfighting';
            v.hidden = false;
            continue;
          }

          startReturnToPost(v);
          continue;
        }
      }

      zombieManager.zombies = zombieManager.zombies.filter(z => z.state !== 'dead');
    }

    return { update };
  }
};
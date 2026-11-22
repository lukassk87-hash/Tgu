window.Game = window.Game || {};

Game.ZombieCombat = {
  create(game, world, vm, zombieManager, renderer, audioManager) {
    if (!zombieManager) {
      return { update() {} };
    }

    const ATTACK_STAGGER_MS = 1000;
    const ATTACK_STAGGER_MAX = 20; // Cap bei 3 Sekunden
    const COMBAT_DURATION_MS = 1500;

    // ==========================================================
    // Kampf-Status-Helfer
    // ==========================================================
    // Kämpfer/Zombie befindet sich in einer aktiven Kampfphase
    function isInActiveCombat(entity) {
      return !!(entity && entity._combatUntil && entity._combatUntil > performance.now());
    }

    // Läuft irgendwo noch ein Kampf? (für Wartelogik ohne Ziel)
    function anyCombatRunning() {
      const now = performance.now();
      for (const z of zombieManager.zombies) {
        if (z.state === 'dead') continue;
        if (z._combatUntil && z._combatUntil > now) return true;
      }
      return false;
    }

    // Zombie für Zielsuche akzeptabel: lebend, im Territorium, nicht im Kampf
    function isTargetableZombie(z, now) {
      if (!z || z.state === 'dead') return false;
      if (!world.isInTerritory(z.x, z.y)) return false;
      if (z._combatUntil && z._combatUntil > now) return false;
      return true;
    }

    // ==========================================================
    // V-Position für einen einzelnen Kämpfer berechnen.
    // Slot 0 = Spitze in Richtung des Zielzombies.
    // ==========================================================
    function getPositionInBuilding(homeBuilding, slotIndex, directionX, directionY) {
      const w = homeBuilding.w || 1;
      const h = homeBuilding.h || 1;

      const cx = homeBuilding.x + w / 2;
      const cy = homeBuilding.y + h / 2;

      let dx = directionX;
      let dy = directionY;
      if (!Number.isFinite(dx) || !Number.isFinite(dy) || (dx === 0 && dy === 0)) {
        dx = 0;
        dy = -1;
      }
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      dx /= len;
      dy /= len;

      const perpX = -dy;
      const perpY = dx;

      const spacing = 1.0;

      let forward = 0;
      let lateral = 0;

      if (slotIndex > 0) {
        const wingSide = (slotIndex % 2 === 1) ? -1 : 1;
        const wingDepth = Math.ceil(slotIndex / 2);
        forward = -wingDepth * spacing;
        lateral = wingSide * wingDepth * spacing;
      }

      let px = cx + dx * forward + perpX * lateral;
      let py = cy + dy * forward + perpY * lateral;

      const minX = homeBuilding.x + 0.15;
      const maxX = homeBuilding.x + w - 0.15;
      const minY = homeBuilding.y + 0.15;
      const maxY = homeBuilding.y + h - 0.15;
      px = Math.max(minX, Math.min(maxX, px));
      py = Math.max(minY, Math.min(maxY, py));

      return { x: px, y: py };
    }

    // ==========================================================
    // Nächsten angreifbaren Zombie zum Gebäudezentrum finden.
    // (Kämpfende Zombies werden übersprungen.)
    // ==========================================================
    function findNearestZombieToBuilding(building, maxRadius) {
      const bx = building.x + (building.w || 1) / 2;
      const by = building.y + (building.h || 1) / 2;
      const maxD2 = maxRadius * maxRadius;

      let best = null;
      let bestD2 = maxD2;

      const now = performance.now();
      for (const z of zombieManager.zombies) {
        if (!isTargetableZombie(z, now)) continue; // NEU: kämpfende überspringen
        const dx = z.x - bx;
        const dy = z.y - by;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestD2) {
          bestD2 = d2;
          best = z;
        }
      }
      return best;
    }

    // ==========================================================
    // Prüft, ob das Gebäude aktuell angreifbare Zombies in
    // Reichweite hat. (Kämpfende zählen nicht.)
    // ==========================================================
    function buildingHasZombiesInRange(building) {
      const now = performance.now();
      const r = building.def.attackRadius || 10;
      const bx = building.x + (building.w || 1) / 2;
      const by = building.y + (building.h || 1) / 2;
      const r2 = r * r;
      for (const z of zombieManager.zombies) {
        if (!isTargetableZombie(z, now)) continue;
        const dx = z.x - bx;
        const dy = z.y - by;
        if (dx * dx + dy * dy <= r2) return true;
      }
      return false;
    }

    // ==========================================================
    // Staffelung starten: setzt _attackStartAt pro Kämpfer des
    // Gebäudes. Sortiert nach warriorLevel (aufsteigend), dann id.
    //
    // Nur aufrufen, wenn noch keiner der Kämpfer einen
    // _attackStartAt > 0 hat (sonst würde die Staffelung
    // zurückgesetzt, während sie noch läuft).
    // ==========================================================
    function startStaggeredAttack(building, now) {
      const order = vm._getCombatOrder(building);
      if (order.length === 0) return;

      for (let i = 0; i < order.length; i++) {
        const wid = order[i];
        const w = vm.villagers.get(wid);
        if (!w) continue;
        const delayIdx = Math.min(i, ATTACK_STAGGER_MAX);
        w._attackStartAt = now + delayIdx * ATTACK_STAGGER_MS;
        w._vPosition = i;
      }
    }

    // ==========================================================
    // Prüft, ob irgendein Kämpfer des Gebäudes gerade gestaffelt
    // ist (also _attackStartAt > 0).
    // ==========================================================
    function buildingIsStaggered(building) {
      if (!building.warriorSlots) return false;
      for (const wid of building.warriorSlots) {
        if (wid === null) continue;
        const w = vm.villagers.get(wid);
        if (!w) continue;
        if (w._attackStartAt > 0) return true;
      }
      return false;
    }

    // ==========================================================
    // Setzt die Staffelung aller Kämpfer des Gebäudes zurück.
    // ==========================================================
    function resetStaggeredAttack(building) {
      if (!building.warriorSlots) return;
      for (const wid of building.warriorSlots) {
        if (wid === null) continue;
        const w = vm.villagers.get(wid);
        if (!w) continue;
        w._attackStartAt = 0;
        w._vPosition = -1;
      }
    }

    // ==========================================================
    // Kämpfer tatsächlich losschicken (V-Position, sichtbar machen,
    // in zfighting setzen).
    // ==========================================================
    function launchFighter(building, w, targetZombie) {
      const bx = building.x + (building.w || 1) / 2;
      const by = building.y + (building.h || 1) / 2;

      let dirX = 0, dirY = -1;
      if (targetZombie) {
        const ddx = targetZombie.x - bx;
        const ddy = targetZombie.y - by;
        const dl = Math.sqrt(ddx * ddx + ddy * ddy);
        if (dl > 0.001) {
          dirX = ddx / dl;
          dirY = ddy / dl;
        }
      }

      const slotIdx = w._vPosition >= 0 ? w._vPosition : 0;
      const pos = getPositionInBuilding(building, slotIdx, dirX, dirY);

      w.x = pos.x;
      w.y = pos.y;
      w.targetX = pos.x;
      w.targetY = pos.y;
      w.renderX = pos.x;
      w.renderY = pos.y;
      w.hidden = false;
      w.asset = 'images/villager-krieger-rot.webp';
      w.state = 'zfighting';
      w._attackStartAt = 0;
      w._vPosition = -1;
    }

    function findDragon() {
      const dm = game.dragonManager;
      if (!dm || !dm.dragons || dm.dragons.length === 0) return null;

      for (const d of dm.dragons) {
        if (d.state === 'grounded') return d;
      }
      return null;
    }

    function startReturnToPost(v) {
      if (vm && typeof vm.startReturnToPost === 'function') {
        vm.startReturnToPost(v);
        return;
      }
      v.state = 'idle';
      v.hidden = true;
      v.task = null;
    }

    function warriorFallsToZombie(v) {
      const infectX = v.renderX !== undefined ? v.renderX : v.x;
      const infectY = v.renderY !== undefined ? v.renderY : v.y;

      const now = performance.now();
      const canInfect = zombieManager.isInfectious(now);

      // Kampf-Zombie freigeben, damit er nicht ewig "im Kampf" hängt
      if (v._combatTargetId !== undefined) {
        const z = zombieManager.zombies.find(zz => zz.id === v._combatTargetId);
        if (z) {
          z._combatUntil = 0;
          z._combatWith = undefined;
        }
      }

      if (game.zombieInfects) {
        v._diedFromZombie = true;
      }

      vm.killVillager(v);

      if (game.zombieInfects && canInfect) {
        zombieManager.spawnZombieAt(infectX, infectY);
      }

      if (audioManager) audioManager.playOneShot('audio/schrei.mp3');
    }

    function update(dt) {
      const dtSec = dt / 1000;
      const grid = game.spatialGrid;
      const now = performance.now();

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
      // 0) Staffelung pro Gebäude: 
      //    - Wenn Zombies in Reichweite und noch nicht gestaffelt
      //      → Staffelung starten
      //    - Wenn keine Zombies mehr in Reichweite
      //      → Staffelung zurücksetzen
      // ==========================================================
      for (const b of world.warriorBuildings) {
        if (!b.built || b.ruined) continue;
        if (!b.warriorSlots) continue;

        const hasZombies = buildingHasZombiesInRange(b);

        if (hasZombies) {
          if (!buildingIsStaggered(b)) {
            startStaggeredAttack(b, now);
          }
        } else {
          if (buildingIsStaggered(b)) {
            resetStaggeredAttack(b);
          }
        }
      }

      // ==========================================================
      // 1) Zombie-Bewegung
      // ==========================================================
      const zombieList = zombieManager.zombies;
      const zombieCount = zombieList.length;

      for (let zi = 0; zi < zombieCount; zi++) {
        const z = zombieList[zi];
        if (z.state === 'dead') continue;

        // Kämpfende Zombies bewegen sich nicht
        if (isInActiveCombat(z)) {
          z.renderX = z.x;
          z.renderY = z.y;
          continue;
        }

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

        if (z.targetX === undefined || Math.abs(z.targetX - targetX) > 0.1 || Math.abs(z.targetY - targetY) > 0.1) {
          z.targetX = targetX;
          z.targetY = targetY;
        }

        const moveDx = targetX - z.x;
        const moveDy = targetY - z.y;
        const moveDist = Math.sqrt(moveDx * moveDx + moveDy * moveDy);
        if (moveDist > 0.001) {
          const step = Math.min(zombieManager.speed * dtSec, moveDist);
          const newX = z.x + (moveDx / moveDist) * step;
          const newY = z.y + (moveDy / moveDist) * step;

          let blocked = false;

          if (!z._noCollision) {
            if (grid) {
              const nearbyZombies = grid.queryByType(newX, newY, 1, 'zombie');
              for (const other of nearbyZombies) {
                if (other === z || other.state === 'dead') continue;
                if (other._noCollision) continue;
                if (other.id > z.id) continue;
                if (isInActiveCombat(other)) continue; // durchlässig
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
                if (other._noCollision) continue;
                if (isInActiveCombat(other)) continue; // durchlässig
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
                  if (isInActiveCombat(w)) continue; // durchlässig
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
                  if (isInActiveCombat(w)) continue; // durchlässig
                  const ox = newX - w.x;
                  const oy = newY - w.y;
                  if (ox * ox + oy * oy < 0.64) {
                    blocked = true;
                    break;
                  }
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

            const canInfect = zombieManager.isInfectious(now);

            if (game.zombieInfects) {
              v._diedFromZombie = true;
            }

            vm.killVillager(v);
            if (game.zombieInfects && canInfect) {
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

        if (v.state === 'moving' && v.task === 'returning_to_post') {
          v.hidden = false;
          v.asset = 'images/villager-krieger-rot.webp';
          continue;
        }

        if (v.state === 'dragon_attack') {
          if (!dragon) {
            startReturnToPost(v);
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
              for (const other of closeWarriors) {
                if (other === v) continue;
                const ox = v.x - other.x;
                const oy = v.y - other.y;
                const d2 = ox * ox + oy * oy;
                if (d2 > 0.01 && d2 < 0.8) {
                  const d = Math.sqrt(d2);
                  const push = (0.8 - d) * 0.1;
                  v.x += (ox / d) * push;
                  v.y += (oy / d) * push;
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
              if (isInActiveCombat(other)) continue; // durchlässig
              const ox = newX - other.x;
              const oy = newY - other.y;
              if (ox * ox + oy * oy < 0.64) { blocked = true; break; }
            }
          } else {
            for (const other of warriors) {
              if (other === v || other.hidden || other.id > v.id) continue;
              if (isInActiveCombat(other)) continue; // durchlässig
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
                if ((checkX - other.x) ** 2 + (checkY - other.y) ** 2 < 0.64) { perpBlocked = true; break; }
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
            v.targetX = targetX;
            v.targetY = targetY;
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

        // ==========================================================
        // NEU: Warten, bis laufende Kämpfe enden
        // ==========================================================
        if (v.state === 'zfighting_wait') {
          v.renderX = v.x;
          v.renderY = v.y;
          v.hidden = false;
          v.asset = 'images/villager-krieger-rot.webp';

          // Gibt es jetzt ein angreifbares Ziel?
          let waitTarget = null;
          let waitDistSq = Infinity;

          let waitCandidates;
          if (grid) {
            waitCandidates = grid.queryByType(v.x, v.y, 20, 'zombie');
          } else {
            waitCandidates = zombiesOnTerritory;
          }

          for (const z of waitCandidates) {
            if (!isTargetableZombie(z, now)) continue;
            const dx = z.x - v.x;
            const dy = z.y - v.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < waitDistSq) {
              waitDistSq = d2;
              waitTarget = z;
            }
          }

          if (waitTarget) {
            // Ziel gefunden → angreifen
            v.state = 'zfighting';
            continue;
          }

          if (!anyCombatRunning()) {
            // Keine Kämpfe mehr und keine Ziele → zurück
            startReturnToPost(v);
            continue;
          }

          // weiter warten
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
            if (!isTargetableZombie(z, now)) continue; // kämpfende überspringen
            const dx = z.x - v.x;
            const dy = z.y - v.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < nearestZDistSq) {
              nearestZDistSq = distSq;
              nearestZombie = z;
            }
          }

          if (!nearestZombie) {
            // Kein Ziel in Reichweite
            v.renderX = v.x;
            v.renderY = v.y;
            v.hidden = false;
            v.asset = 'images/villager-krieger-rot.webp';

            if (anyCombatRunning()) {
              // Auf laufende Kämpfe warten
              v.state = 'zfighting_wait';
              continue;
            }

            // Keine Kämpfe mehr, keine Ziele → zurück ins Schloss
            startReturnToPost(v);
            continue;
          }

          const dist = Math.sqrt(nearestZDistSq);

          if (dist <= 1.0) {
            // Kampf starten (falls noch nicht aktiv)
            if (!v._combatUntil) {
              const winChance = v.winChanceZombie !== undefined ? v.winChanceZombie : 0.60;
              v._combatWin = Math.random() < winChance;
              v._combatUntil = now + COMBAT_DURATION_MS;
              v._combatTargetId = nearestZombie.id;
              nearestZombie._combatUntil = now + COMBAT_DURATION_MS;
              nearestZombie._combatWith = v.id;

              // Startwolke (neutraler Staub)
              if (renderer && renderer.particles) {
                for (let k = 0; k < 8; k++) {
                  const ang = Math.random() * Math.PI * 2;
                  renderer.particles.push({
                    x: v.x + Math.random() * 0.6 - 0.3,
                    y: v.y + Math.random() * 0.6 - 0.3,
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
              continue;
            }

            // Kampf läuft: Kämpfer steht still
            v.renderX = v.x;
            v.renderY = v.y;
            v.hidden = false;
            v.asset = 'images/villager-krieger-rot.webp';

            if (now < v._combatUntil) {
              continue; // noch am Kämpfen
            }

            // Kampf vorbei → auswerten
            const targetAlive = nearestZombie && nearestZombie.state !== 'dead';

            if (v._combatWin && targetAlive) {
              nearestZombie.state = 'dead';
              if (zombieManager.onZombieKilled) zombieManager.onZombieKilled(nearestZombie);
              if (vm && typeof vm.addKill === 'function') vm.addKill(v);
            } else if (v._combatWin && !targetAlive) {
              // Ziel bereits von anderem Kämpfer erledigt → kein Todesfall
            } else {
              // Auflösungswolke vor dem Tod
              if (renderer && renderer.particles) {
                for (let k = 0; k < 14; k++) {
                  const ang = Math.random() * Math.PI * 2;
                  const spd = 0.4 + Math.random() * 0.8;
                  renderer.particles.push({
                    x: v.x + Math.random() * 0.8 - 0.4,
                    y: v.y + Math.random() * 0.8 - 0.4,
                    vx: Math.cos(ang) * spd,
                    vy: Math.sin(ang) * spd - 0.3,
                    life: 1.0,
                    color: 'rgba(200,200,200,0.6)',
                    size: 4 + Math.random() * 3,
                    _shape: 'mist',
                    _grow: 0.5
                  });
                }
              }
              warriorFallsToZombie(v);
              continue;
            }

            // Auflösungswolke (Sieg)
            if (renderer && renderer.particles) {
              for (let k = 0; k < 14; k++) {
                const ang = Math.random() * Math.PI * 2;
                const spd = 0.4 + Math.random() * 0.8;
                renderer.particles.push({
                  x: v.x + Math.random() * 0.8 - 0.4,
                  y: v.y + Math.random() * 0.8 - 0.4,
                  vx: Math.cos(ang) * spd,
                  vy: Math.sin(ang) * spd - 0.3,
                  life: 1.0,
                  color: 'rgba(200,200,200,0.6)',
                  size: 4 + Math.random() * 3,
                  _shape: 'mist',
                  _grow: 0.5
                });
              }
            }

            // Kämpfer aufräumen
            v._combatUntil = 0;
            v._combatWin = undefined;
            v._combatTargetId = undefined;
            nearestZombie._combatUntil = 0;
            nearestZombie._combatWith = undefined;

            v.state = 'zfighting';
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
              if (isInActiveCombat(other)) continue; // durchlässig
              const ox = newX - other.x;
              const oy = newY - other.y;
              if (ox * ox + oy * oy < 0.64) { blocked = true; break; }
            }
          } else {
            for (const other of warriors) {
              if (other === v || other.hidden || other.id > v.id) continue;
              if (isInActiveCombat(other)) continue; // durchlässig
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
                if (z._noCollision) continue;
                if (z.id > v.id) continue;
                if (isInActiveCombat(z)) continue; // durchlässig
                const ox = newX - z.x;
                const oy = newY - z.y;
                if (ox * ox + oy * oy < 0.64) { blocked = true; break; }
              }
            } else {
              for (const z of zombieManager.zombies) {
                if (z.state === 'dead' || z.id > v.id) continue;
                if (z._noCollision) continue;
                if (isInActiveCombat(z)) continue; // durchlässig
                const ox = newX - z.x;
                const oy = newY - z.y;
                if (ox * ox + oy * oy < 0.64) { blocked = true; break; }
              }
            }
          }

          if (!blocked) {
            v.x = newX;
            v.y = newY;
            v.targetX = nearestZombie.x;
            v.targetY = nearestZombie.y;
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
            startReturnToPost(v);
            continue;
          }

          // ==========================================================
          // Staffelungs-Prüfung.
          // Wenn der Kämpfer auf seinen Start wartet, nichts tun.
          // Wenn seine Zeit erreicht ist, tatsächlich losschicken.
          // ==========================================================
          if (v._attackStartAt > 0) {
            if (now < v._attackStartAt) {
              // Warten — nichts tun
              v.hidden = true;
              continue;
            }
            // Zeit erreicht → tatsächlich losschicken
            const targetZombie = findNearestZombieToBuilding(myBuilding, myBuilding.def.attackRadius || 10);
            launchFighter(myBuilding, v, targetZombie);
            continue;
          }

          // Kein aktiver Staffelungs-Eintrag → normale Prüfung
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
            if (z._combatUntil && z._combatUntil > now) continue; // NEU: kämpfende überspringen

            const dx = z.x - bCenterX;
            const dy = z.y - bCenterY;
            if (dx * dx + dy * dy <= myBuilding._attackRadiusSq) {
              zombieInRange = true;
              break;
            }
          }

          if (!zombieInRange) {
            // NEU: keine Ziele → ggf. auf laufende Kämpfe warten
            if (anyCombatRunning()) {
              v.state = 'zfighting_wait';
              v.hidden = false;
              v.asset = 'images/villager-krieger-rot.webp';
            }
            continue;
          }

          // Zombie in Reichweite, aber keine Staffelung aktiv
          // → in zfighting wechseln (Zielsuche übernimmt der zfighting-Block)
          v.x = bCenterX;
          v.y = bCenterY;
          v.targetX = bCenterX;
          v.targetY = bCenterY;
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
              if (!isTargetableZombie(z, now)) continue; // kämpfende überspringen
              const dx = z.x - v.x;
              const dy = z.y - v.y;
              if (dx * dx + dy * dy <= radius * radius) {
                zombieInRange = true;
                break;
              }
            }
          } else {
            for (const z of zombiesOnTerritory) {
              if (!isTargetableZombie(z, now)) continue; // kämpfende überspringen
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
            continue;
          }

          // NEU: keine Ziele in Reichweite → ggf. warten
          if (anyCombatRunning()) {
            v.state = 'zfighting_wait';
            v.hidden = false;
            v.asset = 'images/villager-krieger-rot.webp';
          }
          continue;
        }

        if (v.state === 'returning_to_post') {
          if (dragon) {
            v.state = 'dragon_attack';
            v.hidden = false;
            v.asset = 'images/villager-krieger-rot.webp';
            continue;
          }

          // NEU: nur angreifbare (nicht im Kampf befindliche) Zombies zählen
          let hasTargetable = false;
          for (const z of zombiesOnTerritory) {
            if (isTargetableZombie(z, now)) { hasTargetable = true; break; }
          }

          if (hasTargetable) {
            v.state = 'zfighting';
            v.hidden = false;
            continue;
          }

          // NEU: nur noch kämpfende Zombies → warten
          if (anyCombatRunning()) {
            v.state = 'zfighting_wait';
            v.hidden = false;
            v.asset = 'images/villager-krieger-rot.webp';
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
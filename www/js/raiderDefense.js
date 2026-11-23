window.Game = window.Game || {};

// ==========================================================
// Globale Combat-Konstanten
// ==========================================================
Game.Combat = Game.Combat || {};
if (Game.Combat.COLLISION_DIST === undefined) {
  Game.Combat.COLLISION_DIST = 0.6;
}
if (Game.Combat.COLLISION_DIST_SQ === undefined) {
  Game.Combat.COLLISION_DIST_SQ = Game.Combat.COLLISION_DIST * Game.Combat.COLLISION_DIST;
}

// ==========================================================
// Räuber-Verteidigung
// ==========================================================
Game.RaiderDefense = {
  create(game, world, vm, rv, renderer, audioManager) {
    if (!rv) {
      return { update() {}, reset() {}, isAlarmActive: () => false };
    }

    const COLLISION_DIST_SQ = Game.Combat.COLLISION_DIST_SQ;
    const defenseSpots = new Map();
    const _now = () => performance.now();

    // Kampf-Dauer für die Staubwolken-Animation
    const COMBAT_DURATION_MS = 1500;

    let deactivateTimer = 0;
    const DEACTIVATE_DELAY_MS = 1500;

    // ==========================================================
    // Kampf-Status-Helfer (analog zombieCombat.js)
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
    // V-Position für einen einzelnen Kämpfer berechnen.
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

    function computeDefenseSpot(warrior) {
      const home = rv.buildings.find(b => b.id === warrior.homeBuildingId);
      if (!home) return null;

      const hx = home.x + (home.w || 1) / 2;
      const hy = home.y + (home.h || 1) / 2;

      const isCastle = home.def.id === 'raiderCastle';
      const minR = isCastle ? 4 : 2;
      const maxR = isCastle ? 6 : 3;

      const angleSeed = (warrior.id * 2654435761) % 1000;
      const angle = (angleSeed / 1000) * Math.PI * 2;

      const distSeed = (warrior.id * 40503) % 1000;
      const dist = minR + (distSeed / 1000) * (maxR - minR);

      let sx = hx + Math.cos(angle) * dist;
      let sy = hy + Math.sin(angle) * dist;

      if (rv.boundarySet && !rv.isInRaiderTerritory(sx, sy)) {
        sx = hx + Math.cos(angle) * (minR * 0.6);
        sy = hy + Math.sin(angle) * (minR * 0.6);
      }

      return { x: sx, y: sy, homeId: home.id, isCastle };
    }

    function getOrCreateDefenseSpot(warrior) {
      let spot = defenseSpots.get(warrior.id);
      if (spot) {
        const home = rv.buildings.find(b => b.id === warrior.homeBuildingId);
        if (home) return spot;
      }
      spot = computeDefenseSpot(warrior);
      if (spot) defenseSpots.set(warrior.id, spot);
      return spot;
    }

    function checkAlarm() {
      if (rv.isDestroyed) {
        if (rv.alarmActive) {
          rv.alarmActive = false;
        }
        return;
      }

      const grid = game.spatialGrid;
      let intruderFound = false;

      if (grid) {
        const centerX = rv._centerCache ? rv._centerCache.x : 0;
        const centerY = rv._centerCache ? rv._centerCache.y : 0;
        const radius = rv.bounds
          ? Math.max(rv.bounds.maxX - rv.bounds.minX, rv.bounds.maxY - rv.bounds.minY) / 2 + 15
          : 50;

        const candidates = grid.queryByType(centerX, centerY, radius, 'warrior');
        for (const v of candidates) {
          if (!vm.villagers.has(v.id)) continue;
          if (v.state === 'dragon_attack') continue;
          if (v.state !== 'vfightback' && v.state !== 'vdefend') continue;
          if (rv.isInRaiderTerritory(v.x, v.y)) {
            intruderFound = true;
            break;
          }
        }
      } else {
        for (const v of vm.villagers.values()) {
          if (v.job !== 'warrior') continue;
          if (v.hidden) continue;
          if (v.state !== 'vfightback' && v.state !== 'vdefend') continue;
          if (rv.isInRaiderTerritory(v.x, v.y)) {
            intruderFound = true;
            break;
          }
        }
      }

      if (intruderFound) {
        if (!rv.alarmActive) {
          activateAlarm();
        }
        deactivateTimer = 0;
      } else if (rv.alarmActive) {
        if (deactivateTimer === 0) {
          deactivateTimer = _now() + DEACTIVATE_DELAY_MS;
        }

        if (_now() >= deactivateTimer) {
          deactivateAlarm();
          deactivateTimer = 0;
        }
      }
    }

    function activateAlarm() {
      rv.alarmActive = true;

      for (const w of rv.warriors.values()) {
        if (w.dead) continue;
        if (!w.hidden) continue;
        if (w.inAttack) continue;
        if (w.carryingLoot) continue;

        w.hidden = false;
        w.state = 'idle';
        w.inAttack = false;
        w.carryingLoot = false;
        w._defenseAssigned = false;
      }
    }

    function deactivateAlarm() {
      rv.alarmActive = false;

      for (const w of rv.warriors.values()) {
        if (w.dead) continue;
        if (w.carryingLoot) continue;
        if (w.inAttack) continue;

        const home = rv.buildings.find(b => b.id === w.homeBuildingId);
        if (home) {
          const pos = getPositionInBuilding(home, w.id % 4, 0, -1);
          w.targetX = pos.x;
          w.targetY = pos.y;
          w.state = 'returning_to_house';
        } else {
          w.hidden = true;
          w.state = 'idle';
        }
      }

      defenseSpots.clear();
    }

    function moveToward(w, tx, ty, dtSec) {
      const dx = tx - w.x;
      const dy = ty - w.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 0.01) return true;

      const speed = rv.WARRIOR_SPEED;
      const step = Math.min(speed * dtSec, dist);
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

      w.renderX = w.x;
      w.renderY = w.y;
      w.targetX = tx;
      w.targetY = ty;

      return dist <= 0.5;
    }

    // ==========================================================
    // Kampf auslösen
    // ==========================================================
    function startCombat(w, v) {
      const now = performance.now();
      const winChance = v.winChanceRaider !== undefined ? v.winChanceRaider : 0.60;

      v._combatWin = Math.random() < winChance;
      v._combatUntil = now + COMBAT_DURATION_MS;
      v._combatTargetId = w.id;

      w._combatUntil = now + COMBAT_DURATION_MS;
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

      // w._combatWin: true = Räuber gewinnt
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
    }

    // ==========================================================
    // Kollisions-Kampf
    // ==========================================================
    function handleCollisions(dtSec) {
      const grid = game.spatialGrid;
      if (!grid) return;

      const now = performance.now();

      for (const w of rv.warriors.values()) {
        if (w.dead || w.hidden) continue;

        if (w.inAttack) continue;
        if (w.carryingLoot) continue;
        if (w.state === 'returning_to_house') continue;

        // Läuft bereits ein Kampf für diesen Räuber?
        if (w._combatUntil && w._combatUntil > now) {
          continue;
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
            resolveCombat(w, v);
            continue;
          }
        }

        const nearby = grid.queryByType(w.x, w.y, 1.5, 'warrior');

        for (const v of nearby) {
          if (!vm.villagers.has(v.id)) continue;
          if (v.state === 'dragon_attack') continue;
          if (isInActiveCombat(v)) continue;

          const dx = v.x - w.x;
          const dy = v.y - w.y;
          if (dx * dx + dy * dy > COLLISION_DIST_SQ) continue;

          startCombat(w, v);
          break;
        }
      }
    }

    function updateArcherTowers(dt) {
      if (!rv.alarmActive) return;

      for (const tower of rv.towers) {
        if (!tower || tower.isDestroyed || tower.isBurning) continue;

        tower.arrowTowerCooldown = (tower.arrowTowerCooldown || 0) - dt;
        if (tower.arrowTowerCooldown > 0) continue;

        const range = tower.def.attackRange || 10;
        const rangeSq = range * range;
        const bx = tower.x + (tower.w || 1) / 2;
        const by = tower.y + (tower.h || 1) / 2;

        let target = null;
        let bestDistSq = rangeSq;

        const grid = game.spatialGrid;
        if (grid) {
          const candidates = grid.queryByType(bx, by, range, 'warrior');
          for (const v of candidates) {
            if (!vm.villagers.has(v.id)) continue;
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
        const hitChanceBase = tower.def.hitChanceBase ?? 1.00;
        const hitChancePerTile = tower.def.hitChancePerTile ?? 0.10;
        const hitChanceMin = tower.def.hitChanceMin ?? 0.10;
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

        tower.arrowTowerCooldown = tower.def.fireInterval || 1000;
      }
    }

    function update(dt) {
      if (world.castleId === null) return;

      checkAlarm();

      const dtSec = dt / 1000;

      if (!rv.alarmActive) {
        for (const w of rv.warriors.values()) {
          if (w.dead || w.hidden) continue;
          if (w.state === 'returning_to_house') {
            const arrived = moveToward(w, w.targetX, w.targetY, dtSec);
            if (arrived) {
              w.hidden = true;
              w.state = 'idle';
            }
          }
        }
        return;
      }

      if (rv.isDestroyed) return;

      for (const w of rv.warriors.values()) {
        if (w.dead || w.hidden) continue;
        if (w.inAttack) continue;
        if (w.carryingLoot) continue;

        // Im aktiven Kampf stehen bleiben
        if (w._combatUntil && w._combatUntil > performance.now()) {
          w.renderX = w.x;
          w.renderY = w.y;
          continue;
        }

        const spot = getOrCreateDefenseSpot(w);
        if (!spot) {
          w.hidden = true;
          continue;
        }

        const dx = spot.x - w.x;
        const dy = spot.y - w.y;
        const distSq = dx * dx + dy * dy;

        if (distSq > 0.5 * 0.5) {
          moveToward(w, spot.x, spot.y, dtSec);
        } else {
          if (!w._defenseAssigned) {
            w._defenseAssigned = true;
            w._defenseBaseX = w.x;
            w._defenseBaseY = w.y;
            w._defenseWanderPhase = Math.random() * Math.PI * 2;
          }

          const phase = w._defenseWanderPhase + _now() * 0.0005;
          const wanderR = 0.6;
          const tx = w._defenseBaseX + Math.cos(phase) * wanderR;
          const ty = w._defenseBaseY + Math.sin(phase) * wanderR;

          const grid = game.spatialGrid;
          let inCombat = false;
          if (grid) {
            const nearby = grid.queryByType(w.x, w.y, 1.0, 'warrior');
            for (const v of nearby) {
              if (!vm.villagers.has(v.id)) continue;
              if (v.state === 'dragon_attack') continue;
              if (isInActiveCombat(v)) continue;
              const ddx = v.x - w.x;
              const ddy = v.y - w.y;
              if (ddx * ddx + ddy * ddy <= COLLISION_DIST_SQ) {
                inCombat = true;
                break;
              }
            }
          }

          if (!inCombat) {
            moveToward(w, tx, ty, dtSec * 0.5);
          }
        }
      }

      handleCollisions(dtSec);
      updateArcherTowers(dt);
    }

    function reset() {
      defenseSpots.clear();
      rv.alarmActive = false;
      deactivateTimer = 0;
    }

    function isAlarmActive() {
      return !!rv.alarmActive;
    }

    return { update, reset, isAlarmActive };
  }
};
window.Game = window.Game || {};

Game.PlayerCombat = {
  create(game, world, vm, rv, renderer, audioManager) {
    if (!rv) {
      return { update() {}, reset() {} };
    }

    const COLLISION_DIST_SQ = Game.Combat.COLLISION_DIST_SQ;

    // Wartezeit pro Level (1 Sekunde) und maximaler Cap (6 Sekunden)
    const ATTACK_STAGGER_MS = 1000;
    const ATTACK_STAGGER_MAX = 6;

    // Kampf-Dauer für die Staubwolken-Animation
    const COMBAT_DURATION_MS = 1500;

    let playerRaidActive = false;
    let raidOutcomeProcessed = false;
    let attackersInRaid = [];

    // ==========================================================
    // Kampf-Status-Helfer (analog zombieCombat.js)
    // ==========================================================
    function isInActiveCombat(entity) {
      return !!(entity && entity._combatUntil && entity._combatUntil > performance.now());
    }

    // Räumt alle Krieger auf, die auf einen bestimmten Räuber zeigen.
    function clearWarriorsTargetingRaider(raiderId) {
      for (const v of vm.villagers.values()) {
        if (v._combatTargetId !== raiderId) continue;
        v._combatUntil = 0;
        v._combatWin = undefined;
        v._combatTargetId = undefined;
      }
    }

    // Räumt einen Räuber auf, der auf einen bestimmten Krieger zeigt.
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

    function showToast(msg, color) {
      if (game && typeof game.showToast === 'function') {
        game.showToast(msg, color);
      } else {
        console.log(`[Toast] ${msg}`);
      }
    }

    function anyWarriorInRaid() {
      for (const v of vm.villagers.values()) {
        if (v.job !== 'warrior') continue;
        if (v.state === 'vfightback' || v.state === 'vfighting' || v.state === 'attacking_raiders') return true;
      }
      return false;
    }

    function anyWarriorStaggered() {
      for (const v of vm.villagers.values()) {
        if (v.job !== 'warrior') continue;
        if (v._attackStartAt > 0) return true;
      }
      return false;
    }

    function anyRaiderInPlayerTerritory() {
      for (const w of rv.warriors.values()) {
        if (w.dead || w.hidden) continue;
        if (world.isInTerritory(w.x, w.y)) return true;
      }
      return false;
    }

    function findNearestRaiderInPlayerTerritory(px, py, maxDist) {
      const maxD2 = maxDist * maxDist;
      let best = null;
      let bestD2 = maxD2;

      const now = performance.now();

      const grid = game.spatialGrid;
      if (grid) {
        const candidates = grid.queryByType(px, py, maxDist, 'raider');
        for (const w of candidates) {
          if (w.dead || w.hidden) continue;
          if (!world.isInTerritory(w.x, w.y)) continue;
          if (isInActiveCombat(w)) continue;
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

      for (const w of rv.warriors.values()) {
        if (w.dead || w.hidden) continue;
        if (!world.isInTerritory(w.x, w.y)) continue;
        if (isInActiveCombat(w)) continue;
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

    function findNearestCachedRaider(px, py) {
      const now = performance.now();
      let best = null;
      let bestD2 = Infinity;
      for (const w of rv.raidersInTerritoryCache) {
        if (isInActiveCombat(w)) continue;
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

    function startReturnToPost(v) {
      if (vm && typeof vm.startReturnToPost === 'function') {
        vm.startReturnToPost(v);
        return;
      }
      v.state = 'idle';
      v.hidden = true;
      v.task = null;
    }

    function moveWarriorToward(v, tx, ty, dtSec, speedMultiplier = 1.0) {
      const dx = tx - v.x;
      const dy = ty - v.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 0.01) return true;

      let speed = v.speed;
      if (v.beerBuff) speed = v.speed * 1.25;
      speed *= speedMultiplier;

      const step = Math.min(speed * dtSec, dist);
      const newX = v.x + (dx / dist) * step;
      const newY = v.y + (dy / dist) * step;

      let blocked = false;
      const grid = game.spatialGrid;
      if (grid) {
        const nearby = grid.queryByType(newX, newY, 1.0, 'warrior');
        for (const other of nearby) {
          if (other === v || other.hidden) continue;
          if (other.id > v.id) continue;
          if (isInActiveCombat(other)) continue;
          const ox = newX - other.x;
          const oy = newY - other.y;
          if (ox * ox + oy * oy < 0.64) { blocked = true; break; }
        }
      } else {
        for (const other of vm.villagers.values()) {
          if (other === v || other.hidden || other.job !== 'warrior') continue;
          if (other.id > v.id) continue;
          if (isInActiveCombat(other)) continue;
          const ox = newX - other.x;
          const oy = newY - other.y;
          if (ox * ox + oy * oy < 0.64) { blocked = true; break; }
        }
      }

      if (!blocked) {
        v.x = newX;
        v.y = newY;
        v.renderX = newX;
        v.renderY = newY;
      }
      v.targetX = tx;
      v.targetY = ty;

      return dist <= 1.0;
    }

    // ==========================================================
    // Kampf auslösen (Staubwolke erscheint für beide Seiten)
    // ==========================================================
    function startCombat(v, raider) {
      const now = performance.now();
      const winChance = v.winChanceRaider !== undefined ? v.winChanceRaider : 0.60;

      v._combatWin = Math.random() < winChance;
      v._combatUntil = now + COMBAT_DURATION_MS;
      v._combatTargetId = raider.id;

      raider._combatUntil = now + COMBAT_DURATION_MS;
      raider._combatWith = v.id;
      raider._combatTargetId = v.id;
      raider._combatWin = !v._combatWin;

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
    }

    // ==========================================================
    // Kampf auswerten (nach Ablauf von _combatUntil)
    // ==========================================================
    function resolveCombat(v, raider) {
      const now = performance.now();
      const targetAlive = raider && !raider.dead;

      // Todeswolke
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

      if (v._combatWin && targetAlive) {
        rv.markWarriorDead(raider.id);
        raider._combatUntil = 0;
        raider._combatWith = undefined;
        raider._combatTargetId = undefined;
        clearWarriorsTargetingRaider(raider.id);
        if (renderer && renderer.spawnHarvestParticles) {
          renderer.spawnHarvestParticles(Math.floor(raider.x), Math.floor(raider.y), 'stone');
        }
        if (vm && typeof vm.addKill === 'function') {
          vm.addKill(v);
        }
      } else if (v._combatWin && !targetAlive) {
        clearWarriorsTargetingRaider(raider.id);
      } else {
        spawnMist(v.x, v.y);
        clearRaiderTargetingWarrior(v.id);
        vm.killVillager(v);
        if (audioManager) audioManager.playOneShot('audio/schrei.mp3');
        return;
      }

      v._combatUntil = 0;
      v._combatWin = undefined;
      v._combatTargetId = undefined;
    }

    function triggerStaggerForRaid(now) {
      const byBuilding = new Map();

      for (const v of vm.villagers.values()) {
        if (v.job !== 'warrior') continue;
        if (!v._raidQueued) continue;
        if (v.state !== 'working') continue;
        if (v._attackStartAt > 0) continue;
        if (v._raidLaunchDone) continue;

        const bid = v.warriorBuildingId || 0;
        let arr = byBuilding.get(bid);
        if (!arr) { arr = []; byBuilding.set(bid, arr); }
        arr.push(v);
      }

      if (byBuilding.size === 0) return;

      for (const [bid, warriors] of byBuilding) {
        const building = bid ? world.buildings.get(bid) : null;
        if (!building) continue;

        const allOrder = vm._getCombatOrder(building);
        const selected = [];
        for (const wid of allOrder) {
          const w = vm.villagers.get(wid);
          if (!w) continue;
          if (!w._raidQueued) continue;
          if (w.state !== 'working') continue;
          if (w._attackStartAt > 0) continue;
          if (w._raidLaunchDone) continue;
          selected.push(w);
        }

        for (let i = 0; i < selected.length; i++) {
          const w = selected[i];
          const delayIdx = Math.min(i, ATTACK_STAGGER_MAX);

          w._attackStartAt = now + delayIdx * ATTACK_STAGGER_MS;
          w._vPosition = i;
          w.hidden = true;

          w.x = building.x + (building.w || 1) / 2;
          w.y = building.y + (building.h || 1) / 2;
          w.renderX = w.x;
          w.renderY = w.y;
          w.targetX = w.x;
          w.targetY = w.y;
          w.moveDuration = 0;
        }
      }
    }

    function launchFighter(v) {
      const building = v.warriorBuildingId ? world.buildings.get(v.warriorBuildingId) : null;
      if (building) {
        const center = rv.getCenter();
        let dirX = 0, dirY = -1;
        if (center) {
          const bx = building.x + (building.w || 1) / 2;
          const by = building.y + (building.h || 1) / 2;
          const ddx = center.x - bx;
          const ddy = center.y - by;
          const dl = Math.sqrt(ddx * ddx + ddy * ddy);
          if (dl > 0.001) {
            dirX = ddx / dl;
            dirY = ddy / dl;
          }
        }
        const slotIdx = v._vPosition >= 0 ? v._vPosition : 0;
        const pos = getPositionInBuilding(building, slotIdx, dirX, dirY);
        v.x = pos.x;
        v.y = pos.y;
        v.targetX = pos.x;
        v.targetY = pos.y;
        v.renderX = pos.x;
        v.renderY = pos.y;
      }

      v.hidden = false;
      v.asset = 'images/villager-krieger-rot.webp';
      v._attackStartAt = 0;
      v._vPosition = -1;
      v._raidQueued = false;
      v._raidLaunchDone = true;
      v.state = 'vfightback';
    }

    function updateDefender(v, dtSec) {
      const now = performance.now();

      // Läuft bereits ein Kampf für diesen Krieger?
      if (v._combatUntil && v._combatUntil > now) {
        // Warten bis Kampfzeit abgelaufen
        v.renderX = v.x;
        v.renderY = v.y;
        v.hidden = false;
        v.asset = 'images/villager-krieger-rot.webp';
        return;
      }

      // Kampf abgelaufen → auswerten
      if (v._combatUntil && v._combatUntil <= now) {
        let raider = v._combatTargetId !== undefined
          ? rv.warriors.get(v._combatTargetId)
          : null;
        if (!raider) {
          v._combatUntil = 0;
          v._combatWin = undefined;
          v._combatTargetId = undefined;
        } else {
          resolveCombat(v, raider);
          return;
        }
      }

      if (!anyRaiderInPlayerTerritory()) {
        startReturnToPost(v);
        return;
      }

      const raider = findNearestRaiderInPlayerTerritory(v.x, v.y, 30);
      if (!raider) {
        startReturnToPost(v);
        return;
      }

      const dx = raider.x - v.x;
      const dy = raider.y - v.y;
      const distSq = dx * dx + dy * dy;

      if (distSq <= COLLISION_DIST_SQ) {
        startCombat(v, raider);
        v.renderX = v.x;
        v.renderY = v.y;
        return;
      }

      moveWarriorToward(v, raider.x, raider.y, dtSec);
      v.renderX = v.x;
      v.renderY = v.y;
    }

    function updateFighter(v, dtSec) {
      const now = performance.now();

      if (v._combatUntil && v._combatUntil > now) {
        v.renderX = v.x;
        v.renderY = v.y;
        v.hidden = false;
        v.asset = 'images/villager-krieger-rot.webp';
        return;
      }

      if (v._combatUntil && v._combatUntil <= now) {
        let raider = v._combatTargetId !== undefined
          ? rv.warriors.get(v._combatTargetId)
          : null;
        if (!raider) {
          v._combatUntil = 0;
          v._combatWin = undefined;
          v._combatTargetId = undefined;
        } else {
          resolveCombat(v, raider);
          return;
        }
      }

      const isInside = rv.isInRaiderTerritory(v.x, v.y);
      const hasRaiders = rv.raidersInTerritoryCache.length > 0;

      if (rv.isDestroyed || (isInside && !hasRaiders)) {
        startReturnToPost(v);
        return;
      }

      const raider = isInside ? findNearestCachedRaider(v.x, v.y) : null;

      if (!raider) {
        const center = rv.getCenter();
        if (center) {
          moveWarriorToward(v, center.x, center.y, dtSec);
        }
        return;
      }

      const dx = raider.x - v.x;
      const dy = raider.y - v.y;
      const distSq = dx * dx + dy * dy;

      if (distSq <= COLLISION_DIST_SQ) {
        startCombat(v, raider);
        v.renderX = v.x;
        v.renderY = v.y;
        return;
      }

      moveWarriorToward(v, raider.x, raider.y, dtSec);
      v.renderX = v.x;
      v.renderY = v.y;
    }

    function checkAutoDefend() {
      const hasIntruder = anyRaiderInPlayerTerritory();
      if (!hasIntruder) return;

      const dm = game.dragonManager;
      if (dm && dm.dragons) {
        for (const d of dm.dragons) {
          if (d.state === 'grounded') return;
        }
      }

      for (const v of vm.villagers.values()) {
        if (v.job !== 'warrior') continue;
        if (v.state === 'dragon_attack') continue;
        if (v.state === 'vfightback') continue;
        if (v.state === 'vdefend') continue;
        if (v.state === 'moving' && v.task === 'returning_to_post') continue;
        if (v.state === 'returning_to_post') continue;

        if (v.state === 'working' || v.state === 'idle') {
          v.state = 'vdefend';
        }
      }
    }

    function updateAttackTimerFreeze() {
      const raidActiveNow = anyWarriorInRaid() || anyWarriorStaggered();

      if (raidActiveNow && !playerRaidActive) {
        playerRaidActive = true;
        raidOutcomeProcessed = false;
        rv.freezeAttackTimer();
      } else if (!raidActiveNow && playerRaidActive) {
        playerRaidActive = false;
        rv.unfreezeAttackTimer();
      }
    }

    function update(dt) {
      if (world.castleId === null) return;

      const dtSec = dt / 1000;
      const now = performance.now();

      updateAttackTimerFreeze();

      if (rv.isDestroyed) {
        for (const v of vm.villagers.values()) {
          if (v.job !== 'warrior') continue;
          if (v.state === 'vdefend' || v.state === 'vfightback' || v.state === 'attacking_raiders') {
            startReturnToPost(v);
          }
        }
        return;
      }

      checkAutoDefend();

      triggerStaggerForRaid(now);

      for (const v of vm.villagers.values()) {
        if (v.job !== 'warrior') continue;
        if (v.state !== 'working') continue;
        if (!v._raidQueued) continue;
        if (v._raidLaunchDone) continue;

        if (v._attackStartAt > 0 && now >= v._attackStartAt) {
          launchFighter(v);
        }
      }

      attackersInRaid = [];
      for (const v of vm.villagers.values()) {
        if (v.job === 'warrior' && (v.state === 'vfightback' || v.state === 'vfighting') && v._raidLaunchDone) {
          attackersInRaid.push(v);
        }
      }

      if (playerRaidActive && !raidOutcomeProcessed) {
        if (attackersInRaid.length === 0 && !anyWarriorStaggered()) {
          raidOutcomeProcessed = true;
          showToast(Game.Lang.t('combat_attack_running'), '#ff6b6b');
          playerRaidActive = false;
          rv.unfreezeAttackTimer();
        }
        else if (attackersInRaid.length > 0 &&
                 rv.raidersInTerritoryCache.length === 0 &&
                 rv.isInRaiderTerritory(attackersInRaid[0].x, attackersInRaid[0].y)) {
          raidOutcomeProcessed = true;
          showToast(Game.Lang.t('combat_victory'), '#7ad07a');
          playerRaidActive = false;
          rv.unfreezeAttackTimer();
        }
      }

      for (const v of vm.villagers.values()) {
        if (v.job !== 'warrior') continue;
        if (!vm.villagers.has(v.id)) continue;
        if (v.state === 'dragon_attack') continue;

        if (v.state === 'moving' && v.task === 'returning_to_post') {
          v.hidden = false;
          v.asset = 'images/villager-krieger-rot.webp';
          continue;
        }

        if (v.state === 'vdefend') {
          v.hidden = false;
          v.asset = 'images/villager-krieger-rot.webp';
          updateDefender(v, dtSec);
          continue;
        }

        if (v.state === 'vfightback') {
          v.hidden = false;
          v.asset = 'images/villager-krieger-rot.webp';
          updateFighter(v, dtSec);
          continue;
        }
      }
    }

    function reset() {
      playerRaidActive = false;
      raidOutcomeProcessed = false;
      attackersInRaid = [];
    }

    return { update, reset };
  }
};
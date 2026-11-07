window.Game = window.Game || {};

Game.GameLoop = function(world, ticker, vm, economy, renderer, uiCallbacks) {
  const { refreshInfoPanel, refreshInfoPanelThrottled } = uiCallbacks;
  let wasUnderAttack = false;
  let wasTerritorySafe = true;

  function isTerritorySafe() {
    if (world.zombieManager) {
      for (const z of world.zombieManager.zombies) {
        if (z.state === 'dead') continue;
        if (world.isInTerritory(z.x, z.y)) return false;
      }
    }

    if (world._raiderVillage && !world._raiderVillage.isDestroyed) {
      for (const w of world._raiderVillage.warriors.values()) {
        if (w.dead || w.hidden) continue;
        if (world.isInTerritory(w.x, w.y)) return false;
      }
    }

    if (world.dragonAttackActive && world._dragonManager) {
      const d = world._dragonManager.dragon;
      if (d && d.crossedBorder) return false;
    }

    return true;
  }

  ticker.onTick((tick) => {
    
    // ==========================================================
    // DRACHEN-PANIK LOGIK & RESET
    // ==========================================================
    const dm = window.Game.state && window.Game.state.dragonManager;
    const dragon = dm ? dm.dragon : null;
    const isDragonAttack = world.dragonAttackActive === true && dragon && dragon.crossedBorder === true;
    
    if (isDragonAttack) {
      wasUnderAttack = true;
      for (const v of vm.villagers.values()) {
        if (v.job === 'warrior') continue;
        
        let isArcher = false;
        if (v.job === 'worker' && v.workplaceId) {
          const b = world.buildings.get(v.workplaceId);
          if (b && b.def.hasArrowTower) isArcher = true;
        }
        if (isArcher) continue;

        if (v.state === 'zfighting' || v.state === 'dragon_attack' || v.state === 'dead') continue; 
        
        if (v.task !== 'go_home' && v.state !== 'idle') {
          v.state = 'idle';
          v.task = 'go_home';
          const home = world.buildings.get(v.homeId) || world.buildings.get(world.castleId);
          if (home) {
             vm.startMove(v, home.x, home.y + (home.h || 1) - 1);
          }
        }
        
        if (v.workplaceId) {
            const b = world.buildings.get(v.workplaceId);
            if (b) {
                if (b.workerId === v.id) b.workerId = null;
                if (b.logisticsId === v.id) {
                    b.logisticsId = null;
                    b.isBeingCollected = false;
                }
            }
            v.workplaceId = null;
            v.job = 'free';
        }
        v.isLogistics = false;
        v.carrying = null;
        v.recipeCarrying = null;
      }
    } else if (wasUnderAttack) {
      wasUnderAttack = false;
      console.log("🐉 Drachenangriff vorbei. Dorfbewohner kehren zur Arbeit zurück.");
      
      for (const v of vm.villagers.values()) {
        if (v.job === 'free' && v.task === 'go_home') {
          v.task = null;
          v.state = 'idle';
        }
      }

      for (const b of world.buildings.values()) {
        if (!b.built || b.ruined) continue;
        if (b.workerId === null) {
          const isJobBuilding = b.def.produces || b.def.recipe || b.def.generatesResource
            || b.def.hasArrowTower
            || b.def.id === 'lumberjack' || b.def.id === 'quarry' || b.def.id === 'fisher'
            || b.def.id === 'forsthaus';
            
          if (isJobBuilding && !world.freeJobs.has(b)) {
            world.freeJobs.add(b);
          }
        }
      }

      // Referenzen in den Gebäuden prüfen (Leichen entfernen)
      for (const b of world.buildings.values()) {
        if (b.warriorSlots) {
          for (let i = 0; i < b.warriorSlots.length; i++) {
            const wid = b.warriorSlots[i];
            if (wid !== null && !vm.villagers.has(wid)) b.warriorSlots[i] = null;
          }
        }
        if (b.residents && b.residents.length > 0) {
          for (let i = b.residents.length - 1; i >= 0; i--) {
            if (!vm.villagers.has(b.residents[i])) b.residents.splice(i, 1);
          }
        }
        if (b.workerId !== null && !vm.villagers.has(b.workerId)) {
          b.workerId = null;
          world.freeJobs.add(b);
        }
      }
    }
    
    // ==========================================================

    const allVillagers = vm.getAllVillagers().filter(v =>
      v.state !== 'attacking_raiders' &&
      v.state !== 'vfightback' &&
      v.state !== 'vdefend' &&
      v.state !== 'vfighting' &&
      v.state !== 'zfighting' &&
      v.state !== 'dragon_attack'
    );

    for (const v of vm.getAllVillagers()) {
      if (v.job === 'warrior' && v.state === 'working') {
        // Sichtbarkeit wird von villagers.js geregelt
      }
    }

    // === 1. Baustellen + Reparaturen ===
    for (const b of world.buildSites) {
      if (b.ruined && isDragonAttack) continue; 
      
      if (b.isBeingRepaired && b.builderId !== null) {
        const builder = vm.villagers.get(b.builderId);
        const isValidBuilder = builder && (
          builder.task === 'repair_fetch_storage' ||
          builder.task === 'repair_return' ||
          builder.state === 'repairing'
        );
        
        if (!isValidBuilder) {
          b.isBeingRepaired = false;
          b.builderId = null;
          b.progress = 0;
        }
      }
      
      if (b.builderId === null) continue;
      const builder = vm.villagers.get(b.builderId);
      if (!builder) continue;
      
      if (isDragonAttack && !b.ruined) {
         b.builderId = null;
         builder.state = 'idle';
         builder.task = 'go_home';
         continue;
      }

      if (b.isBeingRepaired) {
        if (builder.state === 'repairing') {
          b.progress = (b.progress || 0) + 1;
          if (b.progress >= b.buildTime) {
            b.ruined = false;
            b.isBeingRepaired = false;
            b.progress = 0;
            b.builderId = null;
            world.onBuildingComplete(b);
            builder.state = 'idle';
            builder.task = null;
            builder._repairBuildingId = null;
            const tiles = world.getBuildingTiles(b);
            renderer.markStaticDirty(tiles);
            world.invalidateTerritoryCache();
          }
        }
        continue;
      }

      if (builder.state === 'building') {
        b.progress++;
        if (b.progress >= b.buildTime) {
          world.onBuildingComplete(b);
          builder.state = 'idle'; builder.task = null; builder.buildTargetId = null;
          b.builderId = null;
          const tiles = world.getBuildingTiles(b);
          renderer.markStaticDirty(tiles);
        }
      }
    }

   // === 2. Sanity-Check (alle 5 Ticks) ===
if (tick % 5 === 0) {
  for (const b of world.buildings.values()) {
    if (b.warriorSlots) {
      for (let i = 0; i < b.warriorSlots.length; i++) {
        const id = b.warriorSlots[i];
        if (id !== null && !vm.villagers.has(id)) b.warriorSlots[i] = null;
      }
    }
    if (b.residents && b.residents.length > 0) {
      for (let i = b.residents.length - 1; i >= 0; i--) {
        if (!vm.villagers.has(b.residents[i])) b.residents.splice(i, 1);
      }
    }

    if (b.workerId !== null && !vm.villagers.has(b.workerId)) {
      b.workerId = null;
      if (b.built && (b.def.produces || b.def.recipe || b.def.generatesResource
          || b.def.hasArrowTower
          || b.def.id === 'lumberjack' || b.def.id === 'quarry' || b.def.id === 'fisher'
          || b.def.id === 'forsthaus')) {
        if (!world.freeJobs.has(b)) {
          world.freeJobs.add(b);
        }
      }
      if (b.fishPendingFetch) {
        b.fishPendingFetch = false;
        b.fishRetryTimer = -30;
      }
      if (b.fetchingArrows) b.fetchingArrows = false;
    }
    if (b.builderId !== null && !vm.villagers.has(b.builderId)) b.builderId = null;
    if (b.recipeFetchWorkerId !== null && !vm.villagers.has(b.recipeFetchWorkerId)) b.recipeFetchWorkerId = null;
    if (b.logisticsId !== null && !vm.villagers.has(b.logisticsId)) {
      b.logisticsId = null;
      b.isBeingCollected = false;
    }
  }

  for (const b of world.freeJobs) {
    if (b.workerId !== null) {
      world.freeJobs.delete(b);
    }
  }
}

    // === 2b. TÜRME AUFFÜLLEN (alle 5 Ticks) ===
    if (tick % 5 === 0 && !isDragonAttack) {
      // Performance: Nur wenn es freie Bürger gibt
      if (vm._idleVillagers.size > 0) {
        let freeVillagersCache = null;

        for (const b of world.warriorBuildings) {
          if (!b.built || b.ruined) continue;
          if (!b.warriorSlots) continue;

          // Prüfen, ob es leere Slots gibt
          let hasEmptySlot = false;
          for (let i = 0; i < b.warriorSlots.length; i++) {
            if (b.warriorSlots[i] === null) { hasEmptySlot = true; break; }
          }
          if (!hasEmptySlot) continue;

          // Erst bei Bedarf den Cache aufbauen
          if (!freeVillagersCache) {
            freeVillagersCache = [];
            for (const v of vm.villagers.values()) {
              if (v.job === 'free' && v.state === 'idle' && v.hidden && !v.reservedLogistics) {
                freeVillagersCache.push(v);
              }
            }
          }

          // Zuweisen, bis keine freien Bürger mehr da sind
          while (freeVillagersCache.length > 0 && hasEmptySlot) {
            const v = freeVillagersCache.shift();
            if (!vm.assignWarriorSlot(b, v)) break;

            v.job = 'warrior';
            v.workplaceId = b.id;
            v.warriorBuildingId = b.id;
            v.state = 'working';
            v.hidden = true;
            v.task = null;
            vm._idleVillagers.delete(v.id);

            // Aus Haus-Residents entfernen
            const home = world.buildings.get(v.homeId);
            if (home && home.residents) {
              const idx = home.residents.indexOf(v.id);
              if (idx !== -1) home.residents.splice(idx, 1);
            }

            // Prüfen, ob noch leere Slots
            hasEmptySlot = false;
            for (let i = 0; i < b.warriorSlots.length; i++) {
              if (b.warriorSlots[i] === null) { hasEmptySlot = true; break; }
            }
          }

          if (freeVillagersCache.length === 0) break;
        }
      }
    }

    // === 3. FISCH-KONSUM & NACHSSCHUB ===
    if (!isDragonAttack && tick % 5 === 0) {
      for (const b of world.fishConsumers) {
        if (!b.built) continue;
        if (b.paused) continue;
        if (b.workerId === null) continue;

        const worker = vm.villagers.get(b.workerId);
        if (!worker) continue;

        b.fishConsumeTimer -= 5;

        if (b.fishSlots === 0 && !b.fishPendingFetch && b.fishRetryTimer < 0) {
          b.fishRetryTimer += 5;
        }

        if (worker.state === 'working' && b.fishConsumeTimer <= 0) {
          if (b.fishSlots > 0) {
            b.fishSlots -= 1;
            b.fishConsumeTimer = 45;
            worker._fishHungry = false;
          } else {
            worker._fishHungry = true;
          }
        }

        if (b.fishSlots === 0 && !b.fishPendingFetch && b.fishRetryTimer >= 0) {
          if ((economy.res.fish || 0) > 0) {
            let best = null, bestDistSq = Infinity;
            for (const s of world.dropoffBuildings) {
              const bx = s.x, by = s.y + (s.h || 1) - 1;
              const dx = bx - worker.x, dy = by - worker.y;
              const distSq = dx * dx + dy * dy;
              if (distSq < bestDistSq) { bestDistSq = distSq; best = s; }
            }
            if (best) {
              vm._releaseReservations(worker);
              worker.harvestHitCount = 0;
              worker.harvestTotalCount = 0;
              worker.harvestExclude = null;

              worker.task = 'fetch_fish_storage';
              worker.state = 'moving';
              worker.workplaceId = b.id;
              b.fishPendingFetch = true;
              vm.startMove(worker, best.x, best.y + (best.h || 1) - 1);
            }
          } else {
            b.fishRetryTimer = -30;
          }
        }
      }
    }

    // === 4a. Feldwachstum ===
    if (!isDragonAttack) {
      for (const b of world.producingBuildings) {
        if (!b.built) continue;
        if (b.paused) continue;
        if (!b.def.produces) continue;
        if (b.workerId === null) continue;
        if (b.fields.length === 0) continue;

        const worker = vm.villagers.get(b.workerId);
        if (!worker) continue;
        if (worker.state !== 'working' || worker.workplaceId !== b.id) continue;

        if (b.storage >= b.maxCapacity) continue;

        const effFactor = !b.def.consumesFish ? 1 : (b.fishSlots > 0 ? 1 : 0.25);
        b.fieldAccum = (b.fieldAccum || 0) + effFactor;

        while (b.fieldAccum >= 1) {
          b.fieldAccum -= 1;
          for (const field of b.fields) {
            if (field.state === 'growing') {
              field.timer++;
              if (field.timer >= 30) { field.state = 'ready'; field.timer = 0; }
            }
          }
        }

        if (!worker.task && b.storage < b.maxCapacity && b.fields.some(f => f.state === 'ready')) {
          vm.triggerHarvestRoute(worker, b);
        }
      }
    }

    // === 4b. Lumberjack / Quarry / Fisher / Forsthaus ===
    if (!isDragonAttack) {
      for (const b of world.producingBuildings) {
        if (!b.built) continue;
        if (b.paused) continue;
        if (b.workerId === null) continue;

        const id = b.def.id;
        if (id !== 'lumberjack' && id !== 'quarry' && id !== 'fisher' && id !== 'forsthaus') continue;

        const worker = vm.villagers.get(b.workerId);
        if (!worker) continue;
        if (worker.state !== 'working' || worker.workplaceId !== b.id) continue;

        const now = performance.now();

        if (id === 'lumberjack' || id === 'quarry' || id === 'fisher') {
          if (b.storage < b.maxCapacity && (!b.harvestCooldownUntil || now >= b.harvestCooldownUntil)) {
            if (id === 'lumberjack') vm.triggerTreeHarvest(worker, b);
            else if (id === 'quarry') vm.triggerStoneHarvest(worker, b);
            else if (id === 'fisher') {
              b.harvestCooldownUntil = 0; 
              worker._fishHungry = false;
              vm.triggerFishHarvest(worker, b);
            }
          }
        } else if (id === 'forsthaus') {
          vm.triggerForestPlant(worker, b);
        }
      }
    }

    // === 4c. Recipe-isActive ===
    for (const b of world.recipeBuildings) {
      if (!b.built) continue;
      
      if (isDragonAttack) { b.isActive = false; continue; }

      if (b.paused) { b.isActive = false; continue; }
      if (b.workerId === null) { b.isActive = false; continue; }

      const worker = vm.villagers.get(b.workerId);
      if (!worker) { b.isActive = false; continue; }

      let canProduce = true;
      for (const k in b.def.recipe.inputs) {
        if ((b.recipeStorage[k] || 0) < b.def.recipe.inputs[k]) { canProduce = false; break; }
      }

      const storageHasSpace = b.storage < b.maxCapacity;

      let belowArrowStop = true;
      if (b.def.hasArrowStop) {
        const threshold = b.arrowStopThreshold !== undefined ? b.arrowStopThreshold : 500;
        if ((economy.res.arrows || 0) >= threshold) {
          belowArrowStop = false;
        }
      }

      b.isActive = canProduce && storageHasSpace && belowArrowStop;
    }

    // === 5. Logistik (alle 2 Ticks) ===
    if (!isDragonAttack && tick % 2 === 0) {
      const stats = world._stats;
      let resourcePriority = {};
      if (stats) {
        resourcePriority = stats.getResourcePriority(300);
      }

      const freeVillagersForLogistics = [];
      for (const v of allVillagers) {
        if (v.reservedLogistics && v.job === 'free' && v.state === 'idle' && !v.task && !v.carrying && !v.recipeCarrying) {
          freeVillagersForLogistics.push(v);
        }
      }
      for (const v of allVillagers) {
        if (v.job === 'free' && v.state === 'idle' && !v.task && !v.carrying && !v.recipeCarrying && !v.reservedLogistics) {
          freeVillagersForLogistics.push(v);
        }
      }

      if (freeVillagersForLogistics.length > 0) {
        const allLogisticsBuildings = [];
        for (const b of world.producingBuildings) allLogisticsBuildings.push(b);
        for (const b of world.recipeBuildings) allLogisticsBuildings.push(b);
        for (const b of world.generatingBuildings) allLogisticsBuildings.push(b);

        const candidates = [];

        for (const b of allLogisticsBuildings) {
          if (!b.built) continue;
          if (b.reportThreshold <= 0) continue;
          if (b.storage < b.reportThreshold) continue;
          
          if (b.isBeingCollected) {
            const logi = b.logisticsId ? vm.villagers.get(b.logisticsId) : null;
            if (!logi || (logi.task !== 'go_to_pickup' && logi.task !== 'go_to_dropoff')) {
              b.isBeingCollected = false;
              b.logisticsId = null;
            } else {
              continue;
            }
          }

          let outRes = null;
          if (b.def.recipe) outRes = b.def.recipe.output;
          else if (b.def.produces) outRes = b.def.produces;
          else if (b.def.generatesResource) outRes = b.def.generatesResource;
          else if (b.def.id === 'lumberjack') outRes = 'wood';
          else if (b.def.id === 'quarry') outRes = 'stone';
          else if (b.def.id === 'fisher') outRes = 'fish';

          if (!outRes) continue;

          const currentStock = economy.res[outRes] || 0;
          const isEmpty = currentStock <= 0;
          const statPriority = resourcePriority[outRes] || 0;

          candidates.push({ building: b, outRes, isEmpty, statPriority });
        }

        candidates.sort((a, b) => {
          if (a.isEmpty !== b.isEmpty) return a.isEmpty ? -1 : 1;
          if (b.statPriority !== a.statPriority) return b.statPriority - a.statPriority;
          const v = freeVillagersForLogistics[0];
          const da = Math.pow(a.building.x - v.x, 2) + Math.pow(a.building.y - v.y, 2);
          const db = Math.pow(b.building.x - v.x, 2) + Math.pow(b.building.y - v.y, 2);
          return da - db;
        });

        let villagerIndex = 0;
        for (const c of candidates) {
          if (villagerIndex >= freeVillagersForLogistics.length) break;
          const v = freeVillagersForLogistics[villagerIndex];
          const b = c.building;
          if (b.isBeingCollected) continue;

          b.isBeingCollected = true;
          b.logisticsId = v.id;
          v.task = 'go_to_pickup';
          v.workplaceId = b.id;
          v.isLogistics = true;
          v.hidden = false;
          v.renderX = v.x;
          v.renderY = v.y;
          vm.startMove(v, b.x, b.y + (b.h || 1) - 1);
          villagerIndex++;
        }
      }
    }

    // === 6. Brunnen ===
    if (!isDragonAttack) {
      for (const b of world.generatingBuildings) {
        if (b.paused) continue;
        if (b.workerId === null) continue;
        const effFactor = !b.def.consumesFish ? 1 : (b.fishSlots > 0 ? 1 : 0.25);
        b.generatesTimer = (b.generatesTimer || 0) + effFactor;
        if (b.generatesTimer >= b.def.generatesInterval) {
          b.generatesTimer = 0;
          b.storage = Math.min(b.maxCapacity, b.storage + b.def.generatesAmount);
        }
      }
    }

    // === 6b. Verteidigungstürme (Bogenschussanlage) ===
    const safeNow = isTerritorySafe();
    const justBecameSafe = safeNow && !wasTerritorySafe;
    wasTerritorySafe = safeNow;

    if (justBecameSafe) {
      for (const b of world.arrowBuildings) {
        if (!b.built) continue;
        if (b.paused) continue;
        if (b.workerId === null) continue;
        
        const localArrows = b.arrowStorage || 0;
        const maxLocal = b.maxArrowStorage || 20;
        
        if (localArrows < maxLocal) {
          b.fetchingArrows = false;
        }
      }
    }

    const dragonManager = window.Game.state && window.Game.state.dragonManager;
    const dragonForTowers = dragonManager ? dragonManager.dragon : null;
    const dragonAttackable = dragonForTowers && (dragonForTowers.state === 'flying' || dragonForTowers.state === 'attacking');

    for (const b of world.arrowBuildings) {
      if (!b.built) continue;
      if (b.paused) continue;
      if (b.workerId === null) continue;

      const worker = vm.villagers.get(b.workerId);
      if (!worker) continue;

      const maxLocal = b.maxArrowStorage || 20;
      const localArrows = b.arrowStorage || 0;
      
      const needsRefill = safeNow && localArrows < maxLocal;

      if (!isDragonAttack 
          && needsRefill
          && !b.fetchingArrows
          && worker.state === 'working'
          && !worker.task
          && (economy.res.arrows || 0) > 0) {
        let best = null, bestDistSq = Infinity;
        for (const s of world.dropoffBuildings) {
          const bx = s.x, by = s.y + (s.h || 1) - 1;
          const dx = bx - worker.x, dy = by - worker.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < bestDistSq) { bestDistSq = distSq; best = s; }
        }
        if (best) {
          b.fetchingArrows = true;
          worker.task = 'fetch_arrows_storage';
          worker.state = 'moving';
          worker.workplaceId = b.id;
          vm.startMove(worker, best.x, best.y + (best.h || 1) - 1);
          continue;
        }
      }

      const dtMs = 1000;
      b.arrowTowerCooldown = (b.arrowTowerCooldown || 0) - dtMs;
      if (b.arrowTowerCooldown > 0) continue;

      const range = b.def.attackRange || 10;
      const rangeSq = range * range;
      const bx = b.x + (b.w || 1) / 2;
      const by = b.y + (b.h || 1) / 2;

      let target = null;
      let targetType = null;
      let bestDistSq = rangeSq;

      if (dragonAttackable) {
        const dx = dragonForTowers.x - bx;
        const dy = dragonForTowers.y - by;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestDistSq) {
          bestDistSq = d2;
          target = dragonForTowers;
          targetType = 'dragon';
        }
      }

      if (world.zombieManager) {
        for (const z of world.zombieManager.zombies) {
          if (z.state === 'dead') continue;
          const dx = z.x - bx;
          const dy = z.y - by;
          const d2 = dx * dx + dy * dy;
          if (d2 < bestDistSq) {
            bestDistSq = d2;
            target = z;
            targetType = 'zombie';
          }
        }
      }

      if (world._raiderVillage) {
        for (const w of world._raiderVillage.warriors.values()) {
          if (w.dead || w.hidden) continue;
          if (!w.inAttack && w.state === 'idle') continue;
          const dx = w.x - bx;
          const dy = w.y - by;
          const d2 = dx * dx + dy * dy;
          if (d2 < bestDistSq) {
            bestDistSq = d2;
            target = w;
            targetType = 'raider';
          }
        }
      }

      if (!target) continue;

      if ((b.arrowStorage || 0) < 1) {
        b.arrowTowerCooldown = 0;
        continue;
      }

      b.arrowStorage -= 1;

      const dist = Math.sqrt(bestDistSq);

      let didHit;
      if (targetType === 'dragon') {
        didHit = dragonManager.tryArrowHit();
      } else {
        const hitChanceBase = b.def.hitChanceBase ?? 1.00;
        const hitChancePerTile = b.def.hitChancePerTile ?? 0.10;
        const hitChanceMin = b.def.hitChanceMin ?? 0.10;
        const hitChance = Math.max(hitChanceMin, hitChanceBase - dist * hitChancePerTile);
        didHit = Math.random() < hitChance;
      }

      const targetSnapshot = target;
      const typeSnapshot = targetType;
      const onImpact = () => {
        if (!didHit) return;

        if (typeSnapshot === 'zombie') {
          if (targetSnapshot.state === 'dead') return;
          targetSnapshot.state = 'dead';
          if (world.zombieManager && world.zombieManager.onZombieKilled) {
            world.zombieManager.onZombieKilled(targetSnapshot);
          }
        } else if (typeSnapshot === 'raider') {
          const rv = world._raiderVillage;
          if (!rv) return;
          const w = rv.getWarrior(targetSnapshot.id);
          if (!w || w.dead) return;
          rv.markWarriorDead(targetSnapshot.id);
        }
      };

      if (renderer && typeof renderer.spawnArrow === 'function') {
        renderer.spawnArrow(bx, by, target.x, target.y, didHit, onImpact);
      } else {
        onImpact();
      }

      b.arrowTowerCooldown = b.def.fireInterval || 1000;
    }

    // === 6c. Krieger → Drache am Boden ===
    if (dragon && dragon.state === 'grounded') {
      for (const v of vm.villagers.values()) {
        if (v.job !== 'warrior') continue;
        if (v.state === 'dragon_attack') continue;
        if (v.state === 'attacking_raiders' || v.state === 'vfightback' || v.state === 'vdefend' || v.state === 'vfighting') continue;
        if (v.state === 'working' || v.state === 'idle' || v.state === 'returning_to_post') {
          v.state = 'dragon_attack';
        }
      }
    }

    // === 7. Rezepte ===
    if (!isDragonAttack && tick % 5 === 0) {
      for (const b of world.recipeBuildings) {
        if (!b.built) continue;
        if (b.paused) continue;
        if (b.workerId === null) continue;
        const worker = vm.villagers.get(b.workerId);
        if (!worker) continue;

        if (b.def.hasArrowStop) {
          const threshold = b.arrowStopThreshold !== undefined ? b.arrowStopThreshold : 500;
          if ((economy.res.arrows || 0) >= threshold) {
            b.recipeTimer = 0;
            continue;
          }
        }

        let needsFetch = false;
        for (const k in b.def.recipe.inputs) {
          if ((b.recipeStorage[k] || 0) < b.def.recipe.inputs[k]) { needsFetch = true; break; }
        }

        if (needsFetch && !b.recipeFetchWorkerId) {
          let anyAvailable = false;
          for (const k in b.def.recipe.inputs) {
            if ((economy.res[k] || 0) > 0) { anyAvailable = true; break; }
          }
          if (anyAvailable) {
            let best = null, bestDistSq = Infinity;
            for (const s of world.dropoffBuildings) {
              const bx = s.x, by = s.y + (s.h || 1) - 1;
              const dx = bx - worker.x, dy = by - worker.y;
              const distSq = dx * dx + dy * dy;
              if (distSq < bestDistSq) { bestDistSq = distSq; best = s; }
            }
            if (best) {
              worker.task = 'recipe_fetch_storage'; worker.state = 'moving';
              worker.workplaceId = b.id; b.recipeFetchWorkerId = worker.id;
              vm.startMove(worker, best.x, best.y + (best.h || 1) - 1);
            }
          }
        }

        if (!needsFetch && worker.state === 'working') {
          b.recipeTimer = (b.recipeTimer || 0) + 5;
          const interval = b.def.recipeInterval || 30;
          if (b.recipeTimer >= interval) {
            b.recipeTimer = 0;
            for (const k in b.def.recipe.inputs) b.recipeStorage[k] -= b.def.recipe.inputs[k];
            b.storage = (b.storage || 0) + b.def.recipe.amount;
            if (b.storage > b.maxCapacity) b.storage = b.maxCapacity;
          }
        }

        if (b.recipeFetchWorkerId) {
          const w = vm.villagers.get(b.recipeFetchWorkerId);
          if (!w || w.state !== 'moving') b.recipeFetchWorkerId = null;
        }
      }
    }

    // === 8. Bier ===
    if (!isDragonAttack && tick % 2 === 0) {
      for (const b of world.beerBuildings) {
        if (!b.built) continue;
        if (b.paused) continue;
        if (b.beerStorage >= b.maxBeer) continue;
        if (b.beerRefillCooldown > 0) { b.beerRefillCooldown--; continue; }
        if (economy.res.beer > 0) {
          const space = b.maxBeer - b.beerStorage;
          const take = Math.min(space, economy.res.beer);
          economy.res.beer -= take; b.beerStorage += take;
          if (economy.onChange) economy.onChange();
        }
        b.beerRefillCooldown = 2;
      }
    }

    // === 9. Bier-Konsum ===
    if (tick % 5 === 0) {
      for (const v of allVillagers) {
        if (v.job !== 'warrior') continue;
        if (v.state !== 'working') continue;
        if (!v.warriorBuildingId) continue;
        const wb = world.buildings.get(v.warriorBuildingId);
        if (!wb || !wb.built) continue;
        if (wb.paused) continue;

        if (v.beerBuffTimer > 0) {
          v.beerBuffTimer -= 5;
          if (v.beerBuffTimer <= 0) v.beerBuff = false;
        }

        v.beerDrinkTimer = (v.beerDrinkTimer || 0) + 5;
        if (v.beerDrinkTimer < 90) continue;
        v.beerDrinkTimer = 0;
        if (wb.beerStorage > 0) { wb.beerStorage -= 1; v.beerBuff = true; v.beerBuffTimer = 90; }
      }
    }

    if (!isDragonAttack) {
      for (const b of world.beerBuildings) {
        if (!b.built || b.paused) continue;
        if (b.beerStorage <= 0) continue;

        if (b.warriorSlots) {
          for (const wid of b.warriorSlots) {
            if (wid === null) continue;
            const v = vm.villagers.get(wid);
            if (!v) continue;
            if (v.job !== 'warrior') continue;
            if (v.state !== 'working') continue;

            if (!v.beerBuff && b.beerStorage > 0) {
              b.beerStorage -= 1;
              v.beerBuff = true;
              v.beerBuffTimer = 90;
              v.beerDrinkTimer = 0;
            }
          }
        }
      }
    }

    // === 10. Einwohner-Produktion ===
    if (!isDragonAttack) {
      for (const b of world.houses) {
        if (!b.built) continue;
        if (b.paused) continue;
        if (b.ruined) continue; 

        if (b.residents && b.residents.length > 0) {
          for (let i = b.residents.length - 1; i >= 0; i--) {
            const rid = b.residents[i];
            const v = vm.villagers.get(rid);
            if (!v || v.job === 'warrior' || v.workplaceId !== null) {
              b.residents.splice(i, 1);
            }
          }
        }

        const maxRes = b.def.maxResidents || 5;

        let totalResidents = b.residents.length;
        if (b.warriorSlots) {
          for (const wid of b.warriorSlots) {
            if (wid !== null) totalResidents++;
          }
        }

        if (totalResidents >= maxRes) {
          b.spawnTimer = 0;
          continue;
        }

        if ((economy.res.bread || 0) <= 0 && (economy.res.meat || 0) <= 0) {
          b.spawnTimer = 0;
          continue;
        }

        b.spawnTimer = (b.spawnTimer || 0) + 1;
        if (b.spawnTimer < 30) continue;

        b.spawnTimer = 0;

        const spawnY = b.y + (b.h || 1) - 1;
        const v = vm.spawn(b.x, spawnY, 'free', b.id);

        if (b.maxWarriors > 0 && b.warriorSlots) {
          if (vm.assignWarriorSlot(b, v)) {
            v.job = 'warrior';
            v.workplaceId = b.id;
            v.warriorBuildingId = b.id;
            v.state = 'working';
          } else {
            b.residents.push(v.id);
          }
        } else {
          b.residents.push(v.id);
        }
      }
    }

    // ⚠️ 1-Minuten-Abgleich der Krieger-Slots
    if (tick % 60 === 0) {
      const now = performance.now();
      
      for (const v of vm.villagers.values()) {
        if (v.job !== 'warrior') continue;
        
        if (v.state === 'returning_to_post') {
          if (!v._returningSince) {
            v._returningSince = now;
          } else if (now - v._returningSince > 120000) {
            console.log(`⚠️ Krieger ${v.name} hing 120s in returning_to_post. Setze zurück.`);
            v.state = 'idle';
            v._returningSince = null;
            vm._idleVillagers.add(v.id);
            continue;
          } else {
            continue;
          }
        } else {
          v._returningSince = null;
        }
        
        if (v.state === 'vfightback' || v.state === 'vfighting' || v.state === 'vdefend' ||
            v.state === 'zfighting' || v.state === 'dragon_attack' || 
            v.state === 'attacking_raiders') {
          continue;
        }
        
        if (v.state === 'moving' && v.task === 'go_to_warrior_post') {
          continue;
        }

        let actualBuilding = null;
        let actualSlot = -1;

        for (const b of world.warriorBuildings) {
          if (!b.warriorSlots) continue;
          const idx = b.warriorSlots.indexOf(v.id);
          if (idx !== -1) {
            if (!actualBuilding) {
              actualBuilding = b;
              actualSlot = idx;
            } else {
              b.warriorSlots[idx] = null;
            }
          }
        }

        if (actualBuilding) {
          v.warriorBuildingId = actualBuilding.id;
          v.warriorSlotIndex = actualSlot;
          v.state = 'working';
        } else {
          v.job = 'free';
          v.state = 'idle';
          v.warriorBuildingId = null;
          v.warriorSlotIndex = -1;
          if (vm._idleVillagers) vm._idleVillagers.add(v.id);
        }
      }

      for (const b of world.warriorBuildings) {
        if (!b.warriorSlots) continue;
        for (let i = 0; i < b.warriorSlots.length; i++) {
          const wid = b.warriorSlots[i];
          if (wid === null) continue;
          if (!vm.villagers.has(wid)) {
            b.warriorSlots[i] = null;
          }
        }
      }
    }

    refreshInfoPanelThrottled(tick);
  });
};
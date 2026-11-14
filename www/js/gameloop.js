window.Game = window.Game || {};

Game.GameLoop = function(world, ticker, vm, economy, renderer, uiCallbacks) {
  const { refreshInfoPanel, refreshInfoPanelThrottled } = uiCallbacks;

  // ══════════════════════════════════════════════════════════════════════════
  // ZUSTAND (wird über Ticks hinweg gehalten)
  // ══════════════════════════════════════════════════════════════════════════
  let wasUnderAttack = false;
  let wasTerritorySafe = true;
  let _prioCheckTimer = 0;


  // ══════════════════════════════════════════════════════════════════════════
  // HILFSFUNKTIONEN
  // ══════════════════════════════════════════════════════════════════════════

  // ── isTerritorySafe ───────────────────────────────────────────────────────
  // Prüft, ob aktuell Feinde (Zombies, Räuber, Drachen) im Territorium sind.
  // ──────────────────────────────────────────────────────────────────────────
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
      const dm = world._dragonManager;
      if (dm.dragons && dm.dragons.length > 0) {
        for (const d of dm.dragons) {
          if (d.crossedBorder) return false;
        }
      }
    }

    return true;
  }

  // ── detectDragonAttack ────────────────────────────────────────────────────
  // Prüft, ob ein Drache die Grenze überschritten hat, und gibt das Ergebnis
  // zurück. Setzt bei Bedarf game.dragonPanicActive.
  // ──────────────────────────────────────────────────────────────────────────
  function detectDragonAttack() {
    const dm = window.Game.state && window.Game.state.dragonManager;
    let isDragonAttack = false;
    let primaryDragon = null;

    if (dm && dm.dragons && dm.dragons.length > 0) {
      for (const d of dm.dragons) {
        if (d.crossedBorder) {
          isDragonAttack = true;
          primaryDragon = d;
          break;
        }
      }
    }

    if (isDragonAttack) {
      window.Game.state.dragonPanicActive = true;
    }

    return { isDragonAttack, primaryDragon };
  }


  // ══════════════════════════════════════════════════════════════════════════
  // BLOCK 1: DRACHENANGRIFF-ERKENNUNG
  // ══════════════════════════════════════════════════════════════════════════
  // Wenn ein Drache die Grenze überschritten hat:
  //   - Alle Nicht-Kämpfer (außer Bogenschützen und Feuerwehrleute) nach Hause
  //   - Arbeitsplätze freigeben
  //   - game.dragonPanicActive setzen
  // ══════════════════════════════════════════════════════════════════════════
  function blockDragonAttackDetection(isDragonAttack) {
    if (!isDragonAttack) return;

    wasUnderAttack = true;

    for (const v of vm.villagers.values()) {
      if (v.job === 'warrior') continue;

      let isArcher = false;
      if (v.job === 'worker' && v.workplaceId) {
        const b = world.buildings.get(v.workplaceId);
        if (b && b.def.hasArrowTower) isArcher = true;
      }
      if (isArcher) continue;

      let isFirefighter = false;
if (v.job === 'worker' && v.workplaceId) {
  const b = world.buildings.get(v.workplaceId);
  if (b && b.def.id === 'fireStation') isFirefighter = true;
}
if (isFirefighter) continue;

// ── NEU: Magier nicht nach Hause schicken ────────────────────────────
// MageCombat kümmert sich um ihn, er bleibt im Turm oder kämpft.
let isMage = false;
if (v.job === 'worker' && v.workplaceId) {
  const b = world.buildings.get(v.workplaceId);
  if (b && b.def.id === 'magierturm') isMage = true;
}
if (isMage) continue;

      if (v.state === 'zfighting' || v.state === 'dragon_attack' || v.state === 'dead') continue;
      if (v.state === 'sick_treating') continue;

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
          if (b.workerIds) {
            const idx = b.workerIds.indexOf(v.id);
            if (idx !== -1) b.workerIds[idx] = null;
          }
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
  }


  // ══════════════════════════════════════════════════════════════════════════
  // BLOCK 2: DRACHENANGRIFF-ENDE
  // ══════════════════════════════════════════════════════════════════════════
  // Wenn der Angriff vorbei ist:
  //   - game.dragonPanicActive zurücksetzen
  //   - Villager von "go_home" befreien
  //   - Tote Villager aus allen Slots räumen
  // ══════════════════════════════════════════════════════════════════════════
  function blockDragonAttackEnd(isDragonAttack) {
    if (isDragonAttack) return;
    if (!wasUnderAttack) return;

    wasUnderAttack = false;
    window.Game.state.dragonPanicActive = false;

    console.log("Drachenangriff vorbei. Dorfbewohner kehren zur Arbeit zurueck.");

    for (const v of vm.villagers.values()) {
      if (v.job === 'free' && v.task === 'go_home') {
        v.task = null;
        v.state = 'idle';
      }
    }

    for (const b of world.buildings.values()) {
      if (b.warriorSlots) {
        for (let i = 0; i < b.warriorSlots.length; i++) {
          const wid = b.warriorSlots[i];
          if (wid !== null && !vm.villagers.has(wid)) b.warriorSlots[i] = null;
        }
      }
      if (b.workerIds) {
        for (let i = 0; i < b.workerIds.length; i++) {
          if (b.workerIds[i] !== null && !vm.villagers.has(b.workerIds[i])) b.workerIds[i] = null;
        }
      }
      if (b.residents && b.residents.length > 0) {
        for (let i = b.residents.length - 1; i >= 0; i--) {
          if (!vm.villagers.has(b.residents[i])) b.residents.splice(i, 1);
        }
      }
      if (b.workerId !== null && !vm.villagers.has(b.workerId)) {
        b.workerId = null;
      }
    }
  }


  // ══════════════════════════════════════════════════════════════════════════
  // BLOCK 3: BAUSTELLEN-FORTSCHRITT
  // ══════════════════════════════════════════════════════════════════════════
  // Treibt Neubauten und Reparaturen voran.
  // ══════════════════════════════════════════════════════════════════════════
  function blockBuildSites(isDragonAttack) {
    for (const b of world.buildSites) {
      if (b.ruined && isDragonAttack) continue;

      // Reparatur-Validierung
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

      // Reparatur-Fortschritt
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

      // Neubau-Fortschritt
      if (builder.state === 'building') {
        b.progress++;
        if (b.progress >= b.buildTime) {
          world.onBuildingComplete(b);
          builder.state = 'idle';
          builder.task = null;
          builder.buildTargetId = null;
          b.builderId = null;
          const tiles = world.getBuildingTiles(b);
          renderer.markStaticDirty(tiles);
        }
      }
    }
  }


  // ══════════════════════════════════════════════════════════════════════════
  // BLOCK 4: SLOT-AUFRÄUMEN (alle 5 Ticks)
  // ══════════════════════════════════════════════════════════════════════════
  // Entfernt IDs von toten Villagern aus warriorSlots, workerIds, residents
  // und anderen Feldern.
  // ══════════════════════════════════════════════════════════════════════════
  function blockSlotCleanup(tick) {
    if (tick % 5 !== 0) return;

    for (const b of world.buildings.values()) {
      if (b.warriorSlots) {
        for (let i = 0; i < b.warriorSlots.length; i++) {
          const id = b.warriorSlots[i];
          if (id !== null && !vm.villagers.has(id)) b.warriorSlots[i] = null;
        }
      }
      if (b.workerIds) {
        for (let i = 0; i < b.workerIds.length; i++) {
          if (b.workerIds[i] !== null && !vm.villagers.has(b.workerIds[i])) b.workerIds[i] = null;
        }
      }
      if (b.residents && b.residents.length > 0) {
        for (let i = b.residents.length - 1; i >= 0; i--) {
          if (!vm.villagers.has(b.residents[i])) b.residents.splice(i, 1);
        }
      }
      if (b.workerId !== null && !vm.villagers.has(b.workerId)) {
        b.workerId = null;
      }
      if (b.builderId !== null && !vm.villagers.has(b.builderId)) b.builderId = null;
      if (b.recipeFetchWorkerId !== null && !vm.villagers.has(b.recipeFetchWorkerId)) b.recipeFetchWorkerId = null;
      if (b.logisticsId !== null && !vm.villagers.has(b.logisticsId)) {
        b.logisticsId = null;
        b.isBeingCollected = false;
      }
      if (b.def.id === 'arztpraxis' && b.fetchAntibioticWorkerId !== null && !vm.villagers.has(b.fetchAntibioticWorkerId)) {
        b.fetchAntibioticWorkerId = null;
      }
    }
  }


  // ══════════════════════════════════════════════════════════════════════════
  // BLOCK 5: FISCH-VERBRAUCH
  // ══════════════════════════════════════════════════════════════════════════
  // Fischkonsum in fishConsumers-Gebäuden: Slots runterzählen, Nachschub holen.
  // ══════════════════════════════════════════════════════════════════════════
  function blockFishConsumption(tick, isDragonAttack) {
    if (isDragonAttack || tick % 5 !== 0) return;

    for (const b of world.fishConsumers) {
      if (!b.built) continue;
      if (b.paused) continue;
      if (b.workerId === null) continue;

      const worker = vm.villagers.get(b.workerId);
      if (!worker) continue;

      const effSpeed = vm.getEffectiveWorkSpeed(worker);
      b.fishConsumeTimer -= 5 * effSpeed;

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


  // ══════════════════════════════════════════════════════════════════════════
  // BLOCK 6: FELDER-WACHSTUM
  // ══════════════════════════════════════════════════════════════════════════
  // Lässt Felder von producingBuildings wachsen (growing → ready).
  // ══════════════════════════════════════════════════════════════════════════
  function blockFieldGrowth(isDragonAttack) {
    if (isDragonAttack) return;

    const plagueMgr = window.Game.state && window.Game.state.plagueManager;
    const isPigPlagueActive = plagueMgr && plagueMgr.isActive(performance.now()) && plagueMgr.activeType === 'pig';
    const isDroughtActive = plagueMgr && plagueMgr.isActive(performance.now()) && plagueMgr.activeType === 'drought';
    if (isPigPlagueActive || isDroughtActive) return;

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


  // ══════════════════════════════════════════════════════════════════════════
  // BLOCK 7: HARVEST-TRIGGER (Holzfäller / Steinmetz / Fischer / Forsthaus)
  // ══════════════════════════════════════════════════════════════════════════
  // Ruft die entsprechenden vm.trigger*-Funktionen auf.
  // ══════════════════════════════════════════════════════════════════════════
  function blockHarvestTriggers(isDragonAttack) {
    if (isDragonAttack) return;

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


  // ══════════════════════════════════════════════════════════════════════════
  // BLOCK 8: REZEPTGEBÄUDE-AKTIVITÄT
  // ══════════════════════════════════════════════════════════════════════════
  // Setzt b.isActive für alle recipeBuildings.
  // ══════════════════════════════════════════════════════════════════════════
  function blockRecipeActivity(isDragonAttack) {
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
  }


  // ══════════════════════════════════════════════════════════════════════════
  // BLOCK 9: LOGISTIK / TRANSPORT-PRIORITÄTEN
  // ══════════════════════════════════════════════════════════════════════════
  // Verteilt freie Villager als Logistiker auf Gebäude mit vollem Lager,
  // sortiert nach playerTransportPriorities + Statistik-Priorität.
  // ══════════════════════════════════════════════════════════════════════════
  function blockLogistics(tick, isDragonAttack, allVillagers) {
    if (isDragonAttack || tick % 2 !== 0) return;

    const stats = world._stats;
    let resourcePriority = {};
    if (stats) {
      resourcePriority = stats.getResourcePriority(300);
    }

    const playerTransportPriorities = window.Game.state && window.Game.state.resourceTransportPriorities
      ? window.Game.state.resourceTransportPriorities
      : [];

    const freeVillagersForLogistics = [];
    for (const v of allVillagers) {
      if (v.job === 'worker' && v.workplaceId) {
        const wb = world.buildings.get(v.workplaceId);
        if (wb && (wb.def.id === 'fireStation' || wb.def.id === 'arztpraxis')) continue;
      }
      if (v.reservedLogistics && v.job === 'free' && v.state === 'idle' && !v.task && !v.carrying && !v.recipeCarrying) {
        if (v.isSick) continue;
        freeVillagersForLogistics.push(v);
      }
    }
    for (const v of allVillagers) {
      if (v.job === 'worker' && v.workplaceId) {
        const wb = world.buildings.get(v.workplaceId);
        if (wb && (wb.def.id === 'fireStation' || wb.def.id === 'arztpraxis')) continue;
      }
      if (v.job === 'free' && v.state === 'idle' && !v.task && !v.carrying && !v.recipeCarrying && !v.reservedLogistics) {
        if (v.isSick) continue;
        freeVillagersForLogistics.push(v);
      }
    }

    if (freeVillagersForLogistics.length === 0) return;

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

      let playerPrioIndex = playerTransportPriorities.indexOf(outRes);
      if (playerPrioIndex === -1) playerPrioIndex = 999;

      candidates.push({ building: b, outRes, isEmpty, statPriority, playerPrioIndex });
    }

    candidates.sort((a, b) => {
      if (a.playerPrioIndex !== b.playerPrioIndex) {
        return a.playerPrioIndex - b.playerPrioIndex;
      }
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


  // ══════════════════════════════════════════════════════════════════════════
  // BLOCK 10: BRUNNEN-PRODUKTION
  // ══════════════════════════════════════════════════════════════════════════
  // generatingBuildings (z. B. Brunnen) produzieren Ressourcen über Zeit.
  // ══════════════════════════════════════════════════════════════════════════
  function blockWellProduction(isDragonAttack) {
    if (isDragonAttack) return;

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


  // ══════════════════════════════════════════════════════════════════════════
  // BLOCK 11: FEUERWEHR-NACHFÜLLER
  // ══════════════════════════════════════════════════════════════════════════
  // Schickt Nachfüller zur Wache, wenn der Tank nicht voll ist.
  // ══════════════════════════════════════════════════════════════════════════
  function blockFireStationRefill(isDragonAttack) {
    if (isDragonAttack) return;

    const fireMgr = window.Game.state && window.Game.state.fireManager;
    if (!fireMgr) return;

    const now = performance.now();
    const anyFireActive = fireMgr.activeFires && fireMgr.activeFires.length > 0;
    const globalWater = economy.res.water || 0;

    const waterShortage = globalWater < 50;
    const bakeriesNeedWater = waterShortage && !anyFireActive && fireMgr.isWaterNeededByBakeries();

    for (const b of world.buildings.values()) {
      if (!b.built || b.def.id !== 'fireStation' || b.ruined || b.paused) continue;
      if (!b.workerIds) continue;

      const maxW = b.def.maxWaterStorage || 250;
      const currentWater = b.storage || 0;

      if (currentWater >= maxW) continue;
      if (globalWater <= 0) continue;
      if (bakeriesNeedWater) continue;

      for (const wid of b.workerIds) {
        if (wid === null) continue;
        const w = vm.villagers.get(wid);
        if (!w) continue;
        if (w._fireStationRole !== 'refill') continue;
        if (w.state !== 'working' || w.task) continue;
        if (w.isSick) continue;
        if (w._recoverUntil && now < w._recoverUntil) continue;
        if (Math.abs(w.renderX - w.x) > 0.01 || Math.abs(w.renderY - w.y) > 0.01) continue;
        if (w._lastFireDispatchTime && now - w._lastFireDispatchTime < 500) continue;

        vm.triggerWaterRefill(w, b);
        w._lastFireDispatchTime = now;
        break;
      }
    }
  }


  // ══════════════════════════════════════════════════════════════════════════
  // BLOCK 12: PFEILTÜRME
  // ══════════════════════════════════════════════════════════════════════════
  // Pfeiltürme suchen Ziele (Drache > Zombie > Räuber), schießen Pfeile,
  // und holen Nachschub, wenn das lokale Lager leer ist.
  // ══════════════════════════════════════════════════════════════════════════
  function blockArrowTowers(safeNow) {
    const dragonManager = window.Game.state && window.Game.state.dragonManager;

    const flyingDragons = [];
    if (dragonManager && dragonManager.dragons) {
      for (const d of dragonManager.dragons) {
        if (d.state === 'flying' || d.state === 'attacking') {
          flyingDragons.push(d);
        }
      }
    }

    for (const b of world.arrowBuildings) {
      if (!b.built) continue;
      if (b.paused) continue;
      if (b.workerId === null) continue;

      const worker = vm.villagers.get(b.workerId);
      if (!worker) continue;

      const maxLocal = b.maxArrowStorage || 20;
      const localArrows = b.arrowStorage || 0;
      const needsRefill = safeNow && localArrows < maxLocal;

      // ── Nachschub holen ──────────────────────────────────────────────────
      if (needsRefill
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

      // ── Schuss-Cooldown ──────────────────────────────────────────────────
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

      // ── Ziel: Drache ─────────────────────────────────────────────────────
      if (flyingDragons.length > 0) {
        for (const d of flyingDragons) {
          const dx = d.x - bx;
          const dy = d.y - by;
          const d2 = dx * dx + dy * dy;
          if (d2 < bestDistSq) {
            bestDistSq = d2;
            target = d;
            targetType = 'dragon';
          }
        }
      }

      // ── Ziel: Zombie ─────────────────────────────────────────────────────
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

      // ── Ziel: Räuber ─────────────────────────────────────────────────────
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
        didHit = dragonManager.tryArrowHit(target);
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
  }


  // ══════════════════════════════════════════════════════════════════════════
  // BLOCK 13: DRACHEN-BODENKAMPF-TRIGGER
  // ══════════════════════════════════════════════════════════════════════════
  // Wenn ein Drache am Boden ist, schicken wir alle verfügbaren Krieger
  // in den Kampf.
  // ══════════════════════════════════════════════════════════════════════════
  function blockDragonGroundCombat() {
    const dragonManager = window.Game.state && window.Game.state.dragonManager;
    if (!dragonManager || !dragonManager.dragons) return;

    let hasGrounded = false;
    for (const d of dragonManager.dragons) {
      if (d.state === 'grounded') { hasGrounded = true; break; }
    }
    if (!hasGrounded) return;

    for (const v of vm.villagers.values()) {
      if (v.job !== 'warrior') continue;
      if (v.state === 'dragon_attack') continue;
      if (v.state === 'attacking_raiders' || v.state === 'vfightback' || v.state === 'vdefend' || v.state === 'vfighting') continue;
      if (v.state === 'working' || v.state === 'idle' || v.state === 'returning_to_post') {
        v.state = 'dragon_attack';
      }
    }
  }


  // ══════════════════════════════════════════════════════════════════════════
  // BLOCK 14: REZEPT-PRODUKTION
  // ══════════════════════════════════════════════════════════════════════════
  // Führt Rezepte in recipeBuildings aus (Zutaten → Output).
  // ══════════════════════════════════════════════════════════════════════════
  function blockRecipeProduction(tick, isDragonAttack) {
    if (isDragonAttack || tick % 5 !== 0) return;

    const plagueMgr = window.Game.state && window.Game.state.plagueManager;
    const nowPl = performance.now();

    for (const b of world.recipeBuildings) {
      if (!b.built) continue;
      if (b.paused) continue;
      if (b.workerId === null) continue;

      // Schweinepest: Schweinewirte pausiert
      if (plagueMgr && plagueMgr.isActive(nowPl) && plagueMgr.activeType === 'pig' && b.def.id === 'pigFarm') {
        b.recipeTimer = 0;
        continue;
      }

      const worker = vm.villagers.get(b.workerId);
      if (!worker) continue;

      // Arrow-Stop
      if (b.def.hasArrowStop) {
        const threshold = b.arrowStopThreshold !== undefined ? b.arrowStopThreshold : 500;
        if ((economy.res.arrows || 0) >= threshold) {
          b.recipeTimer = 0;
          continue;
        }
      }

      // Zutaten prüfen
      let needsFetch = false;
      for (const k in b.def.recipe.inputs) {
        if ((b.recipeStorage[k] || 0) < b.def.recipe.inputs[k]) { needsFetch = true; break; }
      }

      // Zutaten holen
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
            worker.task = 'recipe_fetch_storage';
            worker.state = 'moving';
            worker.workplaceId = b.id;
            b.recipeFetchWorkerId = worker.id;
            vm.startMove(worker, best.x, best.y + (best.h || 1) - 1);
          }
        }
      }

      // Produzieren
      if (!needsFetch && worker.state === 'working') {
        const effSpeed = vm.getEffectiveWorkSpeed(worker);
        b.recipeTimer = (b.recipeTimer || 0) + 5 * effSpeed;
        const interval = b.def.recipeInterval || 30;

        if (b.recipeTimer >= interval) {
          b.recipeTimer = 0;
          for (const k in b.def.recipe.inputs) b.recipeStorage[k] -= b.def.recipe.inputs[k];

          let outputAmount = b.def.recipe.amount;
          if (plagueMgr && plagueMgr.isActive(nowPl) && plagueMgr.activeType === 'rat' && b.def.id === 'bakery') {
            outputAmount = outputAmount * 0.5;
          }

          b.storage = (b.storage || 0) + outputAmount;
          if (b.storage > b.maxCapacity) b.storage = b.maxCapacity;
        }
      }

      // Fetch-Worker-Status prüfen
      if (b.recipeFetchWorkerId) {
        const w = vm.villagers.get(b.recipeFetchWorkerId);
        if (!w || w.state !== 'moving') b.recipeFetchWorkerId = null;
      }
    }
  }


  // ══════════════════════════════════════════════════════════════════════════
  // BLOCK 15: BIER-VERTEILUNG
  // ══════════════════════════════════════════════════════════════════════════
  // Bier aus dem globalen Lager in beerBuildings füllen und an Krieger verteilen.
  // ══════════════════════════════════════════════════════════════════════════
  function blockBeerDistribution(tick, isDragonAttack) {
    if (isDragonAttack) return;

    // ── 15a: Bier-Lager auffüllen (alle 2 Ticks) ────────────────────────────
    if (tick % 2 === 0) {
      for (const b of world.beerBuildings) {
        if (!b.built) continue;
        if (b.paused) continue;
        if (b.beerStorage >= b.maxBeer) continue;
        if (b.beerRefillCooldown > 0) { b.beerRefillCooldown--; continue; }
        if (economy.res.beer > 0) {
          const space = b.maxBeer - b.beerStorage;
          const take = Math.min(space, economy.res.beer);
          economy.res.beer -= take;
          b.beerStorage += take;
          if (economy.onChange) economy.onChange();
        }
        b.beerRefillCooldown = 2;
      }
    }

    // ── 15b: Krieger trinken (alle 5 Ticks) ─────────────────────────────────
    if (tick % 5 === 0) {
      for (const v of vm.villagers.values()) {
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
        if (wb.beerStorage > 0) {
          wb.beerStorage -= 1;
          v.beerBuff = true;
          v.beerBuffTimer = 90;
        }
      }
    }

    // ── 15c: Sofort-Bier an frisch stationierte Krieger ─────────────────────
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


  // ══════════════════════════════════════════════════════════════════════════
  // BLOCK 16: HAUS-BEWOHNER-SPAWN
  // ══════════════════════════════════════════════════════════════════════════
  // Häuser spawnen neue Villager, wenn genug Nahrung da ist.
  // ══════════════════════════════════════════════════════════════════════════
  function blockHouseSpawning(isDragonAttack) {
    if (isDragonAttack) return;

    for (const b of world.houses) {
      if (!b.built) continue;
      if (b.paused) continue;
      if (b.ruined) continue;

      // Tote Bewohner entfernen
      if (b.residents && b.residents.length > 0) {
        for (let i = b.residents.length - 1; i >= 0; i--) {
          const rid = b.residents[i];
          const v = vm.villagers.get(rid);
          if (!v || v.job === 'warrior' || v.workplaceId !== null) {
            b.residents.splice(i, 1);
          }
        }
      }

      // Kapazität prüfen
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

      // Nahrung prüfen
      if ((economy.res.bread || 0) <= 0 && (economy.res.meat || 0) <= 0) {
        b.spawnTimer = 0;
        continue;
      }

      // Spawn-Timer
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
          v.task = 'go_to_warrior_post';
          v.hidden = false;
          v.state = 'idle';
          vm.startMove(v, b.x, b.y + (b.h || 1) - 1);
        } else {
          b.residents.push(v.id);
        }
      } else {
        b.residents.push(v.id);
      }
    }
  }


  // ══════════════════════════════════════════════════════════════════════════
  // BLOCK 17: KRIEGER-SANITY-CHECK (alle 60 Ticks)
  // ══════════════════════════════════════════════════════════════════════════
  // Krieger, die in "returning_to_post" hängen, werden zurückgesetzt.
  // Krieger, die keinem Posten mehr zugeordnet sind, werden freigegeben.
  // ══════════════════════════════════════════════════════════════════════════
  function blockWarriorSanity(tick) {
    if (tick % 60 !== 0) return;

    const now = performance.now();

    for (const v of vm.villagers.values()) {
      if (v.job !== 'warrior') continue;

      // Hängt in returning_to_post?
      if (v.state === 'returning_to_post') {
        if (!v._returningSince) {
          v._returningSince = now;
        } else if (now - v._returningSince > 300000) {
          console.log(`Krieger ${v.name} hing 300s in returning_to_post. Setze zurueck.`);
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

      // Im Kampf? Überspringen
      if (v.state === 'vfightback' || v.state === 'vfighting' || v.state === 'vdefend' ||
          v.state === 'zfighting' || v.state === 'dragon_attack' ||
          v.state === 'attacking_raiders') {
        continue;
      }

      if (v.state === 'moving' && (v.task === 'go_to_warrior_post' || v.task === 'returning_to_post')) {
        continue;
      }

      // Posten-Zuordnung prüfen
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

    // Tote IDs aus warriorSlots entfernen
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


  // ══════════════════════════════════════════════════════════════════════════
  // HAUPT-TICK
  // ══════════════════════════════════════════════════════════════════════════
  // Ruft die Blöcke in der richtigen Reihenfolge auf. Die Reihenfolge ist
  // wichtig, weil spätere Blöcke auf den Zustand früherer Blöcke zugreifen
  // (z. B. `isDragonAttack`, `allVillagers`, `safeNow`).
  // ══════════════════════════════════════════════════════════════════════════
  ticker.onTick((tick) => {

    // ── Vorbereitung ─────────────────────────────────────────────────────────
    if (world.zombieManager) {
      world.zombieManager.updateInfectionStatus(performance.now());
    }

    const sicknessMgr = window.Game.state && window.Game.state.sicknessManager;
    if (sicknessMgr) {
      sicknessMgr.update(performance.now());
    }

    const { isDragonAttack } = detectDragonAttack();

    // ── Block 1 + 2: Drachenangriff-Erkennung + Ende ────────────────────────
    blockDragonAttackDetection(isDragonAttack);
    blockDragonAttackEnd(isDragonAttack);

    // ── allVillagers-Snapshot (für Logistik-Block) ──────────────────────────
    const allVillagers = vm.getAllVillagers().filter(v =>
      v.state !== 'attacking_raiders' &&
      v.state !== 'vfightback' &&
      v.state !== 'vdefend' &&
      v.state !== 'vfighting' &&
      v.state !== 'zfighting' &&
      v.state !== 'dragon_attack'
    );

    // ── Block 3: Baustellen ─────────────────────────────────────────────────
    blockBuildSites(isDragonAttack);

    // ── Block 4: Slot-Aufräumen ─────────────────────────────────────────────
    blockSlotCleanup(tick);

    // ── Block 5: Fisch-Verbrauch ────────────────────────────────────────────
    blockFishConsumption(tick, isDragonAttack);

    // ── Block 6: Felder-Wachstum ────────────────────────────────────────────
    blockFieldGrowth(isDragonAttack);

    // ── Block 7: Harvest-Trigger ────────────────────────────────────────────
    blockHarvestTriggers(isDragonAttack);

    // ── Block 8: Rezeptgebäude-Aktivität ────────────────────────────────────
    blockRecipeActivity(isDragonAttack);

    // ── Block 9: Logistik ───────────────────────────────────────────────────
    blockLogistics(tick, isDragonAttack, allVillagers);

    // ── Block 10: Brunnen-Produktion ────────────────────────────────────────
    blockWellProduction(isDragonAttack);

    // ── Block 11: Feuerwehr-Nachfüller ──────────────────────────────────────
    blockFireStationRefill(isDragonAttack);

    // ── safeNow berechnen (für Block 12 + 13) ───────────────────────────────
    const safeNow = isTerritorySafe();
    const justBecameSafe = safeNow && !wasTerritorySafe;
    wasTerritorySafe = safeNow;

    // Arrow-Fetch-Reset bei gerade-sicher-geworden
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

    // ── Block 12: Pfeiltürme ────────────────────────────────────────────────
    blockArrowTowers(safeNow);

    // ── Block 13: Drachen-Bodenkampf ────────────────────────────────────────
    blockDragonGroundCombat();

    // ── Block 14: Rezept-Produktion ─────────────────────────────────────────
    blockRecipeProduction(tick, isDragonAttack);

    // ── Block 15: Bier-Verteilung ───────────────────────────────────────────
    blockBeerDistribution(tick, isDragonAttack);

    // ── Block 16: Haus-Bewohner-Spawn ───────────────────────────────────────
    blockHouseSpawning(isDragonAttack);

    // ── Block 17: Krieger-Sanity ────────────────────────────────────────────
    blockWarriorSanity(tick);

    // ── Abschluss ───────────────────────────────────────────────────────────
    refreshInfoPanelThrottled(tick);
  });
};
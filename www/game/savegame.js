window.Game = window.Game || {};

Game.SaveGame = {
  async serialize(game) {
    const progress = (pct, text) => {
      const el = document.getElementById('loadingBarFill');
      const txt = document.getElementById('loadingText');
      if (el) el.style.width = pct + '%';
      if (txt) txt.textContent = text + ` (${pct}%)`;
      return new Promise(r => setTimeout(r, 0));
    };

    const now = performance.now();

    const saveData = {
      timestamp: Date.now(),
      map: {
        width: game.world.width,
        height: game.world.height,
        grid: game.world.grid
      },
      economy: JSON.parse(JSON.stringify(game.economy.res)),

      trees: [],
      growingTrees: [],
      stones: Array.from(game.world.stones.values()).map(s => ({
        cx: s.cx,
        cy: s.cy,
        capacity: s.capacity,
        maxCapacity: s.maxCapacity
      })),
      fishWaterTiles: Array.from(game.world.fishWaterTiles.values()).map(f => ({
        x: f.x, y: f.y,
        remaining: f.remaining,
        cooldownRemaining: Math.max(0, f.cooldownUntil - now)
      })),
      decorations: [],

      buildings: [],
      villagers: [],
      zombies: [],
      raiders: null,
      gravestones: JSON.parse(JSON.stringify(game.gravestones)),
      dragon: null,
      plagues: null,
      fires: null,
      earthquakes: null,
      sickness: null,

      gameState: {
        castleId: game.world.castleId,
        nextBuildingId: game.world.nextBuildingId,
        nextVillagerId: game.vm.nextId,
        nextZombieId: game.zombieManager ? game.zombieManager.nextId : 1,
        firstZombieSpawn: game.firstZombieSpawn,
        zombieInfects: !!game.zombieInfects,
        zombieInfectsDelayed: !!game.zombieInfectsDelayed,
        zombieInfectiousAtRemaining: game.zombieManager && game.zombieManager.infectiousAt > 0
          ? Math.max(0, game.zombieManager.infectiousAt - now)
          : 0,
        zombieVirusEvolvedFired: game.zombieManager ? !!game.zombieManager._virusEvolvedFired : false,
        zombieDifficulty: game.zombieDifficulty,
        raidersEnabled: game.raidersEnabled,
        dragonEnabled: !!game.dragonEnabled,
        raiderNextId: game.raiderVillage ? game.raiderVillage.nextWarriorId : 1,
        zombieSpawnCooldownRemaining: game.zombieManager
          ? Math.max(0, (game.zombieManager.spawnCooldown || 0) * 1000)
          : 0,
        zombieFirstSpawnDone: game.zombieManager ? !!game.zombieManager.firstSpawnDone : false,
        autosaveEnabled: !!game.autosaveEnabled,
        raiderFirstSpawnAtRemaining: Math.max(0, (game.raiderFirstSpawnAt || 0) - now),
        lastAutosaveTimeRemaining: Math.max(0, (game.lastAutosaveTime || 0) - now)
      },

      enemyStats: JSON.parse(JSON.stringify(game.enemyStats || {})),
      productionStats: JSON.parse(JSON.stringify(game.productionStats || {}))
    };

    for (const t of game.world.trees.values()) {
      if (t.growthUntil !== null) {
        saveData.growingTrees.push({ x: t.x, y: t.y });
      } else {
        saveData.trees.push({ x: t.x, y: t.y });
      }
    }

    const decoSeen = new Set();
    for (const d of game.world.decorations.values()) {
      const key = d.x + ',' + d.y + ',' + d.id;
      if (!decoSeen.has(key)) {
        decoSeen.add(key);
        saveData.decorations.push({ id: d.id, x: d.x, y: d.y });
      }
    }

    await progress(10, "Gebäude sichern...");
    for (const b of game.world.buildings.values()) {
      const bData = { ...b, def: b.def.id };
      bData.fields = b.fields.map(f => ({ x: f.x, y: f.y, timer: f.timer, state: f.state }));
      bData._residents = b.residents ? [...b.residents] : [];
      bData._warriorSlots = b.warriorSlots ? [...b.warriorSlots] : [];
      bData.ruined = !!b.ruined;
      bData.isBeingRepaired = !!b.isBeingRepaired;
      bData.dragonHits = b.dragonHits || 0;
      bData.repairCostCache = b.repairCostCache ? { ...b.repairCostCache } : null;
      bData.repairWaiting = !!b.repairWaiting;

      bData.lastDispatchTimeRemaining = (b._lastDispatchTime || 0) > 0
        ? Math.max(0, b._lastDispatchTime - now)
        : 0;
      delete bData._lastDispatchTime;

      bData.harvestCooldownRemaining = Math.max(0, (b.harvestCooldownUntil || 0) - now);
      bData.arrowTowerCooldownRemaining = Math.max(0, b.arrowTowerCooldown || 0);
      bData.beerRefillCooldownRemaining = Math.max(0, b.beerRefillCooldown || 0);

      bData.treatmentEndsAtRemaining = (b.treatmentEndsAt || 0) > 0
        ? Math.max(0, b.treatmentEndsAt - now)
        : 0;
      delete bData.treatmentEndsAt;

      if (b.def.id === 'arztpraxis') {
        bData.currentPatient = b.currentPatient || null;
        bData.antibioticStorage = b.antibioticStorage || 0;
        bData.fetchAntibioticWorkerId = b.fetchAntibioticWorkerId || null;
      }

      delete bData.workers;
      delete bData.residents;
      delete bData.warriorSlots;
      delete bData.harvestCooldownUntil;
      delete bData.arrowTowerCooldown;
      delete bData.beerRefillCooldown;
      delete bData.def;
      bData.def = b.def.id;
      saveData.buildings.push(bData);
    }

    await progress(30, "Einwohner sichern...");
    for (const v of game.vm.villagers.values()) {
      const vData = { ...v };
      delete vData._reservedTree;
      delete vData._reservedStone;
      delete vData._reservedWater;
      delete vData._repairFightSince;

      vData._repairBuildingId = v._repairBuildingId || null;
      vData._repairFetchCarrying = v._repairFetchCarrying || null;

      vData._repairWaitingUntilRemaining = Math.max(0, (v._repairWaitingUntil || 0) - now);
      delete vData._repairWaitingUntil;

      vData.nextBreadAtRemaining = Math.max(0, (v.nextBreadAt || 0) - now);
      delete vData.nextBreadAt;

      vData._fishHarvestStartRemaining = (v._fishHarvestStart || 0) > 0
        ? Math.max(0, (v._fishHarvestStart || 0) - now)
        : -1;
      delete vData._fishHarvestStart;

      vData.moveStartTimeRemaining = (v.moveStartTime || 0) > 0
        ? Math.max(0, (v.moveStartTime || 0) - now)
        : -1;
      delete vData.moveStartTime;

      vData._recoverUntilRemaining = (v._recoverUntil || 0) > 0
        ? Math.max(0, v._recoverUntil - now)
        : 0;
      delete vData._recoverUntil;

      vData._lastFireDispatchTimeRemaining = (v._lastFireDispatchTime || 0) > 0
        ? Math.max(0, v._lastFireDispatchTime - now)
        : 0;
      delete vData._lastFireDispatchTime;

      vData._fireDispatchAtRemaining = (v._fireDispatchAt || 0) > 0
        ? Math.max(0, v._fireDispatchAt - now)
        : 0;
      delete vData._fireDispatchAt;

      if (v._fireStationX === undefined) vData._fireStationX = 0;
      if (v._fireStationY === undefined) vData._fireStationY = 0;
      if (v._fireTargetId === undefined) vData._fireTargetId = null;
      if (v._fireWaterCarried === undefined) vData._fireWaterCarried = 0;
      if (v._fireSourceId === undefined) vData._fireSourceId = null;
      if (v._waterFetchAmount === undefined) vData._waterFetchAmount = 0;

      vData._sickSinceRemaining = (v._sickSince || 0) > 0
        ? Math.max(0, v._sickSince - now)
        : 0;
      delete vData._sickSince;

      vData._sickHealAtRemaining = (v._sickHealAt || 0) > 0
        ? Math.max(0, v._sickHealAt - now)
        : 0;
      delete vData._sickHealAt;

      if (v._treatmentTargetId === undefined) vData._treatmentTargetId = null;
      if (v._fetchAntibioticsAmount === undefined) vData._fetchAntibioticsAmount = 0;
      if (v.isSick === undefined) vData.isSick = false;

      saveData.villagers.push(vData);
    }

    if (game.zombieManager) {
      await progress(50, "Zombies sichern...");
      saveData.zombies = game.zombieManager.zombies.map(z => ({ ...z }));
    }

    if (game.raiderVillage &&
        (game.raiderVillage.isDestroyed ||
         (game.raiderVillage.castle && game.raiderVillage.towers))) {
      await progress(60, "Räuberlager sichern...");
      const rv = game.raiderVillage;

      const isDestroyed = !!rv.isDestroyed;
      const respawnAtRemaining = isDestroyed && rv.respawnAt > 0
        ? Math.max(0, rv.respawnAt - now)
        : 0;
      const nextAttackAtRemaining = !isDestroyed && rv.nextAttackAt > 0
        ? Math.max(0, rv.nextAttackAt - now)
        : 0;
      const spawnGracePeriodEndsRemaining = !isDestroyed && rv.spawnGracePeriodEnds > 0
        ? Math.max(0, rv.spawnGracePeriodEnds - now)
        : 0;

      let frozenAttackAtRemaining = 0;
      if (rv.attackTimerFrozen) {
        if (rv.nextAttackAt > 0) {
          frozenAttackAtRemaining = Math.max(0, rv.nextAttackAt - now);
        } else {
          frozenAttackAtRemaining = Math.max(0, rv.frozenAttackAt || 0);
        }
      }

      saveData.raiders = {
        generation: rv.generation,
        isDestroyed: isDestroyed,
        allBuildingsDestroyed: !!rv.allBuildingsDestroyed,
        respawnAtRemaining: respawnAtRemaining,
        nextAttackAtRemaining: nextAttackAtRemaining,
        firstAttackDone: !!rv.firstAttackDone,
        spawnGracePeriodEndsRemaining: spawnGracePeriodEndsRemaining,
        attackTimerFrozen: !!rv.attackTimerFrozen,
        frozenAttackAtRemaining: frozenAttackAtRemaining,
        castle: rv.castle ? { id: rv.castle.id, x: rv.castle.x, y: rv.castle.y } : null,
        towers: rv.towers ? rv.towers.map(t => ({ id: t.id, x: t.x, y: t.y })) : [],
        warriors: Array.from(rv.warriors.values()).map(w => {
          const wData = { ...w };
          if (w.dead && w.respawnAt) {
            wData.respawnAtRemaining = Math.max(0, w.respawnAt - now);
            delete wData.respawnAt;
          } else {
            delete wData.respawnAt;
          }
          return wData;
        })
      };
    }

    if (game.dragonManager) {
      await progress(75, "Drachen sichern...");
      const dm = game.dragonManager;

      let dragonsData = [];
      if (dm.dragons && dm.dragons.length > 0) {
        dragonsData = dm.dragons.map(d => {
          const data = { ...d };
          delete data.buildingCache;

          data.scale = d.scale;

          data.lastSearchAtRemaining = (d.lastSearchAt || 0) > 0
            ? Math.max(0, d.lastSearchAt - now)
            : -1;
          delete data.lastSearchAt;

          data.nextFireballAtRemaining = Math.max(0, d.nextFireballAt - now);
          data.fireCooldownUntilRemaining = Math.max(0, d.fireCooldownUntil - now);
          data.groundedUntilRemaining = d.groundedUntil > 0 ? Math.max(0, d.groundedUntil - now) : 0;
          data.crashEndTimeRemaining = d.crashEndTime > 0 ? Math.max(0, d.crashEndTime - now) : 0;

          data.crashStartTimeRemaining = (d.crashStartTime || 0) > 0
            ? Math.max(0, d.crashStartTime - now)
            : -1;
          delete data.crashStartTime;

          delete data.nextFireballAt;
          delete data.fireCooldownUntil;
          delete data.groundedUntil;
          delete data.crashEndTime;

          return data;
        });
      }

      let fireballsData = [];
      if (dm.fireballs && dm.fireballs.length > 0) {
        fireballsData = dm.fireballs.map(f => ({
          sx: f.sx, sy: f.sy, ex: f.ex, ey: f.ey,
          elapsedMs: Math.max(0, now - f.startTime),
          durationMs: f.durationMs,
          targetBuildingId: f.targetBuildingId
        }));
      }

      let deadDragonsData = [];
      if (dm.deadDragons && dm.deadDragons.length > 0) {
        deadDragonsData = dm.deadDragons.map(dd => ({
          x: dd.x,
          y: dd.y,
          scale: dd.scale,
          elapsedMs: Math.max(0, now - dd.startTime)
        }));
      }

      saveData.dragon = {
        defenseReady: !!dm._defenseReady,
        nextSpawnAtRemaining: dm.nextSpawnAt > 0 ? Math.max(0, dm.nextSpawnAt - now) : 0,
        level: dm.level,
        dragons: dragonsData,
        fireballs: fireballsData,
        deadDragons: deadDragonsData
      };
    }

    if (game.plagueManager) {
      saveData.plagues = game.plagueManager.serialize(now);
    }

    if (game.fireManager) {
      saveData.fires = game.fireManager.serialize(now);
    }

    if (game.sicknessManager) {
      saveData.sickness = game.sicknessManager.serialize(now);
    }

    if (game.earthquakeManager) {
      saveData.earthquakes = game.earthquakeManager.serialize(now);
    }

    await progress(90, "Daten komprimieren...");
    const jsonStr = JSON.stringify(saveData);

    await progress(100, "Fertig!");
    return jsonStr;
  },

  async deserialize(jsonStr, game, onComplete) {
    const progress = (pct, text) => {
      const el = document.getElementById('loadingBarFill');
      const txt = document.getElementById('loadingText');
      if (el) el.style.width = pct + '%';
      if (txt) txt.textContent = text + ` (${pct}%)`;
      return new Promise(r => setTimeout(r, 0));
    };

    const data = JSON.parse(jsonStr);
    const now = performance.now();

    await progress(10, "Karte aufbauen...");
    const world = new Game.World(data.map.width, data.map.height, data.map.grid);
    const TREE_GROWTH_MS = world.TREE_GROWTH_MS || 240000;

    if (data.trees) {
      for (const t of data.trees) {
        if (t.growthUntil !== undefined && t.growthUntil !== null) {
          if (!data.growingTrees) data.growingTrees = [];
          data.growingTrees.push({ x: t.x, y: t.y });
          continue;
        }

        const tree = { x: t.x, y: t.y, regrowAt: null, growthUntil: null, _reservedBy: null };
        world.trees.set(t.x + ',' + t.y, tree);
        for (let dy = 0; dy < 2; dy++) {
          for (let dx = 0; dx < 2; dx++) {
            const px = t.x + dx, py = t.y + dy;
            if (world.inBounds(px, py)) world.blockedByTree[world._idx(px, py)] = 1;
          }
        }
        const bk = world._bucketKey(t.x, t.y, world.TREE_BUCKET);
        let bucket = world.treeGridBuckets.get(bk);
        if (!bucket) { bucket = new Set(); world.treeGridBuckets.set(bk, bucket); }
        bucket.add(tree);
      }
    }

    if (data.growingTrees && data.growingTrees.length > 0) {
      for (const t of data.growingTrees) {
        const key = t.x + ',' + t.y;
        if (world.trees.has(key)) continue;

        const randomProgress = 0.1 + Math.random() * 0.8;
        const remainingMs = TREE_GROWTH_MS * (1 - randomProgress);

        const tree = {
          x: t.x, y: t.y,
          regrowAt: null,
          growthUntil: now + remainingMs,
          _reservedBy: null
        };
        world.trees.set(key, tree);
        world.growingTrees.push(tree);

        for (let dy = 0; dy < 2; dy++) {
          for (let dx = 0; dx < 2; dx++) {
            const px = t.x + dx, py = t.y + dy;
            if (world.inBounds(px, py)) world.blockedByTree[world._idx(px, py)] = 1;
          }
        }
        const bk = world._bucketKey(t.x, t.y, world.TREE_BUCKET);
        let bucket = world.treeGridBuckets.get(bk);
        if (!bucket) { bucket = new Set(); world.treeGridBuckets.set(bk, bucket); }
        bucket.add(tree);
      }
    }

    if (data.stones) {
      world.loadStones(data.stones);
    }

    world.waterTiles.clear();
    for (let y = 0; y < world.height; y++) {
      for (let x = 0; x < world.width; x++) {
        if (world.grid[y * world.width + x] === 'water') {
          world.waterTiles.add(x + ',' + y);
        }
      }
    }

    world.fishWaterTiles.clear();
    if (data.fishWaterTiles) {
      for (const f of data.fishWaterTiles) {
        world.fishWaterTiles.set(f.x + ',' + f.y, {
          x: f.x, y: f.y,
          remaining: f.remaining,
          cooldownUntil: f.cooldownRemaining > 0 ? now + f.cooldownRemaining : 0,
          _reservedBy: null,
          _moveState: undefined
        });
        world._refreshFishWaterCache(world.fishWaterTiles.get(f.x + ',' + f.y));
      }
    }

    if (data.decorations) {
      world.loadDecorations(data.decorations);
    }

    world.castleId = data.gameState ? data.gameState.castleId : null;
    world.nextBuildingId = data.gameState ? data.gameState.nextBuildingId : 1;

    if (data.gameState) {
      if (data.gameState.zombieInfects !== undefined) {
        game.zombieInfects = !!data.gameState.zombieInfects;
      }
      if (data.gameState.zombieInfectsDelayed !== undefined) {
        game.zombieInfectsDelayed = !!data.gameState.zombieInfectsDelayed;
      }
      if (data.gameState.dragonEnabled !== undefined) {
        game.dragonEnabled = !!data.gameState.dragonEnabled;
      }
      if (data.gameState.autosaveEnabled !== undefined) {
        game.autosaveEnabled = !!data.gameState.autosaveEnabled;
      }
    }

    if (data.gameState && data.gameState.raiderFirstSpawnAtRemaining !== undefined) {
      game.raiderFirstSpawnAt = data.gameState.raiderFirstSpawnAtRemaining > 0
        ? now + data.gameState.raiderFirstSpawnAtRemaining
        : 0;
    } else {
      game.raiderFirstSpawnAt = 0;
    }

    if (data.gameState && data.gameState.lastAutosaveTimeRemaining !== undefined) {
      game.lastAutosaveTime = data.gameState.lastAutosaveTimeRemaining > 0
        ? now + data.gameState.lastAutosaveTimeRemaining
        : now;
    } else {
      game.lastAutosaveTime = now;
    }

    const defaultEnemyStats = {
      zombiesKilled: 0,
      raidersKilled: 0,
      raiderCastlesDestroyed: 0,
      raiderHousesDestroyed: 0,
      dragonsKilled: 0,
      dragonsEscaped: 0,
      villagersZombified: 0,
      warriorsKilled: 0,
      buildingsDestroyedByDragon: 0,
      healedPatients: 0
    };
    game.enemyStats = { ...defaultEnemyStats, ...(data.enemyStats || {}) };

    const defaultProdStats = {
      wood: 0, stone: 0, grain: 0, fish: 0,
      water: 0, beer: 0, woodPlank: 0, flour: 0,
      bread: 0, arrows: 0, feed: 0, pig: 0, meat: 0,
      dragonBone: 0,
      raiderHerb: 0,
      antibiotics: 0
    };
    game.productionStats = { ...defaultProdStats, ...(data.productionStats || {}) };

    const ticker = new Game.Ticker(1);
    const economy = {
      res: data.economy || {},
      canAfford(cost) { for (const k in cost) if ((this.res[k] || 0) < cost[k]) return false; return true; },
      pay(cost) { for (const k in cost) this.res[k] -= cost[k]; },
      onChange() { if (game.hud) game.hud.updateResources(this); }
    };

    const vm = new Game.VillagerManager(world, ticker, economy);
    vm.nextId = data.gameState ? data.gameState.nextVillagerId : 1;

    await progress(30, "Gebäude aufbauen...");
    if (data.buildings) {
      for (const bData of data.buildings) {
        const def = Game.BUILDING_TYPES[bData.def];
        if (!def) continue;

        const b = { ...bData, def };
        b.workers = [];
        b.residents = bData._residents || [];
        b.warriorSlots = bData._warriorSlots || [];
        b.fields = b.fields ? b.fields.map(f => ({ ...f })) : [];

        b.ruined = !!bData.ruined;
        b.isBeingRepaired = !!bData.isBeingRepaired;
        b.dragonHits = bData.dragonHits || 0;
        b.repairCostCache = bData.repairCostCache ? { ...bData.repairCostCache } : null;
        b.repairWaiting = !!bData.repairWaiting;

        b._lastDispatchTime = bData.lastDispatchTimeRemaining !== undefined && bData.lastDispatchTimeRemaining > 0
          ? now + bData.lastDispatchTimeRemaining
          : 0;

        b.harvestCooldownUntil = bData.harvestCooldownRemaining > 0
          ? now + bData.harvestCooldownRemaining
          : 0;

        b.arrowTowerCooldown = bData.arrowTowerCooldownRemaining > 0
          ? bData.arrowTowerCooldownRemaining
          : 0;

        b.beerRefillCooldown = bData.beerRefillCooldownRemaining > 0
          ? bData.beerRefillCooldownRemaining
          : 0;

        b.treatmentEndsAt = bData.treatmentEndsAtRemaining > 0
          ? now + bData.treatmentEndsAtRemaining
          : 0;
        delete bData.treatmentEndsAtRemaining;

        if (b.def.id === 'arztpraxis') {
          b.currentPatient = bData.currentPatient || null;
          b.antibioticStorage = bData.antibioticStorage || 0;
          b.fetchAntibioticWorkerId = bData.fetchAntibioticWorkerId || null;
        }

        if (!b.built) {
          b.progress = 0;
          b.builderId = null;
        }

        delete b._residents;
        delete b._warriorSlots;
        delete b.harvestCooldownRemaining;
        delete b.arrowTowerCooldownRemaining;
        delete b.beerRefillCooldownRemaining;
        delete b.lastDispatchTimeRemaining;

        world.buildings.set(b.id, b);

        if (b.built && !b.ruined) {
          if (def.recipe) world.recipeBuildings.push(b);
          if (def.generatesResource) world.generatingBuildings.push(b);
          if (def.hasArrowTower) world.arrowBuildings.push(b);
          if (def.consumesFish) world.fishConsumers.push(b);
          if (b.maxWarriors > 0) world.warriorBuildings.push(b);
          if (def.beerSlots > 0) world.beerBuildings.push(b);
          if (def.isStorage || def.id === 'castle') world.dropoffBuildings.push(b);
          if (def.id === 'lumberjack' || def.id === 'quarry' || def.id === 'fisher' || def.id === 'forsthaus' || def.produces) world.producingBuildings.push(b);
          if (def.isHouse) world.houses.push(b);
          if (def.animationFrames) world.animatedBuildings.push(b);
          if (def.id === 'arztpraxis') world.arztpraxen.push(b);
        } else if (b.ruined || !b.built) {
          world.buildSites.push(b);
        }

        for (let dy = 0; dy < b.h; dy++) {
          for (let dx = 0; dx < b.w; dx++) {
            world.occupied.add((b.x + dx) + ',' + (b.y + dy));
          }
        }

        if (b.def.id === 'fireStation') {
          b.maxCapacity = b.def.maxWaterStorage || 250;
          b.reportThreshold = 10;
        }
      }
    }

    for (const b of world.buildings.values()) {
      if (b.ruined) {
        b.isBeingRepaired = false;
        b.builderId = null;
        b.progress = 0;
        b.repairCostCache = null;
        b.repairWaiting = false;
      }
    }

    world._territoryCacheReady = false;
    world.invalidateTerritoryCache();

    await progress(50, "Einwohner aufbauen...");
    if (data.villagers) {
      for (const vData of data.villagers) {
        const v = { ...vData };
        v.harvestQueue = [];
        v._reservedTree = null;
        v._reservedStone = null;
        v._reservedWater = null;
        v._repairBuildingId = vData._repairBuildingId || null;
        v._repairFetchCarrying = vData._repairFetchCarrying || null;
        v._repairFightSince = null;
        v._diedFromZombie = false;

        v._repairWaitingUntil = vData._repairWaitingUntilRemaining > 0
          ? now + vData._repairWaitingUntilRemaining
          : 0;
        delete v._repairWaitingUntilRemaining;

        v.nextBreadAt = vData.nextBreadAtRemaining !== undefined && vData.nextBreadAtRemaining >= 0
          ? now + vData.nextBreadAtRemaining
          : now;
        delete v.nextBreadAtRemaining;

        v._fishHarvestStart = vData._fishHarvestStartRemaining > 0
          ? now + vData._fishHarvestStartRemaining
          : 0;
        delete v._fishHarvestStartRemaining;

        v.moveStartTime = vData.moveStartTimeRemaining > 0
          ? now + vData.moveStartTimeRemaining
          : now;
        delete v.moveStartTimeRemaining;

        v._recoverUntil = vData._recoverUntilRemaining > 0
          ? now + vData._recoverUntilRemaining
          : 0;
        delete v._recoverUntilRemaining;

        v._lastFireDispatchTime = vData._lastFireDispatchTimeRemaining > 0
          ? now + vData._lastFireDispatchTimeRemaining
          : 0;
        delete v._lastFireDispatchTimeRemaining;

        v._fireDispatchAt = vData._fireDispatchAtRemaining > 0
          ? now + vData._fireDispatchAtRemaining
          : 0;
        delete v._fireDispatchAtRemaining;

        v._fireStationX = vData._fireStationX || 0;
        v._fireStationY = vData._fireStationY || 0;

        if (v._fireTargetId === undefined) v._fireTargetId = null;
        if (v._fireWaterCarried === undefined) v._fireWaterCarried = 0;
        if (v._fireSourceId === undefined) v._fireSourceId = null;
        if (v._waterFetchAmount === undefined) v._waterFetchAmount = 0;

        v._sickSince = vData._sickSinceRemaining > 0
          ? now + vData._sickSinceRemaining
          : 0;
        delete v._sickSinceRemaining;

        v._sickHealAt = vData._sickHealAtRemaining > 0
          ? now + vData._sickHealAtRemaining
          : 0;
        delete v._sickHealAtRemaining;

        if (v._treatmentTargetId === undefined) v._treatmentTargetId = null;
        if (v._fetchAntibioticsAmount === undefined) v._fetchAntibioticsAmount = 0;
        if (v.isSick === undefined) v.isSick = false;

        if (v.state === 'sick_walking_to_praxis' ||
            v.state === 'sick_treating' ||
            v.state === 'sick_walking_back') {
          // Zustand beibehalten
        } else if (v.state === 'harvesting_hit' || v.state === 'fishing_dive' || v.state === 'moving' || v.state === 'harvesting' || v.state === 'extinguish_fetch' || v.state === 'extinguish_go' || v.state === 'extinguish_return') {
          v.state = 'working';
          v.task = null;
          v.hidden = true;
          v.moveDuration = 0;
          v.harvestHitCount = 0;
          v.harvestTotalCount = 0;
          v.harvestExclude = null;
          v._pendingStorageGain = 0;
        } else if (v.state === 'building' || v.state === 'repairing') {
          v.state = 'idle';
          v.task = null;
          v.hidden = true;
          v.buildTargetId = null;
        }

        if (v.state === 'working' && !v.workplaceId) {
          v.state = 'idle';
          v.job = 'free';
        }

        vm.villagers.set(v.id, v);
        vm._listDirty = true;
      }
    }

    await progress(70, "Kampf-Entities aufbauen...");
    const zombieManager = new Game.ZombieManager(world, ticker, vm);
    zombieManager.nextId = data.gameState ? data.gameState.nextZombieId : 1;
    zombieManager.difficulty = data.gameState ? data.gameState.zombieDifficulty : 'normal';
    if (data.zombies) {
      zombieManager.zombies = data.zombies.map(z => ({ ...z }));
    }

    if (data.gameState) {
      if (data.gameState.zombieSpawnCooldownRemaining !== undefined) {
        zombieManager.spawnCooldown = Math.max(
          1,
          Math.ceil(data.gameState.zombieSpawnCooldownRemaining / 1000)
        );
      }
      zombieManager.firstSpawnDone = !!data.gameState.zombieFirstSpawnDone;

      zombieManager.infectsDelayed = !!data.gameState.zombieInfectsDelayed;
      if (data.gameState.zombieInfectiousAtRemaining !== undefined && data.gameState.zombieInfectiousAtRemaining > 0) {
        zombieManager.infectiousAt = now + data.gameState.zombieInfectiousAtRemaining;
        zombieManager._virusEvolvedFired = false;
      } else if (data.gameState.zombieVirusEvolvedFired) {
        zombieManager.infectiousAt = 0;
        zombieManager._virusEvolvedFired = true;
      } else {
        zombieManager.infectiousAt = 0;
        zombieManager._virusEvolvedFired = !zombieManager.infectsDelayed;
      }
    }

    let raiderVillage = null;
    if (data.raiders) {
      try {
        const rData = data.raiders;

        if (rData.isDestroyed) {
          raiderVillage = new Game.RaiderVillage(world, ticker, vm, economy, rData.generation || 0);
          raiderVillage.isDestroyed = true;
          raiderVillage.respawnAt = now + Math.max(0, rData.respawnAtRemaining || 0);
          raiderVillage.castle = null;
          raiderVillage.towers = [];
          raiderVillage.buildings = [];
          raiderVillage.warriors.clear();
          raiderVillage.boundarySet = null;
          raiderVillage.boundaryTiles = null;
          raiderVillage.bounds = null;
          raiderVillage._centerCache = null;
          raiderVillage.nextWarriorId = data.gameState ? data.gameState.raiderNextId : 1;
          console.log(`Raeuberlager (zerstoert) wiederhergestellt. Respawn in ${Math.round((rData.respawnAtRemaining || 0) / 60000)} Minuten.`);
        }
        else if (rData.castle && rData.towers) {
          raiderVillage = new Game.RaiderVillage(world, ticker, vm, economy, rData.generation || 0);

          const idMap = new Map();

          raiderVillage.castle = raiderVillage._createRaiderBuilding(Game.BUILDING_TYPES.raiderCastle, rData.castle.x, rData.castle.y);
          if (rData.castle.id !== undefined) {
            idMap.set(rData.castle.id, raiderVillage.castle.id);
          }
          raiderVillage.buildings = [raiderVillage.castle];

          for (const t of rData.towers) {
            const tower = raiderVillage._createRaiderBuilding(Game.BUILDING_TYPES.raiderWatchtower, t.x, t.y);
            if (t.id !== undefined) {
              idMap.set(t.id, tower.id);
            }
            raiderVillage.towers.push(tower);
            raiderVillage.buildings.push(tower);
          }

          raiderVillage.nextWarriorId = data.gameState ? data.gameState.raiderNextId : 1;
          if (rData.warriors) {
            for (const wData of rData.warriors) {
              const w = { ...wData };

              if (w.dead && wData.respawnAtRemaining !== undefined) {
                w.respawnAt = now + Math.max(0, wData.respawnAtRemaining);
                delete w.respawnAtRemaining;
              } else {
                delete w.respawnAtRemaining;
              }

              if (idMap.has(w.homeBuildingId)) {
                w.homeBuildingId = idMap.get(w.homeBuildingId);
              } else {
                w.homeBuildingId = raiderVillage.castle.id;
              }

              if (w.inAttack) {
                w.inAttack = false;
                w.carryingLoot = false;
                if (w.state === 'marching_to_player' || w.state === 'retreating') {
                  w.state = 'returning_to_house';
                }
              }

              raiderVillage.warriors.set(w.id, w);
            }
          }

          raiderVillage._computeBoundary();

          raiderVillage.nextAttackAt = now + Math.max(0, rData.nextAttackAtRemaining || 0);
          raiderVillage.firstAttackDone = !!rData.firstAttackDone;
          raiderVillage.spawnGracePeriodEnds = now + Math.max(0, rData.spawnGracePeriodEndsRemaining || 0);
          raiderVillage.allBuildingsDestroyed = !!rData.allBuildingsDestroyed;

          if (rData.attackTimerFrozen) {
            raiderVillage.attackTimerFrozen = true;
            raiderVillage.frozenAttackAt = Math.max(0, rData.frozenAttackAtRemaining || 0);
            raiderVillage._restoreFrozenAttackTimer();
          } else {
            raiderVillage.attackTimerFrozen = false;
            raiderVillage.frozenAttackAt = 0;
          }

          console.log(`Raeuberlager wiederhergestellt. Naechster Angriff in ${Math.round((rData.nextAttackAtRemaining || 0) / 1000)}s.`);
        }
      } catch (e) {
        console.warn("Raeuberlager konnte nicht geladen werden:", e);
        raiderVillage = null;
      }
    }

    await progress(85, "Zustaende reparieren...");
    this.repairGame(world, vm, economy);

    const futureFix = this.fixFutureTimestamps(world, vm);
    if (futureFix > 0) {
      console.log(`🔧 ${futureFix} Zeitstempel korrigiert (lagen in der Zukunft).`);
    }

    await progress(90, "Welt zusammensetzen...");

    const dragonSaveData = data.dragon || null;
    if (dragonSaveData && dragonSaveData.nextSpawnAtRemaining !== undefined) {
      dragonSaveData.nextSpawnAt = now + dragonSaveData.nextSpawnAtRemaining;
    }

    const eqSaveData = data.earthquakes || null;

    game._pendingPlagueData = data.plagues || null;
    game._pendingFireData = data.fires || null;

    if (!data.sickness) {
      game._pendingSicknessData = { _legacyFallback: true };
    } else {
      game._pendingSicknessData = data.sickness;
    }

    onComplete(world, ticker, economy, vm, zombieManager, raiderVillage, dragonSaveData, eqSaveData);
  },

  fixFutureTimestamps(world, vm) {
    const now = performance.now();
    let fixed = 0;

    for (const b of world.buildings.values()) {
      if (b._lastDispatchTime && b._lastDispatchTime > now) {
        b._lastDispatchTime = 0;
        fixed++;
      }
      if (b.harvestCooldownUntil && b.harvestCooldownUntil > now + 60000) {
        b.harvestCooldownUntil = 0;
        fixed++;
      }
      if (b.arrowTowerCooldown && b.arrowTowerCooldown > 60000) {
        b.arrowTowerCooldown = 0;
        fixed++;
      }
      if (b.beerRefillCooldown && b.beerRefillCooldown > 60000) {
        b.beerRefillCooldown = 0;
        fixed++;
      }
      if (b.treatmentEndsAt && b.treatmentEndsAt > now + 60000) {
        b.treatmentEndsAt = 0;
        fixed++;
      }
    }

    for (const v of vm.villagers.values()) {
      if (v._recoverUntil && v._recoverUntil > now + 60000) {
        v._recoverUntil = 0;
        fixed++;
      }
      if (v._repairWaitingUntil && v._repairWaitingUntil > now + 60000) {
        v._repairWaitingUntil = 0;
        fixed++;
      }
      if (v._fishHarvestStart && v._fishHarvestStart > now + 60000) {
        v._fishHarvestStart = 0;
        fixed++;
      }
      if (v.nextBreadAt && v.nextBreadAt > now + 600000) {
        v.nextBreadAt = now;
        fixed++;
      }
      if (v.moveStartTime && v.moveStartTime > now + 60000) {
        v.moveStartTime = now;
        fixed++;
      }
      if (v._lastFireDispatchTime && v._lastFireDispatchTime > now + 60000) {
        v._lastFireDispatchTime = 0;
        fixed++;
      }
      if (v._fireDispatchAt && v._fireDispatchAt > now + 60000) {
        v._fireDispatchAt = 0;
        fixed++;
      }
      if (v._sickSince && v._sickSince > now + 60000) {
        v._sickSince = 0;
        fixed++;
      }
      if (v._sickHealAt && v._sickHealAt > now + 60000) {
        v._sickHealAt = 0;
        fixed++;
      }
    }

    return fixed;
  },

  repairGame(world, vm, economy) {
    if (!world || !vm) return { fixed: 0 };
    let fixed = 0;
    const now = performance.now();
    const MAX_FIGHT_AGE = 30000;
    const fireMgr = window.Game.state && window.Game.state.fireManager;
    const sicknessMgr = window.Game.state && window.Game.state.sicknessManager;

    for (const v of vm.villagers.values()) {
      if (fireMgr && v._fireTargetId !== null && v._fireTargetId !== undefined) {
        const targetB = world.buildings.get(v._fireTargetId);
        if (!targetB || targetB.ruined || !fireMgr.isBuildingBurning(targetB)) {
          if (targetB) fireMgr.dequeueWorker(targetB, v.id);
          v._fireTargetId = null;
          v._fireWaterCarried = 0;

          if (v.state === 'extinguish_fetch' ||
              v.state === 'extinguish_go' ||
              v.state === 'extinguish_waiting' ||
              v.state === 'return_to_station' ||
              v.state === 'fetch_water_storage' ||
              v.state === 'fetch_water_return') {
            v.state = 'working';
            v.task = null;
            v.hidden = true;
            v._lastFireDispatchTime = 0;
            v._fireDispatchAt = 0;
            fixed++;
          }
        }
      }

      if (fireMgr &&
          (v._fireTargetId !== null && v._fireTargetId !== undefined ||
           v._fireWaterCarried > 0) &&
          v.state === 'working' &&
          !v.task) {
        if (v._fireTargetId !== null && v._fireTargetId !== undefined) {
          const tB = world.buildings.get(v._fireTargetId);
          if (tB) fireMgr.dequeueWorker(tB, v.id);
        }
        v._fireTargetId = null;
        v._fireWaterCarried = 0;
        fixed++;
      }

      if (v.isSick) {
        if (v._treatmentTargetId !== null && v._treatmentTargetId !== undefined) {
          const praxisB = world.buildings.get(v._treatmentTargetId);
          if (!praxisB || praxisB.def.id !== 'arztpraxis' || praxisB.ruined) {
            if (praxisB && sicknessMgr) sicknessMgr.onPraxisRemoved(praxisB);
            v._treatmentTargetId = null;

            if (v.state === 'sick_walking_to_praxis' ||
                v.state === 'sick_treating' ||
                v.state === 'sick_walking_back') {
              v.state = 'working';
              v.task = null;
              v.hidden = true;
              v._sickHealAt = 0;
              fixed++;
            }
          }
        }

        if (v.state !== 'working' &&
            v.state !== 'sick_walking_to_praxis' &&
            v.state !== 'sick_treating' &&
            v.state !== 'sick_walking_back' &&
            v.state !== 'idle' &&
            v.state !== 'moving' &&
            v.state !== 'harvesting_hit' &&
            v.state !== 'fishing_dive' &&
            v.state !== 'harvesting' &&
            v.state !== 'extinguish_fetch' &&
            v.state !== 'extinguish_go' &&
            v.state !== 'extinguish_waiting' &&
            v.state !== 'return_to_station' &&
            v.state !== 'fetch_water_storage' &&
            v.state !== 'fetch_water_return' &&
            v.state !== 'fetch_antibiotics_storage' &&
            v.state !== 'fetch_antibiotics_return') {
          v.state = 'working';
          v.task = null;
          v.hidden = true;
          v._sickHealAt = 0;
          fixed++;
        }
      } else {
        if (v.state === 'sick_walking_to_praxis' ||
            v.state === 'sick_treating' ||
            v.state === 'sick_walking_back') {
          v.state = 'working';
          v.task = null;
          v.hidden = true;
          v._treatmentTargetId = null;
          v._sickHealAt = 0;
          fixed++;
        }
      }

      const inFightState = (
        v.state === 'vfightback' ||
        v.state === 'vfighting' ||
        v.state === 'vdefend' ||
        v.state === 'zfighting' ||
        v.state === 'dragon_attack' ||
        v.state === 'attacking_raiders' ||
        v.state === 'returning_to_post'
      );

      if (inFightState) {
        if (!v._repairFightSince) {
          v._repairFightSince = now;
          continue;
        }

        const age = now - v._repairFightSince;
        if (age < MAX_FIGHT_AGE) {
          continue;
        }

        v._repairFightSince = null;
        v.state = 'idle';
        v.hidden = true;
        v.task = null;
        v.workplaceId = null;
        v.warriorBuildingId = null;
        v.warriorSlotIndex = -1;
        v.job = 'free';
        v.carrying = null;
        v.recipeCarrying = null;
        vm._releaseReservations(v);
        vm._idleVillagers.add(v.id);
        fixed++;
        continue;
      } else {
        v._repairFightSince = null;
      }

      if (v.workplaceId) {
        const b = world.buildings.get(v.workplaceId);
        if (!b || b.ruined || !b.built) {
          v.workplaceId = null;
          v.job = 'free';
          v.state = 'idle';
          v.task = null;
          v.hidden = true;
          v.warriorBuildingId = null;
          v.warriorSlotIndex = -1;
          vm._releaseReservations(v);
          vm._idleVillagers.add(v.id);
          fixed++;
        }
      }

      if (v.job === 'warrior') {
        let found = false;
        for (const b of world.warriorBuildings) {
          if (!b.warriorSlots) continue;
          if (b.warriorSlots.indexOf(v.id) !== -1) {
            found = true;
            break;
          }
        }
        if (!found) {
          v.job = 'free';
          v.state = 'idle';
          v.workplaceId = null;
          v.warriorBuildingId = null;
          v.warriorSlotIndex = -1;
          v.task = null;
          v.hidden = true;
          vm._idleVillagers.add(v.id);
          fixed++;
        }
      }

      if (v.job === 'worker' && !v.workplaceId) {
        v.job = 'free';
        v.state = 'idle';
        v.task = null;
        v.hidden = true;
        vm._idleVillagers.add(v.id);
        fixed++;
      }

      if (v.state === 'working' && !v.workplaceId && v.job !== 'warrior') {
        v.state = 'idle';
        v.job = 'free';
        v.hidden = true;
        vm._idleVillagers.add(v.id);
        fixed++;
      }

      if (v.task === 'go_to_work' && !v.workplaceId) {
        v.task = null;
        v.state = 'idle';
        v.hidden = true;
        fixed++;
      }

      if ((v.task === 'tree_harvest_arrived' && !v._reservedTree) ||
          (v.task === 'stone_harvest_arrived' && !v._reservedStone) ||
          (v.task === 'fish_harvest_arrived' && !v._reservedWater)) {
        v.harvestHitCount = 0;
        v.harvestTotalCount = 0;
        v.harvestExclude = null;
        v._pendingStorageGain = 0;
        v.task = null;
        v.state = 'idle';
        v.hidden = true;
        fixed++;
      }
    }

    world.freeJobs.clear();

    for (const b of world.buildings.values()) {
      if (!b.built || b.ruined) continue;

      const isJobBuilding = b.def.produces || b.def.recipe || b.def.generatesResource
        || b.def.hasArrowTower
        || b.def.id === 'lumberjack' || b.def.id === 'quarry' || b.def.id === 'fisher'
        || b.def.id === 'forsthaus' || b.def.id === 'arztpraxis';

      if (isJobBuilding) {
        if (b.workerId !== null) {
          const worker = vm.villagers.get(b.workerId);
          const isValid = worker
            && worker.workplaceId === b.id
            && worker.job === 'worker'
            && (worker.state === 'working' || worker.state === 'idle' || worker.isSick);

          if (!isValid) {
            b.workerId = null;
            fixed++;
          }
        }

        if (b.workerId === null) {
          const isFieldBuilding = b.def.produces && b.def.id !== 'fisher';
          if (!isFieldBuilding || b.fields.length > 0) {
            world.freeJobs.add(b);
          }
        }
      }

      if (b.warriorSlots) {
        for (let i = 0; i < b.warriorSlots.length; i++) {
          const wid = b.warriorSlots[i];
          if (wid === null) continue;

          const w = vm.villagers.get(wid);
          if (!w || w.job !== 'warrior') {
            b.warriorSlots[i] = null;
            fixed++;
          }
        }
      }

      if (b.residents && b.residents.length > 0) {
        const before = b.residents.length;
        for (let i = b.residents.length - 1; i >= 0; i--) {
          const rid = b.residents[i];
          const r = vm.villagers.get(rid);
          if (!r) {
            b.residents.splice(i, 1);
            continue;
          }
          if (r.job !== 'free' || r.workplaceId !== null) {
            b.residents.splice(i, 1);
          }
        }
        if (b.residents.length !== before) fixed++;
      }

      if (b.recipeFetchWorkerId !== null) {
        const rw = vm.villagers.get(b.recipeFetchWorkerId);
        if (!rw || rw.workplaceId !== b.id || rw.task !== 'recipe_fetch_storage') {
          b.recipeFetchWorkerId = null;
          fixed++;
        }
      }

      if (b.logisticsId !== null) {
        const lw = vm.villagers.get(b.logisticsId);
        if (!lw || lw.workplaceId !== b.id || lw.task !== 'go_to_pickup') {
          b.logisticsId = null;
          b.isBeingCollected = false;
          fixed++;
        }
      }

      if (b.def.id === 'arztpraxis') {
        if (b.fetchAntibioticWorkerId !== null) {
          const aw = vm.villagers.get(b.fetchAntibioticWorkerId);
          if (!aw || aw.workplaceId !== b.id) {
            b.fetchAntibioticWorkerId = null;
            fixed++;
          }
        }
        if (b.currentPatient !== null) {
          const cp = vm.villagers.get(b.currentPatient);
          if (!cp || !cp.isSick) {
            b.currentPatient = null;
            b.treatmentEndsAt = 0;
            fixed++;
          }
        }
      }
    }

    for (const v of vm.villagers.values()) {
      if (v.job !== 'warrior') continue;
      if (v.state === 'vdefend' || v.state === 'vfightback' || v.state === 'vfighting' || 
          v.state === 'zfighting' || v.state === 'dragon_attack' || 
          v.state === 'attacking_raiders' || v.state === 'returning_to_post') {
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
        v.hidden = true;
      } else {
        v.job = 'free';
        v.state = 'idle';
        v.workplaceId = null;
        v.warriorBuildingId = null;
        v.warriorSlotIndex = -1;
        v.task = null;
        v.hidden = true;
        vm._idleVillagers.add(v.id);
        fixed++;
      }
    }

    let freeVillagersCache = null;

    for (const b of world.warriorBuildings) {
      if (!b.built || b.ruined) continue;
      if (!b.warriorSlots) continue;

      let hasEmptySlot = false;
      for (let i = 0; i < b.warriorSlots.length; i++) {
        if (b.warriorSlots[i] === null) { hasEmptySlot = true; break; }
      }
      if (!hasEmptySlot) continue;

      if (!freeVillagersCache) {
        freeVillagersCache = [];
        for (const v of vm.villagers.values()) {
          if (v.job === 'free' && v.state === 'idle' && v.hidden && !v.reservedLogistics && !v.isSick) {
            freeVillagersCache.push(v);
          }
        }
      }

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

        const home = world.buildings.get(v.homeId);
        if (home && home.residents) {
          const idx = home.residents.indexOf(v.id);
          if (idx !== -1) home.residents.splice(idx, 1);
        }

        fixed++;

        hasEmptySlot = false;
        for (let i = 0; i < b.warriorSlots.length; i++) {
          if (b.warriorSlots[i] === null) { hasEmptySlot = true; break; }
        }
      }

      if (freeVillagersCache.length === 0) break;
    }

    for (const b of world.houses) {
      if (!b.built || b.ruined) continue;
      if (!b.residents) b.residents = [];

      for (let i = b.residents.length - 1; i >= 0; i--) {
        const r = vm.villagers.get(b.residents[i]);
        if (!r || r.job !== 'free' || r.workplaceId !== null) {
          b.residents.splice(i, 1);
          fixed++;
        }
      }
    }

    console.log(`Reparatur abgeschlossen: ${fixed} Fehler behoben.`);
    return { fixed };
  }
};
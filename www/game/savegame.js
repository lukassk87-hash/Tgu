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

      trees: Array.from(game.world.trees.values()).map(t => ({ x: t.x, y: t.y, growthUntil: t.growthUntil })),
      stones: Array.from(game.world.stones.values()).map(s => ({ cx: s.cx, cy: s.cy })),
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

      gameState: {
        castleId: game.world.castleId,
        nextBuildingId: game.world.nextBuildingId,
        nextVillagerId: game.vm.nextId,
        nextZombieId: game.zombieManager ? game.zombieManager.nextId : 1,
        firstZombieSpawn: game.firstZombieSpawn,
        zombieInfects: game.zombieInfects,
        zombieDifficulty: game.zombieDifficulty,
        raidersEnabled: game.raidersEnabled,
        raiderNextId: game.raiderVillage ? game.raiderVillage.nextWarriorId : 1,
        zombieSpawnCooldownRemaining: game.zombieManager
          ? Math.max(0, (game.zombieManager.spawnCooldown || 0) * 1000)
          : 0,
        zombieFirstSpawnDone: game.zombieManager ? !!game.zombieManager.firstSpawnDone : false
      }
    };

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

      bData.harvestCooldownRemaining = Math.max(0, (b.harvestCooldownUntil || 0) - now);
      bData.arrowTowerCooldownRemaining = Math.max(0, b.arrowTowerCooldown || 0);
      bData.beerRefillCooldownRemaining = Math.max(0, b.beerRefillCooldown || 0);

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
      vData._repairBuildingId = v._repairBuildingId || null;
      vData._repairFetchCarrying = v._repairFetchCarrying || null;
      vData._repairWaitingUntil = v._repairWaitingUntil || 0;
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

      saveData.raiders = {
        generation: rv.generation,
        isDestroyed: isDestroyed,
        respawnAtRemaining: respawnAtRemaining,
        nextAttackAtRemaining: nextAttackAtRemaining,
        firstAttackDone: !!rv.firstAttackDone,
        spawnGracePeriodEndsRemaining: spawnGracePeriodEndsRemaining,
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
      saveData.dragon = {
        nextSpawnAtRemaining: Math.max(0, dm.nextSpawnAt - now),
        level: dm.level,
        dragon: dm.dragon ? { ...dm.dragon } : null,
        fireballs: dm.fireballs ? dm.fireballs.map(f => ({
          sx: f.sx, sy: f.sy, ex: f.ex, ey: f.ey,
          startTime: f.startTime, durationMs: f.durationMs,
          targetBuildingId: f.targetBuildingId
        })) : []
      };
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

    if (data.trees) {
      for (const t of data.trees) {
        const tree = { x: t.x, y: t.y, regrowAt: null, growthUntil: t.growthUntil, _reservedBy: null };
        world.trees.set(t.x + ',' + t.y, tree);
        if (tree.growthUntil) world.growingTrees.push(tree);
      }
    }
    
    // ⚠️ FIX: Steine über die offizielle world.loadStones() laden,
    // damit blockedByStone und die Spatial-Buckets korrekt aufgebaut werden.
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

        b.harvestCooldownUntil = bData.harvestCooldownRemaining > 0 ? now + bData.harvestCooldownRemaining : 0;
        b.arrowTowerCooldown = bData.arrowTowerCooldownRemaining > 0 ? bData.arrowTowerCooldownRemaining : 0;
        b.beerRefillCooldown = bData.beerRefillCooldownRemaining > 0 ? bData.beerRefillCooldownRemaining : 0;

        delete b._residents;
        delete b._warriorSlots;

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
        } else if (b.ruined || !b.built) {
          world.buildSites.push(b);
        }

        for (let dy = 0; dy < b.h; dy++) {
          for (let dx = 0; dx < b.w; dx++) {
            world.occupied.add((b.x + dx) + ',' + (b.y + dy));
          }
        }
      }
    }

    // ⚠️ Cache invalidieren, nachdem Gebäude geladen wurden und das Territorium steht
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
        v._repairWaitingUntil = vData._repairWaitingUntil || 0;
        
        // Zustände beim Laden bereinigen (State Sanitization)
        if (v.state === 'harvesting_hit' || v.state === 'fishing_dive' || v.state === 'moving' || v.state === 'harvesting') {
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
          console.log(`🏴 Räuberlager (zerstört) wiederhergestellt. Respawn in ${Math.round((rData.respawnAtRemaining || 0) / 60000)} Minuten.`);
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
              raiderVillage.warriors.set(w.id, w);
            }
          }

          raiderVillage._computeBoundary();

          raiderVillage.nextAttackAt = now + Math.max(0, rData.nextAttackAtRemaining || 0);
          raiderVillage.firstAttackDone = !!rData.firstAttackDone;
          raiderVillage.spawnGracePeriodEnds = now + Math.max(0, rData.spawnGracePeriodEndsRemaining || 0);

          console.log(`🏴 Räuberlager wiederhergestellt. Nächster Angriff in ${Math.round((rData.nextAttackAtRemaining || 0) / 1000)}s.`);
        }
      } catch (e) {
        console.warn("Räuberlager konnte nicht geladen werden:", e);
        raiderVillage = null;
      }
    }

    await progress(85, "Zustände reparieren...");
    this._sanitizeLoadedState(world, vm, economy);

    await progress(90, "Welt zusammensetzen...");

    const dragonSaveData = data.dragon || null;
    if (dragonSaveData && dragonSaveData.nextSpawnAtRemaining !== undefined) {
      dragonSaveData.nextSpawnAt = now + dragonSaveData.nextSpawnAtRemaining;
    }

    onComplete(world, ticker, economy, vm, zombieManager, raiderVillage, dragonSaveData);
  },

  _sanitizeLoadedState(world, vm, economy) {
    for (const v of vm.villagers.values()) {
      if (v.workplaceId) {
        const b = world.buildings.get(v.workplaceId);
        if (!b || b.ruined || !b.built) {
          v.workplaceId = null;
          v.job = 'free';
          v.state = 'idle';
          v.task = null;
          v.hidden = true;
        }
      }
      if (v.task === 'go_to_work' && !v.workplaceId) {
        v.task = null;
        v.state = 'idle';
      }

      if ((v.task === 'tree_harvest_arrived' && !v._reservedTree) ||
          (v.task === 'stone_harvest_arrived' && !v._reservedStone) ||
          (v.task === 'fish_harvest_arrived' && !v._reservedWater)) {

        const workplace = v.workplaceId ? world.buildings.get(v.workplaceId) : null;
        if (workplace) {
          v.task = 'return_to_building';
          v.state = 'moving';
          v.hidden = false;
          v.moveStartX = v.x;
          v.moveStartY = v.y;
          v.targetX = workplace.x;
          v.targetY = workplace.y + (workplace.h || 1) - 1;

          const dx = v.targetX - v.x;
          const dy = v.targetY - v.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          let speed = v.speed || 2;
          v.moveDuration = (dist / speed) * 1000;
          v.moveStartTime = performance.now();
        } else {
          v.state = 'idle';
          v.task = null;
          v.hidden = true;
        }

        v.harvestHitCount = 0;
        v.harvestTotalCount = 0;
        v.harvestExclude = null;
        v._pendingStorageGain = 0;
      }
    }

    for (const b of world.buildings.values()) {
      if (!b.built || b.ruined) continue;

      const isJobBuilding = b.def.produces || b.def.recipe || b.def.generatesResource
        || b.def.hasArrowTower
        || b.def.id === 'lumberjack' || b.def.id === 'quarry' || b.def.id === 'fisher'
        || b.def.id === 'forsthaus';

      if (isJobBuilding) {
        if (b.workerId !== null) {
          const worker = vm.villagers.get(b.workerId);
          if (!worker || worker.workplaceId !== b.id) {
            b.workerId = null;
          }
        }

        if (b.workerId === null) {
          if (!world.freeJobs.has(b)) {
            world.freeJobs.add(b);
          }
        } else {
          world.freeJobs.delete(b);
        }
      }

      if (b.def.isHouse && b.residents && b.residents.length > 0) {
        const validResidents = [];
        for (const rid of b.residents) {
          const v = vm.villagers.get(rid);
          if (v && v.homeId === b.id && v.job === 'free' && v.workplaceId === null) {
            validResidents.push(rid);
            v.state = 'idle';
            v.task = null;
            v.hidden = true;
          }
        }
        b.residents = validResidents;
      }
    }
  }
};
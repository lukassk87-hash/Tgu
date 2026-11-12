window.Game = window.Game || {};

Game.VillagerManager = class VillagerManager {
  constructor(world, ticker, economy) {
    this.world = world;
    this.ticker = ticker;
    this.economy = economy;
    this.villagers = new Map();
    this.nextId = 1;
    this.onHarvest = null;
    this.onDeath = null;
    this.zombieManager = null;
    this.breadManager = null;

    this._cachedList = [];
    this._listDirty = true;
    this._idleVillagers = new Set();
    this._idleCheckCooldown = 0;

    this._spatialGrid = new Map();
    this._warriorGrid = new Map();
    this._gridCellSize = 10;
    this._gridDirty = true;
    this._gridRebuildCooldown = 0;

    this.ticker.onTick((tick) => this.update(tick));
  }

  getAllVillagers() {
    if (this._listDirty) {
      this._cachedList = Array.from(this.villagers.values());
      this._listDirty = false;
    }
    return this._cachedList;
  }

  _rebuildSpatialGrid() {
    this._spatialGrid.clear();
    this._warriorGrid.clear();
    const cellSize = this._gridCellSize;
    for (const v of this.villagers.values()) {
      if (v.hidden) continue;
      const cx = Math.floor(v.renderX / cellSize);
      const cy = Math.floor(v.renderY / cellSize);
      const key = cx + ',' + cy;
      let cell = this._spatialGrid.get(key);
      if (!cell) {
        cell = new Set();
        this._spatialGrid.set(key, cell);
      }
      cell.add(v);

      if (v.job === 'warrior') {
        let wcell = this._warriorGrid.get(key);
        if (!wcell) {
          wcell = new Set();
          this._warriorGrid.set(key, wcell);
        }
        wcell.add(v);
      }
    }
    this._gridDirty = false;
  }

  _queryGrid(grid, worldX, worldY) {
    const cellSize = this._gridCellSize;
    const cx = Math.floor(worldX / cellSize);
    const cy = Math.floor(worldY / cellSize);
    const result = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const key = (cx + dx) + ',' + (cy + dy);
        const cell = grid.get(key);
        if (cell) {
          for (const v of cell) result.push(v);
        }
      }
    }
    return result;
  }

  getNearbyVillagers(worldX, worldY) {
    if (this._gridDirty) {
      this._gridRebuildCooldown--;
      if (this._gridRebuildCooldown <= 0) {
        this._rebuildSpatialGrid();
        this._gridRebuildCooldown = 3;
      }
    }
    return this._queryGrid(this._spatialGrid, worldX, worldY);
  }

  getNearbyWarriors(worldX, worldY) {
    if (this._gridDirty) {
      this._gridRebuildCooldown--;
      if (this._gridRebuildCooldown <= 0) {
        this._rebuildSpatialGrid();
        this._gridRebuildCooldown = 3;
      }
    }
    return this._queryGrid(this._warriorGrid, worldX, worldY);
  }

  _markGridDirty() {
    this._gridDirty = true;
  }

  _getRecipeWorkerAsset(b) {
    if (!b) return null;
    if (b.def.id === 'bakery') return 'images/baecker.webp';
    if (b.def.id === 'sawmill') return 'images/saeger.webp';
    if (b.def.id === 'mill') return 'images/mueller.webp';
    if (b.def.id === 'brewery') return 'images/brauer.webp';
    if (b.def.id === 'arrowSmith') return 'images/pfeilbauer.webp';
    if (b.def.id === 'arrowTower') return 'images/bogenschuetze.webp';
    if (b.def.id === 'feedMaker') return 'images/fuetterer.webp';
    if (b.def.id === 'pigFarm') return 'images/schweinebauer.webp';
    if (b.def.id === 'butcher') return 'images/schlachter.webp';
    if (b.def.id === 'apotheke') return 'images/apotheker.webp';
    if (b.def.id === 'arztpraxis') return 'images/arzt.webp';
    return null;
  }

  getEffectiveWorkSpeed(v) {
    if (!v || !v.isSick) return 1.0;
    if (!v.workplaceId) return 1.0;
    const b = this.world.buildings.get(v.workplaceId);
    if (!b) return 1.0;
    if (b.def.immuneToSickness) return 1.0;
    if (b.def.recipe) return 1 / 3;
    return 1.0;
  }

  spawn(x, y, job, homeId) {
    const v = {
      id: this.nextId++,
      name: Game.Names ? Game.Names.randomFullName() : ('Bewohner ' + this.nextId),
      x, y, renderX: x, renderY: y,
      targetX: x, targetY: y,
      moveStartX: x, moveStartY: y,
      moveStartTime: performance.now(),
      moveDuration: 0,
      job: job, homeId: homeId, workplaceId: null,
      state: 'idle', task: null, carrying: null,
      speed: 2, buildTargetId: null,
      asset: 'images/villager-idle-rot.webp',
      hidden: true, harvestQueue: [], harvestWait: 0,
      isLogistics: false,
      warriorBuildingId: null,
      warriorSlotIndex: -1,
      recipeCarrying: null,
      beerBuff: false,
      beerBuffTimer: 0,
      beerDrinkTimer: 0,
      huntingZombieId: null,
      nextBreadAt: performance.now(),
      reservedLogistics: false,

      harvestHitCount: 0,
      harvestTotalCount: 0,
      harvestExclude: null,
      _pendingStone: null,
      _pendingTree: null,
      _pendingWater: null,
      _fishHarvestStart: 0,
      _pendingStorageGain: 0,

      _reservedTree: null,
      _reservedStone: null,
      _reservedWater: null,

      _fishHungry: false,

      _forestPlantTimer: 0,
      _plantTargetX: -1,
      _plantTargetY: -1,

      _repairBuildingId: null,
      _repairFetchCarrying: null,
      _repairWaitingUntil: 0,

      _diedFromZombie: false,
      
      _fireTargetId: null,
      _fireWaterCarried: 0,
      _fireSourceId: null,
      _waterFetchAmount: 0,

      _lastFireDispatchTime: 0,
      _fireDispatchAt: 0,
      _fireStationX: 0,
      _fireStationY: 0,

      _recoverUntil: 0,

      // Krankheit
      isSick: false,
      _sickSince: 0,
      _sickHealAt: 0,
      _treatmentTargetId: null,
      _fetchAntibioticsAmount: 0
    };
    this.villagers.set(v.id, v);
    this._listDirty = true;
    this._markGridDirty();
    if (job === 'free') this._idleVillagers.add(v.id);
    if (this.breadManager) this.breadManager.add(v);
    return v;
  }

  _releaseReservations(v) {
    if (!v) return;
    if (v._reservedTree) {
      this.world.releaseTree(v._reservedTree);
      v._reservedTree = null;
    }
    if (v._reservedStone) {
      this.world.releaseStone(v._reservedStone);
      v._reservedStone = null;
    }
    if (v._reservedWater) {
      this.world.releaseFishWater(v._reservedWater);
      v._reservedWater = null;
    }
  }

  assignWarriorSlot(b, v) {
    if (!b.warriorSlots) return false;
    // Prüfen, ob der Villager schon einen Slot in diesem Gebäude hat
    const existing = b.warriorSlots.indexOf(v.id);
    if (existing !== -1) {
      v.warriorSlotIndex = existing;
      return true;
    }
    for (let i = 0; i < b.warriorSlots.length; i++) {
      if (b.warriorSlots[i] === null) {
        b.warriorSlots[i] = v.id;
        v.warriorSlotIndex = i;
        return true;
      }
    }
    return false;
  }

  releaseWarriorSlot(b, villagerId) {
    if (!b.warriorSlots) return;
    for (let i = 0; i < b.warriorSlots.length; i++) {
      if (b.warriorSlots[i] === villagerId) {
        b.warriorSlots[i] = null;
        return;
      }
    }
  }

  countWarriors(b) {
    if (!b.warriorSlots) return 0;
    let n = 0;
    for (const id of b.warriorSlots) if (id !== null) n++;
    return n;
  }

  // ==========================================================
  // NEU (zentral): Krieger kehrt zum Posten zurück
  // Findet IMMER einen gültigen Post oder gibt den Villager frei.
  // Kein Hängenbleiben, kein Endlos-Loop, kein Teleport.
  // ==========================================================
  startReturnToPost(v) {
    if (!v || v.job !== 'warrior') return;

    let post = v.warriorBuildingId ? this.world.buildings.get(v.warriorBuildingId) : null;

    // Prüfen, ob der Post noch gültig ist
    const postValid = post && post.built && !post.ruined && post.warriorSlots;

    if (!postValid) {
      post = null;
    }

    // Wenn der aktuelle Slot-Index im aktuellen Post noch zu uns gehört → alles gut
    if (post && v.warriorSlotIndex >= 0) {
      const currentSlotOwner = post.warriorSlots[v.warriorSlotIndex];
      if (currentSlotOwner !== v.id && currentSlotOwner !== null) {
        // Slot wurde von jemand anderem belegt → wir brauchen einen neuen
        post = null;
      }
    }

    // Falls der Post ungültig ist: neuen Post suchen
    if (!post) {
      let foundPost = null;

      // Erst prüfen: Sind wir noch irgendwo in warriorSlots eingetragen?
      for (const b of this.world.warriorBuildings) {
        if (!b.built || b.ruined || !b.warriorSlots) continue;
        const existingIdx = b.warriorSlots.indexOf(v.id);
        if (existingIdx !== -1) {
          v.warriorBuildingId = b.id;
          v.warriorSlotIndex = existingIdx;
          v.workplaceId = b.id;
          foundPost = b;
          break;
        }
      }

      // Sonst: freien Slot suchen
      if (!foundPost) {
        for (const b of this.world.warriorBuildings) {
          if (!b.built || b.ruined || !b.warriorSlots) continue;
          for (let i = 0; i < b.warriorSlots.length; i++) {
            if (b.warriorSlots[i] === null) {
              b.warriorSlots[i] = v.id;
              v.warriorBuildingId = b.id;
              v.warriorSlotIndex = i;
              v.workplaceId = b.id;
              foundPost = b;
              break;
            }
          }
          if (foundPost) break;
        }
      }

      // Kein Post mehr verfügbar → Villager freigeben
      if (!foundPost) {
        v.job = 'free';
        v.state = 'idle';
        v.workplaceId = null;
        v.warriorBuildingId = null;
        v.warriorSlotIndex = -1;
        v.task = null;
        v.hidden = true;
        v.renderX = v.x;
        v.renderY = v.y;
        this._idleVillagers.add(v.id);
        return;
      }

      post = foundPost;
    }

    // Jetzt: Bewegung zum Post starten
    v.task = 'returning_to_post';
    v.state = 'moving';
    v.hidden = false;
    v.asset = 'images/villager-krieger-rot.webp';
    this.startMove(v, post.x, post.y + (post.h || 1) - 1);
  }

  assignToFireStation(v, b) {
    if (!v || !b) return false;
    if (!b.workerIds) b.workerIds = [];
    const maxW = b.def.maxWorkers || 3;
    if (b.workerIds.length >= maxW) return false;
    if (b.workerIds.indexOf(v.id) !== -1) return false;

    b.workerIds.push(v.id);

    v.job = 'worker';
    v.workplaceId = b.id;
    v.task = 'go_to_work';
    v.hidden = false;

    this._idleVillagers.delete(v.id);

    const home = this.world.buildings.get(v.homeId);
    if (home && home.residents) {
      const idx = home.residents.indexOf(v.id);
      if (idx !== -1) home.residents.splice(idx, 1);
    }

    this.startMove(v, b.x, b.y + (b.h || 1) - 1);
    return true;
  }

  removeVillager(v) {
    if (!v) return;
    if (!this.villagers.has(v.id)) return;

    const fireMgr = Game.state && Game.state.fireManager;
    if (fireMgr && v._fireTargetId !== null) {
      const targetB = this.world.buildings.get(v._fireTargetId);
      if (targetB) {
        fireMgr.dequeueWorker(targetB, v.id);
      }
    }

    const sicknessMgr = Game.state && Game.state.sicknessManager;
    if (sicknessMgr && typeof sicknessMgr.onVillagerRemoved === 'function') {
      sicknessMgr.onVillagerRemoved(v);
    }

    this._releaseReservations(v);

    if (v._repairBuildingId !== null) {
      const b = this.world.buildings.get(v._repairBuildingId);
      if (b && b.isBeingRepaired && b.builderId === v.id) {
        Game.Buildings.cancelRepair(this.world, b);
      }
      v._repairBuildingId = null;
      v._repairFetchCarrying = null;
    }

    this.villagers.delete(v.id);
    this._listDirty = true;
    this._idleVillagers.delete(v.id);
    this._markGridDirty();

    if (this.breadManager && !v._diedFromHunger) {
      this.breadManager.remove(v);
    }

    for (const b of this.world.buildings.values()) {
      let needsFreeJob = false;

      if (b.workerId === v.id) {
        b.workerId = null;
        needsFreeJob = true;
      }

      if (b.workerIds) {
        const idx = b.workerIds.indexOf(v.id);
        if (idx !== -1) {
          b.workerIds.splice(idx, 1);
          needsFreeJob = true;
        }
      }

      if (b.builderId === v.id) {
        b.builderId = null;
      }

      if (b.warriorSlots) {
        const idx = b.warriorSlots.indexOf(v.id);
        if (idx !== -1) {
          b.warriorSlots[idx] = null;
        }
      }

      if (b.residents && b.residents.length > 0) {
        const ri = b.residents.indexOf(v.id);
        if (ri !== -1) b.residents.splice(ri, 1);
      }

      if (b.recipeFetchWorkerId === v.id) {
        b.recipeFetchWorkerId = null;
      }

      if (b.logisticsId === v.id) {
        b.logisticsId = null;
        b.isBeingCollected = false;
      }

      if (b.fishPendingFetch && b.workerId === null) {
        b.fishPendingFetch = false;
        b.fishRetryTimer = -30;
      }

      if (b.fetchingArrows && b.workerId === null) {
        b.fetchingArrows = false;
      }

      if (needsFreeJob) {
        const isJobBuilding = b.built && (
          b.def.produces ||
          b.def.recipe ||
          b.def.generatesResource ||
          b.def.hasArrowTower ||
          b.def.id === 'lumberjack' ||
          b.def.id === 'quarry' ||
          b.def.id === 'fisher' ||
          b.def.id === 'forsthaus' ||
          b.def.id === 'fireStation' ||
          b.def.id === 'arztpraxis'
        );
        if (isJobBuilding && !this.world.freeJobs.has(b)) {
          if (b.def.id === 'fireStation') {
            const maxW = b.def.maxWorkers || 3;
            if ((b.workerIds ? b.workerIds.length : 0) < maxW) {
              this.world.freeJobs.add(b);
            }
          } else {
            this.world.freeJobs.add(b);
          }
        }
      }
    }

    if (this.onDeath) this.onDeath(v);
  }

  killVillager(v) {
    if (!v) return;
    this.removeVillager(v);
  }

  startMove(v, tx, ty) {
    // ⚠️ GEFIXT: Position sauber einfrieren, bevor neue Bewegung startet.
    // Verhindert Sprünge/Teleport wenn state schon 'moving' war.
    if (v.state === 'moving' && v.moveDuration > 0) {
      const now = performance.now();
      let t = (now - v.moveStartTime) / v.moveDuration;
      if (t > 1) t = 1;
      if (t < 0) t = 0;
      v.x = v.moveStartX + (v.targetX - v.moveStartX) * t;
      v.y = v.moveStartY + (v.targetY - v.moveStartY) * t;
    }

    v.moveStartX = v.x;
    v.moveStartY = v.y;
    v.renderX = v.x;
    v.renderY = v.y;
    v.targetX = tx;
    v.targetY = ty;
    const dx = tx - v.x, dy = ty - v.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    let speed = v.speed;
    if (v.job === 'warrior' && v.beerBuff) {
      speed = v.speed * 1.25;
    }
    v.moveDuration = (dist / speed) * 1000;
    v.moveStartTime = performance.now();
    v.state = 'moving';
    this._idleVillagers.delete(v.id);
    this._markGridDirty();
  }

  update(tick) {
    const now = performance.now();
    const isDragonAttack = this.world.dragonAttackActive;

    this._idleCheckCooldown--;
    if (this._idleCheckCooldown <= 0) {
      this._idleCheckCooldown = 5;
      if (this._idleVillagers.size > 0) {
        const idleIds = Array.from(this._idleVillagers);
        for (const id of idleIds) {
          const v = this.villagers.get(id);
          if (!v) { this._idleVillagers.delete(id); continue; }
          if (v.state !== 'idle' || v.carrying || v.job === 'warrior') {
            this._idleVillagers.delete(id);
            continue;
          }
          if (v.reservedLogistics) continue;

          if (v._recoverUntil && now < v._recoverUntil) {
            continue;
          }

          this.findTaskForVillager(v);
        }
      }
    }

    for (const v of this.villagers.values()) {
      
      if (v.state === 'attacking_raiders' || v.state === 'vfightback' || v.state === 'vfighting' || v.state === 'zfighting' || v.state === 'dragon_attack' || v.state === 'vdefend') {
        v.hidden = false;
        v.asset = 'images/villager-krieger-rot.webp';
        this._markGridDirty();
        continue;
      }

      if (v.state === 'sick_treating') {
        v.hidden = true;
        v.asset = 'images/krank.webp';
        this._markGridDirty();
        continue;
      }

      if (v.state === 'sick_walking_to_praxis') {
        v.hidden = false;
        v.asset = 'images/krank.webp';
        this._markGridDirty();
        if (now - v.moveStartTime >= v.moveDuration) {
          v.x = v.targetX; v.y = v.targetY;
          this.onArrive(v);
        }
        continue;
      }

      if (v.state === 'sick_walking_back') {
        v.hidden = false;
        v.asset = 'images/krank.webp';
        this._markGridDirty();
        if (now - v.moveStartTime >= v.moveDuration) {
          v.x = v.targetX; v.y = v.targetY;
          this.onArrive(v);
        }
        continue;
      }

      if (v.state === 'extinguish_waiting') {
        if (now >= v._fireDispatchAt) {
          this.startMove(v, v._fireStationX, v._fireStationY);
        } else {
          v.hidden = false;
          v.asset = 'images/feuerwehrmann.webp';
          this._markGridDirty();
          continue;
        }
      }

      if (v.state === 'working' && v.job === 'worker' && v.workplaceId) {
        const wb = this.world.buildings.get(v.workplaceId);
        if (!wb) {
          this._releaseReservations(v);
          v.state = 'idle';
          v.workplaceId = null;
          v.hidden = true;
        } else if (wb.def.id === 'fireStation') {
          if (!wb.workerIds || wb.workerIds.indexOf(v.id) === -1) {
            this._releaseReservations(v);
            v.state = 'idle';
            v.workplaceId = null;
            v.hidden = true;
          }
        } else if (wb.def.id === 'arztpraxis') {
          // Arzt in Praxis bleibt
        } else if (wb.workerId !== v.id) {
          this._releaseReservations(v);
          v.state = 'idle';
          v.workplaceId = null;
          v.hidden = true;
        }
      }

      if (v.state === 'moving') {
        if (now - v.moveStartTime >= v.moveDuration) {
          v.x = v.targetX; v.y = v.targetY;
          this.onArrive(v);
        }
      }

      if (v.state === 'harvesting') {
        v.harvestWait--;
        if (v.harvestWait <= 0) this.continueHarvestRoute(v);
      }

      if (v.state === 'harvesting_hit') {
        if (now - v.harvestHitStart >= v.harvestHitDuration) {
          this._onHarvestHit(v);
        }
      }

      if (v.state === 'fishing_dive') {
        if (now - v._fishHarvestStart >= 15000) {
          this._onFishingComplete(v);
        }
      }

      if (v.state === 'idle' && !v.carrying && v.job !== 'warrior') {
        this._idleVillagers.add(v.id);
      } else {
        this._idleVillagers.delete(v.id);
      }

      if (v.state === 'moving' || v.state === 'building' || v.state === 'harvesting'
          || v.state === 'harvesting_hit' || v.state === 'fishing_dive'
          || v.state === 'returning_to_post' || v.state === 'repairing'
          || v.state === 'repair_fetching' || v.state === 'repair_returning'
          || v.state === 'extinguish_fetch' || v.state === 'extinguish_go' || v.state === 'extinguish_return' || v.state === 'extinguishing'
          || v.state === 'extinguish_waiting'
          || v.state === 'fetch_water_storage' || v.state === 'fetch_water_return'
          || v.state === 'sick_walking_to_praxis' || v.state === 'sick_walking_back'
          || v.state === 'fetch_antibiotics_storage' || v.state === 'fetch_antibiotics_return'
          || v.task === 'return_to_station') {
        v.hidden = false;
        this._markGridDirty();
      } else {
        v.hidden = true;
      }

      let recipeAsset = null;
      if (v.workplaceId) {
        const wb = this.world.buildings.get(v.workplaceId);
        if (wb && (wb.def.recipe || wb.def.hasArrowTower)) {
          recipeAsset = this._getRecipeWorkerAsset(wb);
        }
      }

      if (v.isSick && (v.state === 'sick_walking_to_praxis' || v.state === 'sick_walking_back')) {
        v.asset = 'images/krank.webp';
      }
      else if (v.state === 'fetch_antibiotics_storage' || v.state === 'fetch_antibiotics_return') {
        v.asset = 'images/arzt.webp';
      }
      else if (v.job === 'warrior') {
        v.asset = 'images/villager-krieger-rot.webp';
      }
      else if (v.state === 'extinguish_fetch' || v.state === 'extinguish_go' || v.state === 'extinguish_return' || v.state === 'extinguishing'
               || v.state === 'extinguish_waiting'
               || v.state === 'fetch_water_storage' || v.state === 'fetch_water_return'
               || v.task === 'return_to_station') {
        v.asset = 'images/feuerwehrmann.webp';
      }
      else if (v.task === 'go_to_build' || v.state === 'building' || v.state === 'repairing') {
        v.asset = 'images/villager-baumeister-rot.webp';
      }
      else if (v.task === 'repair_fetch_storage' || v.task === 'repair_return' || v.state === 'repair_fetching' || v.state === 'repair_returning') {
        v.asset = 'images/villager-baumeister-rot.webp';
      }
      else if (v.state === 'fishing_dive' || (v.task === 'fish_harvest_arrived' && v.state === 'moving')) {
        v.asset = 'images/villager-angler-rot.webp';
      }
      else if ((v.task === 'go_to_work' || v.task === 'fetch_arrows_storage' || v.task === 'fetch_arrows_return') && v.workplaceId) {
        const wb = this.world.buildings.get(v.workplaceId);
        if (wb) {
          const wpAsset = this._getRecipeWorkerAsset(wb);
          v.asset = wpAsset || 'images/villager-idle-rot.webp';
        } else {
          v.asset = 'images/villager-idle-rot.webp';
        }
      }
      else if (v.job === 'worker' && v.workplaceId) {
        const wb = this.world.buildings.get(v.workplaceId);
        if (wb && wb.def.id === 'forsthaus') {
          v.asset = 'images/foerster.webp';
        }
        else if (wb && wb.def.id === 'fireStation') {
          v.asset = 'images/feuerwehrmann.webp';
        }
        else if (wb && wb.def.id === 'arztpraxis') {
          v.asset = 'images/arzt.webp';
        }
        else if (wb && wb.def.id === 'apotheke') {
          v.asset = 'images/apotheker.webp';
        }
        else if (recipeAsset) v.asset = recipeAsset;
        else if (wb && (wb.def.produces === 'wood' || wb.def.id === 'lumberjack')) v.asset = 'images/villager-holzfaeller-rot.webp';
        else if (wb && (wb.def.produces === 'stone' || wb.def.id === 'quarry')) v.asset = 'images/villager-steinmetz-rot.webp';
        else if (wb && wb.def.produces === 'grain') v.asset = 'images/villager-bauer-rot.webp';
        else if (wb && (wb.def.id === 'fisher' || wb.def.produces === 'fish')) v.asset = 'images/villager-angler-rot.webp';
        else v.asset = 'images/villager-idle-rot.webp';
      }
      else if (v.isLogistics) {
        if (v.job === 'worker' && v.workplaceId) {
          const b = this.world.buildings.get(v.workplaceId);
          if (b) {
            if (recipeAsset) v.asset = recipeAsset;
            else if (b.def.produces === 'wood' || b.def.id === 'lumberjack') v.asset = 'images/villager-holzfaeller-rot.webp';
            else if (b.def.produces === 'stone' || b.def.id === 'quarry') v.asset = 'images/villager-steinmetz-rot.webp';
            else if (b.def.produces === 'grain') v.asset = 'images/villager-bauer-rot.webp';
            else if (b.def.id === 'fisher' || b.def.produces === 'fish') v.asset = 'images/villager-angler-rot.webp';
            else v.asset = 'images/villager-idle-rot.webp';
          }
        } else {
          v.asset = 'images/villager-idle-rot.webp';
        }
      }
      else if (v.carrying) {
        if (recipeAsset) v.asset = recipeAsset;
        else if (v.carrying.type === 'wood') v.asset = 'images/villager-holzfaeller-rot.webp';
        else if (v.carrying.type === 'stone') v.asset = 'images/villager-steinmetz-rot.webp';
        else if (v.carrying.type === 'grain') v.asset = 'images/villager-bauer-rot.webp';
        else if (v.carrying.type === 'fish') v.asset = 'images/villager-angler-rot.webp';
      }
      else {
        v.asset = 'images/villager-idle-rot.webp';
      }
    }
  }

  onArrive(v) {
    const currentTask = v.task;

    if (currentTask === 'go_to_work') {
      v.job = 'worker';
      v.state = 'working';
      const building = this.world.buildings.get(v.workplaceId);
      if (building) {
        if (building.def.id === 'fireStation') {
          // Nichts tun
        } else if (building.def.id === 'arztpraxis') {
          // Nichts tun (Arzt bleibt im Gebäude)
        } else {
          building.workerId = v.id;
        }
      } else {
        v.workplaceId = null;
        v.state = 'idle';
      }
      v.hidden = true;
      v.task = null;

    } else if (currentTask === 'go_to_warrior_post') {
      v.job = 'warrior';
      v.state = 'working';
      v.hidden = true;
      v.task = null;

      const post = v.warriorBuildingId ? this.world.buildings.get(v.warriorBuildingId) : null;
      if (post) {
        const px = post.x + Math.floor((post.w || 1) / 2);
        const py = post.y + Math.floor((post.h || 1) / 2);
        v.x = px;
        v.y = py;
        v.renderX = px;
        v.renderY = py;
        v.targetX = px;
        v.targetY = py;
        v.moveDuration = 0;
      }

    } else if (currentTask === 'returning_to_post') {
      // ⚠️ GEFIXT: Sauberer Ablauf, keine Teleports auf einen Fleck.
      // 1. Prüfe, ob der Post noch gültig ist
      // 2. Stelle sicher, dass wir in genau EINEM Slot sind
      // 3. Aktualisiere warriorSlotIndex IMMER
      // 4. Setze targetX/Y + moveDuration, damit keine Sprünge entstehen

      v.job = 'warrior';
      v.state = 'working';
      v.hidden = true;
      v.task = null;

      let post = v.warriorBuildingId ? this.world.buildings.get(v.warriorBuildingId) : null;
      const postValid = post && post.built && !post.ruined && post.warriorSlots;

      let assigned = false;
      let finalSlot = -1;

      if (postValid) {
        // 1) Prüfen, ob wir noch in irgendeinem Slot dieses Posts stehen
        const existingIdx = post.warriorSlots.indexOf(v.id);

        if (existingIdx !== -1) {
          // Wir sind schon eingetragen → diesen Slot übernehmen
          // doppelte Einträge bereinigen
          for (let i = 0; i < post.warriorSlots.length; i++) {
            if (i !== existingIdx && post.warriorSlots[i] === v.id) {
              post.warriorSlots[i] = null;
            }
          }
          finalSlot = existingIdx;
          assigned = true;
        } else {
          // 2) Sonst: freien Slot suchen
          for (let i = 0; i < post.warriorSlots.length; i++) {
            if (post.warriorSlots[i] === null) {
              post.warriorSlots[i] = v.id;
              finalSlot = i;
              assigned = true;
              break;
            }
          }
        }
      }

      if (assigned) {
        v.warriorSlotIndex = finalSlot;
        v.warriorBuildingId = post.id;
        v.workplaceId = post.id;

        const px = post.x + Math.floor((post.w || 1) / 2);
        const py = post.y + Math.floor((post.h || 1) / 2);
        v.x = px;
        v.y = py;
        v.renderX = px;
        v.renderY = py;
        v.targetX = px;
        v.targetY = py;
        v.moveStartX = px;
        v.moveStartY = py;
        v.moveDuration = 0;
      } else {
        // Post weg oder voll → anderen Post suchen
        let foundPost = null;
        for (const b of this.world.warriorBuildings) {
          if (!b.built || b.ruined || !b.warriorSlots) continue;
          for (let i = 0; i < b.warriorSlots.length; i++) {
            if (b.warriorSlots[i] === null) {
              b.warriorSlots[i] = v.id;
              v.warriorBuildingId = b.id;
              v.warriorSlotIndex = i;
              v.workplaceId = b.id;
              foundPost = b;
              break;
            }
          }
          if (foundPost) break;
        }

        if (foundPost) {
          const px = foundPost.x + Math.floor((foundPost.w || 1) / 2);
          const py = foundPost.y + Math.floor((foundPost.h || 1) / 2);
          v.x = px;
          v.y = py;
          v.renderX = px;
          v.renderY = py;
          v.targetX = px;
          v.targetY = py;
          v.moveStartX = px;
          v.moveStartY = py;
          v.moveDuration = 0;
        } else {
          // Kein Post mehr frei → Villager wird frei
          v.job = 'free';
          v.state = 'idle';
          v.workplaceId = null;
          v.warriorBuildingId = null;
          v.warriorSlotIndex = -1;
          this._idleVillagers.add(v.id);
        }
      }

    } else if (currentTask === 'sick_walking_to_praxis') {
      v.task = null;
      const praxisB = v._treatmentTargetId ? this.world.buildings.get(v._treatmentTargetId) : null;
      if (praxisB && praxisB.def.id === 'arztpraxis' && !praxisB.ruined) {
        const sicknessMgr = Game.state && Game.state.sicknessManager;
        if (sicknessMgr) {
          v.state = 'sick_treating';
          v.task = 'sick_treating';
          v.x = praxisB.x + (praxisB.w || 1) / 2;
          v.y = praxisB.y + (praxisB.h || 1) / 2;
          v.renderX = v.x;
          v.renderY = v.y;
          v.hidden = true;
          sicknessMgr.onPatientArrived(v, praxisB);
        } else {
          v.state = 'working';
          v.hidden = true;
        }
      } else {
        v._treatmentTargetId = null;
        v.state = 'working';
        v.hidden = true;
      }

    } else if (currentTask === 'sick_walking_back') {
      v.task = null;
      v.state = 'working';
      v.hidden = true;

    } else if (currentTask === 'fetch_antibiotics_storage') {
      v.task = null;
      const praxisB = this.world.buildings.get(v.workplaceId);
      if (!praxisB || praxisB.def.id !== 'arztpraxis') {
        v.state = 'working';
        v.hidden = true;
        return;
      }

      const sicknessMgr = Game.state && Game.state.sicknessManager;
      if (!sicknessMgr) {
        v.state = 'working';
        v.hidden = true;
        return;
      }

      const takeAmount = sicknessMgr.takeAntibioticsFromStorage(praxisB);

      if (takeAmount > 0) {
        v._fetchAntibioticsAmount = takeAmount;
        v.task = 'fetch_antibiotics_return';
        v.state = 'moving';
        this.startMove(v, praxisB.x, praxisB.y + (praxisB.h || 1) - 1);
        v.hidden = false;
      } else {
        praxisB.fetchAntibioticWorkerId = null;
        v.state = 'working';
        v.hidden = true;
      }

    } else if (currentTask === 'fetch_antibiotics_return') {
      v.task = null;
      const praxisB = this.world.buildings.get(v.workplaceId);
      if (praxisB && praxisB.def.id === 'arztpraxis') {
        const sicknessMgr = Game.state && Game.state.sicknessManager;
        if (sicknessMgr) {
          sicknessMgr.deliverAntibiotics(praxisB, v._fetchAntibioticsAmount || 0);
        }
        praxisB.fetchAntibioticWorkerId = null;
      }
      v._fetchAntibioticsAmount = 0;
      v.state = 'working';
      v.hidden = true;

    } else if (currentTask === 'go_to_build') {
      v.state = 'building';
      v.task = null;

    } else if (currentTask === 'tree_harvest_arrived') {
      v.task = null;
      const b = this.world.buildings.get(v.workplaceId);
      if (b && b.storage >= b.maxCapacity) {
        this._releaseReservations(v);
        v.state = 'working';
        v.hidden = true;
        return;
      }

      if (!v._reservedTree || !this.world.trees.has(v._reservedTree.x + ',' + v._reservedTree.y)) {
        this._releaseReservations(v);
        if (b) {
          v.task = 'return_to_building';
          this.startMove(v, b.x, b.y + (b.h || 1) - 1);
          v.hidden = false;
        } else {
          v.workplaceId = null;
          v.state = 'idle';
        }
        return;
      }

      this._startHarvestHits(v);

    } else if (currentTask === 'stone_harvest_arrived') {
      v.task = null;
      const b = this.world.buildings.get(v.workplaceId);
      if (b && b.storage >= b.maxCapacity) {
        this._releaseReservations(v);
        v.state = 'working';
        v.hidden = true;
        return;
      }

      if (!v._reservedStone || !this.world.stones.has(v._reservedStone.cx + ',' + v._reservedStone.cy)) {
        this._releaseReservations(v);
        if (b) {
          v.task = 'return_to_building';
          this.startMove(v, b.x, b.y + (b.h || 1) - 1);
          v.hidden = false;
        } else {
          v.workplaceId = null;
          v.state = 'idle';
        }
        return;
      }

      this._startHarvestHits(v);

    } else if (currentTask === 'fish_harvest_arrived') {
      v.task = null;
      const b = this.world.buildings.get(v.workplaceId);
      if (b && b.storage >= b.maxCapacity) {
        this._releaseReservations(v);
        v.state = 'working';
        v.hidden = true;
        return;
      }

      if (!v._reservedWater || !this.world.isFishWaterActive(v._reservedWater.x, v._reservedWater.y)) {
        this._releaseReservations(v);
        if (b) {
          v.task = 'return_to_building';
          this.startMove(v, b.x, b.y + (b.h || 1) - 1);
          v.hidden = false;
        } else {
          v.workplaceId = null;
          v.state = 'idle';
        }
        return;
      }

      v.state = 'fishing_dive';
      v._fishHarvestStart = performance.now();
      v.hidden = false;

    } else if (currentTask === 'plant_tree_arrived') {
      v.task = null;
      const b = this.world.buildings.get(v.workplaceId);
      if (!b) {
        v.workplaceId = null;
        v.state = 'idle';
        return;
      }

      const tx = v._plantTargetX;
      const ty = v._plantTargetY;

      let plantedSuccessfully = false;

      if (tx >= 0 && ty >= 0 && this.world.hasSpaceForTreeAt(tx, ty)) {
        this.world.plantTree(tx, ty, performance.now());
        if (this.onHarvest) {
          this.onHarvest(tx + 0.5, ty + 0.5, 'wood');
        }
        plantedSuccessfully = true;
      }

      const baseWait = 12500;
      const fishPenalty = b.fishSlots === 0;
      const waitMs = fishPenalty ? baseWait * 4 : baseWait;

      if (plantedSuccessfully) {
        v._forestPlantTimer = waitMs;
      } else {
        v._forestPlantTimer = 0;
      }

      v.task = 'return_to_building';
      this.startMove(v, b.x, b.y + (b.h || 1) - 1);
      v.hidden = false;
      v._plantTargetX = -1;
      v._plantTargetY = -1;

    } else if (currentTask === 'harvest_route') {
      v.task = null;
      const b = this.world.buildings.get(v.workplaceId);
      if (!b || b.storage >= b.maxCapacity) {
        v.state = 'working';
        v.hidden = true;
        return;
      }

      v.state = 'harvesting';
      v.harvestWait = 1;

      b.storage += 1;
      const field = b.fields.find(f => f.x === v.x && f.y === v.y);
      if (field) { field.state = 'growing'; field.timer = 0; }

      if (this.onHarvest) {
        this.onHarvest(v.x, v.y, b.def.produces);
      }

    } else if (currentTask === 'return_to_building') {
      v.state = 'working';
      v.hidden = true;
      v.task = null;
      const b = this.world.buildings.get(v.workplaceId);
      if (b) {
        v.x = b.x; v.y = b.y + (b.h || 1) - 1;
        v.renderX = v.x; v.renderY = v.y;
        b.harvestingFinished = true;

        if (v._pendingStorageGain > 0) {
          b.storage = Math.min(b.maxCapacity, b.storage + v._pendingStorageGain);
          v._pendingStorageGain = 0;
        }

        if (b.def.id === 'lumberjack' || b.def.id === 'quarry') {
          const baseCooldown = 15000;
          const hungry = !!v._fishHungry;
          const sickMul = (v.isSick && b.def.sicknessPenalty === 'slow') ? 3 : 1;
          b.harvestCooldownUntil = performance.now() + (hungry ? baseCooldown * 4 : baseCooldown) * sickMul;
        } else if (b.def.id === 'fisher') {
          b.harvestCooldownUntil = 0;
          v._fishHungry = false;
        }
      } else {
        v.workplaceId = null;
        v.state = 'idle';
        v._pendingStorageGain = 0;
      }
      this._releaseReservations(v);

    } else if (currentTask === 'go_to_pickup') {
      v.task = null;
      const b = this.world.buildings.get(v.workplaceId);
      if (b && b.storage > 0) {
        let carryType = b.def.produces;
        if (!carryType && b.def.recipe) carryType = b.def.recipe.output;
        if (!carryType && b.def.generatesResource) carryType = b.def.generatesResource;
        if (!carryType && b.def.id === 'lumberjack') carryType = 'wood';
        if (!carryType && b.def.id === 'quarry') carryType = 'stone';
        if (!carryType && b.def.id === 'fisher') carryType = 'fish';

        v.carrying = { type: carryType, amount: b.storage };
        b.storage = 0;
        this.sendToDropoff(v);
      } else {
        v.state = 'idle';
        v.isLogistics = false;
        const b2 = this.world.buildings.get(v.workplaceId);
        if (b2) { b2.isBeingCollected = false; b2.logisticsId = null; }
      }

    } else if (currentTask === 'go_to_dropoff') {
      v.task = null;
      if (v.carrying) {
        const amount = v.carrying.amount;
        const type = v.carrying.type;
        if (Game.state && typeof Game.state.addResource === 'function') {
          Game.state.addResource(type, amount);
        } else {
          this.economy.res[type] = (this.economy.res[type] || 0) + amount;
        }
        v.carrying = null;
      }

      v.isLogistics = false;

      const b = this.world.buildings.get(v.workplaceId);
      if (b) { b.isBeingCollected = false; b.logisticsId = null; }

      if (v.job === 'worker' && b) {
        v.task = 'go_to_work';
        this.startMove(v, b.x, b.y + (b.h || 1) - 1);
        return;
      }
      v.state = 'idle';

    } else if (currentTask === 'recipe_fetch_storage') {
      v.task = null;
      const recipeB = this.world.buildings.get(v.workplaceId);
      if (recipeB) {
        const maxStorage = recipeB.def.recipeMaxStorage || {};
        const fetch = {};
        for (const inputKey in recipeB.def.recipe.inputs) {
          const max = maxStorage[inputKey] || 10;
          const current = recipeB.recipeStorage[inputKey] || 0;
          const space = max - current;
          const available = this.economy.res[inputKey] || 0;
          const take = Math.min(space, available);
          if (take > 0) fetch[inputKey] = take;
        }

        if (Object.keys(fetch).length === 0) {
          recipeB.recipeFetchWorkerId = null;
          v.state = 'working';
          v.hidden = true;
          return;
        }

        for (const k in fetch) {
          this.economy.res[k] -= fetch[k];
        }
        if (this.economy.onChange) this.economy.onChange();

        v.recipeCarrying = fetch;
        v.task = 'recipe_fetch_return';
        this.startMove(v, recipeB.x, recipeB.y + (recipeB.h || 1) - 1);
      } else {
        v.state = 'idle';
      }

    } else if (currentTask === 'recipe_fetch_return') {
      v.task = null;
      const recipeB = this.world.buildings.get(v.workplaceId);
      if (recipeB && v.recipeCarrying) {
        for (const k in v.recipeCarrying) {
          recipeB.recipeStorage[k] = (recipeB.recipeStorage[k] || 0) + v.recipeCarrying[k];
        }
        v.recipeCarrying = null;
        recipeB.recipeFetchWorkerId = null;
      }
      v.state = 'working';
      v.hidden = true;

    } else if (currentTask === 'fetch_fish_storage') {
      v.task = null;
      const b = this.world.buildings.get(v.workplaceId);
      if (b) {
        const space = 3 - b.fishSlots;
        const available = this.economy.res.fish || 0;
        const take = Math.min(space, available);

        if (take > 0) {
          this.economy.res.fish -= take;
          b.fishSlots += take;
          if (this.economy.onChange) this.economy.onChange();
        }

        v.task = 'fetch_fish_return';
        this.startMove(v, b.x, b.y + (b.h || 1) - 1);
        v.hidden = false;
      } else {
        v.state = 'idle';
      }

    } else if (currentTask === 'fetch_fish_return') {
      v.task = null;
      const b = this.world.buildings.get(v.workplaceId);
      if (b) {
        b.fishPendingFetch = false;
        if (b.fishSlots === 0) b.fishRetryTimer = -30;
      }
      v.state = 'working';
      v.hidden = true;

    } else if (currentTask === 'fetch_arrows_storage') {
      v.task = null;
      const b = this.world.buildings.get(v.workplaceId);
      if (b) {
        const space = (b.maxArrowStorage || 20) - (b.arrowStorage || 0);
        const available = this.economy.res.arrows || 0;
        const take = Math.min(space, available);

        if (take > 0) {
          this.economy.res.arrows -= take;
          b.arrowStorage = (b.arrowStorage || 0) + take;
          if (this.economy.onChange) this.economy.onChange();
        }

        v.task = 'fetch_arrows_return';
        this.startMove(v, b.x, b.y + (b.h || 1) - 1);
        v.hidden = false;
      } else {
        v.state = 'idle';
        v.workplaceId = null;
      }

    } else if (currentTask === 'fetch_arrows_return') {
      v.task = null;
      const b = this.world.buildings.get(v.workplaceId);
      if (b) {
        b.fetchingArrows = false;
      }
      v.state = 'working';
      v.hidden = true;

    } else if (currentTask === 'go_home') {
      v.hidden = true;
      v.state = 'idle';
      v.task = null;

    } else if (currentTask === 'repair_fetch_storage') {
      v.task = null;
      const repairB = this.world.buildings.get(v._repairBuildingId);
      if (!repairB || !repairB.isBeingRepaired) {
        v._repairBuildingId = null;
        v._repairFetchCarrying = null;
        v.state = 'idle';
        return;
      }

      const cost = repairB.repairCostCache;
      if (!cost) {
        v._repairBuildingId = null;
        v._repairFetchCarrying = null;
        v.state = 'idle';
        return;
      }

      let canTakeAll = true;
      for (const k in cost) {
        if ((this.economy.res[k] || 0) < cost[k]) { canTakeAll = false; break; }
      }
      if (!canTakeAll) {
        v._repairWaitingUntil = performance.now() + 5000;
        v.state = 'idle';
        v.task = null;
        v._repairBuildingId = repairB.id;
        return;
      }

      const fetched = {};
      for (const k in cost) {
        this.economy.res[k] -= cost[k];
        fetched[k] = cost[k];
      }
      if (this.economy.onChange) this.economy.onChange();

      v._repairFetchCarrying = fetched;
      v.task = 'repair_return';
      v.state = 'moving';
      this.startMove(v, repairB.x, repairB.y + (repairB.h || 1) - 1);
      v.hidden = false;

    } else if (currentTask === 'repair_return') {
      v.task = null;
      const repairB = this.world.buildings.get(v._repairBuildingId);
      if (!repairB || !repairB.isBeingRepaired) {
        v._repairBuildingId = null;
        v._repairFetchCarrying = null;
        v.state = 'idle';
        return;
      }
      v._repairFetchCarrying = null;
      v.state = 'repairing';

    } else if (currentTask === 'extinguish_fetch') {
      v.task = null;
      const stationB = this.world.buildings.get(v.workplaceId);
      if (!stationB) {
        v.state = 'idle';
        return;
      }

      const carryAmount = stationB.def.waterCarryAmount || 5;
      const availableWater = stationB.storage || 0;

      const fireMgr = Game.state && Game.state.fireManager;
      const targetStillBurning = fireMgr && fireMgr.activeFires.some(f => f.building.id === v._fireTargetId);

      if (!targetStillBurning) {
        v._fireTargetId = null;
        v._fireWaterCarried = 0;
        
        v._lastFireDispatchTime = performance.now();
        v.task = 'return_to_station';
        v.state = 'moving';
        this.startMove(v, stationB.x, stationB.y + (stationB.h || 1) - 1);
        v.hidden = false;
        return;
      }

      if (availableWater >= carryAmount) {
        stationB.storage -= carryAmount;
        v._fireWaterCarried = carryAmount;
        v._lastFireDispatchTime = performance.now();
        v.task = 'extinguish_go';
        v.state = 'moving';
        this.startMove(v, v._fireTargetX, v._fireTargetY);
        v.hidden = false;
      } else {
        v._fireWaterCarried = 0;
        v._fireTargetId = null;
        v.state = 'working';
        v.task = null;
        v.hidden = true;
      }

    } else if (currentTask === 'extinguish_go') {
      v.task = null;
      const fireMgr = Game.state && Game.state.fireManager;
      if (!fireMgr) {
        v.state = 'working';
        v.task = null;
        v.hidden = true;
        return;
      }

      const fire = fireMgr.activeFires.find(f => f.building.id === v._fireTargetId);
      
      if (!fire || !v._fireWaterCarried || v._fireWaterCarried <= 0) {
        v._fireWaterCarried = 0;
        v._fireTargetId = null;
        
        const stationB = this.world.buildings.get(v.workplaceId);
        if (stationB) {
          v._lastFireDispatchTime = performance.now();
          v.task = 'return_to_station';
          v.state = 'moving';
          this.startMove(v, stationB.x, stationB.y + (stationB.h || 1) - 1);
          v.hidden = false;
        } else {
          v.state = 'working';
          v.task = null;
          v.hidden = true;
        }
        return;
      }

      const isExtinguished = fireMgr.completeWorker(fire.building, v.id, v._fireWaterCarried);
      v._fireWaterCarried = 0;

      if (isExtinguished) {
        v._fireTargetId = null;
        v._recoverUntil = performance.now() + 3000;
        
        v.state = 'working';
        v.task = null;
        v.hidden = true;

        const stationB = this.world.buildings.get(v.workplaceId);
        if (stationB) {
          v._lastFireDispatchTime = performance.now();
          v.task = 'return_to_station';
          v.state = 'moving';
          this.startMove(v, stationB.x, stationB.y + (stationB.h || 1) - 1);
          v.hidden = false;
        }
      } else {
        v._fireTargetId = fire.building.id;
        
        const stationB = this.world.buildings.get(v.workplaceId);
        if (stationB) {
          v._lastFireDispatchTime = performance.now();
          v.task = 'extinguish_fetch';
          v.state = 'moving';
          this.startMove(v, stationB.x, stationB.y + (stationB.h || 1) - 1);
          v.hidden = false;
        } else {
          v.state = 'working';
          v.task = null;
          v.hidden = true;
        }
      }

    } else if (currentTask === 'return_to_station') {
      v._lastFireDispatchTime = performance.now();
      v.state = 'working';
      v.task = null;
      v.hidden = true;

    } else if (currentTask === 'fetch_water_storage') {
      v.task = null;
      const stationB = this.world.buildings.get(v.workplaceId);
      if (!stationB) {
        v.state = 'idle';
        return;
      }

      const maxW = stationB.def.maxWaterStorage || 50;
      const space = maxW - (stationB.storage || 0);
      const available = this.economy.res.water || 0;
      const takeAmount = Math.min(5, space, available);

      if (takeAmount > 0) {
        this.economy.res.water -= takeAmount;
        if (this.economy.onChange) this.economy.onChange();

        v._waterFetchAmount = takeAmount;
        v._lastFireDispatchTime = performance.now();
        v.task = 'fetch_water_return';
        v.state = 'moving';
        this.startMove(v, stationB.x, stationB.y + (stationB.h || 1) - 1);
        v.hidden = false;
      } else {
        v.state = 'working';
        v.task = null;
        v.hidden = true;
        if (stationB.waterFetchWorkerId === v.id) {
          stationB.waterFetchWorkerId = null;
        }
      }

    } else if (currentTask === 'fetch_water_return') {
      v.task = null;
      const stationB = this.world.buildings.get(v.workplaceId);
      if (stationB && v._waterFetchAmount > 0) {
        const maxW = stationB.def.maxWaterStorage || 50;
        stationB.storage = Math.min(maxW, (stationB.storage || 0) + v._waterFetchAmount);
        v._waterFetchAmount = 0;
      }

      if (stationB && stationB.waterFetchWorkerId === v.id) {
        stationB.waterFetchWorkerId = null;
      }

      v._lastFireDispatchTime = performance.now();
      v.state = 'working';
      v.task = null;
      v.hidden = true;

    } else {
      v.state = 'idle';
      v.task = null;
    }
  }

  _onFishingComplete(v) {
    const b = this.world.buildings.get(v.workplaceId);
    const water = v._reservedWater;

    v._pendingStorageGain = (v._pendingStorageGain || 0) + 5;

    if (water) {
      this.world.consumeFishWater(water.x, water.y, performance.now());
      this.world.releaseFishWater(water);
      v._reservedWater = null;
    }

    if (this.onHarvest) {
      this.onHarvest(v.x, v.y, 'fish');
    }

    if (b) {
      v.task = 'return_to_building';
      v.state = 'idle';
      this.startMove(v, b.x, b.y + (b.h || 1) - 1);
      v.hidden = false;
    } else {
      v.workplaceId = null;
      v.state = 'idle';
      v._pendingStorageGain = 0;
    }
    v._pendingWater = null;
    v._fishHarvestStart = 0;
  }

  _startHarvestHits(v) {
    v.harvestHitCount = 0;
    v.harvestHitStart = performance.now();
    v.harvestHitDuration = 1000;
    v.state = 'harvesting_hit';
    v.hidden = false;
  }

  _onHarvestHit(v) {
    v.harvestHitCount++;
    v.harvestHitStart = performance.now();

    const b = this.world.buildings.get(v.workplaceId);

    if (b && this.onHarvest) {
      if (b.def.id === 'lumberjack') {
        const tree = v._reservedTree;
        const px = tree ? tree.x + 1 : v.x;
        const py = tree ? tree.y + 1 : v.y;
        this.onHarvest(px, py, 'wood');
      } else if (b.def.id === 'quarry') {
        const stone = v._reservedStone;
        if (stone) {
          const stillExists = this.world.consumeStone(stone, 1);
          this.onHarvest(stone.cx, stone.cy + 1, 'stone');

          if (!stillExists) {
            this.world.releaseStone(stone);
            v._reservedStone = null;

            if (v.harvestTotalCount + v.harvestHitCount < 5) {
              const next = this.world.findNearestStoneInTerritory(v.x, v.y);
              if (next && this.world.reserveStone(next, v.id)) {
                v._reservedStone = next;
                v.harvestHitCount = 0;
                v.harvestTotalCount = 0;
                v.harvestHitStart = performance.now();
                v.harvestHitDuration = 1000;
                v.state = 'idle';
                v.task = 'stone_harvest_arrived';
                this.startMove(v, next.cx, next.cy + 1);
                v.hidden = false;
                return;
              }
            }

            if (b) {
              v.task = 'return_to_building';
              v.state = 'idle';
              this.startMove(v, b.x, b.y + (b.h || 1) - 1);
              v.hidden = false;
            } else {
              v.workplaceId = null;
              v.state = 'idle';
            }
            v.harvestHitCount = 0;
            v.harvestTotalCount = 0;
            v.harvestExclude = null;
            return;
          }
        }
      }
    }

    if (v.harvestHitCount < 5) {
      return;
    }

    v._pendingStorageGain = (v._pendingStorageGain || 0) + 5;

    if (b && b.def.id === 'lumberjack') {
      const tree = v._reservedTree;
      if (tree) {
        const now = performance.now();
        this.world.fellTree(tree.x, tree.y, now);
        if (v.harvestExclude) v.harvestExclude.add(tree.x + ',' + tree.y);
        this.world.releaseTree(tree);
        v._reservedTree = null;
      }
    } else if (b && b.def.id === 'quarry') {
      const stone = v._reservedStone;
      if (stone) {
        this.world.releaseStone(stone);
        v._reservedStone = null;
      }
    }

    v.harvestTotalCount += 5;

    const isWood = b && b.def.id === 'lumberjack';
    const isStone = b && b.def.id === 'quarry';

    if (b && v.harvestTotalCount < 5 && b.storage + (v._pendingStorageGain || 0) < b.maxCapacity) {
      let next = null;
      if (isWood) next = this.world.findNearestTreeInTerritory(v.x, v.y, v.harvestExclude);
      else if (isStone) next = this.world.findNearestStoneInTerritory(v.x, v.y);

      if (next) {
        if (isWood) {
          if (this.world.reserveTree(next, v.id)) {
            v._reservedTree = next;
            v.harvestHitCount = 0;
            v.harvestHitStart = performance.now();
            v.harvestHitDuration = 1000;
            v.state = 'idle';
            v.task = 'tree_harvest_arrived';
            this.startMove(v, next.x, next.y + 1);
            v.hidden = false;
            return;
          }
        } else if (isStone) {
          if (this.world.reserveStone(next, v.id)) {
            v._reservedStone = next;
            v.harvestHitCount = 0;
            v.harvestHitStart = performance.now();
            v.harvestHitDuration = 1000;
            v.state = 'idle';
            v.task = 'stone_harvest_arrived';
            this.startMove(v, next.cx, next.cy + 1);
            v.hidden = false;
            return;
          }
        }
      }
    }

    if (b) {
      v.task = 'return_to_building';
      v.state = 'idle';
      this.startMove(v, b.x, b.y + (b.h || 1) - 1);
      v.hidden = false;
    } else {
      v.workplaceId = null;
      v.state = 'idle';
      v._pendingStorageGain = 0;
    }
    v.harvestHitCount = 0;
    v.harvestTotalCount = 0;
    v.harvestExclude = null;
  }

  continueHarvestRoute(v) {
    if (v.harvestQueue.length > 0) {
      const b = this.world.buildings.get(v.workplaceId);
      if (b && b.storage >= b.maxCapacity) {
        if (v.workplaceId) {
          v.task = 'return_to_building';
          this.startMove(v, b.x, b.y + (b.h || 1) - 1);
          v.hidden = false;
        } else {
          v.state = 'working';
          v.hidden = true;
        }
        return;
      }

      const nextField = v.harvestQueue.shift();
      v.task = 'harvest_route';
      this.startMove(v, nextField.x, nextField.y);
    } else {
      if (v.workplaceId) {
        const b = this.world.buildings.get(v.workplaceId);
        if (b) {
          v.task = 'return_to_building';
          this.startMove(v, b.x, b.y + (b.h || 1) - 1);
          v.hidden = false;
        } else {
          v.workplaceId = null;
          v.state = 'idle';
        }
      } else {
        v.state = 'working';
        v.hidden = true;
      }
    }
  }

  findTaskForVillager(v) {
    if (v.job === 'warrior') return;

    if (this.world.dragonAttackActive) return;

    if (v.reservedLogistics) {
      v.state = 'idle';
      v.hidden = true;
      return;
    }

    if (v.workplaceId) {
      const myB = this.world.buildings.get(v.workplaceId);
      if (!myB) {
        v.workplaceId = null;
        v.job = 'free';
        v.state = 'idle';
      } else if (myB.def.id === 'fireStation' && myB.workerIds && myB.workerIds.indexOf(v.id) !== -1) {
        v.state = 'working';
        v.hidden = true;
        this._idleVillagers.delete(v.id);
        return;
      } else if (myB.def.id === 'arztpraxis' && myB.workerId === v.id) {
        v.state = 'working';
        v.hidden = true;
        this._idleVillagers.delete(v.id);
        return;
      } else if (v.job === 'worker' && myB.def.recipe) {
        v.state = 'working';
        v.hidden = true;
        this._idleVillagers.delete(v.id);
        return;
      }
    }

    if (this.world.buildSites.length > 0) {
      for (const b of this.world.buildSites) {
        if (b.builderId !== null) continue;

        if (b.ruined) {
          if (b.isBeingRepaired) continue;
          const canRepairNow = Game.Buildings.canRepair(this.world, b, this.economy);

          if (canRepairNow) {
            if (Game.Buildings.startRepair(this.world, b, v.id)) {
              v._repairBuildingId = b.id;
              v.task = 'repair_fetch_storage';
              v.state = 'moving';
              let best = null, bestDistSq = Infinity;
              for (const s of this.world.dropoffBuildings) {
                const bx = s.x, by = s.y + (s.h || 1) - 1;
                const dx = bx - v.x, dy = by - v.y;
                const distSq = dx * dx + dy * dy;
                if (distSq < bestDistSq) { bestDistSq = distSq; best = s; }
              }
              if (best) {
                this.startMove(v, best.x, best.y + (best.h || 1) - 1);
                v.hidden = false;
              } else {
                Game.Buildings.cancelRepair(this.world, b);
                v._repairBuildingId = null;
                v.state = 'idle';
              }
              return;
            }
          } else {
            b.repairWaiting = true;
          }
          continue;
        }

        v.task = 'go_to_build';
        v.buildTargetId = b.id;
        b.builderId = v.id;
        this.startMove(v, b.x, b.y + (b.h || 1) - 1);
        return;
      }
    }

    if (!v.workplaceId && this.world.freeJobs.size > 0) {
      const b = this.world.freeJobs.values().next().value;
      if (b && (!b.workers || b.workers.length === 0)) {
        this.world.removeFreeJob(b);

        if (b.def.id === 'fireStation') {
          this.assignToFireStation(v, b);
          return;
        }

        v.workplaceId = b.id;
        v.task = 'go_to_work';
        this.startMove(v, b.x, b.y + (b.h || 1) - 1);
        const home = this.world.buildings.get(v.homeId);
        if (home && home.residents) {
          const idx = home.residents.indexOf(v.id);
          if (idx !== -1) home.residents.splice(idx, 1);
        }
        return;
      } else {
        this.world.removeFreeJob(b);
      }
    }

    const warriorBuildings = this.world.warriorBuildings;
    if (warriorBuildings.length > 0) {
      for (const b of warriorBuildings) {
        if (!b.built) continue;
        if (b.maxWarriors === 0) continue;
        if (!b.warriorSlots) continue;

        if (this.assignWarriorSlot(b, v)) {
          v.workplaceId = b.id;
          v.task = 'go_to_warrior_post';
          v.warriorBuildingId = b.id;
          const home = this.world.buildings.get(v.homeId);
          if (home && home.residents) {
            const idx = home.residents.indexOf(v.id);
            if (idx !== -1) home.residents.splice(idx, 1);
          }
          this.startMove(v, b.x, b.y + (b.h || 1) - 1);
          return;
        }
      }
    }

    const home = this.world.buildings.get(v.homeId);
    if (home) {
      const targetX = home.x;
      const targetY = home.y + (home.h || 1) - 1;
      const dx = targetX - v.x, dy = targetY - v.y;
      if (dx * dx + dy * dy > 0.25) {
        v.task = 'go_home';
        this.startMove(v, targetX, targetY);
        return;
      }
    }
  }

  triggerHarvestRoute(v, b) {
    if (b.storage >= b.maxCapacity) return;

    const readyFields = b.fields.filter(f => f.state === 'ready');
    if (readyFields.length === 0) return;

    readyFields.sort((a, c) => {
      if (a.y !== c.y) return a.y - c.y;
      return a.x - c.x;
    });

    b.harvestingFinished = false;
    v.harvestQueue = readyFields;
    v.task = 'harvest_route';
    this._idleVillagers.delete(v.id);

    const first = v.harvestQueue.shift();
    this.startMove(v, first.x, first.y);
    v.hidden = false;
  }

  triggerTreeHarvest(v, b) {
    if (b.storage + (v._pendingStorageGain || 0) >= b.maxCapacity) return false;
    if (b.harvestCooldownUntil && performance.now() < b.harvestCooldownUntil) return false;

    const tree = this.world.findNearestTreeInTerritory(v.x, v.y);
    if (!tree) return false;

    if (!this.world.reserveTree(tree, v.id)) return false;

    v._reservedTree = tree;
    v.harvestHitCount = 0;
    v.harvestTotalCount = 0;
    v.harvestExclude = new Set();
    v.task = 'tree_harvest_arrived';
    v.state = 'idle';
    this._idleVillagers.delete(v.id);
    this.startMove(v, tree.x, tree.y + 1);
    v.hidden = false;
    return true;
  }

  triggerStoneHarvest(v, b) {
    if (b.storage + (v._pendingStorageGain || 0) >= b.maxCapacity) return false;
    if (b.harvestCooldownUntil && performance.now() < b.harvestCooldownUntil) return false;

    const stone = this.world.findNearestStoneInTerritory(v.x, v.y);
    if (!stone) return false;

    if (!this.world.reserveStone(stone, v.id)) return false;

    v._reservedStone = stone;
    v.harvestHitCount = 0;
    v.harvestTotalCount = 0;
    v.task = 'stone_harvest_arrived';
    v.state = 'idle';
    this._idleVillagers.delete(v.id);
    this.startMove(v, stone.cx, stone.cy + 1);
    v.hidden = false;
    return true;
  }

  triggerFishHarvest(v, b) {
    if (b.storage + (v._pendingStorageGain || 0) >= b.maxCapacity) return false;
    if (b.harvestCooldownUntil && performance.now() < b.harvestCooldownUntil) return false;

    const water = this.world.findNearestFishWaterInTerritory(v.x, v.y);
    if (!water) return false;

    if (!this.world.reserveFishWater(water, v.id)) return false;

    v._reservedWater = water;
    v.task = 'fish_harvest_arrived';
    v.state = 'idle';
    this._idleVillagers.delete(v.id);
    this.startMove(v, water.x, water.y);
    v.hidden = false;
    return true;
  }

  triggerForestPlant(v, b) {
    if (!b || !b.built) return false;
    if (b.workerId !== v.id) return false;
    if (v.state !== 'working') return false;

    if (v._forestPlantTimer > 0) {
      v._forestPlantTimer = Math.max(0, v._forestPlantTimer - 1000);
      return false;
    }

    const bCenterX = b.x + Math.floor((b.w || 1) / 2);
    const bCenterY = b.y + Math.floor((b.h || 1) / 2);

    let targetX = -1, targetY = -1;
    const tries = 15;
    for (let i = 0; i < tries; i++) {
      const dx = Math.floor(Math.random() * 7) - 3;
      const dy = Math.floor(Math.random() * 7) - 3;
      const tx = bCenterX + dx;
      const ty = bCenterY + dy;
      if (this.world.hasSpaceForTreeAt(tx, ty)) {
        targetX = tx;
        targetY = ty;
        break;
      }
    }

    if (targetX < 0) return false;

    v._plantTargetX = targetX;
    v._plantTargetY = targetY;
    v.task = 'plant_tree_arrived';
    v.state = 'idle';
    this._idleVillagers.delete(v.id);

    this.startMove(v, targetX, targetY + 1);
    v.hidden = false;
    return true;
  }

  sendToDropoff(v) {
    let best = null, bestDistSq = Infinity;
    for (const b of this.world.dropoffBuildings) {
      const bx = b.x, by = b.y + (b.h || 1) - 1;
      const dx = bx - v.x, dy = by - v.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < bestDistSq) { bestDistSq = distSq; best = b; }
    }
    if (best) {
      v.task = 'go_to_dropoff';
      this.startMove(v, best.x, best.y + (best.h || 1) - 1);
    }
  }

  triggerFireExtinguish(v, stationB) {
    if (!v || !stationB) return false;
    if (v.state !== 'working') return false;
    if (v.task) return false;

    const fireMgr = Game.state && Game.state.fireManager;
    if (!fireMgr) return false;

    const range = stationB.def.extinguishRadius || 15;
    const cx = stationB.x + (stationB.w || 1) / 2;
    const cy = stationB.y + (stationB.h || 1) / 2;

    const fire = fireMgr.getNearestFireTo(cx, cy, range);
    if (!fire) return false;

    const fireB = fire.building;
    v._fireTargetId = fireB.id;
    v._fireTargetX = fireB.x + (fireB.w || 1) / 2;
    v._fireTargetY = fireB.y + (fireB.h || 1) / 2;

    v.task = 'extinguish_fetch';
    v.state = 'moving';
    v.hidden = false;
    this._idleVillagers.delete(v.id);
    this.startMove(v, stationB.x, stationB.y + (stationB.h || 1) - 1);
    return true;
  }

  triggerWaterRefill(v, stationB) {
    if (!v || !stationB) return false;
    if (v.state !== 'working') return false;
    if (v.task) return false;

    if (Game.state && Game.state.fireManager) {
      const fireMgr = Game.state.fireManager;
      const noFireActive = !fireMgr.activeFires || fireMgr.activeFires.length === 0;
      
      if (noFireActive && fireMgr.isWaterNeededByBakeries()) {
        return false;
      }
    }

    const maxW = stationB.def.maxWaterStorage || 250;
    if ((stationB.storage || 0) >= maxW) return false;

    if ((this.economy.res.water || 0) <= 0) return false;

    let best = null, bestDistSq = Infinity;
    for (const s of this.world.dropoffBuildings) {
      const bx = s.x, by = s.y + (s.h || 1) - 1;
      const dx = bx - v.x, dy = by - v.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < bestDistSq) { bestDistSq = distSq; best = s; }
    }

    if (!best) return false;

    v.task = 'fetch_water_storage';
    v.state = 'moving';
    v.hidden = false;
    this._idleVillagers.delete(v.id);
    this.startMove(v, best.x, best.y + (best.h || 1) - 1);
    return true;
  }

  triggerAntibioticFetch(v, praxisB) {
    if (!v || !praxisB) return false;
    if (v.state !== 'working') return false;
    if (v.task) return false;

    const sicknessMgr = Game.state && Game.state.sicknessManager;
    if (!sicknessMgr) return false;

    if ((this.economy.res.antibiotics || 0) <= 0) return false;

    const max = praxisB.def.maxAntibioticStorage || 3;
    if ((praxisB.antibioticStorage || 0) >= max) return false;

    let best = null, bestDistSq = Infinity;
    for (const s of this.world.dropoffBuildings) {
      const bx = s.x, by = s.y + (s.h || 1) - 1;
      const dx = bx - v.x, dy = by - v.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < bestDistSq) { bestDistSq = distSq; best = s; }
    }

    if (!best) return false;

    praxisB.fetchAntibioticWorkerId = v.id;
    v.task = 'fetch_antibiotics_storage';
    v.state = 'moving';
    v.hidden = false;
    this._idleVillagers.delete(v.id);
    this.startMove(v, best.x, best.y + (best.h || 1) - 1);
    return true;
  }
};
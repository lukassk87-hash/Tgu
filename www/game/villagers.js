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

    this._cachedList = [];
    this._listDirty = true;
    this._idleVillagers = new Set();
    this._idleCheckCooldown = 0;

    this._spatialGrid = new Map();
    this._gridCellSize = 10;
    this._gridDirty = true;

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
    }
    this._gridDirty = false;
  }

  getNearbyVillagers(worldX, worldY) {
    if (this._gridDirty) this._rebuildSpatialGrid();
    const cellSize = this._gridCellSize;
    const cx = Math.floor(worldX / cellSize);
    const cy = Math.floor(worldY / cellSize);
    const result = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const key = (cx + dx) + ',' + (cy + dy);
        const cell = this._spatialGrid.get(key);
        if (cell) {
          for (const v of cell) result.push(v);
        }
      }
    }
    return result;
  }

  _markGridDirty() {
    this._gridDirty = true;
  }

  // NEU: Hilfsfunktion, die je nach Rezept-Gebäude das richtige Bild zurückgibt
  _getRecipeWorkerAsset(b) {
    if (!b) return null;
    if (b.def.id === 'bakery') return 'images/baecker.webp';
    if (b.def.id === 'sawmill') return 'images/saeger.webp';
    if (b.def.id === 'mill') return 'images/mueller.webp';
    if (b.def.id === 'brewery') return 'images/brauer.webp';
    return null;
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
      huntingZombieId: null
    };
    this.villagers.set(v.id, v);
    this._listDirty = true;
    this._markGridDirty();
    if (job === 'free') this._idleVillagers.add(v.id);
    return v;
  }

  assignWarriorSlot(b, v) {
    if (!b.warriorSlots) return false;
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

  removeVillager(v) {
    if (!v) return;
    if (!this.villagers.has(v.id)) return;
    this.villagers.delete(v.id);
    this._listDirty = true;
    this._idleVillagers.delete(v.id);
    this._markGridDirty();

    for (const b of this.world.buildings.values()) {
      const wasWorker = (b.workerId === v.id);
      if (b.warriorSlots) this.releaseWarriorSlot(b, v.id);
      if (b.residents && b.residents.length > 0) {
        const ri = b.residents.indexOf(v.id);
        if (ri !== -1) b.residents.splice(ri, 1);
      }
      if (b.workerId === v.id) b.workerId = null;
      if (b.builderId === v.id) b.builderId = null;
      if (b.recipeFetchWorkerId === v.id) b.recipeFetchWorkerId = null;
      if (b.logisticsId === v.id) {
        b.logisticsId = null;
        b.isBeingCollected = false;
      }
      if (wasWorker && b.fishPendingFetch) {
        b.fishPendingFetch = false;
        b.fishRetryTimer = -30;
      }
      if (wasWorker && b.built) {
        const isJobBuilding = b.def.produces || b.def.recipe || b.def.generatesResource;
        if (isJobBuilding && !this.world.freeJobs.has(b)) {
          if (!b.def.produces || b.fields.length > 0) {
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
    v.moveStartX = v.x;
    v.moveStartY = v.y;
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
          this.findTaskForVillager(v);
        }
      }
    }

    for (const v of this.villagers.values()) {
      // NEU: Sicherheits-Check, ob das Gebäude noch existiert
      if (v.state === 'working' && v.job === 'worker' && v.workplaceId) {
        const wb = this.world.buildings.get(v.workplaceId);
        if (!wb || wb.workerId !== v.id) {
          v.state = 'idle';
          v.workplaceId = null;
          v.hidden = true;
        }
      }

      if (v.state === 'moving') {
        const now = performance.now();
        if (now - v.moveStartTime >= v.moveDuration) {
          v.x = v.targetX; v.y = v.targetY;
          this.onArrive(v);
        }
      }
      
      if (v.state === 'harvesting') {
        v.harvestWait--;
        if (v.harvestWait <= 0) this.continueHarvestRoute(v);
      }
      
      if (v.state === 'idle' && !v.carrying && v.job !== 'warrior') {
        this._idleVillagers.add(v.id);
      } else {
        this._idleVillagers.delete(v.id);
      }
      
      if (v.state === 'moving' || v.state === 'building' || v.state === 'harvesting') {
        v.hidden = false;
        this._markGridDirty();
      } else {
        v.hidden = true;
      }

      // NEU: Prüfen, ob der Villager in einem Rezept-Gebäude arbeitet
      // (betrifft sowohl Zutatenholen als auch direktes Arbeiten)
      let recipeAsset = null;
      if (v.workplaceId) {
        const wb = this.world.buildings.get(v.workplaceId);
        if (wb && wb.def.recipe) {
          recipeAsset = this._getRecipeWorkerAsset(wb);
        }
      }

      if (v.job === 'warrior') {
        v.asset = 'images/villager-krieger-rot.webp';
      }
      else if (v.task === 'go_to_build' || v.state === 'building') {
        v.asset = 'images/villager-baumeister-rot.webp';
      } 
      else if (recipeAsset && (v.task === 'recipe_fetch_storage' || v.task === 'recipe_fetch_return')) {
        // NEU: Beim Zutatenholen den jeweiligen Rezept-Skin tragen
        v.asset = recipeAsset;
      }
      else if (v.isLogistics) {
        if (v.job === 'worker' && v.workplaceId) {
          const b = this.world.buildings.get(v.workplaceId);
          if (b) {
            if (recipeAsset) v.asset = recipeAsset;
            else if (b.def.produces === 'wood') v.asset = 'images/villager-holzfaeller-rot.webp';
            else if (b.def.produces === 'stone') v.asset = 'images/villager-steinmetz-rot.webp';
            else if (b.def.produces === 'grain') v.asset = 'images/villager-bauer-rot.webp';
            else if (b.def.produces === 'fish') v.asset = 'images/villager-angler-rot.webp';
            else v.asset = 'images/villager-idle-rot.webp';
          }
        } else {
          v.asset = 'images/villager-idle-rot.webp';
        }
      } 
      else if (v.carrying) {
        // NEU: Wenn er in einem Rezept-Gebäude arbeitet, hat der Rezept-Skin Vorrang
        if (recipeAsset) v.asset = recipeAsset;
        else if (v.carrying.type === 'wood') v.asset = 'images/villager-holzfaeller-rot.webp';
        else if (v.carrying.type === 'stone') v.asset = 'images/villager-steinmetz-rot.webp';
        else if (v.carrying.type === 'grain') v.asset = 'images/villager-bauer-rot.webp';
        else if (v.carrying.type === 'fish') v.asset = 'images/villager-angler-rot.webp';
      } 
      else if (v.job === 'worker') {
        const b = this.world.buildings.get(v.workplaceId);
        if (b) {
          if (recipeAsset) v.asset = recipeAsset;
          else if (b.def.generatesResource) v.asset = 'images/villager-idle-rot.webp';
          else if (b.def.produces === 'wood') v.asset = 'images/villager-holzfaeller-rot.webp';
          else if (b.def.produces === 'stone') v.asset = 'images/villager-steinmetz-rot.webp';
          else if (b.def.produces === 'grain') v.asset = 'images/villager-bauer-rot.webp';
          else if (b.def.produces === 'fish') v.asset = 'images/villager-angler-rot.webp';
        }
      } 
      else {
        v.asset = 'images/villager-idle-rot.webp';
      }
    }
  }

  onArrive(v) {
    const currentTask = v.task;
    v.state = 'idle';
    v.task = null;
    
    if (currentTask === 'go_to_work') {
      v.job = 'worker';
      v.state = 'working';
      const building = this.world.buildings.get(v.workplaceId);
      if (building) {
        building.workerId = v.id;
        if (building.def.consumesFish && building.fishConsumeTimer <= 0) {
          building.fishConsumeTimer = 45;
        }
        if (building.def.consumesFish && building.fishSlots === 0) {
          building.fishRetryTimer = 0;
        }
      } else {
        // Gebäude wurde abgerissen, während der Villager unterwegs war
        v.workplaceId = null;
        v.state = 'idle';
      }
      v.hidden = true;
    
    } else if (currentTask === 'go_to_warrior_post') {
      v.job = 'warrior';
      v.state = 'working';
      v.hidden = true;

    } else if (currentTask === 'go_to_build') {
      v.state = 'building';

    } else if (currentTask === 'harvest_route') {
      v.state = 'harvesting';
      v.harvestWait = 1; 
      
      const b = this.world.buildings.get(v.workplaceId);
      if (b) {
        b.storage += 1;
        const field = b.fields.find(f => f.x === v.x && f.y === v.y);
        if (field) { field.state = 'growing'; field.timer = 0; }
        
        if (this.onHarvest) {
          this.onHarvest(v.x, v.y, b.def.produces);
        }
      }

    } else if (currentTask === 'return_to_building') {
      v.state = 'working';
      v.hidden = true;
      const b = this.world.buildings.get(v.workplaceId);
      if (b) {
        v.x = b.x; v.y = b.y + (b.h || 1) - 1;
        v.renderX = v.x; v.renderY = v.y;
        b.harvestingFinished = true; 
      } else {
        v.workplaceId = null;
        v.state = 'idle';
      }

    } else if (currentTask === 'go_to_pickup') {
      const b = this.world.buildings.get(v.workplaceId);
      if (b && b.storage > 0) {
        let carryType = b.def.produces;
        if (!carryType && b.def.recipe) carryType = b.def.recipe.output;
        if (!carryType && b.def.generatesResource) carryType = b.def.generatesResource;
        
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
      if (v.carrying) {
        this.economy.res[v.carrying.type] = (this.economy.res[v.carrying.type] || 0) + v.carrying.amount;
        if (this.economy.onChange) this.economy.onChange();
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
      const b = this.world.buildings.get(v.workplaceId);
      if (b) {
        b.fishPendingFetch = false;
        if (b.fishSlots === 0) b.fishRetryTimer = -30;
      }
      v.state = 'working';
      v.hidden = true;

    } else if (currentTask === 'go_home') {
      v.hidden = true;
      v.state = 'idle';
    }
  }

  continueHarvestRoute(v) {
    if (v.harvestQueue.length > 0) {
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

    // Sicherheits-Check: Arbeitsplatz weg?
    if (v.workplaceId) {
      const myB = this.world.buildings.get(v.workplaceId);
      if (!myB) {
        v.workplaceId = null;
        v.job = 'free';
        v.state = 'idle';
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
      if (dx*dx + dy*dy > 0.25) {
        v.task = 'go_home';
        this.startMove(v, targetX, targetY);
        return;
      }
    }
  }

  triggerHarvestRoute(v, b) {
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

  sendToDropoff(v) {
    let best = null, bestDistSq = Infinity;
    for (const b of this.world.dropoffBuildings) {
      const bx = b.x, by = b.y + (b.h || 1) - 1;
      const dx = bx - v.x, dy = by - v.y;
      const distSq = dx*dx + dy*dy;
      if (distSq < bestDistSq) { bestDistSq = distSq; best = b; }
    }
    if (best) {
      v.task = 'go_to_dropoff';
      this.startMove(v, best.x, best.y + (best.h || 1) - 1);
    }
  }
};
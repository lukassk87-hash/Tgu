window.Game = window.Game || {};

Game.World.prototype.findNearestBuildingInRange = function(fromX, fromY, radius) {
  let best = null;
  let bestDistSq = radius * radius;
  for (const b of this.buildings.values()) {
    if (!b.built) continue;
    if (b.ruined) continue;
    if (b.isBeingRepaired) continue;
    const bx = b.x + (b.w || 1) / 2;
    const by = b.y + (b.h || 1) / 2;
    const dx = bx - fromX;
    const dy = by - fromY;
    const d2 = dx * dx + dy * dy;
    if (d2 < bestDistSq) {
      bestDistSq = d2;
      best = b;
    }
  }
  return best;
};

Game.World.prototype.getRepairCost = function(b) {
  if (!b || !b.def) return null;
  if (b.def.repairCost) return b.def.repairCost;
  if (!b.def.cost) return null;
  const out = {};
  for (const k in b.def.cost) {
    out[k] = Math.max(1, Math.ceil(b.def.cost[k] * 0.5));
  }
  return out;
};

Game.World.prototype.addBuilding = function(def, anchorX, anchorY) {
  const topLeft = Game.Buildings.getTopLeft(def, anchorX, anchorY);
  const topLeftX = topLeft.x;
  const topLeftY = topLeft.y;
  const w = def.width || 1;
  const h = def.height || 1;
  const maxW = def.maxWarriors || 0;

  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      if (this.isStoneAt(topLeftX + dx, topLeftY + dy)) return null;
    }
  }

  let workerIds;
  if (def.id === 'fireStation') {
    workerIds = new Array(def.maxWorkers || 2).fill(null);
  } else {
    workerIds = [];
  }

  const b = {
    id: this.nextBuildingId++,
    def, x: topLeftX, y: topLeftY,
    w, h,
    anchorX, anchorY,
    builderId: null,
    workerId: null,
    workerIds,
    logisticsId: null,
    workers: [],
    residents: [],
    warriorSlots: maxW > 0 ? new Array(maxW).fill(null) : [],
    maxWarriors: maxW,
    progress: 0, built: false,
    storage: 0, spawnTimer: 0,
    fields: [],
    harvestingFinished: true,
    maxCapacity: 0,
    reportThreshold: 0,
    isBeingCollected: false,

    ruined: false,
    isBeingRepaired: false,
    repairCostCache: null,

    paused: false,

    fishSlots: 0,
    fishConsumeTimer: 0,
    fishRetryTimer: 0,
    fishPendingFetch: false,
    fieldAccum: 0,

    recipeTimer: 0,
    recipeStorage: {},
    recipeFetchWorkerId: null,
    generatesTimer: 0,
    beerStorage: 0,
    maxBeer: def.beerSlots || 0,
    beerRefillCooldown: 0,
    isActive: false,

    harvestCooldownUntil: 0,
    arrowTowerCooldown: 0,

    arrowStorage: 0,
    maxArrowStorage: def.arrowCapacity || 0,
    fetchingArrows: false,

    dragonHits: 0,

    antibioticStorage: 0,
    currentPatient: null,
    treatmentEndsAt: 0,
    fetchAntibioticWorkerId: null
  };
  this.buildings.set(b.id, b);

  const removedTiles = [];
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const fx = topLeftX + dx;
      const fy = topLeftY + dy;
      this.occupied.add(`${fx},${fy}`);
      this.removeFieldFromPreviousOwner(fx, fy);
      if (this.isTreeAt(fx, fy)) {
        this.removeTreeByTile(fx, fy);
      }
      if (this.isDecoAt(fx, fy)) {
        this.removeDecoByTile(fx, fy);
      }
      removedTiles.push({ x: fx, y: fy });
    }
  }

  if (def.id === 'castle') { this.castleId = b.id; def.isHouse = true; }
  if (!b.built) this.buildSites.push(b);
  if (def.isHouse) this.houses.push(b);

  if (def.animationFrames) {
    this.animatedBuildings.push(b);
  }

  this.invalidateTerritoryCache();
  this._notifyStaticChanged(removedTiles);
  return b;
};

Game.World.prototype.removeFieldFromPreviousOwner = function(x, y) {
  const key = `${x},${y}`;
  const ownerId = this.fieldOwners.get(key);
  if (ownerId) {
    const owner = this.buildings.get(ownerId);
    if (owner) {
      const idx = owner.fields.findIndex(f => f.x === x && f.y === y);
      if (idx !== -1) {
        owner.fields.splice(idx, 1);
        owner.maxCapacity = owner.fields.length;
      }
    }
    this.fieldOwners.delete(key);
  }
};

Game.World.prototype.onBuildingComplete = function(b) {
  b.built = true;
  b.ruined = false;
  b.isBeingRepaired = false;

  const index = this.buildSites.indexOf(b);
  if (index !== -1) this.buildSites.splice(index, 1);

  if (b.def.animationFrames) {
    if (!this.animatedBuildings.includes(b)) {
      this.animatedBuildings.push(b);
    }
  }

  if (b.def.consumesFish) {
    b.fishSlots = 0;
    b.fishConsumeTimer = 0;
    b.fishRetryTimer = 0;
    b.fishPendingFetch = false;
    b.fieldAccum = 0;
  }

  if (b.def.id === 'arztpraxis') {
    b.maxCapacity = b.def.maxAntibioticStorage || 3;
    b.reportThreshold = 1;
    b.antibioticStorage = 0;
    b.currentPatient = null;
    b.treatmentEndsAt = 0;
    b.fetchAntibioticWorkerId = null;
    b.workerId = null;
    this.arztpraxen.push(b);
    this.freeJobs.add(b);
    this.invalidateTerritoryCache();
    return;
  }

  if (b.def.recipe) {
    if (!this.recipeBuildings.includes(b)) this.recipeBuildings.push(b);
    const outputPerCycle = b.def.recipe.amount;
    b.reportThreshold = outputPerCycle;
    b.maxCapacity = outputPerCycle * 5;
    this.freeJobs.add(b);
    this.invalidateTerritoryCache();
    return;
  }

  if (b.def.generatesResource) {
    if (!this.generatingBuildings.includes(b)) this.generatingBuildings.push(b);
    const perCycle = b.def.generatesAmount;
    b.reportThreshold = perCycle;
    b.maxCapacity = perCycle * 5;
    if (b.def.consumesFish && !this.fishConsumers.includes(b)) this.fishConsumers.push(b);
    this.freeJobs.add(b);
    this.invalidateTerritoryCache();
    return;
  }

  if (b.def.hasArrowTower) {
    if (!this.arrowBuildings.includes(b)) this.arrowBuildings.push(b);
    b.maxArrowStorage = b.def.arrowCapacity || 20;
    b.arrowStorage = 0;
    b.fetchingArrows = false;
    this.freeJobs.add(b);
    this.invalidateTerritoryCache();
  }

  if (b.def.consumesFish) {
    if (!this.fishConsumers.includes(b)) this.fishConsumers.push(b);
  }

  if (b.maxWarriors > 0) {
    if (!this.warriorBuildings.includes(b)) this.warriorBuildings.push(b);
  }

  if (b.def.beerSlots && b.def.beerSlots > 0) {
    if (!this.beerBuildings.includes(b)) this.beerBuildings.push(b);
  }

  if (b.def.isStorage || b.def.id === 'castle') {
    if (!this.dropoffBuildings.includes(b)) this.dropoffBuildings.push(b);
  }

  if (b.def.id === 'lumberjack' || b.def.id === 'quarry' || b.def.id === 'fisher') {
    b.reportThreshold = 1;
    b.maxCapacity = 15;
    this.freeJobs.add(b);
    if (!this.producingBuildings.includes(b)) this.producingBuildings.push(b);
    this.invalidateTerritoryCache();
    return;
  }

  if (b.def.id === 'forsthaus') {
    b.reportThreshold = 0;
    b.maxCapacity = 0;
    this.freeJobs.add(b);
    if (!this.producingBuildings.includes(b)) this.producingBuildings.push(b);
    this.invalidateTerritoryCache();
    return;
  }

  if (b.def.id === 'fireStation') {
    b.maxCapacity = b.def.maxWaterStorage || 50;
    b.reportThreshold = 10;
    b.storage = 0;
    if (!b.workerIds) {
      b.workerIds = new Array(b.def.maxWorkers || 2).fill(null);
    }
    this.freeJobs.add(b);
    this.invalidateTerritoryCache();
    return;
  }

  if (b.def.produces) {
    let targetTerrainId = '';
    if (b.def.produces === 'grain') targetTerrainId = 'grass';

    const ring = this.getRingTiles(b);
    for (const n of ring) {
      const key = `${n.x},${n.y}`;
      if (this.occupied.has(key)) continue;
      if (!this.fieldOwners.has(key) && this.getTerrainId(n.x, n.y) === targetTerrainId) {
        b.fields.push({ x: n.x, y: n.y, timer: 0, state: 'growing' });
        this.fieldOwners.set(key, b.id);
      }
    }

    b.reportThreshold = b.fields.length;
    b.maxCapacity = b.fields.length * 5;

    if (b.maxCapacity > 0) {
      this.freeJobs.add(b);
      if (!this.producingBuildings.includes(b)) this.producingBuildings.push(b);
    }
  }

  this.invalidateTerritoryCache();
};

Game.World.prototype.removeFreeJob = function(b) {
  this.freeJobs.delete(b);
};

Game.World.prototype.addFullStorage = function(b) {
  if (!this.fullStorages.includes(b)) this.fullStorages.push(b);
};

Game.World.prototype.removeFullStorage = function(b) {
  const index = this.fullStorages.indexOf(b);
  if (index !== -1) this.fullStorages.splice(index, 1);
};

Game.World.prototype.removeBuilding = function(b) {
  if (!b) return;
  if (b.def.id === 'castle') return;

  if (b.def.id === 'arztpraxis') {
    const idx = this.arztpraxen.indexOf(b);
    if (idx !== -1) this.arztpraxen.splice(idx, 1);
    const sicknessMgr = window.Game.state && window.Game.state.sicknessManager;
    if (sicknessMgr && typeof sicknessMgr.onPraxisRemoved === 'function') {
      sicknessMgr.onPraxisRemoved(b);
    }
    b.currentPatient = null;
    b.treatmentEndsAt = 0;
    b.fetchAntibioticWorkerId = null;
  }

  const tiles = this.getBuildingTiles(b);
  for (const t of tiles) {
    this.occupied.delete(`${t.x},${t.y}`);
  }

  for (const field of b.fields) {
    const key = `${field.x},${field.y}`;
    if (this.fieldOwners.get(key) === b.id) {
      this.fieldOwners.delete(key);
    }
  }
  b.fields = [];

  const lists = [
    'buildSites', 'houses', 'fullStorages',
    'recipeBuildings', 'fishConsumers', 'generatingBuildings',
    'warriorBuildings', 'dropoffBuildings', 'producingBuildings',
    'beerBuildings', 'arrowBuildings', 'animatedBuildings'
  ];
  for (const listName of lists) {
    const list = this[listName];
    if (Array.isArray(list)) {
      const idx = list.indexOf(b);
      if (idx !== -1) list.splice(idx, 1);
    }
  }

  this.freeJobs.delete(b);
  this.buildings.delete(b.id);
  this.invalidateTerritoryCache();
  this._notifyStaticChanged(tiles);
};
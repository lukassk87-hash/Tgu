window.Game = window.Game || {};

Game.World = class World {
  constructor(width, height, grid) {
    this.width = width;
    this.height = height;
    this.grid = grid;
    this.buildings = new Map();
    this.nextBuildingId = 1;
    this.castleId = null;
    this.occupied = new Set(); 
    
    this.freeJobs = new Set();       
    this.buildSites = [];     
    this.houses = [];         
    this.fullStorages = []; 
    this.fieldOwners = new Map(); 

    this.recipeBuildings = [];
    this.fishConsumers = [];
    this.generatingBuildings = [];
    this.warriorBuildings = [];
    this.dropoffBuildings = [];
    this.producingBuildings = [];
    this.beerBuildings = [];

    this._territorySet = null;
  }

  inBounds(x, y) { return x >= 0 && y >= 0 && x < this.width && y < this.height; }
  getTerrainId(x, y) { return this.inBounds(x, y) ? this.grid[y * this.width + x] : null; }
  getTerrain(x, y) { const id = this.getTerrainId(x, y); return id ? Game.TERRAINS[id] : null; }
  
  getRingTiles(b) {
    const out = [];
    const minX = b.x - 1;
    const maxX = b.x + b.w;
    const minY = b.y - 1;
    const maxY = b.y + b.h;
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h) continue;
        if (this.inBounds(x, y)) out.push({ x, y });
      }
    }
    return out;
  }

  getBuildingTiles(b) {
    const tiles = [];
    for (let dy = 0; dy < (b.h || 1); dy++) {
      for (let dx = 0; dx < (b.w || 1); dx++) {
        tiles.push({ x: b.x + dx, y: b.y + dy });
      }
    }
    return tiles;
  }

  getTerritorySet() {
    if (this._territorySet) return this._territorySet;

    const set = new Set();
    if (this.castleId === null) {
      this._territorySet = set;
      return set;
    }

    const addBox = (cx, cy, r) => {
      const minX = Math.max(0, cx - r);
      const maxX = Math.min(this.width - 1, cx + r);
      const minY = Math.max(0, cy - r);
      const maxY = Math.min(this.height - 1, cy + r);
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          set.add(x + ',' + y);
        }
      }
    };

    const castle = this.buildings.get(this.castleId);
    const cx = castle.x + Math.floor((castle.w || 1) / 2);
    const cy = castle.y + Math.floor((castle.h || 1) / 2);
    addBox(cx, cy, 10);

    for (const b of this.buildings.values()) {
      if (b.def.expandsBorder && b.built) {
        addBox(b.x, b.y, b.def.expandsBorder);
      }
    }

    this._territorySet = set;
    return set;
  }

  invalidateTerritoryCache() {
    this._territorySet = null;
  }

  isInTerritory(x, y) {
    return this.getTerritorySet().has(Math.floor(x) + ',' + Math.floor(y));
  }

  addBuilding(def, anchorX, anchorY) {
    const topLeft = Game.Buildings.getTopLeft(def, anchorX, anchorY);
    const topLeftX = topLeft.x;
    const topLeftY = topLeft.y;
    const maxW = def.maxWarriors || 0;

    const b = {
      id: this.nextBuildingId++,
      def, x: topLeftX, y: topLeftY,
      w: def.width || 1, h: def.height || 1,
      anchorX, anchorY,
      builderId: null,
      workerId: null,
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
      isActive: false
    };
    this.buildings.set(b.id, b);
    
    for (let dy = 0; dy < b.h; dy++) {
      for (let dx = 0; dx < b.w; dx++) {
        const fx = topLeftX + dx;
        const fy = topLeftY + dy;
        this.occupied.add(`${fx},${fy}`);
        this.removeFieldFromPreviousOwner(fx, fy);
      }
    }

    if (def.id === 'castle') { this.castleId = b.id; def.isHouse = true; }
    if (!b.built) this.buildSites.push(b);
    if (def.isHouse) this.houses.push(b);

    this.invalidateTerritoryCache();
    return b;
  }

  removeFieldFromPreviousOwner(x, y) {
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
  }

  onBuildingComplete(b) {
    b.built = true;
    const index = this.buildSites.indexOf(b);
    if (index !== -1) this.buildSites.splice(index, 1);

    if (b.def.consumesFish) {
      b.fishSlots = 0;
      b.fishConsumeTimer = 45;
      b.fishRetryTimer = -30;
      b.fishPendingFetch = false;
      b.fieldAccum = 0;
    }
    
    if (b.def.recipe) {
      this.recipeBuildings.push(b);
      const outputPerCycle = b.def.recipe.amount;
      b.reportThreshold = outputPerCycle;
      b.maxCapacity = outputPerCycle * 5;
      this.freeJobs.add(b);
      this.invalidateTerritoryCache();
      return;
    }

    if (b.def.generatesResource) {
      this.generatingBuildings.push(b);
      const perCycle = b.def.generatesAmount;
      b.reportThreshold = perCycle;
      b.maxCapacity = perCycle * 5;
      if (b.def.consumesFish) this.fishConsumers.push(b);
      this.freeJobs.add(b);
      this.invalidateTerritoryCache();
      return;
    }
    
    if (b.def.consumesFish) {
      this.fishConsumers.push(b);
    }

    if (b.maxWarriors > 0) {
      this.warriorBuildings.push(b);
    }

    if (b.def.beerSlots && b.def.beerSlots > 0) {
      this.beerBuildings.push(b);
    }

    if (b.def.isStorage || b.def.id === 'castle') {
      this.dropoffBuildings.push(b);
    }
    
    if (b.def.produces) {
      let targetTerrainId = '';
      if (b.def.produces === 'wood') targetTerrainId = 'forest';
      else if (b.def.produces === 'stone') targetTerrainId = 'mountain';
      else if (b.def.produces === 'grain') targetTerrainId = 'grass';
      else if (b.def.produces === 'fish') targetTerrainId = 'water';

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
        this.producingBuildings.push(b);
      }
    }

    this.invalidateTerritoryCache();
  }

  removeFreeJob(b) {
    this.freeJobs.delete(b);
  }

  addFullStorage(b) {
    if (!this.fullStorages.includes(b)) this.fullStorages.push(b);
  }

  removeFullStorage(b) {
    const index = this.fullStorages.indexOf(b);
    if (index !== -1) this.fullStorages.splice(index, 1);
  }

  removeBuilding(b) {
    if (!b) return;
    if (b.def.id === 'castle') return;
    
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
      'beerBuildings'
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
  }
};
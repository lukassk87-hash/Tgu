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
    this.arrowBuildings = [];
    this.animatedBuildings = [];
    this.arztpraxen = [];

    this._territorySet = null;
    this._territoryArray = null;

    this.trees = new Map();
    this.stones = new Map();
    this.treeGridBuckets = new Map();
    this.stoneGridBuckets = new Map();
    this.TREE_BUCKET = 16;
    this.STONE_BUCKET = 16;

    this.growingTrees = [];

    this.blockedByTree = new Uint8Array(width * height);
    this.blockedByStone = new Uint8Array(width * height);

    this.waterTiles = new Set();
    this.fishWaterTiles = new Map();

    this.decorations = new Map();

    this._territoryTreeCache = [];
    this._territoryStoneCache = [];
    this._territoryFishWaterCache = [];
    this._territoryCacheReady = false;

    this.FISH_REGROW_MS = 300000;
    this.FISH_MAX = 50;
    this.TREE_GROWTH_MS = 240000;
    this.STONE_MAX_CAPACITY = 500;

    this.onBorderChanged = null;
    this.onStaticChanged = null;
  }

  inBounds(x, y) { return x >= 0 && y >= 0 && x < this.width && y < this.height; }
  getTerrainId(x, y) { return this.inBounds(x, y) ? this.grid[y * this.width + x] : null; }
  getTerrain(x, y) { const id = this.getTerrainId(x, y); return id ? Game.TERRAINS[id] : null; }

  _idx(x, y) { return y * this.width + x; }

  _notifyBorderChanged() {
    if (typeof this.onBorderChanged === 'function') this.onBorderChanged();
  }

  _notifyStaticChanged(tiles) {
    if (typeof this.onStaticChanged === 'function' && tiles && tiles.length > 0) {
      this.onStaticChanged(tiles);
    }
  }

  _treeTiles(tree) {
    return [
      { x: tree.x, y: tree.y },
      { x: tree.x + 1, y: tree.y },
      { x: tree.x, y: tree.y + 1 },
      { x: tree.x + 1, y: tree.y + 1 }
    ];
  }

  _stoneTiles(stone) {
    const out = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        out.push({ x: stone.cx + dx, y: stone.cy + dy });
      }
    }
    return out;
  }

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

  _buildTerritoryArray() {
    const arr = new Uint8Array(this.width * this.height);
    if (this.castleId === null) {
      this._territoryArray = arr;
      return arr;
    }

    const addBox = (cx, cy, r) => {
      const minX = Math.max(0, cx - r);
      const maxX = Math.min(this.width - 1, cx + r);
      const minY = Math.max(0, cy - r);
      const maxY = Math.min(this.height - 1, cy + r);
      for (let y = minY; y <= maxY; y++) {
        const rowOffset = y * this.width;
        for (let x = minX; x <= maxX; x++) {
          arr[rowOffset + x] = 1;
        }
      }
    };

    const castle = this.buildings.get(this.castleId);
    const cx = castle.x + Math.floor((castle.w || 1) / 2);
    const cy = castle.y + Math.floor((castle.h || 1) / 2);
    
    const castleRadius = castle.def.expandsBorder || 10;
    addBox(cx, cy, castleRadius);

    for (const b of this.buildings.values()) {
      if (b.def.expandsBorder && (b.built || b.ruined)) {
        if (b.id === this.castleId) continue;
        addBox(b.x, b.y, b.def.expandsBorder);
      }
    }

    this._territoryArray = arr;
    return arr;
  }

  isInTerritory(x, y) {
    const xi = x | 0;
    const yi = y | 0;
    if (xi < 0 || yi < 0 || xi >= this.width || yi >= this.height) return false;
    if (!this._territoryArray) this._buildTerritoryArray();
    return this._territoryArray[yi * this.width + xi] === 1;
  }

  _bucketKey(x, y, size) {
    return Math.floor(x / size) + ',' + Math.floor(y / size);
  }
};
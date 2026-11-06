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

    // Inkrementeller Territory-Cache
    this._territoryTreeCache = [];
    this._territoryStoneCache = [];
    this._territoryFishWaterCache = [];
    this._territoryCacheReady = false;

    this.FISH_REGROW_MS = 300000;
    this.FISH_MAX = 50;
    this.TREE_GROWTH_MS = 240000;

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
    addBox(cx, cy, 10);

    for (const b of this.buildings.values()) {
      if (b.def.expandsBorder && b.built) {
        addBox(b.x, b.y, b.def.expandsBorder);
      }
    }

    this._territoryArray = arr;
    return arr;
  }

  invalidateTerritoryCache() {
    this._territorySet = null;
    this._territoryArray = null;
    this._rebuildTerritoryCache();
    this._notifyBorderChanged();
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

  // ==========================================================
  // Territory-Cache (inkrementell)
  // ==========================================================

  _isTreeInTerritory(tree) {
    const territory = this.getTerritorySet();
    for (let dy = 0; dy < 2; dy++) {
      for (let dx = 0; dx < 2; dx++) {
        if (territory.has((tree.x + dx) + ',' + (tree.y + dy))) return true;
      }
    }
    return false;
  }

  _isStoneInTerritory(stone) {
    const territory = this.getTerritorySet();
    for (const t of stone.tiles) {
      if (territory.has(t)) return true;
    }
    return false;
  }

  _isFishInTerritory(fish) {
    const territory = this.getTerritorySet();
    return territory.has(fish.x + ',' + fish.y);
  }

  _addTreeToTerritoryCache(tree) {
    if (tree.growthUntil !== null) return;
    if (!this._isTreeInTerritory(tree)) return;
    if (this._territoryTreeCache.indexOf(tree) !== -1) return;
    this._territoryTreeCache.push(tree);
  }

  _removeTreeFromTerritoryCache(tree) {
    const idx = this._territoryTreeCache.indexOf(tree);
    if (idx !== -1) this._territoryTreeCache.splice(idx, 1);
  }

  _addStoneToTerritoryCache(stone) {
    if (!this._isStoneInTerritory(stone)) return;
    if (this._territoryStoneCache.indexOf(stone) !== -1) return;
    this._territoryStoneCache.push(stone);
  }

  _removeStoneFromTerritoryCache(stone) {
    const idx = this._territoryStoneCache.indexOf(stone);
    if (idx !== -1) this._territoryStoneCache.splice(idx, 1);
  }

  _refreshFishWaterCache(fish) {
    const idx = this._territoryFishWaterCache.indexOf(fish);
    const valid = fish.cooldownUntil === 0
      && fish.remaining > 0
      && this._isFishInTerritory(fish);

    if (valid && idx === -1) {
      this._territoryFishWaterCache.push(fish);
    } else if (!valid && idx !== -1) {
      this._territoryFishWaterCache.splice(idx, 1);
    }
  }

  _rebuildTerritoryCache() {
    const territory = this.getTerritorySet();

    const trees = [];
    for (const tree of this.trees.values()) {
      if (tree.growthUntil !== null) continue;
      let inTerr = false;
      for (let dy = 0; dy < 2 && !inTerr; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          if (territory.has((tree.x + dx) + ',' + (tree.y + dy))) {
            inTerr = true;
            break;
          }
        }
      }
      if (inTerr) trees.push(tree);
    }
    this._territoryTreeCache = trees;

    const stones = [];
    for (const stone of this.stones.values()) {
      let inTerr = false;
      for (const t of stone.tiles) {
        if (territory.has(t)) { inTerr = true; break; }
      }
      if (inTerr) stones.push(stone);
    }
    this._territoryStoneCache = stones;

    const fishWater = [];
    for (const fish of this.fishWaterTiles.values()) {
      if (fish.cooldownUntil > 0) continue;
      if (fish.remaining <= 0) continue;
      if (territory.has(fish.x + ',' + fish.y)) fishWater.push(fish);
    }
    this._territoryFishWaterCache = fishWater;

    this._territoryCacheReady = true;
  }

  findNearestTreeInTerritory(fromX, fromY, excludeKeys) {
    if (!this._territoryCacheReady) this._rebuildTerritoryCache();

    let best = null, bestDist = Infinity;
    for (let i = 0; i < this._territoryTreeCache.length; i++) {
      const tree = this._territoryTreeCache[i];
      if (tree._reservedBy !== null) continue;
      if (tree.growthUntil !== null) continue;
      const key = tree.x + ',' + tree.y;
      if (excludeKeys && excludeKeys.has(key)) continue;
      const dx = tree.x - fromX, dy = tree.y - fromY;
      const d = dx * dx + dy * dy;
      if (d < bestDist) { bestDist = d; best = tree; }
    }
    return best;
  }

  findNearestStoneInTerritory(fromX, fromY) {
    if (!this._territoryCacheReady) this._rebuildTerritoryCache();

    let best = null, bestDist = Infinity;
    for (let i = 0; i < this._territoryStoneCache.length; i++) {
      const stone = this._territoryStoneCache[i];
      if (stone._reservedBy !== null) continue;
      const dx = stone.cx - fromX, dy = stone.cy - fromY;
      const d = dx * dx + dy * dy;
      if (d < bestDist) { bestDist = d; best = stone; }
    }
    return best;
  }

  findNearestFishWaterInTerritory(fromX, fromY) {
    if (!this._territoryCacheReady) this._rebuildTerritoryCache();

    let best = null, bestDist = Infinity;
    for (let i = 0; i < this._territoryFishWaterCache.length; i++) {
      const fish = this._territoryFishWaterCache[i];
      if (fish._reservedBy !== null) continue;
      const dx = fish.x - fromX, dy = fish.y - fromY;
      const d = dx * dx + dy * dy;
      if (d < bestDist) { bestDist = d; best = fish; }
    }
    return best;
  }

  // ==========================================================
  // NEU: Nächstes Gebäude im Umkreis (für Drachen-Zielsuche)
  // ==========================================================
  findNearestBuildingInRange(fromX, fromY, radius) {
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
  }

  // ==========================================================
  // NEU: Reparatur-Kosten (50% der Originalkosten, aufgerundet)
  // ==========================================================
  getRepairCost(b) {
    if (!b || !b.def) return null;
    if (b.def.repairCost) return b.def.repairCost;
    // Fallback: 50% der Originalkosten, aufgerundet
    if (!b.def.cost) return null;
    const out = {};
    for (const k in b.def.cost) {
      out[k] = Math.max(1, Math.ceil(b.def.cost[k] * 0.5));
    }
    return out;
  }

  // ==========================================================
  // Bäume (2×2)
  // ==========================================================
  loadTrees(treeList) {
    for (const t of treeList) {
      const tree = { x: t.x, y: t.y, regrowAt: null, growthUntil: null, _reservedBy: null };
      const key = t.x + ',' + t.y;
      this.trees.set(key, tree);
      for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          const px = t.x + dx, py = t.y + dy;
          if (this.inBounds(px, py)) this.blockedByTree[this._idx(px, py)] = 1;
        }
      }
      const bk = this._bucketKey(t.x, t.y, this.TREE_BUCKET);
      let bucket = this.treeGridBuckets.get(bk);
      if (!bucket) { bucket = new Set(); this.treeGridBuckets.set(bk, bucket); }
      bucket.add(tree);
    }
  }

  addTree(x, y) {
    const key = x + ',' + y;
    if (this.trees.has(key)) return false;
    const tree = { x, y, regrowAt: null, growthUntil: null, _reservedBy: null };
    this.trees.set(key, tree);
    for (let dy = 0; dy < 2; dy++) {
      for (let dx = 0; dx < 2; dx++) {
        const px = x + dx, py = y + dy;
        if (this.inBounds(px, py)) this.blockedByTree[this._idx(px, py)] = 1;
      }
    }
    const bk = this._bucketKey(x, y, this.TREE_BUCKET);
    let bucket = this.treeGridBuckets.get(bk);
    if (!bucket) { bucket = new Set(); this.treeGridBuckets.set(bk, bucket); }
    bucket.add(tree);
    this._addTreeToTerritoryCache(tree);
    this._notifyStaticChanged(this._treeTiles(tree));
    return true;
  }

  plantTree(x, y, now) {
    if (!this.hasSpaceForTreeAt(x, y)) return false;
    const key = x + ',' + y;
    if (this.trees.has(key)) return false;

    const tree = {
      x, y,
      regrowAt: null,
      growthUntil: now + this.TREE_GROWTH_MS,
      _reservedBy: null
    };
    this.trees.set(key, tree);
    for (let dy = 0; dy < 2; dy++) {
      for (let dx = 0; dx < 2; dx++) {
        const px = x + dx, py = y + dy;
        if (this.inBounds(px, py)) this.blockedByTree[this._idx(px, py)] = 1;
      }
    }
    const bk = this._bucketKey(x, y, this.TREE_BUCKET);
    let bucket = this.treeGridBuckets.get(bk);
    if (!bucket) { bucket = new Set(); this.treeGridBuckets.set(bk, bucket); }
    bucket.add(tree);

    this.growingTrees.push(tree);
    return true;
  }

  hasSpaceForTreeAt(x, y) {
    if (x < 0 || y < 0 || x + 1 >= this.width || y + 1 >= this.height) return false;
    const territory = this.getTerritorySet();
    for (let dy = 0; dy < 2; dy++) {
      for (let dx = 0; dx < 2; dx++) {
        const px = x + dx, py = y + dy;
        if (!territory.has(px + ',' + py)) return false;
        if (this.getTerrainId(px, py) !== 'grass') return false;
        const idx = this._idx(px, py);
        if (this.occupied.has(px + ',' + py)) return false;
        if (this.blockedByStone[idx]) return false;
        if (this.blockedByTree[idx]) return false;
        if (this.isDecoAt(px, py)) return false;
      }
    }
    return true;
  }

  tickTreeGrowth(now) {
    if (this.growingTrees.length === 0) return [];

    const stillGrowing = [];
    const changedTiles = [];

    for (let i = 0; i < this.growingTrees.length; i++) {
      const tree = this.growingTrees[i];
      if (tree.growthUntil !== null && now >= tree.growthUntil) {
        tree.growthUntil = null;
        changedTiles.push({ x: tree.x, y: tree.y });
        changedTiles.push({ x: tree.x + 1, y: tree.y });
        changedTiles.push({ x: tree.x, y: tree.y + 1 });
        changedTiles.push({ x: tree.x + 1, y: tree.y + 1 });
        this._addTreeToTerritoryCache(tree);
      } else {
        stillGrowing.push(tree);
      }
    }

    this.growingTrees = stillGrowing;

    if (changedTiles.length > 0) {
      this._notifyStaticChanged(changedTiles);
    }
    return changedTiles;
  }

  _clearTreeTiles(tree) {
    for (let dy = 0; dy < 2; dy++) {
      for (let dx = 0; dx < 2; dx++) {
        const px = tree.x + dx, py = tree.y + dy;
        if (!this.inBounds(px, py)) continue;
        this.blockedByTree[this._idx(px, py)] = 0;
      }
    }
  }

  _removeFromGrowingTrees(tree) {
    const idx = this.growingTrees.indexOf(tree);
    if (idx !== -1) this.growingTrees.splice(idx, 1);
  }

  removeTreeByTile(x, y) {
    for (let dy = -1; dy <= 0; dy++) {
      for (let dx = -1; dx <= 0; dx++) {
        const key = (x + dx) + ',' + (y + dy);
        const tree = this.trees.get(key);
        if (tree) {
          const tiles = this._treeTiles(tree);
          this._clearTreeTiles(tree);
          this.trees.delete(key);
          const bk = this._bucketKey(tree.x, tree.y, this.TREE_BUCKET);
          const bucket = this.treeGridBuckets.get(bk);
          if (bucket) bucket.delete(tree);
          this._removeFromGrowingTrees(tree);
          this._removeTreeFromTerritoryCache(tree);
          this._notifyStaticChanged(tiles);
          return true;
        }
      }
    }
    return false;
  }

  isTreeAt(x, y) {
    if (!this.inBounds(x, y)) return false;
    return this.blockedByTree[this._idx(x, y)] === 1;
  }

  reserveTree(tree, villagerId) {
    if (!tree) return false;
    if (tree._reservedBy !== null && tree._reservedBy !== villagerId) return false;
    if (tree.growthUntil !== null) return false;
    tree._reservedBy = villagerId;
    return true;
  }

  releaseTree(tree) {
    if (!tree) return;
    tree._reservedBy = null;
  }

  fellTree(x, y, now) {
    for (let dy = -1; dy <= 0; dy++) {
      for (let dx = -1; dx <= 0; dx++) {
        const key = (x + dx) + ',' + (y + dy);
        const tree = this.trees.get(key);
        if (!tree) continue;
        const tiles = this._treeTiles(tree);
        this._clearTreeTiles(tree);
        this.trees.delete(key);
        const bk = this._bucketKey(tree.x, tree.y, this.TREE_BUCKET);
        const bucket = this.treeGridBuckets.get(bk);
        if (bucket) bucket.delete(tree);
        this._removeFromGrowingTrees(tree);
        this._removeTreeFromTerritoryCache(tree);
        this._notifyStaticChanged(tiles);
        return true;
      }
    }
    return false;
  }

  tickTreeRegrow(now) {
    return [];
  }

  // ==========================================================
  // Steine (3×3)
  // ==========================================================
  loadStones(stoneList) {
    for (const s of stoneList) {
      const tiles = new Set();
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const px = s.cx + dx, py = s.cy + dy;
          tiles.add(px + ',' + py);
          if (this.inBounds(px, py)) this.blockedByStone[this._idx(px, py)] = 1;
        }
      }
      const stone = { cx: s.cx, cy: s.cy, tiles, _reservedBy: null };
      const key = s.cx + ',' + s.cy;
      this.stones.set(key, stone);
      const bk = this._bucketKey(s.cx, s.cy, this.STONE_BUCKET);
      let bucket = this.stoneGridBuckets.get(bk);
      if (!bucket) { bucket = new Set(); this.stoneGridBuckets.set(bk, bucket); }
      bucket.add(stone);
    }
  }

  isStoneAt(x, y) {
    if (!this.inBounds(x, y)) return null;
    const idx = this._idx(x, y);
    if (!this.blockedByStone[idx]) return null;
    const size = this.STONE_BUCKET;
    const bx = Math.floor(x / size);
    const by = Math.floor(y / size);
    const key = x + ',' + y;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const bucket = this.stoneGridBuckets.get((bx + dx) + ',' + (by + dy));
        if (!bucket) continue;
        for (const s of bucket) {
          if (s.tiles.has(key)) return s;
        }
      }
    }
    return null;
  }

  reserveStone(stone, villagerId) {
    if (!stone) return false;
    if (stone._reservedBy !== null && stone._reservedBy !== villagerId) return false;
    stone._reservedBy = villagerId;
    return true;
  }

  releaseStone(stone) {
    if (!stone) return;
    stone._reservedBy = null;
  }

  // ==========================================================
  // Wasser / Fisch
  // ==========================================================
  buildWaterTiles() {
    this.waterTiles.clear();
    this.fishWaterTiles.clear();

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.grid[y * this.width + x] === 'water') {
          this.waterTiles.add(x + ',' + y);
        }
      }
    }

    const innerTiles = [];
    for (const key of this.waterTiles) {
      const [xs, ys] = key.split(',');
      const x = +xs, y = +ys;
      const n1 = this.waterTiles.has((x + 1) + ',' + y);
      const n2 = this.waterTiles.has((x - 1) + ',' + y);
      const n3 = this.waterTiles.has(x + ',' + (y + 1));
      const n4 = this.waterTiles.has(x + ',' + (y - 1));
      if (n1 && n2 && n3 && n4) innerTiles.push({ x, y });
    }

    const count = Math.floor(innerTiles.length * 0.25);

    for (let i = innerTiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = innerTiles[i];
      innerTiles[i] = innerTiles[j];
      innerTiles[j] = tmp;
    }

    for (let i = 0; i < count && i < innerTiles.length; i++) {
      const t = innerTiles[i];
      this.fishWaterTiles.set(t.x + ',' + t.y, {
        x: t.x, y: t.y,
        remaining: this.FISH_MAX,
        cooldownUntil: 0,
        _reservedBy: null
      });
    }
  }

  consumeFishWater(x, y, now) {
    const key = x + ',' + y;
    const fish = this.fishWaterTiles.get(key);
    if (!fish) return false;
    if (fish.cooldownUntil > 0) return false;
    if (fish.remaining <= 0) return false;

    fish.remaining = Math.max(0, fish.remaining - 5);
    if (fish.remaining === 0) {
      fish.cooldownUntil = now + this.FISH_REGROW_MS;
    }
    this._refreshFishWaterCache(fish);
    return true;
  }

  reserveFishWater(fish, villagerId) {
    if (!fish) return false;
    if (fish._reservedBy !== null && fish._reservedBy !== villagerId) return false;
    fish._reservedBy = villagerId;
    return true;
  }

  releaseFishWater(fish) {
    if (!fish) return;
    fish._reservedBy = null;
  }

  tickFishRegrow(now) {
    const changedTiles = [];
    for (const fish of this.fishWaterTiles.values()) {
      if (fish.cooldownUntil > 0 && now >= fish.cooldownUntil) {
        fish.cooldownUntil = 0;
        fish.remaining = this.FISH_MAX;
        changedTiles.push({ x: fish.x, y: fish.y });
        this._refreshFishWaterCache(fish);
      }
    }
    return changedTiles;
  }

  isFishWaterActive(x, y) {
    const fish = this.fishWaterTiles.get(x + ',' + y);
    return !!fish && fish.cooldownUntil === 0 && fish.remaining > 0;
  }

  // ==========================================================
  // Deko
  // ==========================================================
  loadDecorations(decoList) {
    if (!decoList) return;
    for (const d of decoList) {
      const def = Game.DECORATIONS[d.id];
      if (!def) continue;
      const w = def.width || 1;
      const h = def.height || 1;
      const deco = { id: d.id, x: d.x, y: d.y };
      for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
          this.decorations.set((d.x + dx) + ',' + (d.y + dy), deco);
        }
      }
    }
  }

  isDecoAt(x, y) {
    return this.decorations.has(x + ',' + y);
  }

  getDecoAt(x, y) {
    return this.decorations.get(x + ',' + y) || null;
  }

  removeDecoByTile(x, y) {
    const deco = this.decorations.get(x + ',' + y);
    if (!deco) return false;
    const def = Game.DECORATIONS[deco.id];
    if (!def) return false;
    const w = def.width || 1;
    const h = def.height || 1;
    const tiles = [];
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        this.decorations.delete((deco.x + dx) + ',' + (deco.y + dy));
        tiles.push({ x: deco.x + dx, y: deco.y + dy });
      }
    }
    this._notifyStaticChanged(tiles);
    return true;
  }

  // ==========================================================
  // Gebäude
  // ==========================================================
  addBuilding(def, anchorX, anchorY) {
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

    const b = {
      id: this.nextBuildingId++,
      def, x: topLeftX, y: topLeftY,
      w, h,
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

      // NEU: Drachen-Zustände
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

      // Drachen-spezifisch
      dragonHits: 0
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
    b.ruined = false;
    b.isBeingRepaired = false;

    const index = this.buildSites.indexOf(b);
    if (index !== -1) this.buildSites.splice(index, 1);

    // NEU: Animated Buildings IMMER wieder eintragen, egal welcher Pfad unten genommen wird
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
      return;
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
  }
};
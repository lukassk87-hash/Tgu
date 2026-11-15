window.Game = window.Game || {};

Game.World.prototype.getTerritorySet = function() {
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
  
  const castleRadius = castle.def.expandsBorder || 10;
  addBox(cx, cy, castleRadius);

  for (const b of this.buildings.values()) {
    if (b.def.expandsBorder && (b.built || b.ruined)) {
      if (b.id === this.castleId) continue; 
      addBox(b.x, b.y, b.def.expandsBorder);
    }
  }

  this._territorySet = set;
  return set;
};

Game.World.prototype.invalidateTerritoryCache = function() {
  this._territorySet = null;
  this._territoryArray = null;
  this._rebuildTerritoryCache();
  this._notifyBorderChanged();
};

Game.World.prototype._isTreeInTerritory = function(tree) {
  const territory = this.getTerritorySet();
  for (let dy = 0; dy < 2; dy++) {
    for (let dx = 0; dx < 2; dx++) {
      if (territory.has((tree.x + dx) + ',' + (tree.y + dy))) return true;
    }
  }
  return false;
};

Game.World.prototype._isStoneInTerritory = function(stone) {
  const territory = this.getTerritorySet();
  for (const t of stone.tiles) {
    if (territory.has(t)) return true;
  }
  return false;
};

Game.World.prototype._isFishInTerritory = function(fish) {
  const territory = this.getTerritorySet();
  return territory.has(fish.x + ',' + fish.y);
};

Game.World.prototype._addTreeToTerritoryCache = function(tree) {
  if (tree.growthUntil !== null) return;
  if (!this._isTreeInTerritory(tree)) return;
  if (this._territoryTreeCache.indexOf(tree) !== -1) return;
  this._territoryTreeCache.push(tree);
};

Game.World.prototype._removeTreeFromTerritoryCache = function(tree) {
  const idx = this._territoryTreeCache.indexOf(tree);
  if (idx !== -1) this._territoryTreeCache.splice(idx, 1);
};

Game.World.prototype._addStoneToTerritoryCache = function(stone) {
  if (!this._isStoneInTerritory(stone)) return;
  if (this._territoryStoneCache.indexOf(stone) !== -1) return;
  this._territoryStoneCache.push(stone);
};

Game.World.prototype._removeStoneFromTerritoryCache = function(stone) {
  const idx = this._territoryStoneCache.indexOf(stone);
  if (idx !== -1) this._territoryStoneCache.splice(idx, 1);
};

Game.World.prototype._refreshFishWaterCache = function(fish) {
  const idx = this._territoryFishWaterCache.indexOf(fish);
  const valid = fish.cooldownUntil === 0
    && fish.remaining > 0
    && this._isFishInTerritory(fish);

  if (valid && idx === -1) {
    this._territoryFishWaterCache.push(fish);
  } else if (!valid && idx !== -1) {
    this._territoryFishWaterCache.splice(idx, 1);
  }
};

Game.World.prototype._rebuildTerritoryCache = function() {
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
    if (stone.capacity <= 0) continue;
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
};

Game.World.prototype.findNearestTreeInTerritory = function(fromX, fromY, excludeKeys) {
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
};

Game.World.prototype.findNearestStoneInTerritory = function(fromX, fromY) {
  if (!this._territoryCacheReady) this._rebuildTerritoryCache();

  let best = null, bestDist = Infinity;
  for (let i = 0; i < this._territoryStoneCache.length; i++) {
    const stone = this._territoryStoneCache[i];
    if (stone._reservedBy !== null) continue;
    if (stone.capacity <= 0) continue;
    const dx = stone.cx - fromX, dy = stone.cy - fromY;
    const d = dx * dx + dy * dy;
    if (d < bestDist) { bestDist = d; best = stone; }
  }
  return best;
};

Game.World.prototype.findNearestFishWaterInTerritory = function(fromX, fromY) {
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
};
window.Game = window.Game || {};

Game.World.prototype.loadTrees = function(treeList) {
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
};

Game.World.prototype.addTree = function(x, y) {
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
};

Game.World.prototype.plantTree = function(x, y, now) {
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
};

Game.World.prototype.hasSpaceForTreeAt = function(x, y) {
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
};

Game.World.prototype.tickTreeGrowth = function(now) {
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
};

Game.World.prototype._clearTreeTiles = function(tree) {
  for (let dy = 0; dy < 2; dy++) {
    for (let dx = 0; dx < 2; dx++) {
      const px = tree.x + dx, py = tree.y + dy;
      if (!this.inBounds(px, py)) continue;
      this.blockedByTree[this._idx(px, py)] = 0;
    }
  }
};

Game.World.prototype._removeFromGrowingTrees = function(tree) {
  const idx = this.growingTrees.indexOf(tree);
  if (idx !== -1) this.growingTrees.splice(idx, 1);
};

Game.World.prototype.removeTreeByTile = function(x, y) {
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
};

Game.World.prototype.isTreeAt = function(x, y) {
  if (!this.inBounds(x, y)) return false;
  return this.blockedByTree[this._idx(x, y)] === 1;
};

Game.World.prototype.reserveTree = function(tree, villagerId) {
  if (!tree) return false;
  if (tree._reservedBy !== null && tree._reservedBy !== villagerId) return false;
  if (tree.growthUntil !== null) return false;
  tree._reservedBy = villagerId;
  return true;
};

Game.World.prototype.releaseTree = function(tree) {
  if (!tree) return;
  tree._reservedBy = null;
};

Game.World.prototype.fellTree = function(x, y, now) {
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
};

Game.World.prototype.tickTreeRegrow = function(now) {
  return [];
};
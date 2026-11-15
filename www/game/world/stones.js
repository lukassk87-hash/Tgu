window.Game = window.Game || {};

Game.World.prototype.loadStones = function(stoneList) {
  for (const s of stoneList) {
    const maxCapacity = (s.maxCapacity !== undefined) ? s.maxCapacity : this.STONE_MAX_CAPACITY;
    const capacity = (s.capacity !== undefined) ? s.capacity : maxCapacity;
    if (capacity <= 0) continue;

    const stone = {
      cx: s.cx,
      cy: s.cy,
      capacity,
      maxCapacity,
      tiles: new Set(),
      _reservedBy: null
    };

    const key = s.cx + ',' + s.cy;
    this.stones.set(key, stone);

    this._applyStoneBlocking(stone);

    const bk = this._bucketKey(s.cx, s.cy, this.STONE_BUCKET);
    let bucket = this.stoneGridBuckets.get(bk);
    if (!bucket) { bucket = new Set(); this.stoneGridBuckets.set(bk, bucket); }
    bucket.add(stone);
  }
};

Game.World.prototype._applyStoneBlocking = function(stone) {
  const ratio = stone.maxCapacity > 0 ? (stone.capacity / stone.maxCapacity) : 0;

  let firstBlockedDy;
  if (ratio > 2 / 3) {
    firstBlockedDy = -1;
  } else if (ratio > 1 / 3) {
    firstBlockedDy = 0;
  } else if (ratio > 0) {
    firstBlockedDy = 1;
  } else {
    firstBlockedDy = 2;
  }

  stone.tiles.clear();

  for (let dy = -1; dy <= 1; dy++) {
    const blocked = (dy >= firstBlockedDy) ? 1 : 0;
    for (let dx = -1; dx <= 1; dx++) {
      const px = stone.cx + dx;
      const py = stone.cy + dy;
      if (!this.inBounds(px, py)) continue;
      this.blockedByStone[this._idx(px, py)] = blocked;
      if (blocked) stone.tiles.add(px + ',' + py);
    }
  }
};

Game.World.prototype.consumeStone = function(stone, amount) {
  if (!stone) return false;
  if (stone.capacity <= 0) return false;

  stone.capacity = Math.max(0, stone.capacity - amount);
  this._applyStoneBlocking(stone);

  const tiles = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      tiles.push({ x: stone.cx + dx, y: stone.cy + dy });
    }
  }
  this._notifyStaticChanged(tiles);

  if (stone.capacity <= 0) {
    this._removeStone(stone);
    return false;
  }
  return true;
};

Game.World.prototype._removeStone = function(stone) {
  if (!stone) return;
  const key = stone.cx + ',' + stone.cy;
  if (this.stones.get(key) !== stone) return;

  this.stones.delete(key);

  const bk = this._bucketKey(stone.cx, stone.cy, this.STONE_BUCKET);
  const bucket = this.stoneGridBuckets.get(bk);
  if (bucket) bucket.delete(stone);

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const px = stone.cx + dx, py = stone.cy + dy;
      if (!this.inBounds(px, py)) continue;
      this.blockedByStone[this._idx(px, py)] = 0;
    }
  }

  this._removeStoneFromTerritoryCache(stone);

  const tiles = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      tiles.push({ x: stone.cx + dx, y: stone.cy + dy });
    }
  }
  this._notifyStaticChanged(tiles);
};

Game.World.prototype.isStoneAt = function(x, y) {
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
};

Game.World.prototype.reserveStone = function(stone, villagerId) {
  if (!stone) return false;
  if (stone.capacity <= 0) return false;
  if (stone._reservedBy !== null && stone._reservedBy !== villagerId) return false;
  stone._reservedBy = villagerId;
  return true;
};

Game.World.prototype.releaseStone = function(stone) {
  if (!stone) return;
  stone._reservedBy = null;
};
window.Game = window.Game || {};

Game.World.prototype.buildWaterTiles = function() {
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
};

Game.World.prototype.consumeFishWater = function(x, y, now) {
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
};

Game.World.prototype.reserveFishWater = function(fish, villagerId) {
  if (!fish) return false;
  if (fish._reservedBy !== null && fish._reservedBy !== villagerId) return false;
  fish._reservedBy = villagerId;
  return true;
};

Game.World.prototype.releaseFishWater = function(fish) {
  if (!fish) return;
  fish._reservedBy = null;
};

Game.World.prototype.tickFishRegrow = function(now) {
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
};

Game.World.prototype.isFishWaterActive = function(x, y) {
  const fish = this.fishWaterTiles.get(x + ',' + y);
  return !!fish && fish.cooldownUntil === 0 && fish.remaining > 0;
};

Game.World.prototype.loadDecorations = function(decoList) {
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
};

Game.World.prototype.isDecoAt = function(x, y) {
  return this.decorations.has(x + ',' + y);
};

Game.World.prototype.getDecoAt = function(x, y) {
  return this.decorations.get(x + ',' + y) || null;
};

Game.World.prototype.removeDecoByTile = function(x, y) {
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
};
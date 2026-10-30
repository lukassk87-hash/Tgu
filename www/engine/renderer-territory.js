window.Game = window.Game || {};

Object.assign(Game.Renderer.prototype, {

  _invalidateBorderChunks() {
    const w = this.world;
    if (w.castleId === null) return;
    const chunkTiles = this.CHUNK_TILES;

    const castle = w.buildings.get(w.castleId);
    const cc = this._castleCenter(castle);
    const castleRadius = 10;
    this._invalidateCircleChunks(cc.cx, cc.cy, castleRadius, chunkTiles);

    for (const b of w.buildings.values()) {
      if (b.def.expandsBorder && b.built) {
        const r = b.def.expandsBorder;
        const bx = b.x + Math.floor((b.w || 1) / 2);
        const by = b.y + Math.floor((b.h || 1) / 2);
        this._invalidateCircleChunks(bx, by, r, chunkTiles);
      }
    }
  },

  _invalidateCircleChunks(cx, cy, radius, chunkTiles) {
    const minCx = Math.floor((cx - radius) / chunkTiles);
    const maxCx = Math.floor((cx + radius) / chunkTiles);
    const minCy = Math.floor((cy - radius) / chunkTiles);
    const maxCy = Math.floor((cy + radius) / chunkTiles);
    for (let cy2 = minCy; cy2 <= maxCy; cy2++) {
      for (let cx2 = minCx; cx2 <= maxCx; cx2++) {
        const chunk = this.chunks.get(cx2 + ',' + cy2);
        if (chunk) chunk.dirty = true;
      }
    }
  },

  _castleCenter(castle) {
    return {
      cx: castle.x + Math.floor((castle.w || 1) / 2),
      cy: castle.y + Math.floor((castle.h || 1) / 2)
    };
  },

  _isInsideBorder(x, y) {
    const w = this.world;
    if (w.castleId === null) return false;
    const castle = w.buildings.get(w.castleId);
    const baseR = 10;
    const { cx, cy } = this._castleCenter(castle);
    if (Math.abs(x - cx) <= baseR && Math.abs(y - cy) <= baseR) return true;
    for (const b of w.buildings.values()) {
      if (b.def.expandsBorder && b.built) {
        const r = b.def.expandsBorder;
        if (Math.abs(x - b.x) <= r && Math.abs(y - b.y) <= r) return true;
      }
    }
    return false;
  },

  _computeBorderTiles() {
    if (this._borderTilesCache) return this._borderTilesCache;

    const w = this.world;
    if (w.castleId === null) {
      this._borderTilesCache = [];
      return this._borderTilesCache;
    }

    const inside = new Set();
    const addBox = (cx, cy, r) => {
      const minX = Math.max(0, cx - r);
      const maxX = Math.min(w.width - 1, cx + r);
      const minY = Math.max(0, cy - r);
      const maxY = Math.min(w.height - 1, cy + r);
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          inside.add(x + ',' + y);
        }
      }
    };

    const castle = w.buildings.get(w.castleId);
    const { cx, cy } = this._castleCenter(castle);
    addBox(cx, cy, 10);

    for (const b of w.buildings.values()) {
      if (b.def.expandsBorder && b.built) {
        addBox(b.x, b.y, b.def.expandsBorder);
      }
    }

    const border = [];
    for (const key of inside) {
      const [xs, ys] = key.split(',');
      const x = +xs, y = +ys;
      const top = !inside.has(x + ',' + (y - 1));
      const bottom = !inside.has(x + ',' + (y + 1));
      const left = !inside.has((x - 1) + ',' + y);
      const right = !inside.has((x + 1) + ',' + y);
      if (top || bottom || left || right) border.push({ x, y, top, bottom, left, right });
    }

    this._borderTilesCache = border;
    return border;
  }

});
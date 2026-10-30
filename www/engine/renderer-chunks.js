window.Game = window.Game || {};

Object.assign(Game.Renderer.prototype, {

  markStaticDirty(tiles) {
    if (tiles && tiles.length > 0) {
      const chunkTiles = this.CHUNK_TILES;
      for (const t of tiles) {
        const cx = Math.floor(t.x / chunkTiles);
        const cy = Math.floor(t.y / chunkTiles);
        const chunk = this.chunks.get(cx + ',' + cy);
        if (chunk) chunk.dirty = true;
      }
    } else {
      for (const chunk of this.chunks.values()) chunk.dirty = true;
    }
    this._borderTilesCache = null;
    this._invalidateBorderChunks();
  },

  _getChunk(cx, cy) {
    const key = cx + ',' + cy;
    let chunk = this.chunks.get(key);
    if (!chunk) {
      const canvas = document.createElement('canvas');
      const size = this.CHUNK_TILES * this.tileSize * this.staticScale;
      canvas.width = size;
      canvas.height = size;
      chunk = { canvas, ctx: canvas.getContext('2d'), dirty: true, imagesMissing: false, cx, cy };
      this.chunks.set(key, chunk);
    }
    return chunk;
  },

  _ensureGlobalGrass() {
    const w = this.world;
    const ts = this.tileSize;
    const worldW = w.width * ts;
    const worldH = w.height * ts;

    if (this._globalGrassCanvas && !this._globalGrassDirty) {
      return this._globalGrassCanvas;
    }

    const grassPath = Game.TERRAIN_LAYERS.grass;
    const entry = Game.Assets._getImageEntry(grassPath);
    const img = entry && entry.img ? entry.img : null;

    if (!img) {
      Game.Assets.loadImage(grassPath);
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = worldW;
    canvas.height = worldH;
    const cctx = canvas.getContext('2d');
    cctx.imageSmoothingEnabled = true;
    cctx.imageSmoothingQuality = 'high';
    cctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, worldW, worldH);

    this._globalGrassCanvas = canvas;
    this._globalGrassDirty = false;
    return canvas;
  },

  _renderChunk(chunk) {
    const w = this.world, ts = this.tileSize;
    const scale = this.staticScale;
    const ctx = chunk.ctx;
    const tilesPerChunk = this.CHUNK_TILES;
    const chunkPxSize = tilesPerChunk * ts;

    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, chunkPxSize, chunkPxSize);

    const baseX = chunk.cx * tilesPerChunk;
    const baseY = chunk.cy * tilesPerChunk;

    const globalGrass = this._ensureGlobalGrass();
    if (globalGrass) {
      const srcX = chunk.cx * chunkPxSize;
      const srcY = chunk.cy * chunkPxSize;
      ctx.drawImage(globalGrass, srcX, srcY, chunkPxSize, chunkPxSize, 0, 0, chunkPxSize, chunkPxSize);
    } else {
      ctx.fillStyle = '#3f7d3f';
      ctx.fillRect(0, 0, chunkPxSize, chunkPxSize);
    }

    let imagesMissing = false;

    for (let ly = 0; ly < tilesPerChunk; ly++) {
      const y = baseY + ly;
      if (y >= w.height) break;
      for (let lx = 0; lx < tilesPerChunk; lx++) {
        const x = baseX + lx;
        if (x >= w.width) break;

        const terrainId = w.getTerrainId(x, y);
        if (!terrainId || terrainId === 'grass') continue;

        const layerPath = Game.TERRAIN_LAYERS[terrainId];
        if (!layerPath) continue;

        const entry = Game.Assets._getImageEntry(layerPath);
        const img = entry && entry.img ? entry.img : null;

        if (!img) {
          Game.Assets.loadImage(layerPath);
          imagesMissing = true;
          continue;
        }

        const maxX = Math.max(1, img.width - ts);
        const maxY = Math.max(1, img.height - ts);
        const sx = Math.floor((x * ts) % maxX);
        const sy = Math.floor((y * ts) % maxY);

        const px = lx * ts;
        const py = ly * ts;

        ctx.drawImage(img, sx, sy, ts, ts, px, py, ts, ts);
      }
    }

    if (w.castleId !== null) {
      const iconSize = 8;
      const border = this._computeBorderTiles();
      for (const t of border) {
        if (t.x < baseX || t.x >= baseX + tilesPerChunk) continue;
        if (t.y < baseY || t.y >= baseY + tilesPerChunk) continue;
        const px = (t.x - baseX) * ts, py = (t.y - baseY) * ts;
        if (t.top) {
          const isCorner = t.left || t.right;
          if (isCorner || t.x % 3 === 0) Game.Assets.drawTile(ctx, 'images/grenze-rot.webp', '', px + ts/2 - iconSize/2, py - iconSize/2, iconSize, iconSize);
        }
        if (t.bottom) {
          const isCorner = t.left || t.right;
          if (isCorner || t.x % 3 === 0) Game.Assets.drawTile(ctx, 'images/grenze-rot.webp', '', px + ts/2 - iconSize/2, py + ts - iconSize/2, iconSize, iconSize);
        }
        if (t.left) {
          const isCorner = t.top || t.bottom;
          if (isCorner || t.y % 3 === 0) Game.Assets.drawTile(ctx, 'images/grenze-rot.webp', '', px - iconSize/2, py + ts/2 - iconSize/2, iconSize, iconSize);
        }
        if (t.right) {
          const isCorner = t.top || t.bottom;
          if (isCorner || t.y % 3 === 0) Game.Assets.drawTile(ctx, 'images/grenze-rot.webp', '', px + ts - iconSize/2, py + ts/2 - iconSize/2, iconSize, iconSize);
        }
      }
    }

    const chunkWorldMinX = baseX;
    const chunkWorldMaxX = baseX + tilesPerChunk - 1;
    const chunkWorldMinY = baseY;
    const chunkWorldMaxY = baseY + tilesPerChunk - 1;

    for (const b of w.buildings.values()) {
      if (!b.built) continue;
      if (b.def.animationFrames) continue;
      const bw = b.w || 1;
      const bh = b.h || 1;
      if (b.x + bw - 1 < chunkWorldMinX) continue;
      if (b.x > chunkWorldMaxX) continue;
      if (b.y + bh - 1 < chunkWorldMinY) continue;
      if (b.y > chunkWorldMaxY) continue;

      const px = (b.x - baseX) * ts;
      const py = (b.y - baseY) * ts;
      const bww = bw * ts;
      const bhh = bh * ts;

      if (b.def.produces) {
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.2)';
        ctx.lineWidth = 1;
        for (const field of b.fields) {
          ctx.strokeRect((field.x - baseX) * ts, (field.y - baseY) * ts, ts, ts);
        }
      }

      if (b.def.asset) {
        const bEntry = Game.Assets._getImageEntry(b.def.asset);
        if (!bEntry || !bEntry.img) {
          Game.Assets.loadImage(b.def.asset);
          imagesMissing = true;
        }
      }

      Game.Assets.drawTile(ctx, b.def.asset, b.def.emoji, px, py, bww, bhh);
    }

    chunk.dirty = false;
    chunk.imagesMissing = imagesMissing;
  }

});
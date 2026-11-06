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
  },

  markBorderDirty() {
    this._borderTilesCache = null;
    this._invalidateBorderChunks();
  },

  _getChunk(cx, cy) {
    const key = cx + ',' + cy;
    let chunk = this.chunks.get(key);
    if (!chunk) {
      const size = this.CHUNK_TILES * this.tileSize * this.staticScale;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      chunk = {
        canvas: canvas,
        ctx: canvas.getContext('2d', { alpha: false }),
        dirty: true,
        imagesMissing: false,
        cx, cy,
        lastUsedFrame: this._frameCounter || 0
      };
      this.chunks.set(key, chunk);
    }
    chunk.lastUsedFrame = this._frameCounter || 0;
    return chunk;
  },

  _evictChunks() {
    const cam = this.camera;
    const ts = this.tileSize;
    const chunkPixelSize = this.CHUNK_TILES * ts;

    const minCx = Math.floor(cam.x / chunkPixelSize);
    const maxCx = Math.floor((cam.x + window.innerWidth / cam.zoom) / chunkPixelSize);
    const minCy = Math.floor(cam.y / chunkPixelSize);
    const maxCy = Math.floor((cam.y + window.innerHeight / cam.zoom) / chunkPixelSize);

    const buffer = 2;
    const keepMinCx = minCx - buffer;
    const keepMaxCx = maxCx + buffer;
    const keepMinCy = minCy - buffer;
    const keepMaxCy = maxCy + buffer;

    for (const [key, chunk] of this.chunks) {
      if (chunk.cx < keepMinCx || chunk.cx > keepMaxCx ||
          chunk.cy < keepMinCy || chunk.cy > keepMaxCy) {
        if (chunk.canvas) {
          chunk.canvas.width = 0;
          chunk.canvas.height = 0;
        }
        this.chunks.delete(key);
      }
    }
  },

  _ensureGrassTile() {
    if (this._grassTileCanvas && !this._globalGrassDirty) {
      return this._grassTileCanvas;
    }

    const grassPath = Game.TERRAIN_LAYERS.grass;
    const entry = Game.Assets._getImageEntry(grassPath);
    const img = entry && entry.img ? entry.img : null;

    if (!img) {
      Game.Assets.loadImage(grassPath);
      return null;
    }

    const ts = this.tileSize;
    const MAX_TILE_PX = 128;
    const tileSizeInTiles = Math.max(1, Math.ceil(img.width / ts));
    const renderTilePx = Math.min(MAX_TILE_PX, tileSizeInTiles * ts);

    const canvas = document.createElement('canvas');
    canvas.width = renderTilePx;
    canvas.height = renderTilePx;
    const cctx = canvas.getContext('2d', { alpha: false });
    cctx.imageSmoothingEnabled = true;
    cctx.imageSmoothingQuality = 'low';
    cctx.drawImage(img, 0, 0, renderTilePx, renderTilePx);

    this._grassTileCanvas = canvas;
    this._grassTilePx = renderTilePx;
    this._globalGrassDirty = false;
    return canvas;
  },

  _drawGrassIntoChunk(ctx, chunkPxSize) {
    const grassTile = this._ensureGrassTile();
    if (!grassTile) {
      ctx.fillStyle = '#3f7d3f';
      ctx.fillRect(0, 0, chunkPxSize, chunkPxSize);
      return;
    }

    const tilePx = this._grassTilePx;
    for (let y = 0; y < chunkPxSize; y += tilePx) {
      for (let x = 0; x < chunkPxSize; x += tilePx) {
        ctx.drawImage(grassTile, x, y, tilePx, tilePx);
      }
    }
  },

  _drawWaterTileWithRoundedCorners(ctx, img, x, y, ts, tileX, tileY, w) {
    const isWater = (px, py) => {
      if (px < 0 || py < 0 || px >= w.width || py >= w.height) return false;
      return w.grid[py * w.width + px] === 'water';
    };

    const up = isWater(tileX, tileY - 1);
    const down = isWater(tileX, tileY + 1);
    const left = isWater(tileX - 1, tileY);
    const right = isWater(tileX + 1, tileY);

    const maxX = Math.max(1, img.width - ts);
    const maxY = Math.max(1, img.height - ts);
    const sx = Math.floor((tileX * ts) % maxX);
    const sy = Math.floor((tileY * ts) % maxY);
    ctx.drawImage(img, sx, sy, ts, ts, x, y, ts, ts);

    const grassTile = this._ensureGrassTile();
    if (!grassTile) return;

    const r = ts * 0.4;

    const drawGrassCorner = (corner) => {
      ctx.save();
      ctx.beginPath();

      if (corner === 'tl') {
        ctx.moveTo(x, y + r);
        ctx.arc(x + r, y + r, r, Math.PI, 1.5 * Math.PI, false);
        ctx.lineTo(x, y);
        ctx.closePath();
      } else if (corner === 'tr') {
        ctx.moveTo(x + ts - r, y);
        ctx.arc(x + ts - r, y + r, r, 1.5 * Math.PI, 2 * Math.PI, false);
        ctx.lineTo(x + ts, y);
        ctx.closePath();
      } else if (corner === 'bl') {
        ctx.moveTo(x, y + ts - r);
        ctx.arc(x + r, y + ts - r, r, Math.PI, 0.5 * Math.PI, true);
        ctx.lineTo(x, y + ts);
        ctx.closePath();
      } else if (corner === 'br') {
        ctx.moveTo(x + ts - r, y + ts);
        ctx.arc(x + ts - r, y + ts - r, r, 0.5 * Math.PI, 0, true);
        ctx.lineTo(x + ts, y + ts);
        ctx.closePath();
      }

      ctx.clip();
      ctx.drawImage(grassTile, 0, 0, grassTile.width, grassTile.height, x, y, ts, ts);
      ctx.restore();
    };

    if (!up && !left) drawGrassCorner('tl');
    if (!up && !right) drawGrassCorner('tr');
    if (!down && !left) drawGrassCorner('bl');
    if (!down && !right) drawGrassCorner('br');
  },

  _renderChunk(chunk) {
    const w = this.world, ts = this.tileSize;
    const scale = this.staticScale;
    const ctx = chunk.ctx;
    const tilesPerChunk = this.CHUNK_TILES;
    const chunkPxSize = tilesPerChunk * ts;

    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'low';

    this._drawGrassIntoChunk(ctx, chunkPxSize);

    const baseX = chunk.cx * tilesPerChunk;
    const baseY = chunk.cy * tilesPerChunk;

    let imagesMissing = false;
    const grid = w.grid;
    const worldWidth = w.width;

    for (let ly = 0; ly < tilesPerChunk; ly++) {
      const y = baseY + ly;
      if (y >= w.height) break;
      const rowOffset = y * worldWidth;
      for (let lx = 0; lx < tilesPerChunk; lx++) {
        const x = baseX + lx;
        if (x >= w.width) break;

        const terrainId = grid[rowOffset + x];
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

        const px = lx * ts;
        const py = ly * ts;

        if (terrainId === 'water') {
          this._drawWaterTileWithRoundedCorners(ctx, img, px, py, ts, x, y, w);
        } else {
          const maxX = Math.max(1, img.width - ts);
          const maxY = Math.max(1, img.height - ts);
          const sx = Math.floor((x * ts) % maxX);
          const sy = Math.floor((y * ts) % maxY);
          ctx.drawImage(img, sx, sy, ts, ts, px, py, ts, ts);
        }
      }
    }

    const decoRendered = new Set();
    for (const deco of w.decorations.values()) {
      const key = deco.x + ',' + deco.y;
      if (decoRendered.has(key)) continue;
      decoRendered.add(key);

      const def = Game.DECORATIONS[deco.id];
      if (!def) continue;

      const dw = def.width || 1;
      const dh = def.height || 1;

      if (deco.x + dw - 1 < baseX || deco.x > baseX + tilesPerChunk - 1) continue;
      if (deco.y + dh - 1 < baseY || deco.y > baseY + tilesPerChunk - 1) continue;

      const px = (deco.x - baseX) * ts;
      const py = (deco.y - baseY) * ts;

      Game.Assets.drawTile(ctx, def.asset, '', px, py, dw * ts, dh * ts);
    }

    for (const stone of w.stones.values()) {
      const sx = stone.cx - 1;
      const sy = stone.cy - 1;
      if (sx + 2 < baseX || sx > baseX + tilesPerChunk - 1) continue;
      if (sy + 2 < baseY || sy > baseY + tilesPerChunk - 1) continue;

      const px = (sx - baseX) * ts;
      const py = (sy - baseY) * ts;
      const sw = ts * 3;
      const sh = ts * 3;

      Game.Assets.drawTile(ctx, 'images/icon_stein.webp', '🪨', px, py, sw, sh);
    }

    for (const tree of w.trees.values()) {
      if (tree.growthUntil !== null) continue;
      if (tree.x + 1 < baseX || tree.x > baseX + tilesPerChunk - 1) continue;
      if (tree.y + 1 < baseY || tree.y > baseY + tilesPerChunk - 1) continue;

      const px = (tree.x - baseX) * ts;
      const py = (tree.y - baseY) * ts;
      const tw = ts * 2;
      const th = ts * 2;

      Game.Assets.drawTile(ctx, 'images/icon_baum.webp', '🌳', px, py, tw, th);
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
          if (isCorner || t.x % 3 === 0) Game.Assets.drawTile(ctx, 'images/grenze-rot.webp', '', px + ts / 2 - iconSize / 2, py - iconSize / 2, iconSize, iconSize);
        }
        if (t.bottom) {
          const isCorner = t.left || t.right;
          if (isCorner || t.x % 3 === 0) Game.Assets.drawTile(ctx, 'images/grenze-rot.webp', '', px + ts / 2 - iconSize / 2, py + ts - iconSize / 2, iconSize, iconSize);
        }
        if (t.left) {
          const isCorner = t.top || t.bottom;
          if (isCorner || t.y % 3 === 0) Game.Assets.drawTile(ctx, 'images/grenze-rot.webp', '', px - iconSize / 2, py + ts / 2 - iconSize / 2, iconSize, iconSize);
        }
        if (t.right) {
          const isCorner = t.top || t.bottom;
          if (isCorner || t.y % 3 === 0) Game.Assets.drawTile(ctx, 'images/grenze-rot.webp', '', px + ts - iconSize / 2, py + ts / 2 - iconSize / 2, iconSize, iconSize);
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

      // NEU: Schadensstufen für das Schloss
      let assetToDraw = b.def.asset;
      if (b.def.id === 'castle' && b.def.damageAssets && b.dragonHits > 0) {
        const idx = Math.min(b.dragonHits, b.def.damageAssets.length - 1);
        assetToDraw = b.def.damageAssets[idx];
      }

      if (assetToDraw) {
        const bEntry = Game.Assets._getImageEntry(assetToDraw);
        if (!bEntry || !bEntry.img) {
          Game.Assets.loadImage(assetToDraw);
          imagesMissing = true;
        }
      }

      Game.Assets.drawTile(ctx, assetToDraw, b.def.emoji, px, py, bww, bhh);
    }

    chunk.dirty = false;
    chunk.imagesMissing = imagesMissing;
  }

});
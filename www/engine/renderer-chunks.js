window.Game = window.Game || {};

Object.assign(Game.Renderer.prototype, {

  markStaticDirty(tiles) {
    if (tiles && tiles.length > 0) {
      const chunkTiles = this.CHUNK_TILES;
      for (const t of tiles) {
        const cx = Math.floor(t.x / chunkTiles);
        const cy = Math.floor(t.y / chunkTiles);
        const key = cx + ',' + cy;
        
        const ground = this.chunks.get(key);
        if (ground) ground.dirty = true;
        const building = this.buildingChunks.get(key);
        if (building) building.dirty = true;
        const obstacle = this.obstacleChunks.get(key);
        if (obstacle) obstacle.dirty = true;
      }
    } else {
      for (const chunk of this.chunks.values()) chunk.dirty = true;
      for (const chunk of this.buildingChunks.values()) chunk.dirty = true;
      for (const chunk of this.obstacleChunks.values()) chunk.dirty = true;
    }
  },

  markBorderDirty() {
    this._borderTilesCache = null;
    this._invalidateBorderChunks();
  },

  _getChunk(cx, cy, layer) {
    let map;
    if (layer === 'building') {
      map = this.buildingChunks;
    } else if (layer === 'obstacle') {
      map = this.obstacleChunks;
    } else {
      map = this.chunks;
    }

    const key = cx + ',' + cy;
    let chunk = map.get(key);
    if (!chunk) {
      const size = this.CHUNK_TILES * this.tileSize * this.staticScale;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      
      const ctx = (layer === 'ground')
        ? canvas.getContext('2d', { alpha: false })
        : canvas.getContext('2d', { alpha: true });
        
      chunk = {
        canvas: canvas,
        ctx: ctx,
        dirty: true,
        imagesMissing: false,
        cx, cy,
        layer: layer,
        lastUsedFrame: this._frameCounter || 0
      };
      map.set(key, chunk);
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

    const evictFromMap = (map) => {
      for (const [key, chunk] of map) {
        if (chunk.cx < keepMinCx || chunk.cx > keepMaxCx ||
            chunk.cy < keepMinCy || chunk.cy > keepMaxCy) {
          if (chunk.canvas) {
            chunk.canvas.width = 0;
            chunk.canvas.height = 0;
          }
          map.delete(key);
        }
      }
    };

    evictFromMap(this.chunks);
    evictFromMap(this.buildingChunks);
    evictFromMap(this.obstacleChunks);
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

  _drawStone(ctx, stone, baseX, baseY, ts, tilesPerChunk) {
    if (stone.capacity <= 0) return;

    const ratio = stone.maxCapacity > 0
      ? Math.max(0, Math.min(1, stone.capacity / stone.maxCapacity))
      : 0;
    if (ratio <= 0) return;

    const blockX = stone.cx - 1;
    const blockY = stone.cy - 1;
    const fullW = ts * 3;
    const fullH = ts * 3;

    if (blockX + 2 < baseX || blockX > baseX + tilesPerChunk - 1) return;
    if (blockY + 2 < baseY || blockY > baseY + tilesPerChunk - 1) return;

    const drawW = fullW * ratio;
    const drawH = fullH * ratio;

    const blockCenterX = (blockX - baseX) * ts + fullW / 2;
    const drawX = blockCenterX - drawW / 2;

    const blockBottomY = (blockY - baseY) * ts + fullH;
    const drawY = blockBottomY - drawH;

    Game.Assets.drawTile(ctx, 'images/icon_stein.webp', '🪨', drawX, drawY, drawW, drawH);
  },

  _drawBuilding(ctx, b, baseX, baseY, ts) {
    const bw = b.w || 1;
    const bh = b.h || 1;

    if (b.x + bw - 1 < baseX) return;
    if (b.x > baseX + this.CHUNK_TILES - 1) return;
    if (b.y + bh - 1 < baseY) return;
    if (b.y > baseY + this.CHUNK_TILES - 1) return;

    const px = (b.x - baseX) * ts;
    const py = (b.y - baseY) * ts;
    const bww = bw * ts;
    const bhh = bh * ts;

    if (b.def.produces && b.fields) {
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.2)';
      ctx.lineWidth = 1;
      for (const field of b.fields) {
        ctx.strokeRect((field.x - baseX) * ts, (field.y - baseY) * ts, ts, ts);
      }
    }

    let assetToDraw = b.def.asset;
    if (b.def.id === 'castle' && b.def.damageAssets && b.dragonHits > 0) {
      const idx = Math.min(b.dragonHits, b.def.damageAssets.length - 1);
      assetToDraw = b.def.damageAssets[idx];
    }

    if (assetToDraw) {
      const bEntry = Game.Assets._getImageEntry(assetToDraw);
      if (!bEntry || !bEntry.img) {
        Game.Assets.loadImage(assetToDraw);
      }
    }

    // ⚠️ NEU: Graustufen-Filter für stillgelegte Gebäude
    if (b.paused) {
      ctx.filter = 'grayscale(1)';
    }

    Game.Assets.drawTile(ctx, assetToDraw, b.def.emoji, px, py, bww, bhh);

    // Filter zurücksetzen
    if (b.paused) {
      ctx.filter = 'none';
    }
  },

  _renderChunk(chunk, layer) {
    const w = this.world, ts = this.tileSize;
    const scale = this.staticScale;
    const ctx = chunk.ctx;
    const tilesPerChunk = this.CHUNK_TILES;
    const chunkPxSize = tilesPerChunk * ts;

    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'low';

    // ============================================================
    // GEBÄUDE-LAYER
    // ============================================================
    if (layer === 'building') {
      ctx.clearRect(0, 0, chunkPxSize, chunkPxSize);

      const baseX = chunk.cx * tilesPerChunk;
      const baseY = chunk.cy * tilesPerChunk;

      for (const b of w.buildings.values()) {
        if (!b.built) continue;
        if (b.ruined) continue;
        if (b.def.animationFrames) continue;
        this._drawBuilding(ctx, b, baseX, baseY, ts);
      }

      chunk.dirty = false;
      chunk.imagesMissing = false;
      return;
    }

    // ============================================================
    // HINDERNIS-LAYER (Bäume + Steine + wachsende Bäume)
    // ============================================================
    if (layer === 'obstacle') {
      ctx.clearRect(0, 0, chunkPxSize, chunkPxSize);

      const baseX = chunk.cx * tilesPerChunk;
      const baseY = chunk.cy * tilesPerChunk;

      for (const stone of w.stones.values()) {
        this._drawStone(ctx, stone, baseX, baseY, ts, tilesPerChunk);
      }

      // Ausgewachsene Bäume
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

      // Wachsende Bäume (Sprösslinge)
      const total = w.TREE_GROWTH_MS || 240000;
      const now = performance.now();

      for (let i = 0; i < w.growingTrees.length; i++) {
        const tree = w.growingTrees[i];
        if (tree.growthUntil === null) continue;
        if (tree.x + 1 < baseX || tree.x > baseX + tilesPerChunk - 1) continue;
        if (tree.y + 1 < baseY || tree.y > baseY + tilesPerChunk - 1) continue;

        const remaining = tree.growthUntil - now;
        if (remaining <= 0) continue;

        const progress = 1 - Math.min(1, remaining / total);
        const sizeScale = 0.2 + progress * 0.8;
        const bww = ts * 2 * sizeScale;
        const bhh = ts * 2 * sizeScale;
        const offsetX = (ts * 2 - bww) / 2;
        const offsetY = (ts * 2 - bhh);

        const px = (tree.x - baseX) * ts + offsetX;
        const py = (tree.y - baseY) * ts + offsetY;

        Game.Assets.drawTile(ctx, 'images/icon_baum.webp', '🌱', px, py, bww, bhh);
      }

      chunk.dirty = false;
      chunk.imagesMissing = false;
      return;
    }

    // ============================================================
    // BODEN-LAYER (Terrain + Deko + Grenzen + Baustellen)
    // ============================================================
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

    // Deko
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

    // Grenzen
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

    // Baustellen
    const chunkWorldMinX = baseX;
    const chunkWorldMaxX = baseX + tilesPerChunk - 1;
    const chunkWorldMinY = baseY;
    const chunkWorldMaxY = baseY + tilesPerChunk - 1;

    for (const b of w.buildSites) {
      if (!b.built) {
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

        if (b.ruined) {
          const ruinPath = b.ruinAsset || b.def.ruinAsset || 'images/ruine-quadrat.webp';
          if (b.isBeingRepaired && b.buildTime > 0) {
            const progress = Math.min(1, b.progress / b.buildTime);
            if (progress > 0.01) {
              const visibleHeight = bhh * progress;
              const clipY = py + bhh - visibleHeight;
              ctx.save();
              ctx.beginPath();
              ctx.rect(px, clipY, bww, visibleHeight);
              ctx.clip();
              Game.Assets.drawTile(ctx, b.def.asset, b.def.emoji, px, py, bww, bhh);
              ctx.restore();
            }
            Game.Assets.drawTile(ctx, ruinPath, '🏚️', px, py, bww, bhh);
          } else {
            Game.Assets.drawTile(ctx, ruinPath, '🏚️', px, py, bww, bhh);
          }
          continue;
        }

        if (b.progress <= 0) {
          ctx.fillStyle = '#6b3a1a';
          ctx.fillRect(px, py + bhh - 4, bww, 4);
          continue;
        }

        const progress = Math.min(1, b.progress / b.buildTime);
        if (progress <= 0.01) continue;

        const visibleHeight = bhh * progress;
        const clipY = py + bhh - visibleHeight;
        ctx.save();
        ctx.beginPath();
        ctx.rect(px, clipY, bww, visibleHeight);
        ctx.clip();
        Game.Assets.drawTile(ctx, b.def.asset, b.def.emoji, px, py, bww, bhh);
        ctx.restore();
      }
    }

    chunk.dirty = false;
    chunk.imagesMissing = imagesMissing;
  }

});
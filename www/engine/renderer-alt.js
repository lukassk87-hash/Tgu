window.Game = window.Game || {};

Game.TERRAIN_LAYERS = {
  grass:    'images/gras.webp',
  forest:   'images/holz.webp',
  mountain: 'images/stein.webp',
  water:    'images/wasser.webp'
};

Game.Renderer = class Renderer {
  constructor(canvas, world, vm) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.world = world;
    this.vm = vm;
    this.zombieManager = null;
    this.gravestones = [];

    this.camera = { x: 0, y: 0, zoom: 1 };
    this.tileSize = 32;
    this.staticScale = 3;
    this.CHUNK_TILES = 16;

    this.chunks = new Map();

    this.hoverX = -1;
    this.hoverY = -1;
    this.hoverValid = false;
    this.hoverDef = null;

    this.pendingPlacement = null;

    this.resourceEmoji = {
      'wood': '🌲', 'stone': '🪨', 'grain': '🌾', 'fish': '🐟',
      'water': '💧', 'beer': '🍺', 'woodPlank': '🪵', 'flour': '🌾', 'bread': '🍞'
    };

    this.particles = [];
    this.MAX_PARTICLES = 100;
    this.smoothTimers = new Map();
    this.buildSmoothTimers = new Map();
    this.selectedBuildingId = null;

    this._borderTilesCache = null;
    this._globalGrassCanvas = null;
    this._globalGrassDirty = true;

    this._view = { minX: 0, minY: 0, maxX: 0, maxY: 0 };

    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  _resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.dpr = dpr;
    this.clampCamera();
  }

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
  }

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
  }

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
  }

  _castleCenter(castle) {
    return {
      cx: castle.x + Math.floor((castle.w || 1) / 2),
      cy: castle.y + Math.floor((castle.h || 1) / 2)
    };
  }

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
  }

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

  _getChunk(cx, cy) {
    const key = cx + ',' + cy;
    let chunk = this.chunks.get(key);
    if (!chunk) {
      const canvas = document.createElement('canvas');
      const size = this.CHUNK_TILES * this.tileSize * this.staticScale;
      canvas.width = size;
      canvas.height = size;
      chunk = { canvas, ctx: canvas.getContext('2d'), dirty: true, cx, cy };
      this.chunks.set(key, chunk);
    }
    return chunk;
  }

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
  }

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
      ctx.drawImage(
        globalGrass,
        srcX, srcY, chunkPxSize, chunkPxSize,
        0, 0, chunkPxSize, chunkPxSize
      );
    } else {
      ctx.fillStyle = '#3f7d3f';
      ctx.fillRect(0, 0, chunkPxSize, chunkPxSize);
    }

    const OVERLAP = 3;
    const drawSize = ts + OVERLAP;
    const halfOverlap = OVERLAP / 2;

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
          continue;
        }

        const sx = (x * ts) % (img.width - ts);
        const sy = (y * ts) % (img.height - ts);

        const px = lx * ts - halfOverlap;
        const py = ly * ts - halfOverlap;

        ctx.drawImage(
          img,
          sx, sy, ts, ts,
          px, py, drawSize, drawSize
        );
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

      Game.Assets.drawTile(ctx, b.def.asset, b.def.emoji, px, py, bww, bhh);
    }

    chunk.dirty = false;
  }

  _updateViewport() {
    const cam = this.camera, ts = this.tileSize;
    const margin = 100;
    this._view.minX = (cam.x - margin) / ts;
    this._view.minY = (cam.y - margin) / ts;
    this._view.maxX = (cam.x + window.innerWidth / cam.zoom + margin) / ts;
    this._view.maxY = (cam.y + window.innerHeight / cam.zoom + margin) / ts;
  }

  _isVisible(worldX, worldY) {
    return worldX >= this._view.minX && worldX <= this._view.maxX &&
           worldY >= this._view.minY && worldY <= this._view.maxY;
  }

  _updateWaterDepth(v, dt) {
    const w = this.world, ts = this.tileSize;
    const vSize = ts * 0.9;
    const offset = (ts - vSize) / 2;
    const feetTopY = v.renderY * ts + offset + vSize * 0.75;
    const feetTopWorldY = feetTopY / ts;
    const feetTileY = Math.floor(feetTopWorldY);
    const feetTileX = Math.floor(v.renderX);
    const feetTerrain = w.getTerrainId(feetTileX, feetTileY);
    const isInWater = feetTerrain === 'water';

    const prevDepth = v.waterDepth || 0;
    const targetDepth = isInWater ? 1.0 : 0.0;
    let newDepth = prevDepth;
    if (isInWater) {
      const speed = 3.0 * (dt / 1000);
      if (prevDepth < targetDepth) newDepth = Math.min(targetDepth, prevDepth + speed);
    } else {
      newDepth = 0;
    }
    v.waterDepth = newDepth;
    return newDepth;
  }

  spawnHarvestParticles(tileX, tileY, resourceType) {
    if (this.particles.length >= this.MAX_PARTICLES) {
      this.particles.splice(0, 8);
    }

    let color = '#fff';
    if (resourceType === 'wood') color = '#8B4513';
    else if (resourceType === 'stone') color = '#999';
    else if (resourceType === 'grain') color = '#DAA520';
    else if (resourceType === 'fish') color = '#00BFFF';
    else if (resourceType === 'water') color = '#4A90E2';

    const ts = this.tileSize;
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: tileX * ts + ts / 2 + (Math.random() * 10 - 5),
        y: tileY * ts + ts / 2 + (Math.random() * 10 - 5),
        vx: (Math.random() - 0.5) * 1.5,
        vy: -Math.random() * 2 - 0.5,
        life: 1.0, color: color, size: 3
      });
    }
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * (dt / 16);
      p.y += p.vy * (dt / 16);
      p.vy += 0.15 * (dt / 16);
      p.life -= dt * 0.003;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  _drawEmoji(ctx, emoji, x, y, size) {
    ctx.font = Math.floor(size * 0.8) + 'px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, x + size/2, y + size/2);
  }

  _drawPlacementPreview(ctx, def, anchorX, anchorY, valid, ts, cam, now) {
    const dw = def.width || 1;
    const dh = def.height || 1;
    const topLeft = Game.Buildings.getTopLeft(def, anchorX, anchorY);
    const tx0 = topLeft.x;
    const ty0 = topLeft.y;
    const hw = dw * ts;
    const hh = dh * ts;
    const px = tx0 * ts;
    const py = ty0 * ts;

    for (let dy = 0; dy < dh; dy++) {
      for (let dx = 0; dx < dw; dx++) {
        const tx = tx0 + dx;
        const ty = ty0 + dy;
        const terr = this.world.getTerrain(tx, ty);
        const isOccupied = this.world.occupied.has(tx + ',' + ty);
        const fieldOk = terr && terr.buildable && !isOccupied
          && (!def.requiresTerrain || terr.id === def.requiresTerrain);

        ctx.fillStyle = fieldOk ? 'rgba(0, 255, 0, 0.28)' : 'rgba(255, 0, 0, 0.38)';
        ctx.fillRect(tx * ts, ty * ts, ts, ts);
      }
    }

    const pulse = 0.5 + 0.5 * Math.sin(now * 0.006);
    ctx.strokeStyle = valid ? `rgba(0, 255, 0, ${0.6 + 0.4 * pulse})` : '#ff0000';
    ctx.lineWidth = (2 + pulse * 1.5) / cam.zoom;
    ctx.strokeRect(px + 1, py + 1, hw - 2, hh - 2);

    if (def.expandsBorder) {
      const r = def.expandsBorder;
      const cX = tx0 + Math.floor(dw / 2);
      const cY = ty0 + Math.floor(dh / 2);
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.4)';
      ctx.lineWidth = 1.5 / cam.zoom;
      ctx.strokeRect((cX - r) * ts, (cY - r) * ts, (r * 2 + 1) * ts, (r * 2 + 1) * ts);
    }

    ctx.globalAlpha = 0.65;
    if (def.asset) {
      Game.Assets.drawTile(ctx, def.asset, def.emoji, px, py, hw, hh);
    } else {
      Game.Assets.drawTile(ctx, '', def.emoji, px, py, hw, hh);
    }
    ctx.globalAlpha = 1.0;
  }

  render(dt, now) {
    const ctx = this.ctx, cam = this.camera, ts = this.tileSize;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    ctx.save();
    ctx.scale(cam.zoom, cam.zoom);
    ctx.translate(-cam.x, -cam.y);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    this._updateViewport();

    const chunkPixelSize = this.CHUNK_TILES * ts;
    const minCx = Math.floor((cam.x) / chunkPixelSize);
    const maxCx = Math.floor((cam.x + window.innerWidth / cam.zoom) / chunkPixelSize);
    const minCy = Math.floor((cam.y) / chunkPixelSize);
    const maxCy = Math.floor((cam.y + window.innerHeight / cam.zoom) / chunkPixelSize);

    const maxChunkCx = Math.floor((this.world.width - 1) / this.CHUNK_TILES);
    const maxChunkCy = Math.floor((this.world.height - 1) / this.CHUNK_TILES);

    for (let cy = minCy; cy <= maxCy; cy++) {
      if (cy < 0 || cy > maxChunkCy) continue;
      for (let cx = minCx; cx <= maxCx; cx++) {
        if (cx < 0 || cx > maxChunkCx) continue;
        const chunk = this._getChunk(cx, cy);
        if (chunk.dirty) this._renderChunk(chunk);
        ctx.drawImage(
          chunk.canvas,
          0, 0, chunk.canvas.width, chunk.canvas.height,
          cx * chunkPixelSize, cy * chunkPixelSize, chunkPixelSize, chunkPixelSize
        );
      }
    }

    this.updateParticles(dt);

    // Grabsteine (über Terrain, unter Bewohnern)
    if (this.gravestones && this.gravestones.length > 0) {
      for (const g of this.gravestones) {
        if (!this._isVisible(g.x, g.y)) continue;
        const px = g.x * ts;
        const py = g.y * ts;
        const vSize = ts * 0.9;
        const offset = (ts - vSize) / 2;
        Game.Assets.drawTile(ctx, 'images/ghost.webp', '👻', px + offset, py + offset, vSize, vSize);
      }
    }

    // Mühlen-Animation
    for (const b of this.world.buildings.values()) {
      if (!b.built) continue;
      if (!b.def.animationFrames) continue;
      if (!this._isVisible(b.x, b.y)) continue;

      const px = b.x * ts;
      const py = b.y * ts;
      const bww = (b.w || 1) * ts;
      const bhh = (b.h || 1) * ts;

      let assetPath;
      if (b.isActive) {
        const interval = b.def.animationInterval || 350;
        const frameIndex = Math.floor(now / interval) % b.def.animationFrames.length;
        assetPath = b.def.animationFrames[frameIndex];
      } else {
        assetPath = b.def.asset;
      }

      Game.Assets.drawTile(ctx, assetPath, b.def.emoji, px, py, bww, bhh);
    }

    // Zombies
    if (this.zombieManager) {
      for (const z of this.zombieManager.zombies) {
        if (z.state === 'dead') continue;
        if (!this._isVisible(z.renderX, z.renderY)) continue;
        const px = z.renderX * ts, py = z.renderY * ts;
        const vSize = ts * 0.9;
        const offset = (ts - vSize) / 2;
        Game.Assets.drawTile(ctx, z.asset, '🧟', px + offset, py + offset, vSize, vSize);
      }
    }

    // Baustellen
    for (const b of this.world.buildSites) {
      if (!this._isVisible(b.x, b.y)) continue;
      const px = b.x * ts, py = b.y * ts;
      const bw = (b.w || 1) * ts, bh = (b.h || 1) * ts;

      if (b.progress <= 0) {
        ctx.fillStyle = '#6b3a1a';
        ctx.fillRect(px, py + bh - 4, bw, 4);
        continue;
      }

      let progress = 0;
      if (b.progress >= b.buildTime) {
        progress = 1.0;
        this.buildSmoothTimers.delete(b);
      } else {
        const current = this.buildSmoothTimers.get(b) || b.progress;
        const smooth = Math.min(b.buildTime, current + (dt / 1000));
        this.buildSmoothTimers.set(b, smooth);
        progress = smooth / b.buildTime;
      }
      if (progress <= 0.01) continue;

      const visibleHeight = bh * progress;
      const clipY = py + bh - visibleHeight;
      ctx.save();
      ctx.beginPath();
      ctx.rect(px, clipY, bw, visibleHeight);
      ctx.clip();
      Game.Assets.drawTile(ctx, b.def.asset, b.def.emoji, px, py, bw, bh);
      ctx.restore();
    }

    if (this.buildSmoothTimers.size > 0) {
      for (const [b] of this.buildSmoothTimers) {
        if (b.built || b.progress >= b.buildTime) this.buildSmoothTimers.delete(b);
      }
    }

    // Ressourcen-Icons
    for (const b of this.world.producingBuildings) {
      if (!b.built) continue;

      const emoji = this.resourceEmoji[b.def.produces];
      if (!emoji) continue;

      for (const field of b.fields) {
        if (field.state !== 'ready' && field.state !== 'growing') continue;
        if (!this._isVisible(field.x, field.y)) continue;

        const px = field.x * ts, py = field.y * ts;

        let progress = 0;
        if (field.state === 'ready') {
          progress = 1.0;
          this.smoothTimers.set(field, 0);
        } else {
          const current = this.smoothTimers.get(field) || field.timer;
          const smooth = Math.min(30, current + (dt / 1000));
          this.smoothTimers.set(field, smooth);
          progress = smooth / 30;
        }

        if (b.def.produces === 'grain') {
          const maxSize = ts * 0.8;
          const endSize = maxSize * 0.6;
          const currentSize = endSize * progress;
          if (currentSize <= 0.5) continue;

          const positions = [
            { x: px + ts * 0.25, y: py + ts * 0.25 },
            { x: px + ts * 0.75, y: py + ts * 0.25 },
            { x: px + ts * 0.25, y: py + ts * 0.75 },
            { x: px + ts * 0.75, y: py + ts * 0.75 }
          ];
          for (const pos of positions) {
            this._drawEmoji(ctx, emoji, pos.x - currentSize/2, pos.y - currentSize/2, currentSize);
          }
        }
        else if (b.def.produces === 'wood') {
          if (progress <= 0.01) continue;
          const maxSize = ts * 0.8;
          const currentSize = maxSize * progress;
          const bottomY = py + ts;
          const drawY = bottomY - currentSize;
          const drawX = px + (ts - currentSize) / 2;
          this._drawEmoji(ctx, emoji, drawX, drawY, currentSize);
        }
        else {
          if (field.state === 'ready') {
            const iconSize = ts * 0.8;
            const offset = (ts - iconSize) / 2;
            this._drawEmoji(ctx, emoji, px + offset, py + offset, iconSize);
          }
        }
      }
    }

    if (this.smoothTimers.size > 0) {
      for (const [field] of this.smoothTimers) {
        if (field.state === 'ready') this.smoothTimers.delete(field);
      }
    }

    // Bewohner
    if (this.vm) {
      for (const v of this.vm.villagers.values()) {
        if (v.hidden) continue;
        if (!this._isVisible(v.renderX, v.renderY)) continue;

        const px = v.renderX * ts, py = v.renderY * ts;
        const vSize = ts * 0.9;
        const offset = (ts - vSize) / 2;

        let isActuallyMoving = false;
        if (v.state === 'moving') {
          const dx = v.renderX - v.targetX;
          const dy = v.renderY - v.targetY;
          if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) isActuallyMoving = true;
        }

        ctx.save();

        if (isActuallyMoving) {
          const pivotX = px + ts / 2;
          const pivotY = py + ts;
          ctx.translate(pivotX, pivotY);
          const angle = Math.sin(now * 0.015) * 0.04;
          ctx.rotate(angle);
          ctx.translate(-pivotX, -pivotY);
        }

        const waterDepth = this._updateWaterDepth(v, dt);

        if (waterDepth > 0) {
          const shiftY = vSize * 0.5 * waterDepth;
          ctx.save();
          ctx.beginPath();
          ctx.rect(px + offset, py + offset + shiftY, vSize, vSize * 0.5);
          ctx.clip();
          Game.Assets.drawTile(ctx, v.asset, '👷', px + offset, py + offset + shiftY, vSize, vSize);
          ctx.restore();
        } else {
          Game.Assets.drawTile(ctx, v.asset, '👷', px + offset, py + offset, vSize, vSize);
        }

        let carryType = null;
        if (v.carrying) carryType = v.carrying.type;
        else if (v.recipeCarrying) {
          for (const k in v.recipeCarrying) { carryType = k; break; }
        }

        if (carryType && !v.isLogistics) {
          const emoji = this.resourceEmoji[carryType];
          if (emoji) {
            const iconSize = ts * 0.5;
            this._drawEmoji(ctx, emoji, px + ts/2 - iconSize/2, py - iconSize, iconSize);
          }
        }

        ctx.restore();
      }
    }

    // Partikel
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
    }
    ctx.globalAlpha = 1.0;

    if (this.pendingPlacement) {
      this._drawPlacementPreview(
        ctx,
        this.pendingPlacement.def,
        this.pendingPlacement.x,
        this.pendingPlacement.y,
        this.pendingPlacement.valid,
        ts, cam, now
      );
    }
    else if (this.hoverDef && this.hoverX >= 0 && this.hoverY >= 0) {
      this._drawPlacementPreview(
        ctx,
        this.hoverDef,
        this.hoverX,
        this.hoverY,
        this.hoverValid,
        ts, cam, now
      );
    }

    ctx.restore();
  }

  clampCamera() { this._clampCamera(); }

  _clampCamera() {
    const w = this.world;
    if (!w) return;
    const viewW = window.innerWidth / this.camera.zoom;
    const viewH = window.innerHeight / this.camera.zoom;
    const worldW = w.width * this.tileSize;
    const worldH = w.height * this.tileSize;
    const maxX = Math.max(0, worldW - viewW);
    const maxY = Math.max(0, worldH - viewH);
    this.camera.x = Math.max(0, Math.min(maxX, this.camera.x));
    this.camera.y = Math.max(0, Math.min(maxY, this.camera.y));
  }
};
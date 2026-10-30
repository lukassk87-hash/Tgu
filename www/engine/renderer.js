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
    this._terrainImagesReady = false;

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

  render(dt, now) {
    const ctx = this.ctx, cam = this.camera, ts = this.tileSize;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    if (!this._terrainImagesReady) {
      let allLoaded = true;
      for (const key in Game.TERRAIN_LAYERS) {
        const entry = Game.Assets._getImageEntry(Game.TERRAIN_LAYERS[key]);
        if (!entry || !entry.img) { allLoaded = false; break; }
      }
      if (allLoaded) {
        this._terrainImagesReady = true;
        for (const chunk of this.chunks.values()) chunk.dirty = true;
      }
    }

    ctx.save();
    ctx.scale(cam.zoom, cam.zoom);
    ctx.translate(-cam.x, -cam.y);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    this._updateViewport();

    const chunkPixelSize = this.CHUNK_TILES * ts;
    const minCx = Math.floor(cam.x / chunkPixelSize);
    const maxCx = Math.floor((cam.x + window.innerWidth / cam.zoom) / chunkPixelSize);
    const minCy = Math.floor(cam.y / chunkPixelSize);
    const maxCy = Math.floor((cam.y + window.innerHeight / cam.zoom) / chunkPixelSize);

    const maxChunkCx = Math.floor((this.world.width - 1) / this.CHUNK_TILES);
    const maxChunkCy = Math.floor((this.world.height - 1) / this.CHUNK_TILES);

    for (let cy = minCy; cy <= maxCy; cy++) {
      if (cy < 0 || cy > maxChunkCy) continue;
      for (let cx = minCx; cx <= maxCx; cx++) {
        if (cx < 0 || cx > maxChunkCx) continue;
        const chunk = this._getChunk(cx, cy);
        if (chunk.dirty || chunk.imagesMissing) this._renderChunk(chunk);
        
        const destX = Math.floor(cx * chunkPixelSize);
        const destY = Math.floor(cy * chunkPixelSize);
        
        ctx.drawImage(
          chunk.canvas,
          0, 0, chunk.canvas.width, chunk.canvas.height,
          destX, destY, chunkPixelSize + 1, chunkPixelSize + 1
        );
      }
    }

    this.updateParticles(dt);
    this._renderGravestones(ctx, ts);
    this._renderAnimatedBuildings(ctx, ts, now);
    this._renderZombies(ctx, ts);
    this._renderBuildSites(ctx, ts, dt);
    this._renderFields(ctx, ts, dt);
    this._renderVillagers(ctx, ts, dt, now);

    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
    }
    ctx.globalAlpha = 1.0;

    if (this.pendingPlacement) {
      this._drawPlacementPreview(
        ctx, this.pendingPlacement.def, this.pendingPlacement.x,
        this.pendingPlacement.y, this.pendingPlacement.valid, ts, cam, now
      );
    }
    else if (this.hoverDef && this.hoverX >= 0 && this.hoverY >= 0) {
      this._drawPlacementPreview(
        ctx, this.hoverDef, this.hoverX, this.hoverY, this.hoverValid, ts, cam, now
      );
    }

    ctx.restore();
  }

  clampCamera() { 
    this._clampCamera(); 
  }

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
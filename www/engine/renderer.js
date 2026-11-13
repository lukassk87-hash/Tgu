window.Game = window.Game || {};

Game.TERRAIN_LAYERS = {
  grass: 'images/gras.webp',
  water: 'images/wasser.webp'
};

Game.Renderer = class Renderer {
  constructor(canvas, world, vm) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false, powerPreference: 'high-performance' });
    this.world = world;
    this.vm = vm;
    this.zombieManager = null;
    this.raiderVillage = null;
    this.dragonManager = null;
    this.gravestones = [];

    this.camera = { x: 0, y: 0, zoom: 1 };
    this.tileSize = 32;
    this.staticScale = 2;
    this.CHUNK_TILES = 16;
    this.chunks = new Map();
    this.buildingChunks = new Map();
    this.obstacleChunks = new Map();
    this._frameCounter = 0;

    this.MAX_DPR = 2;
    this.FAR_ZOOM_THRESHOLD = 0.5;

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
    this.arrows = [];
    this.MAX_PARTICLES = 100;
    this.smoothTimers = new Map();
    this.buildSmoothTimers = new Map();
    this.selectedBuildingId = null;

    this._borderTilesCache = null;
    this._grassTileCanvas = null;
    this._grassTilePx = 0;
    this._globalGrassDirty = true;
    this._terrainImagesReady = false;

    this._view = { minX: 0, minY: 0, maxX: 0, maxY: 0 };

    // === Follow-Kamera ===
    this.followTarget = null;

    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  _resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, this.MAX_DPR);
    this.canvas.width = Math.floor(window.innerWidth * dpr);
    this.canvas.height = Math.floor(window.innerHeight * dpr);
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'low';
    this.dpr = dpr;
    this.clampCamera();
  }

  // ==========================================================
  // Follow-Kamera
  // ==========================================================
  followEntity(entity) {
    if (!entity) {
      this.followTarget = null;
      return;
    }
    this.followTarget = entity;
  }

  stopFollow() {
    this.followTarget = null;
  }

  _updateFollowCamera() {
    const t = this.followTarget;
    if (!t) return;

    let alive = true;
    if (this.vm && t.id !== undefined && this.vm.villagers && this.vm.villagers.has(t.id)) {
      alive = true;
    } else if (t.state === 'dead') {
      alive = false;
    } else if (this.vm && this.vm.villagers && !this.vm.villagers.has(t.id) && t.job !== undefined) {
      alive = false;
    }

    if (!alive) {
      this.followTarget = null;
      return;
    }

    const tx = t.renderX !== undefined ? t.renderX : t.x;
    const ty = t.renderY !== undefined ? t.renderY : t.y;
    if (tx === undefined || ty === undefined) {
      this.followTarget = null;
      return;
    }

    const ts = this.tileSize;
    const cam = this.camera;
    const targetCamX = tx * ts - (window.innerWidth / cam.zoom) / 2;
    const targetCamY = ty * ts - (window.innerHeight / cam.zoom) / 2;

    const lerp = 0.15;
    cam.x += (targetCamX - cam.x) * lerp;
    cam.y += (targetCamY - cam.y) * lerp;

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

  isFarZoom() {
    return this.camera.zoom <= this.FAR_ZOOM_THRESHOLD;
  }

  _isBehindObject(entity) {
    const ex = entity.renderX !== undefined ? entity.renderX : entity.x;
    const ey = entity.renderY !== undefined ? entity.renderY : entity.y;
    if (ex === undefined || ey === undefined) return false;

    // 1) Bäume (ausgewachsen UND wachsend): IMMER behind
    for (const tree of this.world.trees.values()) {
      if (!this._isVisible(tree.x, tree.y)) continue;
      if (ex + 0.5 < tree.x) continue;
      if (ex + 0.5 > tree.x + 2) continue;
      if (ey + 0.5 < tree.y) continue;
      if (ey + 0.5 > tree.y + 2) continue;
      return true;
    }

    // 2) Gebäude + Steine: nächstes nach Distanz
    let bestId = null;
    let bestDistSq = Infinity;
    let bestCenterY = 0;

    for (const b of this.world.buildings.values()) {
      if (!b.built || b.ruined) continue;
      if (!this._isVisible(b.x, b.y)) continue;
      const bw = b.w || 1;
      const bh = b.h || 1;
      if (ex + 0.5 < b.x) continue;
      if (ex + 0.5 > b.x + bw) continue;
      const bx = b.x + bw / 2;
      const by = b.y + bh / 2;
      const dx = ex - bx;
      const dy = ey - by;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestDistSq) {
        bestDistSq = d2;
        bestId = 'b_' + b.id;
        bestCenterY = by;
      }
    }

    for (const stone of this.world.stones.values()) {
      if (stone.capacity <= 0) continue;
      if (!this._isVisible(stone.cx, stone.cy)) continue;
      if (ex + 0.5 < stone.cx - 1) continue;
      if (ex + 0.5 > stone.cx + 1) continue;
      const dx = ex - stone.cx;
      const dy = ey - stone.cy;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestDistSq) {
        bestDistSq = d2;
        bestId = 's_' + stone.cx + '_' + stone.cy;
        bestCenterY = stone.cy;
      }
    }

    if (bestId === null) {
      entity._sortObjectId = null;
      entity._sortBehind = false;
      return false;
    }

    if (entity._sortObjectId === bestId) {
      return entity._sortBehind;
    }

    const isBehind = ey < bestCenterY;

    entity._sortObjectId = bestId;
    entity._sortBehind = isBehind;

    return isBehind;
  }

  render(dt, now) {
    const ctx = this.ctx, cam = this.camera, ts = this.tileSize;
    ctx.fillStyle = '#2a4a1a';
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    this._frameCounter++;

    // Follow-Kamera vor dem Rendern aktualisieren
    this._updateFollowCamera();

    if (!this._terrainImagesReady) {
      let allLoaded = true;
      for (const key in Game.TERRAIN_LAYERS) {
        const entry = Game.Assets._getImageEntry(Game.TERRAIN_LAYERS[key]);
        if (!entry || !entry.img) { allLoaded = false; break; }
      }
      if (allLoaded) {
        this._terrainImagesReady = true;
        for (const chunk of this.chunks.values()) chunk.dirty = true;
        for (const chunk of this.buildingChunks.values()) chunk.dirty = true;
        for (const chunk of this.obstacleChunks.values()) chunk.dirty = true;
      }
    }

    ctx.save();
    ctx.scale(cam.zoom, cam.zoom);
    ctx.translate(-cam.x, -cam.y);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'low';

    this._updateViewport();

    const chunkPixelSize = this.CHUNK_TILES * ts;
    const minCx = Math.floor(cam.x / chunkPixelSize);
    const maxCx = Math.floor((cam.x + window.innerWidth / cam.zoom) / chunkPixelSize);
    const minCy = Math.floor(cam.y / chunkPixelSize);
    const maxCy = Math.floor((cam.y + window.innerHeight / cam.zoom) / chunkPixelSize);

    const maxChunkCx = Math.floor((this.world.width - 1) / this.CHUNK_TILES);
    const maxChunkCy = Math.floor((this.world.height - 1) / this.CHUNK_TILES);

    let groundDirtyBudget = 2;

    // ============================================================
    // 1) Boden-Chunks blitten
    // ============================================================
    for (let cy = minCy; cy <= maxCy; cy++) {
      if (cy < 0 || cy > maxChunkCy) continue;
      for (let cx = minCx; cx <= maxCx; cx++) {
        if (cx < 0 || cx > maxChunkCx) continue;
        const chunk = this._getChunk(cx, cy, 'ground');

        if ((chunk.dirty || chunk.imagesMissing) && groundDirtyBudget > 0) {
          this._renderChunk(chunk, 'ground');
          groundDirtyBudget--;
        }

        const destX = Math.floor(cx * chunkPixelSize);
        const destY = Math.floor(cy * chunkPixelSize);

        ctx.drawImage(
          chunk.canvas,
          0, 0, chunk.canvas.width, chunk.canvas.height,
          destX, destY, chunkPixelSize + 1, chunkPixelSize + 1
        );
      }
    }

    this._evictChunks();

    // ============================================================
    // 2) Statisches Zeug das jeden Frame gezeichnet wird
    // ============================================================
    this.updateParticles(dt);
    this.updateArrows(now);

    this._renderDecorations(ctx, ts);
    this._renderGrowingTrees(ctx, ts, now);
    this._renderGravestones(ctx, ts);
    this._renderFish(ctx, ts, now);

    // ---- PHASE A: Felder (immer unter Entitäten) ----
    this._renderFields(ctx, ts, dt);

    // ---- PHASE A: Entitäten, die hinter Gebäuden/Steinen/Bäumen stehen ----
    this._renderVillagers(ctx, ts, dt, now, 'behind');
    this._renderPanicVillagers(ctx, ts, now, 'behind');
    this._renderZombies(ctx, ts, dt, 'behind');
    this._renderRaiders(ctx, ts, dt, now, 'behind');
    if (this.dragonManager) {
      this._renderDeadDragons(ctx, ts, now, 'behind');
      
      let hasGroundedDragons = false;
      if (this.dragonManager.dragons) {
        for (const d of this.dragonManager.dragons) {
          if (d.state === 'grounded') { hasGroundedDragons = true; break; }
        }
      }
      if (hasGroundedDragons) {
        this._renderDragon(ctx, ts, dt, now, 'behind');
      }
    }

    // ============================================================
    // 3) Gebäude-Chunks blitten (KEIN Dirty-Budget!)
    // ============================================================
    for (let cy = minCy; cy <= maxCy; cy++) {
      if (cy < 0 || cy > maxChunkCy) continue;
      for (let cx = minCx; cx <= maxCx; cx++) {
        if (cx < 0 || cx > maxChunkCx) continue;
        const chunk = this._getChunk(cx, cy, 'building');

        if (chunk.dirty || chunk.imagesMissing) {
          this._renderChunk(chunk, 'building');
        }

        const destX = Math.floor(cx * chunkPixelSize);
        const destY = Math.floor(cy * chunkPixelSize);

        ctx.drawImage(
          chunk.canvas,
          0, 0, chunk.canvas.width, chunk.canvas.height,
          destX, destY, chunkPixelSize + 1, chunkPixelSize + 1
        );
      }
    }

    // ============================================================
    // 4) Hindernis-Chunks (Bäume + Steine) blitten (KEIN Dirty-Budget!)
    // ============================================================
    for (let cy = minCy; cy <= maxCy; cy++) {
      if (cy < 0 || cy > maxChunkCy) continue;
      for (let cx = minCx; cx <= maxCx; cx++) {
        if (cx < 0 || cx > maxChunkCx) continue;
        const chunk = this._getChunk(cx, cy, 'obstacle');

        if (chunk.dirty || chunk.imagesMissing) {
          this._renderChunk(chunk, 'obstacle');
        }

        const destX = Math.floor(cx * chunkPixelSize);
        const destY = Math.floor(cy * chunkPixelSize);

        ctx.drawImage(
          chunk.canvas,
          0, 0, chunk.canvas.width, chunk.canvas.height,
          destX, destY, chunkPixelSize + 1, chunkPixelSize + 1
        );
      }
    }

    // ---- PHASE B: Entitäten, die vor Gebäuden/Steinen stehen ----
    this._renderAnimatedBuildings(ctx, ts, now);
    this._renderBuildSites(ctx, ts, dt);

    // Ruinen-Explosionen (Erdbeben)
    this._renderRuinExplosions(ctx, ts, now);

    this._renderVillagers(ctx, ts, dt, now, 'front');
    this._renderPanicVillagers(ctx, ts, now, 'front');
    this._renderZombies(ctx, ts, dt, 'front');
    this._renderRaiders(ctx, ts, dt, now, 'front');

    if (this.dragonManager) {
      this._renderDeadDragons(ctx, ts, now, 'front');
      
      if (this.dragonManager.dragons && this.dragonManager.dragons.length > 0) {
        let hasGrounded = false;
        for (const d of this.dragonManager.dragons) {
          if (d.state === 'grounded') hasGrounded = true;
        }
        
        if (hasGrounded) {
          this._renderDragon(ctx, ts, dt, now, 'front');
        }
      }
    }

    // ============================================================
    // 5) FEUER-ANIMATIONEN (unter den fliegenden Drachen)
    // ============================================================
    this._renderFireAnimations(ctx, ts, now);

    // ============================================================
    // 5b) FLIEGENDE DRACHEN (über Feuer, Bäumen, allem)
    // ============================================================
    if (this.dragonManager && this.dragonManager.dragons && this.dragonManager.dragons.length > 0) {
      let hasFlying = false;
      for (const d of this.dragonManager.dragons) {
        if (d.state !== 'grounded') { hasFlying = true; break; }
      }
      if (hasFlying) {
        this._renderDragon(ctx, ts, dt, now, null);
      }
    }

    // ============================================================
    // 6) Partikel, Pfeile, Feuerbälle
    // ============================================================
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1.0;

    this._renderArrows(ctx, now);

    if (this.dragonManager) {
      this._renderFireballs(ctx, ts, now);
    }

    // ============================================================
    // 7) Placement-Preview
    // ============================================================
    const game = window.Game && window.Game.state;
    const isBuildMode = game && (
      (game.hud && game.hud.activeBuild) || 
      game.state === 'placingCastle'
    );

    if (this.pendingPlacement) {
      this._drawPlacementPreview(
        ctx, this.pendingPlacement.def, this.pendingPlacement.x,
        this.pendingPlacement.y, this.pendingPlacement.valid, ts, cam, now
      );
    } else if (this.hoverDef && this.hoverX >= 0 && this.hoverY >= 0 && isBuildMode) {
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
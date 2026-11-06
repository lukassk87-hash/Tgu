window.Game = window.Game || {};

Game.Input = class Input {
  constructor(canvas, camera, getTileSize) {
    this.canvas = canvas;
    this.camera = camera;
    this.getTileSize = getTileSize;
    this.onClickTile = null;
    this.onClamp = null;
    
    this.onLongPress = null;
    this.onDragMove = null;
    this.onDragEnd = null;
    
    this.LONG_PRESS_MS = 300;
    this.longPressTimer = null;
    this.isDraggingPreview = false;
    this.longPressStartTile = null;

    this.mode = 'none'; 
    this.tapStart = { x: 0, y: 0 };
    this.panStart = { x: 0, y: 0, camX: 0, camY: 0 };

    this.pinchStartDist = 0;
    this.pinchStartZoom = 1;
    this.pinchAnchorWorldX = 0;
    this.pinchAnchorWorldY = 0;
    this.pinchStartMid = { x: 0, y: 0 };

    window.addEventListener('touchstart',  (e) => this._onStart(e),  { passive: false });
    window.addEventListener('touchmove',   (e) => this._onMove(e),   { passive: false });
    window.addEventListener('touchend',    (e) => this._onEnd(e),    { passive: false });
    window.addEventListener('touchcancel', (e) => this._onEnd(e),    { passive: false });
  }

  _isUI(target) {
    if (!target || !target.closest) return false;
    if (target.closest('button')) return true;
    if (target.closest('.overlay')) return true;
    if (target.closest('.panel')) return true;
    if (target.closest('.build-modal')) return true;
    if (target.closest('#buildWindow')) return true;
    if (target.closest('.build-grid')) return true;
    if (target.closest('.info-panel')) return true;
    if (target.closest('#infoPanel')) return true;
    if (target.closest('.info-content')) return true;
    return false;
  }

  _screenToWorld(sx, sy) {
    const rect = this.canvas.getBoundingClientRect();
    const screenX = sx - rect.left;
    const screenY = sy - rect.top;
    return {
      x: (screenX / this.camera.zoom) + this.camera.x,
      y: (screenY / this.camera.zoom) + this.camera.y
    };
  }

  _screenToTile(sx, sy) {
    const w = this._screenToWorld(sx, sy);
    const ts = this.getTileSize();
    return { x: Math.floor(w.x / ts), y: Math.floor(w.y / ts) };
  }

  _midpoint(t1, t2) {
    return {
      x: (t1.clientX + t2.clientX) / 2,
      y: (t1.clientY + t2.clientY) / 2
    };
  }

  _dist(t1, t2) {
    return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
  }

  _clearLongPressTimer() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  _onStart(e) {
    if (this._isUI(e.target)) return;
    e.preventDefault();

    this._clearLongPressTimer();
    this.isDraggingPreview = false;

    if (e.touches.length === 1) {
      const t = e.touches[0];
      this.mode = 'tap';
      this.tapStart = { x: t.clientX, y: t.clientY };
      this.panStart = {
        x: t.clientX, y: t.clientY,
        camX: this.camera.x, camY: this.camera.y
      };
      
      const tile = this._screenToTile(t.clientX, t.clientY);
      this.longPressStartTile = tile;
      
      this.longPressTimer = setTimeout(() => {
        if (this.mode === 'tap' && !this.isDraggingPreview) {
          if (this.onLongPress) {
            const fired = this.onLongPress(tile.x, tile.y);
            if (fired) {
              this.isDraggingPreview = true;
              this.mode = 'drag-preview';
            }
          }
        }
      }, this.LONG_PRESS_MS);

    } else if (e.touches.length === 2) {
      const t1 = e.touches[0], t2 = e.touches[1];
      this.mode = 'pinch';
      this.pinchStartDist = this._dist(t1, t2);
      this.pinchStartZoom = this.camera.zoom;
      this.pinchStartMid = this._midpoint(t1, t2);

      const world = this._screenToWorld(this.pinchStartMid.x, this.pinchStartMid.y);
      this.pinchAnchorWorldX = world.x;
      this.pinchAnchorWorldY = world.y;
    }
  }

  _onMove(e) {
    if (this._isUI(e.target)) return;
    e.preventDefault();

    if (this.mode === 'drag-preview' && e.touches.length === 1) {
      const t = e.touches[0];
      const tile = this._screenToTile(t.clientX, t.clientY);
      if (this.onDragMove) this.onDragMove(tile.x, tile.y);
      return;
    }

    if (this.mode === 'tap' && e.touches.length === 1) {
      const t = e.touches[0];
      const dx = t.clientX - this.tapStart.x;
      const dy = t.clientY - this.tapStart.y;
      if (Math.hypot(dx, dy) > 12) {
        this._clearLongPressTimer();
        this.mode = 'pan';
      }
    }

    if (this.mode === 'pinch' && e.touches.length === 2) {
      const t1 = e.touches[0], t2 = e.touches[1];
      const dist = this._dist(t1, t2);
      if (this.pinchStartDist < 1) return;

      const factor = dist / this.pinchStartDist;
      
      // ⚠️ Detailzoom gesperrt: Maximaler Zoom auf 1.5 begrenzt (vorher 4.0)
      const newZoom = Math.max(0.35, Math.min(1.5, this.pinchStartZoom * factor));

      const mid = this._midpoint(t1, t2);
      const rect = this.canvas.getBoundingClientRect();
      const midX = mid.x - rect.left;
      const midY = mid.y - rect.top;

      this.camera.zoom = newZoom;
      this.camera.x = this.pinchAnchorWorldX - (midX / newZoom);
      this.camera.y = this.pinchAnchorWorldY - (midY / newZoom);

      if (this.onClamp) this.onClamp();

    } else if (this.mode === 'tap' && e.touches.length === 1) {
      const t = e.touches[0];
      const dx = t.clientX - this.tapStart.x;
      const dy = t.clientY - this.tapStart.y;

      if (this.mode === 'pan') {
        this.camera.x = this.panStart.camX - (dx / this.camera.zoom);
        this.camera.y = this.panStart.camY - (dy / this.camera.zoom);
        if (this.onClamp) this.onClamp();
      }

    } else if (this.mode === 'pan' && e.touches.length === 1) {
      const t = e.touches[0];
      const dx = t.clientX - this.panStart.x;
      const dy = t.clientY - this.panStart.y;
      this.camera.x = this.panStart.camX - (dx / this.camera.zoom);
      this.camera.y = this.panStart.camY - (dy / this.camera.zoom);
      if (this.onClamp) this.onClamp();
    }
  }

  _onEnd(e) {
    if (this._isUI(e.target)) {
      this._clearLongPressTimer();
      return;
    }

    if (this.mode === 'drag-preview') {
      if (e.changedTouches.length >= 1) {
        const t = e.changedTouches[0];
        const tile = this._screenToTile(t.clientX, t.clientY);
        if (this.onDragEnd) this.onDragEnd(tile.x, tile.y);
      }
      this.isDraggingPreview = false;
      this.mode = 'none';
      this._clearLongPressTimer();
      return;
    }

    this._clearLongPressTimer();

    if (this.mode === 'tap' && e.changedTouches.length >= 1) {
      const t = e.changedTouches[0];
      if (this.onClickTile) {
        const tile = this._screenToTile(t.clientX, t.clientY);
        this.onClickTile(tile.x, tile.y);
      }
    }

    if (e.touches.length === 0) {
      this.mode = 'none';
      this.pinchStartDist = 0;
    } else if (e.touches.length === 1 && this.mode === 'pinch') {
      this.mode = 'pan-hold';
    }
  }
};
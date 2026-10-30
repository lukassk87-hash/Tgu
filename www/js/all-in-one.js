// ============ DEBUG-KONSOLE ============
window.Game = window.Game || {};
(function setupDebug() {
  const box = document.createElement('div');
  box.style.cssText = `
    position: fixed; bottom: 0; left: 0; right: 0; max-height: 45vh;
    overflow-y: auto; background: rgba(0,0,0,.92); color: #0f0;
    font: 11px monospace; padding: 8px; z-index: 9999;
    border-top: 2px solid #0f0;
  `;
  document.body.appendChild(box);
  window.__dlog = (msg, color) => {
    const line = document.createElement('div');
    line.textContent = msg;
    if (color) line.style.color = color;
    box.appendChild(line);
    box.scrollTop = box.scrollHeight;
    console.log(msg);
  };
  window.addEventListener('error', (e) => {
    __dlog('❌ ' + e.message + ' @ ' + (e.filename || '?') + ':' + e.lineno, '#f66');
  });
})();

__dlog('=== ALL-IN-ONE GELADEN ===', '#0ff');

// ============ TICKER ============
Game.Ticker = class Ticker {
  constructor(hz = 1) {
    this.interval = 1000 / hz;
    this.acc = 0;
    this.tick = 0;
    this._handlers = [];
  }
  onTick(fn) { this._handlers.push(fn); }
  update(dtMs) {
    this.acc += dtMs;
    while (this.acc >= this.interval) {
      this.acc -= this.interval;
      this.tick++;
      for (const fn of this._handlers) fn(this.tick);
    }
  }
};
__dlog('✅ Ticker');

// ============ TERRAINS ============
Game.TERRAINS = {
  grass:    { id: 'grass',    name: 'Gras',   color: '#3f7d3f', emoji: '🟩', asset: 'assets/tiles/grass.jpg',    buildable: true,  resource: null },
  forest:   { id: 'forest',   name: 'Wald',   color: '#1e4d1e', emoji: '🌲', asset: 'assets/tiles/forest.jpg',   buildable: false, resource: 'wood' },
  mountain: { id: 'mountain', name: 'Berg',   color: '#6b6b6b', emoji: '⛰️', asset: 'assets/tiles/mountain.jpg', buildable: false, resource: 'stone' },
  water:    { id: 'water',    name: 'Wasser', color: '#2a5c9a', emoji: '💧', asset: 'assets/tiles/water.jpg',    buildable: false, resource: 'fish' },
};
__dlog('✅ TERRAINS');

// ============ ASSETS ============
(function () {
  const cache = new Map();
  function loadImage(path) {
    if (cache.has(path)) return cache.get(path);
    const p = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = path;
    });
    cache.set(path, p);
    return p;
  }
  function drawEmoji(ctx, emoji, x, y, size) {
    ctx.font = Math.floor(size * 0.7) + 'px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, x + size / 2, y + size / 2);
  }
  function drawTile(ctx, path, emoji, x, y, size) {
    const cached = cache.get(path);
    if (cached && cached.__img) {
      ctx.drawImage(cached.__img, x, y, size, size);
    } else if (cached && cached.__pending) {
      drawEmoji(ctx, emoji, x, y, size);
    } else {
      loadImage(path).then((img) => {
        if (img) { cached.__img = img; cached.__pending = false; }
      });
      cached.__pending = true;
      drawEmoji(ctx, emoji, x, y, size);
    }
  }
  Game.Assets = { loadImage, drawTile };
})();
__dlog('✅ Assets');

// ============ MAPGEN ============
(function () {
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function generateMap(width, height, seed) {
    const rng = mulberry32(seed >>> 0);
    const grid = new Array(width * height).fill('grass');
    function blob(type, count, sizeMin, sizeMax) {
      for (let n = 0; n < count; n++) {
        let cx = Math.floor(rng() * width);
        let cy = Math.floor(rng() * height);
        const size = Math.floor(sizeMin + rng() * (sizeMax - sizeMin));
        for (let k = 0; k < size; k++) {
          if (cx >= 0 && cx < width && cy >= 0 && cy < height) {
            grid[cy * width + cx] = type;
          }
          const dir = Math.floor(rng() * 4);
          if (dir === 0) cx++;
          else if (dir === 1) cx--;
          else if (dir === 2) cy++;
          else cy--;
        }
      }
    }
    const area = width * height;
    blob('forest', Math.floor(area / 400), 12, 40);
    blob('mountain', Math.floor(area / 700), 8, 25);
    blob('water', Math.floor(area / 900), 10, 30);
    return { width, height, grid };
  }
  Game.generateMap = generateMap;
})();
__dlog('✅ generateMap');

// ============ WORLD ============
Game.World = class World {
  constructor(width, height, grid) {
    this.width = width;
    this.height = height;
    this.grid = grid;
    this.buildings = new Map();
    this.nextBuildingId = 1;
    this.castleId = null;
  }
  inBounds(x, y) { return x >= 0 && y >= 0 && x < this.width && y < this.height; }
  getTerrainId(x, y) { return this.inBounds(x, y) ? this.grid[y * this.width + x] : null; }
  getTerrain(x, y) { const id = this.getTerrainId(x, y); return id ? Game.TERRAINS[id] : null; }
  neighbors8(x, y) {
    const out = [];
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        if (this.inBounds(x + dx, y + dy)) out.push({ x: x + dx, y: y + dy });
      }
    return out;
  }
  addBuilding(def, x, y) {
    const b = { id: this.nextBuildingId++, def, x, y, workers: [], residents: [], progress: 0, built: false };
    this.buildings.set(b.id, b);
    if (def.id === 'castle') this.castleId = b.id;
    return b;
  }
};
__dlog('✅ World');

// ============ RENDERER ============
Game.Renderer = class Renderer {
  constructor(canvas, world) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.world = world;
    this.camera = { x: 0, y: 0, zoom: 1 };
    this.tileSize = 32;
    this.staticCanvas = document.createElement('canvas');
    this.staticCtx = this.staticCanvas.getContext('2d');
    this.staticDirty = true;
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
    this._clampCamera();
  }
  markStaticDirty() { this.staticDirty = true; }
  _rebuildStatic() {
    const w = this.world, ts = this.tileSize;
    this.staticCanvas.width = w.width * ts;
    this.staticCanvas.height = w.height * ts;
    const ctx = this.staticCtx;
    for (let y = 0; y < w.height; y++) {
      for (let x = 0; x < w.width; x++) {
        const t = w.getTerrain(x, y);
        const px = x * ts, py = y * ts;
        ctx.fillStyle = t.color;
        ctx.fillRect(px, py, ts, ts);
        Game.Assets.drawTile(ctx, t.asset, t.emoji, px, py, ts);
      }
    }
    for (const b of w.buildings.values()) {
      Game.Assets.drawTile(ctx, b.def.asset, b.def.emoji, b.x * ts, b.y * ts, ts);
    }
    this.staticDirty = false;
  }
  render() {
    const ctx = this.ctx, cam = this.camera, ts = this.tileSize;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.save();
    ctx.scale(cam.zoom, cam.zoom);
    ctx.translate(-cam.x, -cam.y);
    if (this.staticDirty) this._rebuildStatic();
    ctx.drawImage(this.staticCanvas, 0, 0);
    for (const b of this.world.buildings.values()) {
      if (b.def.id === 'castle') {
        ctx.strokeStyle = '#ffcc00';
        ctx.lineWidth = 2 / cam.zoom;
        ctx.beginPath();
        ctx.arc(b.x * ts + ts / 2, b.y * ts + ts / 2, ts * 0.45, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
  clampCamera() { this._clampCamera(); }
  _clampCamera() {
    const w = this.world;
    if (!w) return;
    const ts = this.tileSize * this.camera.zoom;
    const maxX = Math.max(0, w.width * ts - window.innerWidth);
    const maxY = Math.max(0, w.height * ts - window.innerHeight);
    this.camera.x = Math.max(0, Math.min(maxX, this.camera.x));
    this.camera.y = Math.max(0, Math.min(maxY, this.camera.y));
  }
};
__dlog('✅ Renderer');

// ============ INPUT ============
Game.Input = class Input {
  constructor(canvas, camera, getTileSize) {
    this.canvas = canvas;
    this.camera = camera;
    this.getTileSize = getTileSize;
    this.dragging = false;
    this.dragStart = { x: 0, y: 0, camX: 0, camY: 0 };
    this.onClickTile = null;
    this.onClamp = null;
    canvas.addEventListener('mousedown', (e) => this._down(e));
    window.addEventListener('mousemove', (e) => this._move(e));
    window.addEventListener('mouseup', (e) => this._up(e));
    canvas.addEventListener('wheel', (e) => this._wheel(e), { passive: false });
    canvas.addEventListener('touchstart', (e) => this._downTouch(e), { passive: false });
    canvas.addEventListener('touchmove', (e) => this._moveTouch(e), { passive: false });
    canvas.addEventListener('touchend', (e) => this._upTouch(e));
  }
  _down(e) {
    if (e.button !== 0) return;
    this.dragging = false;
    this.dragStart = { x: e.clientX, y: e.clientY, camX: this.camera.x, camY: this.camera.y };
    this._pressed = true;
  }
  _move(e) {
    if (!this._pressed) return;
    const dx = e.clientX - this.dragStart.x;
    const dy = e.clientY - this.dragStart.y;
    if (!this.dragging && Math.hypot(dx, dy) > 5) {
      this.dragging = true;
      this.canvas.classList.add('dragging');
    }
    if (this.dragging) {
      this.camera.x = this.dragStart.camX - dx;
      this.camera.y = this.dragStart.camY - dy;
      if (this.onClamp) this.onClamp();
    }
  }
  _up(e) {
    if (!this._pressed) return;
    this._pressed = false;
    this.canvas.classList.remove('dragging');
    if (!this.dragging && this.onClickTile) {
      const tile = this._screenToTile(e.clientX, e.clientY);
      if (tile) this.onClickTile(tile.x, tile.y);
    }
  }
  _wheel(e) {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    const old = this.camera.zoom;
    const next = Math.max(0.35, Math.min(3, old * factor));
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const wx = (mx + this.camera.x) / old;
    const wy = (my + this.camera.y) / old;
    this.camera.zoom = next;
    this.camera.x = wx * next - mx;
    this.camera.y = wy * next - my;
    if (this.onClamp) this.onClamp();
  }
  _screenToTile(sx, sy) {
    const rect = this.canvas.getBoundingClientRect();
    const px = (sx - rect.left + this.camera.x) / this.camera.zoom;
    const py = (sy - rect.top + this.camera.y) / this.camera.zoom;
    const ts = this.getTileSize();
    return { x: Math.floor(px / ts), y: Math.floor(py / ts) };
  }
  _downTouch(e) {
    if (e.touches.length !== 1) return;
    e.preventDefault();
    const t = e.touches[0];
    this._down({ button: 0, clientX: t.clientX, clientY: t.clientY });
  }
  _moveTouch(e) {
    if (e.touches.length !== 1) return;
    e.preventDefault();
    const t = e.touches[0];
    this._move({ clientX: t.clientX, clientY: t.clientY });
  }
  _upTouch(e) {
    if (e.changedTouches.length !== 1) return;
    const t = e.changedTouches[0];
    this._up({ clientX: t.clientX, clientY: t.clientY });
  }
};
__dlog('✅ Input');

// ============ MAIN ============
window.addEventListener('DOMContentLoaded', () => {
  __dlog('DOM ready — starte Game');

  const canvas = document.getElementById('game');
  const menu = document.getElementById('menu');
  const placeHint = document.getElementById('placeHint');
  const startBtn = document.getElementById('startBtn');

  if (!startBtn || !canvas) {
    __dlog('❌ HTML-Elemente fehlen!', '#f66');
    return;
  }

  const game = { state: 'menu' };
  let ticker, renderer, input, world;

  startBtn.addEventListener('click', () => {
    __dlog('▶️ Start');
    const size = parseInt(document.getElementById('mapSize').value, 10);
    const seedStr = document.getElementById('seed').value.trim();
    const seed = seedStr ? hashString(seedStr) : (Math.random() * 0xffffffff) >>> 0;
    menu.classList.add('hidden');

    try {
      const data = Game.generateMap(size, size, seed);
      __dlog('Karte: ' + data.grid.length + ' Felder');
      world = new Game.World(data.width, data.height, data.grid);
      renderer = new Game.Renderer(canvas, world);
      __dlog('Canvas: ' + canvas.width + 'x' + canvas.height);
      renderer.camera.x = (data.width * renderer.tileSize) / 2 - window.innerWidth / 2;
      renderer.camera.y = (data.height * renderer.tileSize) / 2 - window.innerHeight / 2;
      renderer.clampCamera();
      ticker = new Game.Ticker(1);
      input = new Game.Input(canvas, renderer.camera, () => renderer.tileSize);
      input.onClamp = () => renderer.clampCamera();
      input.onClickTile = handleTileClick;
      game.state = 'placingCastle';
      placeHint.classList.remove('hidden');
      canvas.classList.add('placing');

      let last = performance.now(), frame = 0;
      function loop(now) {
        const dt = now - last; last = now;
        ticker.update(dt);
        renderer.render();
        frame++;
        if (frame === 1) __dlog('✅ Erster Frame!', '#0f0');
        requestAnimationFrame(loop);
      }
      requestAnimationFrame(loop);
    } catch (err) {
      __dlog('❌ ' + err.message, '#f66');
      __dlog(err.stack, '#f66');
    }
  });

  function handleTileClick(x, y) {
    if (!world.inBounds(x, y)) return;
    if (game.state === 'placingCastle') {
      const terr = world.getTerrain(x, y);
      if (!terr || !terr.buildable) {
        __dlog('Kein Bauplatz: ' + (terr ? terr.name : '?'), '#fa0');
        return;
      }
      const b = world.addBuilding({ id: 'castle', emoji: '🏰', asset: 'assets/buildings/castle.jpg' }, x, y);
      b.built = true;
      renderer.markStaticDirty();
      game.state = 'playing';
      placeHint.classList.add('hidden');
      canvas.classList.remove('placing');
      document.getElementById('hud').classList.remove('hidden');
      __dlog('✅ Schloss ' + x + ',' + y, '#0f0');
      return;
    }
    __dlog('Klick ' + x + ',' + y + ' → ' + world.getTerrainId(x, y));
  }
});

function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h >>> 0;
}
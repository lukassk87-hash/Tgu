window.Game = window.Game || {};

(function () {
  const cache = new Map();

  function loadImage(path) {
    if (cache.has(path)) return cache.get(path).promise;
    const entry = { img: null, pending: true, promise: null };
    entry.promise = new Promise((resolve) => {
      const img = new Image();
      img.onload  = () => { entry.img = img; entry.pending = false; resolve(img); };
      img.onerror = () => { 
        entry.pending = false; 
        if (window.__dlog) window.__dlog('❌ BILD FEHLT: ' + path, '#f66');
        resolve(null); 
      };
      img.src = path;
    });
    cache.set(path, entry);
    return entry.promise;
  }

  function drawEmoji(ctx, emoji, x, y, w, h) {
    ctx.font = Math.floor(Math.min(w, h) * 0.7) + 'px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, x + w / 2, y + h / 2);
  }

  function drawTile(ctx, path, emoji, x, y, w, h) {
    if (h === undefined) h = w;
    
    if (!path) {
      drawEmoji(ctx, emoji, x, y, w, h);
      return;
    }
    const entry = cache.get(path);
    
    if (entry && entry.img) {
      ctx.drawImage(entry.img, x, y, w, h);
      return;
    }
    
    drawEmoji(ctx, emoji, x, y, w, h);
    if (!entry) loadImage(path);
  }

  // NEU: Cache öffentlich zugänglich machen, damit der Renderer
  // geladene Bilder direkt abfragen kann (für Terrain-Patterns).
  Game.Assets = { loadImage, drawTile };
  Game.Assets._cache = cache;
  Game.Assets._getImageEntry = (path) => cache.get(path) || null;
})();
window.Game = window.Game || {};

(function () {
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /**
   * generateMap(width, height, seed, distribution)
   * distribution = { grass, forest, mountain, water } als Prozentzahlen (0..100)
   * Wenn nicht angegeben: 40 / 20 / 20 / 20
   */
  function generateMap(width, height, seed, distribution) {
    const rng = mulberry32(seed >>> 0);
    const grid = new Array(width * height).fill('grass');

    const dist = distribution || { grass: 40, forest: 20, mountain: 20, water: 20 };
    const area = width * height;

    // Ziel-Verteilung exakt berechnen
    const targetForest   = Math.floor(area * (dist.forest   / 100));
    const targetMountain = Math.floor(area * (dist.mountain / 100));
    const targetWater    = Math.floor(area * (dist.water    / 100));
    // Gras bekommt den Rest (also ca. dist.grass / 100)

    let countForest = 0;
    let countMountain = 0;
    let countWater = 0;

    function setTile(x, y, type) {
      if (x < 0 || x >= width || y < 0 || y >= height) return false;
      const idx = y * width + x;
      if (grid[idx] !== 'grass') return false;

      grid[idx] = type;
      if (type === 'forest') countForest++;
      else if (type === 'mountain') countMountain++;
      else if (type === 'water') countWater++;
      return true;
    }

    function growBlob(type, startX, startY, maxSize, remaining) {
      if (remaining <= 0) return 0;
      const target = Math.min(maxSize, remaining);
      let grown = 0;

      const frontier = [{ x: startX, y: startY }];
      const visited = new Set();
      visited.add(startX + ',' + startY);

      while (frontier.length > 0 && grown < target) {
        const idx = Math.floor(rng() * frontier.length);
        const curr = frontier[idx];
        frontier.splice(idx, 1);

        if (setTile(curr.x, curr.y, type)) grown++;

        const dirs = [
          { x: 1, y: 0 }, { x: -1, y: 0 },
          { x: 0, y: 1 }, { x: 0, y: -1 }
        ];
        for (const d of dirs) {
          const nx = curr.x + d.x;
          const ny = curr.y + d.y;
          const key = nx + ',' + ny;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height && !visited.has(key)) {
            const gridIdx = ny * width + nx;
            if (grid[gridIdx] === 'grass') {
              visited.add(key);
              frontier.push({ x: nx, y: ny });
            }
          }
        }
      }
      return grown;
    }

    // Robusteres Auffüllen: wir sammeln ALLE freien Felder und mischen sie
    function fillRandom(type, count) {
      if (count <= 0) return;
      
      // Alle freien Gras-Felder sammeln
      const freeTiles = [];
      for (let i = 0; i < grid.length; i++) {
        if (grid[i] === 'grass') freeTiles.push(i);
      }

      // Fisher-Yates Shuffle
      for (let i = freeTiles.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        const tmp = freeTiles[i];
        freeTiles[i] = freeTiles[j];
        freeTiles[j] = tmp;
      }

      // So viele wie nötig (oder verfügbar) setzen
      const toFill = Math.min(count, freeTiles.length);
      for (let i = 0; i < toFill; i++) {
        const idx = freeTiles[i];
        grid[idx] = type;
        if (type === 'forest') countForest++;
        else if (type === 'mountain') countMountain++;
        else if (type === 'water') countWater++;
      }
    }

    // Reihenfolge: Wasser, Berge, Wald. Gras bleibt Rest.
    let safety = 0;
    while (countWater < targetWater && safety < 1000) {
      safety++;
      const cx = Math.floor(rng() * width);
      const cy = Math.floor(rng() * height);
      if (grid[cy * width + cx] !== 'grass') continue;
      const remaining = targetWater - countWater;
      const size = Math.floor(8 + rng() * 30);
      growBlob('water', cx, cy, size, remaining);
    }

    safety = 0;
    while (countMountain < targetMountain && safety < 1000) {
      safety++;
      const cx = Math.floor(rng() * width);
      const cy = Math.floor(rng() * height);
      if (grid[cy * width + cx] !== 'grass') continue;
      const remaining = targetMountain - countMountain;
      const size = Math.floor(6 + rng() * 25);
      growBlob('mountain', cx, cy, size, remaining);
    }

    safety = 0;
    while (countForest < targetForest && safety < 1000) {
      safety++;
      const cx = Math.floor(rng() * width);
      const cy = Math.floor(rng() * height);
      if (grid[cy * width + cx] !== 'grass') continue;
      const remaining = targetForest - countForest;
      const size = Math.floor(10 + rng() * 40);
      growBlob('forest', cx, cy, size, remaining);
    }

    // Auffüllen falls nötig (jetzt robust)
    if (countWater < targetWater)       fillRandom('water',    targetWater - countWater);
    if (countMountain < targetMountain) fillRandom('mountain', targetMountain - countMountain);
    if (countForest < targetForest)     fillRandom('forest',   targetForest - countForest);

    return { width, height, grid };
  }

  Game.generateMap = generateMap;
})();
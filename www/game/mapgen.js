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
   *
   * Wasser wächst in 2×2-Blöcken. Cluster sind kompakt (teichartig),
   * aber nicht perfekt rund – mit leichten Ausbuchtungen.
   * Zwischen zwei Clustern liegen mind. 3 Grasfelder.
   *
   * Deco-Objekte aus Game.DECORATIONS werden zufällig auf ihrem
   * passenden Terrain platziert (Standard: Gras).
   *
   * Steine werden mit voller Kapazität (500) erzeugt.
   */
  function generateMap(width, height, seed, distribution) {
    const rng = mulberry32(seed >>> 0);
    const grid = new Array(width * height).fill('grass');

    const dist = distribution || { grass: 40, forest: 20, mountain: 20, water: 20 };
    const area = width * height;

    const targetWater = Math.floor(area * (dist.water    / 100));
    const targetTreeTiles = Math.floor(area * (dist.forest / 100));
    const targetStoneTiles = Math.floor(area * (dist.mountain / 100));

    const targetTrees = Math.floor(targetTreeTiles / 4);
    const targetStoneFields = Math.floor(targetStoneTiles / 9);

    // ============================================================
    // 1. Wasser: 2×2-Blöcke, kompakte Teiche mit leichter Unregelmäßigkeit
    // ============================================================
    const blockCols = Math.floor(width / 2);
    const blockRows = Math.floor(height / 2);

    const waterBlocks = new Map();
    let countWater = 0;
    let nextClusterId = 1;

    const MIN_BLOCK_DIST = 2;

    function isTooCloseToOtherCluster(bx, by, ownClusterId) {
      for (let dy = -MIN_BLOCK_DIST + 1; dy <= MIN_BLOCK_DIST - 1; dy++) {
        for (let dx = -MIN_BLOCK_DIST + 1; dx <= MIN_BLOCK_DIST - 1; dx++) {
          const nx = bx + dx, ny = by + dy;
          const cid = waterBlocks.get(nx + ',' + ny);
          if (cid !== undefined && cid !== ownClusterId) return true;
        }
      }
      return false;
    }

    function isTooCloseToAnyBlock(bx, by) {
      for (let dy = -MIN_BLOCK_DIST + 1; dy <= MIN_BLOCK_DIST - 1; dy++) {
        for (let dx = -MIN_BLOCK_DIST + 1; dx <= MIN_BLOCK_DIST - 1; dx++) {
          const nx = bx + dx, ny = by + dy;
          if (waterBlocks.has(nx + ',' + ny)) return true;
        }
      }
      return false;
    }

    function setWaterBlock(bx, by, clusterId) {
      if (bx < 0 || bx >= blockCols || by < 0 || by >= blockRows) return false;
      const key = bx + ',' + by;
      if (waterBlocks.has(key)) return false;

      const topLeftX = bx * 2;
      const topLeftY = by * 2;
      for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          if (grid[(topLeftY + dy) * width + (topLeftX + dx)] !== 'grass') return false;
        }
      }

      if (isTooCloseToOtherCluster(bx, by, clusterId)) return false;

      waterBlocks.set(key, clusterId);
      for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          grid[(topLeftY + dy) * width + (topLeftX + dx)] = 'water';
        }
      }
      countWater += 4;
      return true;
    }

    const targetBlocks = Math.ceil(targetWater / 4);

    function countOwnWaterNeighbors(bx, by, clusterId) {
      let count = 0;
      for (const d of [
        { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
        { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
      ]) {
        const cid = waterBlocks.get((bx + d.dx) + ',' + (by + d.dy));
        if (cid === clusterId) count++;
      }
      return count;
    }

    function growPondCluster(startBx, startBy, maxBlocks, clusterId) {
      if (maxBlocks <= 0) return 0;
      let grown = 0;

      const frontierSet = new Set();

      function addNeighborsToFrontier(bx, by) {
        for (const d of [
          { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
          { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
        ]) {
          const nbx = bx + d.dx;
          const nby = by + d.dy;
          if (nbx < 0 || nbx >= blockCols || nby < 0 || nby >= blockRows) continue;
          const key = nbx + ',' + nby;
          if (waterBlocks.has(key)) continue;
          frontierSet.add(key);
        }
      }

      if (!setWaterBlock(startBx, startBy, clusterId)) return 0;
      grown++;
      addNeighborsToFrontier(startBx, startBy);

      while (grown < maxBlocks && frontierSet.size > 0) {
        const candidates = Array.from(frontierSet);

        let pickKey;
        if (rng() < 0.4) {
          pickKey = candidates[Math.floor(rng() * candidates.length)];
        } else {
          const scored = [];
          for (const key of candidates) {
            const [xs, ys] = key.split(',');
            const bx = +xs, by = +ys;
            const score = countOwnWaterNeighbors(bx, by, clusterId);
            scored.push({ key, score });
          }
          scored.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return rng() - 0.5;
          });
          pickKey = scored[0].key;
        }

        const [xs, ys] = pickKey.split(',');
        const bx = +xs, by = +ys;
        frontierSet.delete(pickKey);

        if (setWaterBlock(bx, by, clusterId)) {
          grown++;
          addNeighborsToFrontier(bx, by);
        }
      }

      return grown;
    }

    const approxClusterCount = Math.max(2, Math.min(4, Math.floor(targetBlocks / 40) + 1));
    const targetPerCluster = Math.ceil(targetBlocks / approxClusterCount);

    let safety = 0;
    let totalBlocksGrown = 0;
    let clustersCreated = 0;

    while (totalBlocksGrown < targetBlocks && clustersCreated < approxClusterCount && safety < 2000) {
      safety++;
      const bx = Math.floor(rng() * blockCols);
      const by = Math.floor(rng() * blockRows);

      if (isTooCloseToAnyBlock(bx, by)) continue;
      if (waterBlocks.has(bx + ',' + by)) continue;

      const remaining = targetBlocks - totalBlocksGrown;
      const clusterSize = Math.min(remaining, targetPerCluster + Math.floor(rng() * 20) - 10);
      if (clusterSize < 5) break;

      const clusterId = nextClusterId++;
      const grown = growPondCluster(bx, by, clusterSize, clusterId);
      if (grown > 0) {
        totalBlocksGrown += grown;
        clustersCreated++;
      }
    }

    if (totalBlocksGrown < targetBlocks) {
      safety = 0;
      while (totalBlocksGrown < targetBlocks && safety < 30000) {
        safety++;
        const bx = Math.floor(rng() * blockCols);
        const by = Math.floor(rng() * blockRows);
        if (waterBlocks.has(bx + ',' + by)) continue;
        if (isTooCloseToAnyBlock(bx, by)) continue;

        const remaining = targetBlocks - totalBlocksGrown;
        const clusterId = nextClusterId++;
        const clusterSize = Math.min(remaining, Math.max(8, Math.floor(remaining * 0.4)));
        const grown = growPondCluster(bx, by, clusterSize, clusterId);
        totalBlocksGrown += grown;
      }
    }

    if (totalBlocksGrown < targetBlocks) {
      safety = 0;
      while (totalBlocksGrown < targetBlocks && safety < 30000) {
        safety++;
        const bx = Math.floor(rng() * blockCols);
        const by = Math.floor(rng() * blockRows);
        if (waterBlocks.has(bx + ',' + by)) continue;
        const newClusterId = nextClusterId++;
        if (setWaterBlock(bx, by, newClusterId)) {
          totalBlocksGrown++;
        }
      }
    }

    // ============================================================
    // 2. Steine: 3×3 — mit Kapazität 500
    // ============================================================
    const STONE_MAX_CAPACITY = 500;
    const stones = [];
    const usedStoneTiles = new Set();
    const MIN_STONE_DIST = 8;

    function tileFreeForStone(cx, cy) {
      const minX = cx - 1, maxX = cx + 1;
      const minY = cy - 1, maxY = cy + 1;
      if (minX < 0 || minY < 0 || maxX >= width || maxY >= height) return false;
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          if (grid[y * width + x] !== 'grass') return false;
          if (usedStoneTiles.has(x + ',' + y)) return false;
        }
      }
      return true;
    }

    function tooCloseToStones(cx, cy) {
      for (const s of stones) {
        const dx = s.cx - cx, dy = s.cy - cy;
        if (dx * dx + dy * dy < MIN_STONE_DIST * MIN_STONE_DIST) return true;
      }
      return false;
    }

    function markStoneTiles(cx, cy) {
      for (let y = cy - 1; y <= cy + 1; y++) {
        for (let x = cx - 1; x <= cx + 1; x++) {
          usedStoneTiles.add(x + ',' + y);
        }
      }
    }

    const candidateStep = Math.max(6, Math.floor(Math.sqrt(area / Math.max(1, targetStoneFields))));
    outerStones:
    for (let gy = 1; gy < height - 1; gy += candidateStep) {
      for (let gx = 1; gx < width - 1; gx += candidateStep) {
        if (stones.length >= targetStoneFields) break outerStones;
        const jx = gx + Math.floor(rng() * candidateStep);
        const jy = gy + Math.floor(rng() * candidateStep);
        if (jx < 1 || jy < 1 || jx >= width - 1 || jy >= height - 1) continue;
        if (!tileFreeForStone(jx, jy)) continue;
        if (tooCloseToStones(jx, jy)) continue;
        stones.push({
          cx: jx,
          cy: jy,
          capacity: STONE_MAX_CAPACITY,
          maxCapacity: STONE_MAX_CAPACITY
        });
        markStoneTiles(jx, jy);
      }
    }

    if (stones.length < targetStoneFields) {
      safety = 0;
      while (stones.length < targetStoneFields && safety < 5000) {
        safety++;
        const cx = 1 + Math.floor(rng() * (width - 2));
        const cy = 1 + Math.floor(rng() * (height - 2));
        if (!tileFreeForStone(cx, cy)) continue;
        if (tooCloseToStones(cx, cy)) continue;
        stones.push({
          cx,
          cy,
          capacity: STONE_MAX_CAPACITY,
          maxCapacity: STONE_MAX_CAPACITY
        });
        markStoneTiles(cx, cy);
      }
    }

    // ============================================================
    // 3. Bäume: 2×2
    // ============================================================
    const trees = [];
    let countTrees = 0;
    const usedTreeTiles = new Set();

    function tileFreeForTree(x, y) {
      if (x < 0 || x + 1 >= width || y < 0 || y + 1 >= height) return false;
      for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          const px = x + dx, py = y + dy;
          if (grid[py * width + px] !== 'grass') return false;
          if (usedStoneTiles.has(px + ',' + py)) return false;
          if (usedTreeTiles.has(px + ',' + py)) return false;
        }
      }
      return true;
    }

    function addTreeAt(x, y) {
      trees.push({ x, y });
      for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          usedTreeTiles.add((x + dx) + ',' + (y + dy));
        }
      }
      countTrees++;
    }

    function growTreeCluster(startX, startY, maxSize) {
      const target = Math.min(maxSize, targetTrees - countTrees);
      if (target <= 0) return;
      let grown = 0;
      const frontier = [{ x: startX, y: startY }];
      const visited = new Set([startX + ',' + startY]);

      while (frontier.length > 0 && grown < target) {
        const idx = Math.floor(rng() * frontier.length);
        const curr = frontier.splice(idx, 1)[0];
        if (tileFreeForTree(curr.x, curr.y)) {
          addTreeAt(curr.x, curr.y);
          grown++;
        }
        for (const d of [
          { x: 2, y: 0 }, { x: -2, y: 0 }, { x: 0, y: 2 }, { x: 0, y: -2 },
          { x: 2, y: 2 }, { x: -2, y: 2 }, { x: 2, y: -2 }, { x: -2, y: -2 }
        ]) {
          const nx = curr.x + d.x, ny = curr.y + d.y;
          const key = nx + ',' + ny;
          if (!visited.has(key) && nx >= 0 && nx + 1 < width && ny >= 0 && ny + 1 < height) {
            if (grid[ny * width + nx] === 'grass') {
              visited.add(key);
              frontier.push({ x: nx, y: ny });
            }
          }
        }
      }
    }

    safety = 0;
    while (countTrees < targetTrees && safety < 2000) {
      safety++;
      const cx = Math.floor(rng() * width);
      const cy = Math.floor(rng() * height);
      if (!tileFreeForTree(cx, cy)) continue;
      growTreeCluster(cx, cy, 4 + Math.floor(rng() * 10));
    }

    if (countTrees < targetTrees) {
      safety = 0;
      while (countTrees < targetTrees && safety < 20000) {
        safety++;
        const x = Math.floor(rng() * width);
        const y = Math.floor(rng() * height);
        if (!tileFreeForTree(x, y)) continue;
        addTreeAt(x, y);
      }
    }

    // ============================================================
    // 4. Deco: zufällig auf passendem Terrain
    // ============================================================
    const decorations = [];
    const usedDecoTiles = new Set();

    const decoDefs = (Game.DECORATIONS && Object.keys(Game.DECORATIONS).length > 0)
      ? Object.values(Game.DECORATIONS)
      : [];

    const decoPool = [];
    for (const def of decoDefs) {
      const freq = Math.max(0, def.frequency || 0);
      for (let i = 0; i < freq; i++) decoPool.push(def);
    }

    if (decoPool.length > 0) {
      const totalFrequency = decoPool.length;

      function tileFreeForDeco(x, y, w, h, terrain) {
        if (x < 0 || y < 0 || x + w > width || y + h > height) return false;
        for (let dy = 0; dy < h; dy++) {
          for (let dx = 0; dx < w; dx++) {
            const px = x + dx, py = y + dy;
            const terrainId = grid[py * width + px];

            if (terrain && terrain !== 'any' && terrainId !== terrain) return false;

            if (terrainId === 'grass') {
              if (usedStoneTiles.has(px + ',' + py)) return false;
              if (usedTreeTiles.has(px + ',' + py)) return false;
            }

            if (usedDecoTiles.has(px + ',' + py)) return false;
          }
        }
        return true;
      }

      function markDecoTiles(x, y, w, h) {
        for (let dy = 0; dy < h; dy++) {
          for (let dx = 0; dx < w; dx++) {
            usedDecoTiles.add((x + dx) + ',' + (y + dy));
          }
        }
      }

      let decoPlaced = 0;
      let decoSafety = 0;
      const maxDecoAttempts = totalFrequency * 50;

      while (decoPlaced < totalFrequency && decoSafety < maxDecoAttempts) {
        decoSafety++;
        const def = decoPool[Math.floor(rng() * decoPool.length)];
        const w = def.width || 1;
        const h = def.height || 1;
        const terrain = def.terrain || 'grass';

        const x = Math.floor(rng() * width);
        const y = Math.floor(rng() * height);
        if (!tileFreeForDeco(x, y, w, h, terrain)) continue;

        decorations.push({ id: def.id, x, y });
        markDecoTiles(x, y, w, h);
        decoPlaced++;
      }
    }

    return { width, height, grid, trees, stones, decorations };
  }

  Game.generateMap = generateMap;
})();
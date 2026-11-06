window.Game = window.Game || {};

/**
 * Zentrales Spatial-Grid für alle beweglichen Entitäten.
 *
 * Wird einmal pro Frame (oder alle 2 Frames) neu gebaut.
 * Unterstützt mehrere Entitätstypen (villager, zombie, warrior, raider).
 *
 * Typische Nutzung:
 *   grid.clear();
 *   grid.insert(villager, 'villager');
 *   grid.insert(zombie, 'zombie');
 *   grid.rebuild();
 *
 *   const zombiesNearby = grid.queryByType(zombieX, zombieY, 5, 'zombie');
 *   const warriorsNearby = grid.queryByType(zombieX, zombieY, 5, 'warrior');
 */
Game.SpatialGrid = class SpatialGrid {
  constructor(cellSize = 4) {
    this.cellSize = cellSize;
    this.cells = new Map();       // key "cx,cy" → { all: [], byType: Map<string, []> }
    this._pending = [];           // Entitäten, die vor rebuild() eingefügt wurden
    this._built = false;
  }

  clear() {
    this.cells.clear();
    this._pending.length = 0;
    this._built = false;
  }

  insert(entity, type, x, y) {
    if (entity == null) return;
    if (entity.hidden) return;
    if (entity.state === 'dead') return;

    const px = (x !== undefined) ? x : entity.renderX;
    const py = (y !== undefined) ? y : entity.renderY;
    if (px === undefined || py === undefined) return;
    if (typeof px !== 'number' || typeof py !== 'number') return;

    this._pending.push({ entity, type, x: px, y: py });
    this._built = false;
  }

  insertAuto(entity, type) {
    this.insert(entity, type, entity.renderX, entity.renderY);
  }

  rebuild() {
    this.cells.clear();

    const cellSize = this.cellSize;
    for (let i = 0; i < this._pending.length; i++) {
      const p = this._pending[i];
      const cx = Math.floor(p.x / cellSize);
      const cy = Math.floor(p.y / cellSize);
      const key = cx + ',' + cy;

      let cell = this.cells.get(key);
      if (!cell) {
        cell = { all: [], byType: new Map() };
        this.cells.set(key, cell);
      }

      cell.all.push(p.entity);

      let typeList = cell.byType.get(p.type);
      if (!typeList) {
        typeList = [];
        cell.byType.set(p.type, typeList);
      }
      typeList.push(p.entity);
    }

    this._built = true;
  }

  _queryRadius(cx, cy, cellRadius, type) {
    const out = [];
    const cellSize = this.cellSize;
    for (let dy = -cellRadius; dy <= cellRadius; dy++) {
      for (let dx = -cellRadius; dx <= cellRadius; dx++) {
        const key = (cx + dx) + ',' + (cy + dy);
        const cell = this.cells.get(key);
        if (!cell) continue;

        if (type == null) {
          for (let i = 0; i < cell.all.length; i++) out.push(cell.all[i]);
        } else {
          const list = cell.byType.get(type);
          if (list) {
            for (let i = 0; i < list.length; i++) out.push(list[i]);
          }
        }
      }
    }
    return out;
  }

  /**
   * Gibt alle Entitäten im Umkreis von `radius` Tiles zurück.
   * `radius` ist die Weltkoordinaten-Distanz (in Tiles).
   * `type` optional: 'villager' | 'zombie' | 'warrior' | 'raider'
   *
   * ACHTUNG: Liefert Kandidaten aus Nachbarzellen — die Distanzprüfung
   * (Math.hypot oder distSq < r²) muss der Aufrufer machen, wenn er
   * exakte Distanz braucht. Das Grid garantiert nur, dass ALLE Entitäten
   * im echten `radius` enthalten sind (weil cellRadius so gewählt ist,
   * dass das Zellquatrat den Kreis abdeckt).
   */
  query(x, y, radius, type) {
    if (!this._built) this.rebuild();

    const cellSize = this.cellSize;
    const cellRadius = Math.ceil(radius / cellSize);

    const cx = Math.floor(x / cellSize);
    const cy = Math.floor(y / cellSize);

    return this._queryRadius(cx, cy, cellRadius, type || null);
  }

  queryByType(x, y, radius, type) {
    return this.query(x, y, radius, type);
  }

  /**
   * Gibt die nächste Entität vom angegebenen Typ zurück, oder null.
   * `maxDist` in Tiles. Die exakte Distanz wird geprüft.
   */
  findNearest(x, y, maxDist, type, filterFn) {
    if (!this._built) this.rebuild();

    const cellSize = this.cellSize;
    const cellRadius = Math.ceil(maxDist / cellSize);
    const cx = Math.floor(x / cellSize);
    const cy = Math.floor(y / cellSize);

    const candidates = this._queryRadius(cx, cy, cellRadius, type);

    let best = null;
    let bestDistSq = maxDist * maxDist;

    for (let i = 0; i < candidates.length; i++) {
      const e = candidates[i];
      if (filterFn && !filterFn(e)) continue;

      const ex = (e.renderX !== undefined ? e.renderX : e.x);
      const ey = (e.renderY !== undefined ? e.renderY : e.y);
      const dx = ex - x;
      const dy = ey - y;
      const distSq = dx * dx + dy * dy;
      if (distSq < bestDistSq) {
        bestDistSq = distSq;
        best = e;
      }
    }

    return best;
  }
};
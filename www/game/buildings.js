window.Game = window.Game || {};

Game.Buildings = {
  /**
   * Zentrale Funktion: Berechnet die Top-Left-Kachel eines Gebäudes,
   * wenn der "Anker" (Finger/Klick) auf der Mitte des Gebäudes liegt.
   */
  getTopLeft(def, anchorX, anchorY) {
    const w = def.width || 1;
    const h = def.height || 1;
    const offX = Math.floor((w - 1) / 2);
    const offY = Math.floor((h - 1) / 2);
    return { x: anchorX - offX, y: anchorY - offY };
  },

  isInsideBorder(world, x, y, w, h) {
    if (world.castleId === null) return true;
    const castle = world.buildings.get(world.castleId);
    let baseRadius = 10;
    const castleCenterX = castle.x + Math.floor((castle.w || 1) / 2);
    const castleCenterY = castle.y + Math.floor((castle.h || 1) / 2);

    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const px = x + dx, py = y + dy;
        let inside = false;
        
        if (Math.abs(px - castleCenterX) <= baseRadius && Math.abs(py - castleCenterY) <= baseRadius) {
          inside = true;
        }
        
        if (!inside) {
          for (const b of world.buildings.values()) {
            if (b.def.expandsBorder && b.built) {
              const r = b.def.expandsBorder;
              if (Math.abs(px - b.x) <= r && Math.abs(py - b.y) <= r) { 
                inside = true; 
                break; 
              }
            }
          }
        }
        
        if (!inside) return false;
      }
    }
    return true;
  },

  canPlace(world, typeId, anchorX, anchorY) {
    const def = Game.BUILDING_TYPES[typeId];
    if (!def) return { ok: false, msg: 'Unbekanntes Gebäude' };
    
    const w = def.width || 1;
    const h = def.height || 1;
    const topLeft = this.getTopLeft(def, anchorX, anchorY);

    if (!world.inBounds(topLeft.x, topLeft.y) || !world.inBounds(topLeft.x + w - 1, topLeft.y + h - 1)) {
      return { ok: false, msg: 'Außerhalb der Karte' };
    }

    if (!this.isInsideBorder(world, topLeft.x, topLeft.y, w, h)) {
      return { ok: false, msg: 'Außerhalb der Stadtgrenze!' };
    }

    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const px = topLeft.x + dx, py = topLeft.y + dy;
        
        const terr = world.getTerrain(px, py);
        if (!terr || !terr.buildable) return { ok: false, msg: 'Auf Wasser kann nicht gebaut werden' };
        
        if (world.occupied.has(`${px},${py}`)) return { ok: false, msg: 'Feld ist belegt' };

        if (def.requiresTerrain && terr.id !== def.requiresTerrain) {
          const terrainName = Game.TERRAINS[def.requiresTerrain]?.name || def.requiresTerrain;
          return { ok: false, msg: `Muss auf ${terrainName} gebaut werden` };
        }
      }
    }

    return { ok: true };
  },

  startBuild(world, typeId, anchorX, anchorY, economy) {
    const def = Game.BUILDING_TYPES[typeId];
    if (economy) {
      if (!economy.canAfford(def.cost)) {
        if (window.__dlog) {
          let parts = [];
          for (const k in def.cost) parts.push(`${def.cost[k]} ${k}`);
          window.__dlog(`⛔ Nicht genug Ressourcen für ${def.name}: brauche ${parts.join(', ')}`, '#f66');
        }
        return false;
      }
      economy.pay(def.cost);
    }
    const building = world.addBuilding(def, anchorX, anchorY);
    building.built = false;
    building.progress = 0;
    building.buildTime = def.buildTime;
    return building;
  }
};
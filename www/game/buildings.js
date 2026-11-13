window.Game = window.Game || {};

Game.Buildings = {
  /**
   * Berechnet die Top-Left-Kachel eines Gebäudes, wenn der Anker
   * (Finger/Klick) auf der Mitte des Gebäudes liegt.
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
    
    // NEU: Radius dynamisch aus den BuildingTypes lesen (Fallback 10)
    const baseRadius = castle.def.expandsBorder || 10;
    
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

    if (!world.inBounds(topLeft.x, topLeft.y) ||
        !world.inBounds(topLeft.x + w - 1, topLeft.y + h - 1)) {
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

        if (world.isStoneAt(px, py)) return { ok: false, msg: 'Stein blockiert das Feld' };

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
          const parts = [];
          for (const k in def.cost) parts.push(`${def.cost[k]} ${k}`);
          window.__dlog(`⛔ Nicht genug Ressourcen für ${def.name}: brauche ${parts.join(', ')}`, '#f66');
        }
        return false;
      }
      economy.pay(def.cost);
    }
    const building = world.addBuilding(def, anchorX, anchorY);
    if (!building) return false;
    building.built = false;
    building.progress = 0;
    building.buildTime = def.buildTime;
    return building;
  },

  // ==========================================================
  // NEU: Reparatur-Logik für Ruinen
  // ==========================================================

  canRepair(world, b, economy) {
    if (!b || !b.def) return false;
    if (!b.ruined) return false;
    if (b.isBeingRepaired) return false;

    const cost = world.getRepairCost(b);
    if (!cost) return false;

    if (!economy) return true; 

    for (const k in cost) {
      if ((economy.res[k] || 0) < cost[k]) return false;
    }
    return true;
  },

  startRepair(world, b, builderVillagerId) {
    if (!b || !b.ruined || b.isBeingRepaired) return false;

    const cost = world.getRepairCost(b);
    if (!cost) return false;

    b.isBeingRepaired = true;
    b.progress = 0;
    b.buildTime = Math.max(2, b.def.buildTime || 4); 
    b.builderId = builderVillagerId || null;
    b.repairCostCache = { ...cost };

    if (!world.buildSites.includes(b)) {
      world.buildSites.push(b);
    }

    if (window.__dlog) {
      window.__dlog(`🔧 Reparatur gestartet: ${b.def.name}`, '#4A90E2');
    }
    return true;
  },

  deliverRepairMaterials(world, b, economy) {
    if (!b || !b.repairCostCache || !economy) return false;
    const cost = b.repairCostCache;

    for (const k in cost) {
      if ((economy.res[k] || 0) < cost[k]) return false;
    }

    for (const k in cost) {
      economy.res[k] -= cost[k];
    }
    if (economy.onChange) economy.onChange();

    b.repairCostCache = null;
    return true;
  },

  cancelRepair(world, b) {
    if (!b || !b.isBeingRepaired) return;
    b.isBeingRepaired = false;
    b.progress = 0;
    b.builderId = null;
    b.repairCostCache = null;
    const idx = world.buildSites.indexOf(b);
    if (idx !== -1) world.buildSites.splice(idx, 1);
  }
};
(() => {
  const game = window.Game && window.Game.state;
  if (!game || !game.world) { console.warn('Kein Spiel aktiv.'); return; }
  const w = game.world;
  const dm = game.dragonManager;

  const towers = [];
  for (const b of w.buildings.values()) {
    if (b.def && b.def.id === 'watchtower' && b.built && !b.ruined && !b.isBeingRepaired) {
      towers.push(b);
    }
  }

  if (towers.length === 0) {
    console.log('Keine intakten Festungen gefunden.');
    return;
  }

  let count = 0;
  for (const b of towers) {
    if (dm && typeof dm._ruinBuilding === 'function') {
      dm._ruinBuilding(b);          // echte Spiel-Logik
    } else {
      // Fallback ohne DragonManager
      b.ruined = true;
      b.built = false;
      b.progress = 0;
      b.buildTime = 0;
      b.ruinAsset = b.def.ruinAsset || 'images/ruine-quadrat.webp';
      if (!w.buildSites.includes(b)) w.buildSites.push(b);
      const lists = ['warriorBuildings','arrowBuildings','beerBuildings','dropoffBuildings','animatedBuildings'];
      for (const ln of lists) {
        const l = w[ln]; if (Array.isArray(l)) {
          const i = l.indexOf(b); if (i !== -1) l.splice(i, 1);
        }
      }
      w.freeJobs.delete(b);
      w.invalidateTerritoryCache();
      if (game.renderer) game.renderer.markStaticDirty(w.getBuildingTiles(b));
    }
    count++;
  }

  console.log(`✅ ${count} Festung(en) in Ruinen verwandelt.`);
  console.log('Jetzt reparieren lassen und prüfen, ob Krieger-Slots wieder befüllt werden.');
})();
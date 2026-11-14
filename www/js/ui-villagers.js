window.Game = window.Game || {};

Game.UI = Game.UI || {};

Game.UI.getDetailedWorkerStatus = function (v, b, now) {
  if (!v) return 'Unbekannt';

  if (v.isSick) {
    if (v.state === 'sick_walking_to_praxis') return '<span style="color:#ffcc00">Unterwegs zur Arztpraxis</span>';
    if (v.state === 'sick_treating') return '<span style="color:#4A90E2">In Behandlung</span>';
    if (v.state === 'sick_walking_back') return '<span style="color:#ffcc00">Unterwegs zurück zur Arbeit</span>';
    if (v.state === 'working') {
      if (b && b.def.id === 'arztpraxis') return '<span style="color:#a83232">Krank (Arzt)</span>';
      return '<span style="color:#a83232">🤒 Krank (arbeitet langsam)</span>';
    }
  }

  if (v.state === 'moving') {
    if (v.task === 'go_to_work') return 'Unterwegs zur Arbeit';
    if (v.task === 'go_to_warrior_post') return 'Unterwegs zum Posten';
    if (v.task === 'go_to_build') return 'Unterwegs zur Baustelle';
    if (v.task === 'go_to_pickup') return 'Unterwegs zum Abholen';
    if (v.task === 'go_to_dropoff') return 'Unterwegs zum Lager';
    if (v.task === 'harvest_route') return 'Unterwegs zum Feld';
    if (v.task === 'tree_harvest_arrived') return 'Unterwegs zum Baum';
    if (v.task === 'stone_harvest_arrived') return 'Unterwegs zum Stein';
    if (v.task === 'fish_harvest_arrived') return 'Unterwegs zum Wasser';
    if (v.task === 'plant_tree_arrived') return 'Unterwegs zum Pflanzen';
    if (v.task === 'recipe_fetch_storage') return 'Unterwegs zum Lager (Zutaten)';
    if (v.task === 'recipe_fetch_return') return 'Unterwegs zur Produktion';
    if (v.task === 'fetch_fish_storage') return 'Unterwegs zum Fischholen';
    if (v.task === 'fetch_fish_return') return 'Unterwegs mit Fisch';
    if (v.task === 'fetch_arrows_storage') return 'Unterwegs zum Pfeileholen';
    if (v.task === 'fetch_arrows_return') return 'Unterwegs mit Pfeilen';
    if (v.task === 'repair_fetch_storage') return 'Unterwegs zum Material holen';
    if (v.task === 'repair_return') return 'Unterwegs zur Reparatur';
    if (v.task === 'fetch_water_storage') return 'Unterwegs zum Wasserholen';
    if (v.task === 'fetch_water_return') return 'Unterwegs zur Feuerwehr';
    if (v.task === 'extinguish_fetch') return 'Unterwegs zum Wassertanken';
    if (v.task === 'extinguish_go') return 'Unterwegs zum Feuer';
    if (v.task === 'return_to_station') return 'Unterwegs zur Feuerwehr';
    if (v.task === 'fetch_antibiotics_storage') return 'Unterwegs zum Antibiotika holen';
    if (v.task === 'fetch_antibiotics_return') return 'Unterwegs zur Arztpraxis';
    if (v.task === 'sick_walking_to_praxis') return 'Unterwegs zur Arztpraxis';
    if (v.task === 'sick_walking_back') return 'Unterwegs zurück zur Arbeit';
    if (v.task === 'go_home') return 'Unterwegs nach Hause';
    if (v.task === 'returning_to_post') return 'Unterwegs zum Posten';
    return 'Unterwegs';
  }
  if (v.state === 'harvesting_hit') return 'Fällt Baum / Baut ab';
  if (v.state === 'fishing_dive') return 'Fischt im Wasser';
  if (v.state === 'harvesting') return 'Erntet Feld ab';
  if (v.state === 'building') return 'Baut Gebäude';
  if (v.state === 'repairing') return 'Repariert Gebäude';
  if (v.state === 'extinguishing') return 'Löscht Feuer';
  if (v.state === 'vdefend') return 'Verteidigt das Reich';
  if (v.state === 'vfightback') return 'Im Gegenangriff';
  if (v.state === 'vfighting') return 'Kämpft gegen Räuber';
  if (v.state === 'zfighting') return 'Kämpft gegen Zombies';
  if (v.state === 'dragon_attack') return 'Kämpft gegen Drachen';
  if (v.state === 'returning_to_post') return 'Unterwegs zum Posten';
  if (v.state === 'sick_walking_to_praxis') return 'Unterwegs zur Arztpraxis';
  if (v.state === 'sick_treating') return 'In Behandlung';
  if (v.state === 'sick_walking_back') return 'Unterwegs zurück zur Arbeit';

  if (v.state === 'working') {
    if (b) {
      if (b.def.id === 'fireStation') {
        if (v._fireStationRole === 'refill') return 'Wartet auf Wasserbedarf';
        return 'Wartet auf Alarm';
      }
      if (b.def.id === 'arztpraxis') {
        if (v.isSick) return '<span style="color:#a83232">Krank</span>';
        return 'Wartet auf Patienten';
      }
      if (b.def.id === 'lumberjack' || b.def.id === 'quarry') {
        if (b.harvestCooldownUntil && now < b.harvestCooldownUntil) {
          const rem = Math.ceil((b.harvestCooldownUntil - now) / 1000);
          return `<span style="color:#ffcc00">Pause (${rem}s)</span>`;
        }
        return 'Sucht neuen Baum/Stein';
      }
      if (b.def.id === 'fisher') {
        if (b.harvestCooldownUntil && now < b.harvestCooldownUntil) {
          const rem = Math.ceil((b.harvestCooldownUntil - now) / 1000);
          return `<span style="color:#ffcc00">Pause (${rem}s)</span>`;
        }
        return 'Sucht Fischgrund';
      }
      if (b.def.id === 'forsthaus') {
        if (v._forestPlantTimer > 0) {
          const rem = Math.ceil(v._forestPlantTimer / 1000);
          return `<span style="color:#ffcc00">Wartezeit (${rem}s)</span>`;
        }
        return 'Sucht Pflanzplatz';
      }
      if (b.def.recipe) {
        if (!b.isActive) return `<span style="color:#f0a040">Wartet auf Zutaten</span>`;
        const rem = Math.max(0, (b.def.recipeInterval || 30) - (b.recipeTimer || 0));
        return `Produziert (${Math.ceil(rem)}s)`;
      }
      if (b.def.generatesResource) {
        const rem = Math.max(0, b.def.generatesInterval - (b.generatesTimer || 0));
        return `Arbeitet (${Math.ceil(rem)}s)`;
      }
    }
    return 'Arbeitet';
  }
  if (v.state === 'idle') return 'Wartet auf Aufgabe';
  return v.state || 'Unbekannt';
};

Game.UI.describeVillager = function (v) {
  if (!v) return '';
  const b = v.workplaceId && Game.state && Game.state.world
    ? Game.state.world.buildings.get(v.workplaceId)
    : null;
  return this.getDetailedWorkerStatus(v, b, performance.now());
};

Game.UI.villagerStateEmoji = function (v) {
  if (!v) return '❓';
  if (v.isSick) return '<img src="images/krank.webp" style="width:16px;height:16px;object-fit:contain;vertical-align:middle;" title="Krank">';
  if (v.state === 'vdefend' || v.state === 'vfightback' || v.state === 'vfighting' || v.state === 'attacking_raiders' || v.state === 'dragon_attack' || v.state === 'zfighting') return '<img src="images/villager-krieger-rot.webp" style="width:16px;height:16px;object-fit:contain;vertical-align:middle;">';
  if (v.job === 'warrior') return '<img src="images/villager-krieger-rot.webp" style="width:16px;height:16px;object-fit:contain;vertical-align:middle;">';
  if (v.state === 'extinguish_fetch' || v.state === 'extinguish_go' || v.state === 'extinguish_return' || v.state === 'extinguishing' || v.state === 'fetch_water_storage' || v.state === 'fetch_water_return' || v.state === 'extinguish_waiting') return '<img src="images/feuerwehrmann.webp" style="width:16px;height:16px;object-fit:contain;vertical-align:middle;">';
  if (v.task === 'fetch_antibiotics_storage' || v.task === 'fetch_antibiotics_return') return '<img src="images/arzt.webp" style="width:16px;height:16px;object-fit:contain;vertical-align:middle;">';
  if (v.state === 'building' || v.state === 'repairing' || v.task === 'go_to_build' || v.task === 'repair_fetch_storage' || v.task === 'repair_return') return '<img src="images/villager-baumeister-rot.webp" style="width:16px;height:16px;object-fit:contain;vertical-align:middle;">';
  if (v.state === 'harvesting' || v.task === 'harvest_route' || v.task === 'stone_harvest_arrived') return '<img src="images/icon_getreide.webp" style="width:16px;height:16px;object-fit:contain;vertical-align:middle;">';
  if (v.state === 'fishing_dive' || v.task === 'fish_harvest_arrived') return '<img src="images/icon_fisch.webp" style="width:16px;height:16px;object-fit:contain;vertical-align:middle;">';
  if (v.task === 'plant_tree_arrived') return '<img src="images/icon_baum.webp" style="width:16px;height:16px;object-fit:contain;vertical-align:middle;">';
  if (v.task === 'fetch_arrows_storage' || v.task === 'fetch_arrows_return') return '<img src="images/icon_pfeil.webp" style="width:16px;height:16px;object-fit:contain;vertical-align:middle;">';
  if (v.state === 'moving') return '<img src="images/villager-idle-rot.webp" style="width:16px;height:16px;object-fit:contain;vertical-align:middle;">';
  if (v.job === 'worker') return '<img src="images/villager-baumeister-rot.webp" style="width:16px;height:16px;object-fit:contain;vertical-align:middle;">';
  return '<img src="images/haus-rot.webp" style="width:16px;height:16px;object-fit:contain;vertical-align:middle;">';
};

Game.UI.villagerEmojiPath = function (v, b) {
  if (!v) return 'images/villager-idle-rot.webp';
  if (v.isSick) return 'images/krank.webp';
  if (v.job === 'warrior') return 'images/villager-krieger-rot.webp';
  if (v.state === 'extinguish_fetch' || v.state === 'extinguish_go' || v.state === 'extinguish_return' || v.state === 'extinguishing' || v.state === 'extinguish_waiting' || v.state === 'fetch_water_storage' || v.state === 'fetch_water_return') return 'images/feuerwehrmann.webp';
  if (v.task === 'fetch_antibiotics_storage' || v.task === 'fetch_antibiotics_return') return 'images/arzt.webp';
  if (v.state === 'building' || v.state === 'repairing' || v.task === 'go_to_build' || v.task === 'repair_fetch_storage' || v.task === 'repair_return') return 'images/villager-baumeister-rot.webp';
  if (v.state === 'fishing_dive' || v.task === 'fish_harvest_arrived' || (b && b.def.id === 'fisher')) return 'images/villager-angler-rot.webp';
  if (b) {
    if (b.def.id === 'lumberjack' || b.def.produces === 'wood') return 'images/villager-holzfaeller-rot.webp';
    if (b.def.id === 'quarry' || b.def.produces === 'stone') return 'images/villager-steinmetz-rot.webp';
    if (b.def.produces === 'grain') return 'images/villager-bauer-rot.webp';
    if (b.def.id === 'forsthaus') return 'images/foerster.webp';
    if (b.def.id === 'fireStation') return 'images/feuerwehrmann.webp';
    if (b.def.id === 'arztpraxis') return 'images/arzt.webp';
    if (b.def.id === 'apotheke') return 'images/apotheker.webp';
    if (b.def.id === 'bakery') return 'images/baecker.webp';
    if (b.def.id === 'sawmill') return 'images/saeger.webp';
    if (b.def.id === 'mill') return 'images/mueller.webp';
    if (b.def.id === 'brewery') return 'images/brauer.webp';
    if (b.def.id === 'arrowSmith') return 'images/pfeilbauer.webp';
    if (b.def.id === 'arrowTower') return 'images/bogenschuetze.webp';
    if (b.def.id === 'feedMaker') return 'images/fuetterer.webp';
    if (b.def.id === 'pigFarm') return 'images/schweinebauer.webp';
    if (b.def.id === 'butcher') return 'images/schlachter.webp';
  }
  if (v.carrying) {
    if (v.carrying.type === 'wood') return 'images/villager-holzfaeller-rot.webp';
    if (v.carrying.type === 'stone') return 'images/villager-steinmetz-rot.webp';
    if (v.carrying.type === 'grain') return 'images/villager-bauer-rot.webp';
    if (v.carrying.type === 'fish') return 'images/villager-angler-rot.webp';
  }
  return 'images/villager-idle-rot.webp';
};

Game.UI._villagerRowHtml = function (w, vm, opts) {
  if (!w) {
    return `<div class="info-item" style="padding-left:8px;font-size:11px;color:#555;">• (verstorben)</div>`;
  }

  const now = performance.now();
  const workplace = w.workplaceId && vm && Game.state && Game.state.world
    ? Game.state.world.buildings.get(w.workplaceId)
    : null;
  const desc = this.getDetailedWorkerStatus(w, workplace, now);
  const emoji = this.villagerEmojiPath(w, workplace);

  const lvlBadge = (w.job === 'warrior' && w.warriorLevel > 1)
    ? `<span style="background:${w.warriorLevel === 5 ? '#ffcc00' : w.warriorLevel === 4 ? '#d4a017' : '#4A90E2'}; color:#111; font-weight:700; border-radius:4px; padding:0 5px; font-size:10px; margin-left:4px;">Lv${w.warriorLevel}</span>`
    : '';

  const showStats = opts && opts.showWarriorStats && w.job === 'warrior';

  let statsHtml = '';
  if (showStats) {
    const lvl = w.warriorLevel || 1;
    const kills = w.kills || 0;
    const hasBeer = !!w.beerBuff;

    const liveChances = this._getLiveWinChances(w);
    const zChance = Math.round(liveChances.zombie * 100);
    const rChance = Math.round(liveChances.raider * 100);

    statsHtml = `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px; font-size:11px; margin-top:4px; color:#bbb;">
        <div style="display:flex; justify-content:space-between;"><span>Kills:</span><span style="color:#7ad07a; font-weight:700;">${kills}</span></div>
        <div style="display:flex; justify-content:space-between;"><span>Bier:</span><span style="color:${hasBeer ? '#d4a017' : '#888'}; font-weight:700;">${hasBeer ? '🍺 Ja' : '❌'}</span></div>
        <div style="display:flex; justify-content:space-between;"><span>vs. Zombie:</span><span style="color:#7ad07a; font-weight:700;">${zChance}%</span></div>
        <div style="display:flex; justify-content:space-between;"><span>vs. Räuber:</span><span style="color:#ff8a5c; font-weight:700;">${rChance}%</span></div>
      </div>`;
  }

  return `
    <div class="info-item follow-villager-row" data-follow-villager="${w.id}"
      style="display:flex; align-items:flex-start; gap:8px; padding:6px 8px; border-radius:6px; cursor:pointer; transition: background 0.15s; margin-bottom:2px;"
      onmouseover="this.style.background='rgba(255,255,255,0.06)'"
      onmouseout="this.style.background='transparent'">
      <img src="${emoji}" style="width:22px;height:22px;object-fit:contain;flex-shrink:0;margin-top:2px;">
      <div style="flex:1; min-width:0;">
        <div style="display:flex; align-items:center; gap:4px; flex-wrap:wrap;">
          <span style="font-weight:700; color:#eee;">${w.name}</span>
          ${lvlBadge}
          <span style="color:#888; font-size:11px;">📍</span>
        </div>
        <div style="color:#7ad07a; font-size:11px;">${desc}</div>
        ${statsHtml}
      </div>
    </div>
  `;
};
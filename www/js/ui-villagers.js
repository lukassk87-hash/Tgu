window.Game = window.Game || {};

Game.UI = Game.UI || {};

Game.UI.getDetailedWorkerStatus = function (v, b, now) {
  if (!v) return Game.Lang.t('status_unknown');

  if (v.isSick) {
    if (v.state === 'sick_walking_to_praxis') return `<span style="color:#ffcc00">${Game.Lang.t('task_to_praxis')}</span>`;
    if (v.state === 'sick_treating') return `<span style="color:#4A90E2">${Game.Lang.t('status_in_treatment')}</span>`;
    if (v.state === 'sick_walking_back') return `<span style="color:#ffcc00">${Game.Lang.t('task_back_to_work')}</span>`;
    if (v.state === 'working') {
      if (b && b.def.id === 'arztpraxis') return `<span style="color:#a83232">${Game.Lang.t('state_sick_doctor')}</span>`;
      return `<span style="color:#a83232">${Game.Lang.t('state_sick_slow')}</span>`;
    }
  }

  if (v.state === 'moving') {
    if (v.task === 'go_to_work') return Game.Lang.t('task_go_to_work');
    if (v.task === 'go_to_warrior_post') return Game.Lang.t('task_go_to_post');
    if (v.task === 'go_to_build') return Game.Lang.t('task_go_to_build');
    if (v.task === 'go_to_pickup') return Game.Lang.t('task_go_to_pickup');
    if (v.task === 'go_to_dropoff') return Game.Lang.t('task_go_to_dropoff');
    if (v.task === 'harvest_route') return Game.Lang.t('task_harvest_route');
    if (v.task === 'tree_harvest_arrived') return Game.Lang.t('task_tree');
    if (v.task === 'stone_harvest_arrived') return Game.Lang.t('task_stone');
    if (v.task === 'fish_harvest_arrived') return Game.Lang.t('task_fish');
    if (v.task === 'plant_tree_arrived') return Game.Lang.t('task_plant');
    if (v.task === 'recipe_fetch_storage') return Game.Lang.t('task_recipe_fetch');
    if (v.task === 'recipe_fetch_return') return Game.Lang.t('task_recipe_return');
    if (v.task === 'fetch_fish_storage') return Game.Lang.t('task_fetch_fish');
    if (v.task === 'fetch_fish_return') return Game.Lang.t('task_fetch_fish_return');
    if (v.task === 'fetch_arrows_storage') return Game.Lang.t('task_fetch_arrows');
    if (v.task === 'fetch_arrows_return') return Game.Lang.t('task_fetch_arrows_return');
    if (v.task === 'repair_fetch_storage') return Game.Lang.t('task_repair_fetch');
    if (v.task === 'repair_return') return Game.Lang.t('task_repair_return');
    if (v.task === 'fetch_water_storage') return Game.Lang.t('task_water_fetch');
    if (v.task === 'fetch_water_return') return Game.Lang.t('task_water_return');
    if (v.task === 'extinguish_fetch') return Game.Lang.t('task_extinguish_fetch');
    if (v.task === 'extinguish_go') return Game.Lang.t('task_extinguish_go');
    if (v.task === 'return_to_station') return Game.Lang.t('task_return_station');
    if (v.task === 'fetch_antibiotics_storage') return Game.Lang.t('task_fetch_antibiotics');
    if (v.task === 'fetch_antibiotics_return') return Game.Lang.t('task_to_praxis');
    if (v.task === 'sick_walking_to_praxis') return Game.Lang.t('task_to_praxis');
    if (v.task === 'sick_walking_back') return Game.Lang.t('task_back_to_work');
    if (v.task === 'go_home') return Game.Lang.t('task_go_home');
    if (v.task === 'returning_to_post') return Game.Lang.t('task_return_post');
    return Game.Lang.t('task_moving');
  }
  if (v.state === 'harvesting_hit') return Game.Lang.t('state_harvesting_hit');
  if (v.state === 'fishing_dive') return Game.Lang.t('state_fishing');
  if (v.state === 'harvesting') return Game.Lang.t('state_harvesting');
  if (v.state === 'building') return Game.Lang.t('state_building');
  if (v.state === 'repairing') return Game.Lang.t('state_repairing');
  if (v.state === 'extinguishing') return Game.Lang.t('state_extinguishing');
  if (v.state === 'vdefend') return Game.Lang.t('state_vdefend');
  if (v.state === 'vfightback') return Game.Lang.t('state_vfightback');
  if (v.state === 'vfighting') return Game.Lang.t('state_vfighting');
  if (v.state === 'zfighting') return Game.Lang.t('state_zfighting');
  if (v.state === 'dragon_attack') return Game.Lang.t('state_dragon_attack');
  if (v.state === 'returning_to_post') return Game.Lang.t('task_return_post');
  if (v.state === 'sick_walking_to_praxis') return Game.Lang.t('task_to_praxis');
  if (v.state === 'sick_treating') return Game.Lang.t('status_in_treatment');
  if (v.state === 'sick_walking_back') return Game.Lang.t('task_back_to_work');

  if (v.state === 'working') {
    if (b) {
      if (b.def.id === 'fireStation') {
        if (v._fireStationRole === 'refill') return Game.Lang.t('state_wait_water');
        return Game.Lang.t('state_wait_alarm');
      }
      if (b.def.id === 'arztpraxis') {
        if (v.isSick) return `<span style="color:#a83232">${Game.Lang.t('state_sick')}</span>`;
        return Game.Lang.t('state_wait_patient');
      }
      if (b.def.id === 'lumberjack' || b.def.id === 'quarry') {
        if (b.harvestCooldownUntil && now < b.harvestCooldownUntil) {
          const rem = Math.ceil((b.harvestCooldownUntil - now) / 1000);
          return `<span style="color:#ffcc00">${Game.Lang.t('state_pause').replace('{s}', rem)}</span>`;
        }
        return Game.Lang.t('state_search_wood_stone');
      }
      if (b.def.id === 'fisher') {
        if (b.harvestCooldownUntil && now < b.harvestCooldownUntil) {
          const rem = Math.ceil((b.harvestCooldownUntil - now) / 1000);
          return `<span style="color:#ffcc00">${Game.Lang.t('state_pause').replace('{s}', rem)}</span>`;
        }
        return Game.Lang.t('state_search_fish');
      }
      if (b.def.id === 'forsthaus') {
        if (v._forestPlantTimer > 0) {
          const rem = Math.ceil(v._forestPlantTimer / 1000);
          return `<span style="color:#ffcc00">${Game.Lang.t('state_wait_time').replace('{s}', rem)}</span>`;
        }
        return Game.Lang.t('state_search_plant');
      }
      if (b.def.recipe) {
        if (!b.isActive) return `<span style="color:#f0a040">${Game.Lang.t('state_wait_ingredients')}</span>`;
        const rem = Math.max(0, (b.def.recipeInterval || 30) - (b.recipeTimer || 0));
        return Game.Lang.t('state_producing').replace('{s}', Math.ceil(rem));
      }
      if (b.def.generatesResource) {
        const rem = Math.max(0, b.def.generatesInterval - (b.generatesTimer || 0));
        return Game.Lang.t('state_working_time').replace('{s}', Math.ceil(rem));
      }
    }
    return Game.Lang.t('state_working');
  }
  if (v.state === 'idle') return Game.Lang.t('state_idle');
  return v.state || Game.Lang.t('status_unknown');
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
  if (v.isSick) return `<img src="images/krank.webp" style="width:16px;height:16px;object-fit:contain;vertical-align:middle;" title="${Game.Lang.t('state_sick')}">`;
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
    return `<div class="info-item" style="padding-left:8px;font-size:11px;color:#555;">${Game.Lang.t('ui_dead')}</div>`;
  }

  const now = performance.now();
  const workplace = w.workplaceId && vm && Game.state && Game.state.world
    ? Game.state.world.buildings.get(w.workplaceId)
    : null;
  const desc = this.getDetailedWorkerStatus(w, workplace, now);
  const emoji = this.villagerEmojiPath(w, workplace);

  const lvlBadge = (w.job === 'warrior' && w.warriorLevel > 1)
    ? `<span style="background:${w.warriorLevel === 5 ? '#ffcc00' : w.warriorLevel === 4 ? '#d4a017' : '#4A90E2'}; color:#111; font-weight:700; border-radius:4px; padding:0 5px; font-size:10px; margin-left:4px;">${Game.Lang.t('ui_lv')}${w.warriorLevel}</span>`
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
        <div style="display:flex; justify-content:space-between;"><span>${Game.Lang.t('ui_kills')}</span><span style="color:#7ad07a; font-weight:700;">${kills}</span></div>
        <div style="display:flex; justify-content:space-between;"><span>${Game.Lang.t('ui_beer')}</span><span style="color:${hasBeer ? '#d4a017' : '#888'}; font-weight:700;">${hasBeer ? Game.Lang.t('ui_yes') : Game.Lang.t('ui_no')}</span></div>
        <div style="display:flex; justify-content:space-between;"><span>${Game.Lang.t('ui_vs_zombie')}</span><span style="color:#7ad07a; font-weight:700;">${zChance}%</span></div>
        <div style="display:flex; justify-content:space-between;"><span>${Game.Lang.t('ui_vs_raider')}</span><span style="color:#ff8a5c; font-weight:700;">${rChance}%</span></div>
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
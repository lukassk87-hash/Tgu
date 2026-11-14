window.Game = window.Game || {};

Game.UI = Game.UI || {};

Game.UI.computePanelHash = function (b, vm, economy) {
  if (b.isDragon) {
    const d = b;
    let h = 'dragon|' + (d.state || '') + '|' + (d.hp || 0) + '|' + (d.targetBuildingId || 0);
    if (d.state === 'grounded') h += '|' + Math.ceil((d.groundedUntil - performance.now()) / 1000);
    return h;
  }
  if (b.isRaiderBuilding) {
    const rv = Game.state && Game.state.raiderVillage;
    let h = 'raider|' + b.id;
    if (rv) {
      let alive = 0, dead = 0, inAttack = 0;
      for (const w of rv.warriors.values()) {
        if (w.homeBuildingId !== b.id) continue;
        if (w.dead) { dead++; continue; }
        alive++;
        if (w.inAttack) inAttack++;
      }
      h += '|' + alive + '|' + dead + '|' + inAttack;
      if (rv.attackState) h += '|atk' + (rv.attackState.lootClaimed ? 1 : 0);
      if (rv.attackTimerFrozen) h += '|frozen';
    }
    let availableWarriors = 0;
    for (const v of vm.villagers.values()) {
      if (v.job === 'warrior' && v.state !== 'attacking_raiders' && v.state !== 'vfightback' && v.state !== 'vdefend' && v.state !== 'vfighting' && v.state !== 'returning_to_post' && v.state !== 'dragon_attack') availableWarriors++;
    }
    h += '|avail' + availableWarriors;
    if (rv && rv.attackState) h += '|raiderAttack';
    return h;
  }
  if (b.ruined) {
    let h = 'ruin|' + b.id + '|' + (b.isBeingRepaired ? 1 : 0) + '|' + (b.progress || 0);
    if (b.repairCostCache) {
      for (const k in b.repairCostCache) h += k + b.repairCostCache[k];
    }
    return h;
  }
  let h = b.id + '|' + (b.built ? 1 : 0) + '|' + (b.storage || 0) + '|' + (b.progress || 0);
  h += '|p' + (b.paused ? 1 : 0);
  h += '|hc' + Math.floor((b.harvestCooldownUntil || 0) / 1000);
  const fireMgr = Game.state && Game.state.fireManager;
  if (fireMgr && fireMgr.isBuildingBurning(b)) {
    h += '|burning';
    const fire = fireMgr.activeFires.find(f => f.building === b);
    if (fire) {
      const elapsed = performance.now() - fire.startedAt;
      h += '|f' + Math.floor(elapsed / 1000);
      h += '|wd' + (fire.waterDelivered || 0);
    }
  }
  const plagueMgr = Game.state && Game.state.plagueManager;
  if (plagueMgr && plagueMgr.isActive(performance.now())) {
    h += '|plague' + plagueMgr.activeType + Math.ceil((plagueMgr.activeUntil - performance.now()) / 1000);
  }

  if (b.def.id === 'arztpraxis') {
    h += '|ab' + (b.antibioticStorage || 0);
    h += '|cp' + (b.currentPatient || 0);
    h += '|te' + Math.floor((b.treatmentEndsAt || 0) / 1000);
    const sicknessMgr = Game.state && Game.state.sicknessManager;
    if (sicknessMgr) {
      h += '|gq' + sicknessMgr.globalQueue.length;
    }
    if (b.fetchAntibioticWorkerId !== null) h += '|fa' + b.fetchAntibioticWorkerId;
  }

  if (b.def.recipe) {
    h += '|r' + Math.floor(b.recipeTimer || 0);
    for (const k in b.recipeStorage) h += k + b.recipeStorage[k];
  }
  if (b.def.generatesResource) h += '|g' + Math.floor(b.generatesTimer || 0);
  h += '|f' + (b.fishSlots || 0) + '-' + (b.fishConsumeTimer || 0) + '-' + (b.fishRetryTimer || 0) + '-' + (b.fishPendingFetch ? 1 : 0);
  h += '|w' + (b.workerId || 0);
  if (b.workerIds) h += '|wids' + b.workerIds.join(',');
  if (b.warriorSlots) h += '|sl' + b.warriorSlots.map(x => x === null ? 'n' : x).join(',');
  if (b.residents) {
    h += '|res' + b.residents.length;
    for (const rid of b.residents) {
      const w = vm.villagers.get(rid);
      if (w) h += '|rs' + w.id + (w.state || '') + (w.task || '') + (w.job || '') + (w.beerBuff ? 1 : 0) + (w.isSick ? 'S' : '') + 'L' + (w.warriorLevel || 1) + 'K' + (w.kills || 0);
      else h += '|rs?' + rid;
    }
  }
  if (b.workerId !== null) {
    const w = vm.villagers.get(b.workerId);
    if (w && w.isSick) h += '|wsick';
  }
  if (b.workerIds) {
    for (const wid of b.workerIds) {
      const w = vm.villagers.get(wid);
      if (w && w.isSick) h += '|widsick' + wid;
      if (w && b.def.id === 'fireStation') h += '|fr' + wid + '_' + (w._fireStationRole || 'none');
    }
  }
  h += '|beer' + (b.beerStorage || 0);
  if (b.warriorSlots) {
    for (const wid of b.warriorSlots) {
      if (wid === null) continue;
      const w = vm.villagers.get(wid);
      if (w) h += '|wb' + (w.beerBuff ? 1 : 0) + (w.beerBuffTimer || 0) + (w.state || '') + 'L' + (w.warriorLevel || 1) + 'K' + (w.kills || 0);
    }
  }
  if (b.def.isStorage || b.def.id === 'castle') {
    for (const k in economy.res) h += '|e' + k + economy.res[k];
  }
  if (b.def.id === 'forsthaus' && b.workerId !== null) {
    const w = vm.villagers.get(b.workerId);
    if (w) h += '|ft' + Math.ceil((w._forestPlantTimer || 0) / 1000);
  }
  if (b.def.hasArrowStop) {
    h += '|as' + (b.arrowStopThreshold !== undefined ? b.arrowStopThreshold : 500);
    h += '|a' + Math.floor(economy.res.arrows || 0);
  }
  if (b.def.hasArrowTower) {
    h += '|atc' + Math.floor((b.arrowTowerCooldown || 0) / 250);
    h += '|ar' + Math.floor(economy.res.arrows || 0);
    h += '|al' + (b.arrowStorage || 0);
    h += '|fa' + (b.fetchingArrows ? 1 : 0);
  }
  if (b.def.id === 'castle' && b.dragonHits > 0) {
    h += '|dh' + b.dragonHits;
  }
  return h;
};
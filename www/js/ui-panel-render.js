window.Game = window.Game || {};

Game.UI = Game.UI || {};

Game.UI._isInFireStationRange = function (b) {
  if (!b || !b.def) return false;
  const world = Game.state && Game.state.world;
  if (!world) return false;
  const cx = b.x + (b.w || 1) / 2;
  const cy = b.y + (b.h || 1) / 2;
  for (const other of world.buildings.values()) {
    if (!other.built || other.ruined) continue;
    if (other.def.id !== 'fireStation') continue;
    const ox = other.x + (other.w || 1) / 2;
    const oy = other.y + (other.h || 1) / 2;
    const range = other.def.extinguishRadius || 15;
    const dx = cx - ox;
    const dy = cy - oy;
    if (dx * dx + dy * dy <= range * range) return true;
  }
  return false;
};

Game.UI.buildPanelHtml = function (b, vm, economy) {
  if (b.isDragon) return this._buildDragonPanelHtml(b);
  if (b.ruined) return this._buildRuinPanelHtml(b, vm, economy);
  if (b.isRaiderBuilding) return this._buildRaiderPanelHtml(b, vm);
  let html = '';
  const R_ICON = (k) => this.resourceIcon(k);
  const R_NAME = (k) => this.resourceNames[k];
  const inRange = this._isInFireStationRange(b);
  const fireIconStyle = inRange
    ? 'width:22px;height:22px;object-fit:contain;filter:drop-shadow(0 0 4px #4A90E2);'
    : 'width:22px;height:22px;object-fit:contain;opacity:0.4;filter:grayscale(1);position:relative;';
  const strikeStyle = !inRange
    ? 'position:absolute;top:50%;left:0;right:0;height:2px;background:#ff3030;transform:rotate(-45deg);'
    : 'display:none;';
  const rangeLabel = inRange ? Game.Lang.t('panel_in_range') : Game.Lang.t('panel_out_of_range');
  const rangeColor = inRange ? '#7ad07a' : '#ff6b6b';
  html += `<div class="info-section" style="display:flex; align-items:center; gap:8px; padding:6px 8px; background:rgba(0,0,0,0.2); border-radius:6px; margin-bottom:8px;">
    <div style="position:relative; display:inline-block; width:22px; height:22px; flex-shrink:0;">
      <img src="images/feuerwehrmann.webp" style="${fireIconStyle}">
      <div style="${strikeStyle}"></div>
    </div>
    <span style="font-size:12px; color:${rangeColor};">${rangeLabel}</span>
  </div>`;
  const fireMgr = Game.state && Game.state.fireManager;
  if (fireMgr && fireMgr.isBuildingBurning(b)) {
    const fire = fireMgr.activeFires.find(f => f.building === b);
    if (fire) {
      const times = fireMgr._getFireTimes(b);
      const elapsed = performance.now() - fire.startedAt;
      const remainingBurn = Math.max(0, Math.ceil((times.burnTimeMs - elapsed) / 1000));
      const remainingSpread = Math.max(0, Math.ceil((times.spreadTimeMs - elapsed) / 1000));
      const neededWater = fireMgr.getNeededWater(b);
      const deliveredWater = fireMgr.getDeliveredWater(b);
      const missingWater = Math.max(0, neededWater - deliveredWater);
      const spreadText = elapsed < times.spreadTimeMs ? Game.Lang.t('panel_spread_in').replace('{s}', remainingSpread) : Game.Lang.t('panel_spread_done');
      html += `<div class="castle-warning" style="background: rgba(255,48,48,0.2); border-color:#ff3030; color:#ff6b6b; display:flex; flex-direction:column; gap:6px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <img src="images/flamme.webp" alt="" style="width:36px;height:36px;object-fit:contain;flex-shrink:0;">
          <span><b>${Game.Lang.t('panel_burning')}</b><br>${Game.Lang.t('panel_ruin_in').replace('{s}', remainingBurn)} ${spreadText}.</span>
        </div>
        <div style="padding-top:6px; border-top:1px solid rgba(255,107,107,0.3); font-size:12px;">
          <b>${Game.Lang.t('panel_water_to_extinguish')}</b> ${deliveredWater} / ${neededWater} ${Game.Lang.t('panel_missing').replace('{s}', missingWater)}
        </div>
      </div>`;
    }
  }
  const plagueMgr = Game.state && Game.state.plagueManager;
  if (plagueMgr && plagueMgr.isActive(performance.now())) {
    const rem = Math.max(0, Math.ceil((plagueMgr.activeUntil - performance.now()) / 1000));
    if (plagueMgr.activeType === 'pig' && b.def.id === 'pigFarm') {
      html += `<div class="castle-warning" style="background: rgba(168,111,51,0.2); border-color:#a86f33; color:#e0b070; display:flex; align-items:center; gap:10px;"><img src="images/schwein-krank.webp" alt="" style="width:36px;height:36px;object-fit:contain;flex-shrink:0;"><span><b>${Game.Lang.t('panel_pig_plague')}</b><br>${Game.Lang.t('panel_prod_stopped').replace('{s}', rem)}</span></div>`;
    } else if (plagueMgr.activeType === 'rat' && b.def.id === 'bakery') {
      html += `<div class="castle-warning" style="background: rgba(107,107,107,0.2); border-color:#6b6b6b; color:#c0c0c0; display:flex; align-items:center; gap:10px;"><img src="images/ratte.webp" alt="" style="width:36px;height:36px;object-fit:contain;flex-shrink:0;"><span><b>${Game.Lang.t('panel_rat_plague')}</b><br>${Game.Lang.t('panel_prod_halved').replace('{s}', rem)}</span></div>`;
    } else if (plagueMgr.activeType === 'drought' && b.def.id === 'farm') {
      html += `<div class="castle-warning" style="background: rgba(230,168,23,0.2); border-color:#e6a817; color:#ffcc00; display:flex; align-items:center; gap:10px;"><img src="images/sonne.webp" alt="" style="width:36px;height:36px;object-fit:contain;flex-shrink:0;"><span><b>${Game.Lang.t('panel_drought')}</b><br>${Game.Lang.t('panel_no_grain').replace('{s}', rem)}</span></div>`;
    }
  }
  if (!b.built) {
    const progress = Math.min(100, Math.floor((b.progress / b.buildTime) * 100));
    html += `<div class="info-row"><span class="label">${Game.Lang.t('panel_status')}</span><span class="value" style="color:#fa0">${Game.Lang.t('panel_under_construction')}</span></div>`;
    html += `<div class="info-row"><span class="label">${Game.Lang.t('panel_progress')}</span><span class="value">${progress}%</span></div>`;
    html += `<div class="progress-bar"><div class="progress-bar-fill" style="width:${progress}%"></div></div>`;
    return html;
  }
  if (b.def.id === 'castle') {
  html += `<div class="info-section" style="margin-bottom: 12px;">
    <button id="saveGameBtn" style="width:100%; padding:10px; background:#3b6e3b; color:#fff; border:none; border-radius:6px; cursor:pointer; font-weight:600; font-size:15px; margin-bottom: 8px;">${Game.Lang.t('panel_save_game')}</button>
    <button id="tutorialBtnCastle" style="width:100%; padding:10px; background:#8a6a3a; color:#fff; border:none; border-radius:6px; cursor:pointer; font-weight:600; font-size:15px; margin-bottom: 8px;">📖 ${Game.Lang.t('tutorial_button')}</button>
    <button id="centerCastleBtn" class="camera-jump-btn">${Game.Lang.t('panel_jump_to_castle')}</button>
    <button id="repairJobsBtn" class="repair-jobs-btn">${Game.Lang.t('panel_stuck')}</button>
    <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:13px; color:#ccc; padding: 4px 0; margin-top: 8px;">
      <input type="checkbox" id="autosaveCheckbox" ${Game.state.autosaveEnabled ? 'checked' : ''} style="width:auto; margin:0; accent-color:#3b6e3b;">
      ${Game.Lang.t('panel_autosave')}
    </label>
  </div>`;
    if (b.dragonHits > 0) {
      const remaining = (b.def.dragonHits || 3) - b.dragonHits;
      html += `<div class="castle-warning">${Game.Lang.t('panel_dragon_damage').replace('{x}', b.dragonHits).replace('{y}', b.def.dragonHits || 3).replace('{z}', remaining)}</div>`;
    }
  }
  if (b.def.id === 'fireStation') {
    const maxW = b.def.maxWaterStorage || 250;
    const waterPct = Math.min(100, Math.floor(((b.storage || 0) / maxW) * 100));
    const maxWorkers = b.def.maxWorkers || 2;

    let fighterV = null;
    let refillV = null;
    if (b.workerIds) {
      for (const wid of b.workerIds) {
        const w = vm.villagers.get(wid);
        if (!w) continue;
        if (w._fireStationRole === 'firefighter') fighterV = w;
        else if (w._fireStationRole === 'refill') refillV = w;
      }
    }

    const fighterStatus = fighterV ? fighterV.name : `<span style="color:#888">${Game.Lang.t('panel_no_fighter')}</span>`;
    const refillStatus = refillV ? refillV.name : `<span style="color:#888">${Game.Lang.t('panel_no_refill')}</span>`;

    html += `<div class="info-section" style="background:#2a2d31; padding:10px; border-radius:8px; border:1px solid #444; margin-top:6px;">
      <h4 style="color:#4A90E2; margin-bottom:6px; display:flex; align-items:center; gap:6px;"><img src="images/feuerwehr.webp" style="width:18px;height:18px;object-fit:contain;"> ${Game.Lang.t('panel_fire_station')}</h4>
      <div class="info-row"><span class="label">${Game.Lang.t('panel_water')}</span><span class="value">${b.storage || 0} / ${maxW}</span></div>
      <div class="progress-bar"><div class="progress-bar-fill" style="width:${waterPct}%;background:#4A90E2"></div></div>
      <div class="info-row" style="margin-top:6px;"><span class="label">${Game.Lang.t('panel_radius')}</span><span class="value">${b.def.extinguishRadius || 15} ${Game.Lang.t('panel_tiles')}</span></div>
      <div class="info-row"><span class="label">${Game.Lang.t('panel_water_per_trip')}</span><span class="value">${b.def.waterCarryAmount || 5}</span></div>
    </div>`;

    html += `<div class="info-section" style="background:#2a2d31; padding:10px; border-radius:8px; border:1px solid #444; margin-top:6px;">
      <h4 style="color:#ff8a5c; margin-bottom:6px; display:flex; align-items:center; gap:6px;"><img src="images/feuerwehrmann.webp" style="width:18px;height:18px;object-fit:contain;"> ${Game.Lang.t('panel_personnel')} (${(b.workerIds ? b.workerIds.length : 0)} / ${maxWorkers})</h4>
      <div class="info-row">
        <span class="label">${Game.Lang.t('panel_fighter')}</span>
        <span class="value" style="color:${fighterV ? '#7ad07a' : '#888'}">${fighterStatus}</span>
      </div>
      <div class="info-row">
        <span class="label">${Game.Lang.t('panel_refill')}</span>
        <span class="value" style="color:${refillV ? '#7ad07a' : '#888'}">${refillStatus}</span>
      </div>
    </div>`;

    if (fighterV || refillV) {
      html += `<div class="info-section"><h4>${Game.Lang.t('panel_residents')}</h4>`;
      if (fighterV) {
        html += `<div style="margin-bottom:6px;"><div style="font-size:11px; color:#ff8a5c; font-weight:700; margin-bottom:2px;">${Game.Lang.t('panel_fighter')}</div>${this._villagerRowHtml(fighterV, vm)}</div>`;
      }
      if (refillV) {
        html += `<div><div style="font-size:11px; color:#4A90E2; font-weight:700; margin-bottom:2px;">${Game.Lang.t('panel_refill')}</div>${this._villagerRowHtml(refillV, vm)}</div>`;
      }
      html += `</div>`;
    }
  }

  if (b.def.id === 'arztpraxis') {
    const maxAb = b.def.maxAntibioticStorage || 3;
    const abPct = Math.min(100, Math.floor(((b.antibioticStorage || 0) / maxAb) * 100));
    const doctor = b.workerId !== null ? vm.villagers.get(b.workerId) : null;
    const currentPatient = b.currentPatient !== null ? vm.villagers.get(b.currentPatient) : null;
    const treatmentRemaining = b.treatmentEndsAt > 0 ? Math.max(0, Math.ceil((b.treatmentEndsAt - performance.now()) / 1000)) : 0;

    const sicknessMgr = Game.state && Game.state.sicknessManager;
    const globalQueue = sicknessMgr ? sicknessMgr.globalQueue : [];

    html += `<div class="info-section" style="background:#2a2d31; padding:10px; border-radius:8px; border:1px solid #444; margin-top:6px;">
      <h4 style="color:#7ad07a; margin-bottom:6px; display:flex; align-items:center; gap:6px;"><img src="images/arztpraxis.webp" style="width:18px;height:18px;object-fit:contain;"> ${Game.Lang.t('panel_doctor_office')}</h4>
      <div class="info-row"><span class="label">${Game.Lang.t('panel_doctor')}</span><span class="value" style="color:${doctor ? '#7ad07a' : '#888'}">${doctor ? doctor.name : Game.Lang.t('panel_no_doctor')}</span></div>
      <div class="info-row"><span class="label">${Game.Lang.t('panel_antibiotics')}</span><span class="value">${b.antibioticStorage || 0} / ${maxAb}</span></div>
      <div class="progress-bar"><div class="progress-bar-fill" style="width:${abPct}%;background:#7ad07a"></div></div>
      <div class="info-row" style="margin-top:6px;"><span class="label">${Game.Lang.t('panel_treatment_time')}</span><span class="value">${((b.def.treatmentTimeMs || 5000) / 1000).toFixed(1)}s</span></div>
      <div class="info-row"><span class="label">${Game.Lang.t('panel_waiting_global')}</span><span class="value" style="color:${globalQueue.length > 0 ? '#ffcc00' : '#888'}">${globalQueue.length}</span></div>
    </div>`;

    if (currentPatient) {
      html += `<div class="info-section" style="background:rgba(74,144,226,0.15); padding:10px; border-radius:8px; border:1px solid #4A90E2; margin-top:6px;">
        <h4 style="color:#4A90E2; margin-bottom:6px;">${Game.Lang.t('panel_in_treatment')}</h4>
        <div class="info-row"><span class="label">${Game.Lang.t('panel_patient')}</span><span class="value">${currentPatient.name}</span></div>
        <div class="info-row"><span class="label">${Game.Lang.t('panel_remaining')}</span><span class="value" style="color:#4A90E2;">${treatmentRemaining}s</span></div>
      </div>`;
    } else {
      html += `<div class="info-section" style="background:rgba(80,80,80,0.15); padding:10px; border-radius:8px; border:1px solid #555; margin-top:6px;">
        <h4 style="color:#aaa; margin-bottom:6px;">${Game.Lang.t('panel_currently')}</h4>
        <div class="info-row"><span class="label" style="color:#aaa;">${Game.Lang.t('panel_no_patient')}</span></div>
      </div>`;
    }

    if (globalQueue.length > 0) {
      html += `<div class="info-section" style="margin-top:6px;">
        <h4 style="color:#ffcc00; margin-bottom:6px;">${Game.Lang.t('panel_global_queue')} (${globalQueue.length})</h4>
        <div style="font-size:11px; color:#888; margin-bottom:6px; font-style:italic;">${Game.Lang.t('panel_patients_waiting')}</div>`;
      for (const pid of globalQueue) {
        const p = vm.villagers.get(pid);
        html += this._villagerRowHtml(p, vm);
      }
      html += `</div>`;
    }

    if (doctor) {
      html += `<div class="info-section"><h4>${Game.Lang.t('panel_doctor')}</h4>
        ${this._villagerRowHtml(doctor, vm)}
      </div>`;
    }
  }

  const isMilitaryBuilding = b.warriorSlots && b.warriorSlots.length > 0;
  if (isMilitaryBuilding) {
    let totalWarriors = 0;
    for (const wid of b.warriorSlots) if (wid !== null) totalWarriors++;

    html += `<div class="info-section" style="background:#2a2d31; padding:10px; border-radius:8px; border:1px solid #444; margin-top:6px;">
      <h4 style="color:#ff8a5c; margin-bottom:6px; display:flex; align-items:center; gap:6px;">
        <img src="images/villager-krieger-rot.webp" style="width:18px;height:18px;object-fit:contain;"> ${Game.Lang.t('panel_military')}
      </h4>
      <div class="info-row"><span class="label">${Game.Lang.t('panel_warriors')}</span><span class="value">${totalWarriors} / ${b.warriorSlots.length}</span></div>
    </div>`;

    for (let i = 0; i < b.warriorSlots.length; i++) {
      const wid = b.warriorSlots[i];
      if (wid === null) continue;
      const w = vm.villagers.get(wid);
      html += this._villagerRowHtml(w, vm, { showWarriorStats: true });
    }
  }

  let outputResource = null;
  if (b.def.produces) outputResource = b.def.produces;
  else if (b.def.recipe) outputResource = b.def.recipe.output;
  else if (b.def.generatesResource) outputResource = b.def.generatesResource;
  else if (b.def.id === 'lumberjack') outputResource = 'wood';
  else if (b.def.id === 'quarry') outputResource = 'stone';
  else if (b.def.id === 'fisher') outputResource = 'fish';

  if (outputResource) {
    const transportPrios = (Game.state && Game.state.resourceTransportPriorities) ? Game.state.resourceTransportPriorities : [];
    const prioIndex = transportPrios.indexOf(outputResource);
    if (prioIndex !== -1) {
      const prioDisplay = prioIndex + 1;
      let prioColor = '#7ad07a';
      if (prioDisplay > 8) prioColor = '#ffcc00';
      if (prioDisplay > 12) prioColor = '#ff6b6b';

      html += `<div class="info-section" style="background:#2a2d31; padding:10px; border-radius:8px; border:1px solid #444; margin-top:6px;">
        <h4 style="color:#4A90E2; margin-bottom:6px; display:flex; align-items:center; gap:6px;">
          <img src="images/icon_bretter.webp" style="width:18px;height:18px;object-fit:contain;filter:hue-rotate(180deg);"> ${Game.Lang.t('panel_transport')}
        </h4>
        <div class="info-row">
          <span class="label">${Game.Lang.t('panel_resource')}</span>
          <span class="value">${R_ICON(outputResource)} ${R_NAME(outputResource)}</span>
        </div>
        <div class="info-row">
          <span class="label">${Game.Lang.t('panel_transport_prio')}</span>
          <span class="value" style="color:${prioColor}; font-weight:bold;">${prioDisplay} / ${transportPrios.length}</span>
        </div>
        <div style="font-size:11px; color:#888; margin-top:4px; font-style:italic;">
          ${prioDisplay <= 3 ? Game.Lang.t('panel_prio_high') : prioDisplay <= 8 ? Game.Lang.t('panel_prio_med') : Game.Lang.t('panel_prio_low')}
        </div>
      </div>`;
    }
  }

  if (b.def.id !== 'castle') {
    if (b.paused) {
      html += `<div class="info-section"><button id="resumeBuildingBtn" style="width:100%; padding:10px; background:#3b6e3b; color:#fff; border:none; border-radius:6px; cursor:pointer; font-weight:600; font-size:14px; display:flex; align-items:center; justify-content:center; gap:6px;">${Game.Lang.t('panel_resume_building')}</button></div>`;
    } else {
      html += `<div class="info-section"><button id="pauseBuildingBtn" style="width:100%; padding:10px; background:#6e3b3b; color:#fff; border:none; border-radius:6px; cursor:pointer; font-weight:600; font-size:14px; display:flex; align-items:center; justify-content:center; gap:6px;">${Game.Lang.t('panel_pause_building')}</button></div>`;
    }
  }

  if (b.def.hasArrowStop) {
    const threshold = b.arrowStopThreshold !== undefined ? b.arrowStopThreshold : 500;
    const current = Math.floor(economy.res.arrows || 0);
    const stopped = current >= threshold;
    html += `<div class="info-section" style="background:#2a2d31; padding:10px; border-radius:8px; border:1px solid #444; margin-top:6px;">
      <h4 style="color:#ffcc00; margin-bottom:6px; display:flex; align-items:center; gap:6px;"><img src="images/icon_pfeil.webp" style="width:18px;height:18px;object-fit:contain;"> ${Game.Lang.t('panel_arrow_stop')}</h4>
      <div class="info-row" style="margin-bottom:6px;"><span class="label">${Game.Lang.t('panel_current_global')}</span><span class="value" style="color:${stopped ? '#ff6b6b' : '#7ad07a'}">${current}</span></div>
      <label style="display:flex; flex-direction:column; gap:4px; font-size:12px; color:#aaa;">${Game.Lang.t('panel_stop_at')}<input type="number" id="arrowStopInput" min="0" step="10" value="${threshold}" style="background:#1e1f22; color:#eee; border:1px solid #555; border-radius:6px; padding:6px 8px; font-size:14px; width:100%;" /></label>
      <div class="info-row" style="margin-top:6px;"><span class="label">${Game.Lang.t('panel_status')}</span><span class="value" style="color:${stopped ? '#ff6b6b' : '#7ad07a'}">${stopped ? Game.Lang.t('panel_stopped') : Game.Lang.t('panel_producing')}</span></div>
    </div>`;
  }
  if (b.def.hasArrowTower) {
    const range = b.def.attackRange || 10;
    const baseHit = b.def.hitChanceBase ?? 1.00;
    const perTile = b.def.hitChancePerTile ?? 0.10;
    const minHit = b.def.hitChanceMin ?? 0.10;
    const fireInterval = (b.def.fireInterval || 1000) / 1000;
    const localArrows = b.arrowStorage || 0;
    const maxLocal = b.maxArrowStorage || 20;
    const globalArrows = Math.floor(economy.res.arrows || 0);
    const hasWorker = b.workerId !== null;
    const fetching = !!b.fetchingArrows;
    const hitAt = (d) => Math.round(Math.max(minHit, baseHit - d * perTile) * 100);
    const interval = b.def.fireInterval || 1000;
    const cooldownMs = Math.max(0, b.arrowTowerCooldown || 0);
    const readyPct = Math.min(100, Math.max(0, 100 - (cooldownMs / interval) * 100));
    const localPct = Math.min(100, Math.floor((localArrows / maxLocal) * 100));
    let statusColor = '#7ad07a';
    let statusText = Game.Lang.t('panel_ready');
    if (!hasWorker) { statusColor = '#888'; statusText = Game.Lang.t('panel_no_archer'); }
    else if (b.paused) { statusColor = '#f0a040'; statusText = Game.Lang.t('panel_paused'); }
    else if (fetching) { statusColor = '#4A90E2'; statusText = Game.Lang.t('panel_fetching_supplies'); }
    else if (localArrows < 1) { statusColor = '#ff6b6b'; statusText = Game.Lang.t('panel_no_arrows'); }
    else if (cooldownMs > 0) { statusColor = '#4A90E2'; statusText = Game.Lang.t('panel_reloading'); }
    const nextShotText = cooldownMs <= 0 ? Game.Lang.t('panel_ready') : `${(cooldownMs / 1000).toFixed(1)}s`;
    const nextShotColor = cooldownMs <= 0 ? '#7ad07a' : '#ffcc00';
    html += `<div class="info-section" style="background:#2a2d31; padding:10px; border-radius:8px; border:1px solid #444; margin-top:6px;">
      <h4 style="color:#4A90E2; margin-bottom:6px; display:flex; align-items:center; gap:6px;"><img src="images/bogenschussanlage.webp" style="width:18px;height:18px;object-fit:contain;"> ${Game.Lang.t('panel_defense')}</h4>
      <div class="info-row"><span class="label">${Game.Lang.t('panel_status')}</span><span class="value" style="color:${statusColor}">${statusText}</span></div>
      <div class="info-row"><span class="label">${Game.Lang.t('panel_range')}</span><span class="value">${range} ${Game.Lang.t('panel_tiles')}</span></div>
      <div class="info-row"><span class="label">${Game.Lang.t('panel_fire_rate')}</span><span class="value">1 / ${fireInterval}s</span></div>
      <div class="info-section" style="border-top:1px solid #3a3c40; padding-top:6px; margin-top:6px;">
        <h4 style="font-size:11px; color:#aaa; margin-bottom:4px;">${Game.Lang.t('panel_hit_chance')}</h4>
        <div class="info-row"><span class="label">0 ${Game.Lang.t('panel_tiles')}</span><span class="value">${hitAt(0)}%</span></div>
        <div class="info-row"><span class="label">${Math.floor(range / 2)} ${Game.Lang.t('panel_tiles')}</span><span class="value">${hitAt(range / 2)}%</span></div>
        <div class="info-row"><span class="label">${range} ${Game.Lang.t('panel_tiles')}</span><span class="value">${hitAt(range)}%</span></div>
        <div class="info-row" style="color:#ff8a5c; font-weight:600; margin-top:4px;"><span class="label" style="color:#ff8a5c;">${Game.Lang.t('panel_dragon_fixed')}</span><span class="value">75%</span></div>
      </div>
      <div class="info-section" style="border-top:1px solid #3a3c40; padding-top:6px; margin-top:6px;">
        <h4 style="font-size:11px; color:#aaa; margin-bottom:4px; display:flex; align-items:center; gap:4px;"><img src="images/icon_pfeil.webp" style="width:14px;height:14px;object-fit:contain;"> ${Game.Lang.t('panel_arrow_storage')}</h4>
        <div class="info-row"><span class="label">${Game.Lang.t('panel_stock')}</span><span class="value" style="color:${localArrows > 0 ? '#7ad07a' : '#ff6b6b'}">${localArrows} / ${maxLocal}</span></div>
        <div class="progress-bar"><div class="progress-bar-fill" style="width:${localPct}%;background:#4A90E2"></div></div>
        <div class="info-row" style="margin-top:4px;"><span class="label">${Game.Lang.t('panel_global_storage')}</span><span class="value">${globalArrows}</span></div>
        ${fetching ? `<div class="info-row"><span class="label">${Game.Lang.t('panel_status')}</span><span class="value" style="color:#4A90E2">${Game.Lang.t('panel_fetching_supplies')}</span></div>` : ''}
      </div>
      <div class="info-row" style="margin-top:6px;"><span class="label">${Game.Lang.t('panel_next_shot')}</span><span class="value" style="color:${nextShotColor}">${nextShotText}</span></div>
      <div class="progress-bar"><div class="progress-bar-fill" style="width:${readyPct}%;background:#4A90E2"></div></div>
    </div>`;
  }
  if (b.def.isStorage || b.def.id === 'castle') {
    html += `<div class="info-section"><h4>${Game.Lang.t('panel_resources_total')}</h4>`;
    for (const key of ['wood', 'stone', 'grain', 'fish', 'water', 'beer', 'woodPlank', 'flour', 'bread', 'arrows', 'feed', 'pig', 'meat', 'dragonBone', 'raiderHerb', 'antibiotics']) {
      const amount = Math.floor(economy.res[key] || 0);
      html += `<div class="info-row"><span class="label">${R_ICON(key)} ${R_NAME(key)}</span><span class="value">${amount}</span></div>`;
    }
    html += `</div>`;
  }
  if (b.def.id === 'forsthaus') {
    html += `<div class="info-section"><h4 style="display:flex; align-items:center; gap:6px;"><img src="images/forsthaus.webp" style="width:18px;height:18px;object-fit:contain;"> ${Game.Lang.t('panel_forester')}</h4>`;
    const w = b.workerId !== null ? vm.villagers.get(b.workerId) : null;
    if (w) {
      const now = performance.now();
      const statusText = this.getDetailedWorkerStatus(w, b, now);
      const fishOk = b.fishSlots > 0;
      const waitBase = fishOk ? 12.5 : 50;
      html += `<div class="info-row"><span class="label">${Game.Lang.t('panel_current_status')}</span><span class="value" style="color:#7ad07a">${statusText}</span></div>`;
      html += `<div class="info-row"><span class="label">${Game.Lang.t('panel_wait_plant')}</span><span class="value" style="color:${fishOk ? '#7ad07a' : '#f0a040'}">${waitBase}s ${fishOk ? '' : Game.Lang.t('panel_no_fish')}</span></div>`;
    } else {
      html += `<div class="info-row"><span class="label">${Game.Lang.t('panel_status')}</span><span class="value" style="color:#888">${Game.Lang.t('panel_no_forester')}</span></div>`;
    }
    html += `</div>`;
  }
  if (b.def.globalResource && b.def.id !== 'forsthaus') {
    const res = b.def.globalResource;
    html += `<div class="info-section"><h4>${Game.Lang.t('panel_output_storage')}</h4><div class="info-row"><span class="label">${R_ICON(res)} ${R_NAME(res)}</span><span class="value">${b.storage} / ${b.maxCapacity}</span></div>`;
    if (b.maxCapacity > 0) {
      const pct = Math.min(100, Math.floor((b.storage / b.maxCapacity) * 100));
      html += `<div class="progress-bar"><div class="progress-bar-fill" style="width:${pct}%"></div></div>`;
    }
    html += `</div>`;
  }
  if (b.def.generatesResource) {
    html += `<div class="info-section"><h4>${Game.Lang.t('panel_production')}</h4><div class="info-row"><span class="label">${R_ICON(b.def.generatesResource)} ${R_NAME(b.def.generatesResource)}</span><span class="value">${b.storage} / ${b.maxCapacity}</span></div>`;
    const pct = b.maxCapacity > 0 ? Math.min(100, Math.floor((b.storage / b.maxCapacity) * 100)) : 0;
    html += `<div class="progress-bar"><div class="progress-bar-fill" style="width:${pct}%"></div></div>`;
    const timeLeft = Math.max(0, b.def.generatesInterval - (b.generatesTimer || 0));
    html += `<div class="info-row"><span class="label">${Game.Lang.t('panel_next_load')}</span><span class="value">${Math.ceil(timeLeft)}s</span></div>`;
    html += `<div class="info-row"><span class="label">${Game.Lang.t('panel_amount')}</span><span class="value">+${b.def.generatesAmount} / ${b.def.generatesInterval}s</span></div></div>`;
  }
  if (b.def.consumesFish) {
    html += `<div class="info-section"><h4 style="display:flex; align-items:center; gap:6px;"><img src="images/icon_fisch.webp" style="width:18px;height:18px;object-fit:contain;"> ${Game.Lang.t('panel_fish_slots')}</h4>`;
    const slots = b.fishSlots || 0;
    let icons = '';
    for (let i = 0; i < 3; i++) {
      if (i < slots) icons += `<img src="images/icon_fisch.webp" style="width:16px;height:16px;object-fit:contain;margin-right:2px;">`;
      else icons += `<span style="display:inline-block;width:16px;height:16px;background:#444;border-radius:50%;margin-right:2px;"></span>`;
    }
    const eff = slots > 0 ? 100 : 25;
    html += `<div class="info-row"><span class="label">${Game.Lang.t('panel_slots')}</span><span class="value" style="display:flex; align-items:center;">${icons}</span></div>`;
    html += `<div class="info-row"><span class="label">${Game.Lang.t('panel_efficiency')}</span><span class="value" style="color:${eff === 100 ? '#7ad07a' : '#f0a040'}">${eff}%</span></div>`;
    const secsLeft = Math.max(0, b.fishConsumeTimer || 0);
    html += `<div class="info-row"><span class="label">${Game.Lang.t('panel_next_consumption')}</span><span class="value">${secsLeft}s</span></div>`;
    if (b.fishPendingFetch) html += `<div class="info-row"><span class="label">${Game.Lang.t('panel_status')}</span><span class="value" style="color:#4A90E2">${Game.Lang.t('panel_fetching_fish')}</span></div>`;
    else if (slots === 0 && b.fishRetryTimer < 0) html += `<div class="info-row"><span class="label">${Game.Lang.t('panel_next_try')}</span><span class="value">${-b.fishRetryTimer}s</span></div>`;
    html += `</div>`;
  }
  if (b.def.recipe) {
    html += `<div class="info-section"><h4>${Game.Lang.t('panel_ingredient_storage')}</h4>`;
    const maxS = b.def.recipeMaxStorage || {};
    for (const k in b.def.recipe.inputs) {
      const stored = b.recipeStorage[k] || 0;
      const max = maxS[k] || 10;
      html += `<div class="info-row"><span class="label">${R_ICON(k)} ${R_NAME(k)}</span><span class="value">${stored} / ${max}</span></div>`;
      const pct = Math.min(100, Math.floor((stored / max) * 100));
      html += `<div class="progress-bar"><div class="progress-bar-fill" style="width:${pct}%"></div></div>`;
    }
    html += `</div>`;
    html += `<div class="info-section"><h4>${Game.Lang.t('panel_recipe').replace('{s}', b.def.recipeInterval || 30)}</h4>`;
    const inputParts = [];
    for (const k in b.def.recipe.inputs) inputParts.push(`${b.def.recipe.inputs[k]} ${R_NAME(k)}`);
    html += `<div class="info-row"><span class="label">${Game.Lang.t('panel_consumption')}</span><span class="value">${inputParts.join(' + ')}</span></div>`;
    let recipeOutputText = `${b.def.recipe.amount} ${R_NAME(b.def.recipe.output)}`;
    if (plagueMgr && plagueMgr.isActive(performance.now()) && plagueMgr.activeType === 'rat' && b.def.id === 'bakery') {
      recipeOutputText = `<span style="color:#f0a040; text-decoration:line-through;">${b.def.recipe.amount}</span> ${b.def.recipe.amount * 0.5} ${R_NAME(b.def.recipe.output)}`;
    }
    html += `<div class="info-row"><span class="label">${Game.Lang.t('panel_produces')}</span><span class="value">${recipeOutputText}</span></div>`;

    if (b.workerId !== null) {
      const worker = vm.villagers.get(b.workerId);
      if (worker && worker.isSick) {
        html += `<div class="info-row" style="background:rgba(168,50,50,0.2); border:1px solid #a83232; border-radius:4px; padding:4px 8px; margin-top:4px;">
          <span class="label" style="color:#ff8080; display:flex; align-items:center; gap:4px;">
            <img src="images/krank.webp" style="width:16px;height:16px;object-fit:contain;"> ${Game.Lang.t('panel_worker_sick')}
          </span>
          <span class="value" style="color:#ff8080;">${Game.Lang.t('panel_wait_x3')}</span>
        </div>`;
      }
    }

    const timerPct = Math.min(100, Math.floor(((b.recipeTimer || 0) / (b.def.recipeInterval || 30)) * 100));
    html += `<div class="info-row"><span class="label">${Game.Lang.t('panel_progress')}</span><span class="value">${timerPct}%</span></div>`;
    html += `<div class="progress-bar"><div class="progress-bar-fill" style="width:${timerPct}%"></div></div>`;
    html += `</div>`;
  }
  if (b.def.produces || b.def.recipe) {
    const outputKey = b.def.produces || b.def.recipe.output;
    html += `<div class="info-section"><h4>${Game.Lang.t('panel_output_storage')}</h4><div class="info-row"><span class="label">${R_ICON(outputKey)} ${R_NAME(outputKey)}</span><span class="value">${b.storage} / ${b.maxCapacity}</span></div>`;
    if (b.maxCapacity > 0) {
      const pct = Math.min(100, Math.floor((b.storage / b.maxCapacity) * 100));
      html += `<div class="progress-bar"><div class="progress-bar-fill" style="width:${pct}%"></div></div>`;
    }
    html += `</div>`;
  }
  if (b.def.beerSlots && b.def.beerSlots > 0) {
    html += `<div class="info-section"><h4 style="display:flex; align-items:center; gap:6px;"><img src="images/icon_bier.webp" style="width:18px;height:18px;object-fit:contain;"> ${Game.Lang.t('panel_beer_storage')}</h4>`;
    const beerPct = b.maxBeer > 0 ? Math.floor((b.beerStorage / b.maxBeer) * 100) : 0;
    html += `<div class="info-row"><span class="label">${Game.Lang.t('panel_beer')}</span><span class="value">${b.beerStorage} / ${b.maxBeer}</span></div>`;
    html += `<div class="progress-bar"><div class="progress-bar-fill" style="width:${beerPct}%;background:#d4a017"></div></div></div>`;
  }
  if (b.def.id === 'house') {
    html += `<div class="info-section"><h4 style="display:flex; align-items:center; gap:6px;"><img src="images/haus-rot.webp" style="width:18px;height:18px;object-fit:contain;"> ${Game.Lang.t('panel_residents_house')}</h4>`;
    
    const maxRes = b.def.maxResidents || 5;
    const allResidents = [];
    for (const v of vm.villagers.values()) {
      if (v.homeId === b.id) {
        allResidents.push(v);
      }
    }
    
    const activeCount = allResidents.length;
    
    html += `<div class="info-row"><span class="label">${Game.Lang.t('panel_residents_house')}</span><span class="value">${activeCount} / ${maxRes}</span></div>`;
    
    const spawnTime = 30 - (b.spawnTimer || 0);
    if (activeCount < maxRes) {
      html += `<div class="info-row"><span class="label">${Game.Lang.t('panel_next_resident')}</span><span class="value" style="color:#7ad07a">${Math.max(0, spawnTime)}s</span></div>`;
    }
    
    for (const w of allResidents) {
      html += this._villagerRowHtml(w, vm);
    }
    
    html += `</div>`;
  }

  const hasAnyWorker = 
    (b.workerId !== null) || 
    (b.workerIds && b.workerIds.some(id => id !== null));
    
  const isSpecialBuilding = 
    b.def.id === 'house' || 
    b.def.id === 'castle' || 
    b.def.id === 'fireStation' || 
    b.def.id === 'arztpraxis';

  if (hasAnyWorker && !isSpecialBuilding && b.warriorSlots?.length === 0) {
    html += `<div class="info-section"><h4 style="display:flex; align-items:center; gap:6px;"><img src="${b.def.asset || 'images/villager-idle-rot.webp'}" style="width:18px;height:18px;object-fit:contain;"> ${Game.Lang.t('panel_residents_header')}</h4>`;
    
    if (b.workerId !== null) {
      const w = vm.villagers.get(b.workerId);
      if (w) {
        html += this._villagerRowHtml(w, vm);
      }
    }
    
    if (b.workerIds) {
      for (const wid of b.workerIds) {
        if (wid === null) continue;
        const w = vm.villagers.get(wid);
        if (w) {
          html += this._villagerRowHtml(w, vm);
        }
      }
    }
    
    html += `</div>`;
  }

  if (b.def.expandsBorder || b.def.id === 'castle') {
    const radius = b.def.expandsBorder || 10;
    html += `<div class="info-section"><h4>${Game.Lang.t('panel_effect_radius')}</h4><div class="info-row"><span class="label">${Game.Lang.t('panel_radius_val')}</span><span class="value">${radius} ${Game.Lang.t('panel_tiles')}</span></div></div>`;
  }
  return html;
};

Game.UI._buildDragonPanelHtml = function (d) {
  let html = '';
  const statusMap = { flying: Game.Lang.t('dragon_flying'), attacking: Game.Lang.t('dragon_attacking'), grounded: Game.Lang.t('dragon_grounded') };
  const stateClass = { flying: 'dragon-status-flying', attacking: 'dragon-status-attack', grounded: 'dragon-status-grounded' };
  const hp = d.hp || 0;
  const maxHp = d.maxHp || 10;
  const hpPct = Math.min(100, Math.floor((hp / maxHp) * 100));
  html += `<div class="info-section">
    <div class="info-row"><span class="label">${Game.Lang.t('panel_status')}</span><span class="value ${stateClass[d.state] || ''}">${statusMap[d.state] || d.state}</span></div>
    <div class="info-row"><span class="label">${Game.Lang.t('dragon_hits')}</span><span class="value">${hp} / ${maxHp}</span></div>
    <div class="dragon-hp-bar"><div class="dragon-hp-fill" style="width:${hpPct}%"></div></div>
  </div>`;
  if (d.state === 'grounded') {
    const remaining = Math.max(0, Math.ceil((d.groundedUntil - performance.now()) / 1000));
    html += `<div class="info-section"><h4>${Game.Lang.t('dragon_ground_timer')}</h4><div class="info-row"><span class="label">${Game.Lang.t('dragon_remaining')}</span><span class="value" style="color:${remaining <= 3 ? '#ff3030' : '#ffcc00'}">${remaining}s</span></div><div class="progress-bar"><div class="progress-bar-fill" style="width:${Math.min(100, (remaining / 10) * 100)}%;background:#ff8a5c"></div></div><div style="font-size:11px; color:#ff8a5c; margin-top:6px;">${Game.Lang.t('dragon_warrior_req')}</div></div>`;
  }
  if (d.targetBuildingId) {
    const target = Game.state && Game.state.world ? Game.state.world.buildings.get(d.targetBuildingId) : null;
    if (target) {
      html += `<div class="info-section"><h4>${Game.Lang.t('dragon_target')}</h4><div class="info-row"><span class="label">${Game.Lang.t('dragon_building')}</span><span class="value">${target.def.name}</span></div><div class="info-row"><span class="label">${Game.Lang.t('dragon_position')}</span><span class="value">${target.x}, ${target.y}</span></div></div>`;
    }
  }
  if (d.castleHits > 0) {
    html += `<div class="castle-warning">${Game.Lang.t('dragon_castle_hits').replace('{x}', d.castleHits)}</div>`;
  }
  return html;
};

Game.UI._buildRuinPanelHtml = function (b, vm, economy) {
  const R_ICON = (k) => this.resourceIcon(k);
  const R_NAME = (k) => this.resourceNames[k];
  let html = '';
  html += `<div class="info-section"><div class="info-row"><span class="label">${Game.Lang.t('panel_status')}</span><span class="value" style="color:#ff6b6b">${Game.Lang.t('ruin_destroyed')}</span></div><div class="info-row"><span class="label">${Game.Lang.t('ruin_building')}</span><span class="value">${b.def.name}</span></div></div>`;
  html += `<div class="ruin-info">${Game.Lang.t('ruin_desc')}</div>`;
  const cost = b.repairCostCache || (Game.state && Game.state.world ? Game.state.world.getRepairCost(b) : null);
  if (cost) {
    html += `<div class="info-section"><h4>${Game.Lang.t('ruin_material')}</h4>`;
    for (const k in cost) {
      const need = cost[k];
      const available = Math.floor(economy.res[k] || 0);
      const enough = available >= need;
      html += `<div class="info-row"><span class="label">${R_ICON(k)} ${R_NAME(k)}</span><span class="value" style="color:${enough ? '#7ad07a' : '#ff6b6b'}">${need} (${available} ${Game.Lang.t('ruin_in_storage')})</span></div>`;
    }
    html += `</div>`;
  }
  if (b.isBeingRepaired) {
    const pct = b.buildTime > 0 ? Math.min(100, Math.floor((b.progress / b.buildTime) * 100)) : 0;
    html += `<div class="info-section"><h4>${Game.Lang.t('ruin_repairing')}</h4><div class="info-row"><span class="label">${Game.Lang.t('ruin_progress')}</span><span class="value">${pct}%</span></div><div class="progress-bar"><div class="progress-bar-fill" style="width:${pct}%;background:#4A90E2"></div></div></div>`;
  } else {
    html += `<div class="info-section"><h4>${Game.Lang.t('ruin_queue')}</h4><div class="info-row"><span class="label">${Game.Lang.t('panel_status')}</span><span class="value" style="color:#ffcc00">${Game.Lang.t('ruin_waiting_material')}</span></div></div>`;
  }
  return html;
};

Game.UI._buildRaiderPanelHtml = function (b, vm) {
  const rv = Game.state && Game.state.raiderVillage;
  let html = '';
  const raiderIcon = `<img src="images/villager-krieger-blau.webp" style="width:24px;height:24px;object-fit:contain;vertical-align:middle;margin-right:4px;">`;
  if (!rv || rv.isDestroyed) {
    html += `<div class="info-section"><h4>${raiderIcon} ${Game.Lang.t('raider_building')}</h4><div class="info-row"><span class="label">${Game.Lang.t('panel_status')}</span><span class="value" style="color:#ff6b6b">${Game.Lang.t('raider_destroyed')}</span></div></div>`;
    return html;
  }
  html += `<div class="info-section"><h4>${raiderIcon} ${Game.Lang.t('raider_building')}</h4>`;
  let alive = 0, dead = 0, inAttack = 0, nextRespawn = Infinity;
  const now = performance.now();
  for (const w of rv.warriors.values()) {
    if (w.homeBuildingId !== b.id) continue;
    if (w.dead) { dead++; if (w.respawnAt && w.respawnAt < nextRespawn) nextRespawn = w.respawnAt; continue; }
    alive++;
    if (w.inAttack) inAttack++;
  }
  html += `<div class="info-row"><span class="label">${Game.Lang.t('raider_warriors')}</span><span class="value">${alive} / ${b.maxWarriors}</span></div>`;
  if (dead > 0) {
    html += `<div class="info-row"><span class="label">${Game.Lang.t('raider_dead')}</span><span class="value" style="color:#ff6b6b">${dead}</span></div>`;
    if (nextRespawn !== Infinity) { const secs = Math.max(0, Math.ceil((nextRespawn - now) / 1000)); html += `<div class="info-row"><span class="label">${Game.Lang.t('raider_next_respawn')}</span><span class="value">${secs}s</span></div>`; }
  }
  if (inAttack > 0) html += `<div class="info-row"><span class="label">${Game.Lang.t('raider_in_attack')}</span><span class="value" style="color:#ff6b6b">${inAttack}</span></div>`;
  html += `</div>`;
  if (rv.attackState) {
    html += `<div class="info-section"><h4>${Game.Lang.t('raider_attack_running')}</h4>`;
    const st = rv.attackState;
    html += `<div class="info-row"><span class="label">${Game.Lang.t('raider_participants')}</span><span class="value">${st.participants.size}</span></div>`;
    if (st.lootClaimed) {
      let total = 0;
      if (st.loot) for (const k in st.loot) total += st.loot[k];
      html += `<div class="info-row"><span class="label">${Game.Lang.t('raider_loot')}</span><span class="value" style="color:#ffcc00">${Game.Lang.t('raider_loot_units').replace('{s}', total)}</span></div>`;
      if (st.lootLost) html += `<div class="info-row"><span class="label">${Game.Lang.t('panel_status')}</span><span class="value" style="color:#ff6b6b">${Game.Lang.t('raider_loot_lost')}</span></div>`;
      else html += `<div class="info-row"><span class="label">${Game.Lang.t('panel_status')}</span><span class="value" style="color:#4A90E2">${Game.Lang.t('raider_retreat')}</span></div>`;
    } else {
      html += `<div class="info-row"><span class="label">${Game.Lang.t('panel_status')}</span><span class="value" style="color:#f0a040">${Game.Lang.t('raider_march')}</span></div>`;
    }
    html += `</div>`;
  } else if (rv.nextAttackAt) {
    const secs = Math.max(0, Math.ceil((rv.nextAttackAt - now) / 1000));
    if (rv.attackTimerFrozen) {
      html += `<div class="info-section" style="background: rgba(74, 144, 226, 0.15); border: 1px solid #4A90E2; padding: 10px; border-radius: 8px;"><h4 style="color: #4A90E2; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">${Game.Lang.t('raider_timer_frozen')}</h4><div class="info-row"><span class="label">${Game.Lang.t('dragon_remaining')}</span><span class="value" style="color: #4A90E2;">${secs}s</span></div><div class="info-row" style="font-size: 11px; color: #888; margin-top: 4px;"><span>${Game.Lang.t('raider_timer_desc')}</span></div></div>`;
    } else {
      html += `<div class="info-section"><h4>${Game.Lang.t('raider_next_attack')}</h4><div class="info-row"><span class="label">${Game.Lang.t('raider_in')}</span><span class="value">${secs}s</span></div></div>`;
    }
  }
  let totalWarriors = 0;
  for (const v of vm.villagers.values()) {
    if (v.job === 'warrior' && v.state !== 'attacking_raiders' && v.state !== 'vfightback' && v.state !== 'vdefend' && v.state !== 'vfighting' && v.state !== 'returning_to_post' && v.state !== 'dragon_attack') totalWarriors++;
  }
  const raiderIsAttacking = !!rv.attackState;
  if (totalWarriors > 0) {
    if (raiderIsAttacking) {
      html += `<div class="info-section" style="background: #3a1e1e; padding: 10px; border-radius: 8px; border: 2px solid #a83232; margin-top: 10px;"><h4 style="color: #ff6b6b; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;"><img src="images/villager-krieger-rot.webp" style="width:20px;height:20px;object-fit:contain;"> ${Game.Lang.t('raider_counter_blocked')}</h4><div class="info-row" style="margin-bottom: 8px;"><span class="label">${Game.Lang.t('raider_avail_warriors')}</span><span class="value" style="color: #ffcc00;">${totalWarriors}</span></div><div style="padding: 10px; background: rgba(168,50,50,0.2); border-radius: 6px; text-align: center; color: #ff8080; font-size: 12px; font-weight: 600;">${Game.Lang.t('raider_defend_first')}</div></div>`;
    } else {
      html += `<div class="info-section" style="background: #3a1e1e; padding: 10px; border-radius: 8px; border: 1px solid #6e2b2b; margin-top: 10px;"><h4 style="color: #ff6b6b; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;"><img src="images/villager-krieger-rot.webp" style="width:20px;height:20px;object-fit:contain;"> ${Game.Lang.t('raider_plan_counter')}</h4><div class="info-row" style="margin-bottom: 8px;"><span class="label">${Game.Lang.t('raider_avail_warriors')}</span><span class="value" style="color: #ffcc00;">${totalWarriors}</span></div><input type="range" id="attackSlider" min="1" max="${totalWarriors}" value="${totalWarriors}" style="width: 100%; margin-bottom: 8px; accent-color: #6e3b3b;"><div class="info-row" style="margin-bottom: 8px;"><span class="label">${Game.Lang.t('raider_selected')}</span><span class="value" id="attackSliderValue" style="color: #ff6b6b; font-weight: bold;">${totalWarriors}</span></div><button id="startRaidBtn" style="width: 100%; background: #6e3b3b; color: #fff; border: none; padding: 8px; border-radius: 6px; font-weight: bold; cursor: pointer;">${Game.Lang.t('raider_start_counter')}</button></div>`;
    }
  } else {
    html += `<div class="info-section" style="background: #222; padding: 10px; border-radius: 8px; border: 1px solid #444; margin-top: 10px;"><h4 style="color: #888; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;"><img src="images/villager-krieger-rot.webp" style="width:20px;height:20px;object-fit:contain; opacity: 0.5;"> ${Game.Lang.t('raider_counter')}</h4><div class="info-row"><span class="label" style="color: #888;">${Game.Lang.t('raider_no_warriors')}</span></div></div>`;
  }
  return html;
};

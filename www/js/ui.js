window.Game = window.Game || {};

Game.UI = {
  resourceImages: {
    wood: 'images/icon_baum.webp',
    stone: 'images/icon_stein.webp',
    grain: 'images/icon_getreide.webp',
    fish: 'images/icon_fisch.webp',
    water: 'images/icon_wasser.webp',
    beer: 'images/icon_bier.webp',
    woodPlank: 'images/icon_bretter.webp',
    flour: 'images/icon_mehl.webp',
    bread: 'images/icon_brot.webp',
    arrows: 'images/icon_pfeil.webp',
    feed: 'images/icon_futter.webp',
    pig: 'images/icon_schwein.webp',
    meat: 'images/icon_fleisch.webp',
    dragonBone: 'images/drachenknochen.webp'
  },
  resourceNames: {
    wood: 'Holz', stone: 'Stein', grain: 'Weizen', fish: 'Fisch',
    water: 'Wasser', beer: 'Bier', woodPlank: 'Bretter', flour: 'Mehl', bread: 'Brot',
    arrows: 'Pfeile',
    feed: 'Futter', pig: 'Schwein', meat: 'Fleisch',
    dragonBone: 'Drachenknochen'
  },

  resourceIcon(key) {
    if (this.resourceImages[key]) {
      return `<img src="${this.resourceImages[key]}" style="width:18px;height:18px;vertical-align:middle;margin-right:4px;object-fit:contain;" onerror="this.style.display='none'">`;
    }
    const fallbacks = {
      water: '💧', beer: '🍺', woodPlank: '🪵', flour: '🌾', bread: '🍞', arrows: '🏹',
      feed: '🥣', pig: '🐷', meat: '🥩', dragonBone: '🦴'
    };
    return `<span style="display:inline-block;width:18px;text-align:center;margin-right:4px;">${fallbacks[key] || '•'}</span>`;
  },

  getDetailedWorkerStatus(v, b, now) {
    if (!v) return 'Unbekannt';
    
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
      if (v.task === 'go_home') return 'Unterwegs nach Hause';
      if (v.task === 'returning_to_post') return 'Unterwegs zum Posten';
      return 'Unterwegs';
    }

    if (v.state === 'harvesting_hit') {
      return 'Fällt Baum / Baut ab';
    }
    if (v.state === 'fishing_dive') {
      return 'Fischt im Wasser';
    }
    if (v.state === 'harvesting') {
      return 'Erntet Feld ab';
    }
    if (v.state === 'building') {
      return 'Baut Gebäude';
    }
    if (v.state === 'repairing') {
      return 'Repariert Gebäude';
    }
    if (v.state === 'extinguishing') {
      return 'Löscht Feuer';
    }

    if (v.state === 'vdefend') {
      return 'Verteidigt das Reich';
    }
    if (v.state === 'vfightback') {
      return 'Im Gegenangriff';
    }
    if (v.state === 'vfighting') {
      return 'Kämpft gegen Räuber';
    }
    if (v.state === 'zfighting') {
      return 'Kämpft gegen Zombies';
    }
    if (v.state === 'dragon_attack') {
      return 'Kämpft gegen Drachen';
    }
    if (v.state === 'returning_to_post') {
      return 'Unterwegs zum Posten';
    }

    if (v.state === 'working') {
      if (b) {
        if (b.def.id === 'fireStation') {
          return 'Wartet auf Alarm';
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
          if (!b.isActive) {
            return `<span style="color:#f0a040">Wartet auf Zutaten</span>`;
          }
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
  },

  describeVillager(v) {
    if (!v) return '';
    const b = v.workplaceId && Game.state && Game.state.world ? Game.state.world.buildings.get(v.workplaceId) : null;
    return this.getDetailedWorkerStatus(v, b, performance.now());
  },

  villagerStateEmoji(v) {
    if (!v) return '❓';
    if (v.state === 'vdefend' || v.state === 'vfightback' || v.state === 'vfighting' || v.state === 'attacking_raiders' || v.state === 'dragon_attack' || v.state === 'zfighting') {
      return '<img src="images/villager-krieger-rot.webp" style="width:16px;height:16px;object-fit:contain;vertical-align:middle;">';
    }
    if (v.job === 'warrior') return '<img src="images/villager-krieger-rot.webp" style="width:16px;height:16px;object-fit:contain;vertical-align:middle;">';
    if (v.state === 'extinguish_fetch' || v.state === 'extinguish_go' || v.state === 'extinguish_return' || v.state === 'extinguishing' || v.state === 'fetch_water_storage' || v.state === 'fetch_water_return') return '<img src="images/feuerwehrmann.webp" style="width:16px;height:16px;object-fit:contain;vertical-align:middle;">';
    if (v.state === 'building' || v.state === 'repairing' || v.task === 'go_to_build' || v.task === 'repair_fetch_storage' || v.task === 'repair_return') return '<img src="images/villager-baumeister-rot.webp" style="width:16px;height:16px;object-fit:contain;vertical-align:middle;">';
    if (v.state === 'harvesting' || v.task === 'harvest_route' || v.task === 'stone_harvest_arrived') return '<img src="images/icon_getreide.webp" style="width:16px;height:16px;object-fit:contain;vertical-align:middle;">';
    if (v.state === 'fishing_dive' || v.task === 'fish_harvest_arrived') return '<img src="images/icon_fisch.webp" style="width:16px;height:16px;object-fit:contain;vertical-align:middle;">';
    if (v.task === 'plant_tree_arrived') return '<img src="images/icon_baum.webp" style="width:16px;height:16px;object-fit:contain;vertical-align:middle;">';
    if (v.task === 'fetch_arrows_storage' || v.task === 'fetch_arrows_return') return '<img src="images/icon_pfeil.webp" style="width:16px;height:16px;object-fit:contain;vertical-align:middle;">';
    if (v.state === 'moving') return '<img src="images/villager-idle-rot.webp" style="width:16px;height:16px;object-fit:contain;vertical-align:middle;">';
    if (v.job === 'worker') return '<img src="images/villager-baumeister-rot.webp" style="width:16px;height:16px;object-fit:contain;vertical-align:middle;">';
    return '<img src="images/haus-rot.webp" style="width:16px;height:16px;object-fit:contain;vertical-align:middle;">';
  },

  computePanelHash(b, vm, economy) {
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
        let alive = 0;
        let dead = 0;
        let inAttack = 0;
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
        if (v.job === 'warrior' && 
            v.state !== 'attacking_raiders' && 
            v.state !== 'vfightback' && 
            v.state !== 'vdefend' && 
            v.state !== 'vfighting' && 
            v.state !== 'returning_to_post' &&
            v.state !== 'dragon_attack') {
          availableWarriors++;
        }
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
    
    // Feuer-Status
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

    // Plagen-Status
    const plagueMgr = Game.state && Game.state.plagueManager;
    if (plagueMgr && plagueMgr.isActive(performance.now())) {
      h += '|plague' + plagueMgr.activeType + Math.ceil((plagueMgr.activeUntil - performance.now()) / 1000);
    }

    if (b.def.recipe) {
      h += '|r' + Math.floor(b.recipeTimer || 0);
      for (const k in b.recipeStorage) h += k + b.recipeStorage[k];
    }
    if (b.def.generatesResource) h += '|g' + Math.floor(b.generatesTimer || 0);
    h += '|f' + (b.fishSlots || 0) + '-' + (b.fishConsumeTimer || 0) + '-' + (b.fishRetryTimer || 0) + '-' + (b.fishPendingFetch ? 1 : 0);
    h += '|w' + (b.workerId || 0);
    if (b.workerIds) {
      h += '|wids' + b.workerIds.join(',');
    }
    if (b.warriorSlots) {
      h += '|sl' + b.warriorSlots.map(x => x === null ? 'n' : x).join(',');
    }
    if (b.residents) {
      h += '|res' + b.residents.length;
      for (const rid of b.residents) {
        const w = vm.villagers.get(rid);
        if (w) h += '|rs' + w.id + (w.state || '') + (w.task || '') + (w.job || '') + (w.beerBuff ? 1 : 0);
        else h += '|rs?' + rid;
      }
    }
    h += '|beer' + (b.beerStorage || 0);
    if (b.warriorSlots) {
      for (const wid of b.warriorSlots) {
        if (wid === null) continue;
        const w = vm.villagers.get(wid);
        if (w) h += '|wb' + (w.beerBuff ? 1 : 0) + (w.beerBuffTimer || 0) + (w.state || '');
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
  },

  _isInFireStationRange(b) {
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
      if (dx * dx + dy * dy <= range * range) {
        return true;
      }
    }
    return false;
  },

  buildPanelHtml(b, vm, economy) {
    if (b.isDragon) {
      return this._buildDragonPanelHtml(b);
    }
    if (b.ruined) {
      return this._buildRuinPanelHtml(b, vm, economy);
    }
    if (b.isRaiderBuilding) {
      return this._buildRaiderPanelHtml(b, vm);
    }

    let html = '';
    const R_ICON = (k) => this.resourceIcon(k);
    const R_NAME = (k) => this.resourceNames[k];

    // ==========================================================
    // FEUERWEHR-REICHWEITEN-STATUS (an jedem Gebäude)
    // ==========================================================
    const inRange = this._isInFireStationRange(b);
    const fireIconStyle = inRange
      ? 'width:22px;height:22px;object-fit:contain;filter:drop-shadow(0 0 4px #4A90E2);'
      : 'width:22px;height:22px;object-fit:contain;opacity:0.4;filter:grayscale(1);position:relative;';
    const strikeStyle = !inRange
      ? 'position:absolute;top:50%;left:0;right:0;height:2px;background:#ff3030;transform:rotate(-45deg);'
      : 'display:none;';
    const rangeLabel = inRange ? 'In Feuerwehr-Reichweite' : 'Nicht in Feuerwehr-Reichweite';
    const rangeColor = inRange ? '#7ad07a' : '#ff6b6b';
    
    html += `<div class="info-section" style="display:flex; align-items:center; gap:8px; padding:6px 8px; background:rgba(0,0,0,0.2); border-radius:6px; margin-bottom:8px;">
      <div style="position:relative; display:inline-block; width:22px; height:22px; flex-shrink:0;">
        <img src="images/feuerwehrmann.webp" style="${fireIconStyle}">
        <div style="${strikeStyle}"></div>
      </div>
      <span style="font-size:12px; color:${rangeColor};">${rangeLabel}</span>
    </div>`;

    // ==========================================================
    // FEUER-HINWEIS (dynamische Zeiten & Wasserstand)
    // ==========================================================
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
        
        const spreadText = elapsed < times.spreadTimeMs 
          ? `Ausbreitung in ${remainingSpread}s` 
          : 'Ausbreitung erfolgt';
          
        html += `<div class="castle-warning" style="background: rgba(255,48,48,0.2); border-color:#ff3030; color:#ff6b6b; display:flex; flex-direction:column; gap:6px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <img src="images/flamme.webp" alt="" style="width:36px;height:36px;object-fit:contain;flex-shrink:0;">
            <span><b>Gebäude brennt!</b><br>Ruine in ${remainingBurn}s. ${spreadText}.</span>
          </div>
          <div style="padding-top:6px; border-top:1px solid rgba(255,107,107,0.3); font-size:12px;">
            <b>Wasser zum Löschen:</b> ${deliveredWater} / ${neededWater} (${missingWater} fehlen noch)
          </div>
        </div>`;
      }
    }

    // ==========================================================
    // PLAGEN-HINWEISE (Schweinepest, Rattenplage & Duerre)
    // ==========================================================
    const plagueMgr = Game.state && Game.state.plagueManager;
    if (plagueMgr && plagueMgr.isActive(performance.now())) {
      const rem = Math.max(0, Math.ceil((plagueMgr.activeUntil - performance.now()) / 1000));

      if (plagueMgr.activeType === 'pig' && b.def.id === 'pigFarm') {
        html += `<div class="castle-warning" style="background: rgba(168,111,51,0.2); border-color:#a86f33; color:#e0b070; display:flex; align-items:center; gap:10px;">
          <img src="images/schwein-krank.webp" alt="" style="width:36px;height:36px;object-fit:contain;flex-shrink:0;">
          <span><b>Schweinepest aktiv!</b><br>Produktion eingestellt - noch ${rem}s.</span>
        </div>`;
      } else if (plagueMgr.activeType === 'rat' && b.def.id === 'bakery') {
        html += `<div class="castle-warning" style="background: rgba(107,107,107,0.2); border-color:#6b6b6b; color:#c0c0c0; display:flex; align-items:center; gap:10px;">
          <img src="images/ratte.webp" alt="" style="width:36px;height:36px;object-fit:contain;flex-shrink:0;">
          <span><b>Rattenplage aktiv!</b><br>Produktion halbiert - noch ${rem}s.</span>
        </div>`;
      } else if (plagueMgr.activeType === 'drought' && b.def.id === 'farm') {
        html += `<div class="castle-warning" style="background: rgba(230,168,23,0.2); border-color:#e6a817; color:#ffcc00; display:flex; align-items:center; gap:10px;">
          <img src="images/sonne.webp" alt="" style="width:36px;height:36px;object-fit:contain;flex-shrink:0;">
          <span><b>Dürre aktiv!</b><br>Kein Getreide - noch ${rem}s.</span>
        </div>`;
      }
    }

    if (!b.built) {
      const progress = Math.min(100, Math.floor((b.progress / b.buildTime) * 100));
      html += `<div class="info-row"><span class="label">Status:</span><span class="value" style="color:#fa0">Im Bau</span></div>`;
      html += `<div class="info-row"><span class="label">Fortschritt:</span><span class="value">${progress}%</span></div>`;
      html += `<div class="progress-bar"><div class="progress-bar-fill" style="width:${progress}%"></div></div>`;
      return html;
    }

    if (b.def.id === 'castle') {
      html += `<div class="info-section" style="margin-bottom: 12px;">
        <button id="saveGameBtn" style="width:100%; padding:10px; background:#3b6e3b; color:#fff; border:none; border-radius:6px; cursor:pointer; font-weight:600; font-size:15px; margin-bottom: 8px;">
          💾 Spiel speichern
        </button>
        <button id="centerCastleBtn" class="camera-jump-btn">
          🏰 Zum Schloss springen
        </button>
        <button id="repairJobsBtn" class="repair-jobs-btn">
          🛠️ Klemmt etwas? Klicke hier
        </button>
        <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:13px; color:#ccc; padding: 4px 0; margin-top: 8px;">
          <input type="checkbox" id="autosaveCheckbox" ${Game.state.autosaveEnabled ? 'checked' : ''} style="width:auto; margin:0; accent-color:#3b6e3b;">
          Autosave alle 5 Minuten
        </label>
      </div>`;

      if (b.dragonHits > 0) {
        const remaining = (b.def.dragonHits || 3) - b.dragonHits;
        html += `<div class="castle-warning">
          🐉 Drachenschaden: ${b.dragonHits}/${b.def.dragonHits || 3}<br>
          Noch ${remaining} Treffer bis zum Game Over!
        </div>`;
      }
    }

    // ==========================================================
    // FEUERWEHR-INFO
    // ==========================================================
    if (b.def.id === 'fireStation') {
      const maxW = b.def.maxWaterStorage || 250;
      const waterPct = Math.min(100, Math.floor(((b.storage || 0) / maxW) * 100));
      const maxWorkers = b.def.maxWorkers || 3;
      const currentWorkers = (b.workerIds ? b.workerIds.length : 0);
      const hasWorkers = currentWorkers > 0;

      html += `<div class="info-section" style="background:#2a2d31; padding:10px; border-radius:8px; border:1px solid #444; margin-top:6px;">
        <h4 style="color:#4A90E2; margin-bottom:6px; display:flex; align-items:center; gap:6px;">
          <img src="images/feuerwehr.webp" style="width:18px;height:18px;object-fit:contain;"> Feuerwehr
        </h4>
        <div class="info-row"><span class="label">Status:</span><span class="value" style="color:${hasWorkers ? '#7ad07a' : '#888'}">${hasWorkers ? 'Einsatzbereit' : 'Kein Personal'}</span></div>
        <div class="info-row"><span class="label">Wasser:</span><span class="value">${b.storage || 0} / ${maxW}</span></div>
        <div class="progress-bar"><div class="progress-bar-fill" style="width:${waterPct}%;background:#4A90E2"></div></div>
        <div class="info-row" style="margin-top:6px;"><span class="label">Einsatzradius:</span><span class="value">${b.def.extinguishRadius || 15} Felder</span></div>
        <div class="info-row"><span class="label">Wasser pro Fahrt:</span><span class="value">${b.def.waterCarryAmount || 5}</span></div>
        <div class="info-row"><span class="label">Personal:</span><span class="value">${currentWorkers} / ${maxWorkers}</span></div>
      </div>`;

      // Arbeiter-Liste
      if (currentWorkers > 0) {
        html += `<div class="info-section"><h4>Bewohner</h4>`;
        for (const wid of b.workerIds) {
          const w = vm.villagers.get(wid);
          if (!w) continue;
          const desc = this.describeVillager(w);
          html += `<div class="info-item" style="display:flex; align-items:center; gap:6px;">
            <img src="images/feuerwehrmann.webp" style="width:16px;height:16px;object-fit:contain;">
            <span>${w.name}${desc ? ` <span style="color:#7ad07a">(${desc})</span>` : ''}</span>
          </div>`;
        }
        html += `</div>`;
      }
    }

    const canPause = b.def.produces || b.def.recipe || b.def.generatesResource || b.def.globalResource || b.def.hasArrowTower || b.def.id === 'fireStation';
    const isBurning = fireMgr && fireMgr.isBuildingBurning(b);
    
    if (canPause) {
      if (isBurning) {
        html += `<div class="info-section">
          <button disabled style="width:100%; padding:8px; background:#444; color:#888; border:none; border-radius:6px; font-weight:600; display:flex; align-items:center; justify-content:center; gap:6px;">
            ⏸ Pausiert (Gebäude brennt)
          </button>
        </div>`;
      } else {
        html += `<div class="info-section">
          <button id="pauseToggleBtn" style="width:100%; padding:8px; background:${b.paused ? '#6e3b3b' : '#3b6e3b'}; color:#fff; border:none; border-radius:6px; cursor:pointer; font-weight:600; display:flex; align-items:center; justify-content:center; gap:6px;">
            ${b.paused ? '▶ Fortsetzen' : '⏸ Pausieren'}
          </button>
        </div>`;
      }
    }

    if (b.def.hasArrowStop) {
      const threshold = b.arrowStopThreshold !== undefined ? b.arrowStopThreshold : 500;
      const current = Math.floor(economy.res.arrows || 0);
      const stopped = current >= threshold;
      html += `<div class="info-section" style="background:#2a2d31; padding:10px; border-radius:8px; border:1px solid #444; margin-top:6px;">
        <h4 style="color:#ffcc00; margin-bottom:6px; display:flex; align-items:center; gap:6px;">
          <img src="images/icon_pfeil.webp" style="width:18px;height:18px;object-fit:contain;"> Produktionsstop
        </h4>
        <div class="info-row" style="margin-bottom:6px;">
          <span class="label">Aktuell (global):</span>
          <span class="value" style="color:${stopped ? '#ff6b6b' : '#7ad07a'}">${current}</span>
        </div>
        <label style="display:flex; flex-direction:column; gap:4px; font-size:12px; color:#aaa;">
          Stop ab (Stück):
          <input type="number" id="arrowStopInput" min="0" step="10" value="${threshold}" style="background:#1e1f22; color:#eee; border:1px solid #555; border-radius:6px; padding:6px 8px; font-size:14px; width:100%;" />
        </label>
        <div class="info-row" style="margin-top:6px;">
          <span class="label">Status:</span>
          <span class="value" style="color:${stopped ? '#ff6b6b' : '#7ad07a'}">${stopped ? 'Gestoppt' : 'Produziert'}</span>
        </div>
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
      let statusText = 'Bereit';
      if (!hasWorker) { statusColor = '#888'; statusText = 'Kein Schütze'; }
      else if (b.paused) { statusColor = '#f0a040'; statusText = 'Pausiert'; }
      else if (fetching) { statusColor = '#4A90E2'; statusText = 'Holt Pfeile…'; }
      else if (localArrows < 1) { statusColor = '#ff6b6b'; statusText = 'Keine Pfeile'; }
      else if (cooldownMs > 0) { statusColor = '#4A90E2'; statusText = 'Nachladen'; }

      const nextShotText = cooldownMs <= 0 ? 'Bereit' : `${(cooldownMs / 1000).toFixed(1)}s`;
      const nextShotColor = cooldownMs <= 0 ? '#7ad07a' : '#ffcc00';

      html += `<div class="info-section" style="background:#2a2d31; padding:10px; border-radius:8px; border:1px solid #444; margin-top:6px;">
        <h4 style="color:#4A90E2; margin-bottom:6px; display:flex; align-items:center; gap:6px;">
          <img src="images/bogenschussanlage.webp" style="width:18px;height:18px;object-fit:contain;"> Verteidigung
        </h4>
        <div class="info-row"><span class="label">Status:</span><span class="value" style="color:${statusColor}">${statusText}</span></div>
        <div class="info-row"><span class="label">Reichweite:</span><span class="value">${range} Felder</span></div>
        <div class="info-row"><span class="label">Schussrate:</span><span class="value">1 / ${fireInterval}s</span></div>

        <div class="info-section" style="border-top:1px solid #3a3c40; padding-top:6px; margin-top:6px;">
          <h4 style="font-size:11px; color:#aaa; margin-bottom:4px;">Trefferquote nach Distanz</h4>
          <div class="info-row"><span class="label">0 Felder:</span><span class="value">${hitAt(0)}%</span></div>
          <div class="info-row"><span class="label">${Math.floor(range / 2)} Felder:</span><span class="value">${hitAt(range / 2)}%</span></div>
          <div class="info-row"><span class="label">${range} Felder:</span><span class="value">${hitAt(range)}%</span></div>
          <div class="info-row" style="color:#ff8a5c; font-weight:600; margin-top:4px;"><span class="label" style="color:#ff8a5c;">🐉 Drache:</span><span class="value">75% (fix)</span></div>
        </div>

        <div class="info-section" style="border-top:1px solid #3a3c40; padding-top:6px; margin-top:6px;">
          <h4 style="font-size:11px; color:#aaa; margin-bottom:4px; display:flex; align-items:center; gap:4px;">
            <img src="images/icon_pfeil.webp" style="width:14px;height:14px;object-fit:contain;"> Pfeil-Lager (Turm)
          </h4>
          <div class="info-row"><span class="label">Vorrat:</span><span class="value" style="color:${localArrows > 0 ? '#7ad07a' : '#ff6b6b'}">${localArrows} / ${maxLocal}</span></div>
          <div class="progress-bar"><div class="progress-bar-fill" style="width:${localPct}%;background:#4A90E2"></div></div>
          <div class="info-row" style="margin-top:4px;"><span class="label">Global (Lager):</span><span class="value">${globalArrows}</span></div>
          ${fetching ? `<div class="info-row"><span class="label">Unterwegs:</span><span class="value" style="color:#4A90E2">holt Nachschub…</span></div>` : ''}
        </div>

        <div class="info-row" style="margin-top:6px;"><span class="label">Nächster Schuss:</span><span class="value" style="color:${nextShotColor}">${nextShotText}</span></div>
        <div class="progress-bar"><div class="progress-bar-fill" style="width:${readyPct}%;background:#4A90E2"></div></div>
      </div>`;
    }

    if (b.def.isStorage || b.def.id === 'castle') {
      html += `<div class="info-section"><h4>Ressourcen (Gesamt)</h4>`;
      for (const key of ['wood', 'stone', 'grain', 'fish', 'water', 'beer', 'woodPlank', 'flour', 'bread', 'arrows', 'feed', 'pig', 'meat', 'dragonBone']) {
        const amount = Math.floor(economy.res[key] || 0);
        html += `<div class="info-row"><span class="label">${R_ICON(key)} ${R_NAME(key)}</span><span class="value">${amount}</span></div>`;
      }
      html += `</div>`;
    }

    if (b.def.id === 'forsthaus') {
      html += `<div class="info-section"><h4 style="display:flex; align-items:center; gap:6px;"><img src="images/forsthaus.webp" style="width:18px;height:18px;object-fit:contain;"> Förster</h4>`;
      const w = b.workerId !== null ? vm.villagers.get(b.workerId) : null;
      if (w) {
        const now = performance.now();
        const statusText = this.getDetailedWorkerStatus(w, b, now);
        const fishOk = b.fishSlots > 0;
        const waitBase = fishOk ? 12.5 : 50;

        html += `<div class="info-row"><span class="label">Aktueller Status:</span><span class="value" style="color:#7ad07a">${statusText}</span></div>`;
        html += `<div class="info-row"><span class="label">Wartezeit (bei Pflanzung):</span><span class="value" style="color:${fishOk ? '#7ad07a' : '#f0a040'}">${waitBase}s ${fishOk ? '' : '(kein Fisch)'}</span></div>`;
      } else {
        html += `<div class="info-row"><span class="label">Status:</span><span class="value" style="color:#888">Kein Förster</span></div>`;
      }
      html += `</div>`;
    }

    if (b.def.globalResource && b.def.id !== 'forsthaus') {
      const res = b.def.globalResource;
      html += `<div class="info-section"><h4>Ausgangs-Lager</h4>`;
      html += `<div class="info-row"><span class="label">${R_ICON(res)} ${R_NAME(res)}</span><span class="value">${b.storage} / ${b.maxCapacity}</span></div>`;
      if (b.maxCapacity > 0) {
        const pct = Math.min(100, Math.floor((b.storage / b.maxCapacity) * 100));
        html += `<div class="progress-bar"><div class="progress-bar-fill" style="width:${pct}%"></div></div>`;
      }
      html += `</div>`;
    }

    if (b.def.generatesResource) {
      html += `<div class="info-section"><h4>Produktion</h4>`;
      html += `<div class="info-row"><span class="label">${R_ICON(b.def.generatesResource)} ${R_NAME(b.def.generatesResource)}</span><span class="value">${b.storage} / ${b.maxCapacity}</span></div>`;
      const pct = b.maxCapacity > 0 ? Math.min(100, Math.floor((b.storage / b.maxCapacity) * 100)) : 0;
      html += `<div class="progress-bar"><div class="progress-bar-fill" style="width:${pct}%"></div></div>`;
      const timeLeft = Math.max(0, b.def.generatesInterval - (b.generatesTimer || 0));
      html += `<div class="info-row"><span class="label">Nächste Ladung in:</span><span class="value">${Math.ceil(timeLeft)}s</span></div>`;
      html += `<div class="info-row"><span class="label">Menge:</span><span class="value">+${b.def.generatesAmount} alle ${b.def.generatesInterval}s</span></div>`;
      html += `</div>`;
    }

    if (b.def.consumesFish) {
      html += `<div class="info-section"><h4 style="display:flex; align-items:center; gap:6px;"><img src="images/icon_fisch.webp" style="width:18px;height:18px;object-fit:contain;"> Fisch-Slots</h4>`;
      const slots = b.fishSlots || 0;
      let icons = '';
      for (let i = 0; i < 3; i++) {
        if (i < slots) {
          icons += `<img src="images/icon_fisch.webp" style="width:16px;height:16px;object-fit:contain;margin-right:2px;">`;
        } else {
          icons += `<span style="display:inline-block;width:16px;height:16px;background:#444;border-radius:50%;margin-right:2px;"></span>`;
        }
      }
      const eff = slots > 0 ? 100 : 25;
      html += `<div class="info-row"><span class="label">Slots:</span><span class="value" style="display:flex; align-items:center;">${icons}</span></div>`;
      html += `<div class="info-row"><span class="label">Effizienz:</span><span class="value" style="color:${eff === 100 ? '#7ad07a' : '#f0a040'}">${eff}%</span></div>`;
      const secsLeft = Math.max(0, b.fishConsumeTimer || 0);
      html += `<div class="info-row"><span class="label">Nächster Verbrauch:</span><span class="value">${secsLeft}s</span></div>`;
      if (b.fishPendingFetch) {
        html += `<div class="info-row"><span class="label">Status:</span><span class="value" style="color:#4A90E2">Holt Fische…</span></div>`;
      } else if (slots === 0 && b.fishRetryTimer < 0) {
        html += `<div class="info-row"><span class="label">Nächster Versuch:</span><span class="value">${-b.fishRetryTimer}s</span></div>`;
      }
      html += `</div>`;
    }

    if (b.def.recipe) {
      html += `<div class="info-section"><h4>Zutaten-Lager</h4>`;
      const maxS = b.def.recipeMaxStorage || {};
      for (const k in b.def.recipe.inputs) {
        const stored = b.recipeStorage[k] || 0;
        const max = maxS[k] || 10;
        html += `<div class="info-row"><span class="label">${R_ICON(k)} ${R_NAME(k)}</span><span class="value">${stored} / ${max}</span></div>`;
        const pct = Math.min(100, Math.floor((stored / max) * 100));
        html += `<div class="progress-bar"><div class="progress-bar-fill" style="width:${pct}%"></div></div>`;
      }
      html += `</div>`;
      html += `<div class="info-section"><h4>Rezept (alle ${b.def.recipeInterval || 30}s)</h4>`;
      const inputParts = [];
      for (const k in b.def.recipe.inputs) inputParts.push(`${b.def.recipe.inputs[k]} ${R_NAME(k)}`);
      html += `<div class="info-row"><span class="label">Verbrauch:</span><span class="value">${inputParts.join(' + ')}</span></div>`;
      
      let recipeOutputText = `${b.def.recipe.amount} ${R_NAME(b.def.recipe.output)}`;
      if (plagueMgr && plagueMgr.isActive(performance.now()) && plagueMgr.activeType === 'rat' && b.def.id === 'bakery') {
        recipeOutputText = `<span style="color:#f0a040; text-decoration:line-through;">${b.def.recipe.amount}</span> ${b.def.recipe.amount * 0.5} ${R_NAME(b.def.recipe.output)}`;
      }
      
      html += `<div class="info-row"><span class="label">Produziert:</span><span class="value">${recipeOutputText}</span></div>`;
      const timerPct = Math.min(100, Math.floor(((b.recipeTimer || 0) / (b.def.recipeInterval || 30)) * 100));
      html += `<div class="info-row"><span class="label">Fortschritt:</span><span class="value">${timerPct}%</span></div>`;
      html += `<div class="progress-bar"><div class="progress-bar-fill" style="width:${timerPct}%"></div></div>`;
      html += `</div>`;
    }

    if (b.def.produces || b.def.recipe) {
      const outputKey = b.def.produces || b.def.recipe.output;
      html += `<div class="info-section"><h4>Ausgangs-Lager</h4>`;
      html += `<div class="info-row"><span class="label">${R_ICON(outputKey)} ${R_NAME(outputKey)}</span><span class="value">${b.storage} / ${b.maxCapacity}</span></div>`;
      if (b.maxCapacity > 0) {
        const pct = Math.min(100, Math.floor((b.storage / b.maxCapacity) * 100));
        html += `<div class="progress-bar"><div class="progress-bar-fill" style="width:${pct}%"></div></div>`;
      }
      html += `</div>`;
    }

    if (b.def.beerSlots && b.def.beerSlots > 0) {
      html += `<div class="info-section"><h4 style="display:flex; align-items:center; gap:6px;"><img src="images/icon_bier.webp" style="width:18px;height:18px;object-fit:contain;"> Bier-Lager</h4>`;
      const beerPct = b.maxBeer > 0 ? Math.floor((b.beerStorage / b.maxBeer) * 100) : 0;
      html += `<div class="info-row"><span class="label">Bier</span><span class="value">${b.beerStorage} / ${b.maxBeer}</span></div>`;
      html += `<div class="progress-bar"><div class="progress-bar-fill" style="width:${beerPct}%;background:#d4a017"></div></div>`;
      html += `</div>`;
    }

    if (b.def.id === 'house') {
      html += `<div class="info-section"><h4 style="display:flex; align-items:center; gap:6px;"><img src="images/haus-rot.webp" style="width:18px;height:18px;object-fit:contain;"> Einwohner</h4>`;
      const residents = b.residents || [];
      const maxRes = b.def.maxResidents || 5;
      let activeCount = 0;
      for (const rid of residents) if (vm.villagers.has(rid)) activeCount++;
      html += `<div class="info-row"><span class="label">Einwohner</span><span class="value">${activeCount} / ${maxRes}</span></div>`;
      
      const spawnTime = 30 - (b.spawnTimer || 0);
      if (activeCount < maxRes) {
        html += `<div class="info-row"><span class="label">Nächster Einwohner in:</span><span class="value" style="color:#7ad07a">${Math.max(0, spawnTime)}s</span></div>`;
      }

      for (const rid of residents) {
        const w = vm.villagers.get(rid);
        if (!w) {
          html += `<div class="info-item" style="padding-left:8px;font-size:11px;color:#555;">• (verstorben)</div>`;
          continue;
        }
        const emoji = this.villagerStateEmoji(w);
        const desc = this.describeVillager(w);
        html += `<div class="info-item" style="padding-left:8px;font-size:11px;color:#bbb;">• ${emoji} ${w.name} <span style="color:#888">(${desc})</span></div>`;
      }
      html += `</div>`;
    }

    const hasWarriorSlots = b.warriorSlots && b.warriorSlots.length > 0;
    const hasResidents = b.residents && b.residents.length > 0;
    const hasWorker = b.workerId !== null;

    if (hasWorker || hasWarriorSlots || (hasResidents && b.def.id !== 'house') || (b.def.id === 'fireStation' && (b.workerIds || []).length === 0)) {
      html += `<div class="info-section"><h4>Bewohner</h4>`;

      if (b.def.id === 'fireStation' && (!b.workerIds || b.workerIds.length === 0)) {
        html += `<div class="info-row"><span class="label" style="color:#888;">Kein Personal zugewiesen</span></div>`;
      } else {
        if (hasWorker) {
          const w = vm.villagers.get(b.workerId);
          const wname = w ? w.name : ('#' + b.workerId);
          const desc = w ? this.describeVillager(w) : '';
          html += `<div class="info-item" style="display:flex; align-items:center; gap:6px;">
            <img src="images/villager-idle-rot.webp" style="width:16px;height:16px;object-fit:contain;">
            <span>${wname}${desc ? ` <span style="color:#7ad07a">(${desc})</span>` : ''}</span>
          </div>`;
        }
      }

      if (hasWarriorSlots) {
        let activeCount = 0;
        for (const id of b.warriorSlots) if (id !== null) activeCount++;
        html += `<div class="info-item" style="display:flex; align-items:center; gap:6px;">
          <img src="images/villager-krieger-rot.webp" style="width:16px;height:16px;object-fit:contain;">
          <span>Krieger (${activeCount} / ${b.maxWarriors}):</span>
        </div>`;
        for (let i = 0; i < b.warriorSlots.length; i++) {
          const wid = b.warriorSlots[i];
          if (wid === null) {
            html += `<div class="info-item" style="padding-left:16px;font-size:11px;color:#555;">• Slot ${i + 1}: frei</div>`;
          } else {
            const w = vm.villagers.get(wid);
            if (w) {
              const buff = w.beerBuff ? ` <span style="color:#d4a017">🍺 (${w.beerBuffTimer}s)</span>` : '';
              let statusHint = '';
              if (w.state === 'vdefend') statusHint = ' <span style="color:#ff8a5c">(verteidigt)</span>';
              else if (w.state === 'vfightback') statusHint = ' <span style="color:#4A90E2">(Gegenangriff)</span>';
              else if (w.state === 'returning_to_post') statusHint = ' <span style="color:#4A90E2">(kehrt zurück)</span>';
              html += `<div class="info-item" style="padding-left:16px;font-size:11px;color:#bbb;">• Slot ${i + 1}: ${w.name}${buff}${statusHint}</div>`;
            } else {
              html += `<div class="info-item" style="padding-left:16px;font-size:11px;color:#555;">• Slot ${i + 1}: frei</div>`;
            }
          }
        }
      }

      if (hasResidents && b.def.id !== 'house') {
        let active = 0;
        for (const rid of b.residents) if (vm.villagers.has(rid)) active++;
        html += `<div class="info-item" style="display:flex; align-items:center; gap:6px;">
          <img src="images/haus-rot.webp" style="width:16px;height:16px;object-fit:contain;">
          <span>Einwohner (${active} / ${b.def.maxResidents || 5}):</span>
        </div>`;
        for (const rid of b.residents) {
          const w = vm.villagers.get(rid);
          if (!w) {
            html += `<div class="info-item" style="padding-left:16px;font-size:11px;color:#555;">• (verstorben)</div>`;
            continue;
          }
          const emoji = this.villagerStateEmoji(w);
          const desc = this.describeVillager(w);
          html += `<div class="info-item" style="padding-left:16px;font-size:11px;color:#bbb;">• ${emoji} ${w.name} <span style="color:#888">(${desc})</span></div>`;
        }
      }

      html += `</div>`;
    }

    if (b.def.expandsBorder || b.def.id === 'castle') {
      const radius = b.def.expandsBorder || 10;
      html += `<div class="info-section"><h4>Wirkungsradius</h4>`;
      html += `<div class="info-row"><span class="label">Radius:</span><span class="value">${radius} Felder</span></div>`;
      html += `</div>`;
    }

    return html;
  },

  _buildDragonPanelHtml(d) {
    let html = '';

    const statusMap = {
      flying: 'Fliegend',
      attacking: 'Greift an',
      grounded: 'Am Boden (wehrlos)'
    };
    const stateClass = {
      flying: 'dragon-status-flying',
      attacking: 'dragon-status-attack',
      grounded: 'dragon-status-grounded'
    };

    const hp = d.hp || 0;
    const maxHp = 10;
    const hpPct = Math.min(100, Math.floor((hp / maxHp) * 100));

    html += `<div class="info-section">
      <div class="info-row"><span class="label">Status:</span><span class="value ${stateClass[d.state] || ''}">${statusMap[d.state] || d.state}</span></div>
      <div class="info-row"><span class="label">Treffer:</span><span class="value">${hp} / ${maxHp}</span></div>
      <div class="dragon-hp-bar"><div class="dragon-hp-fill" style="width:${hpPct}%"></div></div>
    </div>`;

    if (d.state === 'grounded') {
      const remaining = Math.max(0, Math.ceil((d.groundedUntil - performance.now()) / 1000));
      html += `<div class="info-section">
        <h4>⚔️ Boden-Timer</h4>
        <div class="info-row"><span class="label">Verbleibend:</span><span class="value" style="color:${remaining <= 3 ? '#ff3030' : '#ffcc00'}">${remaining}s</span></div>
        <div class="progress-bar"><div class="progress-bar-fill" style="width:${Math.min(100, (remaining / 10) * 100)}%;background:#ff8a5c"></div></div>
        <div style="font-size:11px; color:#ff8a5c; margin-top:6px;">5 Krieger müssen ihn innerhalb von 10 Sek erreichen!</div>
      </div>`;
    }

    if (d.targetBuildingId) {
      const target = Game.state && Game.state.world ? Game.state.world.buildings.get(d.targetBuildingId) : null;
      if (target) {
        html += `<div class="info-section">
          <h4>🎯 Ziel</h4>
          <div class="info-row"><span class="label">Gebäude:</span><span class="value">${target.def.name}</span></div>
          <div class="info-row"><span class="label">Position:</span><span class="value">${target.x}, ${target.y}</span></div>
        </div>`;
      }
    }

    if (d.castleHits > 0) {
      html += `<div class="castle-warning">
        🏰 Schloss getroffen: ${d.castleHits}× / 3
      </div>`;
    }

    return html;
  },

  _buildRuinPanelHtml(b, vm, economy) {
    const R_ICON = (k) => this.resourceIcon(k);
    const R_NAME = (k) => this.resourceNames[k];

    let html = '';

    html += `<div class="info-section">
      <div class="info-row"><span class="label">Status:</span><span class="value" style="color:#ff6b6b">🏚️ Zerstört</span></div>
      <div class="info-row"><span class="label">Gebäude:</span><span class="value">${b.def.name}</span></div>
    </div>`;

    html += `<div class="ruin-info">
      Die Bauarbeiter reparieren dieses Gebäude automatisch, sobald genug Material im Lager ist.
    </div>`;

    const cost = b.repairCostCache || (Game.state && Game.state.world ? Game.state.world.getRepairCost(b) : null);
    if (cost) {
      html += `<div class="info-section"><h4>🔧 Reparatur-Material</h4>`;
      for (const k in cost) {
        const need = cost[k];
        const available = Math.floor(economy.res[k] || 0);
        const enough = available >= need;
        html += `<div class="info-row">
          <span class="label">${R_ICON(k)} ${R_NAME(k)}</span>
          <span class="value" style="color:${enough ? '#7ad07a' : '#ff6b6b'}">${need} (${available} im Lager)</span>
        </div>`;
      }
      html += `</div>`;
    }

    if (b.isBeingRepaired) {
      const pct = b.buildTime > 0 ? Math.min(100, Math.floor((b.progress / b.buildTime) * 100)) : 0;
      html += `<div class="info-section">
        <h4>🔧 Reparatur läuft</h4>
        <div class="info-row"><span class="label">Fortschritt:</span><span class="value">${pct}%</span></div>
        <div class="progress-bar"><div class="progress-bar-fill" style="width:${pct}%;background:#4A90E2"></div></div>
      </div>`;
    } else {
      html += `<div class="info-section">
        <h4>⏳ Warteschlange</h4>
        <div class="info-row"><span class="label">Status:</span><span class="value" style="color:#ffcc00">Wartet auf Material</span></div>
      </div>`;
    }

    return html;
  },

  _buildRaiderPanelHtml(b, vm) {
    const rv = Game.state && Game.state.raiderVillage;
    let html = '';

    const raiderIcon = `<img src="images/villager-krieger-blau.webp" style="width:24px;height:24px;object-fit:contain;vertical-align:middle;margin-right:4px;">`;

    if (!rv || rv.isDestroyed) {
      html += `<div class="info-section"><h4>${raiderIcon} Feindliches Gebäude</h4>`;
      html += `<div class="info-row"><span class="label">Status:</span><span class="value" style="color:#ff6b6b">Zerstört</span></div>`;
      html += `</div>`;
      return html;
    }

    html += `<div class="info-section"><h4>${raiderIcon} Feindliches Gebäude</h4>`;

    let alive = 0;
    let dead = 0;
    let inAttack = 0;
    let nextRespawn = Infinity;
    const now = performance.now();
    for (const w of rv.warriors.values()) {
      if (w.homeBuildingId !== b.id) continue;
      if (w.dead) {
        dead++;
        if (w.respawnAt && w.respawnAt < nextRespawn) nextRespawn = w.respawnAt;
        continue;
      }
      alive++;
      if (w.inAttack) inAttack++;
    }

    html += `<div class="info-row"><span class="label">Krieger:</span><span class="value">${alive} / ${b.maxWarriors}</span></div>`;
    if (dead > 0) {
      html += `<div class="info-row"><span class="label">Gefallen:</span><span class="value" style="color:#ff6b6b">${dead}</span></div>`;
      if (nextRespawn !== Infinity) {
        const secs = Math.max(0, Math.ceil((nextRespawn - now) / 1000));
        html += `<div class="info-row"><span class="label">Nächster Respawn:</span><span class="value">${secs}s</span></div>`;
      }
    }
    if (inAttack > 0) {
      html += `<div class="info-row"><span class="label">Im Angriff:</span><span class="value" style="color:#ff6b6b">${inAttack}</span></div>`;
    }
    html += `</div>`;

    if (rv.attackState) {
      html += `<div class="info-section"><h4>⚠️ Angriff läuft</h4>`;
      const st = rv.attackState;
      html += `<div class="info-row"><span class="label">Teilnehmer:</span><span class="value">${st.participants.size}</span></div>`;
      if (st.lootClaimed) {
        let total = 0;
        if (st.loot) for (const k in st.loot) total += st.loot[k];
        html += `<div class="info-row"><span class="label">Beute:</span><span class="value" style="color:#ffcc00">${total} Einheiten</span></div>`;
        if (st.lootLost) {
          html += `<div class="info-row"><span class="label">Status:</span><span class="value" style="color:#ff6b6b">Beute verloren</span></div>`;
        } else {
          html += `<div class="info-row"><span class="label">Status:</span><span class="value" style="color:#4A90E2">Rückzug</span></div>`;
        }
      } else {
        html += `<div class="info-row"><span class="label">Status:</span><span class="value" style="color:#f0a040">Marsch zum Schloss</span></div>`;
      }
      html += `</div>`;
    } else if (rv.nextAttackAt) {
      const secs = Math.max(0, Math.ceil((rv.nextAttackAt - now) / 1000));

      if (rv.attackTimerFrozen) {
        html += `<div class="info-section" style="background: rgba(74, 144, 226, 0.15); border: 1px solid #4A90E2; padding: 10px; border-radius: 8px;">
          <h4 style="color: #4A90E2; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
            🧊 Angriffs-Timer eingefroren
          </h4>
          <div class="info-row">
            <span class="label">Verbleibend:</span>
            <span class="value" style="color: #4A90E2;">${secs}s</span>
          </div>
          <div class="info-row" style="font-size: 11px; color: #888; margin-top: 4px;">
            <span>Gegenangriff läuft – Timer pausiert.</span>
          </div>
        </div>`;
      } else {
        html += `<div class="info-section"><h4>Nächster Angriff</h4>`;
        html += `<div class="info-row"><span class="label">In:</span><span class="value">${secs}s</span></div>`;
        html += `</div>`;
      }
    }

    let totalWarriors = 0;
    for (const v of vm.villagers.values()) {
      if (v.job === 'warrior' &&
          v.state !== 'attacking_raiders' &&
          v.state !== 'vfightback' &&
          v.state !== 'vdefend' &&
          v.state !== 'vfighting' &&
          v.state !== 'returning_to_post' &&
          v.state !== 'dragon_attack') {
        totalWarriors++;
      }
    }

    const raiderIsAttacking = !!rv.attackState;

    if (totalWarriors > 0) {
      if (raiderIsAttacking) {
        html += `<div class="info-section" style="background: #3a1e1e; padding: 10px; border-radius: 8px; border: 2px solid #a83232; margin-top: 10px;">
          <h4 style="color: #ff6b6b; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
            <img src="images/villager-krieger-rot.webp" style="width:20px;height:20px;object-fit:contain;"> 
            GEGENANGRIFF GESPERRT
          </h4>
          <div class="info-row" style="margin-bottom: 8px;">
            <span class="label">Verfügbare Krieger:</span>
            <span class="value" style="color: #ffcc00;">${totalWarriors}</span>
          </div>
          <div style="padding: 10px; background: rgba(168,50,50,0.2); border-radius: 6px; text-align: center; color: #ff8080; font-size: 12px; font-weight: 600;">
            ⚠️ Die Räuber greifen gerade an!<br>
            Verteidige zuerst dein Territorium.
          </div>
        </div>`;
      } else {
        html += `<div class="info-section" style="background: #3a1e1e; padding: 10px; border-radius: 8px; border: 1px solid #6e2b2b; margin-top: 10px;">
          <h4 style="color: #ff6b6b; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
            <img src="images/villager-krieger-rot.webp" style="width:20px;height:20px;object-fit:contain;"> 
            GEGENANGRIFF PLANEN
          </h4>
          <div class="info-row" style="margin-bottom: 8px;">
            <span class="label">Verfügbare Krieger:</span>
            <span class="value" style="color: #ffcc00;">${totalWarriors}</span>
          </div>
          <input type="range" id="attackSlider" min="1" max="${totalWarriors}" value="${totalWarriors}" style="width: 100%; margin-bottom: 8px; accent-color: #6e3b3b;">
          <div class="info-row" style="margin-bottom: 8px;">
            <span class="label">Ausgewählt:</span>
            <span class="value" id="attackSliderValue" style="color: #ff6b6b; font-weight: bold;">${totalWarriors}</span>
          </div>
          <button id="startRaidBtn" style="width: 100%; background: #6e3b3b; color: #fff; border: none; padding: 8px; border-radius: 6px; font-weight: bold; cursor: pointer;">Gegenangriff starten</button>
        </div>`;
      }
    } else {
      html += `<div class="info-section" style="background: #222; padding: 10px; border-radius: 8px; border: 1px solid #444; margin-top: 10px;">
        <h4 style="color: #888; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
          <img src="images/villager-krieger-rot.webp" style="width:20px;height:20px;object-fit:contain; opacity: 0.5;"> 
          Gegenangriff
        </h4>
        <div class="info-row"><span class="label" style="color: #888;">Keine Krieger verfügbar (alle im Einsatz).</span></div>
      </div>`;
    }

    return html;
  },

  // ==========================================================
  // VERSTECKTES DEBUG-MENÜ (10 Klicks in 30 Sekunden)
  // ==========================================================
  initSecretDebug(showInfoPanelCallback) {
    let clickTimes = [];
    const REQUIRED_CLICKS = 10;
    const TIME_WINDOW_MS = 30000;

    // Wir fangen die Klicks auf dem Info-Panel ab
    const infoPanel = document.getElementById('infoPanel');
    if (!infoPanel) return;

    infoPanel.addEventListener('click', (e) => {
      // Prüfen, ob auf das Icon (infoIcon) oder den Titel (infoTitle) geklickt wurde
      if (e.target.id === 'infoIcon' || e.target.closest('#infoIcon') || 
          e.target.id === 'infoTitle' || e.target.closest('#infoTitle')) {
        
        const now = performance.now();
        
        // Alte Klicks filtern (älter als 30 Sekunden)
        clickTimes = clickTimes.filter(t => now - t <= TIME_WINDOW_MS);
        
        // Neuen Klick hinzufügen
        clickTimes.push(now);

        // Prüfen, ob 10 Klicks erreicht sind
        if (clickTimes.length >= REQUIRED_CLICKS) {
          clickTimes = []; // Zurücksetzen
          this.openDebugWindow();
        }
      }
    });

    const debugCloseBtn = document.getElementById('debugWindowClose');
    if (debugCloseBtn) {
      debugCloseBtn.addEventListener('click', () => {
        document.getElementById('debugWindow').classList.add('hidden');
        // Spiel wieder fortsetzen, falls es pausiert war
        if (Game.state) Game.state.paused = false;
      });
    }
  },

  openDebugWindow() {
    const debugWindow = document.getElementById('debugWindow');
    const debugList = document.getElementById('debugTimersList');
    if (!debugWindow || !debugList) return;

    const gs = Game.state;
    if (!gs) return;

    // Spiel pausieren, damit man in Ruhe klicken kann
    gs.paused = true;
    
    const now = performance.now();
    debugList.innerHTML = '';

    const createTimerRow = (title, currentRemainingMs, setter) => {
      const secs = Math.max(0, Math.floor(currentRemainingMs / 1000));
      
      const row = document.createElement('div');
      row.style.cssText = 'background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px; border-left: 3px solid var(--brass);';
      
      row.innerHTML = `
        <div style="font-size: 15px; font-weight: bold; color: var(--brass-light); margin-bottom: 8px;">
          ${title}
        </div>
        <div style="font-size: 13px; color: var(--parchment); margin-bottom: 12px;">
          Aktuell: <span style="color: #ffcc00; font-weight: bold;">${secs}s</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <input type="number" id="input_${title.replace(/\s+/g, '_')}" placeholder="Sekunden eingeben..." value="${secs}" style="width: 100%; padding: 10px; background: #1e140a; border: 1px solid var(--wood-border); border-radius: 6px; color: var(--parchment); font-size: 14px;">
          <button id="btn_${title.replace(/\s+/g, '_')}" style="width: 100%; padding: 10px; background: var(--green-ok); color: #fff; border: none; border-radius: 6px; font-weight: bold; font-size: 14px;">Setzen</button>
        </div>
      `;

      // Event Listener für den Button
      setTimeout(() => {
        const btn = row.querySelector('button');
        const input = row.querySelector('input');
        if (btn && input) {
          btn.addEventListener('click', () => {
            const val = parseInt(input.value, 10);
            if (!isNaN(val) && val >= 0) {
              setter(val);
              // Kurzes Feedback
              btn.textContent = '✅ Gesetzt!';
              btn.style.background = '#4A90E2';
              setTimeout(() => {
                btn.textContent = 'Setzen';
                btn.style.background = 'var(--green-ok)';
              }, 1000);
            }
          });
        }
      }, 0);

      debugList.appendChild(row);
    };

    // --- DRACHE ---
    if (gs.dragonManager) {
      const dm = gs.dragonManager;
      const rem = dm.nextSpawnAt > 0 ? (dm.nextSpawnAt - now) : 0;
      createTimerRow('🐉 Drache', rem, (val) => {
        dm._defenseReady = true;
        dm.nextSpawnAt = performance.now() + (val * 1000);
        dm._lastUpdateTime = performance.now();
      });
    }

    // --- PLAGE ---
    if (gs.plagueManager) {
      const pm = gs.plagueManager;
      const rem = pm.nextPlagueAt > 0 ? (pm.nextPlagueAt - now) : 0;
      createTimerRow('☣️ Plage', rem, (val) => {
        pm._started = true;
        pm.nextPlagueAt = performance.now() + (val * 1000);
        pm.activeUntil = 0;
        pm.activeType = null;
        pm._lastUpdateTime = performance.now();
      });
    }

    // --- FEUER ---
    if (gs.fireManager) {
      const fm = gs.fireManager;
      const rem = fm.nextFireAt > 0 ? (fm.nextFireAt - now) : 0;
      createTimerRow('🔥 Feuer', rem, (val) => {
        fm._started = true;
        fm.nextFireAt = performance.now() + (val * 1000);
        fm.activeFires = []; // Bestehende Feuer löschen
        fm._lastUpdateTime = performance.now();
      });
    }

    // --- ERDBEBEN ---
    if (gs.earthquakeManager) {
      const em = gs.earthquakeManager;
      const rem = em.nextEarthquakeAt > 0 ? (em.nextEarthquakeAt - now) : 0;
      createTimerRow('🌍 Erdbeben', rem, (val) => {
        em._started = true;
        em.sacrificed = false;
        em.nextEarthquakeAt = performance.now() + (val * 1000);
        em._lastUpdateTime = performance.now();
      });
    }

    // --- RÄUBER ---
    if (gs.raiderVillage && !gs.raiderVillage.isDestroyed) {
      const rv = gs.raiderVillage;
      const rem = rv.nextAttackAt > 0 ? (rv.nextAttackAt - now) : 0;
      createTimerRow('🏴 Räuber-Angriff', rem, (val) => {
        rv.nextAttackAt = performance.now() + (val * 1000);
        rv.attackTimerFrozen = false;
      });
    }

    // --- ZOMBIES ---
    if (gs.zombieManager) {
      const zm = gs.zombieManager;
      const rem = (zm.spawnCooldown || 0) * 1000;
      createTimerRow('🧟 Zombie-Spawn', rem, (val) => {
        zm.spawnCooldown = val;
      });
    }

    debugWindow.classList.remove('hidden');
  }
};
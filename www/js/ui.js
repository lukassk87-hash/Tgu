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
    dragonBone: 'images/drachenknochen.webp',
    raiderHerb: 'images/icon_raeuberkraut.webp',
    antibiotics: 'images/icon_antibiotika.webp'
  },
  resourceNames: {
    wood: 'Holz', stone: 'Stein', grain: 'Weizen', fish: 'Fisch',
    water: 'Wasser', beer: 'Bier', woodPlank: 'Bretter', flour: 'Mehl', bread: 'Brot',
    arrows: 'Pfeile',
    feed: 'Futter', pig: 'Schwein', meat: 'Fleisch',
    dragonBone: 'Drachenknochen',
    raiderHerb: 'Räuberkraut',
    antibiotics: 'Antibiotika'
  },

  _fireLogInterval: null,

  _logToDebug(msg, color = '#0f0') {
    const logEl = document.getElementById('debugFireLogContent');
    if (!logEl) return;

    const time = new Date().toLocaleTimeString('de-DE');
    const line = document.createElement('div');
    line.style.color = color;
    line.textContent = `[${time}] ${msg}`;

    logEl.appendChild(line);
    logEl.scrollTop = logEl.scrollHeight;

    console.log(`[DEBUG] ${msg}`);
  },

  _clearDebugLog() {
    const logEl = document.getElementById('debugFireLogContent');
    if (logEl) logEl.innerHTML = '';
  },

  resourceIcon(key) {
    if (this.resourceImages[key]) {
      return `<img src="${this.resourceImages[key]}" style="width:18px;height:18px;vertical-align:middle;margin-right:4px;object-fit:contain;" onerror="this.style.display='none'">`;
    }
    const fallbacks = {
      water: '💧', beer: '🍺', woodPlank: '🪵', flour: '🌾', bread: '🍞', arrows: '🏹',
      feed: '🥣', pig: '🐷', meat: '🥩', dragonBone: '🦴',
      raiderHerb: '🌿', antibiotics: '💊'
    };
    return `<span style="display:inline-block;width:18px;text-align:center;margin-right:4px;">${fallbacks[key] || '•'}</span>`;
  },

  _getLiveWinChances(v) {
    if (!v) return { zombie: 0.60, raider: 0.60 };

    const level = v.warriorLevel || 1;
    const beerBuff = !!v.beerBuff;

    const levelBonus = (level - 1) * 0.05;

    let zombieChance = 0.60 + levelBonus;
    if (beerBuff) zombieChance += 0.15;

    let raiderChance = 0.60 + levelBonus;

    return {
      zombie: Math.min(1.0, zombieChance),
      raider: Math.min(1.0, raiderChance)
    };
  },

  getDetailedWorkerStatus(v, b, now) {
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
  },

  describeVillager(v) {
    if (!v) return '';
    const b = v.workplaceId && Game.state && Game.state.world ? Game.state.world.buildings.get(v.workplaceId) : null;
    return this.getDetailedWorkerStatus(v, b, performance.now());
  },

  villagerStateEmoji(v) {
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
      if (dx * dx + dy * dy <= range * range) return true;
    }
    return false;
  },

  _villagerRowHtml(w, vm, opts) {
    if (!w) {
      return `<div class="info-item" style="padding-left:8px;font-size:11px;color:#555;">• (verstorben)</div>`;
    }

    const now = performance.now();
    const workplace = w.workplaceId ? vm && Game.state && Game.state.world
      ? Game.state.world.buildings.get(w.workplaceId)
      : null
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
  },

  villagerEmojiPath(v, b) {
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
  },

  buildPanelHtml(b, vm, economy) {
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
    const rangeLabel = inRange ? 'In Feuerwehr-Reichweite' : 'Nicht in Feuerwehr-Reichweite';
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
        const spreadText = elapsed < times.spreadTimeMs ? `Ausbreitung in ${remainingSpread}s` : 'Ausbreitung erfolgt';
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
    const plagueMgr = Game.state && Game.state.plagueManager;
    if (plagueMgr && plagueMgr.isActive(performance.now())) {
      const rem = Math.max(0, Math.ceil((plagueMgr.activeUntil - performance.now()) / 1000));
      if (plagueMgr.activeType === 'pig' && b.def.id === 'pigFarm') {
        html += `<div class="castle-warning" style="background: rgba(168,111,51,0.2); border-color:#a86f33; color:#e0b070; display:flex; align-items:center; gap:10px;"><img src="images/schwein-krank.webp" alt="" style="width:36px;height:36px;object-fit:contain;flex-shrink:0;"><span><b>Schweinepest aktiv!</b><br>Produktion eingestellt - noch ${rem}s.</span></div>`;
      } else if (plagueMgr.activeType === 'rat' && b.def.id === 'bakery') {
        html += `<div class="castle-warning" style="background: rgba(107,107,107,0.2); border-color:#6b6b6b; color:#c0c0c0; display:flex; align-items:center; gap:10px;"><img src="images/ratte.webp" alt="" style="width:36px;height:36px;object-fit:contain;flex-shrink:0;"><span><b>Rattenplage aktiv!</b><br>Produktion halbiert - noch ${rem}s.</span></div>`;
      } else if (plagueMgr.activeType === 'drought' && b.def.id === 'farm') {
        html += `<div class="castle-warning" style="background: rgba(230,168,23,0.2); border-color:#e6a817; color:#ffcc00; display:flex; align-items:center; gap:10px;"><img src="images/sonne.webp" alt="" style="width:36px;height:36px;object-fit:contain;flex-shrink:0;"><span><b>Dürre aktiv!</b><br>Kein Getreide - noch ${rem}s.</span></div>`;
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
        <button id="saveGameBtn" style="width:100%; padding:10px; background:#3b6e3b; color:#fff; border:none; border-radius:6px; cursor:pointer; font-weight:600; font-size:15px; margin-bottom: 8px;">💾 Spiel speichern</button>
        <button id="centerCastleBtn" class="camera-jump-btn">🏰 Zum Schloss springen</button>
        <button id="repairJobsBtn" class="repair-jobs-btn">🛠️ Klemmt etwas? Klicke hier</button>
        <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:13px; color:#ccc; padding: 4px 0; margin-top: 8px;">
          <input type="checkbox" id="autosaveCheckbox" ${Game.state.autosaveEnabled ? 'checked' : ''} style="width:auto; margin:0; accent-color:#3b6e3b;">
          Autosave alle 5 Minuten
        </label>
      </div>`;
      if (b.dragonHits > 0) {
        const remaining = (b.def.dragonHits || 3) - b.dragonHits;
        html += `<div class="castle-warning">🐉 Drachenschaden: ${b.dragonHits}/${b.def.dragonHits || 3}<br>Noch ${remaining} Treffer bis zum Game Over!</div>`;
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

      const fighterStatus = fighterV ? fighterV.name : '<span style="color:#888">Kein Löscher</span>';
      const refillStatus = refillV ? refillV.name : '<span style="color:#888">Kein Nachfüller</span>';

      html += `<div class="info-section" style="background:#2a2d31; padding:10px; border-radius:8px; border:1px solid #444; margin-top:6px;">
        <h4 style="color:#4A90E2; margin-bottom:6px; display:flex; align-items:center; gap:6px;"><img src="images/feuerwehr.webp" style="width:18px;height:18px;object-fit:contain;"> Feuerwehr</h4>
        <div class="info-row"><span class="label">Wasser:</span><span class="value">${b.storage || 0} / ${maxW}</span></div>
        <div class="progress-bar"><div class="progress-bar-fill" style="width:${waterPct}%;background:#4A90E2"></div></div>
        <div class="info-row" style="margin-top:6px;"><span class="label">Einsatzradius:</span><span class="value">${b.def.extinguishRadius || 15} Felder</span></div>
        <div class="info-row"><span class="label">Wasser pro Fahrt:</span><span class="value">${b.def.waterCarryAmount || 5}</span></div>
      </div>`;

      html += `<div class="info-section" style="background:#2a2d31; padding:10px; border-radius:8px; border:1px solid #444; margin-top:6px;">
        <h4 style="color:#ff8a5c; margin-bottom:6px; display:flex; align-items:center; gap:6px;"><img src="images/feuerwehrmann.webp" style="width:18px;height:18px;object-fit:contain;"> Personal (${(b.workerIds ? b.workerIds.length : 0)} / ${maxWorkers})</h4>
        <div class="info-row">
          <span class="label">🔴 Löscher:</span>
          <span class="value" style="color:${fighterV ? '#7ad07a' : '#888'}">${fighterStatus}</span>
        </div>
        <div class="info-row">
          <span class="label">💧 Nachfüller:</span>
          <span class="value" style="color:${refillV ? '#7ad07a' : '#888'}">${refillStatus}</span>
        </div>
      </div>`;

      if (fighterV || refillV) {
        html += `<div class="info-section"><h4>Bewohner</h4>`;
        if (fighterV) {
          html += `<div style="margin-bottom:6px;"><div style="font-size:11px; color:#ff8a5c; font-weight:700; margin-bottom:2px;">🔴 Löscher</div>${this._villagerRowHtml(fighterV, vm)}</div>`;
        }
        if (refillV) {
          html += `<div><div style="font-size:11px; color:#4A90E2; font-weight:700; margin-bottom:2px;">💧 Nachfüller</div>${this._villagerRowHtml(refillV, vm)}</div>`;
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
        <h4 style="color:#7ad07a; margin-bottom:6px; display:flex; align-items:center; gap:6px;"><img src="images/arztpraxis.webp" style="width:18px;height:18px;object-fit:contain;"> Arztpraxis</h4>
        <div class="info-row"><span class="label">Arzt:</span><span class="value" style="color:${doctor ? '#7ad07a' : '#888'}">${doctor ? doctor.name : 'Kein Arzt'}</span></div>
        <div class="info-row"><span class="label">Antibiotika:</span><span class="value">${b.antibioticStorage || 0} / ${maxAb}</span></div>
        <div class="progress-bar"><div class="progress-bar-fill" style="width:${abPct}%;background:#7ad07a"></div></div>
        <div class="info-row" style="margin-top:6px;"><span class="label">Behandlungszeit:</span><span class="value">${((b.def.treatmentTimeMs || 5000) / 1000).toFixed(1)}s</span></div>
        <div class="info-row"><span class="label">Wartend (global):</span><span class="value" style="color:${globalQueue.length > 0 ? '#ffcc00' : '#888'}">${globalQueue.length}</span></div>
      </div>`;

      if (currentPatient) {
        html += `<div class="info-section" style="background:rgba(74,144,226,0.15); padding:10px; border-radius:8px; border:1px solid #4A90E2; margin-top:6px;">
          <h4 style="color:#4A90E2; margin-bottom:6px;">🏥 In Behandlung</h4>
          <div class="info-row"><span class="label">Patient:</span><span class="value">${currentPatient.name}</span></div>
          <div class="info-row"><span class="label">Verbleibend:</span><span class="value" style="color:#4A90E2;">${treatmentRemaining}s</span></div>
        </div>`;
      } else {
        html += `<div class="info-section" style="background:rgba(80,80,80,0.15); padding:10px; border-radius:8px; border:1px solid #555; margin-top:6px;">
          <h4 style="color:#aaa; margin-bottom:6px;">🏥 Aktuell</h4>
          <div class="info-row"><span class="label" style="color:#aaa;">Kein Patient in Behandlung</span></div>
        </div>`;
      }

      if (globalQueue.length > 0) {
        html += `<div class="info-section" style="margin-top:6px;">
          <h4 style="color:#ffcc00; margin-bottom:6px;">⏳ Globale Warteschlange (${globalQueue.length})</h4>
          <div style="font-size:11px; color:#888; margin-bottom:6px; font-style:italic;">Patienten warten auf den nächsten freien Arzt</div>`;
        for (const pid of globalQueue) {
          const p = vm.villagers.get(pid);
          html += this._villagerRowHtml(p, vm);
        }
        html += `</div>`;
      }

      if (doctor) {
        html += `<div class="info-section"><h4>Arzt</h4>
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
          <img src="images/villager-krieger-rot.webp" style="width:18px;height:18px;object-fit:contain;"> Militär
        </h4>
        <div class="info-row"><span class="label">Krieger:</span><span class="value">${totalWarriors} / ${b.warriorSlots.length}</span></div>
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
            <img src="images/icon_bretter.webp" style="width:18px;height:18px;object-fit:contain;filter:hue-rotate(180deg);"> Transport
          </h4>
          <div class="info-row">
            <span class="label">Ressource:</span>
            <span class="value">${R_ICON(outputResource)} ${R_NAME(outputResource)}</span>
          </div>
          <div class="info-row">
            <span class="label">Transport-Prio:</span>
            <span class="value" style="color:${prioColor}; font-weight:bold;">${prioDisplay} / ${transportPrios.length}</span>
          </div>
          <div style="font-size:11px; color:#888; margin-top:4px; font-style:italic;">
            ${prioDisplay <= 3 ? 'Wird bevorzugt abgeholt.' : prioDisplay <= 8 ? 'Wird bei Gelegenheit abgeholt.' : 'Wird zuletzt abgeholt.'}
          </div>
        </div>`;
      }
    }

    if (b.def.id !== 'castle') {
      if (b.paused) {
        html += `<div class="info-section"><button id="resumeBuildingBtn" style="width:100%; padding:10px; background:#3b6e3b; color:#fff; border:none; border-radius:6px; cursor:pointer; font-weight:600; font-size:14px; display:flex; align-items:center; justify-content:center; gap:6px;">▶ Gebäude wieder aktivieren</button></div>`;
      } else {
        html += `<div class="info-section"><button id="pauseBuildingBtn" style="width:100%; padding:10px; background:#6e3b3b; color:#fff; border:none; border-radius:6px; cursor:pointer; font-weight:600; font-size:14px; display:flex; align-items:center; justify-content:center; gap:6px;">⏸ Gebäude stilllegen</button></div>`;
      }
    }

    if (b.def.hasArrowStop) {
      const threshold = b.arrowStopThreshold !== undefined ? b.arrowStopThreshold : 500;
      const current = Math.floor(economy.res.arrows || 0);
      const stopped = current >= threshold;
      html += `<div class="info-section" style="background:#2a2d31; padding:10px; border-radius:8px; border:1px solid #444; margin-top:6px;">
        <h4 style="color:#ffcc00; margin-bottom:6px; display:flex; align-items:center; gap:6px;"><img src="images/icon_pfeil.webp" style="width:18px;height:18px;object-fit:contain;"> Produktionsstop</h4>
        <div class="info-row" style="margin-bottom:6px;"><span class="label">Aktuell (global):</span><span class="value" style="color:${stopped ? '#ff6b6b' : '#7ad07a'}">${current}</span></div>
        <label style="display:flex; flex-direction:column; gap:4px; font-size:12px; color:#aaa;">Stop ab (Stück):<input type="number" id="arrowStopInput" min="0" step="10" value="${threshold}" style="background:#1e1f22; color:#eee; border:1px solid #555; border-radius:6px; padding:6px 8px; font-size:14px; width:100%;" /></label>
        <div class="info-row" style="margin-top:6px;"><span class="label">Status:</span><span class="value" style="color:${stopped ? '#ff6b6b' : '#7ad07a'}">${stopped ? 'Gestoppt' : 'Produziert'}</span></div>
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
        <h4 style="color:#4A90E2; margin-bottom:6px; display:flex; align-items:center; gap:6px;"><img src="images/bogenschussanlage.webp" style="width:18px;height:18px;object-fit:contain;"> Verteidigung</h4>
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
          <h4 style="font-size:11px; color:#aaa; margin-bottom:4px; display:flex; align-items:center; gap:4px;"><img src="images/icon_pfeil.webp" style="width:14px;height:14px;object-fit:contain;"> Pfeil-Lager (Turm)</h4>
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
      for (const key of ['wood', 'stone', 'grain', 'fish', 'water', 'beer', 'woodPlank', 'flour', 'bread', 'arrows', 'feed', 'pig', 'meat', 'dragonBone', 'raiderHerb', 'antibiotics']) {
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
      html += `<div class="info-section"><h4>Ausgangs-Lager</h4><div class="info-row"><span class="label">${R_ICON(res)} ${R_NAME(res)}</span><span class="value">${b.storage} / ${b.maxCapacity}</span></div>`;
      if (b.maxCapacity > 0) {
        const pct = Math.min(100, Math.floor((b.storage / b.maxCapacity) * 100));
        html += `<div class="progress-bar"><div class="progress-bar-fill" style="width:${pct}%"></div></div>`;
      }
      html += `</div>`;
    }
    if (b.def.generatesResource) {
      html += `<div class="info-section"><h4>Produktion</h4><div class="info-row"><span class="label">${R_ICON(b.def.generatesResource)} ${R_NAME(b.def.generatesResource)}</span><span class="value">${b.storage} / ${b.maxCapacity}</span></div>`;
      const pct = b.maxCapacity > 0 ? Math.min(100, Math.floor((b.storage / b.maxCapacity) * 100)) : 0;
      html += `<div class="progress-bar"><div class="progress-bar-fill" style="width:${pct}%"></div></div>`;
      const timeLeft = Math.max(0, b.def.generatesInterval - (b.generatesTimer || 0));
      html += `<div class="info-row"><span class="label">Nächste Ladung in:</span><span class="value">${Math.ceil(timeLeft)}s</span></div>`;
      html += `<div class="info-row"><span class="label">Menge:</span><span class="value">+${b.def.generatesAmount} alle ${b.def.generatesInterval}s</span></div></div>`;
    }
    if (b.def.consumesFish) {
      html += `<div class="info-section"><h4 style="display:flex; align-items:center; gap:6px;"><img src="images/icon_fisch.webp" style="width:18px;height:18px;object-fit:contain;"> Fisch-Slots</h4>`;
      const slots = b.fishSlots || 0;
      let icons = '';
      for (let i = 0; i < 3; i++) {
        if (i < slots) icons += `<img src="images/icon_fisch.webp" style="width:16px;height:16px;object-fit:contain;margin-right:2px;">`;
        else icons += `<span style="display:inline-block;width:16px;height:16px;background:#444;border-radius:50%;margin-right:2px;"></span>`;
      }
      const eff = slots > 0 ? 100 : 25;
      html += `<div class="info-row"><span class="label">Slots:</span><span class="value" style="display:flex; align-items:center;">${icons}</span></div>`;
      html += `<div class="info-row"><span class="label">Effizienz:</span><span class="value" style="color:${eff === 100 ? '#7ad07a' : '#f0a040'}">${eff}%</span></div>`;
      const secsLeft = Math.max(0, b.fishConsumeTimer || 0);
      html += `<div class="info-row"><span class="label">Nächster Verbrauch:</span><span class="value">${secsLeft}s</span></div>`;
      if (b.fishPendingFetch) html += `<div class="info-row"><span class="label">Status:</span><span class="value" style="color:#4A90E2">Holt Fische…</span></div>`;
      else if (slots === 0 && b.fishRetryTimer < 0) html += `<div class="info-row"><span class="label">Nächster Versuch:</span><span class="value">${-b.fishRetryTimer}s</span></div>`;
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

      if (b.workerId !== null) {
        const worker = vm.villagers.get(b.workerId);
        if (worker && worker.isSick) {
          html += `<div class="info-row" style="background:rgba(168,50,50,0.2); border:1px solid #a83232; border-radius:4px; padding:4px 8px; margin-top:4px;">
            <span class="label" style="color:#ff8080; display:flex; align-items:center; gap:4px;">
              <img src="images/krank.webp" style="width:16px;height:16px;object-fit:contain;"> Arbeiter krank:
            </span>
            <span class="value" style="color:#ff8080;">×3 Wartezeit</span>
          </div>`;
        }
      }

      const timerPct = Math.min(100, Math.floor(((b.recipeTimer || 0) / (b.def.recipeInterval || 30)) * 100));
      html += `<div class="info-row"><span class="label">Fortschritt:</span><span class="value">${timerPct}%</span></div>`;
      html += `<div class="progress-bar"><div class="progress-bar-fill" style="width:${timerPct}%"></div></div>`;
      html += `</div>`;
    }
    if (b.def.produces || b.def.recipe) {
      const outputKey = b.def.produces || b.def.recipe.output;
      html += `<div class="info-section"><h4>Ausgangs-Lager</h4><div class="info-row"><span class="label">${R_ICON(outputKey)} ${R_NAME(outputKey)}</span><span class="value">${b.storage} / ${b.maxCapacity}</span></div>`;
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
      html += `<div class="progress-bar"><div class="progress-bar-fill" style="width:${beerPct}%;background:#d4a017"></div></div></div>`;
    }
    if (b.def.id === 'house') {
      html += `<div class="info-section"><h4 style="display:flex; align-items:center; gap:6px;"><img src="images/haus-rot.webp" style="width:18px;height:18px;object-fit:contain;"> Einwohner</h4>`;
      
      const maxRes = b.def.maxResidents || 5;
      const allResidents = [];
      for (const v of vm.villagers.values()) {
        if (v.homeId === b.id) {
          allResidents.push(v);
        }
      }
      
      const activeCount = allResidents.length;
      
      html += `<div class="info-row"><span class="label">Einwohner</span><span class="value">${activeCount} / ${maxRes}</span></div>`;
      
      const spawnTime = 30 - (b.spawnTimer || 0);
      if (activeCount < maxRes) {
        html += `<div class="info-row"><span class="label">Nächster Einwohner in:</span><span class="value" style="color:#7ad07a">${Math.max(0, spawnTime)}s</span></div>`;
      }
      
      for (const w of allResidents) {
        html += this._villagerRowHtml(w, vm);
      }
      
      html += `</div>`;
    }

    // ==========================================================
    // NEU: Bewohner-Anzeige für alle anderen Gebäude mit Worker
    // (Rezeptgebäude, Produktionsgebäude, etc.)
    // ==========================================================
    const hasAnyWorker = 
      (b.workerId !== null) || 
      (b.workerIds && b.workerIds.some(id => id !== null));
      
    const isSpecialBuilding = 
      b.def.id === 'house' || 
      b.def.id === 'castle' || 
      b.def.id === 'fireStation' || 
      b.def.id === 'arztpraxis';

    if (hasAnyWorker && !isSpecialBuilding && b.warriorSlots?.length === 0) {
      html += `<div class="info-section"><h4 style="display:flex; align-items:center; gap:6px;"><img src="${b.def.asset || 'images/villager-idle-rot.webp'}" style="width:18px;height:18px;object-fit:contain;"> Bewohner</h4>`;
      
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
      html += `<div class="info-section"><h4>Wirkungsradius</h4><div class="info-row"><span class="label">Radius:</span><span class="value">${radius} Felder</span></div></div>`;
    }
    return html;
  },

  _buildDragonPanelHtml(d) {
    let html = '';
    const statusMap = { flying: 'Fliegend', attacking: 'Greift an', grounded: 'Am Boden (wehrlos)' };
    const stateClass = { flying: 'dragon-status-flying', attacking: 'dragon-status-attack', grounded: 'dragon-status-grounded' };
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
      html += `<div class="info-section"><h4>⚔️ Boden-Timer</h4><div class="info-row"><span class="label">Verbleibend:</span><span class="value" style="color:${remaining <= 3 ? '#ff3030' : '#ffcc00'}">${remaining}s</span></div><div class="progress-bar"><div class="progress-bar-fill" style="width:${Math.min(100, (remaining / 10) * 100)}%;background:#ff8a5c"></div></div><div style="font-size:11px; color:#ff8a5c; margin-top:6px;">5 Krieger müssen ihn innerhalb von 10 Sek erreichen!</div></div>`;
    }
    if (d.targetBuildingId) {
      const target = Game.state && Game.state.world ? Game.state.world.buildings.get(d.targetBuildingId) : null;
      if (target) {
        html += `<div class="info-section"><h4>🎯 Ziel</h4><div class="info-row"><span class="label">Gebäude:</span><span class="value">${target.def.name}</span></div><div class="info-row"><span class="label">Position:</span><span class="value">${target.x}, ${target.y}</span></div></div>`;
      }
    }
    if (d.castleHits > 0) {
      html += `<div class="castle-warning">🏰 Schloss getroffen: ${d.castleHits}× / 3</div>`;
    }
    return html;
  },

  _buildRuinPanelHtml(b, vm, economy) {
    const R_ICON = (k) => this.resourceIcon(k);
    const R_NAME = (k) => this.resourceNames[k];
    let html = '';
    html += `<div class="info-section"><div class="info-row"><span class="label">Status:</span><span class="value" style="color:#ff6b6b">🏚️ Zerstört</span></div><div class="info-row"><span class="label">Gebäude:</span><span class="value">${b.def.name}</span></div></div>`;
    html += `<div class="ruin-info">Die Bauarbeiter reparieren dieses Gebäude automatisch, sobald genug Material im Lager ist.</div>`;
    const cost = b.repairCostCache || (Game.state && Game.state.world ? Game.state.world.getRepairCost(b) : null);
    if (cost) {
      html += `<div class="info-section"><h4>🔧 Reparatur-Material</h4>`;
      for (const k in cost) {
        const need = cost[k];
        const available = Math.floor(economy.res[k] || 0);
        const enough = available >= need;
        html += `<div class="info-row"><span class="label">${R_ICON(k)} ${R_NAME(k)}</span><span class="value" style="color:${enough ? '#7ad07a' : '#ff6b6b'}">${need} (${available} im Lager)</span></div>`;
      }
      html += `</div>`;
    }
    if (b.isBeingRepaired) {
      const pct = b.buildTime > 0 ? Math.min(100, Math.floor((b.progress / b.buildTime) * 100)) : 0;
      html += `<div class="info-section"><h4>🔧 Reparatur läuft</h4><div class="info-row"><span class="label">Fortschritt:</span><span class="value">${pct}%</span></div><div class="progress-bar"><div class="progress-bar-fill" style="width:${pct}%;background:#4A90E2"></div></div></div>`;
    } else {
      html += `<div class="info-section"><h4>⏳ Warteschlange</h4><div class="info-row"><span class="label">Status:</span><span class="value" style="color:#ffcc00">Wartet auf Material</span></div></div>`;
    }
    return html;
  },

  _buildRaiderPanelHtml(b, vm) {
    const rv = Game.state && Game.state.raiderVillage;
    let html = '';
    const raiderIcon = `<img src="images/villager-krieger-blau.webp" style="width:24px;height:24px;object-fit:contain;vertical-align:middle;margin-right:4px;">`;
    if (!rv || rv.isDestroyed) {
      html += `<div class="info-section"><h4>${raiderIcon} Feindliches Gebäude</h4><div class="info-row"><span class="label">Status:</span><span class="value" style="color:#ff6b6b">Zerstört</span></div></div>`;
      return html;
    }
    html += `<div class="info-section"><h4>${raiderIcon} Feindliches Gebäude</h4>`;
    let alive = 0, dead = 0, inAttack = 0, nextRespawn = Infinity;
    const now = performance.now();
    for (const w of rv.warriors.values()) {
      if (w.homeBuildingId !== b.id) continue;
      if (w.dead) { dead++; if (w.respawnAt && w.respawnAt < nextRespawn) nextRespawn = w.respawnAt; continue; }
      alive++;
      if (w.inAttack) inAttack++;
    }
    html += `<div class="info-row"><span class="label">Krieger:</span><span class="value">${alive} / ${b.maxWarriors}</span></div>`;
    if (dead > 0) {
      html += `<div class="info-row"><span class="label">Gefallen:</span><span class="value" style="color:#ff6b6b">${dead}</span></div>`;
      if (nextRespawn !== Infinity) { const secs = Math.max(0, Math.ceil((nextRespawn - now) / 1000)); html += `<div class="info-row"><span class="label">Nächster Respawn:</span><span class="value">${secs}s</span></div>`; }
    }
    if (inAttack > 0) html += `<div class="info-row"><span class="label">Im Angriff:</span><span class="value" style="color:#ff6b6b">${inAttack}</span></div>`;
    html += `</div>`;
    if (rv.attackState) {
      html += `<div class="info-section"><h4>⚠️ Angriff läuft</h4>`;
      const st = rv.attackState;
      html += `<div class="info-row"><span class="label">Teilnehmer:</span><span class="value">${st.participants.size}</span></div>`;
      if (st.lootClaimed) {
        let total = 0;
        if (st.loot) for (const k in st.loot) total += st.loot[k];
        html += `<div class="info-row"><span class="label">Beute:</span><span class="value" style="color:#ffcc00">${total} Einheiten</span></div>`;
        if (st.lootLost) html += `<div class="info-row"><span class="label">Status:</span><span class="value" style="color:#ff6b6b">Beute verloren</span></div>`;
        else html += `<div class="info-row"><span class="label">Status:</span><span class="value" style="color:#4A90E2">Rückzug</span></div>`;
      } else {
        html += `<div class="info-row"><span class="label">Status:</span><span class="value" style="color:#f0a040">Marsch zum Schloss</span></div>`;
      }
      html += `</div>`;
    } else if (rv.nextAttackAt) {
      const secs = Math.max(0, Math.ceil((rv.nextAttackAt - now) / 1000));
      if (rv.attackTimerFrozen) {
        html += `<div class="info-section" style="background: rgba(74, 144, 226, 0.15); border: 1px solid #4A90E2; padding: 10px; border-radius: 8px;"><h4 style="color: #4A90E2; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">🧊 Angriffs-Timer eingefroren</h4><div class="info-row"><span class="label">Verbleibend:</span><span class="value" style="color: #4A90E2;">${secs}s</span></div><div class="info-row" style="font-size: 11px; color: #888; margin-top: 4px;"><span>Gegenangriff läuft – Timer pausiert.</span></div></div>`;
      } else {
        html += `<div class="info-section"><h4>Nächster Angriff</h4><div class="info-row"><span class="label">In:</span><span class="value">${secs}s</span></div></div>`;
      }
    }
    let totalWarriors = 0;
    for (const v of vm.villagers.values()) {
      if (v.job === 'warrior' && v.state !== 'attacking_raiders' && v.state !== 'vfightback' && v.state !== 'vdefend' && v.state !== 'vfighting' && v.state !== 'returning_to_post' && v.state !== 'dragon_attack') totalWarriors++;
    }
    const raiderIsAttacking = !!rv.attackState;
    if (totalWarriors > 0) {
      if (raiderIsAttacking) {
        html += `<div class="info-section" style="background: #3a1e1e; padding: 10px; border-radius: 8px; border: 2px solid #a83232; margin-top: 10px;"><h4 style="color: #ff6b6b; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;"><img src="images/villager-krieger-rot.webp" style="width:20px;height:20px;object-fit:contain;"> GEGENANGRIFF GESPERRT</h4><div class="info-row" style="margin-bottom: 8px;"><span class="label">Verfügbare Krieger:</span><span class="value" style="color: #ffcc00;">${totalWarriors}</span></div><div style="padding: 10px; background: rgba(168,50,50,0.2); border-radius: 6px; text-align: center; color: #ff8080; font-size: 12px; font-weight: 600;">⚠️ Die Räuber greifen gerade an!<br>Verteidige zuerst dein Territorium.</div></div>`;
      } else {
        html += `<div class="info-section" style="background: #3a1e1e; padding: 10px; border-radius: 8px; border: 1px solid #6e2b2b; margin-top: 10px;"><h4 style="color: #ff6b6b; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;"><img src="images/villager-krieger-rot.webp" style="width:20px;height:20px;object-fit:contain;"> GEGENANGRIFF PLANEN</h4><div class="info-row" style="margin-bottom: 8px;"><span class="label">Verfügbare Krieger:</span><span class="value" style="color: #ffcc00;">${totalWarriors}</span></div><input type="range" id="attackSlider" min="1" max="${totalWarriors}" value="${totalWarriors}" style="width: 100%; margin-bottom: 8px; accent-color: #6e3b3b;"><div class="info-row" style="margin-bottom: 8px;"><span class="label">Ausgewählt:</span><span class="value" id="attackSliderValue" style="color: #ff6b6b; font-weight: bold;">${totalWarriors}</span></div><button id="startRaidBtn" style="width: 100%; background: #6e3b3b; color: #fff; border: none; padding: 8px; border-radius: 6px; font-weight: bold; cursor: pointer;">Gegenangriff starten</button></div>`;
      }
    } else {
      html += `<div class="info-section" style="background: #222; padding: 10px; border-radius: 8px; border: 1px solid #444; margin-top: 10px;"><h4 style="color: #888; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;"><img src="images/villager-krieger-rot.webp" style="width:20px;height:20px;object-fit:contain; opacity: 0.5;"> Gegenangriff</h4><div class="info-row"><span class="label" style="color: #888;">Keine Krieger verfügbar (alle im Einsatz).</span></div></div>`;
    }
    return html;
  },

  initSecretDebug(showInfoPanelCallback) {
    let clickTimes = [];
    const REQUIRED_CLICKS = 10;
    const TIME_WINDOW_MS = 30000;
    const infoPanel = document.getElementById('infoPanel');
    if (!infoPanel) return;

    infoPanel.addEventListener('click', (e) => {
      if (e.target.id === 'infoIcon' || e.target.closest('#infoIcon') || e.target.id === 'infoTitle' || e.target.closest('#infoTitle')) {
        const now = performance.now();
        clickTimes = clickTimes.filter(t => now - t <= TIME_WINDOW_MS);
        clickTimes.push(now);
        if (clickTimes.length >= REQUIRED_CLICKS) {
          clickTimes = [];
          this.openDebugWindow();
        }
      }
    });

    const debugCloseBtn = document.getElementById('debugWindowClose');
    if (debugCloseBtn) {
      debugCloseBtn.addEventListener('click', () => {
        document.getElementById('debugWindow').classList.add('hidden');
        if (Game.state) Game.state.paused = false;
        this._stopFireLog();
      });
    }

    const cmdInput = document.getElementById('debugCommandInput');
    const cmdSend = document.getElementById('debugCommandSend');

    if (cmdSend && cmdInput) {
      const execute = () => {
        const val = cmdInput.value.trim();
        if (!val) return;
        this._logToDebug(`> ${val}`, '#ffcc00');
        this._executeDebugCommand(val);
        cmdInput.value = '';
      };
      cmdSend.addEventListener('click', execute);
      cmdInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') execute();
      });
    }
  },

  _executeDebugCommand(cmd) {
    const lower = cmd.toLowerCase().trim();

    if (lower === 'help') {
      this._logToDebug('Verfügbare Befehle (Kurzbefehle):', '#4A90E2');
      this._logToDebug('  help                - Diese Liste anzeigen', '#fff');
      this._logToDebug('  clear               - Konsole leeren', '#fff');
      this._logToDebug('  fire                - Feuer in Reichweite auslösen', '#fff');
      this._logToDebug('  firestation         - Feuerwehr-Status ausgeben', '#fff');
      this._logToDebug('  firestat            - Feuer-Status ausgeben', '#fff');
      this._logToDebug('  dragon [s]          - Drachen in s Sekunden spawnen', '#fff');
      this._logToDebug('  timer [name] [s]    - Timer setzen (dragon, plague, fire, quake, sickness)', '#fff');
      this._logToDebug('  sick                - Einen Villager krank werden lassen', '#fff');
      this._logToDebug('  res                 - Alle Ressourcen ausgeben', '#fff');
      this._logToDebug('  res [name] [value]  - Ressource auf Wert setzen', '#fff');
      this._logToDebug('---', '#888');
      this._logToDebug('Du kannst auch beliebiges JavaScript eingeben!', '#7ad07a');
      this._logToDebug('Beispiel: Game.state.economy.res.wood = 5000', '#7ad07a');
      return;
    }

    if (lower === 'clear') {
      this._clearDebugLog();
      return;
    }

    const gs = Game.state;

    if (lower === 'fire') {
      if (!gs || !gs.fireManager || !gs.world) { this._logToDebug('❌ Kein Spiel aktiv.', '#ff6b6b'); return; }
      const fm = gs.fireManager;
      const world = gs.world;
      let station = null;
      for (const b of world.buildings.values()) {
        if (b.built && !b.ruined && b.def.id === 'fireStation') { station = b; break; }
      }
      if (!station) { this._logToDebug('❌ Keine Feuerwehr.', '#ff6b6b'); return; }
      const fx = station.x + (station.w || 1) / 2;
      const fy = station.y + (station.h || 1) / 2;
      const range = station.def.extinguishRadius || 15;
      const rangeSq = range * range;
      const candidates = [];
      for (const b of world.buildings.values()) {
        if (!b.built || b.ruined || b.isBeingRepaired) continue;
        if (b.def.id === 'fireStation' || b.def.id === 'castle') continue;
        if (fm.isBuildingBurning(b)) continue;
        const bx = b.x + (b.w || 1) / 2;
        const by = b.y + (b.h || 1) / 2;
        const dx = bx - fx, dy = by - fy;
        if (dx * dx + dy * dy <= rangeSq) candidates.push({ b, dist: Math.sqrt(dx * dx + dy * dy) });
      }
      if (candidates.length === 0) { this._logToDebug('❌ Kein Gebäude in Reichweite.', '#ff6b6b'); return; }
      candidates.sort((a, b) => a.dist - b.dist);
      const target = candidates[0].b;
      fm._startFire(performance.now(), target);
      this._logToDebug(`🔥 ${target.def.name} (ID ${target.id}) brennt.`, '#ff8a5c');
      if (gs.renderer) {
        const ts = gs.renderer.tileSize;
        const tx = target.x + (target.w || 1) / 2;
        const ty = target.y + (target.h || 1) / 2;
        gs.renderer.camera.x = tx * ts - (window.innerWidth / gs.renderer.camera.zoom) / 2;
        gs.renderer.camera.y = ty * ts - (window.innerHeight / gs.renderer.camera.zoom) / 2;
        gs.renderer.clampCamera();
      }
      return;
    }

    if (lower === 'firestation') {
      if (!gs || !gs.world) return;
      const stations = [];
      for (const b of gs.world.buildings.values()) {
        if (b.def.id === 'fireStation') stations.push(b);
      }
      if (stations.length === 0) { this._logToDebug('❌ Keine Feuerwehr vorhanden.', '#ff6b6b'); return; }
      for (const st of stations) {
        this._logToDebug(`🚒 Feuerwehr ID ${st.id} bei (${st.x},${st.y})`, '#4A90E2');
        this._logToDebug(`   Wasser: ${st.storage}/${st.def.maxWaterStorage}`, '#fff');
        this._logToDebug(`   Gebaut: ${st.built ? '✅' : '❌'} | Ruine: ${st.ruined ? '❌' : '✅'}`, '#fff');
        if (!st.workerIds || st.workerIds.length === 0) { this._logToDebug('   Kein Personal!', '#ff6b6b'); continue; }
        for (const wid of st.workerIds) {
          const w = gs.vm.villagers.get(wid);
          if (!w) { this._logToDebug(`   👻 Geist ID ${wid}`, '#ff6b6b'); continue; }
          const role = w._fireStationRole || 'none';
          this._logToDebug(`   - ${w.name}: role=${role}, state=${w.state}, task=${w.task}, isSick=${w.isSick}`, w.job === 'worker' ? '#7ad07a' : '#ffcc00');
        }
      }
      return;
    }

    if (lower === 'firestat') {
      if (!gs || !gs.fireManager) return;
      const fm = gs.fireManager;
      this._logToDebug(`=== Feuer (${fm.activeFires.length} aktiv) ===`, '#ff6b6b');
      for (const f of fm.activeFires) {
        const b = f.building;
        const times = fm._getFireTimes(b);
        const elapsed = performance.now() - f.startedAt;
        const burnRem = Math.max(0, Math.ceil((times.burnTimeMs - elapsed) / 1000));
        this._logToDebug(`🔥 ${b.def.name} (ID ${b.id}): Wasser ${f.waterDelivered || 0}/${fm.getNeededWater(b)}, Ruine in ${burnRem}s`, '#ff8a5c');
      }
      return;
    }

    if (lower === 'sick') {
      if (!gs || !gs.sicknessManager) { this._logToDebug('❌ Kein SicknessManager.', '#ff6b6b'); return; }
      const victim = gs.sicknessManager._pickSickVillager();
      if (!victim) { this._logToDebug('❌ Kein Kandidat verfügbar.', '#ff6b6b'); return; }
      gs.sicknessManager._infect(victim, performance.now());
      this._logToDebug(`🤒 ${victim.name} ist krank geworden.`, '#f0a040');
      return;
    }

    if (lower.startsWith('dragon')) {
      if (!gs || !gs.dragonManager) return;
      const val = parseFloat(cmd.split(' ')[1]) || 0;
      gs.dragonManager._defenseReady = true;
      gs.dragonManager.nextSpawnAt = performance.now() + (val * 1000);
      gs.dragonManager._lastUpdateTime = performance.now();
      this._logToDebug(`🐉 Drache in ${val}s.`, '#ff8a5c');
      return;
    }

    if (lower.startsWith('timer')) {
      const parts = cmd.split(' ');
      const name = parts[1];
      const val = parseFloat(parts[2]) || 0;
      const ms = val * 1000;
      const now = performance.now();
      if (name === 'dragon' && gs.dragonManager) {
        gs.dragonManager._defenseReady = true;
        gs.dragonManager.nextSpawnAt = now + ms;
        gs.dragonManager._lastUpdateTime = now;
        this._logToDebug(`🐉 Drache in ${val}s.`, '#ff8a5c');
      } else if (name === 'plague' && gs.plagueManager) {
        gs.plagueManager._started = true;
        gs.plagueManager.nextPlagueAt = now + ms;
        gs.plagueManager.activeUntil = 0;
        gs.plagueManager._lastUpdateTime = now;
        this._logToDebug(`☣️ Plage in ${val}s.`, '#7ad07a');
      } else if (name === 'fire' && gs.fireManager) {
        gs.fireManager._started = true;
        gs.fireManager.nextFireAt = now + ms;
        gs.fireManager._lastUpdateTime = now;
        this._logToDebug(`🔥 Feuer in ${val}s.`, '#ff6b6b');
      } else if (name === 'quake' && gs.earthquakeManager) {
        gs.earthquakeManager._started = true;
        gs.earthquakeManager.sacrificed = false;
        gs.earthquakeManager.nextEarthquakeAt = now + ms;
        gs.earthquakeManager._lastUpdateTime = now;
        this._logToDebug(`🌍 Erdbeben in ${val}s.`, '#ffb05c');
      } else if (name === 'sickness' && gs.sicknessManager) {
        gs.sicknessManager._started = true;
        gs.sicknessManager.nextSicknessAt = now + ms;
        gs.sicknessManager._lastUpdateTime = now;
        this._logToDebug(`🤒 Krankheit in ${val}s.`, '#f0a040');
      } else {
        this._logToDebug('❌ Unbekannter Timer. Nutze: dragon, plague, fire, quake, sickness', '#ff6b6b');
      }
      return;
    }

    if (lower.startsWith('res')) {
      if (!gs || !gs.economy) return;
      const parts = cmd.split(' ');
      if (parts.length === 1) {
        this._logToDebug('=== Ressourcen ===', '#ffcc00');
        for (const k in gs.economy.res) {
          this._logToDebug(`  ${k}: ${Math.floor(gs.economy.res[k])}`, '#fff');
        }
        return;
      }
      const resName = parts[1];
      const val = parseFloat(parts[2]);
      if (gs.economy.res[resName] === undefined) { this._logToDebug(`❌ Unbekannte Ressource: ${resName}`, '#ff6b6b'); return; }
      if (isNaN(val)) { this._logToDebug('❌ Ungültiger Wert.', '#ff6b6b'); return; }
      gs.economy.res[resName] = val;
      if (gs.economy.onChange) gs.economy.onChange();
      this._logToDebug(`✅ ${resName} = ${val}`, '#7ad07a');
      return;
    }

    try {
      const result = eval(cmd);

      if (result === undefined) {
        this._logToDebug('✅ (undefined)', '#7ad07a');
      } else if (result === null) {
        this._logToDebug('✅ null', '#7ad07a');
      } else if (typeof result === 'object') {
        try {
          this._logToDebug(`✅ ${JSON.stringify(result).substring(0, 200)}`, '#7ad07a');
        } catch (e) {
          this._logToDebug(`✅ [object ${result.constructor ? result.constructor.name : 'unknown'}]`, '#7ad07a');
        }
      } else {
        this._logToDebug(`✅ ${String(result)}`, '#7ad07a');
      }
    } catch (err) {
      this._logToDebug(`❌ ${err.message}`, '#ff6b6b');
    }
  },

  openDebugWindow() {
    const debugWindow = document.getElementById('debugWindow');
    const debugList = document.getElementById('debugTimersList');
    if (!debugWindow || !debugList) return;
    const gs = Game.state;
    if (!gs) return;
    gs.paused = true;
    const now = performance.now();
    debugList.innerHTML = '';

    const createTimerRow = (title, currentRemainingMs, setter) => {
      const secs = Math.max(0, Math.floor(currentRemainingMs / 1000));
      const row = document.createElement('div');
      row.style.cssText = 'background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px; border-left: 3px solid var(--brass);';
      row.innerHTML = `
        <div style="font-size: 15px; font-weight: bold; color: var(--brass-light); margin-bottom: 8px;">${title}</div>
        <div style="font-size: 13px; color: var(--parchment); margin-bottom: 12px;">Aktuell: <span style="color: #ffcc00; font-weight: bold;">${secs}s</span></div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <input type="number" id="input_${title.replace(/\s+/g, '_')}" placeholder="Sekunden eingeben..." value="${secs}" style="width: 100%; padding: 10px; background: #1e140a; border: 1px solid var(--wood-border); border-radius: 6px; color: var(--parchment); font-size: 14px;">
          <button id="btn_${title.replace(/\s+/g, '_')}" style="width: 100%; padding: 10px; background: var(--green-ok); color: #fff; border: none; border-radius: 6px; font-weight: bold; font-size: 14px;">Setzen</button>
        </div>
      `;
      setTimeout(() => {
        const btn = row.querySelector('button');
        const input = row.querySelector('input');
        if (btn && input) {
          btn.addEventListener('click', () => {
            const val = parseInt(input.value, 10);
            if (!isNaN(val) && val >= 0) {
              setter(val);
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

    if (gs.dragonManager) {
      const dm = gs.dragonManager;
      const rem = dm.nextSpawnAt > 0 ? (dm.nextSpawnAt - now) : 0;
      createTimerRow('🐉 Drache', rem, (val) => {
        dm._defenseReady = true;
        dm.nextSpawnAt = performance.now() + (val * 1000);
        dm._lastUpdateTime = performance.now();
      });
    }
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
    if (gs.sicknessManager) {
      const sm = gs.sicknessManager;
      const rem = sm.nextSicknessAt > 0 && sm.nextSicknessAt !== Infinity ? (sm.nextSicknessAt - now) : 0;
      createTimerRow('🤒 Krankheit', rem, (val) => {
        sm._started = true;
        sm.nextSicknessAt = performance.now() + (val * 1000);
        sm._lastUpdateTime = performance.now();
      });
    }
    if (gs.fireManager) {
      const fm = gs.fireManager;
      const rem = fm.nextFireAt > 0 ? (fm.nextFireAt - now) : 0;
      createTimerRow('🔥 Feuer', rem, (val) => {
        fm._started = true;
        fm.nextFireAt = performance.now() + (val * 1000);
        fm.activeFires = [];
        fm._lastUpdateTime = performance.now();
      });
    }
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
    if (gs.raiderVillage && !gs.raiderVillage.isDestroyed) {
      const rv = gs.raiderVillage;
      const rem = rv.nextAttackAt > 0 ? (rv.nextAttackAt - now) : 0;
      createTimerRow('🏴 Räuber-Angriff', rem, (val) => {
        rv.nextAttackAt = performance.now() + (val * 1000);
        rv.attackTimerFrozen = false;
      });
    }
    if (gs.zombieManager) {
      const zm = gs.zombieManager;
      const rem = (zm.spawnCooldown || 0) * 1000;
      createTimerRow('🧟 Zombie-Spawn', rem, (val) => {
        zm.spawnCooldown = val;
      });
    }
    this._clearDebugLog();
    this._logToDebug('Debug-Konsole bereit. Tippe "help" für Kurzbefehle oder gib beliebiges JavaScript ein.', '#4A90E2');
    this._startFireLog(gs);
    debugWindow.classList.remove('hidden');
  },

  _startFireLog(game) {
    this._stopFireLog();
    this._fireLogInterval = null;
  },

  _stopFireLog() {
    if (this._fireLogInterval) {
      clearInterval(this._fireLogInterval);
      this._fireLogInterval = null;
    }
  }
};
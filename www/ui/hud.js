window.Game = window.Game || {};

Game.HUD = class HUD {
  constructor(game) {
    this.game = game;
    this.activeBuild = null;

    this.buildButton = document.getElementById('buildButton');
    this.buildWindow = document.getElementById('buildWindow');
    this.buildWindowClose = document.getElementById('buildWindowClose');
    this.buildGrid = document.getElementById('buildGrid');
    this.tabs = Array.from(document.querySelectorAll('.build-tab[data-category]'));

    this.statsButton = document.getElementById('statsButton');
    this.statsWindow = document.getElementById('statsWindow');
    this.statsWindowClose = document.getElementById('statsWindowClose');
    this.statsBody = document.getElementById('statsBody');
    this.statsEnemiesBody = document.getElementById('statsEnemiesBody');
    this.statsProductionBody = document.getElementById('statsProductionBody');
    this.statsHallOfFameBody = document.getElementById('statsHallOfFameBody');
    this.statsTabs = Array.from(document.querySelectorAll('.build-tab[data-stats-tab]'));

    this.villagersButton = document.getElementById('villagersButton');
    this.villagersWindow = document.getElementById('villagersWindow');
    this.villagersWindowClose = document.getElementById('villagersWindowClose');
    this.villagersBody = document.getElementById('villagersBody');

    this.villagersTabBtn = document.getElementById('villagersTabBtn');
    this.buildingsTabBtn = document.getElementById('buildingsTabBtn');
    this.militaryTabBtn = document.getElementById('militaryTabBtn');
    this.buildingsBody = document.getElementById('buildingsBody');
    this.militaryBody = document.getElementById('militaryBody');

    this.currentCategory = 'small';

    this.resourceEmojis = {
      wood: '🌲', stone: '🪨', grain: '🌾', fish: '🐟',
      water: '💧', beer: '🍺', woodPlank: '🪵', arrows: '🏹',
      feed: '🥣', pig: '🐷', meat: '🥩', flour: '🌾', bread: '🍞',
      dragonBone: '🦴',
      raiderHerb: '🌿', antibiotics: '💊'
    };
    this.resourceNames = {
      wood: 'Holz', stone: 'Stein', grain: 'Weizen', fish: 'Fisch',
      water: 'Wasser', beer: 'Bier', woodPlank: 'Bretter', arrows: 'Pfeile',
      feed: 'Futter', pig: 'Schwein', meat: 'Fleisch', flour: 'Mehl', bread: 'Brot',
      dragonBone: 'Drachenknochen',
      raiderHerb: 'Räuberkraut', antibiotics: 'Antibiotika'
    };

    this.categories = {
      small: [],
      normal: [],
      large: []
    };

    this._categorizeBuildings();
    this._bindEvents();

    this.tutorialBanner = document.createElement('div');
    this.tutorialBanner.id = 'tutorialBanner';
    this.tutorialBanner.style.cssText = 'padding: 10px 12px; background: rgba(255, 204, 0, 0.15); border: 1px solid #ffcc00; border-radius: 8px; margin: 10px 16px 0 16px; color: #ffcc00; font-size: 12px; line-height: 1.4; display: none;';
    this.tutorialBanner.innerHTML = '<b>Baue zuerst die Grundversorgung:</b><br>Errichte je 1× Holzfäller, Steinmetz und Sägewerk (Baustelle reicht). Danach werden alle Gebäude freigeschaltet.';

    if (this.buildGrid && this.buildGrid.parentNode) {
      this.buildGrid.parentNode.insertBefore(this.tutorialBanner, this.buildGrid);
    }
  }

  _categorizeBuildings() {
    for (const id in Game.BUILDING_TYPES) {
      const def = Game.BUILDING_TYPES[id];
      if (def.id === 'castle') continue;
      if (def.isRaiderBuilding) continue;

      const w = def.width || 1;
      const h = def.height || 1;

      let cat = 'large';

      if (w <= 2 && h <= 2) {
        cat = 'small';
      } else if ((w === 3 && h <= 2) || (w <= 2 && h === 3)) {
        cat = 'normal';
      } else {
        cat = 'large';
      }

      this.categories[cat].push(def);
    }
  }

  _bindEvents() {
    this.buildButton.addEventListener('click', () => {
      if (this.activeBuild) {
        this.setActiveBuild(null);
      } else {
        this.openBuildWindow();
      }
    });

    this.buildWindowClose.addEventListener('click', () => this.closeBuildWindow());

    this.buildWindow.addEventListener('click', (e) => {
      if (e.target === this.buildWindow) this.closeBuildWindow();
    });

    for (const tab of this.tabs) {
      tab.addEventListener('click', () => {
        this.setCategory(tab.dataset.category);
      });
    }

    if (this.statsButton) {
      this.statsButton.addEventListener('click', () => this.openStatsWindow());
    }
    if (this.statsWindowClose) {
      this.statsWindowClose.addEventListener('click', () => this.closeStatsWindow());
    }
    if (this.statsWindow) {
      this.statsWindow.addEventListener('click', (e) => {
        if (e.target === this.statsWindow) this.closeStatsWindow();
      });
    }

    for (const tab of this.statsTabs) {
      tab.addEventListener('click', () => {
        this.setStatsTab(tab.dataset.statsTab);
      });
    }

    if (this.villagersButton) {
      this.villagersButton.addEventListener('click', () => this.openVillagersWindow());
    }
    if (this.villagersWindowClose) {
      this.villagersWindowClose.addEventListener('click', () => this.closeVillagersWindow());
    }
    if (this.villagersWindow) {
      this.villagersWindow.addEventListener('click', (e) => {
        if (e.target === this.villagersWindow) this.closeVillagersWindow();
      });
    }

    if (this.villagersTabBtn) {
      this.villagersTabBtn.addEventListener('click', () => this.setVillagersTab('villagers'));
    }
    if (this.buildingsTabBtn) {
      this.buildingsTabBtn.addEventListener('click', () => this.setVillagersTab('buildings'));
    }
    if (this.militaryTabBtn) {
      this.militaryTabBtn.addEventListener('click', () => this.setVillagersTab('military'));
    }
  }

  setStatsTab(tabName) {
    if (this.game.stats) {
      this.game.stats.activeTab = tabName;
    }

    for (const tab of this.statsTabs) {
      tab.classList.toggle('active', tab.dataset.statsTab === tabName);
    }

    if (this.statsBody) this.statsBody.classList.toggle('hidden', tabName !== 'resources');
    if (this.statsEnemiesBody) this.statsEnemiesBody.classList.toggle('hidden', tabName !== 'enemies');
    if (this.statsProductionBody) this.statsProductionBody.classList.toggle('hidden', tabName !== 'production');
    if (this.statsHallOfFameBody) this.statsHallOfFameBody.classList.toggle('hidden', tabName !== 'halloffame');

    if (this.game.stats) {
      const activeContainer =
        tabName === 'enemies' ? this.statsEnemiesBody :
        tabName === 'production' ? this.statsProductionBody :
        tabName === 'halloffame' ? this.statsHallOfFameBody :
        this.statsBody;

      if (activeContainer) {
        this.game.stats.render(activeContainer);
      }
    }
  }

  openStatsWindow() {
    if (!this.statsWindow) return;
    this.statsWindow.classList.remove('hidden');
    if (this.game.stats) {
      if (!this.game.stats.activeTab) {
        this.game.stats.activeTab = 'resources';
      }
      this.setStatsTab(this.game.stats.activeTab);
    }
  }

  closeStatsWindow() {
    if (!this.statsWindow) return;
    this.statsWindow.classList.add('hidden');
  }

  openVillagersWindow() {
    if (!this.villagersWindow) return;
    this.villagersWindow.classList.remove('hidden');
    this.setVillagersTab('villagers');
  }

  closeVillagersWindow() {
    if (!this.villagersWindow) return;
    this.villagersWindow.classList.add('hidden');
  }

  setVillagersTab(tabName) {
    if (!this.villagersTabBtn || !this.buildingsTabBtn) return;

    if (tabName === 'villagers') {
      this.villagersTabBtn.classList.add('active');
      this.buildingsTabBtn.classList.remove('active');
      if (this.militaryTabBtn) this.militaryTabBtn.classList.remove('active');
      if (this.villagersBody) this.villagersBody.classList.remove('hidden');
      if (this.buildingsBody) this.buildingsBody.classList.add('hidden');
      if (this.militaryBody) this.militaryBody.classList.add('hidden');
      this._renderVillagers();
    } else if (tabName === 'buildings') {
      this.villagersTabBtn.classList.remove('active');
      this.buildingsTabBtn.classList.add('active');
      if (this.militaryTabBtn) this.militaryTabBtn.classList.remove('active');
      if (this.villagersBody) this.villagersBody.classList.add('hidden');
      if (this.buildingsBody) this.buildingsBody.classList.remove('hidden');
      if (this.militaryBody) this.militaryBody.classList.add('hidden');
      this._renderBuildings();
    } else if (tabName === 'military') {
      this.villagersTabBtn.classList.remove('active');
      this.buildingsTabBtn.classList.remove('active');
      if (this.militaryTabBtn) this.militaryTabBtn.classList.add('active');
      if (this.villagersBody) this.villagersBody.classList.add('hidden');
      if (this.buildingsBody) this.buildingsBody.classList.add('hidden');
      if (this.militaryBody) this.militaryBody.classList.remove('hidden');
      this._renderMilitary();
    }
  }

  _renderVillagers() {
    if (!this.villagersBody) return;
    const vm = this.game.vm;
    const world = this.game.world;
    if (!vm || !world) {
      this.villagersBody.innerHTML = '<div class="build-grid-empty">Keine Daten verfügbar.</div>';
      return;
    }

    const allVillagers = vm.getAllVillagers();
    const total = allVillagers.length;

    let breadStats = { needsBread: 0, nearDeath: 0 };
    if (this.game.breadManager) {
      breadStats = this.game.breadManager.getStats(performance.now());
    }

    let sickCount = 0;
    for (const v of allVillagers) {
      if (v.isSick) sickCount++;
    }

    const jobCounts = {};
    for (const v of allVillagers) {
      let jobKey = v.job;
      if (v.job === 'worker' && v.workplaceId) {
        const b = world.buildings.get(v.workplaceId);
        if (b) {
          if (b.def.id === 'lumberjack') jobKey = 'Holzfäller';
          else if (b.def.id === 'quarry') jobKey = 'Steinmetz';
          else if (b.def.id === 'farm') jobKey = 'Bauer';
          else if (b.def.id === 'fisher') jobKey = 'Fischer';
          else if (b.def.id === 'sawmill') jobKey = 'Sägewerker';
          else if (b.def.id === 'mill') jobKey = 'Müller';
          else if (b.def.id === 'brewery') jobKey = 'Brauer';
          else if (b.def.id === 'bakery') jobKey = 'Bäcker';
          else if (b.def.id === 'well') jobKey = 'Brunnenwärter';
          else if (b.def.id === 'arrowSmith') jobKey = 'Pfeilschmied';
          else if (b.def.id === 'arrowTower') jobKey = 'Bogenschütze';
          else if (b.def.id === 'watchtower') jobKey = 'Bogenschütze';
          else if (b.def.id === 'dragonWatchtower') jobKey = 'Bogenschütze';
          else if (b.def.id === 'dragonFortress') jobKey = 'Bogenschütze';
          else if (b.def.id === 'feedMaker') jobKey = 'Fütterer';
          else if (b.def.id === 'pigFarm') jobKey = 'Schweinebauer';
          else if (b.def.id === 'butcher') jobKey = 'Schlachter';
          else if (b.def.id === 'forsthaus') jobKey = 'Förster';
          else if (b.def.id === 'apotheke') jobKey = 'Apotheker';
          else if (b.def.id === 'arztpraxis') jobKey = 'Arzt';
          else if (b.def.id === 'fireStation') jobKey = 'Feuerwehrmann';
          else if (b.def.id === 'magierturm') jobKey = 'Magier';
          else jobKey = b.def.name + '-Arbeiter';
        }
      } else if (v.job === 'warrior') {
        jobKey = 'Krieger';
      } else if (v.job === 'mage') {
        jobKey = 'Magier';
      } else if (v.job === 'free') {
        jobKey = 'Freie Bürger';
      } else if (!v.job) {
        jobKey = 'Unbekannt';
      }
      jobCounts[jobKey] = (jobCounts[jobKey] || 0) + 1;
    }

    const sortedJobs = Object.entries(jobCounts).sort((a, b) => b[1] - a[1]);

    let html = '';

    html += `
      <div class="stats-row" style="border-color:#ffcc00;">
        <div class="stats-header-cell">
          <div class="stats-icon"><img src="images/villager-idle-rot.webp" style="width:24px;height:24px;object-fit:contain;"></div>
          <div class="stats-name">Gesamtanzahl</div>
        </div>
        <div class="stats-data-grid" style="grid-template-columns: 1fr 1fr;">
          <div class="stats-data-item">
            <div class="stats-label">Einwohner</div>
            <div class="stats-value" style="font-size:24px;">${total}</div>
          </div>
          <div class="stats-data-item">
            <div class="stats-label">Krank</div>
            <div class="stats-value ${sickCount > 0 ? 'stats-negative' : 'stats-neutral'}" style="font-size:24px;">${sickCount}</div>
          </div>
        </div>
      </div>
    `;

    html += `
      <div class="stats-row" style="border-color:#a86f33;">
        <div class="stats-header-cell">
          <div class="stats-icon"><img src="images/icon_brot.webp" style="width:24px;height:24px;object-fit:contain;"></div>
          <div class="stats-name">Nahrungs-Status</div>
        </div>
        <div class="stats-data-grid" style="grid-template-columns: 1fr 1fr;">
          <div class="stats-data-item">
            <div class="stats-label">Ohne Nahrung</div>
            <div class="stats-value ${breadStats.needsBread > 0 ? 'stats-negative' : 'stats-neutral'}" style="font-size:18px;">${breadStats.needsBread}</div>
          </div>
          <div class="stats-data-item">
            <div class="stats-label">Kurz vor Tod</div>
            <div class="stats-value ${breadStats.nearDeath > 0 ? 'stats-negative' : 'stats-neutral'}" style="font-size:18px;">${breadStats.nearDeath}</div>
          </div>
        </div>
      </div>
    `;

    for (const [jobName, count] of sortedJobs) {
      const percent = total > 0 ? Math.round((count / total) * 100) : 0;
      html += `
        <div class="stats-row">
          <div class="stats-header-cell">
            <div class="stats-icon">${this._jobEmoji(jobName)}</div>
            <div class="stats-name">${jobName}</div>
          </div>
          <div class="stats-data-grid" style="grid-template-columns: 1fr 1fr;">
            <div class="stats-data-item">
              <div class="stats-label">Anzahl</div>
              <div class="stats-value" style="font-size:18px;">${count}</div>
            </div>
            <div class="stats-data-item">
              <div class="stats-label">Anteil</div>
              <div class="stats-value">${percent}%</div>
            </div>
          </div>
        </div>
      `;
    }

    this.villagersBody.innerHTML = html;
  }

  _renderBuildings() {
    if (!this.buildingsBody) return;
    const world = this.game.world;
    if (!world) {
      this.buildingsBody.innerHTML = '<div class="build-grid-empty">Keine Daten verfügbar.</div>';
      return;
    }

    const groups = {};

    for (const b of world.buildings.values()) {
      if (b.def.id === 'castle') continue;
      if (b.def.isRaiderBuilding) continue;
      if (!b.built) continue;

      const id = b.def.id;
      if (!groups[id]) {
        groups[id] = {
          def: b.def,
          buildings: []
        };
      }
      groups[id].buildings.push(b);
    }

    let html = '';

    const sortedKeys = Object.keys(groups).sort((a, b) => {
      return groups[a].def.name.localeCompare(groups[b].def.name);
    });

    if (sortedKeys.length === 0) {
      this.buildingsBody.innerHTML = '<div class="build-grid-empty">Keine Gebäude vorhanden.</div>';
      return;
    }

    for (const id of sortedKeys) {
      const group = groups[id];
      const total = group.buildings.length;

      let activeCount = 0;
      for (const b of group.buildings) {
        if (!b.paused) activeCount++;
      }

      if (total === 1) {
        const b = group.buildings[0];
        const isPaused = b.paused;

        html += `
          <div class="stats-row" style="margin-bottom:8px;">
            <div class="stats-header-cell">
              <div class="stats-icon"><img src="${group.def.asset}" style="width:32px;height:32px;object-fit:contain;"></div>
              <div class="stats-name" style="flex:1;">${group.def.name}</div>
              <button class="toggleBuildingBtn" data-id="${b.id}"
                style="background:${isPaused ? '#3b6e3b' : '#6e3b3b'}; color:#fff; border:none; padding:8px 12px; border-radius:6px; font-weight:bold; cursor:pointer;">
                ${isPaused ? '▶ Aktivieren' : '⏸ Stilllegen'}
              </button>
            </div>
          </div>
        `;
      } else {
        html += `
          <div class="stats-row" style="margin-bottom:8px; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px;">
            <div class="stats-header-cell">
              <div class="stats-icon"><img src="${group.def.asset}" style="width:32px;height:32px;object-fit:contain;"></div>
              <div class="stats-name" style="flex:1;">${group.def.name}</div>
              <div class="stats-value" style="color:#ffcc00; font-size:14px;">${activeCount} / ${total} aktiv</div>
            </div>
            <div style="margin-top: 8px;">
              <input type="range" class="buildingSlider" data-group="${id}" min="0" max="${total}" value="${activeCount}" step="1"
                style="width: 100%; accent-color: #3b6e3b;">
            </div>
          </div>
        `;
      }
    }

    this.buildingsBody.innerHTML = html;

    this.buildingsBody.querySelectorAll('.toggleBuildingBtn').forEach(btn => {
      btn.addEventListener('click', () => {
        const bId = parseInt(btn.dataset.id, 10);
        const b = world.buildings.get(bId);
        if (!b) return;

        if (b.paused) {
          b.paused = false;
          if (this.game && this.game.renderer) {
            this.game.renderer.markStaticDirty(world.getBuildingTiles(b));
          }
          if (this.game && this.game.vm) this.game.vm.assignFreeVillagers();
        } else {
          if (this.game && this.game.vm) {
            if (b.workerId !== null) {
              const worker = this.game.vm.villagers.get(b.workerId);
              if (worker) {
                if (worker.state === 'zfighting' || worker.state === 'vfighting' || worker.state === 'dragon_attack') {
                  alert('Arbeiter ist im Kampf!');
                  return;
                }
                worker.workplaceId = null;
                worker.job = 'free';
                worker.state = 'idle';
                worker.task = 'go_home';
                worker.hidden = false;
                const home = world.buildings.get(worker.homeId) || world.buildings.get(world.castleId);
                if (home) this.game.vm.startMove(worker, home.x, home.y + (home.h || 1) - 1);
                this.game.vm._releaseReservations(worker);
                this.game.vm._idleVillagers.add(worker.id);
              }
              b.workerId = null;
            }
            for (const field of b.fields) {
              const key = field.x + ',' + field.y;
              if (world.fieldOwners.get(key) === b.id) world.fieldOwners.delete(key);
            }
            b.fields = [];
            b.paused = true;
            if (this.game && this.game.renderer) {
              this.game.renderer.markStaticDirty(world.getBuildingTiles(b));
            }
          }
        }
        this._renderBuildings();
      });
    });

    this.buildingsBody.querySelectorAll('.buildingSlider').forEach(slider => {
      slider.addEventListener('change', (e) => {
        const groupId = slider.dataset.group;
        const targetActive = parseInt(e.target.value, 10);
        const group = groups[groupId];
        if (!group) return;

        const sorted = [...group.buildings].sort((a, b) => {
          if (a.paused === b.paused) return 0;
          return a.paused ? 1 : -1;
        });

        for (let i = 0; i < sorted.length; i++) {
          const b = sorted[i];
          const shouldBeActive = i < targetActive;

          if (shouldBeActive && b.paused) {
            b.paused = false;
            if (this.game && this.game.renderer) {
              this.game.renderer.markStaticDirty(world.getBuildingTiles(b));
            }
          } else if (!shouldBeActive && !b.paused) {
            if (b.workerId !== null) {
              const worker = this.game.vm.villagers.get(b.workerId);
              if (worker) {
                if (worker.state === 'zfighting' || worker.state === 'vfighting' || worker.state === 'dragon_attack') {
                  continue;
                }
                worker.workplaceId = null;
                worker.job = 'free';
                worker.state = 'idle';
                worker.task = 'go_home';
                worker.hidden = false;
                const home = world.buildings.get(worker.homeId) || world.buildings.get(world.castleId);
                if (home) this.game.vm.startMove(worker, home.x, home.y + (home.h || 1) - 1);
                this.game.vm._releaseReservations(worker);
                this.game.vm._idleVillagers.add(worker.id);
              }
              b.workerId = null;
            }
            for (const field of b.fields) {
              const key = field.x + ',' + field.y;
              if (world.fieldOwners.get(key) === b.id) world.fieldOwners.delete(key);
            }
            b.fields = [];
            b.paused = true;
            if (this.game && this.game.renderer) {
              this.game.renderer.markStaticDirty(world.getBuildingTiles(b));
            }
          }
        }

        if (this.game && this.game.vm) {
          this.game.vm.assignFreeVillagers();
        }

        this._renderBuildings();
      });
    });
  }

  _renderMilitary() {
    if (!this.militaryBody) return;
    const vm = this.game.vm;
    const world = this.game.world;
    if (!vm || !world) {
      this.militaryBody.innerHTML = '<div class="build-grid-empty">Keine Daten verfügbar.</div>';
      return;
    }

    const warriorsByBuilding = new Map();

    for (const v of vm.villagers.values()) {
      if (v.job !== 'warrior') continue;
      const bid = v.warriorBuildingId || 0;
      if (!warriorsByBuilding.has(bid)) {
        warriorsByBuilding.set(bid, []);
      }
      warriorsByBuilding.get(bid).push(v);
    }

    let html = '';

    html += `<div class="stats-row" style="border-color:#ff8a5c; margin-bottom:12px; text-align:center;">
      <div class="stats-name" style="font-size:14px; color:#ff8a5c;">MILITÄRÜBERSICHT</div>
      <div style="font-size:11px; color:#aaa; margin-top:4px;">Alle Krieger mit Level, Bier und Siegchancen</div>
    </div>`;

    if (warriorsByBuilding.size === 0) {
      html += `<div class="build-grid-empty">Keine Krieger vorhanden.</div>`;
      this.militaryBody.innerHTML = html;
      return;
    }

    const sortedBids = Array.from(warriorsByBuilding.keys()).sort((a, b) => {
      if (a === 0) return -1;
      if (b === 0) return 1;
      const bA = world.buildings.get(a);
      const bB = world.buildings.get(b);
      const nA = bA ? bA.def.name : '';
      const nB = bB ? bB.def.name : '';
      if (nA !== nB) return nA.localeCompare(nB);
      return a - b;
    });

    for (const bid of sortedBids) {
      const warriors = warriorsByBuilding.get(bid);
      const building = bid > 0 ? world.buildings.get(bid) : null;

      let headerText = 'Ohne Posten';
      let headerIcon = '❓';
      if (building) {
        headerText = `${building.def.name} #${building.id}`;
        headerIcon = `<img src="${building.def.asset}" style="width:24px;height:24px;object-fit:contain;">`;
      }

      html += `<div class="stats-row" style="border-color:#6e3b3b; margin-bottom:8px; background: rgba(110, 59, 59, 0.2);">
        <div class="stats-header-cell">
          <div class="stats-icon" style="width:32px; height:32px; display:flex; align-items:center; justify-content:center;">${headerIcon}</div>
          <div class="stats-name" style="color:#ff8a5c; font-weight:700;">${headerText}</div>
          <div class="stats-value" style="font-size:14px; color:#fff;">${warriors.length} Krieger</div>
        </div>
      </div>`;

      for (const w of warriors) {
        const lvl = w.warriorLevel || 1;
        const kills = w.kills || 0;
        const hasBeer = !!w.beerBuff;

        const liveChances = (Game.UI && typeof Game.UI._getLiveWinChances === 'function')
          ? Game.UI._getLiveWinChances(w)
          : { zombie: w.winChanceZombie || 0.6, raider: w.winChanceRaider || 0.6 };

        const zChance = Math.round(liveChances.zombie * 100);
        const rChance = Math.round(liveChances.raider * 100);

        const lvlColor = lvl === 5 ? '#ffcc00' : lvl === 4 ? '#d4a017' : lvl === 3 ? '#4A90E2' : lvl === 2 ? '#7ad07a' : '#aaa';
        const lvlStars = '⭐'.repeat(lvl);

        html += `<div class="stats-row" style="margin-bottom:6px; padding:8px 10px; border-color:#333; background:${lvl === 5 ? 'rgba(255,204,0,0.1)' : 'rgba(0,0,0,0.2)'};">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <img src="images/villager-krieger-rot.webp" style="width:24px;height:24px;object-fit:contain;">
              <span style="font-weight:700; color:#eee;">${w.name}</span>
            </div>
            <div style="color:${lvlColor}; font-weight:700;">${lvlStars} Lvl ${lvl}</div>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; font-size:12px;">
            <div style="display:flex; justify-content:space-between;">
              <span style="color:#aaa;">Kills:</span>
              <span style="color:#7ad07a; font-weight:600;">${kills}</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span style="color:#aaa;">Bier:</span>
              <span style="color:${hasBeer ? '#d4a017' : '#888'}; font-weight:600;">${hasBeer ? '🍺 Ja' : '❌ Nein'}</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span style="color:#aaa;">vs. Zombie:</span>
              <span style="color:#7ad07a; font-weight:700;">${zChance}%</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span style="color:#aaa;">vs. Räuber:</span>
              <span style="color:#ff8a5c; font-weight:700;">${rChance}%</span>
            </div>
          </div>

          ${w.state === 'vdefend' ? `<div style="margin-top:6px; font-size:11px; color:#ff8a5c;">⚠️ Verteidigt gerade!</div>` : ''}
          ${w.state === 'zfighting' ? `<div style="margin-top:6px; font-size:11px; color:#7ad07a;">⚔️ Kämpft gegen Zombies!</div>` : ''}
          ${w.state === 'vfightback' ? `<div style="margin-top:6px; font-size:11px; color:#4A90E2;">⚔️ Im Gegenangriff!</div>` : ''}
        </div>`;
      }
    }

    this.militaryBody.innerHTML = html;
  }

  _jobEmoji(jobName) {
    const map = {
      'Freie Bürger': 'images/villager-idle-rot.webp',
      'Krieger': 'images/villager-krieger-rot.webp',
      'Holzfäller': 'images/villager-holzfaeller-rot.webp',
      'Förster': 'images/foerster.webp',
      'Steinmetz': 'images/villager-steinmetz-rot.webp',
      'Bauer': 'images/villager-bauer-rot.webp',
      'Fischer': 'images/villager-angler-rot.webp',
      'Sägewerker': 'images/saeger.webp',
      'Müller': 'images/mueller.webp',
      'Brauer': 'images/brauer.webp',
      'Bäcker': 'images/baecker.webp',
      'Brunnenwärter': 'images/brunnen-rot.webp',
      'Pfeilschmied': 'images/pfeilbauer.webp',
      'Bogenschütze': 'images/bogenschuetze.webp',
      'Fütterer': 'images/fuetterer.webp',
      'Schweinebauer': 'images/schweinebauer.webp',
      'Schlachter': 'images/schlachter.webp',
      'Apotheker': 'images/apotheker.webp',
      'Arzt': 'images/arzt.webp',
      'Feuerwehrmann': 'images/feuerwehrmann.webp',
      'Magier': 'images/magier.webp'
    };
    const path = map[jobName];
    if (path) {
      return `<img src="${path}" style="width:24px;height:24px;object-fit:contain;">`;
    }
    return '👷';
  }

  setCategory(category) {
    this.currentCategory = category;
    for (const tab of this.tabs) {
      tab.classList.toggle('active', tab.dataset.category === category);
    }
    this._renderGrid();
  }

  openBuildWindow() {
    this.buildWindow.classList.remove('hidden');
    this._renderGrid();
  }

  closeBuildWindow() {
    this.buildWindow.classList.add('hidden');
  }

  _isAffordable(def) {
    const eco = this.game && this.game.economy;
    if (!eco || !def.cost) return true;
    return eco.canAfford(def.cost);
  }

  refreshBuildGrid() {
    if (!this.buildWindow.classList.contains('hidden')) {
      this._renderGrid();
    }
  }

  _renderGrid() {
    const list = this.categories[this.currentCategory] || [];
    this.buildGrid.innerHTML = '';

    if (this.tutorialBanner) {
      this.tutorialBanner.style.display = this.game.tutorialActive ? 'block' : 'none';
    }

    const dragonBones = (this.game && this.game.economy && this.game.economy.res)
      ? (this.game.economy.res.dragonBone || 0)
      : 0;

    let filteredList = list;

    if (this.game.tutorialActive) {
      const allowed = ['lumberjack', 'quarry', 'sawmill'];
      filteredList = list.filter(def => allowed.includes(def.id));
    }

    filteredList = filteredList.filter(def => {
      if (def.isDragonSpecial) {
        return dragonBones > 0;
      }
      return true;
    });

    if (filteredList.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'build-grid-empty';
      empty.textContent = 'Keine Gebäude in dieser Kategorie.';
      this.buildGrid.appendChild(empty);
      return;
    }

    for (const def of filteredList) {
      const affordable = this._isAffordable(def);

      let builtCount = 0;
      let maxAllowed = Infinity;

      if (def.maxCount !== undefined) {
        maxAllowed = def.maxCount;
        for (const b of this.game.world.buildings.values()) {
          if (b.def.id === def.id) {
            builtCount++;
          }
        }
      } else if (this.game.tutorialActive) {
        maxAllowed = 1;
        for (const b of this.game.world.buildings.values()) {
          if (b.def.id === def.id) {
            builtCount++;
          }
        }
      }

      const isLimitReached = builtCount >= maxAllowed;

      const card = document.createElement('div');
      card.className = 'build-card'
        + (this.activeBuild === def.id ? ' active' : '')
        + (!affordable || isLimitReached ? ' not-affordable' : '');
      card.dataset.id = def.id;

      const img = document.createElement('img');
      img.src = def.asset || '';
      img.alt = def.name;
      img.onerror = () => { img.style.visibility = 'hidden'; };

      const name = document.createElement('div');
      name.className = 'name';
      name.textContent = def.name;

      const size = document.createElement('div');
      size.className = 'size';
      size.textContent = `${def.width || 1} × ${def.height || 1}`;

      const costParts = [];
      if (def.cost) {
        for (const res in def.cost) {
          costParts.push(`${def.cost[res]} ${this.resourceNames[res] || res}`);
        }
      }
      const cost = document.createElement('div');
      cost.className = 'cost';
      cost.textContent = costParts.length > 0 ? costParts.join(', ') : 'Kostenlos';

      card.appendChild(img);
      card.appendChild(name);
      card.appendChild(size);
      card.appendChild(cost);

      if (!isLimitReached && affordable) {
        card.addEventListener('click', () => {
          this.setActiveBuild(def.id);
        });
      } else {
        card.addEventListener('click', () => {
          card.classList.add('shake');
          setTimeout(() => card.classList.remove('shake'), 300);
        });
      }

      this.buildGrid.appendChild(card);
    }
  }

  refreshAffordability() {
    if (!this.buildWindow.classList.contains('hidden')) {
      this._renderGrid();
    }
  }

  setActiveBuild(id) {
    if (this.activeBuild === id) {
      this.activeBuild = null;
    } else {
      this.activeBuild = id;
    }

    const cards = this.buildGrid.querySelectorAll('.build-card');
    cards.forEach(card => {
      card.classList.toggle('active', card.dataset.id === this.activeBuild);
    });

    if (this.activeBuild) {
      this.closeBuildWindow();
      this.buildButton.classList.add('active');
    } else {
      this.buildButton.classList.remove('active');
    }

    const canvas = document.getElementById('game');
    const renderer = this.game.renderer;

    if (this.activeBuild) {
      canvas.classList.add('placing');
      if (renderer) {
        renderer.hoverDef = Game.BUILDING_TYPES[this.activeBuild];
      }
    } else {
      canvas.classList.remove('placing');
      if (renderer) {
        renderer.hoverDef = null;
        renderer.hoverX = -1;
        renderer.hoverY = -1;
      }
    }
  }

  updateResources(economy) {
    this.refreshAffordability();
  }
};
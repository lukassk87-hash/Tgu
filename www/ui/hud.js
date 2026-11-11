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
    this.statsTabs = Array.from(document.querySelectorAll('.build-tab[data-stats-tab]'));

    this.villagersButton = document.getElementById('villagersButton');
    this.villagersWindow = document.getElementById('villagersWindow');
    this.villagersWindowClose = document.getElementById('villagersWindowClose');
    this.villagersBody = document.getElementById('villagersBody');

    this.currentCategory = 'small';

    this.resourceEmojis = {
      wood: '🌲', stone: '🪨', grain: '🌾', fish: '🐟',
      water: '💧', beer: '🍺', woodPlank: '🪵', arrows: '🏹',
      feed: '🥣', pig: '🐷', meat: '🥩', flour: '🌾', bread: '🍞',
      dragonBone: '🦴'
    };
    this.resourceNames = {
      wood: 'Holz', stone: 'Stein', grain: 'Weizen', fish: 'Fisch',
      water: 'Wasser', beer: 'Bier', woodPlank: 'Bretter', arrows: 'Pfeile',
      feed: 'Futter', pig: 'Schwein', meat: 'Fleisch', flour: 'Mehl', bread: 'Brot',
      dragonBone: 'Drachenknochen'
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

    if (this.game.stats) {
      const activeContainer = 
        tabName === 'enemies' ? this.statsEnemiesBody :
        tabName === 'production' ? this.statsProductionBody :
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
    this._renderVillagers();
  }

  closeVillagersWindow() {
    if (!this.villagersWindow) return;
    this.villagersWindow.classList.add('hidden');
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
          else jobKey = b.def.name + '-Arbeiter';
        }
      } else if (v.job === 'warrior') {
        jobKey = 'Krieger';
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
        <div class="stats-data-grid" style="grid-template-columns: 1fr;">
          <div class="stats-data-item">
            <div class="stats-label">Einwohner</div>
            <div class="stats-value" style="font-size:24px;">${total}</div>
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

  _jobEmoji(jobName) {
    const map = {
      'Freie Bürger': 'images/villager-idle-rot.webp',
      'Krieger': 'images/villager-krieger-rot.webp',
      'Holzfäller': 'images/villager-holzfaeller-rot.webp',
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
      'Förster': 'images/foerster.webp'
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
      if (this.game.tutorialActive) {
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
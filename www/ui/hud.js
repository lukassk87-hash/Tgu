window.Game = window.Game || {};

Game.HUD = class HUD {
  constructor(game) {
    this.game = game;
    this.activeBuild = null;

    this.buildButton = document.getElementById('buildButton');
    this.buildWindow = document.getElementById('buildWindow');
    this.buildWindowClose = document.getElementById('buildWindowClose');
    this.buildGrid = document.getElementById('buildGrid');
    this.tabs = Array.from(document.querySelectorAll('.build-tab'));

    this.statsButton = document.getElementById('statsButton');
    this.statsWindow = document.getElementById('statsWindow');
    this.statsWindowClose = document.getElementById('statsWindowClose');
    this.statsBody = document.getElementById('statsBody');

    this.villagersButton = document.getElementById('villagersButton');
    this.villagersWindow = document.getElementById('villagersWindow');
    this.villagersWindowClose = document.getElementById('villagersWindowClose');
    this.villagersBody = document.getElementById('villagersBody');

    this.currentCategory = 'small';

    this.resourceEmojis = {
      wood: '🌲', stone: '🪨', grain: '🌾', fish: '🐟',
      water: '💧', beer: '🍺', woodPlank: '🪵'
    };
    this.resourceNames = {
      wood: 'Holz', stone: 'Stein', grain: 'Weizen', fish: 'Fisch',
      water: 'Wasser', beer: 'Bier', woodPlank: 'Bretter'
    };

    this.categories = {
      small: [],
      normal: [],
      large: []
    };

    this._categorizeBuildings();
    this._bindEvents();
  }

  _categorizeBuildings() {
    for (const id in Game.BUILDING_TYPES) {
      const def = Game.BUILDING_TYPES[id];
      if (def.id === 'castle') continue;

      const w = def.width || 1;
      const h = def.height || 1;
      const maxDim = Math.max(w, h);

      if (maxDim <= 1) {
        this.categories.small.push(def);
      } else if (maxDim === 2) {
        this.categories.normal.push(def);
      } else {
        this.categories.large.push(def);
      }
    }
  }

  _bindEvents() {
    this.buildButton.addEventListener('click', () => this.openBuildWindow());
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

  openStatsWindow() {
    if (!this.statsWindow) return;
    this.statsWindow.classList.remove('hidden');
    if (this.game.stats && this.statsBody) {
      this.game.stats.render(this.statsBody);
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

    // NEU: Brot-Statistik
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

    // Gesamtzahl
    html += `
      <div class="stats-row" style="border-color:#ffcc00;">
        <div class="stats-header-cell">
          <div class="stats-icon">👥</div>
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

    // NEU: Brot-Status
    html += `
      <div class="stats-row" style="border-color:#a86f33;">
        <div class="stats-header-cell">
          <div class="stats-icon">🍞</div>
          <div class="stats-name">Brot-Status</div>
        </div>
        <div class="stats-data-grid" style="grid-template-columns: 1fr 1fr;">
          <div class="stats-data-item">
            <div class="stats-label">Ohne Brot</div>
            <div class="stats-value ${breadStats.needsBread > 0 ? 'stats-negative' : 'stats-neutral'}" style="font-size:18px;">${breadStats.needsBread}</div>
          </div>
          <div class="stats-data-item">
            <div class="stats-label">Kurz vor Tod</div>
            <div class="stats-value ${breadStats.nearDeath > 0 ? 'stats-negative' : 'stats-neutral'}" style="font-size:18px;">${breadStats.nearDeath}</div>
          </div>
        </div>
      </div>
    `;

    // Aufschlüsselung nach Job
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
      'Freie Bürger': '🏠',
      'Krieger': '⚔️',
      'Holzfäller': '🌲',
      'Steinmetz': '🪨',
      'Bauer': '🌾',
      'Fischer': '🐟',
      'Sägewerker': '🪚',
      'Müller': '🌬️',
      'Brauer': '🍺',
      'Bäcker': '🥖',
      'Brunnenwärter': '💧'
    };
    return map[jobName] || '👷';
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

  _renderGrid() {
    const list = this.categories[this.currentCategory] || [];
    this.buildGrid.innerHTML = '';

    if (list.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'build-grid-empty';
      empty.textContent = 'Keine Gebäude in dieser Kategorie.';
      this.buildGrid.appendChild(empty);
      return;
    }

    for (const def of list) {
      const affordable = this._isAffordable(def);

      const card = document.createElement('div');
      card.className = 'build-card'
        + (this.activeBuild === def.id ? ' active' : '')
        + (!affordable ? ' not-affordable' : '');
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

      let costParts = [];
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

      if (affordable) {
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
    if (this.buildWindow.classList.contains('hidden')) return;
    const cards = this.buildGrid.querySelectorAll('.build-card');
    cards.forEach(card => {
      const id = card.dataset.id;
      const def = Game.BUILDING_TYPES[id];
      if (!def) return;
      const affordable = this._isAffordable(def);
      card.classList.toggle('not-affordable', !affordable);
    });
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
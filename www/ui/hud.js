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

    // NEU: Statistik-Elemente
    this.statsButton = document.getElementById('statsButton');
    this.statsWindow = document.getElementById('statsWindow');
    this.statsWindowClose = document.getElementById('statsWindowClose');
    this.statsBody = document.getElementById('statsBody');

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

    // NEU: Statistik-Fenster Events
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
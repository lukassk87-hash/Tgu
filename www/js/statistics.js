window.Game = window.Game || {};

Game.Statistics = class Statistics {
  constructor(economy) {
    this.economy = economy;
    this.history = [];
    this.maxHistory = 300;
    this.lastValues = {};
    
    for (const key in economy.res) {
      this.lastValues[key] = economy.res[key] || 0;
    }

    this.activeTab = 'resources';
  }

  tick() {
    const produced = {};
    const consumed = {};

    for (const key in this.economy.res) {
      const current = this.economy.res[key] || 0;
      const prev = this.lastValues[key] || 0;
      const diff = current - prev;

      if (diff > 0) {
        produced[key] = diff;
        consumed[key] = 0;
      } else if (diff < 0) {
        produced[key] = 0;
        consumed[key] = Math.abs(diff);
      } else {
        produced[key] = 0;
        consumed[key] = 0;
      }

      this.lastValues[key] = current;
    }

    this.history.push({ produced, consumed });

    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  render(container) {
    if (!container) return;
    
    if (this.activeTab === 'enemies') {
      this._renderEnemies(container);
    } else if (this.activeTab === 'production') {
      this._renderProduction(container);
    } else {
      this._renderResources(container);
    }
  }

  _renderResources(container) {
    const ui = Game.UI;
    const timeWindows = [
      { name: '1 Minute', seconds: 60 },
      { name: '5 Minuten', seconds: 300 }
    ];

    const resOrder = [
      'wood', 'stone', 'grain', 'fish', 'water', 'beer', 
      'woodPlank', 'flour', 'bread', 'arrows', 
      'feed', 'pig', 'meat', 'dragonBone'
    ];

    let html = '';

    for (const key of resOrder) {
      if (this.economy.res[key] === undefined) continue;

      const iconHtml = ui.resourceIcon(key);
      const name = ui.resourceNames[key] || key;

      html += `
        <div class="stats-row">
          <div class="stats-header-cell">
            <div class="stats-icon" style="display:flex; align-items:center; justify-content:center; width:28px; height:28px;">${iconHtml}</div>
            <div class="stats-name">${name}</div>
          </div>
          <div class="stats-windows">
      `;

      for (const tw of timeWindows) {
        const slice = this.history.slice(-tw.seconds);
        
        let totalProd = 0;
        let totalCons = 0;

        for (const entry of slice) {
          if (entry.produced[key]) totalProd += entry.produced[key];
          if (entry.consumed[key]) totalCons += entry.consumed[key];
        }

        const diff = totalProd - totalCons;
        const actualSeconds = slice.length || 1;
        const perMin = Math.round(diff * (60 / actualSeconds));

        let diffClass = 'stats-neutral';
        if (diff > 0) diffClass = 'stats-positive';
        else if (diff < 0) diffClass = 'stats-negative';

        let perMinClass = 'stats-neutral';
        if (perMin > 0) perMinClass = 'stats-positive';
        else if (perMin < 0) perMinClass = 'stats-negative';

        const diffStr = diff > 0 ? `+${diff}` : `${diff}`;
        const perMinStr = perMin > 0 ? `+${perMin}` : `${perMin}`;

        html += `
          <div class="stats-window-block">
            <div class="stats-window-title">${tw.name}</div>
            <div class="stats-data-grid">
              <div class="stats-data-item">
                <div class="stats-label">Prod.</div>
                <div class="stats-value stats-positive">+${totalProd}</div>
              </div>
              <div class="stats-data-item">
                <div class="stats-label">Verbr.</div>
                <div class="stats-value stats-negative">-${totalCons}</div>
              </div>
              <div class="stats-data-item">
                <div class="stats-label">Diff.</div>
                <div class="stats-value ${diffClass}">${diffStr}</div>
              </div>
              <div class="stats-data-item">
                <div class="stats-label">Pro Min.</div>
                <div class="stats-value ${perMinClass}">${perMinStr}</div>
              </div>
            </div>
          </div>
        `;
      }

      html += `
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
  }

  _renderEnemies(container) {
    const game = Game.state;
    const stats = game && game.enemyStats ? game.enemyStats : {};
    const ui = Game.UI;

    const iconImg = (path) => `<img src="${path}" style="width:24px;height:24px;object-fit:contain;">`;

    const rows = [
      { label: 'Zombies getötet',         value: stats.zombiesKilled || 0,          icon: 'images/zombie.webp',               color: '#7ad07a', group: 'Gegner besiegt' },
      { label: 'Räuber getötet',          value: stats.raidersKilled || 0,          icon: 'images/villager-krieger-blau.webp', color: '#7ab4d8', group: 'Gegner besiegt' },
      { label: 'Räuberlager zerstört',    value: stats.raiderCastlesDestroyed || 0, icon: 'images/schloss2.webp',             color: '#4A90E2', group: 'Gegner besiegt' },
      { label: 'Räuberhäuser zerstört',   value: stats.raiderHousesDestroyed || 0,  icon: 'images/wachturm-blau.webp',        color: '#4A90E2', group: 'Gegner besiegt' },
      { label: 'Drachen getötet',         value: stats.dragonsKilled || 0,          icon: 'images/drache.webp',               color: '#ff8a5c', group: 'Gegner besiegt' },
      { label: 'Drachen entkommen',       value: stats.dragonsEscaped || 0,         icon: 'images/dracheko.webp',             color: '#ffcc00', group: 'Gegner besiegt' },

      { label: 'Zombifiziert',            value: stats.villagersZombified || 0,     icon: 'images/zombie.webp',               color: '#a83232', group: 'Eigene Verluste' },
      { label: 'Krieger gefallen',        value: stats.warriorsKilled || 0,         icon: 'images/villager-krieger-rot.webp', color: '#a83232', group: 'Eigene Verluste' },
      { label: 'Gebäude vom Drachen zerstört', value: stats.buildingsDestroyedByDragon || 0, icon: 'images/flamme.webp',   color: '#a83232', group: 'Eigene Verluste' }
    ];

    let html = '';
    let currentGroup = null;

    for (const r of rows) {
      if (r.group !== currentGroup) {
        currentGroup = r.group;
        html += `<div class="job-group-title">${currentGroup}</div>`;
      }

      html += `
        <div class="stats-row" style="margin-bottom:8px;">
          <div class="stats-header-cell">
            <div class="stats-icon" style="width:36px; height:36px; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.3); border-radius:6px;">
              ${iconImg(r.icon)}
            </div>
            <div class="stats-name" style="flex:1;">${r.label}</div>
            <div class="stats-value" style="font-size:22px; color:${r.color}; min-width:60px; text-align:right;">${r.value}</div>
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
  }

  _renderProduction(container) {
    const game = Game.state;
    const prodStats = game && game.productionStats ? game.productionStats : {};
    const ui = Game.UI;

    const resOrder = [
      'wood', 'stone', 'grain', 'fish', 'water', 'beer',
      'woodPlank', 'flour', 'bread', 'arrows',
      'feed', 'pig', 'meat', 'dragonBone'
    ];

    let totalAll = 0;
    for (const key of resOrder) {
      totalAll += prodStats[key] || 0;
    }

    let html = '';

    html += `
      <div class="stats-row" style="border-color: var(--gold); margin-bottom: 12px;">
        <div class="stats-header-cell">
          <div class="stats-icon" style="width:36px; height:36px; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.3); border-radius:6px; font-size:20px;">
            📊
          </div>
          <div class="stats-name" style="flex:1;">Alle Ressourcen</div>
          <div class="stats-value" style="font-size:24px; color:var(--gold); min-width:80px; text-align:right;">${totalAll.toLocaleString('de-DE')}</div>
        </div>
      </div>
    `;

    for (const key of resOrder) {
      const amount = prodStats[key] || 0;
      const iconHtml = ui.resourceIcon(key);
      const name = ui.resourceNames[key] || key;

      const pct = totalAll > 0 ? Math.round((amount / totalAll) * 100) : 0;

      html += `
        <div class="stats-row" style="margin-bottom: 6px;">
          <div class="stats-header-cell">
            <div class="stats-icon" style="width:32px; height:32px; display:flex; align-items:center; justify-content:center;">
              ${iconHtml}
            </div>
            <div class="stats-name" style="flex:1;">${name}</div>
            <div class="stats-value" style="font-size:18px; color:#e8d8b0; min-width:80px; text-align:right;">${amount.toLocaleString('de-DE')}</div>
          </div>
          <div class="progress-bar" style="margin-top: 6px;">
            <div class="progress-bar-fill" style="width:${pct}%"></div>
          </div>
          <div style="text-align: right; font-size: 10px; color: #888; margin-top: 2px;">${pct}%</div>
        </div>
      `;
    }

    container.innerHTML = html;
  }

  getResourceTotals(key, seconds = 300) {
    const slice = this.history.slice(-seconds);
    let totalProd = 0;
    let totalCons = 0;

    for (const entry of slice) {
      if (entry.produced[key]) totalProd += entry.produced[key];
      if (entry.consumed[key]) totalCons += entry.consumed[key];
    }

    return {
      produced: totalProd,
      consumed: totalCons,
      diff: totalProd - totalCons
    };
  }

  getResourcePriority(seconds = 300) {
    const result = {};
    const resOrder = [
      'wood', 'stone', 'grain', 'fish', 'water', 'beer', 
      'woodPlank', 'flour', 'bread', 'arrows', 
      'feed', 'pig', 'meat', 'dragonBone'
    ];

    for (const key of resOrder) {
      if (this.economy.res[key] === undefined) continue;

      const totals = this.getResourceTotals(key, seconds);

      if (totals.diff >= 0) {
        result[key] = 0;
        continue;
      }

      if (totals.produced <= 0) {
        result[key] = 100;
      } else {
        result[key] = totals.consumed / Math.max(1, totals.produced);
      }
    }

    return result;
  }
};
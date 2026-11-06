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

    const ui = Game.UI;
    const timeWindows = [
      { name: '1 Minute', seconds: 60 },
      { name: '5 Minuten', seconds: 300 }
    ];

    const resOrder = [
      'wood', 'stone', 'grain', 'fish', 'water', 'beer', 
      'woodPlank', 'flour', 'bread', 'arrows', 
      'feed', 'pig', 'meat'
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
      'feed', 'pig', 'meat'
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
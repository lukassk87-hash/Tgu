window.Game = window.Game || {};

Game.UI = {
  resourceImages: {
    wood: 'images/icon_baum.webp',
    stone: 'images/icon_stein.webp',
    grain: 'images/icon_getreide.webp',
    fish: 'images/icon_fisch.webp'
  },
  resourceNames: {
    wood: 'Holz', stone: 'Stein', grain: 'Weizen', fish: 'Fisch',
    water: 'Wasser', beer: 'Bier', woodPlank: 'Bretter', flour: 'Mehl', bread: 'Brot'
  },

  resourceIcon(key) {
    if (this.resourceImages[key]) {
      return `<img src="${this.resourceImages[key]}" style="width:18px;height:18px;vertical-align:middle;margin-right:4px;object-fit:contain;">`;
    }
    const fallbacks = {
      water: '💧', beer: '🍺', woodPlank: '🪵', flour: '🌾', bread: '🍞'
    };
    return `<span style="display:inline-block;width:18px;text-align:center;margin-right:4px;">${fallbacks[key] || '•'}</span>`;
  },

  describeVillager(v) {
    if (!v) return '';
    if (v.state === 'moving') {
      if (v.task === 'go_to_work') return 'unterwegs zur Arbeit';
      if (v.task === 'go_to_warrior_post') return 'unterwegs zum Posten';
      if (v.task === 'go_to_build') return 'unterwegs zur Baustelle';
      if (v.task === 'go_to_pickup') return 'unterwegs zum Abholen';
      if (v.task === 'go_to_dropoff') return 'unterwegs zum Lager';
      if (v.task === 'harvest_route') return 'unterwegs zum Feld';
      if (v.task === 'recipe_fetch_storage') return 'unterwegs zum Lager';
      if (v.task === 'recipe_fetch_return') return 'unterwegs zur Produktion';
      if (v.task === 'fetch_fish_storage') return 'unterwegs zum Fischholen';
      if (v.task === 'fetch_fish_return') return 'unterwegs mit Fisch';
      if (v.task === 'go_home') return 'unterwegs nach Hause';
      return 'unterwegs';
    }
    if (v.state === 'building') return 'baut';
    if (v.state === 'harvesting') return 'erntet';
    if (v.state === 'working') {
      if (v.job === 'warrior') return 'im Dienst';
      if (v.job === 'worker') return 'arbeitet';
      return 'tätig';
    }
    if (v.job === 'warrior') return 'im Dienst';
    if (v.job === 'worker') return 'arbeitet';
    return 'zu Hause';
  },

  villagerStateEmoji(v) {
    if (!v) return '❓';
    if (v.job === 'warrior') return '⚔️';
    if (v.state === 'building' || v.task === 'go_to_build') return '🔨';
    if (v.state === 'harvesting' || v.task === 'harvest_route') return '🌾';
    if (v.state === 'moving') return '🚶';
    if (v.job === 'worker') return '👷';
    return '🏠';
  },

  computePanelHash(b, vm, economy) {
    let h = b.id + '|' + (b.built ? 1 : 0) + '|' + (b.storage || 0) + '|' + (b.progress || 0);
    if (b.def.recipe) {
      h += '|r' + (b.recipeTimer || 0);
      for (const k in b.recipeStorage) h += k + b.recipeStorage[k];
    }
    if (b.def.generatesResource) h += '|g' + (b.generatesTimer || 0);
    h += '|f' + (b.fishSlots || 0) + '-' + (b.fishConsumeTimer || 0) + '-' + (b.fishRetryTimer || 0) + '-' + (b.fishPendingFetch ? 1 : 0);
    h += '|w' + (b.workerId || 0);
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
    h += '|bread' + (b.breadStorage || 0);
    if (b.warriorSlots) {
      for (const wid of b.warriorSlots) {
        if (wid === null) continue;
        const w = vm.villagers.get(wid);
        if (w) h += '|wb' + (w.beerBuff ? 1 : 0) + (w.beerBuffTimer || 0);
      }
    }
    if (b.def.isStorage || b.def.id === 'castle') {
      for (const k in economy.res) h += '|e' + k + economy.res[k];
    }
    return h;
  },

  buildPanelHtml(b, vm, economy) {
    let html = '';
    const R_ICON = (k) => this.resourceIcon(k);
    const R_NAME = (k) => this.resourceNames[k];

    if (!b.built) {
      const progress = Math.min(100, Math.floor((b.progress / b.buildTime) * 100));
      html += `<div class="info-row"><span class="label">Status:</span><span class="value" style="color:#fa0">Im Bau</span></div>`;
      html += `<div class="info-row"><span class="label">Fortschritt:</span><span class="value">${progress}%</span></div>`;
      html += `<div class="progress-bar"><div class="progress-bar-fill" style="width:${progress}%"></div></div>`;
      return html;
    }

    if (b.def.isStorage || b.def.id === 'castle') {
      html += `<div class="info-section"><h4>Ressourcen (Gesamt)</h4>`;
      for (const key of ['wood', 'stone', 'grain', 'fish', 'water', 'beer', 'woodPlank', 'flour', 'bread']) {
        const amount = Math.floor(economy.res[key] || 0);
        html += `<div class="info-row"><span class="label">${R_ICON(key)} ${R_NAME(key)}</span><span class="value">${amount}</span></div>`;
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

    // NEU: Fisch-Slot-Anzeige (für alle consumesFish-Gebäude)
    if (b.def.consumesFish) {
      html += `<div class="info-section"><h4>🐟 Fisch-Slots</h4>`;
      const slots = b.fishSlots || 0;
      let icons = '';
      for (let i = 0; i < 3; i++) icons += i < slots ? '🐟' : '⚪';
      const eff = slots > 0 ? 100 : 25;
      html += `<div class="info-row"><span class="label">Slots:</span><span class="value" style="font-size:15px;">${icons}</span></div>`;
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
      html += `<div class="info-section"><h4>Rezept (alle 30s)</h4>`;
      let inputParts = [];
      for (const k in b.def.recipe.inputs) inputParts.push(`${b.def.recipe.inputs[k]} ${R_NAME(k)}`);
      html += `<div class="info-row"><span class="label">Verbrauch:</span><span class="value">${inputParts.join(' + ')}</span></div>`;
      html += `<div class="info-row"><span class="label">Produziert:</span><span class="value">${b.def.recipe.amount} ${R_NAME(b.def.recipe.output)}</span></div>`;
      const timerPct = Math.min(100, Math.floor(((b.recipeTimer || 0) / 30) * 100));
      html += `<div class="info-row"><span class="label">Timer:</span><span class="value">${timerPct}%</span></div>`;
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
      html += `<div class="info-section"><h4>🍺 Bier-Lager</h4>`;
      const beerPct = b.maxBeer > 0 ? Math.floor((b.beerStorage / b.maxBeer) * 100) : 0;
      html += `<div class="info-row"><span class="label">Bier</span><span class="value">${b.beerStorage} / ${b.maxBeer}</span></div>`;
      html += `<div class="progress-bar"><div class="progress-bar-fill" style="width:${beerPct}%;background:#d4a017"></div></div>`;
      html += `</div>`;
    }

    if (b.def.id === 'house') {
      html += `<div class="info-section"><h4>🍞 Brot-Lager</h4>`;
      const breadPct = b.maxBread > 0 ? Math.floor((b.breadStorage / b.maxBread) * 100) : 0;
      html += `<div class="info-row"><span class="label">Brot</span><span class="value">${b.breadStorage} / ${b.maxBread}</span></div>`;
      html += `<div class="progress-bar"><div class="progress-bar-fill" style="width:${breadPct}%;background:#a86f33"></div></div>`;
      html += `</div>`;
    }

    const hasWarriorSlots = b.warriorSlots && b.warriorSlots.length > 0;
    const hasResidents = b.residents && b.residents.length > 0;
    const hasWorker = b.workerId !== null;

    if (hasWorker || hasWarriorSlots || hasResidents) {
      html += `<div class="info-section"><h4>Bewohner</h4>`;
      
      if (hasWorker) {
        const w = vm.villagers.get(b.workerId);
        const wname = w ? w.name : ('#' + b.workerId);
        const desc = w ? this.describeVillager(w) : '';
        html += `<div class="info-item"><span>👷 ${wname}${desc ? ` <span style="color:#888">(${desc})</span>` : ''}</span></div>`;
      }
      
      if (hasWarriorSlots) {
        let activeCount = 0;
        for (const id of b.warriorSlots) if (id !== null) activeCount++;
        html += `<div class="info-item"><span>⚔️ Krieger (${activeCount} / ${b.maxWarriors}):</span></div>`;
        for (let i = 0; i < b.warriorSlots.length; i++) {
          const wid = b.warriorSlots[i];
          if (wid === null) {
            html += `<div class="info-item" style="padding-left:16px;font-size:11px;color:#555;">• Slot ${i + 1}: frei</div>`;
          } else {
            const w = vm.villagers.get(wid);
            if (w) {
              const buff = w.beerBuff ? ` <span style="color:#d4a017">🍺 (${w.beerBuffTimer}s)</span>` : '';
              html += `<div class="info-item" style="padding-left:16px;font-size:11px;color:#bbb;">• Slot ${i + 1}: ${w.name}${buff}</div>`;
            } else {
              html += `<div class="info-item" style="padding-left:16px;font-size:11px;color:#555;">• Slot ${i + 1}: frei</div>`;
            }
          }
        }
      }
      
      if (hasResidents) {
        let active = 0;
        for (const rid of b.residents) if (vm.villagers.has(rid)) active++;
        html += `<div class="info-item"><span>🏠 Einwohner (${active} / ${b.def.maxResidents || 5}):</span></div>`;
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
  }
};
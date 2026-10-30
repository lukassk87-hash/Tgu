window.Game = window.Game || {};

function preloadAssets() {
  const imagesToLoad = [
    'images/gras.webp', 'images/holz.webp', 'images/stein.webp', 'images/wasser.webp',
    'images/haus-rot.webp', 'images/holzfaeller-rot.webp', 'images/steinmetz-rot.webp',
    'images/bauer-rot.webp', 'images/fischerhuette-rot.webp', 'images/lager-rot.webp',
    'images/wachturm-rot.webp', 'images/schloss.webp',
    'images/brunnen-rot.webp', 'images/bierbrauerei-rot.webp', 'images/saegewerk-rot.webp',
    'images/muehle-rot.webp', 'images/baecker-rot.webp',
    'images/villager-idle-rot.webp', 'images/villager-baumeister-rot.webp',
    'images/villager-holzfaeller-rot.webp', 'images/villager-steinmetz-rot.webp',
    'images/villager-bauer-rot.webp', 'images/villager-angler-rot.webp',
    'images/villager-krieger-rot.webp',
    'images/icon_baum.webp', 'images/icon_stein.webp', 'images/icon_getreide.webp', 'images/icon_fisch.webp',
    'images/grenze-rot.webp'
  ];
  imagesToLoad.forEach(path => Game.Assets.loadImage(path));
}

window.addEventListener('DOMContentLoaded', () => {
  preloadAssets();

  const canvas = document.getElementById('game');
  const menu = document.getElementById('menu');
  const placeHint = document.getElementById('placeHint');
  const startBtn = document.getElementById('startBtn');

  const buildConfirm = document.getElementById('buildConfirm');
  const buildConfirmTitle = document.getElementById('buildConfirmTitle');
  const buildConfirmCost = document.getElementById('buildConfirmCost');
  const buildConfirmYes = document.getElementById('buildConfirmYes');
  const buildConfirmNo = document.getElementById('buildConfirmNo');

  const infoPanel = document.getElementById('infoPanel');
  const infoIcon = document.getElementById('infoIcon');
  const infoTitle = document.getElementById('infoTitle');
  const infoContent = document.getElementById('infoContent');
  const infoClose = document.getElementById('infoClose');

  const steppers = Array.from(document.querySelectorAll('.stepper'));
  const terrInputs = [
    document.getElementById('terrGrass'),
    document.getElementById('terrForest'),
    document.getElementById('terrMountain'),
    document.getElementById('terrWater')
  ];
  const terrSumEl = document.getElementById('terrSum');

  function clampValue(val, min, max) {
    if (isNaN(val)) val = min;
    if (val < min) val = min;
    if (max !== undefined && val > max) val = max;
    return val;
  }

  for (const stepper of steppers) {
    const input = stepper.querySelector('.stepper-value');
    const step = parseInt(stepper.dataset.step, 10) || 10;
    const min = parseInt(input.getAttribute('min'), 10) || 0;
    const maxAttr = stepper.dataset.max || input.getAttribute('max');
    const max = maxAttr ? parseInt(maxAttr, 10) : undefined;

    stepper.querySelector('.minus').addEventListener('click', () => {
      input.value = clampValue((parseInt(input.value, 10) || 0) - step, min, max);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });

    stepper.querySelector('.plus').addEventListener('click', () => {
      input.value = clampValue((parseInt(input.value, 10) || 0) + step, min, max);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });

    input.addEventListener('input', () => {
      input.value = clampValue(parseInt(input.value, 10) || 0, min, max);
    });
  }

  function getTerrainDistribution() {
    return {
      grass:    Math.max(0, parseInt(terrInputs[0].value, 10) || 0),
      forest:   Math.max(0, parseInt(terrInputs[1].value, 10) || 0),
      mountain: Math.max(0, parseInt(terrInputs[2].value, 10) || 0),
      water:    Math.max(0, parseInt(terrInputs[3].value, 10) || 0)
    };
  }

  function updateTerrSum() {
    const d = getTerrainDistribution();
    const sum = d.grass + d.forest + d.mountain + d.water;
    terrSumEl.textContent = `Summe: ${sum} %`;
    if (sum === 100) {
      terrSumEl.classList.remove('bad');
      terrSumEl.classList.add('ok');
      startBtn.disabled = false;
    } else {
      terrSumEl.classList.remove('ok');
      terrSumEl.classList.add('bad');
      startBtn.disabled = true;
    }
  }

  for (const inp of terrInputs) {
    inp.addEventListener('input', updateTerrSum);
  }
  updateTerrSum();

  const game = { state: 'menu', world: null, renderer: null, input: null, ticker: null, economy: null, hud: null, vm: null };
  Game.state = game;

  startBtn.addEventListener('click', () => {
    const distribution = getTerrainDistribution();
    const sum = distribution.grass + distribution.forest + distribution.mountain + distribution.water;
    if (sum !== 100) return;

    const size = parseInt(document.getElementById('mapSize').value, 10);
    const seedStr = document.getElementById('seed').value.trim();
    const seed = seedStr ? hashString(seedStr) : (Math.random() * 0xffffffff) >>> 0;

    const startRes = {
      wood:      Math.max(0, parseInt(document.getElementById('startWood').value, 10) || 0),
      stone:     Math.max(0, parseInt(document.getElementById('startStone').value, 10) || 0),
      grain:     Math.max(0, parseInt(document.getElementById('startGrain').value, 10) || 0),
      fish:      Math.max(0, parseInt(document.getElementById('startFish').value, 10) || 0),
      water:     Math.max(0, parseInt(document.getElementById('startWater').value, 10) || 0),
      beer:      Math.max(0, parseInt(document.getElementById('startBeer').value, 10) || 0),
      woodPlank: Math.max(0, parseInt(document.getElementById('startWoodPlank').value, 10) || 0),
      flour:     Math.max(0, parseInt(document.getElementById('startFlour').value, 10) || 0),
      bread:     Math.max(0, parseInt(document.getElementById('startBread').value, 10) || 0)
    };

    menu.classList.add('hidden');
    beginGame(size, seed, distribution, startRes);
  });

  function hashString(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return h >>> 0;
  }

  const resourceImages = {
    wood: 'images/icon_baum.webp',
    stone: 'images/icon_stein.webp',
    grain: 'images/icon_getreide.webp',
    fish: 'images/icon_fisch.webp'
  };
  const resourceNames = {
    wood: 'Holz', stone: 'Stein', grain: 'Weizen', fish: 'Fisch',
    water: 'Wasser', beer: 'Bier', woodPlank: 'Bretter', flour: 'Mehl', bread: 'Brot'
  };

  function resourceIcon(key) {
    if (resourceImages[key]) {
      return `<img src="${resourceImages[key]}" style="width:18px;height:18px;vertical-align:middle;margin-right:4px;object-fit:contain;">`;
    }
    const fallbacks = {
      water: '💧', beer: '🍺', woodPlank: '🪵', flour: '🌾', bread: '🍞'
    };
    return `<span style="display:inline-block;width:18px;text-align:center;margin-right:4px;">${fallbacks[key] || '•'}</span>`;
  }

  function describeVillager(v) {
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
  }

  function villagerStateEmoji(v) {
    if (!v) return '❓';
    if (v.job === 'warrior') return '⚔️';
    if (v.state === 'building' || v.task === 'go_to_build') return '🔨';
    if (v.state === 'harvesting' || v.task === 'harvest_route') return '🌾';
    if (v.state === 'moving') return '🚶';
    if (v.job === 'worker') return '👷';
    return '🏠';
  }

  function beginGame(size, seed, distribution, startRes) {
    const { width, height, grid } = Game.generateMap(size, size, seed, distribution);
    const world = new Game.World(width, height, grid);
    const ticker = new Game.Ticker(1);
    
    const economy = {
      res: startRes,
      canAfford(cost) { for (const k in cost) if ((this.res[k] || 0) < cost[k]) return false; return true; },
      pay(cost) { for (const k in cost) this.res[k] -= cost[k]; },
      onChange() { if (game.hud) game.hud.updateResources(this); }
    };

    const vm = new Game.VillagerManager(world, ticker, economy);
    const renderer = new Game.Renderer(canvas, world, vm);
    
    vm.onHarvest = (x, y, type) => renderer.spawnHarvestParticles(x, y, type);
    vm.onDeath = (v) => {};
    
    renderer.camera.x = (width * renderer.tileSize) / 2 - (window.innerWidth / renderer.camera.zoom) / 2;
    renderer.camera.y = (height * renderer.tileSize) / 2 - (window.innerHeight / renderer.camera.zoom) / 2;
    renderer.clampCamera();

    let selectedBuilding = null;
    let lastPanelHash = '';
    let pendingPlacement = null;

    function clearPendingPlacement() {
      pendingPlacement = null;
      renderer.pendingPlacement = null;
    }

    function hideInfoPanel() {
      infoPanel.classList.add('hidden');
      selectedBuilding = null;
      lastPanelHash = '';
      renderer.selectedBuildingId = null;
    }

    infoClose.addEventListener('click', hideInfoPanel);

    function computePanelHash(b) {
      let h = b.id + '|' + (b.built ? 1 : 0) + '|' + (b.storage || 0) + '|' + (b.progress || 0);
      if (b.def.recipe) {
        h += '|r' + (b.recipeTimer || 0);
        for (const k in b.recipeStorage) h += k + b.recipeStorage[k];
      }
      if (b.def.generatesResource) h += '|g' + (b.generatesTimer || 0);
      h += '|f' + (b.fishBuffer || 0);
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
    }

    function buildPanelHtml(b) {
      let html = '';

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
          html += `<div class="info-row"><span class="label">${resourceIcon(key)} ${resourceNames[key]}</span><span class="value">${amount}</span></div>`;
        }
        html += `</div>`;
      }

      if (b.def.generatesResource) {
        html += `<div class="info-section"><h4>Produktion</h4>`;
        html += `<div class="info-row"><span class="label">${resourceIcon(b.def.generatesResource)} ${resourceNames[b.def.generatesResource]}</span><span class="value">${b.storage} / ${b.maxCapacity}</span></div>`;
        const pct = b.maxCapacity > 0 ? Math.min(100, Math.floor((b.storage / b.maxCapacity) * 100)) : 0;
        html += `<div class="progress-bar"><div class="progress-bar-fill" style="width:${pct}%"></div></div>`;
        const timeLeft = b.def.generatesInterval - (b.generatesTimer || 0);
        html += `<div class="info-row"><span class="label">Nächste Ladung in:</span><span class="value">${timeLeft}s</span></div>`;
        html += `<div class="info-row"><span class="label">Menge:</span><span class="value">+${b.def.generatesAmount} alle ${b.def.generatesInterval}s</span></div>`;
        if (b.def.consumesFish) {
          html += `<div class="info-row"><span class="label">🐟 Fischpuffer:</span><span class="value">${b.fishBuffer || 0} / 3</span></div>`;
        }
        html += `</div>`;
      }

      if (b.def.recipe) {
        html += `<div class="info-section"><h4>Zutaten-Lager</h4>`;
        const maxS = b.def.recipeMaxStorage || {};
        for (const k in b.def.recipe.inputs) {
          const stored = b.recipeStorage[k] || 0;
          const max = maxS[k] || 10;
          html += `<div class="info-row"><span class="label">${resourceIcon(k)} ${resourceNames[k]}</span><span class="value">${stored} / ${max}</span></div>`;
          const pct = Math.min(100, Math.floor((stored / max) * 100));
          html += `<div class="progress-bar"><div class="progress-bar-fill" style="width:${pct}%"></div></div>`;
        }
        html += `</div>`;
        html += `<div class="info-section"><h4>Rezept (alle 30s)</h4>`;
        let inputParts = [];
        for (const k in b.def.recipe.inputs) inputParts.push(`${b.def.recipe.inputs[k]} ${resourceNames[k]}`);
        html += `<div class="info-row"><span class="label">Verbrauch:</span><span class="value">${inputParts.join(' + ')}</span></div>`;
        html += `<div class="info-row"><span class="label">Produziert:</span><span class="value">${b.def.recipe.amount} ${resourceNames[b.def.recipe.output]}</span></div>`;
        const timerPct = Math.min(100, Math.floor(((b.recipeTimer || 0) / 30) * 100));
        html += `<div class="info-row"><span class="label">Timer:</span><span class="value">${timerPct}%</span></div>`;
        html += `<div class="progress-bar"><div class="progress-bar-fill" style="width:${timerPct}%"></div></div>`;
        html += `</div>`;
      }

      if (b.def.produces || b.def.recipe) {
        const outputKey = b.def.produces || b.def.recipe.output;
        html += `<div class="info-section"><h4>Ausgangs-Lager</h4>`;
        html += `<div class="info-row"><span class="label">${resourceIcon(outputKey)} ${resourceNames[outputKey]}</span><span class="value">${b.storage} / ${b.maxCapacity}</span></div>`;
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
          const desc = w ? describeVillager(w) : '';
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
            const emoji = villagerStateEmoji(w);
            const desc = describeVillager(w);
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

    function showInfoPanel(b) {
      selectedBuilding = b;
      renderer.selectedBuildingId = b.id;
      infoIcon.src = b.def.asset || '';
      infoTitle.textContent = b.def.name;
      lastPanelHash = computePanelHash(b);
      infoContent.innerHTML = buildPanelHtml(b);
      infoPanel.classList.remove('hidden');
    }

    function refreshInfoPanel() {
      if (!selectedBuilding) return;
      const newHash = computePanelHash(selectedBuilding);
      if (newHash === lastPanelHash) return;
      lastPanelHash = newHash;
      infoContent.innerHTML = buildPanelHtml(selectedBuilding);
    }

    ticker.onTick((tick) => {
      if (tick % 5 === 0) {
        for (const b of world.buildings.values()) {
          if (b.warriorSlots) {
            for (let i = 0; i < b.warriorSlots.length; i++) {
              const id = b.warriorSlots[i];
              if (id !== null && !vm.villagers.has(id)) {
                b.warriorSlots[i] = null;
              }
            }
          }
          if (b.residents && b.residents.length > 0) {
            for (let i = b.residents.length - 1; i >= 0; i--) {
              if (!vm.villagers.has(b.residents[i])) b.residents.splice(i, 1);
            }
          }
          if (b.workerId !== null && !vm.villagers.has(b.workerId)) b.workerId = null;
          if (b.builderId !== null && !vm.villagers.has(b.builderId)) b.builderId = null;
          if (b.recipeFetchWorkerId !== null && !vm.villagers.has(b.recipeFetchWorkerId)) b.recipeFetchWorkerId = null;
          if (b.logisticsId !== null && !vm.villagers.has(b.logisticsId)) {
            b.logisticsId = null;
            b.isBeingCollected = false;
          }
        }
      }

      const allVillagers = Array.from(vm.villagers.values());

      for (const b of world.buildSites) {
        if (b.builderId === null) continue;
        const builder = vm.villagers.get(b.builderId);
        if (builder && builder.state === 'building') {
          b.progress++;
          if (b.progress >= b.buildTime) {
            world.onBuildingComplete(b);
            builder.state = 'idle'; builder.task = null; builder.buildTargetId = null;
            b.builderId = null; 
            renderer.markStaticDirty();
          }
        }
      }
      
      for (let round = 1; round <= 3; round++) {
        let allSupplied = true;
        for (const b of world.fishConsumers) if (b.fishBuffer < round) { allSupplied = false; break; }
        if (allSupplied) continue;
        for (const b of world.fishConsumers) {
          if (b.fishBuffer >= round) continue;
          if (economy.res.fish > 0) { economy.res.fish -= 1; b.fishBuffer += 1; }
        }
      }
      
      for (const b of world.fishConsumers) {
        b.fishTimer++;
        if (b.fishTimer >= 60) {
          b.fishTimer = 0;
          if (b.fishBuffer > 0) b.fishBuffer -= 1;
        }
      }

      // FIX: Feldwachstum nur, wenn ein Bauer anwesend ist
      for (const b of world.buildings.values()) {
        if (!b.built || !b.def.produces) continue;
        if (b.workerId === null || b.fields.length === 0) continue;
        
        const worker = vm.villagers.get(b.workerId);
        if (!worker) continue;
        
        // Nur wachsen, wenn der Bauer arbeitet (nicht unterwegs)
        if (worker.state !== 'working') continue;

        const hasFish = !b.def.consumesFish || b.fishBuffer > 0;
        const shouldTick = hasFish || (tick % 4 === 0);
        if (shouldTick) {
          for (const field of b.fields) {
            if (field.state === 'growing') {
              field.timer++;
              if (field.timer >= 30) {
                field.state = 'ready';
                field.timer = 0;
              }
            }
          }
        }
      }
      
      // Ernte-Trigger (UNVERÄNDERT!)
      for (const b of world.buildings.values()) {
        if (!b.built || !b.def.produces) continue;
        if (b.workerId === null) continue;
        const worker = vm.villagers.get(b.workerId);
        if (!worker || worker.state !== 'working' || worker.task) continue;
        if (b.fields.some(f => f.state === 'ready')) vm.triggerHarvestRoute(worker, b);
      }

      const collectFullStorage = (b) => {
        if (!b.built) return;
        if (b.maxCapacity > 0 && b.storage >= b.maxCapacity && !b.isBeingCollected) {
          for (const v of allVillagers) {
            if (v.job === 'free' && v.state === 'idle' && !v.task && !v.carrying && !v.recipeCarrying) {
              b.isBeingCollected = true;
              b.logisticsId = v.id;
              v.task = 'go_to_pickup';
              v.workplaceId = b.id;
              v.isLogistics = true;
              v.hidden = false;
              v.renderX = v.x;
              v.renderY = v.y;
              vm.startMove(v, b.x, b.y + (b.h || 1) - 1);
              return;
            }
          }
        }
      };

      for (const b of world.producingBuildings) collectFullStorage(b);
      for (const b of world.recipeBuildings) collectFullStorage(b);
      for (const b of world.generatingBuildings) collectFullStorage(b);

      for (const b of world.generatingBuildings) {
        if (b.workerId === null) continue;
        b.generatesTimer = (b.generatesTimer || 0) + 1;
        if (b.generatesTimer >= b.def.generatesInterval) {
          b.generatesTimer = 0;
          const hasFish = !b.def.consumesFish || b.fishBuffer > 0;
          if (hasFish) {
            b.storage = Math.min(b.maxCapacity, b.storage + b.def.generatesAmount);
          }
        }
      }

      for (const b of world.recipeBuildings) {
        if (!b.built || b.workerId === null) continue;
        const worker = vm.villagers.get(b.workerId);
        if (!worker) continue;

        let needsFetch = false;
        for (const k in b.def.recipe.inputs) {
          if ((b.recipeStorage[k] || 0) < b.def.recipe.inputs[k]) { needsFetch = true; break; }
        }

        if (needsFetch && !b.recipeFetchWorkerId) {
          let anyAvailable = false;
          for (const k in b.def.recipe.inputs) {
            if ((economy.res[k] || 0) > 0) { anyAvailable = true; break; }
          }
          if (anyAvailable) {
            let best = null, bestDistSq = Infinity;
            for (const s of world.dropoffBuildings) {
              const bx = s.x, by = s.y + (s.h || 1) - 1;
              const dx = bx - worker.x, dy = by - worker.y;
              const distSq = dx*dx + dy*dy;
              if (distSq < bestDistSq) { bestDistSq = distSq; best = s; }
            }
            if (best) {
              worker.task = 'recipe_fetch_storage';
              worker.state = 'moving';
              worker.workplaceId = b.id;
              b.recipeFetchWorkerId = worker.id;
              vm.startMove(worker, best.x, best.y + (best.h || 1) - 1);
            }
          }
        }

        if (!needsFetch && worker.state === 'working') {
          b.recipeTimer = (b.recipeTimer || 0) + 1;
          if (b.recipeTimer >= 30) {
            b.recipeTimer = 0;
            for (const k in b.def.recipe.inputs) {
              b.recipeStorage[k] -= b.def.recipe.inputs[k];
            }
            b.storage = (b.storage || 0) + b.def.recipe.amount;
            if (b.storage > b.maxCapacity) b.storage = b.maxCapacity;
          }
        }

        if (b.recipeFetchWorkerId) {
          const w = vm.villagers.get(b.recipeFetchWorkerId);
          if (!w || w.state !== 'moving') b.recipeFetchWorkerId = null;
        }
      }

      for (const b of world.beerBuildings) {
        if (!b.built) continue;
        if (b.beerStorage >= b.maxBeer) continue;
        if (b.beerRefillCooldown > 0) { b.beerRefillCooldown--; continue; }

        if (economy.res.beer > 0) {
          const space = b.maxBeer - b.beerStorage;
          const take = Math.min(space, economy.res.beer);
          economy.res.beer -= take;
          b.beerStorage += take;
          if (economy.onChange) economy.onChange();
        }
        b.beerRefillCooldown = 2;
      }

      for (const b of world.breadBuildings) {
        if (!b.built) continue;
        if (b.breadStorage >= b.maxBread) continue;

        if (economy.res.bread > 0) {
          const space = b.maxBread - b.breadStorage;
          const take = Math.min(space, economy.res.bread);
          economy.res.bread -= take;
          b.breadStorage += take;
          if (economy.onChange) economy.onChange();
        }
      }

      const BEER_INTERVAL = 90;
      const BEER_BUFF_DURATION = 90;

      for (const v of allVillagers) {
        if (v.job !== 'warrior') continue;
        if (v.state !== 'working') continue;
        if (!v.warriorBuildingId) continue;

        const wb = world.buildings.get(v.warriorBuildingId);
        if (!wb || !wb.built) continue;

        if (v.beerBuffTimer > 0) {
          v.beerBuffTimer--;
          if (v.beerBuffTimer <= 0) v.beerBuff = false;
        }

        v.beerDrinkTimer = (v.beerDrinkTimer || 0) + 1;
        if (v.beerDrinkTimer < BEER_INTERVAL) continue;
        v.beerDrinkTimer = 0;

        if (wb.beerStorage > 0) {
          wb.beerStorage -= 1;
          v.beerBuff = true;
          v.beerBuffTimer = BEER_BUFF_DURATION;
        }
      }

      for (const b of world.houses) {
        if (!b.built) continue;

        const maxRes = b.def.maxResidents || 5;
        let totalResidents = 0;
        for (const rid of b.residents) {
          if (vm.villagers.has(rid)) totalResidents++;
        }
        
        if (totalResidents >= maxRes) {
          b.spawnTimer = 0;
          continue;
        }

        const needsBread = b.def.id !== 'castle';
        if (needsBread && b.breadStorage <= 0) {
          b.spawnTimer = 0;
          continue;
        }

        b.spawnTimer = (b.spawnTimer || 0) + 1;
        if (b.spawnTimer < 30) continue;

        if (needsBread) b.breadStorage -= 1;
        b.spawnTimer = 0;
        
        const v = vm.spawn(b.x, b.y, 'free', b.id);
        b.residents.push(v.id);

        if (b.maxWarriors > 0 && b.warriorSlots) {
          if (vm.assignWarriorSlot(b, v)) {
            v.job = 'warrior';
            v.workplaceId = b.id;
            v.warriorBuildingId = b.id;
            v.state = 'working';
            v.hidden = true;
          }
        }
      }

      refreshInfoPanel();
    });

    const input = new Game.Input(canvas, renderer.camera, () => renderer.tileSize);
    input.onClamp = () => renderer.clampCamera();
    
    window.addEventListener('touchmove', (e) => {
      if (game.state !== 'playing' || !game.hud || !game.hud.activeBuild) return;
      const t = e.touches[0];
      const tile = input._screenToTile(t.clientX, t.clientY);
      if (tile && world.inBounds(tile.x, tile.y)) {
        renderer.hoverX = tile.x;
        renderer.hoverY = tile.y;
        renderer.hoverDef = Game.BUILDING_TYPES[game.hud.activeBuild];
        renderer.hoverValid = Game.Buildings.canPlace(world, game.hud.activeBuild, tile.x, tile.y).ok;
      }
    });

    buildConfirmYes.addEventListener('click', () => {
      if (!pendingPlacement) return;
      const { typeId, x, y } = pendingPlacement;
      clearPendingPlacement();
      buildConfirm.classList.add('hidden');
      const def = Game.BUILDING_TYPES[typeId];
      if (!economy.canAfford(def.cost)) {
        game.hud.setActiveBuild(null);
        renderer.hoverDef = null;
        return;
      }
      if (Game.Buildings.startBuild(world, typeId, x, y, economy)) {
        renderer.markStaticDirty();
      }
      game.hud.setActiveBuild(null);
      renderer.hoverDef = null;
    });

    buildConfirmNo.addEventListener('click', () => {
      clearPendingPlacement();
      buildConfirm.classList.add('hidden');
      game.hud.setActiveBuild(null);
      renderer.hoverDef = null;
    });

    input.onClickTile = (x, y) => {
      if (game.state === 'placingCastle') {
        const check = Game.Buildings.canPlace(world, 'castle', x, y);
        if (!check.ok) return;
        const castleDef = Game.BUILDING_TYPES.castle;
        const b = world.addBuilding(castleDef, x, y);
        const idx = world.buildSites.indexOf(b);
        if (idx !== -1) world.buildSites.splice(idx, 1);
        b.built = true;
        b.progress = b.buildTime; 
        b.residents = []; 
        b.storage = 0;
        b.spawnTimer = 0;

        for (let i = 0; i < 8; i++) {
          const v = vm.spawn(b.x, b.y, 'free', b.id);
          b.residents.push(v.id);
          if (i < 5) {
            if (vm.assignWarriorSlot(b, v)) {
              v.job = 'warrior';
              v.workplaceId = b.id;
              v.warriorBuildingId = b.id;
              v.state = 'working';
              v.hidden = true;
            }
          }
        }

        if (b.maxWarriors > 0) world.warriorBuildings.push(b);
        if (b.def.isStorage || b.def.id === 'castle') world.dropoffBuildings.push(b);
        if (b.def.isHouse) world.houses.push(b);
        if (b.def.beerSlots && b.def.beerSlots > 0) world.beerBuildings.push(b);

        renderer.markStaticDirty();
        game.state = 'playing';
        placeHint.classList.add('hidden');
        canvas.classList.remove('placing');
        document.getElementById('buildButton').classList.remove('hidden');
        return;
      }

      if (game.state !== 'playing') return;

      if (game.hud && game.hud.activeBuild) {
        const typeId = game.hud.activeBuild;
        const def = Game.BUILDING_TYPES[typeId];

        if (pendingPlacement && pendingPlacement.typeId === typeId) {
          if (pendingPlacement.x === x && pendingPlacement.y === y) {
            const check = Game.Buildings.canPlace(world, typeId, x, y);
            if (!check.ok) {
              clearPendingPlacement();
              game.hud.setActiveBuild(null);
              renderer.hoverDef = null;
              return;
            }
            buildConfirmTitle.textContent = `${def.name} bauen?`;
            let costParts = [];
            for (const res in def.cost) costParts.push(`${def.cost[res]} ${resourceNames[res] || res}`);
            buildConfirmCost.textContent = costParts.length > 0 ? `Kosten: ${costParts.join(', ')}` : 'Keine Kosten';
            buildConfirm.classList.remove('hidden');
            return;
          }
        }

        const check = Game.Buildings.canPlace(world, typeId, x, y);
        if (!check.ok) {
          clearPendingPlacement();
          renderer.hoverDef = Game.BUILDING_TYPES[typeId];
          renderer.hoverX = x;
          renderer.hoverY = y;
          renderer.hoverValid = false;
          return;
        }

        pendingPlacement = { typeId, x, y };
        renderer.pendingPlacement = { def, x, y, valid: true };
        renderer.hoverDef = null;
        renderer.hoverX = -1;
        renderer.hoverY = -1;
        return;
      }

      let clickedBuilding = null;
      for (const b of world.buildings.values()) {
        const bw = b.w || 1;
        const bh = b.h || 1;
        if (x >= b.x && x < b.x + bw && y >= b.y && y < b.y + bh) {
          clickedBuilding = b;
          break;
        }
      }
      if (clickedBuilding) showInfoPanel(clickedBuilding);
      else hideInfoPanel();
    };

    const hud = new Game.HUD(game);
    game.world = world;
    game.renderer = renderer;
    game.input = input;
    game.ticker = ticker;
    game.economy = economy;
    game.hud = hud;
    game.vm = vm;
    game.state = 'placingCastle';

    placeHint.classList.remove('hidden');
    canvas.classList.add('placing');

    let last = performance.now();
    function loop(now) {
      const dt = now - last; 
      last = now;
      
      ticker.update(dt);
      
      if (game.vm) {
        for (const v of game.vm.villagers.values()) {
          if (v.state === 'moving') {
            if (v.moveDuration > 0) {
              let t = (now - v.moveStartTime) / v.moveDuration;
              if (t > 1) t = 1;
              v.renderX = v.moveStartX + (v.targetX - v.moveStartX) * t;
              v.renderY = v.moveStartY + (v.targetY - v.moveStartY) * t;
            }
          } else {
            v.renderX = v.x;
            v.renderY = v.y;
          }
        }
      }
      
      renderer.render(dt, now);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }
});
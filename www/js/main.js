window.Game = window.Game || {};

const audioManager = new Game.AudioManager();

function preloadAssets() {
  const imagesToLoad = [
    'images/gras.webp', 'images/holz.webp', 'images/stein.webp', 'images/wasser.webp',
    'images/haus-rot.webp', 'images/holzfaeller-rot.webp', 'images/steinmetz-rot.webp',
    'images/bauer-rot.webp', 'images/fischerhuette-rot.webp', 'images/lager-rot.webp',
    'images/wachturm-rot.webp', 'images/schloss.webp',
    'images/brunnen-rot.webp', 'images/bierbrauerei-rot.webp', 'images/saegewerk-rot.webp',
    'images/muehle-rot1.webp', 'images/muehle-rot2.webp', 'images/muehle-rot3.webp',
    'images/baecker-rot.webp',
    'images/villager-idle-rot.webp', 'images/villager-baumeister-rot.webp',
    'images/villager-holzfaeller-rot.webp', 'images/villager-steinmetz-rot.webp',
    'images/villager-bauer-rot.webp', 'images/villager-angler-rot.webp',
    'images/villager-krieger-rot.webp',
    'images/icon_baum.webp', 'images/icon_stein.webp', 'images/icon_getreide.webp', 'images/icon_fisch.webp',
    'images/grenze-rot.webp',
    'images/zombie.webp',
    'images/ghost.webp',
    'images/baecker.webp', 'images/saeger.webp', 'images/mueller.webp', 'images/brauer.webp',
    'images/wachstube.webp', 'images/wachposten.webp'
  ];
  imagesToLoad.forEach(path => Game.Assets.loadImage(path));

  audioManager.preloadFromBuildingTypes();
  audioManager.preload('audio/zombie.mp3');
  audioManager.preload('audio/schrei.mp3');
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

  const game = { state: 'menu', world: null, renderer: null, input: null, ticker: null, economy: null, hud: null, vm: null, zombieManager: null, gravestones: [], stats: null, breadManager: null, paused: false, zombieInfects: true };
  Game.state = game;

  startBtn.addEventListener('click', () => {
    const distribution = getTerrainDistribution();
    const sum = distribution.grass + distribution.forest + distribution.mountain + distribution.water;
    if (sum !== 100) return;

    const size = parseInt(document.getElementById('mapSize').value, 10);
    const seedStr = document.getElementById('seed').value.trim();
    const seed = seedStr ? hashString(seedStr) : (Math.random() * 0xffffffff) >>> 0;
    
    const zombieInfectsCheckbox = document.getElementById('zombieInfects');
    game.zombieInfects = zombieInfectsCheckbox ? zombieInfectsCheckbox.checked : true;

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

    const breadManager = new Game.BreadManager();
    vm.breadManager = breadManager;

    const terrainImages = [
      'images/gras.webp',
      'images/holz.webp',
      'images/stein.webp',
      'images/wasser.webp',
      'images/grenze-rot.webp'
    ];
    Promise.all(terrainImages.map(p => Game.Assets.loadImage(p)))
      .then(() => {
        renderer.markStaticDirty();
      });
    
    const zombieManager = new Game.ZombieManager(world, ticker, vm);
    zombieManager.onZombieKilled = (z) => {
      renderer.spawnHarvestParticles(Math.floor(z.x), Math.floor(z.y), 'stone');
      audioManager.playOneShot('audio/zombie.mp3');
    };
    vm.zombieManager = zombieManager;
    renderer.zombieManager = zombieManager;
    
    vm.onHarvest = (x, y, type) => renderer.spawnHarvestParticles(x, y, type);

    vm.onDeath = (v) => {
      game.gravestones.push({
        x: v.renderX !== undefined ? v.renderX : v.x,
        y: v.renderY !== undefined ? v.renderY : v.y,
        expiresAt: performance.now() + 60000
      });
      audioManager.playOneShot('audio/schrei.mp3');
    };

    renderer.gravestones = game.gravestones;

    renderer.camera.x = (width * renderer.tileSize) / 2 - (window.innerWidth / renderer.camera.zoom) / 2;
    renderer.camera.y = (height * renderer.tileSize) / 2 - (window.innerHeight / renderer.camera.zoom) / 2;
    renderer.clampCamera();

    let selectedBuilding = null;
    let lastPanelHash = '';
    let lastPanelRefreshTick = 0;

    function hideInfoPanel() {
      infoPanel.classList.add('hidden');
      selectedBuilding = null;
      lastPanelHash = '';
      renderer.selectedBuildingId = null;
    }

    function showInfoPanel(b) {
      selectedBuilding = b;
      renderer.selectedBuildingId = b.id;
      infoIcon.src = b.def.asset || '';
      infoTitle.textContent = b.def.name;
      lastPanelHash = Game.UI.computePanelHash(b, vm, economy);
      infoContent.innerHTML = Game.UI.buildPanelHtml(b, vm, economy);
      infoPanel.classList.remove('hidden');
      bindPauseButton(b);
    }

    function bindPauseButton(b) {
      const pauseBtn = document.getElementById('pauseToggleBtn');
      if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
          b.paused = !b.paused;
          lastPanelHash = Game.UI.computePanelHash(b, vm, economy);
          infoContent.innerHTML = Game.UI.buildPanelHtml(b, vm, economy);
          bindPauseButton(b);
        });
      }
    }

    function refreshInfoPanel() {
      if (!selectedBuilding) return;
      const newHash = Game.UI.computePanelHash(selectedBuilding, vm, economy);
      if (newHash === lastPanelHash) return;
      lastPanelHash = newHash;
      infoContent.innerHTML = Game.UI.buildPanelHtml(selectedBuilding, vm, economy);
      bindPauseButton(selectedBuilding);
    }

    function refreshInfoPanelThrottled(tick) {
      if (!selectedBuilding) return;
      refreshInfoPanel();
    }

    infoClose.addEventListener('click', hideInfoPanel);

    const uiCallbacks = {
      canvas, placeHint, buildConfirm, buildConfirmTitle, buildConfirmCost,
      buildConfirmYes, buildConfirmNo, infoPanel, infoIcon, infoTitle, infoContent, infoClose,
      showInfoPanel, hideInfoPanel
    };

    const hud = new Game.HUD(game);
    game.world = world;
    game.renderer = renderer;
    game.ticker = ticker;
    game.economy = economy;
    game.hud = hud;
    game.vm = vm;
    game.zombieManager = zombieManager;
    game.breadManager = breadManager;

    const stats = new Game.Statistics(economy);
    game.stats = stats;
    world._stats = stats;  // NEU: Für Logistik-Priorisierung
    
    ticker.onTick(() => {
      stats.tick();
      const statsBody = document.getElementById('statsBody');
      const statsWindow = document.getElementById('statsWindow');
      if (statsBody && statsWindow && !statsWindow.classList.contains('hidden')) {
        stats.render(statsBody);
      }
    });

    Game.GameLoop(world, ticker, vm, economy, renderer, { refreshInfoPanel, refreshInfoPanelThrottled });

    const interactions = Game.Interactions(game, world, renderer, vm, economy, uiCallbacks);
    const input = interactions.initInput();
    game.input = input;

    game.state = 'placingCastle';
    placeHint.classList.remove('hidden');
    canvas.classList.add('placing');

    // Hungersnot-Warnung
    const hungerWarning = document.getElementById('hungerWarning');
    const hungerDetail = document.getElementById('hungerDetail');
    const hungerWarningOk = document.getElementById('hungerWarningOk');
    let lastHungerCheck = performance.now();

    if (hungerWarningOk) {
      hungerWarningOk.addEventListener('click', () => {
        hungerWarning.classList.add('hidden');
      });
    }

    function checkHungerWarning(now) {
      if (now - lastHungerCheck < 300000) return;
      lastHungerCheck = now;
      if (stats.history.length < 60) return;

      const totals = stats.getResourceTotals('bread', 300);
      if (totals.diff < 0) {
        const prod = Math.floor(totals.produced);
        const cons = Math.floor(totals.consumed);
        const def = totals.diff;
        hungerDetail.textContent = `Produktion: ${prod} · Verbrauch: ${cons} · Defizit: ${def}`;
        hungerWarning.classList.remove('hidden');
      }
    }

    // === Jobs-Fenster ===
    const jobsWindow = document.getElementById('jobsWindow');
    const jobsWindowClose = document.getElementById('jobsWindowClose');
    const jobsBody = document.getElementById('jobsBody');
    const jobsFreeVillagers = document.getElementById('freeVillagerCount');
    const jobsButton = document.getElementById('jobsButton');
    const reservedLogisticsCountEl = document.getElementById('reservedLogisticsCount');
    const reservedLogisticsPlusBtn = document.getElementById('reservedLogisticsPlus');
    const reservedLogisticsMinusBtn = document.getElementById('reservedLogisticsMinus');

    let reservedLogistics = 0;

    const jobDefinitions = [
      { key: 'lumberjack', name: 'Holzfäller', icon: '🌲' },
      { key: 'quarry', name: 'Steinmetz', icon: '🪨' },
      { key: 'farm', name: 'Bauer', icon: '🌾' },
      { key: 'fisher', name: 'Fischer', icon: '🐟' },
      { key: 'sawmill', name: 'Sägewerker', icon: '🪚' },
      { key: 'mill', name: 'Müller', icon: '🌬️' },
      { key: 'brewery', name: 'Brauer', icon: '🍺' },
      { key: 'bakery', name: 'Bäcker', icon: '🥖' },
      { key: 'well', name: 'Brunnenwärter', icon: '💧' },
      { key: 'warrior', name: 'Krieger', icon: '⚔️' }
    ];

    function getFreeVillagers() {
      const result = [];
      for (const v of vm.villagers.values()) {
        if (v.job === 'free' && v.state === 'idle' && !v.reservedLogistics) {
          result.push(v);
        }
      }
      return result;
    }

    function countFreeVillagers() {
      return getFreeVillagers().length;
    }

    function countJobOccupied(jobKey) {
      let count = 0;
      for (const b of world.buildings.values()) {
        if (!b.built) continue;
        if (jobKey === 'warrior') {
          if (b.warriorSlots) {
            for (const wid of b.warriorSlots) {
              if (wid !== null) count++;
            }
          }
        } else {
          if (b.def.id === jobKey && b.workerId !== null) {
            count++;
          }
        }
      }
      return count;
    }

    function countJobTotal(jobKey) {
      let total = 0;
      for (const b of world.buildings.values()) {
        if (!b.built) continue;
        if (jobKey === 'warrior') {
          if (b.warriorSlots) total += b.warriorSlots.length;
        } else {
          if (b.def.id === jobKey) {
            if (b.def.produces) {
              if (b.fields.length > 0) total += 1;
            } else {
              total += 1;
            }
          }
        }
      }
      return total;
    }

    function updateReservedLogisticsDisplay() {
      if (reservedLogisticsCountEl) {
        reservedLogisticsCountEl.textContent = reservedLogistics;
      }
    }

    function renderJobsWindow() {
      if (!jobsBody) return;

      const free = countFreeVillagers();
      if (jobsFreeVillagers) {
        jobsFreeVillagers.textContent = free;
      }
      updateReservedLogisticsDisplay();

      let html = '';

      for (const job of jobDefinitions) {
        const occupied = countJobOccupied(job.key);
        const total = countJobTotal(job.key);

        html += `
          <div class="stats-row" style="margin-bottom:8px;">
            <div class="stats-header-cell">
              <div class="stats-icon">${job.icon}</div>
              <div class="stats-name">${job.name}</div>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr 60px 60px; gap:8px; align-items:center; margin-top:8px;">
              <div class="stats-data-item">
                <div class="stats-label">Besetzt</div>
                <div class="stats-value">${occupied}</div>
              </div>
              <div class="stats-data-item">
                <div class="stats-label">Gesamt</div>
                <div class="stats-value">${total}</div>
              </div>
              <button class="jobMinusBtn" data-job="${job.key}" style="background:#6e3b3b; color:#fff; border:none; border-radius:6px; padding:8px; font-size:20px; font-weight:700; cursor:pointer;" ${occupied === 0 ? 'disabled' : ''}>−</button>
              <button class="jobPlusBtn" data-job="${job.key}" style="background:#3b6e3b; color:#fff; border:none; border-radius:6px; padding:8px; font-size:20px; font-weight:700; cursor:pointer;" ${(free === 0 || occupied >= total) ? 'disabled' : ''}>+</button>
            </div>
          </div>
        `;
      }

      jobsBody.innerHTML = html;

      jobsBody.querySelectorAll('.jobMinusBtn').forEach(btn => {
        btn.addEventListener('click', () => {
          fireFromJob(btn.dataset.job);
          renderJobsWindow();
        });
      });

      jobsBody.querySelectorAll('.jobPlusBtn').forEach(btn => {
        btn.addEventListener('click', () => {
          assignToJob(btn.dataset.job);
          renderJobsWindow();
        });
      });
    }

    function fireFromJob(jobKey) {
      for (const b of world.buildings.values()) {
        if (!b.built) continue;
        if (jobKey === 'warrior') {
          if (b.warriorSlots) {
            for (let i = 0; i < b.warriorSlots.length; i++) {
              const wid = b.warriorSlots[i];
              if (wid !== null) {
                const v = vm.villagers.get(wid);
                if (v) {
                  b.warriorSlots[i] = null;
                  v.job = 'free';
                  v.state = 'idle';
                  v.workplaceId = null;
                  v.warriorBuildingId = null;
                  v.warriorSlotIndex = -1;
                  v.task = null;
                  v.hidden = true;
                  vm._idleVillagers.add(v.id);
                }
                return;
              }
            }
          }
        } else {
          if (b.def.id === jobKey && b.workerId !== null) {
            const v = vm.villagers.get(b.workerId);
            if (v) {
              b.workerId = null;
              v.job = 'free';
              v.state = 'idle';
              v.workplaceId = null;
              v.task = null;
              v.hidden = true;
              vm._idleVillagers.add(v.id);
              if (!world.freeJobs.has(b)) {
                if (!b.def.produces || b.fields.length > 0) {
                  world.freeJobs.add(b);
                }
              }
            }
            return;
          }
        }
      }
    }

    function assignToJob(jobKey) {
      const freeVillagers = getFreeVillagers();
      if (freeVillagers.length === 0) return;
      const v = freeVillagers[0];

      if (jobKey === 'warrior') {
        for (const b of world.buildings.values()) {
          if (!b.built) continue;
          if (!b.warriorSlots) continue;
          for (let i = 0; i < b.warriorSlots.length; i++) {
            if (b.warriorSlots[i] === null) {
              b.warriorSlots[i] = v.id;
              v.warriorSlotIndex = i;
              v.job = 'warrior';
              v.state = 'working';
              v.workplaceId = b.id;
              v.warriorBuildingId = b.id;
              v.hidden = true;
              vm._idleVillagers.delete(v.id);
              return;
            }
          }
        }
      } else {
        for (const b of world.buildings.values()) {
          if (!b.built) continue;
          if (b.def.id !== jobKey) continue;
          if (b.workerId !== null) continue;
          if (b.def.produces && b.fields.length === 0) continue;

          b.workerId = v.id;
          v.job = 'worker';
          v.state = 'idle';
          v.workplaceId = b.id;
          v.task = 'go_to_work';
          v.hidden = false;
          v.x = b.x;
          v.y = b.y + (b.h || 1) - 1;
          v.renderX = v.x;
          v.renderY = v.y;
          vm._idleVillagers.delete(v.id);
          world.freeJobs.delete(b);
          vm.startMove(v, b.x, b.y + (b.h || 1) - 1);
          return;
        }
      }
    }

    if (reservedLogisticsPlusBtn) {
      reservedLogisticsPlusBtn.addEventListener('click', () => {
        for (const v of vm.villagers.values()) {
          if (v.job === 'free' && v.state === 'idle' && !v.reservedLogistics) {
            v.reservedLogistics = true;
            reservedLogistics++;
            break;
          }
        }
        renderJobsWindow();
      });
    }

    if (reservedLogisticsMinusBtn) {
      reservedLogisticsMinusBtn.addEventListener('click', () => {
        if (reservedLogistics > 0) {
          for (const v of vm.villagers.values()) {
            if (v.reservedLogistics) {
              v.reservedLogistics = false;
              reservedLogistics--;
              break;
            }
          }
        }
        renderJobsWindow();
      });
    }

    function openJobsWindow() {
      if (!jobsWindow) return;
      game.paused = true;
      jobsWindow.classList.remove('hidden');
      renderJobsWindow();
    }

    function closeJobsWindow() {
      if (!jobsWindow) return;
      game.paused = false;
      jobsWindow.classList.add('hidden');
    }

    if (jobsButton) {
      jobsButton.addEventListener('click', () => openJobsWindow());
    }
    if (jobsWindowClose) {
      jobsWindowClose.addEventListener('click', () => closeJobsWindow());
    }
    if (jobsWindow) {
      jobsWindow.addEventListener('click', (e) => {
        if (e.target === jobsWindow) closeJobsWindow();
      });
    }

    // === Zombie-Logik ===
    const soundHoldTimers = new Map();
        function updateZombiesFrame(dt) {
      if (!zombieManager) return;
      const dtSec = dt / 1000;
      
      const allVillagers = vm.getAllVillagers();
      const warriors = [];
      for (const v of allVillagers) {
        if (v.job === 'warrior') warriors.push(v);
      }

      const zombiesOnTerritory = [];
      for (const z of zombieManager.zombies) {
        if (z.state === 'dead') continue;
        if (world.isInTerritory(z.x, z.y)) zombiesOnTerritory.push(z);
      }
      
      for (const z of zombieManager.zombies) {
        if (z.state === 'dead') continue;
        
        let nearestVillager = null;
        let nearestDistSq = zombieManager.detectRadius * zombieManager.detectRadius;
        
        const nearby = vm.getNearbyVillagers(z.x, z.y);
        for (const v of nearby) {
          if (v.job === 'warrior') continue;
          if (v.hidden) continue;
          const ddx = v.renderX - z.x;
          const ddy = v.renderY - z.y;
          const distSq = ddx * ddx + ddy * ddy;
          if (distSq < nearestDistSq) {
            nearestDistSq = distSq;
            nearestVillager = v;
          }
        }
        
        let targetX, targetY;
        if (nearestVillager) {
          targetX = nearestVillager.renderX;
          targetY = nearestVillager.renderY;
        } else {
          const cc = zombieManager.getCastleCenter();
          if (cc) {
            targetX = cc.x;
            targetY = cc.y;
          } else {
            continue;
          }
        }
        
        const moveDx = targetX - z.x;
        const moveDy = targetY - z.y;
        const moveDist = Math.sqrt(moveDx * moveDx + moveDy * moveDy);
        if (moveDist > 0.001) {
          const step = Math.min(zombieManager.speed * dtSec, moveDist);
          const newX = z.x + (moveDx / moveDist) * step;
          const newY = z.y + (moveDy / moveDist) * step;
          
          let blocked = false;
          
          for (const other of zombieManager.zombies) {
            if (other === z || other.state === 'dead') continue;
            if (other.id > z.id) continue;
            const ox = newX - other.x;
            const oy = newY - other.y;
            if (ox * ox + oy * oy < 0.64) {
              blocked = true;
              break;
            }
          }
          
          if (!blocked) {
            for (const w of warriors) {
              if (w.hidden) continue;
              if (w.id > z.id) continue;
              const ox = newX - w.x;
              const oy = newY - w.y;
              if (ox * ox + oy * oy < 0.64) {
                blocked = true;
                break;
              }
            }
          }
          
          if (!blocked) {
            z.x = newX;
            z.y = newY;
          }
        }
        
        const nearbyForCollision = vm.getNearbyVillagers(z.x, z.y);
        for (const v of nearbyForCollision) {
          if (v.job === 'warrior') continue;
          if (v.hidden) continue;
          if (!vm.villagers.has(v.id)) continue;
          
          const vdx = v.renderX - z.x;
          const vdy = v.renderY - z.y;
          if (vdx * vdx + vdy * vdy > 25) continue;
          
          if (Math.abs(vdx) <= 0.8 && Math.abs(vdy) <= 0.8) {
            const infectX = v.renderX;
            const infectY = v.renderY;
            vm.killVillager(v);
            if (game.zombieInfects) {
              zombieManager.spawnZombieAt(infectX, infectY);
            }
            break;
          }
        }
        
        z.renderX = z.x;
        z.renderY = z.y;
        
        const zTileX = Math.floor(z.renderX);
        const zTileY = Math.floor(z.renderY);
        const zFeetTerrain = world.getTerrainId(zTileX, zTileY);
        const zIsInWater = zFeetTerrain === 'water';
        const zPrevDepth = z.waterDepth || 0;
        let zNewDepth = zPrevDepth;
        if (zIsInWater) {
          const zSpeed = 3.0 * (dt / 1000);
          if (zPrevDepth < 1.0) zNewDepth = Math.min(1.0, zPrevDepth + zSpeed);
        } else {
          zNewDepth = 0;
        }
        z.waterDepth = zNewDepth;
      }
      
      for (const v of warriors) {
        if (!vm.villagers.has(v.id)) continue;

        if (v.state === 'working') {
          const myBuilding = v.warriorBuildingId ? world.buildings.get(v.warriorBuildingId) : null;
          if (!myBuilding) {
            v.state = 'idle';
            v.workerId = null;
            continue;
          }

          if (myBuilding._attackRadiusSq === undefined) {
            const r = myBuilding.def.attackRadius || 10;
            myBuilding._attackRadiusSq = r * r;
          }

          const bCenterX = myBuilding.x + (myBuilding.w || 1) / 2;
          const bCenterY = myBuilding.y + (myBuilding.h || 1) / 2;

          let zombieInRange = false;
          for (const z of zombiesOnTerritory) {
            if (z.state === 'dead') continue;
            const dx = z.x - bCenterX;
            const dy = z.y - bCenterY;
            if (dx * dx + dy * dy <= myBuilding._attackRadiusSq) {
              zombieInRange = true;
              break;
            }
          }

          if (!zombieInRange) {
            v.hidden = true;
            continue;
          }

          v.hidden = false;
          v.x = bCenterX;
          v.y = bCenterY;
          v.renderX = bCenterX;
          v.renderY = bCenterY;
          v.state = 'fighting';
          v.asset = 'images/villager-krieger-rot.webp';
        }

        if (v.state === 'returning_to_post') {
          if (zombiesOnTerritory.length > 0) {
            v.state = 'fighting';
          } else {
            const post = v.warriorBuildingId ? world.buildings.get(v.warriorBuildingId) : null;
            if (!post) {
              v.state = 'idle';
              v.workerId = null;
              v.hidden = true;
              continue;
            }
            
            const postX = post.x + Math.floor((post.w || 1) / 2);
            const postY = post.y + Math.floor((post.h || 1) / 2);
            const rdx = postX - v.x;
            const rdy = postY - v.y;
            const rdist = Math.sqrt(rdx * rdx + rdy * rdy);
            
            if (rdist <= 0.5) {
              v.state = 'working';
              v.hidden = true;
              continue;
            }
            
            let speed = v.speed;
            if (v.beerBuff) speed = v.speed * 1.25;
            const step = Math.min(speed * dtSec, rdist);
            v.x += (rdx / rdist) * step;
            v.y += (rdy / rdist) * step;
            v.renderX = v.x;
            v.renderY = v.y;
            v.hidden = false;
            v.asset = 'images/villager-krieger-rot.webp';
            continue;
          }
        }
        
        let nearestZombie = null;
        let nearestZDistSq = Infinity;
        for (const z of zombiesOnTerritory) {
          if (z.state === 'dead') continue;
          const dx = z.x - v.x;
          const dy = z.y - v.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < nearestZDistSq) {
            nearestZDistSq = distSq;
            nearestZombie = z;
          }
        }
        
        if (!nearestZombie) {
          if (v.state === 'fighting' || v.hidden === false) {
            v.state = 'returning_to_post';
          } else if (v.state === 'working') {
            v.hidden = true;
          }
          continue;
        }
        
        const dist = Math.sqrt(nearestZDistSq);
        
        if (dist <= 1.0) {
          const winChance = v.beerBuff ? 0.9 : 0.75;
          if (Math.random() < winChance) {
            nearestZombie.state = 'dead';
            if (zombieManager.onZombieKilled) zombieManager.onZombieKilled(nearestZombie);
            v.state = 'fighting';
          } else {
            vm.killVillager(v);
          }
          continue;
        }
        
        let speed = v.speed;
        if (v.beerBuff) speed = v.speed * 1.25;
        const moveStep = Math.min(speed * dtSec, dist);
        const moveDx = (nearestZombie.x - v.x) / dist;
        const moveDy = (nearestZombie.y - v.y) / dist;
        const newX = v.x + moveDx * moveStep;
        const newY = v.y + moveDy * moveStep;
        
        let blocked = false;
        
        for (const other of warriors) {
          if (other === v) continue;
          if (other.hidden) continue;
          if (other.id > v.id) continue;
          const ox = newX - other.x;
          const oy = newY - other.y;
          if (ox * ox + oy * oy < 0.64) {
            blocked = true;
            break;
          }
        }
        
        if (!blocked) {
          for (const z of zombieManager.zombies) {
            if (z.state === 'dead') continue;
            if (z.id > v.id) continue;
            const ox = newX - z.x;
            const oy = newY - z.y;
            if (ox * ox + oy * oy < 0.64) {
              blocked = true;
              break;
            }
          }
        }
        
        if (!blocked) {
          v.x = newX;
          v.y = newY;
          v.renderX = v.x;
          v.renderY = v.y;
        }
        v.hidden = false;
        v.asset = 'images/villager-krieger-rot.webp';
        v.state = 'fighting';
      }
      
      zombieManager.zombies = zombieManager.zombies.filter(z => z.state !== 'dead');
    }

    function updateGravestones(now) {
      const active = [];
      for (const g of game.gravestones) {
        if (now < g.expiresAt) active.push(g);
      }
      game.gravestones.length = 0;
      game.gravestones.push(...active);
    }

    function updateBuildingSounds(dt) {
      const cam = renderer.camera;
      const ts = renderer.tileSize;
      const centerX = cam.x + (window.innerWidth / cam.zoom) / 2;
      const centerY = cam.y + (window.innerHeight / cam.zoom) / 2;
      const viewW = window.innerWidth / cam.zoom;
      const viewH = window.innerHeight / cam.zoom;
      const maxDist = Math.sqrt(viewW * viewW + viewH * viewH) / 2;

      const activeKeys = new Set();

      for (const b of world.buildings.values()) {
        if (!b.built) continue;
        if (!b.def.sound) continue;
        if (b.paused) continue;

        let isWorking = false;

        if (b.def.recipe) {
          isWorking = b.isActive;
        } else if (b.def.produces) {
          const worker = b.workerId !== null ? vm.villagers.get(b.workerId) : null;
          if (worker && worker.workplaceId === b.id) {
            const hasQueue = worker.harvestQueue && worker.harvestQueue.length > 0;
            const harvesting = worker.state === 'harvesting';
            isWorking = hasQueue || harvesting;
          }
        } else if (b.def.generatesResource) {
          isWorking = b.workerId !== null;
        }

        const key = b.def.id + '-' + b.id;

        let holdRemaining = soundHoldTimers.get(key) || 0;

        if (isWorking) {
          holdRemaining = 1500;
        } else if (holdRemaining > 0) {
          holdRemaining = Math.max(0, holdRemaining - dt);
        }
        soundHoldTimers.set(key, holdRemaining);

        const shouldPlay = isWorking || holdRemaining > 0;

        if (!shouldPlay) continue;

        const bx = (b.x + (b.w || 1) / 2) * ts;
        const by = (b.y + (b.h || 1) / 2) * ts;
        const dx = bx - centerX;
        const dy = by - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const t = Math.min(1, dist / maxDist);
        const volume = 1.0 - t * (1.0 - 0.10);
        const inView = dist < maxDist * 1.2;
        const muted = !inView;

        activeKeys.add(key);
        audioManager.playLoop(key, b.def.sound, volume, muted);
      }

      for (const key of Array.from(audioManager.activeLoops.keys())) {
        if (!activeKeys.has(key)) {
          audioManager.stopLoop(key);
        }
      }
    }

    let last = performance.now();
    function loop(now) {
      const dt = Math.min(now - last, 100); 
      last = now;
      
      if (!game.paused) {
        ticker.update(dt);

        if (game.breadManager && game.vm) {
          game.breadManager.tick(now, game.economy, game.vm);
        }
      }
      
      if (game.vm) {
        for (const v of game.vm.villagers.values()) {
          if (v.state === 'moving') {
            if (v.moveDuration > 0) {
              let t = (now - v.moveStartTime) / v.moveDuration;
              if (t > 1) t = 1;
              v.renderX = v.moveStartX + (v.targetX - v.moveStartX) * t;
              v.renderY = v.moveStartY + (v.targetY - v.moveStartY) * t;
            }
          }
        }
      }
      
      if (!game.paused) {
        updateZombiesFrame(dt);
      }
      updateGravestones(now);
      updateBuildingSounds(dt);
      checkHungerWarning(now);
      
      renderer.render(dt, now);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }
});
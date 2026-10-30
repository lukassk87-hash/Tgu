window.Game = window.Game || {};

// === NEU: Sichtbarer Log für die Diagnose ===
function log(msg) {
  let el = document.getElementById('debug-log');
  if (!el) {
    el = document.createElement('div');
    el.id = 'debug-log';
    el.style.cssText = 'position:fixed;top:0;left:0;right:0;background:rgba(200,0,0,0.9);color:white;font-family:monospace;font-size:11px;padding:6px;z-index:999999;max-height:50vh;overflow-y:auto;pointer-events:none;';
    document.body.appendChild(el);
  }
  el.innerHTML += msg + '<br>';
  console.log('[DEBUG]', msg);
}

log('main.js gestartet');

// Globaler Audio-Manager
let audioManager;
try {
  audioManager = new Game.AudioManager();
  log('AudioManager OK');
} catch (e) {
  log('AudioManager FEHLER: ' + e.message);
  audioManager = { preload(){}, preloadFromBuildingTypes(){}, playLoop(){}, stopLoop(){}, playOneShot(){}, stopAll(){}, setVolume(){} };
}

function preloadAssets() {
  log('preloadAssets gestartet');
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
  log('preloadAssets fertig');
}

window.addEventListener('DOMContentLoaded', () => {
  log('DOMContentLoaded gestartet');
  try {
    preloadAssets();
  } catch (e) {
    log('preloadAssets FEHLER: ' + e.message);
  }

  try {
    const canvas = document.getElementById('game');
    if (!canvas) { log('Canvas nicht gefunden!'); return; }
    log('Canvas gefunden: ' + canvas.width + 'x' + canvas.height);

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

    const game = { state: 'menu', world: null, renderer: null, input: null, ticker: null, economy: null, hud: null, vm: null, zombieManager: null, gravestones: [], stats: null };
    Game.state = game;

    startBtn.addEventListener('click', () => {
      log('Start-Button geklickt');
      try {
        const distribution = getTerrainDistribution();
        const sum = distribution.grass + distribution.forest + distribution.mountain + distribution.water;
        if (sum !== 100) return;

        const size = parseInt(document.getElementById('mapSize').value, 10);
        const seedStr = document.getElementById('seed').value.trim();
        const seed = seedStr ? hashString(seedStr) : (Math.random() * 0xffffffff) >>> 0;

        const startRes = {
          wood: Math.max(0, parseInt(document.getElementById('startWood').value, 10) || 0),
          stone: Math.max(0, parseInt(document.getElementById('startStone').value, 10) || 0),
          grain: Math.max(0, parseInt(document.getElementById('startGrain').value, 10) || 0),
          fish: Math.max(0, parseInt(document.getElementById('startFish').value, 10) || 0),
          water: Math.max(0, parseInt(document.getElementById('startWater').value, 10) || 0),
          beer: Math.max(0, parseInt(document.getElementById('startBeer').value, 10) || 0),
          woodPlank: Math.max(0, parseInt(document.getElementById('startWoodPlank').value, 10) || 0),
          flour: Math.max(0, parseInt(document.getElementById('startFlour').value, 10) || 0),
          bread: Math.max(0, parseInt(document.getElementById('startBread').value, 10) || 0)
        };

        menu.classList.add('hidden');
        log('Menü versteckt, rufe beginGame() auf');
        beginGame(size, seed, distribution, startRes);
      } catch (e) {
        log('Start-Button FEHLER: ' + e.message + ' | ' + (e.stack || '').split('\n')[1]);
      }
    });

    function hashString(s) {
      let h = 0;
      for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
      return h >>> 0;
    }

    function beginGame(size, seed, distribution, startRes) {
      log('beginGame gestartet');

      log('generateMap...');
      const map = Game.generateMap(size, size, seed, distribution);
      log('generateMap OK');

      const world = new Game.World(map.width, map.height, map.grid);
      log('World OK');

      const ticker = new Game.Ticker(1);
      
      const economy = {
        res: startRes,
        canAfford(cost) { for (const k in cost) if ((this.res[k] || 0) < cost[k]) return false; return true; },
        pay(cost) { for (const k in cost) this.res[k] -= cost[k]; },
        onChange() { if (game.hud) game.hud.updateResources(this); }
      };

      const vm = new Game.VillagerManager(world, ticker, economy);
      log('VillagerManager OK');

      log('Renderer erstellen...');
      const renderer = new Game.Renderer(canvas, world, vm);
      log('Renderer OK, Canvas: ' + canvas.width + 'x' + canvas.height);

      const terrainImages = ['images/gras.webp', 'images/holz.webp', 'images/stein.webp', 'images/wasser.webp', 'images/grenze-rot.webp'];
      Promise.all(terrainImages.map(p => Game.Assets.loadImage(p))).then(() => {
        renderer.markStaticDirty();
        log('Terrain-Bilder geladen');
      });
      
      const zombieManager = new Game.ZombieManager(world, ticker, vm);
      zombieManager.onZombieKilled = (z) => {
        renderer.spawnHarvestParticles(Math.floor(z.x), Math.floor(z.y), 'stone');
        audioManager.playOneShot('audio/zombie.mp3');
      };
      vm.zombieManager = zombieManager;
      renderer.zombieManager = zombieManager;
      log('ZombieManager OK');
      
      vm.onHarvest = (x, y, type) => renderer.spawnHarvestParticles(x, y, type);

      vm.onDeath = (v) => {
        game.gravestones.push({ x: v.renderX !== undefined ? v.renderX : v.x, y: v.renderY !== undefined ? v.renderY : v.y, expiresAt: performance.now() + 60000 });
        audioManager.playOneShot('audio/schrei.mp3');
      };

      renderer.gravestones = game.gravestones;

      renderer.camera.x = (map.width * renderer.tileSize) / 2 - (window.innerWidth / renderer.camera.zoom) / 2;
      renderer.camera.y = (map.height * renderer.tileSize) / 2 - (window.innerHeight / renderer.camera.zoom) / 2;
      renderer.clampCamera();
      log('Kamera OK');

      let selectedBuilding = null;
      let lastPanelHash = '';
      let lastPanelRefreshTick = 0;

      function hideInfoPanel() { infoPanel.classList.add('hidden'); selectedBuilding = null; lastPanelHash = ''; renderer.selectedBuildingId = null; }
      function showInfoPanel(b) {
        selectedBuilding = b; renderer.selectedBuildingId = b.id;
        infoIcon.src = b.def.asset || ''; infoTitle.textContent = b.def.name;
        lastPanelHash = Game.UI.computePanelHash(b, vm, economy);
        infoContent.innerHTML = Game.UI.buildPanelHtml(b, vm, economy);
        infoPanel.classList.remove('hidden');
      }
      function refreshInfoPanel() {
        if (!selectedBuilding) return;
        const newHash = Game.UI.computePanelHash(selectedBuilding, vm, economy);
        if (newHash === lastPanelHash) return;
        lastPanelHash = newHash;
        infoContent.innerHTML = Game.UI.buildPanelHtml(selectedBuilding, vm, economy);
      }
      function refreshInfoPanelThrottled(tick) {
        if (tick - lastPanelRefreshTick < 5) return;
        lastPanelRefreshTick = tick;
        refreshInfoPanel();
      }
      infoClose.addEventListener('click', hideInfoPanel);

      const uiCallbacks = {
        canvas, placeHint, buildConfirm, buildConfirmTitle, buildConfirmCost, buildConfirmYes, buildConfirmNo,
        infoPanel, infoIcon, infoTitle, infoContent, infoClose, showInfoPanel, hideInfoPanel
      };

      const hud = new Game.HUD(game);
      game.world = world; game.renderer = renderer; game.ticker = ticker; game.economy = economy;
      game.hud = hud; game.vm = vm; game.zombieManager = zombieManager;
      log('HUD OK');

      const stats = new Game.Statistics(economy);
      game.stats = stats;
      ticker.onTick(() => {
        stats.tick();
        const statsBody = document.getElementById('statsBody');
        const statsWindow = document.getElementById('statsWindow');
        if (statsBody && statsWindow && !statsWindow.classList.contains('hidden')) stats.render(statsBody);
      });
      log('Statistik OK');

      Game.GameLoop(world, ticker, vm, economy, renderer, { refreshInfoPanel, refreshInfoPanelThrottled });
      log('GameLoop OK');

      const interactions = Game.Interactions(game, world, renderer, vm, economy, uiCallbacks);
      const input = interactions.initInput();
      game.input = input;
      log('Interactions OK');

      game.state = 'placingCastle';
      placeHint.classList.remove('hidden');
      canvas.classList.add('placing');

      log('updateZombiesFrame wird vorbereitet...');

      function updateZombiesFrame(dt) {
        if (!zombieManager) return;
        const dtSec = dt / 1000;
        const allVillagers = vm.getAllVillagers();
        const warriors = [];
        for (const v of allVillagers) if (v.job === 'warrior') warriors.push(v);
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
            if (distSq < nearestDistSq) { nearestDistSq = distSq; nearestVillager = v; }
          }
          let targetX, targetY;
          if (nearestVillager) { targetX = nearestVillager.renderX; targetY = nearestVillager.renderY; }
          else {
            const cc = zombieManager.getCastleCenter();
            if (cc) { targetX = cc.x; targetY = cc.y; } else continue;
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
              if (ox * ox + oy * oy < 0.64) { blocked = true; break; }
            }
            if (!blocked) {
              for (const w of warriors) {
                if (w.hidden) continue;
                if (w.id > z.id) continue;
                const ox = newX - w.x;
                const oy = newY - w.y;
                if (ox * ox + oy * oy < 0.64) { blocked = true; break; }
              }
            }
            if (!blocked) { z.x = newX; z.y = newY; }
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
              zombieManager.spawnZombieAt(infectX, infectY);
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
          } else { zNewDepth = 0; }
          z.waterDepth = zNewDepth;
        }
        for (const v of warriors) {
          if (!vm.villagers.has(v.id)) continue;
          if (v.state === 'returning_to_post') {
            if (zombiesOnTerritory.length > 0) { v.state = 'fighting'; }
            else {
              const post = v.warriorBuildingId ? world.buildings.get(v.warriorBuildingId) : null;
              if (!post) { v.state = 'working'; v.hidden = true; continue; }
              const postX = post.x + Math.floor((post.w || 1) / 2);
              const postY = post.y + Math.floor((post.h || 1) / 2);
              const rdx = postX - v.x;
              const rdy = postY - v.y;
              const rdist = Math.sqrt(rdx * rdx + rdy * rdy);
              if (rdist <= 0.5) { v.state = 'working'; v.hidden = true; continue; }
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
            if (distSq < nearestZDistSq) { nearestZDistSq = distSq; nearestZombie = z; }
          }
          if (!nearestZombie) {
            if (v.state === 'fighting' || v.hidden === false) v.state = 'returning_to_post';
            else if (v.state === 'working') v.hidden = true;
            continue;
          }
          const dist = Math.sqrt(nearestZDistSq);
          if (dist <= 1.0) {
            const winChance = v.beerBuff ? 0.9 : 0.75;
            if (Math.random() < winChance) {
              nearestZombie.state = 'dead';
              if (zombieManager.onZombieKilled) zombieManager.onZombieKilled(nearestZombie);
              v.state = 'fighting';
            } else { vm.killVillager(v); }
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
            if (ox * ox + oy * oy < 0.64) { blocked = true; break; }
          }
          if (!blocked) {
            for (const z of zombieManager.zombies) {
              if (z.state === 'dead') continue;
              if (z.id > v.id) continue;
              const ox = newX - z.x;
              const oy = newY - z.y;
              if (ox * ox + oy * oy < 0.64) { blocked = true; break; }
            }
          }
          if (!blocked) { v.x = newX; v.y = newY; v.renderX = v.x; v.renderY = v.y; }
          v.hidden = false;
          v.asset = 'images/villager-krieger-rot.webp';
          v.state = 'fighting';
        }
        zombieManager.zombies = zombieManager.zombies.filter(z => z.state !== 'dead');
      }

      function updateGravestones(now) {
        const active = [];
        for (const g of game.gravestones) if (now < g.expiresAt) active.push(g);
        game.gravestones.length = 0;
        game.gravestones.push(...active);
      }

      const soundHoldTimers = new Map();
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
          let isWorking = false;
          if (b.def.recipe) { isWorking = b.isActive; }
          else if (b.def.produces) {
            const worker = b.workerId !== null ? vm.villagers.get(b.workerId) : null;
            if (worker && worker.workplaceId === b.id) {
              const hasQueue = worker.harvestQueue && worker.harvestQueue.length > 0;
              const harvesting = worker.state === 'harvesting';
              isWorking = hasQueue || harvesting;
            }
          } else if (b.def.generatesResource) { isWorking = b.workerId !== null; }
          const key = b.def.id + '-' + b.id;
          let holdRemaining = soundHoldTimers.get(key) || 0;
          if (isWorking) holdRemaining = 1500;
          else if (holdRemaining > 0) holdRemaining = Math.max(0, holdRemaining - dt);
          soundHoldTimers.set(key, holdRemaining);
          if (!(isWorking || holdRemaining > 0)) continue;
          const bx = (b.x + (b.w || 1) / 2) * ts;
          const by = (b.y + (b.h || 1) / 2) * ts;
          const dx = bx - centerX;
          const dy = by - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const t = Math.min(1, dist / maxDist);
          const volume = 1.0 - t * (1.0 - 0.10);
          const muted = !(dist < maxDist * 1.2);
          activeKeys.add(key);
          audioManager.playLoop(key, b.def.sound, volume, muted);
        }
        for (const key of Array.from(audioManager.activeLoops.keys())) {
          if (!activeKeys.has(key)) audioManager.stopLoop(key);
        }
      }

      log('Starte Render-Loop...');
      let last = performance.now();
      let frameCount = 0;
      function loop(now) {
        try {
          const dt = Math.min(now - last, 100);
          last = now;
          ticker.update(dt);
          if (game.vm) {
            for (const v of game.vm.villagers.values()) {
              if (v.state === 'moving' && v.moveDuration > 0) {
                let t = (now - v.moveStartTime) / v.moveDuration;
                if (t > 1) t = 1;
                v.renderX = v.moveStartX + (v.targetX - v.moveStartX) * t;
                v.renderY = v.moveStartY + (v.targetY - v.moveStartY) * t;
              }
            }
          }
          updateZombiesFrame(dt);
          updateGravestones(now);
          updateBuildingSounds(dt);
          renderer.render(dt, now);
          frameCount++;
          if (frameCount === 1) log('Erster Frame gerendert!');
          if (frameCount === 10) log('10 Frames OK');
        } catch (e) {
          log('LOOP FEHLER: ' + e.message);
          log((e.stack || '').split('\n').slice(0,3).join(' / '));
        }
        requestAnimationFrame(loop);
      }
      requestAnimationFrame(loop);
    }
  } catch (e) {
    log('GLOBALER FEHLER: ' + e.message);
    log((e.stack || '').split('\n').slice(0,3).join(' / '));
  }
});
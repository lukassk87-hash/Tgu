window.Game = window.Game || {};

const audioManager = new Game.AudioManager();

function preloadAssets() {
  const imagesToLoad = [
    'images/gras.webp', 'images/wasser.webp',
    'images/haus-rot.webp', 'images/holzfaeller-rot.webp', 'images/steinmetz-rot.webp',
    'images/bauer-rot.webp', 'images/fischerhuette-rot.webp', 'images/lager-rot.webp',
    'images/wachturm-rot.webp', 'images/schloss.webp',
    'images/brunnen-rot.webp', 'images/bierbrauerei-rot.webp', 'images/saegewerk-rot.webp',
    'images/muehle-rot1.webp', 'images/muehle-rot2.webp', 'images/muehle-rot3.webp',
    'images/baecker-rot.webp',
    'images/baecker1-rot.webp', 'images/baecker2-rot.webp', 'images/baecker3-rot.webp',
    'images/forsthaus.webp',
    'images/villager-idle-rot.webp', 'images/villager-baumeister-rot.webp',
    'images/villager-holzfaeller-rot.webp', 'images/villager-steinmetz-rot.webp',
    'images/villager-bauer-rot.webp', 'images/villager-angler-rot.webp',
    'images/villager-krieger-rot.webp',
    'images/foerster.webp',
    'images/icon_baum.webp', 'images/icon_stein.webp', 'images/icon_getreide.webp', 'images/icon_fisch.webp',
    'images/icon_wasser.webp', 'images/icon_bier.webp', 'images/icon_bretter.webp', 'images/icon_mehl.webp',
    'images/icon_brot.webp', 'images/icon_pfeil.webp', 'images/icon_futter.webp', 'images/icon_schwein.webp',
    'images/icon_fleisch.webp',
    'images/drachenknochen.webp',
    'images/grenze-rot.webp',
    'images/zombie.webp',
    'images/ghost.webp',
    'images/baecker.webp', 'images/saeger.webp', 'images/mueller.webp', 'images/brauer.webp',
    'images/wachstube.webp', 'images/wachposten.webp',
    'images/schloss2.webp', 'images/wachturm-blau.webp',
    'images/villager-krieger-blau.webp',
    'images/grenze-blau.webp',
    'images/flamme.webp',
    'images/explosion.webp',
    'images/pfeilschmiede.webp',
    'images/bogenschussanlage.webp',
    'images/pfeilbauer.webp',
    'images/bogenschuetze.webp',
    'images/futterhersteller.webp',
    'images/schweinehof.webp',
    'images/schweinehof1.webp',
    'images/schweinehof2.webp',
    'images/schweinehof3.webp',
    'images/schweinehof4.webp',
    'images/schlachthof.webp',
    'images/fuetterer.webp',
    'images/schweinebauer.webp',
    'images/schlachter.webp',
    'images/drache.webp',
    'images/drache2.webp',
    'images/dracheko.webp',
    'images/drache-tot.webp',
    'images/schwein-krank.webp',
    'images/ratte.webp',
    'images/sonne.webp',
    'images/feuerwehr.webp',
    'images/feuerwehrmann.webp',
    'images/ruine-quadrat.webp',
    'images/ruine-quer.webp',
    'images/ruine-hoch.webp',
    'images/ruine-schwein.webp',
    'images/schlossk1.webp',
    'images/schlossk2.webp',
    'images/schlossk3.webp',
    'images/lanze-drache.webp',
    'images/wachturm-drache.webp',
    'images/festung-drache.webp',
    'images/apotheke.webp',
    'images/apotheker.webp',
    'images/arztpraxis.webp',
    'images/arzt.webp',
    'images/krank.webp',
    'images/icon_raeuberkraut.webp',
    'images/icon_antibiotika.webp'
  ];
  imagesToLoad.forEach(path => Game.Assets.loadImage(path));

  if (Game.DECORATIONS) {
    for (const key in Game.DECORATIONS) {
      Game.Assets.loadImage(Game.DECORATIONS[key].asset);
    }
  }

  audioManager.preloadFromBuildingTypes();
  
  audioManager.preload('audio/axt.mp3');
  audioManager.preload('audio/steinmetz.mp3');
  audioManager.preload('audio/fischerhuette.mp3');
  audioManager.preload('audio/bauernhof.mp3');
  audioManager.preload('audio/saegen.mp3');
  audioManager.preload('audio/windrad.mp3');
  audioManager.preload('audio/bierbrauerei.mp3');
  audioManager.preload('audio/schwein.mp3');
  audioManager.preload('audio/zombie.mp3');
  audioManager.preload('audio/schrei.mp3');
  audioManager.preload('audio/drache.mp3');
  audioManager.preload('audio/explosion.mp3');
}

window.addEventListener('DOMContentLoaded', () => {
  preloadAssets();

  const canvas = document.getElementById('game');
  const menu = document.getElementById('menu');
  const placeHint = document.getElementById('placeHint');
  const startBtn = document.getElementById('startBtn');
  const loadBtn = document.getElementById('loadBtn');
  
  const loadingOverlay = document.getElementById('loadingOverlay');
  const loadingTitle = document.getElementById('loadingTitle');

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

  const raiderPopup = document.getElementById('raiderPopup');
  const raiderPopupGoto = document.getElementById('raiderPopupGoto');
  const raiderPopupClose = document.getElementById('raiderPopupClose');

  const dragonPopup = document.getElementById('dragonPopup');
  const dragonPopupInfo = document.getElementById('dragonPopupInfo');
  const dragonPopupGoto = document.getElementById('dragonPopupGoto');
  const dragonPopupClose = document.getElementById('dragonPopupClose');

  const dragonPackPopup = document.getElementById('dragonPackPopup');
  const dragonPackGoto = document.getElementById('dragonPackGoto');
  const dragonPackClose = document.getElementById('dragonPackClose');

  const pigPlaguePopup = document.getElementById('pigPlaguePopup');
  const pigPlagueOk = document.getElementById('pigPlagueOk');

  const ratPlaguePopup = document.getElementById('ratPlaguePopup');
  const ratPlagueOk = document.getElementById('ratPlagueOk');

  const droughtPopup = document.getElementById('droughtPopup');
  const droughtOk = document.getElementById('droughtOk');

  const infectedMeatPopup = document.getElementById('infectedMeatPopup');
  const infectedMeatOk = document.getElementById('infectedMeatOk');

  const pandemicPopup = document.getElementById('pandemicPopup');
  const pandemicOk = document.getElementById('pandemicOk');

  const firePopup = document.getElementById('firePopup');
  const firePopupGoto = document.getElementById('firePopupGoto');
  const firePopupClose = document.getElementById('firePopupClose');

  const sicknessPopup = document.getElementById('sicknessPopup');
  const sicknessPopupOk = document.getElementById('sicknessPopupOk');

  const zombieVirusPopup = document.getElementById('zombieVirusPopup');
  const zombieVirusOk = document.getElementById('zombieVirusOk');

  const earthquakePopup = document.getElementById('earthquakePopup');
  const eqHousesDestroyed = document.getElementById('eqHousesDestroyed');
  const eqVillagersDead = document.getElementById('eqVillagersDead');
  const eqResourcesLost = document.getElementById('eqResourcesLost');
  const earthquakeOk = document.getElementById('earthquakeOk');
  const earthquakeSacrificeBtn = document.getElementById('earthquakeSacrificeBtn');

  const earthquakeSacrificeConfirm = document.getElementById('earthquakeSacrificeConfirm');
  const sacrificeCostList = document.getElementById('sacrificeCostList');
  const earthquakeSacrificeYes = document.getElementById('earthquakeSacrificeYes');
  const earthquakeSacrificeNo = document.getElementById('earthquakeSacrificeNo');

  const startWarning = document.getElementById('startWarning');
  const startWarningOk = document.getElementById('startWarningOk');

  const peaceWarning = document.getElementById('peaceWarning');
  const peaceWarningOk = document.getElementById('peaceWarningOk');

  const elThreatRaider = document.getElementById('threatRaider');
  const elThreatZombie = document.getElementById('threatZombie');
  const elThreatDragon = document.getElementById('threatDragon');
  const elCastleHomeButton = document.getElementById('castleHomeButton');

  const repairModal = document.getElementById('repairModal');
  const repairModalYes = document.getElementById('repairModalYes');
  const repairModalNo = document.getElementById('repairModalNo');

  const debugWindow = document.getElementById('debugWindow');

  const game = {
    state: 'menu',
    world: null, renderer: null, input: null, ticker: null,
    economy: null, hud: null, vm: null, zombieManager: null,
    raiderVillage: null,
    raiderCombat: null,
    raiderDefense: null,
    playerCombat: null,
    dragonManager: null,
    plagueManager: null,
    fireManager: null,
    sicknessManager: null,
    earthquakeManager: null,
    zombieCombat: null,
    gravestones: [], stats: null, breadManager: null,
    spatialGrid: null,
    paused: false, zombieInfects: true,
    zombieInfectsDelayed: false,
    zombieDifficulty: 'normal',
    firstZombieSpawn: 45,
    raidersEnabled: true,
    dragonEnabled: true,
    
    autosaveEnabled: false,
    lastAutosaveTime: 0,
    raiderFirstSpawnAt: 0,
    
    tutorialActive: true,
    loadedFromSave: false,

    jobPriorities: null,
    resourceTransportPriorities: null,

    // Hall of Fame
    hallOfFame: [],

    // Drachenpanik-Flag (von gameloop.js gesetzt/gelöscht)
    dragonPanicActive: false,

    _dragonClickIndex: 0,

    enemyStats: {
      zombiesKilled: 0,
      raidersKilled: 0,
      raiderCastlesDestroyed: 0,
      raiderHousesDestroyed: 0,
      dragonsKilled: 0,
      dragonsEscaped: 0,
      villagersZombified: 0,
      warriorsKilled: 0,
      buildingsDestroyedByDragon: 0,
      healedPatients: 0
    },
    productionStats: {
      wood: 0, stone: 0, grain: 0, fish: 0,
      water: 0, beer: 0, woodPlank: 0, flour: 0,
      bread: 0, arrows: 0, feed: 0, pig: 0, meat: 0,
      dragonBone: 0,
      raiderHerb: 0,
      antibiotics: 0
    },

    showToast(message, color) {
      let el = document.getElementById('dragonToast');
      if (!el) {
        el = document.createElement('div');
        el.id = 'dragonToast';
        el.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);background:rgba(30,31,34,0.95);padding:10px 16px;border-radius:10px;z-index:20;font-family:system-ui,sans-serif;font-size:14px;font-weight:600;pointer-events:none;display:flex;align-items:center;gap:8px;';
        document.body.appendChild(el);
      }
      el.style.color = color || '#ffcc00';
      el.style.borderColor = color || '#ffcc00';
      el.style.border = '1px solid ' + (color || '#ffcc00');
      el.textContent = message;
      el.style.display = 'flex';
      setTimeout(() => { el.style.display = 'none'; }, 3000);
    },

    addResource(key, amount) {
      if (amount <= 0) return;
      if (!this.economy || !this.economy.res) return;
      this.economy.res[key] = (this.economy.res[key] || 0) + amount;
      this.productionStats[key] = (this.productionStats[key] || 0) + amount;
      if (this.economy.onChange) this.economy.onChange();
    },

    playEarthquakeAnimation(targets, villagersDead, resourcesLost, onComplete) {
      this.paused = true;
      
      document.body.classList.add('earthquake-shake');
      
      const SHAKE_DURATION = 3000;
      const EXPLOSION_DURATION = 500;
      
      setTimeout(() => {
        document.body.classList.remove('earthquake-shake');
        this.paused = false; 

        const baseDelay = 100;
        const stepDelay = 150;
        
        // ==========================================================
        // NEU: Ablauf pro Gebäude:
        //   1. Explosion starten (Gebäude noch intakt darunter sichtbar)
        //   2. Nach 300 ms: Ruine setzen + Aufräumarbeiten
        // ==========================================================
        targets.forEach((b, index) => {
          setTimeout(() => {
            // Explosion starten — Gebäude bleibt noch intakt
            b._ruinExplosion = {
              startTime: performance.now(),
              duration: EXPLOSION_DURATION
            };

            if (audioManager) audioManager.playOneShot('audio/explosion.mp3');

            // Nach Ablauf: Ruine setzen
            setTimeout(() => {
              b.ruined = true;
              b.built = false;
              b.paused = false;
              b.progress = 0;
              b.buildTime = 0;
              b.builderId = null;
              b.ruinAsset = b.def.ruinAsset || 'images/ruine-quadrat.webp';
              
              if (this.earthquakeManager) {
                 this.earthquakeManager.removeFromActiveLists(b);
              }
              
              if (!this.world.buildSites.includes(b)) {
                this.world.buildSites.push(b);
              }
              
              for (const field of (b.fields || [])) {
                const key = field.x + ',' + field.y;
                if (this.world.fieldOwners.get(key) === b.id) this.world.fieldOwners.delete(key);
              }
              b.fields = [];
              
              if (this.renderer) {
                this.renderer.markStaticDirty(this.world.getBuildingTiles(b));
              }
              if (this.world) {
                this.world.invalidateTerritoryCache();
              }
            }, EXPLOSION_DURATION);

          }, baseDelay + index * stepDelay);
        });

        const totalExplosionTime = baseDelay + (targets.length * stepDelay) + EXPLOSION_DURATION + 50;
        
        setTimeout(() => {
          if (eqHousesDestroyed) eqHousesDestroyed.textContent = targets.length;
          if (eqVillagersDead) eqVillagersDead.textContent = villagersDead;
          if (eqResourcesLost) eqResourcesLost.textContent = Math.floor(resourcesLost);

          if (earthquakePopup) {
            earthquakePopup.classList.remove('hidden');
          }

          if (onComplete) onComplete();
        }, totalExplosionTime);

      }, SHAKE_DURATION);
    }
  };
  Game.state = game;

  // Event-Listener für Level-5-Krieger-Toast
  window.addEventListener('warriorLevel5Death', (e) => {
    const name = e.detail && e.detail.name ? e.detail.name : 'Ein Krieger';
    game.showToast(`⚔️ ${name} (Level 5) ist gefallen!`, '#ff6b6b');
    if (audioManager) audioManager.playOneShot('audio/schrei.mp3');
  });

  if (startWarningOk) {
    startWarningOk.addEventListener('click', () => {
      if (startWarning) startWarning.classList.add('hidden');
      game.paused = false;
    });
  }

  if (peaceWarningOk) {
    peaceWarningOk.addEventListener('click', () => {
      if (peaceWarning) peaceWarning.classList.add('hidden');
      game.paused = false;
    });
  }

  if (pigPlagueOk) {
    pigPlagueOk.addEventListener('click', () => {
      if (pigPlaguePopup) pigPlaguePopup.classList.add('hidden');
      game.paused = false;
    });
  }

  if (ratPlagueOk) {
    ratPlagueOk.addEventListener('click', () => {
      if (ratPlaguePopup) ratPlaguePopup.classList.add('hidden');
      game.paused = false;
    });
  }

  if (droughtOk) {
    droughtOk.addEventListener('click', () => {
      if (droughtPopup) droughtPopup.classList.add('hidden');
      game.paused = false;
    });
  }

  if (infectedMeatOk) {
    infectedMeatOk.addEventListener('click', () => {
      if (infectedMeatPopup) infectedMeatPopup.classList.add('hidden');
      game.paused = false;
    });
  }

  if (pandemicOk) {
    pandemicOk.addEventListener('click', () => {
      if (pandemicPopup) pandemicPopup.classList.add('hidden');
      game.paused = false;
    });
  }

  if (firePopupClose) {
    firePopupClose.addEventListener('click', () => {
      if (firePopup) firePopup.classList.add('hidden');
      game.paused = false;
    });
  }

  if (sicknessPopupOk) {
    sicknessPopupOk.addEventListener('click', () => {
      if (sicknessPopup) sicknessPopup.classList.add('hidden');
      game.paused = false;
    });
  }

  if (zombieVirusOk) {
    zombieVirusOk.addEventListener('click', () => {
      if (zombieVirusPopup) zombieVirusPopup.classList.add('hidden');
      game.paused = false;
    });
  }

  if (earthquakeOk) {
    earthquakeOk.addEventListener('click', () => {
      if (earthquakePopup) earthquakePopup.classList.add('hidden');
      game.paused = false;
    });
  }

  if (earthquakeSacrificeBtn) {
    earthquakeSacrificeBtn.addEventListener('click', () => {
      if (!game.earthquakeManager) return;
      
      const { cost, total } = game.earthquakeManager.calculateSacrificeCost();
      
      if (total === 0) {
        if (earthquakeSacrificeBtn) {
           earthquakeSacrificeBtn.innerHTML = '<span style="color:#ff6b6b;">Nicht genug Rohstoffe für eine Opfergabe!</span>';
        }
        return;
      }

      if (sacrificeCostList) {
        let html = '<b>Folgende Opfergaben werden dargebracht:</b><br>';
        for (const k in cost) {
          const name = Game.UI.resourceNames[k] || k;
          html += `• ${cost[k]} ${name}<br>`;
        }
        sacrificeCostList.innerHTML = html;
      }

      if (earthquakePopup) earthquakePopup.classList.add('hidden');
      if (earthquakeSacrificeConfirm) earthquakeSacrificeConfirm.classList.remove('hidden');
    });
  }

  if (earthquakeSacrificeNo) {
    earthquakeSacrificeNo.addEventListener('click', () => {
      if (earthquakeSacrificeConfirm) earthquakeSacrificeConfirm.classList.add('hidden');
      if (earthquakePopup) earthquakePopup.classList.remove('hidden');
    });
  }

  if (earthquakeSacrificeYes) {
    earthquakeSacrificeYes.addEventListener('click', () => {
      if (game.earthquakeManager) {
        game.earthquakeManager.offerSacrifice();
      }
      if (earthquakeSacrificeConfirm) earthquakeSacrificeConfirm.classList.add('hidden');
      game.paused = false;
      
      if (typeof showDragonToast === 'function') {
        showDragonToast('Die Götter sind besänftigt. Keine Erdbeben mehr!', '#ffcc00');
      } else {
        console.log('🕊️ Die Götter sind besänftigt. Keine Erdbeben mehr!');
      }
    });
  }

  loadBtn.addEventListener('click', () => {
    const saveStr = localStorage.getItem('siedlung_savegame');
    if (!saveStr) {
      alert("Kein Spielstand im internen Speicher gefunden!");
      return;
    }
    
    loadingOverlay.classList.remove('hidden');
    loadingTitle.textContent = "Spiel laden...";
    document.getElementById('loadingBarFill').style.width = '0%';
    
    setTimeout(async () => {
      try {
        await Game.SaveGame.deserialize(saveStr, game, (world, ticker, economy, vm, zombieManager, raiderVillage, dragonSaveData, eqSaveData) => {
          menu.classList.add('hidden');
          startGameFromData(world, ticker, economy, vm, zombieManager, raiderVillage, dragonSaveData, eqSaveData, true);
        });
      } catch (err) {
        alert("Fehler beim Laden: " + err.message);
        loadingOverlay.classList.add('hidden');
      }
    }, 100);
  });

  startBtn.addEventListener('click', () => {
    const size = parseInt(document.getElementById('mapSize').value, 10);
    const seedStr = document.getElementById('seed').value.trim();
    const seed = seedStr ? hashString(seedStr) : (Math.random() * 0xffffffff) >>> 0;

    const zombieInfectsCheckbox = document.getElementById('zombieInfects');
    game.zombieInfects = zombieInfectsCheckbox ? zombieInfectsCheckbox.checked : true;

    const zombieInfectsDelayedCheckbox = document.getElementById('zombieInfectsDelayed');
    game.zombieInfectsDelayed = zombieInfectsDelayedCheckbox ? zombieInfectsDelayedCheckbox.checked : false;

    const raidersEnabledCheckbox = document.getElementById('raidersEnabled');
    game.raidersEnabled = raidersEnabledCheckbox ? raidersEnabledCheckbox.checked : true;

    const dragonEnabledCheckbox = document.getElementById('dragonEnabled');
    game.dragonEnabled = dragonEnabledCheckbox ? dragonEnabledCheckbox.checked : true;

    const difficultyEl = document.getElementById('zombieDifficulty');
    game.zombieDifficulty = difficultyEl ? difficultyEl.value : 'normal';

    const firstSpawnEl = document.getElementById('firstZombieSpawn');
    game.firstZombieSpawn = firstSpawnEl ? Math.max(0, parseInt(firstSpawnEl.value, 10) || 0) : 45;

    const distribution = { grass: 67, forest: 10, mountain: 3, water: 20 };

    const isHigh = document.getElementById('startResourceLevel').value === 'high';
    const mult = isHigh ? 2 : 1;
    const bonusPlank = isHigh ? 50 : 0;
    const bonusBeer = isHigh ? 50 : 0;

    game.enemyStats = {
      zombiesKilled: 0,
      raidersKilled: 0,
      raiderCastlesDestroyed: 0,
      raiderHousesDestroyed: 0,
      dragonsKilled: 0,
      dragonsEscaped: 0,
      villagersZombified: 0,
      warriorsKilled: 0,
      buildingsDestroyedByDragon: 0,
      healedPatients: 0
    };
    game.productionStats = {
      wood: 0, stone: 0, grain: 0, fish: 0,
      water: 0, beer: 0, woodPlank: 0, flour: 0,
      bread: 0, arrows: 0, feed: 0, pig: 0, meat: 0,
      dragonBone: 0,
      raiderHerb: 0,
      antibiotics: 0
    };

    // Hall of Fame zurücksetzen
    game.hallOfFame = [];

    const startRes = {
      wood:      25 * mult,
      stone:     10 * mult,
      grain:     0 * mult,
      fish:      50 * mult,
      water:     0 * mult,
      beer:      0 * mult + bonusBeer,
      woodPlank: 5 * mult + bonusPlank,
      flour:     0 * mult,
      bread:     200 * mult,
      arrows:    0,
      feed:      0,
      pig:       0,
      meat:      0,
      dragonBone: 0,
      raiderHerb: 0,
      antibiotics: 0
    };

    menu.classList.add('hidden');
    
    const { width, height, grid, trees, stones, decorations } = Game.generateMap(size, size, seed, distribution);
    const world = new Game.World(width, height, grid);
    world.loadTrees(trees);
    world.loadStones(stones);
    world.buildWaterTiles();
    world.loadDecorations(decorations);
    
    const ticker = new Game.Ticker(1);
    const economy = {
      res: startRes,
      canAfford(cost) { for (const k in cost) if ((this.res[k] || 0) < cost[k]) return false; return true; },
      pay(cost) { for (const k in cost) this.res[k] -= cost[k]; },
      onChange() { if (game.hud) game.hud.updateResources(this); }
    };
    const vm = new Game.VillagerManager(world, ticker, economy);
    const zombieManager = new Game.ZombieManager(world, ticker, vm);
    
    game.tutorialActive = true;
    game.jobPriorities = null;
    game.resourceTransportPriorities = null;

    startGameFromData(world, ticker, economy, vm, zombieManager, null, null, null, false);
  });

  function hashString(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return h >>> 0;
  }

  function startGameFromData(world, ticker, economy, vm, zombieManager, raiderVillage, dragonSaveData, eqSaveData, isLoadedFromSave) {
    loadingOverlay.classList.add('hidden');

    if (!game.resourceTransportPriorities) {
      game.resourceTransportPriorities = [
        'bread', 'fish', 'meat', 'grain', 'wood', 'stone', 'water', 'beer',
        'woodPlank', 'flour', 'arrows', 'feed', 'pig', 'dragonBone',
        'raiderHerb', 'antibiotics'
      ];
    }

    const renderer = new Game.Renderer(canvas, world, vm);

    world.onBorderChanged = () => {
      renderer.markBorderDirty();
    };
    world.onStaticChanged = (tiles) => {
      renderer.markStaticDirty(tiles);
    };

    const spatialGrid = new Game.SpatialGrid(4);
    game.spatialGrid = spatialGrid;

    const breadManager = new Game.BreadManager();
    vm.breadManager = breadManager;

    let woodHarvestCount = 0;

    if (!isLoadedFromSave) {
      zombieManager.difficulty = game.zombieDifficulty;
      zombieManager.firstSpawnTime = game.firstZombieSpawn;
      zombieManager.infectsDelayed = !!(game.zombieInfectsDelayed && game.zombieInfects);
    } else {
      if (!zombieManager.difficulty) {
        zombieManager.difficulty = game.zombieDifficulty;
      }
    }
    
    if (!zombieManager.onZombieKilled) {
      zombieManager.onZombieKilled = (z) => {
        renderer.spawnHarvestParticles(Math.floor(z.x), Math.floor(z.y), 'stone');
        audioManager.playOneShot('audio/zombie.mp3');
        if (game.enemyStats) game.enemyStats.zombiesKilled++;
      };
    }

    zombieManager.onVirusEvolved = () => {
      if (!game.zombieInfects) return;
      game.paused = true;
      if (zombieVirusPopup) {
        zombieVirusPopup.classList.remove('hidden');
      }
    };
    
    vm.zombieManager = zombieManager;
    renderer.zombieManager = zombieManager;
    world.zombieManager = zombieManager;
    game.zombieManager = zombieManager;

    vm.onHarvest = (x, y, type) => {
      renderer.spawnHarvestParticles(x, y, type);
      
      if (type === 'wood') {
        if (game.raidersEnabled === false) {
          woodHarvestCount++;
          if (woodHarvestCount >= 100) {
            woodHarvestCount = 0;
            game.addResource('raiderHerb', 1);
            
            if (typeof showDragonToast === 'function') {
              showDragonToast('🌿 Ein seltener Fund! +1 Räuberkraut im Lager.', '#7ad07a');
            }
          }
        }
      }
    };

    vm.onDeath = (v) => {
      game.gravestones.push({
        x: v.renderX !== undefined ? v.renderX : v.x,
        y: v.renderY !== undefined ? v.renderY : v.y,
        expiresAt: performance.now() + 60000
      });
      audioManager.playOneShot('audio/schrei.mp3');

      // Hall of Fame Eintrag für tote Level-5-Krieger
      if (v.job === 'warrior' && v.warriorLevel === 5) {
        game.hallOfFame.push({
          name: v.name,
          kills: v.kills || 0,
          diedAt: performance.now()
        });
      }

      if (game.enemyStats) {
        if (v.job === 'warrior') {
          game.enemyStats.warriorsKilled++;
        }
        if (v._diedFromZombie) {
          game.enemyStats.zombiesKilled++;
        }
      }
    };

    renderer.gravestones = game.gravestones;

    if (!game.renderer) {
      const castle = world.castleId !== null ? world.buildings.get(world.castleId) : null;
      if (castle) {
        const ccx = castle.x + (castle.w || 1) / 2;
        const ccy = castle.y + (castle.h || 1) / 2;
        renderer.camera.x = ccx * renderer.tileSize - (window.innerWidth / renderer.camera.zoom) / 2;
        renderer.camera.y = ccy * renderer.tileSize - (window.innerHeight / renderer.camera.zoom) / 2;
      } else {
        renderer.camera.x = (world.width * renderer.tileSize) / 2 - (window.innerWidth / renderer.camera.zoom) / 2;
        renderer.camera.y = (world.height * renderer.tileSize) / 2 - (window.innerHeight / renderer.camera.zoom) / 2;
      }
      renderer.clampCamera();
    }

    let dragonManager = null;
    if (game.dragonEnabled) {
      dragonManager = new Game.DragonManager(world, ticker, vm, economy, renderer, audioManager);
      game.dragonManager = dragonManager;
      renderer.dragonManager = dragonManager;
      world._dragonManager = dragonManager;

      if (dragonSaveData) {
        dragonManager.restoreFromSave(dragonSaveData);
      }

      dragonManager.onSpawned = (dragon) => {
        if (dragonPopup) {
          const level = dragon.level;
          const maxHp = dragon.maxHp;
          const neededWarriors = dragonManager.KILL_WARRIORS_NEEDED + Math.floor(level * 0.5);
          
          if (dragonPopupInfo) {
            dragonPopupInfo.innerHTML = `
              Level: <b>${level}</b><br>
              Stürzt nach <b>${maxHp} Pfeiltreffern</b> ab.<br>
              Kann von <b>${neededWarriors} Kriegern</b> besiegt werden.
            `;
          }
          
          dragonPopup.classList.remove('hidden');
        }
        showDragonSpawnedText();
        audioManager.playOneShot('audio/schrei.mp3');
      };
      
      dragonManager.onPackSpawned = () => {
        if (dragonPackPopup) {
          dragonPackPopup.classList.remove('hidden');
        }
        audioManager.playOneShot('audio/drache.mp3');
      };

      dragonManager.onKilled = (dragon) => {
        showDragonToast(`Drache (Level ${dragon.level}) erledigt! +${dragonManager.MEAT_DROP} Fleisch, +${dragonManager.BONE_DROP} Knochen`, '#7ad07a');
        if (game.enemyStats) game.enemyStats.dragonsKilled++;
      };
      dragonManager.onEscaped = (dragon) => {
        showDragonToast('Drache entkommen!', '#ffcc00');
        if (game.enemyStats) game.enemyStats.dragonsEscaped++;
      };

      if (dragonPopupGoto) {
        dragonPopupGoto.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          dragonPopup.classList.add('hidden');
          const d = dragonManager.getState();
          if (!d) return;
          const ts = renderer.tileSize;
          renderer.camera.x = d.x * ts - (window.innerWidth / renderer.camera.zoom) / 2;
          renderer.camera.y = d.y * ts - (window.innerHeight / renderer.camera.zoom) / 2;
          renderer.clampCamera();
        });
      }
      if (dragonPopupClose) {
        dragonPopupClose.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          dragonPopup.classList.add('hidden');
        });
      }

      if (dragonPackGoto) {
        dragonPackGoto.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          dragonPackPopup.classList.add('hidden');
          const d = dragonManager.getState();
          if (!d) return;
          const ts = renderer.tileSize;
          renderer.camera.x = d.x * ts - (window.innerWidth / renderer.camera.zoom) / 2;
          renderer.camera.y = d.y * ts - (window.innerHeight / renderer.camera.zoom) / 2;
          renderer.clampCamera();
        });
      }
      if (dragonPackClose) {
        dragonPackClose.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          dragonPackPopup.classList.add('hidden');
        });
      }
    }

    const plagueManager = new Game.PlagueManager(world, vm, economy);
    game.plagueManager = plagueManager;

    plagueManager.onOutbreak = (type) => {
      game.paused = true;
      if (type === 'pig' && pigPlaguePopup) {
        pigPlaguePopup.classList.remove('hidden');
      } else if (type === 'rat' && ratPlaguePopup) {
        ratPlaguePopup.classList.remove('hidden');
      } else if (type === 'drought' && droughtPopup) {
        droughtPopup.classList.remove('hidden');
      } else if (type === 'infectedMeat' && infectedMeatPopup) {
        infectedMeatPopup.classList.remove('hidden');
      } else if (type === 'pandemic' && pandemicPopup) {
        pandemicPopup.classList.remove('hidden');
      }
    };

    if (isLoadedFromSave && game._pendingPlagueData) {
      plagueManager.restoreFromSave(game._pendingPlagueData, performance.now());
      game._pendingPlagueData = null;
    } else if (isLoadedFromSave) {
      plagueManager.restoreFromSave(null, performance.now());
    } else {
      plagueManager.start(performance.now());
    }

    const sicknessManager = new Game.SicknessManager(world, vm, economy);
    game.sicknessManager = sicknessManager;

    // ==========================================================
    // NEU: Krankheits-Toast mit Gesamtzahl (Debounce 100 ms)
    // ==========================================================
    let _sicknessBatch = { count: 0 };
    let _sicknessBatchTimer = null;

    sicknessManager.onSicknessOutbreak = (v) => {
      const isPandemic = plagueManager &&
                         plagueManager.activeType === 'pandemic' &&
                         plagueManager.isActive(performance.now());
      if (isPandemic) return;

      _sicknessBatch.count++;

      if (_sicknessBatchTimer) clearTimeout(_sicknessBatchTimer);
      _sicknessBatchTimer = setTimeout(() => {
        const count = _sicknessBatch.count;
        if (count === 1) {
          showDragonToast(`🤒 1 Einwohner ist krank geworden!`, '#f0a040');
        } else {
          showDragonToast(`🤒 ${count} Einwohner sind krank geworden!`, '#f0a040');
        }
        _sicknessBatch = { count: 0 };
        _sicknessBatchTimer = null;
      }, 100);
    };

    sicknessManager.onFirstSickWithoutAntibiotics = () => {
      game.paused = true;
      if (sicknessPopup) {
        sicknessPopup.classList.remove('hidden');
      }
    };

    sicknessManager.onTreatmentStart = (v, praxis) => {
      // Optional: Toast
    };

    sicknessManager.onTreatmentComplete = (v, praxis) => {
      if (game.enemyStats) game.enemyStats.healedPatients++;
    };

    if (isLoadedFromSave && game._pendingSicknessData) {
      sicknessManager.restoreFromSave(game._pendingSicknessData, performance.now());
      game._pendingSicknessData = null;
    } else if (isLoadedFromSave) {
      sicknessManager.restoreFromSave(null, performance.now());
    } else {
      sicknessManager.start(performance.now());
    }

    const fireManager = new Game.FireManager(world, vm, economy);
    game.fireManager = fireManager;

fireManager.onFireOutbreak = (building) => {
  showDragonToast(`🔥 ${building.def.name} brennt!`, '#ff6b6b');
};

if (isLoadedFromSave && game._pendingFireData) {
  fireManager.restoreFromSave(game._pendingFireData, performance.now());
  game._pendingFireData = null;

  // ==========================================================
  // NACH DEM LADEN: Feuerwehrleute bereinigen und sofortigen
  // Dispatch erzwingen, damit gespeicherte Feuer gelöscht werden.
  // ==========================================================
  
// 1. Villager aufräumen
for (const v of vm.villagers.values()) {
  if (v.job !== 'worker') continue;
  const wb = v.workplaceId ? world.buildings.get(v.workplaceId) : null;
  if (!wb || wb.def.id !== 'fireStation') continue;

  // Alle Feuerwehr-States zurücksetzen
  if (v.state === 'extinguish_fetch' ||
      v.state === 'extinguish_go' ||
      v.state === 'extinguish_waiting' ||
      v.state === 'extinguishing' ||
      v.state === 'return_to_station' ||
      v.state === 'fetch_water_storage' ||
      v.state === 'fetch_water_return') {
    v.state = 'working';
    v.task = null;
    v.hidden = true;
  }

  // NEU: Komplett alle Feuer-Interaktionen entfernen, um Deadlocks zu verhindern
  v._fireTargetId = null;
  v._fireWaterCarried = 0;
  v._fireSourceId = null;
  v._waterFetchAmount = 0;
  v._lastFireDispatchTime = 0;
  v._fireDispatchAt = 0;
  v._recoverUntil = 0;
  
  // Wichtig: Die Position auf die Wache setzen, damit sie "im Gebäude" sind
  if (wb) {
    v.x = wb.x + (wb.w || 1) / 2;
    v.y = wb.y + (wb.h || 1) / 2;
    v.renderX = v.x;
    v.renderY = v.y;
  }
}

  // 2. Wachen-Cache aufräumen (Slots prüfen)
  for (const b of world.buildings.values()) {
    if (b.def.id !== 'fireStation') continue;
    if (!b.workerIds) b.workerIds = [null, null];
    
    // Stelle sicher, dass die Rollen der Villager mit den Slots übereinstimmen
    for (let i = 0; i < b.workerIds.length; i++) {
      const wid = b.workerIds[i];
      if (wid === null) continue;
      const v = vm.villagers.get(wid);
      if (!v) {
        b.workerIds[i] = null;
        continue;
      }
      const expectedRole = b.def.fireStationSlots ? b.def.fireStationSlots[i] : null;
      if (expectedRole && v._fireStationRole !== expectedRole) {
        v._fireStationRole = expectedRole;
        v._fireStationSlotIndex = i;
      }
    }
  }

  // 3. Dispatch-Cooldown im fireManager zurücksetzen
  if (fireManager._lastDispatchTime) {
    fireManager._lastDispatchTime.clear();
  }

  // 4. Sofort einen Dispatch-Zyklus erzwingen
  if (typeof fireManager._dispatchFirefighters === 'function') {
    fireManager._dispatchFirefighters(performance.now());
  }
}

    const earthquakeManager = new Game.EarthquakeManager(world, vm, economy);
    game.earthquakeManager = earthquakeManager;

    if (isLoadedFromSave && eqSaveData) {
      earthquakeManager.restoreFromSave(eqSaveData, performance.now());
    }

    let selectedBuilding = null;
    let lastPanelHash = '';

    function hideInfoPanel() {
      infoPanel.classList.add('hidden');
      selectedBuilding = null;
      lastPanelHash = '';
      renderer.selectedBuildingId = null;
      
      if (debugWindow) debugWindow.classList.add('hidden');
      if (Game.UI && typeof Game.UI._stopFireLog === 'function') {
        Game.UI._stopFireLog();
      }
    }

    // Follow-Bewohner aus dem Info-Panel
    infoContent.addEventListener('click', (e) => {
      const row = e.target.closest('.follow-villager-row');
      if (!row) return;
      e.preventDefault();
      e.stopPropagation();

      const vid = parseInt(row.dataset.followVillager, 10);
      if (!vid) return;

      const v = vm.villagers.get(vid);
      if (!v) {
        showDragonToast('Dieser Bewohner existiert nicht mehr.', '#ff6b6b');
        return;
      }

      renderer.followEntity(v);
      hideInfoPanel();
      showDragonToast(`📍 Kamera folgt ${v.name} – tippe oder wische, um zu stoppen.`, '#7ad07a');
    });

    async function handleSave(isAutosave = false) {
      if (!isAutosave) {
        loadingOverlay.classList.remove('hidden');
        loadingTitle.textContent = "Spiel speichern...";
        document.getElementById('loadingBarFill').style.width = '0%';
      }
      
      try {
        const jsonStr = await Game.SaveGame.serialize(game);
        localStorage.setItem('siedlung_savegame', jsonStr);
        
        if (!isAutosave) {
          setTimeout(() => {
            loadingOverlay.classList.add('hidden');
            alert("Spielstand erfolgreich im internen Speicher gesichert!");
          }, 500);
        } else {
          showDragonToast('Autosave erfolgreich', '#7ad07a');
        }
        
        game.lastAutosaveTime = performance.now();
      } catch (e) {
        if (!isAutosave) {
          alert("Fehler beim Speichern: " + e.message);
          loadingOverlay.classList.add('hidden');
        } else {
          console.warn("Autosave fehlgeschlagen:", e);
        }
      }
    }

    function bindAutosaveCheckbox() {
      const cb = document.getElementById('autosaveCheckbox');
      if (cb) {
        cb.addEventListener('change', (e) => {
          game.autosaveEnabled = e.target.checked;
          if (game.autosaveEnabled) {
            game.lastAutosaveTime = performance.now();
          }
        });
      }
    }

    function centerCameraOnCastle() {
      if (!world.castleId) return;
      const castle = world.buildings.get(world.castleId);
      if (!castle) return;
      const ccx = castle.x + (castle.w || 1) / 2;
      const ccy = castle.y + (castle.h || 1) / 2;
      const ts = renderer.tileSize;
      renderer.camera.x = ccx * ts - (window.innerWidth / renderer.camera.zoom) / 2;
      renderer.camera.y = ccy * ts - (window.innerHeight / renderer.camera.zoom) / 2;
      renderer.clampCamera();
    }

    function openRepairModal() {
      if (!repairModal) return;
      repairModal.classList.remove('hidden');
    }

    function closeRepairModal() {
      if (!repairModal) return;
      repairModal.classList.add('hidden');
    }

    if (repairModalYes) {
      repairModalYes.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeRepairModal();
        if (Game.SaveGame && typeof Game.SaveGame.repairGame === 'function') {
          const result = Game.SaveGame.repairGame(world, vm, economy);
          const count = result && result.fixed ? result.fixed : 0;
          
          if (count > 0) {
            showDragonToast(`Siedlung repariert! ${count} Fehler behoben.`, '#7ad07a');
          } else {
            showDragonToast('Keine Fehler gefunden - alles in Ordnung!', '#7ad07a');
          }
          
          if (selectedBuilding) {
            lastPanelHash = Game.UI.computePanelHash(selectedBuilding, vm, economy);
            infoContent.innerHTML = Game.UI.buildPanelHtml(selectedBuilding, vm, economy);
          }
        }
      });
    }

    if (repairModalNo) {
      repairModalNo.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeRepairModal();
      });
    }

    if (repairModal) {
      repairModal.addEventListener('click', (e) => {
        if (e.target === repairModal) closeRepairModal();
      });
    }

    function pauseBuilding(b) {
      if (!b || b.paused) return;
      
      if (b.workerId !== null) {
        const worker = vm.villagers.get(b.workerId);
        if (worker) {
          if (worker.state === 'zfighting' || worker.state === 'vfighting' || worker.state === 'dragon_attack') {
            showDragonToast('Arbeiter ist im Kampf und kann nicht entlassen werden!', '#ff6b6b');
            return;
          }
          
          worker.workplaceId = null;
          worker.job = 'free';
          worker.state = 'idle';
          worker.task = 'go_home';
          worker.hidden = false;
          
          const home = world.buildings.get(worker.homeId) || world.buildings.get(world.castleId);
          if (home) {
            vm.startMove(worker, home.x, home.y + (home.h || 1) - 1);
          }
          
          vm._releaseReservations(worker);
          vm._idleVillagers.add(worker.id);
        }
        b.workerId = null;
      }

      if (b.workerIds && b.workerIds.length > 0) {
        for (const wid of b.workerIds) {
          const w = vm.villagers.get(wid);
          if (w) {
            w.workplaceId = null;
            w.job = 'free';
            w.state = 'idle';
            w.task = 'go_home';
            w.hidden = false;
            vm._releaseReservations(w);
            vm._idleVillagers.add(w.id);
          }
        }
        b.workerIds = [];
      }

      if (b.warriorSlots) {
        for (let i = 0; i < b.warriorSlots.length; i++) {
          const wid = b.warriorSlots[i];
          if (wid === null) continue;
          const w = vm.villagers.get(wid);
          if (w) {
            if (w.state === 'zfighting' || w.state === 'vfighting' || w.state === 'vdefend' || w.state === 'dragon_attack' || w.state === 'vfightback') {
              showDragonToast('Ein Krieger ist noch im Kampf! Stilllegung abgebrochen.', '#ff6b6b');
              return;
            }
            w.workplaceId = null;
            w.job = 'free';
            w.state = 'idle';
            w.task = 'go_home';
            w.hidden = false;
            w.warriorBuildingId = null;
            w.warriorSlotIndex = -1;
            
            const home = world.buildings.get(w.homeId) || world.buildings.get(world.castleId);
            if (home) {
              vm.startMove(w, home.x, home.y + (home.h || 1) - 1);
            }
            
            vm._releaseReservations(w);
            vm._idleVillagers.add(w.id);
          }
          b.warriorSlots[i] = null;
        }
      }

      for (const field of b.fields) {
        const key = field.x + ',' + field.y;
        if (world.fieldOwners.get(key) === b.id) {
          world.fieldOwners.delete(key);
        }
      }
      b.fields = [];

      b.paused = true;

      if (renderer) {
        const tiles = world.getBuildingTiles(b);
        renderer.markStaticDirty(tiles);
      }
      
      showDragonToast(`⏸ ${b.def.name} wurde stillgelegt.`, '#f0a040');
      
      if (selectedBuilding === b) {
        lastPanelHash = Game.UI.computePanelHash(b, vm, economy);
        infoContent.innerHTML = Game.UI.buildPanelHtml(b, vm, economy);
        showInfoPanel(b);
      }
    }

    function resumeBuilding(b) {
      if (!b || !b.paused) return;
      
      b.paused = false;

      const isFieldBuilding = b.def.produces && b.def.id !== 'fisher';
      if (isFieldBuilding) {
        const ring = world.getRingTiles(b);
        let targetTerrainId = 'grass';
        
        for (const n of ring) {
          const key = `${n.x},${n.y}`;
          if (world.occupied.has(key)) continue;
          if (!world.fieldOwners.has(key) && world.getTerrainId(n.x, n.y) === targetTerrainId) {
            b.fields.push({ x: n.x, y: n.y, timer: 0, state: 'growing' });
            world.fieldOwners.set(key, b.id);
          }
        }
      }

      if (renderer) {
        const tiles = world.getBuildingTiles(b);
        renderer.markStaticDirty(tiles);
      }

      showDragonToast(`▶ ${b.def.name} ist wieder aktiv.`, '#7ad07a');
      
      if (vm) vm.assignFreeVillagers();
      
      if (selectedBuilding === b) {
        lastPanelHash = Game.UI.computePanelHash(b, vm, economy);
        infoContent.innerHTML = Game.UI.buildPanelHtml(b, vm, economy);
        showInfoPanel(b);
      }
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
      bindRaidButtons();
      bindArrowStopInput(b);
      bindAutosaveCheckbox();
      
      const pauseBuildingBtn = document.getElementById('pauseBuildingBtn');
      if (pauseBuildingBtn) {
        pauseBuildingBtn.addEventListener('click', () => pauseBuilding(b));
      }

      const resumeBuildingBtn = document.getElementById('resumeBuildingBtn');
      if (resumeBuildingBtn) {
        resumeBuildingBtn.addEventListener('click', () => resumeBuilding(b));
      }
      
      const saveGameBtn = document.getElementById('saveGameBtn');
      if (saveGameBtn) {
        saveGameBtn.addEventListener('click', () => handleSave(false));
      }

      const centerCastleBtn = document.getElementById('centerCastleBtn');
      if (centerCastleBtn) {
        centerCastleBtn.addEventListener('click', () => {
          centerCameraOnCastle();
          hideInfoPanel();
        });
      }

      const repairJobsBtn = document.getElementById('repairJobsBtn');
      if (repairJobsBtn) {
        repairJobsBtn.addEventListener('click', () => openRepairModal());
      }
    }

    function bindRaidButtons() {
      const slider = document.getElementById('attackSlider');
      const sliderValue = document.getElementById('attackSliderValue');
      const startBtn = document.getElementById('startRaidBtn');

      if (slider && sliderValue) {
        slider.addEventListener('input', () => {
          sliderValue.textContent = slider.value;
        });
      }

      if (startBtn) {
        startBtn.addEventListener('click', () => {
          if (game.raiderVillage && game.raiderVillage.attackState) {
            showDragonToast('Die Raeuber greifen gerade an! Verteidige zuerst dein Territorium.', '#ff6b6b');
            return;
          }

          const count = parseInt(slider.value, 10);
          if (count > 0) {
            // ==========================================================
            // NEU: Schwächste Krieger zuerst (nach Kills aufsteigend)
            // Die starken Krieger bleiben zu Hause und sind vor
            // Räuber-Bogenschützen geschützt.
            // ==========================================================
            const availableWarriors = [];
            for (const v of vm.villagers.values()) {
              if (v.job !== 'warrior') continue;
              if (v.state === 'vfightback') continue;
              if (v.state === 'dragon_attack') continue;
              if (v.state === 'vdefend') continue;
              if (v.state === 'vfighting') continue;
              if (v.state === 'returning_to_post') continue;
              if (v.state === 'moving' && v.task === 'returning_to_post') continue;
              availableWarriors.push(v);
            }

            availableWarriors.sort((a, b) => {
              const ka = a.kills || 0;
              const kb = b.kills || 0;
              if (ka !== kb) return ka - kb;
              return (a.id || 0) - (b.id || 0);
            });

            const chosen = availableWarriors.slice(0, count);
            for (const v of chosen) {
              v.state = 'vfightback';
              v.hidden = false;
              v.asset = 'images/villager-krieger-rot.webp';
            }
            hideInfoPanel();
          }
        });
      }
    }

    function bindArrowStopInput(b) {
      const input = document.getElementById('arrowStopInput');
      if (!input) return;

      input.addEventListener('input', () => {
        const val = parseInt(input.value, 10);
        b.arrowStopThreshold = isNaN(val) || val < 0 ? 0 : val;
        if (b.arrowStopThreshold === undefined) b.arrowStopThreshold = 500;
        lastPanelHash = Game.UI.computePanelHash(b, vm, economy);
      });
    }

    function bindPauseButton(b) {
      const pauseBtn = document.getElementById('pauseToggleBtn');
      if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
          b.paused = !b.paused;
          lastPanelHash = Game.UI.computePanelHash(b, vm, economy);
          infoContent.innerHTML = Game.UI.buildPanelHtml(b, vm, economy);
          showInfoPanel(b);
        });
      }
    }

    function refreshInfoPanel() {
      if (!selectedBuilding) return;
      const newHash = Game.UI.computePanelHash(selectedBuilding, vm, economy);
      if (newHash === lastPanelHash) return;
      lastPanelHash = newHash;
      infoContent.innerHTML = Game.UI.buildPanelHtml(selectedBuilding, vm, economy);
      showInfoPanel(selectedBuilding);
    }

    function refreshInfoPanelThrottled(tick) {
      // Wird nicht mehr genutzt, da wir jetzt setInterval verwenden
    }

    setInterval(() => {
      if (infoPanel.classList.contains('hidden')) return;
      if (!selectedBuilding) return;
      refreshInfoPanel();
    }, 1000);

    infoClose.addEventListener('click', hideInfoPanel);

    const uiCallbacks = {
      canvas, placeHint, buildConfirm, buildConfirmTitle, buildConfirmCost,
      buildConfirmYes, buildConfirmNo, infoPanel, infoIcon, infoTitle, infoContent, infoClose,
      showInfoPanel, hideInfoPanel
    };

    Game.UI.initSecretDebug(showInfoPanel);

    const hud = new Game.HUD(game);
    game.world = world;
    game.renderer = renderer;
    game.ticker = ticker;
    game.economy = economy;
    game.hud = hud;
    game.vm = vm;
    game.breadManager = breadManager;

    if (!isLoadedFromSave) {
      for (const k in economy.res) {
        if (economy.res[k] > 0) {
          game.productionStats[k] = (game.productionStats[k] || 0) + economy.res[k];
        }
      }
    }

    const stats = new Game.Statistics(economy);
    game.stats = stats;
    world._stats = stats;

    ticker.onTick(() => {
      stats.tick();
      const activeTab = stats.activeTab || 'resources';
      const container = 
        activeTab === 'enemies' ? document.getElementById('statsEnemiesBody') :
        activeTab === 'production' ? document.getElementById('statsProductionBody') :
        activeTab === 'halloffame' ? document.getElementById('statsHallOfFameBody') :
        document.getElementById('statsBody');
      
      const statsWindow = document.getElementById('statsWindow');
      if (container && statsWindow && !statsWindow.classList.contains('hidden')) {
        stats.render(container);
      }
    });

    Game.GameLoop(world, ticker, vm, economy, renderer, { refreshInfoPanel, refreshInfoPanelThrottled });

    const interactions = Game.Interactions(game, world, renderer, vm, economy, uiCallbacks);
    const input = interactions.initInput();
    game.input = input;

    function stopFollowIfActive() {
      if (renderer.followTarget) {
        renderer.stopFollow();
        showDragonToast('Kamera-Follow beendet.', '#7ad07a');
      }
    }

    const originalOnClickTile = input.onClickTile;
    input.onClickTile = (x, y) => {
      stopFollowIfActive();
      if (typeof originalOnClickTile === 'function') {
        originalOnClickTile(x, y);
      }
    };

    input.onPanStart = () => {
      stopFollowIfActive();
    };

    input.onPinchStart = () => {
      stopFollowIfActive();
    };

    if (world.castleId !== null) {
       game.state = 'playing';
       document.getElementById('buildButton').classList.remove('hidden');
       const bottomBar = document.getElementById('bottomBar');
       if (bottomBar) bottomBar.classList.remove('hidden');
       if (elCastleHomeButton) elCastleHomeButton.classList.remove('hidden');
    } else {
       game.state = 'placingCastle';
       placeHint.classList.remove('hidden');
       canvas.classList.add('placing');
    }

    const gameSystems = Game.GameSystems.create(game, world, vm, renderer, audioManager, stats);
    game.zombieCombat = Game.ZombieCombat.create(game, world, vm, zombieManager, renderer, audioManager);
    Game.JobWindow.create(game, world, vm);

    if (raiderVillage) {
      game.raiderVillage = raiderVillage;
      renderer.raiderVillage = raiderVillage;
      world._raiderVillage = raiderVillage;

      game.raiderDefense = Game.RaiderDefense.create(game, world, vm, raiderVillage, renderer, audioManager);
      game.playerCombat = Game.PlayerCombat.create(game, world, vm, raiderVillage, renderer, audioManager);
      game.raiderCombat = Game.RaiderCombat.create(game, world, vm, raiderVillage, renderer, audioManager);
    }

    function jumpToTarget(x, y) {
      if (!renderer) return;
      const ts = renderer.tileSize;
      renderer.camera.x = x * ts - (window.innerWidth / renderer.camera.zoom) / 2;
      renderer.camera.y = y * ts - (window.innerHeight / renderer.camera.zoom) / 2;
      renderer.clampCamera();
    }

    if (elCastleHomeButton) {
      elCastleHomeButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!world.castleId) return;
        const castle = world.buildings.get(world.castleId);
        if (castle) showInfoPanel(castle);
      });
    }

    if (elThreatRaider) {
      elThreatRaider.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!game.raiderVillage) return;
        
        let best = null;
        for (const w of game.raiderVillage.warriors.values()) {
          if (w.dead) continue;
          if (!best || w.id > best.id) best = w;
        }
        if (best) jumpToTarget(best.x, best.y);
        else {
          const c = game.raiderVillage.getCenter();
          jumpToTarget(c.x, c.y);
        }
      });
    }

    if (elThreatZombie) {
      elThreatZombie.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!game.zombieManager) return;
        
        let best = null;
        for (const z of game.zombieManager.zombies) {
          if (z.state === 'dead') continue;
          if (!best || z.id > best.id) best = z;
        }
        if (best) jumpToTarget(best.x, best.y);
      });
    }

    if (elThreatDragon) {
      elThreatDragon.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const dm = game.dragonManager;
        if (!dm || !dm.dragons || dm.dragons.length === 0) return;

        game._dragonClickIndex = (game._dragonClickIndex + 1) % dm.dragons.length;
        const d = dm.dragons[game._dragonClickIndex];
        
        if (d) jumpToTarget(d.x, d.y);
      });
    }

    const harvestSoundLoops = new Map();
    function updateHarvestSounds(now) {
      const active = new Set();
      for (const v of vm.villagers.values()) {
        let soundPath = null;
        let b = null;

        if (v.state === 'harvesting_hit') {
          b = v.workplaceId ? world.buildings.get(v.workplaceId) : null;
          if (!b) continue;
          if (b.def.id === 'lumberjack') soundPath = 'audio/axt.mp3';
          else if (b.def.id === 'quarry') soundPath = 'audio/steinmetz.mp3';
        } else if (v.state === 'fishing_dive') {
          b = v.workplaceId ? world.buildings.get(v.workplaceId) : null;
          if (!b) continue;
          if (b.def.id === 'fisher') soundPath = 'audio/fischerhuette.mp3';
        }

        if (!soundPath) continue;

        const key = 'harvest-sound-' + v.id;
        active.add(key);
        harvestSoundLoops.set(v.id, key);

        const cam = renderer.camera;
        const ts = renderer.tileSize;
        const centerX = cam.x + (window.innerWidth / cam.zoom) / 2;
        const centerY = cam.y + (window.innerHeight / cam.zoom) / 2;
        const viewW = window.innerWidth / cam.zoom;
        const viewH = window.innerHeight / cam.zoom;
        const maxDist = Math.sqrt(viewW * viewW + viewH * viewH) / 2;

        const bx = v.x * ts + ts / 2;
        const by = v.y * ts + ts / 2;
        const dist = Math.sqrt((bx - centerX) ** 2 + (by - centerY) ** 2);
        const t = Math.min(1, dist / maxDist);
        const volume = 1.0 - t * (1.0 - 0.10);
        const muted = dist > maxDist * 1.2;

        audioManager.playLoop(key, soundPath, volume, muted);
      }

      for (const [vid, key] of Array.from(harvestSoundLoops.entries())) {
        if (!active.has(key)) {
          audioManager.stopLoop(key);
          harvestSoundLoops.delete(vid);
        }
      }
    }

    function showRaiderSpawnedText() {
      let el = document.getElementById('raiderToast');
      if (!el) {
        el = document.createElement('div');
        el.id = 'raiderToast';
        el.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:rgba(30,31,34,0.92);color:#4A90E2;padding:10px 16px;border-radius:10px;border:1px solid #4A90E2;z-index:20;font-family:system-ui,sans-serif;font-size:14px;font-weight:600;pointer-events:none;display:flex;align-items:center;gap:8px;';
        document.body.appendChild(el);
      }
      el.innerHTML = '<img src="images/villager-krieger-blau.webp" style="width:24px;height:24px;object-fit:contain;"> Raeuberlager gesichtet!';
      el.style.display = 'flex';
      setTimeout(() => { el.style.display = 'none'; }, 3000);
    }

    function showDragonSpawnedText() {
      let el = document.getElementById('dragonToast');
      if (!el) {
        el = document.createElement('div');
        el.id = 'dragonToast';
        el.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);background:rgba(30,15,15,0.95);color:#ff6b3b;padding:10px 16px;border-radius:10px;border:1px solid #ff6b3b;z-index:20;font-family:system-ui,sans-serif;font-size:14px;font-weight:600;pointer-events:none;display:flex;align-items:center;gap:8px;';
        document.body.appendChild(el);
      }
      el.innerHTML = '<img src="images/drache.webp" onerror="this.style.display=\'none\'" style="width:24px;height:24px;object-fit:contain;"> Ein Drache naht!';
      el.style.display = 'flex';
      setTimeout(() => { el.style.display = 'none'; }, 4000);
    }

    function showDragonToast(text, color) {
      let el = document.getElementById('dragonToast');
      if (!el) {
        el = document.createElement('div');
        el.id = 'dragonToast';
        el.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);background:rgba(30,31,34,0.95);padding:10px 16px;border-radius:10px;z-index:20;font-family:system-ui,sans-serif;font-size:14px;font-weight:600;pointer-events:none;display:flex;align-items:center;gap:8px;';
        document.body.appendChild(el);
      }
      el.style.color = color;
      el.style.borderColor = color;
      el.style.border = '1px solid ' + color;
      el.textContent = text;
      el.style.display = 'flex';
      setTimeout(() => { el.style.display = 'none'; }, 3000);
    }

    let raiderSpawned = raiderVillage !== null;

    if (!isLoadedFromSave) {
      if (!raiderSpawned && game.raidersEnabled) {
        game.raiderFirstSpawnAt = performance.now() + 180000;
      }
    } else {
      if (!raiderSpawned && game.raidersEnabled && (!game.raiderFirstSpawnAt || game.raiderFirstSpawnAt <= 0)) {
        game.raiderFirstSpawnAt = performance.now() + 180000;
      }
    }

    function trySpawnRaiders(generation = 0) {
      if (!game.raidersEnabled) return false;
      if (raiderSpawned) return false;
      if (world.castleId === null) return false;

      const rv = new Game.RaiderVillage(world, ticker, vm, economy, generation);
      if (!rv.spawn()) return false;

      game.raiderVillage = rv;
      renderer.raiderVillage = rv;
      world._raiderVillage = rv;

      game.raiderDefense = Game.RaiderDefense.create(game, world, vm, rv, renderer, audioManager);
      game.playerCombat = Game.PlayerCombat.create(game, world, vm, rv, renderer, audioManager);
      game.raiderCombat = Game.RaiderCombat.create(game, world, vm, rv, renderer, audioManager);

      rv.nextAttackAt = performance.now() + rv.ATTACK_INTERVAL_MS;
      rv.firstAttackDone = true;

      raiderSpawned = true;

      if (raiderPopup) {
        raiderPopup.classList.remove('hidden');
      }
      showRaiderSpawnedText();

      return true;
    }

    function respawnRaiders(generation) {
      const rv = new Game.RaiderVillage(world, ticker, vm, economy, generation);
      if (!rv.spawn()) return false;

      game.raiderVillage = rv;
      renderer.raiderVillage = rv;
      world._raiderVillage = rv;

      game.raiderDefense = Game.RaiderDefense.create(game, world, vm, rv, renderer, audioManager);
      game.playerCombat = Game.PlayerCombat.create(game, world, vm, rv, renderer, audioManager);
      game.raiderCombat = Game.RaiderCombat.create(game, world, vm, rv, renderer, audioManager);

      rv.nextAttackAt = performance.now() + rv.ATTACK_INTERVAL_MS;
      rv.firstAttackDone = true;

      showRaiderSpawnedText();

      return true;
    }

    game.respawnRaiders = respawnRaiders;

    if (raiderPopupGoto) {
      raiderPopupGoto.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        raiderPopup.classList.add('hidden');
        if (!game.raiderVillage) return;
        const center = game.raiderVillage.getCenter();
        const ts = renderer.tileSize;
        renderer.camera.x = center.x * ts - (window.innerWidth / renderer.camera.zoom) / 2;
        renderer.camera.y = center.y * ts - (window.innerHeight / renderer.camera.zoom) / 2;
        renderer.clampCamera();
      });
    }

    if (raiderPopupClose) {
      raiderPopupClose.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        raiderPopup.classList.add('hidden');
      });
    }

    game._trySpawnRaiders = trySpawnRaiders;

    let wasPausedByVisibility = false;
    let lastFrameTime = performance.now();

    const pauseGame = () => {
      if (game.state === 'gameover' || game.state === 'menu') return;
      if (!game.paused) {
        game.paused = true;
        wasPausedByVisibility = true;
        if (audioManager) audioManager.stopAll();
      }
    };

    const resumeGame = () => {
      if (wasPausedByVisibility) {
        wasPausedByVisibility = false;
        game.paused = false;
        lastFrameTime = performance.now();
      }
    };

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) pauseGame();
      else resumeGame();
    });

    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
      const { App } = window.Capacitor.Plugins;
      App.addListener('appStateChange', ({ isActive }) => {
        if (!isActive) pauseGame();
        else resumeGame();
      });
      App.addListener('pause', () => pauseGame());
      App.addListener('resume', () => resumeGame());
    }

    let _prioCheckTimer = 0;

    function loop(now) {
      if (game.paused) {
        lastFrameTime = now;
        requestAnimationFrame(loop);
        return;
      }

      const dt = Math.min(now - lastFrameTime, 100);
      lastFrameTime = now;

      ticker.update(dt);

      if (!game.paused && vm && vm.assignFreeVillagers) {
         if (now - _prioCheckTimer > 1000) {
            _prioCheckTimer = now;
            vm.assignFreeVillagers();
         }
      }

      if (game.tutorialActive && game.state === 'playing') {
        let hasLumberjack = false;
        let hasQuarry = false;
        let hasSawmill = false;
        
        for (const b of world.buildings.values()) {
          if (b.def.id === 'lumberjack') hasLumberjack = true;
          if (b.def.id === 'quarry') hasQuarry = true;
          if (b.def.id === 'sawmill') hasSawmill = true;
        }
        
        if (hasLumberjack && hasQuarry && hasSawmill) {
          game.tutorialActive = false;
          if (game.hud) game.hud.refreshBuildGrid();
          showDragonToast('Alle Gebaeude freigeschaltet!', '#7ad07a');
        }
      }

      if (!raiderSpawned && game.raidersEnabled && game.raiderFirstSpawnAt > 0) {
        if (now >= game.raiderFirstSpawnAt && world.castleId !== null) {
          trySpawnRaiders(0);
        }
      }

      if (game.autosaveEnabled && game.state === 'playing') {
        if (now - game.lastAutosaveTime >= 300000) {
          game.lastAutosaveTime = now;
          handleSave(true);
        }
      }

      if (game.breadManager && game.vm) {
        game.breadManager.tick(now, game.economy, game.vm);
      }

      if (game.world) {
        const regrowTiles = game.world.tickTreeRegrow(now);
        if (regrowTiles && regrowTiles.length > 0) game.renderer.markStaticDirty(regrowTiles);

        const fishTiles = game.world.tickFishRegrow(now);
        if (fishTiles && fishTiles.length > 0) game.renderer.markStaticDirty(fishTiles);

        game.world.tickTreeGrowth(now);
      }

      if (game.plagueManager) {
        game.plagueManager.update(now);
      }

      if (game.sicknessManager) {
        game.sicknessManager.update(now);
      }

      if (game.dragonManager) {
        game.dragonManager.update(dt, now);
      }

      if (game.fireManager) {
        game.fireManager.update(now);
      }

      if (game.earthquakeManager) {
        game.earthquakeManager.update(now);
      }

      if (game.spatialGrid) {
        game.spatialGrid.clear();

        for (const v of game.vm.villagers.values()) {
          if (v.hidden) continue;
          game.spatialGrid.insert(v, v.job === 'warrior' ? 'warrior' : 'villager');
        }

        if (game.zombieManager) {
          for (const z of game.zombieManager.zombies) {
            if (z.state === 'dead') continue;
            game.spatialGrid.insert(z, 'zombie');
          }
        }

        if (game.raiderVillage) {
          for (const w of game.raiderVillage.warriors.values()) {
            if (w.dead || w.hidden) continue;
            game.spatialGrid.insert(w, 'raider');
          }
        }

        if (game.dragonManager && game.dragonManager.dragons) {
          for (const d of game.dragonManager.dragons) {
            if (d.state === 'grounded') game.spatialGrid.insert(d, 'dragon');
          }
        }

        game.spatialGrid.rebuild();
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

      if (game.zombieCombat) game.zombieCombat.update(dt);

      if (game.raiderDefense) game.raiderDefense.update(dt);
      if (game.playerCombat) game.playerCombat.update(dt);
      if (game.raiderCombat) game.raiderCombat.update(dt);

      gameSystems.updateGravestones(now);
      gameSystems.updateBuildingSounds(dt);
      gameSystems.checkHungerWarning(now);

      updateHarvestSounds(now);

      if (elThreatZombie) {
        const hasZombies = game.zombieManager && game.zombieManager.zombies.length > 0;
        elThreatZombie.classList.toggle('hidden', !hasZombies);
      }
      if (elThreatRaider) {
        const hasActiveRaiderVillage = game.raiderVillage && !game.raiderVillage.isDestroyed;
        elThreatRaider.classList.toggle('hidden', !hasActiveRaiderVillage);
      }
      if (elThreatDragon) {
        const dragonAlive = game.dragonManager && game.dragonManager.isAlive();
        elThreatDragon.classList.toggle('hidden', !dragonAlive);
      }

      renderer.render(dt, now);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }
});
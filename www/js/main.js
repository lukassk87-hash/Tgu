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
    'images/festung-drache.webp'
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

  const firePopup = document.getElementById('firePopup');
  const firePopupGoto = document.getElementById('firePopupGoto');
  const firePopupClose = document.getElementById('firePopupClose');

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
    raiderVillage: null, raiderCombat: null,
    dragonManager: null,
    plagueManager: null,
    fireManager: null,
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
      buildingsDestroyedByDragon: 0
    },
    productionStats: {
      wood: 0, stone: 0, grain: 0, fish: 0,
      water: 0, beer: 0, woodPlank: 0, flour: 0,
      bread: 0, arrows: 0, feed: 0, pig: 0, meat: 0,
      dragonBone: 0
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
      
      // 1. Wackeln für exakt 3 Sekunden
      const SHAKE_DURATION = 3000;
      
      setTimeout(() => {
        // 2. Wackeln beenden und Touch sofort wieder freigeben
        document.body.classList.remove('earthquake-shake');
        this.paused = false; 

        // 3. Jetzt erst die Explosionen abfeuern (schnelle Kaskade)
        const baseDelay = 100;
        const stepDelay = 150;
        
        targets.forEach((b, index) => {
          setTimeout(() => {
            b.explodingUntil = performance.now() + 500; 
            
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
            
            if (audioManager) audioManager.playOneShot('audio/explosion.mp3');

          }, baseDelay + index * stepDelay);
        });

        // 4. Nach der letzten Explosion das Popup anzeigen
        const totalExplosionTime = baseDelay + (targets.length * stepDelay) + 500;
        
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

  if (firePopupClose) {
    firePopupClose.addEventListener('click', () => {
      if (firePopup) firePopup.classList.add('hidden');
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
      buildingsDestroyedByDragon: 0
    };
    game.productionStats = {
      wood: 0, stone: 0, grain: 0, fish: 0,
      water: 0, beer: 0, woodPlank: 0, flour: 0,
      bread: 0, arrows: 0, feed: 0, pig: 0, meat: 0,
      dragonBone: 0
    };

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
      dragonBone: 0
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

    startGameFromData(world, ticker, economy, vm, zombieManager, null, null, null, false);
  });

  function hashString(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return h >>> 0;
  }

  function startGameFromData(world, ticker, economy, vm, zombieManager, raiderVillage, dragonSaveData, eqSaveData, isLoadedFromSave) {
    loadingOverlay.classList.add('hidden');

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
    };

    vm.onDeath = (v) => {
      game.gravestones.push({
        x: v.renderX !== undefined ? v.renderX : v.x,
        y: v.renderY !== undefined ? v.renderY : v.y,
        expiresAt: performance.now() + 60000
      });
      audioManager.playOneShot('audio/schrei.mp3');

      if (game.enemyStats) {
        if (v.job === 'warrior') {
          game.enemyStats.warriorsKilled++;
        }
        if (v._diedFromZombie) {
          game.enemyStats.villagersZombified++;
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

    // ==========================================================
    // PLAGEN-MANAGER
    // ==========================================================
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
      }
    };

    if (isLoadedFromSave && game._pendingPlagueData) {
      plagueManager.restoreFromSave(game._pendingPlagueData, performance.now());
      game._pendingPlagueData = null;
    } else if (isLoadedFromSave) {
      plagueManager.restoreFromSave(null, performance.now());
    }

    // ==========================================================
    // FEUER-MANAGER
    // ==========================================================
    const fireManager = new Game.FireManager(world, vm, economy);
    game.fireManager = fireManager;

    fireManager.onFireOutbreak = (building) => {
      game.paused = true;
      if (firePopup) {
        firePopup.classList.remove('hidden');
        
        const gotoBtn = document.getElementById('firePopupGoto');
        if (gotoBtn) {
          const newBtn = gotoBtn.cloneNode(true);
          gotoBtn.parentNode.replaceChild(newBtn, gotoBtn);
          newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            firePopup.classList.add('hidden');
            game.paused = false;
            
            const ts = renderer.tileSize;
            const cx = building.x + (building.w || 1) / 2;
            const cy = building.y + (building.h || 1) / 2;
            renderer.camera.x = cx * ts - (window.innerWidth / renderer.camera.zoom) / 2;
            renderer.camera.y = cy * ts - (window.innerHeight / renderer.camera.zoom) / 2;
            renderer.clampCamera();
          });
        }
      }
    };

    if (isLoadedFromSave && game._pendingFireData) {
      fireManager.restoreFromSave(game._pendingFireData, performance.now());
      game._pendingFireData = null;
    }

    // ==========================================================
    // ERDBEBEN-MANAGER
    // ==========================================================
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
      
      // Debug-Fenster und Feuer-Log schließen
      if (debugWindow) debugWindow.classList.add('hidden');
      if (Game.UI && typeof Game.UI._stopFireLog === 'function') {
        Game.UI._stopFireLog();
      }
    }

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
            let assigned = 0;
            for (const v of vm.villagers.values()) {
              if (v.job === 'warrior' && assigned < count && v.state !== 'vfightback') {
                v.state = 'vfightback';
                v.hidden = false;
                v.asset = 'images/villager-krieger-rot.webp';
                assigned++;
              }
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
          bindPauseButton(b);
          bindRaidButtons();
          bindArrowStopInput(b);
          bindAutosaveCheckbox();
          
          const saveGameBtn = document.getElementById('saveGameBtn');
          if (saveGameBtn) saveGameBtn.addEventListener('click', () => handleSave(false));

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
      bindRaidButtons();
      bindArrowStopInput(selectedBuilding);
      bindAutosaveCheckbox();
      
      const saveGameBtn = document.getElementById('saveGameBtn');
      if (saveGameBtn) saveGameBtn.addEventListener('click', () => handleSave(false));

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

    // ==========================================================
    // VERSTECKTES DEBUG-MENÜ INITIALISIEREN
    // ==========================================================
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
      game.raiderCombat = Game.RaiderCombat.create(game, world, vm, raiderVillage, renderer, audioManager);
      renderer.raiderVillage = raiderVillage;
      world._raiderVillage = raiderVillage;
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
      game.raiderCombat = Game.RaiderCombat.create(game, world, vm, rv, renderer, audioManager);
      renderer.raiderVillage = rv;
      world._raiderVillage = rv;

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
      game.raiderCombat = Game.RaiderCombat.create(game, world, vm, rv, renderer, audioManager);
      renderer.raiderVillage = rv;
      world._raiderVillage = rv;

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

    function loop(now) {
      if (game.paused) {
        lastFrameTime = now;
        requestAnimationFrame(loop);
        return;
      }

      const dt = Math.min(now - lastFrameTime, 100);
      lastFrameTime = now;

      ticker.update(dt);

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
        const hasRaiderAttack = game.raiderVillage && game.raiderVillage.attackState;
        elThreatRaider.classList.toggle('hidden', !hasRaiderAttack);
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
window.Game = window.Game || {};

// ==========================================================
// Globaler Game-State (Daten + Methoden, KEINE DOM-Referenzen)
// ==========================================================
window.game = {
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

      targets.forEach((b, index) => {
        setTimeout(() => {
          b._ruinExplosion = {
            startTime: performance.now(),
            duration: EXPLOSION_DURATION
          };

          if (window.audioManager) window.audioManager.playOneShot('audio/explosion.mp3');

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
        const eqHousesDestroyed = document.getElementById('eqHousesDestroyed');
        const eqVillagersDead = document.getElementById('eqVillagersDead');
        const eqResourcesLost = document.getElementById('eqResourcesLost');
        const earthquakePopup = document.getElementById('earthquakePopup');

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

Game.state = window.game;
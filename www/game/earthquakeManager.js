window.Game = window.Game || {};

Game.EarthquakeManager = class EarthquakeManager {
  constructor(world, vm, economy) {
    this.world = world;
    this.vm = vm;
    this.economy = economy;

    this.FIRST_MIN_MS = 60 * 60 * 1000;    // Frühestens nach 60 Minuten
    this.INTERVAL_MIN_MS = 60 * 60 * 1000; // Danach alle 60-90 Minuten
    this.INTERVAL_MAX_MS = 90 * 60 * 1000;

    this.DESTROY_CHANCE_MIN = 0.20; // 20% der Gebäude
    this.DESTROY_CHANCE_MAX = 0.35; // 35% der Gebäude
    this.RESOURCE_LOSS_FRACTION = 0.20; // 20% der Rohstoffe
    this.VILLAGER_LOSS_FRACTION = 0.10; // 10% der Einwohner

    this.nextEarthquakeAt = 0;
    this.sacrificed = false; // Wurde geopfert?

    this._started = false;
    this._lastUpdateTime = 0;
    
    // Wird gesetzt, während das Erdbeben visuell abläuft
    this.isActive = false;
  }

  start(now) {
    if (this._started) return;
    this._started = true;
    this._lastUpdateTime = now;
    this.nextEarthquakeAt = now + this.FIRST_MIN_MS;
  }

  update(now) {
    if (!this._started || this.sacrificed || this.isActive) return;
    if (this.world.castleId === null) return;

    const dt = Math.max(0, now - this._lastUpdateTime);
    this._lastUpdateTime = now;

    // Timer pausieren, wenn ein Drache aktiv ist
    if (this.world.dragonAttackActive && this.world._dragonManager && this.world._dragonManager.dragon) {
      if (this.nextEarthquakeAt > now - dt) {
        this.nextEarthquakeAt += dt;
      }
      return;
    }

    if (now >= this.nextEarthquakeAt) {
      this.triggerEarthquake(now);
    }
  }

  triggerEarthquake(now) {
    if (this.isActive || this.sacrificed) return;
    this.isActive = true;

    // 1. Alle anderen Timer zurücksetzen
    this._resetAllOtherTimers(now);

    // 2. Zufälliges Ziel bestimmen
    const allBuildings = Array.from(this.world.buildings.values());
    const validBuildings = allBuildings.filter(b => b.built && !b.ruined && b.def.id !== 'castle');
    
    const chance = this.DESTROY_CHANCE_MIN + Math.random() * (this.DESTROY_CHANCE_MAX - this.DESTROY_CHANCE_MIN);
    const buildingsToDestroyCount = Math.floor(validBuildings.length * chance);
    
    validBuildings.sort(() => Math.random() - 0.5);
    const targets = validBuildings.slice(0, buildingsToDestroyCount);

    // 3. Einwohner töten
    const allVillagers = Array.from(this.vm.villagers.values());
    const villagersToKillCount = Math.floor(allVillagers.length * this.VILLAGER_LOSS_FRACTION);
    allVillagers.sort(() => Math.random() - 0.5);
    const deadVillagers = allVillagers.slice(0, villagersToKillCount);
    
    deadVillagers.forEach(v => {
      if (this.vm.villagers.has(v.id)) {
        this.vm.killVillager(v);
      }
    });

    // 4. Ressourcen vernichten
    let resourcesLost = 0;
    const keepFraction = 1 - this.RESOURCE_LOSS_FRACTION;
    for (const k in this.economy.res) {
      const before = this.economy.res[k] || 0;
      const after = Math.floor(before * keepFraction);
      resourcesLost += (before - after);
      this.economy.res[k] = after;
    }
    if (this.economy.onChange) this.economy.onChange();

    // 5. Feuer auslösen (Nicht auf dem Schloss)
    let fireTarget = null;
    if (window.Game.state && window.Game.state.fireManager) {
      const fireManager = window.Game.state.fireManager;
      fireTarget = targets.length > 0 
        ? targets[Math.floor(Math.random() * targets.length)]
        : validBuildings.length > 0 ? validBuildings[0] : null;
        
      if (fireTarget && !fireTarget.ruined) {
        fireManager._startFire(now, fireTarget);
      } else {
        const remaining = validBuildings.find(b => !b.ruined);
        if (remaining) fireManager._startFire(now, remaining);
      }
    }

    // 6. Drache in Flucht versetzen
    if (this.world._dragonManager) {
      const dm = this.world._dragonManager;
      if (dm.dragon) {
        dm.dragon.state = 'escaping';
        dm.dragon.targetBuildingId = null;
        console.log('🐉 Drache flieht wegen des Erdbebens!');
      }
    }

    // 7. Räuberlager vernichten
    if (this.world._raiderVillage && !this.world._raiderVillage.isDestroyed) {
      this.world._raiderVillage._finalizeDestroyVillage(now);
    }

    // 8. Nächsten Timer planen
    const rnd = this.INTERVAL_MIN_MS + Math.random() * (this.INTERVAL_MAX_MS - this.INTERVAL_MIN_MS);
    this.nextEarthquakeAt = now + rnd;

    // 9. Animation an main.js übergeben (UI + Explosionen)
    if (window.Game.state && window.Game.state.playEarthquakeAnimation) {
      window.Game.state.playEarthquakeAnimation(targets, villagersToKillCount, resourcesLost, () => {
        this.isActive = false;
      });
    } else {
      this.isActive = false;
    }
  }

  _resetAllOtherTimers(now) {
    if (window.Game.state) {
      const gs = window.Game.state;
      
      if (gs.fireManager) {
        gs.fireManager._lastUpdateTime = now;
        gs.fireManager._scheduleNext(now);
      }
      
      if (gs.dragonManager) {
        gs.dragonManager._lastUpdateTime = now;
        gs.dragonManager.nextSpawnAt = now + gs.dragonManager.firstSpawnDelayMs;
      }
      
      if (gs.plagueManager) {
        gs.plagueManager._lastUpdateTime = now;
        gs.plagueManager._scheduleNext(now);
      }
    }
  }

  removeFromActiveLists(b) {
    const lists = [
      'houses', 'fullStorages', 'recipeBuildings', 'fishConsumers',
      'generatingBuildings', 'warriorBuildings', 'dropoffBuildings',
      'producingBuildings', 'beerBuildings', 'arrowBuildings', 'animatedBuildings'
    ];
    for (const listName of lists) {
      const list = this.world[listName];
      if (Array.isArray(list)) {
        const idx = list.indexOf(b);
        if (idx !== -1) list.splice(idx, 1);
      }
    }
    this.world.freeJobs.delete(b);

    if (b.workerId !== null) {
      const v = this.vm.villagers.get(b.workerId);
      if (v) {
        v.job = 'free';
        v.state = 'idle';
        v.workplaceId = null;
        v.task = null;
        v.hidden = true;
      }
      b.workerId = null;
    }
    if (b.warriorSlots) {
      for (let i = 0; i < b.warriorSlots.length; i++) {
        const wid = b.warriorSlots[i];
        if (wid !== null) {
          const v = this.vm.villagers.get(wid);
          if (v) {
            v.job = 'free';
            v.state = 'idle';
            v.workplaceId = null;
            v.warriorBuildingId = null;
            v.warriorSlotIndex = -1;
            v.task = null;
            v.hidden = true;
          }
          b.warriorSlots[i] = null;
        }
      }
    }
    if (b.recipeFetchWorkerId !== null) b.recipeFetchWorkerId = null;
  }

  calculateSacrificeCost() {
    const cost = {};
    let total = 0;
    for (const k in this.economy.res) {
      const amount = Math.floor((this.economy.res[k] || 0) * 0.15);
      if (amount > 0) {
        cost[k] = amount;
        total += amount;
      }
    }
    return { cost, total };
  }

  offerSacrifice() {
    const { cost, total } = this.calculateSacrificeCost();
    if (total === 0) return false;

    for (const k in cost) {
      this.economy.res[k] -= cost[k];
    }
    if (this.economy.onChange) this.economy.onChange();

    this.sacrificed = true;
    this._started = false; // Timer aus für immer
    console.log("🕊️ Die Götter wurden besänftigt. Es wird keine Erdbeben mehr geben.");
    return true;
  }

  serialize(now) {
    return {
      started: this._started,
      nextEarthquakeAtRemaining: this.nextEarthquakeAt > 0 ? Math.max(0, this.nextEarthquakeAt - now) : 0,
      sacrificed: this.sacrificed
    };
  }

  restoreFromSave(data, now) {
    if (!data) {
      this._started = false;
      this.nextEarthquakeAt = 0;
      this.sacrificed = false;
      return;
    }
    this._started = !!data.started;
    this.nextEarthquakeAt = data.nextEarthquakeAtRemaining > 0
      ? now + data.nextEarthquakeAtRemaining
      : 0;
    this.sacrificed = !!data.sacrificed;
  }
};
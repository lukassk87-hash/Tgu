window.Game = window.Game || {};

Game.PlagueManager = class PlagueManager {
  constructor(world, vm, economy) {
    this.world = world;
    this.vm = vm;
    this.economy = economy;

    this.FIRST_MIN_MS = 30 * 60 * 1000;      // fruehestens nach 30 Minuten
    this.INTERVAL_MIN_MS = 20 * 60 * 1000;   // danach 20-30 Minuten
    this.INTERVAL_MAX_MS = 30 * 60 * 1000;

    this.PIG_DURATION_MS = 180 * 1000;       // Schweinepest: 180 Sekunden
    this.RAT_DURATION_MS = 300 * 1000;       // Rattenplage: 300 Sekunden
    this.DROUGHT_DURATION_MS = 360 * 1000;   // Duerre: 360 Sekunden
    this.INFECTED_MEAT_DURATION_MS = 60 * 1000; // Infiziertes Fleisch: 60 Sekunden Zombie-Spawns

    this.INFECTED_MEAT_SPAWN_INTERVAL = 5000;   // alle 5 Sekunden
    this.INFECTED_MEAT_SPAWN_COUNT = 2;         // 2 Einwohner pro Welle
    this.BUTCHER_CLEANUP_MS = 180 * 1000;       // 180 Sekunden Pause für Schlachter

    this.nextPlagueAt = 0;
    this.activeUntil = 0;
    this.activeType = null;

    this.onOutbreak = null;
    this.onEnd = null;

    this._started = false;
    this._lastUpdateTime = 0;

    // Infiziertes Fleisch
    this._infectedMeatNextSpawn = 0;
    this._infectedMeatSpawnActive = false;
  }

  start(now) {
    if (this._started) return;
    this._started = true;
    this._lastUpdateTime = now;
    this.nextPlagueAt = now + this.FIRST_MIN_MS;
  }

  _scheduleNext(now) {
    const rnd = this.INTERVAL_MIN_MS +
      Math.random() * (this.INTERVAL_MAX_MS - this.INTERVAL_MIN_MS);
    this.nextPlagueAt = now + rnd;
  }

  isActive(now) {
    return this.activeUntil > 0 && now < this.activeUntil;
  }

  update(now) {
    if (!this._started) return;
    if (this.world.castleId === null) return;

    this._lastUpdateTime = now;

    // Ende der aktiven Plage pruefen
    if (this.activeUntil > 0 && now >= this.activeUntil) {
      const endedType = this.activeType;

      if (endedType === 'infectedMeat') {
        this._infectedMeatSpawnActive = false;
      }

      this.activeUntil = 0;
      this.activeType = null;
      if (this.onEnd) this.onEnd(endedType);
    }

    // Ausbruch pruefen
    if (this.activeUntil === 0 && this.nextPlagueAt > 0 && now >= this.nextPlagueAt) {
      this._outbreak(now);
    }

    // Infiziertes Fleisch: Spawn-Wellen
    if (this._infectedMeatSpawnActive &&
        this.activeType === 'infectedMeat' &&
        now >= this._infectedMeatNextSpawn) {
      this._spawnInfectedVillagers(now);
      this._infectedMeatNextSpawn = now + this.INFECTED_MEAT_SPAWN_INTERVAL;
    }
  }

  _outbreak(now) {
    // 4 Plagen gleichverteilt
    const roll = Math.random();

    if (roll < 0.25) {
      this.activeType = 'pig';
      this.activeUntil = now + this.PIG_DURATION_MS;
      this._scheduleNext(this.activeUntil);
      this._triggerPigPlague();
    } else if (roll < 0.5) {
      this.activeType = 'rat';
      this.activeUntil = now + this.RAT_DURATION_MS;
      this._scheduleNext(this.activeUntil);
      this._triggerRatPlague();
    } else if (roll < 0.75) {
      this.activeType = 'drought';
      this.activeUntil = now + this.DROUGHT_DURATION_MS;
      this._scheduleNext(this.activeUntil);
      this._triggerDrought();
    } else {
      this.activeType = 'infectedMeat';
      this.activeUntil = now + this.INFECTED_MEAT_DURATION_MS;
      this._scheduleNext(this.activeUntil);
      this._triggerInfectedMeat(now);
    }

    if (this.onOutbreak) this.onOutbreak(this.activeType);
  }

  // ==========================================================
  // SCHWEINEPEST
  // ==========================================================
  _triggerPigPlague() {
    const meat = Math.floor(this.economy.res.meat || 0);
    this.economy.res.meat = Math.floor(meat / 2);
    if (this.economy.onChange) this.economy.onChange();
    this._stopAllPigFarmers();
  }

  _stopAllPigFarmers() {
    for (const b of this.world.buildings.values()) {
      if (b.def.id !== 'pigFarm') continue;
      if (!b.built || b.ruined) continue;

      b.recipeTimer = 0;

      const worker = b.workerId !== null ? this.vm.villagers.get(b.workerId) : null;
      if (!worker) continue;

      worker.harvestQueue = [];
      worker._pendingStorageGain = 0;
      worker.harvestHitCount = 0;
      worker.harvestTotalCount = 0;
      worker.harvestExclude = null;

      if (b.recipeFetchWorkerId === worker.id) {
        b.recipeFetchWorkerId = null;
      }
      worker.recipeCarrying = null;

      worker.state = 'idle';
      worker.task = 'go_home';
      worker.hidden = false;
      const home = this.world.buildings.get(worker.homeId) ||
                   this.world.buildings.get(this.world.castleId);
      if (home) {
        this.vm.startMove(worker, home.x, home.y + (home.h || 1) - 1);
      }
    }
  }

  // ==========================================================
  // RATTENPLAGE
  // ==========================================================
  _triggerRatPlague() {
    const bread = Math.floor(this.economy.res.bread || 0);
    this.economy.res.bread = Math.floor(bread / 2);
    if (this.economy.onChange) this.economy.onChange();

    for (const b of this.world.buildings.values()) {
      if (b.def.id !== 'bakery') continue;
      if (!b.built || b.ruined) continue;
      b.recipeTimer = 0;
    }
  }

  // ==========================================================
  // DUERRE
  // ==========================================================
  _triggerDrought() {
    for (const b of this.world.buildings.values()) {
      if (b.def.id !== 'farm') continue;
      if (!b.built || b.ruined) continue;

      const worker = b.workerId !== null ? this.vm.villagers.get(b.workerId) : null;
      if (!worker) continue;

      worker.harvestQueue = [];
      worker._pendingStorageGain = 0;
      worker.harvestHitCount = 0;
      worker.harvestTotalCount = 0;
      worker.harvestExclude = null;

      worker.state = 'idle';
      worker.task = 'go_home';
      worker.hidden = false;
      const home = this.world.buildings.get(worker.homeId) ||
                   this.world.buildings.get(this.world.castleId);
      if (home) {
        this.vm.startMove(worker, home.x, home.y + (home.h || 1) - 1);
      }
    }
  }

  // ==========================================================
  // INFIZIERTES FLEISCH
  // ==========================================================
  _triggerInfectedMeat(now) {
    // 1) Gesamten Fleischvorrat vernichten
    this.economy.res.meat = 0;
    if (this.economy.onChange) this.economy.onChange();

    // 2) Alle Schlachter pausieren (180 Sekunden Reinigung)
    this._stopAllButchers();

    // 3) Spawn-Wellen aktivieren
    this._infectedMeatSpawnActive = true;
    this._infectedMeatNextSpawn = now + this.INFECTED_MEAT_SPAWN_INTERVAL;
  }

  _stopAllButchers() {
    for (const b of this.world.buildings.values()) {
      if (b.def.id !== 'butcher') continue;
      if (!b.built || b.ruined) continue;

      b.recipeTimer = 0;
      b.paused = true;

      if (b._plagueUnpauseAt) clearTimeout(b._plagueUnpauseAt);
      b._plagueUnpauseAt = setTimeout(() => {
        if (!b.ruined) b.paused = false;
        b._plagueUnpauseAt = null;
      }, this.BUTCHER_CLEANUP_MS);

      const worker = b.workerId !== null ? this.vm.villagers.get(b.workerId) : null;
      if (!worker) continue;

      worker.harvestQueue = [];
      worker._pendingStorageGain = 0;
      worker.harvestHitCount = 0;
      worker.harvestTotalCount = 0;
      worker.harvestExclude = null;

      if (b.recipeFetchWorkerId === worker.id) {
        b.recipeFetchWorkerId = null;
      }
      worker.recipeCarrying = null;

      worker.state = 'idle';
      worker.task = 'go_home';
      worker.hidden = false;
      const home = this.world.buildings.get(worker.homeId) ||
                   this.world.buildings.get(this.world.castleId);
      if (home) {
        this.vm.startMove(worker, home.x, home.y + (home.h || 1) - 1);
      }
    }
  }

  _spawnInfectedVillagers(now) {
    // Alle lebenden Einwohner sammeln
    const candidates = [];
    for (const v of this.vm.villagers.values()) {
      if (!v) continue;
      if (v.state === 'dead') continue;
      candidates.push(v);
    }

    if (candidates.length === 0) return;

    // Zufällig 2 auswählen (oder weniger, falls nicht genug da sind)
    const count = Math.min(this.INFECTED_MEAT_SPAWN_COUNT, candidates.length);
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * candidates.length);
      const v = candidates.splice(idx, 1)[0];

      // Position merken
      const infectX = v.renderX !== undefined ? v.renderX : v.x;
      const infectY = v.renderY !== undefined ? v.renderY : v.y;

      // Einwohner töten
      if (Game.state && Game.state.enemyStats) {
        Game.state.enemyStats.villagersZombified++;
      }
      this.vm.killVillager(v);

      // An der Position einen Zombie spawnen
      const zm = window.Game.state && window.Game.state.zombieManager;
      if (zm) {
        zm.spawnZombieAt(infectX, infectY);
      }
    }
  }

  // ==========================================================
  // HILFSFUNKTIONEN
  // ==========================================================
  getRecipeAmountMultiplier(building) {
    if (!this.isActive(performance.now())) return 1.0;
    if (this.activeType !== 'rat') return 1.0;
    if (building.def.id !== 'bakery') return 1.0;
    return 0.5;
  }

  isBuildingDisabled(building) {
    if (!this.isActive(performance.now())) return false;
    if (this.activeType !== 'pig') return false;
    if (building.def.id !== 'pigFarm') return false;
    return true;
  }

  // === Savegame ===
  serialize(now) {
    return {
      started: this._started,
      nextPlagueAtRemaining: this.nextPlagueAt > 0 ? Math.max(0, this.nextPlagueAt - now) : 0,
      activeUntilRemaining: this.activeUntil > 0 ? Math.max(0, this.activeUntil - now) : 0,
      activeType: this.activeType,
      infectedMeatSpawnActive: this._infectedMeatSpawnActive,
      infectedMeatNextSpawnRemaining: this._infectedMeatNextSpawn > 0
        ? Math.max(0, this._infectedMeatNextSpawn - now)
        : 0
    };
  }

  restoreFromSave(data, now) {
    if (data) {
      this._started = !!data.started;
      this._lastUpdateTime = now;

      this.nextPlagueAt = data.nextPlagueAtRemaining > 0
        ? now + data.nextPlagueAtRemaining
        : 0;
      this.activeUntil = data.activeUntilRemaining > 0
        ? now + data.activeUntilRemaining
        : 0;
      this.activeType = data.activeType || null;

      if (this.activeType === 'infectedMeat' && data.infectedMeatSpawnActive) {
        this._infectedMeatSpawnActive = true;
        this._infectedMeatNextSpawn = data.infectedMeatNextSpawnRemaining > 0
          ? now + data.infectedMeatNextSpawnRemaining
          : now + this.INFECTED_MEAT_SPAWN_INTERVAL;
      } else {
        this._infectedMeatSpawnActive = false;
        this._infectedMeatNextSpawn = 0;
      }

      if (!this._started && this.world.castleId !== null) {
        this.start(now);
      }
      return;
    }

    this._started = false;
    this._lastUpdateTime = now;
    this.nextPlagueAt = 0;
    this.activeUntil = 0;
    this.activeType = null;
    this._infectedMeatSpawnActive = false;
    this._infectedMeatNextSpawn = 0;

    if (this.world.castleId !== null) {
      this.start(now);
    }
  }
};
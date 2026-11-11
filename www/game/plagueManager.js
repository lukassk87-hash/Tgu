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

    this.nextPlagueAt = 0;      // absolute Zeit (performance.now()-Basis)
    this.activeUntil = 0;       // 0 = keine aktive Plage
    this.activeType = null;     // 'pig', 'rat' oder 'drought'

    this.onOutbreak = null;     // Callback fuer Infofenster (bekommt den Typ)
    this.onEnd = null;

    this._started = false;
    this._lastUpdateTime = 0;
  }

  // Wird aufgerufen, sobald das Schloss steht (Timer starten)
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

  // Pro Frame aufrufen
  update(now) {
    if (!this._started) return;
    if (this.world.castleId === null) return;

    // Timer läuft gnadenlos durch, kein Pausieren mehr
    this._lastUpdateTime = now;

    // Ende der aktiven Plage pruefen
    if (this.activeUntil > 0 && now >= this.activeUntil) {
      const endedType = this.activeType;
      this.activeUntil = 0;
      this.activeType = null;
      if (this.onEnd) this.onEnd(endedType);
    }

    // Ausbruch pruefen
    if (this.activeUntil === 0 && this.nextPlagueAt > 0 && now >= this.nextPlagueAt) {
      this._outbreak(now);
    }
  }

  _outbreak(now) {
    // Zufaellig auswuerfeln: 1/3 Chance fuer jede Plage
    const roll = Math.random();

    if (roll < 1/3) {
      this.activeType = 'pig';
      this.activeUntil = now + this.PIG_DURATION_MS;
      this._scheduleNext(this.activeUntil);
      this._triggerPigPlague();
    } else if (roll < 2/3) {
      this.activeType = 'rat';
      this.activeUntil = now + this.RAT_DURATION_MS;
      this._scheduleNext(this.activeUntil);
      this._triggerRatPlague();
    } else {
      this.activeType = 'drought';
      this.activeUntil = now + this.DROUGHT_DURATION_MS;
      this._scheduleNext(this.activeUntil);
      this._triggerDrought();
    }

    // Callback fuer Infofenster
    if (this.onOutbreak) this.onOutbreak(this.activeType);
  }

  // ==========================================================
  // SCHWEINEPEST (Bauern hoeren auf, Fleisch halbiert)
  // ==========================================================
  _triggerPigPlague() {
    // 1) Fleisch halbieren
    const meat = Math.floor(this.economy.res.meat || 0);
    this.economy.res.meat = Math.floor(meat / 2);
    if (this.economy.onChange) this.economy.onChange();

    // 2) Alle Schweinebauern sofort stoppen
    this._stopAllPigFarmers();
  }

  _stopAllPigFarmers() {
    for (const b of this.world.buildings.values()) {
      if (b.def.id !== 'pigFarm') continue;
      if (!b.built || b.ruined) continue;

      // Laufende Rezeptarbeit / Timer zuruecksetzen
      b.recipeTimer = 0;

      const worker = b.workerId !== null ? this.vm.villagers.get(b.workerId) : null;
      if (!worker) continue;

      // Laufende Rezept-Zulieferung / Bewegung sofort abbrechen
      worker.harvestQueue = [];
      worker._pendingStorageGain = 0;
      worker.harvestHitCount = 0;
      worker.harvestTotalCount = 0;
      worker.harvestExclude = null;

      if (b.recipeFetchWorkerId === worker.id) {
        b.recipeFetchWorkerId = null;
      }
      worker.recipeCarrying = null;

      // Zurueck zum Haus (Variante A: sofort)
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
  // RATTENPLAGE (Baecker arbeiten weiter, aber Output halbiert,
  // Brot-Bestand sofort halbiert)
  // ==========================================================
  _triggerRatPlague() {
    // 1) Brot halbieren
    const bread = Math.floor(this.economy.res.bread || 0);
    this.economy.res.bread = Math.floor(bread / 2);
    if (this.economy.onChange) this.economy.onChange();

    // 2) Baecker-Timer zuruecksetzen (aber sie arbeiten weiter)
    for (const b of this.world.buildings.values()) {
      if (b.def.id !== 'bakery') continue;
      if (!b.built || b.ruined) continue;
      b.recipeTimer = 0;
    }
  }

  // ==========================================================
  // DUERRE (Bauern produzieren kein Getreide)
  // ==========================================================
  _triggerDrought() {
    // 1) Alle Bauern sofort stoppen (sie warten auf Regen)
    for (const b of this.world.buildings.values()) {
      if (b.def.id !== 'farm') continue;
      if (!b.built || b.ruined) continue;

      const worker = b.workerId !== null ? this.vm.villagers.get(b.workerId) : null;
      if (!worker) continue;

      // Laufende Ernte sofort abbrechen
      worker.harvestQueue = [];
      worker._pendingStorageGain = 0;
      worker.harvestHitCount = 0;
      worker.harvestTotalCount = 0;
      worker.harvestExclude = null;

      // Zurueck zum Haus (Variante A: sofort)
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

  /**
   * Wird von gameloop.js aufgerufen, um bei aktiver Rattenplage
   * den Output der Baecker zu halbieren.
   */
  getRecipeAmountMultiplier(building) {
    if (!this.isActive(performance.now())) return 1.0;
    if (this.activeType !== 'rat') return 1.0;
    if (building.def.id !== 'bakery') return 1.0;
    return 0.5;
  }

  /**
   * Wird von gameloop.js aufgerufen, um bei aktiver Schweinepest
   * die Schweinewirte komplett zu blockieren.
   */
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
      activeType: this.activeType
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
      
      // Harte Korrektur: Wenn das Schloss steht, aber der Timer nicht läuft, starten wir ihn neu
      if (!this._started && this.world.castleId !== null) {
        this.start(now);
      }
      return;
    }

    // Fallback, falls gar keine Daten da sind (ganz altes Savegame)
    this._started = false;
    this._lastUpdateTime = now;
    this.nextPlagueAt = 0;
    this.activeUntil = 0;
    this.activeType = null;

    if (this.world.castleId !== null) {
      this.start(now);
    }
  }
};
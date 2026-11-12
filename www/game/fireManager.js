window.Game = window.Game || {};

Game.FireManager = class FireManager {
  constructor(world, vm, economy) {
    this.world = world;
    this.vm = vm;
    this.economy = economy;

    this.GRACE_PERIOD_MS = 15 * 60 * 1000;
    this.MIN_INTERVAL_MS = 150 * 1000;
    this.MAX_INTERVAL_MS = 600 * 1000;

    this.SECONDS_PER_TILE_BURN = 15;
    this.SECONDS_PER_TILE_SPREAD = 7.5;

    this.MIN_BURN_TIME_MS = 60 * 1000;
    this.MIN_SPREAD_TIME_MS = 30 * 1000;

    this.FIRE_SPREAD_MIN = 1;
    this.FIRE_SPREAD_MAX = 3;
    this.FIRE_SPREAD_RADIUS = 4;

    this.EXTINGUISH_LINGER_MS = 7500;

    this.gracePeriodEndsAt = 0;
    this.nextFireAt = 0;
    this.activeFires = [];

    this.onFireOutbreak = null;
    this.onFireEnd = null;

    this._started = false;
    this._lastUpdateTime = 0;
  }

  _getFireTimes(building) {
    const tiles = Math.max(1, Math.floor((building.w || 1) * (building.h || 1)));
    const burnTimeMs = Math.max(this.MIN_BURN_TIME_MS, tiles * this.SECONDS_PER_TILE_BURN * 1000);
    const spreadTimeMs = Math.max(this.MIN_SPREAD_TIME_MS, tiles * this.SECONDS_PER_TILE_SPREAD * 1000);
    return { burnTimeMs, spreadTimeMs };
  }

  getNeededWater(building) {
    if (!building) return 0;
    const w = building.w || 1;
    const h = building.h || 1;
    const tiles = Math.max(1, Math.floor(w * h));
    return tiles * 5;
  }

  getDeliveredWater(building) {
    const fire = this.activeFires.find(f => f.building === building);
    if (!fire) return 0;
    return fire.waterDelivered || 0;
  }

  getActiveWorkersFor(building) {
    const fire = this.activeFires.find(f => f.building === building);
    if (!fire) return 0;
    return (fire.queue || []).length;
  }

  getRemainingWaterNeeded(building, carryAmount) {
    const fire = this.activeFires.find(f => f.building === building);
    if (!fire) return 0;
    const needed = this.getNeededWater(building);
    const delivered = fire.waterDelivered || 0;
    const incoming = (fire.queue || []).length * carryAmount;
    return Math.max(0, needed - delivered - incoming);
  }

  enqueueWorker(building, villagerId) {
    const fire = this.activeFires.find(f => f.building === building);
    if (!fire) return false;
    if (!fire.queue) fire.queue = [];
    if (fire.queue.indexOf(villagerId) !== -1) return false;
    fire.queue.push(villagerId);
    return true;
  }

  dequeueWorker(building, villagerId) {
    const fire = this.activeFires.find(f => f.building === building);
    if (!fire || !fire.queue) return;
    const idx = fire.queue.indexOf(villagerId);
    if (idx !== -1) fire.queue.splice(idx, 1);
  }

  isExtinguished(building) {
    const fire = this.activeFires.find(f => f.building === building);
    if (!fire) return false;
    return (fire.extinguishedAt || 0) > 0;
  }

  completeWorker(building, villagerId, waterAmount) {
    const fire = this.activeFires.find(f => f.building === building);
    if (!fire) return false;
    
    if (!fire.waterDelivered) fire.waterDelivered = 0;
    fire.waterDelivered += waterAmount;
    
    if (fire.queue) {
      const idx = fire.queue.indexOf(villagerId);
      if (idx !== -1) fire.queue.splice(idx, 1);
    }

    if (fire.waterDelivered >= this.getNeededWater(building) && !fire.extinguishedAt) {
      fire.extinguishedAt = performance.now();
      building.paused = false;
      building._lastExtinguishTime = performance.now();
      this._resetFirefightersFor(building.id);
      if (this.onFireEnd) this.onFireEnd(building);
      return true;
    }
    return false;
  }

  isWaterNeededByBakeries() {
    if (!this.economy || !this.world) return false;
    if ((this.economy.res.water || 0) > 20) return false;
    for (const b of this.world.recipeBuildings) {
      if (!b.built || b.ruined || b.paused) continue;
      const inputs = b.def.recipe && b.def.recipe.inputs;
      if (!inputs || !inputs.water) continue;
      if ((b.recipeStorage.water || 0) === 0) return true;
    }
    return false;
  }

  start(now) {
    if (this._started) return;
    this._started = true;
    this._lastUpdateTime = now;
    this.gracePeriodEndsAt = now + this.GRACE_PERIOD_MS;
    this._scheduleNext(now + this.GRACE_PERIOD_MS);
  }

  _scheduleNext(fromTime) {
    const rnd = this.MIN_INTERVAL_MS + Math.random() * (this.MAX_INTERVAL_MS - this.MIN_INTERVAL_MS);
    this.nextFireAt = fromTime + rnd;
  }

  update(now) {
    if (!this._started) return;
    if (this.world.castleId === null) return;

    this._lastUpdateTime = now;

    if (this.activeFires.length === 0 && now >= this.nextFireAt) {
      this._tryOutbreak(now);
    }

    for (let i = this.activeFires.length - 1; i >= 0; i--) {
      const fire = this.activeFires[i];
      const b = fire.building;

      if (!this.world.buildings.has(b.id) || b.ruined) {
        this.activeFires.splice(i, 1);
        this._resetFirefightersFor(b.id);
        if (this.activeFires.length === 0) {
          this._scheduleNext(now);
        }
        continue;
      }

      if (fire.extinguishedAt) {
        if (now - fire.extinguishedAt >= this.EXTINGUISH_LINGER_MS) {
          this.activeFires.splice(i, 1);
          if (this.activeFires.length === 0) {
            this._scheduleNext(now);
          }
        }
        continue;
      }

      const { burnTimeMs, spreadTimeMs } = this._getFireTimes(b);

      if (!fire.spreadDone && now - fire.startedAt >= spreadTimeMs) {
        fire.spreadDone = true;
        this._spreadFire(now, fire);
      }

      if (now - fire.startedAt >= burnTimeMs) {
        if (b.def.id === 'castle') {
          this._handleCastleBurnComplete(b);
        } else {
          this._ruinBuilding(b);
        }
        this.activeFires.splice(i, 1);
        this._resetFirefightersFor(b.id);
        if (this.activeFires.length === 0) {
          this._scheduleNext(now);
        }
      }
    }
  }

  _tryOutbreak(now) {
    const candidates = [];
    for (const b of this.world.buildings.values()) {
      if (!b.built) continue;
      if (b.ruined) continue;
      if (b.isBeingRepaired) continue;
      if (b.def.id === 'fireStation') continue;
      if (b.def.id === 'castle') continue;
      candidates.push(b);
    }

    if (candidates.length === 0) {
      this._scheduleNext(now);
      return;
    }

    const target = candidates[Math.floor(Math.random() * candidates.length)];
    this._startFire(now, target);
  }

  _startFire(now, building) {
    const fire = {
      building,
      startedAt: now,
      spreadDone: false,
      waterDelivered: 0,
      queue: [],
      extinguishedAt: 0
    };
    this.activeFires.push(fire);

    building.paused = true;

    // NEU: Alten Löschzeitstempel zurücksetzen, damit ein neues Feuer nicht
    // mit einem alten Zeitstempel verwechselt wird (wichtig für savegame/fixFutureTimestamps).
    building._lastExtinguishTime = 0;

    const eqActive = window.Game.state &&
                     window.Game.state.earthquakeManager &&
                     window.Game.state.earthquakeManager.isActive;

    if (this.onFireOutbreak && !eqActive) {
      this.onFireOutbreak(building);
    }
  }

  _spreadFire(now, sourceFire) {
    const sourceB = sourceFire.building;
    const sx = sourceB.x + (sourceB.w || 1) / 2;
    const sy = sourceB.y + (sourceB.h || 1) / 2;

    const candidates = [];
    for (const b of this.world.buildings.values()) {
      if (b === sourceB) continue;
      if (!b.built || b.ruined || b.isBeingRepaired) continue;
      if (b.def.id === 'fireStation') continue;
      if (this.activeFires.some(f => f.building === b)) continue;

      const bx = b.x + (b.w || 1) / 2;
      const by = b.y + (b.h || 1) / 2;
      const distSq = (bx - sx) ** 2 + (by - sy) ** 2;
      if (distSq <= this.FIRE_SPREAD_RADIUS ** 2) {
        candidates.push(b);
      }
    }

    if (candidates.length === 0) return;

    const count = Math.min(
      candidates.length,
      this.FIRE_SPREAD_MIN + Math.floor(Math.random() * (this.FIRE_SPREAD_MAX - this.FIRE_SPREAD_MIN + 1))
    );

    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * candidates.length);
      const b = candidates.splice(idx, 1)[0];
      this._startFire(now, b);
    }
  }

  _handleCastleBurnComplete(b) {
    if (!b || b.ruined) return;
    const maxHits = b.def.dragonHits || 3;
    const currentHits = b.dragonHits || 0;
    b.paused = false;

    if (currentHits >= maxHits) {
      if (window.Game && window.Game.state) {
        window.Game.state.paused = true;
        window.Game.state.state = 'gameover';
        alert('💀 GAME OVER\n\nDas Schloss ist abgebrannt.');
      }
      if (this.onFireEnd) this.onFireEnd(b);
      return;
    }

    b.dragonHits = maxHits;

    if (window.Game && window.Game.state && window.Game.state.renderer) {
      window.Game.state.renderer.markStaticDirty(this.world.getBuildingTiles(b));
    }
    if (this.onFireEnd) this.onFireEnd(b);
  }

  _ruinBuilding(b) {
    if (!b || b.ruined) return;

    b.ruined = true;
    b.built = false;
    b.paused = false;
    b.progress = 0;
    b.buildTime = 0;
    b.builderId = null;
    b.ruinAsset = b.def.ruinAsset || 'images/ruine-quadrat.webp';
    b._justRuinedThisTick = true;
    b._lastExtinguishTime = 0;

    const bsIdx = this.world.buildSites.indexOf(b);
    if (bsIdx !== -1) this.world.buildSites.splice(bsIdx, 1);
    this.world.buildSites.push(b);

    this._removeFromActiveLists(b);

    for (const field of (b.fields || [])) {
      const key = field.x + ',' + field.y;
      if (this.world.fieldOwners.get(key) === b.id) this.world.fieldOwners.delete(key);
    }
    b.fields = [];

    this._resetFirefightersFor(b.id);

    if (window.Game && window.Game.state && window.Game.state.renderer) {
      window.Game.state.renderer.markStaticDirty(this.world.getBuildingTiles(b));
    }
    if (this.onFireEnd) this.onFireEnd(b);
  }

  /**
   * Wird aufgerufen, wenn ein Feuer gelöscht wird, eine Ruine entsteht,
   * oder ein Gebäude zerstört wird. Sorgt dafür, dass alle beteiligten
   * Feuerwehrleute sauber zurückgesetzt werden.
   *
   * WICHTIG: Villager in 'extinguish_waiting' werden direkt auf 'working'
   * gesetzt (statt sie umsonst zur Station laufen zu lassen). Die
   * 1000ms-Staffelung wird dabei zurückgesetzt.
   */
  _resetFirefightersFor(buildingId) {
    for (const v of this.vm.villagers.values()) {
      if (v._fireTargetId !== buildingId) continue;
      if (v.state === 'zfighting' || v.state === 'vfighting' || v.state === 'dragon_attack' || 
          v.state === 'attacking_raiders' || v.state === 'vfightback' || v.state === 'vdefend') {
        continue;
      }

      // NEU: Wenn der Villager noch wartet (1000ms-Staffelung läuft),
      // direkt abbrechen. Sonst läuft er umsonst zur Station.
      if (v.state === 'extinguish_waiting') {
        v._fireTargetId = null;
        v._fireWaterCarried = 0;
        v.state = 'working';
        v.task = null;
        v.hidden = true;
        v._fireDispatchAt = 0;
        v._lastFireDispatchTime = 0;
        continue;
      }

      // Normalfall: _fireTargetId wegnehmen, aber State/Task behalten,
      // damit der Villager seinen return_to_station-Task sauber beendet.
      v._fireTargetId = null;
      v._fireWaterCarried = 0;

      // _fireStationX/Y aufräumen, damit sie beim nächsten Einsatz
      // frisch gesetzt werden (gameLoop.js setzt sie beim Dispatch).
      v._fireStationX = 0;
      v._fireStationY = 0;
    }
  }

  _removeFromActiveLists(b) {
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

  getNearestFireTo(x, y, maxRange) {
    let best = null;
    let bestDistSq = maxRange * maxRange;
    for (const fire of this.activeFires) {
      if (fire.extinguishedAt) continue;

      const b = fire.building;
      const bx = b.x + (b.w || 1) / 2;
      const by = b.y + (b.h || 1) / 2;
      const dx = bx - x;
      const dy = by - y;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestDistSq) {
        bestDistSq = d2;
        best = fire;
      }
    }
    return best;
  }

  isBuildingBurning(b) {
    return this.activeFires.some(f => f.building === b && !f.extinguishedAt);
  }

  extinguish(building, amount) {
    return this.completeWorker(building, null, amount);
  }

  serialize(now) {
    return {
      started: this._started,
      gracePeriodEndsAtRemaining: this.gracePeriodEndsAt > 0
        ? Math.max(0, this.gracePeriodEndsAt - now)
        : 0,
      nextFireAtRemaining: this.nextFireAt > 0 ? Math.max(0, this.nextFireAt - now) : 0,
      activeFires: this.activeFires.map(f => ({
        buildingId: f.building.id,
        startedAtRemaining: Math.max(0, now - f.startedAt),
        spreadDone: f.spreadDone,
        waterDelivered: f.waterDelivered || 0,
        queue: f.queue ? [...f.queue] : [],
        extinguishedAtRemaining: f.extinguishedAt > 0
          ? Math.max(0, this.EXTINGUISH_LINGER_MS - (now - f.extinguishedAt))
          : 0
      }))
    };
  }

  restoreFromSave(data, now) {
    if (!data) {
      this._started = false;
      this.gracePeriodEndsAt = 0;
      this.nextFireAt = 0;
      this.activeFires = [];
      return;
    }

    this._started = !!data.started;
    this.gracePeriodEndsAt = (data.gracePeriodEndsAtRemaining !== undefined && data.gracePeriodEndsAtRemaining > 0)
      ? now + data.gracePeriodEndsAtRemaining
      : 0;
    this.nextFireAt = data.nextFireAtRemaining > 0 ? now + data.nextFireAtRemaining : 0;

    this.activeFires = [];
    if (data.activeFires) {
      for (const fData of data.activeFires) {
        const b = this.world.buildings.get(fData.buildingId);
        if (!b || b.ruined) continue;
        b.paused = true;

        // NEU: _lastExtinguishTime beim Laden sauber initialisieren
        // (damit fixFutureTimestamps nicht stolpert und die UI korrekt ist).
        if (b._lastExtinguishTime === undefined) {
          b._lastExtinguishTime = 0;
        }

        this.activeFires.push({
          building: b,
          startedAt: now - (fData.startedAtRemaining || 0),
          spreadDone: !!fData.spreadDone,
          waterDelivered: fData.waterDelivered || 0,
          queue: fData.queue ? [...fData.queue] : [],
          extinguishedAt: fData.extinguishedAtRemaining > 0
            ? now - (this.EXTINGUISH_LINGER_MS - fData.extinguishedAtRemaining)
            : 0
        });
      }
    }
  }
};
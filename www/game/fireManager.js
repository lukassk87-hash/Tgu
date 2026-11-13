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

    // Drosselung: Pro Wache nur alle X ms einen neuen Kämpfer losschicken
    // (damit nicht mehrere Kämpfer gleichzeitig auf ein Feuer rennen)
    this.DISPATCH_COOLDOWN_MS = 500;
    this._lastDispatchTime = new Map(); // buildingId → timestamp

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
    return tiles * 1;
  }

  getDeliveredWater(building) {
    const fire = this.activeFires.find(f => f.building === building);
    if (!fire) return 0;
    return fire.waterDelivered || 0;
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

    // Ausbruch prüfen
    if (this.activeFires.length === 0 && now >= this.nextFireAt) {
      this._tryOutbreak(now);
    }

    // Feuer-Lifecycle (Ausbreitung, Ruine, Verlöschen)
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

    // Feuerwehr-Dispatch: pro Wache das älteste Feuer in Reichweite löschen
    this._dispatchFirefighters(now);
  }

  // ==========================================================
  // NEU: Feuerwehr-Dispatch
  //
  // Pro Feuerwache:
  //   1. Verfügbare Löscher sammeln (state=working, kein task, nicht krank)
  //   2. Ältestes aktives Feuer in Reichweite finden
  //   3. Kämpfer losschicken (mit Cooldown, damit nicht mehrere
  //      gleichzeitig für dasselbe Feuer losrennen)
  //
  // Kein Cache, keine Queue. Alles live berechnet.
  // ==========================================================
  _dispatchFirefighters(now) {
    if (this.activeFires.length === 0) return;

    for (const station of this.world.buildings.values()) {
      if (station.def.id !== 'fireStation') continue;
      if (!station.built || station.ruined || station.paused) continue;
      if (!station.workerIds) continue;

      // Wache Cooldown: nur alle DISPATCH_COOLDOWN_MS einen neuen Kämpfer
      const lastDispatch = this._lastDispatchTime.get(station.id) || 0;
      if (now - lastDispatch < this.DISPATCH_COOLDOWN_MS) continue;

      // Hat die Wache überhaupt Wasser?
      if ((station.storage || 0) <= 0) continue;

      // Ältestes Feuer in Reichweite
      const fire = this._getOldestFireInRange(station);
      if (!fire) continue;

      // Ist schon ein Kämpfer dieser Wache zu diesem Feuer unterwegs?
      // Live-Prüfung: Gibt es einen Villager, der zur Wache gehört
      // (workplaceId === station.id, role='firefighter') und dessen
      // _fireTargetId auf dieses Gebäude zeigt?
      const alreadyEnRoute = this._isFirefighterEnRoute(station, fire.building);
      if (alreadyEnRoute) continue;

      // Verfügbaren Löscher suchen
      const fighter = this._findAvailableFighter(station, now);
      if (!fighter) continue;

      // Losschicken
      if (this.vm && typeof this.vm.triggerFireExtinguish === 'function') {
        const success = this.vm.triggerFireExtinguish(fighter, station);
        if (success) {
          this._lastDispatchTime.set(station.id, now);
        }
      }
    }
  }

  // Ältestes Feuer in Reichweite der Wache
  _getOldestFireInRange(station) {
    const fx = station.x + (station.w || 1) / 2;
    const fy = station.y + (station.h || 1) / 2;
    const range = station.def.extinguishRadius || 15;
    const rangeSq = range * range;

    let oldest = null;
    let oldestStartedAt = Infinity;

    for (const fire of this.activeFires) {
      if (fire.extinguishedAt) continue;
      const b = fire.building;
      if (!b) continue;

      const bx = b.x + (b.w || 1) / 2;
      const by = b.y + (b.h || 1) / 2;
      const dx = bx - fx;
      const dy = by - fy;
      if (dx * dx + dy * dy > rangeSq) continue;

      if (fire.startedAt < oldestStartedAt) {
        oldestStartedAt = fire.startedAt;
        oldest = fire;
      }
    }
    return oldest;
  }

// Prüft live, ob ein Kämpfer der Wache schon zu diesem Feuer unterwegs ist.
// NEU: Es zählt nur, wenn der Kämpfer auch wirklich im extinguish-State ist.
// Wenn er im 'working'-State ist, ist er NICHT unterwegs, auch wenn
// _fireTargetId noch gesetzt ist (veralteter Savegame-State).
_isFirefighterEnRoute(station, targetBuilding) {
  if (!station.workerIds) return false;
  for (const wid of station.workerIds) {
    if (wid === null) continue;
    const w = this.vm.villagers.get(wid);
    if (!w) continue;
    if (w._fireStationRole !== 'firefighter') continue;
    
    if (w._fireTargetId === targetBuilding.id) {
      if (w.state === 'extinguish_fetch' || 
          w.state === 'extinguish_go' || 
          w.state === 'extinguishing' ||
          w.state === 'extinguish_waiting') {
        return true;
      }
    }
  }
  return false;
}

  // Verfügbaren Löscher in der Wache finden
  _findAvailableFighter(station, now) {
    if (!station.workerIds) return null;
    for (const wid of station.workerIds) {
      if (wid === null) continue;
      const w = this.vm.villagers.get(wid);
      if (!w) continue;
      if (w._fireStationRole !== 'firefighter') continue;
      if (w.state !== 'working') continue;
      if (w.task) continue;
      if (w.isSick) continue;
      if (w._recoverUntil && now < w._recoverUntil) continue;
      if (w._lastFireDispatchTime && now - w._lastFireDispatchTime < 500) continue;
      // Muss im Gebäude sein (Position = renderX/Y)
      if (Math.abs(w.renderX - w.x) > 0.01 || Math.abs(w.renderY - w.y) > 0.01) continue;
      return w;
    }
    return null;
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
    // Schutz: Wenn schon ein Feuer auf diesem Gebäude brennt, kein zweites
    if (this.activeFires.some(f => f.building === building && !f.extinguishedAt)) {
      return;
    }

    const fire = {
      building,
      startedAt: now,
      spreadDone: false,
      waterDelivered: 0,
      extinguishedAt: 0
    };
    this.activeFires.push(fire);

    building.paused = true;
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

  _resetFirefightersFor(buildingId) {
    for (const v of this.vm.villagers.values()) {
      if (v._fireTargetId !== buildingId) continue;
      if (v.state === 'zfighting' || v.state === 'vfighting' || v.state === 'dragon_attack' || 
          v.state === 'attacking_raiders' || v.state === 'vfightback' || v.state === 'vdefend') {
        continue;
      }

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

      v._fireTargetId = null;
      v._fireWaterCarried = 0;

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
        extinguishedAtRemaining: f.extinguishedAt > 0
          ? Math.max(0, this.EXTINGUISH_LINGER_MS - (now - f.extinguishedAt))
          : 0
      }))
    };
  }

  restoreFromSave(data, now) {
    this._lastDispatchTime = new Map();

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

        if (b._lastExtinguishTime === undefined) {
          b._lastExtinguishTime = 0;
        }

        this.activeFires.push({
          building: b,
          startedAt: now - (fData.startedAtRemaining || 0),
          spreadDone: !!fData.spreadDone,
          waterDelivered: fData.waterDelivered || 0,
          extinguishedAt: fData.extinguishedAtRemaining > 0
            ? now - (this.EXTINGUISH_LINGER_MS - fData.extinguishedAtRemaining)
            : 0
        });
      }
    }
  }
};
window.Game = window.Game || {};

Game.FireManager = class FireManager {
  constructor(world, vm, economy) {
    this.world = world;
    this.vm = vm;
    this.economy = economy;

    this.GRACE_PERIOD_MS = 15 * 60 * 1000;     // 15 Minuten Welpenschutz
    this.MIN_INTERVAL_MS = 150 * 1000;         // 150 Sekunden
    this.MAX_INTERVAL_MS = 600 * 1000;         // 600 Sekunden

    this.SECONDS_PER_TILE_BURN = 15;
    this.SECONDS_PER_TILE_SPREAD = 7.5;

    this.MIN_BURN_TIME_MS = 60 * 1000;
    this.MIN_SPREAD_TIME_MS = 30 * 1000;

    this.FIRE_SPREAD_MIN = 1;
    this.FIRE_SPREAD_MAX = 3;
    this.FIRE_SPREAD_RADIUS = 4;

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

  // ==========================================================
  // Prüft, ob die Bäcker (oder andere Rezepturen) Wasser brauchen.
  // Greift aber NUR, wenn der globale Wasserbestand 20 oder weniger ist.
  // ==========================================================
  isWaterNeededByBakeries() {
    if (!this.economy || !this.world) return false;

    // Wenn genug Wasser im globalen Lager ist, brauchen wir nicht zu blockieren.
    if ((this.economy.res.water || 0) > 20) {
      return false;
    }
    
    // Wir prüfen alle Gebäude, die Wasser als Rezept-Zutat brauchen
    for (const b of this.world.recipeBuildings) {
      if (!b.built || b.ruined || b.paused) continue;
      
      // Nur relevant, wenn das Rezept Wasser benötigt
      const inputs = b.def.recipe && b.def.recipe.inputs;
      if (!inputs || !inputs.water) continue;

      // Wenn der Wasservorrat des Gebäudes auf 0 ist
      if ((b.recipeStorage.water || 0) === 0) {
        return true; // Ja, wir brauchen Wasser für die Produktion
      }
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

    // 1) Feuer-Timer prüfen
    if (this.activeFires.length === 0 && now >= this.nextFireAt) {
      this._tryOutbreak(now);
    }

    // 2) Aktive Feuer updaten
    for (let i = this.activeFires.length - 1; i >= 0; i--) {
      const fire = this.activeFires[i];
      const b = fire.building;

      if (!this.world.buildings.has(b.id) || b.ruined) {
        this.activeFires.splice(i, 1);
        this._resetFirefightersFor(b.id);
        
        // Wenn das Feuer durch Zerstörung endet, Timer neu starten
        if (this.activeFires.length === 0) {
          this._scheduleNext(now);
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
        
        // Wenn das letzte Feuer abgebrannt ist, Timer neu starten
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
      // Wenn keine Kandidaten da sind, Timer neu planen, um nicht jeden Tick zu prüfen
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
      spreadDone: false
    };
    this.activeFires.push(fire);

    building.paused = true;

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

    if (this.onFireEnd) {
      this.onFireEnd(b);
    }
  }

  _resetFirefightersFor(buildingId) {
    for (const v of this.vm.villagers.values()) {
      if (v._fireTargetId !== buildingId) continue;
      
      if (v.state === 'zfighting' || v.state === 'vfighting' || v.state === 'dragon_attack' || 
          v.state === 'attacking_raiders' || v.state === 'vfightback' || v.state === 'vdefend') {
        continue;
      }

      v._fireTargetId = null;
      v._fireWaterCarried = 0;
      v.state = 'idle';
      v.task = null;
      v.hidden = true;
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
    return this.activeFires.some(f => f.building === b);
  }

  extinguish(building, amount) {
    const fireIdx = this.activeFires.findIndex(f => f.building === building);
    if (fireIdx === -1) return false;

    const fire = this.activeFires[fireIdx];
    const w = building.w || 1;
    const h = building.h || 1;
    const tiles = Math.max(1, Math.floor(w * h));
    const neededWater = tiles * 5;

    if (!fire.waterDelivered) fire.waterDelivered = 0;
    fire.waterDelivered += amount;

    if (fire.waterDelivered >= neededWater) {
      this.activeFires.splice(fireIdx, 1);
      
      building.paused = false;
      
      this._resetFirefightersFor(building.id);

      if (this.onFireEnd) this.onFireEnd(building);

      // Timer neu starten, damit nicht sofort ein neues Feuer ausbricht
      if (this.activeFires.length === 0) {
        this._scheduleNext(performance.now());
      }
      
      return true;
    }
    return false;
  }

  serialize(now) {
    return {
      started: this._started,
      gracePeriodEndsAtRemaining: Math.max(0, this.gracePeriodEndsAt - now),
      nextFireAtRemaining: Math.max(0, this.nextFireAt - now),
      activeFires: this.activeFires.map(f => ({
        buildingId: f.building.id,
        startedAtRemaining: Math.max(0, now - f.startedAt),
        spreadDone: f.spreadDone,
        waterDelivered: f.waterDelivered || 0
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
    this.gracePeriodEndsAt = data.gracePeriodEndsAtRemaining > 0
      ? now + data.gracePeriodEndsAtRemaining
      : 0;
    this.nextFireAt = data.nextFireAtRemaining > 0
      ? now + data.nextFireAtRemaining
      : 0;

    this.activeFires = [];
    if (data.activeFires) {
      for (const fData of data.activeFires) {
        const b = this.world.buildings.get(fData.buildingId);
        if (!b || b.ruined) continue;
        
        b.paused = true;
        
        this.activeFires.push({
          building: b,
          startedAt: now - (fData.startedAtRemaining || 0),
          spreadDone: !!fData.spreadDone,
          waterDelivered: fData.waterDelivered || 0
        });
      }
    }
  }
};
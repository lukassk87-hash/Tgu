window.Game = window.Game || {};

Game.DragonManager = class DragonManager {
  constructor(world, ticker, vm, economy, renderer, audioManager) {
    this.world = world;
    this.ticker = ticker;
    this.vm = vm;
    this.economy = economy;
    this.renderer = renderer;
    this.audioManager = audioManager;

    this.firstSpawnDelayMs = 5 * 60 * 1000;
    this.minSpawnIntervalMs = 7 * 60 * 1000;
    this.maxSpawnIntervalMs = 12 * 60 * 1000;

    this.nextSpawnAt = 0;
    this._defenseReady = false;
    this._nextId = 0;

    this.level = 0;
    this.currentMaxHp = 5;
    this.currentScale = 1.0;

    this.dragons = [];
    this.deadDragons = [];
    this.DEAD_DRAGON_DURATION_MS = 90000;

    this.assets = {
      flying: 'images/drache.webp',
      grounded: 'images/dracheko.webp',
      fireball: 'images/explosion.webp',
      threat: 'images/drache.webp',
      dead: 'images/drache-tot.webp'
    };
    this.fireballs = [];

    this.SPEED = 2;
    this.ESCAPE_SPEED = 6;
    this.ARROW_HIT_CHANCE = 0.75;
    this.FIREBALL_INTERVAL_MS = 3000;
    this.FIREBALL_SPEED = 6;
    this.GROUND_TIMER_MS = 10000;
    this.KILL_WARRIORS_NEEDED = 8;
    this.KILL_WARRIOR_RADIUS = 2;
    this.KILL_DELAY_MS = 1500;
    this.MEAT_DROP = 20;
    this.BONE_DROP = 1;

    // Feuerreichweite: Drache muss physisch innerhalb von 4 Tiles
    // am Zielzentrum sein, um feuern zu können.
    // + Toleranz (Feuer-Toleranz) gegen Fließkomma-Rundungsfehler.
    this.FIRE_RANGE_TILES = 4;
    this.FIRE_RANGE_TOLERANCE = 0.001;

    this.CRASH_DURATION_MS = 1500;
    this.CRASH_FALL_TILES = 2;
    this.CRASH_SHRINK_FACTOR = 0.85;
    this.CRASH_ROTATION_DEG = 540;

    this.onSpawned = null;
    this.onKilled = null;
    this.onEscaped = null;
    this.onPackSpawned = null;

    this._gridInserted = false;
    this._lastUpdateTime = 0;

    this._combatStartTimes = new Map();

    this._lastDustTime = 0;
  }

  _isBuildingBurning(b) {
    if (!b) return false;
    const fireMgr = window.Game && Game.state && Game.state.fireManager;
    if (!fireMgr) return false;
    return fireMgr.isBuildingBurning(b);
  }

  checkDefenseRequirements(now) {
    if (this._defenseReady) return;

    let hasArrowSmith = false;
    let hasDefenseTower = false;

    for (const b of this.world.buildings.values()) {
      if (!b.built || b.ruined) continue;
      if (b.def.id === 'arrowSmith') hasArrowSmith = true;
      if (b.def.id === 'arrowTower' || b.def.id === 'watchtower') hasDefenseTower = true;
      if (hasArrowSmith && hasDefenseTower) break;
    }

    if (hasArrowSmith && hasDefenseTower) {
      this._defenseReady = true;
      this.nextSpawnAt = now + this.firstSpawnDelayMs;
      console.log(`🐉 Verteidigung bereit! Nächster Drache in ca. ${Math.round(this.firstSpawnDelayMs / 60000)} Minuten.`);
    }
  }

  update(dt, now) {
    if (!this._lastUpdateTime) this._lastUpdateTime = now;
    this._lastUpdateTime = now;

    if (!this._defenseReady) {
      this.checkDefenseRequirements(now);
    }

    if (!this._defenseReady) return;

    if (this.dragons.length === 0 && now >= this.nextSpawnAt) {
      this._trySpawn(now);
    }
    
    if (this.dragons.length > 0) {
      for (const d of this.dragons) {
        this._updateDragon(d, dt, now);
      }
    }
    
    this._updateFireballs(dt, now);

    if (this.deadDragons.length > 0) {
      for (let i = this.deadDragons.length - 1; i >= 0; i--) {
        if (now - this.deadDragons[i].startTime >= this.DEAD_DRAGON_DURATION_MS) {
          this.deadDragons.splice(i, 1);
        }
      }
    }

    if (this.audioManager) {
      let anyFlying = false;
      for (const d of this.dragons) {
        if (d.state === 'flying' || d.state === 'attacking' || d.state === 'escaping') {
          anyFlying = true;
          break;
        }
      }
      if (anyFlying) {
        this.audioManager.playLoop('dragon-flight', 'audio/drache.mp3', 0.4, false);
      } else {
        this.audioManager.stopLoop('dragon-flight');
      }
    }
  }

  _trySpawn(now) {
    const w = this.world;
    if (w.castleId === null) {
      this.nextSpawnAt = now + 60000;
      return;
    }

    w.dragonAttackActive = true;

    const isPack = this.level >= 5 && Math.random() < 0.33;
    let spawnLevel = this.level;
    let count = 1;

    if (isPack) {
      spawnLevel = Math.max(0, this.level - 5);
      count = 3;
    }

    const sides = [0, 1, 2, 3];
    for (let i = sides.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = sides[i]; sides[i] = sides[j]; sides[j] = tmp;
    }

    for (let i = 0; i < count; i++) {
      this._spawnDragon(spawnLevel, sides[i], now);
    }

    if (isPack) {
      if (this.onPackSpawned) this.onPackSpawned();
      console.log(`🐉 Drachen-RUDEL (${count}x Level ${spawnLevel}) erscheint!`);
    } else {
      if (this.onSpawned) this.onSpawned(this.dragons[0]);
      console.log(`🐉 Drache (Level ${spawnLevel}) erscheint am Kartenrand!`);
    }

    if (this.audioManager) this.audioManager.playOneShot('audio/drache.mp3');
  }

  _spawnDragon(level, side, now) {
    const w = this.world;
    let x, y;
    
    if (side === 0) { x = Math.random() * w.width; y = 0.5; }
    else if (side === 1) { x = w.width - 1.5; y = Math.random() * w.height; }
    else if (side === 2) { x = Math.random() * w.width; y = w.height - 1.5; }
    else { x = 0.5; y = Math.random() * w.height; }

    // HP-Skalierung alle 2 Level +5 (analog zu Soldaten)
    const maxHp = level === 0 ? 5 : 10 + Math.floor((level - 1) / 2) * 5;
    const scale = 1.0 + (level * 0.05);

    const castle = w.buildings.get(w.castleId);
    const ccx = castle.x + (castle.w || 1) / 2;
    const ccy = castle.y + (castle.h || 1) / 2;
    const dx = ccx - x;
    const dy = ccy - y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    this._nextId = (this._nextId || 0) + 1;
    const id = 'dragon_' + this._nextId;

    const d = {
      id,
      x, y,
      renderX: x,
      renderY: y,
      vx: dx / dist,
      vy: dy / dist,
      state: 'flying',
      hp: 0,
      maxHp: maxHp,
      level: level,
      scale: scale,
      targetBuildingId: null,
      nextFireballAt: now + this.FIREBALL_INTERVAL_MS,
      groundedUntil: 0,
      bobPhase: 0,
      lastSearchAt: 0,
      searchIntervalMs: 200,
      castleHits: 0,
      crossedBorder: false,
      buildingCache: [],
      fireCooldownUntil: 0,
      crashStartTime: 0,
      crashEndTime: 0,
      crashStartX: 0,
      crashStartY: 0,
      crashCurrentScale: scale,
      crashRotation: 0,

      isPackDragon: level === 0
    };

    this.dragons.push(d);
    return d;
  }

  _updateDragon(d, dt, now) {
    const dtSec = dt / 1000;

    if (d.state === 'flying' || d.state === 'attacking') {
      this._updateFlying(d, dtSec, now);
    } else if (d.state === 'crashing') {
      this._updateCrashing(d, dtSec, now);
    } else if (d.state === 'grounded') {
      this._updateGrounded(d, dtSec, now);
    } else if (d.state === 'escaping') {
      this._updateEscaping(d, dtSec, now);
    }
  }

  _updateFlying(d, dtSec, now) {
    const w = this.world;

    if (d.lastSearchAt != null && d.lastSearchAt > now) {
      d.lastSearchAt = 0;
    }

    const isInside = w.isInTerritory(d.x, d.y);

    if (!d.crossedBorder && isInside) {
      d.crossedBorder = true;
      d.fireCooldownUntil = now + 1000;

      d.buildingCache = [];
      for (const b of w.buildings.values()) {
        if (!b.built || b.ruined || b.isBeingRepaired) continue;
        if (b.def.id === 'castle') continue;
        if (this._isBuildingBurning(b)) continue;
        d.buildingCache.push(b);
      }
    }

    let target = d.targetBuildingId ? w.buildings.get(d.targetBuildingId) : null;

    if (target && (!target.built || target.ruined || target.isBeingRepaired || this._isBuildingBurning(target))) {
      target = null;
      d.targetBuildingId = null;
    }

    if (!target && d.crossedBorder) {
      if (now - d.lastSearchAt >= 200) {
        d.lastSearchAt = now;

        let best = null;
        let bestDistSq = Infinity;

        for (let i = d.buildingCache.length - 1; i >= 0; i--) {
          const cached = d.buildingCache[i];
          const b = w.buildings.get(cached.id);

          if (!b || !b.built || b.ruined || b.isBeingRepaired) {
            d.buildingCache.splice(i, 1);
            continue;
          }

          if (this._isBuildingBurning(b)) {
            d.buildingCache.splice(i, 1);
            continue;
          }

          const bx = b.x + (b.w || 1) / 2;
          const by = b.y + (b.h || 1) / 2;
          const dx = bx - d.x;
          const dy = by - d.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < bestDistSq) {
            bestDistSq = d2;
            best = b;
          }
        }

        if (!best) {
          let cacheOutdated = false;
          for (const b of w.buildings.values()) {
            if (!b.built || b.ruined || b.isBeingRepaired) continue;
            if (b.def.id === 'castle') continue;
            if (this._isBuildingBurning(b)) continue;
            let found = false;
            for (const cached of d.buildingCache) {
              if (cached.id === b.id) { found = true; break; }
            }
            if (!found) { cacheOutdated = true; break; }
          }

          if (cacheOutdated) {
            d.buildingCache = [];
            for (const b of w.buildings.values()) {
              if (!b.built || b.ruined || b.isBeingRepaired) continue;
              if (b.def.id === 'castle') continue;
              if (this._isBuildingBurning(b)) continue;
              d.buildingCache.push(b);
            }
            for (const b of d.buildingCache) {
              const bx = b.x + (b.w || 1) / 2;
              const by = b.y + (b.h || 1) / 2;
              const dx = bx - d.x;
              const dy = by - d.y;
              const d2 = dx * dx + dy * dy;
              if (d2 < bestDistSq) {
                bestDistSq = d2;
                best = b;
              }
            }
          }
        }

        if (best) {
          d.targetBuildingId = best.id;
          d.state = 'attacking';
          target = best;
        } else {
          const castle = w.buildings.get(w.castleId);
          if (castle && castle.built && !castle.ruined && !castle.isBeingRepaired) {
            d.targetBuildingId = castle.id;
            d.state = 'attacking';
            target = castle;
          } else {
            d.state = 'escaping';
            d.targetBuildingId = null;
            return;
          }
        }
      }
    }

    if (target) {
      const tx = target.x + (target.w || 1) / 2;
      const ty = target.y + (target.h || 1) / 2;
      const dx = tx - d.x;
      const dy = ty - d.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const stopDist = this.FIRE_RANGE_TILES;

      if (dist > 0.001) {
        d.vx = dx / dist;
        d.vy = dy / dist;
      }

      if (dist > stopDist) {
        const step = Math.min(this.SPEED * dtSec, dist - stopDist);
        d.x += (dx / dist) * step;
        d.y += (dy / dist) * step;
      }

      // Feuerball nur abfeuern, wenn der Drache tatsächlich
      // innerhalb der Reichweite ist. Toleranz fängt den
      // Fließkomma-Rundungsfehler ab (4.0000001 → feuert).
      const distNow = Math.sqrt((tx - d.x) * (tx - d.x) + (ty - d.y) * (ty - d.y));

      if (distNow <= this.FIRE_RANGE_TILES + this.FIRE_RANGE_TOLERANCE &&
          now >= d.nextFireballAt &&
          now >= d.fireCooldownUntil) {
        this._spawnFireball(d, target);
        d.nextFireballAt = now + this.FIREBALL_INTERVAL_MS;
      }

      if (dist <= stopDist && target.def.id !== 'castle') {
        d.targetBuildingId = null;
        d.state = 'flying';
      }

    } else if (!d.crossedBorder) {
      const castle = w.buildings.get(w.castleId);
      if (!castle) return;
      const ccx = castle.x + (castle.w || 1) / 2;
      const ccy = castle.y + (castle.h || 1) / 2;
      const dx = ccx - d.x;
      const dy = ccy - d.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0.001) {
        d.vx = dx / dist;
        d.vy = dy / dist;
        const step = Math.min(this.SPEED * dtSec, dist);
        d.x += d.vx * step;
        d.y += d.vy * step;
      }
    }

    d.renderX = d.x;
    d.renderY = d.y;
  }

  _updateCrashing(d, dtSec, now) {
    const t = Math.min(1, (now - d.crashStartTime) / this.CRASH_DURATION_MS);

    d.renderX = d.crashStartX;
    d.renderY = d.crashStartY + (t * this.CRASH_FALL_TILES);

    d.crashRotation = t * this.CRASH_ROTATION_DEG * Math.PI / 180;
    d.crashCurrentScale = d.scale * (1 - (1 - this.CRASH_SHRINK_FACTOR) * t);

    if (t >= 1) {
      d.state = 'grounded';
      
      const extraTime = d.isPackDragon ? 10000 : 0;
      d.groundedUntil = now + this.GROUND_TIMER_MS + extraTime;
      
      d.renderY = d.crashStartY + this.CRASH_FALL_TILES;
      d.crashRotation = 0;
      d.crashCurrentScale = d.scale;

      d.y = d.renderY;
      d.x = d.renderX;

      this._combatStartTimes.set(d, 0);
    }
  }

  _updateEscaping(d, dtSec, now) {
    const w = this.world;

    const distToLeft = d.x;
    const distToRight = w.width - d.x;
    const distToTop = d.y;
    const distToBottom = w.height - d.y;

    const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

    let targetX = d.x;
    let targetY = d.y;

    if (minDist === distToLeft) targetX = -5;
    else if (minDist === distToRight) targetX = w.width + 5;
    else if (minDist === distToTop) targetY = -5;
    else targetY = w.height + 5;

    const dx = targetX - d.x;
    const dy = targetY - d.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0.001) {
      d.vx = dx / dist;
      d.vy = dy / dist;
      const step = Math.min(this.ESCAPE_SPEED * dtSec, dist);
      d.x += d.vx * step;
      d.y += d.vy * step;
    }

    d.renderX = d.x;
    d.renderY = d.y;

    if (d.x < -2 || d.x > w.width + 2 || d.y < -2 || d.y > w.height + 2) {
      this._removeDragon(d);
      if (this.onEscaped) this.onEscaped(d);
    }
  }

  _spawnFireball(d, target) {
    if (!d || !target) return;
    const tx = target.x + (target.w || 1) / 2;
    const ty = target.y + (target.h || 1) / 2;

    const forwardX = d.vx || 0;
    const forwardY = d.vy || 0;
    const headOffset = 1.5 * (d.scale || 1.0);
    const sx = d.x + forwardX * headOffset;
    const sy = d.y + forwardY * headOffset;

    const dx = tx - sx;
    const dy = ty - sy;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const durationMs = Math.max(300, Math.min(1500, (dist / this.FIREBALL_SPEED) * 1000));

    this.fireballs.push({
      sx: sx,
      sy: sy,
      ex: tx,
      ey: ty,
      startTime: performance.now(),
      durationMs,
      targetBuildingId: target.id,
      onImpact: () => this._handleFireballImpact(target)
    });
  }

  _updateFireballs(dt, now) {
    for (let i = this.fireballs.length - 1; i >= 0; i--) {
      const f = this.fireballs[i];
      if (now - f.startTime >= f.durationMs) {
        if (f.onImpact) f.onImpact();
        this.fireballs.splice(i, 1);
      }
    }
  }

  _handleFireballImpact(target) {
    if (!target) return;
    const w = this.world;
    if (!w.buildings.has(target.id)) return;

    if (this.audioManager) {
      this.audioManager.playOneShot('audio/explosion.mp3');
    }

    if (this.renderer && this.renderer.spawnDragonImpactParticles) {
      this.renderer.spawnDragonImpactParticles(target.x + target.w / 2, target.y + target.h / 2);
    }

    // 1) Schloss
    if (target.def.id === 'castle') {
      target.dragonHits = (target.dragonHits || 0) + 1;

      if (target.def.damageAssets && this.renderer) {
        this.renderer.markStaticDirty(w.getBuildingTiles(target));
      }

      const maxHits = target.def.dragonHits || 3;
      if (target.dragonHits >= maxHits) {
        this._triggerGameOver();
      }
      return;
    }

    // 2) Feuerwehr: sofort zerstören
    if (target.def.id === 'fireStation') {
      this._ruinBuilding(target);
      return;
    }

    // 3) Alle anderen Gebäude: Feuer auslösen
    const fireMgr = window.Game && Game.state && Game.state.fireManager;
    if (fireMgr) {
      if (!fireMgr.isBuildingBurning(target)) {
        fireMgr._startFire(performance.now(), target);
      }
    } else {
      this._ruinBuilding(target);
    }
  }

  _ruinBuilding(b) {
    if (!b || b.ruined) return;
    const w = this.world;

    this._removeFromActiveLists(b);

    b.ruined = true;
    b.built = false;
    b.progress = 0;
    b.buildTime = 0;
    b.builderId = null;

    b.ruinAsset = b.def.ruinAsset || 'images/ruine-quadrat.webp';

    const bsIdx = w.buildSites.indexOf(b);
    if (bsIdx !== -1) w.buildSites.splice(bsIdx, 1);

    for (const field of (b.fields || [])) {
      const key = field.x + ',' + field.y;
      if (w.fieldOwners.get(key) === b.id) w.fieldOwners.delete(key);
    }
    b.fields = [];

    w.buildSites.push(b);

    if (Game.state && Game.state.enemyStats) {
      Game.state.enemyStats.buildingsDestroyedByDragon++;
    }

    if (this.renderer) {
      this.renderer.markStaticDirty(w.getBuildingTiles(b));
    }

    w.invalidateTerritoryCache();
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

  tryArrowHit(targetDragon) {
    const d = targetDragon || (this.dragons.length > 0 ? this.dragons[0] : null);
    if (!d || (d.state !== 'flying' && d.state !== 'attacking')) return false;

    const didHit = Math.random() < this.ARROW_HIT_CHANCE;
    if (!didHit) return false;

    d.hp++;
    if (this.audioManager) this.audioManager.playOneShot('audio/drache.mp3');

    if (d.hp >= d.maxHp) {
      this._crash(d);
    }
    return true;
  }

  _crash(d) {
    const now = performance.now();
    d.state = 'crashing';
    d.crashStartTime = now;
    d.crashEndTime = now + this.CRASH_DURATION_MS;
    d.crashStartX = d.x;
    d.crashStartY = d.y;
    d.crashCurrentScale = d.scale;
    d.crashRotation = 0;
    d.targetBuildingId = null;
  }

  _updateGrounded(d, dtSec, now) {
    if (now >= d.groundedUntil) {
      d.state = 'escaping';
      this._combatStartTimes.delete(d);
      return;
    }

    const nearby = this.vm.getNearbyWarriors(d.x, d.y);
    let count = 0;

    for (const v of nearby) {
      if (v.job !== 'warrior') continue;
      if (v.state === 'dead') continue;

      const dx = v.x - d.x;
      const dy = v.y - d.y;
      if (dx * dx + dy * dy <= this.KILL_WARRIOR_RADIUS * this.KILL_WARRIOR_RADIUS) {
        count++;
      }
    }

    const needed = this.KILL_WARRIORS_NEEDED + Math.floor(d.level * 0.5);

    if (count > 0) {
      const intensity = Math.min(1, count / needed); 
      
      if (now - this._lastDustTime > 100) {
        this._lastDustTime = now;
        if (this.renderer && this.renderer.spawnHarvestParticles) {
           const particleCount = Math.max(1, Math.floor(intensity * 15));
           const spreadSize = 3 * d.scale; 
           
           for (let i = 0; i < particleCount; i++) {
             const offsetX = (Math.random() - 0.5) * spreadSize;
             const offsetY = (Math.random() - 0.5) * spreadSize;
             this.renderer.spawnHarvestParticles(d.x + offsetX, d.y + offsetY, 'stone');
           }
        }
      }
    }

    if (count >= needed) {
      let startTime = this._combatStartTimes.get(d) || 0;
      if (startTime === 0) {
        this._combatStartTimes.set(d, now);
      } else if (now - startTime >= this.KILL_DELAY_MS) {
        this._kill(d);
      }
    } else {
      this._combatStartTimes.set(d, 0);
    }
  }

  _kill(d) {
    const levelOfKilled = d.level;

    if (Game.state && typeof Game.state.addResource === 'function') {
      Game.state.addResource('meat', this.MEAT_DROP);
      Game.state.addResource('dragonBone', this.BONE_DROP);
    } else {
      this.economy.res.meat = (this.economy.res.meat || 0) + this.MEAT_DROP;
      this.economy.res.dragonBone = (this.economy.res.dragonBone || 0) + this.BONE_DROP;
    }
    if (this.economy.onChange) this.economy.onChange();

    this.deadDragons.push({
      x: d.x,
      y: d.y,
      scale: d.scale,
      startTime: performance.now()
    });

    if (this.audioManager) this.audioManager.playOneShot('audio/drache.mp3');
    console.log(`🐉 Drache (Level ${levelOfKilled}) wurde erledigt!`);

    if (Game.state && Game.state.enemyStats) {
      Game.state.enemyStats.dragonsKilled++;
    }

    this._combatStartTimes.delete(d);

    if (this.onKilled) this.onKilled(d);
    this._removeDragon(d);
  }

  _removeDragon(d) {
    const idx = this.dragons.indexOf(d);
    if (idx !== -1) this.dragons.splice(idx, 1);
    this._combatStartTimes.delete(d);

    if (this.dragons.length === 0) {
      this._onAllDragonsGone();
    }
  }

  _onAllDragonsGone() {
    this.world.dragonAttackActive = false;
    
    this.level++;
    console.log(`🐉 Nächster Drache auf Level ${this.level}.`);

    if (this.audioManager) this.audioManager.stopLoop('dragon-flight');

    const delay = this.minSpawnIntervalMs +
      Math.random() * (this.maxSpawnIntervalMs - this.minSpawnIntervalMs);
    this.nextSpawnAt = performance.now() + delay;
    console.log(`🐉 Nächster Drache in ca. ${Math.round(delay / 60000)} Minuten.`);
  }

  _triggerGameOver() {
    console.log('💀 GAME OVER – Das Schloss wurde zerstört!');
    if (window.Game && window.Game.state) {
      window.Game.state.paused = true;
      window.Game.state.gameOver = true;
      window.Game.state.state = 'gameover';
      alert('💀 GAME OVER\n\nDer Drache hat dein Schloss zerstört.');
    }
    this._despawnAll();
  }

  _despawnAll() {
    this.dragons = [];
    this._combatStartTimes.clear();
    this.world.dragonAttackActive = false;
    this.nextSpawnAt = 0;
    if (this.audioManager) this.audioManager.stopLoop('dragon-flight');
  }

  isAlive() {
    return this.dragons.length > 0;
  }

  isGrounded() {
    return this.dragons.some(d => d.state === 'grounded');
  }

  getState() {
    if (this.dragons.length === 0) return null;
    return this.dragons.find(d => d.state !== 'grounded') || this.dragons[0];
  }

  restoreFromSave(data) {
    if (!data) {
      this.nextSpawnAt = 0;
      this._defenseReady = false;
      return;
    }

    const now = performance.now();

    if (data.level !== undefined) {
      this.level = data.level;
    }

    if (data.nextId !== undefined) {
      this._nextId = data.nextId;
    } else {
      this._nextId = 0;
    }

    if (data.defenseReady !== undefined) {
      this._defenseReady = !!data.defenseReady;
    }

    if (data.nextSpawnAtRemaining !== undefined && data.nextSpawnAtRemaining > 0) {
      this.nextSpawnAt = now + data.nextSpawnAtRemaining;
    } else if (this._defenseReady) {
      this.nextSpawnAt = now + this.firstSpawnDelayMs;
    } else {
      this.nextSpawnAt = 0;
    }

    this.deadDragons = [];
    if (data.deadDragons && data.deadDragons.length > 0) {
      for (const dd of data.deadDragons) {
        const elapsed = dd.elapsedMs || 0;
        if (elapsed >= this.DEAD_DRAGON_DURATION_MS) continue;
        this.deadDragons.push({
          x: dd.x,
          y: dd.y,
          scale: dd.scale || 1.0,
          startTime: now - elapsed
        });
      }
    }

    this.dragons = [];
    this._combatStartTimes.clear();

    if (data.dragons && data.dragons.length > 0) {
      for (const dragonData of data.dragons) {
        const d = { ...dragonData };

        d.buildingCache = [];
        for (const b of this.world.buildings.values()) {
          if (!b.built || b.ruined || b.isBeingRepaired) continue;
          if (b.def.id === 'castle') continue;
          if (this._isBuildingBurning(b)) continue;
          d.buildingCache.push(b);
        }

        d.lastSearchAt = 0;

        if (d.nextFireballAtRemaining !== undefined) {
          d.nextFireballAt = now + Math.max(0, d.nextFireballAtRemaining);
          delete d.nextFireballAtRemaining;
        } else {
          d.nextFireballAt = now;
        }

        if (d.fireCooldownUntilRemaining !== undefined) {
          d.fireCooldownUntil = now + Math.max(0, d.fireCooldownUntilRemaining);
          delete d.fireCooldownUntilRemaining;
        } else {
          d.fireCooldownUntil = 0;
        }

        if (d.groundedUntilRemaining !== undefined) {
          d.groundedUntil = now + Math.max(0, d.groundedUntilRemaining);
          delete d.groundedUntilRemaining;
        } else {
          d.groundedUntil = 0;
        }

        if (d.crashEndTimeRemaining !== undefined) {
          d.crashEndTime = now + Math.max(0, d.crashEndTimeRemaining);
          d.crashStartTime = d.crashEndTime - this.CRASH_DURATION_MS;
          delete d.crashEndTimeRemaining;
        } else if (d.state === 'crashing') {
          d.crashStartTime = now;
          d.crashEndTime = now;
        } else {
          d.crashStartTime = now;
          d.crashEndTime = now;
        }

        if (d.state === 'crashing') {
          d.state = 'grounded';
          d.groundedUntil = now + this.GROUND_TIMER_MS;
          d.crashRotation = 0;
          d.crashCurrentScale = d.scale;
        }

        if ((d.state === 'attacking' || d.state === 'flying') && d.targetBuildingId != null) {
          const target = this.world.buildings.get(d.targetBuildingId);
          if (!target || !target.built || target.ruined || target.isBeingRepaired || this._isBuildingBurning(target)) {
            d.targetBuildingId = null;
            d.state = 'flying';
            d.lastSearchAt = 0;
          }
        }

        if (d.crossedBorder && !d.targetBuildingId) {
          const castle = this.world.buildings.get(this.world.castleId);
          const hasCastle = castle && castle.built && !castle.ruined && !castle.isBeingRepaired;
          if (!hasCastle) {
            d.state = 'escaping';
            d.targetBuildingId = null;
          } else {
            d.lastSearchAt = 0;
          }
        }

        this.dragons.push(d);

        if (d.state === 'grounded') {
          this._combatStartTimes.set(d, 0);
        }
      }
    }

    if (data.fireballs && data.fireballs.length > 0) {
      this.fireballs = data.fireballs.map(f => {
        const target = this.world.buildings.get(f.targetBuildingId);
        const startTime = now - (f.elapsedMs || 0);
        return {
          sx: f.sx, sy: f.sy, ex: f.ex, ey: f.ey,
          startTime: startTime,
          durationMs: f.durationMs,
          targetBuildingId: f.targetBuildingId,
          onImpact: target ? () => this._handleFireballImpact(target) : null
        };
      });
    } else {
      this.fireballs = [];
    }

    if (this.dragons.length > 0) {
      this.world.dragonAttackActive = true;
      console.log(`🐉 ${this.dragons.length} Drache(n) aus Savegame wiederhergestellt (Level ${this.level}).`);
    } else {
      if (this._defenseReady) {
        console.log(`🐉 Nächster Drache in ca. ${Math.round((this.nextSpawnAt - now) / 60000)} Minuten.`);
      } else {
        console.log(`🐉 Drache wartet auf Verteidigung.`);
      }
    }
  }

  serialize(now) {
    const dragonList = this.dragons.map(d => {
      const data = { ...d };
      delete data.buildingCache;
      
      data.lastSearchAtRemaining = d.lastSearchAt || 0;
      data.nextFireballAtRemaining = Math.max(0, d.nextFireballAt - now);
      data.fireCooldownUntilRemaining = Math.max(0, d.fireCooldownUntil - now);
      data.groundedUntilRemaining = d.groundedUntil > 0 ? Math.max(0, d.groundedUntil - now) : 0;
      data.crashEndTimeRemaining = d.crashEndTime > 0 ? Math.max(0, d.crashEndTime - now) : 0;

      delete data.lastSearchAt;
      delete data.nextFireballAt;
      delete data.fireCooldownUntil;
      delete data.groundedUntil;
      delete data.crashEndTime;
      delete data.crashStartTime;

      return data;
    });

    const fireballsData = this.fireballs.map(f => ({
      sx: f.sx, sy: f.sy, ex: f.ex, ey: f.ey,
      elapsedMs: Math.max(0, now - f.startTime),
      durationMs: f.durationMs,
      targetBuildingId: f.targetBuildingId
    }));

    const deadDragonsData = this.deadDragons.map(dd => ({
      x: dd.x,
      y: dd.y,
      scale: dd.scale,
      elapsedMs: Math.max(0, now - dd.startTime)
    }));

    return {
      defenseReady: !!this._defenseReady,
      nextSpawnAtRemaining: this.nextSpawnAt > 0 ? Math.max(0, this.nextSpawnAt - now) : 0,
      level: this.level,
      nextId: this._nextId,
      dragons: dragonList,
      fireballs: fireballsData,
      deadDragons: deadDragonsData
    };
  }
};
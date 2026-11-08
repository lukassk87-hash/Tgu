window.Game = window.Game || {};

Game.DragonManager = class DragonManager {
  constructor(world, ticker, vm, economy, renderer, audioManager) {
    this.world = world;
    this.ticker = ticker;
    this.vm = vm;
    this.economy = economy;
    this.renderer = renderer;
    this.audioManager = audioManager;

    this.firstSpawnDelayMs = 18 * 60 * 1000;
    this.minSpawnIntervalMs = 7 * 60 * 1000;
    this.maxSpawnIntervalMs = 12 * 60 * 1000;
    this.startedAt = performance.now();
    this.nextSpawnAt = this.startedAt + this.firstSpawnDelayMs;

    this.level = 0;
    this.currentMaxHp = 5;
    this.currentScale = 1.0;

    this.dragon = null;
    this.assets = {
      flying: 'images/drache.webp',
      grounded: 'images/dracheko.webp',
      fireball: 'images/explosion.webp',
      threat: 'images/drache.webp'
    };
    this.fireballs = [];

    this.SPEED = 2;
    this.ESCAPE_SPEED = 6;
    this.ARROW_HIT_CHANCE = 0.75;
    this.FIREBALL_INTERVAL_MS = 3000;
    this.FIREBALL_SPEED = 6;
    this.GROUND_TIMER_MS = 10000;
    this.KILL_WARRIORS_NEEDED = 8;
    this.KILL_WARRIOR_RADIUS = 4;
    this.MEAT_DROP = 100;

    this.CRASH_DURATION_MS = 1500;
    this.CRASH_FALL_TILES = 2;
    this.CRASH_SHRINK_FACTOR = 0.85;
    this.CRASH_ROTATION_DEG = 540;

    this.onSpawned = null;
    this.onKilled = null;
    this.onEscaped = null;

    this._gridInserted = false;
  }

  update(dt, now) {
    if (!this.dragon && now >= this.nextSpawnAt) {
      this._trySpawn(now);
    }
    if (this.dragon) {
      this._updateDragon(dt, now);
    }
    this._updateFireballs(dt, now);

    if (this.audioManager) {
      if (this.dragon && (this.dragon.state === 'flying' || this.dragon.state === 'attacking' || this.dragon.state === 'escaping')) {
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

    if (this.level === 0) {
      this.currentMaxHp = 5;
    } else {
      this.currentMaxHp = 10 + (this.level - 1) * 5;
    }
    this.currentScale = 1.0 + (this.level * 0.05);

    const side = Math.floor(Math.random() * 4);
    let x, y;
    if (side === 0) { x = Math.random() * w.width; y = 0.5; }
    else if (side === 1) { x = w.width - 1.5; y = Math.random() * w.height; }
    else if (side === 2) { x = Math.random() * w.width; y = w.height - 1.5; }
    else { x = 0.5; y = Math.random() * w.height; }

    const castle = w.buildings.get(w.castleId);
    const ccx = castle.x + (castle.w || 1) / 2;
    const ccy = castle.y + (castle.h || 1) / 2;
    const dx = ccx - x;
    const dy = ccy - y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    this.dragon = {
      id: 'dragon',
      x, y,
      renderX: x,
      renderY: y,
      vx: dx / dist,
      vy: dy / dist,
      state: 'flying',
      hp: 0,
      maxHp: this.currentMaxHp,
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
      crashCurrentScale: 1.0,
      crashRotation: 0
    };

    if (this.onSpawned) this.onSpawned(this.dragon);
    if (this.audioManager) this.audioManager.playOneShot('audio/drache.mp3');
    console.log(`🐉 Drache (Level ${this.level}) erscheint am Kartenrand! Größe: ${this.currentScale.toFixed(2)}x, HP: ${this.currentMaxHp}`);
  }

  _updateDragon(dt, now) {
    const d = this.dragon;
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

    // ⚠️ FIX: Schutz gegen lastSearchAt aus einer alten Session (Savegame-Rest).
    // Ein Wert in der Zukunft blockiert sonst das 200ms-Scan-Gate dauerhaft.
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
        d.buildingCache.push(b);
      }
      console.log(`🐉 Grenze überquert! Gebäude im Cache: ${d.buildingCache.length}`);
    }

    // ⚠️ FIX: targetBuildingId IMMER gegen world.buildings validieren.
    let target = d.targetBuildingId ? w.buildings.get(d.targetBuildingId) : null;

    if (target && (!target.built || target.ruined || target.isBeingRepaired)) {
      target = null;
      d.targetBuildingId = null;
    }

    if (!target && d.crossedBorder) {
      if (now - d.lastSearchAt >= 200) {
        d.lastSearchAt = now;

        // ⚠️ FIX: Cache-Einträge IMMER gegen world.buildings auflösen.
        // Verwende die echte Referenz, nie die gecachte JSON-Kopie.
        let best = null;
        let bestDistSq = Infinity;

        for (let i = d.buildingCache.length - 1; i >= 0; i--) {
          const cached = d.buildingCache[i];
          const b = w.buildings.get(cached.id);   // echte Referenz

          if (!b || !b.built || b.ruined || b.isBeingRepaired) {
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
            // ⚠️ FIX: Kein Ziel mehr da → nicht in 'attacking' hängen bleiben.
            d.state = 'escaping';
            d.targetBuildingId = null;
            console.log('🐉 Drache findet kein Ziel mehr – flieht.');
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

      let stopDist = 4;
      if (target.def.id === 'castle') {
        const halfSize = Math.max(target.w || 1, target.h || 1) / 2;
        stopDist = halfSize + 4;
      }

      if (dist > 0.001) {
        d.vx = dx / dist;
        d.vy = dy / dist;
      }

      if (dist > stopDist) {
        const step = Math.min(this.SPEED * dtSec, dist - stopDist);
        d.x += (dx / dist) * step;
        d.y += (dy / dist) * step;
      }

      if (now >= d.nextFireballAt && now >= d.fireCooldownUntil) {
        this._spawnFireball(target);
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
    d.crashCurrentScale = this.currentScale * (1 - (1 - this.CRASH_SHRINK_FACTOR) * t);

    if (t >= 1) {
      d.state = 'grounded';
      d.groundedUntil = now + this.GROUND_TIMER_MS;
      d.renderY = d.crashStartY + this.CRASH_FALL_TILES;
      d.crashRotation = 0;
      d.crashCurrentScale = this.currentScale;

      d.y = d.renderY;
      d.x = d.renderX;

      console.log('🐉 Drache aufgeschlagen! 10 Sekunden Zeit.');
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
      if (this.onEscaped) this.onEscaped(d);
      this._despawn();
    }
  }

  _spawnFireball(target) {
    const d = this.dragon;
    if (!d || !target) return;
    const tx = target.x + (target.w || 1) / 2;
    const ty = target.y + (target.h || 1) / 2;

    const forwardX = d.vx || 0;
    const forwardY = d.vy || 0;
    const headOffset = 1.5 * (this.currentScale || 1.0);
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

    if (this.audioManager) this.audioManager.playOneShot('audio/drache.mp3');
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
    if (!this.dragon) return;

    if (this.audioManager) {
      this.audioManager.playOneShot('audio/explosion.mp3');
    }

    if (target.def.dragonResistant) {
      target.dragonHits = (target.dragonHits || 0) + 1;
      if (target.def.id === 'castle') {
        this.dragon.castleHits = target.dragonHits;
      }

      if (this.renderer && this.renderer.spawnDragonImpactParticles) {
        this.renderer.spawnDragonImpactParticles(target.x + target.w / 2, target.y + target.h / 2);
      }

      if (target.def.damageAssets) {
        if (this.renderer) {
          this.renderer.markStaticDirty(w.getBuildingTiles(target));
        }
      }

      const maxHits = target.def.dragonHits || (target.def.id === 'castle' ? 3 : 2);
      
      if (target.dragonHits >= maxHits) {
        this._ruinBuilding(target);
        if (target.def.id === 'castle') {
          this._triggerGameOver();
        }
      } else {
        console.log(`🏰 ${target.def.name} getroffen! (${target.dragonHits}/${maxHits})`);
      }
      return;
    }

    if (this.renderer && this.renderer.spawnDragonImpactParticles) {
      this.renderer.spawnDragonImpactParticles(target.x + target.w / 2, target.y + target.h / 2);
    }
    this._ruinBuilding(target);
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

  tryArrowHit() {
    const d = this.dragon;
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
    d.crashCurrentScale = this.currentScale;
    d.crashRotation = 0;
    d.targetBuildingId = null;

    if (this.audioManager) this.audioManager.playOneShot('audio/drache.mp3');
    console.log('🐉 Drache stürzt ab!');
  }

  _updateGrounded(d, dtSec, now) {
    if (now >= d.groundedUntil) {
      d.state = 'escaping';
      console.log('🐉 Drache hebt ab und flieht!');
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

    const needed = this.KILL_WARRIORS_NEEDED + Math.floor(this.level * 0.5);

    if (count >= needed) {
      this._kill(d);
      return;
    }
  }

  _kill(d) {
    this.level++;

    if (Game.state && typeof Game.state.addResource === 'function') {
      Game.state.addResource('meat', this.MEAT_DROP);
    } else {
      this.economy.res.meat = (this.economy.res.meat || 0) + this.MEAT_DROP;
    }
    if (this.economy.onChange) this.economy.onChange();

    if (this.audioManager) this.audioManager.playOneShot('audio/drache.mp3');
    console.log(`🐉 Drache wurde erledigt! +100 Fleisch. Nächstes Mal auf Level ${this.level}!`);

    if (Game.state && Game.state.enemyStats) {
      Game.state.enemyStats.dragonsKilled++;
    }

    if (this.onKilled) this.onKilled(d);
    this._despawn();
  }

  _despawn() {
    this.dragon = null;
    this._gridInserted = false;
    this.world.dragonAttackActive = false;

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
      window.Game.state.state = 'gameover';
      alert('💀 GAME OVER\n\nDer Drache hat dein Schloss zerstört.');
    }
    this._despawn();
  }

  isAlive() {
    return this.dragon !== null;
  }

  isGrounded() {
    return this.dragon !== null && this.dragon.state === 'grounded';
  }

  getState() {
    return this.dragon;
  }

  restoreFromSave(data) {
    if (!data) {
      this.nextSpawnAt = performance.now() + this.firstSpawnDelayMs;
      return;
    }

    const now = performance.now();

    if (data.level !== undefined) {
      this.level = data.level;
    }

    if (data.nextSpawnAt !== undefined) {
      this.nextSpawnAt = data.nextSpawnAt;
    } else if (data.nextSpawnAtRemaining !== undefined) {
      this.nextSpawnAt = now + Math.max(0, data.nextSpawnAtRemaining);
    } else {
      this.nextSpawnAt = now + this.firstSpawnDelayMs;
    }

    if (data.dragon) {
      const d = { ...data.dragon };

      // ⚠️ FIX: buildingCache NICHT aus dem Savegame übernehmen.
      // Enthält JSON-Kopien mit built/ruined vom Speicherzeitpunkt.
      d.buildingCache = [];

      // ⚠️ FIX (KERN-DES-HÄNGERS): lastSearchAt ist ein performance.now()-
      // Wert aus der alten Session. Nach dem Laden liegt er in der Zukunft
      // und blockiert das 200ms-Scan-Gate in _updateFlying dauerhaft.
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

      // ⚠️ FIX: crashStartTime UND crashEndTime konsistent relativ zu now.
      // crashEndTime aus dem Save (Remaining) hat Vorrang; crashStartTime
      // wird daraus abgeleitet, damit die Crash-Animation stimmt.
      if (d.crashEndTimeRemaining !== undefined) {
        d.crashEndTime = now + Math.max(0, d.crashEndTimeRemaining);
        d.crashStartTime = d.crashEndTime - this.CRASH_DURATION_MS;
        delete d.crashEndTimeRemaining;
      } else if (d.state === 'crashing') {
        // Zustand "crashing" ohne gültige Restzeit → sofort beenden
        d.crashStartTime = now;
        d.crashEndTime = now;
      } else {
        d.crashStartTime = now;
        d.crashEndTime = now;
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

      this.dragon = d;

      // ⚠️ FIX: 'crashing' → 'grounded' (Crash-Animation ist nicht wiederherstellbar)
      if (d.state === 'crashing') {
        d.state = 'grounded';
        d.groundedUntil = now + this.GROUND_TIMER_MS;
        d.crashRotation = 0;
        d.crashCurrentScale = this.currentScale;
      }

      // ⚠️ FIX: Wenn 'attacking'/'flying' mit targetBuildingId gespeichert wurde,
      // das Ziel aber inzwischen ruiniert/nicht mehr existent ist → sofort
      // in den Neu-Such-Modus wechseln.
      if ((d.state === 'attacking' || d.state === 'flying') && d.targetBuildingId != null) {
        const target = this.world.buildings.get(d.targetBuildingId);
        if (!target || !target.built || target.ruined || target.isBeingRepaired) {
          d.targetBuildingId = null;
          d.state = 'flying';
          d.lastSearchAt = 0;
        }
      }

      // ⚠️ FIX: crossedBorder true, aber kein gültiges Ziel und kein Castle →
      // fliehen statt in 'attacking' hängen zu bleiben.
      if (d.crossedBorder && !d.targetBuildingId) {
        const castle = this.world.buildings.get(this.world.castleId);
        const hasCastle = castle && castle.built && !castle.ruined && !castle.isBeingRepaired;
        if (!hasCastle) {
          d.state = 'escaping';
          d.targetBuildingId = null;
        } else {
          d.lastSearchAt = 0;   // sofortiger Neu-Scan
        }
      }

      this.world.dragonAttackActive = true;
      console.log(`🐉 Drache aus Savegame wiederhergestellt (State: ${d.state}, HP: ${d.hp}/${d.maxHp}, Level: ${this.level}).`);
    } else {
      console.log(`🐉 Nächster Drache in ca. ${Math.round((this.nextSpawnAt - now) / 60000)} Minuten.`);
    }
  }
};
window.Game = window.Game || {};

Game.RaiderVillage = class RaiderVillage {
  constructor(world, ticker, vm, economy, generation = 0) {
    this.world = world;
    this.ticker = ticker;
    this.vm = vm;
    this.economy = economy;
    this.generation = generation;

    this.castle = null;
    this.towers = [];
    this.buildings = [];

    this.boundarySet = null;
    this.boundaryTiles = null;

    this.warriors = new Map();
    this.nextWarriorId = 1;

    this.attackState = null;
    this.nextAttackAt = 0;
    this.firstAttackDone = false;
    this.onAttackStart = null;

    this.attackTimerFrozen = false;
    this.frozenAttackAt = 0;

    this.RESPAWN_MS = 180000;
    this.ATTACK_INTERVAL_MS = 300000;
    this.ATTACK_FRACTION = 0.85;
    this.LOOT_FRACTION = 0.25;
    this.WARRIOR_SPEED = 2 * 0.85;
    this.WARRIOR_SPEED_BUFFED = this.WARRIOR_SPEED * 1.25;
    this.ATTACK_RANGE = 2;
    this.DEFEND_KEEP_FRACTION = 0.15;
    this.BURN_MS = 5000;
    this.EXPLOSION_MS = 500;
    this.RUINS_MS = 60000;

    this._centerCache = null;
    this.isDestroyed = false;
    this.allBuildingsDestroyed = false;
    this.spawnGracePeriodEnds = 0;

    this.respawnAt = 0;
    this.ruinsUntil = 0;

    ticker.onTick(() => this._tick());
  }

  freezeAttackTimer() {
    if (this.attackTimerFrozen) return;
    this.attackTimerFrozen = true;
    this.frozenAttackAt = Math.max(0, this.nextAttackAt - performance.now());
    console.log(`🧊 Räuber-Angriffstimer eingefroren (${Math.round(this.frozenAttackAt / 1000)}s verbleibend).`);
  }

  unfreezeAttackTimer() {
    if (!this.attackTimerFrozen) return;
    this.attackTimerFrozen = false;
    this.nextAttackAt = performance.now() + this.frozenAttackAt;
    console.log(`🔥 Räuber-Angriffstimer wieder aktiv (${Math.round(this.frozenAttackAt / 1000)}s verbleibend).`);
  }

  // Wird NACH dem Laden aufgerufen, um den eingefrorenen Timer korrekt
  // auf die neue performance.now()-Basis zu setzen.
  _restoreFrozenAttackTimer() {
    if (this.attackTimerFrozen && this.frozenAttackAt > 0) {
      // frozenAttackAt ist die Restzeit in ms. Der nextAttackAt muss
      // so gesetzt werden, dass beim Entfrieren die Restzeit ab jetzt gilt.
      this.nextAttackAt = performance.now() + this.frozenAttackAt;
    }
  }

  spawn() {
    const w = this.world;
    const requiredSize = 20;
    if (w.width < requiredSize || w.height < requiredSize) return false;

    const minDist = Math.min(75, Math.floor(w.width * 0.35));

    const towerCount = Math.min(10, this.generation);

    const MAX_TRIES = 120;
    for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
      const castlePos = this._findCastlePosition();
      if (!castlePos) continue;

      let towerPositions = [];
      if (towerCount > 0) {
        towerPositions = this._findTowerPositions(castlePos.x, castlePos.y, towerCount);
        if (towerPositions.length < towerCount) continue;
      }

      if (!this._isFarEnoughFromPlayer(castlePos, towerPositions, minDist)) continue;
      this._commit(castlePos, towerPositions);
      return true;
    }
    return false;
  }

  _findCastlePosition() {
    const w = this.world;
    const castleDef = Game.BUILDING_TYPES.raiderCastle;
    const cw = castleDef.width, ch = castleDef.height;

    for (let tries = 0; tries < 200; tries++) {
      const x = 2 + Math.floor(Math.random() * (w.width - cw - 4));
      const y = 2 + Math.floor(Math.random() * (w.height - ch - 4));
      if (this._areaIsFree(x, y, cw, ch)) return { x, y };
    }
    return null;
  }

  _findTowerPositions(cx, cy, count) {
    const towerDef = Game.BUILDING_TYPES.raiderWatchtower;
    const tw = towerDef.width, th = towerDef.height;
    const castleDef = Game.BUILDING_TYPES.raiderCastle;
    const cw = castleDef.width, ch = castleDef.height;

    const positions = [];
    const MIN_GAP = 3, MAX_DIST = 14;
    const castleCenterX = cx + Math.floor(cw / 2);
    const castleCenterY = cy + Math.floor(ch / 2);

    for (let i = 0; i < 500 && positions.length < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 3 + Math.random() * (MAX_DIST - 3);
      const px = Math.round(castleCenterX + Math.cos(angle) * dist - tw / 2);
      const py = Math.round(castleCenterY + Math.sin(angle) * dist - th / 2);

      if (px < 1 || py < 1 || px + tw > this.world.width - 1 || py + th > this.world.height - 1) continue;
      if (!this._areaIsFree(px, py, tw, th)) continue;

      const dxC = (px + tw / 2) - castleCenterX;
      const dyC = (py + th / 2) - castleCenterY;
      if (Math.sqrt(dxC * dxC + dyC * dyC) > MAX_DIST + 2) continue;

      let tooClose = false;
      for (const p of positions) {
        const dx = (p.x + tw / 2) - (px + tw / 2);
        const dy = (p.y + th / 2) - (py + th / 2);
        if (Math.sqrt(dx * dx + dy * dy) < MIN_GAP) { tooClose = true; break; }
      }
      if (tooClose) continue;

      positions.push({ x: px, y: py });
    }
    return positions;
  }

  _areaIsFree(x, y, w, h) {
    const world = this.world;
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const px = x + dx, py = y + dy;
        if (!world.inBounds(px, py)) return false;
        if (world.getTerrainId(px, py) !== 'grass') return false;
        if (world.occupied.has(px + ',' + py)) return false;
        if (world.isStoneAt(px, py)) return false;
        if (world.isDecoAt(px, py)) return false;
        if (world.isTreeAt(px, py)) return false;
      }
    }
    return true;
  }

  _isFarEnoughFromPlayer(castlePos, towerPositions, minDist = 75) {
    if (this.world.castleId === null) return true;
    const playerCastle = this.world.buildings.get(this.world.castleId);
    const px = playerCastle.x + playerCastle.w / 2;
    const py = playerCastle.y + playerCastle.h / 2;

    const allBuildings = [castlePos, ...towerPositions];
    for (const b of allBuildings) {
      const bx = b.x + (b.w || 1) / 2;
      const by = b.y + (b.h || 1) / 2;
      const dx = bx - px;
      const dy = by - py;
      if (Math.sqrt(dx * dx + dy * dy) < minDist) return false;
    }
    return true;
  }

  _commit(castlePos, towerPositions) {
    const castleDef = Game.BUILDING_TYPES.raiderCastle;
    const towerDef = Game.BUILDING_TYPES.raiderWatchtower;

    this.castle = this._createRaiderBuilding(castleDef, castlePos.x, castlePos.y);
    this.buildings.push(this.castle);

    for (const p of towerPositions) {
      const tower = this._createRaiderBuilding(towerDef, p.x, p.y);
      this.towers.push(tower);
      this.buildings.push(tower);
    }

    this._spawnAllWarriors();
    this._computeBoundary();
    this.spawnGracePeriodEnds = performance.now() + 5000;
  }

  _createRaiderBuilding(def, x, y) {
    const world = this.world;
    const w = def.width || 1;
    const h = def.height || 1;

    const b = {
      id: world.nextBuildingId++,
      def, x, y, w, h,
      built: true,
      isRaiderBuilding: true,
      residents: [],
      workerId: null,
      warriorSlots: [],
      maxWarriors: def.maxWarriors || 0,
      paused: false,
      isDestroyed: false,
      isBurning: false,
      burnEndsAt: 0,
      explodingUntil: 0,
      ruinsUntil: 0,
      arrowTowerCooldown: 0
    };

    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const px = x + dx, py = y + dy;
        world.occupied.add(px + ',' + py);
        if (world.isTreeAt(px, py)) world.removeTreeByTile(px, py);
        if (world.isDecoAt(px, py)) world.removeDecoByTile(px, py);
      }
    }
    return b;
  }

  _spawnAllWarriors() {
    const all = [this.castle, ...this.towers];
    for (const b of all) {
      const count = b.maxWarriors || 0;
      for (let i = 0; i < count; i++) {
        this._spawnWarrior(b);
      }
    }
  }

  _spawnWarrior(homeBuilding) {
    const id = this.nextWarriorId++;
    const hx = homeBuilding.x + (homeBuilding.w || 1) / 2;
    const hy = homeBuilding.y + (homeBuilding.h || 1) / 2;
    const angle = Math.random() * Math.PI * 2;
    const radius = (Math.max(homeBuilding.w || 1, homeBuilding.h || 1) / 2) + 1.5; 

    const startX = hx + Math.cos(angle) * radius;
    const startY = hy + Math.sin(angle) * radius;

    const w = {
      id, x: startX, y: startY,
      targetX: startX, targetY: startY,
      renderX: startX, renderY: startY, 
      homeBuildingId: homeBuilding.id,
      state: 'idle', inAttack: false, carryingLoot: false,
      asset: 'images/villager-krieger-blau.webp',
      dead: false, nextAttackAt: 0, hidden: true
    };
    this.warriors.set(id, w);
    return w;
  }

  _computeBoundary() {
    const PAD = 5;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const b of this.buildings) {
      minX = Math.min(minX, b.x);
      minY = Math.min(minY, b.y);
      maxX = Math.max(maxX, b.x + (b.w || 1) - 1);
      maxY = Math.max(maxY, b.y + (b.h || 1) - 1);
    }
    minX = Math.max(0, minX - PAD);
    minY = Math.max(0, minY - PAD);
    maxX = Math.min(this.world.width - 1, maxX + PAD);
    maxY = Math.min(this.world.height - 1, maxY + PAD);

    this.bounds = { minX, minY, maxX, maxY };

    const set = new Set();
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) set.add(x + ',' + y);
    }
    this.boundarySet = set;

    const border = [];
    for (let x = minX; x <= maxX; x++) {
      border.push({ x, y: minY, top: true, bottom: false, left: x === minX, right: x === maxX });
      border.push({ x, y: maxY, top: false, bottom: true, left: x === minX, right: x === maxX });
    }
    for (let y = minY + 1; y < maxY; y++) {
      border.push({ x: minX, y, top: false, bottom: false, left: true, right: false });
      border.push({ x: maxX, y, top: false, bottom: false, left: false, right: true });
    }
    this.boundaryTiles = border;
    this._centerCache = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
  }

  isInRaiderTerritory(x, y) {
    if (!this.boundarySet) return false;
    return this.boundarySet.has(Math.floor(x) + ',' + Math.floor(y));
  }

  getCenter() {
    return this._centerCache || { x: 0, y: 0 };
  }

  _tick() {
    const now = performance.now();

    if (this.isDestroyed) {
      if (this.respawnAt > 0 && now >= this.respawnAt) {
        this.respawnAt = 0;
        if (window.Game && window.Game.state && typeof window.Game.state.respawnRaiders === 'function') {
          const success = window.Game.state.respawnRaiders(this.generation + 1);
          if (!success) {
            this.respawnAt = now + 60000;
          }
        }
      }
      return;
    }

    this._tickBurning(now);
    this._tickRespawn(now);
    this._tickAttack(now);
    this._tickWarriorSeparation();
    
    if (now > this.spawnGracePeriodEnds) {
      this._checkDestroyedBuildings();
    }
  }

  _tickBurning(now) {
    let allRuinsExpired = true;
    let anyBuildingNotDestroyed = false;

    for (const b of this.buildings) {
      if (b.isBurning && !b.isDestroyed) {
        if (now >= b.burnEndsAt) {
          b.isBurning = false;
          b.isDestroyed = true;
          b.explodingUntil = now + this.EXPLOSION_MS;
          b.ruinsUntil = now + this.RUINS_MS;

          if (window.Game && window.Game.state && window.Game.state.renderer) {
            window.Game.state.renderer.markStaticDirty();
          }
        }
      }

      if (b.isDestroyed && b.explodingUntil > 0 && now < b.explodingUntil) {
        allRuinsExpired = false;
        continue;
      }

      if (b.isDestroyed && b.explodingUntil > 0 && now >= b.explodingUntil) {
        if (now < b.ruinsUntil) {
          allRuinsExpired = false;
          continue;
        }
        
        if (b.ruinsUntil > 0 && now >= b.ruinsUntil) {
          b.ruinsUntil = 0;
          b.explodingUntil = 0;
          
          for (let dy = 0; dy < (b.h || 1); dy++) {
            for (let dx = 0; dx < (b.w || 1); dx++) {
              this.world.occupied.delete((b.x + dx) + ',' + (b.y + dy));
            }
          }
          
          if (window.Game && window.Game.state && window.Game.state.renderer) {
            window.Game.state.renderer.markStaticDirty();
          }
        }
        continue;
      }

      if (!b.isDestroyed) {
        anyBuildingNotDestroyed = true;
        allRuinsExpired = false;
      }
    }

    const beforeCount = this.buildings.length;
    this.buildings = this.buildings.filter(b => !(b.isDestroyed && b.ruinsUntil === 0 && b.explodingUntil === 0));
    this.towers = this.towers.filter(b => this.buildings.includes(b));
    if (this.castle && !this.buildings.includes(this.castle)) {
      this.castle = null;
    }

    if (beforeCount !== this.buildings.length) {
      if (this.buildings.length === 0) {
        this._finalizeDestroyVillage(now);
      }
    }
  }

  _tickRespawn(now) {
    for (const w of this.warriors.values()) {
      if (!w.dead) continue;
      if (now < w.respawnAt) continue;
      
      const home = this.buildings.find(b => b.id === w.homeBuildingId);
      if (!home || home.isDestroyed || home.isBurning) continue;

      const hx = home.x + (home.w || 1) / 2;
      const hy = home.y + (home.h || 1) / 2;

      w.x = hx;
      w.y = hy;
      w.targetX = hx;
      w.targetY = hy;
      w.renderX = w.x;
      w.renderY = w.y;
      w.dead = false;
      w.state = 'idle';
      w.inAttack = false;
      w.carryingLoot = false;
      w.hidden = true;
    }
  }

  _tickAttack(now) {
    if (this.attackTimerFrozen) {
      if (this.attackState) {
        this._tickActiveAttack(now);
      }
      return;
    }

    if (this.attackState) {
      this._tickActiveAttack(now);
      return;
    }
    if (!this.firstAttackDone) {
      this._startAttack(now);
      this.firstAttackDone = true;
      return;
    }
    if (now < this.nextAttackAt) return;
    this._startAttack(now);
  }

  _startAttack(now) {
    const all = [];
    for (const w of this.warriors.values()) {
      if (w.dead) continue;
      all.push(w);
    }
    if (all.length === 0) {
      this.nextAttackAt = now + this.ATTACK_INTERVAL_MS;
      return;
    }

    const attackers = [];
    for (const b of this.buildings) {
      if (b.isDestroyed || b.isBurning) continue;
      const inBuilding = all.filter(w => w.homeBuildingId === b.id);
      if (inBuilding.length === 0) continue;
      const count = Math.max(1, Math.floor(inBuilding.length * this.ATTACK_FRACTION));
      const sorted = inBuilding.slice().sort((a, x) => a.id - x.id);
      attackers.push(...sorted.slice(0, count));
    }

    if (attackers.length === 0) {
      this.nextAttackAt = now + this.ATTACK_INTERVAL_MS;
      return;
    }

    for (const w of attackers) {
      w.inAttack = true;
      w.state = 'marching_to_player';
      w.carryingLoot = false;
      w.hidden = false;
      
      const home = this.buildings.find(b => b.id === w.homeBuildingId);
      if (home) {
        w.x = home.x + (home.w || 1) / 2;
        w.y = home.y + (home.h || 1) / 2;
        w.targetX = w.x;
        w.targetY = w.y;
        w.renderX = w.x;
        w.renderY = w.y;
      }
    }

    this.attackState = {
      startedAt: now,
      participants: new Set(attackers.map(w => w.id)),
      loot: null,
      lootClaimed: false,
      lootLost: false,
      lootSubtracted: false
    };

    if (this.onAttackStart) this.onAttackStart(this.attackState);
  }

  _tickActiveAttack(now) {
    const st = this.attackState;
    let anyAlive = false;

    for (const w of this.warriors.values()) {
      if (!st.participants.has(w.id)) continue;
      if (w.dead) continue;
      anyAlive = true;

      if (w.carryingLoot && this.isInRaiderTerritory(w.x, w.y)) {
        if (!st.lootLost) {
          st.lootLost = true;
        }
        w.carryingLoot = false;
        if (w.state === 'retreating') {
          w.state = 'returning_to_house';
        }
      }
    }

    if (!anyAlive) {
      this._refundLoot();
      this._endAttack(now);
      return;
    }

    let anyStillFighting = false;
    for (const w of this.warriors.values()) {
      if (!st.participants.has(w.id)) continue;
      if (w.dead) continue;
      if (w.state === 'marching_to_player' || w.state === 'retreating' || w.carryingLoot) {
        anyStillFighting = true;
        break;
      }
    }

    if (!anyStillFighting) {
      this._refundLoot();
      this._endAttack(now);
    }
  }

  _refundLoot() {
    const st = this.attackState;
    if (!st) return;
    if (!st.loot) return;
    if (!st.lootSubtracted) return;
    if (st.lootLost) return;
    if (st.lootRefunded) return;

    for (const k in st.loot) {
      if (Game.state && typeof Game.state.addResource === 'function') {
        Game.state.addResource(k, st.loot[k]);
      } else {
        this.economy.res[k] = (this.economy.res[k] || 0) + st.loot[k];
      }
    }
    if (this.economy.onChange) this.economy.onChange();
    st.lootRefunded = true;
    console.log("💰 Beute zurückerstattet:", st.loot);
  }

  _endAttack(now) {
    if (this.attackState) {
      for (const w of this.warriors.values()) {
        if (this.attackState.participants.has(w.id)) {
          if (w.dead) continue;
          w.inAttack = false;
          w.state = 'returning_to_house';
          w.carryingLoot = false;
          w.hidden = false;
        }
      }
    }
    this.attackState = null;
    this.nextAttackAt = now + this.ATTACK_INTERVAL_MS;
  }

  claimLoot() {
    if (!this.attackState || this.attackState.lootClaimed) return;
    const loot = {};
    for (const k in this.economy.res) {
      const val = this.economy.res[k] || 0;
      const take = Math.floor(val * this.LOOT_FRACTION);
      if (take > 0) loot[k] = take;
    }
    this.attackState.loot = loot;
    this.attackState.lootClaimed = true;

    this._subtractLoot();

    this._assignLootCarrier();
  }

  _subtractLoot() {
    const st = this.attackState;
    if (!st || !st.loot) return;
    if (st.lootSubtracted) return;
    for (const k in st.loot) {
      this.economy.res[k] = Math.max(0, (this.economy.res[k] || 0) - st.loot[k]);
    }
    if (this.economy.onChange) this.economy.onChange();
    st.lootSubtracted = true;
    console.log("💰 Beute gestohlen:", st.loot);
  }

  _assignLootCarrier() {
    if (!this.attackState || !this.attackState.loot) return;
    for (const w of this.warriors.values()) {
      if (w.dead || !w.inAttack || w.carryingLoot) continue;
      if (w.carryingLoot) return;
    }
    let best = null;
    for (const wid of this.attackState.participants) {
      const w = this.warriors.get(wid);
      if (w && !w.dead && (!best || w.id < best.id)) best = w;
    }
    if (best) {
      best.carryingLoot = true;
      best.state = 'retreating';
    }
  }

  markWarriorDead(id) {
    const w = this.warriors.get(id);
    if (!w || w.dead) return;
    const wasCarryingLoot = w.carryingLoot;
    w.dead = true;
    w.respawnAt = performance.now() + this.RESPAWN_MS;
    w.state = 'idle';
    w.carryingLoot = false;
    w.hidden = true;

    if (Game.state && Game.state.enemyStats) {
      Game.state.enemyStats.raidersKilled++;
    }

    this._checkBuildingEmpty(w.homeBuildingId);

    if (wasCarryingLoot && this.attackState && this.attackState.loot) {
      this._assignLootCarrier();
    }
  }

  _checkBuildingEmpty(buildingId) {
    const b = this.buildings.find(x => x.id === buildingId);
    if (!b || b.isDestroyed || b.isBurning) return;

    let aliveCount = 0;
    for (const w of this.warriors.values()) {
      if (w.homeBuildingId === b.id && !w.dead) aliveCount++;
    }

    if (aliveCount === 0) {
      this._destroyBuilding(b);
    }
  }

  _checkDestroyedBuildings() {
    if (this.isDestroyed) return;
    if (this.buildings.length === 0) return;

    for (const b of this.buildings) {
      if (b.isDestroyed || b.isBurning) continue;
      let aliveCount = 0;
      for (const w of this.warriors.values()) {
        if (w.homeBuildingId === b.id && !w.dead) aliveCount++;
      }
      if (aliveCount === 0) {
        this._destroyBuilding(b);
      }
    }

    const allDestroyed = this.buildings.every(b => b.isDestroyed);
    if (allDestroyed) {
      this.allBuildingsDestroyed = true;
    }
  }

  _destroyBuilding(b) {
    if (b.isDestroyed || b.isBurning) return;
    b.isBurning = true;
    b.burnEndsAt = performance.now() + this.BURN_MS;

    if (Game.state && Game.state.enemyStats) {
      if (b.def.id === 'raiderCastle') {
        Game.state.enemyStats.raiderCastlesDestroyed++;
      } else {
        Game.state.enemyStats.raiderHousesDestroyed++;
      }
    }
  }

  _finalizeDestroyVillage(now) {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    this.boundarySet = null;
    this.boundaryTiles = null;

    if (Game.state && typeof Game.state.addResource === 'function') {
      Game.state.addResource('beer', 50);
      Game.state.addResource('wood', 50);
      Game.state.addResource('woodPlank', 50);
    } else {
      this.economy.res.beer = (this.economy.res.beer || 0) + 50;
      this.economy.res.wood = (this.economy.res.wood || 0) + 50;
      this.economy.res.woodPlank = (this.economy.res.woodPlank || 0) + 50;
    }
    if (this.economy.onChange) this.economy.onChange();

    for (const b of this.buildings) {
      for (let dy = 0; dy < (b.h || 1); dy++) {
        for (let dx = 0; dx < (b.w || 1); dx++) {
          this.world.occupied.delete((b.x + dx) + ',' + (b.y + dy));
        }
      }
    }

    for (const w of this.warriors.values()) {
      w.dead = true;
      w.hidden = true;
    }
    this.warriors.clear();
    this.buildings = [];
    this.castle = null;
    this.towers = [];

    this.bounds = null;
    this._centerCache = null;

    if (window.Game && window.Game.state && window.Game.state.renderer) {
      window.Game.state.renderer.raiderVillage = null;
      window.Game.state.renderer.markStaticDirty();
    }

    const minMs = 5 * 60 * 1000;
    const maxMs = 15 * 60 * 1000;
    const delay = minMs + Math.random() * (maxMs - minMs);
    this.respawnAt = now + delay;

    console.log(`🏆 Das Räuberlager wurde zerstört! Nächstes Lager erscheint in ${Math.round(delay / 60000)} Minuten.`);
  }

  _destroyVillage() {
    this._finalizeDestroyVillage(performance.now());
  }

  getWarrior(id) {
    return this.warriors.get(id);
  }

  getAliveWarriors() {
    const out = [];
    for (const w of this.warriors.values()) {
      if (!w.dead) out.push(w);
    }
    return out;
  }

  _tickWarriorSeparation() {
    const arr = Array.from(this.warriors.values()).filter(w => !w.dead && !w.hidden);
    for (let i = 0; i < arr.length; i++) {
      const a = arr[i];
      for (let j = i + 1; j < arr.length; j++) {
        const b = arr[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 0.36 && d2 > 0.0001) {
          const d = Math.sqrt(d2);
          const push = (0.6 - d) * 0.5;
          const nx = dx / d, ny = dy / d;
          a.x += nx * push;
          a.y += ny * push;
          b.x -= nx * push;
          b.y -= ny * push;
        }
      }
    }
  }
};
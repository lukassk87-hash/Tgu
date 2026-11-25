window.Game = window.Game || {};

Game.ZombieManager = class ZombieManager {
  constructor(world, ticker, vm) {
    this.world = world;
    this.ticker = ticker;
    this.vm = vm;
    this.zombies = [];
    this.nextId = 1;
    
    this.firstSpawnTime = 45;
    this.spawnCooldown = 45;
    this.firstSpawnDone = false;

    this.difficulty = 'normal';

    this.asset = 'images/zombie.webp';
    this.speed = 1.7;
    this.detectRadius = 15;

    this.infectsDelayed = false;
    this.infectiousAt = 0;
    this._virusEvolvedFired = false;

    this.onVirusEvolved = null;
    this.onZombieKilled = null;

    this._siegeStartTime = 0;
    
    this.ticker.onTick((tick) => {
      this.tickSpawn(tick);
      this._checkCastleSiege(performance.now());
    });
  }

  start(now) {
    if (this.infectsDelayed) {
      this.infectiousAt = now + 10 * 60 * 1000;
      this._virusEvolvedFired = false;
    } else {
      this.infectiousAt = 0;
      this._virusEvolvedFired = true;
    }
  }

  updateInfectionStatus(now) {
    if (!this.infectsDelayed) return;
    if (this._virusEvolvedFired) return;
    if (this.infectiousAt === 0) return;
    if (now < this.infectiousAt) return;

    this._virusEvolvedFired = true;
    if (this.onVirusEvolved) this.onVirusEvolved();
  }

  isInfectious(now) {
    if (!this.infectsDelayed) return true;
    if (this.infectiousAt === 0) return true;
    return now >= this.infectiousAt;
  }

  _checkCastleSiege(now) {
    if (!window.Game.state || window.Game.state.state === 'gameover') return;

    const w = this.world;
    if (w.castleId === null) return;
    const castle = w.buildings.get(w.castleId);
    if (!castle || castle.ruined) return;

    const tiles = w.getBuildingTiles(castle);
    let zombieOnCastle = false;

    for (const z of this.zombies) {
      if (z.state === 'dead') continue;
      const zx = Math.floor(z.x);
      const zy = Math.floor(z.y);
      for (const t of tiles) {
        if (t.x === zx && t.y === zy) {
          zombieOnCastle = true;
          break;
        }
      }
      if (zombieOnCastle) break;
    }

    const siegeWarningUI = document.getElementById('zombieSiegeWarning');
    const siegeCountdownUI = document.getElementById('zombieSiegeCountdown');

    if (!zombieOnCastle) {
      this._siegeStartTime = 0;
      if (siegeWarningUI) siegeWarningUI.classList.add('hidden');
      return;
    }

    const cx = castle.x + (castle.w || 1) / 2;
    const cy = castle.y + (castle.h || 1) / 2;
    // Reichweite auf 10 Felder erhöht
    const radiusSq = 10 * 10; 
    let hasDefender = false;

    for (const v of this.vm.villagers.values()) {
      if (v.job !== 'warrior') continue;
      if (v.state === 'dead') continue;
      const dx = v.x - cx;
      const dy = v.y - cy;
      if (dx * dx + dy * dy <= radiusSq) {
        hasDefender = true;
        break;
      }
    }

    if (hasDefender) {
      this._siegeStartTime = 0;
      if (siegeWarningUI) siegeWarningUI.classList.add('hidden');
      return;
    }

    if (this._siegeStartTime === 0) {
      this._siegeStartTime = now;
    }

    const elapsed = now - this._siegeStartTime;
    const remaining = Math.max(0, 10 - Math.floor(elapsed / 1000));

    // UI updaten
    if (siegeWarningUI && siegeWarningUI.classList.contains('hidden')) {
      siegeWarningUI.classList.remove('hidden');
    }
    if (siegeCountdownUI && siegeCountdownUI.textContent !== String(remaining)) {
      siegeCountdownUI.textContent = remaining;
    }

    // Game Over
    if (elapsed >= 10000) {
      this._siegeStartTime = 0;
      if (siegeWarningUI) siegeWarningUI.classList.add('hidden');
      
      window.Game.state.paused = true;
      window.Game.state.gameOver = true;
      window.Game.state.state = 'gameover';
      
      if (Game.showGameOver) {
        Game.showGameOver(Game.Lang.t('gameover_zombie'));
      }
    }
  }

  _getGroupMultiplier() {
    switch (this.difficulty) {
      case 'none': return 0;
      case 'easy': return 0.05;
      case 'normal': return 0.07 + Math.random() * 0.055;
      case 'hard': return 0.25;
      case 'insane': return 0.25 + Math.random() * 0.25;
      case 'impossible': return 1.0;
      default: return 0.05;
    }
  }

  tickSpawn(tick) {
    if (this.difficulty === 'none') return;

    if (!this.firstSpawnDone && !this._firstTickInitialized) {
      this._firstTickInitialized = true;
      this.spawnCooldown = this.firstSpawnTime !== undefined ? this.firstSpawnTime : 45;
    }

    this.spawnCooldown--;
    if (this.spawnCooldown <= 0) {
      this.spawnGroup();
      this.firstSpawnDone = true;
      this.spawnCooldown = 90 + Math.floor(Math.random() * 90);
    }
  }

  spawnGroup() {
    const allVillagers = this.vm.getAllVillagers();
    const villagerCount = allVillagers.length;
    if (villagerCount === 0) return;

    const multiplier = this._getGroupMultiplier();
    if (multiplier <= 0) return;

    let groupSize = Math.max(1, Math.floor(villagerCount * multiplier));
    if (groupSize <= 0) return;

    const center = this._findGroupCenter();
    if (!center) return;

    for (let i = 0; i < groupSize; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 4;
      let spawnX = center.x + Math.cos(angle) * radius;
      let spawnY = center.y + Math.sin(angle) * radius;
      
      spawnX = Math.max(0.5, Math.min(this.world.width - 0.5, spawnX));
      spawnY = Math.max(0.5, Math.min(this.world.height - 0.5, spawnY));
      
      let attempts = 0;
      while (this._isTooCloseToAnotherZombie(spawnX, spawnY) && attempts < 10) {
        spawnX = center.x + (Math.random() - 0.5) * 8;
        spawnY = center.y + (Math.random() - 0.5) * 8;
        spawnX = Math.max(0.5, Math.min(this.world.width - 0.5, spawnX));
        spawnY = Math.max(0.5, Math.min(this.world.height - 0.5, spawnY));
        attempts++;
      }
      
      this.spawnZombieAt(spawnX, spawnY);
    }
  }

  _findGroupCenter() {
    const w = this.world;
    let attempts = 0;
    while (attempts < 100) {
      attempts++;
      const x = 2 + Math.random() * (w.width - 4);
      const y = 2 + Math.random() * (w.height - 4);
      if (!w.isInTerritory(x, y)) {
        return { x, y };
      }
    }
    return { x: Math.random() * w.width, y: Math.random() * w.height };
  }

  _isTooCloseToAnotherZombie(x, y) {
    const minDistSq = 0.8 * 0.8;
    for (const z of this.zombies) {
      if (z.state === 'dead') continue;
      const dx = z.x - x;
      const dy = z.y - y;
      if (dx * dx + dy * dy < minDistSq) return true;
    }
    return false;
  }

  spawnZombie() {
    const w = this.world;
    let attempts = 0;
    let spawnX, spawnY;
    while (attempts < 200) {
      attempts++;
      const x = Math.floor(Math.random() * w.width);
      const y = Math.floor(Math.random() * w.height);
      if (!w.isInTerritory(x, y)) {
        spawnX = x + 0.5;
        spawnY = y + 0.5;
        break;
      }
    }
    if (spawnX === undefined) return null;
    return this.spawnZombieAt(spawnX, spawnY);
  }

  spawnZombieAt(x, y) {
    const z = {
      id: this.nextId++,
      x: x, y: y,
      targetX: x, targetY: y,
      renderX: x, renderY: y,
      asset: this.asset,
      state: 'alive',
      spawnedAt: performance.now()
    };
    this.zombies.push(z);
    return z;
  }

  getCastleCenter() {
    const w = this.world;
    if (w.castleId === null) return null;
    const castle = w.buildings.get(w.castleId);
    return {
      x: castle.x + (castle.w || 1) / 2,
      y: castle.y + (castle.h || 1) / 2
    };
  }

   serialize(now) {
    return {
      nextId: this.nextId,
      difficulty: this.difficulty,
      firstSpawnDone: this.firstSpawnDone,
      spawnCooldown: this.spawnCooldown,
      zombies: this.zombies.map(z => ({
        ...z,
        combatUntilRemaining: (z._combatUntil || 0) > 0 ? Math.max(0, z._combatUntil - now) : 0,
        _combatUntil: undefined
      })),
      infectsDelayed: this.infectsDelayed,
      infectiousAtRemaining: this.infectiousAt > 0 ? Math.max(0, this.infectiousAt - now) : 0,
      virusEvolvedFired: this._virusEvolvedFired
    };
  }


  restoreFromSave(data, now) {
    this._siegeStartTime = 0;
    const siegeWarningUI = document.getElementById('zombieSiegeWarning');
    if (siegeWarningUI) siegeWarningUI.classList.add('hidden');

    if (!data) {
      this.nextId = 1;
      this.difficulty = 'normal';
      this.firstSpawnDone = false;
      this.spawnCooldown = 45;
      this.zombies = [];
      this.infectsDelayed = false;
      this.infectiousAt = 0;
      this._virusEvolvedFired = false;
      this._firstTickInitialized = false;
      return;
    }

      this.nextId = data.nextId || 1;
  this.difficulty = data.difficulty || 'normal';
  this.firstSpawnDone = !!data.firstSpawnDone;
  this.spawnCooldown = data.spawnCooldown !== undefined ? data.spawnCooldown : 45;
  this.zombies = data.zombies ? data.zombies.map(z => {
    const restored = { ...z };
    if (restored.combatUntilRemaining > 0) {
      restored._combatUntil = now + restored.combatUntilRemaining;
    } else {
      restored._combatUntil = 0;
    }
    delete restored.combatUntilRemaining;
    return restored;
  }) : [];


    this.infectsDelayed = !!data.infectsDelayed;
    if (data.infectiousAtRemaining > 0) {
      this.infectiousAt = now + data.infectiousAtRemaining;
      this._virusEvolvedFired = false;
    } else if (data.virusEvolvedFired) {
      this.infectiousAt = 0;
      this._virusEvolvedFired = true;
    } else {
      this.infectiousAt = 0;
      this._virusEvolvedFired = !this.infectsDelayed;
    }

    this._firstTickInitialized = true;
  }
};

window.Game = window.Game || {};

Game.ZombieManager = class ZombieManager {
  constructor(world, ticker, vm) {
    this.world = world;
    this.ticker = ticker;
    this.vm = vm;
    this.zombies = [];
    this.nextId = 1;
    
    // Erstangriff: wird von außen gesetzt (game.firstZombieSpawn)
    this.firstSpawnTime = 45;
    this.spawnCooldown = 45;
    this.firstSpawnDone = false;

    // Schwierigkeit: 'none' | 'easy' | 'normal' | 'hard' | 'insane' | 'impossible'
    this.difficulty = 'normal';

    this.asset = 'images/zombie.webp';
    this.speed = 1.7;
    this.detectRadius = 15;
    
    this.onZombieKilled = null;
    
    this.ticker.onTick((tick) => this.tickSpawn(tick));
  }

  _getGroupMultiplier() {
    switch (this.difficulty) {
      case 'none':
        return 0;
      case 'easy':
        return 0.05;
      case 'normal':
        return 0.07 + Math.random() * 0.055;
      case 'hard':
        return 0.25;
      case 'insane':
        return 0.25 + Math.random() * 0.25;
      case 'impossible':
        return 1.0;
      default:
        return 0.05;
    }
  }

  tickSpawn(tick) {
    if (this.difficulty === 'none') return;

    this.spawnCooldown--;
    if (this.spawnCooldown <= 0) {
      this.spawnGroup();
      this.firstSpawnDone = true;
      // Normaler Cooldown nach dem ersten Angriff: 45–90 Sekunden
      this.spawnCooldown = 45 + Math.floor(Math.random() * 45);
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
      renderX: x, renderY: y,
      asset: this.asset,
      state: 'alive'
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
};
window.Game = window.Game || {};

Game.ZombieManager = class ZombieManager {
  constructor(world, ticker, vm) {
    this.world = world;
    this.ticker = ticker;
    this.vm = vm;
    this.zombies = [];
    this.nextId = 1;
    this.spawnCooldown = 45;
    this.maxZombies = 500;
    
    this.asset = 'images/zombie.webp';
    this.speed = 1.7;
    this.detectRadius = 15;
    
    this.onZombieKilled = null;
    
    this.ticker.onTick((tick) => this.tickSpawn(tick));
  }

  tickSpawn(tick) {
    if (this.zombies.length < this.maxZombies) {
      this.spawnCooldown--;
      if (this.spawnCooldown <= 0) {
        this.spawnGroup();
        this.spawnCooldown = 45 + Math.floor(Math.random() * 45);
      }
    }
  }

  /**
   * Spawnt eine Gruppe Zombies in einem 4-Felder-Radius außerhalb des Territoriums.
   * Die Gruppengröße richtet sich nach der Einwohnerzahl (10-15%).
   */
  spawnGroup() {
    const allVillagers = this.vm.getAllVillagers();
    const villagerCount = allVillagers.length;
    
    // 10-15% der Einwohner, mindestens 1, maximal maxZombies
    const minSize = Math.max(5, Math.floor(villagerCount * 0.10));
    const maxSize = Math.max(minSize, Math.ceil(villagerCount * 0.15));
    let groupSize = minSize + Math.floor(Math.random() * (maxSize - minSize + 1));
    groupSize = Math.min(groupSize, this.maxZombies - this.zombies.length);
    
    if (groupSize <= 0) return;

    // Zentrum der Gruppe finden (außerhalb des Territoriums)
    const center = this._findGroupCenter();
    if (!center) return;

    // Alle Zombies der Gruppe im Umkreis von 4 Feldern spawnen
    for (let i = 0; i < groupSize; i++) {
      // Zufällige Position im Radius 4 um das Zentrum
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 4;
      let spawnX = center.x + Math.cos(angle) * radius;
      let spawnY = center.y + Math.sin(angle) * radius;
      
      // In der Welt halten
      spawnX = Math.max(0.5, Math.min(this.world.width - 0.5, spawnX));
      spawnY = Math.max(0.5, Math.min(this.world.height - 0.5, spawnY));
      
      // Prüfen, ob die Position frei ist (kein anderer Zombie zu nah)
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

  /**
   * Sucht ein zufälliges Zentrum außerhalb des Territoriums.
   */
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
    // Fallback: irgendwo hin
    return { x: Math.random() * w.width, y: Math.random() * w.height };
  }

  /**
   * Prüft, ob ein Zombie an (x, y) zu nah an einem anderen steht.
   */
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
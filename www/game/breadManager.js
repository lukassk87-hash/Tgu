window.Game = window.Game || {};

Game.BreadManager = class BreadManager {
  constructor() {
    this.queue = [];
  }

  _findInsertIndex(v) {
    let lo = 0;
    let hi = this.queue.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.queue[mid].nextBreadAt < v.nextBreadAt) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  add(v) {
    if (v.nextBreadAt === undefined || v.nextBreadAt === null) {
      v.nextBreadAt = performance.now();
    }
    const idx = this._findInsertIndex(v);
    this.queue.splice(idx, 0, v);
  }

  remove(v) {
    const idx = this.queue.indexOf(v);
    if (idx !== -1) this.queue.splice(idx, 1);
  }

  tick(now, economy, vm) {
    // 1. Todesfälle prüfen
    while (this.queue.length > 0) {
      const front = this.queue[0];
      const waitTime = now - front.nextBreadAt;
      if (waitTime > 240000) {
        this.queue.shift();
        front._diedFromHunger = true;
        vm.killVillager(front);
      } else {
        break;
      }
    }

    // 2. Brot verteilen
    while (this.queue.length > 0 && (economy.res.bread || 0) > 0) {
      const front = this.queue[0];
      if (front.nextBreadAt > now) break;

      economy.res.bread -= 1;
      // NEU: Nächste Mahlzeit 120s ab jetzt, nicht ab dem alten Zeitpunkt
      front.nextBreadAt = now + 120000;
      if (economy.onChange) economy.onChange();

      this.queue.shift();
      const idx = this._findInsertIndex(front);
      this.queue.splice(idx, 0, front);
    }
  }

  getStats(now) {
    let needsBread = 0;
    let nearDeath = 0;
    for (const v of this.queue) {
      if (v.nextBreadAt <= now) needsBread++;
      if (now - v.nextBreadAt > 120000) nearDeath++;
    }
    return { needsBread, nearDeath };
  }
};
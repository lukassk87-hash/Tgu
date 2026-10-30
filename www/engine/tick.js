// Namespace initialisieren (einmalig)
window.Game = window.Game || {};

Game.Ticker = class Ticker {
  constructor(hz = 1) {
    this.interval = 1000 / hz;
    this.acc = 0;
    this.tick = 0;
    this._handlers = [];
  }
  onTick(fn) { this._handlers.push(fn); }

  update(dtMs) {
    this.acc += dtMs;
    while (this.acc >= this.interval) {
      this.acc -= this.interval;
      this.tick++;
      for (const fn of this._handlers) fn(this.tick);
    }
  }
};
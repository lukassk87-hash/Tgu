window.Game = window.Game || {};

Game.AudioManager = class AudioManager {
  constructor() {
    this.sounds = new Map();       // path -> HTMLAudioElement (preloaded)
    this.activeLoops = new Map();  // key -> { audio, path, waitingForUser }
    this.enabled = true;
    this.userHasInteracted = false;
    this._pendingLoops = [];       // Loops, die auf User-Interaktion warten
    this._pausedLoops = new Set(); // Loops, die durch Pause gestoppt wurden

    // Auf die erste User-Interaktion warten
    const markInteracted = () => {
      if (this.userHasInteracted) return;
      this.userHasInteracted = true;
      // Alle wartenden Loops starten
      for (const entry of this._pendingLoops) {
        try {
          entry.audio.play().catch(() => {});
        } catch (e) {}
      }
      this._pendingLoops.length = 0;
      // Listener entfernen
      window.removeEventListener('click', markInteracted);
      window.removeEventListener('touchstart', markInteracted);
      window.removeEventListener('keydown', markInteracted);
    };
    window.addEventListener('click', markInteracted);
    window.addEventListener('touchstart', markInteracted);
    window.addEventListener('keydown', markInteracted);
  }

  preload(path) {
    if (this.sounds.has(path)) return;
    const audio = new Audio();
    audio.src = path;
    audio.preload = 'auto';
    audio.load();
    this.sounds.set(path, audio);
  }

  preloadFromBuildingTypes() {
    if (!Game.BUILDING_TYPES) return;
    for (const id in Game.BUILDING_TYPES) {
      const def = Game.BUILDING_TYPES[id];
      if (def.sound) {
        this.preload(def.sound);
      }
    }
  }

  playLoop(key, path, volume, muted) {
    if (!this.enabled) return;

    if (muted) {
      this.stopLoop(key);
      return;
    }

    let entry = this.activeLoops.get(key);
    if (!entry) {
      const audio = this.sounds.get(path);
      if (!audio) return;
      const clone = audio.cloneNode();
      clone.loop = true;
      clone.volume = Math.max(0, Math.min(1, volume));
      clone.play().then(() => {
        // Erfolgreich gestartet
      }).catch(() => {
        // Autoplay blockiert → warten auf User-Interaktion
        if (!this.userHasInteracted) {
          this._pendingLoops.push({ audio: clone });
        }
      });
      entry = { audio: clone, path };
      this.activeLoops.set(key, entry);
    } else {
      // Lautstärke aktualisieren
      entry.audio.volume = Math.max(0, Math.min(1, volume));
      // Wenn der Sound stumm geblieben ist (Autoplay-Blockade) und der User inzwischen interagiert hat,
      // versuchen wir ihn erneut zu starten
      if (this.userHasInteracted && entry.audio.paused && !this._pausedLoops.has(key)) {
        entry.audio.play().catch(() => {});
      }
    }
  }

  stopLoop(key) {
    const entry = this.activeLoops.get(key);
    if (!entry) return;
    try {
      entry.audio.pause();
    } catch (e) {}
    this.activeLoops.delete(key);
    this._pausedLoops.delete(key);
    // Aus der Pending-Liste entfernen
    const idx = this._pendingLoops.findIndex(p => p.audio === entry.audio);
    if (idx !== -1) this._pendingLoops.splice(idx, 1);
  }

  stopAll() {
    for (const key of Array.from(this.activeLoops.keys())) {
      this.stopLoop(key);
    }
    this._pausedLoops.clear();
  }

  pauseAll() {
    this._pausedLoops.clear();
    for (const [key, entry] of this.activeLoops.entries()) {
      try {
        if (!entry.audio.paused) {
          entry.audio.pause();
          this._pausedLoops.add(key);
        }
      } catch (e) {}
    }
  }

  resumeAll() {
    if (this._pausedLoops.size === 0) return;
    for (const key of this._pausedLoops) {
      const entry = this.activeLoops.get(key);
      if (entry) {
        try {
          entry.audio.play().catch(() => {});
        } catch (e) {}
      }
    }
    this._pausedLoops.clear();
  }

  playOneShot(path, volume = 1.0) {
    if (!this.enabled) return;
    const audio = this.sounds.get(path);
    if (!audio) return;
    const clone = audio.cloneNode();
    clone.volume = Math.max(0, Math.min(1, volume));
    clone.play().catch(() => {});
  }

  setVolume(key, volume) {
    const entry = this.activeLoops.get(key);
    if (!entry) return;
    entry.audio.volume = Math.max(0, Math.min(1, volume));
  }
};
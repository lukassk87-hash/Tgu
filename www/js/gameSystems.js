window.Game = window.Game || {};

/**
 * Kapselt drei kleine Systeme, die pro Frame / pro Tick laufen:
 * - Sound-Management (Gebäude-Sounds mit Lautstärke nach Distanz)
 * - Hungersnot-Warnung (alle 300 Sekunden prüfen)
 * - Grabsteine (Timer-basiertes Aufräumen)
 *
 * Hinweis: Holzfäller- und Steinmetz-Sounds werden NICHT hier gesteuert,
 * sondern in main.js pro Villager (nur solange er tatsächlich schlägt).
 */
Game.GameSystems = {
  create(game, world, vm, renderer, audioManager, stats) {
    const soundHoldTimers = new Map();

    function isBuildingWorking(b) {
      if (!b.built) return false;
      if (b.paused) return false;

      // Holzfäller / Steinmetz: Sound läuft in main.js (pro Villager).
      if (b.def.id === 'lumberjack' || b.def.id === 'quarry') return false;

      if (b.def.recipe) return !!b.isActive;

      if (b.def.produces) {
        const worker = b.workerId !== null ? vm.villagers.get(b.workerId) : null;
        if (worker && worker.workplaceId === b.id) {
          const hasQueue = worker.harvestQueue && worker.harvestQueue.length > 0;
          const harvesting = worker.state === 'harvesting';
          if (hasQueue || harvesting) return true;
        }
        return false;
      }

      if (b.def.generatesResource) {
        return b.workerId !== null;
      }

      return false;
    }

    function updateBuildingSounds(dt) {
      const cam = renderer.camera;
      const ts = renderer.tileSize;
      const centerX = cam.x + (window.innerWidth / cam.zoom) / 2;
      const centerY = cam.y + (window.innerHeight / cam.zoom) / 2;
      const viewW = window.innerWidth / cam.zoom;
      const viewH = window.innerHeight / cam.zoom;
      const maxDist = Math.sqrt(viewW * viewW + viewH * viewH) / 2;

      // Vorab alle Building-Sound-Keys sammeln, damit wir nur DIESE prunen
      // und die Harvest-Sounds aus main.js nicht anfassen.
      const buildingKeys = new Set();
      for (const b of world.buildings.values()) {
        if (b.def.sound) buildingKeys.add(b.def.id + '-' + b.id);
      }

      const activeKeys = new Set();

      for (const b of world.buildings.values()) {
        if (!b.built) continue;
        if (!b.def.sound) continue;
        if (b.paused) continue;

        const isWorking = isBuildingWorking(b);
        const key = b.def.id + '-' + b.id;

        let holdRemaining = soundHoldTimers.get(key) || 0;

        if (isWorking) {
          holdRemaining = 1500;
        } else if (holdRemaining > 0) {
          holdRemaining = Math.max(0, holdRemaining - dt);
        }
        soundHoldTimers.set(key, holdRemaining);

        const shouldPlay = isWorking || holdRemaining > 0;
        if (!shouldPlay) continue;

        const bx = (b.x + (b.w || 1) / 2) * ts;
        const by = (b.y + (b.h || 1) / 2) * ts;
        const dx = bx - centerX;
        const dy = by - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const t = Math.min(1, dist / maxDist);
        const volume = 1.0 - t * (1.0 - 0.10);
        const inView = dist < maxDist * 1.2;
        const muted = !inView;

        activeKeys.add(key);
        audioManager.playLoop(key, b.def.sound, volume, muted);
      }

      // Nur Building-Sound-Keys stoppen – Harvest-Sounds aus main.js
      // bleiben unangetastet.
      for (const key of Array.from(audioManager.activeLoops.keys())) {
        if (!buildingKeys.has(key)) continue;
        if (!activeKeys.has(key)) audioManager.stopLoop(key);
      }
    }

    // === Hungersnot-Warnung ===
    const hungerWarning = document.getElementById('hungerWarning');
    const hungerDetail = document.getElementById('hungerDetail');
    const hungerWarningOk = document.getElementById('hungerWarningOk');
    let lastHungerCheck = performance.now();

    if (hungerWarningOk) {
      hungerWarningOk.addEventListener('click', () => {
        hungerWarning.classList.add('hidden');
      });
    }

    function checkHungerWarning(now) {
      if (!stats) return;
      if (now - lastHungerCheck < 300000) return;
      lastHungerCheck = now;
      if (stats.history.length < 60) return;

      const totals = stats.getResourceTotals('bread', 300);
      if (totals.diff < 0) {
        const prod = Math.floor(totals.produced);
        const cons = Math.floor(totals.consumed);
        const def = totals.diff;
        if (hungerDetail) {
          hungerDetail.textContent = `Produktion: ${prod} · Verbrauch: ${cons} · Defizit: ${def}`;
        }
        if (hungerWarning) {
          hungerWarning.classList.remove('hidden');
        }
      }
    }

    // === Grabsteine ===
    function updateGravestones(now) {
      const active = [];
      for (const g of game.gravestones) {
        if (now < g.expiresAt) active.push(g);
      }
      game.gravestones.length = 0;
      game.gravestones.push(...active);
    }

    return {
      updateBuildingSounds,
      checkHungerWarning,
      updateGravestones
    };
  }
};
window.Game = window.Game || {};

Game.UI = Game.UI || {};

Game.UI._fireLogInterval = null;

Game.UI._logToDebug = function (msg, color = '#0f0') {
  const logEl = document.getElementById('debugFireLogContent');
  if (!logEl) return;

  const time = new Date().toLocaleTimeString('de-DE');
  const line = document.createElement('div');
  line.style.color = color;
  line.textContent = `[${time}] ${msg}`;

  logEl.appendChild(line);
  logEl.scrollTop = logEl.scrollHeight;

  console.log(`[DEBUG] ${msg}`);
};

Game.UI._clearDebugLog = function () {
  const logEl = document.getElementById('debugFireLogContent');
  if (logEl) logEl.innerHTML = '';
};

Game.UI.initSecretDebug = function (showInfoPanelCallback) {
  let clickTimes = [];
  const REQUIRED_CLICKS = 10;
  const TIME_WINDOW_MS = 30000;
  const infoPanel = document.getElementById('infoPanel');
  if (!infoPanel) return;

  infoPanel.addEventListener('click', (e) => {
    if (e.target.id === 'infoIcon' || e.target.closest('#infoIcon') || e.target.id === 'infoTitle' || e.target.closest('#infoTitle')) {
      const now = performance.now();
      clickTimes = clickTimes.filter(t => now - t <= TIME_WINDOW_MS);
      clickTimes.push(now);
      if (clickTimes.length >= REQUIRED_CLICKS) {
        clickTimes = [];
        this.openDebugWindow();
      }
    }
  });

  const debugCloseBtn = document.getElementById('debugWindowClose');
  if (debugCloseBtn) {
    debugCloseBtn.addEventListener('click', () => {
      document.getElementById('debugWindow').classList.add('hidden');
      if (Game.state) Game.state.paused = false;
      this._stopFireLog();
    });
  }

  const cmdInput = document.getElementById('debugCommandInput');
  const cmdSend = document.getElementById('debugCommandSend');

  if (cmdSend && cmdInput) {
    const execute = () => {
      const val = cmdInput.value.trim();
      if (!val) return;
      this._logToDebug(`> ${val}`, '#ffcc00');
      this._executeDebugCommand(val);
      cmdInput.value = '';
    };
    cmdSend.addEventListener('click', execute);
    cmdInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') execute();
    });
  }
};

Game.UI._executeDebugCommand = function (cmd) {
  const lower = cmd.toLowerCase().trim();

  if (lower === 'help') {
    this._logToDebug('Verfügbare Befehle (Kurzbefehle):', '#4A90E2');
    this._logToDebug('  help                - Diese Liste anzeigen', '#fff');
    this._logToDebug('  clear               - Konsole leeren', '#fff');
    this._logToDebug('  fire                - Feuer in Reichweite auslösen', '#fff');
    this._logToDebug('  firestation         - Feuerwehr-Status ausgeben', '#fff');
    this._logToDebug('  firestat            - Feuer-Status ausgeben', '#fff');
    this._logToDebug('  dragon [s]          - Drachen in s Sekunden spawnen', '#fff');
    this._logToDebug('  timer [name] [s]    - Timer setzen (dragon, plague, fire, quake, sickness)', '#fff');
    this._logToDebug('  sick                - Einen Villager krank werden lassen', '#fff');
    this._logToDebug('  res                 - Alle Ressourcen ausgeben', '#fff');
    this._logToDebug('  res [name] [value]  - Ressource auf Wert setzen', '#fff');
    this._logToDebug('---', '#888');
    this._logToDebug('Du kannst auch beliebiges JavaScript eingeben!', '#7ad07a');
    this._logToDebug('Beispiel: Game.state.economy.res.wood = 5000', '#7ad07a');
    return;
  }

  if (lower === 'clear') {
    this._clearDebugLog();
    return;
  }

  const gs = Game.state;

  if (lower === 'fire') {
    if (!gs || !gs.fireManager || !gs.world) { this._logToDebug('❌ Kein Spiel aktiv.', '#ff6b6b'); return; }
    const fm = gs.fireManager;
    const world = gs.world;
    let station = null;
    for (const b of world.buildings.values()) {
      if (b.built && !b.ruined && b.def.id === 'fireStation') { station = b; break; }
    }
    if (!station) { this._logToDebug('❌ Keine Feuerwehr.', '#ff6b6b'); return; }
    const fx = station.x + (station.w || 1) / 2;
    const fy = station.y + (station.h || 1) / 2;
    const range = station.def.extinguishRadius || 15;
    const rangeSq = range * range;
    const candidates = [];
    for (const b of world.buildings.values()) {
      if (!b.built || b.ruined || b.isBeingRepaired) continue;
      if (b.def.id === 'fireStation' || b.def.id === 'castle') continue;
      if (fm.isBuildingBurning(b)) continue;
      const bx = b.x + (b.w || 1) / 2;
      const by = b.y + (b.h || 1) / 2;
      const dx = bx - fx, dy = by - fy;
      if (dx * dx + dy * dy <= rangeSq) candidates.push({ b, dist: Math.sqrt(dx * dx + dy * dy) });
    }
    if (candidates.length === 0) { this._logToDebug('❌ Kein Gebäude in Reichweite.', '#ff6b6b'); return; }
    candidates.sort((a, b) => a.dist - b.dist);
    const target = candidates[0].b;
    fm._startFire(performance.now(), target);
    this._logToDebug(`🔥 ${target.def.name} (ID ${target.id}) brennt.`, '#ff8a5c');
    if (gs.renderer) {
      const ts = gs.renderer.tileSize;
      const tx = target.x + (target.w || 1) / 2;
      const ty = target.y + (target.h || 1) / 2;
      gs.renderer.camera.x = tx * ts - (window.innerWidth / gs.renderer.camera.zoom) / 2;
      gs.renderer.camera.y = ty * ts - (window.innerHeight / gs.renderer.camera.zoom) / 2;
      gs.renderer.clampCamera();
    }
    return;
  }

  if (lower === 'firestation') {
    if (!gs || !gs.world) return;
    const stations = [];
    for (const b of gs.world.buildings.values()) {
      if (b.def.id === 'fireStation') stations.push(b);
    }
    if (stations.length === 0) { this._logToDebug('❌ Keine Feuerwehr vorhanden.', '#ff6b6b'); return; }
    for (const st of stations) {
      this._logToDebug(`🚒 Feuerwehr ID ${st.id} bei (${st.x},${st.y})`, '#4A90E2');
      this._logToDebug(`   Wasser: ${st.storage}/${st.def.maxWaterStorage}`, '#fff');
      this._logToDebug(`   Gebaut: ${st.built ? '✅' : '❌'} | Ruine: ${st.ruined ? '❌' : '✅'}`, '#fff');
      if (!st.workerIds || st.workerIds.length === 0) { this._logToDebug('   Kein Personal!', '#ff6b6b'); continue; }
      for (const wid of st.workerIds) {
        const w = gs.vm.villagers.get(wid);
        if (!w) { this._logToDebug(`   👻 Geist ID ${wid}`, '#ff6b6b'); continue; }
        const role = w._fireStationRole || 'none';
        this._logToDebug(`   - ${w.name}: role=${role}, state=${w.state}, task=${w.task}, isSick=${w.isSick}`, w.job === 'worker' ? '#7ad07a' : '#ffcc00');
      }
    }
    return;
  }

  if (lower === 'firestat') {
    if (!gs || !gs.fireManager) return;
    const fm = gs.fireManager;
    this._logToDebug(`=== Feuer (${fm.activeFires.length} aktiv) ===`, '#ff6b6b');
    for (const f of fm.activeFires) {
      const b = f.building;
      const times = fm._getFireTimes(b);
      const elapsed = performance.now() - f.startedAt;
      const burnRem = Math.max(0, Math.ceil((times.burnTimeMs - elapsed) / 1000));
      this._logToDebug(`🔥 ${b.def.name} (ID ${b.id}): Wasser ${f.waterDelivered || 0}/${fm.getNeededWater(b)}, Ruine in ${burnRem}s`, '#ff8a5c');
    }
    return;
  }

  if (lower === 'sick') {
    if (!gs || !gs.sicknessManager) { this._logToDebug('❌ Kein SicknessManager.', '#ff6b6b'); return; }
    const victim = gs.sicknessManager._pickSickVillager();
    if (!victim) { this._logToDebug('❌ Kein Kandidat verfügbar.', '#ff6b6b'); return; }
    gs.sicknessManager._infect(victim, performance.now());
    this._logToDebug(`🤒 ${victim.name} ist krank geworden.`, '#f0a040');
    return;
  }

  if (lower.startsWith('dragon')) {
    if (!gs || !gs.dragonManager) return;
    const val = parseFloat(cmd.split(' ')[1]) || 0;
    gs.dragonManager._defenseReady = true;
    gs.dragonManager.nextSpawnAt = performance.now() + (val * 1000);
    gs.dragonManager._lastUpdateTime = performance.now();
    this._logToDebug(`🐉 Drache in ${val}s.`, '#ff8a5c');
    return;
  }

  if (lower.startsWith('timer')) {
    const parts = cmd.split(' ');
    const name = parts[1];
    const val = parseFloat(parts[2]) || 0;
    const ms = val * 1000;
    const now = performance.now();
    if (name === 'dragon' && gs.dragonManager) {
      gs.dragonManager._defenseReady = true;
      gs.dragonManager.nextSpawnAt = now + ms;
      gs.dragonManager._lastUpdateTime = now;
      this._logToDebug(`🐉 Drache in ${val}s.`, '#ff8a5c');
    } else if (name === 'plague' && gs.plagueManager) {
      gs.plagueManager._started = true;
      gs.plagueManager.nextPlagueAt = now + ms;
      gs.plagueManager.activeUntil = 0;
      gs.plagueManager._lastUpdateTime = now;
      this._logToDebug(`☣️ Plage in ${val}s.`, '#7ad07a');
    } else if (name === 'fire' && gs.fireManager) {
      gs.fireManager._started = true;
      gs.fireManager.nextFireAt = now + ms;
      gs.fireManager._lastUpdateTime = now;
      this._logToDebug(`🔥 Feuer in ${val}s.`, '#ff6b6b');
    } else if (name === 'quake' && gs.earthquakeManager) {
      gs.earthquakeManager._started = true;
      gs.earthquakeManager.sacrificed = false;
      gs.earthquakeManager.nextEarthquakeAt = now + ms;
      gs.earthquakeManager._lastUpdateTime = now;
      this._logToDebug(`🌍 Erdbeben in ${val}s.`, '#ffb05c');
    } else if (name === 'sickness' && gs.sicknessManager) {
      gs.sicknessManager._started = true;
      gs.sicknessManager.nextSicknessAt = now + ms;
      gs.sicknessManager._lastUpdateTime = now;
      this._logToDebug(`🤒 Krankheit in ${val}s.`, '#f0a040');
    } else {
      this._logToDebug('❌ Unbekannter Timer. Nutze: dragon, plague, fire, quake, sickness', '#ff6b6b');
    }
    return;
  }

  if (lower.startsWith('res')) {
    if (!gs || !gs.economy) return;
    const parts = cmd.split(' ');
    if (parts.length === 1) {
      this._logToDebug('=== Ressourcen ===', '#ffcc00');
      for (const k in gs.economy.res) {
        this._logToDebug(`  ${k}: ${Math.floor(gs.economy.res[k])}`, '#fff');
      }
      return;
    }
    const resName = parts[1];
    const val = parseFloat(parts[2]);
    if (gs.economy.res[resName] === undefined) { this._logToDebug(`❌ Unbekannte Ressource: ${resName}`, '#ff6b6b'); return; }
    if (isNaN(val)) { this._logToDebug('❌ Ungültiger Wert.', '#ff6b6b'); return; }
    gs.economy.res[resName] = val;
    if (gs.economy.onChange) gs.economy.onChange();
    this._logToDebug(`✅ ${resName} = ${val}`, '#7ad07a');
    return;
  }

  try {
    const result = eval(cmd);

    if (result === undefined) {
      this._logToDebug('✅ (undefined)', '#7ad07a');
    } else if (result === null) {
      this._logToDebug('✅ null', '#7ad07a');
    } else if (typeof result === 'object') {
      try {
        this._logToDebug(`✅ ${JSON.stringify(result).substring(0, 200)}`, '#7ad07a');
      } catch (e) {
        this._logToDebug(`✅ [object ${result.constructor ? result.constructor.name : 'unknown'}]`, '#7ad07a');
      }
    } else {
      this._logToDebug(`✅ ${String(result)}`, '#7ad07a');
    }
  } catch (err) {
    this._logToDebug(`❌ ${err.message}`, '#ff6b6b');
  }
};

Game.UI.openDebugWindow = function () {
  const debugWindow = document.getElementById('debugWindow');
  const debugList = document.getElementById('debugTimersList');
  if (!debugWindow || !debugList) return;
  const gs = Game.state;
  if (!gs) return;
  gs.paused = true;
  const now = performance.now();
  debugList.innerHTML = '';

  const createTimerRow = (title, currentRemainingMs, setter) => {
    const secs = Math.max(0, Math.floor(currentRemainingMs / 1000));
    const row = document.createElement('div');
    row.style.cssText = 'background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px; border-left: 3px solid var(--brass);';
    row.innerHTML = `
      <div style="font-size: 15px; font-weight: bold; color: var(--brass-light); margin-bottom: 8px;">${title}</div>
      <div style="font-size: 13px; color: var(--parchment); margin-bottom: 12px;">Aktuell: <span style="color: #ffcc00; font-weight: bold;">${secs}s</span></div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <input type="number" id="input_${title.replace(/\s+/g, '_')}" placeholder="Sekunden eingeben..." value="${secs}" style="width: 100%; padding: 10px; background: #1e140a; border: 1px solid var(--wood-border); border-radius: 6px; color: var(--parchment); font-size: 14px;">
        <button id="btn_${title.replace(/\s+/g, '_')}" style="width: 100%; padding: 10px; background: var(--green-ok); color: #fff; border: none; border-radius: 6px; font-weight: bold; font-size: 14px;">Setzen</button>
      </div>
    `;
    setTimeout(() => {
      const btn = row.querySelector('button');
      const input = row.querySelector('input');
      if (btn && input) {
        btn.addEventListener('click', () => {
          const val = parseInt(input.value, 10);
          if (!isNaN(val) && val >= 0) {
            setter(val);
            btn.textContent = '✅ Gesetzt!';
            btn.style.background = '#4A90E2';
            setTimeout(() => {
              btn.textContent = 'Setzen';
              btn.style.background = 'var(--green-ok)';
            }, 1000);
          }
        });
      }
    }, 0);
    debugList.appendChild(row);
  };

  if (gs.dragonManager) {
    const dm = gs.dragonManager;
    const rem = dm.nextSpawnAt > 0 ? (dm.nextSpawnAt - now) : 0;
    createTimerRow('🐉 Drache', rem, (val) => {
      dm._defenseReady = true;
      dm.nextSpawnAt = performance.now() + (val * 1000);
      dm._lastUpdateTime = performance.now();
    });
  }
  if (gs.plagueManager) {
    const pm = gs.plagueManager;
    const rem = pm.nextPlagueAt > 0 ? (pm.nextPlagueAt - now) : 0;
    createTimerRow('☣️ Plage', rem, (val) => {
      pm._started = true;
      pm.nextPlagueAt = performance.now() + (val * 1000);
      pm.activeUntil = 0;
      pm.activeType = null;
      pm._lastUpdateTime = performance.now();
    });
  }
  if (gs.sicknessManager) {
    const sm = gs.sicknessManager;
    const rem = sm.nextSicknessAt > 0 && sm.nextSicknessAt !== Infinity ? (sm.nextSicknessAt - now) : 0;
    createTimerRow('🤒 Krankheit', rem, (val) => {
      sm._started = true;
      sm.nextSicknessAt = performance.now() + (val * 1000);
      sm._lastUpdateTime = performance.now();
    });
  }
  if (gs.fireManager) {
    const fm = gs.fireManager;
    const rem = fm.nextFireAt > 0 ? (fm.nextFireAt - now) : 0;
    createTimerRow('🔥 Feuer', rem, (val) => {
      fm._started = true;
      fm.nextFireAt = performance.now() + (val * 1000);
      fm.activeFires = [];
      fm._lastUpdateTime = performance.now();
    });
  }
  if (gs.earthquakeManager) {
    const em = gs.earthquakeManager;
    const rem = em.nextEarthquakeAt > 0 ? (em.nextEarthquakeAt - now) : 0;
    createTimerRow('🌍 Erdbeben', rem, (val) => {
      em._started = true;
      em.sacrificed = false;
      em.nextEarthquakeAt = performance.now() + (val * 1000);
      em._lastUpdateTime = performance.now();
    });
  }
  if (gs.raiderVillage && !gs.raiderVillage.isDestroyed) {
    const rv = gs.raiderVillage;
    const rem = rv.nextAttackAt > 0 ? (rv.nextAttackAt - now) : 0;
    createTimerRow('🏴 Räuber-Angriff', rem, (val) => {
      rv.nextAttackAt = performance.now() + (val * 1000);
      rv.attackTimerFrozen = false;
    });
  }
  if (gs.zombieManager) {
    const zm = gs.zombieManager;
    const rem = (zm.spawnCooldown || 0) * 1000;
    createTimerRow('🧟 Zombie-Spawn', rem, (val) => {
      zm.spawnCooldown = val;
    });
  }
  this._clearDebugLog();
  this._logToDebug('Debug-Konsole bereit. Tippe "help" für Kurzbefehle oder gib beliebiges JavaScript ein.', '#4A90E2');
  this._startFireLog(gs);
  debugWindow.classList.remove('hidden');
};

Game.UI._startFireLog = function (game) {
  this._stopFireLog();
  this._fireLogInterval = null;
};

Game.UI._stopFireLog = function () {
  if (this._fireLogInterval) {
    clearInterval(this._fireLogInterval);
    this._fireLogInterval = null;
  }
};
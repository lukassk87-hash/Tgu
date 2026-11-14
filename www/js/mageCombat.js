<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover" />
  <meta name="theme-color" content="#2b1d12" />
  <title>RedCastle – Königreich in Gefahr</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>

  <!-- ========================================================== -->
  <!-- Startmenü                                                  -->
  <!-- ========================================================== -->
  <div id="menu" class="overlay">
    <div class="panel menu-panel">

      <div class="menu-header">
        <img src="images/schloss.webp" alt="RedCastle" class="menu-castle-img">
        <h1>RedCastle</h1>
        <p class="subtitle">Königreich in Gefahr</p>
      </div>

      <label>Kartengröße
        <select id="mapSize">
          <option value="64">64 × 64</option>
          <option value="80">80 × 80</option>
          <option value="96">96 × 96</option>
          <option value="128">128 × 128</option>
          <option value="160">160 × 160</option>
          <option value="200">200 × 200</option>
          <option value="256" selected>256 × 256</option>
        </select>
      </label>

      <label>Startressourcen
        <select id="startResourceLevel">
          <option value="normal" selected>Normal</option>
          <option value="high">Hoch</option>
        </select>
      </label>

      <h2 class="section-title">Gegner</h2>

      <label class="checkbox-label">
        <input type="checkbox" id="raidersEnabled" checked />
        <span>Räuberlager spawnen</span>
      </label>

      <label class="checkbox-label">
        <input type="checkbox" id="dragonEnabled" checked />
        <span>Drachen spawnen</span>
      </label>

      <label>Zombie-Schwierigkeit
        <select id="zombieDifficulty">
          <option value="none">Keine</option>
          <option value="easy">Einfach</option>
          <option value="normal" selected>Normal</option>
          <option value="hard">Schwer</option>
          <option value="insane">Wahnsinnig</option>
          <option value="impossible">Unmöglich</option>
        </select>
      </label>

      <label class="checkbox-label">
        <input type="checkbox" id="zombieInfects" checked />
        <span>Zombies infizieren Einwohner</span>
      </label>

      <label class="checkbox-label">
        <input type="checkbox" id="zombieInfectsDelayed" checked />
        <span>Zombies werden erst 10 Minuten nach dem Spielstart ansteckend</span>
      </label>

      <label>Erster Zombie-Angriff nach (Sekunden)
        <input id="firstZombieSpawn" type="number" min="0" step="10" value="45" />
      </label>

      <label>Seed (leer = zufällig)
        <input id="seed" type="text" placeholder="z.B. Lukisupi" />
      </label>

      <button id="startBtn" class="primary" style="margin-top: 10px;">Neue Karte</button>
      <button id="loadBtn" style="margin-top: 8px;">Spiel laden</button>

      <div class="menu-footer">
        <p>&copy; 2026 Lukas Schulze König</p>
      </div>

    </div>
  </div>

  <!-- ========================================================== -->
  <!-- Lade-Overlay                                               -->
  <!-- ========================================================== -->
  <div id="loadingOverlay" class="overlay hidden">
    <div class="panel" style="width: min(90vw, 300px); text-align: center;">
      <h2 id="loadingTitle" style="margin-bottom: 16px;">Laden...</h2>
      <div class="progress-bar" style="height: 12px; border-radius: 6px;">
        <div id="loadingBarFill" class="progress-bar-fill" style="width: 0%; transition: width 0.1s;"></div>
      </div>
      <p id="loadingText" style="margin-top: 12px; color: var(--parchment-dim); font-size: 14px;">0%</p>
    </div>
  </div>

  <!-- ========================================================== -->
  <!-- Spielfläche                                                -->
  <!-- ========================================================== -->
  <canvas id="game"></canvas>

  <!-- ========================================================== -->
  <!-- Hier werden die Popups per JS eingefügt                    -->
  <!-- ========================================================== -->
  <div id="popup-container"></div>

  <!-- ========================================================== -->
  <!-- Engine                                                     -->
  <!-- ========================================================== -->
  <script src="engine/tick.js"></script>
  <script src="engine/assets.js"></script>
  <script src="engine/audio.js"></script>
  <script src="engine/input.js"></script>
  <script src="engine/renderer.js"></script>
  <script src="engine/renderer-chunks.js"></script>
  <script src="engine/renderer-territory.js"></script>
  <script src="engine/renderer-particles.js"></script>
  <script src="engine/renderer-preview.js"></script>
  <script src="engine/renderer-entities.js"></script>
  <script src="engine/renderer-raiders.js"></script>
  <script src="engine/renderer-dragon.js"></script>

  <!-- Daten -->
  <script src="data/terrains.js"></script>
  <script src="data/decorations.js"></script>
  <script src="data/buildingTypes.js"></script>
  <script src="data/names.js"></script>

  <!-- Game -->
  <script src="game/mapgen.js"></script>
  <script src="game/breadManager.js"></script>
  <script src="game/world.js"></script>
  <script src="game/buildings.js"></script>
  <script src="game/villagers.js"></script>
  <script src="game/zombies.js"></script>
  <script src="game/raiderVillage.js"></script>
  <script src="game/dragon.js"></script>
  <script src="game/plagueManager.js"></script>
  <script src="game/fireManager.js"></script>
  <script src="game/sicknessManager.js"></script>
  <script src="game/earthquakeManager.js"></script>
  <script src="game/spatialGrid.js"></script>
  <script src="game/savegame.js"></script>

  <!-- UI -->
  <script src="ui/hud.js"></script>
  <script src="js/ui.js"></script>
  <script src="js/ui-core.js"></script>
  <script src="js/ui-villagers.js"></script>
  <script src="js/ui-panel-hash.js"></script>
  <script src="js/ui-panel-render.js"></script>
  <script src="js/ui-debug.js"></script>
  <script src="js/statistics.js"></script>
  <script src="js/gameloop.js"></script>
  <script src="js/interactions.js"></script>

  <!-- Systeme -->
  <script src="js/zombieCombat.js"></script>
  <script src="js/mageCombat.js"></script>
  <script src="js/raiderDefense.js"></script>
  <script src="js/playerCombat.js"></script>
  <script src="js/raiderCombat.js"></script>
  <script src="js/jobWindow.js"></script>
  <script src="js/gameSystems.js"></script>

  <!-- NEU: Popup-HTML-Strings (MÜSSEN vor main.js geladen werden) -->
  <script src="js/popups/popups-plague.js"></script>
  <script src="js/popups/popups-combat.js"></script>
  <script src="js/popups/popups-warning.js"></script>
  <script src="js/popups/popups-misc.js"></script>
  <script src="js/popups/popups-build.js"></script>
  <script src="js/popups/windows-build.js"></script>
  <script src="js/popups/windows-stats.js"></script>
  <script src="js/popups/windows-villagers.js"></script>
  <script src="js/popups/windows-economy.js"></script>
  <script src="js/popups/windows-debug.js"></script>
  <script src="js/popups/hud.js"></script>

  <!-- Main (Reihenfolge wichtig!) -->
  <script src="js/main-preload.js"></script>
  <script src="js/main-state.js"></script>
  <script src="js/main-runtime.js"></script>

  <!-- ========================================================== -->
  <!-- Menü-Kopplung & Inline-Scripts                             -->
  <!-- ========================================================== -->
  <script>
    (function () {
      // 1. Kopplung der Zombie-Checkboxen
      function bindZombieInfectCheckboxes() {
        const infectCb = document.getElementById('zombieInfects');
        const delayedCb = document.getElementById('zombieInfectsDelayed');
        if (!infectCb || !delayedCb) return;

        function syncDelayedState() {
          if (infectCb.checked) {
            delayedCb.disabled = false;
          } else {
            delayedCb.checked = false;
            delayedCb.disabled = true;
          }
        }

        infectCb.addEventListener('change', syncDelayedState);
        syncDelayedState();
      }

      // 2. Dynamisches Anpassen des Krankheitspopups (Räuberkraut-Text)
      function bindSicknessPopupLogic() {
        const sicknessPopup = document.getElementById('sicknessPopup');
        const herbText = document.getElementById('sicknessRaiderHerbText');

        if (!sicknessPopup || !herbText) return;

        const observer = new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            if (mutation.attributeName === 'class') {
              const isHidden = sicknessPopup.classList.contains('hidden');
              if (!isHidden) {
                const gs = window.Game && window.Game.state;
                if (gs && gs.raidersEnabled === false) {
                  herbText.innerHTML = '<b>Bäume fällen</b> → du erhältst zufällig <b>Räuberkraut</b>.';
                } else {
                  herbText.innerHTML = '<b>Räuberlager zerstören</b> → du erhältst <b>Räuberkraut</b>.';
                }
              }
            }
          }
        });

        observer.observe(sicknessPopup, { attributes: true });
      }

      // Initialisierung
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          bindZombieInfectCheckboxes();
          bindSicknessPopupLogic();
        });
      } else {
        bindZombieInfectCheckboxes();
        bindSicknessPopupLogic();
      }
    })();
  </script>
</body>
</html>
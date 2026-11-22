window.Game = window.Game || {};

Game.Hud = Game.Hud || {};

Game.Hud.html = `
  <div id="topHudWrapper">
    <div id="topBar">
  <div class="topbar-item">
    <img class="icon" src="images/icon_baum.webp" alt="Holz">
    <span class="label" data-i18n="res_wood">Holz</span>
    <span class="value" id="topBarWood">0</span>
  </div>
  <div class="topbar-item">
    <img class="icon" src="images/icon_stein.webp" alt="Stein">
    <span class="label" data-i18n="res_stone">Stein</span>
    <span class="value" id="topBarStone">0</span>
  </div>
  <div class="topbar-item">
    <img class="icon" src="images/icon_bretter.webp" alt="Bretter">
    <span class="label" data-i18n="res_woodPlank">Bretter</span>
    <span class="value" id="topBarWoodPlank">0</span>
  </div>
  <div class="topbar-item">
    <img class="icon" src="images/icon_brot.webp" alt="Brot">
    <span class="label" data-i18n="res_bread">Brot</span>
    <span class="value" id="topBarBread">0</span>
  </div>
  <div class="topbar-item">
    <img class="icon" src="images/icon_fleisch.webp" alt="Fleisch">
    <span class="label" data-i18n="res_meat">Fleisch</span>
    <span class="value" id="topBarMeat">0</span>
  </div>
  <div class="topbar-item">
    <img class="icon" src="images/icon_fisch.webp" alt="Fisch">
    <span class="label" data-i18n="res_fish">Fisch</span>
    <span class="value" id="topBarFish">0</span>
  </div>
  <div class="topbar-item">
    <img class="icon" src="images/villager-idle-rot.webp" alt="Frei">
    <span class="label" data-i18n="hud_free_villagers">Frei</span>
    <span class="value" id="topBarFreeVillagers">0</span>
  </div>
</div>

    <div id="topLeftButtons">
      <div id="castleHomeButton" class="threat-icon top-left-btn" title="Zum Schloss springen">
        <img src="images/schloss.webp" alt="Schloss" />
      </div>
      <div id="topBarToggle" class="threat-icon top-left-btn" title="Ressourcen-Leiste ein-/ausblenden">
        <img id="topBarToggleImg" src="images/pfeilu.webp" alt="">
        <span id="topBarToggleFallback" style="display:none;font-size:20px;">▼</span>
      </div>
    </div>
  </div>

  <div id="threatIndicators">
    <div id="threatRaider" class="threat-icon hidden">
      <img src="images/villager-krieger-blau.webp" alt="Räuber" />
    </div>
    <div id="threatZombie" class="threat-icon hidden">
      <img src="images/zombie.webp" alt="Zombie" />
    </div>
    <div id="threatDragon" class="threat-icon hidden">
      <img src="images/drache.webp" alt="Drache" />
    </div>
  </div>

  <div id="infoPanel" class="info-panel hidden">
    <div class="info-header">
      <img id="infoIcon" src="" alt="" />
      <h3 id="infoTitle" data-i18n="hud_building">Gebäude</h3>
      <button id="infoClose">×</button>
    </div>
    <div id="infoContent" class="info-content"></div>
  </div>

  <div id="bottomBar" class="hidden">
    <button id="buildButton" class="hidden">
      <img class="icon" src="images/haus-rot.webp" alt="Bauen">
      <span class="label" data-i18n="hud_build">Bauen</span>
    </button>
    <button id="demolishButton">
      <img class="icon" src="images/explosion.webp" alt="Abreißen">
      <span class="label" data-i18n="hud_demolish">Abreißen</span>
    </button>
    <button id="statsButton">
      <img class="icon" src="images/lager-rot.webp" alt="Statistik">
      <span class="label" data-i18n="hud_stats">Statistik</span>
    </button>
    <button id="villagersButton">
      <img class="icon" src="images/villager-idle-rot.webp" alt="Einwohner">
      <span class="label" data-i18n="hud_villagers">Einwohner</span>
    </button>
    <button id="economyButton">
      <img class="icon" src="images/villager-baumeister-rot.webp" alt="Wirtschaft">
      <span class="label" data-i18n="hud_economy">Wirtschaft</span>
    </button>
    <button id="debugButton" style="display:none;">
      <img class="icon" src="images/ghost.webp" alt="Debug">
      <span class="label" data-i18n="hud_debug">Debug</span>
    </button>
  </div>

  <div id="placeHint" class="hidden">
    <h2 data-i18n="hud_place_castle_title">Wo soll das Schloss stehen?</h2>
    <p data-i18n="hud_place_castle_desc">Tippe auf ein begehbares Feld.</p>
  </div>

  <!-- NEU: Zombie-Belagerungs-Warnung -->
  <div id="zombieSiegeWarning" class="hidden" style="position: fixed; top: 20%; left: 50%; transform: translateX(-50%); background: rgba(168, 50, 50, 0.95); border: 2px solid #ff3030; border-radius: 12px; padding: 15px 30px; text-align: center; z-index: 1000; box-shadow: 0 0 30px rgba(255,0,0,0.8); animation: threatPulse 1s infinite;">
    <h2 style="color: #fff; margin: 0 0 5px 0; font-size: 24px; text-shadow: 1px 1px 2px #000;" data-i18n="siege_warning_title">⚠️ ZOMBIES AM SCHLOSS!</h2>
    <div style="color: #ffcc00; font-size: 18px; font-weight: bold; text-shadow: 1px 1px 2px #000;">
      <span data-i18n="siege_warning_desc">Game Over in</span> <span id="zombieSiegeCountdown">10</span>s...
    </div>
    <div style="color: #fff; font-size: 12px; margin-top: 5px; font-weight: bold;" data-i18n="siege_warning_hint">Schicke Krieger zum Schloss!</div>
  </div>
`;

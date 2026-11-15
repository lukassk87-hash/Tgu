window.Game = window.Game || {};

Game.Hud = Game.Hud || {};

Game.Hud.html = `
  <div id="castleHomeButton" class="threat-icon" title="Zum Schloss springen">
    <img src="images/schloss.webp" alt="Schloss" />
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
`;
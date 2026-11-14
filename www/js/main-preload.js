window.Game = window.Game || {};

// ==========================================================
// Popup-HTML-Strings in den DOM injizieren
// Muss VOR allen anderen DOMContentLoaded-Handlern laufen,
// damit document.getElementById('pigPlaguePopup') etc. ab
// dem ersten Zugriff funktionieren.
// ==========================================================
(function initPopups() {
  function inject() {
    const container = document.getElementById('popup-container');
    if (!container) {
      console.warn('[initPopups] #popup-container nicht gefunden!');
      return;
    }

    const parts = [
      Game.Popups && Game.Popups.plagueHtml,
      Game.Popups && Game.Popups.combatHtml,
      Game.Popups && Game.Popups.warningHtml,
      Game.Popups && Game.Popups.miscHtml,
      Game.Popups && Game.Popups.buildHtml,
      Game.Windows && Game.Windows.buildHtml,
      Game.Windows && Game.Windows.statsHtml,
      Game.Windows && Game.Windows.villagersHtml,
      Game.Windows && Game.Windows.economyHtml,
      Game.Windows && Game.Windows.debugHtml,
      Game.Hud && Game.Hud.html
    ].filter(Boolean);

    container.innerHTML = parts.join('\n');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject, { once: true });
  } else {
    inject();
  }
})();

// AudioManager global bereitstellen
window.audioManager = new Game.AudioManager();

// ==========================================================
// preloadAssets global bereitstellen
// ==========================================================
window.preloadAssets = function preloadAssets() {
  const imagesToLoad = [
    'images/gras.webp', 'images/wasser.webp',
    'images/haus-rot.webp', 'images/holzfaeller-rot.webp', 'images/steinmetz-rot.webp',
    'images/bauer-rot.webp', 'images/fischerhuette-rot.webp', 'images/lager-rot.webp',
    'images/wachturm-rot.webp', 'images/schloss.webp',
    'images/brunnen-rot.webp', 'images/bierbrauerei-rot.webp', 'images/saegewerk-rot.webp',
    'images/muehle-rot1.webp', 'images/muehle-rot2.webp', 'images/muehle-rot3.webp',
    'images/baecker-rot.webp',
    'images/baecker1-rot.webp', 'images/baecker2-rot.webp', 'images/baecker3-rot.webp',
    'images/forsthaus.webp',
    'images/villager-idle-rot.webp', 'images/villager-baumeister-rot.webp',
    'images/villager-holzfaeller-rot.webp', 'images/villager-steinmetz-rot.webp',
    'images/villager-bauer-rot.webp', 'images/villager-angler-rot.webp',
    'images/villager-krieger-rot.webp',
    'images/foerster.webp',
    'images/icon_baum.webp', 'images/icon_stein.webp', 'images/icon_getreide.webp', 'images/icon_fisch.webp',
    'images/icon_wasser.webp', 'images/icon_bier.webp', 'images/icon_bretter.webp', 'images/icon_mehl.webp',
    'images/icon_brot.webp', 'images/icon_pfeil.webp', 'images/icon_futter.webp', 'images/icon_schwein.webp',
    'images/icon_fleisch.webp',
    'images/drachenknochen.webp',
    'images/grenze-rot.webp',
    'images/zombie.webp',
    'images/ghost.webp',
    'images/baecker.webp', 'images/saeger.webp', 'images/mueller.webp', 'images/brauer.webp',
    'images/wachstube.webp', 'images/wachposten.webp',
    'images/schloss2.webp', 'images/wachturm-blau.webp',
    'images/villager-krieger-blau.webp',
    'images/grenze-blau.webp',
    'images/flamme.webp',
    'images/explosion.webp',
    'images/pfeilschmiede.webp',
    'images/bogenschussanlage.webp',
    'images/pfeilbauer.webp',
    'images/bogenschuetze.webp',
    'images/futterhersteller.webp',
    'images/schweinehof.webp',
    'images/schweinehof1.webp',
    'images/schweinehof2.webp',
    'images/schweinehof3.webp',
    'images/schweinehof4.webp',
    'images/schlachthof.webp',
    'images/fuetterer.webp',
    'images/schweinebauer.webp',
    'images/schlachter.webp',
    'images/drache.webp',
    'images/drache2.webp',
    'images/dracheko.webp',
    'images/drache-tot.webp',
    'images/schwein-krank.webp',
    'images/ratte.webp',
    'images/sonne.webp',
    'images/feuerwehr.webp',
    'images/feuerwehrmann.webp',
    'images/ruine-quadrat.webp',
    'images/ruine-quer.webp',
    'images/ruine-hoch.webp',
    'images/ruine-schwein.webp',
    'images/schlossk1.webp',
    'images/schlossk2.webp',
    'images/schlossk3.webp',
    'images/lanze-drache.webp',
    'images/wachturm-drache.webp',
    'images/festung-drache.webp',
    'images/apotheke.webp',
    'images/apotheker.webp',
    'images/arztpraxis.webp',
    'images/arzt.webp',
    'images/krank.webp',
    'images/icon_raeuberkraut.webp',
    'images/icon_antibiotika.webp',
    'images/magierturm.webp',  // <-- NEU
    'images/magier.webp'       // <-- NEU
  ];
  imagesToLoad.forEach(path => Game.Assets.loadImage(path));

  if (Game.DECORATIONS) {
    for (const key in Game.DECORATIONS) {
      Game.Assets.loadImage(Game.DECORATIONS[key].asset);
    }
  }

  window.audioManager.preloadFromBuildingTypes();

  window.audioManager.preload('audio/axt.mp3');
  window.audioManager.preload('audio/steinmetz.mp3');
  window.audioManager.preload('audio/fischerhuette.mp3');
  window.audioManager.preload('audio/bauernhof.mp3');
  window.audioManager.preload('audio/saegen.mp3');
  window.audioManager.preload('audio/windrad.mp3');
  window.audioManager.preload('audio/bierbrauerei.mp3');
  window.audioManager.preload('audio/schwein.mp3');
  window.audioManager.preload('audio/zombie.mp3');
  window.audioManager.preload('audio/schrei.mp3');
  window.audioManager.preload('audio/drache.mp3');
  window.audioManager.preload('audio/explosion.mp3');
};
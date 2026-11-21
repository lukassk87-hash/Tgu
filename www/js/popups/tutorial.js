window.Game = window.Game || {};

// ==========================================================
// TUTORIAL – js/popups/tutorial.js
// Enthält das Tutorial-Popup-HTML und die Event-Delegation.
// Wird von main-preload.js in den Popup-Container injiziert.
// ==========================================================

Game.Tutorial = Game.Tutorial || {};

Game.Tutorial.html = `
  <div id="tutorialPopup" class="overlay hidden">
    <div class="panel" style="border: 2px solid var(--gold); max-width: 560px; max-height: 85vh; overflow-y: auto;">

      <h2 style="color: var(--gold); text-align: center; margin-bottom: 14px; display: flex; align-items: center; justify-content: center; gap: 10px;">
        📖 <span data-i18n="tutorial_title">So funktioniert RedCastle</span>
      </h2>

      <!-- ================= ZIEL ================= -->
      <div class="tutorial-block">
        <h3>🎯 <span data-i18n="tutorial_goal_label">Ziel</span></h3>
        <p data-i18n="tutorial_goal_text">
          Überlebe so lange wie möglich. Du verlierst, wenn dein Schloss zerstört wird.
        </p>
      </div>

      <!-- ================= BEVÖLKERUNG ================= -->
      <div class="tutorial-block">
        <h3>👥 <span data-i18n="tutorial_population_label">Bevölkerung & Nahrung</span></h3>
        <p data-i18n="tutorial_population_text">
          Alle 30 Sekunden wächst deine Bevölkerung – pro Haus und im Schloss –
          aber nur, wenn Brot oder Fleisch im Lager liegt.
        </p>
        <p data-i18n="tutorial_food_text">
          Jeder Einwohner isst alle 2 Minuten. Erst Brot, dann Fleisch.
          Fehlt beides 4 Minuten lang, stirbt er.
        </p>
        <div class="tutorial-icons">
          <img src="images/icon_brot.webp" title="Brot">
          <img src="images/icon_fleisch.webp" title="Fleisch">
          <img src="images/villager-idle-rot.webp" title="Einwohner">
        </div>
      </div>

      <!-- ================= ROHSTOFFE ================= -->
      <div class="tutorial-block">
        <h3>🌲 <span data-i18n="tutorial_raw_label">Rohstoffe sammeln</span></h3>
        <p data-i18n="tutorial_raw_text">
          Holz und Stein sind die zwei wichtigsten Baumaterialien.
          Beide werden für fast jedes Gebäude gebraucht – baue früh mehrere Holzfäller und Steinmetze.
        </p>
        <div class="tutorial-chain">
          <img src="images/icon_baum.webp"> Holz
          <span class="arrow">→</span>
          <img src="images/icon_bretter.webp"> Holzplanken
        </div>
        <div class="tutorial-chain">
          <img src="images/icon_stein.webp"> Stein
          <span class="arrow">→</span>
          <span data-i18n="tutorial_stone_direct">direkt zum Bauen</span>
        </div>
      </div>

      <!-- ================= FÖRSTER ================= -->
      <div class="tutorial-block">
        <h3>🌱 <span data-i18n="tutorial_forester_label">Förster</span></h3>
        <p data-i18n="tutorial_forester_text">
          Der Förster pflanzt neue Bäume. Ohne ihn gehen deinem Holzfäller irgendwann die Bäume aus.
        </p>
        <div class="tutorial-chain">
          <img src="images/forsthaus.webp"> Försterei
          <span class="arrow">→</span>
          <img src="images/icon_baum.webp"> neue Bäume
          <span class="arrow">→</span>
          <img src="images/icon_baum.webp"> Holz für den Holzfäller
        </div>
      </div>

      <!-- ================= LIEFERKETTEN ================= -->
      <div class="tutorial-block">
        <h3>🔗 <span data-i18n="tutorial_chains_label">Lieferketten</span></h3>

        <div class="tutorial-chain">
          <img src="images/icon_getreide.webp"> Getreide
          <span class="arrow">→</span>
          <img src="images/icon_mehl.webp"> Mehl
          <span class="arrow">→</span>
          <img src="images/icon_brot.webp"> Brot
        </div>

        <div class="tutorial-chain">
          <img src="images/icon_getreide.webp"> Getreide
          <span class="arrow">+</span>
          <img src="images/icon_wasser.webp"> Wasser
          <span class="arrow">→</span>
          <img src="images/icon_bier.webp"> Bier
          <span class="tutorial-note" data-i18n="tutorial_beer_note">(macht Krieger stärker!)</span>
        </div>

        <div class="tutorial-chain">
          <img src="images/icon_fisch.webp"> Fisch
          <span class="arrow">+</span>
          <img src="images/icon_getreide.webp"> Getreide
          <span class="arrow">→</span>
          <img src="images/icon_futter.webp"> Futter
          <span class="arrow">→</span>
          <img src="images/icon_schwein.webp"> Schwein
          <span class="arrow">→</span>
          <img src="images/icon_fleisch.webp"> Fleisch
        </div>

        <div class="tutorial-chain">
          <img src="images/icon_baum.webp"> Holz
          <span class="arrow">+</span>
          <img src="images/icon_stein.webp"> Stein
          <span class="arrow">→</span>
          <img src="images/icon_pfeil.webp"> Pfeile
          <span class="tutorial-note" data-i18n="tutorial_arrow_note">(für Türme)</span>
        </div>

        <div class="tutorial-chain">
          <img src="images/icon_raeuberkraut.webp"> Räuberkraut
          <span class="arrow">+</span>
          <img src="images/icon_futter.webp"> Futter
          <span class="arrow">→</span>
          <img src="images/icon_antibiotika.webp"> Antibiotika
          <span class="tutorial-note" data-i18n="tutorial_med_note">(heilt Kranke)</span>
        </div>
      </div>

      <!-- ================= BIER ================= -->
      <div class="tutorial-block tutorial-highlight">
        <h3>🍺 <span data-i18n="tutorial_beer_label">Bier ist wichtig!</span></h3>
        <p data-i18n="tutorial_beer_text">
          Krieger, die Bier haben, kämpfen deutlich stärker.
          Baue früh eine Brauerei und halte die Bier-Slots in Schloss und Wachstuben gefüllt.
        </p>
        <div class="tutorial-icons">
          <img src="images/icon_bier.webp" title="Bier">
          <img src="images/villager-krieger-rot.webp" title="Krieger">
        </div>
      </div>

      <!-- ================= LAGER ================= -->
      <div class="tutorial-block">
        <h3>📦 <span data-i18n="tutorial_storage_label">Lager</span></h3>
        <p data-i18n="tutorial_storage_text">
          Lager verkürzen die Transportwege. Aber Vorsicht: Sie sind auch ein Ziel für Räuber.
        </p>
      </div>

      <!-- ================= GEFAHREN ================= -->
      <div class="tutorial-block">
        <h3>⚠️ <span data-i18n="tutorial_dangers_label">Gefahren</span></h3>
        <p data-i18n="tutorial_dangers_text">
          Feuer (ab 15 Min – Feuerwehr bauen!), Krankheit (ab 15 Min – Apotheke + Arztpraxis),
          Zombies, Räuber, Drachen, Erdbeben.
        </p>
        <p data-i18n="tutorial_raider_attack_text">
          Räuberlager greifst du an, indem du auf das Hauptquartier klickst und dort den Angriffsbefehl auswählst.
        </p>
        <div class="tutorial-icons">
          <img src="images/flamme.webp" title="Feuer">
          <img src="images/krank.webp" title="Krankheit">
          <img src="images/zombie.webp" title="Zombie">
          <img src="images/villager-krieger-blau.webp" title="Räuber">
          <img src="images/drache.webp" title="Drache">
        </div>
      </div>

      <!-- ================= TIPP ================= -->
      <div class="tutorial-block tutorial-tip">
        <h3>💡 <span data-i18n="tutorial_tip_label">Start-Tipp</span></h3>
        <p data-i18n="tutorial_tip_text">
          Denke an deine Verteidigung. Zombies überrennen dein Lager, wenn du nicht genug Verteidigungsanlagen baust.
        </p>
        <p data-i18n="tutorial_dragon_text">
          Der Drache erscheint erst, wenn du Bogenschützentürme und Pfeilschmieden gebaut hast.
        </p>
      </div>

      <button id="tutorialClose" class="primary" style="margin-top: 16px;" data-i18n="popup_ok">Verstanden</button>
    </div>
  </div>
`;

// ==========================================================
// Event-Delegation (funktioniert unabhängig vom Inject-Zeitpunkt)
// ==========================================================
document.addEventListener('click', (e) => {
  const t = e.target;
  if (!t) return;

  if (t.id === 'tutorialBtnMenu' || t.id === 'tutorialBtnCastle') {
    document.getElementById('tutorialPopup')?.classList.remove('hidden');
  }
  if (t.id === 'tutorialClose') {
    document.getElementById('tutorialPopup')?.classList.add('hidden');
  }
});
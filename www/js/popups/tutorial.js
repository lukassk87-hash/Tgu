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
          <img src="images/icon_baum.webp"> <span data-i18n="res_wood">Holz</span>
          <span class="arrow">→</span>
          <img src="images/icon_bretter.webp"> <span data-i18n="res_woodPlank">Holzplanken</span>
        </div>
        <div class="tutorial-chain">
          <img src="images/icon_stein.webp"> <span data-i18n="res_stone">Stein</span>
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
          <img src="images/icon_baum.webp"> <span data-i18n="tutorial_new_trees">neue Bäume</span>
          <span class="arrow">→</span>
          <img src="images/icon_baum.webp"> <span data-i18n="res_wood">Holz</span> <span data-i18n="tutorial_for_lumberjack">für den Holzfäller</span>
        </div>
      </div>

      <!-- ================= FISCHER ================= -->
      <div class="tutorial-block">
        <h3>🎣 <span data-i18n="tutorial_fisher_label">Fischer</span></h3>
        <p data-i18n="tutorial_fisher_text">
          Der Fischer braucht Wasser mit Fisch in der Nähe. Ohne Fischgewässer kann er nicht arbeiten.
          Viele Gebäude verbrauchen Fisch als Betriebsressource. Ist kein Fisch im Lager,
          arbeiten diese Gebäude nur noch mit einem Viertel ihrer normalen Geschwindigkeit.
        </p>
        <div class="tutorial-chain">
          <img src="images/fischerhuette-rot.webp"> Fischerhütte
          <span class="arrow">→</span>
          <img src="images/wasser.webp"> <span data-i18n="tutorial_water_with_fish">Wasser mit Fisch</span>
          <span class="arrow">→</span>
          <img src="images/icon_fisch.webp"> <span data-i18n="res_fish">Fisch</span>
        </div>
        <div class="tutorial-icons">
          <img src="images/fischerhuette-rot.webp" title="Fischerhütte">
          <img src="images/wasser.webp" title="Wasser mit Fisch">
          <img src="images/icon_fisch.webp" title="Fisch">
          <img src="images/villager-angler-rot.webp" title="Fischer">
        </div>
      </div>

      <!-- ================= LIEFERKETTEN ================= -->
      <div class="tutorial-block">
        <h3>🔗 <span data-i18n="tutorial_chains_label">Lieferketten</span></h3>

        <div class="tutorial-chain">
          <img src="images/icon_getreide.webp"> <span data-i18n="res_grain">Getreide</span>
          <span class="arrow">→</span>
          <img src="images/icon_mehl.webp"> <span data-i18n="res_flour">Mehl</span>
          <span class="arrow">→</span>
          <img src="images/icon_brot.webp"> <span data-i18n="res_bread">Brot</span>
        </div>

        <div class="tutorial-chain">
          <img src="images/icon_getreide.webp"> <span data-i18n="res_grain">Getreide</span>
          <span class="arrow">+</span>
          <img src="images/icon_wasser.webp"> <span data-i18n="res_water">Wasser</span>
          <span class="arrow">→</span>
          <img src="images/icon_bier.webp"> <span data-i18n="res_beer">Bier</span>
          <span class="tutorial-note" data-i18n="tutorial_beer_note">(macht Krieger stärker!)</span>
        </div>

        <div class="tutorial-chain">
          <img src="images/icon_fisch.webp"> <span data-i18n="res_fish">Fisch</span>
          <span class="arrow">+</span>
          <img src="images/icon_getreide.webp"> <span data-i18n="res_grain">Getreide</span>
          <span class="arrow">→</span>
          <img src="images/icon_futter.webp"> <span data-i18n="res_feed">Futter</span>
          <span class="arrow">→</span>
          <img src="images/icon_schwein.webp"> <span data-i18n="res_pig">Schwein</span>
          <span class="arrow">→</span>
          <img src="images/icon_fleisch.webp"> <span data-i18n="res_meat">Fleisch</span>
        </div>

        <div class="tutorial-chain">
          <img src="images/icon_baum.webp"> <span data-i18n="res_wood">Holz</span>
          <span class="arrow">+</span>
          <img src="images/icon_stein.webp"> <span data-i18n="res_stone">Stein</span>
          <span class="arrow">→</span>
          <img src="images/icon_pfeil.webp"> <span data-i18n="res_arrows">Pfeile</span>
          <span class="tutorial-note" data-i18n="tutorial_arrow_note">(für Türme)</span>
        </div>

        <div class="tutorial-chain">
          <img src="images/icon_raeuberkraut.webp"> <span data-i18n="res_raiderHerb">Räuberkraut</span>
          <span class="arrow">+</span>
          <img src="images/icon_futter.webp"> <span data-i18n="res_feed">Futter</span>
          <span class="arrow">→</span>
          <img src="images/icon_antibiotika.webp"> <span data-i18n="res_antibiotics">Antibiotika</span>
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

      <!-- ================= FEUERWEHR ================= -->
      <div class="tutorial-block tutorial-highlight">
        <h3>🚒 <span data-i18n="tutorial_fire_label">Feuerwehr</span></h3>
        <p data-i18n="tutorial_fire_text">
          Feuer bricht nach 15 Minuten aus und breitet sich auf Nachbargebäude aus.
          Eine Feuerwehr löscht Brände in ihrem Radius – aber nur, wenn sie Wasser hat.
        </p>
        <p data-i18n="tutorial_fire_slots_text">
          Die Feuerwehr hat zwei feste Plätze: einen Löscher und einen Wasser-Nachfüller.
          Der Nachfüller holt Wasser aus dem Lager, der Löscher bekämpft das Feuer.
        </p>
        <div class="tutorial-chain">
          <img src="images/feuerwehr.webp"> Feuerwehr
          <span class="arrow">→</span>
          <img src="images/icon_wasser.webp"> <span data-i18n="res_water">Wasser</span>
          <span class="arrow">→</span>
          <img src="images/flamme.webp"> Feuer löschen
        </div>
        <div class="tutorial-icons">
          <img src="images/feuerwehr.webp" title="Feuerwehr">
          <img src="images/feuerwehrmann.webp" title="Feuerwehrmann">
          <img src="images/flamme.webp" title="Feuer">
          <img src="images/icon_wasser.webp" title="Wasser">
        </div>
      </div>

      <!-- ================= BOGENSCHÜTZENANLAGE ================= -->
      <div class="tutorial-block">
        <h3>🏹 <span data-i18n="tutorial_arrow_tower_label">Bogenschützenanlage</span></h3>
        <p data-i18n="tutorial_arrow_tower_text">
          Die Bogenschützenanlage verteidigt dein Territorium automatisch.
          Sie braucht Pfeile aus der Pfeilschmiede und einen Bogenschützen als Besatzung.
        </p>
        <p data-i18n="tutorial_arrow_tower_range_text">
          Je weiter ein Ziel entfernt ist, desto geringer die Trefferchance.
          Gegen Drachen trifft sie immer zu 75%.
        </p>
        <div class="tutorial-chain">
          <img src="images/pfeilschmiede.webp"> Pfeilschmiede
          <span class="arrow">→</span>
          <img src="images/icon_pfeil.webp"> <span data-i18n="res_arrows">Pfeile</span>
          <span class="arrow">→</span>
          <img src="images/bogenschussanlage.webp"> Bogenschützenanlage
        </div>
        <div class="tutorial-icons">
          <img src="images/bogenschussanlage.webp" title="Bogenschützenanlage">
          <img src="images/bogenschuetze.webp" title="Bogenschütze">
          <img src="images/icon_pfeil.webp" title="Pfeile">
          <img src="images/drache.webp" title="Drache">
        </div>
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
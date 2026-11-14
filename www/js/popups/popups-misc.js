window.Game = window.Game || {};

Game.Popups = Game.Popups || {};

Game.Popups.miscHtml = `
  <div id="firePopup" class="overlay hidden">
    <div class="panel" style="border: 2px solid #ff3030; max-width: 420px;">
      <h2 style="color: #ff6b6b; display: flex; align-items: center; justify-content: center; gap: 10px;">
        <img src="images/feuerwehr.webp" alt="" style="width: 56px; height: 56px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.7));">
        Feuer ausgebrochen!
      </h2>
      <p style="color: var(--parchment-dim); font-size: 14px; line-height: 1.6;">
        Ein Gebäude steht in Flammen! Wenn das Feuer nicht gelöscht wird, brennt es zur Ruine nieder und kann sich auf umliegende Gebäude ausbreiten.
        <br><br>
        <b style="color: #ff8a5c;">Baue eine Feuerwehr und sorge für genug Wasser, um Brände zu löschen!</b>
      </p>
      <div style="display: flex; gap: 10px; margin-top: 14px;">
        <button id="firePopupGoto" style="flex: 1; background: linear-gradient(180deg, var(--red-bad-light) 0%, var(--red-bad) 100%); color: #fff;">Zum Brand springen</button>
        <button id="firePopupClose" style="flex: 1;">Schließen</button>
      </div>
    </div>
  </div>

  <div id="sicknessPopup" class="overlay hidden">
    <div class="panel" style="border: 2px solid #f0a040; max-width: 480px;">
      <h2 style="color: #f0a040; display: flex; align-items: center; justify-content: center; gap: 10px;">
        <img src="images/krank.webp" alt="" style="width: 56px; height: 56px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.7));">
        Jemand ist krank geworden!
      </h2>
      <p style="color: var(--parchment-dim); font-size: 14px; line-height: 1.6;">
        Einer deiner Bewohner ist erkrankt. Kranke Arbeiter sind nur noch <b>ein Drittel so produktiv</b>.
        Ohne Behandlung wird er nicht wieder gesund!
      </p>
      <div style="background: rgba(240,160,64,0.12); border: 1px solid #f0a040; border-radius: 8px; padding: 12px; margin: 12px 0;">
        <b style="color: #f0a040;">So heilst du ihn:</b>
        <ol style="margin: 8px 0 0 20px; padding: 0; color: var(--parchment); font-size: 13px; line-height: 1.7;">
          <li id="sicknessRaiderHerbText">
            <b>Räuberlager zerstören</b> →
            du erhältst <b>Räuberkraut</b>.
          </li>
          <li>
            <b>Apotheke bauen</b> →
            verarbeitet Räuberkraut + Futter zu <b>Antibiotika</b>.
          </li>
          <li>
            <b>Arztpraxis bauen</b> →
            der Arzt heilt kranke Bewohner mit Antibiotika.
          </li>
        </ol>
      </div>
      <div style="display: flex; gap: 10px; margin-top: 14px;">
        <button id="sicknessPopupOk" class="primary" style="flex: 1;">Verstanden</button>
      </div>
    </div>
  </div>

  <div id="zombieVirusPopup" class="overlay hidden">
    <div class="panel" style="border: 2px solid #7ad07a; max-width: 420px;">
      <h2 style="color: #7ad07a; display: flex; align-items: center; justify-content: center; gap: 10px;">
        <img src="images/zombie.webp" alt="" style="width: 56px; height: 56px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.7));">
        Das Zombievirus hat sich weiterentwickelt!
      </h2>
      <p style="color: var(--parchment-dim); font-size: 14px; line-height: 1.6;">
        Die Übertragung erfolgt jetzt auch von Zombie zu Mensch. Ab sofort können Zombies deine Einwohner infizieren.
      </p>
      <div style="display: flex; gap: 10px; margin-top: 14px;">
        <button id="zombieVirusOk" class="primary" style="flex: 1;">Verstanden</button>
      </div>
    </div>
  </div>

  <div id="earthquakePopup" class="overlay hidden">
    <div class="panel" style="border: 2px solid #8a6a3a; max-width: 440px;">
      <h2 style="color: #ffb05c; display: flex; align-items: center; justify-content: center; gap: 10px; text-align: center;">
        <span style="font-size: 32px;">🌍</span>
        Ein gewaltiges Erdbeben!
      </h2>
      <div style="color: var(--parchment-dim); font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
        Die Erde bebte und hat große Schäden in deiner Siedlung hinterlassen:
        <ul style="margin: 10px 0; padding-left: 20px; list-style-type: disc;">
          <li><b id="eqHousesDestroyed" style="color: #ff6b6b;">0</b> Gebäude wurden zerstört.</li>
          <li><b id="eqVillagersDead" style="color: #ff6b6b;">0</b> Einwohner starben in den Trümmern.</li>
          <li><b id="eqResourcesLost" style="color: #ff6b6b;">0</b> Ressourcen wurden vernichtet.</li>
          <li>Ein Feuer ist ausgebrochen!</li>
        </ul>
      </div>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <button id="earthquakeOk" class="primary">Ich baue wieder auf</button>
        <button id="earthquakeSacrificeBtn" style="background: linear-gradient(180deg, #8a6a3a 0%, #6b4d2a 100%); color: #fff; border-color: var(--wood-border);">
          <span style="font-size: 13px; font-weight: normal;">Götter besänftigen (kostet 15% aller Rohstoffe)</span><br>
          <span style="font-size: 11px; font-style: italic; color: #ffcc00;">Danach nie wieder Erdbeben!</span>
        </button>
      </div>
    </div>
  </div>

  <div id="earthquakeSacrificeConfirm" class="overlay hidden">
    <div class="panel" style="border: 2px solid #ffcc00; max-width: 420px;">
      <h2 style="color: #ffcc00; text-align: center;">Opfergabe an die Götter?</h2>
      <p style="color: var(--parchment-dim); font-size: 14px; line-height: 1.6; text-align: center;">
        Bist du sicher? Die Götter verlangen <b>15% aller deiner Rohstoffe</b>. Dafür werden sie dich für immer vor weiteren Erdbeben verschonen.
      </p>
      <div id="sacrificeCostList" style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px; margin: 12px 0; font-size: 12px; color: #ffb05c; text-align: center;">
        <!-- Kosten werden dynamisch eingefügt -->
      </div>
      <div style="display: flex; gap: 10px; margin-top: 8px;">
        <button id="earthquakeSacrificeYes" class="primary" style="flex: 1; background: linear-gradient(180deg, #e6a817 0%, #a87a10 100%); color: #111;">Ja, opfern</button>
        <button id="earthquakeSacrificeNo" style="flex: 1;">Nein, lieber nicht</button>
      </div>
    </div>
  </div>
`;
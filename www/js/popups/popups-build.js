window.Game = window.Game || {};

Game.Popups = Game.Popups || {};

Game.Popups.buildHtml = `
  <div id="buildConfirm" class="overlay hidden">
    <div class="panel">
      <h2 id="buildConfirmTitle">Gebäude bauen?</h2>
      <p id="buildConfirmCost" style="color: var(--parchment-dim); font-size: 14px;"></p>
      <div style="display: flex; gap: 10px; margin-top: 6px;">
        <button id="buildConfirmYes" class="primary" style="flex: 1;">Bauen</button>
        <button id="buildConfirmNo" style="flex: 1;">Abbrechen</button>
      </div>
    </div>
  </div>

  <div id="demolishConfirm" class="overlay hidden">
    <div class="panel">
      <h2 id="demolishConfirmTitle">Gebäude abreißen?</h2>
      <p id="demolishConfirmText" style="color: var(--parchment-dim); font-size: 14px;"></p>
      <div style="display: flex; gap: 10px; margin-top: 6px;">
        <button id="demolishConfirmYes" style="flex: 1; background: linear-gradient(180deg, var(--red-bad-light) 0%, var(--red-bad) 100%); color: #fff;">Abreißen</button>
        <button id="demolishConfirmNo" style="flex: 1;">Abbrechen</button>
      </div>
    </div>
  </div>

  <div id="repairModal" class="overlay hidden">
    <div class="panel" style="border: 2px solid var(--brass); max-width: 460px;">
      <h2 style="color: var(--brass-light); display: flex; align-items: center; gap: 10px; justify-content: center;">
        <span style="font-size: 28px;">🛠️</span>
        Siedlung reparieren?
      </h2>
      <p style="color: var(--parchment); font-size: 14px; line-height: 1.6; text-align: center; margin-top: 12px;">
        Diese Funktion überprüft alle Gebäude und Einwohner auf <b>Fehler in der Zuweisung</b>.
      </p>
      <div style="background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px; margin: 12px 0; border-left: 3px solid var(--brass);">
        <p style="color: var(--parchment-dim); font-size: 13px; line-height: 1.6; margin: 0;">
          <b style="color: var(--gold);">Was passiert?</b><br>
          • Alle Jobs werden <b>neu vergeben</b>.<br>
          • Einwohner, die nicht mehr existieren, werden aus Gebäuden entfernt.<br>
          • Krieger kehren in ihre Türme zurück.<br>
          • Arbeitslose Einwohner werden neu zugewiesen.<br>
          <br>
          <b style="color: #ff8a5c;">Deine Ressourcen und Gebäude bleiben unberührt!</b>
        </p>
      </div>
      <div style="display: flex; gap: 10px; margin-top: 8px;">
        <button id="repairModalYes" class="primary" style="flex: 1;">
          ✓ Ja, jetzt reparieren
        </button>
        <button id="repairModalNo" style="flex: 1;">
          ✗ Abbrechen
        </button>
      </div>
    </div>
  </div>
`;
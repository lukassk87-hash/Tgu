window.Game = window.Game || {};

Game.Popups = Game.Popups || {};

Game.Popups.combatHtml = `
  <div id="raiderPopup" class="overlay hidden">
    <div class="panel" style="border: 2px solid var(--blue-info); max-width: 420px;">
      <h2 style="color: #7ab4d8;">
        <img src="images/villager-krieger-blau.webp" alt="" style="width:24px;height:24px;object-fit:contain;vertical-align:middle;margin-right:6px;">
        Räuberlager entdeckt!
      </h2>
      <p style="color: var(--parchment-dim); font-size: 14px; line-height: 1.5;">
        In der Ferne wurde ein feindliches Dorf gesichtet. Seine Krieger werden deine Siedlung überfallen und Ressourcen stehlen.
        <br><br>
        <em style="color: var(--parchment-dark);">Tipp: Du kannst das Lager erkunden, bevor der erste Angriff kommt.</em>
      </p>
      <div style="display: flex; gap: 10px; margin-top: 12px;">
        <button id="raiderPopupGoto" style="flex: 1;">Zum Räuberlager</button>
        <button id="raiderPopupClose" style="flex: 1;">Schließen</button>
      </div>
    </div>
  </div>

  <div id="dragonPopup" class="overlay hidden">
    <div class="panel" style="border: 2px solid #ff6b3b; max-width: 420px;">
      <h2 style="color: #ff8a5c;">
        <img src="images/drache.webp" alt="Drache" style="width: 48px; height: 48px; object-fit: contain; vertical-align:middle; margin-right:6px;">
        Ein Drache naht!
      </h2>
      <div id="dragonPopupInfo" style="color: var(--parchment-dim); font-size: 14px; line-height: 1.6; margin-bottom: 12px;"></div>
      <div style="display: flex; gap: 10px; margin-top: 12px;">
        <button id="dragonPopupGoto" style="flex: 1; background: linear-gradient(180deg, var(--red-bad-light) 0%, var(--red-bad) 100%); color: #fff;">Zum Drachen</button>
        <button id="dragonPopupClose" style="flex: 1;">Schließen</button>
      </div>
    </div>
  </div>

  <div id="dragonPackPopup" class="overlay hidden">
    <div class="panel" style="border: 2px solid #ff3030; max-width: 440px;">
      <h2 style="color: #ff6b6b; display: flex; align-items: center; justify-content: center; gap: 10px;">
        <img src="images/drache.webp" alt="Drache" style="width: 56px; height: 56px; object-fit: contain; vertical-align:middle;">
        Ein Rudel Drachen greift an!
      </h2>
      <p style="color: var(--parchment-dim); font-size: 14px; line-height: 1.6;">
        Drei junge Drachen haben deine Siedlung erspäht und greifen gleichzeitig aus verschiedenen Richtungen an. Sie sind noch unerfahren, aber in der Überzahl!
        <br><br>
        <b style="color: #ff8a5c;">Rüste deine Verteidigung aus und halte sie auf Abstand!</b>
      </p>
      <div style="display: flex; gap: 10px; margin-top: 12px;">
        <button id="dragonPackGoto" style="flex: 1; background: linear-gradient(180deg, var(--red-bad-light) 0%, var(--red-bad) 100%); color: #fff;">Zum Kampf</button>
        <button id="dragonPackClose" style="flex: 1;">Schließen</button>
      </div>
    </div>
  </div>
`;
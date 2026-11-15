window.Game = window.Game || {};

Game.Popups = Game.Popups || {};

Game.Popups.warningHtml = `
  <div id="hungerWarning" class="overlay hidden">
    <div class="panel" style="border: 2px solid var(--red-bad); max-width: 400px;">
      <h2 data-i18n="warning_hunger_title" style="color: #ff8080;">⚠️ Hungersnot droht!</h2>
      <p style="color: var(--parchment-dim); font-size: 14px; line-height: 1.5;">
        <span data-i18n="warning_hunger_desc">Die Nahrungsproduktion ist zu niedrig. In den letzten 5 Minuten wurde mehr Nahrung verbraucht als produziert.</span>
        <br><br>
        <strong id="hungerDetail" style="color: #ff8080;"></strong>
        <br><br>
        <span data-i18n="warning_hunger_tip">Baue mehr Bäckereien oder Schlachter.</span>
      </p>
      <button id="hungerWarningOk" class="primary" data-i18n="popup_ok" style="margin-top: 12px;">Verstanden</button>
    </div>
  </div>

  <div id="startWarning" class="overlay hidden">
    <div class="panel" style="border: 2px solid var(--gold); max-width: 480px;">
      <h2 data-i18n="warning_start_title" style="color: var(--gold);">⚠️ Gefahr für die Siedlung!</h2>
      <div style="color: var(--parchment-dim); font-size: 14px; line-height: 1.6;">
        <span data-i18n="warning_start_desc">Deine Siedlung ist nicht allein auf dieser Welt. Feinde werden kommen, um sie zu zerstören:</span>
        <ul style="margin: 12px 0; padding: 0; list-style-type: none;">

          <li id="startWarningZombie" style="margin-bottom: 12px; display: flex; align-items: center; gap: 12px;">
            <img src="images/zombie.webp" alt="" style="width: 48px; height: 48px; object-fit: contain; flex-shrink: 0;">
            <span data-i18n="warning_start_zombies"><b style="color: #7ad07a;">Zombies</b> steigen aus dem Boden und greifen deine Einwohner an.</span>
          </li>

          <li id="startWarningRaider" style="margin-bottom: 12px; display: flex; align-items: center; gap: 12px;">
            <img src="images/villager-krieger-blau.webp" alt="" style="width: 48px; height: 48px; object-fit: contain; flex-shrink: 0;">
            <span data-i18n="warning_start_raiders"><b style="color: #7ab4d8;">Räuber</b> bauen ein Lager in der Ferne und überfallen dich, um Ressourcen zu stehlen.</span>
          </li>

          <li id="startWarningDragon" style="margin-bottom: 12px; display: flex; align-items: center; gap: 12px;">
            <img src="images/drache.webp" alt="" style="width: 48px; height: 48px; object-fit: contain; flex-shrink: 0;">
            <span data-i18n="warning_start_dragons"><b style="color: #ff8a5c;">Drachen</b> fallen vom Himmel und brennen deine Gebäude nieder.</span>
          </li>

        </ul>
        <span data-i18n="warning_start_ready"><b>Rüste deine Verteidigung frühzeitig aus!</b> Baue Bogenschussanlagen, Wachtürme und bilde Krieger aus.</span>
        <br><br>
        <div id="startWarningDragonTime" data-i18n="warning_start_dragon_time" style="background: rgba(255, 107, 59, 0.15); border: 1px solid #ff6b3b; padding: 10px; border-radius: 6px; color: #ff8a5c;">
          <b>Drachen-Warnung:</b> Der Drache erscheint kurz nachdem dein Dorf würdig ist, sich einem Drachen zu stellen.
        </div>
      </div>
      <div style="display: flex; gap: 10px; margin-top: 16px;">
        <button id="startWarningOk" class="primary" data-i18n="warning_start_ok" style="flex: 1; background: linear-gradient(180deg, var(--gold) 0%, #a87a10 100%); color: #111;">Verstanden, ich bin bereit!</button>
      </div>
    </div>
  </div>

  <div id="peaceWarning" class="overlay hidden">
    <div class="panel" style="border: 2px solid var(--green-ok-light); max-width: 480px;">
      <h2 data-i18n="warning_peace_title" style="color: var(--green-ok-light);">Willkommen in einer friedlichen Welt!</h2>
      <div data-i18n="warning_peace_desc" style="color: var(--parchment-dim); font-size: 14px; line-height: 1.6;">
        Es gibt keine Zombies, Räuber oder Drachen. Hier kannst du nach Belieben bauen und musst dich nicht um die Verteidigung deiner Siedlung kümmern.
        <br><br>
        Genieße den Frieden und baue dein Traumdorf!
      </div>
      <div style="display: flex; gap: 10px; margin-top: 16px;">
        <button id="peaceWarningOk" class="primary" data-i18n="warning_peace_ok" style="flex: 1;">Frieden genießen</button>
      </div>
    </div>
  </div>
`;
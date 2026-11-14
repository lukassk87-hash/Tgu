window.Game = window.Game || {};

Game.Windows = Game.Windows || {};

Game.Windows.debugHtml = `
  <div id="debugWindow" class="overlay hidden">
    <div class="panel" style="border: 2px solid #ff3030; max-width: 550px; max-height: 90vh; overflow-y: auto; display: flex; flex-direction: column;">

      <div class="build-modal-header" style="margin: -20px -24px 0 -24px; padding: 14px 18px; border-radius: 10px 10px 0 0; background: #3e2a1a; border-bottom: 1px solid #1a1008; position: sticky; top: -20px; z-index: 10; flex-shrink: 0;">
        <h2 style="margin: 0; font-size: 17px; color: #ff6b6b; text-shadow: 1px 1px 0 #000;">🛠️ Debug & Log-Konsole</h2>
        <button id="debugWindowClose" style="width: 36px; height: 36px; padding: 0; font-size: 22px; line-height: 1; background: var(--red-bad); border-radius: 8px;">×</button>
      </div>

      <div style="flex-shrink: 0; padding: 12px 0; border-bottom: 1px solid #333; margin-bottom: 8px;">
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <textarea id="debugCommandInput" placeholder="JavaScript oder Befehl eingeben (z.B. help)..." rows="3" style="width: 100%; padding: 10px; background: #111; color: #0f0; border: 1px solid #444; border-radius: 6px; font-family: monospace; font-size: 13px; resize: vertical; min-height: 60px; max-height: 200px;"></textarea>
          <button id="debugCommandSend" style="width: 100%; padding: 10px 16px; background: #4A90E2; color: #fff; border: none; border-radius: 6px; font-weight: bold; font-size: 13px;">Senden</button>
        </div>
      </div>

      <div id="debugTimersList" style="display: flex; flex-direction: column; gap: 16px; padding-bottom: 16px; flex-shrink: 0;">
        <!-- Timer werden per JS befüllt -->
      </div>

      <div id="debugFireLog" style="flex: 1; display: flex; flex-direction: column; border-top: 2px solid #333; padding-top: 8px;">
        <h3 style="color: #ff6b6b; font-size: 14px; margin: 0 0 8px 0; flex-shrink: 0;">📜 Log-Ausgabe</h3>
        <div id="debugFireLogContent" style="background: #0a0a0a; padding: 10px; border-radius: 6px; font-family: monospace; font-size: 11px; color: #0f0; max-height: 250px; overflow-y: auto; white-space: pre-wrap; word-break: break-all; user-select: text; -webkit-user-select: text; touch-action: pan-y; -webkit-overflow-scrolling: touch;"></div>
      </div>

    </div>
  </div>
`;
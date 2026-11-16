window.Game = window.Game || {};

Game.Windows = Game.Windows || {};

Game.Windows.inventoryHtml = `
  <!-- Inventar-Button oben links -->
  <div id="inventoryBtn" class="top-left-btn hidden" title="Inventar">
    <img src="images/lager-rot.webp" alt="Inventar">
  </div>

  <!-- Inventar-Fenster -->
  <div id="inventoryWindow" class="overlay hidden">
    <div class="build-modal" style="width: min(95vw, 450px); max-height: 80vh;">
      <div class="build-modal-header">
        <h2 data-i18n="window_inventory_title">Inventar</h2>
        <button id="inventoryWindowClose">×</button>
      </div>
      
      <div id="inventoryContent" class="inventory-grid">
        <!-- Wird per JS befüllt -->
      </div>
    </div>
  </div>
`;
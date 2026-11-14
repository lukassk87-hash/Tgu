window.Game = window.Game || {};

Game.Windows = Game.Windows || {};

Game.Windows.buildHtml = `
  <div id="buildWindow" class="overlay hidden">
    <div class="build-modal">
      <div class="build-modal-header">
        <h2>Gebäude bauen</h2>
        <button id="buildWindowClose">×</button>
      </div>
      <div class="build-tabs">
        <button class="build-tab active" data-category="small">Kleine Gebäude</button>
        <button class="build-tab" data-category="normal">Normale Gebäude</button>
        <button class="build-tab" data-category="large">Große Gebäude</button>
      </div>
      <div id="buildGrid" class="build-grid"></div>
    </div>
  </div>
`;
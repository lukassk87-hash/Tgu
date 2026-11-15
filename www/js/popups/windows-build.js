window.Game = window.Game || {};

Game.Windows = Game.Windows || {};

Game.Windows.buildHtml = `
  <div id="buildWindow" class="overlay hidden">
    <div class="build-modal">
      <div class="build-modal-header">
        <h2 data-i18n="window_build_title">Gebäude bauen</h2>
        <button id="buildWindowClose">×</button>
      </div>
      <div class="build-tabs">
        <button class="build-tab active" data-category="small" data-i18n="window_build_tab_small">Kleine Gebäude</button>
        <button class="build-tab" data-category="normal" data-i18n="window_build_tab_normal">Normale Gebäude</button>
        <button class="build-tab" data-category="large" data-i18n="window_build_tab_large">Große Gebäude</button>
      </div>
      <div id="buildGrid" class="build-grid"></div>
    </div>
  </div>
`;
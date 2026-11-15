window.Game = window.Game || {};

Game.Windows = Game.Windows || {};

Game.Windows.statsHtml = `
  <div id="statsWindow" class="overlay hidden">
    <div class="build-modal" style="width: min(95vw, 650px); height: 80vh; max-height: 80vh;">
      <div class="build-modal-header">
        <h2 data-i18n="window_stats_title">Statistik</h2>
        <button id="statsWindowClose">×</button>
      </div>
      <div class="build-tabs">
        <button class="build-tab active" data-stats-tab="resources" data-i18n="window_stats_tab_resources">Ressourcen</button>
        <button class="build-tab" data-stats-tab="enemies" data-i18n="window_stats_tab_enemies">Gegner</button>
        <button class="build-tab" data-stats-tab="production" data-i18n="window_stats_tab_production">Gesamtproduktion</button>
        <button class="build-tab" data-stats-tab="halloffame" data-i18n="window_stats_tab_halloffame">Hall of Fame</button>
      </div>
      <div id="statsBody" class="stats-table-container"></div>
      <div id="statsEnemiesBody" class="stats-table-container hidden"></div>
      <div id="statsProductionBody" class="stats-table-container hidden"></div>
      <div id="statsHallOfFameBody" class="stats-table-container hidden"></div>
    </div>
  </div>
`;
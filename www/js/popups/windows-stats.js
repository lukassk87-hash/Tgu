window.Game = window.Game || {};

Game.Windows = Game.Windows || {};

Game.Windows.statsHtml = `
  <div id="statsWindow" class="overlay hidden">
    <div class="build-modal" style="width: min(95vw, 650px); height: 80vh; max-height: 80vh;">
      <div class="build-modal-header">
        <h2>Statistik</h2>
        <button id="statsWindowClose">×</button>
      </div>
      <div class="build-tabs">
        <button class="build-tab active" data-stats-tab="resources">Ressourcen</button>
        <button class="build-tab" data-stats-tab="enemies">Gegner</button>
        <button class="build-tab" data-stats-tab="production">Gesamtproduktion</button>
        <button class="build-tab" data-stats-tab="halloffame">Hall of Fame</button>
      </div>
      <div id="statsBody" class="stats-table-container"></div>
      <div id="statsEnemiesBody" class="stats-table-container hidden"></div>
      <div id="statsProductionBody" class="stats-table-container hidden"></div>
      <div id="statsHallOfFameBody" class="stats-table-container hidden"></div>
    </div>
  </div>
`;
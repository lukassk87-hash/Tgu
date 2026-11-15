window.Game = window.Game || {};

Game.Windows = Game.Windows || {};

Game.Windows.villagersHtml = `
  <div id="villagersWindow" class="overlay hidden">
    <div class="build-modal" style="width: min(95vw, 650px); height: 80vh; max-height: 80vh;">
      <div class="build-modal-header">
        <h2 data-i18n="window_villagers_title">Einwohner</h2>
        <button id="villagersWindowClose">×</button>
      </div>
      
      <div class="build-tabs">
        <button id="villagersTabBtn" class="build-tab active" data-i18n="window_villagers_tab_villagers">Einwohner</button>
        <button id="buildingsTabBtn" class="build-tab" data-i18n="window_villagers_tab_buildings">Gebäude</button>
        <button id="militaryTabBtn" class="build-tab" data-i18n="window_villagers_tab_military">Militär</button>
      </div>

      <div id="villagersBody" class="stats-table-container"></div>
      <div id="buildingsBody" class="stats-table-container hidden"></div>
      <div id="militaryBody" class="stats-table-container hidden"></div>
    </div>
  </div>
`;
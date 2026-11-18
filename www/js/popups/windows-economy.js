window.Game = window.Game || {};

Game.Windows = Game.Windows || {};

Game.Windows.economyHtml = `
  <div id="economyWindow" class="overlay hidden">
    <div class="build-modal" style="width: min(95vw, 700px); height: 80vh; max-height: 80vh;">
      <div class="build-modal-header">
        <h2 data-i18n="window_eco_title">Wirtschaft</h2>
        <button id="economyWindowClose">×</button>
      </div>
      
      <div class="build-tabs">
        <button id="jobsTabBtn" class="build-tab active" data-i18n="window_eco_tab_jobs">Jobs</button>
        <button id="resourcesTabBtn" class="build-tab" data-i18n="window_eco_tab_resources">Ressourcen-Transport</button>
      </div>

      <div id="jobsBody" class="stats-table-container">
        <div id="jobsFreeVillagers" style="padding: 12px; background: rgba(30, 20, 10, 0.6); border: 1px solid rgba(184, 137, 74, 0.25); border-radius: 8px; margin-bottom: 8px; font-size: 15px; font-weight: 600;">
          <span data-i18n="window_eco_free_villagers">Freie Dorfbewohner:</span> <span id="freeVillagerCount" style="color: var(--gold);">0</span>
        </div>
        <div style="padding: 12px; background: rgba(30, 20, 10, 0.6); border: 1px solid rgba(184, 137, 74, 0.25); border-radius: 8px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <span style="font-size: 15px; font-weight: 600;">
            <span data-i18n="window_eco_reserved_logistics">Reservierte Logistiker:</span>
            <span id="reservedLogisticsCount" style="color: var(--gold);">0</span>
          </span>
          <div style="display: flex; gap: 8px;">
            <button id="reservedLogisticsMinus" style="width:auto; background: linear-gradient(180deg, var(--red-bad-light) 0%, var(--red-bad) 100%); color:#fff; padding:8px 16px; font-size:18px; font-weight:700;">−</button>
            <button id="reservedLogisticsPlus" style="width:auto; background: linear-gradient(180deg, var(--green-ok-light) 0%, var(--green-ok) 100%); color:#fff; padding:8px 16px; font-size:18px; font-weight:700;">+</button>
          </div>          
        </div>
        <div style="padding: 12px; background: rgba(30, 20, 10, 0.6); border: 1px solid rgba(184, 137, 74, 0.25); border-radius: 8px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
  <span style="font-size: 15px; font-weight: 600;">
    <span data-i18n="window_eco_reserved_builder">Reservierte Builder:</span>
    <span id="builderReserveCount" style="color: var(--gold);">0</span>
  </span>
  <div style="display: flex; gap: 8px;">
    <button id="builderReserveMinus" style="width:auto; background: linear-gradient(180deg, var(--red-bad-light) 0%, var(--red-bad) 100%); color:#fff; padding:8px 16px; font-size:18px; font-weight:700;">−</button>
    <button id="builderReservePlus" style="width:auto; background: linear-gradient(180deg, var(--green-ok-light) 0%, var(--green-ok) 100%); color:#fff; padding:8px 16px; font-size:18px; font-weight:700;">+</button>
  </div>
</div>
        <div id="jobsListContainer"></div>
      </div>

      <div id="resourcesBody" class="stats-table-container hidden">
        <div id="resourcesListContainer"></div>
      </div>

    </div>
  </div>
`;

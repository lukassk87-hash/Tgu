window.Game = window.Game || {};

Game.JobWindow = {
  create(game, world, vm) {
    const economyWindow = document.getElementById('economyWindow');
    const economyWindowClose = document.getElementById('economyWindowClose');

    const jobsTabBtn = document.getElementById('jobsTabBtn');
    const jobsBody = document.getElementById('jobsBody');
    const jobsFreeVillagers = document.getElementById('freeVillagerCount');
    const reservedLogisticsCountEl = document.getElementById('reservedLogisticsCount');
    const reservedLogisticsPlusBtn = document.getElementById('reservedLogisticsPlus');
    const reservedLogisticsMinusBtn = document.getElementById('reservedLogisticsMinus');
    const jobsListContainer = document.getElementById('jobsListContainer');

    const resourcesTabBtn = document.getElementById('resourcesTabBtn');
    const resourcesBody = document.getElementById('resourcesBody');
    const resourcesListContainer = document.getElementById('resourcesListContainer');

    const economyButton = document.getElementById('economyButton');

    // Reservierungen
    const builderReservePlus = document.getElementById('builderReservePlus');
    const builderReserveMinus = document.getElementById('builderReserveMinus');
    const builderReserveCountEl = document.getElementById('builderReserveCount');

    if (game.builderReserveCount === undefined) game.builderReserveCount = 1;
    if (game.logisticsReserveCount === undefined) game.logisticsReserveCount = 1;

    // Initiale Prioritätsliste (Jobs)
    if (!game.jobPriorities) {
      game.jobPriorities = [
        'fireStation',
        'fireStationRefill',
        'arrowTower',
        'warrior',
        'magier',
        'arrowSmith',
        'arztpraxis',
        'apotheke',
        'mill',
        'quarry',
        'brewery',
        'feedMaker',
        'pigFarm',
        'butcher',
        'fisher',
        'lumberjack',
        'forsthaus',
        'farm',
        'well',
        'sawmill',
        'bakery'
      ];
    } else {
      // Builder wird jetzt ausschließlich über die Reservierung gesteuert
      const builderIdx = game.jobPriorities.indexOf('builder');
      if (builderIdx !== -1) {
        game.jobPriorities.splice(builderIdx, 1);
      }

      if (!game.jobPriorities.includes('fireStationRefill')) {
        const fireIdx = game.jobPriorities.indexOf('fireStation');
        if (fireIdx !== -1) {
          game.jobPriorities.splice(fireIdx + 1, 0, 'fireStationRefill');
        } else {
          game.jobPriorities.unshift('fireStationRefill');
        }
      }

      if (!game.jobPriorities.includes('magier')) {
        const warriorIdx = game.jobPriorities.indexOf('warrior');
        if (warriorIdx !== -1) {
          game.jobPriorities.splice(warriorIdx + 1, 0, 'magier');
        } else {
          game.jobPriorities.push('magier');
        }
      }
    }

    // Initiale Prioritätsliste (Ressourcen-Transport)
    if (!game.resourceTransportPriorities) {
      game.resourceTransportPriorities = [
        'bread', 'fish', 'meat', 'grain', 'wood', 'stone', 'water', 'beer',
        'woodPlank', 'flour', 'arrows', 'feed', 'pig', 'dragonBone',
        'raiderHerb', 'antibiotics'
      ];
    }

    const jobDefinitions = {
      lumberjack: { icon: 'images/villager-holzfaeller-rot.webp' },
      forsthaus: { icon: 'images/foerster.webp' },
      quarry: { icon: 'images/villager-steinmetz-rot.webp' },
      fisher: { icon: 'images/villager-angler-rot.webp' },
      farm: { icon: 'images/villager-bauer-rot.webp' },
      sawmill: { icon: 'images/saeger.webp' },
      mill: { icon: 'images/mueller.webp' },
      bakery: { icon: 'images/baecker.webp' },
      brewery: { icon: 'images/brauer.webp' },
      feedMaker: { icon: 'images/fuetterer.webp' },
      pigFarm: { icon: 'images/schweinebauer.webp' },
      butcher: { icon: 'images/schlachter.webp' },
      well: { icon: 'images/villager-idle-rot.webp' },
      arrowSmith: { icon: 'images/pfeilbauer.webp' },
      arrowTower: { icon: 'images/bogenschuetze.webp' },
      apotheke: { icon: 'images/apotheker.webp' },
      arztpraxis: { icon: 'images/arzt.webp' },
      fireStation: { icon: 'images/feuerwehrmann.webp' },
      fireStationRefill: { icon: 'images/feuerwehrmann.webp' },
      warrior: { icon: 'images/villager-krieger-rot.webp' },
      magier: { icon: 'images/magier.webp' }
    };

    const resourceDefinitions = {
      wood: { icon: 'images/icon_baum.webp' },
      stone: { icon: 'images/icon_stein.webp' },
      grain: { icon: 'images/icon_getreide.webp' },
      fish: { icon: 'images/icon_fisch.webp' },
      water: { icon: 'images/icon_wasser.webp' },
      beer: { icon: 'images/icon_bier.webp' },
      woodPlank: { icon: 'images/icon_bretter.webp' },
      flour: { icon: 'images/icon_mehl.webp' },
      bread: { icon: 'images/icon_brot.webp' },
      arrows: { icon: 'images/icon_pfeil.webp' },
      feed: { icon: 'images/icon_futter.webp' },
      pig: { icon: 'images/icon_schwein.webp' },
      meat: { icon: 'images/icon_fleisch.webp' },
      dragonBone: { icon: 'images/drachenknochen.webp' },
      raiderHerb: { icon: 'images/icon_raeuberkraut.webp' },
      antibiotics: { icon: 'images/icon_antibiotika.webp' }
    };

    function countFreeVillagers() {
      let count = 0;

      for (const v of vm.villagers.values()) {
        if (
          v.job === 'free' &&
          v.state === 'idle' &&
          !v.reservedLogistics &&
          !v.reservedRole &&
          !v.isSick
        ) {
          count++;
        }
      }

      return count;
    }

    function countReservedLogistics() {
      let count = 0;

      for (const v of vm.villagers.values()) {
        if (v.reservedLogistics) count++;
      }

      return count;
    }

    function countReservedBuilders() {
      let count = 0;

      for (const v of vm.villagers.values()) {
        if (v.reservedRole === 'builder') count++;
      }

      return count;
    }

    function countReservedLogisticians() {
      let count = 0;

      for (const v of vm.villagers.values()) {
        if (v.reservedRole === 'logistics') count++;
      }

      return count;
    }

    function assignReservedVillagers() {
      let builders = countReservedBuilders();
      let logisticians = countReservedLogisticians();

      for (const v of vm.villagers.values()) {
        if (v.job !== 'free' || v.state !== 'idle') continue;
        if (v.reservedLogistics || v.reservedRole) continue;
        if (v.isSick || v.inSicknessTreatment) continue;

        if (builders < game.builderReserveCount) {
          v.reservedRole = 'builder';
          builders++;
          continue;
        }

        if (logisticians < game.logisticsReserveCount) {
          v.reservedRole = 'logistics';
          logisticians++;
        }
      }
    }

    function releaseReservedVillager(role) {
      for (const v of vm.villagers.values()) {
        if (v.reservedRole === role) {
          v.reservedRole = null;
          return;
        }
      }
    }

    function updateReservedDisplays() {
      if (reservedLogisticsCountEl) {
        reservedLogisticsCountEl.textContent =
          `${countReservedLogisticians()} / ${game.logisticsReserveCount}`;
      }

      if (builderReserveCountEl) {
        builderReserveCountEl.textContent =
          `${countReservedBuilders()} / ${game.builderReserveCount}`;
      }
    }

    function checkJobStatus(jobKey) {
      let total = 0;
      let occupied = 0;

      for (const b of world.buildings.values()) {
        if (!b.built || b.ruined || b.paused) continue;

        if (jobKey === 'warrior') {
          if (b.warriorSlots) {
            for (const id of b.warriorSlots) {
              total++;
              if (id !== null) occupied++;
            }
          }
        } else if (jobKey === 'fireStation') {
          if (b.def.id === 'fireStation') {
            total += 1;

            if (
              b.workerIds &&
              b.workerIds[0] !== null &&
              b.workerIds[0] !== undefined
            ) {
              occupied++;
            }
          }
        } else if (jobKey === 'fireStationRefill') {
          if (b.def.id === 'fireStation') {
            total += 1;

            if (
              b.workerIds &&
              b.workerIds[1] !== null &&
              b.workerIds[1] !== undefined
            ) {
              occupied++;
            }
          }
        } else if (jobKey === 'arztpraxis') {
          if (b.def.id === 'arztpraxis') {
            total += 1;
            if (b.workerId !== null) occupied++;
          }
        } else if (jobKey === 'arrowTower') {
          if (b.def.hasArcher) {
            total += 1;
            if (b.workerId !== null) occupied++;
          }
        } else if (jobKey === 'magier') {
          if (b.def.id === 'magierturm') {
            total += 1;
            if (b.workerId !== null) occupied++;
          }
        } else {
          if (b.def.id === jobKey) {
            const isFieldBuilding = b.def.produces && b.def.id !== 'fisher';

            if (!isFieldBuilding || b.fields.length > 0) {
              total += 1;
              if (b.workerId !== null) occupied++;
            }
          }
        }
      }

      return {
        total,
        occupied,
        hasFree: occupied < total
      };
    }

    function renderJobsList() {
      if (!jobsListContainer) return;

      assignReservedVillagers();
      updateReservedDisplays();

      const free = countFreeVillagers();

      if (jobsFreeVillagers) {
        jobsFreeVillagers.textContent = free;
      }

      let html = '';

      html += `<div class="stats-row" style="border-color:#ffcc00; margin-bottom:12px; text-align:center;">
        <div class="stats-name" style="font-size:14px; color:#ffcc00;">
          ${Game.Lang.t('eco_job_priorities')}
        </div>
        <div style="font-size:11px; color:#aaa; margin-top:4px;">
          ${Game.Lang.t('eco_priority_top')}
        </div>
      </div>`;

      for (let i = 0; i < game.jobPriorities.length; i++) {
        const jobKey = game.jobPriorities[i];
        const def = jobDefinitions[jobKey];

        if (!def) continue;

        const canMoveUp = i > 0;
        const canMoveDown = i < game.jobPriorities.length - 1;

        const status = checkJobStatus(jobKey);

        let statusIcon = '';

        if (status.total === 0) {
          statusIcon = '<span style="font-size:16px; color:#555;">–</span>';
        } else if (status.hasFree) {
          statusIcon = '<span style="font-size:24px;">❌</span>';
        } else {
          statusIcon = '<span style="font-size:24px;">✅</span>';
        }

        const countText = status.total > 0
          ? `<span style="font-size:10px; color:#aaa; display:block; margin-top:2px;">(${status.occupied}/${status.total})</span>`
          : '';

        const jobName = Game.Lang.t('job_' + jobKey);

        html += `
          <div class="stats-row" style="margin-bottom:6px; padding:8px; border-color:#333;">
            <div style="display:grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap:8px; align-items:center;">

              <button class="moveJobDownBtn" data-idx="${i}"
                style="width:100%; height:50px; font-size:24px; font-weight:bold;
                       background:${canMoveDown ? 'linear-gradient(180deg, #6e3b3b 0%, #4a2525 100%)' : '#222'};
                       color:${canMoveDown ? '#fff' : '#444'};
                       border:2px solid #1a1008; border-radius:8px;
                       ${canMoveDown ? 'cursor:pointer;' : 'cursor:not-allowed;'}"
                ${canMoveDown ? '' : 'disabled'}>
                ▼
              </button>

              <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center;">
                <img src="${def.icon}" style="width:32px;height:32px;object-fit:contain;margin-bottom:4px;">
                <div style="font-weight:600; font-size:11px; line-height:1.1;">${jobName}</div>
                ${countText}
              </div>

              <div style="display:flex; justify-content:center; align-items:center;">
                ${statusIcon}
              </div>

              <button class="moveJobUpBtn" data-idx="${i}"
                style="width:100%; height:50px; font-size:24px; font-weight:bold;
                       background:${canMoveUp ? 'linear-gradient(180deg, #3b6e3b 0%, #254a25 100%)' : '#222'};
                       color:${canMoveUp ? '#fff' : '#444'};
                       border:2px solid #1a1008; border-radius:8px;
                       ${canMoveUp ? 'cursor:pointer;' : 'cursor:not-allowed;'}"
                ${canMoveUp ? '' : 'disabled'}>
                ▲
              </button>

            </div>
          </div>
        `;
      }

      jobsListContainer.innerHTML = html;

      jobsListContainer.querySelectorAll('.moveJobUpBtn').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.idx, 10);

          if (idx > 0) {
            const temp = game.jobPriorities[idx - 1];
            game.jobPriorities[idx - 1] = game.jobPriorities[idx];
            game.jobPriorities[idx] = temp;

            renderJobsList();
          }
        });
      });

      jobsListContainer.querySelectorAll('.moveJobDownBtn').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.idx, 10);

          if (idx < game.jobPriorities.length - 1) {
            const temp = game.jobPriorities[idx + 1];
            game.jobPriorities[idx + 1] = game.jobPriorities[idx];
            game.jobPriorities[idx] = temp;

            renderJobsList();
          }
        });
      });
    }

    function renderResourcesList() {
      if (!resourcesListContainer) return;

      let html = '';

      html += `<div class="stats-row" style="border-color:#4A90E2; margin-bottom:12px; text-align:center;">
        <div class="stats-name" style="font-size:14px; color:#4A90E2;">
          ${Game.Lang.t('eco_transport_priorities')}
        </div>
        <div style="font-size:11px; color:#aaa; margin-top:4px;">
          ${Game.Lang.t('eco_transport_top')}
        </div>
      </div>`;

      for (let i = 0; i < game.resourceTransportPriorities.length; i++) {
        const resKey = game.resourceTransportPriorities[i];
        const def = resourceDefinitions[resKey];

        if (!def) continue;

        const canMoveUp = i > 0;
        const canMoveDown = i < game.resourceTransportPriorities.length - 1;

        const resName = Game.UI.resourceNames[resKey] || resKey;

        html += `
          <div class="stats-row" style="margin-bottom:6px; padding:8px; border-color:#333;">
            <div style="display:grid; grid-template-columns: 1fr 2fr 1fr; gap:8px; align-items:center;">

              <button class="moveResDownBtn" data-idx="${i}"
                style="width:100%; height:50px; font-size:24px; font-weight:bold;
                       background:${canMoveDown ? 'linear-gradient(180deg, #6e3b3b 0%, #4a2525 100%)' : '#222'};
                       color:${canMoveDown ? '#fff' : '#444'};
                       border:2px solid #1a1008; border-radius:8px;
                       ${canMoveDown ? 'cursor:pointer;' : 'cursor:not-allowed;'}"
                ${canMoveDown ? '' : 'disabled'}>
                ▼
              </button>

              <div style="display:flex; flex-direction:row; align-items:center; justify-content:flex-start; gap:12px; padding-left:12px;">
                <img src="${def.icon}" style="width:36px;height:36px;object-fit:contain;">
                <div style="font-weight:600; font-size:14px;">${resName}</div>
              </div>

              <button class="moveResUpBtn" data-idx="${i}"
                style="width:100%; height:50px; font-size:24px; font-weight:bold;
                       background:${canMoveUp ? 'linear-gradient(180deg, #3b6e3b 0%, #254a25 100%)' : '#222'};
                       color:${canMoveUp ? '#fff' : '#444'};
                       border:2px solid #1a1008; border-radius:8px;
                       ${canMoveUp ? 'cursor:pointer;' : 'cursor:not-allowed;'}"
                ${canMoveUp ? '' : 'disabled'}>
                ▲
              </button>

            </div>
          </div>
        `;
      }

      resourcesListContainer.innerHTML = html;

      resourcesListContainer.querySelectorAll('.moveResUpBtn').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.idx, 10);

          if (idx > 0) {
            const temp = game.resourceTransportPriorities[idx - 1];
            game.resourceTransportPriorities[idx - 1] = game.resourceTransportPriorities[idx];
            game.resourceTransportPriorities[idx] = temp;

            renderResourcesList();
          }
        });
      });

      resourcesListContainer.querySelectorAll('.moveResDownBtn').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.idx, 10);

          if (idx < game.resourceTransportPriorities.length - 1) {
            const temp = game.resourceTransportPriorities[idx + 1];
            game.resourceTransportPriorities[idx + 1] = game.resourceTransportPriorities[idx];
            game.resourceTransportPriorities[idx] = temp;

            renderResourcesList();
          }
        });
      });
    }

    function setTab(tabName) {
      if (jobsTabBtn) jobsTabBtn.classList.remove('active');
      if (resourcesTabBtn) resourcesTabBtn.classList.remove('active');

      if (jobsBody) jobsBody.classList.add('hidden');
      if (resourcesBody) resourcesBody.classList.add('hidden');

      if (tabName === 'jobs') {
        if (jobsTabBtn) jobsTabBtn.classList.add('active');
        if (jobsBody) jobsBody.classList.remove('hidden');

        renderJobsList();
      } else if (tabName === 'resources') {
        if (resourcesTabBtn) resourcesTabBtn.classList.add('active');
        if (resourcesBody) resourcesBody.classList.remove('hidden');

        renderResourcesList();
      }
    }

    function openEconomyWindow() {
      if (!economyWindow) return;

      game.paused = true;
      economyWindow.classList.remove('hidden');

      assignReservedVillagers();
      updateReservedDisplays();

      setTab('jobs');
    }

    function closeEconomyWindow() {
      if (!economyWindow) return;

      game.paused = false;
      economyWindow.classList.add('hidden');

      vm.assignFreeVillagers();
    }

    // Logistiker-Reservierung
    if (reservedLogisticsPlusBtn) {
      reservedLogisticsPlusBtn.addEventListener('click', () => {
        game.logisticsReserveCount++;
        assignReservedVillagers();
        updateReservedDisplays();
        renderJobsList();
      });
    }

    if (reservedLogisticsMinusBtn) {
      reservedLogisticsMinusBtn.addEventListener('click', () => {
        if (game.logisticsReserveCount > 0) {
          game.logisticsReserveCount--;
          releaseReservedVillager('logistics');
          updateReservedDisplays();
          renderJobsList();
        }
      });
    }

    // Builder-Reservierung
    if (builderReservePlus) {
      builderReservePlus.addEventListener('click', () => {
        game.builderReserveCount++;
        assignReservedVillagers();
        updateReservedDisplays();
        renderJobsList();
      });
    }

    if (builderReserveMinus) {
      builderReserveMinus.addEventListener('click', () => {
        if (game.builderReserveCount > 0) {
          game.builderReserveCount--;
          releaseReservedVillager('builder');
          updateReservedDisplays();
          renderJobsList();
        }
      });
    }

    if (economyButton) {
      economyButton.addEventListener('click', () => openEconomyWindow());
    }

    if (economyWindowClose) {
      economyWindowClose.addEventListener('click', () => closeEconomyWindow());
    }

    if (economyWindow) {
      economyWindow.addEventListener('click', (e) => {
        if (e.target === economyWindow) closeEconomyWindow();
      });
    }

    if (jobsTabBtn) {
      jobsTabBtn.addEventListener('click', () => setTab('jobs'));
    }

    if (resourcesTabBtn) {
      resourcesTabBtn.addEventListener('click', () => setTab('resources'));
    }

    game.assignReservedVillagers = assignReservedVillagers;

    return {
      open: openEconomyWindow,
      close: closeEconomyWindow,
      render: renderJobsList
    };
  }
};
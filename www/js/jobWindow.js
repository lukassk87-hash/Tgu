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

    // Initiale Prioritätsliste (Jobs)
    if (!game.jobPriorities) {
      game.jobPriorities = [
        'builder',
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
      lumberjack: { name: 'Holzfäller', icon: 'images/villager-holzfaeller-rot.webp' },
      forsthaus: { name: 'Förster', icon: 'images/foerster.webp' },
      quarry: { name: 'Steinmetz', icon: 'images/villager-steinmetz-rot.webp' },
      fisher: { name: 'Fischer', icon: 'images/villager-angler-rot.webp' },
      farm: { name: 'Bauer', icon: 'images/villager-bauer-rot.webp' },
      sawmill: { name: 'Sägewerker', icon: 'images/saeger.webp' },
      mill: { name: 'Müller', icon: 'images/mueller.webp' },
      bakery: { name: 'Bäcker', icon: 'images/baecker.webp' },
      brewery: { name: 'Brauer', icon: 'images/brauer.webp' },
      feedMaker: { name: 'Fütterer', icon: 'images/fuetterer.webp' },
      pigFarm: { name: 'Schweinebauer', icon: 'images/schweinebauer.webp' },
      butcher: { name: 'Schlachter', icon: 'images/schlachter.webp' },
      well: { name: 'Brunnenwärter', icon: 'images/villager-idle-rot.webp' },
      arrowSmith: { name: 'Pfeilschmied', icon: 'images/pfeilbauer.webp' },
      arrowTower: { name: 'Bogenschütze', icon: 'images/bogenschuetze.webp' },
      apotheke: { name: 'Apotheker', icon: 'images/apotheker.webp' },
      arztpraxis: { name: 'Arzt', icon: 'images/arzt.webp' },
      fireStation: { name: 'Feuerwehrmann (Löscher)', icon: 'images/feuerwehrmann.webp' },
      fireStationRefill: { name: 'Feuerwehrmann (Nachfüller)', icon: 'images/feuerwehrmann.webp' },
      warrior: { name: 'Krieger', icon: 'images/villager-krieger-rot.webp' },
      magier: { name: 'Magier', icon: 'images/magier.webp' },
      builder: { name: 'Baumeister', icon: 'images/villager-baumeister-rot.webp' }
    };

    const resourceDefinitions = {
      wood: { name: 'Holz', icon: 'images/icon_baum.webp' },
      stone: { name: 'Stein', icon: 'images/icon_stein.webp' },
      grain: { name: 'Weizen', icon: 'images/icon_getreide.webp' },
      fish: { name: 'Fisch', icon: 'images/icon_fisch.webp' },
      water: { name: 'Wasser', icon: 'images/icon_wasser.webp' },
      beer: { name: 'Bier', icon: 'images/icon_bier.webp' },
      woodPlank: { name: 'Bretter', icon: 'images/icon_bretter.webp' },
      flour: { name: 'Mehl', icon: 'images/icon_mehl.webp' },
      bread: { name: 'Brot', icon: 'images/icon_brot.webp' },
      arrows: { name: 'Pfeile', icon: 'images/icon_pfeil.webp' },
      feed: { name: 'Futter', icon: 'images/icon_futter.webp' },
      pig: { name: 'Schwein', icon: 'images/icon_schwein.webp' },
      meat: { name: 'Fleisch', icon: 'images/icon_fleisch.webp' },
      dragonBone: { name: 'Drachenknochen', icon: 'images/drachenknochen.webp' },
      raiderHerb: { name: 'Räuberkraut', icon: 'images/icon_raeuberkraut.webp' },
      antibiotics: { name: 'Antibiotika', icon: 'images/icon_antibiotika.webp' }
    };

    function countFreeVillagers() {
      let count = 0;
      for (const v of vm.villagers.values()) {
        if (v.job === 'free' && v.state === 'idle' && !v.reservedLogistics && !v.isSick) count++;
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

    function checkJobStatus(jobKey) {
      if (jobKey === 'builder') {
        const hasSites = world.buildSites.length > 0;
        return { total: 1, occupied: hasSites ? 0 : 1, hasFree: hasSites };
      }

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
            if (b.workerIds && b.workerIds[0] !== null && b.workerIds[0] !== undefined) {
              occupied++;
            }
          }
        } else if (jobKey === 'fireStationRefill') {
          if (b.def.id === 'fireStation') {
            total += 1;
            if (b.workerIds && b.workerIds[1] !== null && b.workerIds[1] !== undefined) {
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

      return { total, occupied, hasFree: occupied < total };
    }

    function updateReservedLogisticsDisplay() {
      if (reservedLogisticsCountEl) {
        reservedLogisticsCountEl.textContent = countReservedLogistics();
      }
    }

    function renderJobsList() {
      if (!jobsListContainer) return;

      const free = countFreeVillagers();
      if (jobsFreeVillagers) jobsFreeVillagers.textContent = free;
      updateReservedLogisticsDisplay();

      let html = '';

      html += `<div class="stats-row" style="border-color:#ffcc00; margin-bottom:12px; text-align:center;">
        <div class="stats-name" style="font-size:14px; color:#ffcc00;">JOB-PRIORITÄTEN</div>
        <div style="font-size:11px; color:#aaa; margin-top:4px;">Oben = Höchste Priorität</div>
      </div>`;

      for (let i = 0; i < game.jobPriorities.length; i++) {
        const jobKey = game.jobPriorities[i];
        const def = jobDefinitions[jobKey];
        if (!def) continue;

        let canMoveUp = i > 0;
        let canMoveDown = i < game.jobPriorities.length - 1;

        const status = checkJobStatus(jobKey);
        let statusIcon = '';

        if (status.total === 0) {
          statusIcon = '<span style="font-size:16px; color:#555;">–</span>';
        } else if (status.hasFree) {
          statusIcon = '<span style="font-size:24px;">❌</span>';
        } else {
          statusIcon = '<span style="font-size:24px;">✅</span>';
        }

        const countText = status.total > 0 ? `<span style="font-size:10px; color:#aaa; display:block; margin-top:2px;">(${status.occupied}/${status.total})</span>` : '';

        html += `
          <div class="stats-row" style="margin-bottom:6px; padding:8px; border-color:#333;">
            <div style="display:grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap:8px; align-items:center;">

              <button class="moveJobDownBtn" data-idx="${i}"
                style="width:100%; height:50px; font-size:24px; font-weight:bold;
                       background:${canMoveDown ? 'linear-gradient(180deg, #6e3b3b 0%, #4a2525 100%)' : '#222'};
                       color:${canMoveDown ? '#fff' : '#444'};
                       border:2px solid #1a1008; border-radius:8px;
                       ${canMoveDown ? 'cursor:pointer;' : 'cursor:not-allowed;'}"
                ${canMoveDown ? '' : 'disabled'}>▼</button>

              <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center;">
                <img src="${def.icon}" style="width:32px;height:32px;object-fit:contain;margin-bottom:4px;">
                <div style="font-weight:600; font-size:11px; line-height:1.1;">${def.name}</div>
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
                ${canMoveUp ? '' : 'disabled'}>▲</button>

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
        <div class="stats-name" style="font-size:14px; color:#4A90E2;">TRANSPORT-PRIORITÄTEN</div>
        <div style="font-size:11px; color:#aaa; margin-top:4px;">Oben = Wird zuerst abgeholt</div>
      </div>`;

      for (let i = 0; i < game.resourceTransportPriorities.length; i++) {
        const resKey = game.resourceTransportPriorities[i];
        const def = resourceDefinitions[resKey];
        if (!def) continue;

        let canMoveUp = i > 0;
        let canMoveDown = i < game.resourceTransportPriorities.length - 1;

        html += `
          <div class="stats-row" style="margin-bottom:6px; padding:8px; border-color:#333;">
            <div style="display:grid; grid-template-columns: 1fr 2fr 1fr; gap:8px; align-items:center;">

              <button class="moveResDownBtn" data-idx="${i}"
                style="width:100%; height:50px; font-size:24px; font-weight:bold;
                       background:${canMoveDown ? 'linear-gradient(180deg, #6e3b3b 0%, #4a2525 100%)' : '#222'};
                       color:${canMoveDown ? '#fff' : '#444'};
                       border:2px solid #1a1008; border-radius:8px;
                       ${canMoveDown ? 'cursor:pointer;' : 'cursor:not-allowed;'}"
                ${canMoveDown ? '' : 'disabled'}>▼</button>

              <div style="display:flex; flex-direction:row; align-items:center; justify-content:flex-start; gap:12px; padding-left:12px;">
                <img src="${def.icon}" style="width:36px;height:36px;object-fit:contain;">
                <div style="font-weight:600; font-size:14px;">${def.name}</div>
              </div>

              <button class="moveResUpBtn" data-idx="${i}"
                style="width:100%; height:50px; font-size:24px; font-weight:bold;
                       background:${canMoveUp ? 'linear-gradient(180deg, #3b6e3b 0%, #254a25 100%)' : '#222'};
                       color:${canMoveUp ? '#fff' : '#444'};
                       border:2px solid #1a1008; border-radius:8px;
                       ${canMoveUp ? 'cursor:pointer;' : 'cursor:not-allowed;'}"
                ${canMoveUp ? '' : 'disabled'}>▲</button>

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
      setTab('jobs');
    }

    function closeEconomyWindow() {
      if (!economyWindow) return;
      game.paused = false;
      economyWindow.classList.add('hidden');
      vm.assignFreeVillagers();
    }

    if (reservedLogisticsPlusBtn) {
      reservedLogisticsPlusBtn.addEventListener('click', () => {
        for (const v of vm.villagers.values()) {
          if (v.job === 'free' && v.state === 'idle' && !v.reservedLogistics) {
            v.reservedLogistics = true;
            break;
          }
        }
        renderJobsList();
      });
    }

    if (reservedLogisticsMinusBtn) {
      reservedLogisticsMinusBtn.addEventListener('click', () => {
        if (countReservedLogistics() > 0) {
          for (const v of vm.villagers.values()) {
            if (v.reservedLogistics) {
              v.reservedLogistics = false;
              break;
            }
          }
        }
        renderJobsList();
      });
    }

    if (economyButton) economyButton.addEventListener('click', () => openEconomyWindow());
    if (economyWindowClose) economyWindowClose.addEventListener('click', () => closeEconomyWindow());
    if (economyWindow) economyWindow.addEventListener('click', (e) => { if (e.target === economyWindow) closeEconomyWindow(); });

    if (jobsTabBtn) jobsTabBtn.addEventListener('click', () => setTab('jobs'));
    if (resourcesTabBtn) resourcesTabBtn.addEventListener('click', () => setTab('resources'));

    return { open: openEconomyWindow, close: closeEconomyWindow, render: renderJobsList };
  }
};
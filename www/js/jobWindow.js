window.Game = window.Game || {};

Game.JobWindow = {
  create(game, world, vm) {
    const jobsWindow = document.getElementById('jobsWindow');
    const jobsWindowClose = document.getElementById('jobsWindowClose');
    const jobsBody = document.getElementById('jobsBody');
    const jobsFreeVillagers = document.getElementById('freeVillagerCount');
    const jobsButton = document.getElementById('jobsButton');
    const reservedLogisticsCountEl = document.getElementById('reservedLogisticsCount');
    const reservedLogisticsPlusBtn = document.getElementById('reservedLogisticsPlus');
    const reservedLogisticsMinusBtn = document.getElementById('reservedLogisticsMinus');

    const jobDefinitions = [
      // Rohstoffe
      { key: 'lumberjack', name: 'Holzfäller',    icon: 'images/holzfaeller-rot.webp',   group: 'Rohstoffe' },
      { key: 'forsthaus',  name: 'Förster',       icon: 'images/foerster.webp',          group: 'Rohstoffe' },
      { key: 'quarry',     name: 'Steinmetz',     icon: 'images/steinmetz-rot.webp',     group: 'Rohstoffe' },
      { key: 'farm',       name: 'Bauer',         icon: 'images/bauer-rot.webp',         group: 'Rohstoffe' },
      { key: 'fisher',     name: 'Fischer',       icon: 'images/fischerhuette-rot.webp', group: 'Rohstoffe' },

      // Verarbeitung
      { key: 'sawmill',    name: 'Sägewerker',    icon: 'images/saegewerk-rot.webp',     group: 'Verarbeitung' },
      { key: 'mill',       name: 'Müller',        icon: 'images/muehle-rot1.webp',       group: 'Verarbeitung' },
      { key: 'brewery',    name: 'Brauer',        icon: 'images/bierbrauerei-rot.webp',  group: 'Verarbeitung' },
      { key: 'bakery',     name: 'Bäcker',        icon: 'images/baecker-rot.webp',       group: 'Verarbeitung' },
      { key: 'well',       name: 'Brunnenwärter', icon: 'images/brunnen-rot.webp',       group: 'Verarbeitung' },

      // Futterkette
      { key: 'feedMaker',  name: 'Fütterer',      icon: 'images/fuetterer.webp',         group: 'Futterkette' },
      { key: 'pigFarm',    name: 'Schweinebauer', icon: 'images/schweinebauer.webp',     group: 'Futterkette' },
      { key: 'butcher',    name: 'Schlachter',    icon: 'images/schlachter.webp',        group: 'Futterkette' },

      // Verteidigung
      { key: 'fireStation',name: 'Feuerwehrmann', icon: 'images/feuerwehrmann.webp',     group: 'Verteidigung' },
      { key: 'arrowSmith', name: 'Pfeilschmied',  icon: 'images/pfeilbauer.webp',        group: 'Verteidigung' },
      { key: 'arrowTower', name: 'Bogenschütze',  icon: 'images/bogenschuetze.webp',     group: 'Verteidigung' },
      { key: 'warrior',    name: 'Krieger',       icon: 'images/wachturm-rot.webp',      group: 'Verteidigung' }
    ];

    function countReservedLogistics() {
      let count = 0;
      for (const v of vm.villagers.values()) {
        if (v.reservedLogistics) count++;
      }
      return count;
    }

    function getFreeVillagers() {
      const result = [];
      for (const v of vm.villagers.values()) {
        if (v.job === 'free' && v.state === 'idle' && !v.reservedLogistics) {
          result.push(v);
        }
      }
      return result;
    }

    function countFreeVillagers() {
      return getFreeVillagers().length;
    }

    function buildingProvidesJob(b, jobKey) {
      if (!b.built) return false;
      if (b.ruined) return false;

      if (jobKey === 'warrior') {
        return !!(b.warriorSlots && b.warriorSlots.length > 0);
      }

      if (b.def.id !== jobKey) return false;

      if (b.def.id === 'fireStation') {
        return true;
      }

      const isFieldBuilding = b.def.produces && b.def.id !== 'fisher';
      if (isFieldBuilding && b.fields.length === 0) return false;

      return true;
    }

    function countJobOccupied(jobKey) {
      let count = 0;
      for (const b of world.buildings.values()) {
        if (jobKey === 'warrior') {
          if (b.built && b.warriorSlots) {
            for (const wid of b.warriorSlots) {
              if (wid !== null && vm.villagers.has(wid)) count++;
            }
          }
        } else if (jobKey === 'fireStation') {
          if (b.built && b.workerIds) {
            for (const wid of b.workerIds) {
              if (wid !== null && wid !== undefined && vm.villagers.has(wid)) count++;
            }
          }
        } else {
          if (buildingProvidesJob(b, jobKey) && b.workerId !== null && vm.villagers.has(b.workerId)) {
            count++;
          }
        }
      }
      return count;
    }

    function countJobTotal(jobKey) {
      let total = 0;
      for (const b of world.buildings.values()) {
        if (jobKey === 'warrior') {
          if (b.built && b.warriorSlots) total += b.warriorSlots.length;
        } else if (jobKey === 'fireStation') {
          if (buildingProvidesJob(b, jobKey)) total += (b.def.maxWorkers || 3);
        } else {
          if (buildingProvidesJob(b, jobKey)) total += 1;
        }
      }
      return total;
    }

    function updateReservedLogisticsDisplay() {
      if (reservedLogisticsCountEl) {
        reservedLogisticsCountEl.textContent = countReservedLogistics();
      }
    }

    function renderJobsWindow() {
      if (!jobsBody) return;

      const free = countFreeVillagers();
      if (jobsFreeVillagers) {
        jobsFreeVillagers.textContent = free;
      }
      updateReservedLogisticsDisplay();

      let html = '';
      let currentGroup = null;

      for (const job of jobDefinitions) {
        if (job.group !== currentGroup) {
          currentGroup = job.group;
          html += `<div class="job-group-title">${currentGroup}</div>`;
        }

        const occupied = countJobOccupied(job.key);
        const total = countJobTotal(job.key);
        const canHire = free > 0 && occupied < total;
        const canFire = occupied > 0;

        html += `
          <div class="stats-row" style="margin-bottom:8px;">
            <div class="stats-header-cell">
              <div class="stats-icon"><img src="${job.icon}" style="width:24px;height:24px;object-fit:contain;"></div>
              <div class="stats-name">${job.name}</div>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr 60px 60px; gap:8px; align-items:center; margin-top:8px;">
              <div class="stats-data-item">
                <div class="stats-label">Besetzt</div>
                <div class="stats-value">${occupied}</div>
              </div>
              <div class="stats-data-item">
                <div class="stats-label">Gesamt</div>
                <div class="stats-value">${total}</div>
              </div>
              <button class="jobMinusBtn" data-job="${job.key}"
                      style="background:#6e3b3b; color:#fff; border:none; border-radius:6px; padding:8px; font-size:20px; font-weight:700; cursor:pointer;"
                      ${canFire ? '' : 'disabled'}>−</button>
              <button class="jobPlusBtn" data-job="${job.key}"
                      style="background:#3b6e3b; color:#fff; border:none; border-radius:6px; padding:8px; font-size:20px; font-weight:700; cursor:pointer;"
                      ${canHire ? '' : 'disabled'}>+</button>
            </div>
          </div>
        `;
      }

      jobsBody.innerHTML = html;

      jobsBody.querySelectorAll('.jobMinusBtn').forEach(btn => {
        btn.addEventListener('click', () => {
          fireFromJob(btn.dataset.job);
          renderJobsWindow();
        });
      });

      jobsBody.querySelectorAll('.jobPlusBtn').forEach(btn => {
        btn.addEventListener('click', () => {
          assignToJob(btn.dataset.job);
          renderJobsWindow();
        });
      });
    }

    function fireFromJob(jobKey) {
      for (const b of world.buildings.values()) {
        if (!b.built) continue;

        if (jobKey === 'warrior') {
          if (b.warriorSlots) {
            for (let i = 0; i < b.warriorSlots.length; i++) {
              const wid = b.warriorSlots[i];
              if (wid !== null) {
                const v = vm.villagers.get(wid);
                if (v) {
                  if (v.state === 'zfighting' || v.state === 'vfighting' || v.state === 'dragon_attack' || v.state === 'attacking_raiders' || v.state === 'vfightback') {
                    return;
                  }

                  b.warriorSlots[i] = null;
                  v.job = 'free';
                  v.state = 'idle';
                  v.workplaceId = null;
                  v.warriorBuildingId = null;
                  v.warriorSlotIndex = -1;
                  v.task = null;
                  v.hidden = true;
                  
                  v.x = b.x;
                  v.y = b.y + (b.h || 1) - 1;
                  v.renderX = v.x;
                  v.renderY = v.y;
                  v.targetX = v.x;
                  v.targetY = v.y;
                  v.moveDuration = 0;
                  
                  vm._idleVillagers.add(v.id);
                }
                return;
              }
            }
          }
          continue;
        }

        if (jobKey === 'fireStation' && b.def.id === 'fireStation') {
          if (b.workerIds && b.workerIds.length > 0) {
            // Letzten Feuerwehrmann entlassen
            const wid = b.workerIds.pop();
            const v = vm.villagers.get(wid);
            if (v) {
              if (v.state === 'zfighting' || v.state === 'vfighting' || v.state === 'dragon_attack' || v.state === 'attacking_raiders' || v.state === 'vfightback') {
                b.workerIds.push(wid);
                return;
              }

              v.job = 'free';
              v.state = 'idle';
              v.workplaceId = null;
              v.task = null;
              v.hidden = true;
              
              v.x = b.x;
              v.y = b.y + (b.h || 1) - 1;
              v.renderX = v.x;
              v.renderY = v.y;
              v.targetX = v.x;
              v.targetY = v.y;
              v.moveDuration = 0;

              vm._idleVillagers.add(v.id);
            }
            
            // Feuerwehr wieder in freeJobs, wenn noch Platz ist
            const maxW = b.def.maxWorkers || 3;
            if (b.workerIds.length < maxW && !world.freeJobs.has(b)) {
              world.freeJobs.add(b);
            }
            return;
          }
          continue;
        }

        if (b.def.id === jobKey && b.workerId !== null) {
          const v = vm.villagers.get(b.workerId);
          if (v) {
            if (v.state === 'zfighting' || v.state === 'vfighting' || v.state === 'dragon_attack' || v.state === 'attacking_raiders' || v.state === 'vfightback') {
              return;
            }

            b.workerId = null;
            v.job = 'free';
            v.state = 'idle';
            v.workplaceId = null;
            v.task = null;
            v.hidden = true;
            
            v.x = b.x;
            v.y = b.y + (b.h || 1) - 1;
            v.renderX = v.x;
            v.renderY = v.y;
            v.targetX = v.x;
            v.targetY = v.y;
            v.moveDuration = 0;

            vm._idleVillagers.add(v.id);

            if (!world.freeJobs.has(b)) {
              const isJobBuilding =
                b.def.produces ||
                b.def.recipe ||
                b.def.generatesResource ||
                b.def.globalResource ||
                b.def.hasArrowTower ||
                b.def.id === 'lumberjack' ||
                b.def.id === 'quarry' ||
                b.def.id === 'fisher' ||
                b.def.id === 'forsthaus';

              const isFieldBuilding = b.def.produces && b.def.id !== 'fisher';
              if (isJobBuilding && (!isFieldBuilding || b.fields.length > 0)) {
                world.freeJobs.add(b);
              }
            }
          }
          return;
        }
      }
    }

    function assignToJob(jobKey) {
      const freeVillagers = getFreeVillagers();
      if (freeVillagers.length === 0) return;
      const v = freeVillagers[0];

      if (jobKey === 'warrior') {
        for (const b of world.buildings.values()) {
          if (!b.built) continue;
          if (b.ruined) continue;
          if (!b.warriorSlots) continue;
          for (let i = 0; i < b.warriorSlots.length; i++) {
            if (b.warriorSlots[i] === null) {
              b.warriorSlots[i] = v.id;
              v.warriorSlotIndex = i;
              v.job = 'warrior';
              v.state = 'working';
              v.workplaceId = b.id;
              v.warriorBuildingId = b.id;
              v.hidden = true;
              v.task = null;
              vm._idleVillagers.delete(v.id);

              v.x = b.x;
              v.y = b.y + (b.h || 1) - 1;
              v.renderX = v.x;
              v.renderY = v.y;
              v.targetX = v.x;
              v.targetY = v.y;
              v.moveDuration = 0;

              const home = world.buildings.get(v.homeId);
              if (home && home.residents) {
                const idx = home.residents.indexOf(v.id);
                if (idx !== -1) home.residents.splice(idx, 1);
              }
              return;
            }
          }
        }
        return;
      }

      if (jobKey === 'fireStation') {
        for (const b of world.buildings.values()) {
          if (b.def.id !== 'fireStation') continue;
          if (!b.built) continue;
          if (b.ruined) continue;
          if (!b.workerIds) b.workerIds = [];
          const maxW = b.def.maxWorkers || 3;
          if (b.workerIds.length >= maxW) continue;

          // Nutzt jetzt assignToFireStation (reserviert sofort den Platz)
          const assigned = vm.assignToFireStation(v, b);
          if (assigned) {
            if (b.workerIds.length >= maxW) {
              world.freeJobs.delete(b);
            }
            return;
          }
        }
        return;
      }

      for (const b of world.buildings.values()) {
        if (!buildingProvidesJob(b, jobKey)) continue;
        if (b.workerId !== null) continue;

        b.workerId = v.id;
        v.job = 'worker';
        v.state = 'working';
        v.workplaceId = b.id;
        v.task = null;
        v.hidden = true;
        
        v.x = b.x;
        v.y = b.y + (b.h || 1) - 1;
        v.renderX = v.x;
        v.renderY = v.y;
        v.targetX = v.x;
        v.targetY = v.y;
        v.moveDuration = 0;
        
        vm._idleVillagers.delete(v.id);
        world.freeJobs.delete(b);

        const home = world.buildings.get(v.homeId);
        if (home && home.residents) {
          const idx = home.residents.indexOf(v.id);
          if (idx !== -1) home.residents.splice(idx, 1);
        }
        return;
      }
    }

    if (reservedLogisticsPlusBtn) {
      reservedLogisticsPlusBtn.addEventListener('click', () => {
        for (const v of vm.villagers.values()) {
          if (v.job === 'free' && v.state === 'idle' && !v.reservedLogistics) {
            v.reservedLogistics = true;
            break;
          }
        }
        renderJobsWindow();
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
        renderJobsWindow();
      });
    }

    function openJobsWindow() {
      if (!jobsWindow) return;
      game.paused = true;
      jobsWindow.classList.remove('hidden');
      renderJobsWindow();
    }

    function closeJobsWindow() {
      if (!jobsWindow) return;
      game.paused = false;
      jobsWindow.classList.add('hidden');
    }

    if (jobsButton) {
      jobsButton.addEventListener('click', () => openJobsWindow());
    }
    if (jobsWindowClose) {
      jobsWindowClose.addEventListener('click', () => closeJobsWindow());
    }
    if (jobsWindow) {
      jobsWindow.addEventListener('click', (e) => {
        if (e.target === jobsWindow) closeJobsWindow();
      });
    }

    return {
      open: openJobsWindow,
      close: closeJobsWindow,
      render: renderJobsWindow
    };
  }
};
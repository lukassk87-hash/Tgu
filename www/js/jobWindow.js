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
      { key: 'lumberjack', name: 'Holzfäller', icon: 'images/holzfaeller-rot.webp' },
      { key: 'quarry', name: 'Steinmetz', icon: 'images/steinmetz-rot.webp' },
      { key: 'farm', name: 'Bauer', icon: 'images/bauer-rot.webp' },
      { key: 'fisher', name: 'Fischer', icon: 'images/fischerhuette-rot.webp' },
      { key: 'sawmill', name: 'Sägewerker', icon: 'images/saegewerk-rot.webp' },
      { key: 'mill', name: 'Müller', icon: 'images/muehle-rot1.webp' },
      { key: 'brewery', name: 'Brauer', icon: 'images/bierbrauerei-rot.webp' },
      { key: 'bakery', name: 'Bäcker', icon: 'images/baecker-rot.webp' },
      { key: 'well', name: 'Brunnenwärter', icon: 'images/brunnen-rot.webp' },
      { key: 'warrior', name: 'Krieger', icon: 'images/wachturm-rot.webp' }
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

    function countJobOccupied(jobKey) {
      let count = 0;
      for (const b of world.buildings.values()) {
        if (!b.built) continue;
        if (jobKey === 'warrior') {
          if (b.warriorSlots) {
            for (const wid of b.warriorSlots) {
              if (wid !== null) count++;
            }
          }
        } else {
          if (b.def.id === jobKey && b.workerId !== null) {
            count++;
          }
        }
      }
      return count;
    }

    function countJobTotal(jobKey) {
      let total = 0;
      for (const b of world.buildings.values()) {
        if (!b.built) continue;
        if (jobKey === 'warrior') {
          if (b.warriorSlots) total += b.warriorSlots.length;
        } else {
          if (b.def.id === jobKey) {
            if (b.def.produces) {
              if (b.fields.length > 0) total += 1;
            } else if (b.def.globalResource) {
              total += 1;
            } else {
              total += 1;
            }
          }
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

      for (const job of jobDefinitions) {
        const occupied = countJobOccupied(job.key);
        const total = countJobTotal(job.key);

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
              <button class="jobMinusBtn" data-job="${job.key}" style="background:#6e3b3b; color:#fff; border:none; border-radius:6px; padding:8px; font-size:20px; font-weight:700; cursor:pointer;" ${occupied === 0 ? 'disabled' : ''}>−</button>
              <button class="jobPlusBtn" data-job="${job.key}" style="background:#3b6e3b; color:#fff; border:none; border-radius:6px; padding:8px; font-size:20px; font-weight:700; cursor:pointer;" ${(free === 0 || occupied >= total) ? 'disabled' : ''}>+</button>
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
                  b.warriorSlots[i] = null;
                  v.job = 'free';
                  v.state = 'idle';
                  v.workplaceId = null;
                  v.warriorBuildingId = null;
                  v.warriorSlotIndex = -1;
                  v.task = null;
                  v.hidden = true;
                  vm._idleVillagers.add(v.id);
                }
                return;
              }
            }
          }
        } else {
          if (b.def.id === jobKey && b.workerId !== null) {
            const v = vm.villagers.get(b.workerId);
            if (v) {
              b.workerId = null;
              v.job = 'free';
              v.state = 'idle';
              v.workplaceId = null;
              v.task = null;
              v.hidden = true;
              vm._idleVillagers.add(v.id);
              if (!world.freeJobs.has(b)) {
                if (b.def.globalResource) {
                  world.freeJobs.add(b);
                } else if (!b.def.produces || b.fields.length > 0) {
                  world.freeJobs.add(b);
                }
              }
            }
            return;
          }
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
              vm._idleVillagers.delete(v.id);
              return;
            }
          }
        }
      } else {
        for (const b of world.buildings.values()) {
          if (!b.built) continue;
          if (b.def.id !== jobKey) continue;
          if (b.workerId !== null) continue;
          if (b.def.produces && b.fields.length === 0 && !b.def.globalResource) continue;

          b.workerId = v.id;
          v.job = 'worker';
          v.state = 'idle';
          v.workplaceId = b.id;
          v.task = 'go_to_work';
          v.hidden = false;
          v.x = b.x;
          v.y = b.y + (b.h || 1) - 1;
          v.renderX = v.x;
          v.renderY = v.y;
          vm._idleVillagers.delete(v.id);
          world.freeJobs.delete(b);
          vm.startMove(v, b.x, b.y + (b.h || 1) - 1);
          return;
        }
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
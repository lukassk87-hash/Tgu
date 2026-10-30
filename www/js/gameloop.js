window.Game = window.Game || {};

Game.GameLoop = function(world, ticker, vm, economy, renderer, uiCallbacks) {
  const { refreshInfoPanel, refreshInfoPanelThrottled } = uiCallbacks;

  ticker.onTick((tick) => {
    const allVillagers = vm.getAllVillagers();

    // === 1. Baustellen ===
    for (const b of world.buildSites) {
      if (b.builderId === null) continue;
      const builder = vm.villagers.get(b.builderId);
      if (builder && builder.state === 'building') {
        b.progress++;
        if (b.progress >= b.buildTime) {
          world.onBuildingComplete(b);
          builder.state = 'idle'; builder.task = null; builder.buildTargetId = null;
          b.builderId = null;
          const tiles = world.getBuildingTiles(b);
          renderer.markStaticDirty(tiles);
        }
      }
    }

    // === 2. Sanity-Check (alle 5 Ticks) ===
    if (tick % 5 === 0) {
      for (const b of world.buildings.values()) {
        if (b.warriorSlots) {
          for (let i = 0; i < b.warriorSlots.length; i++) {
            const id = b.warriorSlots[i];
            if (id !== null && !vm.villagers.has(id)) b.warriorSlots[i] = null;
          }
        }
        if (b.residents && b.residents.length > 0) {
          for (let i = b.residents.length - 1; i >= 0; i--) {
            if (!vm.villagers.has(b.residents[i])) b.residents.splice(i, 1);
          }
        }

        if (b.workerId !== null && !vm.villagers.has(b.workerId)) {
          b.workerId = null;
          if (b.built && (b.def.produces || b.def.recipe || b.def.generatesResource)) {
            const hasJob = !b.def.produces || b.fields.length > 0;
            if (hasJob && !world.freeJobs.has(b)) {
              world.freeJobs.add(b);
            }
          }
          if (b.fishPendingFetch) {
            b.fishPendingFetch = false;
            b.fishRetryTimer = -30;
          }
        }
        if (b.builderId !== null && !vm.villagers.has(b.builderId)) b.builderId = null;
        if (b.recipeFetchWorkerId !== null && !vm.villagers.has(b.recipeFetchWorkerId)) b.recipeFetchWorkerId = null;
        if (b.logisticsId !== null && !vm.villagers.has(b.logisticsId)) {
          b.logisticsId = null;
          b.isBeingCollected = false;
        }
      }
    }

    // === 3. Feldwachstum & Recipe-isActive ===
    for (const b of world.buildings.values()) {
      if (!b.built) continue;

      if (b.def.produces && b.workerId !== null && b.fields.length > 0) {
        const worker = vm.villagers.get(b.workerId);
        if (worker && worker.state === 'working' && worker.workplaceId === b.id) {
          const effFactor = b.fishSlots > 0 ? 1 : 0.25;
          b.fieldAccum = (b.fieldAccum || 0) + effFactor;

          while (b.fieldAccum >= 1) {
            b.fieldAccum -= 1;
            for (const field of b.fields) {
              if (field.state === 'growing') {
                field.timer++;
                if (field.timer >= 30) { field.state = 'ready'; field.timer = 0; }
              }
            }
          }

          if (!worker.task && b.fields.some(f => f.state === 'ready')) {
            vm.triggerHarvestRoute(worker, b);
          }
        }
      }

      if (b.def.recipe) {
        if (b.workerId !== null) {
          const worker = vm.villagers.get(b.workerId);
          if (worker) {
            let canProduce = true;
            for (const k in b.def.recipe.inputs) {
              if ((b.recipeStorage[k] || 0) < b.def.recipe.inputs[k]) { canProduce = false; break; }
            }
            const isFetching = b.recipeFetchWorkerId !== null;
            const storageHasSpace = b.storage < b.maxCapacity;
            b.isActive = (canProduce || isFetching) && storageHasSpace;
          } else { b.isActive = false; }
        } else { b.isActive = false; }
      }
    }

    // === 4. Fisch-Slots (alle 5 Ticks) ===
    if (tick % 5 === 0) {
      for (const b of world.fishConsumers) {
        if (!b.built) continue;
        if (b.workerId === null) continue;

        const worker = vm.villagers.get(b.workerId);
        if (!worker) continue;

        b.fishConsumeTimer -= 5;
        if (b.fishConsumeTimer <= 0) {
          b.fishConsumeTimer = 45;
          if (b.fishSlots > 0) b.fishSlots -= 1;
        }

        if (b.fishSlots === 0 && !b.fishPendingFetch) {
          if (b.fishRetryTimer < 0) {
            b.fishRetryTimer += 5;
          }

          if (b.fishRetryTimer >= 0) {
            if ((economy.res.fish || 0) > 0) {
              let best = null, bestDistSq = Infinity;
              for (const s of world.dropoffBuildings) {
                const bx = s.x, by = s.y + (s.h || 1) - 1;
                const dx = bx - worker.x, dy = by - worker.y;
                const distSq = dx*dx + dy*dy;
                if (distSq < bestDistSq) { bestDistSq = distSq; best = s; }
              }
              if (best) {
                worker.task = 'fetch_fish_storage';
                worker.state = 'moving';
                worker.workplaceId = b.id;
                b.fishPendingFetch = true;
                vm.startMove(worker, best.x, best.y + (best.h || 1) - 1);
              }
            } else {
              b.fishRetryTimer = -30;
            }
          }
        }
      }
    }

    // === 5. Logistik (alle 2 Ticks) ===
    const collectFullStorage = (b) => {
      if (!b.built) return;
      if (b.maxCapacity > 0 && b.storage >= b.maxCapacity && !b.isBeingCollected) {
        for (const v of allVillagers) {
          if (v.job === 'free' && v.state === 'idle' && !v.task && !v.carrying && !v.recipeCarrying) {
            b.isBeingCollected = true; b.logisticsId = v.id; v.task = 'go_to_pickup';
            v.workplaceId = b.id; v.isLogistics = true; v.hidden = false;
            v.renderX = v.x; v.renderY = v.y;
            vm.startMove(v, b.x, b.y + (b.h || 1) - 1);
            return;
          }
        }
      }
    };

    if (tick % 2 === 0) {
      for (const b of world.producingBuildings) collectFullStorage(b);
      for (const b of world.recipeBuildings) collectFullStorage(b);
      for (const b of world.generatingBuildings) collectFullStorage(b);
    }

    // === 6. Brunnen ===
    for (const b of world.generatingBuildings) {
      if (b.workerId === null) continue;
      const effFactor = b.fishSlots > 0 ? 1 : 0.25;
      b.generatesTimer = (b.generatesTimer || 0) + effFactor;
      if (b.generatesTimer >= b.def.generatesInterval) {
        b.generatesTimer = 0;
        b.storage = Math.min(b.maxCapacity, b.storage + b.def.generatesAmount);
      }
    }

    // === 7. Rezepte (alle 5 Ticks) ===
    if (tick % 5 === 0) {
      for (const b of world.recipeBuildings) {
        if (!b.built || b.workerId === null) continue;
        const worker = vm.villagers.get(b.workerId);
        if (!worker) continue;

        let needsFetch = false;
        for (const k in b.def.recipe.inputs) {
          if ((b.recipeStorage[k] || 0) < b.def.recipe.inputs[k]) { needsFetch = true; break; }
        }

        if (needsFetch && !b.recipeFetchWorkerId) {
          let anyAvailable = false;
          for (const k in b.def.recipe.inputs) {
            if ((economy.res[k] || 0) > 0) { anyAvailable = true; break; }
          }
          if (anyAvailable) {
            let best = null, bestDistSq = Infinity;
            for (const s of world.dropoffBuildings) {
              const bx = s.x, by = s.y + (s.h || 1) - 1;
              const dx = bx - worker.x, dy = by - worker.y;
              const distSq = dx*dx + dy*dy;
              if (distSq < bestDistSq) { bestDistSq = distSq; best = s; }
            }
            if (best) {
              worker.task = 'recipe_fetch_storage'; worker.state = 'moving';
              worker.workplaceId = b.id; b.recipeFetchWorkerId = worker.id;
              vm.startMove(worker, best.x, best.y + (best.h || 1) - 1);
            }
          }
        }

        if (!needsFetch && worker.state === 'working') {
          b.recipeTimer = (b.recipeTimer || 0) + 5;
          const interval = b.def.recipeInterval || 30;
          if (b.recipeTimer >= interval) {
            b.recipeTimer = 0;
            for (const k in b.def.recipe.inputs) b.recipeStorage[k] -= b.def.recipe.inputs[k];
            b.storage = (b.storage || 0) + b.def.recipe.amount;
            if (b.storage > b.maxCapacity) b.storage = b.maxCapacity;
          }
        }

        if (b.recipeFetchWorkerId) {
          const w = vm.villagers.get(b.recipeFetchWorkerId);
          if (!w || w.state !== 'moving') b.recipeFetchWorkerId = null;
        }
      }
    }

    // === 8. Bier & Brot (alle 2 Ticks) ===
    if (tick % 2 === 0) {
      for (const b of world.beerBuildings) {
        if (!b.built) continue;
        if (b.beerStorage >= b.maxBeer) continue;
        if (b.beerRefillCooldown > 0) { b.beerRefillCooldown--; continue; }
        if (economy.res.beer > 0) {
          const space = b.maxBeer - b.beerStorage;
          const take = Math.min(space, economy.res.beer);
          economy.res.beer -= take; b.beerStorage += take;
          if (economy.onChange) economy.onChange();
        }
        b.beerRefillCooldown = 2;
      }

      for (const b of world.breadBuildings) {
        if (!b.built) continue;
        if (b.breadStorage >= b.maxBread) continue;
        if (economy.res.bread > 0) {
          const space = b.maxBread - b.breadStorage;
          const take = Math.min(space, economy.res.bread);
          economy.res.bread -= take; b.breadStorage += take;
          if (economy.onChange) economy.onChange();
        }
      }
    }

    // === 9. Bier-Konsum (alle 5 Ticks) ===
    if (tick % 5 === 0) {
      for (const v of allVillagers) {
        if (v.job !== 'warrior') continue;
        if (v.state !== 'working') continue;
        if (!v.warriorBuildingId) continue;
        const wb = world.buildings.get(v.warriorBuildingId);
        if (!wb || !wb.built) continue;
        
        if (v.beerBuffTimer > 0) { 
          v.beerBuffTimer -= 5; 
          if (v.beerBuffTimer <= 0) v.beerBuff = false; 
        }
        
        v.beerDrinkTimer = (v.beerDrinkTimer || 0) + 5;
        if (v.beerDrinkTimer < 90) continue;
        v.beerDrinkTimer = 0;
        if (wb.beerStorage > 0) { wb.beerStorage -= 1; v.beerBuff = true; v.beerBuffTimer = 90; }
      }
    }

    // === 10. Einwohner-Produktion ===
    for (const b of world.houses) {
      if (!b.built) continue;

      if (b.residents && b.residents.length > 0) {
        for (let i = b.residents.length - 1; i >= 0; i--) {
          const rid = b.residents[i];
          const v = vm.villagers.get(rid);
          if (!v || v.job === 'warrior' || v.workplaceId !== null) {
            b.residents.splice(i, 1);
          }
        }
      }

      const maxRes = b.def.maxResidents || 5;
      
      let totalResidents = b.residents.length;
      if (b.warriorSlots) {
        for (const wid of b.warriorSlots) {
          if (wid !== null) totalResidents++;
        }
      }

      if (totalResidents >= maxRes) {
        b.spawnTimer = 0;
        continue;
      }

      const needsBread = b.def.id !== 'castle';
      if (needsBread && b.breadStorage <= 0) {
        b.spawnTimer = 0;
        continue;
      }

      b.spawnTimer = (b.spawnTimer || 0) + 1;
      if (b.spawnTimer < 30) continue;

      if (needsBread) b.breadStorage -= 1;
      b.spawnTimer = 0;

      // NEU: Spawn am unteren Rand des Gebäudes (b.y + b.h - 1)
      const spawnY = b.y + (b.h || 1) - 1;
      const v = vm.spawn(b.x, spawnY, 'free', b.id);

      if (b.maxWarriors > 0 && b.warriorSlots) {
        if (vm.assignWarriorSlot(b, v)) {
          v.job = 'warrior';
          v.workplaceId = b.id;
          v.warriorBuildingId = b.id;
          v.state = 'working';
          v.hidden = true;
        } else {
          b.residents.push(v.id);
        }
      } else {
        b.residents.push(v.id);
      }
    }

    refreshInfoPanelThrottled(tick);
  });
};
window.Game = window.Game || {};

Game.Interactions = function(game, world, renderer, vm, economy, uiCallbacks) {
  const {
    canvas, placeHint, buildConfirm, buildConfirmTitle, buildConfirmCost,
    buildConfirmYes, buildConfirmNo, infoPanel, infoIcon, infoTitle, infoContent, infoClose,
    showInfoPanel, hideInfoPanel
  } = uiCallbacks;

  let pendingPlacement = null;
  let pendingDemolishBuilding = null;
  let input = null;

  const demolishConfirm = document.getElementById('demolishConfirm');
  const demolishConfirmTitle = document.getElementById('demolishConfirmTitle');
  const demolishConfirmText = document.getElementById('demolishConfirmText');
  const demolishConfirmYes = document.getElementById('demolishConfirmYes');
  const demolishConfirmNo = document.getElementById('demolishConfirmNo');
  const demolishButton = document.getElementById('demolishButton');

  function clearPendingPlacement() {
    pendingPlacement = null;
    renderer.pendingPlacement = null;
  }

  function clearHoverPreview() {
    renderer.hoverDef = null;
    renderer.hoverX = -1;
    renderer.hoverY = -1;
  }

  function getBuildingTiles(def, anchorX, anchorY) {
    const topLeft = Game.Buildings.getTopLeft(def, anchorX, anchorY);
    const w = def.width || 1;
    const h = def.height || 1;
    const tiles = [];
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        tiles.push({ x: topLeft.x + dx, y: topLeft.y + dy });
      }
    }
    return tiles;
  }

  function isOnPreview(tileX, tileY) {
    if (!pendingPlacement) return false;
    const def = Game.BUILDING_TYPES[pendingPlacement.typeId];
    const tiles = getBuildingTiles(def, pendingPlacement.x, pendingPlacement.y);
    for (const t of tiles) {
      if (t.x === tileX && t.y === tileY) return true;
    }
    return false;
  }

  function showToast(message, color) {
    let el = document.getElementById('castleToast');
    if (el) el.remove();

    el = document.createElement('div');
    el.id = 'castleToast';
    el.style.cssText = `
      position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
      background: rgba(30, 31, 34, 0.95); color: ${color}; 
      padding: 12px 20px; border-radius: 10px; border: 1px solid ${color};
      z-index: 9999; font-family: system-ui, sans-serif; font-size: 14px; 
      font-weight: 600; pointer-events: none; box-shadow: 0 4px 16px rgba(0,0,0,0.6);
      display: flex; align-items: center; gap: 8px; text-align: center;
      max-width: 90vw;
    `;
    
    el.innerHTML = `<img src="images/icon_stein.webp" style="width:20px;height:20px;object-fit:contain;flex-shrink:0;"> <span>${message}</span>`;
    document.body.appendChild(el);

    setTimeout(() => { if (el.parentNode) el.remove(); }, 3500);
  }

  function placeCastle(x, y) {
    const castleDef = Game.BUILDING_TYPES.castle;
    const b = world.addBuilding(castleDef, x, y);
    if (!b) return;
    const idx = world.buildSites.indexOf(b);
    if (idx !== -1) world.buildSites.splice(idx, 1);
    b.built = true;
    b.progress = b.buildTime;
    b.residents = [];
    b.storage = 0;
    b.spawnTimer = 0;

    for (let i = 0; i < 8; i++) {
      const v = vm.spawn(b.x, b.y + (b.h || 1) - 1, 'free', b.id);
      b.residents.push(v.id);
      if (i < 5) {
        if (vm.assignWarriorSlot(b, v)) {
          v.job = 'warrior';
          v.workplaceId = b.id;
          v.warriorBuildingId = b.id;
          v.state = 'working';
          v.hidden = true;
        }
      }
    }

    if (b.maxWarriors > 0) world.warriorBuildings.push(b);
    if (b.def.isStorage || b.def.id === 'castle') world.dropoffBuildings.push(b);
    if (b.def.isHouse) world.houses.push(b);
    if (b.def.beerSlots && b.def.beerSlots > 0) world.beerBuildings.push(b);

    const tiles = getBuildingTiles(castleDef, x, y);
    renderer.markStaticDirty(tiles);
    game.state = 'playing';
    placeHint.classList.add('hidden');
    canvas.classList.remove('placing');

    document.getElementById('buildButton').classList.remove('hidden');
    const bottomBar = document.getElementById('bottomBar');
    if (bottomBar) bottomBar.classList.remove('hidden');

    // ==========================================================
    // TIMER RESET - erst ab Schlossbau aktiv
    // ==========================================================
    const now = performance.now();

    // 1. Zombie-Timer zuruecksetzen
    if (game.zombieManager) {
      game.zombieManager._firstTickInitialized = false;
      game.zombieManager.firstSpawnDone = false;
      game.zombieManager.start(now);
    }

    // 2. Raeuber-Timer zuruecksetzen (3 Minuten bis zum ersten Spawn)
    if (game.raidersEnabled) {
      game.raiderFirstSpawnAt = now + 180000;
    }

    // 3. Drachen-Timer zuruecksetzen (18 Minuten bis zum ersten Spawn)
    if (game.dragonManager) {
      game.dragonManager.startedAt = now;
      game.dragonManager.nextSpawnAt = now + game.dragonManager.firstSpawnDelayMs;
      console.log(`Drachen-Timer gestartet: Naechster Drache in ca. ${Math.round(game.dragonManager.firstSpawnDelayMs / 60000)} Minuten.`);
    }

    // 4. Plagen-Timer starten (frühestens nach 30 Minuten)
    if (game.plagueManager) {
      game.plagueManager.start(now);
      console.log(`Plagen-Timer gestartet: Erste Plage in ca. ${Math.round(game.plagueManager.FIRST_MIN_MS / 60000)} Minuten.`);
    }

    // 5. Feuer-Timer starten (Welpenschutz greift ab jetzt)
    if (game.fireManager) {
      game.fireManager.start(now);
    }

    // 6. Krankheits-Timer starten (frühestens nach 15 Minuten)
    if (game.sicknessManager) {
      game.sicknessManager.start(now);
      console.log(`Krankheits-Timer gestartet: Erster Ausbruch in ca. ${Math.round(game.sicknessManager.FIRST_SICKNESS_DELAY_MS / 60000)} Minuten.`);
    }

    // 7. Erdbeben-Timer starten (Ueberraschung! Fruehestens nach 60 Minuten)
    if (game.earthquakeManager) {
      game.earthquakeManager.start(now);
    }

    // ==========================================================
    // WARNUNGEN ANZEIGEN
    // ==========================================================
    const noThreats = (!game.raidersEnabled && !game.dragonEnabled && game.zombieDifficulty === 'none');
    
    if (noThreats) {
      const peaceWarning = document.getElementById('peaceWarning');
      if (peaceWarning) {
        game.paused = true;
        peaceWarning.classList.remove('hidden');
      }
    } else {
      const startWarning = document.getElementById('startWarning');
      if (startWarning) {
        const raiderLi = document.getElementById('startWarningRaider');
        if (raiderLi) raiderLi.style.display = game.raidersEnabled ? 'flex' : 'none';

        const dragonLi = document.getElementById('startWarningDragon');
        if (dragonLi) dragonLi.style.display = game.dragonEnabled ? 'flex' : 'none';
        
        const dragonTimeBox = document.getElementById('startWarningDragonTime');
        if (dragonTimeBox) dragonTimeBox.style.display = game.dragonEnabled ? 'block' : 'none';

        const zombieLi = document.getElementById('startWarningZombie');
        if (zombieLi) zombieLi.style.display = (game.zombieDifficulty !== 'none') ? 'flex' : 'none';

        game.paused = true;
        startWarning.classList.remove('hidden');
      }
    }
  }

  function openBuildConfirm(typeId, x, y) {
    const def = Game.BUILDING_TYPES[typeId];

    if (game.tutorialActive && typeId !== 'castle') {
      const allowed = ['lumberjack', 'quarry', 'sawmill'];
      if (!allowed.includes(typeId)) {
        return; 
      }
      let builtCount = 0;
      for (const b of world.buildings.values()) {
        if (b.def.id === typeId) builtCount++;
      }
      if (builtCount >= 1) {
        return;
      }
    }

    if (typeId === 'castle') {
      const topLeft = Game.Buildings.getTopLeft(def, x, y);
      const radius = 10;
      const cx = topLeft.x + Math.floor((def.width || 1) / 2);
      const cy = topLeft.y + Math.floor((def.height || 1) / 2);
      
      let hasStone = false;
      for (const stone of world.stones.values()) {
        if (Math.abs(stone.cx - cx) <= radius && Math.abs(stone.cy - cy) <= radius) {
          hasStone = true;
          break;
        }
      }
      
      if (!hasStone) {
        showToast('Dein Schloss braucht ein Steinvorkommen in unmittelbarer Naehe, um die Versorgung mit Baumaterial zu sichern. Suche einen anderen Platz!', '#ff6b6b');
        return;
      }
    }

    pendingPlacement = { typeId, x, y };
    renderer.pendingPlacement = {
      def, x, y,
      valid: Game.Buildings.canPlace(world, typeId, x, y).ok
    };

    if (typeId === 'castle') {
      buildConfirmTitle.textContent = 'Schloss bauen?';
      buildConfirmCost.textContent = 'Der Startpunkt deiner Siedlung.';
    } else {
      buildConfirmTitle.textContent = `${def.name} bauen?`;
      const costParts = [];
      if (def.cost) {
        for (const res in def.cost) {
          costParts.push(`${def.cost[res]} ${Game.UI.resourceNames[res] || res}`);
        }
      }
      buildConfirmCost.textContent = costParts.length > 0 ? `Kosten: ${costParts.join(', ')}` : 'Keine Kosten';
    }

    buildConfirm.classList.remove('hidden');
  }

  function initInput() {
    input = new Game.Input(canvas, renderer.camera, () => renderer.tileSize);
    input.onClamp = () => renderer.clampCamera();

    input.onLongPress = (x, y) => {
      if (!pendingPlacement) return false;
      return isOnPreview(x, y);
    };

    input.onDragMove = (x, y) => {
      if (!pendingPlacement) return;
      const typeId = pendingPlacement.typeId;
      const check = Game.Buildings.canPlace(world, typeId, x, y);
      pendingPlacement.x = x;
      pendingPlacement.y = y;
      renderer.pendingPlacement = {
        def: Game.BUILDING_TYPES[typeId],
        x, y,
        valid: check.ok
      };
    };

    window.addEventListener('touchmove', (e) => {
      if (input.mode === 'drag-preview') return;
      if (game.state !== 'playing' && game.state !== 'placingCastle') return;

      let activeType = null;
      if (game.state === 'placingCastle') activeType = 'castle';
      else if (game.hud && game.hud.activeBuild) activeType = game.hud.activeBuild;
      if (!activeType) return;
      if (pendingPlacement) return;

      const t = e.touches[0];
      const tile = input._screenToTile(t.clientX, t.clientY);
      if (tile && world.inBounds(tile.x, tile.y)) {
        renderer.hoverX = tile.x;
        renderer.hoverY = tile.y;
        renderer.hoverDef = Game.BUILDING_TYPES[activeType];
        renderer.hoverValid = Game.Buildings.canPlace(world, activeType, tile.x, tile.y).ok;
      }
    });

    buildConfirmYes.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!pendingPlacement) return;
      const { typeId, x, y } = pendingPlacement;
      clearPendingPlacement();
      clearHoverPreview();
      buildConfirm.classList.add('hidden');
      const def = Game.BUILDING_TYPES[typeId];

      if (typeId === 'castle') {
        placeCastle(x, y);
        return;
      }

      if (!economy.canAfford(def.cost)) {
        game.hud.setActiveBuild(null);
        return;
      }
      if (Game.Buildings.startBuild(world, typeId, x, y, economy)) {
        const tiles = getBuildingTiles(def, x, y);
        renderer.markStaticDirty(tiles);
      }
      game.hud.setActiveBuild(null);
    });

    buildConfirmNo.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      clearPendingPlacement();
      clearHoverPreview();
      buildConfirm.classList.add('hidden');
      if (game.state === 'placingCastle') return;
      game.hud.setActiveBuild(null);
    });

    if (demolishButton) {
      demolishButton.addEventListener('click', () => {
        const isActive = demolishButton.classList.contains('active');
        if (isActive) {
          demolishButton.classList.remove('active');
          canvas.classList.remove('demolishing');
        } else {
          demolishButton.classList.add('active');
          canvas.classList.add('demolishing');
          
          if (game.hud) game.hud.setActiveBuild(null);
          clearPendingPlacement();
          clearHoverPreview();
          hideInfoPanel();
        }
      });
    }

    if (demolishConfirmYes) {
      demolishConfirmYes.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (pendingDemolishBuilding) {
          for (const v of vm.villagers.values()) {
            if (v.workplaceId === pendingDemolishBuilding.id) {
              v.workplaceId = null;
              v.job = 'free';
              v.state = 'idle';
              v.task = null;
              v.hidden = true;
              if (v.warriorBuildingId === pendingDemolishBuilding.id) {
                v.warriorBuildingId = null;
              }
            }
            if (v.homeId === pendingDemolishBuilding.id) {
              v.homeId = world.castleId;
            }
          }
          world.removeBuilding(pendingDemolishBuilding);
          renderer.markStaticDirty();
          if (renderer.selectedBuildingId === pendingDemolishBuilding.id) hideInfoPanel();
        }
        pendingDemolishBuilding = null;
        demolishConfirm.classList.add('hidden');
        if (demolishButton) demolishButton.classList.remove('active');
        canvas.classList.remove('demolishing');
        clearHoverPreview();
      });
    }

    if (demolishConfirmNo) {
      demolishConfirmNo.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        pendingDemolishBuilding = null;
        demolishConfirm.classList.add('hidden');
        if (demolishButton) demolishButton.classList.remove('active');
        canvas.classList.remove('demolishing');
        clearHoverPreview();
      });
    }

    input.onClickTile = (x, y) => {
      if (game.state === 'placingCastle') {
        const check = Game.Buildings.canPlace(world, 'castle', x, y);

        if (pendingPlacement && pendingPlacement.typeId === 'castle' && isOnPreview(x, y)) {
          if (!check.ok) {
            clearPendingPlacement();
            return;
          }
          openBuildConfirm('castle', pendingPlacement.x, pendingPlacement.y);
          return;
        }

        if (!check.ok) {
          clearPendingPlacement();
          renderer.hoverDef = Game.BUILDING_TYPES.castle;
          renderer.hoverX = x;
          renderer.hoverY = y;
          renderer.hoverValid = false;
          return;
        }

        pendingPlacement = { typeId: 'castle', x, y };
        renderer.pendingPlacement = { def: Game.BUILDING_TYPES.castle, x, y, valid: true };
        clearHoverPreview();
        return;
      }

      if (game.state !== 'playing') return;

      if (game.raiderVillage) {
        for (const rb of game.raiderVillage.buildings) {
          if (x >= rb.x && x < rb.x + (rb.w || 1) && y >= rb.y && y < rb.y + (rb.h || 1)) {
            showInfoPanel(rb);
            return;
          }
        }
      }

      if (demolishButton && demolishButton.classList.contains('active')) {
        let clickedBuilding = null;
        for (const b of world.buildings.values()) {
          if (x >= b.x && x < b.x + (b.w || 1) && y >= b.y && y < b.y + (b.h || 1)) {
            clickedBuilding = b;
            break;
          }
        }
        if (clickedBuilding) {
          if (clickedBuilding.def.id === 'castle') {
            showToast('Das Schloss kann nicht abgerissen werden!', '#ff6b6b');
            return;
          }
          
          const fireMgr = Game.state.fireManager;
          if (fireMgr && fireMgr.isBuildingBurning(clickedBuilding)) {
            showToast('Brennende Gebäude können nicht abgerissen werden!', '#ff6b6b');
            return;
          }

          pendingDemolishBuilding = clickedBuilding;
          demolishConfirmTitle.textContent = `${clickedBuilding.def.name} abreißen?`;
          demolishConfirmText.textContent = "Die Ressourcen werden nicht erstattet.";
          demolishConfirm.classList.remove('hidden');
        }
        return;
      }

      if (game.hud && game.hud.activeBuild) {
        const typeId = game.hud.activeBuild;
        const def = Game.BUILDING_TYPES[typeId];

        if (pendingPlacement && pendingPlacement.typeId === typeId && isOnPreview(x, y)) {
          const check = Game.Buildings.canPlace(world, typeId, pendingPlacement.x, pendingPlacement.y);
          if (!check.ok) {
            clearPendingPlacement();
            game.hud.setActiveBuild(null);
            clearHoverPreview();
            return;
          }
          openBuildConfirm(typeId, pendingPlacement.x, pendingPlacement.y);
          return;
        }

        const check = Game.Buildings.canPlace(world, typeId, x, y);
        if (!check.ok) {
          clearPendingPlacement();
          renderer.hoverDef = Game.BUILDING_TYPES[typeId];
          renderer.hoverX = x;
          renderer.hoverY = y;
          renderer.hoverValid = false;
          return;
        }

        pendingPlacement = { typeId, x, y };
        renderer.pendingPlacement = { def, x, y, valid: true };
        clearHoverPreview();
        return;
      }

      let clickedBuilding = null;
      for (const b of world.buildings.values()) {
        if (x >= b.x && x < b.x + (b.w || 1) && y >= b.y && y < b.y + (b.h || 1)) {
          clickedBuilding = b;
          break;
        }
      }
      if (clickedBuilding) showInfoPanel(clickedBuilding);
      else hideInfoPanel();
    };

    return input;
  }

  return {
    initInput,
    getInput: () => input,
    clearPendingPlacement
  };
};
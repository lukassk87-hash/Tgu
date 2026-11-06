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
    
    // ⚠️ FIX: Der sofortige Aufruf von game._trySpawnRaiders() wurde hier entfernt!
    // Das Spawnen wird jetzt von der main.js (Game-Loop) nach 3 Minuten getriggert.
  }

  function openBuildConfirm(typeId, x, y) {
    const def = Game.BUILDING_TYPES[typeId];

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
      buildConfirm.classList.add('hidden');
      const def = Game.BUILDING_TYPES[typeId];

      if (typeId === 'castle') {
        placeCastle(x, y);
        return;
      }

      if (!economy.canAfford(def.cost)) {
        game.hud.setActiveBuild(null);
        renderer.hoverDef = null;
        return;
      }
      if (Game.Buildings.startBuild(world, typeId, x, y, economy)) {
        const tiles = getBuildingTiles(def, x, y);
        renderer.markStaticDirty(tiles);
      }
      game.hud.setActiveBuild(null);
      renderer.hoverDef = null;
    });

    buildConfirmNo.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      clearPendingPlacement();
      buildConfirm.classList.add('hidden');
      if (game.state === 'placingCastle') return;
      game.hud.setActiveBuild(null);
      renderer.hoverDef = null;
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
        renderer.hoverDef = null;
        renderer.hoverX = -1;
        renderer.hoverY = -1;
        return;
      }

      if (game.state !== 'playing') return;

      // === Räuber-Gebäude zuerst prüfen ===
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
            alert("Das Schloss kann nicht abgerissen werden!");
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
            renderer.hoverDef = null;
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
        renderer.hoverDef = null;
        renderer.hoverX = -1;
        renderer.hoverY = -1;
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
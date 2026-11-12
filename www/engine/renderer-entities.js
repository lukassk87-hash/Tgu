window.Game = window.Game || {};

Object.assign(Game.Renderer.prototype, {

  _getDustSpriteSheets() {
    if (this._dustSpriteSheets) return this._dustSpriteSheets;

    this._dustSpriteSheets = [];
    const frameCount = 140; // 7 Sekunden bei 20 FPS
    const frameSize = 64;

    for (let sheetIndex = 0; sheetIndex < 5; sheetIndex++) {
      const canvas = document.createElement('canvas');
      canvas.width = frameSize * frameCount;
      canvas.height = frameSize;
      const ctx = canvas.getContext('2d');

      const particles = [];
      const particleCount = 15 + Math.random() * 10;
      
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          angle: Math.random() * Math.PI * 2,
          speed: 0.05 + Math.random() * 0.1,
          radiusStart: Math.random() * 4,
          radiusEnd: 12 + Math.random() * 18,
          lifespan: 0.5 + Math.random() * 0.5,
          size: 4 + Math.random() * 6,
          yOffset: (Math.random() - 0.5) * 6
        });
      }

      for (let f = 0; f < frameCount; f++) {
        const ox = f * frameSize;
        const t = f / (frameCount - 1);
        
        for (const p of particles) {
          const loopT = (t + (Math.random() * 0.1)) % 1; 
          
          if (loopT > p.lifespan) continue;

          const pt = loopT / p.lifespan;
          const currentRadius = p.radiusStart + (p.radiusEnd - p.radiusStart) * pt;
          const currentAngle = p.angle + p.speed * loopT * 20;

          const px = ox + frameSize / 2 + Math.cos(currentAngle) * currentRadius;
          const py = frameSize - 8 + Math.sin(currentAngle) * 2 + p.yOffset;

          const alpha = 0.6; 
          ctx.fillStyle = `rgba(180, 160, 140, ${alpha})`;
          
          const currentSize = p.size * (1 - pt * 0.5);
          ctx.fillRect(Math.floor(px), Math.floor(py), currentSize, currentSize);
        }
      }
      this._dustSpriteSheets.push(canvas);
    }

    this._dustFrameSize = frameSize;
    this._dustFrameCount = frameCount;
    return this._dustSpriteSheets;
  },

  _updateWaterDepth(v, dt) {
    const w = this.world, ts = this.tileSize;
    const vSize = ts * 0.9;
    const offset = (ts - vSize) / 2;
    const feetTopY = v.renderY * ts + offset + vSize * 0.75;
    const feetTopWorldY = feetTopY / ts;
    const feetTileY = Math.floor(feetTopWorldY);
    const feetTileX = Math.floor(v.renderX);
    const feetTerrain = w.getTerrainId(feetTileX, feetTileY);
    const isInWater = feetTerrain === 'water';

    const isDiving = (v.state === 'fishing_dive');

    let targetDepth;
    if (!isInWater) {
      targetDepth = 0;
    } else if (isDiving) {
      targetDepth = 2.0;
    } else {
      targetDepth = 1.0;
    }

    const prevDepth = v.waterDepth || 0;
    let newDepth = prevDepth;

    if (isInWater) {
      const speed = isDiving ? 0.8 * (dt / 1000) : 3.0 * (dt / 1000);
      if (prevDepth < targetDepth) newDepth = Math.min(targetDepth, prevDepth + speed);
      else if (prevDepth > targetDepth) newDepth = Math.max(targetDepth, prevDepth - speed);
    } else {
      const speed = 3.0 * (dt / 1000);
      newDepth = Math.max(0, prevDepth - speed);
    }

    v.waterDepth = newDepth;
    return newDepth;
  },

  _renderGravestones(ctx, ts) {
    if (!this.gravestones || this.gravestones.length === 0) return;
    for (const g of this.gravestones) {
      if (!this._isVisible(g.x, g.y)) continue;
      const px = g.x * ts;
      const py = g.y * ts;
      const vSize = ts * 0.9;
      const offset = (ts - vSize) / 2;
      Game.Assets.drawTile(ctx, 'images/ghost.webp', '👻', px + offset, py + offset, vSize, vSize);
    }
  },

  _renderAnimatedBuildings(ctx, ts, now) {
    const farZoom = this.isFarZoom();

    const animatedBuildings = this.world.animatedBuildings;
    if (!animatedBuildings || animatedBuildings.length === 0) return;

    let visibleAnimatedCount = 0;
    if (!farZoom) {
      for (let i = 0; i < animatedBuildings.length; i++) {
        const b = animatedBuildings[i];
        if (!b.built) continue;
        if (b.ruined) continue;
        if (!this._isVisible(b.x, b.y)) continue;
        visibleAnimatedCount++;
      }
    }

    const animate = !farZoom && visibleAnimatedCount <= 25;

    for (let i = 0; i < animatedBuildings.length; i++) {
      const b = animatedBuildings[i];
      if (!b.built) continue;
      if (b.ruined) continue;
      if (!this._isVisible(b.x, b.y)) continue;

      const px = b.x * ts;
      const py = b.y * ts;
      const bww = (b.w || 1) * ts;
      const bhh = (b.h || 1) * ts;

      let assetPath;
      if (animate && b.isActive) {
        const interval = b.def.animationInterval || 350;
        const frameIndex = Math.floor(now / interval) % b.def.animationFrames.length;
        assetPath = b.def.animationFrames[frameIndex];
      } else {
        assetPath = b.def.asset;
      }

      Game.Assets.drawTile(ctx, assetPath, b.def.emoji, px, py, bww, bhh);
    }
  },

  _renderFireAnimations(ctx, ts, now) {
    const fireMgr = Game.state && Game.state.fireManager;
    if (!fireMgr || !fireMgr.activeFires || fireMgr.activeFires.length === 0) return;

    const flameFrames = [
      'images/flamme.webp',
      'images/flamme1.webp',
      'images/flamme2.webp',
      'images/flamme3.webp'
    ];
    const frameInterval = 150;
    const frameIndex = Math.floor(now / frameInterval) % flameFrames.length;
    const flamePath = flameFrames[frameIndex];

    const pulse = 0.85 + Math.sin(now * 0.008) * 0.15;

    for (const fire of fireMgr.activeFires) {
      if (fire.extinguishedAt) continue;

      const b = fire.building;
      if (!b) continue;
      if (!this._isVisible(b.x, b.y)) continue;

      const px = b.x * ts;
      const py = b.y * ts;
      const bww = (b.w || 1) * ts;
      const bhh = (b.h || 1) * ts;

      ctx.save();
      ctx.globalAlpha = pulse;
      Game.Assets.drawTile(ctx, flamePath, '🔥', px, py, bww, bhh);
      ctx.restore();

      const flameSize = ts * 0.4 * pulse;
      const fx = px + bww / 2 - flameSize / 2 + Math.sin(now * 0.01) * 4;
      const fy = py - flameSize / 2;
      
      ctx.save();
      ctx.globalAlpha = 0.6 + Math.sin(now * 0.015) * 0.4;
      Game.Assets.drawTile(ctx, flamePath, '🔥', fx, fy, flameSize, flameSize);
      ctx.restore();
    }
  },

  _renderPanicVillagers(ctx, ts, now, filter) {
    const fireMgr = Game.state && Game.state.fireManager;
    if (!this.vm) return;

    for (const b of this.world.buildings.values()) {
      if (!b.built || b.ruined) continue;
      if (!this._isVisible(b.x, b.y)) continue;

      const isBurning = fireMgr && fireMgr.isBuildingBurning(b);
      
      let anyRecovering = false;
      const residents = [];
      
      if (b.residents) {
        for (const rid of b.residents) {
          const v = this.vm.villagers.get(rid);
          if (v) residents.push(v);
        }
      }
      if (b.workerId !== null) {
        const v = this.vm.villagers.get(b.workerId);
        if (v) residents.push(v);
      }
      if (b.workerIds) {
        for (const wid of b.workerIds) {
          const v = this.vm.villagers.get(wid);
          if (v) residents.push(v);
        }
      }

      if (residents.length === 0) continue;

      for (const v of residents) {
        if (v._recoverUntil && now < v._recoverUntil) {
          anyRecovering = true;
          break;
        }
      }

      if (!isBurning && !anyRecovering) continue;

      const r = Math.max(b.w || 1, b.h || 1) / 2 + 0.8;
      const centerX = b.x + (b.w || 1) / 2;
      const centerY = b.y + (b.h || 1) / 2;

      const vSize = ts * 0.9;
      const offset = (ts - vSize) / 2;

      for (let i = 0; i < residents.length; i++) {
        const v = residents[i];
        
        if (!v.hidden) continue;

        let ex, ey;
        
        if (isBurning) {
          const baseAngle = (i / residents.length) * Math.PI * 2;
          const speed = 0.001;
          const angle = baseAngle + now * speed;

          ex = centerX + Math.cos(angle) * r;
          ey = centerY + Math.sin(angle) * r;
        } else {
          const elapsed = now - (v._recoverUntil - 3000);
          const t = Math.min(1, Math.max(0, elapsed / 3000));
          const baseAngle = (i / residents.length) * Math.PI * 2;
          const angle = baseAngle + now * 0.001;
          const ringX = centerX + Math.cos(angle) * r;
          const ringY = centerY + Math.sin(angle) * r;
          
          ex = ringX + (centerX - ringX) * t;
          ey = ringY + (centerY - ringY) * t;
        }

        if (!this._isVisible(ex, ey)) continue;
        
        const fakeEntity = { renderX: ex, renderY: ey };
        if (filter === 'behind' && !this._isBehindObject(fakeEntity)) continue;
        if (filter === 'front' && this._isBehindObject(fakeEntity)) continue;

        const px = ex * ts;
        const py = ey * ts;

        let asset = 'images/villager-idle-rot.webp';
        if (v.asset) asset = v.asset;

        ctx.save();
        const pivotX = px + ts / 2;
        const pivotY = py + ts;
        ctx.translate(pivotX, pivotY);
        const wobbleAngle = Math.sin(now * 0.02 + i) * 0.1;
        ctx.rotate(wobbleAngle);
        ctx.translate(-pivotX, -pivotY);

        Game.Assets.drawTile(ctx, asset, '🏃', px + offset, py + offset, vSize, vSize);
        
        ctx.restore();
      }
    }
  },

  _renderZombies(ctx, ts, dt, filter) {
    if (!this.zombieManager) return;

    const vSize = ts * 0.9;
    const offset = (ts - vSize) / 2;

    for (const z of this.zombieManager.zombies) {
      if (z.state === 'dead') continue;
      if (!this._isVisible(z.renderX, z.renderY)) continue;

      if (filter === 'behind' && !this._isBehindObject(z)) continue;
      if (filter === 'front' && this._isBehindObject(z)) continue;

      const px = z.renderX * ts;
      const py = z.renderY * ts;
      const waterDepth = this._updateWaterDepth(z, dt);

      ctx.save();

      let isActuallyMoving = false;
      if (z.targetX !== undefined && z.targetY !== undefined) {
        const dx = z.renderX - z.targetX;
        const dy = z.renderY - z.targetY;
        if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) isActuallyMoving = true;
      }

      if (isActuallyMoving) {
        const pivotX = px + ts / 2;
        const pivotY = py + ts;
        ctx.translate(pivotX, pivotY);
        const angle = Math.sin(performance.now() * 0.015) * 0.04;
        ctx.rotate(angle);
        ctx.translate(-pivotX, -pivotY);
      }

      if (waterDepth > 0) {
        const visibleFraction = Math.max(0, 1 - waterDepth * 0.5);
        if (visibleFraction > 0) {
          const drawH = vSize * visibleFraction;
          const drawY = py + offset;
          const extraOffset = waterDepth > 1.0 ? vSize * (waterDepth - 1.0) : 0;
          const bodyOffsetY = extraOffset;

          ctx.beginPath();
          ctx.rect(px + offset, drawY, vSize, drawH);
          ctx.clip();
          Game.Assets.drawTile(ctx, z.asset, '🧟', px + offset, py + offset + bodyOffsetY, vSize, vSize);
        }
      } else {
        Game.Assets.drawTile(ctx, z.asset, '🧟', px + offset, py + offset, vSize, vSize);
      }

      ctx.restore();
    }
  },

  _renderBuildSites(ctx, ts, dt) {
    for (const b of this.world.buildSites) {
      if (!this._isVisible(b.x, b.y)) continue;
      const px = b.x * ts, py = b.y * ts;
      const bw = (b.w || 1) * ts, bh = (b.h || 1) * ts;

      if (b.ruined) {
        const ruinPath = b.ruinAsset || b.def.ruinAsset || 'images/ruine-quadrat.webp';

        if (b.isBeingRepaired && b.buildTime > 0) {
          const progress = Math.min(1, b.progress / b.buildTime);

          if (progress > 0.01) {
            const visibleHeight = bh * progress;
            const clipY = py + bh - visibleHeight;

            ctx.save();
            ctx.beginPath();
            ctx.rect(px, clipY, bw, visibleHeight);
            ctx.clip();
            Game.Assets.drawTile(ctx, b.def.asset, b.def.emoji, px, py, bw, bh);
            ctx.restore();
          }

          Game.Assets.drawTile(ctx, ruinPath, '🏚️', px, py, bw, bh);
        } else {
          Game.Assets.drawTile(ctx, ruinPath, '🏚️', px, py, bw, bh);
        }
        continue;
      }

      if (b.progress <= 0) {
        ctx.fillStyle = '#6b3a1a';
        ctx.fillRect(px, py + bh - 4, bw, 4);
        continue;
      }

      const progress = Math.min(1, b.progress / b.buildTime);
      if (progress <= 0.01) continue;

      const visibleHeight = bh * progress;
      const clipY = py + bh - visibleHeight;
      ctx.save();
      ctx.beginPath();
      ctx.rect(px, clipY, bw, visibleHeight);
      ctx.clip();
      Game.Assets.drawTile(ctx, b.def.asset, b.def.emoji, px, py, bw, bh);
      ctx.restore();
    }
  },

  _renderFields(ctx, ts, dt) {
    const iconImages = {
      wood: 'images/icon_baum.webp',
      stone: 'images/icon_stein.webp',
      grain: 'images/icon_getreide.webp',
      fish: 'images/icon_fisch.webp'
    };

    for (const b of this.world.producingBuildings) {
      if (!b.built) continue;
      if (b.ruined) continue;
      if (b.def.id === 'lumberjack' || b.def.id === 'quarry' || b.def.id === 'fisher') continue;

      const iconPath = iconImages[b.def.produces];
      if (!iconPath) continue;

      for (const field of b.fields) {
        if (field.state !== 'ready' && field.state !== 'growing') continue;
        if (!this._isVisible(field.x, field.y)) continue;

        const px = field.x * ts, py = field.y * ts;

        let progress = 0;
        if (field.state === 'ready') {
          progress = 1.0;
          this.smoothTimers.set(field, 0);
        } else {
          const current = this.smoothTimers.get(field) || field.timer;
          const smooth = Math.min(30, current + (dt / 1000));
          this.smoothTimers.set(field, smooth);
          progress = smooth / 30;
        }

        if (b.def.produces === 'grain') {
          const maxSize = ts * 0.8;
          const endSize = maxSize * 0.6;
          const currentSize = endSize * progress;
          if (currentSize <= 0.5) continue;

          const positions = [
            { x: px + ts * 0.25, y: py + ts * 0.25 },
            { x: px + ts * 0.75, y: py + ts * 0.25 },
            { x: px + ts * 0.25, y: py + ts * 0.75 },
            { x: px + ts * 0.75, y: py + ts * 0.75 }
          ];
          for (const pos of positions) {
            Game.Assets.drawTile(ctx, iconPath, '', pos.x - currentSize / 2, pos.y - currentSize / 2, currentSize, currentSize);
          }
        } else if (b.def.produces === 'wood') {
          if (progress <= 0.01) continue;
          const maxSize = ts * 0.8;
          const currentSize = maxSize * progress;
          const bottomY = py + ts;
          const drawY = bottomY - currentSize;
          const drawX = px + (ts - currentSize) / 2;
          Game.Assets.drawTile(ctx, iconPath, '', drawX, drawY, currentSize, currentSize);
        } else {
          if (field.state === 'ready') {
            const iconSize = ts * 0.8;
            const offset = (ts - iconSize) / 2;
            Game.Assets.drawTile(ctx, iconPath, '', px + offset, py + offset, iconSize, iconSize);
          }
        }
      }
    }

    if (this.smoothTimers.size > 0) {
      for (const [field] of this.smoothTimers) {
        if (field.state === 'ready') this.smoothTimers.delete(field);
      }
    }
  },

  _renderDecorations(ctx, ts) {
    // Deko ist in den Boden-Chunks eingebacken
  },

  _renderTreesAndStones(ctx, ts) {
    // Bäume und Steine sind in den Hindernis-Chunks eingebacken
  },

  _renderGrowingTrees(ctx, ts, now) {
    const w = this.world;
    const total = w.TREE_GROWTH_MS || 240000;

    for (let i = 0; i < w.growingTrees.length; i++) {
      const tree = w.growingTrees[i];
      if (tree.growthUntil === null) continue;
      if (!this._isVisible(tree.x, tree.y)) continue;

      const remaining = tree.growthUntil - now;
      if (remaining <= 0) {
        continue;
      }

      const progress = 1 - Math.min(1, remaining / total);
      const scale = 0.2 + progress * 0.8;
      const bww = ts * 2 * scale;
      const bhh = ts * 2 * scale;
      const offsetX = (ts * 2 - bww) / 2;
      const offsetY = (ts * 2 - bhh);

      Game.Assets.drawTile(
        ctx, 'images/icon_baum.webp', '🌱',
        tree.x * ts + offsetX, tree.y * ts + offsetY, bww, bhh
      );
    }
  },

  _renderFish(ctx, ts, now) {
    const w = this.world;
    if (!w.fishWaterTiles) return;

    const tSec = now / 1000;
    const size = ts * 0.6 * 0.5;
    const halfSize = size / 2 / ts;

    for (const fish of w.fishWaterTiles.values()) {
      if (fish.cooldownUntil > 0) continue;
      if (fish.remaining <= 0) continue;
      if (!this._isVisible(fish.x, fish.y)) continue;

      const hasLeft  = w.waterTiles.has((fish.x - 1) + ',' + fish.y);
      const hasRight = w.waterTiles.has((fish.x + 1) + ',' + fish.y);

      const rightLimit = hasRight ? 1.0 : (0.5 - halfSize);
      const leftLimit  = hasLeft  ? -1.0 : (-0.5 + halfSize);
      const range = rightLimit - leftLimit;
      if (range <= 0) continue;

      const speedTilesPerSec = 0.35;

      if (fish._moveState === undefined) {
        fish._moveState = {
          pos: 0,
          dir: 1,
          nextTurnAt: 0,
          pauseUntil: 0,
          facingRight: true,
          lastNow: now
        };
        const factor = 0.85 + Math.random() * 0.15;
        fish._moveState.nextTurnAt = fish._moveState.pos + range * factor;
      }

      const st = fish._moveState;

      if (now < st.pauseUntil) {
        // Pause
      } else {
        const dt = Math.max(0, (now - st.lastNow) / 1000);
        st.lastNow = now;

        const move = speedTilesPerSec * dt;
        st.pos += move * st.dir;

        const factorAtTurn = 0.85 + Math.random() * 0.15;

        if (st.dir > 0 && st.pos >= st.nextTurnAt) {
          st.pos = st.nextTurnAt;
          st.dir = -1;
          st.facingRight = false;
          st.pauseUntil = now + 10;
          const remainingRange = st.pos - 0;
          st.nextTurnAt = st.pos - remainingRange * factorAtTurn;
        } else if (st.dir < 0 && st.pos <= st.nextTurnAt) {
          st.pos = st.nextTurnAt;
          st.dir = 1;
          st.facingRight = true;
          st.pauseUntil = now + 10;
          const remainingRange = range - st.pos;
          st.nextTurnAt = st.pos + remainingRange * factorAtTurn;
        }

        if (st.pos < 0) st.pos = 0;
        if (st.pos > range) st.pos = range;
      }

      const u01 = st.pos / range;
      const worldX = (fish.x + 0.5) + (leftLimit + u01 * range);
      const bobY = Math.sin(tSec * 2.3 + (fish.x + fish.y)) * ts * 0.06;

      const drawWorldX = worldX * ts;
      const drawWorldY = (fish.y + 0.5) * ts + bobY;

      const px = drawWorldX - size / 2;
      const py = drawWorldY - size / 2;

      const path = 'images/icon_fisch.webp';
      const entry = Game.Assets._getImageEntry(path);
      const img = entry && entry.img ? entry.img : null;

      if (img) {
        if (st.facingRight) {
          ctx.save();
          ctx.translate(px + size, py);
          ctx.scale(-1, 1);
          ctx.drawImage(img, 0, 0, size, size);
          ctx.restore();
        } else {
          ctx.drawImage(img, px, py, size, size);
        }
      } else {
        Game.Assets.drawTile(ctx, path, '🐟', px, py, size, size);
      }
    }
  },

  _renderVillagers(ctx, ts, dt, now, filter) {
    if (!this.vm) return;

    const dustSheets = this._getDustSpriteSheets();
    const dustFrameCount = this._dustFrameCount;
    const dustFrameSize = this._dustFrameSize;
    
    const frameInterval = 50;

    for (const v of this.vm.villagers.values()) {
      if (v.hidden) continue;
      if (!this._isVisible(v.renderX, v.renderY)) continue;

      if (filter === 'behind' && !this._isBehindObject(v)) continue;
      if (filter === 'front' && this._isBehindObject(v)) continue;

      const px = v.renderX * ts, py = v.renderY * ts;
      const vSize = ts * 0.9;
      const offset = (ts - vSize) / 2;

      ctx.save();

      let isActuallyMoving = false;
      if (v.targetX !== undefined && v.targetY !== undefined) {
        const dx = v.renderX - v.targetX;
        const dy = v.renderY - v.targetY;
        if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) isActuallyMoving = true;
      }

      if (isActuallyMoving) {
        const pivotX = px + ts / 2;
        const pivotY = py + ts;
        ctx.translate(pivotX, pivotY);
        const angle = Math.sin(now * 0.015) * 0.04;
        ctx.rotate(angle);
        ctx.translate(-pivotX, -pivotY);
      }

      const waterDepth = this._updateWaterDepth(v, dt);

      // ==========================================================
      // KRANKHEITS-FILTER (nur auf dem Spielfeld)
      // ==========================================================
      // Wenn der Villager krank ist, wird der normale Arbeitsskin
      // mit einem Grünstich gezeichnet. Das v.asset selbst bleibt
      // unverändert (wird für UI etc. weiter gebraucht).
      if (v.isSick) {
        ctx.filter = 'hue-rotate(70deg) saturate(0.85) brightness(0.95)';
      }

      const drawAsset = v.asset;

      if (waterDepth > 0) {
        const visibleFraction = Math.max(0, 1 - waterDepth * 0.5);

        if (visibleFraction > 0) {
          const drawH = vSize * visibleFraction;
          const drawY = py + offset;
          const extraOffset = waterDepth > 1.0
            ? vSize * (waterDepth - 1.0)
            : 0;
          const bodyOffsetY = extraOffset;

          ctx.beginPath();
          ctx.rect(px + offset, drawY, vSize, drawH);
          ctx.clip();
          Game.Assets.drawTile(
            ctx, drawAsset, '👷',
            px + offset,
            py + offset + bodyOffsetY,
            vSize, vSize
          );
        }
      } else {
        Game.Assets.drawTile(ctx, drawAsset, '👷', px + offset, py + offset, vSize, vSize);
      }

      // Filter zurücksetzen (wichtig, damit der Dust-Effekt
      // und nachfolgende Villager nicht mitgefiltert werden)
      if (v.isSick) {
        ctx.filter = 'none';
      }

      ctx.restore();

      if (dustSheets.length > 0 && isActuallyMoving && waterDepth === 0) {
        if (v._dustStyle === undefined) {
          v._dustStyle = Math.floor(Math.random() * dustSheets.length);
          v._dustOffset = Math.floor(Math.random() * dustFrameCount);
        }

        const currentFrame = (Math.floor(now / frameInterval) + v._dustOffset) % dustFrameCount;
        const sheet = dustSheets[v._dustStyle];

        const dustSize = ts * 1.035;
        const dustX = px + (ts - dustSize) / 2;
        const dustY = py + ts - dustSize - 2;
        
        ctx.save();
        ctx.globalAlpha = 0.75;
        
        ctx.drawImage(
          sheet,
          currentFrame * dustFrameSize, 0, dustFrameSize, dustFrameSize,
          dustX, dustY, dustSize, dustSize
        );
        
        ctx.restore();
      }
    }
  }

});
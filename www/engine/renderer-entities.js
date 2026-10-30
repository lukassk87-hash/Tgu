window.Game = window.Game || {};

Object.assign(Game.Renderer.prototype, {

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

    const prevDepth = v.waterDepth || 0;
    const targetDepth = isInWater ? 1.0 : 0.0;
    let newDepth = prevDepth;
    if (isInWater) {
      const speed = 3.0 * (dt / 1000);
      if (prevDepth < targetDepth) newDepth = Math.min(targetDepth, prevDepth + speed);
    } else {
      newDepth = 0;
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
    for (const b of this.world.buildings.values()) {
      if (!b.built) continue;
      if (!b.def.animationFrames) continue;
      if (!this._isVisible(b.x, b.y)) continue;

      const px = b.x * ts;
      const py = b.y * ts;
      const bww = (b.w || 1) * ts;
      const bhh = (b.h || 1) * ts;

      let assetPath;
      if (b.isActive) {
        const interval = b.def.animationInterval || 350;
        const frameIndex = Math.floor(now / interval) % b.def.animationFrames.length;
        assetPath = b.def.animationFrames[frameIndex];
      } else {
        assetPath = b.def.asset;
      }

      Game.Assets.drawTile(ctx, assetPath, b.def.emoji, px, py, bww, bhh);
    }
  },

  _renderZombies(ctx, ts) {
    if (!this.zombieManager) return;
    for (const z of this.zombieManager.zombies) {
      if (z.state === 'dead') continue;
      if (!this._isVisible(z.renderX, z.renderY)) continue;
      const px = z.renderX * ts, py = z.renderY * ts;
      const vSize = ts * 0.9;
      const offset = (ts - vSize) / 2;

      // NEU: Wasser-Tiefe des Zombies (wird in main.js berechnet)
      const waterDepth = z.waterDepth || 0;

      if (waterDepth > 0) {
        // Wie bei den Dorfbewohnern: Unterer Teil wird abgeschnitten
        const shiftY = vSize * 0.5 * waterDepth;
        ctx.save();
        ctx.beginPath();
        ctx.rect(px + offset, py + offset + shiftY, vSize, vSize * 0.5);
        ctx.clip();
        Game.Assets.drawTile(ctx, z.asset, '🧟', px + offset, py + offset + shiftY, vSize, vSize);
        ctx.restore();
      } else {
        Game.Assets.drawTile(ctx, z.asset, '🧟', px + offset, py + offset, vSize, vSize);
      }
    }
  },

  _renderBuildSites(ctx, ts, dt) {
    for (const b of this.world.buildSites) {
      if (!this._isVisible(b.x, b.y)) continue;
      const px = b.x * ts, py = b.y * ts;
      const bw = (b.w || 1) * ts, bh = (b.h || 1) * ts;

      if (b.progress <= 0) {
        ctx.fillStyle = '#6b3a1a';
        ctx.fillRect(px, py + bh - 4, bw, 4);
        continue;
      }

      let progress = 0;
      if (b.progress >= b.buildTime) {
        progress = 1.0;
        this.buildSmoothTimers.delete(b);
      } else {
        const current = this.buildSmoothTimers.get(b) || b.progress;
        const smooth = Math.min(b.buildTime, current + (dt / 1000));
        this.buildSmoothTimers.set(b, smooth);
        progress = smooth / b.buildTime;
      }
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

    if (this.buildSmoothTimers.size > 0) {
      for (const [b] of this.buildSmoothTimers) {
        if (b.built || b.progress >= b.buildTime) this.buildSmoothTimers.delete(b);
      }
    }
  },

  _renderFields(ctx, ts, dt) {
    // Hier ordnen wir den Ressourcen ihre Icon-Bilder zu
    const iconImages = {
      wood: 'images/icon_baum.webp',
      stone: 'images/icon_stein.webp',
      grain: 'images/icon_getreide.webp',
      fish: 'images/icon_fisch.webp'
    };

    for (const b of this.world.producingBuildings) {
      if (!b.built) continue;

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
            Game.Assets.drawTile(ctx, iconPath, '', pos.x - currentSize/2, pos.y - currentSize/2, currentSize, currentSize);
          }
        }
        else if (b.def.produces === 'wood') {
          if (progress <= 0.01) continue;
          const maxSize = ts * 0.8;
          const currentSize = maxSize * progress;
          const bottomY = py + ts;
          const drawY = bottomY - currentSize;
          const drawX = px + (ts - currentSize) / 2;
          Game.Assets.drawTile(ctx, iconPath, '', drawX, drawY, currentSize, currentSize);
        }
        else {
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

  _renderVillagers(ctx, ts, dt, now) {
    if (!this.vm) return;

    for (const v of this.vm.villagers.values()) {
      if (v.hidden) continue;
      if (!this._isVisible(v.renderX, v.renderY)) continue;

      const px = v.renderX * ts, py = v.renderY * ts;
      const vSize = ts * 0.9;
      const offset = (ts - vSize) / 2;

      let isActuallyMoving = false;
      if (v.state === 'moving') {
        const dx = v.renderX - v.targetX;
        const dy = v.renderY - v.targetY;
        if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) isActuallyMoving = true;
      }

      ctx.save();

      if (isActuallyMoving) {
        const pivotX = px + ts / 2;
        const pivotY = py + ts;
        ctx.translate(pivotX, pivotY);
        const angle = Math.sin(now * 0.015) * 0.04;
        ctx.rotate(angle);
        ctx.translate(-pivotX, -pivotY);
      }

      const waterDepth = this._updateWaterDepth(v, dt);

      if (waterDepth > 0) {
        const shiftY = vSize * 0.5 * waterDepth;
        ctx.save();
        ctx.beginPath();
        ctx.rect(px + offset, py + offset + shiftY, vSize, vSize * 0.5);
        ctx.clip();
        Game.Assets.drawTile(ctx, v.asset, '👷', px + offset, py + offset + shiftY, vSize, vSize);
        ctx.restore();
      } else {
        Game.Assets.drawTile(ctx, v.asset, '👷', px + offset, py + offset, vSize, vSize);
      }

      // Kein Icon mehr über dem Kopf (das war der entfernte Block)

      ctx.restore();
    }
  }

});
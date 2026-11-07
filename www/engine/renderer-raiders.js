window.Game = window.Game || {};

Object.assign(Game.Renderer.prototype, {

  _updateRaiderWaterDepth(w, dt) {
    const world = this.world, ts = this.tileSize;
    const vSize = ts * 0.9;
    const offset = (ts - vSize) / 2;
    const feetTopY = w.renderY * ts + offset + vSize * 0.75;
    const feetTopWorldY = feetTopY / ts;
    const feetTileY = Math.floor(feetTopWorldY);
    const feetTileX = Math.floor(w.renderX);
    const feetTerrain = world.getTerrainId(feetTileX, feetTileY);
    const isInWater = feetTerrain === 'water';

    const targetDepth = isInWater ? 1.0 : 0;

    const prevDepth = w.waterDepth || 0;
    let newDepth = prevDepth;

    if (isInWater) {
      const speed = 3.0 * (dt / 1000);
      if (prevDepth < targetDepth) newDepth = Math.min(targetDepth, prevDepth + speed);
      else if (prevDepth > targetDepth) newDepth = Math.max(targetDepth, prevDepth - speed);
    } else {
      const speed = 3.0 * (dt / 1000);
      newDepth = Math.max(0, prevDepth - speed);
    }

    w.waterDepth = newDepth;
    return newDepth;
  },

  _renderRaiders(ctx, ts, dt, now) {
    const rv = this.raiderVillage;
    if (!rv) return;

    // Gebäude
    for (const b of rv.buildings) {
      if (!this._isVisible(b.x, b.y)) continue;

      const px = b.x * ts;
      const py = b.y * ts;
      const bww = (b.w || 1) * ts;
      const bhh = (b.h || 1) * ts;

      // === Phase 1: Explosion (500ms) ===
      if (b.isDestroyed && b.explodingUntil > 0 && now < b.explodingUntil) {
        // ⚠️ FIX: Explosion quadratisch zeichnen (mittig zentriert)
        const explosionSize = Math.min(bww, bhh);
        const expX = px + (bww - explosionSize) / 2;
        const expY = py + (bhh - explosionSize) / 2;
        Game.Assets.drawTile(ctx, 'images/explosion.webp', '💥', expX, expY, explosionSize, explosionSize);
        continue;
      }

      // === Phase 2: Ruinen (60 Sekunden) ===
      if (b.isDestroyed && b.explodingUntil > 0 && now >= b.explodingUntil && now < b.ruinsUntil) {
        const ruinAsset = b.def.id === 'raiderCastle' 
          ? 'images/ruine-hoch.webp' 
          : 'images/ruine-quadrat.webp';
        Game.Assets.drawTile(ctx, ruinAsset, '🏚️', px, py, bww, bhh);
        continue;
      }

      // === Phase 3: Ruine abgelaufen -> Gebäude ist weg ===
      if (b.isDestroyed && b.ruinsUntil > 0 && now >= b.ruinsUntil) {
        continue;
      }

      // === Normale Phase: Gebäude zeichnen ===
      Game.Assets.drawTile(ctx, b.def.asset, b.def.emoji, px, py, bww, bhh);

      if (b.isBurning) {
        Game.Assets.drawTile(ctx, 'images/flamme.webp', '🔥', px, py, bww, bhh);
      }
    }

    // Grenzsteine (blau)
    if (rv.boundaryTiles) {
      const iconSize = 8;
      for (const t of rv.boundaryTiles) {
        if (!this._isVisible(t.x, t.y)) continue;
        const px = t.x * ts;
        const py = t.y * ts;
        if (t.top) {
          const isCorner = t.left || t.right;
          if (isCorner || t.x % 3 === 0) {
            Game.Assets.drawTile(ctx, 'images/grenze-blau.webp', '', px + ts / 2 - iconSize / 2, py - iconSize / 2, iconSize, iconSize);
          }
        }
        if (t.bottom) {
          const isCorner = t.left || t.right;
          if (isCorner || t.x % 3 === 0) {
            Game.Assets.drawTile(ctx, 'images/grenze-blau.webp', '', px + ts / 2 - iconSize / 2, py + ts - iconSize / 2, iconSize, iconSize);
          }
        }
        if (t.left) {
          const isCorner = t.top || t.bottom;
          if (isCorner || t.y % 3 === 0) {
            Game.Assets.drawTile(ctx, 'images/grenze-blau.webp', '', px - iconSize / 2, py + ts / 2 - iconSize / 2, iconSize, iconSize);
          }
        }
        if (t.right) {
          const isCorner = t.top || t.bottom;
          if (isCorner || t.y % 3 === 0) {
            Game.Assets.drawTile(ctx, 'images/grenze-blau.webp', '', px + ts - iconSize / 2, py + ts / 2 - iconSize / 2, iconSize, iconSize);
          }
        }
      }
    }

    // Krieger (immer sichtbar)
    const vSize = ts * 0.9;
    const offset = (ts - vSize) / 2;

    for (const w of rv.warriors.values()) {
      if (w.dead) continue;
      if (w.hidden) continue;
      if (!this._isVisible(w.renderX, w.renderY)) continue;

      const px = w.renderX * ts;
      const py = w.renderY * ts;

      const waterDepth = this._updateRaiderWaterDepth(w, dt);

      if (waterDepth > 0) {
        const visibleFraction = Math.max(0, 1 - waterDepth * 0.5);

        if (visibleFraction > 0) {
          const drawH = vSize * visibleFraction;
          const drawY = py + offset;
          const extraOffset = waterDepth > 1.0
            ? vSize * (waterDepth - 1.0)
            : 0;
          const bodyOffsetY = extraOffset;

          ctx.save();
          ctx.beginPath();
          ctx.rect(px + offset, drawY, vSize, drawH);
          ctx.clip();
          Game.Assets.drawTile(
            ctx,
            w.asset,
            '⚔️',
            px + offset,
            py + offset + bodyOffsetY,
            vSize,
            vSize
          );
          ctx.restore();
        }
      } else {
        Game.Assets.drawTile(
          ctx,
          w.asset,
          '⚔️',
          px + offset,
          py + offset,
          vSize,
          vSize
        );
      }
    }
  }

});
window.Game = window.Game || {};

Object.assign(Game.Renderer.prototype, {

  /**
   * filter: 'behind' = nur wenn hinter einem Gebäude
   *         'front'  = nur wenn vor einem Gebäude
   *         null     = immer (fliegender Drache)
   */
  _renderDragon(ctx, ts, dt, now, filter) {
    const dm = this.dragonManager;
    if (!dm) return;
    if (!dm.dragons || dm.dragons.length === 0) return;

    for (const d of dm.dragons) {
      if (filter === 'behind' && !this._isBehindObject(d)) continue;
      if (filter === 'front' && this._isBehindObject(d)) continue;

      const px = d.renderX * ts;
      const py = d.renderY * ts;

      const isFlying = (d.state === 'flying' || d.state === 'attacking' || d.state === 'escaping');
      const isCrashing = (d.state === 'crashing');

      const baseScale = d.scale || 1.0;
      const scale = isCrashing ? (d.crashCurrentScale || baseScale) : baseScale;

      const dragonW = ts * 3 * scale;
      const dragonH = ts * 3 * scale;

      let bob = 0;
      if (isFlying) {
        bob = Math.sin(now * 0.004) * ts * 0.15;
      }

      let assetPath;
      if (d.state === 'grounded' || isCrashing) {
        assetPath = 'images/dracheko.webp';
      } else {
        const frame = Math.floor(now / 450) % 2;
        assetPath = frame === 0 ? 'images/drache.webp' : 'images/drache2.webp';
      }

      if (d.hp > 0 && isFlying) {
        const maxHp = d.maxHp || 5;
        ctx.save();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        const txt = `${d.hp}/${maxHp}`;
        ctx.strokeText(txt, px + ts / 2, py - 4);
        ctx.fillText(txt, px + ts / 2, py - 4);
        ctx.restore();
      }

      let angle = 0;
      if (isCrashing) {
        angle = d.crashRotation || 0;
      } else if (isFlying) {
        let dirX = 0;
        let dirY = 0;

        if (d.targetBuildingId) {
          const target = dm.world.buildings.get(d.targetBuildingId);
          if (target) {
            dirX = (target.x + (target.w || 1) / 2) - d.x;
            dirY = (target.y + (target.h || 1) / 2) - d.y;
          }
        }

        if (dirX === 0 && dirY === 0) {
          dirX = d.vx || 0;
          dirY = d.vy || 0;
        }

        if (dirX !== 0 || dirY !== 0) {
          angle = Math.atan2(dirY, dirX) + Math.PI / 2;
        }
      }

      const centerX = px + ts / 2;
      const centerY = py + ts / 2 + bob;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle);

      const entry = Game.Assets._getImageEntry(assetPath);
      if (entry && entry.img) {
        ctx.drawImage(
          entry.img,
          -dragonW / 2, -dragonH / 2,
          dragonW, dragonH
        );
      } else {
        if (d.state !== 'grounded' && !isCrashing) {
          ctx.font = `${Math.floor(Math.min(dragonW, dragonH) * 0.7)}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🐲', 0, 0);
        }
      }

      ctx.restore();
    }
  },

  /**
   * filter: 'behind' = nur wenn hinter einem Gebäude
   *         'front'  = nur wenn vor einem Gebäude
   *         null     = immer
   *
   * Startet voll sichtbar (alpha = 1.0) und blendet über 90 Sekunden
   * linear auf unsichtbar (alpha = 0.0) aus.
   */
  _renderDeadDragons(ctx, ts, now, filter) {
    const dm = this.dragonManager;
    if (!dm || !dm.deadDragons || dm.deadDragons.length === 0) return;

    const DURATION = dm.DEAD_DRAGON_DURATION_MS || 90000;
    const DEAD_ASSET = 'images/drache-tot.webp';

    const entry = Game.Assets._getImageEntry(DEAD_ASSET);
    const img = entry && entry.img ? entry.img : null;
    if (!img) {
      Game.Assets.loadImage(DEAD_ASSET);
    }

    for (let i = 0; i < dm.deadDragons.length; i++) {
      const dd = dm.deadDragons[i];
      const elapsed = now - dd.startTime;
      if (elapsed >= DURATION) continue;
      if (elapsed < 0) continue;

      if (filter === 'behind' && !this._isBehindObject(dd)) continue;
      if (filter === 'front' && this._isBehindObject(dd)) continue;

      // "0% Transparenz" = voll deckend = alpha 1.0
      // "100% Transparenz" = voll transparent = alpha 0.0
      const alpha = 1 - (elapsed / DURATION);

      const scale = dd.scale || 1.0;
      const dragonW = ts * 3 * scale;
      const dragonH = ts * 3 * scale;

      const px = dd.x * ts + ts / 2 - dragonW / 2;
      const py = dd.y * ts + ts / 2 - dragonH / 2;

      if (!this._isVisible(dd.x, dd.y)) continue;

      ctx.save();
      ctx.globalAlpha = alpha;

      if (img) {
        ctx.drawImage(img, px, py, dragonW, dragonH);
      } else {
        ctx.font = `${Math.floor(Math.min(dragonW, dragonH) * 0.7)}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💀', px + dragonW / 2, py + dragonH / 2);
      }

      ctx.restore();
    }
  },

  _renderFireballs(ctx, ts, now) {
    const dm = this.dragonManager;
    if (!dm || !dm.fireballs || dm.fireballs.length === 0) return;

    for (const f of dm.fireballs) {
      const elapsed = now - f.startTime;
      const t = Math.min(1, elapsed / f.durationMs);

      const px = (f.sx + (f.ex - f.sx) * t) * ts;
      const py = (f.sy + (f.ey - f.sy) * t) * ts;

      const size = ts * 0.8;

      Game.Assets.drawTile(ctx, dm.assets.fireball, '🔥',
        px - size / 2, py - size / 2, size, size);
    }
  },

  spawnDragonImpactParticles(tileX, tileY) {
    if (!this.particles) return;
    if (this.particles.length >= this.MAX_PARTICLES) {
      this.particles.splice(0, 20);
    }
    const ts = this.tileSize;
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x: tileX * ts + ts / 2 + (Math.random() * ts - ts / 2),
        y: tileY * ts + ts / 2 + (Math.random() * ts - ts / 2),
        vx: (Math.random() - 0.5) * 3,
        vy: -Math.random() * 4 - 1,
        life: 1.0,
        color: ['#ff3030', '#ff8a5c', '#ffcc00', '#ff6600'][Math.floor(Math.random() * 4)],
        size: 3 + Math.random() * 3
      });
    }
  }

});
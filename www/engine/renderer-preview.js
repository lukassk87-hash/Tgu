window.Game = window.Game || {};

Object.assign(Game.Renderer.prototype, {

  _drawPlacementPreview(ctx, def, anchorX, anchorY, valid, ts, cam, now) {
    // ==========================================================
    // SICHERHEITSPRÜFUNG: Zeichne die Vorschau NUR, wenn wir 
    // uns auch wirklich im Bau-Modus befinden.
    // ==========================================================
    const game = window.Game && window.Game.state;
    const isBuildMode = game && (
      (game.hud && game.hud.activeBuild) || 
      game.state === 'placingCastle'
    );

    if (!isBuildMode) return;

    // ----------------------------------------------------------

    const dw = def.width || 1;
    const dh = def.height || 1;
    const topLeft = Game.Buildings.getTopLeft(def, anchorX, anchorY);
    const tx0 = topLeft.x;
    const ty0 = topLeft.y;
    const hw = dw * ts;
    const hh = dh * ts;
    const px = tx0 * ts;
    const py = ty0 * ts;

    // 1. Wirkungsradius-Anzeige (Hellgelbe Felder)
    const hasRadius = def.expandsBorder || def.extinguishRadius;
    if (hasRadius) {
      const radius = def.expandsBorder || def.extinguishRadius;
      const cX = tx0 + Math.floor(dw / 2);
      const cY = ty0 + Math.floor(dh / 2);
      
      const minX = Math.max(0, cX - radius);
      const maxX = Math.min(this.world.width - 1, cX + radius);
      const minY = Math.max(0, cY - radius);
      const maxY = Math.min(this.world.height - 1, cY + radius);

      ctx.fillStyle = 'rgba(255, 255, 0, 0.2)';
      
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          ctx.fillRect(x * ts, y * ts, ts, ts);
        }
      }
    }

    // 2. Felder-Markierung (Grün/Rot)
    for (let dy = 0; dy < dh; dy++) {
      for (let dx = 0; dx < dw; dx++) {
        const tx = tx0 + dx;
        const ty = ty0 + dy;
        const terr = this.world.getTerrain(tx, ty);
        const isOccupied = this.world.occupied.has(tx + ',' + ty);
        const fieldOk = terr && terr.buildable && !isOccupied
          && (!def.requiresTerrain || terr.id === def.requiresTerrain);

        ctx.fillStyle = fieldOk ? 'rgba(0, 255, 0, 0.28)' : 'rgba(255, 0, 0, 0.38)';
        ctx.fillRect(tx * ts, ty * ts, ts, ts);
      }
    }

    // 3. Auswahl-Umriss (Pulsierend)
    const pulse = 0.5 + 0.5 * Math.sin(now * 0.006);
    ctx.strokeStyle = valid ? `rgba(0, 255, 0, ${0.6 + 0.4 * pulse})` : '#ff0000';
    ctx.lineWidth = (2 + pulse * 1.5) / cam.zoom;
    ctx.strokeRect(px + 1, py + 1, hw - 2, hh - 2);

    // 4. Gebäude-Vorschau (halbtransparent)
    ctx.globalAlpha = 0.65;
    if (def.asset) {
      Game.Assets.drawTile(ctx, def.asset, def.emoji, px, py, hw, hh);
    } else {
      Game.Assets.drawTile(ctx, '', def.emoji, px, py, hw, hh);
    }
    ctx.globalAlpha = 1.0;
  }

});
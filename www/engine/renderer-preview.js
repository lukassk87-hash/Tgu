window.Game = window.Game || {};

Object.assign(Game.Renderer.prototype, {

  _drawPlacementPreview(ctx, def, anchorX, anchorY, valid, ts, cam, now) {
    const dw = def.width || 1;
    const dh = def.height || 1;
    const topLeft = Game.Buildings.getTopLeft(def, anchorX, anchorY);
    const tx0 = topLeft.x;
    const ty0 = topLeft.y;
    const hw = dw * ts;
    const hh = dh * ts;
    const px = tx0 * ts;
    const py = ty0 * ts;

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

    const pulse = 0.5 + 0.5 * Math.sin(now * 0.006);
    ctx.strokeStyle = valid ? `rgba(0, 255, 0, ${0.6 + 0.4 * pulse})` : '#ff0000';
    ctx.lineWidth = (2 + pulse * 1.5) / cam.zoom;
    ctx.strokeRect(px + 1, py + 1, hw - 2, hh - 2);

    if (def.expandsBorder) {
      const r = def.expandsBorder;
      const cX = tx0 + Math.floor(dw / 2);
      const cY = ty0 + Math.floor(dh / 2);
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.4)';
      ctx.lineWidth = 1.5 / cam.zoom;
      ctx.strokeRect((cX - r) * ts, (cY - r) * ts, (r * 2 + 1) * ts, (r * 2 + 1) * ts);
    }

    ctx.globalAlpha = 0.65;
    if (def.asset) {
      Game.Assets.drawTile(ctx, def.asset, def.emoji, px, py, hw, hh);
    } else {
      Game.Assets.drawTile(ctx, '', def.emoji, px, py, hw, hh);
    }
    ctx.globalAlpha = 1.0;
  }

});
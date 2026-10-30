window.Game = window.Game || {};

Object.assign(Game.Renderer.prototype, {

  spawnHarvestParticles(tileX, tileY, resourceType) {
    if (this.particles.length >= this.MAX_PARTICLES) {
      this.particles.splice(0, 8);
    }

    let color = '#fff';
    if (resourceType === 'wood') color = '#8B4513';
    else if (resourceType === 'stone') color = '#999';
    else if (resourceType === 'grain') color = '#DAA520';
    else if (resourceType === 'fish') color = '#00BFFF';
    else if (resourceType === 'water') color = '#4A90E2';

    const ts = this.tileSize;
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: tileX * ts + ts / 2 + (Math.random() * 10 - 5),
        y: tileY * ts + ts / 2 + (Math.random() * 10 - 5),
        vx: (Math.random() - 0.5) * 1.5,
        vy: -Math.random() * 2 - 0.5,
        life: 1.0, color: color, size: 3
      });
    }
  },

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * (dt / 16);
      p.y += p.vy * (dt / 16);
      p.vy += 0.15 * (dt / 16);
      p.life -= dt * 0.003;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  },

  _drawEmoji(ctx, emoji, x, y, size) {
    ctx.font = Math.floor(size * 0.8) + 'px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, x + size/2, y + size/2);
  }

});
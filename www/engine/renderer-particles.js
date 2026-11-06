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

  spawnArrow(fromX, fromY, toX, toY, hit, onImpact) {
    const ts = this.tileSize;
    const startX = (fromX + 0.5) * ts;
    const startY = (fromY + 0.5) * ts;

    let endX, endY;
    if (hit) {
      endX = (toX + 0.5) * ts;
      endY = (toY + 0.5) * ts;
    } else {
      const angle = Math.random() * Math.PI * 2;
      const offset = 0.6 + Math.random() * 0.35;
      endX = (toX + 0.5 + Math.cos(angle) * offset) * ts;
      endY = (toY + 0.5 + Math.sin(angle) * offset) * ts;
    }

    const dx = endX - startX;
    const dy = endY - startY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const pxPerSec = 240;
    const durationMs = Math.max(180, Math.min(900, (dist / pxPerSec) * 1000));

    this.arrows.push({
      sx: startX,
      sy: startY,
      ex: endX,
      ey: endY,
      startTime: performance.now(),
      durationMs,
      hit: !!hit,
      onImpact: typeof onImpact === 'function' ? onImpact : null
    });
  },

  updateArrows(now) {
    if (!this.arrows || this.arrows.length === 0) return;

    for (let i = this.arrows.length - 1; i >= 0; i--) {
      const a = this.arrows[i];
      const elapsed = now - a.startTime;
      if (elapsed >= a.durationMs) {
        const impactColor = a.hit ? '#ff3030' : '#7a4a20';
        const count = a.hit ? 10 : 7;

        for (let k = 0; k < count; k++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 0.8 + Math.random() * 1.4;
          this.particles.push({
            x: a.ex + (Math.random() * 8 - 4),
            y: a.ey + (Math.random() * 8 - 4),
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 0.6,
            life: 1.0,
            color: impactColor,
            size: 2 + Math.random() * 2.5
          });
        }

        this.arrows.splice(i, 1);

        // Sauber: erst beim Einschlag den Effekt auslösen
        if (a.onImpact) {
          try { a.onImpact(); } catch (e) { console.error(e); }
        }
      }
    }
  },

  _renderArrows(ctx, now) {
    if (!this.arrows || this.arrows.length === 0) return;

    for (const a of this.arrows) {
      const elapsed = now - a.startTime;
      const t = Math.min(1, elapsed / a.durationMs);

      const px = a.sx + (a.ex - a.sx) * t;
      const py = a.sy + (a.ey - a.sy) * t;

      const dx = a.ex - a.sx;
      const dy = a.ey - a.sy;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = dx / len;
      const ny = dy / len;

      const trailLen = 12;
      const tailX = px - nx * trailLen;
      const tailY = py - ny * trailLen;

      ctx.save();
      ctx.lineCap = 'round';

      ctx.strokeStyle = '#2a1e10';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(px, py);
      ctx.stroke();

      ctx.strokeStyle = a.hit ? '#ffe060' : '#e8d090';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(px, py);
      ctx.stroke();

      ctx.fillStyle = '#fff8d0';
      ctx.beginPath();
      ctx.arc(px, py, 1.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
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
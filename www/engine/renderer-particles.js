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

  // ==========================================================
  // FROSTKUGEL-EXPLOSION (AUF 25% REDUZIERT)
  //
  // Erzeugt:
  // 1. Eis-Scherben (Dreiecke, die nach außen fliegen)
  // 2. Frost-Nebel (kleine, transparente Kreise)
  // 3. Schockwellen-Ring (expandierender Kreis)
  // ==========================================================
  spawnFrostImpactParticles(tileX, tileY) {
    const ts = this.tileSize;
    const centerX = tileX * ts + ts / 2;
    const centerY = tileY * ts + ts / 2;

    // 1. Eis-Scherben (Dreiecke) - Reduziert auf 25% (5 Stück)
    const shardCount = 5;
    for (let i = 0; i < shardCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2; // Weniger Wucht
      const colors = ['#ffffff', '#ddeeff', '#aaddff'];
      
      this.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.5,
        life: 0.8, // Kürzere Lebensdauer
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2 + Math.random() * 2,
        _shape: 'shard',
        _rotation: Math.random() * Math.PI * 2,
        _rotSpeed: (Math.random() - 0.5) * 0.2
      });
    }

    // 2. Frost-Nebel - Reduziert auf 25% (2 Stück)
    const mistCount = 2;
    for (let i = 0; i < mistCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.2 + Math.random() * 0.5;
      
      this.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.7,
        color: 'rgba(170, 221, 255, 0.4)',
        size: 8 + Math.random() * 8,
        _shape: 'mist',
        _grow: 0.4 + Math.random() * 0.6
      });
    }

    // 3. Schockwellen-Ring - Kleiner und schneller weg
    this.particles.push({
      x: centerX,
      y: centerY,
      vx: 0,
      vy: 0,
      life: 0.6,
      color: 'rgba(220, 240, 255, 0.6)',
      size: 5,
      _shape: 'ring',
      _grow: 4.0
    });
  },

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      
      // Bewegung
      p.x += p.vx * (dt / 16);
      p.y += p.vy * (dt / 16);

      // Schwerkraft (Scherben fallen, Nebel nicht)
      if (p._shape === 'shard') {
        p.vy += 0.2 * (dt / 16);
        if (p._rotation !== undefined) {
          p._rotation += p._rotSpeed * (dt / 16);
        }
      } else if (p._shape === 'mist') {
        // Nebel driftet nach oben
        p.vy -= 0.02 * (dt / 16);
        if (p._grow) p.size += p._grow * (dt / 16);
      } else if (p._shape === 'ring') {
        if (p._grow) p.size += p._grow * (dt / 16);
      }

      // Lebensdauer
      if (p._shape === 'ring') {
        p.life -= dt * 0.005; // Ring verblasst schneller
      } else if (p._shape === 'mist') {
        p.life -= dt * 0.001; // Nebel bleibt länger
      } else {
        p.life -= dt * 0.003;
      }

      if (p.life <= 0) this.particles.splice(i, 1);
    }
  },

  _drawEmoji(ctx, emoji, x, y, size) {
    ctx.font = Math.floor(size * 0.8) + 'px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, x + size/2, y + size/2);
  },

  // ==========================================================
  // PARTIKEL ZEICHNEN (Ersetzt das alte einfache fillRect)
  // ==========================================================
  _renderParticles(ctx) {
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life);

      if (p._shape === 'shard') {
        // Dreieck als Eisscherbe
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p._rotation || 0);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -p.size / 2);
        ctx.lineTo(p.size / 2, p.size / 2);
        ctx.lineTo(-p.size / 2, p.size / 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else if (p._shape === 'mist') {
        // Weicher Nebel-Kreis
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.shadowColor = '#aaddff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (p._shape === 'ring') {
        // Expandierender Ring
        ctx.save();
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2 * p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else {
        // Standard-Partikel (für Ernte, Pfeile, etc.)
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
    }
    ctx.globalAlpha = 1.0;
  }

});
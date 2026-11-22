window.Game = window.Game || {};

Game.Inventory = {
  game: null,

  init(gameInstance) {
    this.game = gameInstance;
    const btn = document.getElementById('inventoryBtn');
    const win = document.getElementById('inventoryWindow');
    const closeBtn = document.getElementById('inventoryWindowClose');
    
if (!btn || !win || !closeBtn) return;

// Button in die gemeinsame Reihe (Schloss + Toggle + Inventar) einhängen
const topLeftRow = document.getElementById('topLeftButtons');
if (topLeftRow && btn.parentNode !== topLeftRow) {
  topLeftRow.appendChild(btn);
}

// Button sichtbar machen (startet versteckt im HTML)
btn.classList.remove('hidden');

    // Öffnen
    btn.addEventListener('click', () => {
      if (this.game.paused) return; // Nicht öffnen, wenn schon pausiert (z.B. anderes Fenster offen)
      this.game.paused = true;
      this.render();
      win.classList.remove('hidden');
      
      // Wenn Sound läuft, pausieren
      if (window.audioManager) window.audioManager.stopAll();
    });

    // Schließen über X-Button
    closeBtn.addEventListener('click', () => {
      this.close();
    });

    // Schließen durch Klick auf den dunklen Hintergrund
    win.addEventListener('click', (e) => {
      if (e.target === win) {
        this.close();
      }
    });
  },

  close() {
    const win = document.getElementById('inventoryWindow');
    if (win) win.classList.add('hidden');
    if (this.game) this.game.paused = false;
  },

  render() {
    const content = document.getElementById('inventoryContent');
    if (!content || !this.game || !this.game.economy || !this.game.economy.res) return;

    const res = this.game.economy.res;
    // Wir holen uns die Namen und Icons aus Game.UI (dort sind sie schon übersetzt)
    const images = Game.UI.resourceImages;
    const names = Game.UI.resourceNames;

    let html = '';
    
    // Iteriere über alle bekannten Ressourcen
    for (const key in images) {
      const amount = Math.floor(res[key] || 0);
      const name = names[key] || key;
      const img = images[key];

      html += `
        <div class="inventory-item">
          <img src="${img}" alt="${name}" onerror="this.style.display='none'">
          <div class="inv-name">${name}</div>
          <div class="inv-amount">${amount.toLocaleString(Game.Lang.current === 'de' ? 'de-DE' : 'en-US')}</div>
        </div>
      `;
    }

    content.innerHTML = html;
  }
};

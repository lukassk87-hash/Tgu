window.Game = window.Game || {};

// forest & mountain entfallen – Bäume und Steine sind jetzt Objekte auf 'grass'.
Game.TERRAINS = {
  grass: { id: 'grass', name: 'Gras',   color: '#3f7d3f', emoji: '🟩', asset: 'images/gras.webp', buildable: true },
  water: { id: 'water', name: 'Wasser', color: '#2a5c9a', emoji: '💧', asset: 'images/wasser.webp', buildable: false }
};
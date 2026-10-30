window.Game = window.Game || {};

Game.TERRAINS = {
  grass:    { id: 'grass',    name: 'Gras',   color: '#3f7d3f', emoji: '🟩', asset: 'images/gras.webp',  buildable: true,  resource: 'grain' },
  forest:   { id: 'forest',   name: 'Wald',   color: '#1e4d1e', emoji: '🌲', asset: 'images/holz.webp',  buildable: true,  resource: 'wood' },
  mountain: { id: 'mountain', name: 'Berg',   color: '#6b6b6b', emoji: '⛰️', asset: 'images/stein.webp', buildable: true,  resource: 'stone' },
  water:    { id: 'water',    name: 'Wasser', color: '#2a5c9a', emoji: '💧', asset: 'images/wasser.webp',buildable: false, resource: 'fish' }
};
window.Game = window.Game || {};

Game.BUILDING_TYPES = {
  castle: {
    id: 'castle', name: 'Schloss', emoji: '🏰', asset: 'images/schloss.webp',
    width: 3, height: 6, isHouse: true, maxWarriors: 5, maxResidents: 8,
    beerSlots: 10,
    attackRadius: 10,
    dragonResistant: true,
    dragonHits: 3,
    repairCost: { woodPlank: 100, stone: 50 },
    damageAssets: [
      'images/schloss.webp',
      'images/schlossk1.webp',
      'images/schlossk2.webp'
    ],
    ruinAsset: 'images/schlossk3.webp'
  },
  house: {
    id: 'house', name: 'Haus', emoji: '🏠', asset: 'images/haus-rot.webp',
    cost: { woodPlank: 5, stone: 5 }, buildTime: 5, isHouse: true, width: 2, height: 2, maxResidents: 5,
    repairCost: { woodPlank: 3, stone: 3 },
    ruinAsset: 'images/ruine-quadrat.webp'
  },
  lumberjack: {
    id: 'lumberjack', name: 'Holzfäller', emoji: '🪓', asset: 'images/holzfaeller-rot.webp',
    cost: { wood: 5 }, buildTime: 4, width: 2, height: 2,
    globalResource: 'wood',
    consumesFish: true,
    sound: 'audio/axt.mp3',
    repairCost: { wood: 3 },
    ruinAsset: 'images/ruine-quadrat.webp'
  },
  forsthaus: {
    id: 'forsthaus', name: 'Forsthaus', emoji: '🌱', asset: 'images/forsthaus.webp',
    cost: { stone: 5 }, buildTime: 4, width: 2, height: 2,
    globalResource: 'wood',
    consumesFish: true,
    repairCost: { stone: 3 },
    ruinAsset: 'images/ruine-quadrat.webp'
  },
  quarry: {
    id: 'quarry', name: 'Steinmetz', emoji: '⛏️', asset: 'images/steinmetz-rot.webp',
    cost: { woodPlank: 5 }, buildTime: 4, width: 2, height: 2,
    globalResource: 'stone',
    consumesFish: true,
    sound: 'audio/steinmetz.mp3',
    repairCost: { woodPlank: 3 },
    ruinAsset: 'images/ruine-quadrat.webp'
  },
  farm: {
    id: 'farm', name: 'Bauer', emoji: '🌾', asset: 'images/bauer-rot.webp',
    cost: { woodPlank: 5, stone: 3 }, buildTime: 4, produces: 'grain', width: 2, height: 2, consumesFish: true,
    sound: 'audio/bauernhof.mp3',
    repairCost: { woodPlank: 3, stone: 2 },
    ruinAsset: 'images/ruine-quadrat.webp'
  },
  fisher: {
    id: 'fisher', name: 'Fischerhütte', emoji: '🎣', asset: 'images/fischerhuette-rot.webp',
    cost: { woodPlank: 3 }, buildTime: 4, produces: 'fish', width: 2, height: 2, consumesFish: false,
    sound: 'audio/fischerhuette.mp3',
    repairCost: { woodPlank: 2 },
    ruinAsset: 'images/ruine-quadrat.webp'
  },
  storage: {
    id: 'storage', name: 'Lager', emoji: '📦', asset: 'images/lager-rot.webp',
    cost: { woodPlank: 15, stone: 5 }, buildTime: 6, isStorage: true, width: 3, height: 3,
    repairCost: { woodPlank: 8, stone: 3 },
    ruinAsset: 'images/ruine-quadrat.webp'
  },
  watchtower: {
    id: 'watchtower', name: 'Festung', emoji: '🏯', asset: 'images/wachturm-rot.webp',
    cost: { woodPlank: 30, stone: 60 }, buildTime: 10, expandsBorder: 15, width: 3, height: 3,
    maxWarriors: 5, beerSlots: 10,
    attackRadius: 20,
    // ⚠️ NEU: Festung ist jetzt ein Bogenschützen-Turm mit Drachenschutz
    hasArrowTower: true,
    arrowCapacity: 20,
    attackRange: 15,      // Etwas mehr Reichweite als die normale Bogenschussanlage
    fireInterval: 1000,
    hitChanceBase: 1.00,
    hitChancePerTile: 0.08, // Etwas präziser auf Distanz
    hitChanceMin: 0.10,
    dragonResistant: true,  // Kann einen Drachenschuss einstecken (Schaden wird in dragon.js behandelt)
    repairCost: { woodPlank: 15, stone: 30 },
    ruinAsset: 'images/ruine-quadrat.webp'
  },
  wachstube: {
    id: 'wachstube', name: 'Wachturm', emoji: '🛡️', asset: 'images/wachstube.webp',
    cost: { woodPlank: 10, stone: 20 }, buildTime: 6, expandsBorder: 10, width: 2, height: 3,
    maxWarriors: 3, beerSlots: 6,
    attackRadius: 15,
    repairCost: { woodPlank: 5, stone: 10 },
    ruinAsset: 'images/ruine-hoch.webp'
  },
  wachposten: {
    id: 'wachposten', name: 'Wachposten', emoji: '👁️', asset: 'images/wachposten.webp',
    cost: { woodPlank: 3 }, buildTime: 3, expandsBorder: 0, width: 2, height: 2,
    maxWarriors: 1, beerSlots: 1,
    attackRadius: 10,
    repairCost: { woodPlank: 2 },
    ruinAsset: 'images/ruine-quadrat.webp'
  },
  well: {
    id: 'well', name: 'Brunnen', emoji: '💧', asset: 'images/brunnen-rot.webp',
    cost: { stone: 3 }, buildTime: 4, width: 1, height: 1,
    requiresTerrain: 'grass',
    generatesResource: 'water',
    generatesAmount: 5,
    generatesInterval: 15,
    consumesFish: true,
    repairCost: { stone: 2 },
    ruinAsset: 'images/ruine-quadrat.webp'
  },
  brewery: {
    id: 'brewery', name: 'Bierbrauerei', emoji: '🍺', asset: 'images/bierbrauerei-rot.webp',
    cost: { woodPlank: 10, stone: 10 }, buildTime: 6, width: 3, height: 2,
    recipe: { inputs: { grain: 3, water: 5 }, output: 'beer', amount: 10 },
    recipeMaxStorage: { grain: 12, water: 20 },
    recipeInterval: 15,
    consumesFish: false,
    sound: 'audio/bierbrauerei.mp3',
    repairCost: { woodPlank: 5, stone: 5 },
    ruinAsset: 'images/ruine-quer.webp'
  },
  sawmill: {
    id: 'sawmill', name: 'Sägewerk', emoji: '🪚', asset: 'images/saegewerk-rot.webp',
    cost: { wood: 15, stone: 5 }, buildTime: 6, width: 3, height: 2,
    recipe: { inputs: { wood: 3 }, output: 'woodPlank', amount: 6 },
    recipeMaxStorage: { wood: 12 },
    recipeInterval: 15,
    consumesFish: false,
    sound: 'audio/saegen.mp3',
    repairCost: { wood: 8, stone: 3 },
    ruinAsset: 'images/ruine-quer.webp'
  },
  mill: {
    id: 'mill', name: 'Mühle', emoji: '🌬️',
    asset: 'images/muehle-rot1.webp',
    animationFrames: ['images/muehle-rot2.webp', 'images/muehle-rot3.webp'],
    animationInterval: 350,
    cost: { woodPlank: 5, stone: 15 }, buildTime: 8, width: 2.5, height: 3,
    recipe: { inputs: { grain: 5 }, output: 'flour', amount: 1 },
    recipeMaxStorage: { grain: 15 },
    recipeInterval: 15,
    consumesFish: false,
    sound: 'audio/windrad.mp3',
    repairCost: { woodPlank: 3, stone: 8 },
    ruinAsset: 'images/ruine-hoch.webp'
  },
  bakery: {
    id: 'bakery', name: 'Bäcker', emoji: '🥖', asset: 'images/baecker-rot.webp',
    animationFrames: ['images/baecker1-rot.webp', 'images/baecker2-rot.webp', 'images/baecker3-rot.webp'],
    animationInterval: 350,
    cost: { woodPlank: 8, stone: 8 }, buildTime: 8, width: 3, height: 2,
    recipe: { inputs: { flour: 1, wood: 3, water: 5 }, output: 'bread', amount: 10 },
    recipeMaxStorage: { flour: 3, wood: 9, water: 15 },
    recipeInterval: 12.5,
    consumesFish: false,
    repairCost: { woodPlank: 4, stone: 4 },
    ruinAsset: 'images/ruine-quer.webp'
  },
  arrowSmith: {
    id: 'arrowSmith', name: 'Pfeilschmiede', emoji: '🏹', asset: 'images/pfeilschmiede.webp',
    cost: { woodPlank: 25, stone: 20 }, buildTime: 6, width: 3, height: 2,
    recipe: { inputs: { wood: 2, stone: 1 }, output: 'arrows', amount: 5 },
    recipeMaxStorage: { wood: 10, stone: 5 },
    recipeInterval: 15,
    consumesFish: false,
    hasArrowStop: true,
    repairCost: { woodPlank: 13, stone: 10 },
    ruinAsset: 'images/ruine-quer.webp'
  },
  arrowTower: {
    id: 'arrowTower', name: 'Bogenschussanlage', emoji: '🎯', asset: 'images/bogenschussanlage.webp',
    cost: { woodPlank: 30, wood: 10 }, buildTime: 6, width: 2, height: 3,
    hasArrowTower: true,
    arrowCapacity: 20,
    attackRange: 10,
    fireInterval: 1000,
    hitChanceBase: 1.00,
    hitChancePerTile: 0.10,
    hitChanceMin: 0.10,
    consumesFish: false,
    repairCost: { woodPlank: 15, wood: 5 },
    ruinAsset: 'images/ruine-hoch.webp'
  },

  // === Futterkette ===
  feedMaker: {
    id: 'feedMaker', name: 'Futterhersteller', emoji: '🥣', asset: 'images/futterhersteller.webp',
    cost: { woodPlank: 30, stone: 10 }, buildTime: 6, width: 3, height: 2,
    recipe: { inputs: { fish: 5, grain: 5 }, output: 'feed', amount: 5 },
    recipeMaxStorage: { fish: 15, grain: 15 },
    recipeInterval: 30,
    consumesFish: false,
    repairCost: { woodPlank: 15, stone: 5 },
    ruinAsset: 'images/ruine-quer.webp'
  },
  pigFarm: {
    id: 'pigFarm', name: 'Schweinewirt', emoji: '🐷', asset: 'images/schweinehof.webp',
    animationFrames: [
      'images/schweinehof1.webp',
      'images/schweinehof2.webp',
      'images/schweinehof3.webp',
      'images/schweinehof4.webp'
    ],
    animationInterval: 800,
    cost: { woodPlank: 30, stone: 15 }, buildTime: 8, width: 3, height: 4,
    recipe: { inputs: { feed: 5, water: 5 }, output: 'pig', amount: 1 },
    recipeMaxStorage: { feed: 15, water: 15 },
    recipeInterval: 90,
    consumesFish: false,
    sound: 'audio/schwein.mp3',
    repairCost: { woodPlank: 15, stone: 8 },
    ruinAsset: 'images/ruine-schwein.webp'
  },
  butcher: {
    id: 'butcher', name: 'Schlachter', emoji: '🔪', asset: 'images/schlachthof.webp',
    cost: { woodPlank: 20, stone: 10 }, buildTime: 5, width: 2, height: 2,
    recipe: { inputs: { pig: 1 }, output: 'meat', amount: 25 },
    recipeMaxStorage: { pig: 5 },
    recipeInterval: 20,
    consumesFish: false,
    repairCost: { woodPlank: 10, stone: 5 },
    ruinAsset: 'images/ruine-quadrat.webp'
  },

  // ==========================================================
  // Räuberlager-Gebäude (nicht vom Spieler baubar)
  // ==========================================================
  raiderCastle: {
    id: 'raiderCastle', name: 'Räuberschloss', emoji: '🏴', asset: 'images/schloss2.webp',
    width: 3, height: 6,
    maxWarriors: 15,
    isRaiderBuilding: true,
    isRaiderCastle: true,
    ruinAsset: 'images/ruine-hoch.webp'
  },
  raiderWatchtower: {
    id: 'raiderWatchtower', name: 'Räuberturm', emoji: '🏯', asset: 'images/wachturm-blau.webp',
    width: 2, height: 2,
    maxWarriors: 5,
    isRaiderBuilding: true,
    hasArrowTower: true,
    attackRange: 10,
    fireInterval: 1000,
    hitChanceBase: 1.00,
    hitChancePerTile: 0.10,
    hitChanceMin: 0.10,
    ruinAsset: 'images/ruine-quadrat.webp'
  }
};
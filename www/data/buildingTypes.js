window.Game = window.Game || {};

Game.BUILDING_TYPES = {
  castle: {
    id: 'castle', name: 'Schloss', emoji: '🏰', asset: 'images/schloss.webp',
    width: 3, height: 6, isHouse: true, maxWarriors: 5, maxResidents: 8,
    beerSlots: 10,
    attackRadius: 10
  },
  house: {
    id: 'house', name: 'Haus', emoji: '🏠', asset: 'images/haus-rot.webp',
    cost: { woodPlank: 5, stone: 5 }, buildTime: 5, isHouse: true, width: 2, height: 2, maxResidents: 5
  },
  lumberjack: {
    id: 'lumberjack', name: 'Holzfäller', emoji: '🪓', asset: 'images/holzfaeller-rot.webp',
    cost: { wood: 5 }, buildTime: 4, produces: 'wood', width: 2, height: 2, consumesFish: true,
    sound: 'audio/axt.mp3'
  },
  quarry: {
    id: 'quarry', name: 'Steinmetz', emoji: '⛏️', asset: 'images/steinmetz-rot.webp',
    cost: { woodPlank: 5 }, buildTime: 4, produces: 'stone', width: 2, height: 2, consumesFish: true,
    sound: 'audio/steinmetz.mp3'
  },
  farm: {
    id: 'farm', name: 'Bauer', emoji: '🌾', asset: 'images/bauer-rot.webp',
    cost: { woodPlank: 5, stone: 3 }, buildTime: 4, produces: 'grain', width: 2, height: 2, consumesFish: true,
    sound: 'audio/bauernhof.mp3'
  },
  fisher: {
    id: 'fisher', name: 'Fischerhütte', emoji: '🎣', asset: 'images/fischerhuette-rot.webp',
    cost: { woodPlank: 3 }, buildTime: 4, produces: 'fish', width: 2, height: 2, consumesFish: false,
    sound: 'audio/fischerhuette.mp3'
  },
  storage: {
    id: 'storage', name: 'Lager', emoji: '📦', asset: 'images/lager-rot.webp',
    cost: { woodPlank: 15, stone: 5 }, buildTime: 6, isStorage: true, width: 2, height: 2
  },
  watchtower: {
    id: 'watchtower', name: 'Festung', emoji: '🏯', asset: 'images/wachturm-rot.webp',
    cost: { woodPlank: 30, stone: 60 }, buildTime: 10, expandsBorder: 15, width: 3, height: 3,
    maxWarriors: 5, beerSlots: 10,
    attackRadius: 20
  },
  wachstube: {
    id: 'wachstube', name: 'Wachstube', emoji: '🛡️', asset: 'images/wachstube.webp',
    cost: { woodPlank: 10, stone: 20 }, buildTime: 6, expandsBorder: 10, width: 2, height: 3,
    maxWarriors: 3, beerSlots: 6,
    attackRadius: 15
  },
  wachposten: {
    id: 'wachposten', name: 'Wachposten', emoji: '👁️', asset: 'images/wachposten.webp',
    cost: { woodPlank: 3 }, buildTime: 3, expandsBorder: 0, width: 2, height: 2,
    maxWarriors: 1, beerSlots: 1,
    attackRadius: 10
  },
  well: {
    id: 'well', name: 'Brunnen', emoji: '💧', asset: 'images/brunnen-rot.webp',
    cost: { stone: 3 }, buildTime: 4, width: 1, height: 1,
    requiresTerrain: 'grass',
    generatesResource: 'water',
    generatesAmount: 5,
    generatesInterval: 30,
    consumesFish: true
  },
  brewery: {
    id: 'brewery', name: 'Bierbrauerei', emoji: '🍺', asset: 'images/bierbrauerei-rot.webp',
    cost: { woodPlank: 10, stone: 10 }, buildTime: 6, width: 3, height: 2,
    recipe: { inputs: { grain: 3, water: 1 }, output: 'beer', amount: 1 },
    recipeMaxStorage: { grain: 12, water: 4 },
    recipeInterval: 15,
    consumesFish: false,
    sound: 'audio/bierbrauerei.mp3'
  },
  sawmill: {
    id: 'sawmill', name: 'Sägewerk', emoji: '🪚', asset: 'images/saegewerk-rot.webp',
    cost: { wood: 15, stone: 5 }, buildTime: 6, width: 3, height: 2,
    recipe: { inputs: { wood: 3 }, output: 'woodPlank', amount: 6 },
    recipeMaxStorage: { wood: 12 },
    recipeInterval: 15,
    consumesFish: false,
    sound: 'audio/saegen.mp3'
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
    sound: 'audio/windrad.mp3'
  },
  bakery: {
    id: 'bakery', name: 'Bäcker', emoji: '🥖', asset: 'images/baecker-rot.webp',
    cost: { woodPlank: 8, stone: 8 }, buildTime: 8, width: 3, height: 2,
    recipe: { inputs: { flour: 1, wood: 3, water: 5 }, output: 'bread', amount: 10 },
    recipeMaxStorage: { flour: 3, wood: 9, water: 15 },
    recipeInterval: 12.5,
    consumesFish: false
  }
};
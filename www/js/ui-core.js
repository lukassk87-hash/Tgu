window.Game = window.Game || {};

Game.UI = Game.UI || {};

Game.UI.resourceImages = {
  wood: 'images/icon_baum.webp',
  stone: 'images/icon_stein.webp',
  grain: 'images/icon_getreide.webp',
  fish: 'images/icon_fisch.webp',
  water: 'images/icon_wasser.webp',
  beer: 'images/icon_bier.webp',
  woodPlank: 'images/icon_bretter.webp',
  flour: 'images/icon_mehl.webp',
  bread: 'images/icon_brot.webp',
  arrows: 'images/icon_pfeil.webp',
  feed: 'images/icon_futter.webp',
  pig: 'images/icon_schwein.webp',
  meat: 'images/icon_fleisch.webp',
  dragonBone: 'images/drachenknochen.webp',
  raiderHerb: 'images/icon_raeuberkraut.webp',
  antibiotics: 'images/icon_antibiotika.webp'
};

Game.UI.resourceNames = {
  wood: 'Holz', stone: 'Stein', grain: 'Weizen', fish: 'Fisch',
  water: 'Wasser', beer: 'Bier', woodPlank: 'Bretter', flour: 'Mehl', bread: 'Brot',
  arrows: 'Pfeile',
  feed: 'Futter', pig: 'Schwein', meat: 'Fleisch',
  dragonBone: 'Drachenknochen',
  raiderHerb: 'Räuberkraut',
  antibiotics: 'Antibiotika'
};

Game.UI.resourceIcon = function (key) {
  if (this.resourceImages[key]) {
    return `<img src="${this.resourceImages[key]}" style="width:18px;height:18px;vertical-align:middle;margin-right:4px;object-fit:contain;" onerror="this.style.display='none'">`;
  }
  const fallbacks = {
    water: '💧', beer: '🍺', woodPlank: '🪵', flour: '🌾', bread: '🍞', arrows: '🏹',
    feed: '🥣', pig: '🐷', meat: '🥩', dragonBone: '🦴',
    raiderHerb: '🌿', antibiotics: '💊'
  };
  return `<span style="display:inline-block;width:18px;text-align:center;margin-right:4px;">${fallbacks[key] || '•'}</span>`;
};

Game.UI._getLiveWinChances = function (v) {
  if (!v) return { zombie: 0.60, raider: 0.60 };

  const level = v.warriorLevel || 1;
  const beerBuff = !!v.beerBuff;

  const levelBonus = (level - 1) * 0.05;

  let zombieChance = 0.60 + levelBonus;
  if (beerBuff) zombieChance += 0.15;

  let raiderChance = 0.60 + levelBonus;

  return {
    zombie: Math.min(1.0, zombieChance),
    raider: Math.min(1.0, raiderChance)
  };
};
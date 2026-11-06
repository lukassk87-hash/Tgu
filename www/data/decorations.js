window.Game = window.Game || {};

/**
 * Deco-Objekte, die auf der Karte verteilt werden.
 *
 * Jeder Eintrag hat:
 *   id       – eindeutiger Schlüssel
 *   asset    – Pfad zum Webp
 *   width    – Breite in Baufeldern (Standard 1)
 *   height   – Höhe in Baufeldern (Standard 1)
 *   frequency – Häufigkeit (Standard 5). Höhere Zahl = öfter platziert.
 *   terrain  – 'grass' (Standard) | 'water' | null (egal)
 *
 * Neue Deco-Typen einfach hier hinzufügen – Mapgen, World und Renderer
 * nehmen sie automatisch auf.
 */
Game.DECORATIONS = {
  deco1: {
    id: 'deco1',
    asset: 'images/deco1.webp',
    width: 1.5,
    height: 1.5,
    frequency: 20,
    terrain: 'grass'
  },
  deco2: {
    id: 'deco2',
    asset: 'images/deco/deco2.webp',
    width: 1.2,
    height: 1.2,
    frequency: 50,
    terrain: 'grass'
  },
  deco3: {
    id: 'deco3',
    asset: 'images/deco/deco3.webp',
    width: 0.6,
    height: 0.6,
    frequency: 50,
    terrain: 'grass'
  },
  deco4: {
    id: 'deco4',
    asset: 'images/deco/deco4.webp',
    width: 0.8,
    height: 0.8,
    frequency: 50,
    terrain: 'grass'
  },
  deco5: {
    id: 'deco5',
    asset: 'images/deco/deco5.webp',
    width: 1,
    height: 1,
    frequency: 50,
    terrain: 'grass'
  },
  deco6: {
    id: 'deco6',
    asset: 'images/deco/deco6.webp',
    width: 0.25,
    height: 0.25,
    frequency: 10,
    terrain: 'water'
  },
  deco7: {
    id: 'deco7',
    asset: 'images/deco/deco7.webp',
    width: 0.3,
    height: 0.3,
    frequency: 150,
    terrain: 'water'
  }
  

  // Beispiel Wasser-Deko:
  // seerose: {
  //   id: 'seerose',
  //   asset: 'images/deco/seerose.webp',
  //   width: 1,
  //   height: 1,
  //   frequency: 3,
  //   terrain: 'water'
  // }
};

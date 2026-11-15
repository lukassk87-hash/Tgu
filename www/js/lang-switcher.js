window.Game = window.Game || {};

Game.LangSwitcher = {
  init() {
    const langButtons = document.querySelectorAll('.lang-btn');
    
    // Gespeicherte Sprache aus dem Browser laden (falls vorhanden)
    const savedLang = localStorage.getItem('gameLanguage');
    if (savedLang && ['de', 'en', 'fr', 'es'].includes(savedLang)) {
      Game.Lang.current = savedLang;
    }

    // Klick-Events auf die Fahnen-Buttons binden
    if (langButtons.length > 0) {
      langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          this.setLanguage(btn.dataset.lang);
        });
      });
    }

    // Initial die richtige Fahne markieren und Texte übersetzen
    this.updateActiveButton();
    this.updateUI();
  },

  setLanguage(langCode) {
    if (!['de', 'en', 'fr', 'es'].includes(langCode)) return;
    if (Game.Lang.current === langCode) return; // Nichts tun, wenn schon aktiv
    
    Game.Lang.current = langCode;
    localStorage.setItem('gameLanguage', langCode); // Sprache speichern
    
    this.updateActiveButton();
    this.updateUI();
  },

  // Hebt den aktuell ausgewählten Button hervor
  updateActiveButton() {
    const langButtons = document.querySelectorAll('.lang-btn');
    langButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === Game.Lang.current);
    });
  },

  // Findet alle Elemente im Dokument, die data-i18n oder data-i18n-placeholder haben
  updateUI() {
    // 1. Normale Texte übersetzen (mit innerHTML für <b>, <br> etc.)
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key && Game.Lang[key]) {
        el.innerHTML = Game.Lang.t(key);
      }
    });

    // 2. Platzhalter (Placeholder) in Eingabefeldern übersetzen
    const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
    placeholderElements.forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key && Game.Lang[key]) {
        el.placeholder = Game.Lang.t(key);
      }
    });

    // 3. Ressourcen-Namen im UI-Modul aktualisieren
    if (Game.UI && Game.UI.updateResourceNames) {
      Game.UI.updateResourceNames();
    }
  }
};
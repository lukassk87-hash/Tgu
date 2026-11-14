window.Game = window.Game || {};

Game.Popups = Game.Popups || {};

Game.Popups.plagueHtml = `
  <div id="pigPlaguePopup" class="overlay hidden">
    <div class="panel" style="border: 2px solid #a86f33; max-width: 420px;">
      <h2 style="color: #d4a866; display: flex; align-items: center; justify-content: center; gap: 10px;">
        <img src="images/schwein-krank.webp" alt="" style="width: 56px; height: 56px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.7));">
        Schweinepest ausgebrochen!
      </h2>
      <p style="color: var(--parchment-dim); font-size: 14px; line-height: 1.6;">
        Eine Seuche hat die Schweinebestände befallen. Alle Schweinewirte stellen die Arbeit für <b>3 Minuten</b> ein und die Hälfte deines Fleischvorrats ist vernichtet.
      </p>
      <div style="display: flex; gap: 10px; margin-top: 14px;">
        <button id="pigPlagueOk" class="primary" style="flex: 1;">Verstanden</button>
      </div>
    </div>
  </div>

  <div id="ratPlaguePopup" class="overlay hidden">
    <div class="panel" style="border: 2px solid #6b6b6b; max-width: 420px;">
      <h2 style="color: #c0c0c0; display: flex; align-items: center; justify-content: center; gap: 10px;">
        <img src="images/ratte.webp" alt="" style="width: 56px; height: 56px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.7));">
        Rattenplage ausgebrochen!
      </h2>
      <p style="color: var(--parchment-dim); font-size: 14px; line-height: 1.6;">
        Die Ratten haben sich über die Vorräte hergemacht. Die Hälfte deines Brotbestandes ist vernichtet und die Bäcker produzieren für <b>5 Minuten</b> nur noch die Hälfte.
      </p>
      <div style="display: flex; gap: 10px; margin-top: 14px;">
        <button id="ratPlagueOk" class="primary" style="flex: 1;">Verstanden</button>
      </div>
    </div>
  </div>

  <div id="droughtPopup" class="overlay hidden">
    <div class="panel" style="border: 2px solid #e6a817; max-width: 420px;">
      <h2 style="color: #ffcc00; display: flex; align-items: center; justify-content: center; gap: 10px;">
        <img src="images/sonne.webp" alt="" style="width: 56px; height: 56px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.7));">
        Dürre ausgebrochen!
      </h2>
      <p style="color: var(--parchment-dim); font-size: 14px; line-height: 1.6;">
        Die Sonne brennt unbarmherzig auf die Felder. Alle Bauern können für <b>6 Minuten</b> kein Getreide produzieren.
      </p>
      <div style="display: flex; gap: 10px; margin-top: 14px;">
        <button id="droughtOk" class="primary" style="flex: 1;">Verstanden</button>
      </div>
    </div>
  </div>

  <div id="infectedMeatPopup" class="overlay hidden">
    <div class="panel" style="border: 2px solid #7ad07a; max-width: 420px;">
      <h2 style="color: #7ad07a; display: flex; align-items: center; justify-content: center; gap: 10px;">
        <img src="images/zombie.webp" alt="" style="width: 56px; height: 56px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.7));">
        Infiziertes Fleisch!
      </h2>
      <p style="color: var(--parchment-dim); font-size: 14px; line-height: 1.6;">
        Das Schweinefleisch wurde beim letzten Zombieangriff mit Zombiefleisch kontaminiert. 
        Dein gesamter Fleischvorrat ist verloren. Die Schlachter müssen <b>180 Sekunden</b> pausieren, um ihre Gebäude zu reinigen.
        <br><br>
        <b style="color: #ff8a5c;">In den nächsten 60 Sekunden werden alle 5 Sekunden 2 Einwohner zu Zombies!</b>
      </p>
      <div style="display: flex; gap: 10px; margin-top: 14px;">
        <button id="infectedMeatOk" class="primary" style="flex: 1;">Verstanden</button>
      </div>
    </div>
  </div>

  <div id="pandemicPopup" class="overlay hidden">
    <div class="panel pandemic-panel" style="max-width: 460px;">

      <div style="display: flex; align-items: center; justify-content: center; gap: 14px; margin-bottom: 14px;">
        <img src="images/krank.webp" alt="Krank" style="width: 56px; height: 56px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.7));">
        <h2 style="margin: 0; text-align: left; color: var(--sick-green-light);">
          Pandemie ausgebrochen
        </h2>
      </div>

      <p style="color: var(--parchment); font-size: 14px; line-height: 1.6;">
        Das Wasser war verseucht. Viele Einwohner sind krank geworden.
        In den Arztpraxen herrscht Ausnahmezustand – sie sind überfüllt.
      </p>

      <button id="pandemicOk" class="primary" style="width: 100%; margin-top: 14px; background: linear-gradient(180deg, var(--green-ok-light) 0%, var(--sick-green) 100%);">
        Verstanden
      </button>

    </div>
  </div>
`;
window.Game = window.Game || {};

Game.Pause = (function () {
  let _paused = false;
  let _tickerRef = null;
  let _resumeCb = null;

  function bindTicker(ticker) { _tickerRef = ticker; }
  function isPaused() { return _paused; }

function pause() {
  if (_paused) return;
  _paused = true;
  Game.Clock.pause();
  if (_tickerRef) _tickerRef.pause();
  if (window.audioManager) window.audioManager.pauseAll();
  showOverlay();
}

function resume() {
  if (!_paused) return;
  _paused = false;
  hideOverlay();
  Game.Clock.resume();
  if (_tickerRef) _tickerRef.resume();
  if (window.audioManager) window.audioManager.resumeAll();
  if (_resumeCb) _resumeCb();
}

  function showOverlay() {
    let el = document.getElementById('pauseOverlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'pauseOverlay';
      el.className = 'overlay';
      el.innerHTML =
        '<div class="panel" style="text-align:center;">' +
          '<h2 data-i18n="pause_title">Pausiert</h2>' +
          '<p data-i18n="pause_reason" style="color:var(--parchment-dim);font-size:14px;margin-bottom:16px;">App war im Hintergrund</p>' +
          '<button id="pauseResumeBtn" class="primary" data-i18n="pause_resume">Fortsetzen</button>' +
        '</div>';
      document.body.appendChild(el);
      document.getElementById('pauseResumeBtn').addEventListener('click', resume);
      if (Game.LangSwitcher) Game.LangSwitcher.updateUI();
    }
    el.classList.remove('hidden');
  }

  function hideOverlay() {
    const el = document.getElementById('pauseOverlay');
    if (el) el.classList.add('hidden');
  }

  function initAndroidListeners() {
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
      const App = window.Capacitor.Plugins.App;
      App.addListener('appStateChange', ({ isActive }) => {
        if (!isActive) pause();
      });
      App.addListener('pause', () => pause());
    }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) pause();
    });
  }

  return {
    bindTicker,
    isPaused,
    pause,
    resume,
    onResume: (cb) => { _resumeCb = cb; },
    initAndroidListeners
  };
})();
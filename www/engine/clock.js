window.Game = window.Game || {};

Game.Clock = (function () {
  const _origNow = performance.now.bind(performance);
  let _paused = false;
  let _pausedAt = 0;
  let _pausedTotal = 0;

  function now() {
    if (_paused) return _pausedAt - _pausedTotal;
    return _origNow() - _pausedTotal;
  }

  try {
    Object.defineProperty(performance, 'now', {
      value: now, configurable: true, writable: true
    });
  } catch (e) {
    try { performance.now = now; } catch (e2) {}
  }

  function pause() {
    if (_paused) return;
    _paused = true;
    _pausedAt = _origNow();
  }
  function resume() {
    if (!_paused) return;
    _pausedTotal += _origNow() - _pausedAt;
    _paused = false;
    _pausedAt = 0;
  }
  function isPaused() { return _paused; }

  return { now, pause, resume, isPaused };
})();
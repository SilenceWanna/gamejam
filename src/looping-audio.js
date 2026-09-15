const LOOP_CHECK_INTERVAL = 30;

function clampVolume(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

export function loopCrossfadeDuration(duration) {
  const seconds = Math.max(0, Number(duration) || 0);
  if (seconds <= 0) return 0;
  if (seconds <= 3) return Math.min(0.28, Math.max(0.08, seconds * 0.2));
  if (seconds <= 15) return Math.min(0.75, seconds * 0.1);
  return Math.min(4, Math.max(1, seconds * 0.03));
}

function clockNow() {
  return typeof performance === 'undefined' ? Date.now() : performance.now();
}

function createNativeLoop(source) {
  if (!source || typeof Audio === 'undefined') return null;
  const audio = new Audio(source);
  audio.preload = 'auto';
  audio.loop = true;
  return audio;
}

class CrossfadeLoopAudio {
  constructor(source) {
    this.source = source;
    this._src = source;
    this._volume = 1;
    this._loop = true;
    this._paused = true;
    this._disposed = false;
    this._timer = null;
    this._crossfadePending = false;
    this._crossfadeStartedAt = null;
    this._crossfadeSeconds = 0;
    this._currentMix = 1;
    this._nextMix = 0;
    this._players = [new Audio(source), new Audio(source)];
    [this._current, this._next] = this._players;

    for (const player of this._players) {
      player.preload = 'auto';
      player.loop = false;
      player.addEventListener('ended', () => this._handleEnded(player));
      player.load?.();
    }
    this._applyVolumes();
  }

  get src() { return this._src; }

  set src(value) {
    const source = String(value ?? '');
    if (source === this._src) return;
    this._src = source;
    if (!source) {
      this._disposed = true;
      this.pause();
    }
    for (const player of this._players) {
      player.src = source;
      if (!source) player.load?.();
    }
  }

  get volume() { return this._volume; }

  set volume(value) {
    this._volume = clampVolume(value);
    this._applyVolumes();
  }

  get loop() { return this._loop; }

  set loop(value) { this._loop = Boolean(value); }

  get paused() { return this._paused; }

  get ended() { return this._disposed ? true : !this._loop && this._current.ended; }

  get preload() { return 'auto'; }

  set preload(value) {
    for (const player of this._players) player.preload = value;
  }

  _applyVolumes() {
    this._current.volume = clampVolume(this._volume * this._currentMix);
    this._next.volume = clampVolume(this._volume * this._nextMix);
  }

  _startTimer() {
    if (this._timer !== null || this._paused || this._disposed) return;
    this._timer = window.setInterval(() => this._tick(), LOOP_CHECK_INTERVAL);
  }

  _stopTimer() {
    if (this._timer !== null) window.clearInterval(this._timer);
    this._timer = null;
  }

  _tick() {
    if (this._paused || this._disposed || !this._loop) return;
    const duration = Number(this._current.duration);
    if (!Number.isFinite(duration) || duration <= 0 || this._crossfadeStartedAt !== null) {
      this._updateCrossfade();
      return;
    }
    const fadeSeconds = loopCrossfadeDuration(duration);
    if (duration - this._current.currentTime <= fadeSeconds) this._beginCrossfade(fadeSeconds);
  }

  _beginCrossfade(fadeSeconds) {
    if (this._crossfadePending || this._crossfadeStartedAt !== null || this._paused || this._disposed) return;
    this._crossfadePending = true;
    this._crossfadeSeconds = Math.max(0.01, fadeSeconds);
    this._next.currentTime = 0;
    this._currentMix = 1;
    this._nextMix = 0;
    this._applyVolumes();
    let playback;
    try {
      playback = this._next.play();
    } catch {
      this._crossfadePending = false;
      return;
    }
    Promise.resolve(playback).then(() => {
      if (this._paused || this._disposed || !this._crossfadePending) {
        this._next.pause();
        return;
      }
      this._crossfadePending = false;
      this._crossfadeStartedAt = clockNow();
    }).catch(() => { this._crossfadePending = false; });
  }

  _updateCrossfade() {
    if (this._crossfadeStartedAt === null) return;
    const ratio = Math.max(0, Math.min(1,
      (clockNow() - this._crossfadeStartedAt) / (this._crossfadeSeconds * 1000)));
    this._currentMix = Math.cos(ratio * Math.PI / 2);
    this._nextMix = Math.sin(ratio * Math.PI / 2);
    this._applyVolumes();
    if (ratio >= 1) this._finishCrossfade();
  }

  _finishCrossfade() {
    const previous = this._current;
    this._current = this._next;
    this._next = previous;
    this._next.pause();
    try { this._next.currentTime = 0; } catch {}
    this._crossfadePending = false;
    this._crossfadeStartedAt = null;
    this._currentMix = 1;
    this._nextMix = 0;
    this._applyVolumes();
  }

  _handleEnded(player) {
    if (this._disposed || this._paused || !this._loop || player !== this._current) return;
    if (this._crossfadeStartedAt !== null || (!this._next.paused && this._crossfadePending)) {
      this._finishCrossfade();
      return;
    }
    this._beginCrossfade(0.01);
  }

  play() {
    if (this._disposed || !this._src) return Promise.resolve();
    this._paused = false;
    let playback;
    try {
      playback = this._current.play();
    } catch (error) {
      return Promise.reject(error);
    }
    return Promise.resolve(playback).then(() => {
      if (!this._paused && !this._disposed) this._startTimer();
    });
  }

  pause() {
    this._paused = true;
    this._stopTimer();
    for (const player of this._players) player.pause();
    if (this._crossfadeStartedAt !== null || this._crossfadePending) {
      const useIncoming = this._nextMix >= this._currentMix;
      if (useIncoming) [this._current, this._next] = [this._next, this._current];
      try { this._next.currentTime = 0; } catch {}
      this._crossfadePending = false;
      this._crossfadeStartedAt = null;
      this._currentMix = 1;
      this._nextMix = 0;
      this._applyVolumes();
    }
  }
}

export function createSeamlessLoopingAudio(source) {
  if (!source || typeof Audio === 'undefined') return null;
  // Unit tests and non-browser runtimes retain the native element contract.
  if (typeof window === 'undefined') return createNativeLoop(source);
  return new CrossfadeLoopAudio(source);
}

import { getBackgroundMusicVolume } from './music.js?v=20260915-audio-layout-1-seamless-loops-1';
import { createSeamlessLoopingAudio } from './looping-audio.js?v=20260915-seamless-loops-1';

let activeAmbiences = new Map();
let fadeTimer = null;
let retryArmed = false;
let menuPaused = false;
let settingsPaused = false;
let menuEventsBound = false;
const CROSSFADE_DURATION = 900;

function normalizeTracks(value) {
  const values = Array.isArray(value) ? value : [value];
  const tracks = values
    .filter(Boolean)
    .map((track) => (typeof track === 'string' ? { source: track, loop: true } : track))
    .filter((track) => track?.source);
  return [...new Map(tracks.map((track) => [track.source, track])).values()];
}

export function ambienceTracksForScene(scene, state = {}) {
  if (!scene) return [];
  if (scene.kind === 'animation' && Array.isArray(scene.shots)) {
    const saved = state.animationProgress?.[scene.id];
    const index = Number.isFinite(saved) ? saved : Number(saved?.index ?? 0);
    return normalizeTracks(scene.shots[Math.max(0, index)]?.ambience ?? scene.ambience);
  }
  if (scene.kind === 'minigame') {
    const progress = state.minigames?.[scene.id];
    const stage = progress?.stage ?? 'intro';
    if (stage === 'intro' || stage === 'outro') {
      const lines = stage === 'intro' ? scene.introLines : scene.outroLines;
      const index = Math.max(0, Number(progress?.[stage === 'intro' ? 'introIndex' : 'outroIndex'] ?? 0));
      return normalizeTracks(lines?.[index]?.ambience ?? scene.ambience);
    }
  }
  return normalizeTracks(scene.ambience);
}

// Retained for callers that only need the primary ambience bed.
export function ambienceForScene(scene, state = {}) {
  return ambienceTracksForScene(scene, state)[0] ?? null;
}

export function getAmbienceVolume(settings = {}, track = {}) {
  const baseVolume = Math.max(0, Math.min(1, Number(track.baseVolume ?? 1)));
  return getBackgroundMusicVolume(settings) * baseVolume;
}

function playableEntries() {
  return [...activeAmbiences.values()].filter((entry) => entry.targetVolume > 0);
}

function armPlaybackRetry() {
  if (retryArmed || !playableEntries().length) return;
  retryArmed = true;
  const retry = () => {
    retryArmed = false;
    if (menuPaused || settingsPaused) return;
    for (const { audio } of playableEntries()) audio.play().catch(armPlaybackRetry);
  };
  window.addEventListener('pointerdown', retry, { once: true });
  window.addEventListener('keydown', retry, { once: true });
}

function disposeAudio(audio) {
  if (!audio) return;
  audio.pause();
  audio.src = '';
}

function clearFade() {
  if (fadeTimer !== null) window.clearInterval(fadeTimer);
  fadeTimer = null;
}

function disposeSilentEntries() {
  for (const [source, entry] of activeAmbiences) {
    if (entry.targetVolume > 0) continue;
    disposeAudio(entry.audio);
    activeAmbiences.delete(source);
  }
}

function beginCrossfade(nextTracks, settings) {
  const nextBySource = new Map(nextTracks.map((track) => [track.source, track]));
  const sameSources = nextBySource.size === activeAmbiences.size
    && [...nextBySource.keys()].every((source) => activeAmbiences.has(source));

  if (sameSources && fadeTimer === null) {
    for (const [source, track] of nextBySource) {
      const entry = activeAmbiences.get(source);
      entry.track = track;
      entry.targetVolume = getAmbienceVolume(settings, track);
      entry.audio.loop = track.loop !== false;
      entry.audio.volume = entry.targetVolume;
      if (!menuPaused && !settingsPaused && entry.audio.paused && !entry.audio.ended) {
        entry.audio.play().catch(armPlaybackRetry);
      }
    }
    return;
  }

  clearFade();
  if (typeof Audio !== 'undefined') {
    for (const [source, track] of nextBySource) {
      if (activeAmbiences.has(source)) continue;
      const audio = track.loop === false ? new Audio(source) : createSeamlessLoopingAudio(source);
      if (!audio) continue;
      audio.loop = track.loop !== false;
      audio.volume = 0;
      activeAmbiences.set(source, { audio, track, targetVolume: 0 });
    }
  }

  const transitions = [];
  for (const [source, entry] of activeAmbiences) {
    const track = nextBySource.get(source);
    entry.track = track ?? entry.track;
    entry.audio.loop = entry.track.loop !== false;
    const targetVolume = track ? getAmbienceVolume(settings, track) : 0;
    entry.targetVolume = targetVolume;
    transitions.push({ entry, startVolume: entry.audio.volume, targetVolume });
    if (!menuPaused && !settingsPaused) entry.audio.play().catch(armPlaybackRetry);
  }

  if (!transitions.some(({ startVolume, targetVolume }) => startVolume !== targetVolume)) {
    disposeSilentEntries();
    return;
  }

  let elapsed = 0;
  fadeTimer = window.setInterval(() => {
    if (menuPaused || settingsPaused) return;
    elapsed = Math.min(CROSSFADE_DURATION, elapsed + 40);
    const ratio = elapsed / CROSSFADE_DURATION;
    for (const { entry, startVolume, targetVolume } of transitions) {
      entry.audio.volume = startVolume + (targetVolume - startVolume) * ratio;
    }
    if (ratio < 1) return;
    clearFade();
    disposeSilentEntries();
  }, 40);
}

export function pauseAmbience() {
  menuPaused = true;
  for (const { audio } of activeAmbiences.values()) audio.pause();
}

export function resumeAmbience() {
  menuPaused = false;
  if (settingsPaused) return;
  for (const { audio } of playableEntries()) {
    if (!audio.ended) audio.play().catch(armPlaybackRetry);
  }
}

export function bindAmbienceToMenu() {
  if (menuEventsBound || typeof window === 'undefined') return;
  menuEventsBound = true;
  window.addEventListener('game:menu-open', pauseAmbience);
  window.addEventListener('game:menu-close', resumeAmbience);
}

export function syncAmbience(scene, state = {}) {
  const tracks = ambienceTracksForScene(scene, state);
  if (scene?.kind === 'settings') {
    settingsPaused = true;
    for (const { audio } of activeAmbiences.values()) audio.pause();
    return;
  }
  settingsPaused = false;
  beginCrossfade(tracks, state.settings);
}

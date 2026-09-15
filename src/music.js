import { createSeamlessLoopingAudio } from './looping-audio.js?v=20260915-seamless-loops-1';

const TRACKS = Object.freeze({
  he: { source: 'assets/audio/music/BGM_HE_ENDING_THEME_v01.wav', loop: true },
  be: { source: 'assets/audio/music/BGM_BE_ENDING_THEME_v01.wav', loop: true },
  deduction: { source: 'assets/audio/music/BGM_MIA_DEDUCTION_v01.wav', loop: true },
  investigation: { source: 'assets/audio/music/BGM_MIA_MEMORY_INVESTIGATION_v01.wav', loop: true },
  act3Review: { source: 'assets/audio/music/BGM_AYAO_MEMORY_SAD_v01.wav', loop: true },
});

let activeMusic = null;
let activeSource = null;
let fadingMusic = null;
let fadeTimer = null;
let retryArmed = false;
let menuPaused = false;
let settingsPaused = false;
let menuEventsBound = false;
let targetVolume = 1;
const CROSSFADE_DURATION = 900;

export function getBackgroundMusicVolume(settings = {}) {
  const master = Math.max(0, Math.min(100, Number(settings.master ?? 100))) / 100;
  const background = Math.max(0, Math.min(100, Number(settings.background ?? 100))) / 100;
  return master * background;
}

export function musicForScene(scene) {
  if (!scene) return null;
  if (scene.id === 'act3_evidence' || /^act3_review_/.test(scene.id)) return TRACKS.act3Review;
  if (scene.kind === 'investigation') return TRACKS.investigation;
  if (scene.kind === 'deduction') return TRACKS.deduction;
  if ((scene.kind === 'animation' && /^he_/.test(scene.id)) || scene.id === 'ending_he') return TRACKS.he;
  if ((scene.kind === 'animation' && /^be_/.test(scene.id)) || scene.id === 'ending_be') return TRACKS.be;
  return null;
}

function armPlaybackRetry() {
  if (retryArmed || !activeMusic) return;
  retryArmed = true;
  const retry = () => {
    retryArmed = false;
    if (!menuPaused && !settingsPaused) activeMusic?.play().catch(() => {});
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
  if (fadingMusic && fadingMusic !== activeMusic) disposeAudio(fadingMusic);
  fadingMusic = null;
}

function beginCrossfade(nextMusic, nextSource) {
  const previous = activeMusic ?? fadingMusic;
  if (!activeMusic && previous === fadingMusic) fadingMusic = null;
  clearFade();
  activeMusic = nextMusic;
  activeSource = nextSource;
  fadingMusic = previous && previous !== nextMusic ? previous : null;

  const previousVolume = fadingMusic?.volume ?? 0;
  if (activeMusic) activeMusic.volume = 0;
  if (!menuPaused && !settingsPaused) {
    activeMusic?.play().catch(armPlaybackRetry);
    fadingMusic?.play().catch(() => {});
  }

  let elapsed = 0;
  fadeTimer = window.setInterval(() => {
    if (menuPaused || settingsPaused) return;
    elapsed = Math.min(CROSSFADE_DURATION, elapsed + 40);
    const ratio = elapsed / CROSSFADE_DURATION;
    if (activeMusic) activeMusic.volume = targetVolume * ratio;
    if (fadingMusic) fadingMusic.volume = previousVolume * (1 - ratio);
    if (ratio < 1) return;
    if (fadingMusic) disposeAudio(fadingMusic);
    fadingMusic = null;
    window.clearInterval(fadeTimer);
    fadeTimer = null;
  }, 40);
}

export function stopBackgroundMusic() {
  clearFade();
  disposeAudio(activeMusic);
  activeMusic = null;
  activeSource = null;
}

export function pauseBackgroundMusic() {
  menuPaused = true;
  activeMusic?.pause();
  fadingMusic?.pause();
}

export function resumeBackgroundMusic() {
  menuPaused = false;
  if (settingsPaused) return;
  if (activeMusic && !activeMusic.ended) activeMusic.play().catch(armPlaybackRetry);
  if (fadingMusic && !fadingMusic.ended) fadingMusic.play().catch(() => {});
}

export function bindBackgroundMusicToMenu() {
  if (menuEventsBound || typeof window === 'undefined') return;
  menuEventsBound = true;
  window.addEventListener('game:menu-open', pauseBackgroundMusic);
  window.addEventListener('game:menu-close', resumeBackgroundMusic);
}

export function syncBackgroundMusic(scene, settings) {
  targetVolume = getBackgroundMusicVolume(settings);
  if (scene?.kind === 'settings') {
    settingsPaused = true;
    activeMusic?.pause();
    fadingMusic?.pause();
    return;
  }
  settingsPaused = false;
  const track = musicForScene(scene);
  if (!track) {
    if (activeMusic || fadingMusic) beginCrossfade(null, null);
    return;
  }

  if (activeMusic && activeSource === track.source) {
    activeMusic.loop = track.loop;
    if (fadeTimer === null) activeMusic.volume = targetVolume;
    if (!menuPaused && activeMusic.paused && !activeMusic.ended) activeMusic.play().catch(armPlaybackRetry);
    return;
  }

  const audio = createSeamlessLoopingAudio(track.source);
  if (!audio) return;
  audio.loop = track.loop;
  beginCrossfade(audio, track.source);
}

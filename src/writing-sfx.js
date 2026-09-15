import { playRandomLoopingSoundEffect, playRandomSoundEffect } from './sfx.js?v=20260915-writing-sfx-1-writing-level-1-seamless-loops-1';

export const BOOK_OPEN_SFX = 'assets/audio/effect/sfx/office/SFX_BOOK_OPEN_03.wav';
export const PEN_WRITING_SFX = Object.freeze([
  'assets/audio/effect/sfx/office/SFX_PEN_WRITING_01.wav',
  'assets/audio/effect/sfx/office/SFX_PEN_WRITING_02.wav',
  'assets/audio/effect/sfx/office/SFX_PEN_WRITING_03.wav',
]);
export const PEN_WRITING_BASE_VOLUME = 0.3;

export function isWritingAction(text = '') {
  return /记下|写下|写入|记入|落笔|做(?:好)?记录/.test(String(text));
}

export function playWritingActionOnce(text, settings, random = Math.random) {
  if (!isWritingAction(text)) return null;
  return playRandomSoundEffect(PEN_WRITING_SFX, settings, random, PEN_WRITING_BASE_VOLUME);
}

export function scheduleDialogueWritingLoop(settings, delay, random = Math.random) {
  let audio = null;
  let stopped = false;
  const start = () => {
    if (stopped) return;
    audio = playRandomLoopingSoundEffect(PEN_WRITING_SFX, settings, random, PEN_WRITING_BASE_VOLUME);
  };
  const timer = setTimeout(start, Math.max(0, Number(delay) || 0));
  return {
    stop() {
      stopped = true;
      clearTimeout(timer);
      if (!audio) return;
      audio.pause();
      audio.src = '';
      audio = null;
    },
  };
}

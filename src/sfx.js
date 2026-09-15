import { createSeamlessLoopingAudio } from './looping-audio.js?v=20260915-seamless-loops-1';

// Short gameplay effects use the master volume and remain independent from dialogue/BGM playback.
export function getSoundEffectVolume(settings = {}, baseVolume = 1) {
  const master = Math.max(0, Math.min(100, Number(settings.master ?? 100))) / 100;
  const gain = Math.max(0, Math.min(1, Number(baseVolume ?? 1)));
  return master * gain;
}

export function playSoundEffect(source, settings, baseVolume = 1) {
  if (!source || typeof Audio === 'undefined') return null;
  const audio = new Audio(source);
  audio.preload = 'auto';
  audio.volume = getSoundEffectVolume(settings, baseVolume);
  audio.play().catch(() => {});
  return audio;
}

export function playLoopingSoundEffect(source, settings, baseVolume = 1) {
  const audio = createSeamlessLoopingAudio(source);
  if (!audio) return null;
  audio.preload = 'auto';
  audio.loop = true;
  audio.volume = getSoundEffectVolume(settings, baseVolume);
  audio.play().catch(() => {});
  return audio;
}

export function playSoundEffectUntilEnd(source, settings, baseVolume = 1) {
  if (!source || typeof Audio === 'undefined') return Promise.resolve(null);
  const audio = new Audio(source);
  audio.preload = 'auto';
  audio.volume = getSoundEffectVolume(settings, baseVolume);
  return new Promise((resolve) => {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      resolve(audio);
    };
    audio.addEventListener('ended', finish, { once: true });
    audio.addEventListener('error', finish, { once: true });
    try {
      const playback = audio.play();
      if (playback?.catch) playback.catch(finish);
    } catch {
      finish();
    }
  });
}

export function randomSoundEffectSource(sources, random = Math.random) {
  if (!Array.isArray(sources) || sources.length === 0) return null;
  const index = Math.min(sources.length - 1, Math.floor(Math.max(0, random()) * sources.length));
  return sources[index];
}

export function playRandomSoundEffect(sources, settings, random = Math.random, baseVolume = 1) {
  return playSoundEffect(randomSoundEffectSource(sources, random), settings, baseVolume);
}

export function playRandomLoopingSoundEffect(sources, settings, random = Math.random, baseVolume = 1) {
  return playLoopingSoundEffect(randomSoundEffectSource(sources, random), settings, baseVolume);
}

export function playRandomSoundEffectUntilEnd(sources, settings, random = Math.random, baseVolume = 1) {
  return playSoundEffectUntilEnd(randomSoundEffectSource(sources, random), settings, baseVolume);
}

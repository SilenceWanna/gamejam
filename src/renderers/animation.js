// Data-driven renderer for the static-shot animation scenes.
// A shot is intentionally only a still layer plus a camera transform. Real
// artwork can be plugged in later by setting shot.image/background.
import { ACTION_TYPES, dispatch } from '../actions.js?v=20260915-script-v2-1';
import { getState, setState, setStateSilently } from '../state.js';
import { createPausableTimers } from '../pausable-timers.js';
import { createPage, element, MENU_CLOSE_EVENT, MENU_OPEN_EVENT } from './shared.js?v=20260915-script-v2-1-settings-hidden-menu-1-unified-ui-1-menu-label-1';
import { attachAnimationSkip } from '../dev/animation-skip.js';
import { usesWhiteTransition, WHITE_TRANSITION_TIMING } from '../scene-transitions.js?v=20260915-script-v2-1-first-two-minigame-no-white-1';
import { getVoiceDuration, playVoice } from '../voice.js?v=20260915-dialogue-delay-1';
import { displayAnimationText } from '../animation-timeline.js?v=20260915-he-narration-1-act2-group-audio-1';
import { playSoundEffect } from '../sfx.js?v=20260915-writing-sfx-1';

let activeTimeline = null;
let activeAudio = null;
let activeVoiceAudio = null;

export function stopAnimationPlayback() {
  activeTimeline?.clear();
  activeTimeline = null;
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.src = '';
    activeAudio = null;
  }
  activeVoiceAudio = null;
}

function getShots(scene) {
  const shots = scene?.shots ?? scene?.animation?.shots ?? scene?.frames ?? [];
  if (Array.isArray(shots) && shots.length > 0) return shots;
  return [{ caption: scene?.text ?? scene?.title ?? '', background: scene?.background }];
}

function getProgress(scene, shotCount) {
  const progress = getState().animationProgress;
  const value = progress && typeof progress === 'object' ? progress[scene.id] : 0;
  const savedIndex = Number.isFinite(value) ? value : value?.index ?? 0;
  const savedElapsed = Number.isFinite(value?.elapsed) ? value.elapsed : 0;
  return {
    index: Math.max(0, Math.min(savedIndex, shotCount - 1)),
    elapsed: Math.max(0, savedElapsed),
  };
}

function cameraTransform(camera = {}) {
  const x = Number(camera.x ?? camera.translateX ?? camera.panX ?? 0);
  const y = Number(camera.y ?? camera.translateY ?? camera.panY ?? 0);
  const scale = Number(camera.scale ?? camera.zoom ?? 1);
  return `translate3d(${Number.isFinite(x) ? x : 0}%, ${Number.isFinite(y) ? y : 0}%, 0) scale(${Number.isFinite(scale) && scale > 0 ? scale : 1})`;
}

function estimateShotDuration(shot, captionText) {
  const explicit = Number(shot.duration ?? shot.audioDuration);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;

  const text = String(captionText).trim();
  const hanCount = (text.match(/[\u3400-\u9fff]/g) ?? []).length;
  const punctuationCount = (text.match(/[，。！？；：、…]/g) ?? []).length;
  const isDialogue = Boolean(shot.speaker);
  const estimated = (isDialogue ? 850 : 1200)
    + hanCount * (isDialogue ? 235 : 180)
    + punctuationCount * 220;
  return Math.max(isDialogue ? 1800 : 2200, Math.min(9000, estimated));
}

function advance(scene, index, shotCount) {
  if (index < shotCount - 1) {
    const current = getState().animationProgress ?? {};
    setState({ animationProgress: { ...current, [scene.id]: { index: index + 1, elapsed: 0 } } });
    return;
  }

  if (scene.completeMemoryCardId) {
    dispatch({
      type: ACTION_TYPES.COMPLETE_MEMORY_CARD,
      memoryCardId: scene.completeMemoryCardId,
      clueIds: scene.completionClueIds ?? [],
    });
  }
  const next = scene.next ?? scene.exitTo ?? scene.endTo ?? scene.to;
  if (next) dispatch({ type: ACTION_TYPES.NAVIGATE, sceneId: next });
}

/**
 * Render an animation scene as a sequence of independently maintained shots.
 * Supported shot fields: caption/subtitle/text, background/image, camera
 * ({x, y, scale}), effect, and className. Progress is persisted in state when
 * an animationProgress map is available (and created otherwise).
 */
export function renderAnimation(scene) {
  stopAnimationPlayback();
  const timeline = createPausableTimers();
  activeTimeline = timeline;

  const shots = getShots(scene);
  // Warm the next CG before its dissolve begins.
  for (const source of new Set(shots.map(entry => entry.image ?? entry.src).filter(Boolean))) {
    const preload = new Image();
    preload.src = source;
  }
  const { index, elapsed: savedElapsed } = getProgress(scene, shots.length);
  const shot = shots[index] ?? {};
  const captionText = displayAnimationText(shot.caption ?? shot.subtitle ?? shot.text ?? shot.label ?? '', shot.speaker);
  const duration = estimateShotDuration(shot, captionText);
  const resumeElapsed = Math.min(savedElapsed, Math.max(0, duration - 1));
  const content = element('main', 'animation-page');
  if (scene.presentation === 'memory-film') content.classList.add('memory-film-animation');
  if (shot.cameraPath) content.classList.add('animation-long-take');
  content.setAttribute('aria-label', scene.title ?? 'animation');

  const stage = element('section', 'animation-stage');
  if (scene.presentation === 'memory-film') {
    stage.classList.add('memory-film-animation-stage');
    const isHolding = index === 0 || index === shots.length - 1;
    stage.classList.toggle('is-film-running', !isHolding);
    const control = element('span', `memory-film-animation-control ${isHolding ? 'is-play' : 'is-stop'}`);
    control.setAttribute('aria-hidden', 'true');
    control.append(element('span', 'memory-film-animation-control-icon'));
    content.append(control);
  }
  stage.removeAttribute('tabindex');
  stage.setAttribute('aria-label', '动画画面');

  const camera = element('div', 'animation-camera');
  if (shot.cameraFrom || shot.cameraTo) {
    const from = cameraTransform(shot.cameraFrom ?? shot.camera);
    const to = cameraTransform(shot.cameraTo ?? shot.camera);
    camera.style.transform = from;
    const movement = camera.animate([{ transform: from }, { transform: to }], {
      duration, easing: shot.cameraEasing ?? 'ease-in-out', fill: 'both',
    });
    movement.currentTime = resumeElapsed;
  } else {
    camera.style.transform = shot.transform ?? cameraTransform(shot.camera);
  }
  camera.dataset.effect = shot.effect ?? shot.motion ?? 'none';
  if (shot.className) camera.classList.add(shot.className);

  const image = element('div', 'animation-shot');
  image.dataset.shotId = shot.id ?? String(index + 1);
  image.dataset.background = shot.background ?? scene.background ?? 'placeholder';
  if (shot.image || shot.src) {
    image.style.backgroundImage = `url("${shot.image ?? shot.src}")`;
    image.classList.add('has-image');
  }
  if (shot.color) image.style.setProperty('--shot-color', shot.color);
  camera.append(image);
  stage.append(camera);

  if (shot.cameraPath) camera.style.transform = cameraTransform(shot.cameraPath[0]);
  if (shot.cameraPath && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const cameraAnimation = camera.animate(shot.cameraPath.map(({ offset, easing, ...pose }) => ({
      offset, ...(easing ? { easing } : {}), transform: cameraTransform(pose),
    })), { duration, easing: 'linear', fill: 'both' });
    cameraAnimation.currentTime = resumeElapsed;
  }
  // Every new framing dissolves, including close-up/wide views of one image.
  const transitionDuration = Math.max(800, shot.transitionDuration ?? 1000);
  if (index > 0 && !shot.seamlessFromPrevious) {
    const previous = shots[index - 1];
    const outgoing = element('div', 'animation-camera animation-outgoing');
    outgoing.style.transform = previous.transform ?? cameraTransform(previous.cameraPath?.at(-1) ?? previous.cameraTo ?? previous.camera);
    const still = element('div', 'animation-shot');
    if (previous.image || previous.src) {
      still.classList.add('has-image');
      still.style.backgroundImage = `url("${previous.image ?? previous.src}")`;
    }
    if (previous.color) still.style.setProperty('--shot-color', previous.color);
    outgoing.append(still);
    stage.append(outgoing);
    const dissolve = outgoing.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: transitionDuration, easing: 'ease-in-out', fill: 'forwards',
    });
    dissolve.currentTime = Math.min(resumeElapsed, transitionDuration);
    dissolve.onfinish = () => outgoing.remove();
  } else if (index === 0) {
    const entrance = stage.animate([{ opacity: 0 }, { opacity: 1 }], { duration: transitionDuration, fill: 'both' });
    entrance.currentTime = Math.min(resumeElapsed, transitionDuration);
  }

  const caption = element('p', 'animation-caption');
  const createCaptionBody = (entry, text) => {
    const body = element('span', 'animation-caption-body');
    if (entry.speaker) body.append(element('span', 'animation-speaker', `${entry.speaker}: `));
    body.append(document.createTextNode(text));
    return body;
  };
  caption.append(createCaptionBody(shot, captionText));
  caption.setAttribute('aria-live', 'polite');
  const showCaption = (entry, voiceOffset = 0) => {
    const text = displayAnimationText(entry.text, entry.speaker);
    caption.hidden = !text;
    caption.replaceChildren(createCaptionBody(entry, text));
    if (entry.sfx) {
      const remainingDelay = Math.max(0, Number(entry.sfxDelay) || 0) - voiceOffset;
      if (remainingDelay >= 0) {
        timeline.schedule(() => playSoundEffect(entry.sfx, getState().settings, entry.sfxVolume ?? 1), remainingDelay);
      }
    }
    if (entry.voiceId) {
      const voiceDuration = getVoiceDuration(entry.voiceId) ?? 0;
      const voiceDelay = Math.max(0, Number(entry.voiceDelay) || 0);
      const playbackOffset = Math.max(0, voiceOffset - voiceDelay);
      const startVoice = (offset = 0) => {
        const voiceAudio = playVoice(entry.voiceId, getState().settings);
        activeVoiceAudio = voiceAudio;
        if (voiceAudio && offset > 0) {
          voiceAudio.pause();
          const resumeVoice = () => {
            try { voiceAudio.currentTime = offset / 1000; } catch {}
            voiceAudio.play().catch(() => {});
          };
          if (voiceAudio.readyState >= 1) resumeVoice();
          else voiceAudio.addEventListener('loadedmetadata', resumeVoice, { once: true });
        }
      };
      if (voiceOffset < voiceDelay) {
        timeline.schedule(() => startVoice(), voiceDelay - voiceOffset);
      } else if (playbackOffset < voiceDuration) {
        startVoice(playbackOffset);
      }
    }
  };
  if (shot.captions?.length) {
    const currentCaptionIndex = Math.max(0, shot.captions.findLastIndex(entry => entry.at <= resumeElapsed));
    const currentCaption = shot.captions[currentCaptionIndex];
    showCaption(currentCaption, resumeElapsed - currentCaption.at);
    for (const entry of shot.captions.slice(currentCaptionIndex + 1)) {
      timeline.schedule(() => showCaption(entry), entry.at - resumeElapsed);
    }
  }
  if (!caption.textContent.trim()) caption.hidden = true;
  content.append(stage, caption);

  // Animation advances by itself. A supplied audio source takes precedence;
  // otherwise use an explicit duration or estimate reading time from the
  // subtitle length. Animation scenes advance automatically.
  const hasNext = index < shots.length - 1 || (scene.next ?? scene.exitTo ?? scene.endTo ?? scene.to);
  const advanceWithFade = () => {
    if (index < shots.length - 1) {
      advance(scene, index, shots.length);
      return;
    }
    const destination = scene.next ?? scene.exitTo ?? scene.endTo ?? scene.to;
    const continuesIntoEndingFrame = /^ending_/.test(destination ?? '');
    if (usesWhiteTransition(scene.id, destination)) {
      const veil = element('div');
      Object.assign(veil.style, { position: 'absolute', inset: '0', background: '#fff', zIndex: '10', pointerEvents: 'none' });
      content.append(veil);
      veil.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: WHITE_TRANSITION_TIMING.fadeIn,
        easing: 'ease-in-out',
        fill: 'forwards',
      });
    } else {
      // Keep the dark animation-page opaque; fading it exposed the white shell.
      const fadingLayers = continuesIntoEndingFrame
        ? [caption, content.querySelector('.memory-film-animation-control')]
        : [stage, caption, content.querySelector('.memory-film-animation-control')];
      for (const layer of fadingLayers.filter(Boolean)) {
        layer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 700, fill: 'forwards' });
      }
    }
    const transitionDelay = usesWhiteTransition(scene.id, destination)
      ? WHITE_TRANSITION_TIMING.fadeIn + WHITE_TRANSITION_TIMING.hold
      : 700;
    timeline.schedule(() => advance(scene, index, shots.length), transitionDelay);
  };
  if (hasNext && shot.autoAdvance !== false) {
    const audioSource = shot.audioSrc ?? shot.audio ?? null;
    const audioTail = Math.max(0, Number(shot.audioTail) || 0);
    const expectedAudioDuration = Math.max(0, duration - audioTail);
    if (audioSource && typeof Audio !== 'undefined' && resumeElapsed < expectedAudioDuration) {
      const audio = new Audio(audioSource);
      activeAudio = audio;
      let ended = false;
      const complete = () => {
        if (ended) return;
        ended = true;
        if (activeAudio === audio) activeAudio = null;
        advanceWithFade();
      };
      const finish = () => {
        if (activeAudio === audio) activeAudio = null;
        timeline.schedule(complete, audioTail);
      };
      audio.addEventListener('ended', finish, { once: true });
      audio.addEventListener('error', () => {
        timeline.schedule(complete, duration - resumeElapsed);
      }, { once: true });
      if (resumeElapsed > 0) {
        const seek = () => { try { audio.currentTime = resumeElapsed / 1000; } catch {} };
        if (audio.readyState >= 1) seek();
        else audio.addEventListener('loadedmetadata', seek, { once: true });
      }
      audio.play().catch(() => {
        timeline.schedule(complete, duration - resumeElapsed);
      });
    } else {
      timeline.schedule(advanceWithFade, duration - resumeElapsed);
    }
  }

  const page = createPage(scene, content, { immersive: true });
  const controller = new AbortController();
  let pausedAnimations = [];
  let resumeShotAudio = false;
  let resumeVoiceAudio = false;
  const pauseForMenu = () => {
    timeline.pause();
    const state = getState();
    setStateSilently({
      animationProgress: {
        ...state.animationProgress,
        [scene.id]: { index, elapsed: Math.min(duration, resumeElapsed + timeline.elapsed) },
      },
    });
    pausedAnimations = content.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running');
    pausedAnimations.forEach(animation => animation.pause());
    resumeShotAudio = Boolean(activeAudio && !activeAudio.paused && !activeAudio.ended);
    resumeVoiceAudio = Boolean(activeVoiceAudio && !activeVoiceAudio.paused && !activeVoiceAudio.ended);
    if (resumeShotAudio) activeAudio.pause();
    if (resumeVoiceAudio) activeVoiceAudio.pause();
  };
  const resumeFromMenu = () => {
    timeline.resume();
    pausedAnimations.forEach(animation => animation.play());
    pausedAnimations = [];
    if (resumeShotAudio) activeAudio?.play().catch(() => {});
    if (resumeVoiceAudio) activeVoiceAudio?.play().catch(() => {});
    resumeShotAudio = false;
    resumeVoiceAudio = false;
  };
  window.addEventListener(MENU_OPEN_EVENT, pauseForMenu, { signal: controller.signal });
  window.addEventListener(MENU_CLOSE_EVENT, resumeFromMenu, { signal: controller.signal });
  page.dispose = () => {
    controller.abort();
    timeline.clear();
  };
  // Optional development control; reuse the normal end-of-animation transition.
  if (scene.next ?? scene.exitTo ?? scene.endTo ?? scene.to) {
    attachAnimationSkip(page, () => {
      stopAnimationPlayback();
      advance(scene, shots.length - 1, shots.length);
    });
  }
  return page;
}


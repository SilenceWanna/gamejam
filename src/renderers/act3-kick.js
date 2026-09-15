import { ACTION_TYPES, dispatch } from '../actions.js?v=20260915-script-v2-1-phase-dialogue-2';
import { ACT3_KICK_TIMING, act3KickImagePhase, getAct3KickProgress } from '../act3-kick.js?v=20260915-kick-sfx-4-hold-landing-1';
import { getState } from '../state.js';
import { playRandomSoundEffectUntilEnd } from '../sfx.js?v=20260915-kick-sfx-4';
import { createButton, createPage, element } from './shared.js?v=20260915-script-v2-1-settings-hidden-menu-1-unified-ui-1-menu-label-1';
import { createDialogue } from './memory-dialogue.js?v=20260915-script-v2-1-minigame-narration-1-dialogue-delay-1-writing-sfx-1-audio-layout-1-writing-level-1';

let activeDropPlayback = null;

export function renderAct3Kick(scene) {
  const progress = getAct3KickProgress(getState().minigames[scene.id]);
  const talking = ['intro', 'outro'].includes(progress.stage);
  const content = element('main', 'kick-memory-page');
  content.dataset.stage = progress.stage;
  content.setAttribute('aria-label', '第三幕踢毽子记忆');
  const backdrop = element('div', 'kick-memory-backdrop');
  const frame = element('div', 'kick-image-frame');
  const imageNames = scene.images ?? Array.from({ length: 4 }, (_, index) => `phase${index}.png`);
  const backdropImages = imageNames.map((imageName) => {
    const layer = element('div', 'kick-memory-backdrop-image');
    layer.style.backgroundImage = `url("${scene.imageBase}/${imageName}")`;
    backdrop.append(layer);
    return layer;
  });
  const images = imageNames.map((imageName) => {
    const image = element('img', 'kick-memory-image');
    image.src = `${scene.imageBase}/${imageName}`;
    image.alt = '';
    image.draggable = false;
    image.loading = 'eager';
    const markLoaded = () => image.classList.add('is-loaded');
    image.addEventListener('load', markLoaded, { once: true });
    if (image.complete && image.naturalWidth) markLoaded();
    frame.append(image);
    return image;
  });
  content.append(backdrop, frame);

  let elapsed = progress.stageElapsed;
  let disposed = false;
  let committed = false;
  let dropSoundFinished = false;
  let observedDropPromise = null;
  if (progress.stage !== 'playing' || elapsed < ACT3_KICK_TIMING.dropSfx) activeDropPlayback = null;
  const send = (event) => {
    if (disposed || committed || document.querySelector('dialog[open]')) return;
    committed = true;
    const result = dispatch({ type: ACTION_TYPES.MINIGAME_ACTION, event, elapsed });
    if (!result.ok) committed = false;
  };
  const maybeStartDropSound = () => {
    if (progress.stage !== 'playing' || elapsed < ACT3_KICK_TIMING.dropSfx) return;
    const key = `${scene.id}:drop`;
    if (activeDropPlayback?.key !== key) {
      activeDropPlayback = {
        key,
        promise: playRandomSoundEffectUntilEnd(scene.dropSfx, getState().settings),
      };
    }
    if (observedDropPromise === activeDropPlayback.promise) return;
    observedDropPromise = activeDropPlayback.promise;
    observedDropPromise.then(() => {
      if (!disposed) dropSoundFinished = true;
    });
  };
  let visiblePhase = -1;
  const paintPhase = () => {
    const phase = act3KickImagePhase(progress, elapsed);
    if (phase === visiblePhase) return;
    visiblePhase = phase;
    content.dataset.phase = String(phase);
    images.forEach((image, index) => image.classList.toggle('is-current', index === phase));
    backdropImages.forEach((layer, index) => layer.classList.toggle('is-current', index === phase));
  };
  paintPhase();

  if (talking) {
    const lines = progress.stage === 'intro' ? scene.introLines : scene.outroLines;
    const index = progress.stage === 'intro' ? progress.introIndex : progress.outroIndex;
    content.append(...createDialogue(lines[index], () => send('dialogue'), { showBackground: false }));
  } else if (progress.stage === 'ready') {
    const button = createButton('释放', 'kick-action-orb', () => send('release'));
    button.style.left = `${scene.controls.release.x}%`;
    button.style.top = `${scene.controls.release.y}%`;
    button.dataset.action = 'release';
    frame.append(button);
  }

  const page = createPage(scene, content, { immersive: true });
  const controller = new AbortController();
  page.querySelector('.immersive-menu-button').addEventListener('click', () => {
    dispatch({ type: ACTION_TYPES.MINIGAME_ACTION, event: 'checkpoint', elapsed });
  }, { capture: true, signal: controller.signal });

  let frameId = null;
  let lastTime = null;
  const animate = (now) => {
    if (disposed) return;
    const paused = document.hidden || !!document.querySelector('dialog[open]') || images.some((image) => !image.complete || !image.naturalWidth);
    const delta = lastTime === null || paused ? 0 : now - lastTime;
    lastTime = now;
    elapsed += delta;
    paintPhase();
    if (!paused) maybeStartDropSound();
    if (dropSoundFinished && elapsed >= ACT3_KICK_TIMING.landing) {
      send('sequence-done');
      if (committed) return;
    }
    frameId = requestAnimationFrame(animate);
  };
  const resetFrameTime = () => { lastTime = null; };
  document.addEventListener('visibilitychange', resetFrameTime, { signal: controller.signal });
  if (!talking) frameId = requestAnimationFrame(animate);
  page.dispose = () => { disposed = true; controller.abort(); cancelAnimationFrame(frameId); };
  return page;
}

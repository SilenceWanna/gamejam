import { ACTION_TYPES, dispatch } from '../actions.js?v=20260915-script-v2-1-minigame-office-intro-1';
import { getKickProgress, kickHitSoundIndex, kickImagePhase, KICK_TIMING, moveKickCursor } from '../kick.js?v=20260915-kick-sfx-4';
import { getState } from '../state.js';
import { playRandomSoundEffect, playRandomSoundEffectUntilEnd, playSoundEffect } from '../sfx.js?v=20260915-kick-sfx-4';
import { createButton, createPage, element } from './shared.js?v=20260915-script-v2-1-settings-hidden-menu-1-unified-ui-1-menu-label-1';
import { createDialogue } from './memory-dialogue.js?v=20260915-script-v2-1-minigame-narration-1-dialogue-delay-1-writing-sfx-1-audio-layout-1-writing-level-1';

let lastPlayedHitKey = null;
let lastPlayedDropKey = null;

export function renderKick(scene) {
  const progress = getKickProgress(getState().minigames[scene.id]);
  const talking = ['intro', 'outro'].includes(progress.stage);
  const running = ['releasing', 'playing'].includes(progress.stage);
  const dialogueLines = progress.stage === 'intro' ? scene.introLines : scene.outroLines;
  const dialogueIndex = progress.stage === 'intro' ? progress.introIndex : progress.outroIndex;
  const dialogueLine = talking ? dialogueLines?.[dialogueIndex] : null;
  const content = element('main', 'kick-memory-page');
  content.dataset.stage = progress.stage;
  content.setAttribute('aria-label', '踢毽子的记忆');
  const backdrop = element('div', 'kick-memory-backdrop');
  const frame = element('div', 'kick-image-frame');
  const imageSource = (index) => index === 0 && dialogueLine?.background
    ? dialogueLine.background
    : `${scene.imageBase}/${scene.imageFiles?.[index] ?? `phase${index}.png`}`;
  const backdropImages = Array.from({ length: 6 }, (_, index) => {
    const layer = element('div', 'kick-memory-backdrop-image');
    layer.style.backgroundImage = `url("${imageSource(index)}")`;
    backdrop.append(layer);
    return layer;
  });
  const images = Array.from({ length: 6 }, (_, index) => {
    const image = element('img', 'kick-memory-image');
    image.src = imageSource(index);
    if (index === 0 && dialogueLine?.background) image.classList.add('is-fullscreen-dialogue-background');
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
  let motion = { position: progress.round?.position ?? 0, direction: progress.round?.direction ?? 1 };
  let disposed = false;
  let committed = false;
  let pickupTimer = null;
  const send = (event) => {
    if (disposed || committed || document.querySelector('dialog[open]')) return;
    committed = true;
    const result = dispatch({ type: ACTION_TYPES.MINIGAME_ACTION, event, elapsed, ...motion });
    if (!result.ok) committed = false;
  };
  let visiblePhase = -1;
  function paintPhase() {
    const phase = kickImagePhase(progress, elapsed);
    if (phase === visiblePhase) return;
    visiblePhase = phase;
    content.dataset.phase = String(phase);
    images.forEach((image, index) => image.classList.toggle('is-current', index === phase));
    backdropImages.forEach((layer, index) => layer.classList.toggle('is-current', index === phase));
    const soundIndex = kickHitSoundIndex(progress, phase);
    if (soundIndex !== null) {
      const hitKey = `${scene.id}:${progress.attempts}`;
      if (lastPlayedHitKey !== hitKey) {
        lastPlayedHitKey = hitKey;
        playSoundEffect(scene.hitSfx?.[soundIndex], getState().settings);
      }
    } else if (progress.stage !== 'hit') {
      lastPlayedHitKey = null;
    }
    if (phase === 5 && progress.stage === 'miss') {
      const dropKey = `${scene.id}:${progress.attempts}`;
      if (lastPlayedDropKey !== dropKey) {
        lastPlayedDropKey = dropKey;
        playRandomSoundEffect(scene.dropSfx, getState().settings);
      }
    } else if (progress.stage !== 'miss') {
      lastPlayedDropKey = null;
    }
  }
  paintPhase();

  let instructionsAnimation = null;
  if (talking) {
    content.append(...createDialogue(dialogueLine, () => send('dialogue'), { showBackground: false }));
  } else {
    const instructions = element('section', 'kick-instructions');
    instructions.append(element('h1', 'kick-instructions-title', '连续踢中六次'), element('p', 'kick-instructions-copy', scene.instructions));
    content.append(instructions);
    if (progress.stage === 'instructions') {
      instructions.classList.add('is-presenting');
      // Animate one card from the screen centre to its final upper-left position.
      // The timeline is driven by the same paused clock as the game and save state.
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      instructionsAnimation = instructions.animate([
        { top: '50%', left: '50%', transform: reduced ? 'translate(-50%, -50%)' : 'translate(-50%, -50%) scale(1.32)', opacity: 0, offset: 0 },
        { top: '50%', left: '50%', transform: reduced ? 'translate(-50%, -50%)' : 'translate(-50%, -50%) scale(1.32)', opacity: 1, offset: 0.14 },
        { top: '50%', left: '50%', transform: reduced ? 'translate(-50%, -50%)' : 'translate(-50%, -50%) scale(1.32)', opacity: 1, offset: 0.72 },
        { top: 'var(--kick-hint-top)', left: 'var(--kick-hint-left)', transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 1 },
      ], { duration: KICK_TIMING.instructions, fill: 'both', easing: 'ease-in-out' });
      instructionsAnimation.pause();
      instructionsAnimation.currentTime = elapsed;
    }
  }

  let cursor = null;
  let inputButton = null;
  if (!talking && progress.stage !== 'instructions') {
    if (progress.stage === 'miss') {
      const button = createButton('捡起', 'kick-action-orb', async () => {
        button.disabled = true;
        await playRandomSoundEffectUntilEnd(scene.pickupSfx, getState().settings);
        send('pickup');
      });
      const anchor = scene.controls.pickup;
      button.style.left = `${anchor.x}%`;
      button.style.top = `${anchor.y}%`;
      button.dataset.action = 'pickup';
      if (elapsed < KICK_TIMING.pickup) {
        button.style.display = 'none';
        pickupTimer = window.setTimeout(() => {
          if (!disposed) button.style.display = '';
        }, KICK_TIMING.pickup - elapsed);
      }
      frame.append(button);
      const subtitle = element('p', 'kick-subtitle', '没踢中，从头再来吧');
      subtitle.setAttribute('role', 'status');
      content.append(subtitle);
    } else {
      const hud = element('aside', 'kick-timing-hud');
      const count = element('p', 'kick-streak', `${progress.successCount} / ${scene.target ?? 6}`);
      count.setAttribute('aria-label', `已连续成功 ${progress.successCount} 次，目标 ${scene.target ?? 6} 次`);
      const track = element('div', 'kick-vertical-track');
      track.setAttribute('aria-label', '竖直判定条：将白色短线停在金色区间');
      const target = element('div', 'kick-vertical-target');
      target.style.top = `${progress.round.start * 100}%`;
      target.style.height = `${progress.round.width * 100}%`;
      cursor = element('div', 'kick-vertical-cursor');
      cursor.style.top = `${motion.position * 100}%`;
      track.classList.toggle('is-hit', progress.stage === 'hit');
      track.classList.toggle('is-miss', progress.lastResult === 'miss');
      track.append(target, cursor);
      hud.append(count, track);
      content.append(hud);

      const release = progress.stage === 'ready';
      const anchor = release ? scene.controls.release : scene.controls.kick;
      inputButton = createButton(release ? '释放' : '踢', 'kick-action-orb', () => send(release ? 'release' : 'kick'));
      inputButton.style.left = `${anchor.x}%`;
      inputButton.style.top = `${anchor.y}%`;
      inputButton.disabled = progress.stage === 'hit';
      inputButton.dataset.action = release ? 'release' : 'kick';
      inputButton.addEventListener('keydown', (event) => {
        if (event.code === 'Space') {
          event.preventDefault();
          if (!event.repeat && !inputButton.disabled) inputButton.click();
        }
      });
      frame.append(inputButton);
      if (progress.lastResult) {
        const subtitle = element('p', 'kick-subtitle', progress.lastResult === 'success'
          ? progress.passed ? '总算完成了' : `就是这样，还差${Math.max(0, (scene.target ?? 6) - progress.successCount)}下`
          : '没踢中，从头再来吧');
        subtitle.setAttribute('role', 'status');
        content.append(subtitle);
      }
    }
  }

  const page = createPage(scene, content, { immersive: true });
  const controller = new AbortController();
  window.addEventListener('keydown', (event) => {
    if (event.code !== 'Space' || talking || document.querySelector('dialog[open]')) return;
    if (event.target.closest?.('button, input, textarea, select, [role="button"], [contenteditable]')) return;
    event.preventDefault();
    if (!event.repeat && inputButton && !inputButton.disabled) inputButton.click();
  }, { signal: controller.signal });

  // Snapshot before opening the shared menu so saving/settings preserve motion,
  // direction and the remaining part of a release/hit/tutorial animation.
  page.querySelector('.immersive-menu-button').addEventListener('click', () => {
    dispatch({ type: ACTION_TYPES.MINIGAME_ACTION, event: 'checkpoint', elapsed, ...motion });
  }, { capture: true, signal: controller.signal });

  let frameId = null;
  let lastTime = null;
  const animate = (now) => {
    if (disposed) return;
    const paused = document.hidden || !!document.querySelector('dialog[open]')
      || images.some((image) => !image.complete || !image.naturalWidth);
    const delta = lastTime === null || paused ? 0 : now - lastTime;
    lastTime = now;
    elapsed += delta;
    if (running) {
      motion = moveKickCursor(motion.position, motion.direction, delta, progress.round.speed);
      if (cursor) cursor.style.top = `${motion.position * 100}%`;
    }
    if (instructionsAnimation) instructionsAnimation.currentTime = elapsed;
    paintPhase();
    if (!paused) {
      const transition = progress.stage === 'instructions' && elapsed >= KICK_TIMING.instructions ? 'instructions-done'
        : progress.stage === 'releasing' && elapsed >= KICK_TIMING.release ? 'release-done'
          : progress.stage === 'hit' && elapsed >= KICK_TIMING.hit ? 'hit-done' : null;
      if (transition) { send(transition); return; }
    }
    frameId = requestAnimationFrame(animate);
  };
  const resetFrameTime = () => { lastTime = null; };
  document.addEventListener('visibilitychange', resetFrameTime, { signal: controller.signal });
  if (!talking) frameId = requestAnimationFrame(animate);
  page.dispose = () => {
    disposed = true;
    controller.abort();
    window.clearTimeout(pickupTimer);
    cancelAnimationFrame(frameId);
    instructionsAnimation?.cancel();
  };
  return page;
}

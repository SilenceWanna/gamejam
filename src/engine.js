// 视图调度器：选择场景渲染器、响应状态变化，并启动统一路由。
import { renderDeduction } from './renderers/deduction.js?v=20260915-script-v2-1-dialogue-split-1-dialogue-delay-1-deduction-portrait-wait-1-deduction-hold-2s-1-writing-sfx-1-audio-layout-1-writing-level-1-settings-hidden-menu-1-first-two-minigame-no-white-1-unified-ui-1-menu-label-1';
import { renderEnding } from './renderers/ending.js?v=20260915-script-v2-1-immersive-result-2-ending-screen-1-ending-kicker-1-unified-ui-1-menu-label-1';
import { renderInvestigation } from './renderers/investigation.js?v=20260915-script-v2-1-visual-crossfade-1-settings-hidden-menu-1-unified-ui-1-menu-label-1';
import { renderNarrative } from './renderers/narrative.js?v=20260915-script-v2-1-be-location-1-dialogue-delay-1-writing-sfx-1-audio-layout-1-writing-level-1-seamless-loops-1-settings-hidden-menu-1-first-two-minigame-no-white-1-unified-ui-1-menu-label-1';
import { renderAnimation, stopAnimationPlayback } from './renderers/animation.js?v=20260915-he-narration-1-dialogue-delay-1-writing-sfx-1-ending-frame-handoff-1-settings-hidden-menu-1-first-two-minigame-no-white-1-act3-audio-1-unified-ui-1-menu-label-1';
import { renderMinigame } from './renderers/minigame.js?v=20260915-script-v2-3-minigame-narration-1-phase-dialogue-2-phase-address-1-visual-crossfade-1-dialogue-delay-1-hold-landing-1-writing-sfx-1-audio-layout-1-writing-level-1-minigame-office-intro-1-minigame-office-cover-1-settings-hidden-menu-1-unified-ui-1-menu-label-1';
import { createRouteError } from './renderers/shared.js?v=20260915-script-v2-1-settings-hidden-menu-1-unified-ui-1-menu-label-1';
import { renderTitle } from './renderers/title.js?v=20260915-script-v2-1-ending-codex-label-1-ending-only-1-title-cover-1-settings-hidden-menu-1-unified-ui-1-menu-label-1-dialog-vertical-1';
import { startRouter } from './router.js?v=20260915-script-v2-1-settings-hidden-menu-1-menu-label-1';
import { SCENE_KINDS, SCENES } from './scenes.js?v=20260915-script-v2-1-dialogue-trim-1-dialogue-split-1-minigame-narration-1-phase-dialogue-2-mia-line-1-be-narration-1-act2-accent-1-phase-address-1-immersive-result-1-office-rain-1-be-location-1-prologue-tram-portrait-1-deduction-office-rain-1-office-indoor-amb-1-office-roomtone-layer-1-writing-sfx-1-act1-audio-1-act2-amb-1-quiet-hero-1-audio-layout-1-be-audio-1-investigation-village-amb-1-minigame-office-intro-1-quiet-followup-hero-1-ending-final-frame-1-settings-hidden-menu-1-act3-audio-1-he-audio-1-act2-group-audio-1-act3-audio-mix-1';
import { getState, subscribe } from './state.js';
import { CROSSFADE_TRANSITION_TIMING, crossfadeDuration, shouldCrossfadeDialogueBox, usesCrossfadeTransition, usesWhiteTransition, WHITE_TRANSITION_TIMING } from './scene-transitions.js?v=20260915-script-v2-1-visual-crossfade-2-dialogue-conditional-1-be-slow-fade-1-ending-frame-seamless-1-first-two-minigame-no-white-1';
import { stopVoicePlayback } from './voice.js?v=20260915-dialogue-delay-1';
import { bindBackgroundMusicToMenu, syncBackgroundMusic } from './music.js?v=20260915-audio-layout-1-be-audio-1-seamless-loops-1';
import { bindAmbienceToMenu, syncAmbience } from './ambience.js?v=20260915-office-rain-1-office-roomtone-layer-1-audio-layout-1-minigame-office-intro-1-seamless-loops-1-act3-audio-1-he-audio-1';
import { playSoundEffect } from './sfx.js?v=20260915-ui-click-1';

let root = null;
let lastSceneId = null;
let activePageTransition = null;
let uiClickSoundBound = false;

const UI_CLICK_SFX = 'assets/audio/effect/ui/SFX_UI_CLICK_01.wav';

const PAGE_TRANSITION_STYLES = ['position', 'inset', 'width', 'z-index', 'opacity', 'pointer-events'];
const SAME_SCENE_VISUAL_LAYERS = [
  { selector: '.narrative-background', key: (node) => node.dataset.background || node.style.backgroundImage },
  { selector: '.memory-dialogue-scrim', key: () => 'dialogue-scrim' },
  { selector: '.narrative-portrait', key: (node) => node.dataset.portraitId || node.style.backgroundImage },
  { selector: '.dialogue-box', key: (node) => node.textContent },
  { selector: '.kick-memory-backdrop-image.is-current', key: (node) => node.style.backgroundImage },
  { selector: '.kick-memory-image.is-current', key: (node) => node.currentSrc || node.src },
  { selector: '.pronunciation-background', key: (node) => node.currentSrc || node.src },
];

function transitionDuration(duration) {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : duration;
}

function clearPageTransitionStyles(page) {
  for (const property of PAGE_TRANSITION_STYLES) page.style.removeProperty(property);
}

function finishPageTransition() {
  if (!activePageTransition) return;
  const transition = activePageTransition;
  activePageTransition = null;
  transition.outgoingAnimation.cancel();
  transition.incomingAnimation.cancel();
  transition.outgoing.remove();
  clearPageTransitionStyles(transition.incoming);
}

function crossfadePages(outgoing, incoming, requestedDuration = CROSSFADE_TRANSITION_TIMING.page) {
  const duration = transitionDuration(requestedDuration);
  Object.assign(outgoing.style, {
    position: 'fixed', inset: '0', width: '100%', zIndex: '1', pointerEvents: 'none',
  });
  Object.assign(incoming.style, {
    position: 'fixed', inset: '0', width: '100%', zIndex: '2', opacity: '0', pointerEvents: 'none',
  });
  root.append(incoming);
  // Let the incoming page dissolve over a fully opaque outgoing frame. Fading
  // both pages at once exposes the light body background between them.
  const outgoingAnimation = outgoing.animate([{ opacity: 1 }, { opacity: 1 }], {
    duration, easing: 'ease-in-out', fill: 'forwards',
  });
  const incomingAnimation = incoming.animate([{ opacity: 0 }, { opacity: 1 }], {
    duration, easing: 'ease-in-out', fill: 'forwards',
  });
  const transition = { outgoing, incoming, outgoingAnimation, incomingAnimation };
  activePageTransition = transition;
  incomingAnimation.onfinish = () => {
    if (activePageTransition !== transition) return;
    activePageTransition = null;
    outgoingAnimation.cancel();
    incomingAnimation.cancel();
    outgoing.remove();
    clearPageTransitionStyles(incoming);
  };
}

function prepareSameSceneVisualCrossfade(previousPage, nextPage) {
  const transitions = [];
  const layers = SAME_SCENE_VISUAL_LAYERS.map(({ selector, key }) => {
    const outgoingLayer = previousPage.querySelector(selector);
    const incomingLayer = nextPage.querySelector(selector);
    const changed = Boolean(outgoingLayer || incomingLayer)
      && (!outgoingLayer || !incomingLayer || key(outgoingLayer) !== key(incomingLayer));
    return { selector, outgoingLayer, incomingLayer, changed };
  });
  const backgroundChanged = layers.find(({ selector }) => selector === '.narrative-background')?.changed ?? false;
  const portraitChanged = layers.find(({ selector }) => selector === '.narrative-portrait')?.changed ?? false;
  const fadeDialogueBox = shouldCrossfadeDialogueBox({ backgroundChanged, portraitChanged });

  for (const { selector, outgoingLayer, incomingLayer, changed } of layers) {
    if (!changed || (selector === '.dialogue-box' && !fadeDialogueBox)) continue;

    const host = incomingLayer?.parentElement ?? nextPage.querySelector('main') ?? nextPage;
    let outgoingClone = null;
    if (outgoingLayer) {
      outgoingClone = outgoingLayer.cloneNode(true);
      outgoingClone.classList.remove('portrait-enter-fade');
      outgoingClone.classList.add('visual-transition-outgoing');
      outgoingClone.style.opacity = '1';
      outgoingClone.style.pointerEvents = 'none';
      outgoingClone.setAttribute('aria-hidden', 'true');
      if (incomingLayer?.parentElement === host) {
        incomingLayer.after(outgoingClone);
      } else if (selector === '.narrative-background') {
        host.prepend(outgoingClone);
      } else {
        const dialogueBox = host.querySelector('.dialogue-box');
        if (dialogueBox) host.insertBefore(outgoingClone, dialogueBox);
        else host.append(outgoingClone);
      }
    }
    if (incomingLayer) incomingLayer.style.opacity = '0';
    transitions.push({ outgoingClone, incomingLayer });
  }

  return () => {
    const duration = transitionDuration(CROSSFADE_TRANSITION_TIMING.visual);
    for (const { outgoingClone, incomingLayer } of transitions) {
      if (outgoingClone) {
        const exit = outgoingClone.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration, easing: 'ease-in-out', fill: 'forwards',
        });
        exit.onfinish = () => outgoingClone.remove();
      }
      if (incomingLayer) {
        const entrance = incomingLayer.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration, easing: 'ease-in-out', fill: 'forwards',
        });
        entrance.onfinish = () => {
          incomingLayer.style.removeProperty('opacity');
          entrance.cancel();
        };
      }
    }
  };
}

function fadeInFirstPage(page) {
  const duration = transitionDuration(CROSSFADE_TRANSITION_TIMING.page);
  page.animate([{ opacity: 0 }, { opacity: 1 }], { duration, easing: 'ease-out' });
}

function bindUiClickSound() {
  if (uiClickSoundBound || typeof document === 'undefined') return;
  uiClickSoundBound = true;
  document.addEventListener('click', (event) => {
    const target = event.target?.closest?.('button, .deduction-slot');
    if (!target || target.disabled || target.getAttribute('aria-disabled') === 'true') return;
    playSoundEffect(UI_CLICK_SFX, getState().settings);
  }, true);
}

// kind 到独立渲染器的唯一映射；新增场景类型时需要在这里注册。
const RENDERERS = {
  [SCENE_KINDS.TITLE]: renderTitle,
  [SCENE_KINDS.NARRATIVE]: renderNarrative,
  [SCENE_KINDS.ANIMATION]: renderAnimation,
  [SCENE_KINDS.MINIGAME]: renderMinigame,
  [SCENE_KINDS.INVESTIGATION]: renderInvestigation,
  [SCENE_KINDS.DEDUCTION]: renderDeduction,
  [SCENE_KINDS.ENDING]: renderEnding,
};

/**
 * 查找场景数据与对应渲染器，并用新页面替换当前挂载内容。
 * @param {string} sceneId 要渲染的场景 ID
 * @returns {void}
 */
function render(sceneId) {
  finishPageTransition();
  const scene = SCENES[sceneId];
  const renderer = scene ? RENDERERS[scene.kind] : null;
  const state = getState();
  syncBackgroundMusic(scene, state.settings);
  syncAmbience(scene, state);
  const previousSceneId = lastSceneId;
  const whiteTransition = usesWhiteTransition(previousSceneId, sceneId);
  const crossfadeTransition = usesCrossfadeTransition(previousSceneId, sceneId);
  lastSceneId = sceneId;

  // 清理上一页的尺寸监听等资源，避免反复打开房间时残留观察器。
  const previousPage = root.firstElementChild;
  previousPage?.dispose?.();
  stopAnimationPlayback();
  stopVoicePlayback();

  if (!renderer) {
    root.replaceChildren(createRouteError('无法加载当前场景。'));
    return;
  }

  const nextPage = renderer(scene);
  if (crossfadeTransition && previousPage) {
    crossfadePages(previousPage, nextPage, crossfadeDuration(previousSceneId, sceneId));
  } else {
    const startVisualCrossfade = previousPage && previousSceneId === sceneId
      ? prepareSameSceneVisualCrossfade(previousPage, nextPage)
      : null;
    root.replaceChildren(nextPage);
    if (startVisualCrossfade) startVisualCrossfade();
    else if (!previousPage) fadeInFirstPage(nextPage);
  }
  if (whiteTransition) {
    const veil = document.createElement('div');
    Object.assign(veil.style, { position: 'fixed', inset: '0', background: '#fff', zIndex: '100', pointerEvents: 'none' });
    veil.setAttribute('aria-hidden', 'true');
    root.firstElementChild.append(veil);
    veil.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: WHITE_TRANSITION_TIMING.fadeOut,
      easing: 'ease-in-out',
      fill: 'forwards',
    }).onfinish = () => veil.remove();
  }
}

/**
 * 启动视图调度：保存挂载点、订阅状态并启动 Hash 路由。
 * sdk 参数作为后续存档、语音等平台能力的扩展入口，当前暂未消费。
 *
 * @param {HTMLElement} mount 页面挂载节点
 * @param {object|null} sdk 平台 SDK；本地预览时为 null
 * @returns {void}
 */
export function startEngine(mount, sdk) {
  root = mount;
  void sdk;
  bindBackgroundMusicToMenu();
  bindAmbienceToMenu();
  bindUiClickSound();

  subscribe((state) => render(state.sceneId));
  startRouter();
  render(getState().sceneId);
}

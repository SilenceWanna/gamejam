import { ACTION_TYPES, dispatch } from '../actions.js?v=20260915-script-v2-1-be-location-1';
import { getState } from '../state.js';
import { canAdvanceVoice, DIALOGUE_VOICE_DELAY, ensureVoicePlayback, onVoicePlaybackEnd, playDialogueVoice } from '../voice.js?v=20260915-dialogue-delay-1';
import { createPage, element } from './shared.js?v=20260915-script-v2-1-settings-hidden-menu-1-unified-ui-1-menu-label-1';
import { displayScriptText } from '../animation-timeline.js';
import { usesWhiteTransition, WHITE_TRANSITION_TIMING } from '../scene-transitions.js?v=20260915-script-v2-1-first-two-minigame-no-white-1';
import { playWritingActionOnce, scheduleDialogueWritingLoop } from '../writing-sfx.js?v=20260915-writing-sfx-1-audio-layout-1-writing-level-1-seamless-loops-1';

// 对话只由玩家推进。舞台指示使用原文，不添加页码或改写台词。
export function renderNarrative(scene) {
  const state = getState();
  const index = Math.min(state.narrativeProgress[scene.id] ?? 0, Math.max(scene.lines.length - 1, 0));
  const line = scene.lines[index] ?? { text: '', speaker: '' };
  const content = element('main', 'narrative-page');
  content.setAttribute('aria-label', scene.title);
  const background = element('div', 'narrative-background');
  const backgroundSource = line.background ?? scene.background ?? '';
  background.dataset.background = backgroundSource;
  if (/\.(png|jpe?g|webp)$/i.test(backgroundSource)) {
    background.style.backgroundImage = `url("${backgroundSource}")`;
  }
  background.setAttribute('aria-hidden', 'true');
  const portrait = element('div', 'narrative-portrait');
  const lastSpeaker = scene.lines.slice(0, index + 1).reverse().find((entry) => entry.speaker);
  portrait.dataset.portraitId = line.portraitId ?? lastSpeaker?.portraitId ?? 'hero';
  portrait.setAttribute('aria-hidden', 'true');
  if (index === 0 && scene.portraitEntrance === 'fade') portrait.classList.add('portrait-enter-fade');

  const box = element('section', 'dialogue-box');
  box.tabIndex = 0;
  box.setAttribute('role', 'button');
  box.setAttribute('aria-label', '点击对话框继续');
  const dialogue = element('article', 'dialogue-line');
  if (line.voiceId) dialogue.dataset.voiceId = line.voiceId;
  if (line.speaker) dialogue.append(element('p', 'dialogue-speaker', line.speaker));
  dialogue.append(element('p', 'dialogue-text', displayScriptText(line.text)));
  const indicator = element('span', 'dialogue-advance-mark', '▾');
  indicator.setAttribute('aria-hidden', 'true');
  indicator.hidden = Boolean(line.voiceId);
  const waiting = line.voiceId ? element('span', 'voice-waiting') : null;
  if (waiting) {
    waiting.setAttribute('aria-label', '语音播放中');
    waiting.append(element('i'), element('i'), element('i'));
  }
  box.append(dialogue, indicator, ...(waiting ? [waiting] : []));
  let advanced = false;
  let transitionTimer = null;
  const advance = () => {
    if (advanced) return;
    if (line.voiceId && !canAdvanceVoice(line.voiceId)) {
      ensureVoicePlayback(line.voiceId, getState().settings);
      return;
    }
    advanced = true;
    const isLastLine = index >= Math.max(scene.lines.length - 1, 0);
    if (isLastLine && usesWhiteTransition(scene.id, scene.next)) {
      const veil = element('div');
      Object.assign(veil.style, { position: 'absolute', inset: '0', background: '#fff', zIndex: '10', pointerEvents: 'none' });
      veil.setAttribute('aria-hidden', 'true');
      content.append(veil);
      veil.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: WHITE_TRANSITION_TIMING.fadeIn,
        easing: 'ease-in-out',
        fill: 'forwards',
      });
      transitionTimer = window.setTimeout(() => {
        dispatch({ type: ACTION_TYPES.ADVANCE_DIALOGUE });
      }, WHITE_TRANSITION_TIMING.fadeIn + WHITE_TRANSITION_TIMING.hold);
      return;
    }
    dispatch({ type: ACTION_TYPES.ADVANCE_DIALOGUE });
    if (getState().sceneId === scene.id) document.querySelector('.dialogue-box')?.focus({ preventScroll: true });
  };
  box.addEventListener('click', advance);
  box.addEventListener('keydown', (event) => {
    if (!event.repeat && ['Enter', ' '].includes(event.key)) {
      event.preventDefault();
      advance();
    }
  });
  content.append(background, portrait, box);
  const page = createPage(scene, content, { immersive: true });
  const writingLoop = scene.loopHeroineWritingSfx && line.speaker === '弥' && line.voiceId
    ? scheduleDialogueWritingLoop(state.settings, DIALOGUE_VOICE_DELAY)
    : null;
  if (!writingLoop) playWritingActionOnce(line.text, state.settings);
  if (line.voiceId) {
    playDialogueVoice(line.voiceId, state.settings);
    onVoicePlaybackEnd(line.voiceId, () => {
      writingLoop?.stop();
      waiting.hidden = true;
      indicator.hidden = false;
    });
  }
  page.dispose = () => {
    writingLoop?.stop();
    if (transitionTimer !== null) window.clearTimeout(transitionTimer);
  };
  return page;
}

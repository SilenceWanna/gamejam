import { ACTION_TYPES, dispatch } from '../actions.js?v=20260915-script-v2-1';
import { attachMinigameSkip } from '../dev/minigame-skip.js?v=20260915-script-v2-3';
import { getState } from '../state.js';
import { createButton, createPage, element } from './shared.js?v=20260915-script-v2-1-settings-hidden-menu-1-unified-ui-1-menu-label-1';

import { renderKick } from './kick.js?v=20260915-script-v2-1-minigame-narration-1-visual-crossfade-1-dialogue-delay-1-writing-sfx-1-audio-layout-1-writing-level-1-minigame-office-intro-1-minigame-office-cover-1-settings-hidden-menu-1-unified-ui-1';
import { renderAct3Kick } from './act3-kick.js?v=20260915-script-v2-1-minigame-narration-1-phase-dialogue-2-visual-crossfade-1-dialogue-delay-1-hold-landing-1-writing-sfx-1-audio-layout-1-writing-level-1-settings-hidden-menu-1-unified-ui-1';
import { renderPronunciation } from './pronunciation.js?v=20260915-script-v2-1-minigame-narration-1-visual-crossfade-1-dialogue-delay-1-writing-sfx-1-audio-layout-1-writing-level-1-minigame-office-intro-1-settings-hidden-menu-1-unified-ui-1';

function renderIntro(scene, state, gameRoot) {
  const lines = scene.introLines ?? [];
  const introIndex = state.minigames[scene.id]?.introIndex ?? 0;
  if (introIndex >= lines.length) return null;
  const index = Math.min(introIndex, Math.max(lines.length - 1, 0));
  if (!lines.length) return null;
  const rawLine = lines[index];
  const line = typeof rawLine === 'string' ? { speaker: '', text: rawLine } : rawLine;
  const box = element('section', 'minigame-dialogue');
  box.append(element('p', 'section-kicker', 'MEMORY'));
  if (line.speaker) box.append(element('p', 'dialogue-speaker', line.speaker));
  box.append(element('p', 'minigame-line', line.text));
  if (index < lines.length - 1) {
    box.append(createButton('继续', 'primary-button', () => dispatch({ type: ACTION_TYPES.MINIGAME_ACTION, introNext: true })));
  } else {
    box.append(createButton(scene.game === 'pronunciation' ? '开始注音' : '开始', 'primary-button', () => dispatch({ type: ACTION_TYPES.MINIGAME_ACTION, event: 'release' })));
  }
  return box;
}

function renderSideKick(scene, gameRoot, state) {
  const progress = state.minigames[scene.id] ?? {};
  gameRoot.append(
    element('div', 'side-kick-visual', '毽子落下'),
    element('p', 'minigame-hint', progress.sideKickTested ? '脚背可以抬起，但腿无法自然向侧面转动。' : '怎么又要踢毽子？'),
    createButton(progress.sideKickTested ? '继续推理' : '尝试侧踢', 'primary-button', () => dispatch({ type: ACTION_TYPES.MINIGAME_ACTION, event: 'test' })),
  );
}

export function renderMinigame(scene) {
  let page;
  if (scene.game === 'kick') {
    page = renderKick(scene);
  } else if (scene.game === 'act3-kick') {
    page = renderAct3Kick(scene);
  } else if (scene.game === 'pronunciation') {
    page = renderPronunciation(scene);
  } else {
    const state = getState();
    const content = element('main', 'minigame-page');
    const panel = element('section', 'minigame-panel');
    panel.append(element('p', 'section-kicker', 'MEMORY GAME'), element('h1', 'minigame-title', scene.title ?? '记忆体验'));
    const intro = renderIntro(scene, state, panel);
    if (intro) {
      panel.append(intro);
    } else {
      renderSideKick(scene, panel, state);
    }
    content.append(panel);
    page = createPage(scene, content, { immersive: true });
  }

  attachMinigameSkip(page, scene);
  return page;
}

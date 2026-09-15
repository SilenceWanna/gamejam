// Remove this file and the title.js import/attachment to remove the test UI.
import { SCENES } from '../scenes.js?v=20260915-script-v2-1-act3-audio-1-act2-group-audio-1-act3-audio-mix-1';
import { DEDUCTIONS } from '../deductions.js?v=20260915-script-v2-1';
import { displayScriptText } from '../animation-timeline.js';
import { getState, setState } from '../state.js';
import { navigate } from '../router.js?v=20260915-script-v2-1';

export const SCENE_JUMP_ENABLED = true;
const phases = { animation: '动画', narrative: '对话', minigame: '小游戏', investigation: '搜证', deduction: '推理', ending: '结局页', settings: '设置', title: '标题页' };
const jumpItemStyle = {
  color: '#252a32', background: '#f3f0e8', border: '1px solid #b7ad98',
  borderRadius: '8px', padding: '12px 16px', minHeight: '48px',
  textAlign: 'left', fontSize: '16px', lineHeight: '1.5', cursor: 'pointer',
  whiteSpace: 'normal', width: '100%',
};

function label(scene) {
  const act = scene.id.match(/^act(\d)/)?.[1];
  const group = act ? `第${['', '一', '二', '三'][act]}幕` : scene.id.startsWith('he') || scene.id === 'ending_he' ? 'HE' : scene.id.startsWith('be') || scene.id === 'ending_be' ? 'BE' : '序幕';
  const phase = scene.id.endsWith('_outro') ? '收尾动画' : /^(he|be)_dialogue$/.test(scene.id) ? '对白动画' : phases[scene.kind];
  return `${group}-${phase}（${scene.title}）`;
}

function lineLabel(speaker, text, index) {
  const content = displayScriptText(text) || '（无字幕画面）';
  return `${index + 1}. ${speaker ? `${speaker}：` : ''}${content}`;
}

export function getSceneJumpTargets(scene) {
  if (scene.kind === 'narrative') {
    return (scene.lines ?? []).map((line, index) => ({
      label: lineLabel(line.speaker, line.text, index), narrativeIndex: index,
    }));
  }
  if (scene.kind !== 'animation') return [];

  const targets = [];
  for (const [shotIndex, shot] of (scene.shots ?? []).entries()) {
    const captions = shot.captions?.length
      ? shot.captions
      : [{ at: 0, text: shot.caption ?? shot.subtitle ?? shot.text ?? shot.label ?? '', speaker: shot.speaker }];
    for (const caption of captions) {
      targets.push({
        label: lineLabel(caption.speaker, caption.text, targets.length),
        shotIndex,
        elapsed: Math.max(0, Number(caption.at) || 0),
      });
    }
  }
  return targets;
}

function jump(scene, target = {}) {
  const state = getState();
  const minigames = { ...state.minigames };
  delete minigames[scene.id];
  const deductions = { ...state.deductions };
  const deductionIntros = { ...(state.deductionIntros ?? {}) };
  const animationProgress = {
    ...state.animationProgress,
    [scene.id]: { index: target.shotIndex ?? 0, elapsed: target.elapsed ?? 0 },
  };
  if (/^(he|be)_/.test(scene.id)) {
    for (const id of Object.keys(SCENES).filter(id => id.startsWith(scene.id.slice(0, 3)))) {
      animationProgress[id] = { index: 0, elapsed: 0 };
    }
    animationProgress[scene.id] = { index: target.shotIndex ?? 0, elapsed: target.elapsed ?? 0 };
  }
  if (/^(he_|ending_he)/.test(scene.id)) deductions.act3_mother = { passed: true };
  if (scene.deductionId) {
    delete deductions[scene.deductionId];
    delete deductionIntros[scene.deductionId];
  }
  setState({
    animationProgress,
    narrativeProgress: { ...state.narrativeProgress, [scene.id]: target.narrativeIndex ?? 0 },
    minigames, deductions, deductionIntros, patience: state.maxPatience,
    collectedClueIds: [...new Set([
      ...state.collectedClueIds,
      ...(scene.initialClueIds ?? DEDUCTIONS[scene.deductionId]?.requiredClueIds ?? []),
    ])],
    activeSaveSlotIndex: null,
  });
  navigate(scene.id);
}

function createDialog(titleText, ariaLabel = titleText, onClose = null) {
  const dialog = document.createElement('dialog');
  dialog.className = 'game-dialog';
  dialog.setAttribute('aria-label', ariaLabel);
  const title = document.createElement('h2');
  title.textContent = titleText;
  const close = document.createElement('button');
  close.textContent = '×';
  close.className = 'dialog-close';
  close.setAttribute('aria-label', `关闭${ariaLabel}`);
  close.onclick = () => dialog.close();
  const list = document.createElement('div');
  Object.assign(list.style, { display: 'grid', gap: '10px', maxHeight: '65vh', overflowY: 'auto' });
  dialog.append(close, title, list);
  dialog.addEventListener('close', () => {
    dialog.remove();
    onClose?.();
  }, { once: true });
  document.body.append(dialog);
  return { dialog, list };
}

function appendItem(list, text, onClick) {
  const item = document.createElement('button');
  item.type = 'button';
  item.textContent = text;
  Object.assign(item.style, jumpItemStyle);
  item.onclick = onClick;
  list.append(item);
}

function openLineDialog(scene) {
  let returnToSceneList = true;
  const { dialog, list } = createDialog(label(scene), '选择测试台词', () => {
    if (returnToSceneList) openSceneDialog();
  });
  for (const target of getSceneJumpTargets(scene)) {
    appendItem(list, target.label, () => {
      returnToSceneList = false;
      dialog.close();
      jump(scene, target);
    });
  }
  dialog.showModal();
}

function openSceneDialog() {
  const { dialog, list } = createDialog('测试跳转');
  for (const scene of Object.values(SCENES)) {
    if (['title', 'settings'].includes(scene.kind)) continue;
    appendItem(list, label(scene), () => {
      dialog.close();
      const targets = getSceneJumpTargets(scene);
      if (targets.length) openLineDialog(scene);
      else jump(scene);
    });
  }
  dialog.showModal();
}

export function attachSceneJump(actions) {
  if (!SCENE_JUMP_ENABLED) return;
  const button = document.createElement('button');
  button.textContent = '跳转';
  button.type = 'button';
  button.className = 'title-action-secondary';
  button.dataset.devControl = 'scene-jump';
  button.addEventListener('click', openSceneDialog);
  actions.append(button);
}

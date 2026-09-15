// title 场景渲染器：提供开始游戏、读取存档和结局图鉴入口。
import { ACTION_TYPES, dispatch } from '../actions.js?v=20260915-script-v2-1-settings-hidden-menu-1';
import { attachSceneJump } from '../dev/scene-jump.js?v=20260915-script-v2-1';
import { formatBeijingDateTime, readSaveSlots } from '../save.js?v=20260915-script-v2-1';
import { getEndingScenes } from '../scenes.js?v=20260915-script-v2-1-act3-audio-1-act2-group-audio-1-act3-audio-mix-1';
import { getState } from '../state.js';
import { createButton, createPage, element } from './shared.js?v=20260915-script-v2-1-settings-hidden-menu-1-unified-ui-1-menu-label-1';

/**
 * 创建存档弹窗，并展示最近一次游戏的摘要信息。
 * @returns {void}
 */
function openSaveDialog() {
  const dialog = element('dialog', 'game-dialog menu-dialog case-board save-dialog');
  const close = createButton('×', 'dialog-close', () => dialog.close());
  close.setAttribute('aria-label', '关闭存档信息');
  close.title = '关闭';
  dialog.append(close);

  const heading = element('header', 'case-board-heading');
  heading.append(
    element('p', 'section-kicker', 'SAVE DATA'),
    element('h2', 'menu-dialog-title', '读取存档'),
  );
  dialog.append(heading);

  const slots = readSaveSlots();
  if (slots.length === 0) {
    dialog.append(element('p', 'save-empty', '暂无存档'));
  } else {
    const list = element('ol', 'menu-vertical-list save-slot-list');
    slots.forEach((slot, index) => {
      const item = element('li', 'save-slot-item ui-paper-tag');
      const info = element('div', 'save-slot-info');
      info.append(
        element('strong', 'save-slot-title', `存档 ${index + 1}`),
        element('span', 'save-slot-progress', slot.progress),
        element('span', 'save-slot-time', slot.savedAtBeijing ?? formatBeijingDateTime(slot.savedAt)),
      );
      const load = createButton('继续', 'primary-button ui-paper-tag menu-case-card save-slot-load', () => {
        const result = dispatch({ type: ACTION_TYPES.LOAD_GAME, slotIndex: index });
        if (result.ok) dialog.close();
      });
      item.append(info, load);
      list.append(item);
    });
    dialog.append(list);
  }

  document.body.append(dialog);
  dialog.addEventListener('close', () => dialog.remove(), { once: true });
  dialog.showModal();
}

/**
 * 创建结局图鉴弹窗。
 * 结局条目从场景表自动生成，只有已经进入过的结局才显示名称。
 * @returns {void}
 */
function openEndingCodexDialog() {
  const dialog = element('dialog', 'game-dialog menu-dialog case-board codex-dialog');
  const close = createButton('×', 'dialog-close', () => dialog.close());
  close.setAttribute('aria-label', '关闭结局图鉴');
  close.title = '关闭';
  dialog.append(close);

  const unlocked = new Set(getState().unlockedEndingIds ?? []);
  const endings = getEndingScenes();
  const list = element('ol', 'codex-list');

  endings.forEach((ending, index) => {
    const item = element('li', 'codex-item ui-paper-tag');
    const isUnlocked = unlocked.has(ending.id);
    item.classList.toggle('is-unlocked', isUnlocked);
    item.append(
      element('span', 'codex-index', String(index + 1).padStart(2, '0')),
      element('span', 'codex-name', isUnlocked ? `结局${index + 1}：${ending.title}` : '？？？'),
      element('span', 'codex-status', isUnlocked ? '已解锁' : '未解锁'),
    );
    list.append(item);
  });

  const heading = element('header', 'case-board-heading');
  heading.append(
    element('p', 'section-kicker', 'ENDING'),
    element('h2', 'menu-dialog-title', '结局图鉴'),
  );
  list.classList.add('menu-vertical-list');
  dialog.append(heading, list);

  document.body.append(dialog);
  dialog.addEventListener('close', () => dialog.remove(), { once: true });
  dialog.showModal();
}

/**
 * 渲染游戏标题页。
 * @param {object} scene title 场景配置
 * @returns {HTMLElement} 完整的标题页
 */
export function renderTitle(scene) {
  const content = element('main', 'title-page');
  const panel = element('section', 'title-panel');
  panel.append(
    element('h1', 'title-heading', scene.title),
    element('p', 'title-english-name', 'THE WAY HOME'),
  );

  const actions = element('div', 'title-actions');
  // 开发期入口使用独立容器，发布前可整体删除，不参与正式标题菜单布局。
  const debugTools = element('div', 'title-debug-tools');
  const DEBUG_RESET_ENABLED = true;
  actions.append(
    createButton('开始游戏', 'primary-button title-action-primary ui-paper-tag title-menu-card', () => {
      dispatch({ type: ACTION_TYPES.START_GAME, sceneId: scene.startTo });
    }),
    createButton('继续游戏', 'title-action-secondary ui-paper-tag title-menu-card', openSaveDialog),
    createButton('结局图鉴', 'title-action-secondary ui-paper-tag title-menu-card', openEndingCodexDialog),
  );

  if (DEBUG_RESET_ENABLED) {
    debugTools.append(createButton('复位', 'debug-reset-button', () => {
      dispatch({ type: ACTION_TYPES.RESET_ALL });
    }));
  }

  attachSceneJump(debugTools);
  panel.append(actions);
  content.append(debugTools, panel);
  return createPage(scene, content, { immersive: true });
}

// 场景渲染器共用的 DOM 工具与非沉浸式页面外壳。
import { ACTION_TYPES, dispatch } from '../actions.js?v=20260915-script-v2-1-settings-hidden-menu-1';
import { formatBeijingDateTime, readSaveSlots } from '../save.js?v=20260915-script-v2-1';
import { SCENE_KINDS } from '../scenes.js?v=20260915-script-v2-1-act3-audio-1-act2-group-audio-1-act3-audio-mix-1';

export const MENU_OPEN_EVENT = 'game:menu-open';
export const MENU_CLOSE_EVENT = 'game:menu-close';

const KIND_LABELS = {
  [SCENE_KINDS.TITLE]: '标题',
  [SCENE_KINDS.SETTINGS]: '设置',
  [SCENE_KINDS.NARRATIVE]: '剧情',
  [SCENE_KINDS.INVESTIGATION]: '调查',
  [SCENE_KINDS.DEDUCTION]: '推理',
  [SCENE_KINDS.ENDING]: '结局',
};

/**
 * 创建 DOM 元素并设置可选类名和纯文本内容。
 * @param {string} tag HTML 标签名
 * @param {string} [className] CSS 类名
 * @param {string} [text] 文本内容；不传时保留空元素
 * @returns {HTMLElement}
 */
export function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/**
 * 创建标准 type="button" 按钮，避免按钮在 form 中意外触发表单提交。
 * @param {string} label 按钮文案，可为空以创建纯图标按钮
 * @param {string} className CSS 类名
 * @param {function(MouseEvent): void} onClick 点击处理函数
 * @returns {HTMLButtonElement}
 */
export function createButton(label, className, onClick) {
  const button = element('button', className, label);
  button.type = 'button';
  button.addEventListener('click', onClick);
  return button;
}

/**
 * 打开“覆盖存档”弹窗。只有存档槽已满时才会从菜单进入这里。
 * @returns {void}
 */
function openOverwriteDialog() {
  const dialog = element('dialog', 'game-dialog menu-dialog case-board save-dialog overwrite-dialog');
  const close = createButton('×', 'dialog-close', () => dialog.close());
  close.setAttribute('aria-label', '关闭覆盖存档');
  close.title = '关闭';

  const heading = element('header', 'case-board-heading');
  heading.append(
    element('p', 'section-kicker', 'SAVE DATA'),
    element('h2', 'menu-dialog-title', '覆盖存档'),
  );

  const slots = readSaveSlots();
  const list = element('ol', 'menu-vertical-list save-slot-list');
  const feedback = element('p', 'form-feedback');
  feedback.setAttribute('role', 'status');
  feedback.hidden = true;

  let slotContent;
  if (slots.length === 0) {
    slotContent = element('p', 'save-empty', '暂无可覆盖的存档');
  } else {
    slots.forEach((slot, index) => {
      const item = element('li', 'save-slot-item ui-paper-tag');
      const info = element('div', 'save-slot-info');
      info.append(
        element('strong', 'save-slot-title', `存档 ${index + 1}`),
        element('span', 'save-slot-progress', slot.progress),
        element('span', 'save-slot-time', slot.savedAtBeijing ?? formatBeijingDateTime(slot.savedAt)),
      );
      const overwrite = createButton('覆盖', 'primary-button ui-paper-tag menu-case-card save-slot-load', () => {
        const result = dispatch({
          type: ACTION_TYPES.SAVE_GAME,
          slotIndex: index,
        });
        if (result.ok) {
          dialog.close();
        } else {
          feedback.hidden = false;
          feedback.textContent = '覆盖保存失败，请稍后重试。';
        }
      });
      item.append(info, overwrite);
      list.append(item);
    });
    slotContent = list;
  }

  dialog.append(close, heading, slotContent, feedback);
  document.body.append(dialog);
  dialog.addEventListener('close', () => {
    window.dispatchEvent(new Event(MENU_CLOSE_EVENT));
    dialog.remove();
  }, { once: true });
  dialog.showModal();
  window.dispatchEvent(new Event(MENU_OPEN_EVENT));
}

/**
 * 打开当前玩法页面的菜单。
 * 玩家可以继续游戏、保存后返回标题，或舍弃本轮未保存进度后返回标题。
 * @returns {void}
 */
function openMenuDialog() {
  const dialog = element('dialog', 'game-dialog menu-dialog case-board');

  const feedback = element('p', 'form-feedback');
  feedback.setAttribute('role', 'status');
  const continueGame = createButton('继续游戏', 'primary-button ui-paper-tag menu-case-card', () => dialog.close());
  const save = createButton('保存进度', 'menu-secondary-button ui-paper-tag menu-case-card', () => {
    const result = dispatch({ type: ACTION_TYPES.SAVE_GAME });
    if (result.ok) {
      dialog.close();
    } else if (result.reason === 'SAVE_LIMIT_REACHED') {
      dialog.close();
      openOverwriteDialog();
    } else {
      feedback.textContent = '保存失败，请稍后重试。';
    }
  });
  const discard = createButton('放弃进度', 'menu-secondary-button ui-paper-tag ui-paper-tag--danger menu-case-card', () => {
    dialog.close();
    dispatch({ type: ACTION_TYPES.RESET_GAME, sceneId: 'title' });
  });

  const heading = element('header', 'case-board-heading');
  heading.append(
    element('p', 'section-kicker', 'menu'),
    element('h2', 'menu-dialog-title', '菜单'),
  );
  const cards = element('div', 'menu-card-grid');
  cards.append(continueGame, save, discard);
  dialog.append(heading, cards, feedback);
  document.body.append(dialog);
  dialog.addEventListener('close', () => {
    window.dispatchEvent(new Event(MENU_CLOSE_EVENT));
    dialog.remove();
  }, { once: true });
  dialog.showModal();
  window.dispatchEvent(new Event(MENU_OPEN_EVENT));
}

/**
 * 创建场景页面外壳，并把 sceneId/background 映射为 data 属性供样式和素材层使用。
 * immersive 页面不显示通用顶部栏，适用于全屏对话演出。
 *
 * @param {object} scene 场景配置
 * @param {HTMLElement} content 已构建的页面主体
 * @param {{immersive?: boolean, menu?: boolean}} [options={}] 页面外壳选项
 * @returns {HTMLElement}
 */
export function createPage(scene, content, options = {}) {
  const page = element('div', `scene-page scene-page-${scene.kind}`);
  page.dataset.sceneId = scene.id;
  page.dataset.background = scene.background ?? '';

  if (options.immersive) {
    page.classList.add('is-immersive');
    if (options.menu !== false && scene.kind !== SCENE_KINDS.TITLE && scene.kind !== SCENE_KINDS.SETTINGS) {
      page.append(createButton('菜单', 'immersive-menu-button', openMenuDialog));
    }
    page.append(content);
    return page;
  }

  const header = element('header', 'game-header');
  const brand = element('div', 'brand');
  brand.append(
    element('span', 'brand-mark', 'MIA'),
    element('span', 'brand-name', '归途'),
  );
  const headerActions = element('div', 'header-actions');
  headerActions.append(element('span', 'scene-kind', KIND_LABELS[scene.kind]));
  if (![SCENE_KINDS.TITLE, SCENE_KINDS.SETTINGS].includes(scene.kind)) {
    headerActions.append(createButton('菜单', 'menu-button', openMenuDialog));
  }

  header.append(brand, headerActions);

  page.append(header, content);
  return page;
}

/**
 * 创建无法解析场景时使用的最小错误视图。
 * @param {string} message 面向玩家的错误文案
 * @returns {HTMLElement}
 */
export function createRouteError(message) {
  return element('p', 'route-error', message);
}

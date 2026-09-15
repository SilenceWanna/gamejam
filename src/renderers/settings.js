// settings 场景渲染器：当前提供总音量、背景音量、人物音量三个滑块。
import { ACTION_TYPES, dispatch } from '../actions.js?v=20260915-script-v2-1';
import { createButton, createPage, element } from './shared.js?v=20260915-script-v2-1-unified-ui-1-menu-label-1';
import { getState } from '../state.js';

const VOLUME_OPTIONS = [
  { id: 'master', label: '总音量', description: '控制游戏内所有声音的总输出。' },
  { id: 'background', label: '背景音量', description: '控制环境音与背景音乐的音量。' },
  { id: 'character', label: '人物音量', description: '控制人物语音与角色相关声音。' },
];

/**
 * 渲染设置页。
 * @param {object} scene settings 场景配置
 * @returns {HTMLElement} 完整的设置页
 */
export function renderSettings(scene) {
  const state = getState();
  const content = element('main', 'settings-page');
  const panel = element('section', 'settings-panel');
  const heading = element('header', 'settings-heading');
  heading.append(
    element('p', 'section-kicker', 'SETTINGS'),
    element('h1', 'settings-title', scene.title),
    element('p', 'settings-description', '调整游戏内不同声音来源的音量。'),
  );

  const form = element('form', 'settings-form');
  for (const option of VOLUME_OPTIONS) {
    const row = element('label', 'setting-row');
    const labelLine = element('span', 'setting-label-line');
    const label = element('span', 'setting-label', option.label);
    const output = element('output', 'setting-value', `${state.settings[option.id]}%`);
    output.htmlFor = `setting-${option.id}`;
    labelLine.append(label, output);

    const description = element('span', 'setting-description', option.description);
    const input = document.createElement('input');
    input.id = `setting-${option.id}`;
    input.type = 'range';
    input.min = '0';
    input.max = '100';
    input.step = '1';
    input.value = String(state.settings[option.id]);
    input.addEventListener('input', () => {
      // 拖动时只更新当前行的数字，松开滑块后再派发 action，避免拖动过程中重建整个页面。
      output.value = `${input.value}%`;
    });
    input.addEventListener('change', () => {
      dispatch({
        type: ACTION_TYPES.UPDATE_SETTING,
        setting: option.id,
        value: input.value,
      });
    });

    row.append(labelLine, description, input);
    form.append(row);
  }

  const footer = element('div', 'settings-footer');
  const returnTo = getState().settingsReturnSceneId ?? scene.backTo;
  footer.append(createButton('返回', 'primary-button settings-back', () => {
    dispatch({ type: ACTION_TYPES.NAVIGATE, sceneId: returnTo });
  }));

  panel.append(heading, form, footer);
  content.append(panel);
  return createPage(scene, content, { immersive: true });
}

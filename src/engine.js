// 场景引擎：按 src/scenes.js 的数据表渲染当前场景，把按钮点击接到 goto()。
// 刻意保持最小：只有 title / narrative 两类渲染分支；要加新场景类型，在这里加一个分支。
import { getState, setState, subscribe } from './state.js';
import { SCENES } from './scenes.js';

let root = null;
let platformSdk = null; // 平台 SDK 句柄，未来接存档 / AI 时直接用

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function renderTitle(scene) {
  const view = el('section', 'view view-title');
  const heading = el('h1', 'game-title', scene.title);
  const start = el('button', 'btn-start', scene.startLabel);
  start.type = 'button';
  start.addEventListener('click', () => goto(scene.next));
  view.append(heading, start);
  return view;
}

function renderNarrative(scene) {
  const view = el('section', 'view view-narrative');
  view.append(el('p', 'scene-name', scene.name));
  view.append(el('p', 'scene-text', scene.text));

  // 选项渲染区 = 场景的扩展位：scene.choices 有内容就渲染成按钮，为空则保留占位框。
  const choicesBox = el('div', 'choices');
  for (const choice of scene.choices) {
    const btn = el('button', 'btn-choice', choice.label);
    btn.type = 'button';
    btn.addEventListener('click', () => goto(choice.next));
    choicesBox.append(btn);
  }
  if (scene.choices.length === 0) {
    choicesBox.append(
      el('p', 'choices-empty', '（扩展位：在 src/scenes.js 为本场景添加选项，即可接上后续剧情）')
    );
  }
  view.append(choicesBox);
  return view;
}

function render(sceneId) {
  const scene = SCENES[sceneId];
  if (!scene) {
    root.replaceChildren(el('p', 'scene-text', `未知场景：${sceneId}`));
    return;
  }
  const view = scene.kind === 'title' ? renderTitle(scene) : renderNarrative(scene);
  root.replaceChildren(view); // 换新节点，重放入场淡入动画
}

export function goto(sceneId) {
  setState({ sceneId });
}

export function startEngine(mount, sdk) {
  root = mount;
  platformSdk = sdk ?? null;
  subscribe(() => render(getState().sceneId));
  render(getState().sceneId);
}

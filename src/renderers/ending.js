// ending 场景渲染器：延续动画最后一帧，依次揭示遮罩、结局名与继续提示。
import { ACTION_TYPES, dispatch } from '../actions.js?v=20260915-script-v2-1';
import { createPage, element } from './shared.js?v=20260915-script-v2-1-ending-any-input-1-unified-ui-1-menu-label-1';

export const ENDING_REVEAL_TIMING = Object.freeze({
  maskDelay: 150,
  maskDuration: 1600,
  titleDelay: 1950,
  titleDuration: 850,
  continueDelay: 3300,
  continueDuration: 700,
  interactiveAt: 4000,
});

function cameraTransform(camera = {}) {
  const x = Number(camera.x ?? 0);
  const y = Number(camera.y ?? 0);
  const scale = Number(camera.scale ?? 1);
  return `translate3d(${Number.isFinite(x) ? x : 0}%, ${Number.isFinite(y) ? y : 0}%, 0) scale(${Number.isFinite(scale) && scale > 0 ? scale : 1})`;
}

/**
 * 渲染满足路由条件后可进入的 ending 场景。
 * @param {object} scene ending 场景配置
 * @returns {HTMLElement} 完整的 ending 页面
 */
export function renderEnding(scene) {
  const content = element('main', 'ending-page');
  const frame = element('div', 'ending-frame');
  const camera = element('div', 'ending-frame-camera');
  const image = element('div', 'ending-frame-image');
  const shade = element('div', 'ending-shade');
  const ending = element('section', 'ending-content');
  const kicker = element('p', 'ending-kicker', 'ENDING');
  const title = element('h1', 'ending-title', scene.title);
  const continueHint = element('p', 'ending-continue', '按任意键继续……');

  if (scene.endingFrame?.image) image.style.backgroundImage = `url("${scene.endingFrame.image}")`;
  camera.style.transform = cameraTransform(scene.endingFrame?.camera);
  camera.append(image);
  frame.append(camera);
  frame.setAttribute('aria-hidden', 'true');
  shade.setAttribute('aria-hidden', 'true');
  ending.append(kicker, title, continueHint);
  content.append(frame, shade, ending);
  content.setAttribute('aria-label', `${scene.title}。按任意键继续`);
  for (const [name, value] of Object.entries(ENDING_REVEAL_TIMING)) {
    content.style.setProperty(`--ending-${name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`, `${value}ms`);
  }

  const page = createPage(scene, content, { immersive: true, menu: false });
  const controller = new AbortController();
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  let interactive = false;
  let leaving = false;
  const readyTimer = window.setTimeout(() => {
    interactive = true;
    content.classList.add('is-ready');
  }, reducedMotion ? 0 : ENDING_REVEAL_TIMING.interactiveAt);
  const returnToTitle = (event) => {
    if (!interactive || leaving || (event.type === 'keydown' && event.repeat)) return;
    leaving = true;
    if (event.type === 'keydown') event.preventDefault();
    dispatch({ type: ACTION_TYPES.NAVIGATE, sceneId: scene.endTo ?? 'title' });
  };
  page.addEventListener('click', returnToTitle, { signal: controller.signal });
  window.addEventListener('keydown', returnToTitle, { signal: controller.signal });
  page.dispose = () => {
    window.clearTimeout(readyTimer);
    controller.abort();
  };
  return page;
}

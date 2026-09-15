// Development only. Set to false for release.
// To remove entirely: delete this file and the import + attachment in animation.js.
export const ANIMATION_SKIP_ENABLED = true;

export function attachAnimationSkip(page, onSkip) {
  if (!ANIMATION_SKIP_ENABLED) return;

  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = '跳过（测试）';
  button.title = '跳过整段动画，进入下一阶段（仅开发测试）';
  button.dataset.devControl = 'animation-skip';
  // Keep development-only styling here; sit beside the existing top-right menu.
  Object.assign(button.style, {
    position: 'fixed', top: '18px', right: '100px', zIndex: '20',
    minHeight: '36px', padding: '7px 14px', border: '1px dashed #e8b844',
    borderRadius: '6px', background: '#171a1f', color: '#e8b844',
    fontSize: '13px', fontWeight: '700', cursor: 'pointer',
  });
  button.addEventListener('click', () => {
    button.disabled = true;
    onSkip();
  }, { once: true });
  page.append(button);
}

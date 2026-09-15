// investigation 场景渲染器：管理热点、线索详情和线索档案入口。
import { ACTION_TYPES, dispatch } from '../actions.js?v=20260915-script-v2-1';
import { getClue } from '../clues.js';
import { getState } from '../state.js';
import { createButton, createPage, element } from './shared.js?v=20260915-script-v2-1-settings-hidden-menu-1-unified-ui-1-menu-label-1';

/**
 * 创建只负责关闭所属 dialog 的图标按钮。
 * @param {HTMLDialogElement} dialog 所属弹窗
 * @returns {HTMLButtonElement}
 */
function createCloseButton(dialog) {
  const close = createButton('×', 'dialog-close', () => dialog.close());
  close.setAttribute('aria-label', '关闭弹窗');
  close.title = '关闭';
  return close;
}

/**
 * 展示线索详情。弹窗关闭后自动从 document.body 移除，避免残留节点。
 * @param {{title: string, description: string}} clue 线索显示资料
 * @returns {void}
 */
export function openClueDialog(clue, popupType = null, acquired = false) {
  const dialog = element('dialog', 'game-dialog clue-dialog');
  dialog.setAttribute('aria-labelledby', 'clue-dialog-title');

  if (acquired && clue.image) {
    dialog.classList.add('clue-reveal-dialog');
    dialog.setAttribute('aria-label', `发现线索：${clue.revealLabel ?? clue.title}`);
    const heading = element('h2', 'clue-reveal-title', clue.revealLabel ?? clue.title);
    const photo = element('figure', 'clue-reveal-photo');
    const image = element('img', 'clue-reveal-image');
    image.src = clue.image;
    image.alt = clue.title;
    photo.append(image);
    const collect = createButton('收进档案', 'primary-button clue-collect-button', () => dialog.close());
    dialog.append(heading, photo, collect);
    dialog.addEventListener('cancel', (event) => event.preventDefault());
    document.body.append(dialog);
    dialog.addEventListener('close', () => dialog.remove(), { once: true });
    dialog.showModal();
    return;
  }

  dialog.append(createCloseButton(dialog));

  // The same presentation is used for both room hotspots and archived clues.
  if (clue.presentation === 'image' || clue.presentation === 'diary') {
    dialog.removeAttribute('aria-labelledby');
    dialog.setAttribute('aria-label', clue.title);
    if (clue.presentation === 'image') {
      dialog.classList.add('clue-archive-photo-dialog');
      const photo = element('figure', 'clue-reveal-photo clue-archive-photo');
      const image = element('img', 'clue-reveal-image');
      image.src = clue.image;
      image.alt = clue.title;
      photo.append(image);
      dialog.append(photo);
    } else {
      dialog.classList.add('diary-evidence-dialog');
      const body = element('article', 'diary-evidence-body', clue.body);
      body.tabIndex = 0;
      dialog.append(body);
    }
    document.body.append(dialog);
    dialog.addEventListener('close', () => dialog.remove(), { once: true });
    dialog.showModal();
    return;
  }

  const title = element('h2', 'dialog-title', clue.title);
  title.id = 'clue-dialog-title';
  if (popupType) {
    const preview = element('div', `clue-preview clue-preview-${popupType}`);
    preview.textContent = popupType === 'phone'
      ? '手机桌面：公众号列表（其中一项已打开）'
      : popupType === 'computer'
        ? '电脑屏幕：正在浏览公众号文章'
        : popupType === 'album'
          ? '相册内页：阿遥 5 岁 / 欢迎阿遥回家'
          : popupType === 'book'
            ? '书籍摘录：X 染色体显性遗传'
            : '记忆画面占位图';
    dialog.append(preview);
  }
  dialog.append(
    element('p', 'section-kicker', 'CLUE ACQUIRED'),
    title,
    element('p', 'dialog-copy', clue.description),
  );

  document.body.append(dialog);
  dialog.addEventListener('close', () => dialog.remove(), { once: true });
  dialog.showModal();
}

/**
 * 创建线索详情卡片，点击卡片后打开与热点相同的详情弹窗。
 * @param {{title: string, revealLabel?: string, image?: string}} clue 线索资料
 * @returns {HTMLButtonElement}
 */
function createArchiveCard(clue) {
  const card = createButton('', 'clue-card archive-clue-card', () => openClueDialog(clue));
  card.setAttribute('aria-label', `查看${clue.title}详情`);
  const image = element('img', 'clue-card-image');
  image.src = clue.image;
  image.alt = '';
  image.loading = 'lazy';
  image.draggable = false;
  card.append(image);
  return card;
}

/**
 * 打开线索档案弹窗。卡片只展示已经收集的线索，进入推理按钮不受收集数量限制。
 * @param {object} scene 当前 investigation 场景配置
 * @returns {void}
 */
function openClueArchiveDialog(scene) {
  const dialog = element('dialog', 'game-dialog menu-dialog case-board clue-archive-dialog');
  dialog.append(createCloseButton(dialog));

  const state = getState();
  const currentActClueIds = new Set(scene.archiveClueIds ?? scene.hotspots.map((hotspot) => hotspot.clueId));
  const clues = state.collectedClueIds
    .filter((clueId) => currentActClueIds.has(clueId))
    .map((clueId) => getClue(clueId))
    .filter(Boolean);
  const cards = element('div', 'clue-card-list');
  clues.forEach((clue) => cards.append(createArchiveCard(clue)));

  const archiveContent = clues.length > 0
    ? cards
    : element('p', 'archive-empty', '暂无线索');
  const heading = element('header', 'case-board-heading');
  heading.append(
    element('p', 'section-kicker', 'CLUE ARCHIVE'),
    element('h2', 'menu-dialog-title', '线索档案'),
  );
  dialog.append(
    heading,
    element('p', 'dialog-copy', `已收集 ${clues.length} 条线索。`),
    archiveContent,
  );

  document.body.append(dialog);
  dialog.addEventListener('close', () => dialog.remove(), { once: true });
  dialog.showModal();
}

function renderMemoryReview(scene) {
  const content = element('main', 'memory-review-page');
  const stage = element('section', 'memory-review-stage');
  const completedCards = new Set(getState().completedMemoryCards ?? []);
  stage.style.setProperty('--memory-review-background', `url("${new URL(scene.background, document.baseURI).href}")`);

  const grid = element('div', 'memory-review-grid');
  scene.memoryCards.forEach((card, index) => {
    const completed = completedCards.has(card.id);
    const locked = (card.unlockAfter ?? []).some((memoryId) => !completedCards.has(memoryId));
    const item = createButton('', `memory-film-card${locked ? ' is-locked' : ''}${completed ? ' is-complete' : ''}`, () => {
      if (card.animationScene && !locked) dispatch({ type: ACTION_TYPES.REPLAY_ANIMATION, sceneId: card.animationScene });
    });
    item.setAttribute('aria-label', `${card.title}${locked ? '，尚未解锁' : '，进入记忆'}`);
    item.dataset.memoryId = card.id;

    const frame = element('span', 'memory-film-frame');
    if (card.image) {
      const image = element('img', 'memory-film-image');
      image.src = card.image;
      image.alt = '';
      image.draggable = false;
      frame.append(image);
    } else {
      frame.append(element('span', 'memory-film-placeholder'));
    }
    frame.append(element('span', 'memory-film-shade'));
    const play = element('span', 'memory-film-play');
    play.setAttribute('aria-hidden', 'true');
    play.append(element('span', 'memory-film-play-icon'));
    frame.append(play);
    if (completed) frame.append(element('span', 'memory-film-check', '✓'));

    const caption = element('span', 'memory-film-caption');
    caption.append(
      element('span', 'memory-film-number', String(index + 1).padStart(2, '0')),
      element('strong', 'memory-film-name', card.title),
    );
    item.append(frame, caption);
    grid.append(item);
  });

  stage.append(grid);
  content.append(stage);
  return createPage(scene, content, { immersive: true });
}

/**
 * 渲染 investigation 场景，包括百分比热点和线索档案入口。
 * 热点点击先派发 COLLECT_CLUE；action 成功后才展示线索详情。
 *
 * @param {object} scene investigation 场景配置
 * @returns {HTMLElement} 完整的 investigation 页面
 */
export function renderInvestigation(scene) {
  if (scene.layout === 'memory-review') return renderMemoryReview(scene);

  const state = getState();
  const investigated = state.investigatedHotspots[scene.id] ?? [];

  const content = element('main', 'investigation-page');
  const stage = element('section', 'investigation-stage');
  const usesImage = /\.(png|jpe?g|webp)$/i.test(scene.background ?? '');
  const invisible = scene.hotspotStyle === 'invisible';
  let imageFrame = null;
  let resizeObserver = null;
  let roomImage = null;
  let fitImage = null;
  if (usesImage) {
    content.classList.add('investigation-page-with-image');
    stage.classList.add('investigation-stage-with-image');
    imageFrame = element('div', 'investigation-image-frame');
    roomImage = element('img', 'investigation-room-image');
    roomImage.src = scene.background;
    roomImage.alt = scene.title;
    roomImage.draggable = false;
    // 搜证背景铺满舞台；热点与等比放大的图片共用坐标系，裁切时仍保持对齐。
    fitImage = () => {
      if (!roomImage.naturalWidth || !roomImage.naturalHeight) return;
      const scale = Math.max(stage.clientWidth / roomImage.naturalWidth, stage.clientHeight / roomImage.naturalHeight);
      imageFrame.style.width = `${roomImage.naturalWidth * scale}px`;
      imageFrame.style.height = `${roomImage.naturalHeight * scale}px`;
      roomImage.classList.add('is-loaded');
    };
    roomImage.addEventListener('load', fitImage);
    resizeObserver = new ResizeObserver(fitImage);
    resizeObserver.observe(stage);
    imageFrame.append(roomImage);
    stage.append(imageFrame);
    if (roomImage.complete && roomImage.naturalWidth) fitImage();
  }
  stage.dataset.progress = String(investigated.length);

  const heading = element('header', 'investigation-heading');
  heading.append(
    element('p', 'section-kicker', `已调查 ${investigated.length} 件物品`),
    element('h1', 'investigation-title', scene.title),
    element('p', 'investigation-description', scene.description),
  );

  const hotspots = element('div', 'hotspot-layer');
  scene.hotspots.forEach((hotspot, index) => {
    const clue = getClue(hotspot.clueId);
    const discovered = investigated.includes(hotspot.id);
    const button = createButton(
      invisible ? '' : discovered ? clue.title : `线索 ${index + 1}`,
      invisible ? 'object-hotspot' : 'hotspot-button',
      () => {
        const result = dispatch({
          type: ACTION_TYPES.COLLECT_CLUE,
          hotspotId: hotspot.id,
          clueId: hotspot.clueId,
        });
        if (result.ok && !result.alreadyInvestigated) openClueDialog(result.clue, hotspot.popupType, true);
      },
    );
    button.style.left = `${hotspot.x}%`;
    button.style.top = `${hotspot.y}%`;
    if (hotspot.width) button.style.width = `${hotspot.width}%`;
    if (hotspot.height) button.style.height = `${hotspot.height}%`;
    button.dataset.hotspotId = hotspot.id;
    if (hotspot.shape) button.dataset.shape = hotspot.shape;
    button.setAttribute('aria-label', hotspot.label ? `调查${hotspot.label}` : discovered ? `重新查看${clue.title}` : `调查线索 ${index + 1}`);
    if (discovered) {
      button.classList.add('is-discovered');
      button.disabled = true;
    }
    if (!invisible) button.prepend(element('span', 'hotspot-index', String(index + 1).padStart(2, '0')));
    hotspots.append(button);
  });

  const archiveButton = createButton('线索档案', 'immersive-menu-button investigation-archive-button', () => {
    openClueArchiveDialog(scene);
  });

  const deductionButton = createButton('开始推理', 'primary-button investigation-deduction-button', () => {
    dispatch({ type: ACTION_TYPES.NAVIGATE, sceneId: scene.exitTo });
  });
  (imageFrame ?? stage).append(hotspots);
  stage.append(heading, archiveButton, deductionButton);
  content.append(stage);
  const page = createPage(scene, content, { immersive: usesImage });
  page.dispose = () => {
    resizeObserver?.disconnect();
    if (roomImage && fitImage) roomImage.removeEventListener('load', fitImage);
  };
  return page;
}

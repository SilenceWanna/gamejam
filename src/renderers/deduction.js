import { ACTION_TYPES, dispatch } from '../actions.js?v=20260915-script-v2-1-dialogue-split-1-deduction-portrait-wait-1-deduction-hold-2s-1';
import { getClue } from '../clues.js';
import { DEDUCTION_INTRO_TIMING, getDeductionIntroProgress } from '../deduction-intro.js?v=20260915-deduction-intro-3-portrait-wait-1-deduction-hold-2s-1';
import { getState } from '../state.js';
import { createButton, createPage, element } from './shared.js?v=20260915-script-v2-1-settings-hidden-menu-1-unified-ui-1-menu-label-1';
import { openClueDialog } from './investigation.js';
import { createDialogue } from './memory-dialogue.js?v=20260915-dialogue-delay-1-writing-sfx-1-audio-layout-1-writing-level-1';
import { usesWhiteTransition, WHITE_TRANSITION_TIMING } from '../scene-transitions.js?v=20260915-script-v2-1-first-two-minigame-no-white-1';

const cardPlacements = [
  // The first six clues form three clear groups: two over the expression,
  // three staggered on the right, and one beside the lamp on the lower left.
  { x: 81, y: 14, compactX: 83, rotation: -4.5 },
  { x: 41, y: 9.7, compactX: 40, compactY: 10, rotation: 2 },
  { x: 71.5, y: 32, compactX: 74, rotation: 3.5 },
  { x: 23.5, y: 52, compactX: 10, rotation: -2.5 },
  { x: 79, y: 50, compactX: 79.5, rotation: -2.5 },
  { x: 55, y: 10, compactX: 55, compactY: 10.3, rotation: -3 },
  // Any later clues continue across the lower board instead of crowding the right.
  { x: 36, y: 57, compactX: 29, compactY: 58, rotation: 3 },
  { x: 51, y: 59, compactX: 46, compactY: 56, rotation: 2 },
  { x: 66, y: 56, compactX: 63, compactY: 59, rotation: -2.5 },
];

function feedbackText(reason) {
  if (reason === 'INCOMPLETE_EXPRESSION') return '请先填满表达式中的空格。';
  if (reason === 'CLUE_NOT_COLLECTED') return '这条线索尚未收集。';
  return '这些线索还无法建立联系。';
}

function createClueVisual(clue, className = '') {
  const visual = element('div', `deduction-clue-visual${className ? ` ${className}` : ''}`);
  if (clue?.image) {
    const image = element('img', 'deduction-clue-image');
    image.src = clue.image;
    image.alt = clue.title;
    image.draggable = false;
    visual.append(image);
  } else {
    visual.classList.add('is-text-clue');
    visual.append(element('span', 'deduction-clue-stamp', '线索'));
  }
  if (clue) visual.append(element('strong', 'deduction-card-title', clue.revealLabel ?? clue.title));
  return visual;
}

export function renderDeduction(scene) {
  const state = getState();
  const consumed = new Set(state.consumedClueIds ?? []);
  const allClues = [...new Set(state.collectedClueIds)]
    .filter((clueId) => !consumed.has(clueId))
    .map(getClue)
    .filter(Boolean);
  const availableIds = new Set(allClues.map((clue) => clue.id));
  const fixedSlots = scene.fixedSlots ?? {};
  const fixedIds = new Set(Object.values(fixedSlots));
  const clues = allClues.filter((clue) => !fixedIds.has(clue.id));
  const previous = state.deductions[scene.deductionId];
  const failureLockUntil = Number(previous?.failureLockUntil ?? 0);
  const failureLocked = failureLockUntil > Date.now();
  const usePreviousAssignments = !previous?.failureLockUntil || failureLocked;
  const introProgress = getDeductionIntroProgress(
    state.deductionIntros?.[scene.deductionId],
    previous,
  );
  const assignments = Array.from({ length: scene.requiredCount }, (_, index) => {
    const fixedId = fixedSlots[index];
    if (fixedId && availableIds.has(fixedId)) return fixedId;
    const id = usePreviousAssignments ? previous?.lastClueIds?.[index] : null;
    return availableIds.has(id) ? id : null;
  });
  let selectedId = null;
  let draggedId = null;
  const content = element('main', 'deduction-page');
  if (/\.(png|jpe?g|webp)$/i.test(scene.background ?? '')) {
    content.classList.add('has-image-background');
    const background = element('div', 'deduction-background');
    background.style.backgroundImage = `url("${scene.background}")`;
    content.append(background);
  }
  if (previous?.passed && scene.outroLines?.length) {
    content.classList.add('deduction-outro');
    const outroIndex = Math.min(previous.outroIndex ?? 0, scene.outroLines.length - 1);
    const line = scene.outroLines[outroIndex];
    let transitionTimer = null;
    let advancing = false;
    const advanceOutro = () => {
      if (advancing) return;
      advancing = true;
      if (outroIndex < scene.outroLines.length - 1) {
        const result = dispatch({
          type: ACTION_TYPES.ADVANCE_DEDUCTION_OUTRO,
          deductionId: scene.deductionId,
        });
        if (!result.ok) advancing = false;
        return;
      }
      const destination = scene.outroNext;
      if (!destination) return;
      if (!usesWhiteTransition(scene.id, destination)) {
        dispatch({ type: ACTION_TYPES.NAVIGATE, sceneId: destination });
        return;
      }
      const veil = element('div', 'deduction-fade-veil');
      content.append(veil);
      veil.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: WHITE_TRANSITION_TIMING.fadeIn,
        easing: 'ease-in-out',
        fill: 'forwards',
      });
      transitionTimer = window.setTimeout(() => {
        dispatch({ type: ACTION_TYPES.NAVIGATE, sceneId: destination });
      }, WHITE_TRANSITION_TIMING.fadeIn + WHITE_TRANSITION_TIMING.hold);
    };
    content.append(...createDialogue(line, advanceOutro, { showBackground: false }));
    const page = createPage(scene, content, { immersive: true });
    page.dispose = () => {
      if (transitionTimer !== null) window.clearTimeout(transitionTimer);
    };
    return page;
  }
  if (introProgress.stage === 'dialogue') {
    content.classList.add('deduction-intro-dialogue');
    const lines = scene.introLines?.length
      ? scene.introLines
      : [{ speaker: '弥', text: '把这些线索放在一起看看。', portraitId: 'hero' }];
    const line = lines[Math.min(introProgress.introIndex, lines.length - 1)];
    let advancing = false;
    content.append(...createDialogue(line, () => {
      if (advancing) return;
      advancing = true;
      const result = dispatch({
        type: ACTION_TYPES.DEDUCTION_INTRO_ACTION,
        deductionId: scene.deductionId,
        event: 'dialogue',
      });
      if (!result.ok) advancing = false;
    }, { showBackground: false }));
    return createPage(scene, content, { immersive: true });
  }
  const presentingInstructions = introProgress.stage === 'instructions';
  content.dataset.introStage = introProgress.stage;
  content.classList.toggle('is-presenting-instructions', presentingInstructions);
  const back = createButton('返回搜证', 'immersive-menu-button deduction-back', () => {
    dispatch({ type: ACTION_TYPES.NAVIGATE, sceneId: scene.backTo });
  });
  back.hidden = presentingInstructions;
  content.append(back);
  const question = scene.question ?? '有些线索好像有联系';
  const instructions = element('aside', 'deduction-instructions');
  instructions.setAttribute('aria-label', `${question}，推理与耐心值说明`);
  instructions.append(
    element('h1', 'deduction-instructions-title', question),
    element('p', 'deduction-instructions-copy', '选择或拖动案情板上的线索，把它们放进中央虚线框，组成关系式后提交。'),
    element('p', 'deduction-instructions-copy', '推理错误会消耗阿遥的耐心值，请在耐心值耗尽之前完成推理。'),
    element('p', 'deduction-instructions-patience', `耐心值 ${state.patience ?? 3} / ${state.maxPatience ?? 3}`),
  );
  content.append(instructions);
  const panel = element('section', 'deduction-panel');
  panel.inert = presentingInstructions || failureLocked;
  panel.classList.toggle('is-failure-locked', failureLocked);
  const form = element('form', 'deduction-form');
  const expression = element('div', 'deduction-expression');
  expression.setAttribute('role', 'group');
  expression.setAttribute('aria-label', '拖入线索组成矛盾表达式');
  expression.dataset.slots = String(scene.requiredCount);
  const feedback = element('p', 'form-feedback');
  feedback.setAttribute('role', 'status');
  if (previous?.attempts && previous.lastReason && (!previous.failureLockUntil || failureLocked)) {
    feedback.textContent = feedbackText(previous.lastReason);
  }
  const shelf = element('section', 'deduction-shelf');
  shelf.setAttribute('aria-label', '所有已收集的线索');
  const cards = element('div', 'deduction-card-grid');

  function putClue(id, index) {
    if (failureLocked || !availableIds.has(id) || fixedSlots[index]) return;
    const origin = assignments.indexOf(id);
    const displaced = assignments[index];
    // 一条线索只能占一个格子；从另一格拖入时交换位置。
    if (origin !== -1 && origin !== index) assignments[origin] = displaced;
    assignments[index] = id;
    selectedId = null;
    feedback.textContent = '';
    paint();
  }

  function makeDraggable(node, id, enabled = true) {
    node.draggable = enabled;
    if (!enabled) return;
    node.addEventListener('dragstart', (event) => {
      draggedId = id;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', id);
      node.classList.add('is-dragging');
    });
    node.addEventListener('dragend', () => {
      draggedId = null;
      node.classList.remove('is-dragging');
      expression.querySelectorAll('.is-drop-target').forEach((target) => target.classList.remove('is-drop-target'));
    });
  }

  function paint() {
    expression.replaceChildren();
    assignments.forEach((id, index) => {
      if (index > 0) {
        const operator = scene.expressionOperators?.[index - 1] ?? '+';
        const symbol = element('span', 'deduction-operator', operator);
        symbol.setAttribute('aria-label', operator === '≠' ? '与之矛盾' : '加');
        expression.append(symbol);
      }
      const clue = getClue(id);
      const slot = element('div', 'deduction-slot');
      const isFixed = Boolean(fixedSlots[index] && fixedSlots[index] === id);
      slot.dataset.slotIndex = String(index);
      slot.tabIndex = isFixed || failureLocked ? -1 : 0;
      slot.setAttribute('role', 'group');
      slot.setAttribute('aria-disabled', String(failureLocked));
      slot.setAttribute('aria-label', `表达式空格 ${index + 1}${clue ? `：${clue.title}${isFixed ? '，固定线索' : ''}` : '：拖入线索'}`);
      if (clue) {
        slot.classList.add('is-filled');
        if (isFixed) slot.classList.add('is-fixed');
        const card = element('div', 'deduction-slot-card');
        card.append(createClueVisual(clue));
        if (isFixed) {
          card.draggable = false;
          slot.append(card, element('span', 'deduction-slot-fixed', '固定'));
        } else {
          makeDraggable(card, id, !failureLocked);
          const remove = createButton('×', 'deduction-slot-remove', (event) => {
            if (failureLocked) return;
            event.stopPropagation();
            assignments[index] = null;
            paint();
          });
          remove.disabled = failureLocked;
          remove.setAttribute('aria-label', `移除${clue.title}`);
          slot.append(card, remove);
        }
      } else {
        slot.append(element('span', 'deduction-slot-placeholder', '拖入线索'));
      }
      if (fixedSlots[index]) {
        expression.append(slot);
        return;
      }
      const selectSlot = () => {
        if (failureLocked) return;
        if (selectedId) putClue(selectedId, index);
        else if (id) { selectedId = id; paint(); }
      };
      slot.addEventListener('click', selectSlot);
      slot.addEventListener('keydown', (event) => {
        if (event.target !== slot || event.repeat || !['Enter', ' '].includes(event.key)) return;
        event.preventDefault();
        selectSlot();
      });
      slot.addEventListener('dragover', (event) => {
        if (failureLocked) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        slot.classList.add('is-drop-target');
      });
      slot.addEventListener('dragleave', (event) => {
        if (!slot.contains(event.relatedTarget)) slot.classList.remove('is-drop-target');
      });
      slot.addEventListener('drop', (event) => {
        if (failureLocked) return;
        event.preventDefault();
        const dropped = event.dataTransfer.getData('text/plain') || draggedId;
        slot.classList.remove('is-drop-target');
        putClue(dropped, index);
      });
      expression.append(slot);
    });
    if (scene.resultSlot) {
      expression.append(element('span', 'deduction-operator', '='));
      const displayedProducedClueId = previous?.failureLockUntil && !failureLocked
        ? null
        : previous?.lastProducedClueId;
      const resultClue = getClue(displayedProducedClueId);
      const resultSlot = element('div', `deduction-slot deduction-result-slot${resultClue ? ' is-filled' : ''}`);
      if (resultClue) {
        const resultCard = element('div', `deduction-slot-card${resultClue.id === 'clue_station_woman_birth_mother' ? ' is-final-result' : ''}`);
        resultCard.append(createClueVisual(resultClue));
        resultSlot.append(resultCard);
      } else {
        resultSlot.append(element('span', 'deduction-result-question', '?'));
      }
      expression.append(resultSlot);
    }

    cards.replaceChildren();
    clues.forEach((clue, index) => {
      const card = createButton('', 'clue-card deduction-card', () => {
        if (failureLocked) return;
        selectedId = clue.id;
        paint();
        if (clue.image) openClueDialog(clue);
      });
      card.dataset.clueId = clue.id;
      card.disabled = failureLocked;
      card.setAttribute('aria-disabled', String(failureLocked));
      card.classList.toggle('is-selected', selectedId === clue.id);
      card.classList.toggle('is-assigned', assignments.includes(clue.id));
      card.setAttribute('aria-pressed', String(selectedId === clue.id));
      card.setAttribute('aria-label', clue.image
        ? `${clue.revealLabel ?? clue.title}，点击查看详情，也可拖入推理空格`
        : `${clue.title}，选择并拖入推理空格`);
      const placement = cardPlacements[index % cardPlacements.length];
      card.style.setProperty('--clue-x', `${placement.x}%`);
      card.style.setProperty('--clue-y', `${placement.y}%`);
      card.style.setProperty('--clue-x-compact', `${placement.compactX}%`);
      card.style.setProperty('--clue-y-compact', `${placement.compactY ?? placement.y}%`);
      card.style.setProperty('--clue-rotation', `${placement.rotation}deg`);
      card.append(createClueVisual(clue));
      makeDraggable(card, clue.id, !failureLocked);
      cards.append(card);
    });
    if (!clues.length) cards.append(element('p', 'deduction-empty', '当前还没有已收集的线索。'));
  }

  const submit = element('button', 'primary-button deduction-submit', '提交');
  submit.type = 'submit';
  submit.disabled = presentingInstructions || failureLocked;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (failureLocked) return;
    if (assignments.some((id) => !id)) {
      feedback.textContent = feedbackText('INCOMPLETE_EXPRESSION');
      return;
    }
    const result = dispatch({ type: ACTION_TYPES.SUBMIT_DEDUCTION, deductionId: scene.deductionId, clueIds: assignments });
    if (!result.correct) feedback.textContent = feedbackText(result.reason);
  });
  const controls = element('div', 'deduction-actions');
  controls.append(submit);
  form.append(expression, feedback, controls);
  shelf.append(element('h2', 'deduction-shelf-title', '线索档案'), cards);
  panel.append(form, shelf);
  content.append(panel);
  paint();
  const page = createPage(scene, content, { immersive: true });
  let failureTimer = null;
  if (previous?.failureLockUntil) {
    const delay = Math.max(0, failureLockUntil - Date.now());
    failureTimer = window.setTimeout(() => {
      failureTimer = null;
      dispatch({
        type: ACTION_TYPES.CLEAR_DEDUCTION_FAILURE,
        deductionId: scene.deductionId,
      });
    }, delay);
  }
  const introController = new AbortController();
  let introAnimation = null;
  let introFrameId = null;
  let introDisposed = false;
  if (presentingInstructions) {
    let elapsed = introProgress.stageElapsed;
    let lastTime = null;
    let committed = false;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const centreTransform = reduced ? 'translate(-50%, -50%)' : 'translate(-50%, -50%) scale(1.28)';
    const revealOffset = DEDUCTION_INTRO_TIMING.portraitFade / DEDUCTION_INTRO_TIMING.total;
    const fadeOffset = (DEDUCTION_INTRO_TIMING.portraitFade + DEDUCTION_INTRO_TIMING.fadeIn)
      / DEDUCTION_INTRO_TIMING.total;
    const holdOffset = (DEDUCTION_INTRO_TIMING.portraitFade
      + DEDUCTION_INTRO_TIMING.fadeIn + DEDUCTION_INTRO_TIMING.hold)
      / DEDUCTION_INTRO_TIMING.total;
    instructions.classList.add('is-presenting');
    introAnimation = instructions.animate([
      { top: '50%', left: '50%', transform: centreTransform, opacity: 0, offset: 0 },
      { top: '50%', left: '50%', transform: centreTransform, opacity: 0, offset: revealOffset },
      { top: '50%', left: '50%', transform: centreTransform, opacity: 1, offset: fadeOffset },
      { top: '50%', left: '50%', transform: centreTransform, opacity: 1, offset: holdOffset },
      { top: 'var(--deduction-instructions-top)', left: 'var(--deduction-instructions-left)', transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 1 },
    ], { duration: DEDUCTION_INTRO_TIMING.total, fill: 'both', easing: 'ease-in-out' });
    introAnimation.pause();
    introAnimation.currentTime = elapsed;

    const tick = (now) => {
      if (introDisposed) return;
      const paused = document.hidden || Boolean(document.querySelector('dialog[open]'));
      if (lastTime !== null && !paused) elapsed += now - lastTime;
      lastTime = now;
      introAnimation.currentTime = Math.min(elapsed, DEDUCTION_INTRO_TIMING.total);
      if (!paused && elapsed >= DEDUCTION_INTRO_TIMING.total && !committed) {
        committed = true;
        dispatch({
          type: ACTION_TYPES.DEDUCTION_INTRO_ACTION,
          deductionId: scene.deductionId,
          event: 'instructions-done',
          elapsed,
        });
        return;
      }
      introFrameId = requestAnimationFrame(tick);
    };
    document.addEventListener('visibilitychange', () => { lastTime = null; }, { signal: introController.signal });
    page.querySelector(':scope > .immersive-menu-button')?.addEventListener('click', () => {
      dispatch({
        type: ACTION_TYPES.DEDUCTION_INTRO_ACTION,
        deductionId: scene.deductionId,
        event: 'checkpoint',
        elapsed,
      });
    }, { capture: true, signal: introController.signal });
    introFrameId = requestAnimationFrame(tick);
  }
  let finalizeTimer = null;
  if (previous?.pendingStep) {
    finalizeTimer = window.setTimeout(() => {
      if (previous.pendingStep.complete) {
        const veil = element('div', 'deduction-fade-veil');
        page.append(veil);
        veil.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 700, fill: 'forwards', easing: 'ease-in-out' });
        finalizeTimer = window.setTimeout(() => {
          dispatch({ type: ACTION_TYPES.FINALIZE_DEDUCTION_STEP, deductionId: scene.deductionId });
        }, 700);
      } else {
        dispatch({ type: ACTION_TYPES.FINALIZE_DEDUCTION_STEP, deductionId: scene.deductionId });
      }
    }, 1000);
  }
  page.dispose = () => {
    introDisposed = true;
    introController.abort();
    cancelAnimationFrame(introFrameId);
    introAnimation?.cancel();
    if (failureTimer !== null) window.clearTimeout(failureTimer);
    if (finalizeTimer !== null) window.clearTimeout(finalizeTimer);
  };
  return page;
}

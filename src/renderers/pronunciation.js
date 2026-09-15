import { ACTION_TYPES, dispatch } from '../actions.js?v=20260915-script-v2-1-minigame-office-intro-1';
import { getPronunciationProgress, PRONUNCIATION_TIMING } from '../pronunciation.js?v=20260915-pronunciation-random-sides-1';
import { getState } from '../state.js';
import { createButton, createPage, element } from './shared.js?v=20260915-script-v2-1-settings-hidden-menu-1-unified-ui-1-menu-label-1';
import { createDialogue } from './memory-dialogue.js?v=20260915-script-v2-1-minigame-narration-1-dialogue-delay-1-writing-sfx-1-audio-layout-1-writing-level-1';

export function renderPronunciation(scene) {
  const progress = getPronunciationProgress(getState().minigames[scene.id], scene);
  const talking = ['intro', 'outro'].includes(progress.stage);
  const closing = progress.stage === 'outro';
  const dialogueLines = closing ? scene.outroLines : scene.introLines;
  const dialogueIndex = closing ? progress.outroIndex : progress.introIndex;
  const dialogueLine = talking ? dialogueLines?.[dialogueIndex] : null;
  const content = element('main', 'pronunciation-memory-page');
  content.dataset.stage = progress.stage;
  content.setAttribute('aria-label', '课堂注音');
  const background = element('img', 'pronunciation-background');
  background.src = dialogueLine?.background ?? scene.background;
  background.alt = '';
  background.draggable = false;
  const revealBackground = () => background.classList.add('is-loaded');
  background.addEventListener('load', revealBackground, { once: true });
  if (background.complete && background.naturalWidth) revealBackground();
  content.append(background);
  let elapsed = progress.stageElapsed;
  let disposed = false;
  let committed = false;
  const send = (event, details = {}) => {
    if (disposed || committed || document.querySelector('dialog[open]')) return;
    committed = true;
    const result = dispatch({ type: ACTION_TYPES.MINIGAME_ACTION, event, elapsed, ...details });
    if (!result.ok) committed = false;
  };
  let animation = null;
  if (talking) {
    content.append(...createDialogue(dialogueLine, () => send('dialogue'), { showBackground: false }));
  } else {
    const instructions = element('section', 'pronunciation-instructions');
    instructions.append(element('h1', '', '找回阿遥的读音'), element('p', '', scene.instructions));
    content.append(instructions);
    if (progress.stage === 'instructions') {
      animation = instructions.animate([
        { top: '50%', left: '50%', transform: 'translate(-50%, -50%) scale(1.25)', opacity: 0, offset: 0 },
        { top: '50%', left: '50%', transform: 'translate(-50%, -50%) scale(1.25)', opacity: 1, offset: .14 },
        { top: '50%', left: '50%', transform: 'translate(-50%, -50%) scale(1.25)', opacity: 1, offset: .72 },
        { top: '24px', left: '24px', transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 1 },
      ], { duration: PRONUNCIATION_TIMING.instructions, fill: 'both', easing: 'ease-in-out' });
      animation.pause();
      animation.currentTime = elapsed;
    } else {
      const exercise = element('section', 'pronunciation-exercise');
      exercise.setAttribute('aria-label', '春天来了，小树长出了嫩绿的叶子');
      const sentence = element('div', 'pronunciation-sentence');
      for (const entry of scene.sentence) {
        if (entry.char === '，') {
          sentence.append(element('span', 'pronunciation-punctuation', entry.char));
          continue;
        }
        const word = scene.words.find(word => word.id === entry.wordId);
        const filled = word && progress.answers[word.id] === word.correct;
        const column = element('div', 'pronunciation-syllable');
        column.dataset.character = entry.char;
        const pinyin = filled ? word.options.find(option => option.id === word.correct).label : entry.pinyin ?? '';
        const guide = element('div', 'pinyin-guide');
        guide.append(element('span', 'pinyin-text', pinyin));
        guide.setAttribute('aria-label', pinyin || `${entry.char}的拼音待填写`);
        guide.classList.toggle('is-filled', !!filled);
        const cell = word ? createButton(entry.char, 'character-grid', () => send('select', { wordId: word.id }))
          : element('div', 'character-grid', entry.char);
        if (word) {
          cell.disabled = filled || progress.stage !== 'playing';
          cell.setAttribute('aria-label', filled ? `${entry.char}，已填写${pinyin}` : `为${entry.char}选择拼音`);
          cell.setAttribute('aria-pressed', String(progress.selectedWordId === word.id));
          cell.classList.add('is-interactive');
          cell.classList.toggle('is-complete', !!filled);
        }
        column.append(guide, cell);
        sentence.append(column);
      }
      const selection = element('section', 'pronunciation-selection');
      selection.setAttribute('aria-label', '读音选项');
      const selected = scene.words.find(word => word.id === progress.selectedWordId);
      if (selected) {
        selection.append(element('p', 'pronunciation-selection-label', `阿遥会怎么念「${selected.word}」？`));
        const options = element('div', 'pronunciation-answer-options');
        const orderedOptions = (progress.optionOrder?.[selected.id] ?? selected.options.map(option => option.id))
          .map(optionId => selected.options.find(option => option.id === optionId))
          .filter(Boolean);
        orderedOptions.forEach(option => options.append(createButton(option.label, 'pronunciation-answer', () => send('answer', { answer: option.id }))));
        selection.append(options);
      } else {
        selection.append(element('p', 'pronunciation-selection-label', progress.passed ? '四处拼音已补全' : '点击尚未注音的字'));
      }
      exercise.append(sentence, selection);
      content.append(exercise);
      if (progress.feedback) {
        const subtitle = element('p', 'pronunciation-subtitle', progress.feedback === 'wrong'
          ? '阿遥好像不是这么说的……' : '阿遥确实是这么念的。');
        subtitle.setAttribute('role', 'status');
        content.append(subtitle);
      }
    }
  }
  const page = createPage(scene, content, { immersive: true });
  const controller = new AbortController();
  page.querySelector('.immersive-menu-button').addEventListener('click', () => {
    dispatch({ type: ACTION_TYPES.MINIGAME_ACTION, event: 'checkpoint', elapsed });
  }, { capture: true, signal: controller.signal });
  let lastTime = null;
  let frameId = null;
  const tick = now => {
    if (disposed) return;
    const paused = document.hidden || !!document.querySelector('dialog[open]') || !background.complete || !background.naturalWidth;
    if (lastTime !== null && !paused) elapsed += now - lastTime;
    lastTime = now;
    if (animation) animation.currentTime = elapsed;
    const duration = progress.stage === 'instructions' ? PRONUNCIATION_TIMING.instructions : PRONUNCIATION_TIMING.completion;
    if (!paused && elapsed >= duration) { send(progress.stage === 'instructions' ? 'instructions-done' : 'completion-done'); return; }
    frameId = requestAnimationFrame(tick);
  };
  document.addEventListener('visibilitychange', () => { lastTime = null; }, { signal: controller.signal });
  if (['instructions', 'completion'].includes(progress.stage)) frameId = requestAnimationFrame(tick);
  page.dispose = () => { disposed = true; controller.abort(); cancelAnimationFrame(frameId); animation?.cancel(); };
  return page;
}

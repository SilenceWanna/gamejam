export const PRONUNCIATION_TIMING = Object.freeze({ instructions: 3200, completion: 1200 });

function seededRandom(value) {
  let seed = 2166136261;
  for (const character of value) {
    seed ^= character.charCodeAt(0);
    seed = Math.imul(seed, 16777619);
  }
  return () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
}

export function createPronunciationOptionOrder(scene, random = Math.random) {
  const correctOnLeft = scene.words.map((_, index) => index < Math.ceil(scene.words.length / 2));
  for (let index = correctOnLeft.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1));
    [correctOnLeft[index], correctOnLeft[swapIndex]] = [correctOnLeft[swapIndex], correctOnLeft[index]];
  }
  return Object.fromEntries(scene.words.map((word, index) => {
    const correct = word.options.find(option => option.id === word.correct);
    const alternatives = word.options.filter(option => option.id !== word.correct);
    const ordered = correctOnLeft[index] ? [correct, ...alternatives] : [...alternatives, correct];
    return [word.id, ordered.filter(Boolean).map(option => option.id)];
  }));
}

export function getPronunciationProgress(saved, scene, random = Math.random) {
  const layoutRandom = saved ? seededRandom(JSON.stringify(saved)) : random;
  const initial = { version: 3, stage: 'intro', stageElapsed: 0, introIndex: 0, outroIndex: 0,
    answers: {}, selectedWordId: null, feedback: null, passed: false,
    optionOrder: createPronunciationOptionOrder(scene, layoutRandom) };
  if (saved?.version === 3) return { ...initial, ...saved };
  // Preserve correct entries from older saves, but never fill in incorrect answers.
  const answers = Object.fromEntries(scene.words.filter(word => saved?.answers?.[word.id] === word.correct)
    .map(word => [word.id, word.correct]));
  const passed = scene.words.every(word => answers[word.id] === word.correct);
  return { ...initial, answers, passed, stage: passed ? 'outro' : 'intro' };
}

export function updatePronunciationProgress(saved, action, scene) {
  const previous = getPronunciationProgress(saved, scene);
  const next = { ...previous };
  const enter = stage => { next.stage = stage; next.stageElapsed = 0; };
  const reject = () => ({ ok: false, reason: 'INVALID_PRONUNCIATION_ACTION' });
  switch (action.event) {
    case 'dialogue': {
      if (!['intro', 'outro'].includes(previous.stage)) return reject();
      const closing = previous.stage === 'outro';
      const key = closing ? 'outroIndex' : 'introIndex';
      const lines = closing ? scene.outroLines : scene.introLines;
      if (previous[key] < lines.length - 1) next[key]++;
      else if (closing) return { ok: true, state: next, complete: true };
      else enter('instructions');
      break;
    }
    case 'checkpoint':
      if (!Number.isFinite(action.elapsed) || action.elapsed < 0) return reject();
      next.stageElapsed = action.elapsed;
      break;
    case 'instructions-done':
      if (previous.stage !== 'instructions' || !Number.isFinite(action.elapsed)
        || action.elapsed < PRONUNCIATION_TIMING.instructions) return reject();
      enter('playing');
      break;
    case 'select': {
      const word = scene.words.find(word => word.id === action.wordId);
      if (previous.stage !== 'playing' || !word || previous.answers[word.id]) return reject();
      next.selectedWordId = word.id;
      next.feedback = null;
      break;
    }
    case 'answer': {
      const word = scene.words.find(word => word.id === previous.selectedWordId);
      if (previous.stage !== 'playing' || !word || previous.answers[word.id]
        || !word.options.some(option => option.id === action.answer)) return reject();
      if (action.answer !== word.correct) next.feedback = 'wrong';
      else {
        next.answers = { ...previous.answers, [word.id]: word.correct };
        next.feedback = 'correct';
        next.selectedWordId = null;
        next.passed = scene.words.every(item => next.answers[item.id] === item.correct);
        if (next.passed) enter('completion');
      }
      break;
    }
    case 'completion-done':
      if (previous.stage !== 'completion' || !Number.isFinite(action.elapsed)
        || action.elapsed < PRONUNCIATION_TIMING.completion) return reject();
      enter('outro');
      break;
    default: return reject();
  }
  return { ok: true, state: next, complete: false };
}

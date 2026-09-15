import { CROSSFADE_TRANSITION_TIMING } from './scene-transitions.js?v=20260915-script-v2-1-visual-crossfade-1';

export const DEDUCTION_INTRO_TIMING = Object.freeze({
  portraitFade: CROSSFADE_TRANSITION_TIMING.visual,
  fadeIn: 300,
  hold: 2000,
  move: 1200,
  total: CROSSFADE_TRANSITION_TIMING.visual + 300 + 2000 + 1200,
});

const VALID_STAGES = new Set(['dialogue', 'instructions', 'ready']);

/**
 * Restore the presentation phase for a deduction. Older saves that already
 * started solving skip the newly added introduction instead of losing progress.
 */
export function getDeductionIntroProgress(saved, deductionProgress = null) {
  const deductionAlreadyStarted = Boolean(
    deductionProgress?.passed
    || deductionProgress?.pendingStep
    || (deductionProgress?.attempts ?? 0) > 0
  );
  const initial = {
    version: 1,
    stage: deductionAlreadyStarted ? 'ready' : 'dialogue',
    stageElapsed: 0,
    introIndex: 0,
  };
  if (saved?.version !== 1 || !VALID_STAGES.has(saved.stage)) return initial;
  return {
    ...initial,
    ...saved,
    stageElapsed: Number.isFinite(saved.stageElapsed) && saved.stageElapsed >= 0
      ? Math.min(saved.stageElapsed, DEDUCTION_INTRO_TIMING.total)
      : 0,
    introIndex: Number.isInteger(saved.introIndex) && saved.introIndex >= 0 ? saved.introIndex : 0,
  };
}

/** Pure state transitions for the dialogue -> instruction card -> deduction flow. */
export function updateDeductionIntroProgress(saved, action, scene, deductionProgress = null) {
  const previous = getDeductionIntroProgress(saved, deductionProgress);
  const next = { ...previous };
  const reject = () => ({ ok: false, reason: 'INVALID_DEDUCTION_INTRO_STAGE' });

  switch (action.event) {
    case 'dialogue': {
      if (previous.stage !== 'dialogue') return reject();
      const lineCount = Math.max(scene.introLines?.length ?? 0, 1);
      if (previous.introIndex < lineCount - 1) next.introIndex += 1;
      else {
        next.stage = 'instructions';
        next.stageElapsed = 0;
      }
      break;
    }
    case 'checkpoint':
      if (previous.stage !== 'instructions' || !Number.isFinite(action.elapsed) || action.elapsed < 0) return reject();
      next.stageElapsed = Math.min(action.elapsed, DEDUCTION_INTRO_TIMING.total);
      break;
    case 'instructions-done':
      if (previous.stage !== 'instructions' || !Number.isFinite(action.elapsed)
        || action.elapsed < DEDUCTION_INTRO_TIMING.total) return reject();
      next.stage = 'ready';
      next.stageElapsed = DEDUCTION_INTRO_TIMING.total;
      break;
    default:
      return reject();
  }

  return { ok: true, reason: null, state: next };
}

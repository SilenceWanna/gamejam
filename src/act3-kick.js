export const ACT3_KICK_TIMING = Object.freeze({ frame: 500, dropSfx: 1350, landing: 1500, total: 1500 });

export function getAct3KickProgress(saved) {
  const initial = {
    version: 1, stage: 'intro', stageElapsed: 0, introIndex: 0, outroIndex: 0, passed: false,
  };
  return saved?.version === 1 ? { ...initial, ...saved } : initial;
}

export function act3KickImagePhase(progress, elapsed = progress.stageElapsed) {
  if (progress.stage === 'outro') return 3;
  if (progress.stage !== 'playing') return 0;
  return Math.min(3, Math.floor(Math.max(0, elapsed) / ACT3_KICK_TIMING.frame));
}

// State transitions are kept independent of rendering so the sequence can be saved mid-animation.
export function updateAct3KickProgress(saved, action, scene) {
  const previous = getAct3KickProgress(saved);
  const next = { ...previous };
  const enter = (stage) => { next.stage = stage; next.stageElapsed = 0; };
  const snapshot = () => {
    if (Number.isFinite(action.elapsed) && action.elapsed >= 0) next.stageElapsed = action.elapsed;
  };

  switch (action.event) {
    case 'dialogue': {
      if (!['intro', 'outro'].includes(previous.stage)) return { ok: false, reason: 'INVALID_ACT3_KICK_STAGE' };
      const closing = previous.stage === 'outro';
      const key = closing ? 'outroIndex' : 'introIndex';
      const lines = closing ? scene.outroLines : scene.introLines;
      if (previous[key] < (lines?.length ?? 1) - 1) next[key] += 1;
      else if (closing) return { ok: true, state: next, complete: true, passed: true };
      else enter('ready');
      break;
    }
    case 'release':
      if (previous.stage !== 'ready') return { ok: false, reason: 'INVALID_ACT3_KICK_STAGE' };
      enter('playing');
      break;
    case 'checkpoint':
      snapshot();
      break;
    case 'sequence-done':
      if (previous.stage !== 'playing' || !Number.isFinite(action.elapsed) || action.elapsed < ACT3_KICK_TIMING.total) {
        return { ok: false, reason: 'INVALID_ACT3_KICK_STAGE' };
      }
      next.passed = true;
      enter('outro');
      break;
    default:
      return { ok: false, reason: 'INVALID_ACT3_KICK_STAGE' };
  }
  return { ok: true, state: next, complete: false, passed: next.passed };
}

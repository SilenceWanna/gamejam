// Positions are fractions of the vertical bar (0 = top, 1 = bottom).
export const KICK_TIMING = Object.freeze({ instructions: 3200, release: 500, hit: 1000, pickup: 1000 });

export function kickDifficulty(streak = 0) {
  const level = Math.max(0, Math.min(5, streak));
  return { width: 0.30 - level * 0.025, speed: 0.55 + level * 0.055 };
}

export function createKickRound(streak, previousStart = null, random = Math.random) {
  const { width, speed } = kickDifficulty(streak);
  const range = 1 - width;
  let start = random() * range;
  // Keep consecutive targets visibly distinct, including when randomness repeats.
  if (previousStart !== null && Math.abs(start - previousStart) < 0.08) {
    start = (start + range / 2) % range;
  }
  return { start, width, speed, stopped: false, position: 0, direction: 1 };
}

export function kickPosition(elapsedMs, speed) {
  return moveKickCursor(0, 1, elapsedMs, speed).position;
}

export function moveKickCursor(position, direction, elapsedMs, speed) {
  const origin = direction === -1 ? 2 - position : position;
  const phase = (origin + Math.max(0, elapsedMs) * speed / 1000) % 2;
  return { position: phase <= 1 ? phase : 2 - phase, direction: phase < 1 ? 1 : -1 };
}

export function isKickHit(round, position) {
  return Number.isFinite(position) && position >= round.start
    && position <= round.start + round.width;
}

export function getKickProgress(saved) {
  const initial = {
    version: 3, stage: 'intro', stageElapsed: 0, introIndex: 0, outroIndex: 0,
    successCount: 0, attempts: 0, passed: false, lastResult: null, round: null,
  };
  if ([2, 3].includes(saved?.version)) return { ...initial, ...saved };
  // Old timing-game saves have no presentation phase; restart their tutorial safely.
  return saved?.passed ? { ...initial, stage: 'outro', passed: true, successCount: 6 } : initial;
}

export function kickImagePhase(progress, elapsed = progress.stageElapsed) {
  if (progress.stage === 'releasing') return 1;
  if (progress.stage === 'playing' || progress.stage === 'outro') return 2;
  if (progress.stage === 'hit') return elapsed < 500 ? 3 : 4;
  if (progress.stage === 'miss') return 5;
  return 0;
}

// The six motifs correspond to successful hit counts 1–6 and start with hit frame 3.
export function kickHitSoundIndex(progress, phase = kickImagePhase(progress)) {
  if (phase !== 3 || progress.lastResult !== 'success') return null;
  return Math.max(0, Math.min(5, Number(progress.successCount ?? 1) - 1));
}

// Pure state transitions keep timings, progress and saved games independent of the DOM.
export function updateKickProgress(saved, action, scene, random = Math.random) {
  const previous = getKickProgress(saved);
  let next = { ...previous };
  const enter = (stage) => { next.stage = stage; next.stageElapsed = 0; };
  const reject = () => ({ ok: false, reason: 'INVALID_KICK_STAGE' });
  const snapshot = () => {
    if (Number.isFinite(action.elapsed) && action.elapsed >= 0) next.stageElapsed = action.elapsed;
    if (next.round && Number.isFinite(action.position) && action.position >= 0 && action.position <= 1
      && [1, -1].includes(action.direction)) {
      next.round = { ...next.round, position: action.position, direction: action.direction };
    }
  };
  switch (action.event) {
    case 'dialogue': {
      if (!['intro', 'outro'].includes(previous.stage)) return reject();
      const closing = previous.stage === 'outro';
      const key = closing ? 'outroIndex' : 'introIndex';
      const lines = closing ? scene.outroLines : scene.introLines;
      if (previous[key] < (lines?.length ?? 1) - 1) next[key] += 1;
      else if (closing) return { ok: true, state: next, complete: true };
      else enter('instructions');
      break;
    }
    case 'checkpoint':
      snapshot();
      break;
    case 'instructions-done':
      if (previous.stage !== 'instructions' || !Number.isFinite(action.elapsed) || action.elapsed < KICK_TIMING.instructions) return reject();
      next.round = createKickRound(0, null, random);
      enter('ready');
      break;
    case 'release':
      if (previous.stage !== 'ready') return reject();
      next.lastResult = null;
      next.round = { ...previous.round, position: 0, direction: 1, stopped: false };
      enter('releasing');
      break;
    case 'release-done':
      if (previous.stage !== 'releasing' || !Number.isFinite(action.elapsed) || action.elapsed < KICK_TIMING.release) return reject();
      snapshot();
      enter('playing');
      break;
    case 'kick': {
      if (!['releasing', 'playing'].includes(previous.stage) || !previous.round
        || !Number.isFinite(action.position) || action.position < 0 || action.position > 1
        || ![1, -1].includes(action.direction)) return reject();
      snapshot();
      next.attempts += 1;
      const hit = isKickHit(previous.round, action.position);
      next.successCount = hit ? previous.successCount + 1 : 0;
      next.lastResult = hit ? 'success' : 'miss';
      next.passed = next.successCount >= (scene.target ?? 6);
      next.round = hit ? { ...next.round, stopped: true }
        : createKickRound(0, previous.round.start, random);
      enter(hit ? 'hit' : 'miss');
      break;
    }
    case 'pickup':
      if (previous.stage !== 'miss') return reject();
      next.lastResult = null;
      enter('ready');
      break;
    case 'hit-done':
      if (previous.stage !== 'hit' || !Number.isFinite(action.elapsed) || action.elapsed < KICK_TIMING.hit) return reject();
      if (previous.passed) enter('outro');
      else {
        next.round = {
          ...createKickRound(previous.successCount, previous.round.start, random),
          position: previous.round.position, direction: previous.round.direction,
        };
        enter('playing');
      }
      break;
    default: return reject();
  }
  return { ok: true, state: next, passed: next.passed, complete: false };
}

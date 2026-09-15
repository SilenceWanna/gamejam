// 业务 action 层：按钮只派发意图，本文件负责校验、修改状态及请求路由跳转。
import { getClue } from './clues.js';
import { updateKickProgress } from './kick.js?v=20260915-kick-sfx-4';
import { updateAct3KickProgress } from './act3-kick.js?v=20260915-kick-sfx-4';
import { updatePronunciationProgress } from './pronunciation.js';
import { DEDUCTIONS, judgeDeduction } from './deductions.js?v=20260915-script-v2-1';
import { updateDeductionIntroProgress } from './deduction-intro.js?v=20260915-deduction-intro-3-portrait-wait-1-deduction-hold-2s-1';
import { navigate } from './router.js?v=20260915-script-v2-1';
import { clearAllPersistentData, readSaveSlot, saveGame } from './save.js?v=20260915-script-v2-1';
import { SCENES } from './scenes.js?v=20260915-script-v2-1-dialogue-split-1-phase-dialogue-2-be-location-1-minigame-office-intro-1-act3-audio-1-act2-group-audio-1-act3-audio-mix-1';
import { getState, resetState, setState, setStateSilently } from './state.js';

export const ACTION_TYPES = Object.freeze({
  START_GAME: 'START_GAME',
  SAVE_GAME: 'SAVE_GAME',
  LOAD_GAME: 'LOAD_GAME',
  UPDATE_SETTING: 'UPDATE_SETTING',
  COLLECT_CLUE: 'COLLECT_CLUE',
  COMPLETE_MEMORY_CARD: 'COMPLETE_MEMORY_CARD',
  REPLAY_ANIMATION: 'REPLAY_ANIMATION',
  ADVANCE_DIALOGUE: 'ADVANCE_DIALOGUE',
  ADVANCE_ANIMATION: 'ADVANCE_ANIMATION',
  MINIGAME_ACTION: 'MINIGAME_ACTION',
  LOSE_PATIENCE: 'LOSE_PATIENCE',
  SUBMIT_DEDUCTION: 'SUBMIT_DEDUCTION',
  CLEAR_DEDUCTION_FAILURE: 'CLEAR_DEDUCTION_FAILURE',
  FINALIZE_DEDUCTION_STEP: 'FINALIZE_DEDUCTION_STEP',
  DEDUCTION_INTRO_ACTION: 'DEDUCTION_INTRO_ACTION',
  ADVANCE_DEDUCTION_OUTRO: 'ADVANCE_DEDUCTION_OUTRO',
  CHOOSE_RESPONSE: 'CHOOSE_RESPONSE',
  NAVIGATE: 'NAVIGATE',
  RESET_GAME: 'RESET_GAME',
  RESET_ALL: 'RESET_ALL',
});

/**
 * 从标题页开始新游戏，并清除当前运行时进度。
 * @param {{sceneId?: string}} [action={}] 开始 action，可指定入口场景
 * @returns {{ok: boolean, reason: string|null, navigation: object|null}}
 */
function startGame(action = {}) {
  resetState();
  const sceneId = action.sceneId ?? 'prologue_animation';
  const navigation = navigate(sceneId, { replace: true });
  return { ok: navigation.ok, reason: navigation.reason, navigation };
}

/**
 * 将当前页面完整状态保存到新槽位或指定覆盖槽位，成功后回到标题页。
 * @param {{slotIndex?: number}} [action={}] 可选的覆盖槽位索引
 * @returns {object} 保存结果；满槽时 reason 为 SAVE_LIMIT_REACHED
 */
function saveCurrentGame(action = {}) {
  const state = getState();
  // 显式传入的 slotIndex 仅用于满槽覆盖；普通保存沿用读档时的槽位。
  const slotIndex = action.slotIndex ?? state.activeSaveSlotIndex ?? null;
  const result = saveGame(state, slotIndex);
  if (!result.ok) return result;

  const savedSlotIndex = slotIndex ?? result.slots.length - 1;
  setState({ activeSaveSlotIndex: savedSlotIndex });
  const navigation = navigate('title', { replace: true });
  return { ...result, navigation, slotIndex: savedSlotIndex };
}

/**
 * 从存档槽恢复完整状态，并返回保存时退出的页面。
 * @param {{slotIndex: number}} action 目标存档槽索引
 * @returns {object} 恢复结果
 */
function loadGame(action) {
  const slot = readSaveSlot(action.slotIndex);
  if (!slot) return { ok: false, reason: 'INVALID_SAVE_SLOT' };

  const currentState = getState();
  // The former prologue outro was removed; old saves continue at act one.
  const sceneId = slot.sceneId === 'prologue_animation_outro' ? 'act1_animation' : slot.sceneId;
  const completedMemoryCards = slot.state.completedMemoryCards ?? [];
  const recoveredMemoryClues = [
    ...(completedMemoryCards.includes('village-memory') ? ['clue_leg_condition', 'clue_mother_field_legs'] : []),
    ...(completedMemoryCards.includes('school-memory') ? ['clue_classmates_kick_action'] : []),
    ...(completedMemoryCards.includes('station-memory') ? ['clue_relative_squat'] : []),
    ...(completedMemoryCards.includes('reality-records') ? ['clue_genetics_book', 'clue_genetic_trait_diagnosis'] : []),
  ];
  const loadedState = {
    ...slot.state,
    patience: slot.state.patience ?? 3,
    maxPatience: slot.state.maxPatience ?? 3,
    consumedClueIds: slot.state.consumedClueIds ?? [],
    deductionIntros: slot.state.deductionIntros ?? {},
    minigames: slot.state.minigames ?? {},
    animationProgress: slot.state.animationProgress ?? {},
    completedMemoryCards,
    collectedClueIds: [...new Set([...(slot.state.collectedClueIds ?? []), ...recoveredMemoryClues])],
    currentAct: slot.state.currentAct ?? 0,
  };
  setState({
    ...loadedState,
    sceneId,
    activeSaveSlotIndex: action.slotIndex,
    unlockedEndingIds: [...new Set([
      ...(currentState.unlockedEndingIds ?? []),
      ...(slot.state.unlockedEndingIds ?? []),
    ])],
  });
  const navigation = navigate(sceneId, { replace: true });
  return { ok: navigation.ok, reason: navigation.reason, navigation, slot };
}

/**
 * 更新单个设置项，并将音量值限制在 0 到 100 之间。
 * @param {{setting: string, value: number}} action 设置 action
 * @returns {{ok: boolean, reason: string|null, setting?: string, value?: number}}
 */
function updateSetting(action) {
  const validSettings = ['master', 'background', 'character'];
  if (!validSettings.includes(action.setting)) {
    return { ok: false, reason: 'UNKNOWN_SETTING' };
  }

  const value = Math.max(0, Math.min(100, Number(action.value)));
  if (!Number.isFinite(value)) {
    return { ok: false, reason: 'INVALID_SETTING_VALUE' };
  }

  setState({
    settings: {
      ...getState().settings,
      [action.setting]: value,
    },
  });
  return { ok: true, reason: null, setting: action.setting, value };
}

/**
 * 判断调查场景是否已开放出口。
 * @param {object} scene investigation 场景配置
 * @param {object} [state=getState()] 可选的状态快照
 * @returns {boolean}
 */
export function canExitInvestigation(scene, state = getState()) {
  return scene?.kind === 'investigation';
}

/**
 * 点击对话框推进原文；最后一句读完后进入下一个场景。
 * @returns {{ok: boolean, reason: string|null, sceneId?: string, lineIndex?: number, isLastLine?: boolean}}
 */
function advanceDialogue() {
  const state = getState();
  const scene = SCENES[state.sceneId];
  if (!scene || scene.kind !== 'narrative') {
    return { ok: false, reason: 'NOT_IN_NARRATIVE' };
  }

  const currentIndex = state.narrativeProgress[scene.id] ?? 0;
  const lastIndex = Math.max(scene.lines.length - 1, 0);
  if (currentIndex >= lastIndex && scene.next) {
    const navigation = navigate(scene.next, { replace: true });
    return { ok: navigation.ok, reason: navigation.reason, navigation };
  }
  const nextIndex = Math.min(currentIndex + 1, lastIndex);

  setState({
    narrativeProgress: {
      ...state.narrativeProgress,
      [scene.id]: nextIndex,
    },
  });

  return {
    ok: true,
    reason: null,
    sceneId: scene.id,
    lineIndex: nextIndex,
    isLastLine: nextIndex === lastIndex,
  };
}

/** 推进动画镜头；动画渲染器通过该 action 保存可恢复的播放进度。 */
function advanceAnimation() {
  const state = getState();
  const scene = SCENES[state.sceneId];
  if (!scene || scene.kind !== 'animation') {
    return { ok: false, reason: 'NOT_IN_ANIMATION' };
  }
  const lastIndex = Math.max((scene.shots?.length ?? 1) - 1, 0);
  const savedProgress = state.animationProgress[scene.id];
  const savedIndex = Number.isFinite(savedProgress) ? savedProgress : savedProgress?.index ?? 0;
  const currentIndex = Math.min(savedIndex, lastIndex);
  const nextIndex = Math.min(currentIndex + 1, lastIndex);
  setState({
    animationProgress: {
      ...state.animationProgress,
      [scene.id]: { index: nextIndex, elapsed: 0 },
    },
  });
  return { ok: true, reason: null, sceneId: scene.id, shotIndex: nextIndex, isLastShot: nextIndex === lastIndex };
}

/**
 * 小游戏统一状态入口。渲染器只提交语义化事件，具体规则在这里集中维护。
 * kick: release / kick，pronunciation: choose，side-kick: test。
 */
function minigameAction(action) {
  const state = getState();
  const scene = SCENES[state.sceneId];
  if (!scene || scene.kind !== 'minigame') return { ok: false, reason: 'NOT_IN_MINIGAME' };
  if (scene.game === 'kick') {
    const result = updateKickProgress(state.minigames[scene.id], action, scene);
    if (!result.ok) return result;
    const collectedClueIds = result.state.passed && !state.collectedClueIds.includes('clue_kick_six')
      ? [...state.collectedClueIds, 'clue_kick_six'] : state.collectedClueIds;
    setState({ minigames: { ...state.minigames, [scene.id]: result.state }, collectedClueIds });
    // The sixth hit leads to the heroine's closing line before leaving the memory.
    return { ...result, navigation: result.complete ? navigate(scene.nextOnSuccess) : null };
  }
  if (scene.game === 'pronunciation') {
    const result = updatePronunciationProgress(state.minigames[scene.id], action, scene);
    if (!result.ok) return result;
    const collectedClueIds = result.state.passed && !state.collectedClueIds.includes('clue_southern_pronunciation')
      ? [...state.collectedClueIds, 'clue_southern_pronunciation'] : state.collectedClueIds;
    setState({ minigames: { ...state.minigames, [scene.id]: result.state }, collectedClueIds });
    return { ...result, navigation: result.complete ? navigate(scene.nextOnSuccess) : null };
  }
  if (scene.game === 'act3-kick') {
    const result = updateAct3KickProgress(state.minigames[scene.id], action, scene);
    if (!result.ok) return result;
    const collectedClueIds = result.passed
      ? [...new Set([...state.collectedClueIds, ...(scene.successClueIds ?? [])])]
      : state.collectedClueIds;
    setState({ minigames: { ...state.minigames, [scene.id]: result.state }, collectedClueIds });
    return { ...result, navigation: result.complete ? navigate(scene.nextOnSuccess) : null };
  }
  const previous = state.minigames[scene.id] ?? {
    started: false,
    successCount: 0,
    attempts: 0,
    cycleStartedAt: null,
    answers: {},
    passed: false,
    sideKickTested: false,
  };
  const next = { ...previous };

  if (action.introNext) {
    next.introIndex = Math.min((previous.introIndex ?? 0) + 1, Math.max((scene.introLines?.length ?? 1) - 1, 0));
  }
  if (action.event === 'release' && scene.introLines?.length) {
    if ((previous.introIndex ?? 0) >= scene.introLines.length - 1) {
      next.introIndex = scene.introLines.length;
      next.started = true;
    }
  }

  if (scene.game === 'side-kick') {
    if (action.event === 'test') {
      next.sideKickTested = true;
      next.passed = true;
    }
  }

  setState({ minigames: { ...state.minigames, [scene.id]: next } });
  if (next.passed && scene.nextOnSuccess) {
    const successClueByGame = {
      kick: 'clue_kick_six',
      pronunciation: 'clue_southern_pronunciation',
      'side-kick': 'clue_leg_condition',
    };
    const clueId = successClueByGame[scene.game];
    const collectedClueIds = clueId && !state.collectedClueIds.includes(clueId)
      ? [...state.collectedClueIds, clueId]
      : state.collectedClueIds;
    setState({ collectedClueIds });
    const navigation = navigate(scene.nextOnSuccess);
    return { ok: true, passed: true, state: next, navigation };
  }
  return { ok: true, passed: next.passed, state: next };
}

function losePatience() {
  const state = getState();
  const patience = Math.max(0, (state.patience ?? state.maxPatience ?? 3) - 1);
  setState({ patience });
  if (patience === 0) {
    const navigation = navigate('be_transition');
    return { ok: true, patience, depleted: true, navigation };
  }
  return { ok: true, patience, depleted: false, navigation: null };
}

/**
 * 处理热点调查。重复点击不会重复写入线索或热点记录。
 *
 * @param {{clueId: string, hotspotId?: string}} action 收集线索 action
 * @returns {{ok: boolean, reason: string|null, clue?: object, alreadyInvestigated?: boolean, canContinue?: boolean}}
 */
function collectClue(action) {
  const state = getState();
  const scene = SCENES[state.sceneId];
  if (!scene || scene.kind !== 'investigation') {
    return { ok: false, reason: 'NOT_IN_INVESTIGATION' };
  }

  const hotspot = scene.hotspots.find((item) => (
    item.clueId === action.clueId
    && (!action.hotspotId || item.id === action.hotspotId)
  ));
  const clue = getClue(action.clueId);
  if (!hotspot || !clue) {
    return { ok: false, reason: 'UNKNOWN_CLUE' };
  }

  const investigatedInScene = state.investigatedHotspots[scene.id] ?? [];
  const alreadyInvestigated = investigatedInScene.includes(hotspot.id);
  const alreadyCollected = state.collectedClueIds.includes(clue.id);

  setState({
    investigatedHotspots: {
      ...state.investigatedHotspots,
      [scene.id]: alreadyInvestigated
        ? investigatedInScene
        : [...investigatedInScene, hotspot.id],
    },
    collectedClueIds: alreadyCollected
      ? state.collectedClueIds
      : [...state.collectedClueIds, clue.id],
  });

  return {
    ok: true,
    reason: null,
    clue,
    alreadyInvestigated,
    canContinue: canExitInvestigation(scene),
  };
}

function completeMemoryCard(action) {
  if (!action.memoryCardId) return { ok: false, reason: 'UNKNOWN_MEMORY_CARD' };
  const state = getState();
  const clueIds = (action.clueIds ?? []).filter((clueId) => Boolean(getClue(clueId)));
  setStateSilently({
    completedMemoryCards: [...new Set([...(state.completedMemoryCards ?? []), action.memoryCardId])],
    collectedClueIds: [...new Set([...(state.collectedClueIds ?? []), ...clueIds])],
  });
  return { ok: true, reason: null, memoryCardId: action.memoryCardId, clueIds };
}

function replayAnimation(action) {
  const scene = SCENES[action.sceneId];
  if (!scene || scene.kind !== 'animation') return { ok: false, reason: 'UNKNOWN_ANIMATION' };
  const state = getState();
  const animationProgress = { ...(state.animationProgress ?? {}) };
  delete animationProgress[action.sceneId];
  setStateSilently({ animationProgress });
  const navigation = navigate(action.sceneId);
  return { ok: navigation.ok, reason: navigation.reason, navigation };
}

/** Advance or checkpoint the opening dialogue and instruction-card presentation. */
function deductionIntroAction(action) {
  const state = getState();
  const scene = SCENES[state.sceneId];
  if (!scene || scene.kind !== 'deduction' || scene.deductionId !== action.deductionId) {
    return { ok: false, reason: 'NOT_IN_DEDUCTION' };
  }
  const result = updateDeductionIntroProgress(
    state.deductionIntros?.[action.deductionId],
    action,
    scene,
    state.deductions[action.deductionId],
  );
  if (!result.ok) return result;
  const patch = {
    deductionIntros: {
      ...(state.deductionIntros ?? {}),
      [action.deductionId]: result.state,
    },
  };
  if (action.event === 'checkpoint') setStateSilently(patch);
  else setState(patch);
  return result;
}

/** Advance one authored closing line after a completed deduction. */
function advanceDeductionOutro(action) {
  const state = getState();
  const scene = SCENES[state.sceneId];
  const previous = state.deductions[action.deductionId];
  if (!scene || scene.kind !== 'deduction' || scene.deductionId !== action.deductionId
    || !previous?.passed || !scene.outroLines?.length) {
    return { ok: false, reason: 'NOT_IN_DEDUCTION_OUTRO' };
  }
  const currentIndex = Math.min(previous.outroIndex ?? 0, scene.outroLines.length - 1);
  if (currentIndex >= scene.outroLines.length - 1) {
    return { ok: false, reason: 'DEDUCTION_OUTRO_COMPLETE' };
  }
  const outroIndex = currentIndex + 1;
  setState({
    deductions: {
      ...state.deductions,
      [action.deductionId]: { ...previous, outroIndex },
    },
  });
  return { ok: true, reason: null, outroIndex };
}

/**
 * 提交推理并记录尝试结果。答案交给 deductions.js 判定；正确时再请求路由跳转。
 *
 * @param {{deductionId: string, clueIds: string[]}} action 推理提交 action
 * @returns {object} judgeDeduction 的结果，可能额外包含 navigation
 */
function submitDeduction(action) {
  const state = getState();
  const scene = SCENES[state.sceneId];
  if (!scene || scene.kind !== 'deduction' || scene.deductionId !== action.deductionId) {
    return { ok: false, correct: false, reason: 'NOT_IN_DEDUCTION' };
  }

  // 保留空格顺序；右侧的矛盾线索不能与左侧前提混为无序组合。
  const clueIds = Array.isArray(action.clueIds) ? [...action.clueIds] : [];
  if (clueIds.length !== scene.requiredCount || clueIds.some((id) => !id)) {
    return { ok: false, correct: false, reason: 'INCOMPLETE_EXPRESSION' };
  }
  const consumedClueIds = new Set(state.consumedClueIds ?? []);
  const includesUnavailableClue = clueIds.some((clueId) => (
    !state.collectedClueIds.includes(clueId) || consumedClueIds.has(clueId)
  ));
  if (includesUnavailableClue) {
    return { ok: false, correct: false, reason: 'CLUE_NOT_COLLECTED' };
  }

  const result = judgeDeduction(action.deductionId, clueIds);
  if (!result.ok) return result;
  const isChainedDeduction = Array.isArray(result.consumedClueIds);

  const previous = state.deductions[action.deductionId] ?? {
    passed: false,
    attempts: 0,
    lastClueIds: [],
    lastReason: null,
  };

  if (isChainedDeduction && result.correct) {
    setState({
      deductions: {
        ...state.deductions,
        [action.deductionId]: {
          passed: false,
          attempts: previous.attempts + 1,
          lastClueIds: clueIds,
          lastReason: null,
          lastProducedClueId: result.producedClueId,
          failureLockUntil: null,
          pendingStep: {
            producedClueId: result.producedClueId,
            consumedClueIds: result.consumedClueIds,
            complete: Boolean(result.complete),
            next: result.next ?? null,
          },
        },
      },
    });
    return { ...result, navigation: null };
  }

  setState({
    deductions: {
      ...state.deductions,
      [action.deductionId]: {
        passed: previous.passed || Boolean(result.complete) || (!isChainedDeduction && result.correct),
        attempts: previous.attempts + 1,
        lastClueIds: clueIds,
        lastReason: result.reason,
        lastProducedClueId: result.producedClueId ?? null,
        failureLockUntil: result.correct ? null : Date.now() + 1000,
        outroIndex: result.correct && scene.outroLines?.length ? 0 : previous.outroIndex ?? 0,
      },
    },
    consumedClueIds: result.correct
      ? [...new Set([...(state.consumedClueIds ?? []), ...(isChainedDeduction ? result.consumedClueIds : clueIds)])]
      : state.consumedClueIds ?? [],
    collectedClueIds: result.correct
      ? isChainedDeduction
        ? [...new Set([
          ...state.collectedClueIds,
          ...(result.producedClueId ? [result.producedClueId] : []),
        ])]
        : state.collectedClueIds.filter((clueId) => !(SCENES[scene.backTo]?.archiveClueIds ?? clueIds).includes(clueId))
      : state.collectedClueIds,
  });

  if (!result.correct) {
    const patienceResult = losePatience();
    return { ...result, patience: patienceResult.patience, depleted: patienceResult.depleted, navigation: patienceResult.navigation };
  }

  if (scene.outroLines?.length) return { ...result, navigation: null };

  const navigation = result.next ? navigate(result.next) : null;
  return { ...result, navigation };
}

/**
 * 清理错误推理的短暂锁定，恢复空白表达式并移除错误提示。
 * 该 action 由推理页面在锁定时间结束后触发。
 */
function clearDeductionFailure(action) {
  const state = getState();
  const scene = SCENES[state.sceneId];
  const previous = state.deductions[action.deductionId];
  if (!scene || scene.kind !== 'deduction' || scene.deductionId !== action.deductionId || !previous) {
    return { ok: false, reason: 'NOT_IN_DEDUCTION' };
  }

  setState({
    deductions: {
      ...state.deductions,
      [action.deductionId]: {
        ...previous,
        lastClueIds: [],
        lastReason: null,
        lastProducedClueId: null,
        failureLockUntil: null,
      },
    },
  });
  return { ok: true, reason: null };
}

function finalizeDeductionStep(action) {
  const state = getState();
  const previous = state.deductions[action.deductionId];
  const pending = previous?.pendingStep;
  if (!pending) return { ok: false, reason: 'NO_PENDING_DEDUCTION_STEP' };
  const collectedClueIds = [...new Set([
    ...(state.collectedClueIds ?? []),
    pending.producedClueId,
  ].filter(Boolean))];
  const collectedClueIdSet = new Set(collectedClueIds);
  const retiredClueIds = (DEDUCTIONS[action.deductionId]?.retireClues ?? [])
    .filter((retirement) => retirement.afterProducing.every((clueId) => collectedClueIdSet.has(clueId)))
    .map((retirement) => retirement.clueId);
  const patch = {
    deductions: {
      ...state.deductions,
      [action.deductionId]: {
        ...previous,
        passed: previous.passed || Boolean(pending.complete),
        lastClueIds: [],
        lastProducedClueId: null,
        pendingStep: null,
      },
    },
    consumedClueIds: [...new Set([
      ...(state.consumedClueIds ?? []),
      ...(pending.consumedClueIds ?? []),
      ...retiredClueIds,
    ])],
    collectedClueIds,
  };
  if (pending.complete && pending.next) {
    setStateSilently(patch);
    const navigation = navigate(pending.next);
    return { ok: navigation.ok, reason: navigation.reason, producedClueId: pending.producedClueId, navigation };
  }
  setState(patch);
  return { ok: true, reason: null, producedClueId: pending.producedClueId, navigation: null };
}

/**
 * 记录一次剧情选择，累加真相值与陪伴值，然后进入 choice.next。
 *
 * @param {{responseId?: string, truthDelta?: number, companionshipDelta?: number, next?: string}} action
 * 剧情选择 action
 * @returns {{ok: boolean, reason: null, navigation: object|null}}
 */
function chooseResponse(action) {
  const state = getState();
  setState({
    truth: state.truth + (action.truthDelta ?? 0),
    companionship: state.companionship + (action.companionshipDelta ?? 0),
    responses: [
      ...state.responses,
      {
        sceneId: state.sceneId,
        responseId: action.responseId ?? null,
        truthDelta: action.truthDelta ?? 0,
        companionshipDelta: action.companionshipDelta ?? 0,
      },
    ],
  });

  const navigation = action.next ? navigate(action.next) : null;
  return { ok: true, reason: null, navigation };
}

/**
 * 游戏业务操作的统一入口。
 * 调用方根据 ACTION_TYPES 提供相应字段，不直接操作 state 或 location。
 *
 * @param {{type: string, [key: string]: *}} action 待执行的 action
 * @returns {object} 操作结果；ok 为 false 时 reason 给出机器可读原因
 */
export function dispatch(action) {
  switch (action.type) {
    case ACTION_TYPES.START_GAME:
      return startGame(action);
    case ACTION_TYPES.SAVE_GAME:
      return saveCurrentGame(action);
    case ACTION_TYPES.LOAD_GAME:
      return loadGame(action);
    case ACTION_TYPES.COLLECT_CLUE:
      return collectClue(action);
    case ACTION_TYPES.COMPLETE_MEMORY_CARD:
      return completeMemoryCard(action);
    case ACTION_TYPES.REPLAY_ANIMATION:
      return replayAnimation(action);
    case ACTION_TYPES.UPDATE_SETTING:
      return updateSetting(action);
    case ACTION_TYPES.ADVANCE_DIALOGUE:
      return advanceDialogue();
    case ACTION_TYPES.ADVANCE_ANIMATION:
      return advanceAnimation();
    case ACTION_TYPES.MINIGAME_ACTION:
      return minigameAction(action);
    case ACTION_TYPES.LOSE_PATIENCE:
      return losePatience();
    case ACTION_TYPES.SUBMIT_DEDUCTION:
      return submitDeduction(action);
    case ACTION_TYPES.CLEAR_DEDUCTION_FAILURE:
      return clearDeductionFailure(action);
    case ACTION_TYPES.FINALIZE_DEDUCTION_STEP:
      return finalizeDeductionStep(action);
    case ACTION_TYPES.DEDUCTION_INTRO_ACTION:
      return deductionIntroAction(action);
    case ACTION_TYPES.ADVANCE_DEDUCTION_OUTRO:
      return advanceDeductionOutro(action);
    case ACTION_TYPES.CHOOSE_RESPONSE:
      return chooseResponse(action);
    case ACTION_TYPES.NAVIGATE:
      return navigate(action.sceneId, { replace: action.replace });
    case ACTION_TYPES.RESET_GAME: {
      resetState();
      const sceneId = action.sceneId ?? 'prologue_animation';
      const navigation = navigate(sceneId, { replace: true });
      return navigation;
    }
    case ACTION_TYPES.RESET_ALL: {
      clearAllPersistentData();
      resetState({ preserveUnlockedEndingIds: false });
      return navigate('title', { replace: true });
    }
    default:
      return { ok: false, reason: 'UNKNOWN_ACTION' };
  }
}

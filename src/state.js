import { readUnlockedEndingIds } from './save.js';

// 全局运行时状态。这里只保存数据，不包含场景判定或 DOM 操作。
export const INITIAL_SCENE_ID = 'title';

/**
 * 创建一份全新的游戏状态，确保数组和对象不会在多次重开之间共享引用。
 * @returns {object} 初始状态
 */
function createInitialState() {
  return {
    sceneId: INITIAL_SCENE_ID,
    // 当前运行状态对应的存档槽；null 表示这是尚未保存的新游戏。
    activeSaveSlotIndex: null,
    settingsReturnSceneId: null,
    // 结局图鉴属于长期进度，开始新游戏时保留已解锁条目。
    unlockedEndingIds: readUnlockedEndingIds(),
    settings: {
      master: 100,
      background: 100,
      character: 100,
    },
    collectedClueIds: [],
    consumedClueIds: [],
    investigatedHotspots: {},
    completedMemoryCards: [],
    narrativeProgress: {},
    deductions: {},
    deductionIntros: {},
    responses: [],
    truth: 0,
    companionship: 0,
    patience: 3,
    maxPatience: 3,
    minigames: {},
    animationProgress: {},
    currentAct: 0,
  };
}

let state = createInitialState();
const subscribers = new Set();

/** @returns {object} 当前只读引用；更新状态应使用 setState。 */
export function getState() {
  return state;
}

/**
 * 合并更新全局状态，并同步通知所有订阅者重新读取状态。
 * 函数形式适合依赖旧状态的更新；无论哪种形式都只需返回顶层 patch。
 *
 * @param {object|function(object): object} update 状态 patch 或 patch 生成函数
 * @returns {object} 更新后的完整状态
 */
export function setState(update) {
  const patch = typeof update === 'function' ? update(state) : update;
  state = { ...state, ...patch };
  subscribers.forEach((subscriber) => subscriber(state));
  return state;
}

// Update transient playback checkpoints without rebuilding the current page.
// Navigation or the next ordinary state update will render the latest value.
export function setStateSilently(update) {
  const patch = typeof update === 'function' ? update(state) : update;
  state = { ...state, ...patch };
  return state;
}

/**
 * 清空调查、推理、对话进度和数值，恢复到初始场景；保留已解锁的结局图鉴。
 * @param {{preserveUnlockedEndingIds?: boolean}} [options={}] 是否保留结局图鉴
 * @returns {object} 重置后的完整状态
 */
export function resetState(options = {}) {
  const preserveUnlockedEndingIds = options.preserveUnlockedEndingIds !== false;
  const unlockedEndingIds = preserveUnlockedEndingIds
    ? state.unlockedEndingIds ?? []
    : [];
  state = {
    ...createInitialState(),
    unlockedEndingIds,
  };
  subscribers.forEach((subscriber) => subscriber(state));
  return state;
}

/**
 * 订阅状态变化。
 * @param {function(object): void} subscriber 状态变化时调用的函数
 * @returns {function(): void} 取消订阅函数
 */
export function subscribe(subscriber) {
  subscribers.add(subscriber);
  return () => subscribers.delete(subscriber);
}

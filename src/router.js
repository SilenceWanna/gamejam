// Hash 路由层：统一校验场景是否存在、进入条件是否满足，并同步 sceneId 状态。
import { writeUnlockedEndingIds } from './save.js?v=20260915-script-v2-1';
import { SCENES } from './scenes.js?v=20260915-script-v2-1-settings-hidden-menu-1-act3-audio-1-act2-group-audio-1-act3-audio-mix-1';
import { getState, INITIAL_SCENE_ID, setState } from './state.js';

let started = false;

/** @returns {string} 当前 URL 中去掉 # 的场景 ID。 */
function getHashSceneId() {
  return window.location.hash.slice(1);
}

/**
 * 判断指定调查场景是否达到离开所需的调查数量。
 * @param {string} sceneId investigation 场景 ID
 * @param {object} state 用于判定的游戏状态
 * @returns {boolean}
 */
function isInvestigationComplete(sceneId, state) {
  const scene = SCENES[sceneId];
  if (!scene || scene.kind !== 'investigation') return false;

  const investigated = state.investigatedHotspots[sceneId] ?? [];
  const requiredCount = scene.requiredClueCount ?? scene.hotspots.length;
  return investigated.length >= requiredCount;
}

/**
 * 解析一个场景进入条件。新增条件类型时只需扩展这个分支。
 * @param {object} condition scenes.js 中配置的单条 condition
 * @param {object} state 用于判定的游戏状态
 * @returns {boolean}
 */
function conditionIsMet(condition, state) {
  switch (condition.type) {
    case 'DEDUCTION_PASSED':
      return state.deductions[condition.deductionId]?.passed === true;
    case 'INVESTIGATION_COMPLETE':
      return isInvestigationComplete(condition.sceneId, state);
    case 'CLUE_COLLECTED':
      return state.collectedClueIds.includes(condition.clueId);
    case 'MIN_TRUTH':
      return state.truth >= condition.value;
    case 'MIN_COMPANIONSHIP':
      return state.companionship >= condition.value;
    default:
      return false;
  }
}

/**
 * 检查一个场景是否存在且所有 conditions 均已满足。
 * @param {string} sceneId 目标场景 ID
 * @param {object} [state=getState()] 可传入状态快照，默认读取当前状态
 * @returns {boolean}
 */
export function canEnterScene(sceneId, state = getState()) {
  const scene = SCENES[sceneId];
  if (!scene) return false;
  return (scene.conditions ?? []).every((condition) => conditionIsMet(condition, state));
}

/**
 * 为无效地址选择安全回退页：无论当前状态如何，都固定回到开始页。
 * @param {object} state 当前游戏状态
 * @returns {string} 回退场景 ID
 */
function resolveFallbackSceneId(state) {
  // 地址为空、场景不存在或条件不满足时，一律回到开始页。
  void state;
  return INITIAL_SCENE_ID;
}

/**
 * 把已经通过校验的路由写入状态；相同 ID 不重复触发渲染。
 * @param {string} sceneId 已解析的场景 ID
 */
function commitRoute(sceneId) {
  const state = getState();
  const scene = SCENES[sceneId];
  const patch = {};

  // 进入结局即记录解锁状态，标题页的图鉴随后可以直接读取。
  const unlockedEndingIds = state.unlockedEndingIds ?? [];
  if (scene?.kind === 'ending' && !unlockedEndingIds.includes(sceneId)) {
    patch.unlockedEndingIds = [...unlockedEndingIds, sceneId];
  }
  if (state.sceneId !== sceneId) {
    patch.sceneId = sceneId;
  }
  if (Number.isFinite(scene?.act)) {
    patch.currentAct = scene.act;
  }

  if (Object.keys(patch).length > 0) {
    setState(patch);
    if (patch.unlockedEndingIds) {
      writeUnlockedEndingIds(patch.unlockedEndingIds);
    }
  }
}

/**
 * 响应首次加载、浏览器前进或后退，把 URL 解析为合法场景。
 * 无效或条件不足的地址会被 replace 为安全回退页，避免留下错误历史记录。
 */
function syncRouteFromLocation() {
  const requestedSceneId = getHashSceneId();
  const state = getState();
  const sceneId = canEnterScene(requestedSceneId, state)
    ? requestedSceneId
    : resolveFallbackSceneId(state);

  if (requestedSceneId !== sceneId) {
    window.history.replaceState(null, '', `#${sceneId}`);
  }
  commitRoute(sceneId);
}

/**
 * 导航到新场景。所有业务跳转都应经过此函数，而不是直接修改 location.hash。
 *
 * @param {string} sceneId 目标场景 ID
 * @param {{replace?: boolean}} [options={}] replace 为 true 时不新增浏览器历史记录
 * @returns {{ok: boolean, reason: string|null, sceneId: string}} 导航请求结果
 */
export function navigate(sceneId, options = {}) {
  if (!SCENES[sceneId]) {
    return { ok: false, reason: 'UNKNOWN_ROUTE', sceneId };
  }
  if (!canEnterScene(sceneId)) {
    return { ok: false, reason: 'ROUTE_CONDITION_NOT_MET', sceneId };
  }

  const nextHash = `#${sceneId}`;
  if (window.location.hash === nextHash) {
    commitRoute(sceneId);
  } else if (options.replace) {
    window.history.replaceState(null, '', nextHash);
    commitRoute(sceneId);
  } else {
    window.location.hash = sceneId;
  }

  return { ok: true, reason: null, sceneId };
}

/**
 * 启动路由监听并解析当前地址。重复调用不会重复注册 hashchange 监听器。
 * @returns {void}
 */
export function startRouter() {
  if (!started) {
    window.addEventListener('hashchange', syncRouteFromLocation);
    started = true;
  }
  syncRouteFromLocation();
}

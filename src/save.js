// 持久化层：管理结局图鉴和最多 MAX_SAVE_SLOTS 个可恢复的完整存档槽。
import { SCENES, SCENE_KINDS } from './scenes.js?v=20260915-script-v2-1-act3-audio-1-act2-group-audio-1-act3-audio-mix-1';

export const MAX_SAVE_SLOTS = 5;

const SAVE_SLOTS_KEY = 'dream-investigation.save-slots';
const CODEX_KEY = 'dream-investigation.ending-codex';

function readJsonArray(key) {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * 读取已解锁结局 ID。读取失败或数据格式不正确时返回空数组。
 * @returns {string[]}
 */
export function readUnlockedEndingIds() {
  return readJsonArray(CODEX_KEY).filter((id) => typeof id === 'string');
}

/**
 * 保存已解锁结局 ID，并自动去重。
 * @param {string[]} endingIds 结局 ID 列表
 * @returns {boolean} 是否写入成功
 */
export function writeUnlockedEndingIds(endingIds) {
  return writeJson(CODEX_KEY, [...new Set(endingIds)]);
}

/**
 * 读取全部存档槽，并过滤掉无法恢复的旧数据。
 * @returns {object[]} 存档槽列表，顺序就是标题页显示顺序
 */
export function readSaveSlots() {
  return readJsonArray(SAVE_SLOTS_KEY).filter((slot) => (
    slot
    && typeof slot.savedAt === 'string'
    && typeof slot.sceneId === 'string'
    && slot.state
  )).slice(0, MAX_SAVE_SLOTS);
}

/**
 * 生成北京时间的 24 小时制显示文本。
 * @param {string} value ISO 时间字符串
 * @returns {string} YYYY年M月D日 HH:mm:ss（北京时间）
 */
export function formatBeijingDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '未知时间';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    hourCycle: 'h23',
  }).formatToParts(date).reduce((result, part) => {
    result[part.type] = part.value;
    return result;
  }, {});
  return `${parts.year}年${parts.month}月${parts.day}日 ${parts.hour}:${parts.minute}:${parts.second}`;
}

/**
 * 将当前场景转换成标题页展示的进度文本。
 * @param {string} sceneId 场景 ID
 * @param {object} state 当前游戏状态
 * @returns {string}
 */
export function describeProgress(sceneId, state) {
  const scene = SCENES[sceneId];
  if (!scene) return '游戏开始前';
  const inferredAct = state.currentAct || (
    sceneId.startsWith('act1_') ? 1 : sceneId.startsWith('act2_') ? 2 : sceneId.startsWith('act3_') ? 3 : 0
  );

  switch (scene.kind) {
    case SCENE_KINDS.ANIMATION:
      return `第${inferredAct || 0}幕 - ${scene.title} / 动画中`;
    case SCENE_KINDS.MINIGAME:
      return `第${inferredAct || 0}幕 - ${scene.title} / 小游戏中`;
    case SCENE_KINDS.NARRATIVE:
      return `第${inferredAct || 0}幕 - ${scene.title} / 对话中`;
    case SCENE_KINDS.INVESTIGATION: {
      const found = state.investigatedHotspots[scene.id]?.length ?? 0;
      const total = scene.requiredClueCount ?? scene.hotspots.length;
      return `第${inferredAct || 0}幕 - ${scene.title} / 调查 ${found}/${total}`;
    }
    case SCENE_KINDS.DEDUCTION:
      return `第${inferredAct || 0}幕 - ${scene.title} / 推理中`;
    case SCENE_KINDS.ENDING:
      return `第${inferredAct || 0}幕 - ${scene.title} / 已完成`;
    default:
      return '游戏开始前';
  }
}

function createSlotId() {
  return globalThis.crypto?.randomUUID?.()
    ?? `save-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * 保存当前完整运行时状态。
 * 不传 slotIndex 时新增存档；传入 slotIndex 时覆盖对应槽位。
 *
 * @param {object} state 当前游戏状态
 * @param {number|null} [slotIndex=null] 要覆盖的存档槽索引
 * @returns {{ok: boolean, reason: string|null, slots: object[], slot?: object}}
 */
export function saveGame(state, slotIndex = null) {
  const slots = readSaveSlots();
  if (slotIndex === null && slots.length >= MAX_SAVE_SLOTS) {
    return { ok: false, reason: 'SAVE_LIMIT_REACHED', slots };
  }
  if (slotIndex !== null && (!Number.isInteger(slotIndex) || !slots[slotIndex])) {
    return { ok: false, reason: 'INVALID_SAVE_SLOT', slots };
  }

  const savedSlotIndex = slotIndex ?? slots.length;
  const sceneId = state.sceneId;
  const now = new Date();
  const slot = {
    id: slotIndex === null ? createSlotId() : slots[savedSlotIndex].id,
    savedAt: now.toISOString(),
    savedAtBeijing: formatBeijingDateTime(now.toISOString()),
    sceneId,
    progress: describeProgress(sceneId, state),
    // 将实际写入的槽位同步进快照，后续从该槽继续保存时仍能覆盖原槽。
    state: JSON.parse(JSON.stringify({ ...state, activeSaveSlotIndex: savedSlotIndex })),
  };

  const nextSlots = [...slots];
  if (slotIndex === null) nextSlots.push(slot);
  else nextSlots[savedSlotIndex] = slot;

  if (!writeJson(SAVE_SLOTS_KEY, nextSlots)) {
    return { ok: false, reason: 'SAVE_WRITE_FAILED', slots };
  }
  return { ok: true, reason: null, slots: nextSlots, slot };
}

/**
 * 获取一个可恢复的存档槽。
 * @param {number} slotIndex 存档槽索引
 * @returns {object|null}
 */
export function readSaveSlot(slotIndex) {
  return readSaveSlots()[slotIndex] ?? null;
}

/**
 * 清除所有存档槽和结局图鉴数据，供开发期“复位”按钮使用。
 * @returns {void}
 */
export function clearAllPersistentData() {
  try {
    window.localStorage.removeItem(SAVE_SLOTS_KEY);
    window.localStorage.removeItem(CODEX_KEY);
    // 清理旧版本单摘要存档，避免开发期遗留数据影响复位结果。
    window.localStorage.removeItem('dream-investigation.save-summary');
    window.sessionStorage.clear();
    if (window.caches?.keys) {
      window.caches.keys()
        .then((keys) => Promise.all(keys.map((key) => window.caches.delete(key))))
        .catch(() => {});
    }
  } catch {
    // 存储不可用时，运行时 reset 仍会正常执行。
  }
}

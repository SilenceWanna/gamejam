// 可序列化 state + setState + subscribe。
// 当前只放「当前场景」；后续要加进度 / 存档字段，直接往 state 里加。
let state = { sceneId: 'title' }
const subs = new Set()

export function getState() { return state }
export function setState(patch) {
  state = typeof patch === 'function' ? patch(state) : { ...state, ...patch }
  subs.forEach((fn) => fn(state))
}
export function subscribe(fn) { subs.add(fn); return () => subs.delete(fn) }

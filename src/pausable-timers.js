// Small timer group used by animation playback. Keeping this independent from
// the DOM makes pause/resume timing deterministic and directly testable.
export function createPausableTimers(options = {}) {
  const now = options.now ?? (() => performance.now());
  const setTimer = options.setTimer ?? setTimeout;
  const clearTimer = options.clearTimer ?? clearTimeout;
  const tasks = new Set();
  let paused = false;
  let disposed = false;
  let accumulated = 0;
  let activeStartedAt = now();

  const arm = (task) => {
    task.startedAt = now();
    task.timerId = setTimer(() => {
      task.timerId = null;
      tasks.delete(task);
      if (!disposed) task.callback();
    }, Math.max(0, task.remaining));
  };

  return {
    schedule(callback, delay) {
      if (disposed) return null;
      const task = { callback, remaining: Math.max(0, Number(delay) || 0), startedAt: null, timerId: null };
      tasks.add(task);
      if (!paused) arm(task);
      return task;
    },
    pause() {
      if (disposed || paused) return;
      paused = true;
      const pausedAt = now();
      accumulated += pausedAt - activeStartedAt;
      for (const task of tasks) {
        if (task.timerId === null) continue;
        task.remaining = Math.max(0, task.remaining - (pausedAt - task.startedAt));
        clearTimer(task.timerId);
        task.timerId = null;
      }
    },
    resume() {
      if (disposed || !paused) return;
      paused = false;
      activeStartedAt = now();
      for (const task of tasks) arm(task);
    },
    clear() {
      if (disposed) return;
      disposed = true;
      for (const task of tasks) {
        if (task.timerId !== null) clearTimer(task.timerId);
      }
      tasks.clear();
    },
    get paused() { return paused; },
    get elapsed() { return accumulated + (!paused && !disposed ? now() - activeStartedAt : 0); },
  };
}

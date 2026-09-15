// Development only. Set to false for release.
// To remove entirely: delete this file and the import + attachment in minigame.js.
import { navigate } from '../router.js?v=20260915-script-v2-1';
import { getState, setState } from '../state.js';

export const MINIGAME_SKIP_ENABLED = true;

const CLUE_BY_GAME = Object.freeze({
  kick: 'clue_kick_six',
  pronunciation: 'clue_southern_pronunciation',
  'side-kick': 'clue_leg_condition',
});

const SHOW_OUTRO_ON_SKIP = new Set(['kick', 'pronunciation', 'act3-kick']);
const shouldShowOutro = scene => SHOW_OUTRO_ON_SKIP.has(scene.game) && Boolean(scene.outroLines?.length);
const progressVersionFor = scene => scene.game === 'act3-kick' ? 1 : 3;

export function skipMinigame(scene) {
  const state = getState();
  const clueId = CLUE_BY_GAME[scene.game];
  const successClueIds = scene.successClueIds ?? (clueId ? [clueId] : []);
  const showOutro = shouldShowOutro(scene);
  const progress = {
    ...(state.minigames[scene.id] ?? {}),
    passed: true,
    skippedForTesting: true,
    ...(showOutro ? {
      version: progressVersionFor(scene),
      stage: 'outro',
      stageElapsed: 0,
      outroIndex: 0,
    } : {}),
  };
  setState({
    minigames: {
      ...state.minigames,
      [scene.id]: progress,
    },
    collectedClueIds: [...new Set([...state.collectedClueIds, ...successClueIds])],
  });
  if (!showOutro) navigate(scene.nextOnSuccess);
}

export function attachMinigameSkip(page, scene) {
  if (!MINIGAME_SKIP_ENABLED || !scene.nextOnSuccess) return;

  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = '跳过（测试）';
  button.title = shouldShowOutro(scene)
    ? '跳过当前玩法，查看结束对白（仅开发测试）'
    : '跳过当前小游戏，进入下一阶段（仅开发测试）';
  button.dataset.devControl = 'minigame-skip';
  // Match the animation test control and keep all development-only styling local.
  Object.assign(button.style, {
    position: 'fixed', top: '18px', right: '100px', zIndex: '20',
    minHeight: '36px', padding: '7px 14px', border: '1px dashed #e8b844',
    borderRadius: '6px', background: '#171a1f', color: '#e8b844',
    fontSize: '13px', fontWeight: '700', cursor: 'pointer',
  });
  button.addEventListener('click', () => {
    button.disabled = true;
    skipMinigame(scene);
  }, { once: true });
  page.append(button);
}

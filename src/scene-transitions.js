// A slower white dissolve is reserved for memory entrances and the third-act
// impact beat. The first two minigames now enter through the normal dissolve.
const whiteTransitionMinigames = new Set(['act3_sidekick']);
const memoryEntrances = new Set([
  'prologue_dialogue->act1_animation',
  'act1_to_act2->act2_animation',
  'act2_to_act3->act3_animation',
]);
// Ending pages reuse the animation's exact final image and camera crop. Swapping
// those matching frames directly avoids exposing the light page shell between
// two semi-transparent pages while keeping the result visually continuous.
const endingFrameHandoffs = new Set([
  'he_animation->ending_he',
  'he_animation_outro->ending_he',
  'be_animation->ending_be',
  'be_animation_outro->ending_be',
]);
export const WHITE_TRANSITION_TIMING = Object.freeze({
  fadeIn: 1000,
  hold: 150,
  fadeOut: 1250,
});

export const CROSSFADE_TRANSITION_TIMING = Object.freeze({
  page: 420,
  visual: 480,
  beDialogueToAnimation: 1000,
});

export function crossfadeDuration(from, to) {
  return from === 'be_transition' && to === 'be_animation'
    ? CROSSFADE_TRANSITION_TIMING.beDialogueToAnimation
    : CROSSFADE_TRANSITION_TIMING.page;
}

export function usesWhiteTransition(from, to) {
  return Boolean(from)
    && from !== to
    && (whiteTransitionMinigames.has(to) || memoryEntrances.has(`${from}->${to}`));
}

export function usesCrossfadeTransition(from, to) {
  return Boolean(from)
    && Boolean(to)
    && from !== to
    && !endingFrameHandoffs.has(`${from}->${to}`)
    && !usesWhiteTransition(from, to);
}

export function shouldCrossfadeDialogueBox({ backgroundChanged = false, portraitChanged = false } = {}) {
  return Boolean(backgroundChanged || portraitChanged);
}

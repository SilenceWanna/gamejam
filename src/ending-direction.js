import { createMontageShot } from './animation-timeline.js';
import { ENDING_SCRIPT as script } from './ending-script.js?v=20260915-be-narration-1-be-location-1';

function shot(kind, id, image, lines, from, to) {
  return createMontageShot(lines.map(line => ({ ...line, image: `assets/images/animation/${kind}/END-${kind.toUpperCase()}-CG-${image}-001.png` })),
    { id, from, to, transition: 'dissolve', hold: .08, settle: .94 });
}
const he = (id, image, lines, from, to) => shot('he', id, image, lines, from, to);
const be = (id, image, lines, from, to) => shot('be', id, image, lines, from, to);

const heOpening = he('shuttle-to-wide', 'WATERSIDE_TALK',
  [...script.he_intro, ...script.he_dialogue.slice(0, 1)], [33, 56, 2.4], [50, 50, 1.02]);
const heKick = he('kick-again', 'KICK_SHUTTLECOCK', script.he_dialogue.slice(1, 5),
  [50, 50, 1.02], [47, 52, 1.16]);
const heDeparture = {
  ...he('departure-lines', 'WAVE_GOODBYE', script.he_dialogue.slice(5, 7),
    [58, 45, 1.12], [68, 39, 1.34]),
  duration: 2331,
  audioSrc: 'assets/audio/dialogue/ending/he/ayao-adult/GT-HE-AYAO_ADULT-003.wav',
  audioTail: 500,
};
const heFarewell = he('farewell-wave', 'WAVE_GOODBYE',
  [...script.he_dialogue.slice(7), script.he_outro[0]], [68, 39, 1.34], [65, 42, 1.18]);

// 到站音效由 WAV 元数据测得为 11,385 ms。原本以 HE 时间线里“那我走了”
// 这句台词结束（opening 16,659 ms + kick 13,473 ms + departure 2,331 ms）为结束点；
// 现在按调整要求整体后移 2,000 ms，在 HE 开始后 23,078 ms 播放，落在 kick
// 镜头起始后的 6,419 ms，音效结束于 34,463 ms。
export const HE_TRAIN_ARRIVAL_TIMING = Object.freeze({
  duration: 11385,
  startDelay: 2000,
  absoluteEnd: heOpening.duration + heKick.duration + heDeparture.duration + 2000,
  absoluteStart: heOpening.duration + heKick.duration + heDeparture.duration - 11385 + 2000,
});
const heKickWithTrainArrival = {
  ...heKick,
  captions: heKick.captions.map((caption, index) => index === 0
    ? {
      ...caption,
      sfx: 'assets/audio/effect/sfx/animation/ending/he/SFX_HE_TRAIN_ARRIVAL【蝶了】.wav',
      sfxDelay: HE_TRAIN_ARRIVAL_TIMING.absoluteStart - heOpening.duration,
      sfxVolume: 0.45,
    }
    : caption),
};
const beWalkAway = be('walk-away', 'WALK_AWAY', script.be_dialogue.slice(7, 10),
  [50, 50, 1.02], [50, 50, 1.04]);
const beClosing = {
  ...be('quiet-goodbye', 'WALK_AWAY', script.be_dialogue.slice(10),
    [50, 50, 1.04], [50, 50, 1.06]),
  duration: 3233,
  audioSrc: 'assets/audio/dialogue/ending/be/ayao-adult/GT-BE-AYAO_ADULT-004.wav',
  audioTail: 500,
};

export const ENDING_SHOTS = {
  he_intro: [he('water-night', 'WATERSIDE_TALK', script.he_intro, [50, 50, 1.02], [35, 57, 1.5])],
  he_dialogue: [
    he('shuttle-talk', 'WATERSIDE_TALK', script.he_dialogue.slice(0, 1), [33, 56, 2.4], [50, 50, 1.02]),
    heKick,
    heDeparture,
    he('farewell', 'WAVE_GOODBYE', script.he_dialogue.slice(7), [68, 39, 1.34], [73, 37, 1.5]),
  ],
  he_outro: [
    he('wave', 'WAVE_GOODBYE', script.he_outro.slice(0, 1), [73, 37, 1.5], [50, 50, 1.02]),
    he('feather', 'CITY_LIGHTS', script.he_outro.slice(1, 3), [25, 59, 2.1], [45, 50, 1.22]),
    he('homeward-lights', 'CITY_LIGHTS', script.he_outro.slice(3), [45, 50, 1.22], [50, 50, 1.02]),
  ],
  // One restrained push-in per CG, continued across scene boundaries.
  be_intro: [be('valley-evening', 'VALLEY_TALK', script.be_intro, [50, 50, 1.02], [50, 50, 1.04])],
  be_dialogue: [
    be('valley-talk', 'VALLEY_TALK', script.be_dialogue.slice(0, 7), [50, 50, 1.04], [50, 50, 1.12]),
    beWalkAway,
    beClosing,
  ],
  be_outro: [be('mountains-remain', 'WALK_AWAY', script.be_outro, [50, 50, 1.06], [50, 50, 1.14])],
};

// Normal HE playback is one scene, so its former intro/dialogue/outro page
// boundaries cannot flash the page background between shots.
ENDING_SHOTS.he_full = [heOpening, heKickWithTrainArrival, heDeparture, heFarewell, ...ENDING_SHOTS.he_outro.slice(1)];

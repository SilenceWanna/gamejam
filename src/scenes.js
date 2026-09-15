import { ENDING_SHOTS } from './ending-direction.js?v=20260915-be-narration-1-be-location-1-he-audio-1';
import { buildAct2Sequence, buildAct3Sequence } from './memory-direction.js';
import { createMontageShot } from './animation-timeline.js?v=20260915-act1-audio-1-act3-audio-1-act2-group-audio-1-act3-audio-mix-1';
// Scene registry. Animation and minigame scenes are data driven so their renderers
// can stay generic while each act supplies its own shots and clues.
export const SCENE_KINDS = Object.freeze({
  TITLE: 'title', SETTINGS: 'settings', ANIMATION: 'animation', NARRATIVE: 'narrative',
  MINIGAME: 'minigame', INVESTIGATION: 'investigation', DEDUCTION: 'deduction', ENDING: 'ending',
});

const shot = (label, text, background, transform = 'scale(1)', duration = null, extra = {}) => ({ label, text, background, transform, ...(duration ? { duration } : {}), ...extra });
const dialogueShot = (speaker, text, background, duration = null, extra = {}) => shot(speaker, text, background, 'scale(1)', duration, { speaker, ...extra });
const ACT1_ART = 'assets/images/animation/act1';
const OFFICE_CLIENT_BG = 'assets/images/background/office/MIA-SYS-BG-OfficeTalk_ClientBG_Day_v01.png';
const OFFICE_MIA_BG = 'assets/images/background/office/MIA-SYS-BG-OfficeTalk_MiaBG_Day_v01.png';
const OFFICE_REASONING_BG = 'assets/images/background/office/MIA-SYS-BG-OfficeReasoningDesk_Day_v02.png';
const OFFICE_EVIDENCE_BG = 'assets/images/background/office/MIA-SYS-BG-OfficeReasoningDesk_Day_v01.png';
const PROLOGUE_OFFICE_EXTERIOR = 'assets/images/background/office/MIA-SYS-BG-OfficeExterior_AfterRain_v01.png';
const PROLOGUE_OFFICE_MASTER = 'assets/images/background/office/reference/MIA-SYS-BG-OfficeSpatialMaster_Day_v01.png';
const AMB_RAIN_OUTDOOR = { source: 'assets/audio/effect/ambience/office/AMB_RAIN_OUTDOOR_LOOP.wav', loop: true, baseVolume: 0.72 };
const AMB_OFFICE_RAIN_WINDOW = { source: 'assets/audio/effect/ambience/office/AMB_OFFICE_RAIN_WINDOW_LOOP.wav', loop: true, baseVolume: 0.62 };
const AMB_OFFICE_AC = { source: 'assets/audio/effect/ambience/office/AMB_OFFICE_AC_LOOP.wav', loop: true, baseVolume: 0.58 };
const AMB_OFFICE_ROOMTONE = { source: 'assets/audio/effect/ambience/office/AMB_OFFICE_ROOMTONE_LOOP.wav', loop: true, baseVolume: 0.58 };
const AMB_P2_CLASSROOM_ROOMTONE = { source: 'assets/audio/effect/ambience/act2/AMB_P2_CLASSROOM_ROOMTONE_LOOP.wav', loop: true, baseVolume: 0.68 };
const AMB_P2_PLAYGROUND = { source: 'assets/audio/effect/ambience/act2/AMB_P2_PLAYGROUND_LOOP.wav', loop: true, baseVolume: 0.68 };
const AMB_P1_VILLAGE_DAY = { source: 'assets/audio/effect/ambience/act1/AMB_P1_VILLAGE_DAY_LOOP.wav', loop: true, baseVolume: 0.62 };
const AMB_P3_STATION_HALL = { source: 'assets/audio/effect/ambience/act3/AMB_P3_STATION_HALL_LOOP【蝶了】.wav', loop: true, baseVolume: 0.8 };
// HE 的夜间站台底噪贯穿整段结局动画，并延续到结局画面。
const AMB_HE_PLATFORM_NIGHT = { source: 'assets/audio/effect/ambience/ending/he/AMB_HE_PLATFORM_NIGHT_LOOP.wav', loop: true, baseVolume: 0.8 };
const AMB_BE_VALLEY_WIND = { source: 'assets/audio/effect/ambience/ending/be/AMB_BE_VALLEY_WIND_LOOP.wav', loop: true, baseVolume: 0.68 };
const SFX_P3_TRAIN_ARRIVAL = 'assets/audio/effect/sfx/animation/act3/SFX_P3_TRAIN_ARRIVAL【蝶了】.wav';
const SFX_P2_STUDENTS_GROUP = 'assets/audio/dialogue/act2/animation/classmate/GT-P2-STUDENTS-GROUP.wav';
const endingFrame = (shots) => {
  const finalShot = shots.at(-1) ?? {};
  return Object.freeze({
    image: finalShot.image ?? finalShot.src ?? '',
    camera: finalShot.cameraPath?.at(-1) ?? finalShot.cameraTo ?? finalShot.camera ?? { x: 0, y: 0, scale: 1 },
  });
};
const HE_ENDING_FRAME = endingFrame(ENDING_SHOTS.he_full);
const BE_ENDING_FRAME = endingFrame(ENDING_SHOTS.be_outro);
const act1Shot = (label, text, image, cameraFrom, cameraTo, extra = {}) => shot(
  label,
  text,
  'act1-memory',
  'scale(1)',
  null,
  { image: `${ACT1_ART}/${image}`, cameraFrom, cameraTo, ...extra },
);

// Dissolve on a change of subject, then hold and move within the composition.
// Each range retains its original subtitles without triggering camera resets.
function buildAct1Sequence(lines) {
  const shots = [
    // The shuttlecock is the memory's visual anchor; reveal the village after it.
    { start: 0, end: 2, id: 'shuttle-detail', from: [54, 57, 2.8], to: [54, 57, 2.6] },
    { start: 2, end: 9, id: 'village-wide', from: [50, 50, 1.02], to: [44, 51, 1.16] },
    // Father and child first. The mother's first line motivates the reveal.
    { start: 9, end: 12, id: 'father-child', from: [35, 32, 1.8], to: [37, 33, 1.7], transition: 'dissolve' },
    { start: 12, end: 16, id: 'mother-reveal', from: [37, 33, 1.7], to: [50, 50, 1.02], hold: .04, settle: .7 },
    { start: 16, end: 20, id: 'child-hesitation', from: [44, 43, 1.85], to: [44, 42, 2.05] },
    { start: 20, end: 22, id: 'family-distance', from: [50, 50, 1.04], to: [50, 50, 1.02] },
    // Weight of the basket, the adult's rebuke, then the child's reaction.
    { start: 22, end: 24, id: 'heavy-basket', from: [34, 62, 2.1], to: [40, 54, 1.85], transition: 'dissolve' },
    { start: 24, end: 27, id: 'mother-rebuke', from: [67, 35, 1.65], to: [50, 50, 1.02], hold: .08 },
    { start: 27, end: 30, id: 'child-exhausted', from: [49, 37, 1.8], to: [50, 35, 2.05] },
    { start: 30, end: 31, id: 'shuttle-return', from: [54, 57, 2.6], to: [50, 50, 1.02], transition: 'dissolve', duration: 7500 },
  ];
  return shots.map(({ start, end, ...direction }) => createMontageShot(lines.slice(start, end), direction));
}

export const SCENES = Object.freeze({
  title: { id: 'title', kind: SCENE_KINDS.TITLE, title: '归途', startTo: 'prologue_animation' },

  prologue_animation: {
    "id": "prologue_animation",
    "kind": "animation",
    "title": "序幕",
    "ambience": AMB_RAIN_OUTDOOR,
    "next": "prologue_dialogue",
    "shots": [
      {
        "label": "场景",
        "text": "【R城，雨后。】",
        "background": "office-prologue",
        "image": PROLOGUE_OFFICE_EXTERIOR,
        "duration": 3600,
        "cameraEasing": "linear",
        "cameraFrom": { "x": 0, "y": 0, "scale": 1 },
        "cameraTo": { "x": -2, "y": 0, "scale": 1.04 }
      },
      {
        "label": "场景",
        "text": "【湿漉漉的街道映着店铺灯牌，电车从远处驶过。】",
        "background": "office-prologue",
        "image": PROLOGUE_OFFICE_EXTERIOR,
        "duration": 5200,
        "cameraEasing": "linear",
        "cameraFrom": { "x": -2, "y": 0, "scale": 1.04 },
        "cameraTo": { "x": -6, "y": 0, "scale": 1.1 },
        "seamlessFromPrevious": true
      },
      {
        "label": "场景",
        "text": "【成年阿遥沿旧商住楼区的街道一直走，在一扇磨砂玻璃门前停下。】",
        "background": "office-prologue",
        "image": PROLOGUE_OFFICE_EXTERIOR,
        "duration": 6500,
        "cameraEasing": "linear",
        "cameraFrom": { "x": -6, "y": 0, "scale": 1.1 },
        "cameraTo": { "x": -11, "y": 0, "scale": 1.19 },
        "seamlessFromPrevious": true
      },
      {
        "label": "场景",
        "text": "【门上写着 MIA PRIVATE INQUIRY OFFICE。】",
        "background": "office-prologue",
        "image": PROLOGUE_OFFICE_EXTERIOR,
        "duration": 4400,
        "cameraEasing": "linear",
        "cameraFrom": { "x": -11, "y": 0, "scale": 1.19 },
        "cameraTo": { "x": -15, "y": 0, "scale": 1.3 },
        "seamlessFromPrevious": true
      },
      {
        "label": "场景",
        "text": "【阿遥停了一下，按响门铃。】",
        "background": "office-prologue",
        "image": PROLOGUE_OFFICE_EXTERIOR,
        "duration": 4000,
        "cameraEasing": "linear",
        "cameraFrom": { "x": -15, "y": 0, "scale": 1.3 },
        "cameraTo": { "x": -18, "y": 0, "scale": 1.48 },
        "seamlessFromPrevious": true
      },
      {
        "label": "场景",
        "text": "【室内。木质办公桌上摊着文件和日系文具，墙上挂着尚未整理完的线索。】",
        "captions": [
          { "at": 0, "text": "室内。木质办公桌上摊着文件和日系文具，墙上挂着尚未整理完的线索。" },
          { "at": 5000, "text": "我坐在桌后翻看资料，没有立刻抬头。", "sfx": "assets/audio/effect/sfx/office/SFX_BOOK_OPEN_03.wav", "sfxDelay": 500 }
        ],
        "background": "office-prologue",
        "image": PROLOGUE_OFFICE_MASTER,
        "ambience": [AMB_OFFICE_ROOMTONE, AMB_OFFICE_RAIN_WINDOW],
        "duration": 8500,
        "cameraEasing": "linear",
        "cameraFrom": { "x": 0, "y": 0, "scale": 1 },
        "cameraTo": { "x": 0, "y": -7, "scale": 1.25 }
      }
    ]
  },
  prologue_dialogue: {
    "id": "prologue_dialogue",
    "kind": "narrative",
    "title": "序幕",
    "portraitEntrance": "fade",
    "ambience": [AMB_OFFICE_ROOMTONE, AMB_OFFICE_AC],
    "loopHeroineWritingSfx": true,
    "background": OFFICE_MIA_BG,
    "lines": [
      {
        "speaker": "弥",
        "text": "你想找谁？",
        "background": OFFICE_MIA_BG,
        "portraitId": "hero",
        "voiceId": "GT-PRO-MIA-001"
      },
      {
        "speaker": "",
        "text": "【短暂沉默】",
        "background": OFFICE_MIA_BG,
        "portraitId": null,
        "voiceId": null
      },
      {
        "speaker": "成年阿遥",
        "text": "一个人。",
        "background": OFFICE_CLIENT_BG,
        "portraitId": "npc",
        "voiceId": "GT-PRO-AYAO_ADULT-001"
      },
      {
        "speaker": "弥",
        "text": "名字呢？",
        "background": OFFICE_MIA_BG,
        "portraitId": "hero",
        "voiceId": "GT-PRO-MIA-002"
      },
      {
        "speaker": "成年阿遥",
        "text": "不知道。",
        "background": OFFICE_CLIENT_BG,
        "portraitId": "npc",
        "voiceId": "GT-PRO-AYAO_ADULT-002"
      },
      {
        "speaker": "弥",
        "text": "长什么样？",
        "background": OFFICE_MIA_BG,
        "portraitId": "hero",
        "voiceId": "GT-PRO-MIA-003"
      },
      {
        "speaker": "成年阿遥",
        "text": "记不清了。",
        "background": OFFICE_CLIENT_BG,
        "portraitId": "npc",
        "voiceId": "GT-PRO-AYAO_ADULT-003"
      },
      {
        "speaker": "",
        "text": "【我停下笔。】",
        "background": OFFICE_MIA_BG,
        "portraitId": "hero",
        "voiceId": null
      },
      {
        "speaker": "弥",
        "text": "那你还记得什么？",
        "background": OFFICE_MIA_BG,
        "portraitId": "hero",
        "voiceId": "GT-PRO-MIA-004"
      },
      {
        "speaker": "",
        "text": "【阿遥从包里取出一只旧毽子，轻轻放到桌上。】",
        "background": OFFICE_CLIENT_BG,
        "portraitId": "npc",
        "voiceId": null
      },
      {
        "speaker": "成年阿遥",
        "text": "我只记得……那个人教过我踢毽子。",
        "background": OFFICE_CLIENT_BG,
        "portraitId": "npc",
        "voiceId": "GT-PRO-AYAO_ADULT-004"
      },
      {
        "speaker": "",
        "text": "【我的视线落在毽子上。】",
        "background": OFFICE_MIA_BG,
        "portraitId": "hero",
        "voiceId": null
      },
      {
        "speaker": "",
        "text": "【我伸手触碰已经有些磨损的毽羽。】",
        "background": OFFICE_MIA_BG,
        "portraitId": "hero",
        "voiceId": null
      },
      {
        "speaker": "",
        "text": "【窗外电车声逐渐拉远，办公室环境声随之淡去。】",
        "background": OFFICE_MIA_BG,
        "portraitId": "hero",
        "voiceId": null
      },
      {
        "speaker": "",
        "text": "【安静中，响起毽子落在鞋面上的轻响。一下。两下。三下。】",
        "background": OFFICE_MIA_BG,
        "portraitId": "hero",
        "voiceId": null
      },
      {
        "speaker": "",
        "text": "【踢击声越来越清晰，夏日蝉鸣从远处浮现。】",
        "background": OFFICE_MIA_BG,
        "portraitId": "hero",
        "voiceId": null
      }
    ],
    "next": "act1_animation"
  },
  act1_animation: {
    "id": "act1_animation",
    "kind": "animation",
    "title": "第一幕：我五岁就来这了",
    "ambience": AMB_P1_VILLAGE_DAY,
    "next": "act1_dialogue",
    shots: buildAct1Sequence([
      act1Shot('场景', '【夏日山村】', 'P1-CG-AYAO-KICK_SHUTTLECOCK-001.png', { x: 0, y: 0, scale: 1.02 }, { x: -2, y: 0, scale: 1.08 }),
      act1Shot('场景', '【蝉鸣 鸡叫和狗吠 风穿过树叶】', 'P1-CG-AYAO-KICK_SHUTTLECOCK-001.png', { x: -2, y: 0, scale: 1.08 }, { x: 2, y: -1, scale: 1.12 }),
      act1Shot('场景', '【泥土地上，孩子的脚步来回移动】', 'P1-CG-AYAO-KICK_SHUTTLECOCK-001.png', { x: 6, y: 1, scale: 1.14 }, { x: 8, y: -2, scale: 1.22 }),
      act1Shot('场景', '【毽子一下下落在鞋面上】', 'P1-CG-AYAO-KICK_SHUTTLECOCK-001.png', { x: 7, y: -1, scale: 1.22 }, { x: 4, y: -5, scale: 1.3 }),
      act1Shot('幼年阿遥', '一、二、三、四……', 'P1-CG-AYAO-KICK_SHUTTLECOCK-001.png', { x: 5, y: -3, scale: 1.26 }, { x: 7, y: -5, scale: 1.34 }, { speaker: '幼年阿遥', voiceId: 'GT-P1-AYAO_CHILD-001' }),
      act1Shot('场景', '【毽子掉在地上】', 'P1-CG-AYAO-KICK_SHUTTLECOCK-001.png', { x: 7, y: -4, scale: 1.34 }, { x: 3, y: -8, scale: 1.4 }),
      act1Shot('场景', '【阿遥跑过去捡】', 'P1-CG-AYAO-KICK_SHUTTLECOCK-001.png', { x: 6, y: -3, scale: 1.28 }, { x: 10, y: -1, scale: 1.18 }),
      act1Shot('场景', '【远处有人喊】', 'P1-CG-AYAO-KICK_SHUTTLECOCK-001.png', { x: 8, y: 0, scale: 1.17 }, { x: -5, y: 0, scale: 1.1 }),
      act1Shot('母亲', '老汉，快点回来干活！', 'P1-CG-AYAO-KICK_SHUTTLECOCK-001.png', { x: -4, y: 0, scale: 1.1 }, { x: -8, y: -1, scale: 1.16 }, { speaker: '母亲', voiceId: 'GT-P1-FOSTER_MOTHER-001' }),
      act1Shot('场景', '【脚步由远及近】', 'P1-CG-AYAO-CALL_MOM-001.png', { x: 0, y: 0, scale: 1.02 }, { x: 5, y: -1, scale: 1.08 }),
      act1Shot('父亲', '看看我带谁回来了！', 'P1-CG-AYAO-CALL_MOM-001.png', { x: 5, y: 0, scale: 1.08 }, { x: 11, y: -2, scale: 1.17 }, { speaker: '父亲', voiceId: 'GT-P1-FOSTER_FATHER-001' }),
      act1Shot('场景', '【几个人围过来】', 'P1-CG-AYAO-CALL_MOM-001.png', { x: 0, y: 0, scale: 1.04 }, { x: 0, y: -1, scale: 1.1 }),
      act1Shot('母亲', '让我瞅一眼。', 'P1-CG-AYAO-CALL_MOM-001.png', { x: -5, y: 0, scale: 1.1 }, { x: -11, y: -2, scale: 1.2 }, { speaker: '母亲', voiceId: 'GT-P1-FOSTER_MOTHER-002' }),
      act1Shot('场景', '【养母稍稍凑近】', 'P1-CG-AYAO-CALL_MOM-001.png', { x: -5, y: -1, scale: 1.12 }, { x: 0, y: -3, scale: 1.22 }),
      act1Shot('母亲', '哟，长得蛮俊嘛。', 'P1-CG-AYAO-CALL_MOM-001.png', { x: -8, y: -2, scale: 1.18 }, { x: -12, y: -3, scale: 1.24 }, { speaker: '母亲', voiceId: 'GT-P1-FOSTER_MOTHER-003' }),
      act1Shot('场景', '【幼年阿遥没有说话】', 'P1-CG-AYAO-CALL_MOM-001.png', { x: 0, y: -2, scale: 1.2 }, { x: 1, y: -4, scale: 1.28 }),
      act1Shot('父亲', '来，认妈！', 'P1-CG-AYAO-CALL_MOM-001.png', { x: 6, y: -1, scale: 1.14 }, { x: 10, y: -2, scale: 1.2 }, { speaker: '父亲', voiceId: 'GT-P1-FOSTER_FATHER-002' }),
      act1Shot('场景', '【短暂安静】', 'P1-CG-AYAO-CALL_MOM-001.png', { x: 1, y: -3, scale: 1.22 }, { x: 1, y: -4, scale: 1.26 }),
      act1Shot('幼年阿遥', '……妈？', 'P1-CG-AYAO-CALL_MOM-001.png', { x: 1, y: -3, scale: 1.24 }, { x: 1, y: -5, scale: 1.32 }, { speaker: '幼年阿遥', voiceId: 'GT-P1-AYAO_CHILD-002' }),
      act1Shot('母亲', '欸！乖乖！', 'P1-CG-AYAO-CALL_MOM-001.png', { x: -7, y: -2, scale: 1.17 }, { x: -11, y: -3, scale: 1.23 }, { speaker: '母亲', voiceId: 'GT-P1-FOSTER_MOTHER-004' }),
      act1Shot('场景', '【周围人笑起来】', 'P1-CG-AYAO-CALL_MOM-001.png', { x: -2, y: -1, scale: 1.1 }, { x: 2, y: 0, scale: 1.05 }),
      act1Shot('父亲', '在外头养久了，回来慢慢就熟了。', 'P1-CG-AYAO-CALL_MOM-001.png', { x: 8, y: -1, scale: 1.14 }, { x: 11, y: -2, scale: 1.2 }, { speaker: '父亲', voiceId: 'GT-P1-FOSTER_FATHER-003' }),
      act1Shot('场景', '【风声掠过 锄头落地 泥土翻动】', 'P1-CG-AYAO-CANT_MOVE-001.png', { x: -2, y: 0, scale: 1.05 }, { x: 3, y: -2, scale: 1.12 }, { effect: 'fade' }),
      act1Shot('场景', '【孩子拖动沉重物件 物体摩擦地面】', 'P1-CG-AYAO-CANT_MOVE-001.png', { x: 4, y: -1, scale: 1.12 }, { x: 7, y: -4, scale: 1.22 }, { sfx: 'assets/audio/effect/sfx/animation/act1/SFX_P1_AYAO_DIRT_FOOTSTEPS.wav' }),
      act1Shot('母亲', '会不会干活啊！男娃怎么没得力气啊？', 'P1-CG-AYAO-CANT_MOVE-001.png', { x: -7, y: -1, scale: 1.12 }, { x: -12, y: -3, scale: 1.2 }, { speaker: '母亲', voiceId: 'GT-P1-FOSTER_MOTHER-005' }),
      act1Shot('场景', '【阿遥喘气】', 'P1-CG-AYAO-CANT_MOVE-001.png', { x: 5, y: -3, scale: 1.2 }, { x: 8, y: -5, scale: 1.28 }),
      act1Shot('母亲', '给你吃这么好，不是养猪的！', 'P1-CG-AYAO-CANT_MOVE-001.png', { x: -8, y: -2, scale: 1.15 }, { x: -12, y: -3, scale: 1.22 }, { speaker: '母亲', voiceId: 'GT-P1-FOSTER_MOTHER-006' }),
      act1Shot('幼年阿遥', '妈，我搬不动。', 'P1-CG-AYAO-CANT_MOVE-001.png', { x: 5, y: -3, scale: 1.21 }, { x: 8, y: -5, scale: 1.3 }, { speaker: '幼年阿遥', voiceId: 'GT-P1-AYAO_CHILD-003' }),
      act1Shot('母亲', '搬不动就少搬点。', 'P1-CG-AYAO-CANT_MOVE-001.png', { x: -8, y: -2, scale: 1.16 }, { x: -11, y: -3, scale: 1.22 }, { speaker: '母亲', voiceId: 'GT-P1-FOSTER_MOTHER-007' }),
      act1Shot('母亲', '哪有男娃连这点东西都搬不动的。', 'P1-CG-AYAO-CANT_MOVE-001.png', { x: -9, y: -2, scale: 1.18 }, { x: -13, y: -3, scale: 1.25 }, { speaker: '母亲', voiceId: 'GT-P1-FOSTER_MOTHER-008' }),
      act1Shot('场景', '【阿遥没有回答 远处再次响起毽子落地的声音】', 'P1-CG-AYAO-KICK_SHUTTLECOCK-001.png', { x: 6, y: -3, scale: 1.3 }, { x: 2, y: 0, scale: 1.08 }, { effect: 'fade' }),
    ]),
  },
  act1_dialogue: {
    "id": "act1_dialogue",
    "kind": "narrative",
    "ambience": AMB_OFFICE_ROOMTONE,
    "loopHeroineWritingSfx": true,
    "title": "第一幕：我五岁就来这了",
    "background": OFFICE_MIA_BG,
    "lines": [
      {
        "speaker": "",
        "text": "【毽子落地声持续半拍，田间风声逐渐拉远。】",
        "background": OFFICE_MIA_BG,
        "portraitId": "hero",
        "voiceId": null
      },
      {
        "speaker": "",
        "text": "【旧毽子停在办公桌中央，我收回碰触毽羽的手。】",
        "background": OFFICE_MIA_BG,
        "portraitId": null,
        "voiceId": null
      },
      {
        "speaker": "弥",
        "text": "所以他们一直跟你说，你老家就是这里？",
        "background": OFFICE_MIA_BG,
        "portraitId": "hero",
        "voiceId": "GT-P1-MIA-001"
      },
      {
        "speaker": "成年阿遥",
        "text": "嗯。",
        "background": OFFICE_CLIENT_BG,
        "portraitId": "npc",
        "voiceId": "GT-P1-AYAO_ADULT-001"
      },
      {
        "speaker": "弥",
        "text": "小时候只是放在亲戚家代养，五岁才接回来？",
        "background": OFFICE_MIA_BG,
        "portraitId": "hero",
        "voiceId": "GT-P1-MIA-002"
      },
      {
        "speaker": "成年阿遥",
        "text": "他们是这么说的。",
        "background": OFFICE_CLIENT_BG,
        "portraitId": "npc",
        "voiceId": "GT-P1-AYAO_ADULT-002"
      },
      {
        "speaker": "弥",
        "text": "那五岁以前呢？",
        "background": OFFICE_MIA_BG,
        "portraitId": "hero",
        "voiceId": "GT-P1-MIA-003"
      },
      {
        "speaker": "",
        "text": "【安静几秒】",
        "background": OFFICE_MIA_BG,
        "portraitId": null,
        "voiceId": null
      },
      {
        "speaker": "成年阿遥",
        "text": "……不记得了。",
        "background": OFFICE_CLIENT_BG,
        "portraitId": "npc",
        "voiceId": "GT-P1-AYAO_ADULT-003"
      }
    ],
    "next": "act1_kick"
  },
  act1_kick: {
    id: 'act1_kick', kind: SCENE_KINDS.MINIGAME, title: '踢毽子', game: 'kick', target: 6,
    ambience: AMB_P1_VILLAGE_DAY,
    introLines: [
      {
        speaker: '',
        text: '【我将“被接回时五岁”写入调查记录，把旧毽子推回阿遥面前。】',
        portraitId: 'hero',
        background: OFFICE_MIA_BG,
        ambience: AMB_OFFICE_ROOMTONE,
      },
      { speaker: '', text: '【男孩踢毽子的画面从记忆深处浮现。】', portraitId: 'hero' },
      { speaker: '弥', text: '再回到这段记忆里看看。', portraitId: 'hero' },
      { speaker: '弥', text: '那时候，阿遥似乎总要连续踢够六下。', portraitId: 'hero' },
    ],
    outroLines: [
      { speaker: '', text: '【第六次踢击落下，声音与阿遥记忆中的毽子落地声重合。】', portraitId: 'hero' },
      { speaker: '弥', text: '为什么一定是六下？', portraitId: 'hero' },
      { speaker: '弥', text: '去阿遥的房间找找，看有没有和“六”有关的线索。', portraitId: 'hero' },
    ],
    instructions: '白线进入金色区间时，点击「踢」或按空格。连续成功 6 次；失误则从头再来。',
    imageBase: 'assets/images/minigames/act1',
    imageFiles: [
      'P1-MG-JIANZI-AYAO-001.png',
      'P1-MG-JIANZI-AYAO-002.png',
      'P1-MG-JIANZI-AYAO-003.png',
      'P1-MG-JIANZI-AYAO-004.png',
      'P1-MG-JIANZI-AYAO-005.png',
      'P1-MG-JIANZI-AYAO-006.png',
    ],
    hitSfx: [
      'assets/audio/effect/sfx/minigames/act1/kick/SFX_JIANZI_MOTIF_01.wav',
      'assets/audio/effect/sfx/minigames/act1/kick/SFX_JIANZI_MOTIF_02.wav',
      'assets/audio/effect/sfx/minigames/act1/kick/SFX_JIANZI_MOTIF_03.wav',
      'assets/audio/effect/sfx/minigames/act1/kick/SFX_JIANZI_MOTIF_04.wav',
      'assets/audio/effect/sfx/minigames/act1/kick/SFX_JIANZI_MOTIF_05.wav',
      'assets/audio/effect/sfx/minigames/act1/kick/SFX_JIANZI_MOTIF_06.wav',
    ],
    dropSfx: [
      'assets/audio/effect/sfx/minigames/act1/kick/drop/SFX_JIANZI_DROP_01.wav',
      'assets/audio/effect/sfx/minigames/act1/kick/drop/SFX_JIANZI_DROP_02.wav',
      'assets/audio/effect/sfx/minigames/act1/kick/drop/SFX_JIANZI_DROP_03.wav',
    ],
    pickupSfx: [
      'assets/audio/effect/sfx/minigames/act1/kick/pickup/SFX_JIANZI_PICKUP_01.wav',
      'assets/audio/effect/sfx/minigames/act1/kick/pickup/SFX_JIANZI_PICKUP_02.wav',
      'assets/audio/effect/sfx/minigames/act1/kick/pickup/SFX_JIANZI_PICKUP_03.wav',
    ],
    controls: { release: { x: 27, y: 53 }, kick: { x: 56, y: 71 }, pickup: { x: 53, y: 68 } },
    nextOnSuccess: 'act1_investigation',
  },
  act1_investigation: {
    id: 'act1_investigation', kind: SCENE_KINDS.INVESTIGATION, title: '阿遥的房间', background: 'assets/images/background/MIA-C01-P1-INV-01_AyaoRoom.png',
    ambience: AMB_P1_VILLAGE_DAY,
    description: '检查房间里的物品，寻找这段记忆的矛盾。', requiredClueCount: 2, exitTo: 'act1_deduction', hotspotStyle: 'invisible',
    archiveClueIds: ['clue_kick_six', 'clue_custom_article', 'clue_photo_age5', 'clue_height_marks', 'clue_marked_calendar', 'clue_amended_health_booklet', 'clue_restiched_schoolbag', 'clue_six_notched_shuttlecock', 'clue_mended_coat'],
    hotspots: [
      // x/y 是 16:9 原图中的判定框中心点；图片与热点会一起等比铺满舞台。
      { id: 'desk_right_third_drawer', x: 61.5, y: 67.15, width: 8, height: 6.3, clueId: 'clue_custom_article', popupType: 'newspaper', label: '书桌右侧第三个抽屉' },
      { id: 'wall_photos', x: 28.3, y: 26.4, width: 6.2, height: 20.8, clueId: 'clue_photo_age5', popupType: 'album', label: '墙上的旧照片' },
      { id: 'height_marks', x: 68.3, y: 36, width: 5, height: 18, clueId: 'clue_height_marks', label: '窗边的身高刻痕' },
      { id: 'old_calendar', x: 69, y: 18.5, width: 5, height: 14, clueId: 'clue_marked_calendar', label: '窗边的旧挂历' },
      { id: 'health_booklet', x: 46.75, y: 53.6, width: 21.5, height: 5.8, clueId: 'clue_amended_health_booklet', label: '书桌中间抽屉里的健康手册' },
      { id: 'schoolbag', x: 86.35, y: 33.65, width: 6.7, height: 23.3, clueId: 'clue_restiched_schoolbag', label: '墙边的旧书包' },
      { id: 'notched_shuttlecock', x: 70.9, y: 81.5, width: 5.2, height: 9, clueId: 'clue_six_notched_shuttlecock', label: '地上的旧毽子' },
      { id: 'mended_coat', x: 76.95, y: 29.1, width: 9.5, height: 27.4, clueId: 'clue_mended_coat', label: '墙上挂着的旧外套' },
    ],
  },
  act1_deduction: {
    "id": "act1_deduction",
    "kind": "deduction",
    "title": "第一幕推理",
    "background": OFFICE_REASONING_BG,
    "ambience": AMB_OFFICE_ROOMTONE,
    "deductionId": "act1_age",
    "question": "有些线索好像有矛盾",
    "introLines": [
      { "speaker": "弥", "text": "这段“连续六下”的记忆，和房间里的线索似乎对不上。", "portraitId": "hero" }
    ],
    "requiredCount": 3,
    "backTo": "act1_investigation",
    "fixedSlots": {
      "0": "clue_kick_six"
    },
    "outroLines": [
      { "speaker": "弥", "text": "阿遥被接回山村时，很可能已经六岁了。", "portraitId": "hero" },
      { "speaker": "弥", "text": "这和阿遥记得的“五岁”对不上。", "portraitId": "hero" }
    ],
    "outroNext": "act1_to_act2",
    "expressionOperators": [
      "+",
      "≠"
    ]
  },
  act1_to_act2: {
    id: 'act1_to_act2', kind: SCENE_KINDS.NARRATIVE, title: '第一幕结论', background: OFFICE_MIA_BG, ambience: AMB_OFFICE_ROOMTONE,
    lines: [
      { speaker: '', text: '【我将年龄矛盾写入调查记录。】', background: OFFICE_MIA_BG, portraitId: 'hero', voiceId: null },
      { speaker: '弥', text: '再往后想想，或许还有别的线索。', background: OFFICE_MIA_BG, portraitId: 'hero', voiceId: null },
    ],
    next: 'act2_animation',
  },
  act2_animation: {
    "id": "act2_animation",
    "kind": "animation",
    "title": "第二幕：这里的人说话好奇怪",
    "next": "act2_dialogue",
    "shots": buildAct2Sequence([
      {
        "label": "场景",
        "text": "【乡镇小学】",
        "background": "grid-classroom",
        "transform": "scale(1)"
      },
      {
        "label": "场景",
        "text": "【上课铃响】",
        "background": "grid-classroom",
        "transform": "scale(1)"
      },
      {
        "label": "场景",
        "text": "【木椅拖动，孩子们窸窸窣窣坐下】",
        "background": "grid-classroom",
        "transform": "scale(1)"
      },
      {
        "label": "老师",
        "text": "安静，安静。",
        "background": "grid-classroom",
        "transform": "scale(1)",
        "speaker": "老师",
        "voiceId": "GT-P2-TEACHER-001"
      },
      {
        "label": "场景",
        "text": "【教室逐渐安静】",
        "background": "grid-classroom",
        "transform": "scale(1)"
      },
      {
        "label": "老师",
        "text": "同学们，拿出课本。",
        "background": "grid-classroom",
        "transform": "scale(1)",
        "speaker": "老师",
        "voiceId": "GT-P2-TEACHER-002"
      },
      {
        "label": "老师",
        "text": "跟我念，春天来了。",
        "background": "grid-classroom",
        "transform": "scale(1)",
        "speaker": "老师",
        "voiceId": "GT-P2-TEACHER-003"
      },
      {
        "label": "学生们",
        "text": "春天来了。",
        "background": "grid-classroom-students",
        "transform": "scale(1)",
        "speaker": "学生们",
        "duration": 3030,
        "sfx": SFX_P2_STUDENTS_GROUP,
        "sfxDelay": 500
      },
      {
        "label": "场景",
        "text": "【幼年阿遥迟疑了一下】",
        "background": "grid-classroom-close",
        "transform": "scale(1)"
      },
      {
        "label": "幼年阿遥",
        "text": "老师。",
        "background": "grid-classroom-close",
        "transform": "scale(1)",
        "speaker": "幼年阿遥",
        "voiceId": "GT-P2-AYAO_CHILD-001"
      },
      {
        "label": "老师",
        "text": "怎么了？",
        "background": "grid-classroom",
        "transform": "scale(1)",
        "speaker": "老师",
        "voiceId": "GT-P2-TEACHER-004"
      },
      {
        "label": "幼年阿遥",
        "text": "你们说话怎么老往后卷啊。",
        "background": "grid-classroom-close",
        "transform": "scale(1)",
        "speaker": "幼年阿遥",
        "voiceId": "GT-P2-AYAO_CHILD-002"
      },
      {
        "label": "场景",
        "text": "【教室突然安静 几个孩子忍不住笑】",
        "background": "grid-classroom",
        "transform": "scale(1)",
        "showDirection": true
      },
      {
        "label": "幼年阿遥",
        "text": "和我以前听的不一样。",
        "background": "grid-classroom-close",
        "transform": "scale(1)",
        "speaker": "幼年阿遥",
        "voiceId": "GT-P2-AYAO_CHILD-003"
      },
      {
        "label": "老师",
        "text": "这就是普通话呀。",
        "background": "grid-classroom",
        "transform": "scale(1)",
        "speaker": "老师",
        "voiceId": "GT-P2-TEACHER-005"
      },
      {
        "label": "场景",
        "text": "【老师有一点哭笑不得】",
        "background": "grid-classroom",
        "transform": "scale(1)"
      },
{
        "label": "老师",
        "text": "老师念得很标准。",
        "background": "grid-classroom",
        "transform": "scale(1)",
        "speaker": "老师",
        "voiceId": "GT-P2-TEACHER-006"
      },
      {
        "label": "场景",
        "text": "【孩子们笑】",
        "background": "grid-classroom-students",
        "transform": "scale(1)"
      },
      {
        "label": "场景",
        "text": "【下课铃响】",
        "background": "grid-classroom",
        "transform": "scale(1)"
      },
      {
        "label": "场景",
        "text": "【操场。孩子们跑动、说笑】",
        "background": "grid-classroom-students",
        "transform": "scale(1)"
      },
      {
        "label": "场景",
        "text": "【阿遥一个人站在操场边】",
        "background": "grid-classroom",
        "transform": "scale(1)"
      },
      {
        "label": "场景",
        "text": "【一个小孩从远处跑过来，在他身边停下】",
        "background": "grid-classroom-students",
        "transform": "scale(1)"
      },
      {
        "label": "同学",
        "text": "哎，你刚才说我们讲话怪？",
        "background": "grid-classroom-students",
        "transform": "scale(1)",
        "speaker": "同学",
        "voiceId": "GT-P2-CLASSMATE-001"
      },
      {
        "label": "幼年阿遥",
        "text": "嗯。",
        "background": "grid-classroom-close",
        "transform": "scale(1)",
        "speaker": "幼年阿遥",
        "voiceId": "GT-P2-AYAO_CHILD-004"
      },
{
        "label": "同学",
        "text": "哪里怪了？",
        "background": "grid-classroom-students",
        "transform": "scale(1)",
        "speaker": "同学",
        "voiceId": "GT-P2-CLASSMATE-002"
      },
      {
        "label": "幼年阿遥",
        "text": "听得懂，就是……调子不对。",
        "background": "grid-classroom-close",
        "transform": "scale(1)",
        "speaker": "幼年阿遥",
        "voiceId": "GT-P2-AYAO_CHILD-005"
      },
      {
        "label": "同学",
        "text": "明明是你说话有调子！",
        "background": "grid-classroom-students",
        "transform": "scale(1)",
        "speaker": "同学",
        "voiceId": "GT-P2-CLASSMATE-003"
      },
      {
        "label": "幼年阿遥",
        "text": "我说的是普通话！",
        "background": "grid-classroom-close",
        "transform": "scale(1)",
        "speaker": "幼年阿遥",
        "voiceId": "GT-P2-AYAO_CHILD-006"
      },
      {
        "label": "同学",
        "text": "那你跟我念一句。",
        "background": "grid-classroom-students",
        "transform": "scale(1)",
        "speaker": "同学",
        "voiceId": "GT-P2-CLASSMATE-004"
      },
{
        "label": "同学",
        "text": "春天来了，小树长出了嫩绿的叶子。",
        "background": "grid-classroom-students",
        "transform": "scale(1)",
        "speaker": "同学",
        "voiceId": "GT-P2-CLASSMATE-005"
      },
      {
        "label": "场景",
        "text": "【幼年阿遥认真模仿】",
        "background": "grid-classroom-close",
        "transform": "scale(1)"
      },
      {
        "label": "幼年阿遥",
        "text": "春天来了，小树长出了嫩绿的叶子。",
        "background": "grid-classroom-close",
        "transform": "scale(1)",
        "speaker": "幼年阿遥",
        "voiceId": "GT-P2-AYAO_CHILD-007"
      },
      {
        "label": "场景",
        "text": "【同学愣了一下 随即笑出来】",
        "background": "grid-classroom-students",
        "transform": "scale(1)"
      },
      {
        "label": "同学",
        "text": "哈哈哈哈你才说话有调子！",
        "background": "grid-classroom-students",
        "transform": "scale(1)",
        "speaker": "同学",
        "voiceId": "GT-P2-CLASSMATE-006"
      },
      {
        "label": "幼年阿遥",
        "text": "明明是你们！",
        "background": "grid-classroom-close",
        "transform": "scale(1)",
        "speaker": "幼年阿遥",
        "voiceId": "GT-P2-AYAO_CHILD-008"
      },
      {
        "label": "场景",
        "text": "【同学笑着跑远 操场脚步声与说笑声逐渐散开】",
        "background": "grid-classroom-students",
        "transform": "scale(1)"
      },
      {
        "label": "场景",
        "text": "【远处有人踢毽子 啪 啪 啪 阿遥下意识回头】",
        "background": "grid-kick-shadow",
        "transform": "scale(1)"
      }
    ]).map((entry, index) => ({
      ...entry,
      ambience: index < 6 ? AMB_P2_CLASSROOM_ROOMTONE : AMB_P2_PLAYGROUND,
    }))
  },
  act2_dialogue: {
    "id": "act2_dialogue",
    "kind": "narrative",
    "ambience": AMB_OFFICE_ROOMTONE,
    "loopHeroineWritingSfx": true,
    "title": "第二幕：这里的人说话好奇怪",
    "background": OFFICE_MIA_BG,
    "lines": [
      {
        "speaker": "弥",
        "text": "所以你是在亲戚家呆久了，对普通话的调子不太熟？",
        "background": OFFICE_MIA_BG,
        "portraitId": "hero",
        "voiceId": "GT-P2-MIA-001"
      },
      {
        "speaker": "成年阿遥",
        "text": "……",
        "background": OFFICE_CLIENT_BG,
        "portraitId": "npc",
        "voiceId": "GT-P2-AYAO_ADULT-001"
      },
      {
        "speaker": "弥",
        "text": "你还记得亲戚家在哪里吗？",
        "background": OFFICE_MIA_BG,
        "portraitId": "hero",
        "voiceId": "GT-P2-MIA-002"
      },
      {
        "speaker": "成年阿遥",
        "text": "不记得，好像还挺远。",
        "background": OFFICE_CLIENT_BG,
        "portraitId": "npc",
        "voiceId": "GT-P2-AYAO_ADULT-002"
      }
    ],
    "next": "act2_pronunciation"
  },
  act2_pronunciation: {
    id: 'act2_pronunciation', kind: SCENE_KINDS.MINIGAME, title: '课堂注音', game: 'pronunciation',
    background: 'assets/images/minigames/act2/P2-MG-PLAYGROUND-ARGUMENT-001.png',
    ambience: AMB_P2_PLAYGROUND,
    introLines: [
      {
        speaker: '',
        text: '【我在“亲戚家”旁边标注“很远”，视线重新落到旧毽子上。】',
        portraitId: 'hero',
        background: OFFICE_MIA_BG,
        ambience: AMB_OFFICE_ROOMTONE,
      },
      { speaker: '', text: '【下课铃与孩子们吵闹的声音从记忆深处浮现。】', portraitId: 'hero' },
      { speaker: '弥', text: '同学让阿遥再说一遍刚才那句话。', portraitId: 'hero' },
      { speaker: '弥', text: '阿遥当时是怎么念的？', portraitId: 'hero' },
    ],
    outroLines: [
      { speaker: '弥', text: '阿遥的读音，更像南方口音。', portraitId: 'hero' },
      { speaker: '弥', text: '再去阿遥的房间看看，有没有相关线索。', portraitId: 'hero' },
    ],
    instructions: '点击「春、树、长、嫩」，选择阿遥当时的读音，补全四处拼音。',
    sentence: [
      { char: '春', wordId: 'chun' }, { char: '天', pinyin: 'tiān' },
      { char: '来', pinyin: 'lái' }, { char: '了', pinyin: 'le' }, { char: '，' },
      { char: '小', pinyin: 'xiǎo' }, { char: '树', wordId: 'shu' },
      { char: '长', wordId: 'zhang' }, { char: '出', pinyin: 'chū' },
      { char: '了', pinyin: 'le' }, { char: '嫩', wordId: 'nen' },
      { char: '绿', pinyin: 'lǜ' }, { char: '的', pinyin: 'de' },
      { char: '叶', pinyin: 'yè' }, { char: '子', pinyin: 'zi' },
    ],
    words: [
      { id: 'chun', word: '春', correct: 'dialect', options: [{ id: 'standard', label: 'chūn' }, { id: 'dialect', label: 'cūn' }] },
      { id: 'shu', word: '树', correct: 'dialect', options: [{ id: 'standard', label: 'shù' }, { id: 'dialect', label: 'sù' }] },
      { id: 'zhang', word: '长', correct: 'dialect', options: [{ id: 'standard', label: 'zhǎng' }, { id: 'dialect', label: 'zǎng' }] },
      { id: 'nen', word: '嫩', correct: 'dialect', options: [{ id: 'standard', label: 'nèn' }, { id: 'dialect', label: 'lèn' }] },
    ],
    nextOnSuccess: 'act2_investigation', retryText: '同学们笑了起来。再听一遍阿遥的读音。',
  },
  act2_investigation: {
    id: 'act2_investigation', kind: SCENE_KINDS.INVESTIGATION, title: '阿遥的房间', background: 'assets/images/background/MIA-C01-P1-INV-01_AyaoRoom.png', description: '', requiredClueCount: 3, exitTo: 'act2_deduction', hotspotStyle: 'invisible',
    ambience: AMB_P1_VILLAGE_DAY,
    archiveClueIds: ['clue_southern_pronunciation', 'clue_north_map', 'clue_family_poem', 'clue_corrected_pinyin_notebook', 'clue_school_enrollment_form', 'clue_my_home_drawing', 'clue_worn_atlas'],
    hotspots: [
      { id: 'marked_map', x: 15.79, y: 22.32, width: 14.48, height: 37.19, shape: 'map-trapezoid', clueId: 'clue_north_map', label: '左侧墙上的地图' },
      { id: 'poem_diary', x: 61.2, y: 48.8, width: 5.2, height: 6, clueId: 'clue_family_poem', label: '桌面上的日记' },
      { id: 'pinyin_notebook', x: 31.25, y: 66, width: 8.5, height: 18, clueId: 'clue_corrected_pinyin_notebook', label: '书桌左柜里的拼音作业本' },
      { id: 'enrollment_form', x: 31.25, y: 53.8, width: 8.5, height: 6.2, clueId: 'clue_school_enrollment_form', label: '书桌左侧抽屉里的入学登记表' },
      { id: 'home_drawing', x: 61.5, y: 60.45, width: 8, height: 6.3, clueId: 'clue_my_home_drawing', label: '书桌右侧第二个抽屉' },
      { id: 'worn_atlas', x: 14.0, y: 57.87, width: 6.82, height: 12.65, shape: 'atlas-trapezoid', clueId: 'clue_worn_atlas', label: '左侧书架第一排的地图册' },
    ],
  },
  act2_deduction: {
    "id": "act2_deduction",
    "kind": "deduction",
    "title": "第二幕推理",
    "background": OFFICE_REASONING_BG,
    "ambience": AMB_OFFICE_ROOMTONE,
    "deductionId": "act2_origin",
    "question": "有些线索好像有矛盾",
    "introLines": [
      { "speaker": "弥", "text": "阿遥的南方口音，和房间里的线索似乎对不上。", "portraitId": "hero" }
    ],
    "requiredCount": 3,
    "backTo": "act2_investigation",
    "fixedSlots": {
      "2": "clue_southern_pronunciation"
    },
    "outroLines": [
      { "speaker": "弥", "text": "阿遥小时候很可能在南方生活过。", "portraitId": "hero" },
      { "speaker": "弥", "text": "可阿遥记得的亲戚，全都在北方。", "portraitId": "hero" }
    ],
    "outroNext": "act2_to_act3",
    "expressionOperators": [
      "+",
      "≠"
    ]
  },
  act2_to_act3: {
    id: 'act2_to_act3', kind: SCENE_KINDS.NARRATIVE, title: '第二幕结论', background: OFFICE_MIA_BG, ambience: AMB_OFFICE_ROOMTONE,
    lines: [
      { speaker: '', text: '【我将地域矛盾写入调查记录。】', background: OFFICE_MIA_BG, portraitId: 'hero', voiceId: null },
      { speaker: '', text: '【我把标记过的地图推到桌面中央，指尖沿着由南向北的路线缓慢移动。】', background: OFFICE_MIA_BG, portraitId: null, voiceId: null },
      { speaker: '', text: '【记忆深处传来模糊的列车广播。】', background: OFFICE_MIA_BG, portraitId: null, voiceId: null },
    ],
    next: 'act3_animation',
  },
  act3_animation: { id: 'act3_animation', kind: SCENE_KINDS.ANIMATION, title: '第三幕：有个人在等我', ambience: AMB_P3_STATION_HALL, next: 'act3_sidekick', shots: buildAct3Sequence([
    shot('场景', '【大型车站】', 'grid-station-memory'),
    shot('场景', '【广播声 人群脚步与行李箱滚轮声交杂】', 'grid-station-memory'),
    shot('场景', '【女人牵着幼年阿遥来到候车区域 阿遥手里拿着一只毽子】', 'grid-station-memory'),
    dialogueShot('女人', '你就在这等着，踢会毽子。', 'grid-station-memory', null, { voiceId: 'GT-P3-MOTHER-001' }),
    shot('场景', '【女人转身离开 阿遥低头踢毽子】', 'grid-kick-first-person'),
    dialogueShot('幼年阿遥', '一、二、三……', 'grid-kick-first-person', null, { voiceId: 'GT-P3-AYAO_CHILD-001' }),
    shot('场景', '【毽子掉在地上 阿遥弯腰去捡 一个男人走到他面前】', 'grid-station-memory'),
    dialogueShot('父亲', '哎，娃娃，走咯，回家了。', 'grid-station-memory', null, { voiceId: 'GT-P3-FOSTER_FATHER-001' }),
    shot('场景', '【阿遥抬头 有些迟疑】', 'grid-station-memory'),
    dialogueShot('幼年阿遥', '你是谁？', 'grid-station-memory', null, { voiceId: 'GT-P3-AYAO_CHILD-002' }),
    dialogueShot('父亲', '还认不得咯？你小时候才见过几回，哪记得嘛。', 'grid-station-memory', null, { voiceId: 'GT-P3-FOSTER_FATHER-002' }),
    shot('场景', '【养父很自然地伸手牵住阿遥 阿遥回头看向女人离开的方向】', 'grid-station-memory'),
    dialogueShot('幼年阿遥', '她呢？', 'grid-station-memory', null, { voiceId: 'GT-P3-AYAO_CHILD-003' }),
    dialogueShot('父亲', '她把你送到这儿，不就是等我来接嘛。', 'grid-station-memory', null, { voiceId: 'GT-P3-FOSTER_FATHER-003' }),
    shot('场景', '【远处响起列车广播】', 'grid-station-memory', 'scale(1)', null, { sfx: SFX_P3_TRAIN_ARRIVAL, sfxVolume: 0.45 }),
    dialogueShot('父亲', '走走走，车要开了。', 'grid-station-memory', null, { voiceId: 'GT-P3-FOSTER_FATHER-004' }),
    shot('场景', '【阿遥仍有些犹豫 养父牵着他走进人群】', 'grid-station-memory'),
    shot('场景', '【阿遥回头 女人的身影已经看不见 手里的毽子随着脚步轻轻晃动】', 'grid-kick-shadow'),
    shot('场景', '【车站广播逐渐远去】', 'grid-station-memory'),
  ]) },
  act3_sidekick: {
    id: 'act3_sidekick', kind: SCENE_KINDS.MINIGAME, title: '踢毽子记忆', game: 'act3-kick', ambience: AMB_P3_STATION_HALL,
    imageBase: 'assets/images/minigames/act3',
    images: [
      'P3-MG-STATION-JIANZI-AYAO-001.png',
      'P3-MG-STATION-JIANZI-AYAO-002.png',
      'P3-MG-STATION-JIANZI-AYAO-003.png',
      'P3-MG-STATION-JIANZI-AYAO-004.png',
    ],
    dropSfx: [
      'assets/audio/effect/sfx/minigames/act1/kick/drop/SFX_JIANZI_DROP_01.wav',
      'assets/audio/effect/sfx/minigames/act1/kick/drop/SFX_JIANZI_DROP_02.wav',
      'assets/audio/effect/sfx/minigames/act1/kick/drop/SFX_JIANZI_DROP_03.wav',
    ],
    controls: { release: { x: 32, y: 51 } },
    introLines: [{ speaker: '弥', text: '等等，刚才阿遥踢毽子的动作有点奇怪。', portraitId: 'hero' }],
    outroLines: [
      { speaker: '弥', text: '阿遥为什么一直用脚背踢毽子？', portraitId: 'hero' },
      { speaker: '弥', text: '不对，我好像漏掉了一些信息。', portraitId: 'hero' },
      { speaker: '弥', text: '我得从头再复盘一次。', portraitId: 'hero' },
    ],
    successClueIds: [],
    nextOnSuccess: 'act3_evidence',
  },
  act3_evidence: { id: 'act3_evidence', kind: SCENE_KINDS.INVESTIGATION, layout: 'memory-review', title: '记忆复盘', background: OFFICE_EVIDENCE_BG, ambience: AMB_OFFICE_ROOMTONE, description: '对照过去三段记忆，确认这种踢法从何而来。', archiveClueIds: ['clue_leg_condition', 'clue_mother_field_legs', 'clue_classmates_kick_action', 'clue_relative_squat', 'clue_genetics_book', 'clue_genetic_trait_diagnosis', 'clue_birth_mother_patient', 'clue_not_foster_mother_biological', 'clue_station_woman_blood_relation', 'clue_station_woman_birth_mother'], memoryCards: [
    { id: 'village-memory', title: '山村院落', image: 'assets/images/animation/act1/P1-CG-AYAO-KICK_SHUTTLECOCK-001.png', animationScene: 'act3_review_village' },
    { id: 'school-memory', title: '乡镇小学', image: 'assets/images/clues/act2/MIA-C01-P2-INV-02_ClassmateInsideKick.png', animationScene: 'act3_review_school', unlockAfter: ['village-memory'] },
    { id: 'station-memory', title: '车站候车厅', image: 'assets/images/clues/act3/MIA-C01-P3-INV-02_StationWomanSquat.png', animationScene: 'act3_review_station', unlockAfter: ['school-memory'] },
    { id: 'reality-records', title: '现实资料', image: 'assets/images/clues/act3/MIA-C01-P3-ORG-01_GeneticTraitBook.png', animationScene: 'act3_review_reality', unlockAfter: ['village-memory', 'school-memory', 'station-memory'] },
  ], requiredClueCount: 4, exitTo: 'act3_deduction', hotspots: [
    { id: 'leg_memory', x: 35, y: 75, clueId: 'clue_leg_condition', popupType: 'body' },
    { id: 'genetics_book', x: 68, y: 48, clueId: 'clue_genetics_book', popupType: 'book' },
    { id: 'relative_action', x: 52, y: 40, clueId: 'clue_relative_squat', popupType: 'memory' },
    { id: 'mother_flashback', x: 20, y: 45, clueId: 'clue_mother_field_legs', popupType: 'flashback' },
  ] },
  act3_review_village: {
    id: 'act3_review_village', kind: SCENE_KINDS.ANIMATION, title: '复查第一幕：山村',
    ambience: AMB_P1_VILLAGE_DAY,
    presentation: 'memory-film', completeMemoryCardId: 'village-memory', completionClueIds: ['clue_leg_condition', 'clue_mother_field_legs'], next: 'act3_evidence',
    shots: [
      {
        id: 'village-review-ready', image: 'assets/images/animation/act1/P1-CG-AYAO-KICK_SHUTTLECOCK-001.png',
        duration: 500, transitionDuration: 200,
        cameraPath: [
          { x: 0, y: 0, scale: 1, offset: 0 },
          { x: 0, y: 0, scale: 1, offset: 1 },
        ],
      },
      { ...createMontageShot([
        { text: '回想起来，阿遥每次踢毽子的时候……', image: 'assets/images/animation/act1/P1-CG-AYAO-KICK_SHUTTLECOCK-001.png' },
        { text: '都是膝盖朝前，只能用脚背接毽子！', image: 'assets/images/animation/act1/P1-CG-AYAO-KICK_SHUTTLECOCK-001.png' },
      ], { id: 'village-review-ayao-legs', from: [50, 50, 1], to: [43, 68, 1.65], hold: 0, settle: 1, transition: 'cut' }), seamlessFromPrevious: true },
      createMontageShot([
        { text: '阿遥的母亲干活时……', image: 'assets/images/clues/act1/MIA-C01-P1-INV-02_FosterMotherSquat.png' },
        { text: '髋腿能够自然向两侧打开！', image: 'assets/images/clues/act1/MIA-C01-P1-INV-02_FosterMotherSquat.png' },
      ], { id: 'village-review-mother-legs', from: [50, 50, 1], to: [53, 70, 1.45], hold: 0, settle: 1, transition: 'dissolve' }),
      {
        id: 'village-review-finished', image: 'assets/images/clues/act1/MIA-C01-P1-INV-02_FosterMotherSquat.png', duration: 500, transitionDuration: 200,
        cameraPath: [
          { x: -4.35, y: -22.5, scale: 1.45, offset: 0 },
          { x: -4.35, y: -22.5, scale: 1.45, offset: 1 },
        ],
        seamlessFromPrevious: true,
      },
    ],
  },
  act3_review_school: {
    id: 'act3_review_school', kind: SCENE_KINDS.ANIMATION, title: '复查第二幕：学校',
    presentation: 'memory-film', completeMemoryCardId: 'school-memory', completionClueIds: ['clue_classmates_kick_action'], next: 'act3_evidence',
    shots: [
      {
        id: 'school-review-ready', image: 'assets/images/clues/act2/MIA-C01-P2-INV-02_ClassmateInsideKick.png',
        duration: 500, transitionDuration: 200,
        cameraPath: [
          { x: 0, y: 0, scale: 1, offset: 0 },
          { x: 0, y: 0, scale: 1, offset: 1 },
        ],
      },
      { ...createMontageShot([
        { text: '阿遥的同学们踢毽子的时候……', image: 'assets/images/clues/act2/MIA-C01-P2-INV-02_ClassmateInsideKick.png' },
        { text: '大多是膝盖外展，用脚内侧踢。', image: 'assets/images/clues/act2/MIA-C01-P2-INV-02_ClassmateInsideKick.png' },
      ], { id: 'school-review-classmate-legs', from: [50, 50, 1], to: [52, 67, 1.65], hold: 0, settle: 1, transition: 'cut' }), seamlessFromPrevious: true },
      {
        id: 'school-review-finished', image: 'assets/images/clues/act2/MIA-C01-P2-INV-02_ClassmateInsideKick.png',
        duration: 500, transitionDuration: 200,
        cameraPath: [
          { x: -3.3, y: -28.05, scale: 1.65, offset: 0 },
          { x: -3.3, y: -28.05, scale: 1.65, offset: 1 },
        ],
        seamlessFromPrevious: true,
      },
    ],
  },
  act3_review_station: {
    id: 'act3_review_station', kind: SCENE_KINDS.ANIMATION, title: '复查第三幕：车站', ambience: AMB_P3_STATION_HALL,
    presentation: 'memory-film', completeMemoryCardId: 'station-memory', completionClueIds: ['clue_relative_squat'], next: 'act3_evidence',
    shots: [
      {
        id: 'station-review-ready', image: 'assets/images/clues/act3/MIA-C01-P3-INV-02_StationWomanSquat.png',
        duration: 500, transitionDuration: 200,
        cameraPath: [
          { x: 0, y: 0, scale: 1, offset: 0 },
          { x: 0, y: 0, scale: 1, offset: 1 },
        ],
      },
      { ...createMontageShot([
        { text: '车站里送阿遥来的那个亲戚……', image: 'assets/images/clues/act3/MIA-C01-P3-INV-02_StationWomanSquat.png' },
        { text: '她蹲下来的时候……', image: 'assets/images/clues/act3/MIA-C01-P3-INV-02_StationWomanSquat.png' },
        { text: '膝盖和脚尖一直是向前的！', image: 'assets/images/clues/act3/MIA-C01-P3-INV-02_StationWomanSquat.png' },
      ], { id: 'station-review-woman-legs', from: [50, 50, 1], to: [40, 75, 1.65], hold: 0, settle: 1, transition: 'cut' }), seamlessFromPrevious: true },
      {
        id: 'station-review-finished', image: 'assets/images/clues/act3/MIA-C01-P3-INV-02_StationWomanSquat.png',
        duration: 500, transitionDuration: 200,
        cameraPath: [
          { x: 16.5, y: -32.5, scale: 1.65, offset: 0 },
          { x: 16.5, y: -32.5, scale: 1.65, offset: 1 },
        ],
        seamlessFromPrevious: true,
      },
    ],
  },
  act3_review_reality: {
    id: 'act3_review_reality', kind: SCENE_KINDS.ANIMATION, title: '现实资料',
    presentation: 'memory-film', completeMemoryCardId: 'reality-records', completionClueIds: ['clue_genetics_book', 'clue_genetic_trait_diagnosis'], next: 'act3_deduction',
    shots: [
      {
        id: 'reality-review-ready', image: 'assets/images/clues/act3/MIA-C01-P3-ORG-01_GeneticTraitBook.png',
        duration: 500, transitionDuration: 200,
        cameraPath: [
          { x: 0, y: 0, scale: 1, offset: 0 },
          { x: 0, y: 0, scale: 1, offset: 1 },
        ],
      },
      { ...createMontageShot([
        { text: '我记得有一种病叫遗传性髋外旋受限症候群。', image: 'assets/images/clues/act3/MIA-C01-P3-ORG-01_GeneticTraitBook.png' },
        { text: '是一种X染色体显性遗传性状。', image: 'assets/images/clues/act3/MIA-C01-P3-ORG-01_GeneticTraitBook.png' },
        { text: '男患者的母亲一定有相同症状！', image: 'assets/images/clues/act3/MIA-C01-P3-ORG-01_GeneticTraitBook.png' },
      ], { id: 'reality-review-trait-book', from: [50, 50, 1], to: [69, 34, 1.18], hold: 0, settle: 1, transition: 'cut' }), seamlessFromPrevious: true },
      createMontageShot([
        { text: '我查查阿遥的病历……', image: 'assets/images/clues/act3/MIA-C01-P3-ORG-02_GeneticTraitDiagnosis.png' },
        { text: '果然！他就是患者！', image: 'assets/images/clues/act3/MIA-C01-P3-ORG-02_GeneticTraitDiagnosis.png' },
        { text: '这么说来……', image: 'assets/images/clues/act3/MIA-C01-P3-ORG-02_GeneticTraitDiagnosis.png' },
      ], { id: 'reality-review-ayao-diagnosis', from: [50, 50, 1], to: [29, 41, 1.38], hold: 0, settle: 1, transition: 'dissolve' }),
      {
        id: 'reality-review-finished', image: 'assets/images/clues/act3/MIA-C01-P3-ORG-02_GeneticTraitDiagnosis.png',
        duration: 500, transitionDuration: 200,
        cameraPath: [
          { x: 19, y: 12.42, scale: 1.38, offset: 0 },
          { x: 19, y: 12.42, scale: 1.38, offset: 1 },
        ],
        seamlessFromPrevious: true,
      },
    ],
  },
  act3_deduction: {
    "id": "act3_deduction",
    "kind": "deduction",
    "title": "最后一次推理",
    "background": OFFICE_REASONING_BG,
    "ambience": AMB_OFFICE_ROOMTONE,
    "deductionId": "act3_mother",
    "question": "有些线索好像有联系",
    "introLines": [
      { "speaker": "弥", "text": "有些线索，得放在一起看。", "portraitId": "hero" }
    ],
    "requiredCount": 2,
    "initialClueIds": [
      "clue_leg_condition",
      "clue_mother_field_legs",
      "clue_classmates_kick_action",
      "clue_relative_squat",
      "clue_genetics_book",
      "clue_genetic_trait_diagnosis"
    ],
    "resultSlot": true,
    "hideBack": true,
    "backTo": "act3_evidence",
    "expressionOperators": [
      "+"
    ]
  },
  act3_conclusion: {
    id: 'act3_conclusion', kind: SCENE_KINDS.NARRATIVE, title: '调查结论', background: OFFICE_MIA_BG, ambience: AMB_OFFICE_ROOMTONE,
    lines: [
      { speaker: '弥', text: '车站里那个“亲戚”，很可能就是阿遥的亲生母亲。', background: OFFICE_MIA_BG, portraitId: 'hero', voiceId: null },
      { speaker: '', text: '【我将调查结论写入记录。】', background: OFFICE_MIA_BG, portraitId: null, voiceId: null },
      { speaker: '', text: '【我合上文件。】', background: OFFICE_MIA_BG, portraitId: null, voiceId: null },
    ],
    next: 'he_animation',
  },
  be_transition: {
    id: 'be_transition', kind: SCENE_KINDS.NARRATIVE, title: '推理中止', background: OFFICE_CLIENT_BG, ambience: AMB_OFFICE_ROOMTONE,
    lines: [
      { speaker: '成年阿遥', text: '算了，好像也没什么有用的信息。', background: OFFICE_CLIENT_BG, portraitId: 'npc', voiceId: null },
      { speaker: '成年阿遥', text: '就到这里吧。', background: OFFICE_CLIENT_BG, portraitId: 'npc', voiceId: null },
      { speaker: '', text: '【推理中止。】', background: OFFICE_CLIENT_BG, portraitId: null, voiceId: null },
    ],
    next: 'be_animation',
  },
  he_animation: { id: 'he_animation', kind: SCENE_KINDS.ANIMATION, title: 'HE 万家灯火', ambience: AMB_HE_PLATFORM_NIGHT, next: 'ending_he', shots: ENDING_SHOTS.he_full },
  he_dialogue: { id: 'he_dialogue', kind: SCENE_KINDS.ANIMATION, title: 'HE 万家灯火', ambience: AMB_HE_PLATFORM_NIGHT, next: 'he_animation_outro', shots: ENDING_SHOTS.he_dialogue },
  he_animation_outro: { id: 'he_animation_outro', kind: SCENE_KINDS.ANIMATION, title: 'HE 万家灯火', ambience: AMB_HE_PLATFORM_NIGHT, next: 'ending_he', shots: ENDING_SHOTS.he_outro },
  be_animation: { id: 'be_animation', kind: SCENE_KINDS.ANIMATION, title: 'BE 大山深处', ambience: AMB_BE_VALLEY_WIND, next: 'ending_be', shots: [...ENDING_SHOTS.be_intro, ...ENDING_SHOTS.be_dialogue, ...ENDING_SHOTS.be_outro] },
  be_dialogue: { id: 'be_dialogue', kind: SCENE_KINDS.ANIMATION, title: 'BE 大山深处', ambience: AMB_BE_VALLEY_WIND, next: 'be_animation_outro', shots: ENDING_SHOTS.be_dialogue },
  be_animation_outro: { id: 'be_animation_outro', kind: SCENE_KINDS.ANIMATION, title: 'BE 大山深处', ambience: AMB_BE_VALLEY_WIND, next: 'ending_be', shots: ENDING_SHOTS.be_outro },
  ending_he: { id: 'ending_he', kind: SCENE_KINDS.ENDING, title: '万家灯火', background: HE_ENDING_FRAME.image, endingFrame: HE_ENDING_FRAME, ambience: AMB_HE_PLATFORM_NIGHT, conditions: [{ type: 'DEDUCTION_PASSED', deductionId: 'act3_mother' }], endTo: 'title' },
  ending_be: { id: 'ending_be', kind: SCENE_KINDS.ENDING, title: '大山深处', background: BE_ENDING_FRAME.image, endingFrame: BE_ENDING_FRAME, ambience: AMB_BE_VALLEY_WIND, endTo: 'title' },
});

export function getEndingScenes() { return Object.values(SCENES).filter((scene) => scene.kind === SCENE_KINDS.ENDING); }

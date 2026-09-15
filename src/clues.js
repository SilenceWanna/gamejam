// Evidence catalog. Clue ids are stable save-data identifiers.
import { FAMILY_DIARY } from './diary.js';

export const CLUES = Object.freeze({
  clue_kick_six: { id: 'clue_kick_six', title: '连续踢毽子的记忆', revealLabel: '踢毽子的记忆', description: '阿遥当时执意要连续踢六下毽子。', source: 'minigame:act1-kick', presentation: 'image', image: 'assets/images/minigames/act1/P1-MG-JIANZI-AYAO-006.png' },
  clue_custom_article: { id: 'clue_custom_article', title: '报纸：新岁踢毽习俗', revealLabel: '一张旧报纸', description: '报纸写着：当地孩子几岁，就要连续踢几下毽子，寓意新的一岁平安顺利。', source: 'computer', presentation: 'image', image: 'assets/images/clues/act1/MIA-C01-P1-ORG-01_BirthdayKickArticle.png' },
  clue_photo_age5: { id: 'clue_photo_age5', title: '照片：阿遥五岁', revealLabel: '阿遥的照片', description: '旧相册中的照片标注着“阿遥五岁”。', source: 'photo-album', presentation: 'image', image: 'assets/images/clues/act1/MIA-C01-P1-ORG-02_AgeFiveAlbum.png' },
  clue_height_marks: {
    id: 'clue_height_marks', title: '墙角身高刻痕', revealLabel: '墙角的身高刻痕',
    description: '墙上的身高刻度只按“第一年”到“第五年”记录，没有具体年份。',
    implication: '这个家庭只能记录阿遥回来以后的成长。', source: 'act1-room:height-marks', presentation: 'image', image: 'assets/images/clues/act1/MIA-C01-P1-INV-04_WallHeightMarks.png',
  },
  clue_marked_calendar: {
    id: 'clue_marked_calendar', title: '圈过日期的旧挂历', revealLabel: '一本旧挂历',
    description: '1998年的旧挂历上，某一天写着“接娃回来”，却没有生日标记。',
    implication: '家人记得接回日期，却不知道阿遥真正的生日。', source: 'act1-room:calendar', presentation: 'image', image: 'assets/images/clues/act1/MIA-C01-P1-INV-05_OldCalendar.png',
  },
  clue_amended_health_booklet: {
    id: 'clue_amended_health_booklet', title: '补录的健康手册', revealLabel: '一本儿童保健手册',
    description: '出生日期写成1993年，其中“3”留有从“2”修改而来的痕迹；1998年后的记录使用了不同墨水。',
    implication: '真实出生年份可能是1992年，年龄资料后来被改动过。', source: 'act1-room:health-booklet', presentation: 'image', image: 'assets/images/clues/act1/MIA-C01-P1-ORG-03_ChildHealthRecord.png',
  },
  clue_restiched_schoolbag: {
    id: 'clue_restiched_schoolbag', title: '改缝姓名的旧书包', revealLabel: '阿遥的旧书包',
    description: '写着“阿遥”的姓名布条下存在拆线痕迹，但旧名字看不清。',
    implication: '阿遥的名字可能也被替换过。', source: 'act1-room:schoolbag', presentation: 'image', image: 'assets/images/clues/act1/MIA-C01-P1-INV-06_RestitchedSchoolbag.png',
  },
  clue_six_notched_shuttlecock: {
    id: 'clue_six_notched_shuttlecock', title: '六道划痕的毽子', revealLabel: '阿遥的毽子',
    description: '毽子底座上刻着六道浅浅的划痕。',
    implication: '“六”对阿遥具有特殊意义。', source: 'act1-room:shuttlecock', presentation: 'image', image: 'assets/images/clues/act1/MIA-C01-P1-INV-07_SixNotchedShuttlecock.png',
  },
  clue_mended_coat: {
    id: 'clue_mended_coat', title: '剪去标签的儿童外套', revealLabel: '阿遥的衣服',
    description: '旧外套的姓名标签被剪去，只留下不完整的布边和针脚。',
    implication: '这件衣服原本可能属于另一个身份。', source: 'act1-room:coat', presentation: 'image', image: 'assets/images/clues/act1/MIA-C01-P1-INV-03_CutLabelCoat.png',
  },
  clue_old_computer: { id: 'clue_old_computer', title: '旧电脑', description: '电脑里只有一些过时的学习文件，没有直接相关的线索。', source: 'room' },
  clue_old_diary: { id: 'clue_old_diary', title: '空白日记页', description: '几页日记被撕掉了，只留下模糊的日期。', source: 'room' },
  clue_north_map: { id: 'clue_north_map', title: '标记过的中国地图', revealLabel: '一张地图', description: '辽宁画着小船和台灯，河南画着云朵和小花；河北两处分别画着树与月亮、山与太阳。', source: 'wall-map', presentation: 'image', image: 'assets/images/clues/act2/MIA-C01-P2-ORG-01_MarkedChinaMap.png' },
  clue_family_poem: { id: 'clue_family_poem', title: '日记里的亲戚诗歌', revealLabel: '阿遥的日记', description: '稚嫩的笔迹记录了爷爷八十大寿当天写下的完整日记和《我的家人像什么》。', source: 'diary', presentation: 'image', image: 'assets/images/clues/act2/MIA-C01-P2-ORG-02_RelativePoemDiary.png', body: FAMILY_DIARY },
  clue_southern_pronunciation: { id: 'clue_southern_pronunciation', title: '南方口音', revealLabel: '课堂朗读的记忆', description: '课堂回忆里，阿遥把“春、树、长、嫩”读成 cūn、sù、zǎng、lèn。', source: 'minigame:pronunciation', presentation: 'image', image: 'assets/images/animation/act2/P2-CG-CLASS_READING-001.png' },
  clue_corrected_pinyin_notebook: {
    id: 'clue_corrected_pinyin_notebook', title: '拼音作业本', revealLabel: '阿遥的拼音作业本',
    description: 'c/ch、s/sh、z/zh、n/l 被老师反复订正。',
    implication: '阿遥的口音不是偶然说错，而是一种稳定的语言习惯。', source: 'act2-room:pinyin-notebook', presentation: 'image', image: 'assets/images/clues/act2/MIA-C01-P2-INV-04_PronunciationWorkbook.png',
  },
  clue_school_enrollment_form: {
    id: 'clue_school_enrollment_form', title: '入学登记表', revealLabel: '一张入学登记表',
    description: '“出生地”“原幼儿园”留空，籍贯由监护人后补为“河北承德”。',
    implication: '学校掌握的身世信息完全来自父母。', source: 'act2-room:enrollment-form', presentation: 'image', image: 'assets/images/clues/act2/MIA-C01-P2-ORG-03_SchoolRegistration.png',
  },
  clue_my_home_drawing: {
    id: 'clue_my_home_drawing', title: '《我的家》图画', revealLabel: '阿遥画的《我的家》',
    description: '阿遥画的是水塘、石桥、小船和荷叶，与山村环境不同。',
    implication: '这表现出他的早期空间记忆，但不足以单独证明地域。', source: 'act2-room:home-drawing', presentation: 'image', image: 'assets/images/clues/act2/MIA-C01-P2-INV-05_MyHomeDrawing.png',
  },
  clue_worn_atlas: {
    id: 'clue_worn_atlas', title: '翻旧的地图册', revealLabel: '一本地图册',
    description: '南方水网地区的页面有多次翻阅痕迹。',
    implication: '阿遥曾本能地寻找让自己感到熟悉的环境。', source: 'act2-room:atlas', presentation: 'image', image: 'assets/images/clues/act2/MIA-C01-P2-ORG-04_WornAtlas.png',
  },
  clue_leg_condition: { id: 'clue_leg_condition', title: '阿遥的踢毽动作', revealLabel: '阿遥的踢毽动作', description: '阿遥踢毽子时膝盖朝前，只能用脚背接毽子。', source: 'act3-review:village', presentation: 'image', image: 'assets/images/animation/act1/P1-CG-AYAO-KICK_SHUTTLECOCK-001.png' },
  clue_mother_field_legs: { id: 'clue_mother_field_legs', title: '阿遥母亲的劳作姿势', revealLabel: '阿遥母亲的劳作姿势', description: '阿遥的母亲蹲下劳作时，髋腿能够自然向两侧打开。', source: 'act3-review:village', presentation: 'image', image: 'assets/images/clues/act1/MIA-C01-P1-INV-02_FosterMotherSquat.png' },
  clue_classmates_kick_action: { id: 'clue_classmates_kick_action', title: '同学们的踢毽动作', revealLabel: '同学们的踢毽动作', description: '同学们踢毽子时大多膝盖外展，用脚内侧接毽子。', source: 'act3-review:school', presentation: 'image', image: 'assets/images/clues/act2/MIA-C01-P2-INV-02_ClassmateInsideKick.png' },
  clue_relative_squat: { id: 'clue_relative_squat', title: '车站女人的下蹲动作', revealLabel: '车站女人的下蹲动作', description: '车站女人蹲下时，膝盖和脚尖一直朝前。', source: 'act3-review:station', presentation: 'image', image: 'assets/images/clues/act3/MIA-C01-P3-INV-02_StationWomanSquat.png' },
  clue_genetics_book: { id: 'clue_genetics_book', title: '遗传性髋外旋受限症候群', revealLabel: '遗传性髋外旋受限症候群', description: '一种X染色体显性遗传性状；男性患者的生母应有相同症状。', source: 'act3-reality-records', presentation: 'image', image: 'assets/images/clues/act3/MIA-C01-P3-ORG-01_GeneticTraitBook.png' },
  clue_genetic_trait_diagnosis: { id: 'clue_genetic_trait_diagnosis', title: '阿遥的诊断记录', revealLabel: '阿遥的诊断记录', description: '诊断记录确认阿遥患有遗传性髋外旋受限症候群。', source: 'act3-reality-records', presentation: 'image', image: 'assets/images/clues/act3/MIA-C01-P3-ORG-02_GeneticTraitDiagnosis.png' },
  clue_birth_mother_patient: { id: 'clue_birth_mother_patient', title: '阿遥的亲生母亲一定也是患者', description: '该遗传性状完全外显，男患者的X染色体来自生母。', source: 'deduction:act3-medical' },
  clue_not_foster_mother_biological: { id: 'clue_not_foster_mother_biological', title: '阿遥很可能不是“母亲”亲生的', description: '阿遥母亲的髋腿可以自然外展，与患者应有的动作限制不符。', source: 'deduction:act3-foster-mother' },
  clue_station_woman_blood_relation: { id: 'clue_station_woman_blood_relation', title: '那个所谓的“亲戚”似乎与阿遥有血缘关系', description: '车站女人表现出与阿遥相同的髋外旋限制。', source: 'deduction:act3-station-woman' },
  clue_station_woman_birth_mother: { id: 'clue_station_woman_birth_mother', title: '那个亲戚很可能才是阿遥的亲生母亲', description: '两条独立推理共同指向车站女人才是阿遥的亲生母亲。', source: 'deduction:act3-final' },
  clue_child_water_bottle: { id: 'clue_child_water_bottle', title: '女人携带的儿童水壶', revealLabel: '一个儿童水壶', description: '水壶有长期使用的磨损，阿遥伸手去拿时动作非常熟悉。', implication: '女人曾长期照顾过阿遥。', source: 'act3-memory:water-bottle', presentation: 'image', image: 'assets/images/clues/act3/MIA-C01-P3-INV-06_ChildWaterBottle.png' },
  clue_matching_cloth_knot: { id: 'clue_matching_cloth_knot', title: '毽子上的布结', revealLabel: '一只修补过的毽子', description: '毽子底部的修补布料与女人包上的布料相同。', implication: '毽子可能由女人制作或修补。', source: 'act3-memory:cloth-knot', presentation: 'image', image: 'assets/images/clues/act3/MIA-C01-P3-INV-05_RepairedShuttlecock.png' },
  clue_shared_wet_footprints: { id: 'clue_shared_wet_footprints', title: '两人的鞋底水迹', revealLabel: '地面上的鞋印', description: '女人和阿遥留下相近湿痕，男人鞋底只有干燥尘土。', implication: '女人和阿遥从同一方向来到车站。', source: 'act3-memory:footprints', presentation: 'image', image: 'assets/images/clues/act3/MIA-C01-P3-INV-08_SharedWetFootprints.png' },
  clue_station_direction_sign: { id: 'clue_station_direction_sign', title: '模糊的方向牌', revealLabel: '一块车站方向牌', description: '老式方向牌显示列车由南向北行驶。', implication: '路线与前两幕的地域推理吻合。', source: 'act3-memory:route-sign', presentation: 'image', image: 'assets/images/clues/act3/MIA-C01-P3-INV-04_OldStationRoute.png' },
});

export function getClue(clueId) {
  return CLUES[clueId] ?? null;
}

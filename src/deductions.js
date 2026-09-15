// A deduction is valid only when the submitted clue set exactly matches its chain.
export const DEDUCTIONS = Object.freeze({
  act1_age: {
    id: 'act1_age', requiredClueIds: ['clue_kick_six', 'clue_custom_article', 'clue_photo_age5'],
    fixedSlots: { 0: 'clue_kick_six' },
    successTo: 'act1_to_act2', failureTo: 'act1_investigation',
    explanation: '习俗文章说明六下毽子对应的年岁，而相册却写着阿遥五岁。',
  },
  act2_origin: {
    id: 'act2_origin', requiredClueIds: ['clue_north_map', 'clue_family_poem', 'clue_southern_pronunciation'],
    fixedSlots: { 2: 'clue_southern_pronunciation' },
    successTo: 'act2_to_act3', failureTo: 'act2_investigation',
    explanation: '地图和诗歌指向北方亲戚，回忆里的口音却是南方口音。',
  },
  act3_mother: {
    id: 'act3_mother', requiredClueIds: [], failureTo: 'be_transition',
    // 这条公共前提需要支持两个分支；两条分支结论都生成后才从案情板退场。
    retireClues: [
      {
        clueId: 'clue_birth_mother_patient',
        afterProducing: ['clue_not_foster_mother_biological', 'clue_station_woman_blood_relation'],
      },
    ],
    rules: [
      { clueIds: ['clue_genetic_trait_diagnosis', 'clue_genetics_book'], produces: 'clue_birth_mother_patient', consumes: ['clue_genetic_trait_diagnosis', 'clue_genetics_book'] },
      { clueIds: ['clue_mother_field_legs', 'clue_birth_mother_patient'], produces: 'clue_not_foster_mother_biological', consumes: ['clue_mother_field_legs'] },
      { clueIds: ['clue_relative_squat', 'clue_birth_mother_patient'], produces: 'clue_station_woman_blood_relation', consumes: ['clue_relative_squat'] },
      { clueIds: ['clue_station_woman_blood_relation', 'clue_not_foster_mother_biological'], produces: 'clue_station_woman_birth_mother', complete: true, successTo: 'act3_conclusion', consumes: [] },
    ],
    explanation: '阿遥的腿部性状需要从生母遗传；亲戚的动作与母亲的动作相反，因此那个所谓的亲戚很可能才是阿遥的亲生母亲。',
  },
});

export function judgeDeduction(deductionId, clueIds) {
  const deduction = DEDUCTIONS[deductionId];
  if (!deduction) return { ok: false, correct: false, reason: 'UNKNOWN_DEDUCTION', next: null };
  const selected = Array.isArray(clueIds) ? clueIds : [];
  if (deduction.rules) {
    if (selected.length !== 2 || selected.some((id) => !id)) {
      return { ok: false, correct: false, reason: 'INCOMPLETE_EXPRESSION', next: null };
    }
    const submitted = new Set(selected);
    const rule = deduction.rules.find((candidate) => (
      candidate.clueIds.length === submitted.size
      && candidate.clueIds.every((id) => submitted.has(id))
    ));
    return rule
      ? { ok: true, correct: true, reason: null, next: rule.successTo ?? null, producedClueId: rule.produces ?? null, consumedClueIds: rule.consumes ?? [], complete: Boolean(rule.complete), explanation: deduction.explanation }
      : { ok: true, correct: false, reason: 'INCORRECT_CLUES', next: deduction.failureTo, explanation: deduction.explanation };
  }
  const expected = deduction.requiredClueIds;
  // 未填完只提醒，不消耗耐心。填满但放错的表达式才算一次举证。
  if (selected.length !== expected.length || selected.some((id) => !id)) {
    return { ok: false, correct: false, reason: 'INCOMPLETE_EXPRESSION', next: null };
  }
  // 最后一格是相矛盾的线索；加号连接的前提允许交换顺序。
  const respectsFixedSlots = Object.entries(deduction.fixedSlots ?? {})
    .every(([index, clueId]) => selected[Number(index)] === clueId);
  const correct = respectsFixedSlots
    && new Set(selected).size === selected.length
    && selected.at(-1) === expected.at(-1)
    && selected.slice(0, -1).every((id) => expected.slice(0, -1).includes(id));
  return { ok: true, correct, reason: correct ? null : 'INCORRECT_CLUES', next: correct ? deduction.successTo : deduction.failureTo, explanation: deduction.explanation };
}

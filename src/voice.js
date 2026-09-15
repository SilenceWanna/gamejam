// 时长来自导入的 WAV 文件元数据（毫秒）。动画字幕据此停留，避免按字数估时。
export const VOICES = Object.freeze({
  'GT-PRO-MIA-001': { duration: 638, baseVolume: 1 },
  'GT-PRO-MIA-002': { duration: 437, baseVolume: 1 },
  'GT-PRO-MIA-003': { duration: 568, baseVolume: 1 },
  'GT-PRO-MIA-004': { duration: 1900, baseVolume: 1 },
  'GT-PRO-AYAO_ADULT-001': { duration: 547, baseVolume: 1, source: 'assets/audio/dialogue/prologue/dialogue/ayao-adult/GT-PRO-AYAO_ADULT-001.wav' },
  'GT-PRO-AYAO_ADULT-002': { duration: 532, baseVolume: 1, source: 'assets/audio/dialogue/prologue/dialogue/ayao-adult/GT-PRO-AYAO_ADULT-002.wav' },
  'GT-PRO-AYAO_ADULT-003': { duration: 755, baseVolume: 1, source: 'assets/audio/dialogue/prologue/dialogue/ayao-adult/GT-PRO-AYAO_ADULT-003.wav' },
  'GT-PRO-AYAO_ADULT-004': { duration: 3346, baseVolume: 1, source: 'assets/audio/dialogue/prologue/dialogue/ayao-adult/GT-PRO-AYAO_ADULT-004.wav' },
  'GT-P1-MIA-001': { duration: 3863, baseVolume: 1 },
  'GT-P1-MIA-002': { duration: 3990, baseVolume: 1 },
  'GT-P1-MIA-003': { duration: 908, baseVolume: 1 },
  'GT-P1-AYAO_ADULT-001': { duration: 272, baseVolume: 1, source: 'assets/audio/dialogue/act1/dialogue/ayao-adult/GT-P1-AYAO_ADULT-001.wav' },
  'GT-P1-AYAO_ADULT-002': { duration: 1044, baseVolume: 1, source: 'assets/audio/dialogue/act1/dialogue/ayao-adult/GT-P1-AYAO_ADULT-002.wav' },
  'GT-P1-AYAO_ADULT-003': { duration: 618, baseVolume: 1, source: 'assets/audio/dialogue/act1/dialogue/ayao-adult/GT-P1-AYAO_ADULT-003.wav' },
  'GT-P2-MIA-001': { duration: 5292, baseVolume: 1 },
  'GT-P2-MIA-002': { duration: 1860, baseVolume: 1 },
  'GT-P2-AYAO_ADULT-001': { duration: 1129, baseVolume: 1, source: 'assets/audio/dialogue/act2/dialogue/ayao-adult/GT-P2-AYAO_ADULT-001.wav' },
  'GT-P2-AYAO_ADULT-002': { duration: 2446, baseVolume: 1, source: 'assets/audio/dialogue/act2/dialogue/ayao-adult/GT-P2-AYAO_ADULT-002.wav' },
  'GT-HE-MIA-001': { duration: 783, baseVolume: 1 },
  'GT-HE-MIA-002': { duration: 601, baseVolume: 1 },
  'GT-HE-AYAO_ADULT-001': { duration: 2659, baseVolume: 1, source: 'assets/audio/dialogue/ending/he/ayao-adult/GT-HE-AYAO_ADULT-001.wav' },
  'GT-HE-AYAO_ADULT-002': { duration: 1990, baseVolume: 1, source: 'assets/audio/dialogue/ending/he/ayao-adult/GT-HE-AYAO_ADULT-002.wav' },
  'GT-HE-AYAO_ADULT-003': { duration: 1831, baseVolume: 1, source: 'assets/audio/dialogue/ending/he/ayao-adult/GT-HE-AYAO_ADULT-003.wav' },
  'GT-BE-MIA-001': { duration: 2671, baseVolume: 1 },
  // Short call needs output-device startup headroom; original WAV is preserved.
  'GT-BE-MIA-002': { duration: 568, baseVolume: 1, source: 'assets/audio/dialogue/ending/be/mia/GT-BE-MIA-002-playback.wav' },
  'GT-BE-AYAO_ADULT-001': { duration: 2978, baseVolume: 1, source: 'assets/audio/dialogue/ending/be/ayao-adult/GT-BE-AYAO_ADULT-001.wav' },
  'GT-BE-AYAO_ADULT-002': { duration: 4840, baseVolume: 1, source: 'assets/audio/dialogue/ending/be/ayao-adult/GT-BE-AYAO_ADULT-002.wav' },
  'GT-BE-AYAO_ADULT-003': { duration: 1463, baseVolume: 1, source: 'assets/audio/dialogue/ending/be/ayao-adult/GT-BE-AYAO_ADULT-003.wav' },
  'GT-BE-AYAO_ADULT-004': { duration: 2733, baseVolume: 1, source: 'assets/audio/dialogue/ending/be/ayao-adult/GT-BE-AYAO_ADULT-004.wav' },
  'GT-P1-AYAO_CHILD-001': { duration: 4581, baseVolume: 1 },
  'GT-P1-AYAO_CHILD-002': { duration: 574, baseVolume: 1 },
  'GT-P1-AYAO_CHILD-003': { duration: 2440, baseVolume: 1 },
  'GT-P1-FOSTER_MOTHER-001': { duration: 1998, baseVolume: 1 },
  'GT-P1-FOSTER_MOTHER-002': { duration: 1539, baseVolume: 1 },
  'GT-P1-FOSTER_MOTHER-003': { duration: 2117, baseVolume: 1 },
  'GT-P1-FOSTER_MOTHER-004': { duration: 1029, baseVolume: 1 },
  'GT-P1-FOSTER_MOTHER-005': { duration: 2829, baseVolume: 1 },
  'GT-P1-FOSTER_MOTHER-006': { duration: 1935, baseVolume: 1 },
  'GT-P1-FOSTER_MOTHER-007': { duration: 1280, baseVolume: 1 },
  'GT-P1-FOSTER_MOTHER-008': { duration: 2027, baseVolume: 1 },
  'GT-P1-FOSTER_FATHER-001': { duration: 1201, baseVolume: 1, source: 'assets/audio/dialogue/act1/animation/foster-father/GT-P1-FOSTER_FATHER-001.wav' },
  'GT-P1-FOSTER_FATHER-002': { duration: 1277, baseVolume: 1, source: 'assets/audio/dialogue/act1/animation/foster-father/GT-P1-FOSTER_FATHER-002.wav' },
  'GT-P1-FOSTER_FATHER-003': { duration: 2588, baseVolume: 1, source: 'assets/audio/dialogue/act1/animation/foster-father/GT-P1-FOSTER_FATHER-003.wav' },
  'GT-P2-AYAO_CHILD-001': { duration: 773, baseVolume: 1 },
  'GT-P2-AYAO_CHILD-002': { duration: 3607, baseVolume: 1 },
  'GT-P2-AYAO_CHILD-003': { duration: 3027, baseVolume: 1 },
  'GT-P2-AYAO_CHILD-004': { duration: 298, baseVolume: 1 },
  'GT-P2-AYAO_CHILD-005': { duration: 5261, baseVolume: 1 },
  'GT-P2-AYAO_CHILD-006': { duration: 1788, baseVolume: 1 },
  'GT-P2-AYAO_CHILD-007': { duration: 6950, baseVolume: 1 },
  'GT-P2-AYAO_CHILD-008': { duration: 1224, baseVolume: 1 },
  'GT-P2-TEACHER-001': { duration: 2361, baseVolume: 1 },
  'GT-P2-TEACHER-002': { duration: 1630, baseVolume: 1 },
  'GT-P2-TEACHER-003': { duration: 2111, baseVolume: 1 },
  'GT-P2-TEACHER-004': { duration: 388, baseVolume: 1 },
  'GT-P2-TEACHER-005': { duration: 1544, baseVolume: 1 },
  'GT-P2-TEACHER-006': { duration: 1892, baseVolume: 1 },
  'GT-P2-CLASSMATE-001': { duration: 2248, baseVolume: 1 },
  'GT-P2-CLASSMATE-002': { duration: 920, baseVolume: 1 },
  'GT-P2-CLASSMATE-003': { duration: 1759, baseVolume: 1 },
  'GT-P2-CLASSMATE-004': { duration: 1411, baseVolume: 1 },
  'GT-P2-CLASSMATE-005': { duration: 3972, baseVolume: 1 },
  'GT-P2-CLASSMATE-006': { duration: 2601, baseVolume: 1 },
  'GT-P3-AYAO_CHILD-001': { duration: 2855, baseVolume: 1 },
  'GT-P3-AYAO_CHILD-002': { duration: 908, baseVolume: 1 },
  'GT-P3-AYAO_CHILD-003': { duration: 662, baseVolume: 1 },
  'GT-P3-MOTHER-001': { duration: 2464, baseVolume: 1, source: 'assets/audio/dialogue/act3/animation/mother/GT-P3-MOTHER-001.wav' },
  'GT-P3-FOSTER_FATHER-001': { duration: 2090, baseVolume: 1, source: 'assets/audio/dialogue/act3/animation/foster-father/GT-P3-FOSTER_FATHER-001.wav' },
  'GT-P3-FOSTER_FATHER-002': { duration: 4164, baseVolume: 1, source: 'assets/audio/dialogue/act3/animation/foster-father/GT-P3-FOSTER_FATHER-002.wav' },
  'GT-P3-FOSTER_FATHER-003': { duration: 2630, baseVolume: 1, source: 'assets/audio/dialogue/act3/animation/foster-father/GT-P3-FOSTER_FATHER-003.wav' },
  'GT-P3-FOSTER_FATHER-004': { duration: 1717, baseVolume: 1, source: 'assets/audio/dialogue/act3/animation/foster-father/GT-P3-FOSTER_FATHER-004.wav' },
});

let activeVoice = null;

export const DIALOGUE_VOICE_DELAY = 500;

export function getVoiceDuration(voiceId) {
  return VOICES[voiceId]?.duration ?? null;
}

function voiceSource(voiceId) {
  if (voiceId.includes('-P1-AYAO_CHILD-')) return `assets/audio/dialogue/act1/animation/ayao-child/${voiceId}.wav`;
  if (voiceId.includes('-P1-FOSTER_MOTHER-')) return `assets/audio/dialogue/act1/animation/foster-mother/${voiceId}.wav`;
  if (voiceId.includes('-P2-AYAO_CHILD-')) return `assets/audio/dialogue/act2/animation/ayao-child/${voiceId}.wav`;
  if (voiceId.includes('-P2-TEACHER-')) return `assets/audio/dialogue/act2/animation/teacher/${voiceId}.wav`;
  if (voiceId.includes('-P2-CLASSMATE-')) return `assets/audio/dialogue/act2/animation/classmate/${voiceId}.wav`;
  if (voiceId.includes('-P3-AYAO_CHILD-')) return `assets/audio/dialogue/act3/animation/ayao-child/${voiceId}.wav`;
  if (voiceId.includes('-PRO-')) return `assets/audio/dialogue/prologue/dialogue/mia/${voiceId}.wav`;
  if (voiceId.includes('-P1-')) return `assets/audio/dialogue/act1/dialogue/mia/${voiceId}.wav`;
  if (voiceId.includes('-P2-')) return `assets/audio/dialogue/act2/dialogue/mia/${voiceId}.wav`;
  if (voiceId.includes('-HE-')) return `assets/audio/dialogue/ending/he/mia/${voiceId}.wav`;
  if (voiceId.includes('-BE-')) return `assets/audio/dialogue/ending/be/mia/${voiceId}.wav`;
  return null;
}

// 人物实际音量 = 基础音量 × 总音量比例 × 人物音量比例。
export function getCharacterVoiceVolume(baseVolume = 1, settings = { master: 100, character: 100 }) {
  const master = Math.max(0, Math.min(100, Number(settings?.master) || 0)) / 100;
  const character = Math.max(0, Math.min(100, Number(settings?.character) || 0)) / 100;
  return Math.max(0, Math.min(1, Number(baseVolume) * master * character));
}

export function stopVoicePlayback() {
  if (!activeVoice) return;
  if (activeVoice.startTimer !== null) clearTimeout(activeVoice.startTimer);
  activeVoice.audio.pause();
  activeVoice.audio.src = '';
  activeVoice = null;
}

// 有配音的台词只有在音频结束后才允许推进。
export function canAdvanceVoice(voiceId) {
  return !activeVoice || activeVoice.id !== voiceId || activeVoice.finished;
}

export function ensureVoicePlayback(voiceId, settings) {
  if (activeVoice?.id === voiceId && activeVoice.startTimer !== null && !activeVoice.finished) {
    activeVoice.audio.volume = getCharacterVoiceVolume(VOICES[voiceId].baseVolume, settings);
    return activeVoice.audio;
  }
  if (activeVoice?.id === voiceId && activeVoice.needsGesture && !activeVoice.finished) {
    activeVoice.audio.volume = getCharacterVoiceVolume(VOICES[voiceId].baseVolume, settings);
    activeVoice.audio.play().then(() => {
      if (activeVoice?.id === voiceId) activeVoice.needsGesture = false;
    }).catch(() => {});
    return activeVoice.audio;
  }
  return activeVoice?.id === voiceId ? activeVoice.audio : playVoice(voiceId, settings);
}

export function onVoicePlaybackEnd(voiceId, callback) {
  const current = activeVoice;
  if (!current || current.id !== voiceId || current.finished) {
    callback();
    return () => {};
  }
  let completed = false;
  const finish = () => {
    if (completed) return;
    completed = true;
    callback();
  };
  current.audio.addEventListener('ended', finish, { once: true });
  current.audio.addEventListener('error', finish, { once: true });
  return () => {
    current.audio.removeEventListener('ended', finish);
    current.audio.removeEventListener('error', finish);
  };
}

function startVoice(voiceId, settings, delay = 0) {
  const voice = VOICES[voiceId];
  if (!voice || typeof Audio === 'undefined') return null;
  stopVoicePlayback();
  const audio = new Audio(voice.source ?? voiceSource(voiceId));
  audio.preload = 'auto';
  audio.volume = getCharacterVoiceVolume(voice.baseVolume, settings);
  activeVoice = { id: voiceId, audio, finished: false, needsGesture: false, startTimer: null };
  audio.addEventListener('ended', () => {
    if (activeVoice?.audio === audio) activeVoice.finished = true;
  }, { once: true });
  audio.addEventListener('error', () => {
    if (activeVoice?.audio === audio) activeVoice.finished = true;
  }, { once: true });
  const beginPlayback = () => {
    if (activeVoice?.audio !== audio) return;
    activeVoice.startTimer = null;
    audio.play().catch(() => {
      if (activeVoice?.audio === audio) activeVoice.needsGesture = true;
    });
  };
  if (delay > 0) activeVoice.startTimer = setTimeout(beginPlayback, delay);
  else beginPlayback();
  return audio;
}

// 非动画对话先让新画面稳定半秒；动画继续直接调用 playVoice，保持原时序。
export function playDialogueVoice(voiceId, settings) {
  return startVoice(voiceId, settings, DIALOGUE_VOICE_DELAY);
}

export function playVoice(voiceId, settings) {
  return startVoice(voiceId, settings);
}

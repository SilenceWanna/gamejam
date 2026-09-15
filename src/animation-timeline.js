// Focus coordinates are percentages of the artwork. Clamp pans so zooming
// cannot reveal empty edges. Shared by future acts once their CGs are ready.
export function focusCamera(focusX, focusY, scale = 1) {
  const margin = (scale - 1) * 50;
  const clamp = (value) => Math.max(-margin, Math.min(margin, value));
  return { x: clamp((50 - focusX) * scale), y: clamp((50 - focusY) * scale), scale };
}

// 舞台提示也是剧情字幕；显示时只去掉包裹它的中括号，不改写正文。
export function displayScriptText(value = '') {
  const text = String(value).trim();
  const direction = text.match(/^【([\s\S]*)】$/);
  return direction ? direction[1].trim() : text;
}

// Animation narration omits a terminal full stop; spoken dialogue keeps its punctuation.
export function displayAnimationText(value = '', speaker = '') {
  const text = displayScriptText(value);
  return speaker ? text : text.replace(/。$/, '');
}

export function createMontageShot(lines, { id, from, to = from, transition = 'dissolve', hold = .18, settle = .84, duration }) {
  let elapsed = 0;
  const captions = [];
  let silentTime = 0;
  for (const line of lines) {
    const text = displayAnimationText(line.text, line.speaker);
    const isDirection = /^【[\s\S]*】$/.test(String(line.text).trim());
    const length = (text.match(/[\u3400-\u9fff]/g) ?? []).length;
    let time;
    const explicitDuration = Number(line.duration);
    if (Number.isFinite(explicitDuration) && explicitDuration > 0) {
      time = explicitDuration;
    } else if (line.voiceId) {
      // Dialogue remains visible for half a second after the recorded voice finishes.
      const voiceDelay = Math.max(0, Number(line.voiceDelay) || 0);
      time = voiceDelay + getVoiceDuration(line.voiceId) + 500;
    } else if (text) {
      silentTime = 0;
      time = line.speaker ? Math.max(4400, 1500 + length * 260)
        : isDirection ? Math.max(3500, 1400 + length * 200) : 3000;
      if (['……妈？', '妈，我搬不动。'].includes(text)) time += 1600;
    } else {
      // A look or silence needs a beat, not the old reading time for directions.
      time = /迟疑|犹豫|安静|没有说话|没有回答|回头/.test(line.text) ? 1800 : 700;
      time = Math.min(time, Math.max(0, 2400 - silentTime));
      silentTime += time;
    }
    if (!captions.length || captions.at(-1).text !== text || captions.at(-1).speaker !== line.speaker) {
      captions.push({
        at: elapsed,
        text,
        ...(text && line.speaker ? { speaker: line.speaker } : {}),
        ...(line.voiceId ? { voiceId: line.voiceId } : {}),
        ...(Number.isFinite(Number(line.voiceDelay)) ? { voiceDelay: Math.max(0, Number(line.voiceDelay)) } : {}),
        ...(line.sfx ? { sfx: line.sfx } : {}),
        ...(Number.isFinite(Number(line.sfxDelay)) ? { sfxDelay: Number(line.sfxDelay) } : {}),
        ...(Number.isFinite(Number(line.sfxVolume)) ? { sfxVolume: Number(line.sfxVolume) } : {}),
      });
    }
    elapsed += time;
  }
  // Only unvoiced shots need a minimum reading/camera beat. Recorded dialogue
  // must end exactly half a second before its caption changes.
  if (!lines.some(line => line.voiceId)) {
    elapsed = Math.max(elapsed, lines.some(line => line.speaker) ? 4500 : 5000);
  }
  const start = focusCamera(...from);
  const end = focusCamera(...to);
  return {
    id, image: lines[0].image, duration: duration ?? elapsed, captions,
    cameraPath: [
      { ...start, offset: 0 },
      { ...start, offset: hold, easing: 'cubic-bezier(.4, 0, .2, 1)' },
      { ...end, offset: settle },
      { ...end, offset: 1 },
    ],
    transitionDuration: transition === 'dissolve' ? 1200 : 1000,
  };
}
import { getVoiceDuration } from './voice.js';

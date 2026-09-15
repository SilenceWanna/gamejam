import { element } from './shared.js?v=20260915-script-v2-1-menu-label-1';
import { canAdvanceVoice, ensureVoicePlayback, onVoicePlaybackEnd, playDialogueVoice } from '../voice.js?v=20260915-dialogue-delay-1';
import { getState } from '../state.js';
import { displayScriptText } from '../animation-timeline.js';
import { playWritingActionOnce } from '../writing-sfx.js?v=20260915-writing-sfx-1-audio-layout-1-writing-level-1';

const OFFICE_CLIENT_BG = 'assets/images/background/office/MIA-SYS-BG-OfficeTalk_ClientBG_Day_v01.png';
const OFFICE_MIA_BG = 'assets/images/background/office/MIA-SYS-BG-OfficeTalk_MiaBG_Day_v01.png';

// Shares narrative's portrait/dialogue styles; the lines remain scene data.
export function createDialogue(line, onAdvance, { showBackground = true } = {}) {
  if (line.voiceId) playDialogueVoice(line.voiceId, getState().settings);
  playWritingActionOnce(line.text, getState().settings);
  const background = showBackground ? element('div', 'narrative-background') : null;
  if (background) {
    const backgroundSource = line.background
      ?? (line.portraitId === 'npc' || /阿遥/.test(line.speaker ?? '') ? OFFICE_CLIENT_BG : OFFICE_MIA_BG);
    background.dataset.background = backgroundSource;
    background.style.backgroundImage = `url("${backgroundSource}")`;
    background.setAttribute('aria-hidden', 'true');
  }
  const scrim = element('div', 'memory-dialogue-scrim');
  scrim.setAttribute('aria-hidden', 'true');
  const portrait = element('div', 'narrative-portrait');
  portrait.dataset.portraitId = line.portraitId ?? 'hero';
  portrait.setAttribute('aria-hidden', 'true');
  const box = element('section', 'dialogue-box');
  box.tabIndex = 0;
  box.setAttribute('role', 'button');
  box.setAttribute('aria-label', '点击对话框继续');
  const article = element('article', 'dialogue-line');
  if (line.speaker) article.append(element('p', 'dialogue-speaker', line.speaker));
  article.append(element('p', 'dialogue-text', displayScriptText(line.text)));
  const mark = element('span', 'dialogue-advance-mark', '▾');
  mark.setAttribute('aria-hidden', 'true');
  mark.hidden = Boolean(line.voiceId);
  const waiting = line.voiceId ? element('span', 'voice-waiting') : null;
  if (waiting) {
    waiting.setAttribute('aria-label', '语音播放中');
    waiting.append(element('i'), element('i'), element('i'));
  }
  box.append(article, mark, ...(waiting ? [waiting] : []));
  if (line.voiceId) onVoicePlaybackEnd(line.voiceId, () => {
    waiting.hidden = true;
    mark.hidden = false;
  });
  const advance = () => {
    if (line.voiceId && !canAdvanceVoice(line.voiceId)) {
      ensureVoicePlayback(line.voiceId, getState().settings);
      return;
    }
    onAdvance();
  };
  box.addEventListener('click', advance);
  box.addEventListener('keydown', (event) => {
    if (['Enter', ' '].includes(event.key)) {
      event.preventDefault();
      if (!event.repeat) advance();
    }
  });
  return [...(background ? [background] : []), scrim, portrait, box];
}


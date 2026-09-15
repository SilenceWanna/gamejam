// 浏览器入口：初始化可选的平台 SDK，然后把游戏挂载到 #app。
import { startEngine } from './engine.js?v=20260915-script-v2-3-dialogue-trim-1-dialogue-split-1-minigame-narration-1-prologue-exterior-1-phase-dialogue-2-mia-line-1-he-narration-1-be-narration-1-act2-accent-1-phase-address-1-immersive-result-2-office-rain-1-visual-crossfade-1-be-location-1-dialogue-delay-1-deduction-portrait-wait-1-dialogue-fade-sync-1-prologue-tram-portrait-1-dialogue-conditional-1-deduction-hold-2s-1-deduction-office-rain-1-hold-landing-1-office-indoor-amb-1-office-roomtone-layer-1-be-slow-fade-1-writing-sfx-1-act1-audio-1-act2-amb-1-quiet-hero-1-audio-layout-1-be-audio-1-writing-level-1-investigation-village-amb-1-minigame-office-intro-1-quiet-followup-hero-1-minigame-office-cover-1-ending-codex-label-1-ending-screen-1-ending-only-1-seamless-loops-1-ending-kicker-1-ending-frame-seamless-1-title-cover-1-settings-hidden-menu-1-first-two-minigame-no-white-1-act3-audio-1-he-audio-1-act2-group-audio-1-act3-audio-mix-1-unified-ui-1-ui-click-1-menu-label-1-dialog-vertical-1';

/**
 * 启动游戏。
 * 本地地址跳过平台 SDK，便于直接预览；线上环境即使 SDK 初始化失败，
 * 仍会以 sdk = null 启动，不阻断基础游戏流程。
 *
 * @returns {Promise<void>}
 */
async function main() {
  let sdk = null;
  const isLocalPreview = ['localhost', '127.0.0.1'].includes(window.location.hostname);

  if (!isLocalPreview && window.GameSDK?.init) {
    try {
      sdk = await window.GameSDK.init();
    } catch (error) {
      console.warn('[Game] SDK 初始化失败，已切换到本地预览模式。', error);
    }
  }

  startEngine(document.getElementById('app'), sdk);
}

main();

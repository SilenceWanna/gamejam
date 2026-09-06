// 入口：连接平台，然后启动场景引擎。
import { startEngine } from './engine.js';

async function main() {
  // 连接平台；失败不影响预览（本地兜底）。gameId 从 sdk.context 读取，禁硬编码。
  let sdk = null;
  try {
    sdk = await GameSDK.init();
  } catch (e) {
    console.warn('[Sandbox] SDK init failed, running in local fallback', e);
  }
  startEngine(document.getElementById('app'), sdk);
}

main();

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA_DIR = path.join(process.cwd(), 'scratch', 'chrome_screens_' + Date.now());
const ARTIFACT_DIR = path.join(process.cwd(), 'scratch');

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let ws = null;
let reqId = 1;

function sendCDP(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = reqId++;
    const handler = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.id === id) {
          ws.removeEventListener('message', handler);
          if (msg.error) reject(new Error(msg.error.message));
          else resolve(msg.result);
        }
      } catch (e) {
        reject(e);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evalInBrowser(expr) {
  const res = await sendCDP('Runtime.evaluate', {
    expression: expr,
    returnByValue: true,
    awaitPromise: true
  });
  if (res.exceptionDetails) {
    throw new Error('Eval Exception: ' + (res.exceptionDetails.exception?.description || res.exceptionDetails.text));
  }
  return res.result ? res.result.value : null;
}

async function captureScreenshot(filepath) {
  const data = await sendCDP('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(filepath, Buffer.from(data.data, 'base64'));
  console.log('[Screenshot Saved] ->', filepath);
}

async function run() {
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9225',
    '--window-size=1280,1024',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${USER_DATA_DIR}`,
    'http://localhost:3000'
  ]);

  let targets = null;
  for (let i = 0; i < 30; i++) {
    await wait(500);
    try {
      const res = await fetch('http://127.0.0.1:9225/json');
      if (res.ok) {
        targets = await res.json();
        if (targets.length > 0) break;
      }
    } catch (_) {}
  }

  const pageTarget = targets.find(t => t.type === 'page' && t.url.includes('localhost')) || targets[0];
  const WSClient = global.WebSocket || require('ws');
  ws = new WSClient(pageTarget.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });

  await sendCDP('Page.enable');
  await sendCDP('DOM.enable');
  await sendCDP('Runtime.enable');

  await wait(1500);

  // Navigate to roadmap
  await evalInBrowser(`(() => {
    if (typeof window.switchView === 'function') window.switchView('roadmap');
  })()`);
  await wait(800);

  // Switch to topics view
  await evalInBrowser(`(() => {
    document.querySelector('.roadmap-120-view-btn[data-roadmap-view="topics"]')?.click();
  })()`);
  await wait(800);

  await captureScreenshot(path.join(ARTIFACT_DIR, 'topic_curriculum_view.png'));

  // Open modal
  await evalInBrowser(`(() => {
    document.getElementById('btn-roadmap-adjust-topics')?.click();
  })()`);
  await wait(800);

  await captureScreenshot(path.join(ARTIFACT_DIR, 'topic_adjust_modal.png'));

  chromeProc.kill();
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});

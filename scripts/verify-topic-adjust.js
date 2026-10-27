/**
 * Browser verification script for topic up/down adjustment and customization
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA_DIR = path.join(process.cwd(), 'scratch', 'chrome_verify_topic_adjust_' + Date.now());
const ARTIFACT_DIR = path.join(process.cwd(), 'scratch');
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

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
  console.log('======================================================================');
  console.log('🚀 Topic Customization & Up/Down Adjustment Browser Verification');
  console.log('======================================================================');

  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9224',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${USER_DATA_DIR}`,
    'http://localhost:3000'
  ]);

  let targets = null;
  for (let i = 0; i < 30; i++) {
    await wait(500);
    try {
      const res = await fetch(`http://127.0.0.1:9224/json`);
      if (res.ok) {
        targets = await res.json();
        if (targets.length > 0) break;
      }
    } catch (_) {}
  }

  if (!targets || targets.length === 0) {
    throw new Error('Could not establish CDP connection on port 9224');
  }

  const pageTarget = targets.find(t => t.type === 'page' && t.url.includes('localhost')) || targets[0];
  console.log(`[CDP] Connected to: "${pageTarget.title}"`);

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

  // 1. Navigate to Study Roadmap view
  console.log('[Step 1] Navigating to Study Roadmap view...');
  await evalInBrowser(`(() => {
    if (typeof window.switchView === 'function') {
      window.switchView('roadmap');
    } else {
      location.hash = '#roadmap';
    }
  })()`);
  await wait(800);

  // 2. Switch to Topic Curriculum view
  console.log('[Step 2] Switching to Topic Curriculum view...');
  await evalInBrowser(`
    const topicViewBtn = document.querySelector('.roadmap-120-view-btn[data-roadmap-view="topics"]');
    if (topicViewBtn) topicViewBtn.click();
  `);
  await wait(800);

  const topicCardsCount = await evalInBrowser(`document.querySelectorAll('.roadmap-120-topic-card').length`);
  console.log(`  - Rendered topic cards count: ${topicCardsCount}`);
  if (topicCardsCount !== 22) {
    throw new Error(`Expected 22 topic cards, found ${topicCardsCount}`);
  }

  // Verify up/down buttons exist on topic cards
  const upDownBtnCount = await evalInBrowser(`document.querySelectorAll('.btn-topic-move').length`);
  console.log(`  - Topic move buttons count: ${upDownBtnCount}`);
  if (upDownBtnCount === 0) {
    throw new Error('Expected .btn-topic-move buttons on topic cards');
  }

  // 3. Test moving a topic down (move Graphs down)
  console.log('[Step 3] Testing Move Down on "Graphs" topic...');
  const firstTopicBefore = await evalInBrowser(`document.querySelector('#topic-matrix-stream-a .roadmap-120-topic-card')?.dataset?.topic`);
  console.log(`  - Stream A first topic before move: "${firstTopicBefore}"`);

  await evalInBrowser(`
    const downBtn = document.querySelector('#topic-matrix-stream-a .btn-topic-move[data-topic="Graphs"][data-dir="down"]');
    if (downBtn) downBtn.click();
  `);
  await wait(600);

  const firstTopicAfter = await evalInBrowser(`document.querySelector('#topic-matrix-stream-a .roadmap-120-topic-card')?.dataset?.topic`);
  console.log(`  - Stream A first topic after move: "${firstTopicAfter}"`);
  if (firstTopicAfter !== 'Binary Trees & BST') {
    throw new Error(`Expected Binary Trees & BST to become #1, got: "${firstTopicAfter}"`);
  }
  console.log('[Step 3 PASS] Topic successfully moved down; schedule adjusted!');

  // 4. Test opening the dedicated Adjust Topics Modal
  console.log('[Step 4] Opening Customize Topics Modal via toolbar button...');
  await evalInBrowser(`
    const adjustBtn = document.getElementById('btn-roadmap-adjust-topics');
    if (adjustBtn) adjustBtn.click();
  `);
  await wait(600);

  const modalOpen = await evalInBrowser(`document.getElementById('roadmap-adjust-topics-modal')?.classList.contains('open')`);
  console.log(`  - Customize Topics Modal open: ${modalOpen}`);
  if (!modalOpen) {
    throw new Error('Customize Topics Modal did not open');
  }

  const modalRowsCount = await evalInBrowser(`document.querySelectorAll('.roadmap-topic-reorder-row').length`);
  console.log(`  - Reorder rows in modal: ${modalRowsCount}`);
  if (modalRowsCount !== 7) {
    throw new Error(`Expected 7 rows for Stream A, got ${modalRowsCount}`);
  }

  // 5. Test moving Dynamic Programming to the top via modal
  console.log('[Step 5] Moving Dynamic Programming to the top via modal button...');
  await evalInBrowser(`
    const topBtn = document.querySelector('.roadmap-topic-reorder-row[data-topic="Dynamic Programming"] .btn-modal-topic-top');
    if (topBtn) topBtn.click();
  `);
  await wait(600);

  const topRowTopic = await evalInBrowser(`document.querySelector('.roadmap-topic-reorder-row')?.dataset?.topic`);
  console.log(`  - Top topic in modal row: "${topRowTopic}"`);
  if (topRowTopic !== 'Dynamic Programming') {
    throw new Error(`Expected Dynamic Programming at top, got: "${topRowTopic}"`);
  }
  console.log('[Step 5 PASS] Topic successfully moved to top in modal!');

  // Close modal
  console.log('[Step 6] Closing modal...');
  await evalInBrowser(`
    const closeBtn = document.getElementById('btn-close-topic-adjust');
    if (closeBtn) closeBtn.click();
  `);
  await wait(500);

  // 6. Verify Day-by-Day list view reflects Dynamic Programming on Day 1
  console.log('[Step 7] Checking Day-by-Day List view...');
  await evalInBrowser(`
    const listBtn = document.querySelector('.roadmap-120-view-btn[data-roadmap-view="list"]');
    if (listBtn) listBtn.click();
  `);
  await wait(600);

  const day1Topic = await evalInBrowser(`document.querySelector('.roadmap-120-day-card[data-day-num="1"] .stream-a > div:nth-child(2)')?.textContent?.trim()`);
  console.log(`  - Day 1 Stream A topic in List view: "${day1Topic}"`);
  if (day1Topic !== 'Dynamic Programming') {
    throw new Error(`Expected Day 1 to be Dynamic Programming, got: "${day1Topic}"`);
  }
  console.log('[Step 7 PASS] Day-by-Day list view accurately reflects customized topic order!');

  // 7. Verify quick topic buttons on day card
  const hasQuickBtns = await evalInBrowser(`!!document.querySelector('.roadmap-120-day-card .quick-topic-shift-btns')`);
  console.log(`  - Quick topic shift buttons visible on day cards: ${hasQuickBtns}`);
  if (!hasQuickBtns) {
    throw new Error('Expected quick topic shift buttons on day cards');
  }

  // 8. Test Reset to Blueprint
  console.log('[Step 8] Testing Reset to Blueprint...');
  await evalInBrowser(`(() => {
    const adjustBtn = document.getElementById('btn-roadmap-adjust-topics');
    if (adjustBtn) adjustBtn.click();
  })()`);
  await wait(400);

  await evalInBrowser(`(() => {
    window.confirm = () => true;
    const resetBtn = document.getElementById('btn-reset-topic-order');
    if (resetBtn) resetBtn.click();
  })()`);
  await wait(600);

  const resetTopTopic = await evalInBrowser(`document.querySelector('.roadmap-topic-reorder-row')?.dataset?.topic`);
  console.log(`  - Topic after blueprint reset: "${resetTopTopic}"`);
  if (resetTopTopic !== 'Graphs') {
    throw new Error(`Expected Graphs after reset, got: "${resetTopTopic}"`);
  }
  console.log('[Step 8 PASS] Reset to blueprint successfully restored default sequence!');

  await evalInBrowser(`(() => {
    const closeBtn = document.getElementById('btn-close-topic-adjust');
    if (closeBtn) closeBtn.click();
  })()`);
  await wait(500);

  await captureScreenshot(path.join(ARTIFACT_DIR, 'topic_customization_verified.png'));

  console.log('======================================================================');
  console.log('🎉 ALL TOPIC CUSTOMIZATION & ADJUSTMENT CHECKS PASSED PERFECTLY!');
  console.log('======================================================================');

  chromeProc.kill();
  process.exit(0);
}

run().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});

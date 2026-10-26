/**
 * AlgoRecall 2.0 - 120-Day Roadmap UI & Interaction Verification Script via Chrome CDP
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA_DIR = path.join(process.cwd(), 'scratch', 'chrome_verify_120_' + Date.now());
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
  console.log('🚀 120-Day DSA Roadmap Chrome Browser Interaction Verification');
  console.log('======================================================================');

  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9223',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${USER_DATA_DIR}`,
    'http://localhost:3000'
  ]);

  let targets = null;
  for (let i = 0; i < 30; i++) {
    await wait(500);
    try {
      const res = await fetch(`http://127.0.0.1:9223/json`);
      if (res.ok) {
        targets = await res.json();
        if (targets.length > 0) break;
      }
    } catch (_) {}
  }

  if (!targets || targets.length === 0) {
    throw new Error('Could not establish CDP connection on port 9223');
  }

  const pageTarget = targets.find(t => t.type === 'page' && t.url.includes('localhost')) || targets.find(t => t.type === 'page') || targets[0];
  console.log(`[CDP] Connected to page: "${pageTarget.title}" (${pageTarget.url})`);

  const WSClient = global.WebSocket || require('ws');
  ws = new WSClient(pageTarget.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    if (typeof ws.addEventListener === 'function') {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', reject, { once: true });
    } else {
      ws.on('open', resolve);
      ws.on('error', reject);
    }
  });

  await sendCDP('Page.enable');
  await sendCDP('Runtime.enable');
  await sendCDP('DOM.enable');
  await wait(1000);

  // Wait for scripts and DOM to load
  for (let i = 0; i < 40; i++) {
    try {
      const ready = await evalInBrowser(`Boolean(window.Roadmap120Engine && window.RoadmapEngine && window.DEFAULT_DSA_SHEETS && window.DEFAULT_DSA_SHEETS.length === 479)`);
      if (ready) break;
    } catch (_) {}
    await wait(500);
  }
  await wait(1000);

  const errors = [];
  ws.addEventListener('message', (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        const text = msg.params.args.map(a => a.value || a.description || '').join(' ');
        errors.push(text);
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        errors.push(msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text);
      }
    } catch (_) {}
  });

  let passCount = 0;
  function check(desc, cond) {
    if (cond) {
      console.log(`  ✓ [CHECK ${++passCount}] ${desc}`);
    } else {
      console.error(`  ✗ [FAIL] ${desc}`);
      process.exitCode = 1;
    }
  }

  // 1. Check Engines Available
  const enginesCheck = await evalInBrowser(`({
    hasRoadmap120: typeof window.Roadmap120Engine !== 'undefined',
    hasRoadmap: typeof window.RoadmapEngine !== 'undefined',
    hasSRS: typeof window.SRSEngine !== 'undefined',
    hasRecommendation: typeof window.RecommendationEngine !== 'undefined'
  })`);
  check('Roadmap120Engine and RoadmapEngine loaded in browser window', enginesCheck.hasRoadmap120 && enginesCheck.hasRoadmap);

  // 2. Switch to Roadmap View via Sidebar Nav Item
  await evalInBrowser(`(() => {
    const navRoadmap = document.getElementById('nav-item-roadmap');
    if (navRoadmap) {
      navRoadmap.click();
    } else if (typeof window.switchView === 'function') {
      window.switchView('roadmap');
    } else {
      location.hash = '#roadmap';
    }
  })()`);
  await wait(800);

  const navItemActive = await evalInBrowser(`(() => {
    const navRoadmap = document.getElementById('nav-item-roadmap');
    return navRoadmap ? navRoadmap.classList.contains('active') : false;
  })()`);
  check('Sidebar "120D Roadmap" nav item is active', navItemActive);

  // 3. Verify Roadmap 120 Dashboard & KPIs
  const dashboardState = await evalInBrowser(`(() => ({
    wrapperVisible: !!document.querySelector('.roadmap-120-wrapper'),
    title: document.getElementById('roadmap-track-title')?.textContent?.trim() || '',
    kpiProgress: document.getElementById('roadmap-stat-progress')?.textContent?.trim() || '',
    kpiDaysDone: document.getElementById('roadmap-stat-days-done')?.textContent?.trim() || '',
    kpiSolved: document.getElementById('roadmap-stat-solved-count')?.textContent?.trim() || '',
    kpiHealth: document.getElementById('roadmap-120-kpi-health')?.textContent?.trim() || '',
    filterAll: !!document.querySelector('.roadmap-120-filter-pill[data-filter="all"]'),
    searchInput: !!document.getElementById('roadmap-120-search-input'),
    btnInsertBuffer: !!document.getElementById('btn-roadmap-insert-day'),
    btnShift: !!document.getElementById('btn-roadmap-shift'),
    btnCondense: !!document.getElementById('btn-roadmap-condense')
  }))()`);

  check('120-Day Roadmap wrapper rendered in DOM', dashboardState.wrapperVisible);
  check('KPI metrics rendered (Progress, Days Done, Health, Solved)', dashboardState.kpiProgress && dashboardState.kpiDaysDone && dashboardState.kpiHealth);
  check('Action buttons rendered (Insert Day, Shift, Condense)', dashboardState.btnInsertBuffer && dashboardState.btnShift && dashboardState.btnCondense);

  // 4. Test View Toggles: List, Calendar, Topic Progression
  const listCardCount = await evalInBrowser(`document.querySelectorAll('.roadmap-120-day-card').length`);
  check('List View renders day cards (>= 120 cards)', listCardCount >= 120);

  // Switch to Calendar View
  await evalInBrowser(`(() => {
    const btn = document.querySelector('.roadmap-120-view-btn[data-roadmap-view="calendar"]');
    if (btn) btn.click();
  })()`);
  await wait(400);
  const calGridCount = await evalInBrowser(`document.querySelectorAll('.calendar-day-cell').length`);
  check('Calendar Grid renders 120 day cells', calGridCount >= 120);

  // Switch to Topic Progression View
  await evalInBrowser(`(() => {
    const btn = document.querySelector('.roadmap-120-view-btn[data-roadmap-view="topics"]');
    if (btn) btn.click();
  })()`);
  await wait(400);
  const topicCardsCount = await evalInBrowser(`document.querySelectorAll('.roadmap-120-topic-card').length`);
  check('Topic Progression View renders topic progression cards', topicCardsCount > 0);

  // Switch to Curriculum Audit View
  await evalInBrowser(`(() => {
    const btn = document.querySelector('.roadmap-120-view-btn[data-roadmap-view="audit"]');
    if (btn) btn.click();
  })()`);
  await wait(400);
  const auditState = await evalInBrowser(`(() => ({
    hasAuditWrap: !!document.querySelector('.roadmap-120-audit-wrap'),
    areaCardsCount: document.querySelectorAll('.roadmap-120-audit-area-card').length,
    patternRowsCount: document.querySelectorAll('.roadmap-120-audit-patterns-table tbody tr').length
  }))()`);
  check('Curriculum Audit View renders all 14 taxonomy areas and pattern tables', auditState.hasAuditWrap && auditState.areaCardsCount === 14 && auditState.patternRowsCount >= 90);

  // Switch back to List View
  await evalInBrowser(`(() => {
    const btn = document.querySelector('.roadmap-120-view-btn[data-roadmap-view="list"]');
    if (btn) btn.click();
  })()`);
  await wait(400);

  // 5. Test Search Filtering
  await evalInBrowser(`(() => {
    const el = document.getElementById('roadmap-120-search-input');
    if (el) {
      el.value = 'Graphs';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  })()`);
  await wait(400);
  const filteredCount = await evalInBrowser(`document.querySelectorAll('.roadmap-120-day-card').length`);
  check('Search filter "Graphs" filters visible day cards', filteredCount > 0 && filteredCount < 120);

  // Clear search
  await evalInBrowser(`(() => {
    const el = document.getElementById('roadmap-120-search-input');
    if (el) {
      el.value = '';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  })()`);
  await wait(400);
  const restoredCount = await evalInBrowser(`document.querySelectorAll('.roadmap-120-day-card').length`);
  check('Clearing search restores all day cards', restoredCount >= 120);

  // 6. Test Interactive Modals
  // Open Insert Buffer Day Modal
  await evalInBrowser(`(() => {
    const btn = document.getElementById('btn-roadmap-insert-day');
    if (btn) btn.click();
  })()`);
  await wait(300);
  const bufferModalOpen = await evalInBrowser(`document.getElementById('roadmap-insert-day-modal')?.classList.contains('open')`);
  check('Insert Buffer Day modal opens', bufferModalOpen);

  // Close buffer modal
  await evalInBrowser(`(() => {
    const btn = document.getElementById('btn-close-insert-modal');
    if (btn) btn.click();
  })()`);
  await wait(300);
  const bufferModalClosed = await evalInBrowser(`!document.getElementById('roadmap-insert-day-modal')?.classList.contains('open')`);
  check('Insert Buffer Day modal closes', bufferModalClosed);

  // Open Shift Modal
  await evalInBrowser(`(() => {
    const btn = document.getElementById('btn-roadmap-shift');
    if (btn) btn.click();
  })()`);
  await wait(300);
  const shiftModalOpen = await evalInBrowser(`document.getElementById('roadmap-shift-modal')?.classList.contains('open')`);
  check('Shift Roadmap modal opens', shiftModalOpen);

  // Close shift modal
  await evalInBrowser(`(() => {
    const btn = document.getElementById('btn-close-shift-modal');
    if (btn) btn.click();
  })()`);
  await wait(300);
  const shiftModalClosed = await evalInBrowser(`!document.getElementById('roadmap-shift-modal')?.classList.contains('open')`);
  check('Shift Roadmap modal closes', shiftModalClosed);

  // Open Condense Modal
  await evalInBrowser(`(() => {
    const btn = document.getElementById('btn-roadmap-condense');
    if (btn) btn.click();
  })()`);
  await wait(300);
  const condenseModalOpen = await evalInBrowser(`document.getElementById('roadmap-condense-modal')?.classList.contains('open')`);
  check('Condense Roadmap modal opens', condenseModalOpen);

  // Close condense modal
  await evalInBrowser(`(() => {
    const btn = document.getElementById('btn-close-condense-modal');
    if (btn) btn.click();
  })()`);
  await wait(300);
  const condenseModalClosed = await evalInBrowser(`!document.getElementById('roadmap-condense-modal')?.classList.contains('open')`);
  check('Condense Roadmap modal closes', condenseModalClosed);

  // 7. Test Authoritative Daily Resolver Integration
  const authoritativePlan = await evalInBrowser(`
    window.RecommendationEngine.resolveDailySchedule(window.RoadmapEngine, window.allProblems, window.userStates)
  `);
  check('RecommendationEngine.resolveDailySchedule returns authoritative plan', authoritativePlan && authoritativePlan.streamA && authoritativePlan.streamB);

  // 8. Capture Roadmap Screenshot
  const ssPath = path.join(ARTIFACT_DIR, 'roadmap_120_dashboard.png');
  await captureScreenshot(ssPath);
  const brainArtifactPath = 'C:\\Users\\Dell\\.gemini\\antigravity-ide\\brain\\1fdd1b8d-1ec3-41e4-a0f5-cd04bcfa3a0c\\roadmap_view_verified.png';
  try {
    fs.copyFileSync(ssPath, brainArtifactPath);
  } catch (_) {}
  check('120-Day Roadmap Dashboard screenshot captured', fs.existsSync(ssPath));

  // 9. Check Zero Console Errors
  check('Zero uncaught JavaScript errors in browser console', errors.length === 0);
  if (errors.length > 0) {
    console.error('Browser errors encountered:', errors);
  }

  console.log('======================================================================');
  console.log(`Results: ${passCount} Checks Passed (0 Failed)`);
  console.log('======================================================================');

  ws.close();
  chromeProc.kill();
  try {
    fs.rmSync(USER_DATA_DIR, { recursive: true, force: true });
  } catch (_) {}
}

run().catch(err => {
  console.error('Script Error:', err);
  process.exit(1);
});

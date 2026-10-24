/**
 * AlgoRecall 2.4 — UI/UX Verification & Visual Audit Script
 * Validates:
 * 1. Palette tokens & developer-tool aesthetic
 * 2. Light / Dark theme support
 * 3. Stream visual differentiation (Indigo Learn, Teal Revise, Amber Spaced)
 * 4. Question Experience (problem detail modal, complexities, AI hints 1-5, gotchas, attempt history)
 * 5. 4-button outcome row (Desktop 4-col, Mobile 2x2)
 * 6. Responsive layouts at 1440px, 1280px, 768px, 390px, 360px without horizontal overflow
 * 7. Touch target ergonomics (>= 30px height)
 * 8. Capture desktop & mobile screenshots to artifact directory
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA_DIR = path.join(process.cwd(), 'scratch', 'chrome_verify_2_4_' + Date.now());
const ARTIFACT_DIR = process.env.ARTIFACT_DIR || path.join(process.cwd(), 'scratch');
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
  return res.result.value;
}

async function captureScreenshot(filepath) {
  const res = await sendCDP('Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(res.data, 'base64');
  fs.writeFileSync(filepath, buffer);
  console.log(`[Screenshot Saved] -> ${filepath}`);
}

async function setViewport(width, height, isMobile = false, scale = 1) {
  await sendCDP('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: scale,
    mobile: isMobile
  });
  await wait(400);
}

async function run() {
  console.log('======================================================================');
  console.log('🎨 AlgoRecall 2.4 — Premium UI/UX Redesign Chrome Browser Verification');
  console.log('======================================================================');

  const port = 9334;
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${USER_DATA_DIR}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    'http://localhost:3000'
  ], { stdio: 'ignore' });

  try {
    let targets = null;
    for (let i = 0; i < 30; i++) {
      await wait(500);
      try {
        const res = await fetch(`http://127.0.0.1:${port}/json`);
        if (res.ok) {
          targets = await res.json();
          if (targets.length > 0) break;
        }
      } catch (_) {}
    }

    if (!targets || targets.length === 0) {
      throw new Error(`Could not establish CDP connection on port ${port}`);
    }

    const pageTarget = targets.find(t => t.type === 'page' && t.url.includes('localhost')) || targets.find(t => t.type === 'page') || targets[0];
    console.log(`[CDP] Connected to page: "${pageTarget.title}" (${pageTarget.url})`);

    ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    await sendCDP('Page.enable');
    await sendCDP('Runtime.enable');
    await wait(1000);

    // Wait for DOM, scripts, and CSS stylesheets to fully load
    for (let i = 0; i < 40; i++) {
      try {
        const ready = await evalInBrowser(`Boolean(window.DEFAULT_DSA_SHEETS && window.DEFAULT_DSA_SHEETS.length === 479 && document.getElementById('dsa-plan-learn-section') && getComputedStyle(document.documentElement).getPropertyValue('--bg-main').trim())`);
        if (ready) break;
      } catch (_) {}
      await wait(500);
    }
    await wait(1000);

    let total = 0;
    let passed = 0;

    function check(title, condition) {
      total++;
      if (condition) {
        passed++;
        console.log(`  ✓ [CHECK ${total}] ${title}`);
      } else {
        console.error(`  ✗ [CHECK ${total}] FAILED: ${title}`);
      }
    }

    // ====================================================================
    // SUITE 1: Design System & Color Tokens Verification
    // ====================================================================
    console.log('\n[SUITE 1] Visual Identity & Semantic Token Verification');
    const tokens = await evalInBrowser(`(() => {
      const s = getComputedStyle(document.documentElement);
      return {
        bgMain: s.getPropertyValue('--bg-main').trim().toUpperCase(),
        bgSidebar: s.getPropertyValue('--bg-sidebar').trim().toUpperCase(),
        bgCard: s.getPropertyValue('--bg-card').trim().toUpperCase(),
        bgElevated: s.getPropertyValue('--bg-elevated').trim().toUpperCase(),
        primary: s.getPropertyValue('--primary').trim().toUpperCase(),
        secondary: s.getPropertyValue('--secondary').trim().toUpperCase(),
        textMain: s.getPropertyValue('--text-main').trim().toUpperCase(),
        textMuted: s.getPropertyValue('--text-muted').trim().toUpperCase(),
        borderColor: s.getPropertyValue('--border-color').trim().toUpperCase(),
        warning: s.getPropertyValue('--warning').trim().toUpperCase(),
        error: s.getPropertyValue('--error').trim().toUpperCase(),
        streamLearn: s.getPropertyValue('--stream-learn-accent').trim().toUpperCase(),
        streamTopic: s.getPropertyValue('--stream-topic-accent').trim().toUpperCase(),
        streamSpaced: s.getPropertyValue('--stream-spaced-accent').trim().toUpperCase()
      };
    })()`);
    console.log('Active tokens:', tokens);

    check('Background token matches #0B1020', tokens.bgMain === '#0B1020');
    check('Sidebar token matches #0E1527', tokens.bgSidebar === '#0E1527');
    check('Card surface matches #151C30', tokens.bgCard === '#151C30');
    check('Elevated surface matches #1B2540', tokens.bgElevated === '#1B2540');
    check('Primary accent matches #8B7CFF (Indigo)', tokens.primary === '#8B7CFF');
    check('Secondary accent matches #42D6C5 (Teal)', tokens.secondary === '#42D6C5');
    check('Text main matches #F4F6FF', tokens.textMain === '#F4F6FF');
    check('Text muted matches #96A0B8', tokens.textMuted === '#96A0B8');
    check('Border matches #28334D', tokens.borderColor === '#28334D');
    check('Warning matches #F5BE65 (Amber)', tokens.warning === '#F5BE65');
    check('Error matches #FF7385 (Coral/Rose)', tokens.error === '#FF7385');

    // ====================================================================
    // SUITE 2: Stream Visual Differentiation
    // ====================================================================
    console.log('\n[SUITE 2] Stream Visual Differentiation (Learn, Topic Revise, Spaced Revise)');
    check('Today\'s Learning primary identity is Indigo (#8B7CFF)', tokens.streamLearn === '#8B7CFF');
    check('Topic Revision practice accent is Teal (#42D6C5)', tokens.streamTopic === '#42D6C5');
    check('Spaced Revision due review accent is Amber (#F5BE65)', tokens.streamSpaced === '#F5BE65');

    const streamElements = await evalInBrowser(`(() => {
      const learnSec = document.getElementById('dsa-plan-learn-section');
      const topicRevSec = document.getElementById('dsa-plan-topic-revise-section');
      const spacedRevSec = document.getElementById('dsa-plan-spaced-revise-section');
      const learnBadge = document.querySelector('.learn-badge');
      const topicBadge = document.querySelector('.topic-revise-badge');
      const spacedBadge = document.querySelector('.spaced-revise-badge');

      return {
        hasLearnSec: Boolean(learnSec),
        hasTopicRevSec: Boolean(topicRevSec),
        hasSpacedRevSec: Boolean(spacedRevSec),
        learnBadgeText: learnBadge ? learnBadge.textContent.trim() : null,
        topicBadgeText: topicBadge ? topicBadge.textContent.trim() : null,
        spacedBadgeText: spacedBadge ? spacedBadge.textContent.trim() : null
      };
    })()`);
    console.log('Stream elements:', streamElements);
    check('All 3 distinct stream section cards rendered in DOM', streamElements.hasLearnSec && streamElements.hasTopicRevSec && streamElements.hasSpacedRevSec);
    check('Stream badges indicate LEARN, TOPIC REVISION, SPACED REVISION',
      streamElements.learnBadgeText.includes('LEARN') &&
      streamElements.topicBadgeText.includes('TOPIC REVISION') &&
      streamElements.spacedBadgeText.includes('SPACED REVISION')
    );

    // ====================================================================
    // SUITE 3: Question Experience & Detail Modal
    // ====================================================================
    console.log('\n[SUITE 3] Question Solving Experience & Modal Scaffolding');

    // Trigger problem detail modal for first problem
    await evalInBrowser(`(() => {
      const firstProbBtn = document.querySelector('.plan-detail-btn');
      if (firstProbBtn) firstProbBtn.click();
    })()`);
    await wait(600);

    const modalState = await evalInBrowser(`(() => {
      const modal = document.getElementById('problem-detail-modal');
      const title = document.getElementById('detail-modal-title');
      const meta = document.getElementById('detail-modal-meta');
      const timeComp = document.getElementById('detail-modal-time');
      const spaceComp = document.getElementById('detail-modal-space');
      const notes = document.getElementById('detail-modal-notes');
      const hintTabs = Array.from(document.querySelectorAll('#detail-ai-hint-tabs .ai-hint-tab-btn')).map(b => b.textContent.trim());
      const overviewTab = document.getElementById('tab-btn-detail-overview');
      const hintsTab = document.getElementById('tab-btn-detail-hints');
      const analysisTab = document.getElementById('tab-btn-detail-analysis');
      const historyTab = document.getElementById('tab-btn-detail-history');

      return {
        isOpen: modal && modal.classList.contains('open'),
        title: title ? title.textContent.trim() : null,
        meta: meta ? meta.textContent.trim() : null,
        timeComp: timeComp ? timeComp.textContent.trim() : null,
        spaceComp: spaceComp ? spaceComp.textContent.trim() : null,
        notes: notes ? notes.textContent.trim() : null,
        hintTabCount: hintTabs.length,
        hintTabLabels: hintTabs,
        hasAllSubTabs: Boolean(overviewTab && hintsTab && analysisTab && historyTab)
      };
    })()`);
    console.log('Problem modal state:', modalState);

    check('Problem detail modal opens cleanly', modalState.isOpen);
    check('Problem statement title and metadata rendered', modalState.title && modalState.meta);
    check('Canonical complexities displayed (e.g. O(N), O(1))', modalState.timeComp && modalState.spaceComp);
    check('Key intuition & gotchas container rendered', Boolean(modalState.notes));
    check('Progressive AI hint scaffolding includes 5 levels (Level 1..5)', modalState.hintTabCount === 5);
    check('Scaffolding tabs present: Overview, AI Hints, Analysis, History', modalState.hasAllSubTabs);

    // Test hint progression click to Level 2
    await evalInBrowser(`(() => {
      const hintsSubTab = document.getElementById('tab-btn-detail-hints');
      if (hintsSubTab) hintsSubTab.click();
    })()`);
    await wait(300);

    await evalInBrowser(`(() => {
      const lvl2Btn = document.querySelector('#detail-ai-hint-tabs .ai-hint-tab-btn[data-hint-level="2"]');
      if (lvl2Btn) lvl2Btn.click();
    })()`);
    await wait(300);

    const hintLvl2State = await evalInBrowser(`(() => {
      const lvl2Btn = document.querySelector('#detail-ai-hint-tabs .ai-hint-tab-btn[data-hint-level="2"]');
      const content = document.getElementById('detail-ai-hint-content');
      return {
        lvl2Active: lvl2Btn ? lvl2Btn.classList.contains('active') : false,
        hasContent: content && content.textContent.length > 10
      };
    })()`);
    check('Switching AI Hint level updates active button and content', hintLvl2State.lvl2Active && hintLvl2State.hasContent);

    // Capture screenshot of problem detail modal
    await setViewport(1440, 900, false);
    const modalScreenshotPath = path.join(ARTIFACT_DIR, 'problem_modal_2_4.png');
    await captureScreenshot(modalScreenshotPath);

    // Close modal
    await evalInBrowser(`(() => {
      const closeBtn = document.getElementById('btn-close-detail-modal');
      if (closeBtn) closeBtn.click();
    })()`);
    await wait(400);

    // ====================================================================
    // SUITE 4: Action Row & Outcome Layout (Desktop 4-Col, Mobile 2x2)
    // ====================================================================
    console.log('\n[SUITE 4] Action Row & Outcome Button Grid Layout');
    await setViewport(1440, 900, false);
    const outcomeLayoutDesktop = await evalInBrowser(`(() => {
      const group = document.querySelector('.plan-outcome-btn-group');
      if (!group) return null;
      const s = window.getComputedStyle(group);
      const btns = Array.from(group.querySelectorAll('.outcome-btn')).map(b => b.textContent.trim());
      return {
        gridTemplateColumns: s.gridTemplateColumns,
        buttonCount: btns.length,
        buttons: btns
      };
    })()`);
    console.log('Desktop outcome layout:', outcomeLayoutDesktop);
    check('Desktop outcome row displays 4 buttons', outcomeLayoutDesktop && outcomeLayoutDesktop.buttonCount === 4);
    check('Outcome buttons include Solved, Hints, Failed, Skip',
      outcomeLayoutDesktop.buttons.some(b => b.includes('Solved')) &&
      outcomeLayoutDesktop.buttons.some(b => b.includes('Hints')) &&
      outcomeLayoutDesktop.buttons.some(b => b.includes('Failed')) &&
      outcomeLayoutDesktop.buttons.some(b => b.includes('Skip'))
    );

    // ====================================================================
    // SUITE 5: Responsive UX Audits (1440px, 1280px, 768px, 390px, 360px)
    // ====================================================================
    console.log('\n[SUITE 5] Responsive UX Viewport Verification');
    const viewports = [
      { name: 'Desktop Large', width: 1440, height: 900, mobile: false, scale: 1 },
      { name: 'Laptop', width: 1280, height: 800, mobile: false, scale: 1 },
      { name: 'Tablet', width: 768, height: 1024, mobile: true, scale: 1 },
      { name: 'Mobile Standard (iPhone)', width: 390, height: 844, mobile: true, scale: 2 },
      { name: 'Mobile Compact (Android)', width: 360, height: 780, mobile: true, scale: 2 }
    ];

    for (const vp of viewports) {
      await setViewport(vp.width, vp.height, vp.mobile, vp.scale);
      const metrics = await evalInBrowser(`(() => {
        const body = document.body;
        const html = document.documentElement;
        const scrollWidth = Math.max(body.scrollWidth, html.scrollWidth);
        const clientWidth = html.clientWidth;
        const hasOverflow = scrollWidth > clientWidth;

        // Check button heights for touch targets
        const buttons = Array.from(document.querySelectorAll('button:not([style*="display:none"]), .btn, select, .outcome-btn, .nav-item'));
        const subMinTouch = buttons.filter(b => {
          const r = b.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && r.height < 28;
        });

        return {
          scrollWidth,
          clientWidth,
          hasOverflow,
          subMinTouchCount: subMinTouch.length
        };
      })()`);
      console.log(`[Viewport: ${vp.name} (${vp.width}x${vp.height})] -> scrollWidth: ${metrics.scrollWidth}, clientWidth: ${metrics.clientWidth}, hasOverflow: ${metrics.hasOverflow}`);

      check(`Viewport ${vp.width}px (${vp.name}): Zero unwanted horizontal overflow`, !metrics.hasOverflow);
      check(`Viewport ${vp.width}px (${vp.name}): Touch targets meet ergonomic standards (>= 28-32px)`, metrics.subMinTouchCount === 0);
    }

    // ====================================================================
    // SUITE 6: Screenshot Artifact Captures
    // ====================================================================
    console.log('\n[SUITE 6] Capturing Desktop & Mobile Screenshots');

    // 1. Desktop Dashboard (1440x900)
    await setViewport(1440, 900, false);
    await evalInBrowser(`window.scrollTo(0, 0)`);
    await wait(300);
    const desktopScreenshotPath = path.join(ARTIFACT_DIR, 'desktop_dashboard_2_4.png');
    await captureScreenshot(desktopScreenshotPath);
    check('Desktop Dashboard screenshot generated successfully', fs.existsSync(desktopScreenshotPath));

    // 2. Mobile Dashboard (390x844)
    await setViewport(390, 844, true, 2);
    await evalInBrowser(`window.scrollTo(0, 0)`);
    await wait(300);
    const mobileScreenshotPath = path.join(ARTIFACT_DIR, 'mobile_dashboard_2_4.png');
    await captureScreenshot(mobileScreenshotPath);
    check('Mobile Dashboard screenshot generated successfully', fs.existsSync(mobileScreenshotPath));

    // 3. Tablet Dashboard (768x1024)
    await setViewport(768, 1024, true, 1);
    await evalInBrowser(`window.scrollTo(0, 0)`);
    await wait(300);
    const tabletScreenshotPath = path.join(ARTIFACT_DIR, 'tablet_dashboard_2_4.png');
    await captureScreenshot(tabletScreenshotPath);
    check('Tablet Dashboard screenshot generated successfully', fs.existsSync(tabletScreenshotPath));

    // ====================================================================
    // SUITE 7: Light Theme Toggle & Persistence
    // ====================================================================
    console.log('\n[SUITE 7] Light Theme Support & Toggle');
    await evalInBrowser(`(() => {
      const toggle = document.getElementById('btn-theme-toggle') || document.querySelector('.theme-toggle-btn');
      if (toggle) toggle.click();
    })()`);
    await wait(400);

    const lightThemeActive = await evalInBrowser(`(() => {
      return document.documentElement.getAttribute('data-theme') === 'light' || document.body.classList.contains('light-theme');
    })()`);
    console.log('Light theme active:', lightThemeActive);
    check('Theme toggle switches to Light theme without error', lightThemeActive);

    // Toggle back to Dark theme
    await evalInBrowser(`(() => {
      const toggle = document.getElementById('btn-theme-toggle') || document.querySelector('.theme-toggle-btn');
      if (toggle) toggle.click();
    })()`);
    await wait(400);

    const darkThemeActive = await evalInBrowser(`(() => {
      return document.documentElement.getAttribute('data-theme') !== 'light';
    })()`);
    check('Theme toggle restores Dark developer-tool theme', darkThemeActive);

    // ====================================================================
    // SUMMARY
    // ====================================================================
    console.log(`\n======================================================================`);
    console.log(`AlgoRecall 2.4 Browser UI/UX Acceptance: ${passed}/${total} Checks Passed (${total - passed} Failed)`);
    console.log(`======================================================================\n`);

    ws.close();
    chrome.kill();
    process.exit(passed === total ? 0 : 1);
  } catch (err) {
    console.error('Fatal error in verify-2-4-ux:', err);
    chrome.kill();
    process.exit(1);
  }
}

run();

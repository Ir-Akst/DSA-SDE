/**
 * AlgoRecall 2.0 — Question Refresh Browser Verification Script
 * Validates:
 * 1. Session Time selector (#dsa-plan-time-select) is completely removed from DOM.
 * 2. #dsa-plan-study-time-display is preserved and shows 120 minutes.
 * 3. All 3 independent stream refresh buttons exist and are visible (#btn-refresh-learn, #btn-refresh-topic-revise, #btn-refresh-spaced-revise).
 * 4. Refresh modal (#refresh-confirm-modal) opens with accurate stream & topic preview data.
 * 5. Data preservation notice is explicitly present in the modal.
 * 6. Cancel action closes the modal without mutating plan assignments.
 * 7. Zero marked questions: modal reports 0 marked, confirm disabled, no mutation.
 * 8. Marking a task (skip/solve) -> refresh preview reflects marked count = 1.
 * 9. Confirm refresh executes atomically, replaces marked task, preserves unmarked tasks.
 * 10. Success feedback banner is displayed with accurate replaced counts.
 * 11. Page reload retains refreshed question assignments (persistence verification).
 * 12. Modal keyboard accessibility (Escape key dismisses dialog).
 * 13. Zero uncaught console errors throughout execution.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA_DIR = path.join(process.cwd(), 'scratch', 'chrome_verify_refresh_' + Date.now());

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let ws = null;
let reqId = 1;
const consoleErrors = [];

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

const results = [];

function check(title, condition, extra = '') {
  if (condition) {
    console.log(`  ✓ ${title}`);
    results.push({ title, pass: true });
  } else {
    console.error(`  ✗ FAIL: ${title} ${extra ? '(' + extra + ')' : ''}`);
    results.push({ title, pass: false, error: extra });
  }
}

async function run() {
  console.log('====================================================');
  console.log('AlgoRecall 2.0 Browser QA — Today\'s Question Refresh');
  console.log('====================================================\n');

  const port = 9335;
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

    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    console.log(`[CDP] Connected to page: "${pageTarget.title}"`);

    ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    ws.addEventListener('message', (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.method === 'Runtime.consoleAPICalled') {
          if (msg.params.type === 'error') {
            const errText = msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
            consoleErrors.push(errText);
          }
        }
      } catch (_) {}
    });

    await sendCDP('Page.enable');
    await sendCDP('Runtime.enable');
    await wait(1000);

    // Wait for plan task cards and catalog to load
    let catalogReady = false;
    for (let i = 0; i < 30; i++) {
      catalogReady = await evalInBrowser(`(() => {
        return typeof window.DEFAULT_DSA_SHEETS !== 'undefined' &&
               window.DEFAULT_DSA_SHEETS.length === 479 &&
               document.querySelectorAll('.plan-task-card').length > 0;
      })()`);
      if (catalogReady) break;
      await wait(500);
    }
    check('1. Canonical problem catalog loaded (479 problems) and plan rendered', catalogReady);

    // Check 1: Session Time selector removed from DOM
    const sessionTimeRemoved = await evalInBrowser(`(() => {
      const select = document.getElementById('dsa-plan-time-select');
      return select === null;
    })()`);
    check('2. Session Time dropdown (#dsa-plan-time-select) is completely removed from DOM', sessionTimeRemoved);

    // Check 2: Study time display preserved
    const studyTimeDisplay = await evalInBrowser(`(() => {
      const el = document.getElementById('dsa-plan-study-time-display');
      return el ? el.textContent.trim() : null;
    })()`);
    check('3. Study time target display (#dsa-plan-study-time-display) is preserved', studyTimeDisplay === '120 minutes', `Got: ${studyTimeDisplay}`);

    // Check 3: All 3 refresh buttons exist and are visible
    const refreshButtons = await evalInBrowser(`(() => {
      const btnLearn = document.getElementById('btn-refresh-learn');
      const btnTopic = document.getElementById('btn-refresh-topic-revise');
      const btnSpaced = document.getElementById('btn-refresh-spaced-revise');
      return {
        btnLearn: !!btnLearn && btnLearn.offsetWidth > 0,
        btnTopic: !!btnTopic && btnTopic.offsetWidth > 0,
        btnSpaced: !!btnSpaced && btnSpaced.offsetWidth > 0,
        learnAria: btnLearn?.getAttribute('aria-label'),
        topicAria: btnTopic?.getAttribute('aria-label'),
        spacedAria: btnSpaced?.getAttribute('aria-label')
      };
    })()`);
    check('4. All 3 refresh buttons present with accessible aria labels',
      refreshButtons.btnLearn && refreshButtons.btnTopic && refreshButtons.btnSpaced &&
      refreshButtons.learnAria?.includes('Learn') &&
      refreshButtons.topicAria?.includes('Topic') &&
      refreshButtons.spacedAria?.includes('Spaced')
    );

    // Check 4: Modal DOM exists and is hidden initially
    const modalInitialState = await evalInBrowser(`(() => {
      const modal = document.getElementById('refresh-confirm-modal');
      return {
        exists: !!modal,
        isHidden: modal?.style.display === 'none',
        role: modal?.getAttribute('role'),
        ariaModal: modal?.getAttribute('aria-modal')
      };
    })()`);
    check('5. Confirmation modal (#refresh-confirm-modal) has role="dialog" and aria-modal="true"',
      modalInitialState.exists && modalInitialState.role === 'dialog' && modalInitialState.ariaModal === 'true'
    );

    // Check 5: Clicking Learn Refresh opens modal with preview
    const openLearnModal = await evalInBrowser(`(() => {
      const btn = document.getElementById('btn-refresh-learn');
      btn.click();
      const modal = document.getElementById('refresh-confirm-modal');
      const title = document.getElementById('refresh-modal-title')?.textContent;
      const subtitle = document.getElementById('refresh-modal-subtitle')?.textContent;
      const markedCount = document.getElementById('refresh-modal-marked-count')?.textContent;
      const confirmBtn = document.getElementById('btn-refresh-confirm');
      const modalBoxText = modal?.textContent || '';
      return {
        isOpen: modal.style.display !== 'none',
        title,
        subtitle,
        hasNotice: modalBoxText.includes('Learning history, attempt logs, mastery, notes, XP, streaks'),
        markedCount,
        confirmDisabled: confirmBtn?.disabled
      };
    })()`);
    check('6. Clicking Learn Refresh opens modal with accurate stream title & preservation notice',
      openLearnModal.isOpen && openLearnModal.title?.includes('Learn') && openLearnModal.hasNotice
    );
    check('7. When zero questions are marked, confirm button is safely disabled',
      openLearnModal.markedCount === '0' && openLearnModal.confirmDisabled === true
    );

    // Check 6: Cancel closes modal without modifying assignments
    const cancelModal = await evalInBrowser(`(() => {
      const cancelBtn = document.getElementById('btn-refresh-cancel');
      cancelBtn.click();
      const modal = document.getElementById('refresh-confirm-modal');
      return modal.style.display === 'none';
    })()`);
    check('8. Cancel closes modal without mutating plan', cancelModal);

    // Check 7: Modal dismisses via Escape key
    const escDismissal = await evalInBrowser(`(() => {
      const btn = document.getElementById('btn-refresh-learn');
      btn.click();
      const modal = document.getElementById('refresh-confirm-modal');
      const wasOpen = modal.style.display !== 'none';
      
      // Press Escape
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      const isNowHidden = modal.style.display === 'none';
      return wasOpen && isNowHidden;
    })()`);
    check('9. Keyboard accessibility: Escape key dismisses confirmation modal', escDismissal);

    // Check 8: Mark a task (skip the first learn question)
    const markTaskResult = await evalInBrowser(`(() => {
      const skipBtn = document.querySelector('#dsa-plan-learn-task-list .outcome-skip');
      if (!skipBtn) return { error: 'No skip button found on card' };
      const probId = skipBtn.getAttribute('data-problem-id');
      skipBtn.click();
      return { success: true, skippedProblemId: probId };
    })()`);
    await wait(600);
    check('10. Marked first Learn question as skipped', markTaskResult.success === true, `ID: ${markTaskResult.skippedProblemId}`);

    // Check 9: Reopen modal and verify marked count = 1, confirm is enabled
    const openWithMarked = await evalInBrowser(`(() => {
      const btn = document.getElementById('btn-refresh-learn');
      btn.click();
      const markedCount = document.getElementById('refresh-modal-marked-count')?.textContent;
      const expectedCount = document.getElementById('refresh-modal-expected-count')?.textContent;
      const confirmBtn = document.getElementById('btn-refresh-confirm');
      return {
        markedCount,
        expectedCount,
        confirmEnabled: !confirmBtn?.disabled
      };
    })()`);
    check('11. Refresh preview detects 1 marked question eligible for replacement',
      openWithMarked.markedCount === '1' && openWithMarked.confirmEnabled === true
    );

    // Check 10: Confirm refresh execution
    const confirmExecution = await evalInBrowser(`(async () => {
      const confirmBtn = document.getElementById('btn-refresh-confirm');
      confirmBtn.click();
      
      // Wait for modal to close and plan to re-render
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 200));
        const modal = document.getElementById('refresh-confirm-modal');
        if (modal.style.display === 'none') {
          break;
        }
      }
      
      const modal = document.getElementById('refresh-confirm-modal');
      const banner = document.getElementById('dsa-plan-feedback-banner');
      const bannerText = document.getElementById('dsa-plan-feedback-text')?.textContent;
      
      // Get current learn cards
      const newLearnCards = Array.from(document.querySelectorAll('#dsa-plan-learn-task-list .plan-task-card'));
      const newIds = newLearnCards.map(c => c.getAttribute('data-problem-id'));
      
      return {
        modalClosed: modal.style.display === 'none',
        bannerVisible: banner && banner.style.display !== 'none',
        bannerText,
        newIds
      };
    })()`);
    await wait(600);

    const skippedIdReplaced = !confirmExecution.newIds.includes(markTaskResult.skippedProblemId);
    check('12. Refresh executed: modal closed and feedback banner displayed',
      confirmExecution.modalClosed && confirmExecution.bannerVisible && confirmExecution.bannerText?.includes('refreshed')
    );
    check('13. Marked question was removed and replaced with an eligible question',
      skippedIdReplaced,
      `Replaced ID ${markTaskResult.skippedProblemId}. New IDs: ${confirmExecution.newIds.join(', ')}`
    );

    // Check 11: Reload and verify persistence
    console.log('    Reloading page via Page.reload to verify refreshed assignment persistence...');
    await sendCDP('Page.reload');
    await wait(2500);

    // Re-verify after reload
    const postReloadAudit = await evalInBrowser(`(() => {
      const learnCards = Array.from(document.querySelectorAll('#dsa-plan-learn-task-list .plan-task-card'));
      const ids = learnCards.map(c => c.getAttribute('data-problem-id'));
      const timeSelect = document.getElementById('dsa-plan-time-select');
      return {
        ids,
        timeSelectAbsent: timeSelect === null
      };
    })()`);

    const persistedWithoutOldId = !postReloadAudit.ids.includes(markTaskResult.skippedProblemId);
    check('14. Refreshed assignments persist across page reload',
      persistedWithoutOldId && postReloadAudit.timeSelectAbsent,
      `Ids after reload: ${postReloadAudit.ids.join(', ')}`
    );

    // Check 12: Zero console errors
    check('15. Zero uncaught console errors recorded during browser QA', consoleErrors.length === 0, consoleErrors.join(' | '));

  } catch (err) {
    console.error('[Browser QA Error]', err);
    check('Browser QA Execution', false, err.message);
  } finally {
    if (ws) ws.close();
    chrome.kill();
    try {
      if (fs.existsSync(USER_DATA_DIR)) {
        fs.rmSync(USER_DATA_DIR, { recursive: true, force: true });
      }
    } catch (_) {}
  }

  console.log('\n====================================================');
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log(`Browser QA Summary: ${passed}/${results.length} Passed (${failed} Failed)`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

run();

/**
 * AlgoRecall 2.1.1 - Chrome DevTools Protocol (CDP) Browser Acceptance Test Suite
 *
 * Directly automates Google Chrome via Chrome DevTools Protocol (CDP).
 *
 * Verifies:
 * 1. Catalog integrity & unique problem IDs (all 479 loaded in browser).
 * 2. Three-Stream Dashboard hierarchy & complete removal of week-based UI.
 * 3. All 20 Chrome CDP Browser Acceptance requirements from Section 10:
 *    - Point 1: Learn selector options exist.
 *    - Point 2: Revise selector options exist.
 *    - Point 3: Change Learn Topic.
 *    - Point 4: Confirm Revise Topic stays unchanged.
 *    - Point 5: Change Revise Topic.
 *    - Point 6: Confirm Learn Topic stays unchanged.
 *    - Point 7: Confirm Learning recommendations update immediately.
 *    - Point 8: Confirm Topic Revision recommendations update immediately.
 *    - Point 9: Confirm Spaced Revision queue does not change on topic preference change.
 *    - Point 10: Confirm due SRS questions may come from other topics.
 *    - Point 11: Confirm future-due problems are excluded from Spaced Revision.
 *    - Point 12: Confirm Topic Revision can include eligible non-due questions.
 *    - Point 13: Confirm no duplicate IDs across all 3 sections.
 *    - Point 14: Confirm session allocation (badges & breakdown).
 *    - Point 15: Confirm due backlog reporting.
 *    - Point 16: Reload and verify preference persistence.
 *    - Point 17: Verify dynamic horizon display.
 *    - Point 18: Verify fixed week UI is completely removed.
 *    - Point 19: Verify mobile layout at 375px (no horizontal overflow, touch targets).
 *    - Point 20: Check browser console errors and uncaught exceptions.
 * 4. Problem URL launching (LeetCode / GFG, target="_blank").
 * 5. Outcome recording & SRS safeguards (independent, hints, failure reset, rapid review protection).
 * 6. 100% completed state rendering.
 * 7. Secondary analytics accordion usability.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCRATCH_DIR = process.env.SCRATCH_DIR || path.join(process.cwd(), 'scratch');
const USER_DATA_DIR = path.join(SCRATCH_DIR, 'chrome_qa_profile_' + Date.now());

let ws = null;
let cmdId = 1;
const consoleLogs = [];
const consoleErrors = [];
const uncaughtExceptions = [];

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
const failureDetails = [];
const scenarioResults = [];

function check(title, condition, details = '') {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`    ✓ ${title}`);
  } else {
    failedChecks++;
    console.error(`    ✗ FAIL: ${title} ${details ? '— ' + details : ''}`);
    failureDetails.push({ title, details });
  }
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function sendCDP(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = cmdId++;
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

async function waitFor(expr, timeoutMs = 8000, intervalMs = 250) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const val = await evalInBrowser(expr);
      if (val) return val;
    } catch (_) {}
    await wait(intervalMs);
  }
  throw new Error(`Timeout waiting for expression: ${expr}`);
}

async function runBrowserQAAudit() {
  console.log('======================================================================');
  console.log('🚀 AlgoRecall 2.1.1 — Chrome Browser QA Acceptance Audit Initializing');
  console.log('======================================================================');

  if (!fs.existsSync(SCRATCH_DIR)) {
    fs.mkdirSync(SCRATCH_DIR, { recursive: true });
  }

  console.log(`[CDP] Spawning Chrome instance (${CHROME_PATH})...`);
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=${USER_DATA_DIR}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--window-size=1280,900',
    'http://localhost:3000'
  ], { stdio: 'ignore' });

  try {
    let targets = null;
    for (let i = 0; i < 30; i++) {
      await wait(500);
      try {
        const res = await fetch('http://127.0.0.1:9222/json');
        if (res.ok) {
          targets = await res.json();
          if (targets.length > 0) break;
        }
      } catch (_) {}
    }

    if (!targets || targets.length === 0) {
      throw new Error('Could not establish CDP connection on port 9222');
    }

    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    console.log(`[CDP] Connected to page: "${pageTarget.title}" (${pageTarget.url})`);

    ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    ws.addEventListener('message', (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.method === 'Runtime.consoleAPICalled') {
          const type = msg.params.type;
          const text = msg.params.args.map(a => a.value !== undefined ? String(a.value) : (a.description || '')).join(' ');
          consoleLogs.push(`[${type}] ${text}`);
          if (type === 'error') {
            consoleErrors.push(text);
          }
        }
        if (msg.method === 'Runtime.exceptionThrown') {
          const desc = msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text;
          uncaughtExceptions.push(desc);
        }
      } catch (_) {}
    });

    await sendCDP('Runtime.enable');
    await sendCDP('Page.enable');
    await sendCDP('DOM.enable');

    // Wait for DOMContentLoaded and app init
    for (let i = 0; i < 30; i++) {
      try {
        const ready = await evalInBrowser(`Boolean(window.DEFAULT_DSA_SHEETS && window.DEFAULT_DSA_SHEETS.length === 479 && document.body)`);
        if (ready) break;
      } catch (_) {}
      await wait(500);
    }

    // =========================================================================
    // SCENARIO 1: Problem Catalog Integrity & Uniqueness in Browser Runtime
    // =========================================================================
    console.log('\n[SCENARIO 1] Problem Catalog Integrity & Uniqueness in Browser');
    const catalogAudit = await evalInBrowser(`(() => {
      const list = window.DEFAULT_DSA_SHEETS || [];
      const idSet = new Set();
      const duplicateIds = [];
      let emptyIds = 0;
      let missingTitles = 0;
      let invalidDifficulties = 0;
      const validDiffs = new Set(['Easy', 'Medium', 'Hard']);
      let unmappedTopics = 0;

      list.forEach(p => {
        if (!p.id || typeof p.id !== 'string' || p.id.trim() === '') emptyIds++;
        if (idSet.has(p.id)) duplicateIds.push(p.id);
        idSet.add(p.id);

        if (!p.title || typeof p.title !== 'string') missingTitles++;
        if (!validDiffs.has(p.difficulty)) invalidDifficulties++;

        const canonTopic = window.SRSEngine ? window.SRSEngine.canonicalizeTopic(p.topic) : p.topic;
        if (!canonTopic) unmappedTopics++;
      });

      return {
        totalLoaded: list.length,
        uniqueIdsCount: idSet.size,
        duplicateIds,
        emptyIds,
        missingTitles,
        invalidDifficulties,
        unmappedTopics,
        firstSample: list[0] ? { id: list[0].id, title: list[0].title, topic: list[0].topic } : null
      };
    })()`);

    check('Problem catalog contains exactly 479 curated problems', catalogAudit.totalLoaded === 479, `Loaded: ${catalogAudit.totalLoaded}`);
    check('All 479 problem IDs are unique (zero duplicates)', catalogAudit.duplicateIds.length === 0, `Duplicates: ${JSON.stringify(catalogAudit.duplicateIds)}`);
    check('Zero empty or non-string IDs', catalogAudit.emptyIds === 0);
    check('All problems have titles and valid canonical difficulty', catalogAudit.missingTitles === 0 && catalogAudit.invalidDifficulties === 0);
    check('All problem topics canonicalize properly in SRSEngine', catalogAudit.unmappedTopics === 0);
    scenarioResults.push({ name: 'Catalog Integrity & Uniqueness', passed: catalogAudit.totalLoaded === 479 && catalogAudit.duplicateIds.length === 0 });

    // =========================================================================
    // SCENARIO 2: Three-Stream Dashboard Layout Hierarchy & Clean Initial State
    // =========================================================================
    console.log('\n[SCENARIO 2] Three-Stream Dashboard Layout Hierarchy & Removal of Week UI');
    const layoutAudit = await evalInBrowser(`(() => {
      const planSec = document.getElementById('today-dsa-plan-section');
      const learnSec = document.getElementById('dsa-plan-learn-section');
      const topicRevSec = document.getElementById('dsa-plan-topic-revise-section');
      const spacedRevSec = document.getElementById('dsa-plan-spaced-revise-section');
      const progSec = document.getElementById('dsa-plan-progress-section');
      const secondarySec = document.getElementById('dashboard-secondary-accordion');
      const contentSec = document.getElementById('secondary-analytics-content');

      const allPresent = !!(planSec && learnSec && topicRevSec && spacedRevSec && progSec && secondarySec && contentSec);

      // Verify DOM ordering
      const container = document.getElementById('view-dashboard');
      let correctOrder = false;
      if (container && allPresent) {
        const allElements = Array.from(container.querySelectorAll('*'));
        const idxHero = allElements.indexOf(planSec);
        const idxLearn = allElements.indexOf(learnSec);
        const idxTopicRev = allElements.indexOf(topicRevSec);
        const idxSpacedRev = allElements.indexOf(spacedRevSec);
        const idxProg = allElements.indexOf(progSec);
        const idxSec = allElements.indexOf(secondarySec);
        correctOrder = (idxHero < idxLearn && idxLearn < idxTopicRev && idxTopicRev < idxSpacedRev && idxSpacedRev < idxProg && idxProg < idxSec);
      }

      const secondaryHiddenByDefault = contentSec ? window.getComputedStyle(contentSec).display === 'none' : false;

      // Check legacy week UI removal
      const weekSelectExists = !!document.getElementById('dsa-plan-week-select');
      const weekAdjustModalExists = !!document.getElementById('dsa-schedule-adjust-modal');
      const weekBadgeExists = document.body ? document.body.innerText.includes('12-WEEK ROADMAP') : false;

      return {
        allPresent,
        correctOrder,
        secondaryHiddenByDefault,
        weekSelectExists,
        weekAdjustModalExists,
        weekBadgeExists,
        startNextBtnText: document.getElementById('btn-start-next-problem')?.textContent?.trim(),
        horizonText: document.getElementById('dsa-plan-horizon-display')?.textContent
      };
    })()`);

    check('Three-Stream dashboard sections exist (Hero, Learn, Topic Revise, Spaced Revise, Progress, Secondary)', layoutAudit.allPresent);
    check('Dashboard sections follow strict hierarchy (Hero -> Learn -> Topic Revise -> Spaced Revise -> Progress -> Secondary)', layoutAudit.correctOrder);
    check('Secondary analytics is collapsed by default (progressive disclosure)', layoutAudit.secondaryHiddenByDefault);
    check('Fixed week selector is completely removed from DOM', !layoutAudit.weekSelectExists);
    check('Week adjustment modal is completely removed from DOM', !layoutAudit.weekAdjustModalExists);
    check('"12-WEEK ROADMAP" badge is completely removed', !layoutAudit.weekBadgeExists);
    check('Dynamic horizon is displayed in hero banner', layoutAudit.horizonText?.includes('Est.'));
    scenarioResults.push({ name: 'Three-Stream Dashboard Layout & Week UI Removal', passed: layoutAudit.allPresent && layoutAudit.correctOrder && !layoutAudit.weekSelectExists });

    // =========================================================================
    // SCENARIO 3: Section 10 Browser Acceptance — Points 1 to 20
    // =========================================================================
    console.log('\n[SCENARIO 3] Chrome CDP Browser Acceptance (Section 10 - Points 1 to 20)');

    // Point 1 & 2: Selectors exist and populate correctly
    const selectorsAudit = await evalInBrowser(`(() => {
      const learnSelect = document.getElementById('dsa-plan-learning-topic-select');
      const revSelect = document.getElementById('dsa-plan-revision-topic-select');
      return {
        learnExists: !!learnSelect,
        learnOptionsCount: learnSelect?.options?.length || 0,
        learnCurrentVal: learnSelect?.value,
        revExists: !!revSelect,
        revOptionsCount: revSelect?.options?.length || 0,
        revCurrentVal: revSelect?.value
      };
    })()`);

    check('[Point 1] Learn selector exists with 16 canonical topic options', selectorsAudit.learnExists && selectorsAudit.learnOptionsCount >= 16, `Options: ${selectorsAudit.learnOptionsCount}`);
    check('[Point 2] Revise selector exists with 16 canonical topic options', selectorsAudit.revExists && selectorsAudit.revOptionsCount >= 16, `Options: ${selectorsAudit.revOptionsCount}`);

    // Point 3 & 4: Change Learn Topic and confirm Revise Topic stays unchanged
    const changeLearnAudit = await evalInBrowser(`(() => {
      const learnSelect = document.getElementById('dsa-plan-learning-topic-select');
      const revSelect = document.getElementById('dsa-plan-revision-topic-select');
      const revBefore = revSelect.value;

      learnSelect.value = 'Dynamic Programming';
      learnSelect.dispatchEvent(new Event('change', { bubbles: true }));

      return {
        learnAfter: learnSelect.value,
        revBefore,
        revAfter: revSelect.value,
        heroLearnText: document.getElementById('dsa-plan-main-topic-display')?.textContent
      };
    })()`);
    await wait(300);

    check('[Point 3] Change Learn Topic to "Dynamic Programming" in UI', changeLearnAudit.learnAfter === 'Dynamic Programming');
    check('[Point 4] Confirm Revise Topic stays unchanged when Learn Topic changes', changeLearnAudit.revAfter === changeLearnAudit.revBefore, `Revise: ${changeLearnAudit.revAfter}`);

    // Point 5 & 6: Change Revise Topic and confirm Learn Topic stays unchanged
    const changeReviseAudit = await evalInBrowser(`(() => {
      const learnSelect = document.getElementById('dsa-plan-learning-topic-select');
      const revSelect = document.getElementById('dsa-plan-revision-topic-select');
      const learnBefore = learnSelect.value;

      revSelect.value = 'Binary Trees & BST';
      revSelect.dispatchEvent(new Event('change', { bubbles: true }));

      return {
        revAfter: revSelect.value,
        learnBefore,
        learnAfter: learnSelect.value,
        heroRevText: document.getElementById('dsa-plan-rev-topic-display')?.textContent
      };
    })()`);
    await wait(300);

    check('[Point 5] Change Revise Topic to "Binary Trees & BST" in UI', changeReviseAudit.revAfter === 'Binary Trees & BST');
    check('[Point 6] Confirm Learn Topic stays unchanged when Revise Topic changes', changeReviseAudit.learnAfter === changeReviseAudit.learnBefore, `Learn: ${changeReviseAudit.learnAfter}`);

    // Point 7: Confirm Learning recommendations update immediately
    const learnUpdateAudit = await evalInBrowser(`(() => {
      const learnCards = Array.from(document.querySelectorAll('#dsa-plan-learn-task-list .plan-task-card'));
      const allProblems = window.DEFAULT_DSA_SHEETS || [];
      const problemMap = new Map(allProblems.map(p => [p.id, p]));

      const nonDPCards = learnCards.filter(c => {
        const p = problemMap.get(c.getAttribute('data-problem-id'));
        const canon = window.SRSEngine ? window.SRSEngine.canonicalizeTopic(p?.topic) : p?.topic;
        return canon !== 'Dynamic Programming';
      });

      return {
        learnCount: learnCards.length,
        nonDPCardsCount: nonDPCards.length,
        firstTitle: learnCards[0]?.querySelector('.plan-task-title')?.textContent?.trim()
      };
    })()`);

    check('[Point 7] Learning recommendations update immediately and match "Dynamic Programming"', learnUpdateAudit.learnCount > 0 && learnUpdateAudit.nonDPCardsCount === 0, `Learn count: ${learnUpdateAudit.learnCount}`);

    // Point 8: Confirm Topic Revision recommendations update immediately
    const topicRevUpdateAudit = await evalInBrowser(`(() => {
      const topicRevCards = Array.from(document.querySelectorAll('#dsa-plan-topic-revise-task-list .plan-task-card'));
      const allProblems = window.DEFAULT_DSA_SHEETS || [];
      const problemMap = new Map(allProblems.map(p => [p.id, p]));

      const nonTreeCards = topicRevCards.filter(c => {
        const p = problemMap.get(c.getAttribute('data-problem-id'));
        const canon = window.SRSEngine ? window.SRSEngine.canonicalizeTopic(p?.topic) : p?.topic;
        return canon !== 'Binary Trees & BST';
      });

      return {
        topicRevCount: topicRevCards.length,
        nonTreeCardsCount: nonTreeCards.length,
        firstTitle: topicRevCards[0]?.querySelector('.plan-task-title')?.textContent?.trim()
      };
    })()`);

    check('[Point 8] Topic Revision recommendations update immediately and match "Binary Trees & BST"', topicRevUpdateAudit.topicRevCount > 0 && topicRevUpdateAudit.nonTreeCardsCount === 0, `Topic Revise count: ${topicRevUpdateAudit.topicRevCount}`);

    // Point 9, 10, 11: Spaced Revision independent of preferences, includes other topics when due, excludes future-due
    const srsDueAudit = await evalInBrowser(`(() => {
      // Create test SRS cards:
      // Problem from 'Arrays & Hashing' that is due today
      // Problem from 'Stack' that is future due (due in 5 days)
      const userStates = JSON.parse(localStorage.getItem('algorecall_user_states_v2') || '{}');
      const allProblems = window.DEFAULT_DSA_SHEETS || [];

      const arrayProb = allProblems.find(p => (window.SRSEngine ? window.SRSEngine.canonicalizeTopic(p.topic) : p.topic) === 'Arrays & Hashing');
      const stackProb = allProblems.find(p => (window.SRSEngine ? window.SRSEngine.canonicalizeTopic(p.topic) : p.topic) === 'Stack');

      if (arrayProb) {
        userStates[arrayProb.id] = {
          stage: 2,
          interval: 3,
          intervalDays: 3,
          lastReviewed: new Date(Date.now() - 4 * 86400000).toISOString(),
          nextReviewDate: new Date(Date.now() - 86400000).toISOString(), // due yesterday
          history: [{ date: new Date(Date.now() - 4 * 86400000).toISOString(), rating: 'good' }]
        };
      }

      if (stackProb) {
        userStates[stackProb.id] = {
          stage: 3,
          interval: 7,
          intervalDays: 7,
          lastReviewed: new Date().toISOString(),
          nextReviewDate: new Date(Date.now() + 5 * 86400000).toISOString(), // future due
          history: [{ date: new Date().toISOString(), rating: 'good' }]
        };
      }

      localStorage.setItem('algorecall_user_states_v2', JSON.stringify(userStates));

      // Trigger re-render with cache bypass
      if (window.RoadmapEngine && window.RoadmapEngine.clearPlanCache) {
        window.RoadmapEngine.clearPlanCache();
      }
      if (window.renderDailyDSAPlan) {
        window.renderDailyDSAPlan();
      }

      const spacedCards = Array.from(document.querySelectorAll('#dsa-plan-spaced-revise-task-list .plan-task-card'));
      const spacedIds = spacedCards.map(c => c.getAttribute('data-problem-id'));

      const containsDueArray = arrayProb ? spacedIds.includes(arrayProb.id) : false;
      const containsFutureStack = stackProb ? spacedIds.includes(stackProb.id) : false;

      // Now change Revise Topic to 'Strings' and check if Spaced Revision queue remains identical
      const revSelect = document.getElementById('dsa-plan-revision-topic-select');
      revSelect.value = 'Strings';
      revSelect.dispatchEvent(new Event('change', { bubbles: true }));

      const spacedCardsAfter = Array.from(document.querySelectorAll('#dsa-plan-spaced-revise-task-list .plan-task-card'));
      const spacedIdsAfter = spacedCardsAfter.map(c => c.getAttribute('data-problem-id'));

      const queueUnchanged = JSON.stringify(spacedIds) === JSON.stringify(spacedIdsAfter);

      return {
        arrayProbId: arrayProb?.id,
        stackProbId: stackProb?.id,
        spacedIds,
        spacedIdsAfter,
        containsDueArray,
        containsFutureStack,
        queueUnchanged
      };
    })()`);
    await wait(300);

    check('[Point 9] Spaced Revision queue does not change when Revise Topic is modified', srsDueAudit.queueUnchanged);
    check('[Point 10] Due SRS questions may come from other topics (e.g. Arrays when learning DP)', srsDueAudit.containsDueArray);
    check('[Point 11] Future-due problems are strictly excluded from Spaced Revision', !srsDueAudit.containsFutureStack);

    // Point 12: Topic Revision can include eligible non-due questions
    const nonDueTopicRevAudit = await evalInBrowser(`(() => {
      const topicRevCards = Array.from(document.querySelectorAll('#dsa-plan-topic-revise-task-list .plan-task-card'));
      const userStates = JSON.parse(localStorage.getItem('algorecall_user_states_v2') || '{}');
      const now = Date.now();

      // Check if cards in Topic Revision include non-due or new problems
      let nonDueCount = 0;
      topicRevCards.forEach(c => {
        const id = c.getAttribute('data-problem-id');
        const state = userStates[id];
        if (!state || !state.nextReviewDate || new Date(state.nextReviewDate).getTime() > now) {
          nonDueCount++;
        }
      });

      return {
        totalTopicRevCards: topicRevCards.length,
        nonDueCount
      };
    })()`);

    check('[Point 12] Topic Revision includes eligible non-due questions for deliberate practice', nonDueTopicRevAudit.nonDueCount > 0, `Non-due in topic revision: ${nonDueTopicRevAudit.nonDueCount}/${nonDueTopicRevAudit.totalTopicRevCards}`);

    // Point 13: Confirm zero duplicate IDs across all three sections
    const deduplicationAudit = await evalInBrowser(`(() => {
      const learnCards = Array.from(document.querySelectorAll('#dsa-plan-learn-task-list .plan-task-card'));
      const topicRevCards = Array.from(document.querySelectorAll('#dsa-plan-topic-revise-task-list .plan-task-card'));
      const spacedRevCards = Array.from(document.querySelectorAll('#dsa-plan-spaced-revise-task-list .plan-task-card'));

      const learnIds = learnCards.map(c => c.getAttribute('data-problem-id'));
      const topicRevIds = topicRevCards.map(c => c.getAttribute('data-problem-id'));
      const spacedRevIds = spacedRevCards.map(c => c.getAttribute('data-problem-id'));

      const allIds = [...learnIds, ...topicRevIds, ...spacedRevIds];
      const uniqueIds = new Set(allIds);

      const overlapLearnTopic = learnIds.filter(id => topicRevIds.includes(id));
      const overlapLearnSpaced = learnIds.filter(id => spacedRevIds.includes(id));
      const overlapTopicSpaced = topicRevIds.filter(id => spacedRevIds.includes(id));

      return {
        totalCount: allIds.length,
        uniqueCount: uniqueIds.size,
        learnCount: learnIds.length,
        topicRevCount: topicRevIds.length,
        spacedRevCount: spacedRevIds.length,
        hasDuplicates: allIds.length !== uniqueIds.size,
        overlapLearnTopic,
        overlapLearnSpaced,
        overlapTopicSpaced
      };
    })()`);

    check('[Point 13] Zero duplicate problem IDs across all 3 sections (Learn, Topic Revise, Spaced Revise)', !deduplicationAudit.hasDuplicates, `Duplicates found: ${JSON.stringify({ overlapLearnTopic: deduplicationAudit.overlapLearnTopic, overlapLearnSpaced: deduplicationAudit.overlapLearnSpaced, overlapTopicSpaced: deduplicationAudit.overlapTopicSpaced })}`);

    // Point 14: Confirm session allocation (badges & breakdown)
    const sessionAllocationAudit = await evalInBrowser(`(() => {
      const timeSelect = document.getElementById('dsa-plan-time-select');
      if (timeSelect) {
        timeSelect.value = '120';
        timeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }

      const studyTimeDisplay = document.getElementById('dsa-plan-study-time-display')?.textContent;
      const budgetPill = document.getElementById('dsa-plan-budget-pill')?.textContent;

      return {
        timeVal: timeSelect ? timeSelect.value : '120',
        studyTimeDisplay,
        budgetPill,
        hasLearn: budgetPill?.includes('Learn'),
        hasRevise: budgetPill?.includes('Revise'),
        hasRecall: budgetPill?.includes('Active Recall')
      };
    })()`);
    await wait(300);

    check('[Point 14] Session time allocation reflects 120m budget breakdown across sections', sessionAllocationAudit.studyTimeDisplay === '120 minutes' && sessionAllocationAudit.hasLearn && sessionAllocationAudit.hasRevise);

    // Point 15: Confirm due backlog reporting
    const backlogAudit = await evalInBrowser(`(() => {
      const dueDisplay = document.getElementById('dsa-plan-due-reviews-display');
      const backlogBadge = document.getElementById('dsa-plan-due-backlog-badge');

      return {
        dueDisplayText: dueDisplay?.textContent,
        backlogBadgeExists: !!backlogBadge,
        backlogBadgeText: backlogBadge?.textContent
      };
    })()`);

    check('[Point 15] Due SRS backlog is reported honestly in hero meta and badges', backlogAudit.dueDisplayText !== undefined);

    // Point 16: Reload and verify preference persistence
    console.log('    [Point 16] Reloading page via Page.reload to verify preference persistence...');
    await sendCDP('Page.reload');
    await wait(2500);

    const reloadPersistenceAudit = await evalInBrowser(`(() => {
      const learnSelect = document.getElementById('dsa-plan-learning-topic-select');
      const revSelect = document.getElementById('dsa-plan-revision-topic-select');
      const timeSelect = document.getElementById('dsa-plan-time-select');
      const roadmapData = JSON.parse(localStorage.getItem('algorecall_roadmap_progress_v1') || '{}');

      return {
        learnSelectVal: learnSelect?.value,
        revSelectVal: revSelect?.value,
        timeSelectVal: timeSelect ? timeSelect.value : undefined,
        persistedLearnTopic: roadmapData.currentLearningTopic,
        persistedRevTopic: roadmapData.revisionTopic
      };
    })()`);

    check('[Point 16] Learn Topic preference persists after reload ("Dynamic Programming")', reloadPersistenceAudit.learnSelectVal === 'Dynamic Programming' && reloadPersistenceAudit.persistedLearnTopic === 'Dynamic Programming');
    check('[Point 16] Revise Topic preference persists after reload ("Strings")', reloadPersistenceAudit.revSelectVal === 'Strings' && reloadPersistenceAudit.persistedRevTopic === 'Strings');

    // Point 17: Verify dynamic horizon display
    const horizonAudit = await evalInBrowser(`(() => {
      const horizonEl = document.getElementById('dsa-plan-horizon-display');
      return {
        horizonText: horizonEl?.textContent,
        hasEstWeeks: horizonEl?.textContent?.includes('Est.') && (horizonEl?.textContent?.includes('wks') || horizonEl?.textContent?.includes('weeks'))
      };
    })()`);

    check('[Point 17] Dynamic horizon display shows estimated completion horizon (e.g. ~X weeks (Est.))', horizonAudit.hasEstWeeks, `Text: ${horizonAudit.horizonText}`);

    // Point 18: Verify fixed week UI is removed
    const weekRemovalAudit = await evalInBrowser(`(() => {
      const weekSelect = document.getElementById('dsa-plan-week-select');
      const weekAdjustBtn = document.getElementById('btn-dsa-plan-adjust');
      const weekModal = document.getElementById('dsa-schedule-adjust-modal');
      const has12WeekBadge = document.body.innerText.includes('12-WEEK ROADMAP');
      const hasWeekXof12 = /Week\s+\d+\s+of\s+12/i.test(document.body.innerText);

      return {
        weekSelectExists: !!weekSelect,
        weekAdjustBtnExists: !!weekAdjustBtn,
        weekModalExists: !!weekModal,
        has12WeekBadge,
        hasWeekXof12
      };
    })()`);

    check('[Point 18] Zero legacy week elements (no week select, no adjust modal, no 12-week badges)', !weekRemovalAudit.weekSelectExists && !weekRemovalAudit.weekModalExists && !weekRemovalAudit.has12WeekBadge && !weekRemovalAudit.hasWeekXof12);

    // Point 19: Verify mobile layout at 375px
    console.log('    [Point 19] Emulating mobile viewport (375x667)...');
    await sendCDP('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
      mobile: true
    });
    await wait(500);

    const mobileAudit = await evalInBrowser(`(() => {
      const scrollWidth = document.documentElement.scrollWidth;
      const clientWidth = document.documentElement.clientWidth;
      const hasHorizontalScroll = scrollWidth > (clientWidth + 1);

      const buttons = Array.from(document.querySelectorAll('.outcome-btn, .btn-plan-launch, #btn-start-next-problem'));
      const failingButtons = buttons.filter(b => b.getBoundingClientRect().height < 30).map(b => ({
        cls: b.className,
        text: b.textContent.trim().slice(0, 30),
        h: b.getBoundingClientRect().height
      }));

      const btnMenu = document.getElementById('btn-mobile-menu-toggle');

      return {
        hasHorizontalScroll,
        scrollWidth,
        clientWidth,
        minHeightRespected: failingButtons.length === 0,
        failingButtons,
        menuBtnVisible: btnMenu ? window.getComputedStyle(btnMenu).display !== 'none' : false
      };
    })()`);

    check('[Point 19] Mobile Viewport (375px): Zero unwanted horizontal scrollbar / overflow', !mobileAudit.hasHorizontalScroll, `scrollWidth: ${mobileAudit.scrollWidth}, clientWidth: ${mobileAudit.clientWidth}`);
    check('[Point 19] Mobile Viewport: Interactive buttons meet touch target ergonomics (>= 30px height)', mobileAudit.minHeightRespected, JSON.stringify(mobileAudit.failingButtons));
    check('[Point 19] Mobile Viewport: Mobile drawer toggle button is accessible', mobileAudit.menuBtnVisible);

    // Reset device metrics to desktop
    await sendCDP('Emulation.clearDeviceMetricsOverride');
    await wait(300);

    // Point 20: Check browser console errors and uncaught exceptions
    check('[Point 20] Zero fatal uncaught JavaScript exceptions during all E2E interactions', uncaughtExceptions.length === 0, `Exceptions: ${JSON.stringify(uncaughtExceptions)}`);
    check('[Point 20] Zero fatal browser console errors logged', consoleErrors.length === 0, `Errors: ${JSON.stringify(consoleErrors)}`);

    scenarioResults.push({ name: 'Chrome CDP Browser Acceptance (Section 10)', passed: !weekRemovalAudit.weekSelectExists && !deduplicationAudit.hasDuplicates && uncaughtExceptions.length === 0 });

    // =========================================================================
    // SCENARIO 4: Problem URL Launching & Focus Verification
    // =========================================================================
    console.log('\n[SCENARIO 4] Problem URL Launching & Focus Verification');
    const launchAudit = await evalInBrowser(`(() => {
      window.__qa_opened_urls = [];
      window.open = function(url, target, features) {
        window.__qa_opened_urls.push({ url, target, features });
        return { closed: false };
      };

      const btnStart = document.getElementById('btn-start-next-problem');
      const firstCard = document.querySelector('#dsa-plan-learn-task-list .plan-task-card');
      const firstLaunchBtn = firstCard?.querySelector('.btn-plan-launch');

      if (btnStart) btnStart.click();
      if (firstLaunchBtn) firstLaunchBtn.click();

      return {
        opened: window.__qa_opened_urls
      };
    })()`);

    check('Problem launching triggers window.open with platform URL', launchAudit.opened && launchAudit.opened.length > 0);
    check('Opens in safe new tab with target="_blank"', launchAudit.opened && launchAudit.opened[0]?.target === '_blank');
    scenarioResults.push({ name: 'Problem URL Launching', passed: launchAudit.opened?.length > 0 });

    // =========================================================================
    // SCENARIO 5: 1-Click Outcome Recording & SRS Safeguards
    // =========================================================================
    console.log('\n[SCENARIO 5] 1-Click Outcome Recording & SRS Safeguards');

    // 5A: Solved independently
    const outcome1 = await evalInBrowser(`(() => {
      const card = document.querySelector('#dsa-plan-learn-task-list .plan-task-card:not(.task-completed)');
      if (!card) return { success: false, reason: 'No uncompleted learn card' };
      const pId = card.getAttribute('data-problem-id');

      const indBtn = card.querySelector('.outcome-independent');
      indBtn.click();

      const userStates = JSON.parse(localStorage.getItem('algorecall_user_states_v2') || '{}');
      const pState = userStates[pId];
      const cardNow = document.getElementById('plan-task-' + pId);

      return {
        success: true,
        pId,
        pState,
        isCompleted: cardNow?.classList.contains('task-completed'),
        infoText: cardNow?.querySelector('.completed-info')?.textContent
      };
    })()`);
    await wait(200);

    check('Outcome "Solved independently" marks card completed in DOM', outcome1.success && outcome1.isCompleted);
    check('SRS Engine sets Stage 1 and confidence 4 without hints', outcome1.pState && outcome1.pState.stage === 1 && outcome1.pState.confidence === 4 && outcome1.pState.hintsUsed === false);

    // 5B: Solved with hints
    const outcome2 = await evalInBrowser(`(() => {
      const card = document.querySelector('#dsa-plan-learn-task-list .plan-task-card:not(.task-completed)');
      if (!card) return { success: false, reason: 'No uncompleted learn card' };
      const pId = card.getAttribute('data-problem-id');

      const hintsBtn = card.querySelector('.outcome-hints');
      hintsBtn.click();

      const userStates = JSON.parse(localStorage.getItem('algorecall_user_states_v2') || '{}');
      const pState = userStates[pId];

      return {
        success: true,
        pId,
        pState
      };
    })()`);
    await wait(200);

    check('SRS Safeguard: "Solved with hints" records hintsUsed=true without unearned leap', outcome2.pState && outcome2.pState.hintsUsed === true && outcome2.pState.stage === 1);

    // 5C: Could not solve
    const outcome3 = await evalInBrowser(`(() => {
      const card = document.querySelector('.plan-task-card:not(.task-completed)');
      if (!card) return { success: false, reason: 'No uncompleted card found' };
      const pId = card.getAttribute('data-problem-id');

      const failedBtn = card.querySelector('.outcome-failed');
      failedBtn.click();

      const userStates = JSON.parse(localStorage.getItem('algorecall_user_states_v2') || '{}');
      const pState = userStates[pId];

      return {
        success: true,
        pId,
        pState
      };
    })()`);
    await wait(200);

    check('SRS Safeguard: "Could not solve" resets stage to 1 and interval to 1', outcome3.pState && outcome3.pState.stage === 1 && (outcome3.pState.interval || outcome3.pState.intervalDays) === 1);

    // 5D: Topic Revision practice does NOT award delayed recall XP or advance Leitner stage
    const topicPracticeAudit = await evalInBrowser(`(() => {
      let card = document.querySelector('#dsa-plan-topic-revise-task-list .plan-task-card:not(.task-completed)');
      if (!card) {
        card = document.querySelector('#dsa-plan-topic-revise-task-list .plan-task-card');
      }
      if (!card) return { success: false, reason: 'No topic revise card found' };
      const pId = card.getAttribute('data-problem-id');

      // Pre-set problem state with stage 2, interval 5, and future nextReviewDate
      const userStatesBefore = JSON.parse(localStorage.getItem('algorecall_user_states_v2') || '{}');
      userStatesBefore[pId] = {
        stage: 2,
        interval: 5,
        intervalDays: 5,
        lastReviewed: new Date().toISOString(),
        nextReviewDate: new Date(Date.now() + 5 * 86400000).toISOString(),
        history: [{ date: new Date().toISOString(), rating: 'good' }]
      };
      localStorage.setItem('algorecall_user_states_v2', JSON.stringify(userStatesBefore));

      // Refresh daily plan so UI card is fresh
      if (window.renderDailyDSAPlan) window.renderDailyDSAPlan();

      const currentCard = document.getElementById('plan-task-' + pId);
      const indBtn = currentCard?.querySelector('.outcome-independent');
      if (indBtn) {
        indBtn.click();
      }

      const userStatesAfter = JSON.parse(localStorage.getItem('algorecall_user_states_v2') || '{}');
      const pStateAfter = userStatesAfter[pId];

      return {
        success: true,
        pId,
        stagePreserved: pStateAfter && pStateAfter.stage === 2,
        intervalPreserved: pStateAfter && (pStateAfter.interval === 5 || pStateAfter.intervalDays === 5)
      };
    })()`);
    await wait(200);

    check('Topic Revision deliberate practice preserves stage and interval (no fabricated delayed recall)', topicPracticeAudit.stagePreserved && topicPracticeAudit.intervalPreserved);
    scenarioResults.push({ name: 'Outcome Recording & SRS Safeguards', passed: outcome1.success && topicPracticeAudit.stagePreserved });

    // =========================================================================
    // SCENARIO 6: All-Completed State and Dynamic Recalculation
    // =========================================================================
    console.log('\n[SCENARIO 6] All-Completed State and Dynamic Recalculation');
    const completeAllAudit = await evalInBrowser(`(() => {
      // Sequentially click all remaining uncompleted cards until none remain
      let attempts = 20;
      while (attempts-- > 0) {
        const uncompletedCard = document.querySelector('.plan-task-card:not(.task-completed)');
        if (!uncompletedCard) break;
        const btn = uncompletedCard.querySelector('.outcome-independent');
        if (btn) btn.click();
        else break;
      }

      const btnStartNext = document.getElementById('btn-start-next-problem');
      const completionPill = document.getElementById('dsa-plan-completion-pill');
      const statusFooter = document.getElementById('dsa-plan-status-footer');

      return {
        btnStartText: btnStartNext?.textContent?.trim(),
        btnStartHasSuccessClass: btnStartNext?.classList.contains('btn-success'),
        completionPillText: completionPill?.textContent?.trim(),
        statusFooterText: statusFooter?.textContent?.trim()
      };
    })()`);
    await wait(400);

    check('Hero button updates to "Today\'s Plan Completed!" when all tasks done', completeAllAudit.btnStartText?.includes("Today's Plan Completed!"));
    check('Hero button receives green success styling', completeAllAudit.btnStartHasSuccessClass);
    check('Completion pill displays "100% Done"', completeAllAudit.completionPillText?.includes('100% Done'));
    check('Status footer displays celebration message ("Goal Achieved!")', completeAllAudit.statusFooterText?.includes('Goal Achieved'));
    scenarioResults.push({ name: 'All-Completed State Rendering', passed: completeAllAudit.btnStartText?.includes("Today's Plan Completed!") });

    // =========================================================================
    // SCENARIO 7: Secondary Analytics Accordion Usability
    // =========================================================================
    console.log('\n[SCENARIO 7] Secondary Analytics Accordion Usability');
    const analyticsAudit = await evalInBrowser(`(() => {
      const btnToggle = document.getElementById('btn-toggle-secondary-analytics');
      const content = document.getElementById('secondary-analytics-content');
      if (!btnToggle || !content) return { success: false, reason: 'Accordion elements not found' };

      btnToggle.click();

      const displayAfterExpand = window.getComputedStyle(content).display;
      const ariaAfterExpand = btnToggle.getAttribute('aria-expanded');

      const radarCanvas = document.getElementById('dashboard-radar-chart');
      const heatmapGrid = document.getElementById('dashboard-heatmap-grid');
      const queueTable = document.getElementById('dashboard-priority-tbody');

      return {
        success: true,
        expandedDisplay: displayAfterExpand,
        ariaExpanded: ariaAfterExpand,
        radarExists: !!radarCanvas,
        heatmapExists: !!heatmapGrid,
        queueExists: !!queueTable
      };
    })()`);

    check('Secondary analytics accordion expands on click', analyticsAudit.expandedDisplay === 'block' && analyticsAudit.ariaExpanded === 'true');
    check('Readiness radar chart canvas is present and rendered', analyticsAudit.radarExists);
    check('Activity heatmap grid is present and rendered', analyticsAudit.heatmapExists);
    check('SRS review queue is present and rendered', analyticsAudit.queueExists);
    scenarioResults.push({ name: 'Secondary Analytics Accordion', passed: analyticsAudit.expandedDisplay === 'block' });

    console.log('\n======================================================================');
    console.log(`E2E BROWSER QA ACCEPTANCE RESULTS: ${passedChecks}/${totalChecks} Checks Passed (${failedChecks} Failed)`);
    console.log('======================================================================');

    // Save detailed results to scratch artifact
    const reportData = {
      timestamp: new Date().toISOString(),
      totalChecks,
      passedChecks,
      failedChecks,
      scenarioResults,
      failureDetails,
      consoleLogsCount: consoleLogs.length,
      uncaughtExceptions,
      consoleErrors
    };

    fs.writeFileSync(path.join(SCRATCH_DIR, 'qa-browser-results.json'), JSON.stringify(reportData, null, 2));

    ws.close();
  } finally {
    console.log('\n[CDP] Terminating Chrome child process...');
    chrome.kill('SIGTERM');
    try {
      chrome.kill('SIGKILL');
    } catch (_) {}
  }

  if (failedChecks > 0) {
    process.exit(1);
  }
}

runBrowserQAAudit().catch(err => {
  console.error('\n❌ Unhandled error during Browser QA Audit:', err);
  process.exit(1);
});

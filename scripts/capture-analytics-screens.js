const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\Dell\\.gemini\\antigravity\\brain\\740364dc-bda1-48dc-991a-d91756730d40';
const rootDir = process.cwd();

function captureFile(tempFilename, hash, width, height, outFilename) {
  const filePath = path.join(rootDir, tempFilename);
  const fileUrl = 'file:///' + filePath.replace(/\\/g, '/') + (hash ? hash : '');
  const userDataDir = path.join(rootDir, 'scratch', `chrome_data_${width}_${Date.now()}`);
  const outPath = path.join(ARTIFACT_DIR, outFilename);

  try {
    execFileSync(CHROME_PATH, [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--virtual-time-budget=3000',
      '--run-all-compositor-stages-before-draw',
      `--user-data-dir=${userDataDir}`,
      `--window-size=${width},${height}`,
      `--screenshot=${outPath}`,
      fileUrl
    ]);
    if (fs.existsSync(outPath)) {
      console.log(`[Screenshot Saved] ${width}x${height} -> ${outPath} (${fs.statSync(outPath).size} bytes)`);
    } else {
      console.error(`[Error] File not created: ${outPath}`);
    }
  } catch (err) {
    console.error(`Failed to capture ${outFilename}:`, err.message);
  } finally {
    try { fs.unlinkSync(filePath); } catch (_) {}
  }
}

const baseHtml = fs.readFileSync('index.html', 'utf8');

// Switch active view from dashboard to progress view and readiness subview
let analyticsHtml = baseHtml;
analyticsHtml = analyticsHtml.replace('id="view-dashboard" class="view-section active"', 'id="view-dashboard" class="view-section"');
analyticsHtml = analyticsHtml.replace('id="view-progress" class="view-section"', 'id="view-progress" class="view-section active"');
analyticsHtml = analyticsHtml.replace('id="view-analytics" class="subview-section active"', 'id="view-analytics" class="subview-section active"');

// Seed populated data into Section 1 (Overview)
analyticsHtml = analyticsHtml.replace('id="analytics-unique-solved">0<', 'id="analytics-unique-solved">64<');
analyticsHtml = analyticsHtml.replace('id="analytics-coverage-badge">0% of Catalog<', 'id="analytics-coverage-badge">13% of Catalog<');
analyticsHtml = analyticsHtml.replace('id="analytics-unique-attempted">0<', 'id="analytics-unique-attempted">82<');
analyticsHtml = analyticsHtml.replace('id="analytics-attempted-badge">0% of Catalog<', 'id="analytics-attempted-badge">17% of Catalog<');
analyticsHtml = analyticsHtml.replace('id="analytics-sessions-initiated">0<', 'id="analytics-sessions-initiated">94<');
analyticsHtml = analyticsHtml.replace('id="analytics-verified-solved">0<', 'id="analytics-verified-solved">0<');
analyticsHtml = analyticsHtml.replace('id="analytics-roadmap-pct">0%<', 'id="analytics-roadmap-pct">15%<');
analyticsHtml = analyticsHtml.replace('id="analytics-roadmap-completed">0<', 'id="analytics-roadmap-completed">18<');
analyticsHtml = analyticsHtml.replace('id="analytics-roadmap-total">0<', 'id="analytics-roadmap-total">120<');
analyticsHtml = analyticsHtml.replace('id="analytics-current-streak">0<', 'id="analytics-current-streak">12<');
analyticsHtml = analyticsHtml.replace('id="analytics-learning-time">0h 0m<', 'id="analytics-learning-time">14h 35m<');
analyticsHtml = analyticsHtml.replace('id="analytics-time-events-count">0<', 'id="analytics-time-events-count">82<');

// Seed Section 2 (Recommendations)
const recommendationsSeed = `
  <div class="recommendation-card priority-high" data-priority="5">
    <div class="rec-card-header">
      <div class="rec-badge-title">
        <span class="badge badge-hard">Critical Retention</span>
        <h4 class="rec-card-title">Clear 3 Overdue Spaced Revisions</h4>
      </div>
      <span class="rec-priority-label">High Priority</span>
    </div>
    <p class="rec-reason">Retention decay accelerates exponentially when reviews exceed scheduled spaced intervals.</p>
    <div class="rec-evidence-block">
      <span class="rec-evidence-icon"><i class="fa-solid fa-chart-line"></i></span>
      <span class="rec-evidence-text"><strong>Evidence:</strong> 3 problems are overdue (LRU Cache, Subtree of Another Tree, Clone Graph).</span>
    </div>
    <div class="rec-action-footer">
      <span class="rec-action-note">Estimated session time: 15 minutes.</span>
      <button type="button" class="btn btn-primary btn-sm btn-rec-action" data-destination="#/revision">
        Go to Revision Center <i class="fa-solid fa-arrow-right" style="margin-left:4px;"></i>
      </button>
    </div>
  </div>

  <div class="recommendation-card priority-high" data-priority="4">
    <div class="rec-card-header">
      <div class="rec-badge-title">
        <span class="badge badge-hard">Targeted Practice</span>
        <h4 class="rec-card-title">Strengthen Dynamic Programming (25% Accuracy)</h4>
      </div>
      <span class="rec-priority-label">High Priority</span>
    </div>
    <p class="rec-reason">High hint dependency and repeat failures detected in 1D/2D memoization transitions.</p>
    <div class="rec-evidence-block">
      <span class="rec-evidence-icon"><i class="fa-solid fa-chart-line"></i></span>
      <span class="rec-evidence-text"><strong>Evidence:</strong> 4 weak problems flagged across 8 attempted (Coin Change, Longest Increasing Subsequence).</span>
    </div>
    <div class="rec-action-footer">
      <span class="rec-action-note">Recommended action: Review pattern transitions on foundational stepping stones.</span>
      <button type="button" class="btn btn-primary btn-sm btn-rec-action" data-destination="#/problems">
        Explore Dynamic Programming <i class="fa-solid fa-arrow-right" style="margin-left:4px;"></i>
      </button>
    </div>
  </div>

  <div class="recommendation-card priority-medium" data-priority="3">
    <div class="rec-card-header">
      <div class="rec-badge-title">
        <span class="badge badge-medium">Curriculum</span>
        <h4 class="rec-card-title">Continue 120-Day Dual-Stream Roadmap (Day 10)</h4>
      </div>
      <span class="rec-priority-label">Recommended</span>
    </div>
    <p class="rec-reason">Keep pace with Stream A (Binary Trees & BST) and Stream B (Arrays & Hashing foundation revision).</p>
    <div class="rec-evidence-block">
      <span class="rec-evidence-icon"><i class="fa-solid fa-chart-line"></i></span>
      <span class="rec-evidence-text"><strong>Evidence:</strong> 18 of 120 tasks completed (15% overall progress).</span>
    </div>
    <div class="rec-action-footer">
      <span class="rec-action-note">Today's load: 2 new problems (45m).</span>
      <button type="button" class="btn btn-primary btn-sm btn-rec-action" data-destination="#/dashboard">
        Continue Learning <i class="fa-solid fa-arrow-right" style="margin-left:4px;"></i>
      </button>
    </div>
  </div>
`;

analyticsHtml = analyticsHtml.replace(
  '<div id="analytics-recommendations-container" style="display:flex; flex-direction:column; gap:12px;">\n            <div style="padding:20px; text-align:center; color:var(--text-muted); font-size:13px;">Analyzing your learning activity...</div>\n          </div>',
  `<div id="analytics-recommendations-container" style="display:flex; flex-direction:column; gap:12px;">${recommendationsSeed}</div>`
);

// Seed Section 3 (Topic Matrix)
analyticsHtml = analyticsHtml.replace('id="analytics-top-strengths">Calculating...<', 'id="analytics-top-strengths">Arrays & Hashing (88%), Binary Search (80%), Binary Trees & BST (76%)<');
analyticsHtml = analyticsHtml.replace('id="analytics-top-weaknesses">Calculating...<', 'id="analytics-top-weaknesses">Dynamic Programming (25%), Graphs (33%)<');

const topicMatrixSeed = `
  <div class="topic-health-card">
    <div class="topic-card-top">
      <span class="topic-card-title">Arrays & Hashing</span>
      <span class="badge badge-easy">Proficient 🟢</span>
    </div>
    <div style="display:flex; justify-content:space-between; font-size:12px; color:var(--text-muted); margin-top:4px;">
      <span>Accuracy: <strong style="color:var(--text-main);">88%</strong></span>
      <span>22 / 40 Solved</span>
    </div>
    <div class="mastery-progress-bar" style="margin: 6px 0;">
      <div class="mastery-fill" style="width: 55%;"></div>
    </div>
    <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; color:var(--text-dim);">
      <span>🏆 12 Mastered</span>
      <span class="conf-badge conf-4" style="font-size:10px;">★ 4.6/5 Conf</span>
    </div>
    <button type="button" class="btn btn-secondary btn-xs btn-topic-matrix-practice" data-topic="Arrays & Hashing" style="margin-top:8px; width:100%; justify-content:center; font-size:11px; padding:5px 8px;">
      <i class="fa-solid fa-play"></i> Practice Arrays & Hashing
    </button>
  </div>

  <div class="topic-health-card">
    <div class="topic-card-top">
      <span class="topic-card-title">Binary Trees & BST</span>
      <span class="badge badge-easy">Proficient 🟢</span>
    </div>
    <div style="display:flex; justify-content:space-between; font-size:12px; color:var(--text-muted); margin-top:4px;">
      <span>Accuracy: <strong style="color:var(--text-main);">76%</strong></span>
      <span>19 / 49 Solved</span>
    </div>
    <div class="mastery-progress-bar" style="margin: 6px 0;">
      <div class="mastery-fill" style="width: 39%;"></div>
    </div>
    <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; color:var(--text-dim);">
      <span>🏆 9 Mastered</span>
      <span class="conf-badge conf-4" style="font-size:10px;">★ 4.2/5 Conf</span>
    </div>
    <button type="button" class="btn btn-secondary btn-xs btn-topic-matrix-practice" data-topic="Binary Trees & BST" style="margin-top:8px; width:100%; justify-content:center; font-size:11px; padding:5px 8px;">
      <i class="fa-solid fa-play"></i> Practice Binary Trees & BST
    </button>
  </div>

  <div class="topic-health-card">
    <div class="topic-card-top">
      <span class="topic-card-title">Dynamic Programming</span>
      <span class="badge badge-hard">Needs Attention ⚠️</span>
    </div>
    <div style="display:flex; justify-content:space-between; font-size:12px; color:var(--text-muted); margin-top:4px;">
      <span>Accuracy: <strong style="color:var(--text-main);">25%</strong></span>
      <span>4 / 60 Solved</span>
    </div>
    <div class="mastery-progress-bar" style="margin: 6px 0;">
      <div class="mastery-fill" style="width: 7%; background:var(--accent-red);"></div>
    </div>
    <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; color:var(--text-dim);">
      <span>🏆 1 Mastered</span>
      <span>🔔 3 Due</span>
    </div>
    <div style="font-size:11px; color:var(--accent-red); margin-top:4px;"><i class="fa-solid fa-triangle-exclamation"></i> 4 weak problems</div>
    <button type="button" class="btn btn-secondary btn-xs btn-topic-matrix-practice" data-topic="Dynamic Programming" style="margin-top:8px; width:100%; justify-content:center; font-size:11px; padding:5px 8px;">
      <i class="fa-solid fa-play"></i> Practice Dynamic Programming
    </button>
  </div>

  <div class="topic-health-card">
    <div class="topic-card-top">
      <span class="topic-card-title">Binary Search</span>
      <span class="badge badge-easy">Proficient 🟢</span>
    </div>
    <div style="display:flex; justify-content:space-between; font-size:12px; color:var(--text-muted); margin-top:4px;">
      <span>Accuracy: <strong style="color:var(--text-main);">80%</strong></span>
      <span>11 / 30 Solved</span>
    </div>
    <div class="mastery-progress-bar" style="margin: 6px 0;">
      <div class="mastery-fill" style="width: 37%;"></div>
    </div>
    <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; color:var(--text-dim);">
      <span>🏆 6 Mastered</span>
      <span class="conf-badge conf-4" style="font-size:10px;">★ 4.3/5 Conf</span>
    </div>
    <button type="button" class="btn btn-secondary btn-xs btn-topic-matrix-practice" data-topic="Binary Search" style="margin-top:8px; width:100%; justify-content:center; font-size:11px; padding:5px 8px;">
      <i class="fa-solid fa-play"></i> Practice Binary Search
    </button>
  </div>
`;

analyticsHtml = analyticsHtml.replace(
  '<div class="topic-matrix-grid" id="topic-matrix-container">\n            <!-- Topic Cards injected via renderAnalytics() -->\n          </div>',
  `<div class="topic-matrix-grid" id="topic-matrix-container">${topicMatrixSeed}</div>`
);

// Seed Section 4 (Retention & Revision)
analyticsHtml = analyticsHtml.replace('id="analytics-srs-due">0<', 'id="analytics-srs-due">6<');
analyticsHtml = analyticsHtml.replace('id="analytics-srs-overdue">0<', 'id="analytics-srs-overdue">3<');
analyticsHtml = analyticsHtml.replace('id="analytics-srs-completed">0<', 'id="analytics-srs-completed">48<');
analyticsHtml = analyticsHtml.replace('id="analytics-srs-recall-rate">--%<', 'id="analytics-srs-recall-rate">84.5%<');
analyticsHtml = analyticsHtml.replace('id="analytics-srs-simple-count">0<', 'id="analytics-srs-simple-count">28<');
analyticsHtml = analyticsHtml.replace('id="analytics-srs-medium-count">0<', 'id="analytics-srs-medium-count">14<');
analyticsHtml = analyticsHtml.replace('id="analytics-srs-hard-count">0<', 'id="analytics-srs-hard-count">6<');
analyticsHtml = analyticsHtml.replace('id="analytics-srs-failed-count">0<', 'id="analytics-srs-failed-count">4<');
analyticsHtml = analyticsHtml.replace('id="analytics-stage-0-count">0<', 'id="analytics-stage-0-count">397<');
analyticsHtml = analyticsHtml.replace('id="analytics-stage-1-count">0<', 'id="analytics-stage-1-count">18<');
analyticsHtml = analyticsHtml.replace('id="analytics-stage-2-count">0<', 'id="analytics-stage-2-count">24<');
analyticsHtml = analyticsHtml.replace('id="analytics-stage-3-count">0<', 'id="analytics-stage-3-count">16<');
analyticsHtml = analyticsHtml.replace('id="analytics-stage-4-count">0<', 'id="analytics-stage-4-count">24<');

// Seed Section 5 (Problem-Solving Performance)
analyticsHtml = analyticsHtml.replace('id="analytics-outcome-sample-size">0 evaluated attempts<', 'id="analytics-outcome-sample-size">82 evaluated attempts<');
analyticsHtml = analyticsHtml.replace('id="analytics-ind-count">0<', 'id="analytics-ind-count">51<');
analyticsHtml = analyticsHtml.replace('id="analytics-ind-pct">0%<', 'id="analytics-ind-pct">62.2%<');
analyticsHtml = analyticsHtml.replace('id="analytics-ast-count">0<', 'id="analytics-ast-count">18<');
analyticsHtml = analyticsHtml.replace('id="analytics-ast-pct">0%<', 'id="analytics-ast-pct">22.0%<');
analyticsHtml = analyticsHtml.replace('id="analytics-rev-count">0<', 'id="analytics-rev-count">8<');
analyticsHtml = analyticsHtml.replace('id="analytics-rev-pct">0%<', 'id="analytics-rev-pct">9.8%<');
analyticsHtml = analyticsHtml.replace('id="analytics-fail-count">0<', 'id="analytics-fail-count">5<');
analyticsHtml = analyticsHtml.replace('id="analytics-fail-pct">0%<', 'id="analytics-fail-pct">6.1%<');
analyticsHtml = analyticsHtml.replace('id="analytics-independence-rate">--%<', 'id="analytics-independence-rate">62.2%<');
analyticsHtml = analyticsHtml.replace('id="analytics-independence-caption">No terminal evaluations in window<', 'id="analytics-independence-caption">51 of 82 solves unassisted<');
analyticsHtml = analyticsHtml.replace('id="analytics-hint-dependency">N/A<', 'id="analytics-hint-dependency">1.4 hints<');
analyticsHtml = analyticsHtml.replace('id="analytics-diff-easy-stat">0 attempts (0 solved)<', 'id="analytics-diff-easy-stat">32 attempts (30 solved)<');
analyticsHtml = analyticsHtml.replace('id="analytics-diff-med-stat">0 attempts (0 solved)<', 'id="analytics-diff-med-stat">38 attempts (26 solved)<');
analyticsHtml = analyticsHtml.replace('id="analytics-diff-hard-stat">0 attempts (0 solved)<', 'id="analytics-diff-hard-stat">12 attempts (8 solved)<');

// Seed Section 6 (Mock Interview Performance)
analyticsHtml = analyticsHtml.replace('id="analytics-mock-completed">0<', 'id="analytics-mock-completed">3<');
analyticsHtml = analyticsHtml.replace('id="analytics-mock-abandoned">0<', 'id="analytics-mock-abandoned">1<');
analyticsHtml = analyticsHtml.replace('id="analytics-mock-completion-rate">0%<', 'id="analytics-mock-completion-rate">75%<');
analyticsHtml = analyticsHtml.replace('id="analytics-mock-avg-score">N/A<', 'id="analytics-mock-avg-score">16.5/20<');
analyticsHtml = analyticsHtml.replace('id="analytics-mock-best-score">N/A<', 'id="analytics-mock-best-score">19.0/20<');
analyticsHtml = analyticsHtml.replace('id="analytics-mock-review-req">0<', 'id="analytics-mock-review-req">1<');

const mockGradeSeed = `
  <span class="badge badge-accent" style="font-size:11px;">Strong Hire: 1</span>
  <span class="badge badge-easy" style="font-size:11px;">Solid Hire: 2</span>
  <span class="badge badge-medium" style="font-size:11px;">Borderline: 0</span>
  <span class="badge badge-hard" style="font-size:11px;">Needs Practice: 1</span>
`;
analyticsHtml = analyticsHtml.replace(
  '<div id="analytics-mock-grade-distribution" style="display:flex; gap:8px; flex-wrap:wrap;">\n                <span class="badge badge-secondary" style="font-size:11px;">No mocks recorded yet</span>\n              </div>',
  `<div id="analytics-mock-grade-distribution" style="display:flex; gap:8px; flex-wrap:wrap;">${mockGradeSeed}</div>`
);

const mockTopicsSeed = `
  <span class="badge badge-secondary" style="font-size:11px; margin-right:4px; margin-bottom:4px;">Binary Trees & BST</span>
  <span class="badge badge-secondary" style="font-size:11px; margin-right:4px; margin-bottom:4px;">Dynamic Programming</span>
  <span class="badge badge-secondary" style="font-size:11px; margin-right:4px; margin-bottom:4px;">Graphs</span>
`;
analyticsHtml = analyticsHtml.replace('id="analytics-mock-topics-list">None recorded yet<', `id="analytics-mock-topics-list">${mockTopicsSeed}<`);

// Seed Section 7 (Activity & Consistency)
analyticsHtml = analyticsHtml.replace('id="analytics-consistency-score">0% (0/30d)<', 'id="analytics-consistency-score">87% (26/30d)<');
analyticsHtml = analyticsHtml.replace('id="analytics-account-scope-badge">Current Scope<', 'id="analytics-account-scope-badge">User: alice-1234...<');

// Seed Heatmap with active cells
let heatmapCells = '';
for (let i = 0; i < 52 * 7; i++) {
  const count = (i % 5 === 0) ? 4 : ((i % 3 === 0) ? 2 : ((i % 7 === 0) ? 1 : 0));
  const levelClass = count >= 4 ? 'level-4' : (count >= 2 ? 'level-2' : (count >= 1 ? 'level-1' : ''));
  heatmapCells += `<div class="heatmap-cell ${levelClass}"></div>`;
}
analyticsHtml = analyticsHtml.replace(
  '<div class="heatmap-grid" id="analytics-heatmap-grid" style="display:grid; grid-auto-flow:column; grid-template-rows:repeat(7, 12px); gap:3px;">\n                <!-- Cells injected via renderActivityHeatmap() -->\n              </div>',
  `<div class="heatmap-grid" id="analytics-heatmap-grid" style="display:grid; grid-auto-flow:column; grid-template-rows:repeat(7, 12px); gap:3px;">${heatmapCells}</div>`
);

// 1. Capture Desktop View
fs.writeFileSync(path.join(rootDir, 'temp_analytics_desktop.html'), analyticsHtml, 'utf8');
captureFile('temp_analytics_desktop.html', '#/progress', 1280, 1100, 'analytics_overview_desktop.png');

// 2. Capture Mobile View
fs.writeFileSync(path.join(rootDir, 'temp_analytics_mobile.html'), analyticsHtml, 'utf8');
captureFile('temp_analytics_mobile.html', '#/progress', 390, 844, 'analytics_mobile.png');

// 3. Capture Metric Registry Modal View
let modalHtml = analyticsHtml;
// Open modal-metric-registry by adding 'open' class and display:flex
modalHtml = modalHtml.replace(
  '<div class="modal-backdrop" id="modal-metric-registry" style="display:none;">',
  '<div class="modal-backdrop open" id="modal-metric-registry" style="display:flex;">'
);

// Seed Metric Registry cards
const registrySeed = `
  <div class="metric-registry-card">
    <div class="metric-registry-header">
      <h4 class="metric-registry-title">Verified Solved Problems</h4>
      <span class="badge badge-secondary" style="font-family:monospace; font-size:11px;">verifiedSolvedProblems</span>
    </div>
    <p class="metric-registry-definition">Problems confirmed solved through automated external judging or test runner execution.</p>
    <div class="metric-registry-grid">
      <div class="metric-meta-item">
        <span class="metric-meta-label">Source of Truth</span>
        <span class="metric-meta-val">External automated judge verification records</span>
      </div>
      <div class="metric-meta-item">
        <span class="metric-meta-label">Denominator</span>
        <span class="metric-meta-val">uniqueProblemsAttempted</span>
      </div>
      <div class="metric-meta-item">
        <span class="metric-meta-label">Inclusion Rules</span>
        <span class="metric-meta-val">Explicitly verified evaluation events with verified: true</span>
      </div>
      <div class="metric-meta-item">
        <span class="metric-meta-label">Exclusion Rules</span>
        <span class="metric-meta-val">Self-reported checkmarks or manual ratings</span>
      </div>
      <div class="metric-meta-item">
        <span class="metric-meta-label">Null Handling</span>
        <span class="metric-meta-val">Returns 0 in offline/client-only environment</span>
      </div>
      <div class="metric-meta-item">
        <span class="metric-meta-label">Deduplication</span>
        <span class="metric-meta-val">Unique canonical problem IDs</span>
      </div>
    </div>
    <div class="metric-registry-limitation">
      <i class="fa-solid fa-triangle-exclamation" style="margin-right:6px;"></i>
      <span><strong>Limitation:</strong> Browser client does not run untrusted arbitrary code; verified solves are strictly 0 without external judging.</span>
    </div>
  </div>

  <div class="metric-registry-card">
    <div class="metric-registry-header">
      <h4 class="metric-registry-title">Recall Success Rate</h4>
      <span class="badge badge-secondary" style="font-family:monospace; font-size:11px;">recallSuccessRate</span>
    </div>
    <p class="metric-registry-definition">Percentage of completed SRS spaced repetition reviews rated simple, medium, or hard (non-failed).</p>
    <div class="metric-registry-grid">
      <div class="metric-meta-item">
        <span class="metric-meta-label">Source of Truth</span>
        <span class="metric-meta-val">userStates[id].history[].rating</span>
      </div>
      <div class="metric-meta-item">
        <span class="metric-meta-label">Denominator</span>
        <span class="metric-meta-val">Total completed SRS review events in window</span>
      </div>
      <div class="metric-meta-item">
        <span class="metric-meta-label">Inclusion Rules</span>
        <span class="metric-meta-val">Historical reviews with rating in [simple, medium, hard, failed]</span>
      </div>
      <div class="metric-meta-item">
        <span class="metric-meta-label">Exclusion Rules</span>
        <span class="metric-meta-val">Mock interview answers, roadmap assignments without review</span>
      </div>
      <div class="metric-meta-item">
        <span class="metric-meta-label">Null Handling</span>
        <span class="metric-meta-val">Returns null (insufficient data) if 0 reviews exist</span>
      </div>
      <div class="metric-meta-item">
        <span class="metric-meta-label">Deduplication</span>
        <span class="metric-meta-val">Event-level timestamps</span>
      </div>
    </div>
    <div class="metric-registry-limitation">
      <i class="fa-solid fa-triangle-exclamation" style="margin-right:6px;"></i>
      <span><strong>Limitation:</strong> Subjective recall rating provided by learner.</span>
    </div>
  </div>

  <div class="metric-registry-card">
    <div class="metric-registry-header">
      <h4 class="metric-registry-title">Cognitive Independence Rate</h4>
      <span class="badge badge-secondary" style="font-family:monospace; font-size:11px;">cognitiveIndependenceRate</span>
    </div>
    <p class="metric-registry-definition">Percentage of terminal problem solves completed independently without progressive hints or solution reveals.</p>
    <div class="metric-registry-grid">
      <div class="metric-meta-item">
        <span class="metric-meta-label">Source of Truth</span>
        <span class="metric-meta-val">TrainerEvents & userStates[id].history[].hintsUsed</span>
      </div>
      <div class="metric-meta-item">
        <span class="metric-meta-label">Denominator</span>
        <span class="metric-meta-val">Total terminal solves in window</span>
      </div>
      <div class="metric-meta-item">
        <span class="metric-meta-label">Inclusion Rules</span>
        <span class="metric-meta-val">Solves with 0 hints consumed and simple rating</span>
      </div>
      <div class="metric-meta-item">
        <span class="metric-meta-label">Exclusion Rules</span>
        <span class="metric-meta-val">In-progress drafts, paused sessions, failed attempts</span>
      </div>
      <div class="metric-meta-item">
        <span class="metric-meta-label">Null Handling</span>
        <span class="metric-meta-val">Returns null if 0 terminal attempts</span>
      </div>
      <div class="metric-meta-item">
        <span class="metric-meta-label">Deduplication</span>
        <span class="metric-meta-val">Deduplicated across trainer events and SRS history by eventId</span>
      </div>
    </div>
  </div>
`;

modalHtml = modalHtml.replace(
  '<div style="display:flex; flex-direction:column; gap:12px;" id="metric-registry-cards-container">\n        <!-- Dynamically populated from AnalyticsEngine.METRIC_REGISTRY -->\n      </div>',
  `<div style="display:flex; flex-direction:column; gap:12px; max-height:60vh; overflow-y:auto;" id="metric-registry-cards-container">${registrySeed}</div>`
);

fs.writeFileSync(path.join(rootDir, 'temp_analytics_modal.html'), modalHtml, 'utf8');
captureFile('temp_analytics_modal.html', '#/progress', 1280, 950, 'analytics_metric_registry_modal.png');

console.log('Finished capturing all Progress & Analytics visual artifacts!');

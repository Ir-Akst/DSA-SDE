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

// 1. Library Overview Desktop & Mobile
// In order to show active cards and history, we can seed the DOM directly in temp html
let libraryHtml = baseHtml;
libraryHtml = libraryHtml.replace(
  '<tbody id="mock-history-tbody">\n                  <tr>\n                    <td colspan="7" style="text-align:center; padding:20px; color:var(--text-dim);">No mock interview\n                      rounds completed yet. Start your first session above!</td>\n                  </tr>\n                </tbody>',
  `<tbody id="mock-history-tbody">
    <tr>
      <td><strong style="color:var(--text-main); font-size:12.5px;">11/3/2026</strong></td>
      <td><span class="badge badge-srs-upcoming" style="font-size:11px;">FAANG Standard Round</span></td>
      <td>42m / 45m</td>
      <td><strong style="font-size:14px; color:#10b981;">88%</strong></td>
      <td><span class="badge badge-easy">Outstanding (A+) - Strong Hire</span></td>
      <td><span class="badge" style="background:rgba(16,185,129,0.15); color:#34d399; border:1px solid rgba(16,185,129,0.3);">Completed</span></td>
      <td style="text-align:right;">
        <button type="button" class="btn btn-secondary btn-xs"><i class="fa-solid fa-file-lines"></i> Review</button>
      </td>
    </tr>
    <tr>
      <td><strong style="color:var(--text-main); font-size:12.5px;">11/2/2026</strong></td>
      <td><span class="badge badge-srs-upcoming" style="font-size:11px;">Senior SDE Full Loop</span></td>
      <td>28m / 60m</td>
      <td><strong style="font-size:14px; color:#f43f5e;">0%</strong></td>
      <td><span class="badge badge-hard">Abandoned</span></td>
      <td><span class="badge" style="background:rgba(244,63,94,0.15); color:#f87171; border:1px solid rgba(244,63,94,0.3);">Abandoned</span></td>
      <td style="text-align:right;">
        <button type="button" class="btn btn-secondary btn-xs"><i class="fa-solid fa-file-lines"></i> Review</button>
      </td>
    </tr>
  </tbody>`
);
libraryHtml = libraryHtml.replace('<div class="stat-value" id="mock-stat-total">0</div>', '<div class="stat-value" id="mock-stat-total">2</div>');
libraryHtml = libraryHtml.replace('<div class="stat-value" id="mock-stat-completed">0</div>', '<div class="stat-value" id="mock-stat-completed">1</div>');
libraryHtml = libraryHtml.replace('<div class="stat-value" id="mock-stat-abandoned">0</div>', '<div class="stat-value" id="mock-stat-abandoned">1</div>');
libraryHtml = libraryHtml.replace('<div class="stat-value" id="mock-stat-avg-score">-%</div>', '<div class="stat-value" id="mock-stat-avg-score">88%</div>');

fs.writeFileSync(path.join(rootDir, 'temp_mock_lib.html'), libraryHtml, 'utf8');
captureFile('temp_mock_lib.html', '#/mock', 1280, 950, 'mock_interview_library_desktop.png');

fs.writeFileSync(path.join(rootDir, 'temp_mock_mobile.html'), libraryHtml, 'utf8');
captureFile('temp_mock_mobile.html', '#/mock', 390, 844, 'mock_interview_mobile.png');

// 2. Cockpit Workspace Desktop
let cockpitHtml = baseHtml.replace(
  '<div class="test-cockpit" id="mock-interview-cockpit" style="display:none;">',
  '<div class="test-cockpit open" id="mock-interview-cockpit" style="display:flex !important; position:fixed; inset:0; z-index:9999;">'
);
cockpitHtml = cockpitHtml.replace(
  '<h2 style="font-size:20px; font-weight:700; margin-bottom:4px;" id="mock-active-title">Question Title</h2>',
  '<h2 style="font-size:20px; font-weight:700; margin-bottom:4px;" id="mock-active-title">Group Anagrams</h2>'
);
cockpitHtml = cockpitHtml.replace(
  '<div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;" id="mock-active-badges"></div>',
  `<div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;" id="mock-active-badges">
    <span class="badge badge-medium">Medium</span>
    <span class="badge badge-srs-upcoming">Arrays & Hashing</span>
    <span class="badge" style="background:rgba(255,255,255,0.06); color:var(--text-dim); font-size:11px;">Self-Reported Evaluation</span>
  </div>`
);
cockpitHtml = cockpitHtml.replace(
  '<!-- Dynamically populated -->\n        </div>\n\n        <div>\n          <label style="font-size:12.5px; font-weight:600; color:var(--text-muted); display:block; margin-bottom:4px;">\n            Solution Code',
  `<div><strong style="color:#fff;">Interview Objective:</strong> Implement an optimal algorithmic solution for <strong>Group Anagrams</strong> (Medium).</div>
   <div style="margin-top:6px; color:var(--text-muted); font-size:12px;"><strong>Topic:</strong> Arrays & Hashing • <strong>Pattern:</strong> Hash Map Frequency Vector</div>
   <div style="margin-top:8px; font-size:11.5px; color:#38bdf8; background:rgba(6,182,212,0.06); padding:8px 12px; border-radius:6px; border:1px solid rgba(6,182,212,0.15);">
     <i class="fa-solid fa-circle-info"></i> Open the verified LeetCode link above to review constraints and run test cases on the platform runner. Complete your approach, solution, edge cases, and complexity analysis below for rubric grading.
   </div>
 </div>

 <div>
   <label style="font-size:12.5px; font-weight:600; color:var(--text-muted); display:block; margin-bottom:4px;">
     Solution Code`
);
cockpitHtml = cockpitHtml.replace(
  'placeholder="// Write your solution logic or dry run here..."></textarea>',
  `placeholder="// Write your solution logic or dry run here...">function groupAnagrams(strs) {
  const map = new Map();
  for (const s of strs) {
    const count = new Array(26).fill(0);
    for (const c of s) count[c.charCodeAt(0) - 97]++;
    const key = count.join('#');
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(s);
  }
  return Array.from(map.values());
}</textarea>`
);
cockpitHtml = cockpitHtml.replace(
  'placeholder="Explain your algorithmic strategy, key observations, and edge-case handling..."></textarea>',
  `placeholder="Explain your algorithmic strategy...">Character frequency counting with 26-element array converted to composite hash key to achieve O(N * K) time and optimal space.</textarea>`
);
cockpitHtml = cockpitHtml.replace(
  '<input type="text" id="mock-input-time" class="filter-select" placeholder="e.g. O(N) using two pointers"',
  '<input type="text" id="mock-input-time" class="filter-select" value="O(N * K) where N is strings count and K is max length"'
);
cockpitHtml = cockpitHtml.replace(
  '<input type="text" id="mock-input-space" class="filter-select" placeholder="e.g. O(1) auxiliary space"',
  '<input type="text" id="mock-input-space" class="filter-select" value="O(N * K) auxiliary storage in map"'
);
cockpitHtml = cockpitHtml.replace(
  '<!-- Left Question List -->\n      <div class="test-sidebar" id="mock-question-list">\n        <!-- Dynamically populated -->\n      </div>',
  `<!-- Left Question List -->
   <div class="test-sidebar" id="mock-question-list">
     <div class="test-q-item active">
       <div style="display:flex; justify-content:space-between; align-items:center;">
         <strong style="font-size:13px; color:var(--text-main);">Q1: Group Anagrams</strong>
       </div>
       <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2px;">
         <span class="badge badge-medium" style="font-size:10px;">Medium</span>
         <span class="badge" style="font-size:10px; background:rgba(16,185,129,0.15); color:#34d399;">Solved</span>
       </div>
     </div>
     <div class="test-q-item">
       <div style="display:flex; justify-content:space-between; align-items:center;">
         <strong style="font-size:13px; color:var(--text-main);">Q2: Trapping Rain Water</strong>
         <i class="fa-solid fa-flag" style="color:#facc15; font-size:11px;"></i>
       </div>
       <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2px;">
         <span class="badge badge-hard" style="font-size:10px;">Hard</span>
         <span class="badge" style="font-size:10px; background:rgba(59,130,246,0.15); color:#60a5fa;">In Progress</span>
       </div>
     </div>
   </div>`
);

fs.writeFileSync(path.join(rootDir, 'temp_mock_cockpit.html'), cockpitHtml, 'utf8');
captureFile('temp_mock_cockpit.html', '#/mock', 1280, 950, 'mock_interview_workspace_desktop.png');

// 3. Report Modal Desktop
let reportHtml = baseHtml.replace(
  '<div class="modal-backdrop" id="mock-report-modal">',
  '<div class="modal-backdrop open" id="mock-report-modal" style="display:flex !important; z-index:9999;">'
);
reportHtml = reportHtml.replace(
  '<div style="font-size:44px; font-weight:800; color:var(--primary);" id="mock-report-score">0%</div>',
  '<div style="font-size:44px; font-weight:800; color:#10b981;" id="mock-report-score">88%</div>'
);
reportHtml = reportHtml.replace(
  '<div style="font-size:16px; font-weight:700; margin-top:4px;" id="mock-report-grade">Strong Hire</div>',
  '<div style="font-size:16px; font-weight:700; margin-top:4px;" id="mock-report-grade">Outstanding (A+) - Strong Hire</div>'
);
reportHtml = reportHtml.replace(
  '<p style="font-size:12.5px; color:var(--text-muted); margin-top:4px;" id="mock-report-track-info">-</p>',
  '<p style="font-size:12.5px; color:var(--text-muted); margin-top:4px;" id="mock-report-track-info">FAANG Standard Round • 42 mins elapsed of 45m</p>'
);
reportHtml = reportHtml.replace(
  '<!-- Populated dynamically with question cards and follow-up actions -->',
  `<div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:14px 16px;">
    <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px;">
      <div>
        <strong style="font-size:14px; color:var(--text-main);">Group Anagrams</strong>
        <span style="font-size:11.5px; color:var(--text-dim); display:block; margin-top:2px;">
          Arrays & Hashing • Medium • Self-Rating: <strong>Simple</strong>
        </span>
      </div>
      <div style="text-align:right;">
        <strong style="font-size:16px; color:#10b981;">92 / 100</strong>
      </div>
    </div>
    <div style="margin-top:8px; font-size:12px; color:var(--text-muted); background:rgba(0,0,0,0.2); padding:8px 10px; border-radius:4px; font-family:'JetBrains Mono', monospace;">
      Approach: Character frequency counting with 26-element array converted to composite hash key...
    </div>
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-top:12px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.05);">
      <div style="display:flex; gap:6px; flex-wrap:wrap;">
        <a href="https://leetcode.com/problems/group-anagrams/" target="_blank" class="btn btn-secondary btn-xs"><i class="fa-solid fa-arrow-up-right-from-square"></i> Open LeetCode</a>
        <button type="button" class="btn btn-secondary btn-xs"><i class="fa-solid fa-bookmark"></i> Bookmarked</button>
        <button type="button" class="btn btn-secondary btn-xs" style="color:#10b981; border-color:rgba(16,185,129,0.4);"><i class="fa-solid fa-check"></i> Queued for Revision</button>
      </div>
      <button type="button" class="btn btn-secondary btn-xs"><i class="fa-solid fa-pen"></i> Add Mistake Note</button>
    </div>
  </div>
  <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:14px 16px;">
    <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px;">
      <div>
        <strong style="font-size:14px; color:var(--text-main);">Trapping Rain Water</strong>
        <span style="font-size:11.5px; color:var(--text-dim); display:block; margin-top:2px;">
          Two Pointers • Hard • Self-Rating: <strong>Medium</strong> • <span style="color:#facc15;"><i class="fa-solid fa-flag"></i> Flagged for Review</span>
        </span>
      </div>
      <div style="text-align:right;">
        <strong style="font-size:16px; color:#10b981;">84 / 100</strong>
        <span style="font-size:10.5px; color:#f43f5e; display:block;">-5 hint penalty</span>
      </div>
    </div>
    <div style="margin-top:8px; font-size:12px; color:var(--text-muted); background:rgba(0,0,0,0.2); padding:8px 10px; border-radius:4px; font-family:'JetBrains Mono', monospace;">
      Approach: Two-pointer technique maintaining maxLeft and maxRight boundaries...
    </div>
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-top:12px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.05);">
      <div style="display:flex; gap:6px; flex-wrap:wrap;">
        <a href="https://leetcode.com/problems/trapping-rain-water/" target="_blank" class="btn btn-secondary btn-xs"><i class="fa-solid fa-arrow-up-right-from-square"></i> Open LeetCode</a>
        <button type="button" class="btn btn-secondary btn-xs"><i class="fa-regular fa-bookmark"></i> Bookmark</button>
        <button type="button" class="btn btn-secondary btn-xs"><i class="fa-solid fa-clock-rotate-left"></i> Schedule SRS Revision</button>
      </div>
      <button type="button" class="btn btn-secondary btn-xs"><i class="fa-solid fa-pen"></i> Add Mistake Note</button>
    </div>
  </div>`
);

fs.writeFileSync(path.join(rootDir, 'temp_mock_report.html'), reportHtml, 'utf8');
captureFile('temp_mock_report.html', '#/mock', 1280, 950, 'mock_interview_results_desktop.png');

console.log('Finished capturing all mock screens successfully.');

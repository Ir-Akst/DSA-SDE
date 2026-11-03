const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\Dell\\.gemini\\antigravity\\brain\\740364dc-bda1-48dc-991a-d91756730d40';

// Prepare 3 test pages in scratch/ that load the app with specific states:
const scratchDir = path.join(process.cwd(), 'scratch');
if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });

// 1. Filtered view page
const filteredHtml = `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0; url=../index.html#/revision">
  <script>
    // Pre-populate realistic review data
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const overdueDate = new Date(today);
    overdueDate.setDate(overdueDate.getDate() - 3);
    const overdueStr = overdueDate.toISOString().split('T')[0];

    const testStates = {
      'prob-196-invert-binary-tree': {
        id: 'prob-196-invert-binary-tree',
        lastReviewed: overdueStr,
        nextReviewDate: overdueStr,
        stage: 1,
        confidence: 2,
        lastRating: 'failed',
        isBookmarked: true
      },
      'prob-207-course-schedule': {
        id: 'prob-207-course-schedule',
        lastReviewed: overdueStr,
        nextReviewDate: todayStr,
        stage: 2,
        confidence: 3,
        lastRating: 'medium'
      },
      'prob-322-coin-change': {
        id: 'prob-322-coin-change',
        lastReviewed: todayStr,
        nextReviewDate: todayStr,
        stage: 3,
        confidence: 4,
        lastRating: 'simple',
        history: [{ date: today.toISOString(), rating: 'medium', confidence: 3 }]
      }
    };
    try {
      localStorage.setItem('algorecall_user_states_v2', JSON.stringify(testStates));
    } catch (e) {}
  </script>
</head>
<body></body>
</html>`;
fs.writeFileSync(path.join(scratchDir, 'test-revision-state.html'), filteredHtml);

// Create script injector for active session
const activeSessionHtml = `<!DOCTYPE html>
<html>
<head>
  <style>
    /* Ensure modal displays instantly */
    iframe { width: 100vw; height: 100vh; border: none; }
  </style>
</head>
<body style="margin:0; overflow:hidden;">
  <iframe id="app-frame" src="../index.html#/revision"></iframe>
  <script>
    const iframe = document.getElementById('app-frame');
    iframe.onload = () => {
      setTimeout(() => {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        const win = iframe.contentWindow;
        if (win.launchActiveRecallSession) {
          win.launchActiveRecallSession(['prob-196-invert-binary-tree', 'prob-207-course-schedule']);
          setTimeout(() => {
            // Reveal progressive hint 1
            const hintBtn = doc.getElementById('btn-reveal-hint');
            if (hintBtn) hintBtn.click();
          }, 300);
        }
      }, 500);
    };
  </script>
</body>
</html>`;
fs.writeFileSync(path.join(scratchDir, 'view-active-session.html'), activeSessionHtml);

// Create script injector for completed session
const completedSessionHtml = `<!DOCTYPE html>
<html>
<head>
  <style>
    iframe { width: 100vw; height: 100vh; border: none; }
  </style>
</head>
<body style="margin:0; overflow:hidden;">
  <iframe id="app-frame" src="../index.html#/revision"></iframe>
  <script>
    const iframe = document.getElementById('app-frame');
    iframe.onload = () => {
      setTimeout(() => {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        const modal = doc.getElementById('modal-active-recall-session');
        const activeContainer = doc.getElementById('recall-session-active-container');
        const summaryContainer = doc.getElementById('recall-session-summary');
        if (modal && activeContainer && summaryContainer) {
          activeContainer.style.display = 'none';
          summaryContainer.style.display = 'block';
          doc.getElementById('summary-problems-reviewed').textContent = '4';
          doc.getElementById('summary-retained-count').textContent = '3';
          doc.getElementById('summary-xp-earned').textContent = '+60';
          modal.style.display = 'flex';
        }
      }, 500);
    };
  </script>
</body>
</html>`;
fs.writeFileSync(path.join(scratchDir, 'view-completed-session.html'), completedSessionHtml);

function captureHtml(filePath, width, height, filename) {
  const userDataDir = path.join(scratchDir, `temp_chrome_${width}_${Date.now()}`);
  const outPath = path.join(ARTIFACT_DIR, filename);
  const targetUrl = 'file:///' + filePath.replace(/\\/g, '/');
  try {
    execFileSync(CHROME_PATH, [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--virtual-time-budget=4000',
      '--run-all-compositor-stages-before-draw',
      `--user-data-dir=${userDataDir}`,
      `--window-size=${width},${height}`,
      `--screenshot=${outPath}`,
      targetUrl
    ]);
    if (fs.existsSync(outPath)) {
      console.log(`[Screenshot Saved] ${width}x${height} -> ${outPath} (${fs.statSync(outPath).size} bytes)`);
    }
  } catch (err) {
    console.error(`Failed to capture ${filename}:`, err.message);
  }
}

// 1. Populated & Filtered Revision Queue Desktop
captureHtml(path.join(scratchDir, 'test-revision-state.html'), 1280, 950, 'revision_queue_filtered_desktop.png');

// 2. Active Recall Session Modal
captureHtml(path.join(scratchDir, 'view-active-session.html'), 1280, 950, 'revision_active_session_desktop.png');

// 3. Session Completed Summary Modal
captureHtml(path.join(scratchDir, 'view-completed-session.html'), 1280, 950, 'revision_session_completed_desktop.png');


const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\Dell\\.gemini\\antigravity\\brain\\740364dc-bda1-48dc-991a-d91756730d40';

const origHtml = fs.readFileSync('index.html', 'utf8');
const modalOpenHtml = origHtml.replace(
  'id="modal-dash-quick-notes" class="modal-backdrop" style="display: none;"',
  'id="modal-dash-quick-notes" class="modal-backdrop open" style="display: flex !important;"'
);

const tempHtmlPath = path.join(process.cwd(), 'temp_modal_preview.html');
fs.writeFileSync(tempHtmlPath, modalOpenHtml, 'utf8');

const basePath = 'file:///' + tempHtmlPath.replace(/\\/g, '/');
const userDataDir = path.join(process.cwd(), 'scratch', `temp_chrome_modal_${Date.now()}`);
const outPath = path.join(ARTIFACT_DIR, 'dashboard_quick_notes_modal.png');

try {
  execFileSync(CHROME_PATH, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--virtual-time-budget=4000',
    '--run-all-compositor-stages-before-draw',
    `--user-data-dir=${userDataDir}`,
    `--window-size=1280,950`,
    `--screenshot=${outPath}`,
    basePath + '#/dashboard'
  ]);
  console.log(`[Screenshot Saved] -> ${outPath} (${fs.statSync(outPath).size} bytes)`);
} catch (e) {
  console.error('Failed to capture modal screenshot:', e.message);
} finally {
  try { fs.unlinkSync(tempHtmlPath); } catch (_) {}
}

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\Dell\\.gemini\\antigravity\\brain\\740364dc-bda1-48dc-991a-d91756730d40';
const rootDir = process.cwd();

function captureFile(tempFilename, width, height, outFilename) {
  const filePath = path.join(rootDir, tempFilename);
  const fileUrl = 'file:///' + filePath.replace(/\\/g, '/');
  const userDataDir = path.join(rootDir, 'scratch', `chrome_data_${width}_${Date.now()}`);
  const outPath = path.join(ARTIFACT_DIR, outFilename);

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

// Inject script to switch to settings view immediately on load
const switchScript = `
<script>
window.addEventListener('load', () => {
  setTimeout(() => {
    if (typeof switchView === 'function') {
      switchView('settings');
    }
  }, 300);
});
</script>
`;

let desktopHtml = baseHtml.replace('</body>', switchScript + '\n</body>');
const tempDesktop = 'temp_settings_desktop.html';
fs.writeFileSync(tempDesktop, desktopHtml, 'utf8');
captureFile(tempDesktop, 1280, 1100, 'settings_desktop.png');

// Mobile settings
let mobileHtml = baseHtml.replace('</body>', switchScript + '\n</body>');
const tempMobile = 'temp_settings_mobile.html';
fs.writeFileSync(tempMobile, mobileHtml, 'utf8');
captureFile(tempMobile, 390, 844, 'settings_mobile.png');

// Reset Confirmation Modal
const modalScript = `
<script>
window.addEventListener('load', () => {
  setTimeout(() => {
    if (typeof switchView === 'function') {
      switchView('settings');
      const resetModal = document.getElementById('modal-confirm-reset');
      if (resetModal) resetModal.classList.add('open');
      const inputReset = document.getElementById('input-confirm-reset-text');
      if (inputReset) inputReset.value = 'RESET';
      const btnExec = document.getElementById('btn-execute-reset');
      if (btnExec) btnExec.disabled = false;
    }
  }, 300);
});
</script>
`;

let modalHtml = baseHtml.replace('</body>', modalScript + '\n</body>');
const tempModal = 'temp_settings_modal.html';
fs.writeFileSync(tempModal, modalHtml, 'utf8');
captureFile(tempModal, 1280, 950, 'settings_reset_modal.png');

console.log('Finished capturing refreshed Settings screens!');

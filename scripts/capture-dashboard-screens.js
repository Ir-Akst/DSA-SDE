const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\Dell\\.gemini\\antigravity\\brain\\740364dc-bda1-48dc-991a-d91756730d40';
const basePath = 'file:///' + path.join(process.cwd(), 'index.html').replace(/\\/g, '/');

function capture(urlHash, width, height, filename) {
  const userDataDir = path.join(process.cwd(), 'scratch', `temp_chrome_${width}_${Date.now()}`);
  const outPath = path.join(ARTIFACT_DIR, filename);
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
      basePath + urlHash
    ]);
    if (fs.existsSync(outPath)) {
      console.log(`[Screenshot Saved] ${width}x${height} -> ${outPath} (${fs.statSync(outPath).size} bytes)`);
    } else {
      console.error(`[Error] File not created: ${outPath}`);
    }
  } catch (err) {
    console.error(`Failed to capture ${filename}:`, err.message);
  }
}

// 1. Dashboard Command Center Desktop (1280x1100 to show dual-stream & revision queue)
capture('#/dashboard', 1280, 1100, 'dashboard_command_center_desktop.png');

// 2. Dashboard Command Center Mobile (390x844)
capture('#/dashboard', 390, 844, 'dashboard_command_center_mobile.png');

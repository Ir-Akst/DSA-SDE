const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\Dell\\.gemini\\antigravity\\brain\\740364dc-bda1-48dc-991a-d91756730d40';
const htmlFileUrl = 'file:///' + path.join(process.cwd(), 'index.html').replace(/\\/g, '/') + '#/problems';

function capture(width, height, filename) {
  const userDataDir = path.join(process.cwd(), 'scratch', `temp_chrome_${width}_${Date.now()}`);
  const outPath = path.join(ARTIFACT_DIR, filename);
  try {
    execFileSync(CHROME_PATH, [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      `--user-data-dir=${userDataDir}`,
      `--window-size=${width},${height}`,
      `--screenshot=${outPath}`,
      htmlFileUrl
    ]);
    console.log(`[Screenshot Saved] ${width}x${height} -> ${outPath} (${fs.statSync(outPath).size} bytes)`);
  } catch (err) {
    console.error(`Failed to capture ${filename}:`, err.message);
  }
}

capture(1280, 900, 'problems_library_desktop.png');
capture(390, 844, 'problems_library_mobile.png');

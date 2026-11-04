const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\Dell\\.gemini\\antigravity\\brain\\740364dc-bda1-48dc-991a-d91756730d40';
const basePath = 'file:///' + path.join(process.cwd(), 'index.html').replace(/\\/g, '/');

function capture(urlHash, width, height, filename) {
  const userDataDir = path.join(process.cwd(), 'scratch', `temp_chrome_final_${Date.now()}_${Math.random().toString(36).slice(2)}`);
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
      console.log(`✓ Captured ${filename} (${width}x${height})`);
    } else {
      console.log(`✗ Failed to generate ${filename}`);
    }
  } catch (err) {
    console.error(`Error capturing ${filename}:`, err.message);
  } finally {
    try {
      if (fs.existsSync(userDataDir)) {
        fs.rmSync(userDataDir, { recursive: true, force: true });
      }
    } catch (_) {}
  }
}

const views = [
  { hash: '#roadmap', desktop: 'roadmap_standardized_desktop.png', mobile: 'roadmap_standardized_mobile.png' },
  { hash: '#problems', desktop: 'problems_standardized_desktop.png', mobile: 'problems_standardized_mobile.png' },
  { hash: '#mock', desktop: 'mock_standardized_desktop.png', mobile: 'mock_standardized_mobile.png' },
  { hash: '#progress', desktop: 'progress_standardized_desktop.png', mobile: 'progress_standardized_mobile.png' },
  { hash: '#settings', desktop: 'settings_standardized_desktop.png', mobile: 'settings_standardized_mobile.png' }
];

console.log('Capturing desktop (1280x800) and mobile (390x844) standardized views...');
for (const v of views) {
  capture(v.hash, 1280, 800, v.desktop);
  capture(v.hash, 390, 844, v.mobile);
}
console.log('Capture complete!');

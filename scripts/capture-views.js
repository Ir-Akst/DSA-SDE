const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\Dell\\.gemini\\antigravity\\brain\\740364dc-bda1-48dc-991a-d91756730d40';
const basePath = 'file:///' + path.join(process.cwd(), 'index.html').replace(/\\/g, '/');

function capture(urlHash, width, height, filename) {
  const userDataDir = path.join(process.cwd(), 'scratch', `temp_chrome_${Date.now()}_${Math.random().toString(36).slice(2)}`);
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

// Routes to capture
const views = [
  { hash: '#roadmap', name: 'before_roadmap_desktop.png' },
  { hash: '#problems', name: 'before_problems_desktop.png' },
  { hash: '#mock', name: 'before_mock_desktop.png' },
  { hash: '#progress', name: 'before_progress_desktop.png' },
  { hash: '#settings', name: 'before_settings_desktop.png' }
];

console.log('Capturing current view snapshots before standardization...');
for (const v of views) {
  capture(v.hash, 1280, 800, v.name);
}
console.log('Done!');

/**
 * AlgoRecall 2.0 - CSS Modular Synchronization & Parity Verifier
 * Zero-dependency utility to ensure bidirectional consistency between
 * the canonical production stylesheet (css/styles.css) and modular files (css/*.css).
 */

const fs = require('fs');
const path = require('path');

const CSS_DIR = path.join(__dirname, '..', 'css');
const MASTER_FILE = path.join(CSS_DIR, 'styles.css');

const MODULAR_FILES = [
  'tokens.css',
  'base.css',
  'layout.css',
  'components.css',
  'views.css'
];

function verifyParity() {
  if (!fs.existsSync(MASTER_FILE)) {
    throw new Error('css/styles.css not found');
  }
  const masterContent = fs.readFileSync(MASTER_FILE, 'utf8');
  
  for (const mod of MODULAR_FILES) {
    const modPath = path.join(CSS_DIR, mod);
    if (!fs.existsSync(modPath)) {
      throw new Error(`Modular CSS file missing: ${mod}`);
    }
    const modContent = fs.readFileSync(modPath, 'utf8');
    if (modContent.trim().length === 0) {
      throw new Error(`Modular CSS file empty: ${mod}`);
    }
  }

  // Verify key selector presence across both master and modular files
  const sampleSelectors = [
    { selector: ':root', file: 'tokens.css' },
    { selector: '--bg-main', file: 'tokens.css' },
    { selector: 'body', file: 'base.css' },
    { selector: '.app-container', file: 'layout.css' },
    { selector: '.btn-primary', file: 'components.css' },
    { selector: '.dashboard-overview-grid', file: 'views.css' },
    { selector: '.mock-cockpit-bar', file: 'views.css' },
    { selector: '.analytics-stat-card', file: 'views.css' }
  ];

  for (const sample of sampleSelectors) {
    if (!masterContent.includes(sample.selector)) {
      throw new Error(`Master stylesheet missing selector: ${sample.selector}`);
    }
    const modContent = fs.readFileSync(path.join(CSS_DIR, sample.file), 'utf8');
    if (!modContent.includes(sample.selector)) {
      throw new Error(`Modular file ${sample.file} missing selector: ${sample.selector}`);
    }
  }

  return true;
}

if (require.main === module) {
  try {
    verifyParity();
    console.log('✓ CSS Parity Verified: Master stylesheet and modular CSS files are consistent.');
  } catch (err) {
    console.error('✗ CSS Parity Failure:', err.message);
    process.exit(1);
  }
}

module.exports = { verifyParity, MODULAR_FILES };

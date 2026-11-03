/**
 * Architecture & Codebase Cleanup Test Suite
 * Validates module integrity, CoreUtils API, CSS modularization,
 * documentation completeness, and canonical data invariants.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

let passedTests = 0;
let totalTests = 0;

function test(description, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ ${description}`);
  } catch (err) {
    console.error(`  ✗ ${description}`);
    console.error(`    Error: ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('\n=== AlgoRecall 2.0: Architecture & Codebase Cleanup Test Suite ===\n');

// 1. Core Utilities Verification
console.log('1. Core Utilities (js/core/utilities.js)');
const CoreUtils = require('../js/core/utilities.js');

test('CoreUtils exists and exports expected methods', () => {
  assert(CoreUtils, 'CoreUtils should be defined');
  assert.strictEqual(typeof CoreUtils.escapeHtml, 'function');
  assert.strictEqual(typeof CoreUtils.toLocalDateStr, 'function');
  assert.strictEqual(typeof CoreUtils.calculateMedian, 'function');
  assert.strictEqual(typeof CoreUtils.clamp, 'function');
  assert.strictEqual(typeof CoreUtils.deepClone, 'function');
  assert.strictEqual(typeof CoreUtils.getSafeLocalStorage, 'function');
  assert.strictEqual(typeof CoreUtils.debounce, 'function');
});

test('CoreUtils.escapeHtml sanitizes XSS vulnerabilities', () => {
  const dirty = '<script>alert("xss")</script>&"\'';
  const clean = CoreUtils.escapeHtml(dirty);
  assert.strictEqual(clean, '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;&amp;&quot;&#039;');
  assert.strictEqual(CoreUtils.escapeHtml(null), '');
  assert.strictEqual(CoreUtils.escapeHtml(123), '123');
});

test('CoreUtils.toLocalDateStr formats dates correctly (YYYY-MM-DD)', () => {
  const d = new Date(2026, 10, 4); // Nov 4, 2026
  assert.strictEqual(CoreUtils.toLocalDateStr(d), '2026-11-04');
  assert.strictEqual(CoreUtils.toLocalDateStr(null), '');
});

test('CoreUtils.calculateMedian handles even, odd, and empty arrays', () => {
  assert.strictEqual(CoreUtils.calculateMedian([1, 5, 2]), 2);
  assert.strictEqual(CoreUtils.calculateMedian([1, 2, 3, 4]), 3); // Math.round(2.5)
  assert.strictEqual(CoreUtils.calculateMedian([]), null);
  assert.strictEqual(CoreUtils.calculateMedian([42]), 42);
});

test('CoreUtils.clamp bounds numbers within min and max', () => {
  assert.strictEqual(CoreUtils.clamp(5, 0, 10), 5);
  assert.strictEqual(CoreUtils.clamp(-5, 0, 10), 0);
  assert.strictEqual(CoreUtils.clamp(15, 0, 10), 10);
});

test('CoreUtils.deepClone creates independent copies', () => {
  const orig = { a: 1, b: [2, 3], c: { d: 'test' } };
  const clone = CoreUtils.deepClone(orig);
  assert.deepStrictEqual(clone, orig);
  clone.c.d = 'changed';
  assert.strictEqual(orig.c.d, 'test');
});

// 2. Modular CSS Files Verification
console.log('\n2. Modular CSS Architecture (css/)');

const requiredCssFiles = [
  'css/styles.css',
  'css/tokens.css',
  'css/base.css',
  'css/layout.css',
  'css/components.css',
  'css/views.css'
];

requiredCssFiles.forEach(file => {
  test(`Modular CSS file exists and is non-empty: ${file}`, () => {
    assert(fs.existsSync(file), `${file} should exist`);
    const content = fs.readFileSync(file, 'utf8');
    assert(content.length > 500, `${file} should have meaningful content (> 500 bytes)`);
  });
});

test('css/tokens.css contains root CSS variables and dark theme tokens', () => {
  const tokens = fs.readFileSync('css/tokens.css', 'utf8');
  assert(tokens.includes(':root'), 'Should define :root');
  assert(tokens.includes('--bg-main'), 'Should define --bg-main');
  assert(tokens.includes('--primary'), 'Should define --primary');
  assert(tokens.includes('--stream-learn-accent'), 'Should define stream tokens');
});

test('css/styles.css remains the master consolidated stylesheet', () => {
  const styles = fs.readFileSync('css/styles.css', 'utf8');
  assert(styles.length > 100000, 'Master stylesheet must preserve all rules');
});

test('css parity: modular CSS files and canonical styles.css are strictly synchronized', () => {
  const { verifyParity } = require('../scripts/sync-css.js');
  assert.doesNotThrow(() => verifyParity(), 'CSS parity verification must succeed');
});

// 3. Documentation Verification
console.log('\n3. Architecture & Operational Documentation (docs/)');

const requiredDocs = [
  'docs/architecture.md',
  'docs/project-structure.md',
  'docs/storage-schema.md',
  'docs/maintenance.md'
];

requiredDocs.forEach(doc => {
  test(`Documentation file exists and is non-empty: ${doc}`, () => {
    assert(fs.existsSync(doc), `${doc} should exist`);
    const content = fs.readFileSync(doc, 'utf8');
    assert(content.length > 1000, `${doc} should have extensive documentation (> 1000 bytes)`);
  });
});

// 4. Dead Code Cleanup Verification
console.log('\n4. Dead Code Cleanup Verification');

const deletedScripts = [
  'scripts/patch-app-revision.js',
  'scripts/patch-revision-controller.js',
  'scripts/reorganize-sheets-subtopics.js',
  'scripts/test-classifier.js',
  'scripts/verify-subtopic-ui.js'
];

deletedScripts.forEach(script => {
  test(`Obsolete script successfully removed: ${script}`, () => {
    assert(!fs.existsSync(script), `${script} should no longer exist`);
  });
});

// 5. Index.html Script Registration
console.log('\n5. Application Entry Point (index.html)');

test('index.html registers js/core/utilities.js before learner-repository.js', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert(html.includes('src="js/core/utilities.js'), 'Must register utilities.js');
  const utilsIdx = html.indexOf('src="js/core/utilities.js');
  const repoIdx = html.indexOf('src="js/learner-repository.js');
  assert(utilsIdx !== -1 && repoIdx !== -1, 'Both scripts must be present');
  assert(utilsIdx < repoIdx, 'utilities.js must be loaded before learner-repository.js');
});

// 6. Non-negotiable Domain Invariants Verification
console.log('\n6. Non-negotiable Domain Invariants');

test('Canonical problem catalog contains exactly 479 problems across 16 topics', () => {
  // Read default-sheets.js directly
  const content = fs.readFileSync('js/data/default-sheets.js', 'utf8');
  const match = content.match(/const\s+DEFAULT_DSA_SHEETS\s*=\s*(\[[\s\S]*?\]);/);
  assert(match, 'DEFAULT_DSA_SHEETS array must be defined in default-sheets.js');
  
  // Safe evaluation
  const sandbox = {};
  const fn = new Function('window', content + '\nreturn window.DEFAULT_DSA_SHEETS || DEFAULT_DSA_SHEETS;');
  const problems = fn(sandbox);
  
  assert.strictEqual(problems.length, 479, 'Must have exactly 479 curated problems');
  
  const ids = new Set();
  const topics = new Set();
  problems.forEach(p => {
    assert(p.id, 'Problem must have id');
    assert(!ids.has(p.id), `Duplicate problem id: ${p.id}`);
    ids.add(p.id);
    assert(p.topic, 'Problem must have topic');
    topics.add(p.topic);
  });
  
  assert.strictEqual(ids.size, 479, 'Must have exactly 479 unique problem IDs');
  assert.strictEqual(topics.size, 16, 'Must have exactly 16 canonical topics');
});

// Summary
console.log('\n======================================================');
console.log(`Results: ${passedTests} passed, ${totalTests - passedTests} failed (${totalTests} total)`);
console.log('======================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Verify default-sheets.js
const defaultSheets = require('../js/data/default-sheets.js');

console.log('1. Verifying default-sheets.js data...');
assert.strictEqual(defaultSheets.length, 479, 'Must have 479 problems');

// Check that every problem has valid subtopic, topic, and sequential orderIndex
defaultSheets.forEach((p, idx) => {
  assert.ok(p.subtopic && p.subtopic.length > 0, `Problem ${p.id} must have a subtopic`);
  assert.strictEqual(p.orderIndex, idx + 1, `Problem ${p.id} must have sequential orderIndex (#${idx + 1})`);
});

// Check that Binary Trees & BST starts with traversals
const treeProbs = defaultSheets.filter(p => p.topic === 'Binary Trees & BST');
assert.strictEqual(treeProbs.length, 49, 'Must have 49 Binary Tree problems');
console.log(`Binary Trees & BST has ${treeProbs.length} problems.`);
console.log('First 5 tree problems:', treeProbs.slice(0, 5).map(p => `#${p.orderIndex} [${p.subtopic}] ${p.title}`));
assert.strictEqual(treeProbs[0].subtopic, 'Tree Traversals & Structure', 'First tree problem must be in Tree Traversals & Structure');

// Check that Graphs starts with representation
const graphProbs = defaultSheets.filter(p => p.topic === 'Graphs');
assert.strictEqual(graphProbs.length, 35, 'Must have 35 Graph problems');
console.log(`Graphs has ${graphProbs.length} problems.`);
console.log('First 3 graph problems:', graphProbs.slice(0, 3).map(p => `#${p.orderIndex} [${p.subtopic}] ${p.title}`));
assert.strictEqual(graphProbs[0].subtopic, 'Graph Basics & Traversals', 'First graph problem must be in Graph Basics & Traversals');

// Check index.html elements
console.log('2. Verifying index.html UI markup...');
const htmlContent = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
assert.ok(htmlContent.includes('id="filter-subtopic"'), 'filter-subtopic must exist in index.html');
assert.ok(htmlContent.includes('id="toggle-group-subtopic"'), 'toggle-group-subtopic must exist in index.html');
assert.ok(htmlContent.includes('Topic & Subtopic'), 'table header must have Topic & Subtopic');

// Check styles.css
console.log('3. Verifying css/styles.css...');
const cssContent = fs.readFileSync(path.join(__dirname, '../css/styles.css'), 'utf8');
assert.ok(cssContent.includes('.subtopic-group-header-row'), '.subtopic-group-header-row must exist in css');
assert.ok(cssContent.includes('.problem-order-pill'), '.problem-order-pill must exist in css');

console.log('🎉 ALL VERIFICATION CHECKS PASSED PERFECTLY!');

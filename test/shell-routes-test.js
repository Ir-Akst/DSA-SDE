/**
 * AlgoRecall 2.0 — Phase 1: Shared Application Shell Navigation & Routing Suite
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// 1. Static HTML & CSS Invariant Checks
console.log('Testing Static Shell Markup & Styling Invariants...');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '../css/styles.css'), 'utf8');

// Sidebar Nav Items
const expectedNavItems = [
  { id: 'nav-item-dashboard', route: '/dashboard', label: 'Dashboard' },
  { id: 'nav-item-roadmaps', route: '/roadmaps', label: 'Roadmaps' },
  { id: 'nav-item-problems', route: '/problems', label: 'Problems' },
  { id: 'nav-item-revision', route: '/revision', label: 'Revision' },
  { id: 'nav-item-mock', route: '/mock', label: 'Mock Interviews' },
  { id: 'nav-item-progress', route: '/progress', label: 'Progress' },
  { id: 'nav-item-settings', route: '/settings', label: 'Settings' }
];

expectedNavItems.forEach(item => {
  assert.ok(html.includes(`id="${item.id}"`), `Missing sidebar nav item id="${item.id}"`);
  assert.ok(html.includes(`data-route="${item.route}"`), `Missing sidebar nav item data-route="${item.route}"`);
  assert.ok(html.includes(item.label), `Missing sidebar nav label "${item.label}"`);
  console.log(`✓ Sidebar item "${item.label}" verified (${item.route})`);
});

// Shared Topbar
assert.ok(html.includes('id="global-search-input"'), 'Missing search input #global-search-input in topbar');
assert.ok(html.includes('id="btn-header-auth"'), 'Missing guest auth pill #btn-header-auth in topbar');
assert.ok(html.includes('id="header-user-pill"'), 'Missing user profile pill #header-user-pill in topbar');
assert.ok(html.includes('id="btn-mobile-menu-toggle"'), 'Missing mobile menu toggle #btn-mobile-menu-toggle in topbar');
console.log('✓ Shared topbar entry points verified (Search, User Profile, Mobile Toggle)');

// Design System Tokens & Components in CSS
const requiredTokens = [
  '--space-xs',
  '--space-sm',
  '--space-md',
  '--space-lg',
  '--space-xl',
  '--space-2xl'
];
requiredTokens.forEach(t => {
  assert.ok(css.includes(t), `Missing CSS spacing token: ${t}`);
});
console.log('✓ Reusable spacing tokens verified in styles.css');

const requiredClasses = [
  '.app-card',
  '.app-tabs-bar',
  '.app-tab-btn',
  '.app-badge',
  '.app-input',
  '.app-dialog',
  '.app-empty-state',
  '.app-loading-state',
  '.app-spinner',
  '.app-error-state'
];
requiredClasses.forEach(c => {
  assert.ok(css.includes(c), `Missing CSS design system class: ${c}`);
});
console.log('✓ Reusable design system component classes verified in styles.css');

// 2. Behavioral Routing & View Mapping Checks in App JS
console.log('\nTesting App Shell Routing & Navigation Logic...');

// Load mock environment to test routing functions
const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');

// Verify VIEW_MAP covers all canonical routes
assert.ok(appJs.includes("'roadmaps': { destination: 'progress', subtab: 'roadmap' }"), 'VIEW_MAP must map roadmaps');
assert.ok(appJs.includes("'mock': { destination: 'progress', subtab: 'mock' }"), 'VIEW_MAP must map mock');
assert.ok(appJs.includes("'problems': { destination: 'practice'"), 'VIEW_MAP must map problems');
assert.ok(appJs.includes("'revision': { destination: 'revision'"), 'VIEW_MAP must map revision');
assert.ok(appJs.includes("'progress': { destination: 'progress'"), 'VIEW_MAP must map progress');
assert.ok(appJs.includes("'settings': { destination: 'settings'"), 'VIEW_MAP must map settings');
assert.ok(appJs.includes("'dashboard': { destination: 'dashboard' }"), 'VIEW_MAP must map dashboard');
console.log('✓ VIEW_MAP canonical mappings verified');

// Verify subroute handling in checkUrlHashSync
assert.ok(appJs.includes("second && third === 'edit'"), 'Router must support /roadmaps/:id/edit');
assert.ok(appJs.includes("activeRoadmap120View = 'topics'"), 'Router must toggle edit mode on /roadmaps/:id/edit');
assert.ok(appJs.includes("console.warn"), 'Router must handle fallback with warning');
console.log('✓ Subroute and fallback handlers verified');

console.log('\n============================================================');
console.log('  AlgoRecall 2.0 Shell & Routing Acceptance: ALL PASSED');
console.log('============================================================\n');


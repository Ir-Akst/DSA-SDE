/**
 * AlgoRecall 2.0 — Comprehensive Performance & Storage Profiling Suite
 * Stage 12 Baseline & Verification Benchmark
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
// Using native global WebSocket in Node 22/24

// Load Core Engine Modules in Node
const LearnerRepository = require('../js/learner-repository.js');
const CloudRepository = require('../js/cloud-repository.js');
const CloudSyncEngine = require('../js/cloud-sync-engine.js');
const SRSEngine = require('../js/srs-engine.js');
const RoadmapEngine = require('../js/roadmap-engine.js');
const AnalyticsEngine = require('../js/analytics-engine.js');

// Helper to compute stats
function stats(arr) {
  if (!arr.length) return { min: 0, max: 0, median: 0, p95: 0, avg: 0 };
  const sorted = [...arr].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const avg = sorted.reduce((s, v) => s + v, 0) / sorted.length;
  const median = sorted[Math.floor(sorted.length * 0.5)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  return { min: +min.toFixed(3), max: +max.toFixed(3), avg: +avg.toFixed(3), median: +median.toFixed(3), p95: +p95.toFixed(3) };
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runStorageAndEngineBenchmarks() {
  console.log('\n======================================================');
  console.log('📊 SECTION 1: Storage & Engine Micro-benchmarks');
  console.log('======================================================');

  // Load catalog
  const catalog = require('../js/data/default-sheets.js');
  console.log(`Loaded catalog: ${catalog.length} problems`);

  // Build representative user state (75 problems solved, history entries, gamification)
  const userStates = {};
  for (let i = 0; i < 75; i++) {
    const p = catalog[i] || { id: `prob-${i}` };
    userStates[p.id] = {
      stage: (i % 5) + 1,
      confidence: (i % 4) + 2,
      status: 'solved',
      lastReviewed: new Date(Date.now() - i * 86400000).toISOString(),
      reviewsCount: (i % 6) + 1,
      history: [
        { date: new Date(Date.now() - (i + 10) * 86400000).toISOString(), rating: 'good', stageBefore: 1, stageAfter: 2 },
        { date: new Date(Date.now() - i * 86400000).toISOString(), rating: 'easy', stageBefore: 2, stageAfter: 3 }
      ]
    };
  }

  const gamification = {
    xp: 3750,
    level: 6,
    streak: 14,
    streakShieldsAvailable: 2,
    badgesUnlocked: { first_solve: '2026-10-01', streak_7: '2026-10-10', streak_14: '2026-10-20' },
    weeklyQuests: [
      { id: 'q1', progress: 5, target: 10, completed: false },
      { id: 'q2', progress: 3, target: 5, completed: false }
    ]
  };

  const testUser = { id: 'usr_perf_bench', email: 'perf@algorecall.io' };
  LearnerRepository._resetForTesting();
  LearnerRepository.setContext({ type: 'user', id: testUser.id });

  // 1. JSON.stringify and JSON.parse cost
  const stringifyTimes = [];
  const parseTimes = [];
  let serialized = '';
  for (let i = 0; i < 200; i++) {
    const t0 = process.hrtime.bigint();
    serialized = JSON.stringify(userStates);
    const t1 = process.hrtime.bigint();
    stringifyTimes.push(Number(t1 - t0) / 1e6);

    const t2 = process.hrtime.bigint();
    const parsed = JSON.parse(serialized);
    const t3 = process.hrtime.bigint();
    parseTimes.push(Number(t3 - t2) / 1e6);
  }
  console.log(`Payload size (75 states): ${(serialized.length / 1024).toFixed(2)} KB`);
  console.log(`JSON.stringify latency (ms):`, stats(stringifyTimes));
  console.log(`JSON.parse latency (ms):`, stats(parseTimes));

  // 2. LearnerRepository saveUserStates & getUserStates
  const writeTimes = [];
  const readTimes = [];
  for (let i = 0; i < 200; i++) {
    const t0 = process.hrtime.bigint();
    LearnerRepository.saveUserStates(userStates);
    const t1 = process.hrtime.bigint();
    writeTimes.push(Number(t1 - t0) / 1e6);

    const t2 = process.hrtime.bigint();
    const retrieved = LearnerRepository.getUserStates();
    const t3 = process.hrtime.bigint();
    readTimes.push(Number(t3 - t2) / 1e6);
  }
  console.log(`LearnerRepository.saveUserStates latency (ms):`, stats(writeTimes));
  console.log(`LearnerRepository.getUserStates latency (ms):`, stats(readTimes));

  // 3. RoadmapEngine daily plan calculation
  const planTimes = [];
  for (let i = 0; i < 100; i++) {
    const t0 = process.hrtime.bigint();
    const plan = RoadmapEngine.getDailyDSAPlan(120, catalog, userStates, {
      topicPreferences: { learnTopic: 'Dynamic Programming', reviseTopic: 'Binary Trees & BST' },
      useDynamicPlanning: true
    });
    const t1 = process.hrtime.bigint();
    planTimes.push(Number(t1 - t0) / 1e6);
  }
  console.log(`RoadmapEngine.getDailyDSAPlan latency (ms):`, stats(planTimes));

  // 4. AnalyticsEngine calculation
  const analyticsTimes = [];
  for (let i = 0; i < 100; i++) {
    const t0 = process.hrtime.bigint();
    AnalyticsEngine.invalidateCache();
    const bundle = AnalyticsEngine.computeComprehensiveAnalytics({
      userStates,
      trainerEvents: {},
      drafts: [],
      catalog,
      useCache: false
    });
    const t1 = process.hrtime.bigint();
    analyticsTimes.push(Number(t1 - t0) / 1e6);
  }
  console.log(`AnalyticsEngine.computeComprehensiveAnalytics latency (ms):`, stats(analyticsTimes));

  // 5. CloudSyncEngine reconcileBundles & Checksum calculation
  LearnerRepository.saveGamification(gamification);
  const localBundle = CloudSyncEngine.getLocalBundle(testUser.id);
  const remoteBundle = JSON.parse(JSON.stringify(localBundle));
  // Mutate remote slightly to simulate concurrent branch
  remoteBundle.userStates['concurrent-remote-prob'] = { stage: 2, status: 'solved', lastReviewed: new Date().toISOString() };
  if (!remoteBundle.gamification) remoteBundle.gamification = { xp: 50 };
  else remoteBundle.gamification.xp += 50;

  const checksumTimes = [];
  const reconcileTimes = [];
  for (let i = 0; i < 100; i++) {
    const t0 = process.hrtime.bigint();
    const chk = CloudRepository.computeChecksum(localBundle);
    const t1 = process.hrtime.bigint();
    checksumTimes.push(Number(t1 - t0) / 1e6);

    const t2 = process.hrtime.bigint();
    const rec = CloudSyncEngine.reconcileBundles(localBundle, remoteBundle);
    const t3 = process.hrtime.bigint();
    reconcileTimes.push(Number(t3 - t2) / 1e6);
  }
  console.log(`CloudRepository.computeChecksum latency (ms):`, stats(checksumTimes));
  console.log(`CloudSyncEngine.reconcileBundles latency (ms):`, stats(reconcileTimes));

  return {
    userStatesSizeKB: +(serialized.length / 1024).toFixed(2),
    stringify: stats(stringifyTimes),
    parse: stats(parseTimes),
    repoWrite: stats(writeTimes),
    repoRead: stats(readTimes),
    planGen: stats(planTimes),
    analytics: stats(analyticsTimes),
    checksum: stats(checksumTimes),
    reconcile: stats(reconcileTimes)
  };
}

async function runNetworkAssetBenchmarks() {
  console.log('\n======================================================');
  console.log('🌐 SECTION 2: Network & Asset Transfer Benchmarks');
  console.log('======================================================');

  const files = [
    { path: '/index.html', name: 'HTML Shell (index.html)' },
    { path: '/css/styles.css', name: 'CSS Stylesheet (styles.css)' },
    { path: '/js/app.js', name: 'Application Bundle (app.js)' },
    { path: '/js/srs-engine.js', name: 'SRS Engine (srs-engine.js)' },
    { path: '/js/roadmap-engine.js', name: 'Roadmap Engine (roadmap-engine.js)' }
  ];

  const results = [];
  const http = require('http');

  for (const f of files) {
    const rawRes = await fetch(`http://localhost:3000${f.path}`, { headers: { 'accept-encoding': 'identity' } });
    const rawBytes = (await rawRes.arrayBuffer()).byteLength;
    const gzipRes = await fetch(`http://localhost:3000${f.path}`, { headers: { 'accept-encoding': 'gzip' } });
    const headers = Object.fromEntries(gzipRes.headers.entries());

    const compressedBytes = await new Promise((resolve, reject) => {
      http.get(`http://localhost:3000${f.path}`, { headers: { 'accept-encoding': 'gzip' } }, (res) => {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks).length));
      }).on('error', reject);
    });

    const rawKB = +(rawBytes / 1024).toFixed(2);
    const compressedKB = +(compressedBytes / 1024).toFixed(2);
    const compressionRatio = rawBytes > 0 ? +(((1 - compressedBytes / rawBytes) * 100).toFixed(1)) : 0;

    console.log(`• ${f.name}: Raw ${rawKB} KB -> Gzip ${compressedKB} KB (${compressionRatio}% savings) | Cache: "${headers['cache-control'] || 'none'}" | ETag: ${headers['etag'] ? 'Yes' : 'No'}`);
    results.push({
      name: f.name,
      path: f.path,
      rawKB,
      compressedKB,
      compressionRatio,
      cacheControl: headers['cache-control'],
      etag: headers['etag'] || null
    });
  }

  // Cloud Payload Size Comparison: Full Snapshot vs getSnapshotVersion Header
  const sampleSnapshot = {
    userStates: {},
    trainerEvents: {},
    gamification: { xp: 4500, level: 7, streak: 21 },
    examHistory: [{ id: 'ex-1', score: 92 }],
    mockHistory: [{ id: 'mk-1', score: 88 }]
  };
  for (let i = 0; i < 150; i++) {
    sampleSnapshot.userStates[`problem-${i}`] = { stage: 3, confidence: 4, status: 'solved', lastReviewed: '2026-10-23T12:00:00.000Z' };
  }
  const fullPayloadSize = Buffer.byteLength(JSON.stringify(sampleSnapshot), 'utf8');
  const versionHeaderPayload = Buffer.byteLength(JSON.stringify({ version: 14, checksum: 'a1b2c3d4', updated_at: '2026-10-24T00:00:00.000Z' }), 'utf8');

  console.log(`\n• Cloud Full Snapshot (150 problems): ${(fullPayloadSize / 1024).toFixed(2)} KB`);
  console.log(`• Cloud Version Header (getSnapshotVersion): ${(versionHeaderPayload / 1024).toFixed(3)} KB (${versionHeaderPayload} bytes)`);
  console.log(`• Potential Polling Bandwidth Savings: ${((1 - versionHeaderPayload / fullPayloadSize) * 100).toFixed(1)}%`);

  return {
    assets: results,
    fullPayloadKB: +(fullPayloadSize / 1024).toFixed(2),
    versionHeaderBytes: versionHeaderPayload,
    bandwidthSavingsPercent: +((1 - versionHeaderPayload / fullPayloadSize) * 100).toFixed(1)
  };
}

async function runBrowserRuntimeBenchmarks() {
  console.log('\n======================================================');
  console.log('⚡ SECTION 3: Chrome CDP Browser Interaction & Startup Benchmarks');
  console.log('======================================================');

  const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const USER_DATA_DIR = path.join(process.cwd(), 'scratch', 'chrome_perf_' + Date.now());
  const port = 9345;

  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${USER_DATA_DIR}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--window-size=1280,900',
    'http://localhost:3000'
  ], { stdio: 'ignore' });

  let ws = null;
  let reqId = 1;

  function sendCDP(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = reqId++;
      const handler = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.id === id) {
            ws.removeEventListener('message', handler);
            if (msg.error) reject(new Error(msg.error.message));
            else resolve(msg.result);
          }
        } catch (e) {
          reject(e);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evalInBrowser(expr) {
    const res = await sendCDP('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error('Eval Exception: ' + (res.exceptionDetails.exception?.description || res.exceptionDetails.text));
    }
    return res.result.value;
  }

  try {
    let targets = null;
    for (let i = 0; i < 30; i++) {
      await wait(500);
      try {
        const res = await fetch(`http://127.0.0.1:${port}/json`);
        if (res.ok) {
          targets = await res.json();
          if (targets.length > 0) break;
        }
      } catch (_) {}
    }

    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    await sendCDP('Page.enable');
    await sendCDP('Runtime.enable');

    // Measure time until core components are fully initialized
    const startLoad = Date.now();
    for (let i = 0; i < 40; i++) {
      try {
        const ready = await evalInBrowser(`Boolean(window.DEFAULT_DSA_SHEETS && window.DEFAULT_DSA_SHEETS.length === 479 && document.getElementById('dsa-plan-learn-section') && document.querySelector('.plan-task-card'))`);
        if (ready) break;
      } catch (_) {}
      await wait(100);
    }
    const startupDuration = Date.now() - startLoad;
    console.log(`• Time to Usable Dashboard: ${startupDuration} ms`);

    // Measure interaction latencies
    const perfResults = await evalInBrowser(`(() => {
      const times = {};

      // 1. Measure Topic Filter Switch
      const t0 = performance.now();
      const learnSelect = document.getElementById('plan-learn-topic-select');
      if (learnSelect) {
        learnSelect.value = 'Dynamic Programming';
        learnSelect.dispatchEvent(new Event('change'));
      }
      times.topicFilterSwitchMs = +(performance.now() - t0).toFixed(2);

      // 2. Measure Catalog Search / Filter
      const t2 = performance.now();
      if (typeof window.filterProblems === 'function') {
        window.filterProblems('binary search');
      }
      times.catalogSearchMs = +(performance.now() - t2).toFixed(2);

      // 3. Measure Problem Detail Modal Opening
      const t3 = performance.now();
      const firstDetailBtn = document.querySelector('.plan-detail-btn');
      if (firstDetailBtn) {
        firstDetailBtn.click();
      }
      times.modalLaunchMs = +(performance.now() - t3).toFixed(2);

      // Dismiss modal
      const modal = document.getElementById('problem-detail-modal');
      if (modal) modal.classList.remove('open');

      // 4. Measure Question Refresh Preview Calculation
      const t4 = performance.now();
      if (typeof window.getRefreshEligibleCount === 'function') {
        window.getRefreshEligibleCount('learn');
      }
      times.refreshPreviewMs = +(performance.now() - t4).toFixed(2);

      // 5. Measure Analytics Radar Chart Update Latency
      const t5 = performance.now();
      if (window.DSACharts && typeof window.DSACharts.renderMasteryRadar === 'function') {
        window.DSACharts.renderMasteryRadar('mastery-radar-chart', {
          'Arrays': { score: 75 },
          'Dynamic Programming': { score: 60 },
          'Binary Trees': { score: 80 }
        });
      }
      times.radarChartRenderMs = +(performance.now() - t5).toFixed(2);

      return times;
    })()`);

    console.log(`• Learn Topic Filter Switch: ${perfResults.topicFilterSwitchMs} ms`);
    console.log(`• Problem Search Latency: ${perfResults.catalogSearchMs} ms`);
    console.log(`• Problem Detail Modal Launch: ${perfResults.modalLaunchMs} ms`);
    console.log(`• Question Refresh Preview Calculation: ${perfResults.refreshPreviewMs} ms`);
    console.log(`• Radar Chart Re-render Latency: ${perfResults.radarChartRenderMs} ms`);

    return {
      startupDurationMs: startupDuration,
      ...perfResults
    };
  } finally {
    try {
      if (ws) ws.close();
      chrome.kill('SIGKILL');
      if (fs.existsSync(USER_DATA_DIR)) {
        fs.rmSync(USER_DATA_DIR, { recursive: true, force: true });
      }
    } catch (_) {}
  }
}

async function main() {
  console.log('================================================================');
  console.log('🚀 AlgoRecall 2.0 — Comprehensive Performance Benchmark Suite');
  console.log('================================================================');

  const micro = await runStorageAndEngineBenchmarks();
  const net = await runNetworkAssetBenchmarks();
  const browser = await runBrowserRuntimeBenchmarks();

  const report = {
    timestamp: new Date().toISOString(),
    storageAndEngine: micro,
    networkAndAssets: net,
    browserRuntime: browser
  };

  const baselinePath = path.join(__dirname, '..', 'scratch', 'perf_baseline.json');
  const outPath = path.join(__dirname, '..', 'scratch', 'perf_optimized.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`\n✅ Performance Post-Optimization Metrics Saved to: ${outPath}`);

  if (fs.existsSync(baselinePath)) {
    const base = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
    console.log('\n================================================================');
    console.log('📊 PERFORMANCE OPTIMIZATION DELTA COMPARISON');
    console.log('================================================================');
    console.log(`• Storage Parse Median:   ${base.storageAndEngine.parse.median} ms -> ${report.storageAndEngine.parse.median} ms`);
    console.log(`• Repo Read Median:       ${base.storageAndEngine.repoRead.median} ms -> ${report.storageAndEngine.repoRead.median} ms`);
    console.log(`• Plan Gen Median:        ${base.storageAndEngine.planGen.median} ms -> ${report.storageAndEngine.planGen.median} ms`);
    console.log(`• Analytics Median:       ${base.storageAndEngine.analytics.median} ms -> ${report.storageAndEngine.analytics.median} ms`);
    console.log(`• Reconcile Median:       ${base.storageAndEngine.reconcile.median} ms -> ${report.storageAndEngine.reconcile.median} ms`);
    console.log(`• Cloud Version Polling:  ${base.networkAndAssets.versionHeaderBytes} B vs ${base.networkAndAssets.fullPayloadKB} KB (${base.networkAndAssets.bandwidthSavingsPercent}% savings)`);
    console.log(`• Browser Startup Time:   ${base.browserRuntime.startupDurationMs} ms -> ${report.browserRuntime.startupDurationMs} ms`);
    console.log('================================================================\n');
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('Fatal Benchmark Error:', err);
    process.exit(1);
  });
}

module.exports = { runStorageAndEngineBenchmarks, runNetworkAssetBenchmarks, runBrowserRuntimeBenchmarks };

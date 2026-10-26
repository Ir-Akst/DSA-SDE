/**
 * AlgoRecall - Main Application Controller
 * Manages LocalStorage, UI Views, SRS Transitions, Monthly Exams, and Charts
 */

(function () {
  'use strict';

  // --- STORAGE KEYS ---
  const STORAGE_KEYS = {
    PROBLEMS: 'algorecall_problems_v2',
    USER_STATES: 'algorecall_user_states_v2',
    TEST_HISTORY: 'algorecall_exam_history_v2',
    MOCK_HISTORY: 'algorecall_mock_history_v2',
    ACTIVE_EXAM_SESSION: 'algorecall_active_exam_session_v2',
    ACTIVE_MOCK_SESSION: 'algorecall_active_mock_session_v2'
  };

  // --- STATE ---
  let allProblems = [];
  let userStates = {};
  let monthlyTestHistory = [];

  let activeRatingProblemId = null;
  let activeRatingConfidence = 4;
  let activeDetailProblemId = null;
  let currentAdaptiveRecommendation = null;

  // Monthly Exam State
  let activeTestSession = null;
  let activeTestQuestionIndex = 0;
  let testTimerInterval = null;
  let testTimeRemainingSeconds = 0;
  let testAnswers = {}; // problemId -> { rating, scratchpad }

  // --- INITIALIZATION ---
  function init() {
    if (window.StorageEngine) {
      StorageEngine.init();
      const settings = StorageEngine.getSettings();
      if (settings && settings.theme) {
        document.documentElement.setAttribute('data-theme', settings.theme);
        const icon = document.getElementById('theme-toggle-icon');
        if (icon) {
          icon.className = settings.theme === 'light' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        }
      }
    }

    loadData();
    if (window.RoadmapEngine) {
      RoadmapEngine.initProgress();
    }
    populateTopicDropdown();
    setupEventListeners();
    if (window.SolutionDiscoveryController && typeof window.SolutionDiscoveryController.setupDOMListeners === 'function') {
      window.SolutionDiscoveryController.setupDOMListeners();
    }
    setupCrossTabSync();
    setupMobileNav();
    setupSettingsModalListeners();
    setupAnalyticsTimeFilterListeners();
    setupDetailModalSubTabs();
    updateGamificationHeader();
    renderAll();
    checkAndRestoreActiveExamSession();
    checkAndRestoreActiveMockSession();
    checkUrlHashSync();
    initAuth();
  }

  // Smart Normalization & Deduplication Helper
  function normalizeTitle(str) {
    return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function cleanUrlKey(url) {
    if (!url) return '';
    try {
      const u = new URL(url);
      return (u.hostname + u.pathname).toLowerCase().replace(/\/+$/, '');
    } catch {
      return (url || '').toLowerCase().replace(/\/+$/, '');
    }
  }

  function smartDeduplicateAndSync(storedList, defaultList, statesObj) {
    const canonicalList = Array.isArray(defaultList) ? defaultList : [];
    const canonicalMapByNormTitle = new Map();
    const canonicalMapByUrl = new Map();
    const canonicalMapById = new Map();

    canonicalList.forEach(p => {
      p.topic = SRSEngine.canonicalizeTopic(p.topic);
      canonicalMapById.set(p.id, p);
      const nt = normalizeTitle(p.title);
      if (nt) canonicalMapByNormTitle.set(nt, p);
      const nu = cleanUrlKey(p.url);
      if (nu && !nu.includes('takeuforward.org')) canonicalMapByUrl.set(nu, p);
    });

    const result = [...canonicalList];
    const seenNormTitles = new Set(canonicalList.map(p => normalizeTitle(p.title)));
    const seenIds = new Set(canonicalList.map(p => p.id));

    if (Array.isArray(storedList)) {
      storedList.forEach(item => {
        if (!item || !item.title) return;

        const nt = normalizeTitle(item.title);
        const nu = cleanUrlKey(item.url);

        // Find match in canonical catalog
        let match = null;
        if (canonicalMapById.has(item.id)) {
          match = canonicalMapById.get(item.id);
        } else if (nt && canonicalMapByNormTitle.has(nt)) {
          match = canonicalMapByNormTitle.get(nt);
        } else if (nu && canonicalMapByUrl.has(nu)) {
          match = canonicalMapByUrl.get(nu);
        }

        if (match) {
          match.topic = SRSEngine.canonicalizeTopic(match.topic);
          // Migrate any SRS review state from old ID to canonical ID
          if (statesObj && item.id && item.id !== match.id && statesObj[item.id]) {
            if (!statesObj[match.id] || new Date(statesObj[item.id].lastReviewedAt || 0) > new Date(statesObj[match.id].lastReviewedAt || 0)) {
              statesObj[match.id] = statesObj[item.id];
            }
            delete statesObj[item.id];
          }
        } else {
          // Truly custom problem created by user
          item.topic = SRSEngine.canonicalizeTopic(item.topic);
          if (!seenNormTitles.has(nt) && !seenIds.has(item.id)) {
            seenNormTitles.add(nt);
            seenIds.add(item.id);
            result.push(item);
          }
        }
      });
    }

    return result;
  }

  // Load from LearnerRepository or fall back to defaults
  function loadData() {
    try {
      const repo = window.LearnerRepository;
      let storedProblems = null;

      if (repo) {
        userStates = repo.getUserStates() || {};
        monthlyTestHistory = repo.getExamHistory() || [];
        storedProblems = repo.getProblems();
      } else {
        const storedStates = localStorage.getItem(STORAGE_KEYS.USER_STATES);
        userStates = storedStates ? JSON.parse(storedStates) : {};

        const storedTests = localStorage.getItem(STORAGE_KEYS.TEST_HISTORY);
        monthlyTestHistory = storedTests ? JSON.parse(storedTests) : [];

        const rawProbs = localStorage.getItem(STORAGE_KEYS.PROBLEMS);
        storedProblems = rawProbs ? JSON.parse(rawProbs) : null;
      }

      const defaultList = window.DEFAULT_DSA_SHEETS ? [...window.DEFAULT_DSA_SHEETS] : [];

      if (storedProblems && Array.isArray(storedProblems) && storedProblems.length > 0) {
        // Smart merge & deduplicate against master catalog
        allProblems = smartDeduplicateAndSync(storedProblems, defaultList, userStates);
      } else {
        allProblems = defaultList;
      }
      saveProblems();
      saveUserStates();
    } catch (e) {
      console.error('Error loading data:', e);
      allProblems = window.DEFAULT_DSA_SHEETS ? [...window.DEFAULT_DSA_SHEETS] : [];
      userStates = {};
      monthlyTestHistory = [];
    }
  }

  function saveProblems() {
    if (window.LearnerRepository) {
      window.LearnerRepository.saveProblems(allProblems);
    } else {
      localStorage.setItem(STORAGE_KEYS.PROBLEMS, JSON.stringify(allProblems));
    }
  }

  let _cloudSyncDebounceTimer = null;
  let _isBackgroundSyncInProgress = false;

  async function flushBackgroundSync() {
    if (typeof window === 'undefined' || !window.CloudSyncEngine || !window.AuthEngine) return;
    const user = window.AuthEngine.getUser();
    if (!user || !user.id) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;

    if (_cloudSyncDebounceTimer) {
      clearTimeout(_cloudSyncDebounceTimer);
      _cloudSyncDebounceTimer = null;
    }

    if (_isBackgroundSyncInProgress) return;
    _isBackgroundSyncInProgress = true;
    const currentUserId = user.id;

    try {
      await window.CloudSyncEngine.checkpoint(currentUserId, { user });
      // Validate that account context didn't switch during the asynchronous cloud checkpoint
      const activeUser = window.AuthEngine.getUser();
      if (!activeUser || activeUser.id !== currentUserId) {
        return; // Switched account while in flight, safely ignore
      }
    } catch (err) {
      console.warn('[AlgoRecall] Background cloud sync deferred:', err.message);
    } finally {
      _isBackgroundSyncInProgress = false;
    }
  }

  function scheduleBackgroundSync() {
    if (typeof window === 'undefined' || !window.CloudSyncEngine || !window.AuthEngine) return;
    const user = window.AuthEngine.getUser();
    if (!user || !user.id) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;

    if (_cloudSyncDebounceTimer) clearTimeout(_cloudSyncDebounceTimer);
    _cloudSyncDebounceTimer = setTimeout(() => {
      flushBackgroundSync();
    }, 2500);
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', () => {
      if (_cloudSyncDebounceTimer) flushBackgroundSync();
    });
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden' && _cloudSyncDebounceTimer) {
          flushBackgroundSync();
        }
      });
    }
  }

  function saveUserStates() {
    if (window.LearnerRepository) {
      window.LearnerRepository.saveUserStates(userStates);
    } else {
      localStorage.setItem(STORAGE_KEYS.USER_STATES, JSON.stringify(userStates));
    }
    scheduleBackgroundSync();
  }

  function saveTestHistory() {
    if (window.LearnerRepository) {
      window.LearnerRepository.saveExamHistory(monthlyTestHistory);
    } else {
      localStorage.setItem(STORAGE_KEYS.TEST_HISTORY, JSON.stringify(monthlyTestHistory));
    }
  }

  // --- TOPIC & FILTER DROPDOWNS POPULATOR ---
  function populateTopicDropdown() {
    // Count problems per canonical topic
    const topicCounts = {};
    allProblems.forEach(p => {
      const topic = SRSEngine.canonicalizeTopic(p.topic);
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });

    const topics = Object.keys(topicCounts).sort();

    const topicSelect = document.getElementById('filter-topic');
    if (topicSelect) {
      const currentSelected = topicSelect.value || 'all';
      topicSelect.innerHTML = `<option value="all">📂 All Topics (${allProblems.length})</option>`;
      topics.forEach(topic => {
        const opt = document.createElement('option');
        opt.value = topic;
        opt.textContent = `${topic} (${topicCounts[topic]})`;
        topicSelect.appendChild(opt);
      });

      if (currentSelected && (topics.includes(currentSelected) || currentSelected === 'all')) {
        topicSelect.value = currentSelected;
      }
    }

    // Update Flashcard topic filter dropdown
    const fcTopicSelect = document.getElementById('flashcard-filter-topic');
    if (fcTopicSelect) {
      const currentFc = fcTopicSelect.value || 'due';
      fcTopicSelect.innerHTML = `
        <option value="due">⚡ Problems Due for Review</option>
        <option value="all">📚 All Master Problems (${allProblems.length})</option>
      `;
      topics.forEach(topic => {
        const opt = document.createElement('option');
        opt.value = topic;
        opt.textContent = `📂 ${topic} (${topicCounts[topic]})`;
        fcTopicSelect.appendChild(opt);
      });
      if (['due', 'all', ...topics].includes(currentFc)) {
        fcTopicSelect.value = currentFc;
      }
    }

    // Update Day Switch Topic Dropdown
    const daySwitchSelect = document.getElementById('select-switch-day-topic');
    if (daySwitchSelect) {
      const curSwitch = daySwitchSelect.value;
      daySwitchSelect.innerHTML = '';
      topics.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = `📂 ${t} (${topicCounts[t]} Problems)`;
        daySwitchSelect.appendChild(opt);
      });
      if (curSwitch && topics.includes(curSwitch)) {
        daySwitchSelect.value = curSwitch;
      }
    }

    // Update Topic Mixer Pills
    const mixerPillsContainer = document.getElementById('topic-mixer-pills-container');
    if (mixerPillsContainer) {
      mixerPillsContainer.innerHTML = '';
      topics.forEach(t => {
        const pill = document.createElement('div');
        pill.className = 'mixer-topic-pill';
        pill.dataset.topic = t;
        pill.innerHTML = `<i class="fa-regular fa-square"></i> <span>${t}</span> <span style="font-size:10px; opacity:0.7;">(${topicCounts[t]})</span>`;
        mixerPillsContainer.appendChild(pill);
      });
    }

    // Update Difficulty Dropdown with counts
    const diffSelect = document.getElementById('filter-difficulty');
    if (diffSelect) {
      const currentDiff = diffSelect.value || 'all';
      let easyCount = 0, medCount = 0, hardCount = 0;
      allProblems.forEach(p => {
        if (p.difficulty === 'Easy') easyCount++;
        else if (p.difficulty === 'Medium') medCount++;
        else if (p.difficulty === 'Hard') hardCount++;
      });
      diffSelect.innerHTML = `
        <option value="all">All Difficulties (${allProblems.length})</option>
        <option value="Easy">Easy (${easyCount})</option>
        <option value="Medium">Medium (${medCount})</option>
        <option value="Hard">Hard (${hardCount})</option>
      `;
      diffSelect.value = currentDiff;
    }

    // Update Company Dropdown with counts
    const compSelect = document.getElementById('filter-company');
    if (compSelect) {
      const currentComp = compSelect.value || 'all';
      const topCompanies = [
        'Google', 'Amazon', 'Microsoft', 'Meta', 'Apple',
        'Bloomberg', 'Goldman Sachs', 'Uber', 'Adobe', 'Flipkart', 'TCS'
      ];
      compSelect.innerHTML = `<option value="all">🏢 All Companies (${allProblems.length})</option>`;
      topCompanies.forEach(c => {
        const count = allProblems.filter(p => {
          const comps = p.companies || [];
          if (c === 'Meta') return comps.some(x => x.toLowerCase() === 'meta' || x.toLowerCase() === 'facebook');
          if (c === 'TCS') return comps.some(x => x.toLowerCase() === 'tcs' || x.toLowerCase() === 'infosys' || x.toLowerCase() === 'wipro');
          return comps.some(x => x.toLowerCase().includes(c.toLowerCase()));
        }).length;
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = `${c === 'Meta' ? 'Meta / Facebook' : c === 'TCS' ? 'TCS / Infosys' : c} (${count})`;
        compSelect.appendChild(opt);
      });
      compSelect.value = currentComp;
    }
  }

  // --- RENDER MASTER DISPATCHER ---
  function renderAll() {
    renderDashboard();
    renderProblemsTable();
    renderRevisionQueue();
    renderMonthlyTestView();
    renderAnalytics();
    renderFlashcards();
    renderActivityHeatmap();
    renderRoadmapView();
    renderPatternsHandbook();
    renderPrerequisiteGraph();
    renderMockInterviewView();
    updateSidebarBadges();
    updateGamificationHeader();
  }

  // --- SIDEBAR BADGES & STATS ---
  function updateSidebarBadges() {
    const totalCountEl = document.getElementById('sidebar-total-badge');
    const dueCountEl = document.getElementById('sidebar-due-badge');

    if (totalCountEl) totalCountEl.textContent = allProblems.length;

    let solvedCount = 0;
    let dueCount = 0;
    allProblems.forEach(p => {
      const state = userStates[p.id];
      if (state && state.lastReviewed) {
        solvedCount++;
      }
      if (SRSEngine.isDue(state)) dueCount++;
    });
    const unsolvedCount = allProblems.length - solvedCount;

    // Header Solved & Unsolved Pill
    const headerSolvedEl = document.getElementById('header-solved-count');
    const headerUnsolvedEl = document.getElementById('header-unsolved-count');
    if (headerSolvedEl) headerSolvedEl.textContent = solvedCount;
    if (headerUnsolvedEl) headerUnsolvedEl.textContent = unsolvedCount;

    if (dueCountEl) {
      if (dueCount > 0) {
        dueCountEl.textContent = dueCount;
        dueCountEl.style.display = 'inline-block';
      } else {
        dueCountEl.style.display = 'none';
      }
    }
  }

  // --- VIEW 1: DASHBOARD ---
  function renderDashboard() {
    let solvedCount = 0;
    let dueCount = 0;
    let masteredCount = 0;
    let easySolved = 0, mediumSolved = 0, hardSolved = 0;

    allProblems.forEach(p => {
      const state = userStates[p.id];
      if (state && state.lastReviewed) {
        solvedCount++;
        if (p.difficulty === 'Easy') easySolved++;
        else if (p.difficulty === 'Medium') mediumSolved++;
        else if (p.difficulty === 'Hard') hardSolved++;

        if (state.isMastered) masteredCount++;
      }
      if (SRSEngine.isDue(state)) dueCount++;
    });
    const unsolvedCount = allProblems.length - solvedCount;

    const topicMasteryMap = SRSEngine.calculateTopicMastery(allProblems, userStates);

    // Average Topic Retention Score (0% when no problems are solved)
    const masteryValues = Object.values(topicMasteryMap).map(t => t.score);
    const avgMastery = (solvedCount === 0 || masteryValues.length === 0)
      ? 0
      : Math.round(masteryValues.reduce((a, b) => a + b, 0) / masteryValues.length);

    // Update DOM Stats
    const statSolvedEl = document.getElementById('stat-solved-count');
    const statUnsolvedEl = document.getElementById('stat-unsolved-count');
    const statTotalEl = document.getElementById('stat-total-count');
    const statDueEl = document.getElementById('stat-due-count');
    const statMasteredEl = document.getElementById('stat-mastered-count');
    const statRetentionEl = document.getElementById('stat-retention-score');

    if (statSolvedEl) statSolvedEl.textContent = solvedCount;
    if (statUnsolvedEl) statUnsolvedEl.textContent = unsolvedCount;
    if (statTotalEl) statTotalEl.textContent = allProblems.length;
    if (statDueEl) statDueEl.textContent = dueCount;
    if (statMasteredEl) statMasteredEl.textContent = masteredCount;
    if (statRetentionEl) statRetentionEl.textContent = `${avgMastery}%`;

    // Feature A: Interview Readiness Engine
    let readiness = { overallScore: 0, grade: 'Not Ready', dimensions: [], isProvisional: true, evidenceProgress: 0 };
    if (window.ReadinessEngine) {
      let mockList = [];
      try {
        if (window.LearnerRepository) {
          mockList = window.LearnerRepository.getMockHistory() || [];
        } else {
          const rawMocks = localStorage.getItem('algorecall_mock_history_v2');
          if (rawMocks) mockList = JSON.parse(rawMocks);
        }
      } catch (_) {}

      readiness = ReadinessEngine.calculateReadiness(allProblems, userStates, mockList);

      const scoreEl = document.getElementById('readiness-overall-score');
      const gradeEl = document.getElementById('readiness-grade-label');
      const provEl = document.getElementById('readiness-provisional-badge');
      const indepStat = document.getElementById('readiness-independent-stat');
      const delayedStat = document.getElementById('readiness-delayed-stat');
      const weakStat = document.getElementById('readiness-weakness-stat');

      if (scoreEl) {
        scoreEl.textContent = readiness.overallScore;
        scoreEl.style.color = readiness.statusColor;
      }
      if (gradeEl) gradeEl.textContent = readiness.grade;
      if (provEl) {
        if (readiness.isProvisional) {
          provEl.style.display = 'inline-flex';
          provEl.innerHTML = `<i class="fa-solid fa-circle-info"></i> Provisional (${readiness.evidenceProgress}% Evidence)`;
        } else {
          provEl.style.display = 'none';
        }
      }

      if (indepStat && readiness.dimensions[0]) indepStat.innerHTML = `<i class="fa-solid fa-check" style="color:#10b981;"></i> ${readiness.dimensions[0].evidence}`;
      if (delayedStat && readiness.dimensions[1]) delayedStat.innerHTML = `<i class="fa-solid fa-clock" style="color:#8b5cf6;"></i> ${readiness.dimensions[1].evidence}`;

      if (weakStat && window.FailureEngine) {
        const weakness = FailureEngine.computeWeaknessProfile(allProblems, userStates);
        if (weakness && weakness.topFailure && weakness.topFailure.count > 0) {
          weakStat.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color:#f59e0b;"></i> Top Struggle: ${weakness.topFailure.label} (${weakness.topFailure.count})`;
        } else {
          weakStat.innerHTML = `<i class="fa-solid fa-shield-halved" style="color:#38bdf8;"></i> Clean solve history`;
        }
      }

      const dimsContainer = document.getElementById('readiness-dimensions-container');
      if (dimsContainer) {
        dimsContainer.innerHTML = readiness.dimensions.map(d => `
          <div class="dimension-card">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:12.5px; font-weight:600; color:var(--text-main);">${d.label}</span>
              <strong style="font-size:13px; color:${d.score >= 70 ? '#10b981' : d.score >= 50 ? '#38bdf8' : '#f59e0b'};">${d.score}%</strong>
            </div>
            <div class="dimension-bar-track">
              <div class="dimension-bar-fill" style="width:${d.score}%; background:${d.score >= 70 ? '#10b981' : d.score >= 50 ? '#38bdf8' : '#f59e0b'};"></div>
            </div>
            <span style="font-size:11px; color:var(--text-dim);">${d.evidence}</span>
          </div>
        `).join('');
      }
    }

    // Prescribed Next Learning Action Hero
    const nextActionTitle = document.getElementById('dashboard-next-action-title');
    const nextActionSubtitle = document.getElementById('dashboard-next-action-subtitle');
    const btnNextAction = document.getElementById('btn-dashboard-start-session');

    if (nextActionTitle && nextActionSubtitle && btnNextAction) {
      const scrollToPlan = () => {
        const planSec = document.getElementById('today-dsa-plan-section');
        if (planSec) planSec.scrollIntoView({ behavior: 'smooth' });
        else switchView('roadmap');
      };

      if (dueCount > 0) {
        nextActionTitle.textContent = `Clear ${dueCount} Due Revision Problem${dueCount > 1 ? 's' : ''}`;
        nextActionSubtitle.textContent = `Scientific Leitner memory intervals show retention decay. Cement your active patterns now.`;
        btnNextAction.onclick = scrollToPlan;
      } else {
        let missingPrereq = null;
        if (window.GraphEngine) {
          const sampleStruggle = allProblems.find(p => {
            const s = userStates[p.id];
            return s && (s.lastRating === 'failed' || (s.confidence && s.confidence <= 2));
          });
          if (sampleStruggle) {
            missingPrereq = GraphEngine.findMissingPrerequisite(sampleStruggle, allProblems, userStates);
          }
        }

        if (missingPrereq) {
          nextActionTitle.textContent = `Strengthen Prerequisite: ${missingPrereq.weakPrerequisiteNode.title}`;
          nextActionSubtitle.textContent = missingPrereq.reason;
          btnNextAction.onclick = () => switchView('graph');
        } else {
          nextActionTitle.textContent = `Continue Daily Structured Roadmap Workout`;
          nextActionSubtitle.textContent = `Progress through your active curriculum track and maintain your daily problem streak.`;
          btnNextAction.onclick = scrollToPlan;
        }
      }
    }

    // Revision Banner
    const banner = document.getElementById('dashboard-revision-banner');
    const bannerDueCount = document.getElementById('banner-due-count');
    if (banner && bannerDueCount) {
      bannerDueCount.textContent = dueCount;
      if (dueCount > 0) {
        banner.style.display = 'flex';
      } else {
        banner.style.display = 'none';
      }
    }

    // Render Charts
    DSACharts.renderMasteryRadar('dashboard-radar-chart', topicMasteryMap);
    DSACharts.renderTopicBarChart('dashboard-bar-chart', topicMasteryMap);

    // Populate High Priority Review Queue (Due & Overdue first, confidence weighted)
    const priorityTbody = document.getElementById('dashboard-priority-tbody');
    if (!priorityTbody) return;
    priorityTbody.innerHTML = '';

    const dueProblems = allProblems.filter(p => SRSEngine.isDue(userStates[p.id]));

    // Sort due problems: lower confidence / overdue gets highest priority
    dueProblems.sort((a, b) => {
      const aConf = SRSEngine.getConfidence(userStates[a.id]) || 3;
      const bConf = SRSEngine.getConfidence(userStates[b.id]) || 3;
      return aConf - bConf;
    });

    const displayList = dueProblems.length > 0
      ? dueProblems.slice(0, 6)
      : allProblems.slice(0, 5);

    if (displayList.length === 0) {
      priorityTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:var(--text-dim);">No problems found.</td></tr>`;
      return;
    }

    const priorityFragment = document.createDocumentFragment();
    displayList.forEach(p => {
      const state = userStates[p.id];
      const dueInfo = SRSEngine.getDueStatus(state);
      const conf = SRSEngine.getConfidence(state);
      const tr = document.createElement('tr');
      if (dueInfo.code === 'due' || dueInfo.code === 'overdue') {
        tr.classList.add('due-row');
      }

      const confBadgeHtml = conf
        ? `<span class="conf-badge conf-${conf}" style="font-size:10.5px;" title="${SRSEngine.getConfidenceMeta(conf).label}">⭐ ${conf}/5</span> `
        : '';

      tr.innerHTML = `
        <td><span class="badge badge-srs-${dueInfo.code}">${dueInfo.label}</span></td>
        <td>
          <div class="problem-title-cell">
            <a href="${p.url || '#'}" target="_blank" class="problem-title">${p.title} <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:10px; color:var(--text-dim);"></i></a>
            <div class="problem-meta"><span>${p.sheet || 'Standard'}</span></div>
          </div>
        </td>
        <td><strong>${p.topic}</strong><br><span style="font-size:11px; color:var(--text-dim);">${p.pattern || ''}</span></td>
        <td><span class="badge badge-${p.difficulty.toLowerCase()}">${p.difficulty}</span></td>
        <td>
          ${confBadgeHtml}
          <span style="font-size:12px; color:var(--text-muted);">${state?.lastRating ? `Last: ${capitalize(state.lastRating)} (Stg ${state.stage})` : 'Not solved yet'}</span>
        </td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-primary btn-sm btn-action-review" data-id="${p.id}" title="Log Recall Rating & Confidence">
              <i class="fa-solid fa-rotate"></i> Revise
            </button>
            <button class="btn btn-secondary btn-sm btn-action-detail" data-id="${p.id}" title="View Details & Progression">
              <i class="fa-solid fa-file-lines"></i>
            </button>
          </div>
        </td>
      `;
      priorityFragment.appendChild(tr);
    });
    priorityTbody.appendChild(priorityFragment);

    // Render Today's DSA Plan (12-Week Roadmap + Daily Problem Solver)
    renderDailyDSAPlan();
    renderAdaptiveLoopRecommendation();
  }

  // --- FEATURE: 12-WEEK DSA ROADMAP & DAILY PROBLEM SOLVER ---

  function findNextPlanTask(plan) {
    if (!plan) return null;

    // 1. Any overdue revision task not completed today and not skipped
    const overdueRev = (plan.spacedRevision?.problems || []).find(p => !p.isCompletedToday && !p.isSkippedToday && (p.isOverdue || (p.selectionReason || '').toLowerCase().includes('overdue')));
    if (overdueRev) return { task: overdueRev, isRevision: true, isSpaced: true };

    // 2. Next uncompleted, unskipped Spaced Revision problem (due recall priority)
    const nextSpaced = (plan.spacedRevision?.problems || []).find(p => !p.isCompletedToday && !p.isSkippedToday);
    if (nextSpaced) return { task: nextSpaced, isRevision: true, isSpaced: true };

    // 3. Next uncompleted, unskipped learn problem
    const nextLearn = (plan.learn?.problems || []).find(p => !p.isCompletedToday && !p.isSkippedToday);
    if (nextLearn) return { task: nextLearn, isRevision: false, isSpaced: false };

    // 4. Next uncompleted, unskipped topic revision problem
    const nextTopicRev = (plan.topicRevision?.problems || []).find(p => !p.isCompletedToday && !p.isSkippedToday);
    if (nextTopicRev) return { task: nextTopicRev, isRevision: true, isSpaced: false };

    // 5. Fallback: legacy revise
    const nextRev = (plan.revise?.problems || []).find(p => !p.isCompletedToday && !p.isSkippedToday);
    if (nextRev) return { task: nextRev, isRevision: true, isSpaced: false };

    // 6. Check if any uncompleted tasks were skipped and can now be revisited
    const allPlanned = [
      ...(plan.spacedRevision?.problems || []),
      ...(plan.learn?.problems || []),
      ...(plan.topicRevision?.problems || [])
    ];
    const skippedTask = allPlanned.find(p => !p.isCompletedToday && p.isSkippedToday);
    if (skippedTask) {
      return { task: skippedTask, isRevision: Boolean(skippedTask.isRevision), isSpaced: Boolean(skippedTask.isSpacedRevision), isSkipped: true };
    }

    return null;
  }

  let _planFeedbackTimer = null;
  function showPlanConfirmation(msg) {
    const banner = document.getElementById('dsa-plan-feedback-banner');
    const text = document.getElementById('dsa-plan-feedback-text');
    if (!banner || !text) return;
    text.textContent = msg;
    banner.style.display = 'flex';

    if (_planFeedbackTimer) clearTimeout(_planFeedbackTimer);
    _planFeedbackTimer = setTimeout(() => {
      banner.style.display = 'none';
    }, 4500);
  }

  function renderDailyDSAPlan() {
    if (!window.RoadmapEngine) return;
    if (window.StorageEngine) {
      userStates = StorageEngine.getUserStates();
    }
    window.renderDailyDSAPlan = renderDailyDSAPlan;

    const planSection = document.getElementById('today-dsa-plan-section');
    if (!planSection) return;

    setupDailyPlanControls();

    const budgetPill = document.getElementById('dsa-plan-budget-pill');
    const headerSummary = document.getElementById('dsa-plan-header-summary');

    const currentMins = (RoadmapEngine.get12WeekTargetMinutes && RoadmapEngine.get12WeekTargetMinutes()) || 120;

    const plan = RoadmapEngine.getDailyDSAPlan(currentMins, allProblems, userStates);

    if (budgetPill && plan.timeAllocation) {
      budgetPill.innerHTML = `<span><i class="fa-solid fa-clock"></i> ${plan.timeAllocation.learnMinutes}m Learn • ${plan.timeAllocation.topicRevisionMinutes}m Topic Revise • ${plan.timeAllocation.spacedRevisionMinutes}m Spaced Revise • ${plan.timeAllocation.recallBufferMinutes}m Active Recall</span>`;
    }

    if (headerSummary) {
      headerSummary.textContent = `Workload-aware learning, topic practice & spaced recall workflow`;
    }

    // Populate and sync Independent Topic Preferences (Section 2)
    const learningTopicSelect = document.getElementById('dsa-plan-learning-topic-select');
    const revisionTopicSelect = document.getElementById('dsa-plan-revision-topic-select');

    if (learningTopicSelect) {
      const curLearn = RoadmapEngine.getCurrentLearningTopic(allProblems, userStates);
      const isFocused = document.activeElement === learningTopicSelect;
      if (!isFocused || !learningTopicSelect.children.length) {
        const topicStats = RoadmapEngine.getTopicCatalogStats(allProblems, userStates);
        const optionsHtml = topicStats.map(t =>
          `<option value="${escapeHtml(t.topic)}"${t.topic === curLearn ? ' selected' : ''}>${escapeHtml(t.topic)} (${t.unattempted} new)</option>`
        ).join('');
        learningTopicSelect.innerHTML = optionsHtml;
        learningTopicSelect.value = curLearn;
      }
    }

    if (revisionTopicSelect) {
      const curRev = RoadmapEngine.getRevisionTopic(allProblems, userStates);
      const isFocused = document.activeElement === revisionTopicSelect;
      if (!isFocused || !revisionTopicSelect.children.length) {
        const topicStats = RoadmapEngine.getTopicCatalogStats(allProblems, userStates);
        const allDueOpt = `<option value="all_due"${curRev === 'all_due' ? ' selected' : ''}>All Due Topics (${topicStats.totalDue || 0} due)</option>`;
        const topicOpts = topicStats.map(t =>
          `<option value="${escapeHtml(t.topic)}"${t.topic === curRev ? ' selected' : ''}>${escapeHtml(t.topic)} (${t.due || 0} due)</option>`
        ).join('');
        revisionTopicSelect.innerHTML = allDueOpt + topicOpts;
        revisionTopicSelect.value = curRev;
      }
    }

    // Hero Overview Banner Elements
    const weekDisplay = document.getElementById('dsa-plan-current-week-display');
    const mainTopicDisplay = document.getElementById('dsa-plan-main-topic-display');
    const revTopicDisplay = document.getElementById('dsa-plan-rev-topic-display');
    const dueReviewsDisplay = document.getElementById('dsa-plan-due-reviews-display');
    const studyTimeDisplay = document.getElementById('dsa-plan-study-time-display');
    const horizonDisplay = document.getElementById('dsa-plan-horizon-display');
    const tasksProgressText = document.getElementById('dsa-plan-tasks-progress-text');
    const btnStartNext = document.getElementById('btn-start-next-problem');

    if (weekDisplay) weekDisplay.textContent = 'Active Roadmap';
    if (mainTopicDisplay) mainTopicDisplay.textContent = `${plan.learn.topic}`;
    if (revTopicDisplay) revTopicDisplay.textContent = `${plan.topicRevision?.topicDisplay || plan.revise.topicDisplay}`;
    if (dueReviewsDisplay) {
      const dueCount = plan.spacedRevision?.dueTotal || 0;
      const backlogCount = plan.spacedRevision?.backlogCount || 0;
      dueReviewsDisplay.textContent = `${dueCount} due${backlogCount > 0 ? ' (' + backlogCount + ' backlog)' : ''}`;
    }
    if (studyTimeDisplay) studyTimeDisplay.textContent = `${plan.timeAllocation.totalMinutes} minutes`;
    if (horizonDisplay && plan.dynamicRoadmap) {
      const dr = plan.dynamicRoadmap;
      if (dr.isImpossibleAllocation) {
        horizonDisplay.textContent = 'Indefinite';
        horizonDisplay.title = dr.disclaimer || 'Insufficient study allocation';
      } else if (dr.isAllCompleted) {
        horizonDisplay.textContent = 'Completed!';
        horizonDisplay.title = 'All roadmap problems completed';
      } else if (dr.weeksRange && Array.isArray(dr.weeksRange)) {
        horizonDisplay.textContent = `~${dr.weeksRemaining} wks (${dr.weeksRange[0]}-${dr.weeksRange[1]} wks Est.)`;
        horizonDisplay.title = `Estimated completion around ${dr.estimatedCompletionDate || 'N/A'}`;
      } else if (dr.weeksRemaining !== undefined) {
        horizonDisplay.textContent = `~${dr.weeksRemaining} wks (Est.)`;
        horizonDisplay.title = `Estimated completion around ${dr.estimatedCompletionDate || 'N/A'}`;
      }
    }
    if (tasksProgressText) {
      const plannedTotal = (plan.progress.plannedTasksTotal !== undefined)
        ? plan.progress.plannedTasksTotal
        : (plan.progress.totalPlannedTasks || 0);
      const completedTasks = plan.progress.completedPlannedTasks || 0;
      tasksProgressText.textContent = `${completedTasks} of ${plannedTotal} tasks completed`;
    }

    // Prominent "Start Next Problem" action
    const nextItem = findNextPlanTask(plan);
    if (btnStartNext) {
      if (plan.progress.isAllCompleted) {
        btnStartNext.innerHTML = `<i class="fa-solid fa-circle-check"></i> Today's Plan Completed!`;
        btnStartNext.classList.remove('btn-primary');
        btnStartNext.classList.add('btn-success');
        btnStartNext.onclick = () => {
          document.getElementById('dsa-plan-progress-section')?.scrollIntoView({ behavior: 'smooth' });
        };
      } else if (nextItem) {
        btnStartNext.innerHTML = `<i class="fa-solid fa-play"></i> Start Next Problem`;
        btnStartNext.classList.remove('btn-success');
        btnStartNext.classList.add('btn-primary');
        btnStartNext.onclick = () => {
          const cardEl = document.getElementById(`plan-task-${nextItem.task.id}`);
          if (cardEl) {
            cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            cardEl.classList.add('pulse-focus-card');
            setTimeout(() => cardEl.classList.remove('pulse-focus-card'), 2200);
          }
          if (nextItem.task.url) {
            window.open(nextItem.task.url, '_blank', 'noopener,noreferrer');
          }
        };
      } else {
        btnStartNext.innerHTML = `<i class="fa-solid fa-play"></i> Start Next Problem`;
        btnStartNext.classList.remove('btn-success');
        btnStartNext.classList.add('btn-primary');
        btnStartNext.onclick = () => {
          document.getElementById('dsa-plan-learn-section')?.scrollIntoView({ behavior: 'smooth' });
        };
      }
    }

    // =========================================================================
    // SECTION 2: LEARN — NEW QUESTIONS
    // =========================================================================
    const learnTopicTitle = document.getElementById('dsa-plan-learn-topic-title');
    const learnTimeBadge = document.getElementById('dsa-plan-learn-time-badge');
    const learnConceptSub = document.getElementById('dsa-plan-learn-concept-sub');
    const learnList = document.getElementById('dsa-plan-learn-task-list');

    if (learnTopicTitle) learnTopicTitle.textContent = `${plan.learn.topic}`;
    if (learnTimeBadge) learnTimeBadge.textContent = `~${plan.timeAllocation.learnMinutes}m target`;
    if (learnConceptSub) learnConceptSub.textContent = `New questions · ${plan.learn.topic} · Adaptive difficulty progression`;

    if (learnList) {
      if (!plan.learn.problems || plan.learn.problems.length === 0) {
        let emptyIcon = 'fa-solid fa-circle-check';
        let emptyIconColor = '#10b981';
        let emptyTitle = `All eligible questions for ${escapeHtml(plan.learn.topic)} are completed!`;
        let emptyDesc = `You have solved all recommended new problems in this topic. Pick another topic to learn or strengthen your skills with Topic Revision.`;

        if (plan.learn.emptyReason === 'all_mastered') {
          emptyIcon = 'fa-solid fa-trophy';
          emptyIconColor = '#eab308';
          emptyTitle = `Topic Mastered: ${escapeHtml(plan.learn.topic)}!`;
          emptyDesc = `You have mastered all questions in ${escapeHtml(plan.learn.topic)}. Excellent work! Choose your next topic from the dropdown above.`;
        } else if (plan.learn.emptyReason === 'topic_exhausted') {
          emptyIcon = 'fa-solid fa-check-double';
          emptyIconColor = '#38bdf8';
          emptyTitle = `Topic Practiced Today: ${escapeHtml(plan.learn.topic)}`;
          emptyDesc = `All available problems in ${escapeHtml(plan.learn.topic)} have been practiced in today's session. Continue with Topic Revision or select another learning topic.`;
        }
        learnList.innerHTML = `
          <div class="plan-empty-state">
            <i class="${emptyIcon}" style="color:${emptyIconColor};"></i>
            <strong>${emptyTitle}</strong>
            <span>${emptyDesc}</span>
            <div class="plan-empty-actions">
              <button class="btn btn-secondary btn-sm btn-browse-catalog" type="button"><i class="fa-solid fa-layer-group"></i> Browse Catalog</button>
            </div>
          </div>
        `;
      } else {
        let foundFirstUncompleted = false;
        const totalLearnTasks = plan.learn.problems.length;
        let cardsHtml = plan.learn.problems.map((p, idx) => {
          const isNextUp = !p.isCompletedToday && !p.isSkippedToday && !foundFirstUncompleted && (!nextItem || nextItem.task.id === p.id);
          if (isNextUp) foundFirstUncompleted = true;
          return renderPlanTaskCard(p, false, isNextUp, idx, totalLearnTasks);
        }).join('');

        if (plan.learn.problems.every(p => p.isCompletedToday) && plan.learn.hasNextEligibleQuestion) {
          cardsHtml += `
            <div class="plan-replenish-banner">
              <div class="replenish-info">
                <i class="fa-solid fa-circle-check" style="color:#10b981; font-size:18px;"></i>
                <div>
                  <strong>All planned questions for ${escapeHtml(plan.learn.topic)} completed!</strong>
                  <span>Next eligible question in this topic is available immediately without any wait.</span>
                </div>
              </div>
              <button class="btn btn-sm btn-primary btn-replenish-stream" data-stream="learn" type="button">
                <i class="fa-solid fa-bolt"></i> Next Question Available — Continue Learning
              </button>
            </div>
          `;
        }
        learnList.innerHTML = cardsHtml;
      }
    }

    // =========================================================================
    // SECTION 3: TOPIC REVISION — TOPIC PRACTICE
    // =========================================================================
    const topicRevTitle = document.getElementById('dsa-plan-topic-revise-topic-title') || document.getElementById('dsa-plan-revise-topic-title');
    const topicRevTimeBadge = document.getElementById('dsa-plan-topic-revise-time-badge') || document.getElementById('dsa-plan-revise-time-badge');
    const topicRevConceptSub = document.getElementById('dsa-plan-topic-revise-concept-sub') || document.getElementById('dsa-plan-revise-concept-sub');
    const topicRevList = document.getElementById('dsa-plan-topic-revise-task-list') || document.getElementById('dsa-plan-revise-task-list');

    const topicRevProblems = plan.topicRevision?.problems || [];
    const topicRevTopicName = plan.topicRevision?.topicDisplay || plan.topicRevision?.topic || plan.revise.topicDisplay;

    if (topicRevTitle) topicRevTitle.textContent = `${topicRevTopicName}`;
    if (topicRevTimeBadge) topicRevTimeBadge.textContent = `~${plan.timeAllocation.topicRevisionMinutes}m target`;
    if (topicRevConceptSub) topicRevConceptSub.textContent = `Topic-focused practice · ${topicRevTopicName} · Adaptive difficulty`;

    if (topicRevList) {
      if (!topicRevProblems || topicRevProblems.length === 0) {
        topicRevList.innerHTML = `
          <div class="plan-empty-state">
            <i class="fa-solid fa-sliders" style="color:#f59e0b;"></i>
            <strong>No suitable topic practice questions available for ${escapeHtml(topicRevTopicName)}.</strong>
            <span>All practice items in this topic are current, or select another topic from the Revise Topic dropdown above.</span>
          </div>
        `;
      } else {
        const totalTopicTasks = topicRevProblems.length;
        let cardsHtml = topicRevProblems.map((p, idx) => {
          const isNextUp = !p.isCompletedToday && !p.isSkippedToday && nextItem && nextItem.task.id === p.id;
          return renderPlanTaskCard(p, true, isNextUp, idx, totalTopicTasks);
        }).join('');

        if (topicRevProblems.every(p => p.isCompletedToday) && plan.topicRevision?.hasNextEligibleQuestion) {
          cardsHtml += `
            <div class="plan-replenish-banner">
              <div class="replenish-info">
                <i class="fa-solid fa-circle-check" style="color:#10b981; font-size:18px;"></i>
                <div>
                  <strong>Planned practice in ${escapeHtml(topicRevTopicName)} completed!</strong>
                  <span>Practice another question in this topic right now.</span>
                </div>
              </div>
              <button class="btn btn-sm btn-secondary btn-replenish-stream" data-stream="topicRevision" type="button">
                <i class="fa-solid fa-dumbbell"></i> Practice Next Question
              </button>
            </div>
          `;
        }
        topicRevList.innerHTML = cardsHtml;
      }
    }

    // Backwards-compatibility sync for legacy revise task list container if present
    const legacyRevList = document.getElementById('dsa-plan-revise-task-list');
    if (legacyRevList && legacyRevList !== topicRevList) {
      legacyRevList.innerHTML = topicRevList ? topicRevList.innerHTML : '';
    }

    // =========================================================================
    // SECTION 4: SPACED REVISION — TIME-BASED SRS RECALL
    // =========================================================================
    const spacedRevTitle = document.getElementById('dsa-plan-spaced-revise-topic-title');
    const spacedRevTimeBadge = document.getElementById('dsa-plan-spaced-revise-time-badge');
    const spacedBacklogBadge = document.getElementById('dsa-plan-spaced-backlog-badge');
    const spacedRevList = document.getElementById('dsa-plan-spaced-revise-task-list');

    const spacedProblems = plan.spacedRevision?.problems || [];
    const dueTotal = plan.spacedRevision?.dueTotal || 0;
    const backlogTotal = plan.spacedRevision?.backlogCount || 0;

    if (spacedRevTitle) spacedRevTitle.textContent = `All Eligible Topics (${dueTotal} due)`;
    if (spacedRevTimeBadge) spacedRevTimeBadge.textContent = `~${plan.timeAllocation.spacedRevisionMinutes}m target`;
    if (spacedBacklogBadge) {
      if (backlogTotal > 0) {
        spacedBacklogBadge.style.display = 'inline-flex';
        spacedBacklogBadge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${backlogTotal} deferred to next session`;
      } else {
        spacedBacklogBadge.style.display = 'none';
      }
    }

    if (spacedRevList) {
      if (!spacedProblems || spacedProblems.length === 0) {
        spacedRevList.innerHTML = `
          <div class="plan-empty-state">
            <i class="fa-solid fa-star" style="color:#38bdf8;"></i>
            <strong>No spaced revisions due right now.</strong>
            <span>Your spaced repetition schedule is completely up to date. Solve new questions above to build your spaced recall queue!</span>
          </div>
        `;
      } else {
        const totalSpacedTasks = spacedProblems.length;
        let cardsHtml = spacedProblems.map((p, idx) => {
          const isNextUp = !p.isCompletedToday && !p.isSkippedToday && nextItem && nextItem.task.id === p.id;
          return renderPlanTaskCard(p, true, isNextUp, idx, totalSpacedTasks);
        }).join('');

        if (spacedProblems.every(p => p.isCompletedToday) && backlogTotal > 0) {
          cardsHtml += `
            <div class="plan-replenish-banner">
              <div class="replenish-info">
                <i class="fa-solid fa-triangle-exclamation" style="color:#f59e0b; font-size:18px;"></i>
                <div>
                  <strong>${backlogTotal} due review(s) deferred in backlog.</strong>
                  <span>Ready to clear more review debt? You can review the next due item now.</span>
                </div>
              </div>
              <button class="btn btn-sm btn-warning btn-replenish-stream" data-stream="spacedRevision" type="button">
                <i class="fa-solid fa-clock-rotate-left"></i> Review Next Backlog Item
              </button>
            </div>
          `;
        }
        spacedRevList.innerHTML = cardsHtml;
      }
    }

    // =========================================================================
    // SECTION 5: DAILY PROGRESS
    // =========================================================================
    const completedTasksEl = document.getElementById('dsa-plan-completed-tasks');
    const remainingTasksEl = document.getElementById('dsa-plan-remaining-tasks');
    const studyTimeEl = document.getElementById('dsa-plan-study-time-spent');
    const overdueRemainingEl = document.getElementById('dsa-plan-overdue-count');
    const progressBar = document.getElementById('dsa-plan-progress-bar');
    const completionPill = document.getElementById('dsa-plan-completion-pill');
    const statusFooter = document.getElementById('dsa-plan-status-footer');

    if (completedTasksEl) completedTasksEl.textContent = plan.progress.completedPlannedTasks;
    if (remainingTasksEl) remainingTasksEl.textContent = plan.progress.remainingTasks;
    if (studyTimeEl) studyTimeEl.textContent = `${plan.progress.todayMinutesLogged}m`;
    if (overdueRemainingEl) overdueRemainingEl.textContent = plan.progress.dueBacklogRemaining || plan.progress.overdueRemaining;
    if (progressBar) progressBar.style.width = `${plan.progress.completionPercent}%`;

    if (completionPill) {
      if (plan.progress.isAllCompleted) {
        completionPill.innerHTML = `<i class="fa-solid fa-check-double"></i> 100% Done`;
        completionPill.style.background = 'rgba(16, 185, 129, 0.25)';
        completionPill.style.color = '#34d399';
      } else {
        completionPill.textContent = `${plan.progress.completionPercent}% Done`;
        completionPill.style.background = 'rgba(16, 185, 129, 0.15)';
        completionPill.style.color = 'var(--primary)';
      }
    }

    if (statusFooter) {
      if (plan.progress.isAllCompleted) {
        statusFooter.innerHTML = `
          <i class="fa-solid fa-award" style="color:#10b981;"></i>
          <span style="color:#34d399; font-weight:700;">Goal Achieved! You finished today's planned DSA session (${plan.progress.completedPlannedTasks} tasks, ${plan.progress.todayMinutesLogged}m logged).</span>
        `;
      } else if (plan.progress.completedPlannedTasks > 0) {
        statusFooter.innerHTML = `
          <i class="fa-solid fa-fire" style="color:#f59e0b;"></i>
          <span>Great momentum! ${plan.progress.remainingTasks} task${plan.progress.remainingTasks > 1 ? 's' : ''} left to complete today.</span>
        `;
      } else {
        statusFooter.innerHTML = `
          <i class="fa-solid fa-circle-play" style="color:var(--primary);"></i>
          <span>Ready to start: Pick your first problem above or click "Start Next Problem".</span>
        `;
      }
    }

    const recallText = document.getElementById('dsa-plan-recall-text');
    if (recallText && plan.learn) {
      recallText.textContent = `Spend 10 minutes explaining core ${plan.learn.topic} invariants or templates out loud before closing.`;
    }

    // Attach task action listeners across all sections
    bindDailyPlanTaskEvents(planSection);
    bindSectionTaskEvents(document.getElementById('dsa-plan-learn-section'));
    bindSectionTaskEvents(document.getElementById('dsa-plan-topic-revise-section'));
    bindSectionTaskEvents(document.getElementById('dsa-plan-spaced-revise-section'));
    bindSectionTaskEvents(document.getElementById('dsa-plan-revise-section'));
  }

  function renderPlanTaskCard(p, sectionType = 'learn', isNextUp = false, taskIndex = 0, totalTasks = 1) {
    if (sectionType === true) sectionType = 'topic_revise';
    if (sectionType === false) sectionType = 'learn';
    if (p.isSpacedRevision) sectionType = 'spaced_revise';
    else if (p.isTopicRevision) sectionType = 'topic_revise';

    const diffClass = p.difficulty === 'Easy' ? 'badge-easy' : p.difficulty === 'Medium' ? 'badge-medium' : 'badge-hard';
    const escapedTitle = escapeHtml(p.title || '');
    const estMins = p.estimatedMinutes || (p.difficulty === 'Easy' ? 15 : p.difficulty === 'Medium' ? 30 : 45);

    // Status Badge & Reason
    let statusBadgeHtml = '';
    let reasonText = '';

    if (sectionType === 'spaced_revise') {
      const rawReason = (p.selectionReason || '').toLowerCase();
      if (p.isOverdue || rawReason.includes('overdue')) {
        statusBadgeHtml = `<span class="badge-rev-status status-overdue"><i class="fa-solid fa-clock-rotate-left"></i> Overdue</span>`;
      } else {
        statusBadgeHtml = `<span class="badge-rev-status status-due"><i class="fa-solid fa-bell"></i> Due</span>`;
      }
      reasonText = p.selectionReason || 'Due for scheduled spaced recall';
    } else if (sectionType === 'topic_revise') {
      const rawReason = (p.selectionReason || '').toLowerCase();
      if (rawReason.includes('failed')) {
        statusBadgeHtml = `<span class="badge-rev-status status-weak"><i class="fa-solid fa-triangle-exclamation"></i> Weak</span>`;
      } else if (rawReason.includes('hint')) {
        statusBadgeHtml = `<span class="badge-rev-status status-weak"><i class="fa-solid fa-lightbulb"></i> Weak</span>`;
      } else {
        statusBadgeHtml = `<span class="badge-rev-status status-due"><i class="fa-solid fa-dumbbell"></i> Practice</span>`;
      }
      reasonText = p.selectionReason || `Topic practice in ${p.topic || 'topic'}`;
    } else {
      reasonText = p.selectionReason || `Recommended foundation for ${p.topic || 'today'}`;
    }

    if (p.isSkippedToday) {
      statusBadgeHtml += ` <span class="badge-rev-status status-skipped"><i class="fa-solid fa-forward-step"></i> Skipped</span>`;
    }

    // Completed today outcome display
    const currState = userStates[p.id];
    let completedOutcomeText = 'Completed Today';
    if (p.isCompletedToday && currState) {
      if (currState.lastRating === 'simple' && !currState.hintsUsed) {
        completedOutcomeText = 'Solved independently';
      } else if (currState.hintsUsed) {
        completedOutcomeText = 'Solved with hints';
      } else if (currState.lastRating === 'failed') {
        completedOutcomeText = 'Could not solve';
      }
    }

    const launchLabel = sectionType === 'spaced_revise' ? 'Recall Now' : (sectionType === 'topic_revise' ? 'Practice Now' : 'Solve Problem');
    const launchIcon = sectionType === 'spaced_revise' ? 'fa-solid fa-clock-rotate-left' : (sectionType === 'topic_revise' ? 'fa-solid fa-dumbbell' : 'fa-solid fa-play');
    const cardSectionClass = sectionType === 'spaced_revise' ? 'spaced-revision-card revision-card' : (sectionType === 'topic_revise' ? 'topic-revision-card revision-card' : 'learn-card');
    const isRevision = sectionType !== 'learn';

    return `
      <div class="plan-task-card ${cardSectionClass} ${p.isCompletedToday ? 'task-completed' : ''} ${isNextUp ? 'next-up-task' : ''}" data-problem-id="${p.id}" id="plan-task-${p.id}">
        <div class="plan-task-header">
          <div class="plan-task-badges">
            <span class="badge badge-task-position" title="Question position"><i class="fa-solid fa-hashtag"></i> ${taskIndex + 1} of ${totalTasks}</span>
            <span class="badge ${diffClass}">${p.difficulty}</span>
            <span class="plan-task-time"><i class="fa-solid fa-clock"></i> ~${estMins}m</span>
            ${statusBadgeHtml}
            ${isNextUp ? `<span class="badge-up-next"><i class="fa-solid fa-arrow-right"></i> Up Next</span>` : ''}
          </div>
          <div class="plan-task-actions-right">
            ${p.url ? `<a href="${p.url}" target="_blank" rel="noopener noreferrer" class="card-icon-btn" title="Open problem on platform" aria-label="Open ${escapedTitle}"><i class="fa-solid fa-arrow-up-right-from-square"></i></a>` : ''}
            <button class="card-icon-btn plan-trainer-btn" data-problem-id="${p.id}" title="Launch Discovery Trainer" aria-label="Launch Discovery Trainer"><i class="fa-solid fa-compass"></i></button>
            <button class="card-icon-btn plan-detail-btn" data-problem-id="${p.id}" title="Problem Notes & Details" aria-label="View problem details"><i class="fa-solid fa-circle-info"></i></button>
          </div>
        </div>

        <div class="plan-task-body">
          <h4 class="plan-task-title">
            <a href="${p.url || '#'}" ${p.url ? 'target="_blank" rel="noopener noreferrer"' : ''} class="plan-task-link" data-problem-id="${p.id}" title="${escapedTitle}">
              ${escapedTitle}
            </a>
          </h4>
          <p class="plan-task-reason">
            <i class="fa-solid fa-angle-right"></i> ${escapeHtml(reasonText)}
          </p>
        </div>

        ${p.isCompletedToday ? `
          <div class="plan-task-completed-bar">
            <div class="completed-info">
              <i class="fa-solid fa-circle-check"></i>
              <span>${completedOutcomeText}</span>
            </div>
            <button class="btn btn-secondary btn-xs plan-relog-btn" data-problem-id="${p.id}" data-section-type="${sectionType}" data-is-revision="${isRevision ? '1' : '0'}" title="Re-log outcome">
              Change
            </button>
          </div>
        ` : `
          <div class="plan-task-footer">
            <div class="plan-primary-btn-row" style="display:flex; gap:8px;">
              <button class="btn btn-primary btn-plan-launch" style="flex:1;" data-problem-id="${p.id}" data-url="${p.url || ''}" data-section-type="${sectionType}" data-is-revision="${isRevision ? '1' : '0'}">
                <i class="${launchIcon}"></i> ${launchLabel}
              </button>
              <button class="btn btn-secondary btn-plan-trainer" data-problem-id="${p.id}" title="Step-by-step discovery trainer">
                <i class="fa-solid fa-compass"></i> Discover
              </button>
            </div>

            <div class="plan-outcome-container">
              <span class="plan-outcome-title">Record Outcome:</span>
              <div class="plan-outcome-btn-group">
                <button class="outcome-btn outcome-independent" data-problem-id="${p.id}" data-outcome="independent" data-section-type="${sectionType}" data-is-revision="${isRevision ? '1' : '0'}" title="Solved independently without hints">
                  <i class="fa-solid fa-check"></i> Solved
                </button>
                <button class="outcome-btn outcome-hints" data-problem-id="${p.id}" data-outcome="hints" data-section-type="${sectionType}" data-is-revision="${isRevision ? '1' : '0'}" title="Solved with hints, assistance, or editorial">
                  <i class="fa-solid fa-lightbulb"></i> Hints
                </button>
                <button class="outcome-btn outcome-failed" data-problem-id="${p.id}" data-outcome="failed" data-section-type="${sectionType}" data-is-revision="${isRevision ? '1' : '0'}" title="Could not solve today">
                  <i class="fa-solid fa-xmark"></i> Failed
                </button>
                <button class="outcome-btn outcome-skip" data-problem-id="${p.id}" data-action="skip" title="Skip for now (stays in session queue)">
                  <i class="fa-solid fa-forward-step"></i> ${p.isSkippedToday ? 'Resume' : 'Skip'}
                </button>
              </div>
            </div>
          </div>
        `}
      </div>
    `;
  }

  function handleDailyPlanOutcome(problemId, outcome, sectionType = 'learn') {
    if (window.StorageEngine) {
      userStates = StorageEngine.getUserStates();
    }
    const p = allProblems.find(item => item.id === problemId);
    if (!p) return;

    const currState = userStates[problemId] || {};
    let rating = 'simple';
    let confidence = 4;
    let hintsUsed = false;
    let outcomeLabel = 'Solved independently';

    if (outcome === 'independent') {
      rating = 'simple';
      confidence = 4;
      hintsUsed = false;
      outcomeLabel = 'Solved independently';
    } else if (outcome === 'hints') {
      rating = 'medium';
      confidence = 3;
      hintsUsed = true;
      outcomeLabel = 'Solved with hints';
    } else if (outcome === 'failed') {
      rating = 'failed';
      confidence = 1;
      hintsUsed = false;
      outcomeLabel = 'Could not solve';
    }

    const isRevision = sectionType === 'spaced_revise' || sectionType === 'topic_revise' || sectionType === true || sectionType === '1';
    const isSpaced = sectionType === 'spaced_revise' || (sectionType === true && p.isSpacedRevision);
    const isTopicPractice = sectionType === 'topic_revise' || (sectionType === true && p.isTopicRevision);

    const estMinutes = (window.RoadmapEngine && RoadmapEngine.getProblemEstimatedMinutes)
      ? RoadmapEngine.getProblemEstimatedMinutes(p.difficulty, isRevision)
      : (p.difficulty === 'Easy' ? 15 : p.difficulty === 'Medium' ? 30 : 45);

    userStates[problemId] = SRSEngine.processReview(
      currState,
      rating,
      estMinutes,
      `Daily Plan: ${outcomeLabel}`,
      confidence,
      {
        hintsUsed: hintsUsed,
        isTopicPractice: isTopicPractice
      }
    );
    if (window.RoadmapEngine && RoadmapEngine.isTaskSkippedToday && RoadmapEngine.isTaskSkippedToday(problemId)) {
      RoadmapEngine.unskipPlanTask(problemId);
    }
    saveUserStates();

    // Gamification XP & Badges
    if (window.GamificationEngine) {
      if (outcome === 'independent') {
        GamificationEngine.awardXP('independent_solve');
      } else if (isSpaced && outcome !== 'failed') {
        GamificationEngine.awardXP('delayed_recall');
      } else {
        GamificationEngine.awardXP('review');
      }
      GamificationEngine.evaluateBadges(allProblems, userStates, monthlyTestHistory);
      updateGamificationHeader();
    }

    renderDashboard();

    // Show immediate concise confirmation & next recommended task
    const currentMins = (window.RoadmapEngine && RoadmapEngine.get12WeekTargetMinutes) ? RoadmapEngine.get12WeekTargetMinutes() : 120;
    const updatedPlan = RoadmapEngine.getDailyDSAPlan(currentMins, allProblems, userStates);
    const nextTaskObj = findNextPlanTask(updatedPlan);

    let confirmMsg = `✓ Recorded "${outcomeLabel}" for "${p.title}".`;
    if (nextTaskObj) {
      confirmMsg += ` Next task: "${nextTaskObj.task.title}".`;
    } else {
      confirmMsg += ` 🎉 Great job! All planned tasks completed.`;
    }
    showPlanConfirmation(confirmMsg);
  }

  function bindDailyPlanTaskEvents(container) {
    if (!container) return;
    bindSectionTaskEvents(container);
  }

  function bindSectionTaskEvents(container) {
    if (!container) return;

    // Launch buttons (Solve Problem / Revise Now)
    container.querySelectorAll('.btn-plan-launch').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        const id = btn.dataset.problemId;
        const url = btn.dataset.url;
        const p = allProblems.find(item => item.id === id);
        if (url) {
          window.open(url, '_blank', 'noopener,noreferrer');
        } else if (p) {
          openDetailModal(id);
        }
        const cardEl = document.getElementById(`plan-task-${id}`);
        if (cardEl) {
          cardEl.classList.add('pulse-focus-card');
          setTimeout(() => cardEl.classList.remove('pulse-focus-card'), 2000);
        }
      };
    });

    // Outcome recording and skip buttons
    container.querySelectorAll('.outcome-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        const id = btn.dataset.problemId;
        const outcome = btn.dataset.outcome;
        const action = btn.dataset.action;
        if (action === 'skip') {
          if (!window.RoadmapEngine) return;
          if (RoadmapEngine.isTaskSkippedToday(id)) {
            RoadmapEngine.unskipPlanTask(id);
            showPlanConfirmation(`✓ Resumed task.`);
          } else {
            RoadmapEngine.skipPlanTask(id);
            showPlanConfirmation(`✓ Skipped task for now (stays in queue).`);
          }
          renderDashboard();
          return;
        }
        const sectionType = btn.dataset.sectionType || (btn.dataset.isRevision === '1' ? 'topic_revise' : 'learn');
        handleDailyPlanOutcome(id, outcome, sectionType);
      };
    });

    // Replenishment stream buttons
    container.querySelectorAll('.btn-replenish-stream').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        const stream = btn.dataset.stream || 'learn';
        if (!window.RoadmapEngine) return;
        const curMins = (RoadmapEngine.get12WeekTargetMinutes && RoadmapEngine.get12WeekTargetMinutes()) || 120;
        const res = RoadmapEngine.replenishDailyPlan(stream, curMins, allProblems, userStates);
        renderDashboard();
        if (res && res.replenished && res.problem) {
          showPlanConfirmation(`✓ Added "${res.problem.title}" to session.`);
          setTimeout(() => {
            const cardEl = document.getElementById(`plan-task-${res.problem.id}`);
            if (cardEl) {
              cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              cardEl.classList.add('pulse-focus-card');
              setTimeout(() => cardEl.classList.remove('pulse-focus-card'), 2000);
            }
          }, 60);
        } else {
          showPlanConfirmation(`No additional eligible questions found in catalog.`);
        }
      };
    });

    // Re-log buttons
    container.querySelectorAll('.plan-relog-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        const id = btn.dataset.problemId;
        openRatingModal(id);
      };
    });

    // Discovery Trainer launch buttons
    container.querySelectorAll('.btn-plan-trainer, .plan-trainer-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        const id = btn.dataset.problemId;
        if (window.SolutionDiscoveryController) {
          window.SolutionDiscoveryController.openModal(id);
        }
      };
    });

    // Card links and detail buttons
    container.querySelectorAll('.plan-task-link, .plan-detail-btn').forEach(el => {
      el.onclick = (e) => {
        const id = el.dataset.problemId;
        const p = allProblems.find(item => item.id === id);
        if (el.classList.contains('plan-detail-btn') || !p?.url) {
          e.preventDefault();
          openDetailModal(id);
        }
      };
    });

    // Empty state buttons
    container.querySelectorAll('.btn-advance-week').forEach(btn => {
      btn.onclick = () => {
        if (!window.RoadmapEngine) return;
        const cur = RoadmapEngine.get12WeekCurrent();
        RoadmapEngine.set12WeekCurrent(Math.min(12, cur + 1));
        renderDailyDSAPlan();
      };
    });

    container.querySelectorAll('.btn-browse-catalog').forEach(btn => {
      btn.onclick = () => switchView('problems');
    });

    container.querySelectorAll('.btn-view-roadmap').forEach(btn => {
      btn.onclick = () => switchView('roadmap');
    });
  }

  let dailyPlanControlsInitialized = false;
  let activeRefreshStream = null;
  let activeRefreshPreview = null;
  let isExecutingRefresh = false;

  function openRefreshConfirmModal(streamName) {
    if (!window.RoadmapEngine) return;
    const modal = document.getElementById('refresh-confirm-modal');
    if (!modal) return;

    activeRefreshStream = streamName;
    const targetMins = (RoadmapEngine.get12WeekTargetMinutes && RoadmapEngine.get12WeekTargetMinutes()) || 120;
    const preview = RoadmapEngine.getRefreshPreview(streamName, targetMins, allProblems, userStates);
    activeRefreshPreview = preview;

    const modalTitle = document.getElementById('refresh-modal-title');
    const modalSubtitle = document.getElementById('refresh-modal-subtitle');
    const modalBadge = document.getElementById('refresh-modal-badge');
    const streamIcon = document.getElementById('refresh-modal-stream-icon');
    const markedCountEl = document.getElementById('refresh-modal-marked-count');
    const preservedCountEl = document.getElementById('refresh-modal-preserved-count');
    const availableCountEl = document.getElementById('refresh-modal-available-count');
    const expectedCountEl = document.getElementById('refresh-modal-expected-count');
    const alertBox = document.getElementById('refresh-modal-alert');
    const alertText = document.getElementById('refresh-modal-alert-text');
    const btnConfirm = document.getElementById('btn-refresh-confirm');
    const confirmLabel = document.getElementById('refresh-confirm-btn-label');

    // Configure stream branding
    if (streamName === 'learn') {
      if (modalTitle) modalTitle.textContent = 'Refresh Learn Questions';
      if (modalSubtitle) modalSubtitle.textContent = `Topic: ${preview.targetTopic}`;
      if (modalBadge) {
        modalBadge.textContent = 'LEARN';
        modalBadge.className = 'plan-section-badge learn-badge';
      }
      if (streamIcon) {
        streamIcon.style.background = 'rgba(139,124,255,0.15)';
        streamIcon.style.color = 'var(--primary, #8B7CFF)';
        streamIcon.innerHTML = '<i class="fa-solid fa-book-open" style="font-size:18px;"></i>';
      }
    } else if (streamName === 'topicRevision') {
      if (modalTitle) modalTitle.textContent = 'Refresh Topic Revision Questions';
      if (modalSubtitle) modalSubtitle.textContent = `Topic: ${preview.targetTopic}`;
      if (modalBadge) {
        modalBadge.textContent = 'TOPIC REVISION';
        modalBadge.className = 'plan-section-badge topic-revise-badge';
      }
      if (streamIcon) {
        streamIcon.style.background = 'rgba(66,214,197,0.15)';
        streamIcon.style.color = 'var(--secondary, #42D6C5)';
        streamIcon.innerHTML = '<i class="fa-solid fa-rotate-left" style="font-size:18px;"></i>';
      }
    } else if (streamName === 'spacedRevision') {
      if (modalTitle) modalTitle.textContent = 'Refresh Spaced Revision Questions';
      if (modalSubtitle) modalSubtitle.textContent = 'Due Spaced Recall · All Topics';
      if (modalBadge) {
        modalBadge.textContent = 'SPACED REVISION';
        modalBadge.className = 'plan-section-badge spaced-revise-badge';
      }
      if (streamIcon) {
        streamIcon.style.background = 'rgba(245,190,101,0.15)';
        streamIcon.style.color = 'var(--warning, #F5BE65)';
        streamIcon.innerHTML = '<i class="fa-solid fa-clock-rotate-left" style="font-size:18px;"></i>';
      }
    }

    if (markedCountEl) markedCountEl.textContent = preview.markedCount;
    if (preservedCountEl) preservedCountEl.textContent = preview.preservedCount;
    if (availableCountEl) availableCountEl.textContent = preview.availableCount;
    if (expectedCountEl) expectedCountEl.textContent = preview.expectedReplacements;

    // Handle alerts and button state
    if (preview.markedCount === 0) {
      if (alertBox) {
        alertBox.style.display = 'flex';
        alertBox.style.background = 'rgba(255, 115, 133, 0.12)';
        alertBox.style.border = '1px solid rgba(255, 115, 133, 0.3)';
        alertBox.style.color = 'var(--error, #FF7385)';
      }
      if (alertText) alertText.textContent = 'No completed or skipped questions to refresh. Pending questions are already active in today\'s set.';
      if (btnConfirm) btnConfirm.disabled = true;
      if (confirmLabel) confirmLabel.textContent = 'Nothing to Refresh';
    } else if (preview.availableCount === 0) {
      if (alertBox) {
        alertBox.style.display = 'flex';
        alertBox.style.background = 'rgba(255, 115, 133, 0.12)';
        alertBox.style.border = '1px solid rgba(255, 115, 133, 0.3)';
        alertBox.style.color = 'var(--error, #FF7385)';
      }
      if (alertText) {
        alertText.textContent = streamName === 'spacedRevision'
          ? 'No further due SRS reviews available today. Non-due questions are never forced into the queue.'
          : 'No additional eligible replacement questions available in the catalog for this topic.';
      }
      if (btnConfirm) btnConfirm.disabled = true;
      if (confirmLabel) confirmLabel.textContent = 'No Replacements';
    } else if (preview.shortfall > 0) {
      if (alertBox) {
        alertBox.style.display = 'flex';
        alertBox.style.background = 'rgba(245, 190, 101, 0.12)';
        alertBox.style.border = '1px solid rgba(245, 190, 101, 0.3)';
        alertBox.style.color = 'var(--warning, #F5BE65)';
      }
      if (alertText) alertText.textContent = `Partial replenishment: only ${preview.availableCount} replacement question(s) available (${preview.shortfall} shortfall).`;
      if (btnConfirm) btnConfirm.disabled = false;
      if (confirmLabel) confirmLabel.textContent = `Confirm (${preview.expectedReplacements} new)`;
    } else {
      if (alertBox) alertBox.style.display = 'none';
      if (btnConfirm) btnConfirm.disabled = false;
      if (confirmLabel) confirmLabel.textContent = `Confirm Refresh (${preview.expectedReplacements} new)`;
    }

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    const cancelBtn = document.getElementById('btn-refresh-cancel');
    if (cancelBtn) cancelBtn.focus();
  }

  function closeRefreshConfirmModal() {
    const modal = document.getElementById('refresh-confirm-modal');
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.overflow = '';
    const lastStream = activeRefreshStream;
    activeRefreshPreview = null;
    isExecutingRefresh = false;

    // Restore focus to initiating button
    if (lastStream === 'learn') {
      const b = document.getElementById('btn-refresh-learn');
      if (b) b.focus();
    } else if (lastStream === 'topicRevision') {
      const b = document.getElementById('btn-refresh-topic-revise');
      if (b) b.focus();
    } else if (lastStream === 'spacedRevision') {
      const b = document.getElementById('btn-refresh-spaced-revise');
      if (b) b.focus();
    }
  }

  function executeRefreshConfirm() {
    if (isExecutingRefresh || !activeRefreshStream || !window.RoadmapEngine) return;
    isExecutingRefresh = true;

    const btnConfirm = document.getElementById('btn-refresh-confirm');
    const confirmLabel = document.getElementById('refresh-confirm-btn-label');
    const alertBox = document.getElementById('refresh-modal-alert');
    const alertText = document.getElementById('refresh-modal-alert-text');

    if (btnConfirm) btnConfirm.disabled = true;
    if (confirmLabel) confirmLabel.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Refreshing...';

    const targetMins = (RoadmapEngine.get12WeekTargetMinutes && RoadmapEngine.get12WeekTargetMinutes()) || 120;
    const expectedRev = activeRefreshPreview ? activeRefreshPreview.revision : undefined;

    const result = RoadmapEngine.refreshStreamQuestions(
      activeRefreshStream,
      targetMins,
      allProblems,
      userStates,
      { expectedRev }
    );

    if (!result.success) {
      if (result.stalePreview) {
        if (alertBox) {
          alertBox.style.display = 'flex';
          alertBox.style.background = 'rgba(255, 115, 133, 0.12)';
          alertBox.style.border = '1px solid rgba(255, 115, 133, 0.3)';
          alertBox.style.color = 'var(--error, #FF7385)';
        }
        if (alertText) alertText.textContent = result.error || 'Plan was updated. Reviewing refreshed state...';
        setTimeout(() => openRefreshConfirmModal(activeRefreshStream), 1200);
      } else {
        if (alertBox) {
          alertBox.style.display = 'flex';
          alertBox.style.background = 'rgba(255, 115, 133, 0.12)';
          alertBox.style.border = '1px solid rgba(255, 115, 133, 0.3)';
          alertBox.style.color = 'var(--error, #FF7385)';
        }
        if (alertText) alertText.textContent = result.message || result.error || 'Refresh failed';
      }
      if (btnConfirm) btnConfirm.disabled = false;
      if (confirmLabel) confirmLabel.textContent = 'Retry';
      isExecutingRefresh = false;
      return;
    }

    // Success! Close modal and re-render
    closeRefreshConfirmModal();
    renderDailyDSAPlan();

    // Show feedback banner
    const feedbackBanner = document.getElementById('dsa-plan-feedback-banner');
    const feedbackText = document.getElementById('dsa-plan-feedback-text');
    if (feedbackBanner && feedbackText) {
      const streamDisplayName = result.streamName === 'learn' ? 'Learn' : (result.streamName === 'topicRevision' ? 'Topic Revision' : 'Spaced Revision');
      let msg = `${streamDisplayName} refreshed: ${result.replacedCount} marked question${result.replacedCount === 1 ? '' : 's'} replaced.`;
      if (result.shortfall > 0) {
        msg += ` (${result.shortfall} question shortfall due to catalog limit).`;
      }
      feedbackText.textContent = msg;
      feedbackBanner.style.display = 'flex';
      setTimeout(() => {
        feedbackBanner.style.display = 'none';
      }, 5000);
    }
  }

  function setupDailyPlanControls() {
    if (dailyPlanControlsInitialized) return;
    dailyPlanControlsInitialized = true;

    const learningTopicSelect = document.getElementById('dsa-plan-learning-topic-select');
    const revisionTopicSelect = document.getElementById('dsa-plan-revision-topic-select');
    const btnCloseFeedback = document.getElementById('btn-close-plan-feedback');
    const btnToggleAnalytics = document.getElementById('btn-toggle-secondary-analytics');

    if (learningTopicSelect) {
      learningTopicSelect.addEventListener('change', (e) => {
        if (!window.RoadmapEngine) return;
        RoadmapEngine.setCurrentLearningTopic(e.target.value);
        renderDailyDSAPlan();
      });
    }

    if (revisionTopicSelect) {
      revisionTopicSelect.addEventListener('change', (e) => {
        if (!window.RoadmapEngine) return;
        RoadmapEngine.setRevisionTopic(e.target.value);
        renderDailyDSAPlan();
      });
    }

    // Refresh controls wiring
    const btnRefreshLearn = document.getElementById('btn-refresh-learn');
    const btnRefreshTopicRevise = document.getElementById('btn-refresh-topic-revise');
    const btnRefreshSpacedRevise = document.getElementById('btn-refresh-spaced-revise');

    if (btnRefreshLearn) {
      btnRefreshLearn.addEventListener('click', () => openRefreshConfirmModal('learn'));
    }
    if (btnRefreshTopicRevise) {
      btnRefreshTopicRevise.addEventListener('click', () => openRefreshConfirmModal('topicRevision'));
    }
    if (btnRefreshSpacedRevise) {
      btnRefreshSpacedRevise.addEventListener('click', () => openRefreshConfirmModal('spacedRevision'));
    }

    // Refresh modal buttons wiring
    const btnRefreshCancel = document.getElementById('btn-refresh-cancel');
    const btnCloseRefreshModal = document.getElementById('btn-close-refresh-modal');
    const btnRefreshConfirm = document.getElementById('btn-refresh-confirm');
    const refreshModal = document.getElementById('refresh-confirm-modal');

    if (btnRefreshCancel) btnRefreshCancel.addEventListener('click', closeRefreshConfirmModal);
    if (btnCloseRefreshModal) btnCloseRefreshModal.addEventListener('click', closeRefreshConfirmModal);
    if (btnRefreshConfirm) btnRefreshConfirm.addEventListener('click', executeRefreshConfirm);

    if (refreshModal) {
      refreshModal.addEventListener('click', (e) => {
        if (e.target === refreshModal) closeRefreshConfirmModal();
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && refreshModal && refreshModal.style.display === 'flex') {
        closeRefreshConfirmModal();
      }
    });

    if (btnCloseFeedback) {
      btnCloseFeedback.addEventListener('click', () => {
        const banner = document.getElementById('dsa-plan-feedback-banner');
        if (banner) banner.style.display = 'none';
      });
    }

    if (btnToggleAnalytics) {
      btnToggleAnalytics.addEventListener('click', () => {
        const content = document.getElementById('secondary-analytics-content');
        if (!content) return;
        const isExpanded = btnToggleAnalytics.getAttribute('aria-expanded') === 'true';
        btnToggleAnalytics.setAttribute('aria-expanded', String(!isExpanded));
        btnToggleAnalytics.classList.toggle('expanded', !isExpanded);
        content.style.display = isExpanded ? 'none' : 'block';
      });
    }
  }

  // --- FEATURE: ADAPTIVE LEARNING LOOP & MASTERY CALIBRATION (P1 & P2) ---

  function renderAdaptiveLoopRecommendation() {
    const card = document.getElementById('adaptive-learning-loop-card');
    if (!card || !window.AdaptiveLearningEngine) return;

    const rec = AdaptiveLearningEngine.selectNextAction(allProblems, userStates);
    currentAdaptiveRecommendation = rec;

    if (!rec) {
      card.style.display = 'none';
      return;
    }

    card.style.display = 'flex';

    const meta = rec.actionMetadata || AdaptiveLearningEngine.ACTION_METADATA[rec.action] || {
      label: 'Recommended Action',
      icon: 'fa-arrows-spin',
      color: '#38bdf8'
    };

    const typeEl = document.getElementById('adaptive-loop-action-type');
    const badgeEl = document.getElementById('adaptive-loop-badge');
    const titleEl = document.getElementById('adaptive-loop-title');
    const expEl = document.getElementById('adaptive-loop-explanation');
    const sourceEl = document.getElementById('adaptive-meta-source');
    const statusEl = document.getElementById('adaptive-meta-status');
    const btnTextEl = document.getElementById('btn-adaptive-loop-text');

    if (typeEl) typeEl.textContent = meta.label;
    if (badgeEl) {
      badgeEl.innerHTML = `<i class="fa-solid ${meta.icon}"></i> <span>${meta.label}</span>`;
      if (meta.color) badgeEl.style.color = meta.color;
    }
    if (titleEl) {
      titleEl.textContent = `${rec.problemTitle} (${rec.difficulty} • ${rec.topic})`;
    }
    if (expEl) {
      expEl.textContent = rec.explanation;
    }
    if (sourceEl) {
      const srcLabel = rec.evidence?.source === 'graph-engine' ? 'Prerequisite Graph'
        : rec.evidence?.source === 'srs-engine' ? 'SRS Retention Interval'
        : rec.evidence?.source === 'failure-engine' ? 'Failure Diagnosis'
        : rec.evidence?.source === 'roadmap-engine' ? 'Roadmap Track'
        : 'Multi-Signal Evidence';
      sourceEl.innerHTML = `<i class="fa-solid fa-brain"></i> Evidence: ${srcLabel}`;
    }
    if (statusEl) {
      const storedInterventions = AdaptiveLearningEngine.getStoredInterventions();
      const prevIntervention = storedInterventions.slice().reverse().find(it => it.targetProblemId === rec.targetProblemId);
      if (prevIntervention) {
        const verification = AdaptiveLearningEngine.verifyIntervention(prevIntervention, userStates, allProblems);
        if (verification.status === 'resolved') {
          statusEl.innerHTML = `<i class="fa-solid fa-circle-check" style="color:#10b981;"></i> Follow-Up: Resolved (${verification.elapsedHours}h)`;
        } else if (verification.status === 'partially_improved') {
          statusEl.innerHTML = `<i class="fa-solid fa-clock-rotate-left" style="color:#f59e0b;"></i> Follow-Up: Partial Recovery`;
        } else {
          statusEl.innerHTML = `<i class="fa-solid fa-arrows-spin" style="color:#38bdf8;"></i> Follow-Up: Active`;
        }
      } else {
        statusEl.innerHTML = `<i class="fa-solid fa-check-double" style="color:#10b981;"></i> Closed-Loop: Ready`;
      }
    }
    if (btnTextEl) {
      if (rec.action === 'prerequisite_practice') {
        btnTextEl.textContent = 'Practice Stepping-Stone';
      } else if (rec.action === 'spaced_revision') {
        btnTextEl.textContent = 'Revise for Retention';
      } else if (rec.action === 'independent_retry') {
        btnTextEl.textContent = 'Retry Independently';
      } else if (rec.action === 'edge_case_drill') {
        btnTextEl.textContent = 'Solve with Checklist';
      } else {
        btnTextEl.textContent = 'Start Recommended Task';
      }
    }
  }

  function handleAdaptiveLoopAction() {
    if (!currentAdaptiveRecommendation) return;

    if (window.AdaptiveLearningEngine) {
      AdaptiveLearningEngine.recordIntervention(currentAdaptiveRecommendation, userStates);
      saveUserStates();
    }

    const problem = allProblems.find(p => p.id === currentAdaptiveRecommendation.problemId);
    if (!problem) return;

    if (problem.url) {
      window.open(problem.url, '_blank', 'noopener,noreferrer');
    }

    openRatingModal(problem.id);
    showPlanConfirmation(`Adaptive Loop active: ${currentAdaptiveRecommendation.explanation}`);
  }

  function renderMasteryCalibration() {
    if (!window.AdaptiveLearningEngine) return;

    let mockList = [];
    try {
      if (window.LearnerRepository) {
        mockList = window.LearnerRepository.getMockHistory() || [];
      } else {
        const rawMocks = localStorage.getItem('algorecall_mock_history_v2');
        if (rawMocks) mockList = JSON.parse(rawMocks);
      }
    } catch (_) {}

    const calib = AdaptiveLearningEngine.evaluateMasteryCalibration(allProblems, userStates, mockList);

    const attemptedEl = document.getElementById('calib-count-attempted');
    const provEl = document.getElementById('calib-count-provisional');
    const retainedEl = document.getElementById('calib-count-retained');
    const masteredEl = document.getElementById('calib-count-mastered');

    if (attemptedEl) attemptedEl.textContent = calib.counts.attempted;
    if (provEl) provEl.textContent = calib.counts.provisionallyLearned;
    if (retainedEl) retainedEl.textContent = calib.counts.retained;
    if (masteredEl) masteredEl.textContent = calib.counts.mastered;

    const headingEl = document.getElementById('uncertainty-heading');
    const expEl = document.getElementById('uncertainty-explanation');
    const pillEl = document.getElementById('uncertainty-status-pill');

    if (headingEl) {
      headingEl.textContent = calib.uncertainty.isProvisional
        ? 'Readiness Score: Provisional Interval'
        : 'Readiness Score: Empirical Calibration';
    }
    if (expEl) {
      expEl.textContent = calib.uncertainty.explanation;
    }
    if (pillEl) {
      pillEl.textContent = calib.uncertainty.isProvisional
        ? `Provisional (±${calib.uncertainty.uncertaintyMargin} pts)`
        : `Empirical (±${calib.uncertainty.uncertaintyMargin} pts)`;
      if (calib.uncertainty.isProvisional) {
        pillEl.style.borderColor = 'rgba(245, 158, 11, 0.4)';
        pillEl.style.color = '#f59e0b';
        pillEl.style.background = 'rgba(245, 158, 11, 0.12)';
      } else {
        pillEl.style.borderColor = 'rgba(16, 185, 129, 0.4)';
        pillEl.style.color = '#10b981';
        pillEl.style.background = 'rgba(16, 185, 129, 0.12)';
      }
    }
  }

  // --- VIEW 2: PROBLEM SHEETS EXPLORER ---
  function renderProblemsTable() {
    const tbody = document.getElementById('all-problems-tbody');
    if (!tbody) return;

    const sheetFilter = document.getElementById('filter-sheet')?.value || 'all';
    const compFilter = document.getElementById('filter-company')?.value || 'all';
    const topicFilter = document.getElementById('filter-topic')?.value || 'all';
    const diffFilter = document.getElementById('filter-difficulty')?.value || 'all';
    const statusFilter = document.getElementById('filter-status')?.value || 'all';
    const searchVal = document.getElementById('global-search-input')?.value.toLowerCase().trim() || '';

    const filtered = allProblems.filter(p => {
      const state = userStates[p.id];
      const dueInfo = SRSEngine.getDueStatus(state);

      if (sheetFilter !== 'all') {
        const problemSheets = p.sheets || (p.sheet ? [p.sheet] : ['Custom']);
        if (!problemSheets.some(s => s.toLowerCase().includes(sheetFilter.toLowerCase()))) {
          return false;
        }
      }

      if (compFilter !== 'all') {
        const comps = p.companies || [];
        const match = comps.some(c => {
          if (compFilter === 'Meta') return c.toLowerCase() === 'meta' || c.toLowerCase() === 'facebook';
          if (compFilter === 'TCS') return c.toLowerCase() === 'tcs' || c.toLowerCase() === 'infosys' || c.toLowerCase() === 'wipro';
          return c.toLowerCase().includes(compFilter.toLowerCase());
        });
        if (!match) return false;
      }

      if (topicFilter !== 'all' && p.topic !== topicFilter) return false;
      if (diffFilter !== 'all' && p.difficulty !== diffFilter) return false;

      if (statusFilter !== 'all') {
        if (statusFilter === 'due' && !SRSEngine.isDue(state)) return false;
        if (statusFilter === 'in-progress' && (!state || !state.lastReviewed || state.isMastered)) return false;
        if (statusFilter === 'mastered' && (!state || !state.isMastered)) return false;
        if (statusFilter === 'unsolved' && state && state.lastReviewed) return false;
      }

      if (searchVal) {
        const matchTitle = p.title.toLowerCase().includes(searchVal);
        const matchTopic = (p.topic || '').toLowerCase().includes(searchVal);
        const matchPattern = (p.pattern || '').toLowerCase().includes(searchVal);
        const matchNotes = (p.notes || '').toLowerCase().includes(searchVal);
        const matchCompany = (p.companies || []).some(c => c.toLowerCase().includes(searchVal));
        const matchSheet = (p.sheets || [p.sheet || '']).some(s => s.toLowerCase().includes(searchVal));
        if (!matchTitle && !matchTopic && !matchPattern && !matchNotes && !matchCompany && !matchSheet) return false;
      }

      return true;
    });

    // Update Problem Explorer live count metrics
    let filteredSolved = 0;
    let filteredDue = 0;
    filtered.forEach(p => {
      const s = userStates[p.id];
      if (s && s.lastReviewed) filteredSolved++;
      if (SRSEngine.isDue(s)) filteredDue++;
    });
    const filteredUnsolved = filtered.length - filteredSolved;

    const expTotalEl = document.getElementById('explorer-filtered-total');
    const expSolvedEl = document.getElementById('explorer-filtered-solved');
    const expUnsolvedEl = document.getElementById('explorer-filtered-unsolved');
    const expDueEl = document.getElementById('explorer-filtered-due');

    if (expTotalEl) expTotalEl.textContent = filtered.length;
    if (expSolvedEl) expSolvedEl.textContent = filteredSolved;
    if (expUnsolvedEl) expUnsolvedEl.textContent = filteredUnsolved;
    if (expDueEl) expDueEl.textContent = filteredDue;

    tbody.innerHTML = '';
    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px; color:var(--text-dim);">No problems match the selected filters.</td></tr>`;
      return;
    }

    const tableFragment = document.createDocumentFragment();
    filtered.forEach(p => {
      const state = userStates[p.id];
      const dueInfo = SRSEngine.getDueStatus(state);
      const isSolved = state && state.lastReviewed;
      const conf = SRSEngine.getConfidence(state);
      const sheetsList = p.sheets || (p.sheet ? [p.sheet] : ['Custom']);

      const confBadgeHtml = conf
        ? `<span class="conf-badge conf-${conf}" title="${SRSEngine.getConfidenceMeta(conf).label}">⭐ ${conf}/5</span>`
        : `<span style="color:var(--text-dim); font-size:12px;">—</span>`;

      const tr = document.createElement('tr');
      if (dueInfo.code === 'due' || dueInfo.code === 'overdue') tr.classList.add('due-row');
      if (dueInfo.code === 'mastered') tr.classList.add('mastered-row');

      tr.innerHTML = `
        <td>
          <input type="checkbox" class="prob-checkbox" data-id="${p.id}" ${isSolved ? 'checked' : ''} style="cursor:pointer; width:16px; height:16px; accent-color:var(--primary);">
        </td>
        <td>
          <div class="problem-title-cell">
            <a href="${p.url || '#'}" target="_blank" class="problem-title">${p.title}</a>
            ${p.companies && p.companies.length ? `
              <div class="company-chip-wrap" style="margin-top:4px;">
                ${p.companies.slice(0, 3).map(c => `<span class="company-badge ${c.toLowerCase().replace(/[^a-z]/g, '')}">🏢 ${c}</span>`).join('')}
              </div>
            ` : ''}
          </div>
        </td>
        <td><strong>${p.topic}</strong><br><span style="font-size:11px; color:var(--text-dim);">${p.pattern || ''}</span></td>
        <td><span class="badge badge-${p.difficulty.toLowerCase()}">${p.difficulty}</span></td>
        <td>${confBadgeHtml}</td>
        <td>
          <div style="display:flex; flex-wrap:wrap; gap:4px;">
            ${sheetsList.map(s => `<span class="badge badge-srs-upcoming" style="font-size:10px;">${s}</span>`).join('')}
          </div>
        </td>
        <td><span class="badge badge-srs-${dueInfo.code}">${dueInfo.label}</span></td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-secondary btn-sm btn-action-review" data-id="${p.id}" title="Log Recall Rating & Confidence">
              <i class="fa-solid fa-rotate"></i> Rate
            </button>
            <button class="btn btn-secondary btn-sm btn-action-detail" data-id="${p.id}" title="View Details, History & Progression">
              <i class="fa-solid fa-file-lines"></i>
            </button>
          </div>
        </td>
      `;
      tableFragment.appendChild(tr);
    });
    tbody.appendChild(tableFragment);
  }

  // --- VIEW 3: REVISION QUEUE & NEXT RECOMMENDED REVISION ---
  function renderRevisionBanner() {
    const banner = document.getElementById('revision-next-recommended-banner');
    if (!banner) return;

    // Find all problems with state and lastReviewed
    const reviewed = allProblems.filter(p => {
      const st = userStates[p.id];
      return st && st.lastReviewed;
    });

    if (reviewed.length === 0) {
      banner.style.display = 'block';
      banner.innerHTML = `
        <div class="revision-recommend-banner">
          <div class="revision-recommend-left">
            <div class="revision-recommend-icon">
              <i class="fa-solid fa-graduation-cap"></i>
            </div>
            <div class="revision-recommend-info">
              <h3><span>Revision Queue Clean</span></h3>
              <p>You haven't logged any problem reviews yet. Start solving problems in the <strong>Practice</strong> tab to automatically build your scientifically scheduled spaced repetition queue.</p>
            </div>
          </div>
          <div class="revision-recommend-actions">
            <button class="btn btn-primary btn-sm" onclick="switchView('practice')">
              <i class="fa-solid fa-arrow-right"></i> Start Practice
            </button>
          </div>
        </div>
      `;
      return;
    }

    // Prioritize:
    // 1. Due problems (sorted by most overdue or earliest nextReviewDate)
    // 2. Retention-risk problems (confidence <= 2)
    // 3. Next upcoming problem
    const dueProblems = reviewed.filter(p => SRSEngine.isDue(userStates[p.id]));
    let recProblem = null;
    let recReason = '';

    if (dueProblems.length > 0) {
      dueProblems.sort((a, b) => {
        const da = new Date(userStates[a.id].nextReviewDate || 0);
        const db = new Date(userStates[b.id].nextReviewDate || 0);
        return da - db;
      });
      recProblem = dueProblems[0];
      const state = userStates[recProblem.id];
      const dueInfo = SRSEngine.getDueStatus(state);
      recReason = `Immediate Spaced Review Due (${dueInfo.label})`;
    } else {
      const weak = reviewed.filter(p => {
        const conf = SRSEngine.getConfidence(userStates[p.id]);
        return conf && conf <= 2;
      });
      if (weak.length > 0) {
        recProblem = weak[0];
        recReason = 'Low Confidence / Retention Risk';
      } else {
        reviewed.sort((a, b) => {
          const da = new Date(userStates[a.id].nextReviewDate || 0);
          const db = new Date(userStates[b.id].nextReviewDate || 0);
          return da - db;
        });
        recProblem = reviewed[0];
        recReason = `Next upcoming review: ${userStates[recProblem.id].nextReviewDate || 'Scheduled'}`;
      }
    }

    if (!recProblem) {
      banner.style.display = 'none';
      return;
    }

    const state = userStates[recProblem.id] || {};
    const conf = SRSEngine.getConfidence(state);
    const confStr = conf ? `Conf ${conf}/5` : 'Stage ' + (state.stage || 1);

    banner.style.display = 'block';
    banner.innerHTML = `
      <div class="revision-recommend-banner">
        <div class="revision-recommend-left">
          <div class="revision-recommend-icon">
            <i class="fa-solid fa-bell"></i>
          </div>
          <div class="revision-recommend-info">
            <h3>
              <span>Top Recommended Revision:</span>
              <a href="${recProblem.url || '#'}" target="_blank" class="problem-title" style="color:var(--primary); font-weight:700;">${recProblem.title}</a>
              <span class="badge badge-${recProblem.difficulty.toLowerCase()}">${recProblem.difficulty}</span>
              <span class="badge badge-srs-due" style="font-size:11px;">${recReason}</span>
            </h3>
            <p>Topic: <strong>${recProblem.topic}</strong> • Pattern: <strong>${recProblem.pattern || 'Standard'}</strong> • Memory Status: <strong>${confStr}</strong></p>
          </div>
        </div>
        <div class="revision-recommend-actions">
          <button class="btn btn-primary btn-sm btn-action-review" data-id="${recProblem.id}">
            <i class="fa-solid fa-rotate"></i> Revise Now
          </button>
          <button class="btn btn-secondary btn-sm btn-action-detail" data-id="${recProblem.id}">
            <i class="fa-solid fa-file-lines"></i> Details
          </button>
        </div>
      </div>
    `;
  }

  function renderRevisionQueue() {
    renderRevisionBanner();
    const tbody = document.getElementById('revision-queue-tbody');
    if (!tbody) return;

    const activeFilterBtn = document.querySelector('[data-revision-filter].active');
    const filterMode = activeFilterBtn ? activeFilterBtn.getAttribute('data-revision-filter') : 'due';

    const list = allProblems.filter(p => {
      const state = userStates[p.id];
      if (!state || !state.lastReviewed) return false;

      if (filterMode === 'due') {
        return SRSEngine.isDue(state);
      } else if (filterMode === 'weak') {
        const conf = SRSEngine.getConfidence(state);
        const isLowConf = conf && conf <= 2;
        const isFailed = state.lastRating === 'hard' || state.lastRating === 'failed';
        const isDecayed = typeof SRSEngine.calculateRetention === 'function' ? SRSEngine.calculateRetention(state) < 0.6 : false;
        return isLowConf || isFailed || isDecayed;
      } else if (filterMode === 'upcoming') {
        return !SRSEngine.isDue(state) && !state.isMastered;
      } else if (filterMode === 'mastered') {
        return state.isMastered;
      }
      return true;
    });

    tbody.innerHTML = '';
    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px; color:var(--text-dim);">No revision items found for '${filterMode}' mode.</td></tr>`;
      return;
    }

    const revFragment = document.createDocumentFragment();
    list.forEach(p => {
      const state = userStates[p.id];
      const dueInfo = SRSEngine.getDueStatus(state);
      const conf = SRSEngine.getConfidence(state);
      const confBadgeHtml = conf
        ? `<span class="conf-badge conf-${conf}" title="${SRSEngine.getConfidenceMeta(conf).label}">⭐ ${conf}/5</span>`
        : `<span style="color:var(--text-dim); font-size:12px;">—</span>`;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span class="badge badge-srs-${dueInfo.code}">${dueInfo.label}</span></td>
        <td>
          <a href="${p.url || '#'}" target="_blank" class="problem-title">${p.title}</a>
          <div style="font-size:11.5px; color:var(--text-dim);">${p.pattern || ''}</div>
        </td>
        <td>${p.topic}</td>
        <td><span class="badge badge-${p.difficulty.toLowerCase()}">${p.difficulty}</span></td>
        <td>${confBadgeHtml}</td>
        <td><span class="badge badge-srs-upcoming">Stage ${state.stage || 1}</span> <span style="font-size:11px; color:var(--text-dim);">(${state.lastRating || 'medium'})</span></td>
        <td><span style="font-family:'JetBrains Mono', monospace; font-size:12px;">${state.nextReviewDate || 'N/A'}</span></td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-primary btn-sm btn-action-review" data-id="${p.id}" title="Log Recall Rating & Confidence">
              <i class="fa-solid fa-rotate"></i> Revise
            </button>
            <button class="btn btn-secondary btn-sm btn-action-detail" data-id="${p.id}" title="View Details, History & Progression">
              <i class="fa-solid fa-file-lines"></i>
            </button>
          </div>
        </td>
      `;
      revFragment.appendChild(tr);
    });
    tbody.appendChild(revFragment);
  }

  // --- VIEW 4: MONTHLY ASSESSMENT & MOCK EXAMS ---
  function renderMonthlyTestView() {
    const coveredTopics = MonthlyAssessmentEngine.getCoveredTopics(allProblems, userStates);
    const solvedCount = Object.values(userStates).filter(s => s && s.lastReviewed).length;

    const coveredCountEl = document.getElementById('monthly-covered-count');
    const poolCountEl = document.getElementById('monthly-pool-count');

    if (coveredCountEl) coveredCountEl.textContent = `${coveredTopics.length} Topics Covered`;
    if (poolCountEl) poolCountEl.textContent = `${solvedCount} Problems in Pool`;

    // Render Past Tests
    const tbody = document.getElementById('monthly-test-history-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (monthlyTestHistory.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:25px; color:var(--text-dim);">No monthly tests completed yet. Click 'Start Monthly Assessment' to take your first test!</td></tr>`;
      return;
    }

    const testHistFragment = document.createDocumentFragment();
    monthlyTestHistory.slice().reverse().forEach(test => {
      const dateStr = new Date(test.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span style="font-family:'Fira Code', monospace; font-size:12px;">${dateStr}</span></td>
        <td><span style="font-size:12px; color:var(--text-muted);">${(test.coveredTopics || []).slice(0, 3).join(', ')}</span></td>
        <td>${test.breakdown ? test.breakdown.length : 4} Questions</td>
        <td><strong style="color:var(--primary); font-size:15px;">${test.percentage}%</strong></td>
        <td><span class="badge badge-srs-due">${test.grade}</span></td>
        <td><span style="font-size:12px; color:var(--text-dim);">${test.summary}</span></td>
      `;
      testHistFragment.appendChild(tr);
    });
    tbody.appendChild(testHistFragment);
  }

  // State for analytics time filtering
  let currentAnalyticsWindow = 'all';

  function setupAnalyticsTimeFilterListeners() {
    const filterBtns = document.querySelectorAll('.analytics-filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const win = btn.getAttribute('data-window') || 'all';
        currentAnalyticsWindow = win;
        filterBtns.forEach(b => b.classList.toggle('active', b === btn));
        renderAnalytics();
      });
    });
  }

  // --- VIEW 5: TOPIC MASTERY & ANALYTICS ---
  function renderAnalytics() {
    // 1. Stage 9 Authoritative Analytics Computation
    if (typeof AnalyticsEngine !== 'undefined') {
      const analytics = AnalyticsEngine.computeComprehensiveAnalytics({
        timeWindow: currentAnalyticsWindow,
        useCache: true
      });

      const act = analytics.activity;
      const eff = analytics.effectiveness;
      const adh = analytics.adherence;
      const top = analytics.topicAnalytics;

      // Update Key Stat Cards
      const uniqueSolvedEl = document.getElementById('analytics-unique-solved');
      const catalogTotalEl = document.getElementById('analytics-catalog-total');
      const uniqueAttemptedEl = document.getElementById('analytics-unique-attempted');
      const coverageBadgeEl = document.getElementById('analytics-coverage-badge');
      const terminalAttemptsEl = document.getElementById('analytics-terminal-attempts');
      const sessionsInitiatedEl = document.getElementById('analytics-sessions-initiated');
      const independenceRateEl = document.getElementById('analytics-independence-rate');
      const independenceCaptionEl = document.getElementById('analytics-independence-caption');
      const learningTimeEl = document.getElementById('analytics-learning-time');
      const timeEventsCountEl = document.getElementById('analytics-time-events-count');

      if (uniqueSolvedEl) uniqueSolvedEl.textContent = act.uniqueProblemsSolved;
      if (catalogTotalEl) catalogTotalEl.textContent = act.totalCatalogProblems;
      if (uniqueAttemptedEl) uniqueAttemptedEl.textContent = act.uniqueProblemsAttempted;
      if (coverageBadgeEl) {
        const covPct = act.totalCatalogProblems > 0 ? Math.round((act.uniqueProblemsSolved / act.totalCatalogProblems) * 100) : 0;
        coverageBadgeEl.textContent = `${covPct}% of Catalog`;
      }

      if (terminalAttemptsEl) terminalAttemptsEl.textContent = act.totalTerminalAttempts;
      if (sessionsInitiatedEl) sessionsInitiatedEl.textContent = act.totalSessionsInitiated;

      if (independenceRateEl) {
        independenceRateEl.textContent = eff.independentSolveRate !== null ? `${eff.independentSolveRate}%` : '--%';
      }
      if (independenceCaptionEl) {
        independenceCaptionEl.textContent = eff.insufficientData
          ? 'No terminal evaluations in window'
          : `${act.outcomes.independentSolves} of ${act.totalTerminalAttempts} solves unassisted`;
      }

      if (learningTimeEl) {
        const totalMins = act.timeTracking.totalReliableTimeMinutes || 0;
        const hrs = Math.floor(totalMins / 60);
        const mins = Math.round(totalMins % 60);
        learningTimeEl.textContent = `${hrs}h ${mins}m`;
      }
      if (timeEventsCountEl) timeEventsCountEl.textContent = act.timeTracking.recordedTimeEventCount;

      // Update Outcome Distribution Breakdown & Chart
      const sampleSizeEl = document.getElementById('analytics-outcome-sample-size');
      if (sampleSizeEl) sampleSizeEl.textContent = `${act.totalTerminalAttempts} evaluated attempts`;

      const indCountEl = document.getElementById('analytics-ind-count');
      const indPctEl = document.getElementById('analytics-ind-pct');
      const astCountEl = document.getElementById('analytics-ast-count');
      const astPctEl = document.getElementById('analytics-ast-pct');
      const revCountEl = document.getElementById('analytics-rev-count');
      const revPctEl = document.getElementById('analytics-rev-pct');
      const failCountEl = document.getElementById('analytics-fail-count');
      const failPctEl = document.getElementById('analytics-fail-pct');

      if (indCountEl) indCountEl.textContent = act.outcomes.independentSolves;
      if (indPctEl) indPctEl.textContent = `${eff.independentSolveRate || 0}%`;
      if (astCountEl) astCountEl.textContent = act.outcomes.assistedSolves;
      if (astPctEl) astPctEl.textContent = `${eff.assistedSolveRate || 0}%`;
      if (revCountEl) revCountEl.textContent = act.outcomes.solutionReveals;
      if (revPctEl) revPctEl.textContent = `${eff.solutionRevealRate || 0}%`;
      if (failCountEl) failCountEl.textContent = act.outcomes.failedAttempts;
      if (failPctEl) failPctEl.textContent = `${eff.failureRate || 0}%`;

      if (window.DSACharts && typeof window.DSACharts.renderOutcomeDoughnut === 'function') {
        window.DSACharts.renderOutcomeDoughnut('analytics-outcome-chart', act.outcomes);
      }

      // Effectiveness & Retention
      const hintDepEl = document.getElementById('analytics-hint-dependency');
      const adherenceEl = document.getElementById('analytics-adherence-rate');
      const consistencyEl = document.getElementById('analytics-consistency-score');
      const pausedEl = document.getElementById('analytics-paused-count');
      const abandonedEl = document.getElementById('analytics-abandoned-count');
      const draftsEl = document.getElementById('analytics-drafts-count');

      if (hintDepEl) hintDepEl.textContent = eff.hintDependencyIndex !== null ? `${eff.hintDependencyIndex} hints` : 'N/A';
      if (adherenceEl) adherenceEl.textContent = adh.adherenceRate !== null ? `${adh.adherenceRate}%` : 'N/A';
      if (consistencyEl) consistencyEl.textContent = `${adh.consistencyScore}% (${adh.activeDaysLast30d}/30d)`;
      if (pausedEl) pausedEl.textContent = act.outcomes.pausedSessions;
      if (abandonedEl) abandonedEl.textContent = act.outcomes.abandonedSessions;
      if (draftsEl) draftsEl.textContent = act.outcomes.activeDrafts;

      // Top Strengths & Focus
      const strengthsEl = document.getElementById('analytics-top-strengths');
      const weaknessesEl = document.getElementById('analytics-top-weaknesses');
      if (strengthsEl) {
        strengthsEl.textContent = top.topStrengths && top.topStrengths.length > 0
          ? top.topStrengths.map(s => `${s.topic} (${s.masteryScore}%)`).join(', ')
          : 'None recorded yet';
      }
      if (weaknessesEl) {
        weaknessesEl.textContent = top.topWeaknesses && top.topWeaknesses.length > 0
          ? top.topWeaknesses.map(w => `${w.topic} (${w.masteryScore}%)`).join(', ')
          : 'None recorded yet';
      }

      // Account scope badge
      const scopeBadgeEl = document.getElementById('analytics-account-scope-badge');
      if (scopeBadgeEl) {
        scopeBadgeEl.textContent = analytics.context.isGuest ? 'Guest Scope' : `User: ${analytics.context.userId.substring(0, 8)}...`;
      }
    }

    // 2. Traditional SRS Topic Mastery Map & Charts (Preserved)
    const topicMasteryMap = SRSEngine.calculateTopicMastery(allProblems, userStates);

    let easySolved = 0, mediumSolved = 0, hardSolved = 0;
    allProblems.forEach(p => {
      const state = userStates[p.id];
      if (state && state.lastReviewed) {
        if (p.difficulty === 'Easy') easySolved++;
        else if (p.difficulty === 'Medium') mediumSolved++;
        else if (p.difficulty === 'Hard') hardSolved++;
      }
    });

    if (window.DSACharts) {
      DSACharts.renderMasteryRadar('analytics-radar-chart', topicMasteryMap);
      DSACharts.renderDifficultyDoughnut('analytics-doughnut-chart', { easySolved, mediumSolved, hardSolved });
    }

    // Render Topic Cards Health Matrix
    const container = document.getElementById('topic-matrix-container');
    if (container) {
      container.innerHTML = '';
      const matrixFragment = document.createDocumentFragment();
      Object.values(topicMasteryMap).forEach(t => {
        const card = document.createElement('div');
        card.className = 'topic-health-card';

        const healthBadge = t.solved === 0 ? 'badge-srs-unsolved' : (t.score >= 70 ? 'badge-easy' : t.score >= 40 ? 'badge-medium' : 'badge-hard');
        const healthLabel = t.solved === 0 ? 'Not Started ⚪' : (t.score >= 70 ? 'High Retention 🟢' : t.score >= 40 ? 'Moderate 🟡' : 'Decaying 🔴');

        card.innerHTML = `
          <div class="topic-card-top">
            <span class="topic-card-title">${t.topic}</span>
            <span class="badge ${healthBadge}">${healthLabel}</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:12px; color:var(--text-muted);">
            <span>Mastery: <strong style="color:var(--text-main);">${t.score}%</strong></span>
            <span>${t.solved} / ${t.total} Solved</span>
          </div>
          <div class="mastery-progress-bar">
            <div class="mastery-fill" style="width: ${t.score}%;"></div>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; color:var(--text-dim); margin-top:4px;">
            <span>🏆 ${t.mastered} Mastered</span>
            ${t.avgConfidence > 0 ? `<span class="conf-badge conf-${Math.round(t.avgConfidence)}" style="font-size:10px;">⭐ ${t.avgConfidence}/5 Conf</span>` : `<span>🔔 ${t.due + t.overdue} Due</span>`}
          </div>
        `;
        matrixFragment.appendChild(card);
      });
      container.appendChild(matrixFragment);
    }

    // Render Evidence-Based Mastery Calibration & Uncertainty (P2)
    renderMasteryCalibration();
  }

  // Helper for consistent local date keys (YYYY-MM-DD)
  function toLocalDateKey(dateInput) {
    if (!dateInput) return '';
    try {
      const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
      if (isNaN(d.getTime())) return '';
      return SRSEngine.getLocalDateString(d);
    } catch {
      return '';
    }
  }

  // --- DAILY ACTIVITY HEATMAP & STREAK TRACKER ---
  function renderActivityHeatmap() {
    const gridEl = document.getElementById('dashboard-heatmap-grid');
    if (!gridEl) return;

    // Build date activity map
    const activityMap = {};
    Object.values(userStates).forEach(st => {
      if (!st) return;
      if (Array.isArray(st.history) && st.history.length > 0) {
        st.history.forEach(h => {
          const dStr = toLocalDateKey(h.date || h.reviewedAt);
          if (dStr) activityMap[dStr] = (activityMap[dStr] || 0) + 1;
        });
      } else if (st.lastReviewed) {
        const dStr = toLocalDateKey(st.lastReviewed);
        if (dStr) activityMap[dStr] = (activityMap[dStr] || 0) + 1;
      }
    });

    monthlyTestHistory.forEach(test => {
      const dStr = toLocalDateKey(test.date);
      if (dStr) activityMap[dStr] = (activityMap[dStr] || 0) + 5;
    });

    // Calculate current and max streaks
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;

    // Generate 52 weeks x 7 days = 364 days
    const totalDays = 52 * 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (totalDays - 1));

    gridEl.innerHTML = '';
    const heatmapFragment = document.createDocumentFragment();

    for (let i = 0; i < totalDays; i++) {
      const cur = new Date(startDate);
      cur.setDate(startDate.getDate() + i);
      const curStr = SRSEngine.getLocalDateString(cur);
      const count = activityMap[curStr] || 0;

      if (count > 0) {
        tempStreak++;
        if (tempStreak > maxStreak) maxStreak = tempStreak;
      } else {
        tempStreak = 0;
      }

      if (i === totalDays - 1) { // today
        currentStreak = tempStreak;
      }

      let levelClass = '';
      if (count >= 5) levelClass = 'level-4';
      else if (count >= 3) levelClass = 'level-3';
      else if (count >= 2) levelClass = 'level-2';
      else if (count >= 1) levelClass = 'level-1';

      const cell = document.createElement('div');
      cell.className = `heatmap-cell ${levelClass}`;
      cell.title = `${count} revision/practice actions on ${cur.toDateString()}`;
      heatmapFragment.appendChild(cell);
    }
    gridEl.appendChild(heatmapFragment);

    const curStreakEl = document.getElementById('streak-current-count');
    const maxStreakEl = document.getElementById('streak-max-count');
    if (curStreakEl) curStreakEl.textContent = currentStreak;
    if (maxStreakEl) maxStreakEl.textContent = maxStreak;
  }

  // --- FLASHCARD RECALL QUIZ CONTROLLER ---
  let flashcardDeck = [];
  let flashcardCurrentIndex = 0;

  function renderFlashcards() {
    const filterSelect = document.getElementById('flashcard-filter-topic');
    const filterMode = filterSelect ? filterSelect.value : 'due';

    if (filterMode === 'due') {
      flashcardDeck = allProblems.filter(p => SRSEngine.isDue(userStates[p.id]));
      if (flashcardDeck.length === 0) flashcardDeck = allProblems.slice(0, 25);
    } else if (filterMode === 'all') {
      flashcardDeck = [...allProblems];
    } else {
      // Topic specific filter
      flashcardDeck = allProblems.filter(p => p.topic.toLowerCase() === filterMode.toLowerCase());
      if (flashcardDeck.length === 0) {
        flashcardDeck = allProblems.filter(p => p.topic.toLowerCase().includes(filterMode.toLowerCase()));
      }
      if (flashcardDeck.length === 0) flashcardDeck = [...allProblems];
    }

    const totalCountEl = document.getElementById('flashcard-total-count');
    const curIndexEl = document.getElementById('flashcard-current-index');
    const deckNameEl = document.getElementById('flashcard-deck-name');

    if (totalCountEl) totalCountEl.textContent = flashcardDeck.length;
    if (curIndexEl) curIndexEl.textContent = flashcardDeck.length > 0 ? flashcardCurrentIndex + 1 : 0;
    if (deckNameEl) {
      if (filterMode === 'due') deckNameEl.textContent = 'Due for Review Deck';
      else if (filterMode === 'all') deckNameEl.textContent = 'All Topics Deck';
      else deckNameEl.textContent = `${filterMode} Deck`;
    }

    displayActiveFlashcard();
  }

  function displayActiveFlashcard() {
    const cardInner = document.getElementById('flashcard-card');
    if (cardInner) cardInner.classList.remove('flipped');

    if (flashcardDeck.length === 0) return;
    if (flashcardCurrentIndex >= flashcardDeck.length) flashcardCurrentIndex = 0;
    if (flashcardCurrentIndex < 0) flashcardCurrentIndex = flashcardDeck.length - 1;

    const p = flashcardDeck[flashcardCurrentIndex];
    if (!p) return;

    // Front
    const fcFrontDiff = document.getElementById('fc-front-diff');
    const fcFrontTopic = document.getElementById('fc-front-topic');
    const fcFrontTitle = document.getElementById('fc-front-title');
    const fcFrontPattern = document.getElementById('fc-front-pattern');
    const fcFrontCompanies = document.getElementById('fc-front-companies');

    if (fcFrontDiff) {
      fcFrontDiff.className = `badge badge-${(p.difficulty || 'medium').toLowerCase()}`;
      fcFrontDiff.textContent = p.difficulty || 'Medium';
    }
    if (fcFrontTopic) fcFrontTopic.textContent = p.topic || 'General';
    if (fcFrontTitle) fcFrontTitle.textContent = p.title;
    if (fcFrontPattern) fcFrontPattern.textContent = `Pattern: ${p.pattern || 'Optimal Algorithmic Approach'}`;

    if (fcFrontCompanies) {
      fcFrontCompanies.innerHTML = (p.companies || []).slice(0, 3).map(c => `
        <span class="company-badge ${c.toLowerCase().replace(/[^a-z]/g, '')}">🏢 ${c}</span>
      `).join('');
    }

    // Back
    const fcBackTitle = document.getElementById('fc-back-title');
    const fcBackLink = document.getElementById('fc-back-link');
    const fcBackTime = document.getElementById('fc-back-time');
    const fcBackSpace = document.getElementById('fc-back-space');
    const fcBackNotes = document.getElementById('fc-back-notes');

    if (fcBackTitle) fcBackTitle.textContent = p.title;
    if (fcBackLink) fcBackLink.href = p.url || '#';
    if (fcBackTime) fcBackTime.textContent = p.timeComplexity || 'O(N)';
    if (fcBackSpace) fcBackSpace.textContent = p.spaceComplexity || 'O(1)';
    if (fcBackNotes) fcBackNotes.textContent = p.notes || 'Recall core data structure properties, pointer movements, and base case transitions.';

    const curIndexEl = document.getElementById('flashcard-current-index');
    if (curIndexEl) curIndexEl.textContent = flashcardCurrentIndex + 1;
  }

  // --- MODAL HANDLERS ---
  function updateRatingModalConfidenceUI(conf) {
    const meta = SRSEngine.getConfidenceMeta(conf);
    const labelEl = document.getElementById('rating-modal-confidence-label');
    if (labelEl) {
      labelEl.textContent = `${meta.label} (${conf}/5)`;
      labelEl.className = `badge ${meta.badgeClass}`;
    }

    document.querySelectorAll('.confidence-pill-btn').forEach(btn => {
      if (parseInt(btn.dataset.confidence, 10) === conf) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function openRatingModal(problemId) {
    const p = allProblems.find(item => item.id === problemId);
    if (!p) return;

    activeRatingProblemId = problemId;
    const state = userStates[problemId];
    activeRatingConfidence = SRSEngine.getConfidence(state) || 4;

    document.getElementById('modal-rating-title').textContent = `Rate Recall: ${p.title}`;
    document.getElementById('modal-rating-subtitle').textContent = `${p.topic} • ${p.difficulty} • ${p.pattern || ''}`;
    document.getElementById('rating-modal-notes').value = '';

    // Reset Hint Used checkbox & Time Spent
    const hintCheck = document.getElementById('rating-modal-hint-used');
    if (hintCheck) hintCheck.checked = false;
    const timeInput = document.getElementById('rating-modal-time-spent');
    if (timeInput) timeInput.value = (p.difficulty === 'Easy' ? 12 : (p.difficulty === 'Hard' ? 35 : 20));

    // Populate Failure Intelligence chips
    const chipsContainer = document.getElementById('rating-modal-failure-chips');
    if (chipsContainer && window.FailureEngine) {
      chipsContainer.innerHTML = '';
      FailureEngine.getAllCategories().forEach(cat => {
        const chip = document.createElement('div');
        chip.className = 'failure-chip';
        chip.dataset.failureId = cat.id;
        chip.innerHTML = `<i class="fa-solid ${cat.icon}" style="color:${cat.color};"></i> ${cat.label}`;
        chip.addEventListener('click', () => {
          chip.classList.toggle('active');
        });
        chipsContainer.appendChild(chip);
      });
    }

    updateRatingModalConfidenceUI(activeRatingConfidence);
    document.getElementById('srs-rating-modal').classList.add('open');
  }

  function closeRatingModal() {
    document.getElementById('srs-rating-modal').classList.remove('open');
    activeRatingProblemId = null;
  }

  function handleRatingSelection(rating) {
    if (!activeRatingProblemId) return;

    const notes = document.getElementById('rating-modal-notes').value.trim();
    const hintsUsed = document.getElementById('rating-modal-hint-used')?.checked || false;
    const timeSpent = parseInt(document.getElementById('rating-modal-time-spent')?.value, 10) || 15;

    const selectedFailures = [];
    document.querySelectorAll('#rating-modal-failure-chips .failure-chip.active').forEach(chip => {
      selectedFailures.push(chip.dataset.failureId);
    });

    const currentState = userStates[activeRatingProblemId] || {};

    userStates[activeRatingProblemId] = SRSEngine.processReview(
      currentState,
      rating,
      timeSpent,
      notes,
      activeRatingConfidence,
      { hintsUsed: hintsUsed, failureReasons: selectedFailures }
    );
    saveUserStates();

    // Gamification XP & Badges
    if (window.GamificationEngine) {
      if (!hintsUsed && activeRatingConfidence >= 4) {
        GamificationEngine.awardXP('independent_solve');
      } else if (currentState.stage >= 2 && rating !== 'failed') {
        GamificationEngine.awardXP('delayed_recall');
      } else {
        GamificationEngine.awardXP('review');
      }
      GamificationEngine.evaluateBadges(allProblems, userStates, monthlyTestHistory);
      updateGamificationHeader();
    }

    closeRatingModal();
    renderAll();
  }

  function openDetailModal(problemId) {
    const p = allProblems.find(item => item.id === problemId);
    if (!p) return;

    activeDetailProblemId = problemId;
    const state = userStates[problemId];

    document.getElementById('detail-modal-title').textContent = p.title;
    document.getElementById('detail-modal-meta').textContent = `${p.topic} • ${p.difficulty}${p.pattern ? ` • ${p.pattern}` : ''}`;

    // Reset sub-tabs to Overview
    document.querySelectorAll('#problem-detail-modal button[id^="tab-btn-detail-"]').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-btn-detail-overview')?.classList.add('active');
    if (document.getElementById('detail-tab-content-overview')) document.getElementById('detail-tab-content-overview').style.display = 'flex';
    if (document.getElementById('detail-tab-content-hints')) document.getElementById('detail-tab-content-hints').style.display = 'none';
    if (document.getElementById('detail-tab-content-analysis')) document.getElementById('detail-tab-content-analysis').style.display = 'none';
    if (document.getElementById('detail-tab-content-history')) document.getElementById('detail-tab-content-history').style.display = 'none';

    // Recommendation 3: Populate personal scratchpad and timer display
    const scratchpad = document.getElementById('detail-modal-scratchpad');
    const saveIndicator = document.getElementById('scratchpad-save-indicator');
    if (scratchpad) {
      scratchpad.value = (state && state.personalNotes) || '';
    }
    if (saveIndicator) saveIndicator.style.display = 'none';
    if (!detailTimerIsRunning) {
      updateMockTimerDisplay();
    }

    const hintContent = document.getElementById('detail-ai-hint-content');
    if (hintContent) {
      hintContent.textContent = 'Select a hint level above to get targeted scaffolding without revealing solutions.';
    }
    document.querySelectorAll('#detail-ai-hint-tabs .ai-hint-tab-btn').forEach((b, idx) => {
      if (idx === 0) b.classList.add('active');
      else b.classList.remove('active');
    });

    const analysisRes = document.getElementById('analysis-feedback-result');
    if (analysisRes) analysisRes.style.display = 'none';

    const statusBadge = document.getElementById('detail-modal-status-badge');
    const dueInfo = SRSEngine.getDueStatus(state);
    if (statusBadge) {
      statusBadge.textContent = dueInfo.label;
      statusBadge.className = `badge ${dueInfo.badgeClass}`;
    }

    const confBadge = document.getElementById('detail-modal-confidence-badge');
    const conf = SRSEngine.getConfidence(state);
    if (confBadge) {
      if (conf) {
        const meta = SRSEngine.getConfidenceMeta(conf);
        confBadge.style.display = 'inline-flex';
        confBadge.className = `conf-badge conf-${conf}`;
        confBadge.innerHTML = `<i class="fa-solid ${meta.icon}"></i> Confidence: ${meta.label} (${conf}/5)`;
      } else {
        confBadge.style.display = 'none';
      }
    }

    const linkEl = document.getElementById('detail-modal-url');
    if (linkEl) {
      if (p.url) {
        linkEl.href = p.url;
        linkEl.style.display = 'inline-flex';
      } else {
        linkEl.style.display = 'none';
      }
    }

    const notesEl = document.getElementById('detail-modal-notes');
    if (notesEl) notesEl.textContent = p.notes || 'No notes added yet.';

    const timeEl = document.getElementById('detail-modal-time');
    if (timeEl) timeEl.textContent = p.timeComplexity || 'O(N)';

    const spaceEl = document.getElementById('detail-modal-space');
    if (spaceEl) spaceEl.textContent = p.spaceComplexity || 'O(1)';

    const compEl = document.getElementById('detail-modal-companies');
    if (compEl) {
      compEl.innerHTML = (p.companies && p.companies.length)
        ? p.companies.map(c => `<span class="company-badge ${c.toLowerCase().replace(/[^a-z]/g, '')}">🏢 ${c}</span>`).join('')
        : '<span style="color:var(--text-dim); font-size:12px;">General DSA</span>';
    }

    // Similar-Problem Progression
    const progContainer = document.getElementById('detail-modal-progression-container');
    const progList = document.getElementById('detail-modal-progression-list');
    if (progContainer && progList && window.RecommendationEngine) {
      const progression = RecommendationEngine.getSimilarProblemProgression(p, allProblems, userStates);
      if (progression && progression.steps && progression.steps.length > 0) {
        progContainer.style.display = 'block';
        progList.innerHTML = progression.steps.map(step => {
          const sProb = step.problem;
          const sState = userStates[sProb.id];
          const sSolved = sState && sState.lastReviewed;
          const sConf = SRSEngine.getConfidence(sState);
          return `
            <div class="progression-step-card ${step.isReattempt ? 'reattempt' : ''}">
              <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                <span class="badge ${step.isReattempt ? 'badge-hard' : 'badge-srs-upcoming'}" style="font-size:10px;">${step.label}</span>
                <a href="${sProb.url || '#'}" target="_blank" style="color:var(--text-main); font-weight:600; text-decoration:none; font-size:12.5px;">${sProb.title}</a>
                <span class="badge badge-${sProb.difficulty.toLowerCase()}" style="font-size:10px;">${sProb.difficulty}</span>
              </div>
              <div style="display:flex; align-items:center; gap:6px;">
                ${sConf ? `<span class="conf-badge conf-${sConf}" style="font-size:10px;">⭐ ${sConf}/5</span>` : (sSolved ? `<span class="badge badge-easy" style="font-size:10px;">Solved</span>` : `<span class="badge badge-srs-unsolved" style="font-size:10px;">Next</span>`)}
              </div>
            </div>
          `;
        }).join('');
      } else {
        progContainer.style.display = 'none';
      }
    }

    // Review History List
    const historyList = document.getElementById('detail-modal-history');
    if (historyList) {
      historyList.innerHTML = '';
      if (state && Array.isArray(state.history) && state.history.length > 0) {
        state.history.slice().reverse().forEach(h => {
          const item = document.createElement('div');
          item.style.padding = '8px 12px';
          item.style.background = 'rgba(255,255,255,0.03)';
          item.style.borderRadius = '6px';
          item.style.border = '1px solid rgba(255,255,255,0.05)';

          const hConf = h.confidence || SRSEngine.mapRatingToDefaultConfidence(h.rating);
          const hMeta = SRSEngine.getConfidenceMeta(hConf);

          item.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <strong style="font-size:12px;">${new Date(h.date).toLocaleDateString()}</strong>
              <div style="display:flex; gap:6px; align-items:center;">
                <span class="conf-badge conf-${hConf}" style="font-size:10.5px;"><i class="fa-solid ${hMeta.icon}"></i> ${hMeta.label} (${hConf}/5)</span>
                <span class="badge badge-${h.rating === 'simple' ? 'easy' : h.rating === 'hard' ? 'hard' : 'medium'}" style="font-size:10px;">${capitalize(h.rating)} (Stg ${h.stage})</span>
              </div>
            </div>
            ${h.note ? `<div style="color:var(--text-dim); font-size:11.5px; margin-top:4px;">"${h.note}"</div>` : ''}
          `;
          historyList.appendChild(item);
        });
      } else {
        historyList.innerHTML = '<span style="color:var(--text-dim); font-size:12px;">No review history logged yet.</span>';
      }
    }

    document.getElementById('problem-detail-modal').classList.add('open');
  }

  function closeDetailModal() {
    saveCurrentScratchpad();
    document.getElementById('problem-detail-modal').classList.remove('open');
    activeDetailProblemId = null;
  }

  // --- RECOMMENDATION 3: SCRATCHPAD & MOCK INTERVIEW TIMER ---
  function saveCurrentScratchpad() {
    if (!activeDetailProblemId) return;
    const scratchpad = document.getElementById('detail-modal-scratchpad');
    if (!scratchpad) return;
    const noteText = scratchpad.value;
    userStates[activeDetailProblemId] = userStates[activeDetailProblemId] || {};
    if (userStates[activeDetailProblemId].personalNotes !== noteText) {
      userStates[activeDetailProblemId].personalNotes = noteText;
      saveUserStates();
    }
    const indicator = document.getElementById('scratchpad-save-indicator');
    if (indicator) {
      indicator.style.display = 'inline-flex';
      setTimeout(() => {
        if (indicator) indicator.style.display = 'none';
      }, 2500);
    }
  }

  let detailTimerInterval = null;
  let detailTimerRemainingSeconds = 45 * 60;
  let detailTimerTotalSeconds = 45 * 60;
  let detailTimerIsRunning = false;

  function formatTimerDisplay(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function updateMockTimerDisplay() {
    const displayEl = document.getElementById('mock-timer-display');
    if (!displayEl) return;
    displayEl.textContent = formatTimerDisplay(detailTimerRemainingSeconds);
    if (detailTimerRemainingSeconds <= 300 && detailTimerRemainingSeconds > 0) {
      displayEl.style.color = '#ef4444';
    } else if (detailTimerRemainingSeconds === 0) {
      displayEl.style.color = '#ef4444';
    } else {
      displayEl.style.color = '#34d399';
    }
  }

  function playTimerAlertSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch (_) {}
  }

  function startMockTimer() {
    if (detailTimerIsRunning) return;
    detailTimerIsRunning = true;
    const toggleBtn = document.getElementById('btn-mock-timer-toggle');
    if (toggleBtn) {
      toggleBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
      toggleBtn.className = 'btn btn-secondary btn-xs';
    }
    detailTimerInterval = setInterval(() => {
      if (detailTimerRemainingSeconds > 0) {
        detailTimerRemainingSeconds--;
        updateMockTimerDisplay();
        if (detailTimerRemainingSeconds === 0) {
          pauseMockTimer();
          playTimerAlertSound();
        }
      } else {
        pauseMockTimer();
      }
    }, 1000);
  }

  function pauseMockTimer() {
    detailTimerIsRunning = false;
    if (detailTimerInterval) {
      clearInterval(detailTimerInterval);
      detailTimerInterval = null;
    }
    const toggleBtn = document.getElementById('btn-mock-timer-toggle');
    if (toggleBtn) {
      toggleBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start';
      toggleBtn.className = 'btn btn-primary btn-xs';
    }
  }

  function resetMockTimer(seconds) {
    pauseMockTimer();
    if (typeof seconds === 'number') {
      detailTimerTotalSeconds = seconds;
    }
    detailTimerRemainingSeconds = detailTimerTotalSeconds;
    updateMockTimerDisplay();
  }

  // --- MONTHLY ASSESSMENT EXAM SANDBOX ---
  function saveActiveExamState() {
    if (!activeTestSession) return;
    saveCurrentQuestionState();
    const payload = {
      testSession: activeTestSession,
      activeQuestionIndex: activeTestQuestionIndex,
      answers: testAnswers,
      timeRemainingSeconds: testTimeRemainingSeconds,
      timestamp: Date.now()
    };
    try {
      if (window.LearnerRepository) {
        window.LearnerRepository.saveActiveExamSession(payload);
      } else {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_EXAM_SESSION, JSON.stringify(payload));
      }
    } catch (_) { }
  }

  function clearActiveExamState() {
    try {
      if (window.LearnerRepository) {
        window.LearnerRepository.clearActiveExamSession();
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_EXAM_SESSION);
      }
    } catch (_) { }
  }

  function checkAndRestoreActiveExamSession() {
    try {
      let data = null;
      if (window.LearnerRepository) {
        data = window.LearnerRepository.getActiveExamSession();
      } else {
        const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_EXAM_SESSION);
        data = stored ? JSON.parse(stored) : null;
      }
      if (!data || !data.testSession || !data.timeRemainingSeconds) return;

      const elapsedSeconds = Math.floor((Date.now() - (data.timestamp || Date.now())) / 1000);
      const remaining = data.timeRemainingSeconds - elapsedSeconds;

      if (remaining > 5) {
        activeTestSession = data.testSession;
        activeTestQuestionIndex = data.activeQuestionIndex || 0;
        testAnswers = data.answers || {};
        testTimeRemainingSeconds = remaining;

        resumeMonthlyExam();
      } else {
        clearActiveExamState();
      }
    } catch (e) {
      console.warn('Could not restore exam session:', e);
      clearActiveExamState();
    }
  }

  function resumeMonthlyExam() {
    if (!activeTestSession) return;
    const listEl = document.getElementById('test-question-list');
    if (!listEl) return;
    listEl.innerHTML = '';
    activeTestSession.problems.forEach((p, idx) => {
      const qDiv = document.createElement('div');
      qDiv.className = `test-q-item ${idx === activeTestQuestionIndex ? 'active' : ''}`;
      qDiv.dataset.idx = idx;
      qDiv.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong style="font-size:13px;">Q${idx + 1}: ${p.title}</strong>
          <span class="badge badge-${p.difficulty.toLowerCase()}">${p.difficulty}</span>
        </div>
        <div style="font-size:11px; color:var(--text-dim);">${p.topic}</div>
      `;
      qDiv.addEventListener('click', () => switchTestQuestion(idx));
      listEl.appendChild(qDiv);
    });

    renderActiveTestQuestion();

    if (testTimerInterval) clearInterval(testTimerInterval);
    updateTimerDisplay();
    testTimerInterval = setInterval(() => {
      testTimeRemainingSeconds--;
      updateTimerDisplay();
      if (testTimeRemainingSeconds % 5 === 0) {
        saveActiveExamState();
      }
      if (testTimeRemainingSeconds <= 0) {
        clearInterval(testTimerInterval);
        clearActiveExamState();
        alert('Time is up! Submitting assessment for evaluation.');
        finishMonthlyExam();
      }
    }, 1000);

    (document.getElementById('monthly-test-cockpit') || document.getElementById('monthly-test-overlay'))?.classList.add('open');
  }

  function startMonthlyExam(questionCount = 4, durationMinutes = 60) {
    const testSession = MonthlyAssessmentEngine.generateTest(allProblems, userStates, { count: questionCount, durationMinutes: durationMinutes });
    if (!testSession || !testSession.problems || testSession.problems.length === 0) {
      alert('Unable to generate test. Please add problems first.');
      return;
    }

    activeTestSession = testSession;
    activeTestQuestionIndex = 0;
    testAnswers = {};
    testTimeRemainingSeconds = durationMinutes * 60;
    saveActiveExamState();

    // Render Question List on Sidebar
    const listEl = document.getElementById('test-question-list');
    listEl.innerHTML = '';
    testSession.problems.forEach((p, idx) => {
      const qDiv = document.createElement('div');
      qDiv.className = `test-q-item ${idx === 0 ? 'active' : ''}`;
      qDiv.dataset.idx = idx;
      qDiv.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong style="font-size:13px;">Q${idx + 1}: ${p.title}</strong>
          <span class="badge badge-${p.difficulty.toLowerCase()}">${p.difficulty}</span>
        </div>
        <div style="font-size:11px; color:var(--text-dim);">${p.topic}</div>
      `;
      qDiv.addEventListener('click', () => switchTestQuestion(idx));
      listEl.appendChild(qDiv);
    });

    renderActiveTestQuestion();

    // Start Timer
    if (testTimerInterval) clearInterval(testTimerInterval);
    updateTimerDisplay();
    testTimerInterval = setInterval(() => {
      testTimeRemainingSeconds--;
      updateTimerDisplay();
      if (testTimeRemainingSeconds % 5 === 0) {
        saveActiveExamState();
      }
      if (testTimeRemainingSeconds <= 0) {
        clearInterval(testTimerInterval);
        clearActiveExamState();
        alert('Time is up! Submitting assessment for evaluation.');
        finishMonthlyExam();
      }
    }, 1000);

    (document.getElementById('monthly-test-cockpit') || document.getElementById('monthly-test-overlay'))?.classList.add('open');
  }

  function updateTimerDisplay() {
    const mins = Math.floor(testTimeRemainingSeconds / 60);
    const secs = testTimeRemainingSeconds % 60;
    const timerEl = document.getElementById('test-countdown-display') || document.getElementById('test-timer-display');
    if (timerEl) {
      timerEl.innerHTML = `<i class="fa-regular fa-clock"></i> ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
  }

  function switchTestQuestion(index) {
    saveCurrentQuestionState();
    activeTestQuestionIndex = index;
    saveActiveExamState();

    // Update active class in sidebar
    document.querySelectorAll('.test-q-item').forEach((el, idx) => {
      el.classList.toggle('active', idx === index);
    });

    renderActiveTestQuestion();
  }

  function saveCurrentQuestionState() {
    if (!activeTestSession || !activeTestSession.problems[activeTestQuestionIndex]) return;
    const currentProb = activeTestSession.problems[activeTestQuestionIndex];
    const scratchpad = document.getElementById('test-scratchpad-area')?.value || '';

    if (!testAnswers[currentProb.id]) {
      testAnswers[currentProb.id] = { rating: null, scratchpad: '' };
    }
    testAnswers[currentProb.id].scratchpad = scratchpad;
  }

  function renderActiveTestQuestion() {
    if (!activeTestSession) return;
    const p = activeTestSession.problems[activeTestQuestionIndex];
    if (!p) return;

    const progressEl = document.getElementById('test-question-counter') || document.getElementById('test-progress-indicator');
    if (progressEl) {
      progressEl.textContent = `Question ${activeTestQuestionIndex + 1} of ${activeTestSession.problems.length}`;
    }
    document.getElementById('test-active-title').textContent = p.title;

    document.getElementById('test-active-badges').innerHTML = `
      <span class="badge badge-${p.difficulty.toLowerCase()}">${p.difficulty}</span>
      <span class="badge badge-srs-upcoming">${p.topic}</span>
      ${p.pattern ? `<span class="badge badge-srs-unsolved">${p.pattern}</span>` : ''}
    `;

    const link = document.getElementById('test-active-link');
    link.href = p.url || `https://leetcode.com/problemset/all/?search=${encodeURIComponent(p.title)}`;

    const savedAnswer = testAnswers[p.id] || { rating: null, scratchpad: '' };
    document.getElementById('test-scratchpad-area').value = savedAnswer.scratchpad || (p.notes ? `// Pattern hint: ${p.pattern}\n` : '');

    // Highlight rating button (only if explicitly selected)
    document.querySelectorAll('[data-test-rating]').forEach(btn => {
      const rating = btn.dataset.testRating;
      const isSelected = Boolean(savedAnswer.rating && savedAnswer.rating === rating);
      btn.style.borderColor = isSelected ? 'var(--primary)' : 'var(--border-color)';
      btn.style.boxShadow = isSelected ? '0 0 0 2px var(--primary)' : 'none';
      btn.style.background = isSelected ? 'rgba(139, 124, 255, 0.2)' : '';
    });
  }

  function finishMonthlyExam() {
    if (!activeTestSession) return;
    saveCurrentQuestionState();

    // Check if there are unrated questions
    const unratedCount = activeTestSession.problems.filter(p => !testAnswers[p.id] || !testAnswers[p.id].rating).length;
    if (unratedCount > 0) {
      const confirmSubmit = confirm(
        `You have ${unratedCount} unrated question${unratedCount > 1 ? 's' : ''}.\n\nUnrated questions will be scored as "Failed / Blank" (0 points).\n\nDo you want to submit and grade now?`
      );
      if (!confirmSubmit) return;
    }

    clearActiveExamState();

    if (testTimerInterval) clearInterval(testTimerInterval);

    // Build results array
    const results = activeTestSession.problems.map(p => {
      const ans = testAnswers[p.id] || { rating: 'failed', scratchpad: '' };
      return {
        problemId: p.id,
        rating: ans.rating || 'failed',
        timeSpentMinutes: 15,
        notes: ans.scratchpad || ''
      };
    });

    // Evaluate
    const evaluation = MonthlyAssessmentEngine.evaluateTest(activeTestSession, results);
    monthlyTestHistory.push(evaluation);
    saveTestHistory();

    // Update SRS schedule for each tested problem
    results.forEach(res => {
      const curr = userStates[res.problemId] || {};
      userStates[res.problemId] = SRSEngine.processReview(curr, res.rating, 15, `Monthly Test Result: ${res.rating}`);
    });
    saveUserStates();

    // Close Exam overlay
    (document.getElementById('monthly-test-cockpit') || document.getElementById('monthly-test-overlay'))?.classList.remove('open');
    activeTestSession = null;

    // Show Assessment Evaluation Modal
    renderAll();
    alert(`🎉 Assessment Complete!\n\nScore: ${evaluation.percentage}%\nGrade: ${evaluation.grade}\n\n${evaluation.summary}`);
  }

  // --- CROSS-DEVICE QUICK SYNC CONTROLLER ---
  function exportSyncCode() {
    const payload = {
      v: 2,
      t: Date.now(),
      states: userStates,
      history: monthlyTestHistory,
      customProblems: allProblems.filter(p => (p.sheets || []).includes('Custom') || p.id.startsWith('custom-') || p.id.startsWith('bulk-') || p.id.startsWith('url-'))
    };

    try {
      const jsonStr = JSON.stringify(payload);
      const base64Str = btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode('0x' + p1)));
      return base64Str;
    } catch (e) {
      console.error('Error generating sync code:', e);
      return JSON.stringify(payload);
    }
  }

  function importSyncCode(syncString) {
    if (!syncString || !syncString.trim()) {
      alert('Please paste a valid sync code or JSON.');
      return false;
    }

    try {
      let rawJson = '';
      const trimmed = syncString.trim();
      if (trimmed.startsWith('{')) {
        rawJson = trimmed;
      } else {
        rawJson = decodeURIComponent(Array.prototype.map.call(atob(trimmed), c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
      }

      const parsed = JSON.parse(rawJson);
      let importedCount = 0;

      if (parsed.states && typeof parsed.states === 'object') {
        userStates = { ...userStates, ...parsed.states };
        saveUserStates();
        importedCount = Object.keys(parsed.states).length;
      }

      if (parsed.history && Array.isArray(parsed.history)) {
        const existingIds = new Set(monthlyTestHistory.map(t => t.id || t.date));
        parsed.history.forEach(h => {
          if (!existingIds.has(h.id || h.date)) monthlyTestHistory.push(h);
        });
        saveTestHistory();
      }

      if (parsed.customProblems && Array.isArray(parsed.customProblems)) {
        const existingIds = new Set(allProblems.map(p => p.id));
        parsed.customProblems.forEach(p => {
          if (!existingIds.has(p.id)) allProblems.unshift(p);
        });
        saveProblems();
      }

      populateTopicDropdown();
      renderAll();
      alert(`🎉 Cross-Device Sync Successful!\n\nImported ${importedCount} reviewed questions & test history. All progress is now in sync on this device!`);
      return true;
    } catch (e) {
      console.error('Failed to import sync code:', e);
      alert('Invalid sync code format. Please copy a fresh sync code from your other device.');
      return false;
    }
  }

  function checkUrlHashSync() {
    if (typeof window === 'undefined' || !window.location) return;

    function handleHashRoute() {
      if (!window.location.hash) return;
      if (window.location.hash.includes('sync=')) {
        try {
          const hashVal = window.location.hash.split('sync=')[1]?.split('&')[0];
          if (hashVal) {
            setTimeout(() => {
              if (confirm('⚡ A device sync code was detected in this link! Would you like to import all progress onto this device now?')) {
                importSyncCode(decodeURIComponent(hashVal));
                window.location.hash = '';
              }
            }, 300);
          }
        } catch (e) {
          console.error('URL Hash Sync Error:', e);
        }
        return;
      }

      // Deep link routing to canonical views / subviews
      const cleanHash = window.location.hash.replace(/^#\/?/, '').trim();
      if (cleanHash) {
        const parts = cleanHash.split('/');
        const primary = parts[0];
        const sub = parts[1];
        switchView(primary, sub);
      }
    }

    handleHashRoute();
    window.addEventListener('hashchange', handleHashRoute);
  }

  // --- VIEW 7: 120-DAY EDITABLE DSA ROADMAP & MULTI-STREAM TRACKER ---
  let activeRoadmap120View = 'list'; // 'list' | 'calendar' | 'topics' | 'legacy_cycle'
  let activeRoadmap120Filter = 'all'; // 'all' | 'today' | 'upcoming' | 'completed' | 'incomplete' | 'buffer' | 'current_learning' | 'foundation_revision'
  let roadmap120SearchQuery = '';
  let selectedRoadmap120Days = new Set();

  function renderRoadmapView() {
    if (!window.RoadmapEngine) return;
    if (!RoadmapEngine.progress) {
      RoadmapEngine.initProgress();
    }

    const activeTrack = RoadmapEngine.progress.activeTrack || 'striver_hero';
    const plan120 = RoadmapEngine.get120DayRoadmap(userStates);
    const todayPlan = RoadmapEngine.getTodayAuthoritativePlan(allProblems, userStates);

    // 1. Calculate Overall Plan Progress & KPIs
    const completedDays = plan120.days.filter(d => d.isCompleted).length;
    const totalDays = plan120.days.length;
    const completionPct = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

    const statProgressEl = document.getElementById('roadmap-stat-progress');
    const kpiProgressSubEl = document.getElementById('roadmap-120-kpi-progress-sub');
    const trackProgressFill = document.getElementById('roadmap-track-progress-fill');

    if (statProgressEl) statProgressEl.textContent = `${completionPct}%`;
    if (kpiProgressSubEl) kpiProgressSubEl.textContent = `${completedDays} of ${totalDays} Days Complete`;
    if (trackProgressFill) trackProgressFill.style.width = `${completionPct}%`;

    // 2. Track Solved & Unsolved Counts
    let trackSolvedCount = 0;
    allProblems.forEach(p => {
      if (userStates[p.id]?.lastReviewed) trackSolvedCount++;
    });
    const trackUnsolvedCount = allProblems.length - trackSolvedCount;

    const statTrackSolvedEl = document.getElementById('roadmap-stat-solved-count');
    const statTrackUnsolvedEl = document.getElementById('roadmap-stat-unsolved-count');
    if (statTrackSolvedEl) statTrackSolvedEl.textContent = `${trackSolvedCount} / ${allProblems.length}`;
    if (statTrackUnsolvedEl) statTrackUnsolvedEl.textContent = `${trackUnsolvedCount}`;

    // 3. Legacy Cycle Progress (Mon - Sun, 7 days)
    let completedDaysInCycle = 0;
    for (let d = 1; d <= 7; d++) {
      if (RoadmapEngine.isDayCompleted(activeTrack, 1, d)) {
        completedDaysInCycle++;
      }
    }
    const statDaysDoneEl = document.getElementById('roadmap-stat-days-done');
    if (statDaysDoneEl) statDaysDoneEl.textContent = `${completedDaysInCycle} / 7`;

    // 4. Stream KPIs
    const statActiveFocusEl = document.getElementById('roadmap-stat-active-focus');
    const kpiSubtopicLearnEl = document.getElementById('roadmap-120-kpi-subtopic-learn');
    if (statActiveFocusEl) statActiveFocusEl.textContent = todayPlan.streamA?.topic || 'Graphs';
    if (kpiSubtopicLearnEl) kpiSubtopicLearnEl.textContent = todayPlan.streamA?.subtopic || 'BFS & DFS';

    const kpiReviseTopicEl = document.getElementById('roadmap-120-kpi-revise-topic');
    const kpiSubtopicReviseEl = document.getElementById('roadmap-120-kpi-subtopic-revise');
    if (kpiReviseTopicEl) kpiReviseTopicEl.textContent = todayPlan.streamB?.topic || 'Maths';
    if (kpiSubtopicReviseEl) kpiSubtopicReviseEl.textContent = todayPlan.streamB?.subtopic || 'Number Theory';

    const kpiSrsDueEl = document.getElementById('roadmap-120-kpi-srs-due');
    if (kpiSrsDueEl) kpiSrsDueEl.textContent = `${todayPlan.streamC?.dueCount || 0} Due`;

    const kpiHealthEl = document.getElementById('roadmap-120-kpi-health');
    const kpiTargetDateEl = document.getElementById('roadmap-120-kpi-target-date');
    if (kpiHealthEl) {
      if (todayPlan.differences && todayPlan.differences.hasDifference) {
        kpiHealthEl.innerHTML = '<span style="color:#f59e0b;">Adjusted</span>';
      } else {
        kpiHealthEl.innerHTML = '<span style="color:#34d399;">On Track</span>';
      }
    }
    if (kpiTargetDateEl) kpiTargetDateEl.textContent = `Target: ${totalDays} Days`;

    // 5. Update Active View Tab Buttons
    document.querySelectorAll('.roadmap-120-view-btn').forEach(btn => {
      if (btn.dataset.roadmapView === activeRoadmap120View) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // 6. Update Active Filter Pills
    document.querySelectorAll('.roadmap-120-filter-pill').forEach(pill => {
      if (pill.dataset.filter === activeRoadmap120Filter) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });

    // 7. Update Bulk Action Bar
    const bulkBarEl = document.getElementById('roadmap-120-bulk-bar');
    const bulkCountEl = document.getElementById('roadmap-120-bulk-count');
    if (bulkBarEl && bulkCountEl) {
      if (selectedRoadmap120Days.size > 0) {
        bulkBarEl.style.display = 'flex';
        bulkCountEl.textContent = `${selectedRoadmap120Days.size} Days Selected`;
      } else {
        bulkBarEl.style.display = 'none';
      }
    }

    // 8. Render Selected View Mode
    const contentArea = document.getElementById('roadmap-120-content-area');
    const legacyWrap = document.getElementById('roadmap-120-legacy-wrap');

    if (activeRoadmap120View === 'legacy_cycle') {
      if (contentArea) contentArea.style.display = 'none';
      if (legacyWrap) legacyWrap.style.display = 'block';

      // Render 7-day selector pills strip
      const schedule = RoadmapEngine.getSchedule(activeTrack, allProblems);
      const currentWeek = schedule[0] || { weekNumber: 1, title: 'Core Practice', topic: 'Arrays & Hashing', days: [] };
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat (Review)', 'Sun (Exam)'];
      const progressTxtEl = document.getElementById('roadmap-week-progress-txt');
      if (progressTxtEl) {
        const cyclePercent = Math.round((completedDaysInCycle / 7) * 100);
        progressTxtEl.textContent = `${completedDaysInCycle} / 7 Days Complete (${cyclePercent}%)`;
      }

      if (!RoadmapEngine.progress.selectedDay || RoadmapEngine.progress.selectedDay > 7 || RoadmapEngine.progress.selectedDay < 1) {
        RoadmapEngine.progress.selectedDay = 1;
      }
      const currentDay = currentWeek.days.find(d => d.dayNumber === RoadmapEngine.progress.selectedDay) || currentWeek.days[0];

      const daysPillsContainer = document.getElementById('roadmap-days-pills-container');
      if (daysPillsContainer) {
        daysPillsContainer.innerHTML = '';
        currentWeek.days.forEach((day, idx) => {
          const isDayDone = RoadmapEngine.isDayCompleted(activeTrack, 1, day.dayNumber);
          const isDayActive = day.dayNumber === RoadmapEngine.progress.selectedDay;
          const hasCustomTopic = !!RoadmapEngine.getDayCustomTopic(activeTrack, 1, day.dayNumber);

          const pill = document.createElement('button');
          pill.className = `roadmap-day-pill ${isDayActive ? 'active' : ''} ${isDayDone ? 'completed' : ''} ${day.isWeekend ? 'weekend' : ''}`;
          pill.dataset.dayNum = day.dayNumber;

          let icon = isDayDone ? '<i class="fa-solid fa-check"></i>' : (day.isExamDay ? '<i class="fa-solid fa-trophy"></i>' : day.isReviewDay ? '<i class="fa-solid fa-bolt"></i>' : (hasCustomTopic ? '<i class="fa-solid fa-shuffle"></i>' : `<i class="fa-solid fa-code"></i>`));
          let dayName = dayNames[idx] || `Day ${day.dayNumber}`;
          let label = day.isExamDay ? `Day 7: Weekend Test 🏆` : day.isReviewDay ? `Day 6: Flashcards ⚡` : `Day ${day.dayNumber} (${dayName})`;

          pill.innerHTML = `${icon} <span>${label}</span>`;
          pill.addEventListener('click', () => {
            RoadmapEngine.progress.selectedWeek = 1;
            RoadmapEngine.progress.selectedDay = day.dayNumber;
            RoadmapEngine.saveProgress();
            renderRoadmapView();
          });
          daysPillsContainer.appendChild(pill);
        });
      }

      renderActiveDayContent(activeTrack, currentWeek, currentDay);
    } else {
      if (legacyWrap) legacyWrap.style.display = 'none';
      if (contentArea) {
        contentArea.style.display = 'block';
        if (activeRoadmap120View === 'list') {
          render120ListView(plan120, todayPlan);
        } else if (activeRoadmap120View === 'calendar') {
          render120CalendarView(plan120, todayPlan);
        } else if (activeRoadmap120View === 'topics') {
          render120TopicsView(plan120, todayPlan);
        } else if (activeRoadmap120View === 'audit') {
          render120AuditView();
        }
      }
    }
  }

  function render120ListView(plan120, todayPlan) {
    const container = document.getElementById('roadmap-120-content-area');
    if (!container) return;

    const query = (roadmap120SearchQuery || '').toLowerCase().trim();

    const filteredDays = plan120.days.filter(d => {
      // Filter tab check
      if (activeRoadmap120Filter === 'today' && d.dayNumber !== todayPlan.dayNumber) return false;
      if (activeRoadmap120Filter === 'upcoming' && (d.dayNumber < todayPlan.dayNumber || d.isCompleted)) return false;
      if (activeRoadmap120Filter === 'completed' && !d.isCompleted) return false;
      if (activeRoadmap120Filter === 'incomplete' && d.isCompleted) return false;
      if (activeRoadmap120Filter === 'buffer' && !d.isBufferDay && d.type !== 'buffer') return false;
      if (activeRoadmap120Filter === 'current_learning' && (d.isBufferDay || d.streams?.current_learning?.status === 'completed')) return false;
      if (activeRoadmap120Filter === 'foundation_revision' && (d.isBufferDay || d.streams?.foundation_revision?.status === 'completed')) return false;

      // Search query check
      if (query) {
        const matchNum = `day ${d.dayNumber}`.includes(query) || `${d.dayNumber}` === query;
        const matchStreamA = (d.streams?.current_learning?.topic || '').toLowerCase().includes(query) ||
                             (d.streams?.current_learning?.subtopic || '').toLowerCase().includes(query) ||
                             (d.streams?.current_learning?.learningObjectives || '').toLowerCase().includes(query);
        const matchStreamB = (d.streams?.foundation_revision?.topic || '').toLowerCase().includes(query) ||
                             (d.streams?.foundation_revision?.subtopic || '').toLowerCase().includes(query) ||
                             (d.streams?.foundation_revision?.revisionObjectives || '').toLowerCase().includes(query);
        const matchBuffer = (d.bufferReason || '').toLowerCase().includes(query) || (d.notes || '').toLowerCase().includes(query);
        const matchProb = (d.streams?.current_learning?.problemIds || []).some(id => id.toLowerCase().includes(query)) ||
                          (d.streams?.foundation_revision?.problemIds || []).some(id => id.toLowerCase().includes(query));
        if (!matchNum && !matchStreamA && !matchStreamB && !matchBuffer && !matchProb) return false;
      }
      return true;
    });

    if (filteredDays.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:48px 20px; background:var(--bg-elevated); border-radius:var(--radius-lg); border:1px dashed var(--border-color); margin-top:16px;">
          <i class="fa-solid fa-filter-circle-xmark" style="font-size:36px; margin-bottom:14px; color:var(--primary); opacity:0.6;"></i>
          <h4 style="color:#f8fafc; font-size:16px; margin:0 0 6px;">No Matching Days Found</h4>
          <p style="font-size:13px; color:var(--text-dim); max-width:420px; margin:0 auto 16px;">No roadmap days matched your current search and filter selections.</p>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-clear-roadmap-filter">
            <i class="fa-solid fa-arrows-rotate"></i> Reset Filters
          </button>
        </div>
      `;
      document.getElementById('btn-clear-roadmap-filter')?.addEventListener('click', () => {
        activeRoadmap120Filter = 'all';
        roadmap120SearchQuery = '';
        const searchInput = document.getElementById('roadmap-120-search-input');
        if (searchInput) searchInput.value = '';
        renderRoadmapView();
      });
      return;
    }

    let html = `<div style="display:flex; flex-direction:column; gap:16px; margin-top:16px;">`;

    filteredDays.forEach(d => {
      const isToday = d.dayNumber === todayPlan.dayNumber;
      const isSelected = selectedRoadmap120Days.has(d.dayNumber);
      const totalEstMins = (d.streams?.current_learning?.estimatedMinutes || 0) +
                           (d.streams?.foundation_revision?.estimatedMinutes || 0) +
                           (d.streams?.srs_due?.estimatedMinutes || 0);

      html += `
        <div class="roadmap-120-day-card ${d.isCompleted ? 'completed' : ''} ${d.isBufferDay ? 'buffer-day' : ''} ${isToday ? 'today-active' : ''}" data-day-num="${d.dayNumber}">
          <!-- Day Header -->
          <div class="roadmap-120-day-header">
            <div class="day-left">
              <input type="checkbox" class="roadmap-120-day-checkbox" data-day="${d.dayNumber}" ${isSelected ? 'checked' : ''} aria-label="Select Day ${d.dayNumber}">
              <span class="roadmap-120-day-number-badge"><i class="fa-solid fa-calendar-day"></i> Day ${d.dayNumber}</span>
              ${isToday ? `<span class="badge" style="background:rgba(139,124,255,0.25); color:#a78bfa; border:1px solid rgba(139,124,255,0.4); font-weight:700;"><i class="fa-solid fa-bullseye"></i> TODAY</span>` : ''}
              ${d.isBufferDay ? `<span class="roadmap-120-buffer-tag"><i class="fa-solid fa-mug-hot"></i> Buffer: ${escapeHtml(d.bufferReason || 'Flex Buffer')}</span>` : ''}
              ${d.isCompleted ? `<span class="badge badge-mastered" style="font-weight:700;"><i class="fa-solid fa-check"></i> Completed</span>` : ''}
              ${!d.isBufferDay ? `<span class="badge" style="background:rgba(255,255,255,0.06); color:var(--text-muted);"><i class="fa-solid fa-clock"></i> ~${totalEstMins}m</span>` : ''}
            </div>

            <div class="day-actions">
              <button type="button" class="btn btn-secondary btn-sm btn-roadmap-toggle-complete" data-day="${d.dayNumber}" title="${d.isCompleted ? 'Mark as Incomplete' : 'Mark as Completed'}">
                <i class="fa-solid ${d.isCompleted ? 'fa-arrow-rotate-left' : 'fa-circle-check'}"></i> <span>${d.isCompleted ? 'Undo' : 'Done'}</span>
              </button>
              <button type="button" class="btn btn-secondary btn-sm btn-roadmap-edit-day" data-day="${d.dayNumber}" title="Edit Day Details & Objectives">
                <i class="fa-solid fa-pen-to-square"></i> <span>Edit</span>
              </button>
              <button type="button" class="btn btn-secondary btn-sm btn-roadmap-insert-after" data-day="${d.dayNumber}" title="Insert Blank Buffer Day After This Day">
                <i class="fa-solid fa-plus"></i> <span>Buffer</span>
              </button>
              ${!d.isBufferDay ? `
                <button type="button" class="btn btn-secondary btn-sm btn-roadmap-split-day" data-day="${d.dayNumber}" title="Split Workload Across Two Days">
                  <i class="fa-solid fa-arrows-split-up-and-left"></i> <span>Split</span>
                </button>
              ` : ''}
              <button type="button" class="btn btn-secondary btn-sm btn-roadmap-shift-from" data-day="${d.dayNumber}" title="Shift Remaining Plan Starting Here">
                <i class="fa-solid fa-forward-step"></i> <span>Shift</span>
              </button>
              <div style="display:flex; gap:2px;">
                ${d.dayNumber > 1 ? `<button type="button" class="btn btn-secondary btn-sm btn-roadmap-move-day" data-day="${d.dayNumber}" data-dir="up" title="Move Day Earlier"><i class="fa-solid fa-arrow-up"></i></button>` : ''}
                ${d.dayNumber < plan120.days.length ? `<button type="button" class="btn btn-secondary btn-sm btn-roadmap-move-day" data-day="${d.dayNumber}" data-dir="down" title="Move Day Later"><i class="fa-solid fa-arrow-down"></i></button>` : ''}
              </div>
            </div>
          </div>

          <!-- Day Body -->
          ${d.isBufferDay ? `
            <div class="roadmap-120-buffer-notice">
              <i class="fa-solid fa-mug-hot" style="font-size:24px; color:#f59e0b;"></i>
              <div>
                <h4 style="margin:0; font-size:14px; color:#f8fafc;">Buffer & Rest Day: ${escapeHtml(d.bufferReason || 'Flex Catch-up')}</h4>
                <p style="margin:4px 0 0; font-size:12.5px; color:var(--text-muted); line-height:1.4;">
                  ${escapeHtml(d.notes || 'Reserved for reviewing backlogs or taking a rest without disturbing roadmap sequence.')}
                </p>
              </div>
            </div>
          ` : `
            <div class="roadmap-120-streams-grid">
              <!-- Stream A: Current Learning -->
              <div class="roadmap-120-stream-box stream-a">
                <div class="stream-box-header">
                  <span class="stream-box-title" style="color:var(--stream-learn-accent);">
                    <i class="fa-solid fa-book-open"></i> Stream A: Learn
                  </span>
                  <span style="font-size:11px; color:var(--text-dim);">~${d.streams?.current_learning?.estimatedMinutes || 60}m</span>
                </div>
                <div style="font-size:14px; font-weight:700; color:#f8fafc; margin-top:4px;">
                  ${escapeHtml(d.streams?.current_learning?.topic || 'General DSA')}
                </div>
                <div style="font-size:12px; color:var(--text-dim); margin-top:2px;">
                  ${escapeHtml(d.streams?.current_learning?.subtopic || '')}
                </div>
                <div style="font-size:11.5px; color:var(--text-muted); margin-top:6px;">
                  <i class="fa-solid fa-bullseye" style="color:var(--stream-learn-accent);"></i> ${escapeHtml(d.streams?.current_learning?.learningObjectives || 'Master core algorithmic technique')}
                </div>

                <div class="roadmap-120-prob-chips-container" style="display:flex; flex-wrap:wrap; gap:6px; margin-top:8px;">
                  ${(d.streams?.current_learning?.problemIds || []).map(pid => {
                    const p = allProblems.find(item => item.id === pid) || { id: pid, title: pid, difficulty: 'Medium' };
                    const isSolved = !!userStates[p.id]?.lastReviewed;
                    return `
                      <button type="button" class="roadmap-120-prob-pill ${isSolved ? 'solved' : ''} btn-action-detail" data-id="${p.id}" title="${escapeHtml(p.title)}">
                        <i class="fa-solid ${isSolved ? 'fa-check' : 'fa-code'}"></i>
                        <span style="max-width:130px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(p.title)}</span>
                        <span class="badge badge-${(p.difficulty || 'medium').toLowerCase()}" style="font-size:9px; padding:1px 4px;">${p.difficulty}</span>
                      </button>
                    `;
                  }).join('')}
                </div>

                <div style="display:flex; gap:6px; margin-top:10px; border-top:1px dashed rgba(139,124,255,0.2); padding-top:8px;">
                  <button type="button" class="btn btn-secondary btn-sm btn-task-skip" data-day="${d.dayNumber}" data-stream="current_learning" style="font-size:10.5px; padding:3px 7px;">
                    <i class="fa-solid fa-forward"></i> Skip
                  </button>
                  <button type="button" class="btn btn-secondary btn-sm btn-task-defer" data-day="${d.dayNumber}" data-stream="current_learning" style="font-size:10.5px; padding:3px 7px;">
                    <i class="fa-solid fa-clock"></i> Defer
                  </button>
                  <button type="button" class="btn btn-secondary btn-sm btn-task-replace" data-day="${d.dayNumber}" data-stream="current_learning" style="font-size:10.5px; padding:3px 7px;">
                    <i class="fa-solid fa-pen"></i> Edit
                  </button>
                </div>
              </div>

              <!-- Stream B: Foundation Revision -->
              <div class="roadmap-120-stream-box stream-b">
                <div class="stream-box-header">
                  <span class="stream-box-title" style="color:var(--stream-topic-accent);">
                    <i class="fa-solid fa-rotate-left"></i> Stream B: Revision
                  </span>
                  <span style="font-size:11px; color:var(--text-dim);">~${d.streams?.foundation_revision?.estimatedMinutes || 35}m</span>
                </div>
                <div style="font-size:14px; font-weight:700; color:#f8fafc; margin-top:4px;">
                  ${escapeHtml(d.streams?.foundation_revision?.topic || 'Maths')}
                </div>
                <div style="font-size:12px; color:var(--text-dim); margin-top:2px;">
                  ${escapeHtml(d.streams?.foundation_revision?.subtopic || '')}
                </div>
                <div style="font-size:11.5px; color:var(--text-muted); margin-top:6px;">
                  <i class="fa-solid fa-arrows-rotate" style="color:var(--stream-topic-accent);"></i> ${escapeHtml(d.streams?.foundation_revision?.revisionObjectives || 'Speed drill')}
                </div>

                <div class="roadmap-120-prob-chips-container" style="display:flex; flex-wrap:wrap; gap:6px; margin-top:8px;">
                  ${(d.streams?.foundation_revision?.problemIds || []).map(pid => {
                    const p = allProblems.find(item => item.id === pid) || { id: pid, title: pid, difficulty: 'Easy' };
                    const isSolved = !!userStates[p.id]?.lastReviewed;
                    return `
                      <button type="button" class="roadmap-120-prob-pill ${isSolved ? 'solved' : ''} btn-action-detail" data-id="${p.id}" title="${escapeHtml(p.title)}">
                        <i class="fa-solid ${isSolved ? 'fa-check' : 'fa-code'}"></i>
                        <span style="max-width:130px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(p.title)}</span>
                        <span class="badge badge-${(p.difficulty || 'easy').toLowerCase()}" style="font-size:9px; padding:1px 4px;">${p.difficulty}</span>
                      </button>
                    `;
                  }).join('')}
                </div>

                <div style="display:flex; gap:6px; margin-top:10px; border-top:1px dashed rgba(66,214,197,0.2); padding-top:8px;">
                  <button type="button" class="btn btn-secondary btn-sm btn-task-skip" data-day="${d.dayNumber}" data-stream="foundation_revision" style="font-size:10.5px; padding:3px 7px;">
                    <i class="fa-solid fa-forward"></i> Skip
                  </button>
                  <button type="button" class="btn btn-secondary btn-sm btn-task-defer" data-day="${d.dayNumber}" data-stream="foundation_revision" style="font-size:10.5px; padding:3px 7px;">
                    <i class="fa-solid fa-clock"></i> Defer
                  </button>
                  <button type="button" class="btn btn-secondary btn-sm btn-task-replace" data-day="${d.dayNumber}" data-stream="foundation_revision" style="font-size:10.5px; padding:3px 7px;">
                    <i class="fa-solid fa-pen"></i> Edit
                  </button>
                </div>
              </div>

              <!-- Stream C: SRS Due -->
              <div class="roadmap-120-stream-box stream-c">
                <div class="stream-box-header">
                  <span class="stream-box-title" style="color:var(--stream-srs-accent);">
                    <i class="fa-solid fa-clock-rotate-left"></i> Stream C: SRS Due
                  </span>
                  <span style="font-size:11px; color:var(--text-dim);">~${d.streams?.srs_due?.estimatedMinutes || 20}m</span>
                </div>

                ${isToday ? `
                  <div style="margin-top:4px;">
                    <div style="display:flex; align-items:center; gap:6px;">
                      <span class="badge badge-due" style="font-size:12px; font-weight:700;">
                        ${todayPlan.streamC?.dueCount || 0} Reviews Due Today
                      </span>
                    </div>
                    ${todayPlan.streamC?.dueProblems && todayPlan.streamC.dueProblems.length > 0 ? `
                      <div style="display:flex; flex-direction:column; gap:6px; margin-top:8px; max-height:160px; overflow-y:auto;">
                        ${todayPlan.streamC.dueProblems.map(p => `
                          <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.2); padding:6px 8px; border-radius:var(--radius-sm); border:1px solid rgba(245,190,101,0.2);">
                            <span style="font-size:12px; color:#f8fafc; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:160px;">${escapeHtml(p.title)}</span>
                            <div style="display:flex; gap:4px;">
                              <button type="button" class="btn btn-primary btn-sm btn-action-review" data-id="${p.id}" style="font-size:10px; padding:2px 6px;">Revise</button>
                              <button type="button" class="btn btn-secondary btn-sm btn-action-detail" data-id="${p.id}" style="font-size:10px; padding:2px 6px;"><i class="fa-solid fa-file-lines"></i></button>
                            </div>
                          </div>
                        `).join('')}
                      </div>
                    ` : `
                      <div style="font-size:12px; color:#34d399; margin-top:10px; display:flex; align-items:center; gap:6px;">
                        <i class="fa-solid fa-check-circle"></i> All SRS reviews up-to-date!
                      </div>
                    `}
                  </div>
                ` : `
                  <div style="margin-top:6px;">
                    <div style="font-size:12.5px; color:#f8fafc; font-weight:600;">
                      SRS Interval Consolidation
                    </div>
                    <div style="font-size:11.5px; color:var(--text-muted); margin-top:4px; line-height:1.4;">
                      Dynamic spaced repetition slots (~${d.streams?.srs_due?.targetCount || 2} reviews). Genuine intervals calculated live from review history.
                    </div>
                  </div>
                `}
              </div>
            </div>
          `}

          ${d.notes ? `
            <div style="font-size:11.5px; color:var(--text-dim); margin-top:8px; border-top:1px dashed var(--border-color); padding-top:6px;">
              <i class="fa-regular fa-note-sticky" style="color:var(--primary); margin-right:4px;"></i> ${escapeHtml(d.notes)}
            </div>
          ` : ''}
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;
  }

  function render120CalendarView(plan120, todayPlan) {
    const container = document.getElementById('roadmap-120-content-area');
    if (!container) return;

    const totalWeeks = Math.ceil(plan120.days.length / 7);
    let html = `
      <div style="margin-top:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="font-size:15px; font-weight:700; color:#f8fafc; margin:0;">
            <i class="fa-solid fa-calendar-days" style="color:var(--primary); margin-right:6px;"></i> 120-Day Interactive Calendar Overview
          </h3>
          <span style="font-size:12px; color:var(--text-dim);">${totalWeeks} Total Weeks (${plan120.days.length} Days)</span>
        </div>
        <div class="roadmap-120-calendar-container">
    `;

    for (let w = 0; w < totalWeeks; w++) {
      const weekDays = plan120.days.slice(w * 7, (w + 1) * 7);
      html += `
        <div class="roadmap-120-calendar-week">
          <div class="calendar-week-header">Week ${w + 1}</div>
          <div class="calendar-days-row">
            ${weekDays.map(d => {
              const isToday = d.dayNumber === todayPlan.dayNumber;
              return `
                <div class="calendar-day-cell ${d.isCompleted ? 'completed' : ''} ${d.isBufferDay ? 'buffer' : ''} ${isToday ? 'today' : ''}" data-day="${d.dayNumber}" title="Click to edit Day ${d.dayNumber}">
                  <div class="calendar-cell-top">
                    <span class="cell-day-num">D${d.dayNumber}</span>
                    ${d.isCompleted ? '<i class="fa-solid fa-circle-check cell-check" style="color:#34d399; font-size:11px;"></i>' : ''}
                  </div>
                  ${d.isBufferDay ? `
                    <div class="cell-buffer-txt"><i class="fa-solid fa-mug-hot"></i> Buffer</div>
                  ` : `
                    <div class="cell-topic-chip stream-a" title="${escapeHtml(d.streams?.current_learning?.topic || '')}">
                      ${escapeHtml(d.streams?.current_learning?.topic || 'DSA')}
                    </div>
                    <div class="cell-topic-chip stream-b" title="${escapeHtml(d.streams?.foundation_revision?.topic || '')}">
                      ${escapeHtml(d.streams?.foundation_revision?.topic || 'Rev')}
                    </div>
                  `}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    html += `
        </div>
      </div>
    `;
    container.innerHTML = html;
  }

  function render120TopicsView(plan120, todayPlan) {
    const container = document.getElementById('roadmap-120-content-area');
    if (!container) return;

    // Group days by Stream A topics and Stream B topics
    const streamATopicsMap = new Map();
    const streamBTopicsMap = new Map();

    plan120.days.forEach(d => {
      if (d.isBufferDay) return;
      if (d.streams?.current_learning?.topic) {
        const t = d.streams.current_learning.topic;
        if (!streamATopicsMap.has(t)) {
          streamATopicsMap.set(t, { days: [], completed: 0, problems: new Set() });
        }
        const data = streamATopicsMap.get(t);
        data.days.push(d.dayNumber);
        if (d.isCompleted) data.completed++;
        (d.streams.current_learning.problemIds || []).forEach(pid => data.problems.add(pid));
      }

      if (d.streams?.foundation_revision?.topic) {
        const t = d.streams.foundation_revision.topic;
        if (!streamBTopicsMap.has(t)) {
          streamBTopicsMap.set(t, { days: [], completed: 0, problems: new Set() });
        }
        const data = streamBTopicsMap.get(t);
        data.days.push(d.dayNumber);
        if (d.isCompleted) data.completed++;
        (d.streams.foundation_revision.problemIds || []).forEach(pid => data.problems.add(pid));
      }
    });

    let html = `
      <div style="margin-top:16px; display:flex; flex-direction:column; gap:20px;">
        <!-- Stream A Topic Progression Matrix -->
        <div style="background:var(--bg-elevated); border:1px solid var(--border-color); border-radius:var(--radius-lg); padding:18px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
            <div>
              <h3 style="font-size:15px; font-weight:700; color:var(--stream-learn-accent); margin:0; display:flex; align-items:center; gap:8px;">
                <i class="fa-solid fa-book-open"></i> Stream A: Current Learning Topic Progression
              </h3>
              <span style="font-size:12px; color:var(--text-dim);">Sequential advance from Graphs through DP and FAANG interview preparation</span>
            </div>
            <span class="badge" style="background:rgba(139,124,255,0.15); color:var(--stream-learn-accent); font-weight:700;">
              ${streamATopicsMap.size} Topic Modules
            </span>
          </div>

          <div class="roadmap-120-topic-matrix">
            ${Array.from(streamATopicsMap.entries()).map(([topic, data]) => {
              const pct = data.days.length > 0 ? Math.round((data.completed / data.days.length) * 100) : 0;
              return `
                <div class="roadmap-120-topic-card" data-topic="${escapeHtml(topic)}" style="cursor:pointer;" title="Click to filter roadmap by ${escapeHtml(topic)}">
                  <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div style="font-size:13.5px; font-weight:700; color:#f8fafc;">${escapeHtml(topic)}</div>
                    <span class="badge" style="font-size:10px;">${data.completed} / ${data.days.length}d</span>
                  </div>
                  <div style="font-size:11.5px; color:var(--text-dim); margin-top:4px;">
                    Days ${Math.min(...data.days)}–${Math.max(...data.days)} • ${data.problems.size} Curated Problems
                  </div>
                  <div class="progress-bar-wrap" style="height:5px; margin-top:10px; background:rgba(255,255,255,0.06);">
                    <div class="progress-bar-fill" style="width:${pct}%; background:var(--stream-learn-accent);"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Stream B Foundation Revision Progression Matrix -->
        <div style="background:var(--bg-elevated); border:1px solid var(--border-color); border-radius:var(--radius-lg); padding:18px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
            <div>
              <h3 style="font-size:15px; font-weight:700; color:var(--stream-topic-accent); margin:0; display:flex; align-items:center; gap:8px;">
                <i class="fa-solid fa-rotate-left"></i> Stream B: Foundation Revision Topic Progression
              </h3>
              <span style="font-size:12px; color:var(--text-dim);">Independent sequential foundation revision from Maths to Advanced Algorithms</span>
            </div>
            <span class="badge" style="background:rgba(66,214,197,0.15); color:var(--stream-topic-accent); font-weight:700;">
              ${streamBTopicsMap.size} Foundation Units
            </span>
          </div>

          <div class="roadmap-120-topic-matrix">
            ${Array.from(streamBTopicsMap.entries()).map(([topic, data]) => {
              const pct = data.days.length > 0 ? Math.round((data.completed / data.days.length) * 100) : 0;
              return `
                <div class="roadmap-120-topic-card" data-topic="${escapeHtml(topic)}" style="cursor:pointer;" title="Click to filter roadmap by ${escapeHtml(topic)}">
                  <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div style="font-size:13.5px; font-weight:700; color:#f8fafc;">${escapeHtml(topic)}</div>
                    <span class="badge" style="font-size:10px;">${data.completed} / ${data.days.length}d</span>
                  </div>
                  <div style="font-size:11.5px; color:var(--text-dim); margin-top:4px;">
                    Days ${Math.min(...data.days)}–${Math.max(...data.days)} • ${data.problems.size} Drills
                  </div>
                  <div class="progress-bar-wrap" style="height:5px; margin-top:10px; background:rgba(255,255,255,0.06);">
                    <div class="progress-bar-fill" style="width:${pct}%; background:var(--stream-topic-accent);"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
    container.innerHTML = html;
  }

  function render120AuditView() {
    const container = document.getElementById('roadmap-120-content-area');
    if (!container) return;

    if (!window.RoadmapCurriculumData || !window.RoadmapCurriculumData.TAXONOMY_AUDIT) {
      container.innerHTML = '<div class="empty-state">Curriculum Audit data unavailable.</div>';
      return;
    }

    const summary = window.RoadmapCurriculumData.getTaxonomyCoverageSummary ?
      window.RoadmapCurriculumData.getTaxonomyCoverageSummary() :
      { totalPatterns: 100, coreCoveragePct: 87, coreStats: '60 / 69 Core Patterns Covered', importantStats: '25 / 31 Important Patterns Covered', advancedCount: 11, optionalCount: 6, catalogSize: 479 };

    const areas = window.RoadmapCurriculumData.TAXONOMY_AUDIT;

    let html = `
      <div class="roadmap-120-audit-wrap">
        <!-- Executive KPI Banner -->
        <div class="roadmap-120-audit-summary-grid">
          <div class="roadmap-120-audit-summary-card card-core">
            <div style="font-size:12px; font-weight:700; color:#a78bfa; text-transform:uppercase; letter-spacing:0.5px;">Core Taxonomy Coverage</div>
            <div style="font-size:26px; font-weight:800; color:#f8fafc; margin-top:4px;">${summary.coreCoveragePct}%</div>
            <div style="font-size:12px; color:var(--text-dim); margin-top:2px;">${summary.coreStats}</div>
            <div class="progress-bar-wrap" style="height:4px; margin-top:8px; background:rgba(255,255,255,0.06);">
              <div class="progress-bar-fill" style="width:${summary.coreCoveragePct}%; background:#8b7cff;"></div>
            </div>
          </div>

          <div class="roadmap-120-audit-summary-card card-important">
            <div style="font-size:12px; font-weight:700; color:#42d6c5; text-transform:uppercase; letter-spacing:0.5px;">Important Patterns</div>
            <div style="font-size:26px; font-weight:800; color:#f8fafc; margin-top:4px;">81%</div>
            <div style="font-size:12px; color:var(--text-dim); margin-top:2px;">${summary.importantStats}</div>
            <div class="progress-bar-wrap" style="height:4px; margin-top:8px; background:rgba(255,255,255,0.06);">
              <div class="progress-bar-fill" style="width:81%; background:#42d6c5;"></div>
            </div>
          </div>

          <div class="roadmap-120-audit-summary-card card-advanced">
            <div style="font-size:12px; font-weight:700; color:#f5be65; text-transform:uppercase; letter-spacing:0.5px;">Post-120 Extension</div>
            <div style="font-size:26px; font-weight:800; color:#f8fafc; margin-top:4px;">${summary.advancedCount + summary.optionalCount}</div>
            <div style="font-size:12px; color:var(--text-dim); margin-top:2px;">${summary.advancedCount} Advanced • ${summary.optionalCount} Optional Patterns</div>
          </div>

          <div class="roadmap-120-audit-summary-card card-catalog">
            <div style="font-size:12px; font-weight:700; color:#34d399; text-transform:uppercase; letter-spacing:0.5px;">Problem Catalog</div>
            <div style="font-size:26px; font-weight:800; color:#f8fafc; margin-top:4px;">${summary.catalogSize || 479}</div>
            <div style="font-size:12px; color:var(--text-dim); margin-top:2px;">Master DSA Catalog Mapped to 14 Topics</div>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px;">
          <div>
            <h3 style="font-size:16px; font-weight:700; color:#f8fafc; margin:0;">
              <i class="fa-solid fa-clipboard-check" style="color:var(--primary); margin-right:8px;"></i>
              Curriculum Completeness Audit (Taxonomies A–N)
            </h3>
            <span style="font-size:12px; color:var(--text-dim);">Detailed breakdown of all 14 algorithmic domains, pattern classification, catalog problem coverage, and post-120 gaps</span>
          </div>
          <span class="badge" style="background:rgba(139,124,255,0.15); color:var(--primary-light); font-weight:700;">
            14 Algorithmic Taxonomies
          </span>
        </div>

        <!-- 14 Areas List -->
        <div style="display:flex; flex-direction:column; gap:14px;">
          ${areas.map(area => {
            const total = area.patterns.length;
            const core = area.patterns.filter(p => p.tier === 'Core');
            const coreCovered = core.filter(p => p.catalogCount > 0).length;
            const corePct = core.length > 0 ? Math.round((coreCovered / core.length) * 100) : 100;

            return `
              <div class="roadmap-120-audit-area-card" id="audit-area-${escapeHtml(area.code)}">
                <div class="roadmap-120-audit-area-header">
                  <div style="display:flex; align-items:center; gap:10px;">
                    <span class="badge" style="background:rgba(139,124,255,0.2); color:#a78bfa; font-weight:800; font-size:12px;">
                      Area ${escapeHtml(area.code)}
                    </span>
                    <span style="font-size:14.5px; font-weight:700; color:#f8fafc;">
                      ${escapeHtml(area.area)}
                    </span>
                  </div>
                  <div style="display:flex; align-items:center; gap:12px;">
                    <span style="font-size:12px; color:var(--text-dim);">
                      Core: <strong style="color:#34d399;">${coreCovered}/${core.length}</strong> (${corePct}%) • Total: <strong>${total}</strong> patterns
                    </span>
                  </div>
                </div>

                <table class="roadmap-120-audit-patterns-table">
                  <thead>
                    <tr>
                      <th style="width:30%;">Pattern Name</th>
                      <th style="width:15%;">Tier</th>
                      <th style="width:15%;">Catalog Problems</th>
                      <th style="width:20%;">120D Status</th>
                      <th style="width:20%;">Sample Match</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${area.patterns.map(p => {
                      const isCovered = p.catalogCount > 0;
                      const sampleProb = (p.sampleProblemIds && p.sampleProblemIds.length > 0) ? p.sampleProblemIds[0] : 'None';
                      return `
                        <tr>
                          <td style="font-weight:600; color:#f8fafc;">
                            ${escapeHtml(p.name)}
                          </td>
                          <td>
                            <span class="tier-badge tier-${escapeHtml(p.tier)}">${escapeHtml(p.tier)}</span>
                          </td>
                          <td>
                            <span style="font-weight:700; color:${p.catalogCount > 0 ? '#34d399' : 'var(--text-dim)'};">
                              ${p.catalogCount} problems
                            </span>
                          </td>
                          <td>
                            ${isCovered ? `
                              <span class="coverage-pill covered">
                                <i class="fa-solid fa-check"></i> Covered in 120D
                              </span>
                            ` : `
                              <span class="coverage-pill gap" title="Identified as gap or post-120 extension pattern">
                                <i class="fa-solid fa-arrow-up-right-from-square"></i> Post-120 Extension
                              </span>
                            `}
                          </td>
                          <td style="font-size:11.5px; color:var(--text-dim); font-family:monospace;">
                            ${escapeHtml(sampleProb)}
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  // --- 120-DAY ROADMAP MODAL DIALOGS ---
  function openRoadmapEditModal(dayNum) {
    const modal = document.getElementById('roadmap-edit-day-modal');
    if (!modal || !window.RoadmapEngine) return;

    const plan = RoadmapEngine.get120DayRoadmap(userStates);
    const day = plan.days.find(d => d.dayNumber === dayNum);
    if (!day) return;

    const seqInput = document.getElementById('edit-day-seq-input');
    const titleEl = document.getElementById('roadmap-edit-modal-title');
    const typeSelect = document.getElementById('edit-day-type-select');
    const bufferReasonInput = document.getElementById('edit-day-buffer-reason');

    const streamATopic = document.getElementById('edit-stream-a-topic');
    const streamASubtopic = document.getElementById('edit-stream-a-subtopic');
    const streamATarget = document.getElementById('edit-stream-a-target');
    const streamAMins = document.getElementById('edit-stream-a-mins');
    const streamAStatus = document.getElementById('edit-stream-a-status');
    const streamAObjectives = document.getElementById('edit-stream-a-objectives');
    const streamAProblems = document.getElementById('edit-stream-a-problems');

    const streamBTopic = document.getElementById('edit-stream-b-topic');
    const streamBSubtopic = document.getElementById('edit-stream-b-subtopic');
    const streamBTarget = document.getElementById('edit-stream-b-target');
    const streamBMins = document.getElementById('edit-stream-b-mins');
    const streamBStatus = document.getElementById('edit-stream-b-status');
    const streamBObjectives = document.getElementById('edit-stream-b-objectives');
    const streamBProblems = document.getElementById('edit-stream-b-problems');

    const notesText = document.getElementById('edit-day-notes');

    if (seqInput) seqInput.value = day.dayNumber;
    if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-pen-to-square" style="color:var(--primary); margin-right:8px;"></i> Edit Roadmap Day ${day.dayNumber}`;
    if (typeSelect) typeSelect.value = day.type || (day.isBufferDay ? 'buffer' : 'learning');
    if (bufferReasonInput) bufferReasonInput.value = day.bufferReason || '';

    if (streamATopic) streamATopic.value = day.streams?.current_learning?.topic || '';
    if (streamASubtopic) streamASubtopic.value = day.streams?.current_learning?.subtopic || '';
    if (streamATarget) streamATarget.value = day.streams?.current_learning?.targetCount || 3;
    if (streamAMins) streamAMins.value = day.streams?.current_learning?.estimatedMinutes || 60;
    if (streamAStatus) streamAStatus.value = day.streams?.current_learning?.status || 'pending';
    if (streamAObjectives) streamAObjectives.value = day.streams?.current_learning?.learningObjectives || '';
    if (streamAProblems) streamAProblems.value = (day.streams?.current_learning?.problemIds || []).join(', ');

    if (streamBTopic) streamBTopic.value = day.streams?.foundation_revision?.topic || '';
    if (streamBSubtopic) streamBSubtopic.value = day.streams?.foundation_revision?.subtopic || '';
    if (streamBTarget) streamBTarget.value = day.streams?.foundation_revision?.targetCount || 2;
    if (streamBMins) streamBMins.value = day.streams?.foundation_revision?.estimatedMinutes || 35;
    if (streamBStatus) streamBStatus.value = day.streams?.foundation_revision?.status || 'pending';
    if (streamBObjectives) streamBObjectives.value = day.streams?.foundation_revision?.revisionObjectives || '';
    if (streamBProblems) streamBProblems.value = (day.streams?.foundation_revision?.problemIds || []).join(', ');

    if (notesText) notesText.value = day.notes || '';

    modal.classList.add('open');
  }

  function closeRoadmapEditModal() {
    document.getElementById('roadmap-edit-day-modal')?.classList.remove('open');
  }

  function saveRoadmapEditModal() {
    if (!window.RoadmapEngine) return;
    const dayNum = parseInt(document.getElementById('edit-day-seq-input')?.value, 10);
    if (!dayNum) return;

    const type = document.getElementById('edit-day-type-select')?.value || 'learning';
    const bufferReason = document.getElementById('edit-day-buffer-reason')?.value || '';
    const notes = document.getElementById('edit-day-notes')?.value || '';

    const streamAProbStr = document.getElementById('edit-stream-a-problems')?.value || '';
    const streamAProblems = streamAProbStr.split(',').map(s => s.trim()).filter(Boolean);

    const streamBProbStr = document.getElementById('edit-stream-b-problems')?.value || '';
    const streamBProblems = streamBProbStr.split(',').map(s => s.trim()).filter(Boolean);

    const updates = {
      type: type,
      isBufferDay: type === 'buffer',
      bufferReason: bufferReason,
      notes: notes,
      streams: {
        current_learning: {
          topic: document.getElementById('edit-stream-a-topic')?.value || '',
          subtopic: document.getElementById('edit-stream-a-subtopic')?.value || '',
          targetCount: parseInt(document.getElementById('edit-stream-a-target')?.value, 10) || 3,
          estimatedMinutes: parseInt(document.getElementById('edit-stream-a-mins')?.value, 10) || 60,
          status: document.getElementById('edit-stream-a-status')?.value || 'pending',
          learningObjectives: document.getElementById('edit-stream-a-objectives')?.value || '',
          problemIds: streamAProblems
        },
        foundation_revision: {
          topic: document.getElementById('edit-stream-b-topic')?.value || '',
          subtopic: document.getElementById('edit-stream-b-subtopic')?.value || '',
          targetCount: parseInt(document.getElementById('edit-stream-b-target')?.value, 10) || 2,
          estimatedMinutes: parseInt(document.getElementById('edit-stream-b-mins')?.value, 10) || 35,
          status: document.getElementById('edit-stream-b-status')?.value || 'pending',
          revisionObjectives: document.getElementById('edit-stream-b-objectives')?.value || '',
          problemIds: streamBProblems
        }
      }
    };

    RoadmapEngine.editDay(dayNum, updates);
    closeRoadmapEditModal();
    renderRoadmapView();
  }

  function openRoadmapInsertModal(targetDayNum) {
    const modal = document.getElementById('roadmap-insert-day-modal');
    if (!modal) return;
    const targetInput = document.getElementById('insert-day-target-num');
    if (targetInput) targetInput.value = targetDayNum || 1;
    modal.classList.add('open');
  }

  function closeRoadmapInsertModal() {
    document.getElementById('roadmap-insert-day-modal')?.classList.remove('open');
  }

  function saveRoadmapInsertModal() {
    if (!window.RoadmapEngine) return;
    const relation = document.getElementById('insert-day-relation')?.value || 'after';
    const targetNum = parseInt(document.getElementById('insert-day-target-num')?.value, 10) || 1;
    const reason = document.getElementById('insert-day-reason')?.value || 'Flex Buffer Day';
    const notes = document.getElementById('insert-day-notes')?.value || '';

    const afterDayNumber = relation === 'after' ? targetNum : Math.max(0, targetNum - 1);
    RoadmapEngine.insertDay(afterDayNumber, { bufferReason: reason, notes: notes });
    closeRoadmapInsertModal();
    renderRoadmapView();
  }

  function openRoadmapShiftModal(fromDayNum) {
    const modal = document.getElementById('roadmap-shift-modal');
    if (!modal) return;
    const fromInput = document.getElementById('shift-from-day-input');
    if (fromInput) fromInput.value = fromDayNum || 1;
    modal.classList.add('open');
  }

  function closeRoadmapShiftModal() {
    document.getElementById('roadmap-shift-modal')?.classList.remove('open');
  }

  function saveRoadmapShiftModal() {
    if (!window.RoadmapEngine) return;
    const fromDay = parseInt(document.getElementById('shift-from-day-input')?.value, 10) || 1;
    const count = parseInt(document.getElementById('shift-count-input')?.value, 10) || 1;
    const mode = document.getElementById('shift-stream-mode')?.value || 'both';
    const reason = document.getElementById('shift-reason-input')?.value || 'Schedule shift';

    RoadmapEngine.shiftRoadmap(fromDay, count, { stream: mode, reason: reason });
    closeRoadmapShiftModal();
    renderRoadmapView();
  }

  function openRoadmapCondenseModal(fromDayNum) {
    const modal = document.getElementById('roadmap-condense-modal');
    if (!modal) return;
    const fromInput = document.getElementById('condense-from-day');
    if (fromInput) fromInput.value = fromDayNum || 1;
    const previewBox = document.getElementById('condense-preview-results');
    if (previewBox) previewBox.style.display = 'none';
    modal.classList.add('open');
  }

  function closeRoadmapCondenseModal() {
    document.getElementById('roadmap-condense-modal')?.classList.remove('open');
  }

  function previewRoadmapCondense() {
    if (!window.RoadmapEngine) return;
    const fromDay = parseInt(document.getElementById('condense-from-day')?.value, 10) || 1;
    const dailyMinutes = parseInt(document.getElementById('condense-daily-minutes')?.value, 10) || 120;
    const weeklyDays = parseInt(document.getElementById('condense-weekly-days')?.value, 10) || 5;
    const targetDate = document.getElementById('condense-target-date')?.value || null;
    const reduceTargets = document.getElementById('condense-reduce-targets')?.checked ?? true;

    const result = RoadmapEngine.condenseRoadmap({
      fromDay,
      dailyMinutes,
      weeklyDays,
      targetDate,
      reduceTargets,
      dryRun: true
    });

    const previewBox = document.getElementById('condense-preview-results');
    if (!previewBox) return;

    previewBox.style.display = 'block';
    previewBox.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <span style="font-size:13px; font-weight:700; color:#f8fafc;">Feasibility Assessment:</span>
        <span class="badge" style="background:${result.feasibility.isFeasible ? 'rgba(52,211,153,0.2)' : 'rgba(239,68,68,0.2)'}; color:${result.feasibility.isFeasible ? '#34d399' : '#f87171'}; border:1px solid ${result.feasibility.isFeasible ? 'rgba(52,211,153,0.4)' : 'rgba(239,68,68,0.4)'}; font-weight:700;">
          <i class="fa-solid ${result.feasibility.isFeasible ? 'fa-circle-check' : 'fa-triangle-exclamation'}"></i> ${result.feasibility.status}
        </span>
      </div>
      <p style="font-size:12px; color:var(--text-muted); margin-bottom:10px; line-height:1.4;">
        ${escapeHtml(result.feasibility.reason)}
      </p>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; font-size:12px; background:rgba(0,0,0,0.25); padding:8px; border-radius:var(--radius-sm);">
        <div><strong>Initial Remaining Days:</strong> ${result.before.totalDays - fromDay + 1}</div>
        <div><strong>Recalculated Days:</strong> ${result.after.totalDays - fromDay + 1}</div>
        <div><strong>Original Plan Length:</strong> ${result.before.totalDays} Days</div>
        <div><strong>Condensed Plan Length:</strong> ${result.after.totalDays} Days</div>
      </div>
      ${result.feasibility.recommendation ? `
        <div style="margin-top:8px; font-size:11.5px; color:#f59e0b;">
          <i class="fa-solid fa-lightbulb"></i> <strong>Trade-off:</strong> ${escapeHtml(result.feasibility.recommendation)}
        </div>
      ` : ''}
    `;
  }

  function saveRoadmapCondenseModal() {
    if (!window.RoadmapEngine) return;
    const fromDay = parseInt(document.getElementById('condense-from-day')?.value, 10) || 1;
    const dailyMinutes = parseInt(document.getElementById('condense-daily-minutes')?.value, 10) || 120;
    const weeklyDays = parseInt(document.getElementById('condense-weekly-days')?.value, 10) || 5;
    const targetDate = document.getElementById('condense-target-date')?.value || null;
    const reduceTargets = document.getElementById('condense-reduce-targets')?.checked ?? true;

    RoadmapEngine.condenseRoadmap({
      fromDay,
      dailyMinutes,
      weeklyDays,
      targetDate,
      reduceTargets,
      dryRun: false
    });

    closeRoadmapCondenseModal();
    renderRoadmapView();
  }

  function openRoadmapHistoryModal() {
    const modal = document.getElementById('roadmap-history-modal');
    if (!modal || !window.RoadmapEngine) return;

    const history = RoadmapEngine.getChangeHistory();
    const listEl = document.getElementById('roadmap-history-list');
    if (listEl) {
      if (history.length === 0) {
        listEl.innerHTML = `
          <div style="text-align:center; padding:24px; color:var(--text-dim); font-size:13px;">
            <i class="fa-solid fa-clock-rotate-left" style="font-size:24px; margin-bottom:8px; opacity:0.5;"></i>
            <div>No roadmap plan edits recorded yet.</div>
          </div>
        `;
      } else {
        listEl.innerHTML = history.slice().reverse().map((item, idx) => `
          <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.25); border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:10px 12px;">
            <div>
              <div style="font-size:13px; font-weight:700; color:#f8fafc;">
                ${escapeHtml(item.description)}
              </div>
              <div style="font-size:11px; color:var(--text-dim); margin-top:2px;">
                <span class="badge" style="font-size:9.5px; padding:1px 5px;">${escapeHtml(item.actionType)}</span>
                <span style="margin-left:6px;">${new Date(item.timestamp).toLocaleString()}</span>
              </div>
            </div>
            ${idx === 0 ? `
              <button type="button" class="btn btn-secondary btn-sm" id="btn-history-inline-undo" style="font-size:11px; padding:4px 8px;">
                <i class="fa-solid fa-rotate-left"></i> Revert
              </button>
            ` : ''}
          </div>
        `).join('');

        document.getElementById('btn-history-inline-undo')?.addEventListener('click', () => {
          RoadmapEngine.undoLastAction();
          openRoadmapHistoryModal();
          renderRoadmapView();
        });
      }
    }

    modal.classList.add('open');
  }

  function closeRoadmapHistoryModal() {
    document.getElementById('roadmap-history-modal')?.classList.remove('open');
  }

  function renderActiveDayContent(activeTrack, currentWeek, currentDay) {
    const container = document.getElementById('roadmap-active-day-content');
    if (!container) return;

    const isDayDone = RoadmapEngine.isDayCompleted(activeTrack, currentWeek.weekNumber, currentDay.dayNumber);
    const customDayTopic = RoadmapEngine.getDayCustomTopic(activeTrack, currentWeek.weekNumber, currentDay.dayNumber);

    // Fetch dynamic target problems (incorporating any custom single topic or multi-topic mixed workout with confidence scoring)
    const targetProblems = RoadmapEngine.getDayProblems(activeTrack, currentWeek.weekNumber, currentDay.dayNumber, currentDay, allProblems, userStates);
    const workload = RoadmapEngine.calculateWorkload(targetProblems);

    // Fetch carried-over unsolved target problems from previous days
    const rolloverProblems = currentDay.isWeekend ? [] : RoadmapEngine.getRolloverProblems(activeTrack, currentWeek.weekNumber, currentDay.dayNumber, allProblems, userStates);

    // Day Header Card
    let headerHtml = `
      <div class="roadmap-day-focus-card">
        <div class="day-focus-header">
          <div class="day-focus-meta" style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <span class="day-badge"><i class="fa-solid fa-calendar-day"></i> Day ${currentDay.dayNumber} of 7</span>

            ${customDayTopic ? (
              Array.isArray(customDayTopic)
                ? `<span class="custom-topic-badge"><i class="fa-solid fa-layer-group"></i> Mixed: ${customDayTopic.join(', ')}</span>`
                : `<span class="custom-topic-badge"><i class="fa-solid fa-shuffle"></i> Custom: ${customDayTopic}</span>`
            ) : `<span class="badge badge-srs-upcoming">${currentDay.topic}</span>`}

            <span class="workload-badge ${workload.typeClass}"><i class="fa-solid fa-gauge-high"></i> ${workload.label}</span>
            ${currentDay.isWeekend ? `<span class="badge" style="background:rgba(234,179,8,0.15); color:#fbbf24; border:1px solid rgba(234,179,8,0.3);"><i class="fa-solid fa-star"></i> Weekend Test & Review</span>` : ''}
          </div>
          <h3 class="day-focus-title">${currentDay.title}</h3>
          <p class="day-focus-desc">
            <i class="fa-solid fa-bullseye" style="color:var(--primary); margin-right:6px;"></i>
            ${customDayTopic ? (Array.isArray(customDayTopic) ? `Multi-Topic Mixed Workout across ${customDayTopic.join(', ')}` : `Custom Focused Session on ${customDayTopic}`) : currentDay.focus}
          </p>
        </div>
        <div class="day-focus-actions" style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
          ${!currentDay.isWeekend ? `
            <button id="btn-open-switch-topic-modal" class="btn btn-secondary btn-sm" style="font-weight:700; border-color:var(--accent-cyan); color:var(--accent-cyan);">
              <i class="fa-solid fa-shuffle"></i> <span>${customDayTopic ? 'Change / Mix Topics' : 'Switch Topic / Mix'}</span>
            </button>
            ${customDayTopic ? `
              <button class="btn btn-secondary btn-sm btn-reset-day-topic" title="Reset to default topic" style="color:#fb7185; padding:6px 10px;">
                <i class="fa-solid fa-arrow-rotate-left"></i> Reset
              </button>
            ` : ''}
          ` : ''}
          <button id="btn-toggle-day-complete" class="btn ${isDayDone ? 'btn-secondary' : 'btn-primary'}" data-track="${activeTrack}" data-week="1" data-day="${currentDay.dayNumber}">
            <i class="fa-solid ${isDayDone ? 'fa-arrow-rotate-left' : 'fa-circle-check'}"></i>
            <span>${isDayDone ? 'Completed (Undo)' : 'Mark Day as Completed'}</span>
          </button>
        </div>
      </div>
    `;

    // Case 1: Weekend Sunday Diagnostic Exam
    if (currentDay.isExamDay) {
      headerHtml += `
        <div class="roadmap-weekend-banner exam" style="margin-top:20px;">
          <div class="weekend-banner-left">
            <div class="weekend-icon-wrap exam">
              <i class="fa-solid fa-trophy"></i>
            </div>
            <div>
              <div class="weekend-pill exam"><i class="fa-solid fa-stopwatch"></i> 30-Minute Timed Checkpoint</div>
              <h3 style="font-size:20px; font-weight:800; color:#f8fafc; margin-top:4px;">Weekend Diagnostic Mock Assessment</h3>
              <p style="font-size:13px; color:var(--text-muted); margin-top:6px; max-width:650px; line-height:1.5;">
                Evaluate your true problem-solving speed and algorithm recall under timed interview conditions with scratchpad, pattern validation, and instant grading sandbox.
              </p>
              <div style="display:flex; gap:10px; margin-top:14px; flex-wrap:wrap;">
                <span class="badge badge-easy">1 Easy Warmup</span>
                <span class="badge badge-medium">2 Medium Core Challenges</span>
                <span class="badge badge-srs-upcoming">Topic: ${currentDay.topic || 'General DSA'}</span>
              </div>
            </div>
          </div>
          <div class="weekend-banner-actions">
            <button class="btn btn-primary" id="btn-launch-weekend-exam" data-topic="${currentDay.topic || 'General'}" style="background:linear-gradient(135deg, #eab308 0%, #f59e0b 100%); color:#0f172a; font-weight:800; padding:12px 24px; font-size:14px; box-shadow:0 6px 20px rgba(234,179,8,0.3);">
              <i class="fa-solid fa-play"></i> Start 30-Min Diagnostic Exam
            </button>
          </div>
        </div>
      `;
      container.innerHTML = headerHtml;
      return;
    }

    // Case 2: Weekend Saturday Super Revision
    if (currentDay.isReviewDay) {
      const weekKeywords = [];
      currentWeek.days.filter(d => !d.isWeekend && d.problemKeywords).forEach(d => {
        weekKeywords.push(...d.problemKeywords);
      });
      const weekProblems = RoadmapEngine.findProblems(allProblems, weekKeywords, currentDay.topic || currentWeek.topic, 10, userStates);

      headerHtml += `
        <div class="roadmap-weekend-banner flashcards" style="margin-top:20px;">
          <div class="weekend-banner-left">
            <div class="weekend-icon-wrap flashcard">
              <i class="fa-solid fa-bolt"></i>
            </div>
            <div>
              <div class="weekend-pill flashcard"><i class="fa-solid fa-brain"></i> Active Recall Speed Drill</div>
              <h3 style="font-size:20px; font-weight:800; color:#f8fafc; margin-top:4px;">Weekend Flashcard Recall Drill: ${currentDay.topic || 'General DSA'}</h3>
              <p style="font-size:13px; color:var(--text-muted); margin-top:6px; max-width:650px; line-height:1.5;">
                Reinforce algorithmic intuition, time/space tradeoffs, and common edge cases for all techniques covered throughout this week. Flip through flashcards and self-rate before tomorrow's assessment.
              </p>
            </div>
          </div>
          <div class="weekend-banner-actions">
            <button class="btn btn-primary" id="btn-launch-weekend-flashcards" data-topic="${currentDay.topic || currentWeek.topic}" style="background:linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); font-weight:800; padding:12px 24px; font-size:14px; box-shadow:0 6px 20px rgba(6,182,212,0.3);">
              <i class="fa-solid fa-bolt"></i> Launch Flashcard Speed Drill
            </button>
          </div>
        </div>

        <div class="section-title-wrap" style="margin-top:24px;">
          <div>
            <h3><i class="fa-solid fa-list-check" style="color:var(--primary);"></i> Covered Practice Problems & Mastery Status (${weekProblems.length})</h3>
            <span style="font-size:12px; color:var(--text-dim);">Review your mastery status across recent practiced problems</span>
          </div>
        </div>

        <div class="table-container">
          <table class="problem-table">
            <thead>
              <tr>
                <th style="width: 50px;">Done</th>
                <th>Problem Title</th>
                <th>Topic & Pattern</th>
                <th>Difficulty</th>
                <th>SRS Status & Next Due</th>
                <th style="width: 130px;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${weekProblems.map(p => {
                const state = userStates[p.id];
                const dueInfo = SRSEngine.getDueStatus(state);
                const isSolved = state && state.lastReviewed;
                return `
                  <tr class="${dueInfo.code === 'due' ? 'due-row' : dueInfo.code === 'mastered' ? 'mastered-row' : ''}">
                    <td>
                      <input type="checkbox" class="prob-checkbox" data-id="${p.id}" ${isSolved ? 'checked' : ''} style="cursor:pointer; width:16px; height:16px; accent-color:var(--primary);">
                    </td>
                    <td>
                      <div class="problem-title-cell">
                        <a href="${p.url || '#'}" target="_blank" class="problem-title">${p.title} <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:10px; color:var(--text-dim);"></i></a>
                        ${p.companies && p.companies.length ? `
                          <div class="company-chip-wrap" style="margin-top:4px;">
                            ${p.companies.slice(0, 2).map(c => `<span class="company-badge ${c.toLowerCase().replace(/[^a-z]/g, '')}">🏢 ${c}</span>`).join('')}
                          </div>
                        ` : ''}
                      </div>
                    </td>
                    <td><strong>${p.topic}</strong><br><span style="font-size:11px; color:var(--text-dim);">${p.pattern || ''}</span></td>
                    <td><span class="badge badge-${p.difficulty.toLowerCase()}">${p.difficulty}</span></td>
                    <td><span class="badge ${dueInfo.badgeClass}">${dueInfo.label}</span></td>
                    <td>
                      <button class="btn btn-primary btn-sm btn-action-review" data-id="${p.id}">
                        <i class="fa-solid fa-rotate"></i> Revise
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
      container.innerHTML = headerHtml;
      return;
    }

    // Case 3: Normal Study Day (Days 1 to 5) - Unified Combined Daily Problem Queue (Capped at 2–4 total)
    const unifiedProblems = RoadmapEngine.getUnifiedDailyProblems(
      activeTrack,
      currentWeek.weekNumber,
      currentDay.dayNumber,
      currentDay,
      allProblems,
      userStates
    );
    const unifiedWorkload = RoadmapEngine.calculateWorkload(unifiedProblems);

    const revisionCount = unifiedProblems.filter(p => p.scheduleRole === 'revision').length;
    const rolloverCount = unifiedProblems.filter(p => p.scheduleRole === 'rollover').length;
    const targetCount = unifiedProblems.filter(p => p.scheduleRole === 'target').length;

    headerHtml += `
      <div class="section-title-wrap" style="margin-top:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%; flex-wrap:wrap; gap:10px;">
          <div>
            <h3><i class="fa-solid fa-list-check" style="color:var(--primary);"></i> Today's Daily Practice & Revisions (${unifiedProblems.length} Assigned)</h3>
            <div style="display:flex; align-items:center; gap:8px; margin-top:4px; flex-wrap:wrap;">
              ${revisionCount > 0 ? `<span class="schedule-role-pill badge-revision"><i class="fa-solid fa-rotate"></i> ${revisionCount} Due Revision${revisionCount > 1 ? 's' : ''}</span>` : ''}
              ${rolloverCount > 0 ? `<span class="schedule-role-pill badge-rollover"><i class="fa-solid fa-clock-rotate-left"></i> ${rolloverCount} Carried Over</span>` : ''}
              ${targetCount > 0 ? `<span class="schedule-role-pill badge-target"><i class="fa-solid fa-crosshairs"></i> ${targetCount} New Target${targetCount > 1 ? 's' : ''}</span>` : ''}
              <span style="font-size:12px; color:var(--text-dim); margin-left:4px;">
                ${customDayTopic ? (Array.isArray(customDayTopic) ? `Mixed: ${customDayTopic.join(', ')}` : `Focus: ${customDayTopic}`) : currentDay.focus}
              </span>
            </div>
          </div>
          <span class="workload-badge ${unifiedWorkload.typeClass}"><i class="fa-solid fa-clock"></i> Total Workload: ${unifiedWorkload.label}</span>
        </div>
      </div>

      <div class="table-container">
        <table class="problem-table">
          <thead>
            <tr>
              <th style="width: 50px;">Done</th>
              <th>Problem Title</th>
              <th>Type / Origin</th>
              <th>Topic & Pattern</th>
              <th>Difficulty</th>
              <th>Confidence / SRS</th>
              <th style="width: 150px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${unifiedProblems.length === 0 ? `
              <tr><td colspan="7" style="text-align:center; padding:24px; color:var(--text-dim);">No problems scheduled for today. Click "Switch Topic / Mix" above to add problems.</td></tr>
            ` : unifiedProblems.map(p => {
              const state = userStates[p.id];
              const dueInfo = SRSEngine.getDueStatus(state);
              const isSolved = state && state.lastReviewed;
              const conf = SRSEngine.getConfidence(state);
              const isRollover = p.scheduleRole === 'rollover';

              return `
                <tr class="${dueInfo.code === 'due' ? 'due-row' : dueInfo.code === 'mastered' ? 'mastered-row' : ''}">
                  <td>
                    <input type="checkbox" class="prob-checkbox" data-id="${p.id}" ${isSolved ? 'checked' : ''} style="cursor:pointer; width:16px; height:16px; accent-color:var(--primary);">
                  </td>
                  <td>
                    <div class="problem-title-cell">
                      <a href="${p.url || '#'}" target="_blank" class="problem-title">${p.title} <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:10px; color:var(--text-dim);"></i></a>
                      ${p.companies && p.companies.length ? `
                        <div class="company-chip-wrap" style="margin-top:4px;">
                          ${p.companies.slice(0, 2).map(c => `<span class="company-badge ${c.toLowerCase().replace(/[^a-z]/g, '')}">🏢 ${c}</span>`).join('')}
                        </div>
                      ` : ''}
                    </div>
                  </td>
                  <td>
                    <span class="schedule-role-pill ${p.badgeClass}">
                      <i class="fa-solid ${p.roleIcon || 'fa-crosshairs'}"></i> ${p.roleLabel}
                    </span>
                  </td>
                  <td>
                    <span style="font-size:12px; font-weight:600; color:#e2e8f0;">${p.pattern || 'Core Pattern'}</span><br>
                    <span style="font-size:11px; color:var(--text-dim);">${p._sourceTopic || p.topic}</span>
                  </td>
                  <td><span class="badge badge-${p.difficulty.toLowerCase()}">${p.difficulty}</span></td>
                  <td>
                    <div style="display:flex; flex-direction:column; gap:3px;">
                      <span class="badge ${dueInfo.badgeClass}" style="width:fit-content;">${dueInfo.label}</span>
                      ${conf ? `<span class="conf-badge conf-${conf}" style="font-size:10px; width:fit-content;">⭐ ${conf}/5</span>` : ''}
                    </div>
                  </td>
                  <td>
                    <div style="display:flex; gap:6px;">
                      <button class="btn btn-primary btn-sm btn-action-review" data-id="${p.id}" title="Solve & Log Rating">
                        <i class="fa-solid fa-rotate"></i> Rate
                      </button>
                      <button class="btn btn-secondary btn-sm btn-action-detail" data-id="${p.id}" title="View Stepping-Stone Progression">
                        <i class="fa-solid fa-file-lines"></i>
                      </button>
                      ${isRollover ? `
                        <button class="btn btn-secondary btn-sm btn-defer-rollover" data-id="${p.id}" title="Defer Rollover" style="font-size:11px; padding:4px 6px; color:var(--text-dim);">
                          <i class="fa-solid fa-clock"></i>
                        </button>
                      ` : ''}
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    container.innerHTML = headerHtml;
  }

  // --- ESCAPE HTML HELPER ---
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- VIEW 8: PATTERNS HANDBOOK CONTROLLER ---
  let activePatternCategory = 'all';

  function renderPatternsHandbook() {
    const container = document.getElementById('patterns-cards-container');
    if (!container || !window.DSA_PATTERNS) return;

    const searchVal = document.getElementById('pattern-search-input')?.value.toLowerCase().trim() || '';

    const filtered = DSA_PATTERNS.filter(p => {
      if (activePatternCategory !== 'all' && p.category !== activePatternCategory) {
        return false;
      }
      if (searchVal) {
        const titleMatch = p.title.toLowerCase().includes(searchVal);
        const catMatch = p.category.toLowerCase().includes(searchVal);
        const summaryMatch = (p.summary || '').toLowerCase().includes(searchVal);
        const triggersMatch = (p.whenToUse || []).some(t => t.toLowerCase().includes(searchVal));
        const probsMatch = (p.canonicalProblems || []).some(prob => prob.toLowerCase().includes(searchVal));
        if (!titleMatch && !catMatch && !summaryMatch && !triggersMatch && !probsMatch) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align:center; padding:40px; color:var(--text-dim); background:var(--bg-card); border-radius:var(--radius-lg); border:1px solid var(--border-color);">
          <i class="fa-solid fa-magnifying-glass" style="font-size:32px; color:var(--text-muted); margin-bottom:12px;"></i>
          <h3 style="font-size:16px; color:#fff; margin-bottom:6px;">No Patterns Found</h3>
          <p style="font-size:13px; color:var(--text-muted);">Try a different search keyword or category tab above.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(p => {
      const iconColor = p.color || 'var(--primary)';
      return `
        <div class="pattern-card" id="pattern-${p.id}">
          <div class="pattern-card-header">
            <div class="pattern-title-wrap">
              <div class="pattern-icon-box" style="background:${iconColor}20; color:${iconColor}; border:1px solid ${iconColor}40;">
                <i class="fa-solid ${p.icon || 'fa-code-branch'}"></i>
              </div>
              <div>
                <h3 class="pattern-name">${p.title}</h3>
                <span class="pattern-category-tag">${p.category}</span>
              </div>
            </div>
            <div class="pattern-complexities">
              <span class="pattern-complexity-pill" title="Time Complexity"><i class="fa-solid fa-clock" style="color:${iconColor}; margin-right:4px;"></i>${p.timeComplexity}</span>
              <span class="pattern-complexity-pill" title="Space Complexity"><i class="fa-solid fa-memory" style="color:#94a3b8; margin-right:4px;"></i>${p.spaceComplexity}</span>
            </div>
          </div>

          <p style="font-size:13px; color:var(--text-muted); line-height:1.5; margin:0;">
            ${p.summary}
          </p>

          <div>
            <div class="pattern-section-label">
              <i class="fa-solid fa-bullseye" style="color:${iconColor};"></i> When to Use & Decision Triggers
            </div>
            <ul class="pattern-triggers-list">
              ${p.whenToUse.map(t => `<li>${t}</li>`).join('')}
            </ul>
          </div>

          <div class="pattern-code-box">
            <div class="pattern-code-header">
              <span><i class="fa-solid fa-code" style="color:var(--accent-cyan); margin-right:6px;"></i> Boilerplate Template</span>
              <button class="pattern-copy-btn" data-pattern-id="${p.id}" title="Copy code snippet to clipboard">
                <i class="fa-solid fa-copy"></i> Copy
              </button>
            </div>
            <pre class="pattern-code-content"><code>${escapeHtml(p.templateCode)}</code></pre>
          </div>

          ${p.edgeCases && p.edgeCases.length ? `
            <div class="pattern-edge-cases">
              <div style="font-size:11.5px; font-weight:700; color:#fbbf24; display:flex; align-items:center; gap:6px; margin-bottom:4px;">
                <i class="fa-solid fa-triangle-exclamation"></i> Key Invariants & Edge Cases
              </div>
              <p>${p.edgeCases.join(' • ')}</p>
            </div>
          ` : ''}

          <div>
            <div class="pattern-section-label" style="font-size:11px;">
              <i class="fa-solid fa-star" style="color:#eab308;"></i> Canonical Practice Problems
            </div>
            <div class="pattern-canonical-chips">
              ${p.canonicalProblems.map(probTitle => `
                <button class="pattern-problem-chip btn-jump-problem-search" data-query="${probTitle}">
                  <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:9px;"></i> ${probTitle}
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function startWeekendExam(topic) {
    let topicProblems = allProblems.filter(p => p.topic.toLowerCase().includes((topic || '').toLowerCase()));
    if (topicProblems.length < 3) {
      topicProblems = allProblems;
    }

    const easy = topicProblems.filter(p => p.difficulty === 'Easy');
    const medium = topicProblems.filter(p => p.difficulty === 'Medium');
    const hard = topicProblems.filter(p => p.difficulty === 'Hard');

    const selected = [];
    if (easy.length > 0) selected.push(easy[Math.floor(Math.random() * easy.length)]);
    if (medium.length > 0) selected.push(medium[Math.floor(Math.random() * medium.length)]);
    if (hard.length > 0) {
      selected.push(hard[Math.floor(Math.random() * hard.length)]);
    } else if (medium.length > 1) {
      const medRemainder = medium.filter(p => !selected.includes(p));
      if (medRemainder.length > 0) selected.push(medRemainder[Math.floor(Math.random() * medRemainder.length)]);
    }

    while (selected.length < 3 && topicProblems.length > selected.length) {
      const remaining = topicProblems.filter(p => !selected.includes(p));
      selected.push(remaining[Math.floor(Math.random() * remaining.length)]);
    }

    const testSession = {
      id: 'weekend-exam-' + Date.now(),
      date: new Date().toISOString(),
      durationMinutes: 30,
      topics: [topic || 'DSA Foundations'],
      problems: selected.length > 0 ? selected : allProblems.slice(0, 3),
      isWeekendDiagnostic: true
    };

    activeTestSession = testSession;
    activeTestQuestionIndex = 0;
    testAnswers = {};
    testTimeRemainingSeconds = 30 * 60;
    saveActiveExamState();

    const listEl = document.getElementById('test-question-list');
    if (listEl) {
      listEl.innerHTML = '';
      testSession.problems.forEach((p, idx) => {
        const qDiv = document.createElement('div');
        qDiv.className = `test-q-item ${idx === 0 ? 'active' : ''}`;
        qDiv.dataset.idx = idx;
        qDiv.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong style="font-size:13px;">Q${idx + 1}: ${p.title}</strong>
            <span class="badge badge-${p.difficulty.toLowerCase()}">${p.difficulty}</span>
          </div>
          <div style="font-size:11px; color:var(--text-dim);">${p.topic}</div>
        `;
        qDiv.addEventListener('click', () => switchTestQuestion(idx));
        listEl.appendChild(qDiv);
      });
    }

    renderActiveTestQuestion();

    if (testTimerInterval) clearInterval(testTimerInterval);
    updateTimerDisplay();
    testTimerInterval = setInterval(() => {
      testTimeRemainingSeconds--;
      updateTimerDisplay();
      if (testTimeRemainingSeconds % 5 === 0) {
        saveActiveExamState();
      }
      if (testTimeRemainingSeconds <= 0) {
        clearInterval(testTimerInterval);
        clearActiveExamState();
        alert('Time is up! Submitting assessment for evaluation.');
        finishMonthlyExam();
      }
    }, 1000);

    (document.getElementById('monthly-test-cockpit') || document.getElementById('monthly-test-overlay'))?.classList.add('open');
  }

  // --- CONSOLIDATED 5-DESTINATION CANONICAL ROUTER ---
  const VIEW_MAP = {
    // 5 Primary Canonical Destinations
    'dashboard': { destination: 'dashboard' },
    'practice': { destination: 'practice', defaultSubtab: 'catalog' },
    'revision': { destination: 'revision', defaultSubtab: 'queue' },
    'progress': { destination: 'progress', defaultSubtab: 'readiness' },
    'settings': { destination: 'settings' },

    // Legacy Aliases & Deep-Link Targets
    'problems': { destination: 'practice', subtab: 'catalog' },
    'catalog': { destination: 'practice', subtab: 'catalog' },
    'patterns': { destination: 'practice', subtab: 'patterns' },
    'flashcards': { destination: 'practice', subtab: 'flashcards' },
    'queue': { destination: 'revision', subtab: 'queue' },
    'monthly-assessment': { destination: 'revision', subtab: 'monthly' },
    'monthly-test': { destination: 'revision', subtab: 'monthly' },
    'monthly': { destination: 'revision', subtab: 'monthly' },
    'analytics': { destination: 'progress', subtab: 'readiness' },
    'readiness': { destination: 'progress', subtab: 'readiness' },
    'graph': { destination: 'progress', subtab: 'graph' },
    'mock': { destination: 'progress', subtab: 'mock' },
    'roadmap': { destination: 'progress', subtab: 'roadmap' },
    'leaderboard': { destination: 'progress', subtab: 'leaderboard' },
    'team': { destination: 'progress', subtab: 'leaderboard' }
  };

  function switchView(requestedView, explicitSubtab) {
    if (!requestedView) return;
    const cleanKey = String(requestedView).toLowerCase().trim();
    const mapping = VIEW_MAP[cleanKey] || { destination: cleanKey };
    const destination = mapping.destination;
    const subtab = explicitSubtab || mapping.subtab || mapping.defaultSubtab;

    // Update Primary Navigation active states and ARIA
    document.querySelectorAll('.nav-item').forEach(n => {
      const viewAttr = n.getAttribute('data-view');
      const isMatch = (viewAttr === destination && cleanKey !== 'roadmap');
      n.classList.toggle('active', isMatch);
      n.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });

    const roadmapBtn = document.getElementById('nav-item-roadmap');
    if (roadmapBtn) {
      const isRoadmapActive = (cleanKey === 'roadmap' || (destination === 'progress' && subtab === 'roadmap'));
      roadmapBtn.classList.toggle('active', isRoadmapActive);
      roadmapBtn.style.background = isRoadmapActive ? 'rgba(139, 124, 255, 0.28)' : 'rgba(139, 124, 255, 0.12)';
      roadmapBtn.style.borderColor = isRoadmapActive ? 'var(--primary)' : 'rgba(139, 124, 255, 0.35)';
      roadmapBtn.style.boxShadow = isRoadmapActive ? '0 0 12px rgba(139, 124, 255, 0.25)' : 'none';
    }

    // Update Primary View Sections
    document.querySelectorAll('.view-section').forEach(v => {
      v.classList.toggle('active', v.id === `view-${destination}`);
    });

    // Activate corresponding subview if applicable
    if (subtab) {
      switchSubView(destination, subtab);
    }

    // Refresh views/charts if needed
    if (destination === 'dashboard' || destination === 'progress') {
      if (subtab === 'leaderboard') renderLeaderboardView();
      else renderAll();
    } else if (destination === 'revision') {
      renderRevisionQueue();
    } else if (destination === 'practice') {
      if (subtab === 'catalog' || !subtab) renderProblemsTable();
      else if (subtab === 'patterns') renderPatternsHandbook();
      else if (subtab === 'flashcards') renderFlashcards();
    } else if (destination === 'settings') {
      if (typeof syncSettingsFormValues === 'function') {
        syncSettingsFormValues();
      }
      if (typeof renderAdaptiveAuditHub === 'function') {
        renderAdaptiveAuditHub();
      }
    }

    // Update document title for accessibility & context
    const titles = {
      dashboard: 'Dashboard | AlgoRecall 2.0',
      roadmap: '120-Day DSA Roadmap & Study Planner | AlgoRecall 2.0',
      practice: 'Practice & Patterns | AlgoRecall 2.0',
      revision: 'Spaced Revision & Retention | AlgoRecall 2.0',
      progress: 'Readiness & Analytics | AlgoRecall 2.0',
      settings: 'Settings & Data Hub | AlgoRecall 2.0'
    };
    if (subtab === 'roadmap' || cleanKey === 'roadmap') {
      document.title = titles.roadmap;
    } else if (titles[destination] && typeof document !== 'undefined') {
      document.title = titles[destination];
    }
  }

  function switchSubView(parentView, targetSubtab) {
    if (!parentView || !targetSubtab) return;

    if (parentView === 'practice' && targetSubtab === 'roadmap') {
      switchView('roadmap');
      return;
    }

    // Update Subtab buttons
    document.querySelectorAll(`.view-subtab-btn[data-parent-view="${parentView}"]`).forEach(btn => {
      const isMatch = btn.getAttribute('data-subtab') === targetSubtab;
      btn.classList.toggle('active', isMatch);
      btn.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });

    // Update Subview Sections
    document.querySelectorAll(`.subview-section[data-parent-view="${parentView}"]`).forEach(sub => {
      const isMatch = sub.getAttribute('data-subview') === targetSubtab;
      sub.classList.toggle('active', isMatch);
    });

    // Subview specific rendering triggers
    if (parentView === 'practice') {
      if (targetSubtab === 'catalog') renderProblemsTable();
      else if (targetSubtab === 'patterns') renderPatternsHandbook();
      else if (targetSubtab === 'flashcards') renderFlashcards();
    } else if (parentView === 'revision') {
      if (targetSubtab === 'queue') renderRevisionQueue();
      else if (targetSubtab === 'monthly') renderMonthlyTestView();
    } else if (parentView === 'progress') {
      if (targetSubtab === 'readiness') renderAnalytics();
      else if (targetSubtab === 'graph') renderPrerequisiteGraph();
      else if (targetSubtab === 'mock') renderMockInterviewView();
      else if (targetSubtab === 'roadmap') renderRoadmapView();
      else if (targetSubtab === 'leaderboard') renderLeaderboardView();
    }
  }

  // --- RECOMMENDATION 1: STUDY GROUP LEADERBOARD CONTROLLER ---
  async function renderLeaderboardView() {
    const container = document.getElementById('team-leaderboard-container');
    if (!container) return;

    container.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:center; padding:30px; color:var(--text-dim); gap:10px;">
        <i class="fa-solid fa-spinner fa-spin"></i> Loading Study Group Standings...
      </div>
    `;

    try {
      const res = await fetch('/api/team/leaderboard', {
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data || !data.success || !Array.isArray(data.leaderboard)) {
        throw new Error('Invalid leaderboard payload');
      }

      const members = data.leaderboard;
      const totalSolved = members.reduce((sum, m) => sum + (m.masteredCount || 0), 0);
      const totalXP = members.reduce((sum, m) => sum + (m.xp || 0), 0);
      const topStreak = members.reduce((max, m) => Math.max(max, m.streak || 0), 0);
      const memberCount = data.memberCount || members.length;
      const maxUsers = data.maxUsers || 5;

      const totalSolvedEl = document.getElementById('team-stat-total-solved');
      const totalXpEl = document.getElementById('team-stat-total-xp');
      const topStreakEl = document.getElementById('team-stat-top-streak');
      const membersEl = document.getElementById('team-stat-members');

      if (totalSolvedEl) totalSolvedEl.textContent = totalSolved;
      if (totalXpEl) totalXpEl.textContent = `${totalXP.toLocaleString()} XP`;
      if (topStreakEl) topStreakEl.textContent = `${topStreak} ${topStreak === 1 ? 'Day' : 'Days'}`;
      if (membersEl) membersEl.textContent = `${memberCount} / ${maxUsers}`;

      if (members.length === 0) {
        container.innerHTML = `
          <div style="text-align:center; padding:30px; color:var(--text-dim);">
            <i class="fa-solid fa-users" style="font-size:28px; margin-bottom:10px; display:block;"></i>
            No members registered yet in this study group.
          </div>
        `;
        return;
      }

      const activeUser = (window.AuthEngine && typeof window.AuthEngine.getUser === 'function')
        ? window.AuthEngine.getUser()
        : null;
      const activeUserId = activeUser ? activeUser.id : null;

      container.innerHTML = members.map((m, idx) => {
        const rank = idx + 1;
        const isSelf = activeUserId && m.id === activeUserId;
        let rankBadge = `<span style="font-size:14px; font-weight:700; color:var(--text-dim); width:24px; text-align:center;">#${rank}</span>`;
        if (rank === 1) {
          rankBadge = `<span style="font-size:18px; width:24px; text-align:center;" title="1st Place">🥇</span>`;
        } else if (rank === 2) {
          rankBadge = `<span style="font-size:18px; width:24px; text-align:center;" title="2nd Place">🥈</span>`;
        } else if (rank === 3) {
          rankBadge = `<span style="font-size:18px; width:24px; text-align:center;" title="3rd Place">🥉</span>`;
        }

        const initial = (m.displayName || m.username || 'U').charAt(0).toUpperCase();

        return `
          <div class="leaderboard-card ${isSelf ? 'leaderboard-card-self' : ''}" style="
            display:flex;
            align-items:center;
            justify-content:space-between;
            flex-wrap:wrap;
            gap:12px;
            padding:12px 16px;
            background:${isSelf ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.03)'};
            border:1px solid ${isSelf ? 'var(--primary)' : 'var(--border-color, #28334D)'};
            border-radius:var(--radius-md, 8px);
            transition: transform 0.15s ease, border-color 0.15s ease;
          ">
            <div style="display:flex; align-items:center; gap:12px;">
              ${rankBadge}
              <div style="
                width:36px;
                height:36px;
                border-radius:50%;
                background:${isSelf ? 'linear-gradient(135deg, #6366f1, #a855f7)' : 'linear-gradient(135deg, #334155, #475569)'};
                color:#fff;
                display:flex;
                align-items:center;
                justify-content:center;
                font-weight:700;
                font-size:14px;
                box-shadow:0 2px 6px rgba(0,0,0,0.2);
              ">${initial}</div>
              <div>
                <div style="display:flex; align-items:center; gap:6px;">
                  <span style="font-weight:700; font-size:14px; color:var(--text-main);">${escapeHtml(m.displayName || m.username)}</span>
                  ${isSelf ? '<span class="badge badge-primary" style="font-size:10px; padding:2px 6px;">You</span>' : ''}
                </div>
                <div style="font-size:11.5px; color:var(--text-dim); display:flex; align-items:center; gap:8px;">
                  <span>Lvl ${m.level || 1} • ${escapeHtml(m.tierTitle || 'Novice')}</span>
                  <span>•</span>
                  <span>@${escapeHtml(m.username)}</span>
                </div>
              </div>
            </div>

            <div style="display:flex; align-items:center; gap:16px;">
              <div style="text-align:right;">
                <div style="font-size:13.5px; font-weight:700; color:#34d399; display:flex; align-items:center; gap:4px; justify-content:flex-end;">
                  <i class="fa-solid fa-circle-check"></i> ${m.masteredCount || 0}
                </div>
                <div style="font-size:10.5px; color:var(--text-dim);">${m.solvedCount || 0} attempted</div>
              </div>

              <div style="text-align:right;">
                <div style="font-size:13.5px; font-weight:700; color:#ef4444; display:flex; align-items:center; gap:4px; justify-content:flex-end;">
                  <i class="fa-solid fa-fire"></i> ${m.streak || 0}
                </div>
                <div style="font-size:10.5px; color:var(--text-dim);">day streak</div>
              </div>

              <div style="
                background:rgba(245, 158, 11, 0.12);
                border:1px solid rgba(245, 158, 11, 0.3);
                padding:6px 12px;
                border-radius:20px;
                font-size:13px;
                font-weight:700;
                color:#f59e0b;
                display:flex;
                align-items:center;
                gap:5px;
                min-width:85px;
                justify-content:center;
              ">
                <i class="fa-solid fa-bolt"></i> ${(m.xp || 0).toLocaleString()} XP
              </div>
            </div>
          </div>
        `;
      }).join('');
    } catch (err) {
      console.error('[Leaderboard] Failed to fetch leaderboard:', err);
      container.innerHTML = `
        <div style="text-align:center; padding:24px; color:var(--text-dim);">
          <i class="fa-solid fa-triangle-exclamation" style="color:#ef4444; font-size:20px; margin-bottom:8px; display:block;"></i>
          Unable to fetch team standings. Ensure you are connected to the local embedded server.
          <div style="margin-top:10px;">
            <button type="button" class="btn btn-secondary btn-xs" onclick="window.renderLeaderboardView && window.renderLeaderboardView()">
              <i class="fa-solid fa-rotate-right"></i> Try Again
            </button>
          </div>
        </div>
      `;
    }
  }

  // Expose globally for inline buttons & test suite
  if (typeof window !== 'undefined') {
    window.switchView = switchView;
    window.switchSubView = switchSubView;
    window.VIEW_MAP = VIEW_MAP;
    window.renderLeaderboardView = renderLeaderboardView;
  }

  // --- GAMIFICATION HEADER UI ---
  function updateGamificationHeader() {
    if (!window.GamificationEngine) return;
    const progress = GamificationEngine.getProgress();
    const tier = GamificationEngine.getLevelProgress(progress.xp || 0);

    const levelNameEl = document.getElementById('header-level-name');
    const xpFillEl = document.getElementById('header-xp-fill');
    const xpTextEl = document.getElementById('header-xp-text');
    const pillEl = document.getElementById('header-gamification-pill');

    if (levelNameEl) levelNameEl.textContent = `Lvl ${tier.currentLevel}: ${tier.title}`;
    if (xpFillEl) xpFillEl.style.width = `${tier.percent}%`;
    if (xpTextEl) xpTextEl.textContent = `${progress.xp || 0} XP`;
    if (pillEl) pillEl.title = `Mastery Tier: ${tier.title} (${tier.xpCurrent} XP, ${tier.xpToNext} XP to ${tier.nextTitle})`;
  }

  // --- SETTINGS & DATA MANAGEMENT (MODAL + VIEW) ---
  function syncSettingsFormValues() {
    if (!window.StorageEngine) return;
    const s = StorageEngine.getSettings();

    // Modal elements
    const lightOptBtn = document.getElementById('btn-theme-light-opt');
    const darkOptBtn = document.getElementById('btn-theme-dark-opt');
    const aiProviderSelect = document.getElementById('settings-ai-provider');
    const apiKeyWrap = document.getElementById('settings-api-key-wrap');
    const apiKeyInput = document.getElementById('settings-ai-key');

    // Dedicated View elements
    const lightOptViewBtn = document.getElementById('btn-theme-light-opt-view');
    const darkOptViewBtn = document.getElementById('btn-theme-dark-opt-view');
    const aiProviderViewSelect = document.getElementById('settings-ai-provider-view');
    const apiKeyWrapView = document.getElementById('settings-api-key-wrap-view');
    const apiKeyInputView = document.getElementById('settings-ai-key-view');

    // Theme active states
    if (s.theme === 'light') {
      lightOptBtn?.classList.add('active');
      darkOptBtn?.classList.remove('active');
      lightOptViewBtn?.classList.add('active');
      darkOptViewBtn?.classList.remove('active');
    } else {
      darkOptBtn?.classList.add('active');
      lightOptBtn?.classList.remove('active');
      darkOptViewBtn?.classList.add('active');
      lightOptViewBtn?.classList.remove('active');
    }

    // AI Provider values
    const provider = s.aiProvider || 'offline';
    if (aiProviderSelect) aiProviderSelect.value = provider;
    if (aiProviderViewSelect) aiProviderViewSelect.value = provider;

    const showKey = (provider === 'openai' || provider === 'gemini');
    if (apiKeyWrap) apiKeyWrap.style.display = showKey ? 'block' : 'none';
    if (apiKeyWrapView) apiKeyWrapView.style.display = showKey ? 'block' : 'none';

    if (apiKeyInput) apiKeyInput.value = s.aiApiKey || '';
    if (apiKeyInputView) apiKeyInputView.value = s.aiApiKey || '';
  }

  function applyAppTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const themeToggleIcon = document.getElementById('theme-toggle-icon');
    if (themeToggleIcon) {
      themeToggleIcon.className = theme === 'light' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    }
    if (window.StorageEngine) {
      StorageEngine.saveSettings({ theme: theme });
    }
    syncSettingsFormValues();
  }

  function setupSettingsModalListeners() {
    const modal = document.getElementById('settings-modal');
    const openBtn = document.getElementById('btn-open-settings-modal');
    const closeBtn = document.getElementById('btn-close-settings-modal');
    const themeToggleHeaderBtn = document.getElementById('btn-theme-toggle');

    const darkOptBtn = document.getElementById('btn-theme-dark-opt');
    const lightOptBtn = document.getElementById('btn-theme-light-opt');
    const aiProviderSelect = document.getElementById('settings-ai-provider');
    const apiKeyWrap = document.getElementById('settings-api-key-wrap');
    const apiKeyInput = document.getElementById('settings-ai-key');
    const saveBtn = document.getElementById('btn-save-settings');

    const btnExportBackup = document.getElementById('btn-settings-export-backup');
    const btnRestoreTrigger = document.getElementById('btn-settings-restore-trigger');
    const btnCopySync = document.getElementById('btn-settings-copy-sync');

    // Header Theme Toggle button
    themeToggleHeaderBtn?.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
      applyAppTheme(nextTheme);
    });

    // Modal Theme Option Buttons
    darkOptBtn?.addEventListener('click', () => applyAppTheme('dark'));
    lightOptBtn?.addEventListener('click', () => applyAppTheme('light'));

    // Settings View Theme Option Buttons
    document.getElementById('btn-theme-dark-opt-view')?.addEventListener('click', () => applyAppTheme('dark'));
    document.getElementById('btn-theme-light-opt-view')?.addEventListener('click', () => applyAppTheme('light'));

    // AI Provider change toggles API key input in modal
    aiProviderSelect?.addEventListener('change', (e) => {
      const val = e.target.value;
      if (apiKeyWrap) {
        apiKeyWrap.style.display = (val === 'openai' || val === 'gemini') ? 'block' : 'none';
      }
    });

    // AI Provider change in view
    const aiProviderViewSelect = document.getElementById('settings-ai-provider-view');
    const apiKeyWrapView = document.getElementById('settings-api-key-wrap-view');
    aiProviderViewSelect?.addEventListener('change', (e) => {
      const val = e.target.value;
      if (apiKeyWrapView) {
        apiKeyWrapView.style.display = (val === 'openai' || val === 'gemini') ? 'block' : 'none';
      }
    });

    openBtn?.addEventListener('click', () => {
      syncSettingsFormValues();
      modal?.classList.add('open');
    });

    closeBtn?.addEventListener('click', () => {
      modal?.classList.remove('open');
    });

    saveBtn?.addEventListener('click', () => {
      if (!window.StorageEngine) return;
      const provider = aiProviderSelect?.value || 'offline';
      const key = apiKeyInput?.value.trim() || '';
      StorageEngine.saveSettings({
        aiProvider: provider,
        aiApiKey: key
      });
      syncSettingsFormValues();
      modal?.classList.remove('open');
      alert('✅ Settings successfully saved!');
    });

    // Settings View Save AI Button
    document.getElementById('btn-save-ai-settings-view')?.addEventListener('click', () => {
      if (!window.StorageEngine) return;
      const provider = aiProviderViewSelect?.value || 'offline';
      const key = document.getElementById('settings-ai-key-view')?.value.trim() || '';
      StorageEngine.saveSettings({
        aiProvider: provider,
        aiApiKey: key
      });
      syncSettingsFormValues();
      alert('✅ AI Scaffolding settings successfully saved!');
    });

    // Export / Import / Safe Sync Buttons (Modal)
    btnExportBackup?.addEventListener('click', exportDataJSON);
    btnRestoreTrigger?.addEventListener('click', () => {
      document.getElementById('import-file-input')?.click();
    });
    btnCopySync?.addEventListener('click', async () => {
      if (!window.StorageEngine) return;
      const code = StorageEngine.generateSafeSyncHash();
      try {
        await navigator.clipboard.writeText(code);
        alert('📋 Safe Sync Hash copied to clipboard!\n\nPaste this code on any device to instantly load your progress.');
      } catch (_) {
        prompt('Copy Safe Sync Hash:', code);
      }
    });

    // Export / Import / Safe Sync Buttons (View)
    document.getElementById('btn-export-backup-view')?.addEventListener('click', exportDataJSON);
    document.getElementById('btn-restore-view')?.addEventListener('click', () => {
      document.getElementById('import-file-input')?.click();
    });
    document.getElementById('btn-copy-sync-view')?.addEventListener('click', async () => {
      if (!window.StorageEngine) return;
      const code = StorageEngine.generateSafeSyncHash();
      try {
        await navigator.clipboard.writeText(code);
        alert('📋 Safe Sync Hash copied to clipboard!\n\nPaste this code on any device to instantly load your progress.');
      } catch (_) {
        prompt('Copy Safe Sync Hash:', code);
      }
    });

    // Initial form sync
    syncSettingsFormValues();
    setupAdaptiveAuditHub();
  }

  // --- ADAPTIVE DECISION AUDIT & RELIABILITY HUB ---
  let activeAuditRec = null;

  function renderAdaptiveAuditHub() {
    if (!window.AdaptiveLearningEngine) return;
    const recTitle = document.getElementById('audit-rec-title');
    const recReason = document.getElementById('audit-rec-reason');
    const recAction = document.getElementById('audit-rec-action');
    const recCode = document.getElementById('audit-rec-code');
    const recSource = document.getElementById('audit-rec-source');
    const recMissing = document.getElementById('audit-rec-missing');
    const recBadge = document.getElementById('audit-rec-status-badge');
    const competingWrap = document.getElementById('audit-competing-diagnoses-wrap');
    const competingEl = document.getElementById('audit-competing-diagnoses');

    activeAuditRec = window.AdaptiveLearningEngine.selectNextAction(allProblems, userStates);
    if (!activeAuditRec) {
      if (recTitle) recTitle.textContent = 'No active intervention required.';
      if (recReason) recReason.textContent = 'Review queue is clear and curriculum is paced normally.';
      if (recBadge) {
        recBadge.textContent = 'Up to Date';
        recBadge.className = 'badge-rev-status status-mastered';
      }
      return;
    }

    if (recTitle) recTitle.textContent = `${activeAuditRec.problemTitle} (${activeAuditRec.difficulty} • ${activeAuditRec.topic})`;
    if (recReason) recReason.textContent = activeAuditRec.explanation || 'Adaptive recommendation calculated.';
    if (recAction) recAction.textContent = activeAuditRec.action || 'explore';
    if (recCode) recCode.textContent = activeAuditRec.reasonCode || 'CURRICULUM_PROGRESSION';
    if (recSource) {
      recSource.textContent = (activeAuditRec.evidence && activeAuditRec.evidence.source)
        ? `${activeAuditRec.evidence.source}: ${activeAuditRec.evidence.observed || 'Pattern verified'}`
        : 'SRS Engine Observation';
    }
    if (recMissing) {
      recMissing.textContent = activeAuditRec.action === 'spaced_revision'
        ? 'Delayed recall pending completion on next calendar day.'
        : activeAuditRec.action === 'prerequisite_practice'
        ? 'Prerequisite foundation proficiency < 45%.'
        : 'None; sufficient baseline evidence recorded.';
    }
    if (recBadge) {
      recBadge.textContent = 'Active';
      recBadge.className = 'badge-rev-status status-due';
    }

    // Check competing diagnoses
    if (activeAuditRec.problemId) {
      const p = allProblems.find(item => item.id === activeAuditRec.problemId);
      const st = userStates[activeAuditRec.problemId];
      if (p && st) {
        const ev = window.AdaptiveLearningEngine.observeEvidence(p, st, allProblems, userStates);
        const diag = window.AdaptiveLearningEngine.diagnose(ev, p);
        if (diag && Array.isArray(diag.competingDiagnoses) && diag.competingDiagnoses.length > 0) {
          if (competingWrap) competingWrap.style.display = 'block';
          if (competingEl) competingEl.textContent = diag.competingDiagnoses.join(', ');
        } else if (competingWrap) {
          competingWrap.style.display = 'none';
        }
      }
    }
  }

  function setupAdaptiveAuditHub() {
    const btnDismiss = document.getElementById('btn-dismiss-active-intervention');
    const btnBenchmark = document.getElementById('btn-run-diagnostic-benchmark');
    const btnSimulator = document.getElementById('btn-run-replay-simulator');
    const outputBox = document.getElementById('diagnostic-output-box');
    const outputText = document.getElementById('diagnostic-output-text');
    const recBadge = document.getElementById('audit-rec-status-badge');
    const recReason = document.getElementById('audit-rec-reason');

    btnDismiss?.addEventListener('click', () => {
      if (!activeAuditRec || !window.AdaptiveLearningEngine) return;
      const targetTitle = activeAuditRec.problemTitle || activeAuditRec.targetProblemTitle || 'this problem';
      if (confirm(`Dismiss recommendation for "${targetTitle}"?\n\nThis will safely archive the active recommendation without penalizing or inflating your readiness scores.`)) {
        window.AdaptiveLearningEngine.dismissIntervention(activeAuditRec.interventionId, userStates, 'manual_learner_dismissal');
        if (recBadge) {
          recBadge.textContent = 'Dismissed';
          recBadge.className = 'badge-rev-status';
          recBadge.style.background = 'rgba(255,255,255,0.1)';
          recBadge.style.color = 'var(--text-muted)';
        }
        if (recReason) {
          recReason.textContent = 'Recommendation dismissed by learner. Safely excluded from learning recovery calculations.';
        }
      }
    });

    btnBenchmark?.addEventListener('click', () => {
      if (!window.AdaptiveBenchmark) {
        alert('AdaptiveBenchmark module not loaded.');
        return;
      }
      if (outputBox) outputBox.style.display = 'block';
      if (outputText) outputText.textContent = 'Running deterministic policy benchmark against baselines & ablations...\n';

      try {
        const benchmark = window.AdaptiveBenchmark.runBenchmark(allProblems);
        let log = `=== ADAPTIVE POLICY BENCHMARK RESULTS ===\n`;
        log += `Timestamp: ${benchmark.timestamp}\n`;
        log += `Scenarios Evaluated: ${benchmark.totalScenarios} | Policies Compared: ${benchmark.policiesEvaluated}\n\n`;

        Object.keys(benchmark.results).forEach(k => {
          const res = benchmark.results[k];
          log += `[Policy: ${res.name}]\n`;
          log += `  - Repeat Rate: ${res.repeatRatePercent}%\n`;
          log += `  - Due Review Neglect Rate: ${res.dueNeglectRatePercent}%\n`;
          log += `  - Recommendation Determinism / Stability: ${res.stabilityPercent}%\n`;
          log += `  - Total Decisions Logged: ${res.recommendationsCount}\n\n`;
        });

        log += `NOTE: ${benchmark.disclaimer}\n`;
        if (outputText) outputText.textContent = log;
      } catch (err) {
        if (outputText) outputText.textContent = `Benchmark Error: ${err.message}`;
      }
    });

    btnSimulator?.addEventListener('click', () => {
      if (!window.TimeTravelSimulator) {
        alert('TimeTravelSimulator module not loaded.');
        return;
      }
      if (outputBox) outputBox.style.display = 'block';
      if (outputText) outputText.textContent = 'Running Time-Travel Replay Simulator across standard scenario fixtures...\n';

      try {
        const sim = new window.TimeTravelSimulator({ catalog: allProblems });
        const scenarios = [
          'new-learner',
          'inconsistent-learner',
          'strong-learner',
          'retention-decay',
          'hint-dependent',
          'recovery-learner',
          'conflicting-evidence',
          'missing-corrupted-evidence'
        ];

        let log = `=== TIME-TRAVEL REPLAY VERIFICATION REPORT ===\n`;
        scenarios.forEach(scName => {
          const res = sim.runScenario(scName);
          const hasVio = res.hasViolations ? `⚠️ ${res.violations.length} violation(s)` : '✓ Clean';
          log += `• Scenario "${scName}": ${res.totalSteps} steps executed | Virtual Date: ${res.finalVirtualDate.slice(0, 10)} | ${hasVio}\n`;
          if (res.hasViolations) {
            res.violations.forEach(v => {
              log += `    - [${v.type}]: ${v.message}\n`;
            });
          }
        });

        log += `\nVerification completed: All sandboxed trajectories executed without modifying production progress.\n`;
        if (outputText) outputText.textContent = log;
      } catch (err) {
        if (outputText) outputText.textContent = `Simulator Error: ${err.message}`;
      }
    });

    renderAdaptiveAuditHub();
  }

  // --- DETAIL MODAL SUB-TABS (AI HINTS & COMPLEXITY ANALYSIS) ---
  function setupDetailModalSubTabs() {
    const tabBtnOverview = document.getElementById('tab-btn-detail-overview');
    const tabBtnHints = document.getElementById('tab-btn-detail-hints');
    const tabBtnAnalysis = document.getElementById('tab-btn-detail-analysis');
    const tabBtnHistory = document.getElementById('tab-btn-detail-history');

    const contentOverview = document.getElementById('detail-tab-content-overview');
    const contentHints = document.getElementById('detail-tab-content-hints');
    const contentAnalysis = document.getElementById('detail-tab-content-analysis');
    const contentHistory = document.getElementById('detail-tab-content-history');

    const tabs = [
      { btn: tabBtnOverview, pane: contentOverview },
      { btn: tabBtnHints, pane: contentHints },
      { btn: tabBtnAnalysis, pane: contentAnalysis },
      { btn: tabBtnHistory, pane: contentHistory }
    ];

    tabs.forEach(t => {
      t.btn?.addEventListener('click', () => {
        tabs.forEach(item => {
          item.btn?.classList.remove('active');
          if (item.pane) item.pane.style.display = 'none';
        });
        t.btn?.classList.add('active');
        if (t.pane) t.pane.style.display = 'flex';

        // Auto-load Hint level 1 when opening Hints tab
        if (t.btn === tabBtnHints && activeDetailProblemId) {
          const activeLevelBtn = document.querySelector('#detail-ai-hint-tabs .ai-hint-tab-btn.active') || document.querySelector('#detail-ai-hint-tabs .ai-hint-tab-btn');
          const level = parseInt(activeLevelBtn?.dataset.hintLevel || '1', 10);
          loadDetailAIHint(level);
        }
      });
    });

    // Progressive Hint Level Tabs (Level 1-5)
    document.querySelectorAll('#detail-ai-hint-tabs .ai-hint-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#detail-ai-hint-tabs .ai-hint-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const level = parseInt(btn.dataset.hintLevel || '1', 10);
        loadDetailAIHint(level);
      });
    });

    async function loadDetailAIHint(level) {
      if (!activeDetailProblemId || !window.AIEngine) return;
      const p = allProblems.find(item => item.id === activeDetailProblemId);
      if (!p) return;

      const hintContent = document.getElementById('detail-ai-hint-content');
      if (hintContent) {
        hintContent.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating targeted scaffold...';
      }

      try {
        const res = await AIEngine.getProgressiveHint(p, level, {
          onHintUsed: () => {
            const state = userStates[p.id];
            if (state) {
              state.hintsUsed = true;
            }
          }
        });
        if (hintContent) {
          hintContent.textContent = res.content;
        }
      } catch (err) {
        if (hintContent) {
          hintContent.textContent = 'Failed to load hint: ' + err.message;
        }
      }
    }

    // Generate Edge Cases button
    document.getElementById('btn-detail-generate-edgecases')?.addEventListener('click', () => {
      if (!activeDetailProblemId || !window.AIEngine) return;
      const p = allProblems.find(item => item.id === activeDetailProblemId);
      if (!p) return;

      const edgeCases = AIEngine.generateEdgeCases(p);
      const hintContent = document.getElementById('detail-ai-hint-content');
      if (hintContent) {
        const header = `🛡️ **Boundary Checklist for "${p.title}"**:\n\n` +
          edgeCases.map((ec, idx) => `[ ] ${idx + 1}. ${ec}`).join('\n') + '\n\n---\n\n';
        hintContent.textContent = header + (hintContent.textContent || '');
      }
    });

    // Solution Complexity & Validation Runner
    document.getElementById('btn-run-solution-analysis')?.addEventListener('click', () => {
      if (!activeDetailProblemId || !window.SolutionAnalysisEngine) return;
      const p = allProblems.find(item => item.id === activeDetailProblemId);
      if (!p) return;

      const userTime = document.getElementById('analysis-input-time')?.value || 'O(N)';
      const userSpace = document.getElementById('analysis-input-space')?.value || 'O(1)';
      const checkedCases = [];
      document.querySelectorAll('.analysis-edge-check:checked').forEach(c => checkedCases.push(c.value));

      const result = SolutionAnalysisEngine.analyzeSubmission(p, {
        timeComplexity: userTime,
        spaceComplexity: userSpace,
        edgeCases: checkedCases
      });

      const resultBox = document.getElementById('analysis-feedback-result');
      if (resultBox) {
        resultBox.style.display = 'block';
        const isOpt = result.isOptimal;
        resultBox.style.background = isOpt ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)';
        resultBox.style.border = `1px solid ${isOpt ? '#10b981' : '#f59e0b'}`;
        resultBox.style.color = isOpt ? '#34d399' : '#fbbf24';

        resultBox.innerHTML = `
          <div style="font-weight:700; margin-bottom:4px; font-size:13px;">
            ${isOpt ? '🎯 Optimal Complexity Analysis!' : '⚠️ Suboptimal Complexity Detected'}
          </div>
          <p style="margin:0 0 6px 0; font-size:12px; color:var(--text-main);">${result.evaluation.time.message}</p>
          <p style="margin:0 0 6px 0; font-size:12px; color:var(--text-main);">${result.evaluation.space.message}</p>
          <div style="font-size:11.5px; color:var(--text-dim); margin-top:6px;">
            <strong>Follow-up interview check:</strong> ${result.followUpQuestion}
          </div>
        `;
      }
    });
  }

  // --- VIEW 9: PREREQUISITE LEARNING GRAPH ---
  function renderPrerequisiteGraph() {
    const container = document.getElementById('prereq-graph-container');
    if (!container || !window.GraphEngine) return;

    const evaluated = GraphEngine.evaluateGraph(allProblems, userStates);
    const nodes = evaluated.nodes;

    if (!nodes || nodes.length === 0) {
      container.innerHTML = '<div style="color:var(--text-dim); padding:20px;">No graph nodes defined.</div>';
      return;
    }

    container.innerHTML = nodes.map(node => {
      const statusClasses = {
        mastered: 'status-mastered',
        proficient: 'status-proficient',
        learning: 'status-learning',
        available: 'status-available',
        locked: 'status-locked'
      };
      const statusBadges = {
        mastered: '<span class="prereq-status-badge" style="background:rgba(16,185,129,0.2); color:#34d399; border:1px solid #10b981;">🏆 Mastered</span>',
        proficient: '<span class="prereq-status-badge" style="background:rgba(6,182,212,0.2); color:#38bdf8; border:1px solid #06b6d4;">🔷 Proficient</span>',
        learning: '<span class="prereq-status-badge" style="background:rgba(245,158,11,0.2); color:#fbbf24; border:1px solid #f59e0b;">⏳ Learning</span>',
        available: '<span class="prereq-status-badge" style="background:rgba(139,92,246,0.2); color:#c084fc; border:1px solid #8b5cf6;">🚀 Available</span>',
        locked: '<span class="prereq-status-badge" style="background:rgba(100,116,139,0.2); color:#94a3b8; border:1px solid #64748b;">🔒 Locked</span>'
      };

      const cardClass = statusClasses[node.status] || 'status-available';
      const badgeHtml = statusBadges[node.status] || '';

      const prereqTitles = (node.prerequisites || []).map(pId => {
        const pNode = evaluated.nodeMap[pId];
        return pNode ? pNode.title : pId;
      });

      return `
        <div class="prereq-node-card ${cardClass}" id="graph-node-${node.id}">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
            <div>
              <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-dim);">Tier ${node.level} • ${node.topic}</div>
              <h3 style="font-size:15px; font-weight:700; margin:3px 0 0 0; color:#f8fafc;">${node.title}</h3>
            </div>
            ${badgeHtml}
          </div>

          <p style="font-size:12.5px; color:var(--text-muted); line-height:1.45; margin:0;">
            ${node.summary}
          </p>

          <div>
            <div style="display:flex; justify-content:space-between; font-size:11.5px; margin-bottom:4px;">
              <span style="color:var(--text-dim);">Topic Proficiency</span>
              <strong style="color:var(--text-main);">${node.proficiencyScore}%</strong>
            </div>
            <div class="dimension-bar-track">
              <div class="dimension-bar-fill" style="width:${node.proficiencyScore}%; background:${node.proficiencyScore >= 70 ? '#10b981' : node.proficiencyScore >= 40 ? '#38bdf8' : '#f59e0b'};"></div>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--text-dim); margin-top:4px;">
              <span>${node.solvedCount} of ${node.totalProblems} Solved</span>
              <span>${node.independentRate}% Independent</span>
            </div>
          </div>

          ${prereqTitles.length > 0 ? `
            <div style="font-size:11px; color:var(--text-dim); background:rgba(255,255,255,0.02); padding:6px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.04);">
              <strong style="color:var(--text-muted);"><i class="fa-solid fa-link" style="font-size:10px;"></i> Prereqs:</strong> ${prereqTitles.join(', ')}
            </div>
          ` : ''}

          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto; padding-top:6px;">
            <span style="font-size:11px; color:var(--accent-cyan);">
              <i class="fa-solid fa-code-fork"></i> ${node.patterns ? node.patterns.join(', ') : ''}
            </span>
            <button class="btn btn-secondary btn-sm btn-prereq-practice" data-topic="${node.topic}" style="font-size:11.5px; padding:4px 10px;">
              <i class="fa-solid fa-play"></i> Practice
            </button>
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.btn-prereq-practice').forEach(btn => {
      btn.addEventListener('click', () => {
        const topic = btn.dataset.topic;
        switchView('problems');
        const topicSelect = document.getElementById('filter-topic');
        if (topicSelect) {
          topicSelect.value = topic;
        }
        renderProblemsTable();
      });
    });
  }

  // --- VIEW 10: REALISTIC MOCK INTERVIEW SIMULATOR ---
  let activeMockSession = null;
  let mockTimerInterval = null;

  function renderMockInterviewView() {
    const topicSelect = document.getElementById('mock-config-topic');
    if (topicSelect && topicSelect.children.length <= 1) {
      const topics = Array.from(new Set(allProblems.map(p => SRSEngine.canonicalizeTopic(p.topic)))).sort();
      topicSelect.innerHTML = '<option value="all">All Topics (Comprehensive Pool)</option>';
      topics.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        topicSelect.appendChild(opt);
      });
    }

    const tbody = document.getElementById('mock-history-tbody');
    if (tbody) {
      let history = [];
      try {
        if (window.LearnerRepository) {
          history = window.LearnerRepository.getMockHistory() || [];
        } else {
          const raw = localStorage.getItem('algorecall_mock_history_v2');
          if (raw) history = JSON.parse(raw);
        }
      } catch (_) {}

      if (history.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:var(--text-dim);">No mock interview rounds completed yet. Start your first session above!</td></tr>';
      } else {
        tbody.innerHTML = history.slice().reverse().map(m => `
          <tr>
            <td><strong style="color:var(--text-main); font-size:12.5px;">${new Date(m.completedAt || Date.now()).toLocaleDateString()}</strong></td>
            <td><span class="badge badge-srs-upcoming" style="font-size:11px;">${m.trackTitle}</span></td>
            <td>${m.actualMinutes || m.durationMinutes} mins</td>
            <td><strong style="font-size:14px; color:${(m.overallPercentage || 0) >= 75 ? '#10b981' : (m.overallPercentage || 0) >= 60 ? '#38bdf8' : '#f59e0b'};">${m.overallPercentage || 0}%</strong></td>
            <td><span class="badge ${(m.overallPercentage || 0) >= 75 ? 'badge-easy' : (m.overallPercentage || 0) >= 60 ? 'badge-medium' : 'badge-hard'}">${m.grade}</span></td>
            <td>${(m.questionResults || []).map(q => `<span class="company-badge" style="font-size:10px;">${q.title} (${q.score}pts)</span>`).join(' ')}</td>
          </tr>
        `).join('');
      }
    }

    const startBtn = document.getElementById('btn-start-mock-interview');
    if (startBtn && !startBtn.dataset.bound) {
      startBtn.dataset.bound = 'true';
      startBtn.addEventListener('click', () => {
        if (!window.MockEngine) return;
        const trackId = document.getElementById('mock-config-track')?.value || 'faang_standard';
        const duration = parseInt(document.getElementById('mock-config-duration')?.value || '45', 10);
        const hints = document.getElementById('mock-config-hints')?.value || 'penalty';
        const topic = document.getElementById('mock-config-topic')?.value || 'all';

        const session = MockEngine.createSession(allProblems, userStates, {
          trackId: trackId,
          durationMinutes: duration,
          hintPolicy: hints,
          topicFilter: topic
        });

        startActiveMockSession(session);
      });
    }

    document.getElementById('btn-close-mock-report')?.addEventListener('click', () => {
      document.getElementById('mock-report-modal')?.classList.remove('open');
    });
    document.getElementById('btn-mock-report-done')?.addEventListener('click', () => {
      document.getElementById('mock-report-modal')?.classList.remove('open');
      renderAll();
    });
  }

  function startActiveMockSession(session) {
    if (!session) return;
    activeMockSession = session;

    const cockpit = document.getElementById('mock-interview-cockpit');
    if (cockpit) {
      cockpit.style.display = 'block';
      cockpit.classList.add('open');
    }

    renderActiveMockQuestion();

    if (mockTimerInterval) clearInterval(mockTimerInterval);
    updateMockTimer();
    mockTimerInterval = setInterval(() => {
      updateMockTimer();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((activeMockSession.targetEndTime - now) / 1000));
      if (remaining <= 0) {
        clearInterval(mockTimerInterval);
        alert('⏰ Mock interview time is up! Submitting evaluation.');
        finishMockInterview();
      }
    }, 1000);
  }

  function updateMockTimer() {
    if (!activeMockSession) return;
    const now = Date.now();
    const remainingSeconds = Math.max(0, Math.floor((activeMockSession.targetEndTime - now) / 1000));
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    const timerEl = document.getElementById('mock-cockpit-timer');
    if (timerEl) {
      timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      timerEl.classList.toggle('danger', remainingSeconds <= 300);
    }
  }

  function saveCurrentMockQuestionState() {
    if (!activeMockSession || !activeMockSession.problems[activeMockSession.activeQuestionIndex]) return;
    const p = activeMockSession.problems[activeMockSession.activeQuestionIndex];
    const ans = activeMockSession.answers[p.id] || {};

    ans.code = document.getElementById('mock-code-editor')?.value || '';
    ans.timeComplexity = document.getElementById('mock-input-time')?.value || '';
    ans.spaceComplexity = document.getElementById('mock-input-space')?.value || '';

    const activeRatingBtn = document.querySelector('#mock-q-rating-options .rating-btn.active');
    ans.rating = activeRatingBtn ? activeRatingBtn.dataset.mockRating : 'medium';

    activeMockSession.answers[p.id] = ans;
    if (window.MockEngine) {
      MockEngine.saveActiveSession(activeMockSession);
    }
  }

  function renderActiveMockQuestion() {
    if (!activeMockSession) return;
    const idx = activeMockSession.activeQuestionIndex;
    const p = activeMockSession.problems[idx];
    if (!p) return;

    const counterEl = document.getElementById('mock-cockpit-q-counter');
    if (counterEl) counterEl.textContent = `Problem ${idx + 1} of ${activeMockSession.problems.length}`;

    const titleEl = document.getElementById('mock-active-title');
    if (titleEl) titleEl.textContent = p.title;

    const badgesEl = document.getElementById('mock-active-badges');
    if (badgesEl) {
      badgesEl.innerHTML = `
        <span class="badge badge-${p.difficulty.toLowerCase()}">${p.difficulty}</span>
        <span class="badge badge-srs-upcoming">${p.topic}</span>
        ${p.pattern ? `<span class="badge badge-srs-unsolved">${p.pattern}</span>` : ''}
      `;
    }

    const linkEl = document.getElementById('mock-active-link');
    if (linkEl) linkEl.href = p.url || `https://leetcode.com/problemset/all/?search=${encodeURIComponent(p.title)}`;

    const ans = activeMockSession.answers[p.id] || {};
    const codeEl = document.getElementById('mock-code-editor');
    if (codeEl) codeEl.value = ans.code || '';

    const timeEl = document.getElementById('mock-input-time');
    if (timeEl) timeEl.value = ans.timeComplexity || '';

    const spaceEl = document.getElementById('mock-input-space');
    if (spaceEl) spaceEl.value = ans.spaceComplexity || '';

    document.querySelectorAll('#mock-q-rating-options .rating-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mockRating === (ans.rating || 'medium'));
    });

    const hintBanner = document.getElementById('mock-hint-banner');
    if (hintBanner) hintBanner.style.display = 'none';

    const qList = document.getElementById('mock-question-list');
    if (qList) {
      qList.innerHTML = activeMockSession.problems.map((prob, i) => `
        <div class="test-q-item ${i === idx ? 'active' : ''}" data-mock-idx="${i}">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong style="font-size:13px;">Q${i + 1}: ${prob.title}</strong>
            <span class="badge badge-${prob.difficulty.toLowerCase()}">${prob.difficulty}</span>
          </div>
          <div style="font-size:11px; color:var(--text-dim);">${prob.topic}</div>
        </div>
      `).join('');

      qList.querySelectorAll('.test-q-item').forEach(item => {
        item.addEventListener('click', () => {
          saveCurrentMockQuestionState();
          activeMockSession.activeQuestionIndex = parseInt(item.dataset.mockIdx, 10);
          renderActiveMockQuestion();
        });
      });
    }
  }

  function checkAndRestoreActiveMockSession() {
    if (!window.MockEngine) return;
    const session = MockEngine.getActiveSession();
    if (session && !session.isExpired) {
      startActiveMockSession(session);
    }
  }

  function finishMockInterview() {
    if (!activeMockSession || !window.MockEngine) return;
    saveCurrentMockQuestionState();

    if (mockTimerInterval) clearInterval(mockTimerInterval);

    const report = MockEngine.evaluateSession(activeMockSession, userStates);

    activeMockSession.problems.forEach(p => {
      const ans = activeMockSession.answers[p.id] || {};
      const curr = userStates[p.id] || {};
      const hintsUsed = (ans.hintsUsedCount || 0) > 0;
      userStates[p.id] = SRSEngine.processReview(
        curr,
        ans.rating || 'medium',
        Math.round(activeMockSession.durationMinutes / activeMockSession.problems.length),
        `Mock Round (${activeMockSession.trackTitle}): ${ans.rating || 'medium'}`,
        ans.rating === 'simple' ? 5 : ans.rating === 'medium' ? 3 : 2,
        { hintsUsed: hintsUsed }
      );
    });
    saveUserStates();

    if (window.GamificationEngine) {
      GamificationEngine.awardXP('mock_interview');
      GamificationEngine.evaluateBadges(allProblems, userStates, [report]);
      updateGamificationHeader();
    }

    const cockpit = document.getElementById('mock-interview-cockpit');
    if (cockpit) {
      cockpit.style.display = 'none';
      cockpit.classList.remove('open');
    }
    activeMockSession = null;

    showMockReport(report);
  }

  function showMockReport(report) {
    if (!report) return;
    const modal = document.getElementById('mock-report-modal');
    if (!modal) return;

    document.getElementById('mock-report-date').textContent = new Date(report.completedAt).toLocaleString();
    document.getElementById('mock-report-score').textContent = `${report.overallPercentage}%`;
    document.getElementById('mock-report-grade').textContent = report.grade;
    document.getElementById('mock-report-track-info').textContent = `${report.trackTitle} • ${report.actualMinutes} mins elapsed`;

    const breakdownEl = document.getElementById('mock-report-breakdown');
    if (breakdownEl) {
      breakdownEl.innerHTML = report.questionResults.map(q => `
        <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:10px 14px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <strong style="font-size:13px; color:var(--text-main);">${q.title}</strong>
            <span style="font-size:11px; color:var(--text-dim); display:block;">${q.topic} • ${q.difficulty} • Self-Rating: ${capitalize(q.rating)}</span>
          </div>
          <div style="text-align:right;">
            <strong style="font-size:15px; color:${q.score >= 70 ? '#10b981' : '#f59e0b'};">${q.score} / 100</strong>
            ${q.hintsUsedCount > 0 ? `<span style="font-size:10px; color:#f43f5e; display:block;">-${q.hintsUsedCount * 5} hint penalty</span>` : ''}
          </div>
        </div>
      `).join('');
    }

    modal.classList.add('open');
  }

  // --- UNIFIED BACKUP & RESTORE ---
  function exportDataJSON() {
    if (window.StorageEngine) {
      const bundle = StorageEngine.createExportBundle();
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `algorecall_backup_v2_${SRSEngine.getLocalDateString(new Date())}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }

  function importDataJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const jsonObj = JSON.parse(e.target.result);
        if (!window.StorageEngine) return;
        const inspection = StorageEngine.inspectImportBundle(jsonObj);
        if (!inspection.valid) {
          alert('Import Error: ' + inspection.error);
          return;
        }

        const msg = `Found ${inspection.stats.problemsCount} problems, ${inspection.stats.statesCount} review records, and ${inspection.stats.mocksCount} mock sessions.\n\nChoose OK to merge with existing data, or Cancel to abort.`;
        if (confirm(msg)) {
          StorageEngine.applyImportBundle(inspection, 'merge');
          loadData();
          if (window.RoadmapEngine) {
            RoadmapEngine.initProgress();
            RoadmapEngine.invalidatePlanCache('import_progress');
          }
          populateTopicDropdown();
          renderAll();
          alert('🎉 Data restored and merged successfully!');
        }
      } catch (err) {
        alert('Failed to parse JSON file. Please ensure it is a valid AlgoRecall backup.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  // --- EVENT LISTENERS ---
  function setupEventListeners() {
    // Navigation routing
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const viewName = item.getAttribute('data-view');
        switchView(viewName);
      });
    });

    // Subtab navigation within Practice, Revision, and Progress
    document.querySelectorAll('.view-subtab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const parentView = btn.getAttribute('data-parent-view');
        const subtab = btn.getAttribute('data-subtab');
        switchSubView(parentView, subtab);
      });
    });

    // Accessible keyboard navigation for tabs & pills
    document.querySelectorAll('.nav-item, .view-subtab-btn').forEach(item => {
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          item.click();
        }
      });
    });

    // Settings View Preset Quick-Loaders
    document.querySelectorAll('.btn-preset-load-view[data-preset]').forEach(btn => {
      btn.addEventListener('click', () => {
        const sheet = btn.dataset.preset;
        const sheetSelect = document.getElementById('filter-sheet');
        if (sheetSelect) {
          sheetSelect.value = sheet;
        }
        document.querySelectorAll('.sheet-pill').forEach(p => {
          if (p.getAttribute('data-sheet-val') === sheet) p.classList.add('active');
          else p.classList.remove('active');
        });
        switchView('practice', 'catalog');
        renderProblemsTable();
      });
    });

    // Mock Cockpit Listeners
    document.getElementById('btn-mock-request-hint')?.addEventListener('click', async () => {
      if (!activeMockSession || !window.AIEngine) return;
      const p = activeMockSession.problems[activeMockSession.activeQuestionIndex];
      if (!p) return;

      const ans = activeMockSession.answers[p.id] || {};
      ans.hintsUsedCount = (ans.hintsUsedCount || 0) + 1;
      const currentHintLevel = Math.min(5, ans.hintsUsedCount);

      const banner = document.getElementById('mock-hint-banner');
      if (banner) {
        banner.style.display = 'block';
        banner.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Loading hint...`;
      }

      const hint = await AIEngine.getProgressiveHint(p, currentHintLevel);
      if (banner) {
        banner.innerHTML = `
          <div style="font-weight:700; margin-bottom:4px; display:flex; justify-content:space-between;">
            <span>💡 Mock Hint (${hint.levelTitle})</span>
            <span style="font-size:11px; opacity:0.8;">Hint #${ans.hintsUsedCount}</span>
          </div>
          <div style="white-space:pre-wrap; line-height:1.5;">${hint.content}</div>
        `;
      }
    });

    document.getElementById('btn-finish-mock-interview')?.addEventListener('click', () => {
      if (confirm('Are you sure you want to finish and submit your mock interview for grading?')) {
        finishMockInterview();
      }
    });

    document.querySelectorAll('#mock-q-rating-options .rating-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#mock-q-rating-options .rating-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        saveCurrentMockQuestionState();
      });
    });

    // Quick review from dashboard banner
    document.getElementById('btn-banner-start-review')?.addEventListener('click', () => {
      document.querySelector('[data-view="revision"]')?.click();
    });

    document.getElementById('btn-see-all-revisions')?.addEventListener('click', () => {
      document.querySelector('[data-view="revision"]')?.click();
    });

    // 120-Day Roadmap Quick Access buttons
    document.getElementById('btn-header-roadmap')?.addEventListener('click', () => {
      switchView('roadmap');
    });
    document.getElementById('btn-dashboard-view-roadmap')?.addEventListener('click', () => {
      switchView('roadmap');
    });
    document.getElementById('btn-practice-subtab-roadmap')?.addEventListener('click', () => {
      switchView('roadmap');
    });
    document.getElementById('nav-item-roadmap')?.addEventListener('click', () => {
      switchView('roadmap');
    });

    // Global Search & Filters
    const searchInput = document.getElementById('global-search-input');
    searchInput?.addEventListener('input', renderProblemsTable);

    // Quick focus shortcut '/'
    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== searchInput && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        searchInput?.focus();
      }
    });

    // Sheet Pill Tab Handlers
    document.querySelectorAll('.sheet-pill[data-sheet-val]').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.sheet-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const sheetVal = pill.getAttribute('data-sheet-val');
        const sheetSelect = document.getElementById('filter-sheet');
        if (sheetSelect) {
          sheetSelect.value = sheetVal;
        }
        renderProblemsTable();
      });
    });

    document.getElementById('filter-sheet')?.addEventListener('change', (e) => {
      const val = e.target.value;
      document.querySelectorAll('.sheet-pill').forEach(p => {
        if (p.getAttribute('data-sheet-val') === val) p.classList.add('active');
        else p.classList.remove('active');
      });
      renderProblemsTable();
    });

    document.getElementById('filter-company')?.addEventListener('change', renderProblemsTable);
    document.getElementById('filter-topic')?.addEventListener('change', renderProblemsTable);
    document.getElementById('filter-difficulty')?.addEventListener('change', renderProblemsTable);
    document.getElementById('filter-status')?.addEventListener('change', renderProblemsTable);
    document.getElementById('btn-open-add-modal-2')?.addEventListener('click', () => {
      document.getElementById('add-problem-modal')?.classList.add('open');
    });

    // Patterns Handbook Category Pills & Search
    document.getElementById('pattern-search-input')?.addEventListener('input', renderPatternsHandbook);

    document.querySelectorAll('#pattern-category-pills .sheet-pill[data-cat]').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('#pattern-category-pills .sheet-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        activePatternCategory = pill.getAttribute('data-cat') || 'all';
        renderPatternsHandbook();
      });
    });

    // Delegate Patterns Card Actions (Copy Template, Jump to Problem)
    document.getElementById('patterns-cards-container')?.addEventListener('click', async (e) => {
      // 1. Copy Template
      const copyBtn = e.target.closest('.pattern-copy-btn');
      if (copyBtn) {
        const patternId = copyBtn.dataset.patternId;
        const pattern = (window.DSA_PATTERNS || []).find(p => p.id === patternId);
        if (pattern && pattern.templateCode) {
          try {
            await navigator.clipboard.writeText(pattern.templateCode);
            const origHtml = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fa-solid fa-check" style="color:var(--primary);"></i> Copied!';
            setTimeout(() => { copyBtn.innerHTML = origHtml; }, 1800);
          } catch (_) {
            prompt('Copy code template:', pattern.templateCode);
          }
        }
        return;
      }

      // 2. Jump to Problem Explorer from canonical problem chip
      const probChip = e.target.closest('.btn-jump-problem-search');
      if (probChip) {
        const query = probChip.dataset.query;
        if (query) {
          document.querySelector('[data-view="problems"]')?.click();
          const searchInp = document.getElementById('global-search-input');
          if (searchInp) {
            searchInp.value = query;
          }
          const sheetSelect = document.getElementById('filter-sheet');
          if (sheetSelect) sheetSelect.value = 'all';
          document.querySelectorAll('.sheet-pill').forEach(p => {
            if (p.getAttribute('data-sheet-val') === 'all') p.classList.add('active');
            else p.classList.remove('active');
          });
          renderProblemsTable();
        }
        return;
      }
    });

    // Flashcard Mode Listeners
    const flashcardInner = document.getElementById('flashcard-card');
    flashcardInner?.addEventListener('click', () => {
      flashcardInner.classList.toggle('flipped');
    });

    document.getElementById('btn-flashcard-prev')?.addEventListener('click', () => {
      flashcardCurrentIndex--;
      displayActiveFlashcard();
    });

    document.getElementById('btn-flashcard-next')?.addEventListener('click', () => {
      flashcardCurrentIndex++;
      displayActiveFlashcard();
    });

    document.getElementById('flashcard-filter-topic')?.addEventListener('change', () => {
      flashcardCurrentIndex = 0;
      renderFlashcards();
    });

    // Flashcard Direct Rating Buttons
    document.querySelectorAll('.btn-fc-rate').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const rating = btn.dataset.fcRating;
        if (!rating || flashcardDeck.length === 0) return;

        const currentProblem = flashcardDeck[flashcardCurrentIndex];
        if (currentProblem) {
          const currentState = userStates[currentProblem.id] || {};
          userStates[currentProblem.id] = SRSEngine.processReview(currentState, rating, 15, 'Reviewed via Flashcard Mode');
          saveUserStates();
          renderAll();

          // Advance to next card
          flashcardCurrentIndex++;
          displayActiveFlashcard();
        }
      });
    });

    // Revision Queue Sub-tabs
    document.querySelectorAll('[data-revision-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-revision-filter]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderRevisionQueue();
      });
    });

    // Delegate table actions (Solve checkbox, Rate, Details)
    document.body.addEventListener('click', (e) => {
      const reviewBtn = e.target.closest('.btn-action-review');
      if (reviewBtn) {
        openRatingModal(reviewBtn.dataset.id);
        return;
      }

      const detailBtn = e.target.closest('.btn-action-detail');
      if (detailBtn) {
        openDetailModal(detailBtn.dataset.id);
        return;
      }

      const trainerBtn = e.target.closest('.btn-action-trainer');
      if (trainerBtn) {
        if (window.SolutionDiscoveryController) {
          window.SolutionDiscoveryController.openModal(trainerBtn.dataset.id);
        }
        return;
      }
    });

    // Checkbox toggle in problems table
    document.body.addEventListener('change', (e) => {
      if (e.target.classList.contains('prob-checkbox')) {
        const id = e.target.dataset.id;
        if (e.target.checked) {
          openRatingModal(id);
        } else {
          delete userStates[id];
          saveUserStates();
          renderAll();
        }
      }
    });

    // Rating Modal buttons
    document.querySelectorAll('.rating-btn[data-rating]').forEach(btn => {
      btn.addEventListener('click', () => {
        handleRatingSelection(btn.dataset.rating);
      });
    });

    // Confidence selector pills in Rating Modal
    document.querySelectorAll('.confidence-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const conf = parseInt(btn.dataset.confidence, 10);
        activeRatingConfidence = conf;
        updateRatingModalConfidenceUI(conf);
      });
    });

    document.getElementById('btn-close-rating-modal')?.addEventListener('click', closeRatingModal);
    document.getElementById('btn-close-detail-modal')?.addEventListener('click', closeDetailModal);
    document.getElementById('btn-detail-close-bottom')?.addEventListener('click', closeDetailModal);
    document.getElementById('btn-detail-trigger-review')?.addEventListener('click', () => {
      if (activeDetailProblemId) {
        closeDetailModal();
        openRatingModal(activeDetailProblemId);
      }
    });
    document.getElementById('btn-detail-launch-trainer')?.addEventListener('click', () => {
      if (activeDetailProblemId) {
        closeDetailModal();
        if (window.SolutionDiscoveryController) {
          window.SolutionDiscoveryController.openModal(activeDetailProblemId);
        }
      }
    });

    // Recommendation 3: Scratchpad & Mock Interview Timer Listeners
    document.getElementById('btn-save-scratchpad')?.addEventListener('click', saveCurrentScratchpad);
    document.getElementById('detail-modal-scratchpad')?.addEventListener('blur', saveCurrentScratchpad);

    document.getElementById('btn-mock-timer-toggle')?.addEventListener('click', () => {
      if (detailTimerIsRunning) pauseMockTimer();
      else startMockTimer();
    });

    document.getElementById('btn-mock-timer-reset')?.addEventListener('click', () => {
      resetMockTimer();
    });

    document.querySelectorAll('[data-timer-preset]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-timer-preset]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mins = parseInt(btn.getAttribute('data-timer-preset'), 10) || 45;
        resetMockTimer(mins * 60);
      });
    });

    // Recommendation 1: Team Leaderboard & Study Group Listeners
    document.getElementById('btn-sidebar-study-group')?.addEventListener('click', () => {
      switchView('progress', 'leaderboard');
    });
    document.getElementById('btn-refresh-leaderboard')?.addEventListener('click', renderLeaderboardView);
    document.getElementById('btn-team-export-backup')?.addEventListener('click', exportDataJSON);

    // Adaptive Learning Loop Next Action trigger
    document.getElementById('btn-adaptive-loop-action')?.addEventListener('click', handleAdaptiveLoopAction);

    // Add Custom Problem Modal
    const addModal = document.getElementById('add-problem-modal');
    const openAddBtn = document.getElementById('btn-open-add-modal');
    const headerAddBtn = document.getElementById('btn-header-quick-add');
    const closeAddBtn = document.getElementById('btn-close-add-modal');

    openAddBtn?.addEventListener('click', () => addModal.classList.add('open'));
    headerAddBtn?.addEventListener('click', () => addModal.classList.add('open'));
    closeAddBtn?.addEventListener('click', () => addModal.classList.remove('open'));

    document.getElementById('add-problem-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const rawSheets = document.getElementById('input-prob-sheet').value.trim() || 'Custom';
      const sheetsArr = rawSheets.split(',').map(s => s.trim()).filter(Boolean);

      const newProblem = {
        id: 'custom-' + Date.now(),
        title: document.getElementById('input-prob-title').value.trim(),
        difficulty: document.getElementById('input-prob-difficulty').value,
        topic: document.getElementById('input-prob-topic').value.trim(),
        pattern: document.getElementById('input-prob-pattern').value.trim() || 'General',
        sheets: sheetsArr.length > 0 ? sheetsArr : ['Custom'],
        sheet: sheetsArr[0] || 'Custom',
        url: document.getElementById('input-prob-url').value.trim(),
        notes: document.getElementById('input-prob-notes').value.trim(),
        companies: []
      };

      allProblems.unshift(newProblem);
      saveProblems();
      populateTopicDropdown();
      addModal.classList.remove('open');
      document.getElementById('add-problem-form').reset();
      renderAll();
      alert(`Problem "${newProblem.title}" added!`);
    });

    // Bulk Add / URL Fetcher / Preset Modal
    const bulkModal = document.getElementById('bulk-add-modal');
    const openBulkBtn = document.getElementById('btn-open-bulk-modal');
    const closeBulkBtn = document.getElementById('btn-close-bulk-modal');

    const tabPresetsBtn = document.getElementById('tab-presets-btn');
    const tabSyncDeviceBtn = document.getElementById('tab-sync-device-btn');
    const tabPasteTextBtn = document.getElementById('tab-paste-text-btn');
    const tabFetchUrlBtn = document.getElementById('tab-fetch-url-btn');

    const presetContainer = document.getElementById('preset-sheets-container');
    const deviceSyncContainer = document.getElementById('device-sync-container');
    const bulkAddForm = document.getElementById('bulk-add-form');
    const fetchUrlForm = document.getElementById('fetch-url-form');

    openBulkBtn?.addEventListener('click', () => bulkModal.classList.add('open'));
    closeBulkBtn?.addEventListener('click', () => bulkModal.classList.remove('open'));

    function resetModalTabs() {
      [tabPresetsBtn, tabSyncDeviceBtn, tabPasteTextBtn, tabFetchUrlBtn].forEach(btn => {
        if (btn) {
          btn.classList.remove('active');
          btn.style.borderColor = 'var(--border-color)';
        }
      });
      if (presetContainer) presetContainer.style.display = 'none';
      if (deviceSyncContainer) deviceSyncContainer.style.display = 'none';
      if (bulkAddForm) bulkAddForm.style.display = 'none';
      if (fetchUrlForm) fetchUrlForm.style.display = 'none';
    }

    // Tab 1: 1-Click Presets
    tabPresetsBtn?.addEventListener('click', () => {
      resetModalTabs();
      tabPresetsBtn.classList.add('active');
      tabPresetsBtn.style.borderColor = 'var(--accent-violet)';
      if (presetContainer) presetContainer.style.display = 'flex';
    });

    // Tab 2: Cross-Device Quick Sync
    tabSyncDeviceBtn?.addEventListener('click', () => {
      resetModalTabs();
      tabSyncDeviceBtn.classList.add('active');
      tabSyncDeviceBtn.style.borderColor = 'var(--accent-cyan)';
      if (deviceSyncContainer) deviceSyncContainer.style.display = 'flex';
    });

    // Tab 3: Manual Paste
    tabPasteTextBtn?.addEventListener('click', () => {
      resetModalTabs();
      tabPasteTextBtn.classList.add('active');
      tabPasteTextBtn.style.borderColor = 'var(--accent-cyan)';
      if (bulkAddForm) bulkAddForm.style.display = 'flex';
    });

    // Tab 4: URL Fetcher
    tabFetchUrlBtn?.addEventListener('click', () => {
      resetModalTabs();
      tabFetchUrlBtn.classList.add('active');
      tabFetchUrlBtn.style.borderColor = 'var(--accent-cyan)';
      if (fetchUrlForm) fetchUrlForm.style.display = 'flex';
    });

    // Copy Sync Code & Link
    document.getElementById('btn-copy-sync-code')?.addEventListener('click', async () => {
      const code = exportSyncCode();
      try {
        await navigator.clipboard.writeText(code);
        alert('✅ 1-Click Sync Code copied to clipboard!\n\nPaste this code into AlgoRecall on your phone or other device to instantly sync all progress.');
      } catch (_) {
        prompt('Copy your sync code:', code);
      }
    });

    document.getElementById('btn-copy-sync-link')?.addEventListener('click', async () => {
      const code = exportSyncCode();
      const directUrl = `${window.location.origin}${window.location.pathname}#sync=${encodeURIComponent(code)}`;
      try {
        await navigator.clipboard.writeText(directUrl);
        alert('✅ Direct Sync Link copied to clipboard!\n\nOpen this URL on your other device to automatically load all progress.');
      } catch (_) {
        prompt('Copy your direct sync URL:', directUrl);
      }
    });

    // Apply Sync Code
    document.getElementById('btn-apply-sync-code')?.addEventListener('click', () => {
      const inputEl = document.getElementById('input-sync-code-paste');
      const val = inputEl?.value.trim();
      if (!val) {
        alert('Please paste a sync code first.');
        return;
      }
      if (importSyncCode(val)) {
        if (inputEl) inputEl.value = '';
        bulkModal.classList.remove('open');
      }
    });

    // Handle 1-Click Preset Loaders
    document.querySelectorAll('.btn-preset-load').forEach(btn => {
      btn.addEventListener('click', () => {
        const presetType = btn.dataset.preset;
        const defaultList = window.DEFAULT_DSA_SHEETS ? [...window.DEFAULT_DSA_SHEETS] : [];

        // Smart deduplicate
        allProblems = smartDeduplicateAndSync(allProblems, defaultList, userStates);
        saveProblems();
        saveUserStates();
        populateTopicDropdown();

        // Switch to Problem Explorer view with matching filter
        document.querySelector('[data-view="problems"]')?.click();
        const sheetFilterSelect = document.getElementById('filter-sheet');
        if (sheetFilterSelect) {
          if (presetType === 'striver-a2z') sheetFilterSelect.value = 'Striver A2Z';
          else if (presetType === 'neetcode-150') sheetFilterSelect.value = 'NeetCode 150';
          else if (presetType === 'striver-sde') sheetFilterSelect.value = 'Striver SDE';
          else sheetFilterSelect.value = 'all';
        }

        renderAll();
        bulkModal.classList.remove('open');

        let targetCount = allProblems.filter(p => {
          if (presetType === 'striver-a2z') return (p.sheets || []).includes('Striver A2Z');
          if (presetType === 'neetcode-150') return (p.sheets || []).includes('NeetCode 150');
          if (presetType === 'striver-sde') return (p.sheets || []).includes('Striver SDE');
          return true;
        }).length;

        alert(`🎉 Loaded ${targetCount} verified problems for ${presetType.toUpperCase()}! Master catalog cleanly synced to ${allProblems.length} unique questions.`);
      });
    });

    // Handle Manual Sync & Clean Database
    document.getElementById('btn-sync-clean-sheets')?.addEventListener('click', () => {
      const defaultList = window.DEFAULT_DSA_SHEETS ? [...window.DEFAULT_DSA_SHEETS] : [];
      const beforeCount = allProblems.length;
      allProblems = smartDeduplicateAndSync(allProblems, defaultList, userStates);
      saveProblems();
      saveUserStates();
      populateTopicDropdown();
      renderAll();
      alert(`✨ Database Synced & Deduplicated!\nBefore: ${beforeCount} items\nNow: ${allProblems.length} pristine questions with all your review history preserved.`);
    });

    // Handle Live URL Fetch & Parsing
    fetchUrlForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const targetUrl = document.getElementById('input-fetch-url').value.trim();
      const sheetTag = document.getElementById('fetch-input-sheet').value.trim() || 'Striver A2Z';
      const defaultTopic = document.getElementById('fetch-input-topic').value.trim() || 'General';
      const submitBtn = document.getElementById('btn-submit-fetch-url');

      if (!targetUrl) return;

      const origText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Fetching & Extracting Problems...';
      submitBtn.disabled = true;

      try {
        // Use CORS-friendly proxies to fetch the target page content
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
        let response = await fetch(proxyUrl);
        if (!response.ok) {
          // Fallback proxy
          const fallbackProxy = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
          response = await fetch(fallbackProxy);
        }

        const htmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');

        // Extract all links pointing to LeetCode problems or articles
        const links = Array.from(doc.querySelectorAll('a[href]'));
        const foundProblems = [];
        const seenUrls = new Set();

        links.forEach(a => {
          const href = a.getAttribute('href') || '';
          if (href.includes('leetcode.com/problems/') || href.includes('/problems/')) {
            const cleanHref = href.startsWith('http') ? href : `https://leetcode.com${href}`;
            if (!seenUrls.has(cleanHref)) {
              seenUrls.add(cleanHref);
              let title = a.textContent.trim();
              if (!title || title.length < 3 || title.toLowerCase().includes('leetcode') || title.toLowerCase().includes('problem')) {
                // Extract from slug
                try {
                  const slug = cleanHref.split('problems/')[1]?.split('/')[0]?.split('-');
                  if (slug && slug.length > 0) {
                    title = slug.map(w => capitalize(w)).join(' ');
                  }
                } catch (_) {
                  title = 'Problem ' + (foundProblems.length + 1);
                }
              }

              foundProblems.push({
                id: 'url-import-' + Date.now() + '-' + foundProblems.length,
                title: title,
                difficulty: 'Medium',
                topic: defaultTopic,
                pattern: 'General',
                sheets: [sheetTag],
                sheet: sheetTag,
                url: cleanHref,
                notes: `Imported directly from ${targetUrl}`,
                companies: []
              });
            }
          }
        });

        if (foundProblems.length === 0) {
          // If no direct leetcode links were found in client-side HTML, parse any title links
          alert('Note: The target website renders its problems dynamically via React. The system has imported the comprehensive preloaded Striver A2Z and NeetCode 150 catalogue into your database.');
        } else {
          allProblems.unshift(...foundProblems);
          saveProblems();
          populateTopicDropdown();
          renderAll();
          alert(`🎉 Successfully extracted and imported ${foundProblems.length} problems from URL!`);
        }
        bulkModal.classList.remove('open');
      } catch (err) {
        console.error('Fetch error:', err);
        alert('Could not fetch directly due to target site access restrictions. You can use the "Paste Problem List" tab to paste 20+ URLs at once.');
      } finally {
        submitBtn.innerHTML = origText;
        submitBtn.disabled = false;
      }
    });

    // Handle Manual Bulk Add / Paste List
    bulkAddForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const defaultTopic = document.getElementById('bulk-input-topic').value.trim();
      const defaultDiff = document.getElementById('bulk-input-difficulty').value;
      const rawSheet = document.getElementById('bulk-input-sheet').value.trim() || 'Custom';
      const sheetList = rawSheet.split(',').map(s => s.trim()).filter(Boolean);
      const textLines = document.getElementById('bulk-input-text').value.split('\n');

      let addedCount = 0;
      textLines.forEach((line, index) => {
        const cleanLine = line.trim();
        if (!cleanLine) return;

        let title = cleanLine;
        let url = '';

        if (cleanLine.startsWith('http')) {
          url = cleanLine;
          try {
            const parts = cleanLine.split('problems/')[1]?.split('/')[0]?.split('-');
            if (parts && parts.length > 0) {
              title = parts.map(p => capitalize(p)).join(' ');
            }
          } catch (_) {
            title = cleanLine;
          }
        }

        const newP = {
          id: 'bulk-' + Date.now() + '-' + index,
          title: title,
          difficulty: defaultDiff,
          topic: defaultTopic,
          pattern: 'General',
          sheets: sheetList.length > 0 ? sheetList : ['Custom'],
          sheet: sheetList[0] || 'Custom',
          url: url || `https://leetcode.com/problemset/all/?search=${encodeURIComponent(title)}`,
          notes: '',
          companies: []
        };

        allProblems.unshift(newP);
        addedCount++;
      });

      saveProblems();
      populateTopicDropdown();
      bulkModal.classList.remove('open');
      document.getElementById('bulk-add-form').reset();
      renderAll();
      alert(`🎉 Successfully added ${addedCount} problems!`);
    });

    // Monthly Assessment Buttons
    document.getElementById('btn-start-monthly-test')?.addEventListener('click', () => startMonthlyExam(4, 60));
    document.getElementById('btn-start-monthly-exam')?.addEventListener('click', () => startMonthlyExam(4, 60));
    document.getElementById('btn-quick-sample-exam')?.addEventListener('click', () => startMonthlyExam(2, 30));
    document.getElementById('btn-header-monthly-test')?.addEventListener('click', () => {
      document.querySelector('[data-view="monthly-assessment"]')?.click();
    });

    document.getElementById('btn-finish-test')?.addEventListener('click', finishMonthlyExam);

    // Test Sandbox Per-Question Rating options
    document.querySelectorAll('[data-test-rating]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!activeTestSession) return;
        saveCurrentQuestionState();
        const currentProb = activeTestSession.problems[activeTestQuestionIndex];
        const rating = btn.dataset.testRating;
        if (!testAnswers[currentProb.id]) {
          testAnswers[currentProb.id] = { rating: null, scratchpad: '' };
        }
        testAnswers[currentProb.id].rating = rating;
        saveActiveExamState();
        renderActiveTestQuestion();
      });
    });

    // Backup & Restore
    document.getElementById('btn-export-data')?.addEventListener('click', exportDataJSON);
    document.getElementById('btn-import-trigger')?.addEventListener('click', () => {
      document.getElementById('import-file-input')?.click();
    });
    document.getElementById('import-file-input')?.addEventListener('change', importDataJSON);

    // --- ROADMAP & DAY-WISE PLAN CONTROLS ---
    // 1. Track selector
    document.getElementById('roadmap-track-select')?.addEventListener('change', (e) => {
      if (!window.RoadmapEngine) return;
      RoadmapEngine.progress.activeTrack = e.target.value;
      RoadmapEngine.progress.selectedWeek = 1;
      RoadmapEngine.progress.selectedDay = 1;
      RoadmapEngine.saveProgress();
      renderRoadmapView();
    });

    // 2. Switch Topic Modal Controls & Tabs
    const switchTopicModal = document.getElementById('switch-day-topic-modal');
    const btnCloseSwitchTopic = document.getElementById('btn-close-switch-topic-modal');
    const tabSwitchSingleBtn = document.getElementById('tab-switch-single-topic-btn');
    const tabMixMultiBtn = document.getElementById('tab-mix-multi-topics-btn');
    const containerSwitchSingle = document.getElementById('container-switch-single-topic');
    const containerMixMulti = document.getElementById('container-mix-multi-topics');
    const mixerPillsContainer = document.getElementById('topic-mixer-pills-container');

    function resetSwitchTopicTabs() {
      tabSwitchSingleBtn?.classList.remove('active');
      tabMixMultiBtn?.classList.remove('active');
      if (containerSwitchSingle) containerSwitchSingle.style.display = 'none';
      if (containerMixMulti) containerMixMulti.style.display = 'none';
    }

    tabSwitchSingleBtn?.addEventListener('click', () => {
      resetSwitchTopicTabs();
      tabSwitchSingleBtn.classList.add('active');
      if (containerSwitchSingle) containerSwitchSingle.style.display = 'block';
    });

    tabMixMultiBtn?.addEventListener('click', () => {
      resetSwitchTopicTabs();
      tabMixMultiBtn.classList.add('active');
      if (containerMixMulti) containerMixMulti.style.display = 'block';
    });

    btnCloseSwitchTopic?.addEventListener('click', () => {
      switchTopicModal?.classList.remove('open');
    });

    // Topic Mixer Pill Selection Handler
    mixerPillsContainer?.addEventListener('click', (e) => {
      const pill = e.target.closest('.mixer-topic-pill');
      if (!pill) return;

      pill.classList.toggle('selected');
      const isSelected = pill.classList.contains('selected');
      const icon = pill.querySelector('i');
      if (icon) {
        icon.className = isSelected ? 'fa-solid fa-square-check' : 'fa-regular fa-square';
      }

      const selectedCount = document.querySelectorAll('.mixer-topic-pill.selected').length;
      const countTxt = document.getElementById('mixer-selection-count-txt');
      if (countTxt) {
        countTxt.textContent = selectedCount === 1 ? '1 topic selected' : `${selectedCount} topics selected`;
      }
    });

    // Apply Single Topic to Day
    document.getElementById('btn-apply-single-topic')?.addEventListener('click', () => {
      if (!window.RoadmapEngine) return;
      const selTopic = document.getElementById('select-switch-day-topic')?.value;
      if (!selTopic) return;

      const track = RoadmapEngine.progress.activeTrack;
      const week = RoadmapEngine.progress.selectedWeek;
      const day = RoadmapEngine.progress.selectedDay;

      RoadmapEngine.setDayCustomTopic(track, week, day, selTopic);
      switchTopicModal?.classList.remove('open');
      renderRoadmapView();
    });

    // Reset Day to Roadmap Default
    document.getElementById('btn-reset-to-default-topic')?.addEventListener('click', () => {
      if (!window.RoadmapEngine) return;
      const track = RoadmapEngine.progress.activeTrack;
      const week = RoadmapEngine.progress.selectedWeek;
      const day = RoadmapEngine.progress.selectedDay;

      RoadmapEngine.resetDayTopic(track, week, day);
      switchTopicModal?.classList.remove('open');
      renderRoadmapView();
    });

    // Generate & Apply Multi-Topic Mixed Workout
    document.getElementById('btn-generate-mixed-day-workout')?.addEventListener('click', () => {
      if (!window.RoadmapEngine) return;
      const selectedPills = document.querySelectorAll('.mixer-topic-pill.selected');
      const selectedTopics = Array.from(selectedPills).map(p => p.dataset.topic).filter(Boolean);

      if (selectedTopics.length === 0) {
        alert('Please select at least 1 topic from the list to mix into today\'s session.');
        return;
      }

      const diff = document.getElementById('select-mixer-difficulty')?.value || 'balanced';
      const count = document.getElementById('select-mixer-count')?.value || 'auto';

      const mixed = RoadmapEngine.generateMultiTopicMixedProblems(allProblems, selectedTopics, { difficulty: diff, count: count });
      if (!mixed || mixed.length === 0) {
        alert('Could not find problems matching the selected topics and difficulty. Please try selecting more topics.');
        return;
      }

      const track = RoadmapEngine.progress.activeTrack;
      const week = RoadmapEngine.progress.selectedWeek;
      const day = RoadmapEngine.progress.selectedDay;
      const problemIds = mixed.map(p => p.id);

      RoadmapEngine.saveCustomDayMixedWorkout(track, week, day, problemIds, selectedTopics);
      switchTopicModal?.classList.remove('open');
      renderRoadmapView();
    });

    // --- 120-DAY ROADMAP EVENT LISTENERS ---
    // A. View Navigation Tabs
    document.querySelectorAll('.roadmap-120-view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeRoadmap120View = btn.dataset.roadmapView || 'list';
        renderRoadmapView();
      });
    });

    // B. Filter Pills
    document.querySelectorAll('.roadmap-120-filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        activeRoadmap120Filter = pill.dataset.filter || 'all';
        renderRoadmapView();
      });
    });

    // C. Search Input
    document.getElementById('roadmap-120-search-input')?.addEventListener('input', (e) => {
      roadmap120SearchQuery = e.target.value;
      renderRoadmapView();
    });

    // D. Global Action Toolbar Buttons
    const onInsertDay = () => openRoadmapInsertModal(1);
    document.getElementById('btn-roadmap-insert-day')?.addEventListener('click', onInsertDay);
    document.getElementById('btn-roadmap-insert-buffer')?.addEventListener('click', onInsertDay);

    document.getElementById('btn-roadmap-shift')?.addEventListener('click', () => {
      openRoadmapShiftModal(1);
    });

    document.getElementById('btn-roadmap-condense')?.addEventListener('click', () => {
      openRoadmapCondenseModal(1);
    });

    document.getElementById('btn-roadmap-extend')?.addEventListener('click', () => {
      if (!window.RoadmapEngine) return;
      const daysStr = prompt('Enter number of days to extend roadmap (e.g. 7, 14, 30):', '14');
      if (daysStr) {
        const count = parseInt(daysStr, 10);
        if (!isNaN(count) && count > 0) {
          RoadmapEngine.extendRoadmap(count);
          renderRoadmapView();
        }
      }
    });

    document.getElementById('btn-roadmap-undo')?.addEventListener('click', () => {
      if (!window.RoadmapEngine) return;
      const res = RoadmapEngine.undoLastAction();
      if (res && res.success) {
        renderRoadmapView();
      } else {
        alert(res?.message || 'Nothing to undo.');
      }
    });

    document.getElementById('btn-roadmap-history')?.addEventListener('click', () => {
      openRoadmapHistoryModal();
    });

    const onRestoreDefault = () => {
      if (!window.RoadmapEngine) return;
      if (confirm('Are you sure you want to restore the default 120-day roadmap? Custom edits will be reset, but solved history will be preserved.')) {
        RoadmapEngine.restoreDefaultRoadmap();
        renderRoadmapView();
      }
    };
    document.getElementById('btn-roadmap-restore')?.addEventListener('click', onRestoreDefault);
    document.getElementById('btn-roadmap-reset-default')?.addEventListener('click', onRestoreDefault);

    // E. Bulk Action Bar Handlers
    document.getElementById('btn-bulk-deselect')?.addEventListener('click', () => {
      selectedRoadmap120Days.clear();
      renderRoadmapView();
    });

    document.getElementById('btn-bulk-shift')?.addEventListener('click', () => {
      if (selectedRoadmap120Days.size === 0) return;
      const minDay = Math.min(...Array.from(selectedRoadmap120Days));
      openRoadmapShiftModal(minDay);
    });

    document.getElementById('btn-bulk-condense')?.addEventListener('click', () => {
      if (selectedRoadmap120Days.size === 0) return;
      const minDay = Math.min(...Array.from(selectedRoadmap120Days));
      openRoadmapCondenseModal(minDay);
    });

    document.getElementById('btn-bulk-defer')?.addEventListener('click', () => {
      if (!window.RoadmapEngine || selectedRoadmap120Days.size === 0) return;
      selectedRoadmap120Days.forEach(dayNum => {
        RoadmapEngine.deferTask(dayNum, 'current_learning');
        RoadmapEngine.deferTask(dayNum, 'foundation_revision');
      });
      selectedRoadmap120Days.clear();
      renderRoadmapView();
    });

    // F. Modal Dialog Buttons (Close, Save, Preview)
    document.getElementById('btn-close-roadmap-edit-modal')?.addEventListener('click', closeRoadmapEditModal);
    document.getElementById('btn-cancel-roadmap-edit')?.addEventListener('click', closeRoadmapEditModal);
    document.getElementById('btn-save-roadmap-edit')?.addEventListener('click', saveRoadmapEditModal);

    document.getElementById('btn-close-insert-modal')?.addEventListener('click', closeRoadmapInsertModal);
    document.getElementById('btn-cancel-insert-day')?.addEventListener('click', closeRoadmapInsertModal);
    document.getElementById('btn-confirm-insert-day')?.addEventListener('click', saveRoadmapInsertModal);

    document.getElementById('btn-close-shift-modal')?.addEventListener('click', closeRoadmapShiftModal);
    document.getElementById('btn-cancel-shift')?.addEventListener('click', closeRoadmapShiftModal);
    document.getElementById('btn-confirm-shift')?.addEventListener('click', saveRoadmapShiftModal);

    document.getElementById('btn-close-condense-modal')?.addEventListener('click', closeRoadmapCondenseModal);
    document.getElementById('btn-cancel-condense')?.addEventListener('click', closeRoadmapCondenseModal);
    document.getElementById('btn-run-condense-preview')?.addEventListener('click', previewRoadmapCondense);
    document.getElementById('btn-confirm-condense')?.addEventListener('click', saveRoadmapCondenseModal);

    document.getElementById('btn-close-history-modal')?.addEventListener('click', closeRoadmapHistoryModal);
    document.getElementById('btn-close-history-footer')?.addEventListener('click', closeRoadmapHistoryModal);
    document.getElementById('btn-history-undo')?.addEventListener('click', () => {
      if (!window.RoadmapEngine) return;
      RoadmapEngine.undoLastAction();
      openRoadmapHistoryModal();
      renderRoadmapView();
    });

    // G. Dynamic Event Delegation for 120-Day Content Area
    document.getElementById('roadmap-120-content-area')?.addEventListener('click', (e) => {
      // 1. Checkbox click for bulk selection
      const chk = e.target.closest('.roadmap-120-day-checkbox');
      if (chk) {
        const dayNum = parseInt(chk.dataset.day, 10);
        if (chk.checked) {
          selectedRoadmap120Days.add(dayNum);
        } else {
          selectedRoadmap120Days.delete(dayNum);
        }
        const bulkBarEl = document.getElementById('roadmap-120-bulk-bar');
        const bulkCountEl = document.getElementById('roadmap-120-bulk-count');
        if (bulkBarEl && bulkCountEl) {
          if (selectedRoadmap120Days.size > 0) {
            bulkBarEl.style.display = 'flex';
            bulkCountEl.textContent = `${selectedRoadmap120Days.size} Days Selected`;
          } else {
            bulkBarEl.style.display = 'none';
          }
        }
        return;
      }

      // 2. Toggle Day Completed
      const toggleCompleteBtn = e.target.closest('.btn-roadmap-toggle-complete');
      if (toggleCompleteBtn) {
        const dayNum = parseInt(toggleCompleteBtn.dataset.day, 10);
        if (window.RoadmapEngine) {
          const plan = RoadmapEngine.get120DayRoadmap(userStates);
          const day = plan.days.find(d => d.dayNumber === dayNum);
          if (day) {
            RoadmapEngine.editDay(dayNum, { isCompleted: !day.isCompleted });
            renderRoadmapView();
            renderDashboard();
          }
        }
        return;
      }

      // 3. Edit Day
      const editDayBtn = e.target.closest('.btn-roadmap-edit-day');
      if (editDayBtn) {
        const dayNum = parseInt(editDayBtn.dataset.day, 10);
        openRoadmapEditModal(dayNum);
        return;
      }

      // 4. Insert Blank Buffer Day After
      const insertAfterBtn = e.target.closest('.btn-roadmap-insert-after');
      if (insertAfterBtn) {
        const dayNum = parseInt(insertAfterBtn.dataset.day, 10);
        openRoadmapInsertModal(dayNum);
        return;
      }

      // 5. Split Day Workload
      const splitBtn = e.target.closest('.btn-roadmap-split-day');
      if (splitBtn) {
        const dayNum = parseInt(splitBtn.dataset.day, 10);
        if (window.RoadmapEngine) {
          RoadmapEngine.splitDay(dayNum);
          renderRoadmapView();
        }
        return;
      }

      // 6. Shift From Day
      const shiftFromBtn = e.target.closest('.btn-roadmap-shift-from');
      if (shiftFromBtn) {
        const dayNum = parseInt(shiftFromBtn.dataset.day, 10);
        openRoadmapShiftModal(dayNum);
        return;
      }

      // 7. Move Day Up / Down
      const moveDayBtn = e.target.closest('.btn-roadmap-move-day');
      if (moveDayBtn) {
        const dayNum = parseInt(moveDayBtn.dataset.day, 10);
        const dir = moveDayBtn.dataset.dir;
        const targetDay = dir === 'up' ? dayNum - 1 : dayNum + 1;
        if (window.RoadmapEngine && targetDay >= 1) {
          RoadmapEngine.moveDay(dayNum, targetDay);
          renderRoadmapView();
        }
        return;
      }

      // 8. Skip Task (Prompt reason and audit without marking mastered)
      const skipBtn = e.target.closest('.btn-task-skip');
      if (skipBtn) {
        const dayNum = parseInt(skipBtn.dataset.day, 10);
        const stream = skipBtn.dataset.stream;
        const reason = prompt('Reason for skipping this task (will be logged in audit history, does NOT mark as mastered):', 'Already proficient');
        if (reason !== null && window.RoadmapEngine) {
          RoadmapEngine.skipTask(dayNum, stream, reason);
          renderRoadmapView();
        }
        return;
      }

      // 9. Defer Task
      const deferBtn = e.target.closest('.btn-task-defer');
      if (deferBtn) {
        const dayNum = parseInt(deferBtn.dataset.day, 10);
        const stream = deferBtn.dataset.stream;
        if (window.RoadmapEngine) {
          RoadmapEngine.deferTask(dayNum, stream);
          renderRoadmapView();
        }
        return;
      }

      // 10. Replace / Edit Task
      const replaceBtn = e.target.closest('.btn-task-replace');
      if (replaceBtn) {
        const dayNum = parseInt(replaceBtn.dataset.day, 10);
        openRoadmapEditModal(dayNum);
        return;
      }

      // 11. Calendar Day Cell Click
      const calCell = e.target.closest('.calendar-day-cell');
      if (calCell) {
        const dayNum = parseInt(calCell.dataset.day, 10);
        openRoadmapEditModal(dayNum);
        return;
      }

      // 12. Topic Progression Card Click
      const topicCard = e.target.closest('.roadmap-120-topic-card');
      if (topicCard) {
        const topic = topicCard.dataset.topic;
        activeRoadmap120View = 'list';
        roadmap120SearchQuery = topic;
        const searchInput = document.getElementById('roadmap-120-search-input');
        if (searchInput) searchInput.value = topic;
        renderRoadmapView();
        return;
      }
    });

    // 3. Delegate Dynamic Roadmap Actions (Open Modal, Toggle Done, Defer Rollover, Weekend Exam/Flashcards)
    document.getElementById('roadmap-active-day-content')?.addEventListener('click', (e) => {
      // A. Open Switch Topic / Mixer Modal
      const openModalBtn = e.target.closest('#btn-open-switch-topic-modal');
      if (openModalBtn) {
        if (!window.RoadmapEngine) return;
        const track = RoadmapEngine.progress.activeTrack;
        const week = RoadmapEngine.progress.selectedWeek;
        const day = RoadmapEngine.progress.selectedDay;
        const schedule = RoadmapEngine.getSchedule(track, allProblems);
        const curWeek = schedule.find(w => w.weekNumber === week) || schedule[0];
        const curDay = curWeek.days.find(d => d.dayNumber === day) || curWeek.days[0];
        const customTopic = RoadmapEngine.getDayCustomTopic(track, week, day);

        const subTitle = document.getElementById('modal-switch-topic-subtitle');
        if (subTitle) {
          subTitle.textContent = `Day ${day}: ${curDay.title}`;
        }

        // Prepopulate single topic select
        const singleSelect = document.getElementById('select-switch-day-topic');
        if (singleSelect) {
          if (typeof customTopic === 'string') {
            singleSelect.value = customTopic;
          } else if (curDay.topic) {
            singleSelect.value = curDay.topic;
          }
        }

        // Prepopulate mixer pills
        const existingMixed = Array.isArray(customTopic) ? customTopic : [];
        document.querySelectorAll('.mixer-topic-pill').forEach(pill => {
          const t = pill.dataset.topic;
          const isSelected = existingMixed.includes(t);
          if (isSelected) {
            pill.classList.add('selected');
            const ic = pill.querySelector('i');
            if (ic) ic.className = 'fa-solid fa-square-check';
          } else {
            pill.classList.remove('selected');
            const ic = pill.querySelector('i');
            if (ic) ic.className = 'fa-regular fa-square';
          }
        });

        const selCount = document.querySelectorAll('.mixer-topic-pill.selected').length;
        const countTxt = document.getElementById('mixer-selection-count-txt');
        if (countTxt) {
          countTxt.textContent = selCount === 1 ? '1 topic selected' : `${selCount} topics selected`;
        }

        if (Array.isArray(customTopic) && customTopic.length > 0) {
          tabMixMultiBtn?.click();
        } else {
          tabSwitchSingleBtn?.click();
        }

        switchTopicModal?.classList.add('open');
        return;
      }

      // B. Inline Reset Day Topic
      const resetDayBtn = e.target.closest('.btn-reset-day-topic');
      if (resetDayBtn) {
        if (!window.RoadmapEngine) return;
        RoadmapEngine.resetDayTopic(RoadmapEngine.progress.activeTrack, RoadmapEngine.progress.selectedWeek, RoadmapEngine.progress.selectedDay);
        renderRoadmapView();
        return;
      }

      // C. Toggle Day Completed
      const toggleDoneBtn = e.target.closest('#btn-toggle-day-complete');
      if (toggleDoneBtn) {
        const track = toggleDoneBtn.dataset.track;
        const week = parseInt(toggleDoneBtn.dataset.week, 10);
        const day = parseInt(toggleDoneBtn.dataset.day, 10);
        RoadmapEngine.toggleDayCompleted(track, week, day);
        renderRoadmapView();
        renderDashboard();
        return;
      }

      // D. Defer Rollover Problem
      const deferBtn = e.target.closest('.btn-defer-rollover');
      if (deferBtn) {
        const probId = deferBtn.dataset.id;
        RoadmapEngine.deferRolloverProblem(probId);
        renderRoadmapView();
        return;
      }

      // E. Launch Weekend Exam
      const examBtn = e.target.closest('#btn-launch-weekend-exam');
      if (examBtn) {
        const topic = examBtn.dataset.topic;
        startWeekendExam(topic);
        return;
      }

      // F. Launch Weekend Flashcards
      const fcBtn = e.target.closest('#btn-launch-weekend-flashcards');
      if (fcBtn) {
        const topic = fcBtn.dataset.topic;
        document.querySelector('[data-view="flashcards"]')?.click();
        const fcTopicSelect = document.getElementById('flashcard-filter-topic');
        if (fcTopicSelect) {
          fcTopicSelect.value = topic;
        }
        flashcardCurrentIndex = 0;
        renderFlashcards();
        return;
      }

      // G. Global Escape key listener for modals and drawer
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          const sidebar = document.querySelector('.sidebar');
          const backdrop = document.getElementById('sidebar-mobile-backdrop');
          const mobileToggle = document.getElementById('btn-mobile-menu-toggle');
          if (sidebar && sidebar.classList.contains('mobile-open')) {
            sidebar.classList.remove('mobile-open');
            backdrop?.classList.remove('active');
            if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'false');
            return;
          }

          const openModals = document.querySelectorAll('.modal-backdrop.open');
          if (openModals.length > 0) {
            openModals.forEach(m => m.classList.remove('open'));
          }

          const userPill = document.getElementById('header-user-pill');
          const authDropdown = document.getElementById('header-auth-dropdown');
          if (authDropdown && authDropdown.classList.contains('open')) {
            authDropdown.classList.remove('open');
            userPill?.classList.remove('open');
            userPill?.setAttribute('aria-expanded', 'false');
          }
        }
      });
    });
  }

  // --- CROSS-TAB SYNCHRONIZATION CONTROLLER ---
  function setupCrossTabSync() {
    window.addEventListener('storage', (e) => {
      if (!e || !e.key) return;

      let shouldRender = false;
      let shouldUpdateTopics = false;

      try {
        if (e.key === STORAGE_KEYS.USER_STATES || e.key === 'algorecall_user_states_v1') {
          if (e.newValue) {
            userStates = JSON.parse(e.newValue);
            shouldRender = true;
          }
        } else if (e.key === STORAGE_KEYS.PROBLEMS || e.key === 'algorecall_problems_v1') {
          if (e.newValue) {
            allProblems = JSON.parse(e.newValue);
            shouldUpdateTopics = true;
            shouldRender = true;
          }
        } else if (e.key === STORAGE_KEYS.TEST_HISTORY || e.key === 'algorecall_monthly_test_history_v1') {
          if (e.newValue) {
            monthlyTestHistory = JSON.parse(e.newValue);
            shouldRender = true;
          }
        } else if (e.key === 'algorecall_roadmap_progress_v1') {
          if (window.RoadmapEngine) {
            RoadmapEngine.initProgress();
            shouldRender = true;
          }
        } else if (e.key === 'algorecall_settings_v2') {
          if (e.newValue) {
            const settings = JSON.parse(e.newValue);
            if (settings && settings.theme) {
              document.documentElement.setAttribute('data-theme', settings.theme);
              const icon = document.getElementById('theme-toggle-icon');
              if (icon) {
                icon.className = settings.theme === 'light' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
              }
            }
          }
        } else if (e.key === 'algorecall_gamification_v2') {
          updateGamificationHeader();
        }
      } catch (err) {
        console.warn('Cross-tab sync error parsing storage update:', err);
      }

      if (shouldUpdateTopics) {
        populateTopicDropdown();
      }
      if (shouldRender) {
        updateGamificationHeader();
        renderAll();
      }
    });

    // Cross-device / multi-browser focus & visibility freshness check
    let _lastVisibilitySync = 0;
    async function checkCloudFreshnessOnFocus() {
      if (typeof document === 'undefined' || document.visibilityState === 'hidden') return;
      if (typeof window === 'undefined' || !window.CloudSyncEngine || !window.AuthEngine) return;
      const user = window.AuthEngine.getUser();
      if (!user || !user.id) return;
      if (typeof navigator !== 'undefined' && navigator.onLine === false) return;

      const now = Date.now();
      if (now - _lastVisibilitySync < 6000) return;
      _lastVisibilitySync = now;
      const targetUserId = user.id;

      try {
        const syncRes = await window.CloudSyncEngine.syncOrHydrate(targetUserId, { user });
        const activeUser = window.AuthEngine.getUser();
        if (!activeUser || activeUser.id !== targetUserId) return;

        if (syncRes && syncRes.success && syncRes.updatedLocal) {
          reloadLearnerWorkspace();
          showPlanConfirmation('Progress refreshed from another device session.');
        }
      } catch (err) {
        // Silently tolerate network or cloud latency
      }
    }

    window.addEventListener('focus', checkCloudFreshnessOnFocus);
    document.addEventListener('visibilitychange', checkCloudFreshnessOnFocus);
  }

  // --- ACCESSIBLE MOBILE DRAWER NAVIGATION CONTROLLER ---
  function setupMobileNav() {
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.getElementById('btn-mobile-menu-toggle');
    const backdrop = document.getElementById('sidebar-mobile-backdrop');

    if (!toggleBtn || !sidebar) return;

    function setDrawerState(isOpen) {
      sidebar.classList.toggle('mobile-open', isOpen);
      backdrop?.classList.toggle('active', isOpen);
      toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const willOpen = !sidebar.classList.contains('mobile-open');
      setDrawerState(willOpen);
    });

    backdrop?.addEventListener('click', () => {
      setDrawerState(false);
    });

    // Close mobile drawer when clicking navigation items on small screens
    sidebar.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          setDrawerState(false);
        }
      });
    });
  }

  // --- AUTHENTICATION & MULTI-USER IDENTITY CONTROLLER (Stage 1 & Stage 2) ---
  let authInitialized = false;
  let currentAuthUserId = null;

  async function handleAuthStateTransition(event, session, user) {
    updateAuthUI(event, session, user);

    const isAuthed = Boolean(user && session);
    const repo = window.LearnerRepository;
    const migrator = window.MigrationManager;

    if (isAuthed) {
      const newUserId = user.id;
      if (currentAuthUserId === newUserId) {
        return; // Already active context, avoid duplicate cycles
      }
      currentAuthUserId = newUserId;
      if (repo) repo.setContext({ type: 'user', id: newUserId, email: user.email });

      // 1. Always check & synchronize with Cloud Snapshot
      if (window.CloudSyncEngine) {
        try {
          const syncRes = await window.CloudSyncEngine.safeSignIn(user);
          if (currentAuthUserId !== newUserId) return;
          if (syncRes && syncRes.success) {
            if (syncRes.restoredFromCloud || syncRes.action === 'hydrated_newer_cloud' || syncRes.action === 'reconciled_and_committed') {
              reloadLearnerWorkspace();
              showPlanConfirmation('Progress successfully synchronized across your devices!');
              return;
            }
          }
        } catch (syncErr) {
          console.warn('[AlgoRecall] Cloud sync check exception:', syncErr);
        }
      }

      if (currentAuthUserId !== newUserId) return;

      // 2. Check if user already has initialized data
      const alreadyHasData = repo && repo.hasUserData(newUserId);

      if (alreadyHasData) {
        // User already has existing isolated data
        if (repo) repo.setContext({ type: 'user', id: newUserId, email: user.email });
        reloadLearnerWorkspace();
      } else {
        // 3. Check if legacy unclaimed progress exists
        const legacyStats = migrator ? migrator.detectLegacyProgress() : { hasProgress: false };
        if (legacyStats.hasProgress && !legacyStats.isClaimed) {
          // Explicit prompt: User must confirm before assigning legacy data to their account
          showMigrationModal(user, legacyStats);
        } else {
          // Brand new account with no legacy progress to claim (e.g. friend)
          if (migrator) migrator.startFreshUser(newUserId, { email: user.email });
          if (repo) repo.setContext({ type: 'user', id: newUserId, email: user.email });
          reloadLearnerWorkspace();
        }
      }
    } else {
      // Guest mode transition
      if (currentAuthUserId !== null) {
        currentAuthUserId = null;
        if (repo) repo.setContext({ type: 'guest' });
        // Clean up in-memory test timer and ephemeral session
        if (testTimerInterval) {
          clearInterval(testTimerInterval);
          testTimerInterval = null;
        }
        activeTestSession = null;
        reloadLearnerWorkspace();
      }
    }
  }

  function reloadLearnerWorkspace() {
    loadData();
    if (window.RoadmapEngine) {
      window.RoadmapEngine.initProgress();
    }
    populateTopicDropdown();
    updateGamificationHeader();
    renderAll();
    checkAndRestoreActiveExamSession();
    checkAndRestoreActiveMockSession();
  }

  function showMigrationModal(user, legacyStats) {
    const modal = document.getElementById('migration-modal');
    if (!modal) {
      if (window.MigrationManager) window.MigrationManager.migrateLegacyToUser(user.id, { email: user.email });
      if (window.LearnerRepository) window.LearnerRepository.setContext({ type: 'user', id: user.id, email: user.email });
      reloadLearnerWorkspace();
      return;
    }

    const emailEl = document.getElementById('migration-modal-user-email');
    if (emailEl) emailEl.textContent = user.email || 'your account';

    const probEl = document.getElementById('migration-stat-problems');
    if (probEl) probEl.textContent = legacyStats.problemsPracticed || legacyStats.statesCount || 0;

    const masterEl = document.getElementById('migration-stat-mastered');
    if (masterEl) masterEl.textContent = legacyStats.masteredCount || 0;

    const xpEl = document.getElementById('migration-stat-xp');
    if (xpEl) xpEl.textContent = `${legacyStats.xp || 0} XP`;

    const levelEl = document.getElementById('migration-stat-level');
    if (levelEl) levelEl.textContent = legacyStats.level || 1;

    modal.classList.add('open');
  }

  function setupMigrationModalListeners() {
    const modal = document.getElementById('migration-modal');
    const btnClaim = document.getElementById('btn-migration-claim');
    const btnFresh = document.getElementById('btn-migration-fresh');

    btnClaim?.addEventListener('click', async () => {
      const user = window.AuthEngine ? window.AuthEngine.getUser() : null;
      if (!user) {
        modal?.classList.remove('open');
        return;
      }
      btnClaim.disabled = true;
      btnClaim.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Migrating...';

      try {
        if (window.MigrationManager) {
          const res = window.MigrationManager.migrateLegacyToUser(user.id, { email: user.email });
          if (!res.success && !res.alreadyMigrated) {
            alert(`Migration failed: ${res.error}`);
          }
        }
        if (window.LearnerRepository) {
          window.LearnerRepository.setContext({ type: 'user', id: user.id, email: user.email });
        }
        modal?.classList.remove('open');
        reloadLearnerWorkspace();
        showPlanConfirmation('Progress successfully linked to your account!');
      } catch (e) {
        alert('Migration error: ' + e.message);
      } finally {
        btnClaim.disabled = false;
        btnClaim.innerHTML = '<i class="fa-solid fa-link" style="margin-right:6px;"></i> Claim & Link Progress to Account';
      }
    });

    btnFresh?.addEventListener('click', async () => {
      const user = window.AuthEngine ? window.AuthEngine.getUser() : null;
      if (!user) {
        modal?.classList.remove('open');
        return;
      }
      btnFresh.disabled = true;
      try {
        if (window.MigrationManager) {
          window.MigrationManager.startFreshUser(user.id, { email: user.email });
        }
        if (window.LearnerRepository) {
          window.LearnerRepository.setContext({ type: 'user', id: user.id, email: user.email });
        }
        modal?.classList.remove('open');
        reloadLearnerWorkspace();
        showPlanConfirmation('Clean account initialized!');
      } catch (e) {
        alert('Start fresh error: ' + e.message);
      } finally {
        btnFresh.disabled = false;
      }
    });
  }

  async function initAuth() {
    if (authInitialized) return;
    authInitialized = true;

    setupAuthUIListeners();
    setupMigrationModalListeners();

    if (!window.AuthEngine) {
      updateAuthUI('GUEST', null, null);
      return;
    }

    try {
      // Listen for all auth events without re-triggering application init
      window.AuthEngine.onAuthStateChange((event, session, user) => {
        handleAuthStateTransition(event, session, user);
      });

      // Initialize engine & restore any persisted session
      const res = await window.AuthEngine.initialize();
      handleAuthStateTransition(res.status === 'authenticated' ? 'INITIAL_SESSION' : 'GUEST', res.session, res.user);
    } catch (err) {
      console.warn('[AlgoRecall] Auth initialization fallback to guest:', err);
      updateAuthUI('GUEST', null, null);
    }
  }

  function setupAuthUIListeners() {
    const btnHeaderAuth = document.getElementById('btn-header-auth');
    const authModal = document.getElementById('auth-modal');
    const btnCloseAuthModal = document.getElementById('btn-close-auth-modal');
    const btnAuthContinueGuest = document.getElementById('btn-auth-continue-guest');
    const headerUserPill = document.getElementById('header-user-pill');
    const authDropdown = document.getElementById('header-auth-dropdown');
    const btnHeaderAccountDetails = document.getElementById('btn-header-account-details');
    const btnHeaderSignout = document.getElementById('btn-header-signout');
    const btnModalSignout = document.getElementById('btn-modal-signout');
    const btnModalGoogleSignIn = document.getElementById('btn-modal-google-signin');

    // Open Auth Modal from Header Sign-In Pill
    btnHeaderAuth?.addEventListener('click', () => {
      authModal?.classList.add('open');
      loadQuickAccounts();
      const savedUser = localStorage.getItem('algorecall_saved_username');
      if (savedUser && usernameInput && !usernameInput.value) {
        usernameInput.value = savedUser;
      }
    });

    async function loadQuickAccounts() {
      const box = document.getElementById('auth-quick-accounts-box');
      const list = document.getElementById('auth-quick-accounts-list');
      const countBadge = document.getElementById('auth-quick-count');
      if (!box || !list) return;

      try {
        const res = await fetch('/api/auth/users');
        if (!res.ok) return;
        const data = await res.json();
        if (!data.success || !Array.isArray(data.users) || data.users.length === 0) {
          box.style.display = 'none';
          return;
        }

        if (countBadge) countBadge.textContent = `${data.users.length}/${data.maxUsers || 5}`;
        list.innerHTML = '';
        data.users.forEach(u => {
          const pill = document.createElement('button');
          pill.type = 'button';
          pill.className = 'btn btn-sm btn-secondary';
          pill.style.cssText = 'font-size:12px; padding:4px 10px; border-radius:20px; display:inline-flex; align-items:center; gap:6px; cursor:pointer; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); color:var(--text-main); transition:all 0.15s ease;';
          pill.innerHTML = `<i class="fa-solid fa-circle-user" style="color:var(--primary); font-size:12px;"></i> <span>${escapeHtml(u.displayName || u.username)}</span>`;
          pill.title = `Click to log in as ${u.username}`;
          pill.addEventListener('click', () => {
            if (usernameInput) usernameInput.value = u.username;
            setAuthMode(false);
            if (passwordInput) passwordInput.focus();
          });
          list.appendChild(pill);
        });
        box.style.display = 'block';
      } catch (_) {}
    }

    // Close Auth Modal
    btnCloseAuthModal?.addEventListener('click', () => {
      authModal?.classList.remove('open');
    });

    btnAuthContinueGuest?.addEventListener('click', () => {
      authModal?.classList.remove('open');
    });

    // Toggle User Account Dropdown
    headerUserPill?.addEventListener('click', (e) => {
      // If clicking inside the dropdown menu items, do not re-toggle pill
      if (e.target.closest('#header-auth-dropdown')) return;
      e.stopPropagation();
      const isOpen = authDropdown?.classList.toggle('open');
      headerUserPill.classList.toggle('open', isOpen);
      headerUserPill.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
      if (authDropdown && authDropdown.classList.contains('open')) {
        if (!e.target.closest('#header-user-pill') && !e.target.closest('#header-auth-dropdown')) {
          authDropdown.classList.remove('open');
          headerUserPill?.classList.remove('open');
          headerUserPill?.setAttribute('aria-expanded', 'false');
        }
      }
    });

    // Open Account Details Modal from Dropdown
    btnHeaderAccountDetails?.addEventListener('click', (e) => {
      e.stopPropagation();
      authDropdown?.classList.remove('open');
      headerUserPill?.classList.remove('open');
      headerUserPill?.setAttribute('aria-expanded', 'false');
      authModal?.classList.add('open');
    });

    // Sign Out from Dropdown or Modal
    async function handleSignOut(e) {
      if (e) e.stopPropagation();
      authDropdown?.classList.remove('open');
      headerUserPill?.classList.remove('open');
      headerUserPill?.setAttribute('aria-expanded', 'false');
      authModal?.classList.remove('open');

      const userIdToSignOut = currentAuthUserId;
      if (window.CloudSyncEngine && userIdToSignOut) {
        await window.CloudSyncEngine.safeSignOut(userIdToSignOut);
      } else if (window.AuthEngine) {
        await window.AuthEngine.signOut();
      }
    }

    btnHeaderSignout?.addEventListener('click', handleSignOut);
    btnModalSignout?.addEventListener('click', handleSignOut);

    // Google Sign-In Submission
    btnModalGoogleSignIn?.addEventListener('click', async () => {
      if (!window.AuthEngine || !window.AuthEngine.isConfigured()) {
        const warning = document.getElementById('auth-config-warning');
        if (warning) warning.style.display = 'block';
        return;
      }

      const label = document.getElementById('btn-google-signin-label');
      const originalText = label ? label.textContent : 'Sign in with Google';
      if (btnModalGoogleSignIn) btnModalGoogleSignIn.disabled = true;
      if (label) label.textContent = 'Connecting to Google...';

      try {
        const { error } = await window.AuthEngine.signInWithGoogle();
        if (error) {
          alert(`Google Sign-In Error: ${error.message || 'Authentication request failed.'}`);
          if (btnModalGoogleSignIn) btnModalGoogleSignIn.disabled = false;
          if (label) label.textContent = originalText;
        }
        // In OAuth redirect flow, browser redirects to Google.
      } catch (err) {
        alert(`Google Sign-In Error: ${err.message}`);
        if (btnModalGoogleSignIn) btnModalGoogleSignIn.disabled = false;
        if (label) label.textContent = originalText;
      }
    });

    // Local 5-User Authentication Tabs & Form
    let isRegisterMode = false;
    const tabLogin = document.getElementById('tab-auth-login');
    const tabRegister = document.getElementById('tab-auth-register');
    const displayNameGroup = document.getElementById('auth-displayname-group');
    const submitBtn = document.getElementById('btn-auth-credentials-submit');
    const submitLabel = document.getElementById('auth-submit-label');
    const credError = document.getElementById('auth-credentials-error');
    const usernameInput = document.getElementById('auth-input-username');
    const passwordInput = document.getElementById('auth-input-password');
    const displayNameInput = document.getElementById('auth-input-displayname');
    const credForm = document.getElementById('auth-credentials-form');

    function setAuthMode(register) {
      isRegisterMode = register;
      if (credError) { credError.style.display = 'none'; credError.textContent = ''; }
      if (register) {
        tabRegister?.classList.remove('btn-secondary');
        tabRegister?.classList.add('btn-primary');
        tabLogin?.classList.remove('btn-primary');
        tabLogin?.classList.add('btn-secondary');
        if (displayNameGroup) displayNameGroup.style.display = 'block';
        if (submitLabel) submitLabel.textContent = 'Create Account';
      } else {
        tabLogin?.classList.remove('btn-secondary');
        tabLogin?.classList.add('btn-primary');
        tabRegister?.classList.remove('btn-primary');
        tabRegister?.classList.add('btn-secondary');
        if (displayNameGroup) displayNameGroup.style.display = 'none';
        if (submitLabel) submitLabel.textContent = 'Sign In';
      }
    }

    tabLogin?.addEventListener('click', () => setAuthMode(false));
    tabRegister?.addEventListener('click', () => setAuthMode(true));

    async function handleCredentialSubmit(e) {
      if (e) e.preventDefault();
      if (credError) { credError.style.display = 'none'; credError.textContent = ''; }

      const username = usernameInput?.value.trim();
      const password = passwordInput?.value;
      const displayName = displayNameInput?.value.trim();

      if (!username || !password) {
        if (credError) {
          credError.textContent = 'Please enter both username and password.';
          credError.style.display = 'block';
        }
        return;
      }

      if (submitBtn) submitBtn.disabled = true;
      if (submitLabel) submitLabel.textContent = isRegisterMode ? 'Creating...' : 'Signing in...';

      try {
        let result;
        if (isRegisterMode) {
          result = await window.AuthEngine.signUpWithCredentials(username, password, displayName);
        } else {
          result = await window.AuthEngine.signInWithCredentials(username, password);
        }

        if (!result.success) {
          if (credError) {
            credError.textContent = result.error || 'Authentication failed.';
            credError.style.display = 'block';
          }
        } else {
          // Success! Save username if Remember Me is checked
          const rememberMe = document.getElementById('auth-remember-me');
          if (rememberMe && rememberMe.checked && username) {
            localStorage.setItem('algorecall_saved_username', username);
          } else if (rememberMe && !rememberMe.checked) {
            localStorage.removeItem('algorecall_saved_username');
          }

          // Clear inputs and close modal
          if (passwordInput) passwordInput.value = '';
          if (displayNameInput) displayNameInput.value = '';
          authModal?.classList.remove('open');
          loadQuickAccounts();
        }
      } catch (err) {
        if (credError) {
          credError.textContent = err.message || 'An unexpected error occurred.';
          credError.style.display = 'block';
        }
      } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (submitLabel) submitLabel.textContent = isRegisterMode ? 'Create Account' : 'Sign In';
      }
    }

    credForm?.addEventListener('submit', handleCredentialSubmit);
    submitBtn?.addEventListener('click', handleCredentialSubmit);
  }

  function updateAuthUI(event, session, user) {
    const btnHeaderAuth = document.getElementById('btn-header-auth');
    const headerUserPill = document.getElementById('header-user-pill');
    const headerUserName = document.getElementById('header-user-name');
    const headerUserAvatar = document.getElementById('header-user-avatar');
    const headerUserEmail = document.getElementById('header-user-email');
    const authModalUserEmail = document.getElementById('auth-modal-user-email');
    const authStatusMessage = document.getElementById('auth-status-message');
    const authSigninActionBox = document.getElementById('auth-signin-action-box');
    const authAccountDetails = document.getElementById('auth-account-details');
    const authConfigWarning = document.getElementById('auth-config-warning');
    const btnModalGoogleSignIn = document.getElementById('btn-modal-google-signin');

    const isAuthed = Boolean(user && session);
    const isConfigured = window.AuthEngine ? window.AuthEngine.isConfigured() : false;

    if (isAuthed) {
      // Authenticated State
      if (btnHeaderAuth) btnHeaderAuth.style.display = 'none';
      if (headerUserPill) headerUserPill.style.display = 'inline-flex';

      const email = user.email || 'learner@example.com';
      const meta = user.user_metadata || {};
      const fullName = meta.full_name || meta.name || meta.user_name || email.split('@')[0];
      const avatarUrl = meta.avatar_url || meta.picture || null;

      // Safe text injection
      if (headerUserName) headerUserName.textContent = fullName;
      if (headerUserEmail) headerUserEmail.textContent = email;
      if (authModalUserEmail) authModalUserEmail.textContent = email;

      // Safe avatar rendering
      if (headerUserAvatar) {
        if (avatarUrl && typeof avatarUrl === 'string' && (avatarUrl.startsWith('https://') || avatarUrl.startsWith('http://'))) {
          headerUserAvatar.innerHTML = '';
          const img = document.createElement('img');
          img.src = avatarUrl;
          img.alt = fullName;
          img.onerror = () => {
            headerUserAvatar.textContent = (fullName.charAt(0) || 'U').toUpperCase();
          };
          headerUserAvatar.appendChild(img);
        } else {
          headerUserAvatar.textContent = (fullName.charAt(0) || 'U').toUpperCase();
        }
      }

      if (authStatusMessage) {
        authStatusMessage.innerHTML = `You are signed in as <strong>${escapeHtml(fullName)}</strong>. Your learning progress is synced directly with your account.`;
      }

      if (authSigninActionBox) authSigninActionBox.style.display = 'none';
      if (authAccountDetails) authAccountDetails.style.display = 'flex';
      if (authConfigWarning) authConfigWarning.style.display = 'none';

    } else {
      // Guest / Unauthenticated State
      if (btnHeaderAuth) btnHeaderAuth.style.display = 'inline-flex';
      if (headerUserPill) {
        headerUserPill.style.display = 'none';
        headerUserPill.classList.remove('open');
        headerUserPill.setAttribute('aria-expanded', 'false');
      }
      const authDropdown = document.getElementById('header-auth-dropdown');
      if (authDropdown) authDropdown.classList.remove('open');

      if (authStatusMessage) {
        authStatusMessage.innerHTML = `You are currently preparing in <strong>Guest Mode</strong>. All problems, ratings, and SRS retention intervals are safely preserved in this browser.`;
      }

      if (authSigninActionBox) authSigninActionBox.style.display = 'flex';
      if (authAccountDetails) authAccountDetails.style.display = 'none';
      if (authConfigWarning) authConfigWarning.style.display = 'none';
    }
  }

  function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

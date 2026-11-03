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
      if (settings) {
        if (settings.theme) {
          document.documentElement.setAttribute('data-theme', settings.theme);
          const icon = document.getElementById('theme-toggle-icon');
          if (icon) {
            icon.className = settings.theme === 'light' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
          }
        }
        if (settings.reducedMotion) {
          document.documentElement.classList.add('reduce-motion');
        }
        if (settings.fontSize === 'large') {
          document.documentElement.classList.add('font-large');
        } else if (settings.fontSize === 'dyslexic') {
          document.documentElement.classList.add('font-dyslexic');
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
    setupGlobalKeyboardShortcuts();
    setupAnalyticsTimeFilterListeners();
    setupAnalyticsViewListeners();
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
          if (!match.subtopic && item.subtopic) match.subtopic = item.subtopic;
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
          item.subtopic = item.subtopic || 'Custom Practice';
          item.orderIndex = result.length + 1;
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
      topicSelect.innerHTML = `<option value="all">ðŸ“‚ All Topics (${allProblems.length})</option>`;
      topics.forEach(topic => {
        const opt = document.createElement('option');
        opt.value = topic;
        opt.textContent = `${topic} (${topicCounts[topic]})`;
        topicSelect.appendChild(opt);
      });

      if (currentSelected && (topics.includes(currentSelected) || currentSelected === 'all')) {
        topicSelect.value = currentSelected;
      }
      populateSubtopicsDropdown(topicSelect.value || 'all');
    } else {
      populateSubtopicsDropdown('all');
    }

    // Update Flashcard topic filter dropdown
    const fcTopicSelect = document.getElementById('flashcard-filter-topic');
    if (fcTopicSelect) {
      const currentFc = fcTopicSelect.value || 'due';
      fcTopicSelect.innerHTML = `
        <option value="due">âš¡ Problems Due for Review</option>
        <option value="all">ðŸ“š All Master Problems (${allProblems.length})</option>
      `;
      topics.forEach(topic => {
        const opt = document.createElement('option');
        opt.value = topic;
        opt.textContent = `ðŸ“‚ ${topic} (${topicCounts[topic]})`;
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
        opt.textContent = `ðŸ“‚ ${t} (${topicCounts[t]} Problems)`;
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
      compSelect.innerHTML = `<option value="all">ðŸ¢ All Companies (${allProblems.length})</option>`;
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

  function populateSubtopicsDropdown(selectedTopic) {
    const subtopicSelect = document.getElementById('filter-subtopic');
    if (!subtopicSelect) return;

    const currentSelected = subtopicSelect.value || 'all';
    const currentTopic = selectedTopic || document.getElementById('filter-topic')?.value || 'all';

    const relevantProblems = currentTopic === 'all'
      ? allProblems
      : allProblems.filter(p => SRSEngine.canonicalizeTopic(p.topic) === currentTopic);

    const subtopicCounts = new Map();
    relevantProblems.forEach(p => {
      const sub = p.subtopic || 'General';
      subtopicCounts.set(sub, (subtopicCounts.get(sub) || 0) + 1);
    });

    subtopicSelect.innerHTML = `<option value="all">ðŸ“‘ All Subtopics (${relevantProblems.length})</option>`;
    subtopicCounts.forEach((count, sub) => {
      const opt = document.createElement('option');
      opt.value = sub;
      opt.textContent = `${sub} (${count})`;
      subtopicSelect.appendChild(opt);
    });

    if (currentSelected && (subtopicCounts.has(currentSelected) || currentSelected === 'all')) {
      subtopicSelect.value = currentSelected;
    } else {
      subtopicSelect.value = 'all';
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
      } catch (_) { }

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

    // Render Charts (guarded when element is visible)
    const radarEl = document.getElementById('dashboard-radar-chart');
    if (radarEl && radarEl.offsetParent !== null && typeof DSACharts !== 'undefined' && typeof DSACharts.renderMasteryRadar === 'function') {
      DSACharts.renderMasteryRadar('dashboard-radar-chart', topicMasteryMap);
    }
    const barEl = document.getElementById('dashboard-bar-chart');
    if (barEl && barEl.offsetParent !== null && typeof DSACharts !== 'undefined' && typeof DSACharts.renderTopicBarChart === 'function') {
      DSACharts.renderTopicBarChart('dashboard-bar-chart', topicMasteryMap);
    }

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
        ? `<span class="conf-badge conf-${conf}" style="font-size:10.5px;" title="${SRSEngine.getConfidenceMeta(conf).label}">â­ ${conf}/5</span> `
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
    renderOrchestratorNextActionHero();
    renderDashboardOverviewCards();
    renderDashboardRightWidgets();
    renderDashboardProductivity();
    setupDashboardEventListeners();
    setupDashboardContinueLearning();
  }


  // --- PHASE 2: DASHBOARD INTEGRATION HELPERS ---

  function renderDashboardOverviewCards() {
    if (!window.RoadmapEngine) return;
    const todayPlan = (typeof RoadmapEngine.getTodayAuthoritativePlan === 'function')
      ? RoadmapEngine.getTodayAuthoritativePlan(allProblems, userStates)
      : null;
    const plan120 = (typeof RoadmapEngine.get120DayRoadmap === 'function')
      ? RoadmapEngine.get120DayRoadmap(userStates)
      : null;

    // 1. Today's Tasks
    let scheduledTasksCount = 0;
    let streamAScheduled = 0;
    let streamBScheduled = 0;
    let streamCScheduled = 0;

    if (todayPlan) {
      streamAScheduled = (todayPlan.streamA?.problemIds || todayPlan.streamA?.problems || []).length;
      streamBScheduled = (todayPlan.streamB?.problemIds || todayPlan.streamB?.problems || []).length;
      streamCScheduled = (todayPlan.streamC?.dueProblems || []).length;
      scheduledTasksCount = streamAScheduled + streamBScheduled + streamCScheduled;
    }

    const statTodayTasksEl = document.getElementById('stat-today-tasks-count');
    const statTodayTasksSubEl = document.getElementById('stat-today-tasks-sub');
    if (statTodayTasksEl) statTodayTasksEl.textContent = scheduledTasksCount;
    if (statTodayTasksSubEl) {
      if (scheduledTasksCount === 0) {
        statTodayTasksSubEl.textContent = 'All daily tasks completed!';
      } else {
        statTodayTasksSubEl.textContent = `${streamAScheduled} Learn · ${streamBScheduled} Revise · ${streamCScheduled} SRS Due`;
      }
    }

    // 2. Revision Due (Genuine reviews currently due from SRSEngine)
    let dueCount = 0;
    allProblems.forEach(p => {
      const state = userStates[p.id];
      if (SRSEngine.isDue(state)) dueCount++;
    });

    const statRevisionDueEl = document.getElementById('stat-revision-due-count');
    const statRevisionDueSubEl = document.getElementById('stat-revision-due-sub');
    if (statRevisionDueEl) statRevisionDueEl.textContent = dueCount;
    if (statRevisionDueSubEl) {
      statRevisionDueSubEl.textContent = dueCount === 0
        ? 'All SRS reviews up to date'
        : `${dueCount} problem${dueCount > 1 ? 's' : ''} require retention review`;
    }

    // 3. Completed Today (Unique problems solved today, avoid duplicate counting)
    const todayStr = (function() {
      const now = new Date();
      const yr = now.getFullYear();
      const mo = String(now.getMonth() + 1).padStart(2, '0');
      const da = String(now.getDate()).padStart(2, '0');
      return `${yr}-${mo}-${da}`;
    })();

    const solvedTodayIds = new Set();
    let timeSpentToday = 0;

    Object.entries(userStates).forEach(([probId, st]) => {
      if (!st || !st.lastReviewed) return;
      const reviewDateStr = (function(lr) {
        if (typeof lr === 'string' && lr.length >= 10) return lr.slice(0, 10);
        try {
          const d = new Date(lr);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        } catch (_) { return ''; }
      })(st.lastReviewed);

      if (reviewDateStr === todayStr) {
        solvedTodayIds.add(probId);
        timeSpentToday += 15;
      }
    });

    const statCompletedTodayEl = document.getElementById('stat-completed-today-count');
    const statCompletedTodaySubEl = document.getElementById('stat-completed-today-sub');
    if (statCompletedTodayEl) statCompletedTodayEl.textContent = solvedTodayIds.size;
    if (statCompletedTodaySubEl) {
      statCompletedTodaySubEl.textContent = solvedTodayIds.size === 0
        ? '0 min active study today'
        : `~${timeSpentToday} min active practice today`;
    }

    // 4. Roadmap Progress
    let completionPct = 0;
    let completedDaysCount = 0;
    let totalDaysCount = 120;
    let activeDayNum = todayPlan?.dayNumber || 1;

    if (plan120 && Array.isArray(plan120.days)) {
      totalDaysCount = plan120.days.length || 120;
      completedDaysCount = plan120.days.filter(d => d.isCompleted).length;
      completionPct = totalDaysCount > 0 ? Math.round((completedDaysCount / totalDaysCount) * 100) : 0;
    }

    const statProgressPctEl = document.getElementById('stat-roadmap-progress-pct');
    const statProgressDayPillEl = document.getElementById('stat-roadmap-day-pill');
    const statProgressBarEl = document.getElementById('stat-roadmap-progress-bar');
    const statProgressSubEl = document.getElementById('stat-roadmap-progress-sub');

    if (statProgressPctEl) statProgressPctEl.textContent = `${completionPct}%`;
    if (statProgressDayPillEl) statProgressDayPillEl.textContent = `Day ${activeDayNum} / ${totalDaysCount}`;
    if (statProgressBarEl) statProgressBarEl.style.width = `${completionPct}%`;
    if (statProgressSubEl) {
      const trackName = (RoadmapEngine.progress?.activeTrack === 'dual_stream_120')
        ? '120-Day Dual-Stream'
        : (RoadmapEngine.progress?.activeTrack === 'pedagogical_120' ? '120-Day Pedagogical' : 'Active Track');
      statProgressSubEl.textContent = `${trackName} · ${completedDaysCount} of ${totalDaysCount} days complete`;
    }
  }

  function renderDashboardRightWidgets() {
    if (!window.RoadmapEngine) return;
    const activeTrack = RoadmapEngine.progress?.activeTrack || 'dual_stream_120';
    const plan120 = (typeof RoadmapEngine.get120DayRoadmap === 'function')
      ? RoadmapEngine.get120DayRoadmap(userStates)
      : null;
    const todayPlan = (typeof RoadmapEngine.getTodayAuthoritativePlan === 'function')
      ? RoadmapEngine.getTodayAuthoritativePlan(allProblems, userStates)
      : null;
    const curProg = (typeof RoadmapEngine.getCurriculumProgress === 'function')
      ? RoadmapEngine.getCurriculumProgress(userStates)
      : null;

    // 1. Current Roadmap Widget
    const totalDays = plan120?.days?.length || 120;
    const completedDays = plan120?.days?.filter(d => d.isCompleted)?.length || 0;
    const completionPct = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
    const dayNum = todayPlan?.dayNumber || curProg?.currentCurriculumDay || 1;

    const widgetBadge = document.getElementById('widget-roadmap-badge');
    const widgetTrackName = document.getElementById('widget-roadmap-track-name');
    const widgetPct = document.getElementById('widget-roadmap-pct');
    const widgetFill = document.getElementById('widget-roadmap-fill');
    const widgetMilestoneTitle = document.getElementById('widget-milestone-title');
    const widgetMilestoneSub = document.getElementById('widget-milestone-sub');

    if (widgetBadge) widgetBadge.textContent = `Day ${dayNum}`;
    if (widgetTrackName) {
      widgetTrackName.textContent = activeTrack === 'dual_stream_120'
        ? '120-Day Dual-Stream Roadmap'
        : (activeTrack === 'pedagogical_120' ? '120-Day Pedagogical Roadmap' : 'DSA Roadmap');
    }
    if (widgetPct) widgetPct.textContent = `${completionPct}%`;
    if (widgetFill) widgetFill.style.width = `${completionPct}%`;

    if (widgetMilestoneTitle) {
      widgetMilestoneTitle.textContent = (curProg && curProg.activeMilestoneTopic) || todayPlan?.streamA?.topic || 'Trees & BST';
    }
    if (widgetMilestoneSub) {
      widgetMilestoneSub.textContent = (curProg && curProg.activeMilestoneSubtopic) || todayPlan?.streamA?.subtopic || 'Binary tree node structure & DFS traversals';
    }

    // 2. Topic Mastery Widget (Top 4 topics by activity / importance)
    const topicMasteryListEl = document.getElementById('widget-topic-mastery-list');
    const widgetMasteryOverallBadge = document.getElementById('widget-mastery-overall-badge');

    if (topicMasteryListEl && window.SRSEngine) {
      const topicMasteryMap = SRSEngine.calculateTopicMastery(allProblems, userStates);
      const masteryEntries = Object.entries(topicMasteryMap);
      
      const avgMastery = masteryEntries.length > 0
        ? Math.round(masteryEntries.reduce((acc, [, val]) => acc + (val.score || 0), 0) / masteryEntries.length)
        : 0;
      if (widgetMasteryOverallBadge) {
        widgetMasteryOverallBadge.textContent = `${avgMastery}% Avg`;
      }

      masteryEntries.sort((a, b) => {
        const aAttempted = (a[1].solvedCount || 0) > 0 ? 1 : 0;
        const bAttempted = (b[1].solvedCount || 0) > 0 ? 1 : 0;
        if (aAttempted !== bAttempted) return bAttempted - aAttempted;
        return (b[1].score || 0) - (a[1].score || 0);
      });

      const top4Topics = masteryEntries.slice(0, 4);
      topicMasteryListEl.innerHTML = top4Topics.map(([topicName, data]) => {
        const score = data.score || 0;
        const barColor = score >= 70 ? '#10b981' : (score >= 40 ? '#6366f1' : '#f59e0b');
        return `
          <div class="widget-topic-row">
            <div class="widget-topic-info">
              <span class="widget-topic-name">${escapeHtml(topicName)}</span>
              <span class="widget-topic-pct" style="color:${barColor}; font-weight:700;">${score}%</span>
            </div>
            <div class="widget-topic-bar-track">
              <div class="widget-topic-bar-fill" style="width:${score}%; background:${barColor};"></div>
            </div>
          </div>
        `;
      }).join('');
    }

    // 3. Weekly Activity Widget (Past 7 Days)
    const weeklyStripEl = document.getElementById('widget-weekly-strip');
    const streakBadgeEl = document.getElementById('widget-streak-badge');
    const weeklySolvedCountEl = document.getElementById('widget-weekly-solved-count');
    const weeklyTimeSpentEl = document.getElementById('widget-weekly-time-spent');

    if (weeklyStripEl) {
      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = new Date();
      const currentDayIdx = today.getDay();

      const mondayOffset = (currentDayIdx === 0 ? -6 : 1 - currentDayIdx);
      const weekDates = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + mondayOffset + i);
        const yr = d.getFullYear();
        const mo = String(d.getMonth() + 1).padStart(2, '0');
        const da = String(d.getDate()).padStart(2, '0');
        weekDates.push({
          dateStr: `${yr}-${mo}-${da}`,
          dayLabel: daysOfWeek[d.getDay()],
          isToday: d.toDateString() === today.toDateString(),
          isPast: d <= today
        });
      }

      let weeklySolvedCount = 0;
      const solvedDateCounts = {};

      Object.values(userStates).forEach(st => {
        if (!st || !st.lastReviewed) return;
        let dStr = '';
        if (typeof st.lastReviewed === 'string' && st.lastReviewed.length >= 10) {
          dStr = st.lastReviewed.slice(0, 10);
        } else {
          try {
            const dt = new Date(st.lastReviewed);
            dStr = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
          } catch (_) {}
        }
        if (dStr) {
          solvedDateCounts[dStr] = (solvedDateCounts[dStr] || 0) + 1;
        }
      });

      let currentStreak = 0;
      const checkDate = new Date(today);
      while (true) {
        const yr = checkDate.getFullYear();
        const mo = String(checkDate.getMonth() + 1).padStart(2, '0');
        const da = String(checkDate.getDate()).padStart(2, '0');
        const dStr = `${yr}-${mo}-${da}`;
        if (solvedDateCounts[dStr] && solvedDateCounts[dStr] > 0) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else if (dStr === weekDates.find(w => w.isToday)?.dateStr && currentStreak === 0) {
          checkDate.setDate(checkDate.getDate() - 1);
          const yStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
          if (solvedDateCounts[yStr] && solvedDateCounts[yStr] > 0) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        } else {
          break;
        }
      }

      weeklyStripEl.innerHTML = weekDates.map(w => {
        const count = solvedDateCounts[w.dateStr] || 0;
        if (w.isPast) weeklySolvedCount += count;
        const isActive = count > 0;
        const activeClass = isActive ? 'active' : (w.isToday ? 'today' : '');
        return `
          <div class="widget-day-pill ${activeClass}" title="${w.dateStr}: ${count} problems solved">
            <span class="day-letter">${w.dayLabel.slice(0, 1)}</span>
            <span class="day-count">${count > 0 ? count : (w.isToday ? '•' : '0')}</span>
          </div>
        `;
      }).join('');

      if (streakBadgeEl) streakBadgeEl.textContent = `${currentStreak} Day Streak`;
      if (weeklySolvedCountEl) weeklySolvedCountEl.textContent = weeklySolvedCount;
      if (weeklyTimeSpentEl) weeklyTimeSpentEl.textContent = `${weeklySolvedCount * 15}m`;
    }
  }

  // --- DASHBOARD PRODUCTIVITY COMMAND CENTER ---
  let dashProblemFilter = 'all'; // 'all' | 'remaining' | 'completed' | 'bookmarked' | 'weak' | 'stream-a' | 'stream-b'
  let dashProblemSort = 'assigned'; // 'assigned' | 'difficulty' | 'status'
  let dashProblemSearch = '';
  let dashShowCompleted = true;
  let dashStreamACollapsed = false;
  let dashStreamBCollapsed = false;
  let dashRevisionFilter = 'all'; // 'all' | 'overdue' | 'today'
  let dashRevisionSearch = '';
  let dashActiveNotesProblemId = null;
  let _dashListenersWired = false;

  function renderDashboardProductivity() {
    // 1. Current Date
    const dateTextEl = document.getElementById('dash-date-string');
    if (dateTextEl) {
      const now = new Date();
      const options = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
      dateTextEl.textContent = now.toLocaleDateString('en-US', options);
    }

    // 2. User Context
    const userTextEl = document.getElementById('dash-user-name-text');
    if (userTextEl) {
      let userName = 'Guest Learner';
      try {
        if (window.LearnerRepository && typeof window.LearnerRepository.getActiveContext === 'function') {
          const ctx = window.LearnerRepository.getActiveContext();
          if (ctx && ctx.user && ctx.user.email) {
            userName = ctx.user.email.split('@')[0];
          } else if (ctx && ctx.isGuest) {
            userName = 'Guest Learner';
          }
        }
      } catch (_) {}
      userTextEl.textContent = userName;
    }

    // 3. Roadmap & Day Resolution
    if (!window.RoadmapEngine) return;
    const activeTrackId = (typeof RoadmapEngine.getActiveRoadmapId === 'function')
      ? RoadmapEngine.getActiveRoadmapId()
      : 'dual_stream_120';
    const plan120 = (typeof RoadmapEngine.get120DayRoadmap === 'function')
      ? RoadmapEngine.get120DayRoadmap(userStates)
      : null;
    const todayPlan = (typeof RoadmapEngine.getTodayAuthoritativePlan === 'function')
      ? RoadmapEngine.getTodayAuthoritativePlan(allProblems, userStates)
      : null;

    const dayNumber = todayPlan?.dayNumber || 1;
    const totalDays = plan120?.days?.length || 120;
    const activeDay = (plan120?.days && plan120.days.length > 0)
      ? (plan120.days.find(d => (d.sequenceIndex || d.dayNumber) === dayNumber) || plan120.days[0])
      : null;

    // Track Name
    const trackName = activeTrackId === 'pedagogical_120' ? '120-Day Pedagogical Roadmap' : '120-Day Dual-Stream Roadmap';
    const ctxRoadmapEl = document.getElementById('dash-context-roadmap-name');
    if (ctxRoadmapEl) ctxRoadmapEl.textContent = trackName;
    const badgeRoadmapEl = document.getElementById('dash-roadmap-title');
    if (badgeRoadmapEl) badgeRoadmapEl.innerHTML = `<i class="fa-solid fa-map"></i> ${trackName}`;

    // Day Badges
    const ctxDayEl = document.getElementById('dash-context-day-badge');
    if (ctxDayEl) ctxDayEl.textContent = `Day ${dayNumber} of ${totalDays}`;
    const badgeDayEl = document.getElementById('dash-day-number-badge');
    if (badgeDayEl) badgeDayEl.innerHTML = `<i class="fa-solid fa-calendar-day"></i> Day ${dayNumber} of ${totalDays}`;

    // Extract Stream A & Stream B problems
    let streamAProblems = [];
    if (todayPlan?.streamA?.problems && todayPlan.streamA.problems.length > 0) {
      streamAProblems = todayPlan.streamA.problems;
    } else if (todayPlan?.streamA?.problemIds && todayPlan.streamA.problemIds.length > 0) {
      streamAProblems = todayPlan.streamA.problemIds.map(id => allProblems.find(p => p.id === id)).filter(Boolean);
    } else if (activeDay?.streams?.current_learning?.problemIds && activeDay.streams.current_learning.problemIds.length > 0) {
      streamAProblems = activeDay.streams.current_learning.problemIds.map(id => allProblems.find(p => p.id === id)).filter(Boolean);
    } else if (activeDay?.tasks) {
      const aTask = activeDay.tasks.find(t => t.stream === 'current_learning');
      if (aTask?.problemIds) {
        streamAProblems = aTask.problemIds.map(id => allProblems.find(p => p.id === id)).filter(Boolean);
      }
    }

    let streamBProblems = [];
    if (todayPlan?.streamB?.problems && todayPlan.streamB.problems.length > 0) {
      streamBProblems = todayPlan.streamB.problems;
    } else if (todayPlan?.streamB?.problemIds && todayPlan.streamB.problemIds.length > 0) {
      streamBProblems = todayPlan.streamB.problemIds.map(id => allProblems.find(p => p.id === id)).filter(Boolean);
    } else if (activeDay?.streams?.foundation_revision?.problemIds && activeDay.streams.foundation_revision.problemIds.length > 0) {
      streamBProblems = activeDay.streams.foundation_revision.problemIds.map(id => allProblems.find(p => p.id === id)).filter(Boolean);
    } else if (activeDay?.tasks) {
      const bTask = activeDay.tasks.find(t => t.stream === 'foundation_revision');
      if (bTask?.problemIds) {
        streamBProblems = bTask.problemIds.map(id => allProblems.find(p => p.id === id)).filter(Boolean);
      }
    }

    // Topics & Subtopics
    const streamATopic = todayPlan?.streamA?.topic || activeDay?.streams?.current_learning?.topic || 'Binary Trees & BST';
    const streamASubtopic = todayPlan?.streamA?.subtopic || activeDay?.streams?.current_learning?.subtopic || 'Binary tree node structure & DFS traversals';
    const streamBTopic = todayPlan?.streamB?.topic || activeDay?.streams?.foundation_revision?.topic || 'Arrays & Hashing';
    const streamBSubtopic = todayPlan?.streamB?.subtopic || activeDay?.streams?.foundation_revision?.subtopic || 'Revision: Arrays & Hashing';

    const ctxTopicEl = document.getElementById('dash-context-topic');
    if (ctxTopicEl) ctxTopicEl.textContent = `${streamATopic}${streamASubtopic ? ' · ' + streamASubtopic : ''}`;

    const dayTopicTitleEl = document.getElementById('dash-day-topic-title');
    if (dayTopicTitleEl) dayTopicTitleEl.textContent = streamATopic;
    const dayTopicDescEl = document.getElementById('dash-day-topic-desc');
    if (dayTopicDescEl) dayTopicDescEl.textContent = streamASubtopic || 'Master daily core algorithms and data structures through deliberate practice.';

    const streamASubTagEl = document.getElementById('stream-a-subtopic-tag');
    if (streamASubTagEl) streamASubTagEl.textContent = streamASubtopic;
    const streamBSubTagEl = document.getElementById('stream-b-subtopic-tag');
    if (streamBSubTagEl) streamBSubTagEl.textContent = streamBSubtopic;

    // Workload Estimates
    const streamAEst = (streamAProblems.length * 25) || 75;
    const streamBEst = (streamBProblems.length * 20) || 40;
    const plannedWorkload = streamAEst + streamBEst;

    const streamAWorkloadEl = document.getElementById('stream-a-workload-badge');
    if (streamAWorkloadEl) streamAWorkloadEl.textContent = `~${streamAEst}m`;
    const streamBWorkloadEl = document.getElementById('stream-b-workload-badge');
    if (streamBWorkloadEl) streamBWorkloadEl.textContent = `~${streamBEst}m`;

    const streamACountEl = document.getElementById('stream-a-count-badge');
    if (streamACountEl) streamACountEl.textContent = `${streamAProblems.length} Problem${streamAProblems.length !== 1 ? 's' : ''}`;
    const streamBCountEl = document.getElementById('stream-b-count-badge');
    if (streamBCountEl) streamBCountEl.textContent = `${streamBProblems.length} Problem${streamBProblems.length !== 1 ? 's' : ''}`;

    // Completion Status
    const isProbSolved = (p) => {
      if (!p) return false;
      const st = userStates[p.id];
      return Boolean(st && (st.lastReviewed || st.solved));
    };

    const streamASolved = streamAProblems.filter(isProbSolved).length;
    const streamBSolved = streamBProblems.filter(isProbSolved).length;
    const totalAssigned = streamAProblems.length + streamBProblems.length;
    const totalCompleted = streamASolved + streamBSolved;
    const totalRemaining = totalAssigned - totalCompleted;
    const completionPct = totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 100;
    const remainingWorkload = Math.max(0, ((streamAProblems.length - streamASolved) * 25) + ((streamBProblems.length - streamBSolved) * 20));

    // Context bar updates
    const ctxCompTextEl = document.getElementById('dash-context-completion-text');
    if (ctxCompTextEl) ctxCompTextEl.textContent = `${totalCompleted} / ${totalAssigned} Completed`;
    const ctxMiniProgEl = document.getElementById('dash-context-mini-progress');
    if (ctxMiniProgEl) ctxMiniProgEl.style.width = `${completionPct}%`;
    const ctxWorkloadEl = document.getElementById('dash-context-workload-text');
    if (ctxWorkloadEl) ctxWorkloadEl.textContent = remainingWorkload > 0 ? `~${remainingWorkload}m remaining` : 'Done for today!';

    // Day Header Workload Badges
    const badgePlannedEl = document.getElementById('dash-workload-planned');
    if (badgePlannedEl) badgePlannedEl.innerHTML = `<i class="fa-solid fa-clock"></i> ~${plannedWorkload}m planned`;
    const badgeRemainingEl = document.getElementById('dash-workload-remaining');
    if (badgeRemainingEl) badgeRemainingEl.innerHTML = `<i class="fa-solid fa-hourglass-half"></i> ${remainingWorkload > 0 ? `~${remainingWorkload}m remaining` : '0m remaining'}`;

    // Status Pill
    const statusPillEl = document.getElementById('dash-day-status-pill');
    if (statusPillEl) {
      statusPillEl.className = 'dash-badge-status';
      if (totalCompleted === totalAssigned && totalAssigned > 0) {
        statusPillEl.classList.add('completed');
        statusPillEl.textContent = 'Completed';
      } else if (totalCompleted > 0) {
        statusPillEl.classList.add('in-progress');
        statusPillEl.textContent = 'In Progress';
      } else {
        statusPillEl.classList.add('not-started');
        statusPillEl.textContent = 'Not Started';
      }
    }

    // Daily Progress Bar
    const progTextEl = document.getElementById('dash-day-progress-text');
    if (progTextEl) progTextEl.textContent = `${totalCompleted} of ${totalAssigned} Completed`;
    const progPctEl = document.getElementById('dash-day-progress-percent');
    if (progPctEl) progPctEl.textContent = `${completionPct}%`;
    const progFillEl = document.getElementById('dash-day-progress-bar');
    if (progFillEl) progFillEl.style.width = `${completionPct}%`;

    // Celebration & Buffer Banners
    const celebBanner = document.getElementById('day-completed-celebration-banner');
    if (celebBanner) {
      celebBanner.style.display = (totalCompleted === totalAssigned && totalAssigned > 0) ? 'flex' : 'none';
    }
    const bufferCard = document.getElementById('day-buffer-empty-card');
    if (bufferCard) {
      bufferCard.style.display = (activeDay?.isBufferDay || activeDay?.dayType === 'buffer') ? 'flex' : 'none';
    }

    // 4. Session Recovery Banner Detection
    const sessionBanner = document.getElementById('dash-session-recovery-banner');
    const sessionTitle = document.getElementById('dash-session-recovery-title');
    const sessionDesc = document.getElementById('dash-session-recovery-desc');
    const btnResume = document.getElementById('btn-dash-resume-session');

    let activeSession = null;
    let sessionType = null; // 'trainer' | 'revision'

    if (window.SolutionDiscoveryController && typeof window.SolutionDiscoveryController.getActiveSession === 'function') {
      const s = window.SolutionDiscoveryController.getActiveSession();
      if (s && s.status !== 'completed' && s.status !== 'abandoned' && s.problemId) {
        activeSession = s;
        sessionType = 'trainer';
      }
    }
    if (!activeSession && window.RevisionSessionController && typeof window.RevisionSessionController.getActiveSession === 'function') {
      const s = window.RevisionSessionController.getActiveSession();
      if (s && s.status !== 'completed' && s.status !== 'discarded' && Array.isArray(s.problemIds) && s.problemIds.length > 0) {
        activeSession = s;
        sessionType = 'revision';
      }
    }

    if (sessionBanner && sessionBanner.dataset.dismissed !== 'true') {
      if (sessionType === 'trainer') {
        sessionBanner.style.display = 'flex';
        const prob = allProblems.find(p => p.id === activeSession.problemId);
        if (sessionTitle) sessionTitle.textContent = 'In-Progress Solution Trainer Session';
        if (sessionDesc) sessionDesc.innerHTML = `Active discovery session for <strong>${prob?.title || activeSession.problemId}</strong>. Pick up where you left off.`;
        if (btnResume) {
          btnResume.onclick = () => {
            window.SolutionDiscoveryController.openModal(activeSession.problemId);
          };
        }
      } else if (sessionType === 'revision') {
        sessionBanner.style.display = 'flex';
        if (sessionTitle) sessionTitle.textContent = 'In-Progress Active Recall Revision Session';
        if (sessionDesc) sessionDesc.innerHTML = `Active recall queue (${activeSession.currentIndex + 1} of ${activeSession.problemIds.length} cards). Continue your retention review.`;
        if (btnResume) {
          btnResume.onclick = () => {
            if (typeof renderActiveRecallSessionModal === 'function') {
              activeRecallSessionState = activeSession;
              renderActiveRecallSessionModal();
            }
          };
        }
      } else {
        sessionBanner.style.display = 'none';
      }
    }

    // 5. Revision Metrics & Checklist
    let revMetrics = { overdueCount: 0, dueTodayCount: 0, dueNowCount: 0, totalDue: 0 };
    if (window.RevisionSessionController && typeof window.RevisionSessionController.getRevisionMetrics === 'function') {
      const rawMetrics = window.RevisionSessionController.getRevisionMetrics(allProblems, userStates);
      const totalDue = (typeof rawMetrics.dueNowCount === 'number')
        ? rawMetrics.dueNowCount
        : ((rawMetrics.overdueCount || 0) + (rawMetrics.dueTodayCount || 0));
      revMetrics = Object.assign({}, rawMetrics, { totalDue });
    } else {
      let dCount = 0;
      allProblems.forEach(p => { if (SRSEngine.isDue(userStates[p.id])) dCount++; });
      revMetrics = { overdueCount: dCount, dueTodayCount: 0, dueNowCount: dCount, totalDue: dCount };
    }

    // Compact Checklist elements
    const checkAStat = document.getElementById('check-stat-stream-a');
    if (checkAStat) checkAStat.textContent = `${streamASolved}/${streamAProblems.length}`;
    const checkAIcon = document.getElementById('check-icon-stream-a');
    if (checkAIcon) checkAIcon.className = (streamASolved === streamAProblems.length && streamAProblems.length > 0) ? 'fa-solid fa-square-check' : 'fa-regular fa-square';

    const checkBStat = document.getElementById('check-stat-stream-b');
    if (checkBStat) checkBStat.textContent = `${streamBSolved}/${streamBProblems.length}`;
    const checkBIcon = document.getElementById('check-icon-stream-b');
    if (checkBIcon) checkBIcon.className = (streamBSolved === streamBProblems.length && streamBProblems.length > 0) ? 'fa-solid fa-square-check' : 'fa-regular fa-square';

    const checkCStat = document.getElementById('check-stat-stream-c');
    if (checkCStat) checkCStat.textContent = `${revMetrics.totalDue} due`;
    const checkCIcon = document.getElementById('check-icon-stream-c');
    if (checkCIcon) checkCIcon.className = (revMetrics.totalDue === 0) ? 'fa-solid fa-square-check' : 'fa-regular fa-square';

    // 6. Filter & Render Day-Wise Problems
    renderDashboardProblemLists(streamAProblems, streamBProblems);

    // 7. Render Revision Queue
    renderDashboardRevisionQueue(revMetrics);
  }

  function renderDashboardProblemLists(streamAProblems, streamBProblems) {
    const isProbSolved = (p) => {
      if (!p) return false;
      const st = userStates[p.id];
      return Boolean(st && (st.lastReviewed || st.solved));
    };

    const isProbWeak = (p) => {
      if (!p) return false;
      const st = userStates[p.id];
      if (!st) return false;
      if (window.RevisionSessionController && typeof window.RevisionSessionController.isWeak === 'function') {
        return window.RevisionSessionController.isWeak(st);
      }
      return Boolean((st.confidence && st.confidence <= 2) || st.lastRating === 'failed');
    };

    const isProbBookmarked = (p) => {
      if (!p) return false;
      const st = userStates[p.id];
      return Boolean(st && (st.isBookmarked || st.bookmarked));
    };

    // Calculate filter count stats across all assigned problems
    const allAssigned = [...streamAProblems, ...streamBProblems];
    const totalCount = allAssigned.length;
    const remainingCount = allAssigned.filter(p => !isProbSolved(p)).length;
    const completedCount = allAssigned.filter(isProbSolved).length;
    const bookmarkedCount = allAssigned.filter(isProbBookmarked).length;
    const weakCount = allAssigned.filter(isProbWeak).length;

    const elCountAll = document.getElementById('dash-filter-count-all');
    if (elCountAll) elCountAll.textContent = totalCount;
    const elCountRem = document.getElementById('dash-filter-count-remaining');
    if (elCountRem) elCountRem.textContent = remainingCount;
    const elCountComp = document.getElementById('dash-filter-count-completed');
    if (elCountComp) elCountComp.textContent = completedCount;
    const elCountBm = document.getElementById('dash-filter-count-bookmarked');
    if (elCountBm) elCountBm.textContent = bookmarkedCount;
    const elCountWeak = document.getElementById('dash-filter-count-weak');
    if (elCountWeak) elCountWeak.textContent = weakCount;

    // Filter predicate
    const matchesFilter = (p, streamName) => {
      if (!p) return false;
      const solved = isProbSolved(p);

      // Show/hide completed toggle
      if (!dashShowCompleted && dashProblemFilter !== 'completed' && solved) {
        return false;
      }

      // Filter tabs
      if (dashProblemFilter === 'stream-a' && streamName !== 'stream-a') return false;
      if (dashProblemFilter === 'stream-b' && streamName !== 'stream-b') return false;
      if (dashProblemFilter === 'remaining' && solved) return false;
      if (dashProblemFilter === 'completed' && !solved) return false;
      if (dashProblemFilter === 'bookmarked' && !isProbBookmarked(p)) return false;
      if (dashProblemFilter === 'weak' && !isProbWeak(p)) return false;

      // Search term
      if (dashProblemSearch) {
        const q = dashProblemSearch.toLowerCase();
        const titleMatch = (p.title || '').toLowerCase().includes(q);
        const idMatch = (p.id || '').toLowerCase().includes(q);
        const topicMatch = (p.topic || '').toLowerCase().includes(q);
        const patternMatch = (p.pattern || '').toLowerCase().includes(q);
        if (!titleMatch && !idMatch && !topicMatch && !patternMatch) return false;
      }

      return true;
    };

    // Sorting comparator
    const sortComparator = (a, b) => {
      if (dashProblemSort === 'difficulty') {
        const diffWeight = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
        const wA = diffWeight[a.difficulty] || 2;
        const wB = diffWeight[b.difficulty] || 2;
        return wA - wB;
      }
      if (dashProblemSort === 'status') {
        const sA = isProbSolved(a) ? 1 : 0;
        const sB = isProbSolved(b) ? 1 : 0;
        return sA - sB; // unsolved first
      }
      return 0; // assigned order preserved
    };

    let filteredA = streamAProblems.filter(p => matchesFilter(p, 'stream-a'));
    let filteredB = streamBProblems.filter(p => matchesFilter(p, 'stream-b'));

    if (dashProblemSort !== 'assigned') {
      filteredA = [...filteredA].sort(sortComparator);
      filteredB = [...filteredB].sort(sortComparator);
    }

    // Matching count indicator
    const matchCountEl = document.getElementById('dash-problem-match-count');
    if (matchCountEl) {
      matchCountEl.textContent = `Showing ${filteredA.length + filteredB.length} of ${totalCount} problems`;
    }

    // Render Stream A Rows
    const listAEl = document.getElementById('stream-a-problems-list');
    const containerAEl = document.getElementById('stream-a-problems-container');
    if (listAEl && containerAEl) {
      if (dashProblemFilter === 'stream-b') {
        containerAEl.style.display = 'none';
      } else {
        containerAEl.style.display = 'block';
        listAEl.style.display = dashStreamACollapsed ? 'none' : 'flex';
        if (filteredA.length === 0) {
          listAEl.innerHTML = `<div class="dash-empty-filter-note" style="padding:14px; text-align:center; color:var(--text-muted); font-size:13px;">No Stream A problems match the active filter or search.</div>`;
        } else {
          listAEl.innerHTML = filteredA.map(p => renderDashboardProblemRow(p)).join('');
        }
      }
    }

    // Render Stream B Rows
    const listBEl = document.getElementById('stream-b-problems-list');
    const containerBEl = document.getElementById('stream-b-problems-container');
    if (listBEl && containerBEl) {
      if (dashProblemFilter === 'stream-a' || (streamBProblems.length === 0 && !dashProblemSearch)) {
        containerBEl.style.display = 'none';
      } else {
        containerBEl.style.display = 'block';
        listBEl.style.display = dashStreamBCollapsed ? 'none' : 'flex';
        if (filteredB.length === 0) {
          listBEl.innerHTML = `<div class="dash-empty-filter-note" style="padding:14px; text-align:center; color:var(--text-muted); font-size:13px;">No Stream B problems match the active filter or search.</div>`;
        } else {
          listBEl.innerHTML = filteredB.map(p => renderDashboardProblemRow(p)).join('');
        }
      }
    }
  }

  function renderDashboardProblemRow(p) {
    if (!p) return '';
    const st = userStates[p.id];
    const isSolved = Boolean(st && (st.lastReviewed || st.solved));
    const isBookmarked = Boolean(st && (st.isBookmarked || st.bookmarked));
    const isWeak = Boolean(window.RevisionSessionController ? window.RevisionSessionController.isWeak(st) : ((st?.confidence && st.confidence <= 2) || st?.lastRating === 'failed'));
    const hasNotes = Boolean((st?.quickNotes && Object.values(st.quickNotes).some(v => typeof v === 'string' && v.trim().length > 0)) || (st?.notes && st.notes.trim().length > 0));
    const diffClass = `badge-diff-${(p.difficulty || 'medium').toLowerCase()}`;
    const directUrl = (p.url && p.url.startsWith('http')) ? p.url : null;

    return `
      <div class="dash-problem-row ${isSolved ? 'solved' : ''}" data-id="${p.id}" id="dash-row-${p.id}">
        <div class="dash-prob-left">
          <button type="button" class="btn-prob-check btn-action-toggle-solve" data-id="${p.id}" title="${isSolved ? 'Mark as Unsolved' : 'Mark as Solved'}" aria-label="${isSolved ? 'Mark as Unsolved' : 'Mark as Solved'}">
            <i class="${isSolved ? 'fa-solid fa-circle-check text-success' : 'fa-regular fa-circle'}"></i>
          </button>
          <div class="dash-prob-info">
            <div class="dash-prob-title-row">
              <a href="${directUrl || '#'}" target="_blank" rel="noopener noreferrer" class="dash-problem-title ${!directUrl ? 'url-disabled' : ''}" data-id="${p.id}">
                ${p.title} <i class="fa-solid fa-arrow-up-right-from-square"></i>
              </a>
              <span class="badge badge-prob-id">${p.id}</span>
              <span class="${diffClass}">${p.difficulty || 'Medium'}</span>
              ${isWeak ? '<span class="badge-prob-weak" title="Identified struggle or low confidence"><i class="fa-solid fa-triangle-exclamation"></i> Weak</span>' : ''}
              ${hasNotes ? '<span class="badge-prob-notes" title="Mistake notes captured"><i class="fa-solid fa-note-sticky"></i> Notes</span>' : ''}
            </div>
            <div class="dash-prob-tags">
              <span class="badge badge-topic" style="background:rgba(255,255,255,0.05); color:#94a3b8; font-size:11px; padding:2px 7px; border-radius:4px;">${p.topic || 'General'}</span>
              ${p.pattern ? `<span class="badge badge-pattern" style="font-size:11px; padding:2px 7px; border-radius:4px;">${p.pattern}</span>` : ''}
            </div>
          </div>
        </div>
        <div class="dash-prob-actions">
          <button type="button" class="btn-prob-bookmark btn-action-bookmark ${isBookmarked ? 'bookmarked' : ''}" data-id="${p.id}" title="${isBookmarked ? 'Remove Bookmark' : 'Bookmark Problem'}" aria-label="${isBookmarked ? 'Remove Bookmark' : 'Bookmark Problem'}">
            <i class="${isBookmarked ? 'fa-solid' : 'fa-regular'} fa-bookmark"></i>
          </button>
          <button type="button" class="btn btn-sm btn-ghost btn-dash-open-notes" data-id="${p.id}" title="Quick Notes & Mistake Capture">
            <i class="fa-regular fa-note-sticky"></i> <span class="action-btn-text">Notes</span>
          </button>
          <button type="button" class="btn btn-sm btn-outline-secondary btn-dash-trainer" data-id="${p.id}" title="Open Solution Discovery Trainer">
            <i class="fa-solid fa-lightbulb"></i> <span class="action-btn-text">Trainer</span>
          </button>
          <a href="${directUrl || '#'}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-primary btn-prob-open ${!directUrl ? 'disabled' : ''}" data-id="${p.id}" title="Open Problem URL">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> <span>Open</span>
          </a>
        </div>
      </div>
    `;
  }

  function renderDashboardRevisionQueue(revMetrics) {
    // 1. Header Metrics Pills
    const overduePill = document.getElementById('dash-rev-overdue-count');
    if (overduePill) overduePill.textContent = revMetrics.overdueCount || 0;
    const todayPill = document.getElementById('dash-rev-today-count');
    if (todayPill) todayPill.textContent = revMetrics.dueTodayCount || 0;
    const totalPill = document.getElementById('dash-rev-total-count');
    if (totalPill) totalPill.textContent = revMetrics.totalDue || 0;

    // 2. Start Revision Button
    const btnStartRev = document.getElementById('btn-dash-start-revision');
    if (btnStartRev) {
      btnStartRev.innerHTML = (revMetrics.totalDue > 0)
        ? `<i class="fa-solid fa-rotate"></i> Start Revision (${revMetrics.totalDue})`
        : `<i class="fa-solid fa-rotate"></i> Start Revision Session`;
    }

    // 3. Queue List Filtering
    const queueListEl = document.getElementById('dash-revision-queue-list');
    const emptyStateEl = document.getElementById('dash-revision-empty-state');
    if (!queueListEl || !emptyStateEl) return;

    let queue = [];
    if (window.RevisionSessionController && typeof window.RevisionSessionController.getFilteredQueue === 'function') {
      const filterKey = (dashRevisionFilter === 'overdue') ? 'overdue' : 'due';
      queue = window.RevisionSessionController.getFilteredQueue(allProblems, userStates, {
        filter: filterKey,
        search: dashRevisionSearch
      });

      if (dashRevisionFilter === 'today') {
        const todayStr = (function() {
          const d = new Date();
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        })();
        queue = queue.filter(p => userStates[p.id]?.nextReviewDate === todayStr);
      }
    } else {
      queue = allProblems.filter(p => SRSEngine.isDue(userStates[p.id]));
    }

    if (queue.length === 0) {
      emptyStateEl.style.display = 'flex';
      queueListEl.style.display = 'none';
    } else {
      emptyStateEl.style.display = 'none';
      queueListEl.style.display = 'flex';

      const todayStr = (function() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })();

      queueListEl.innerHTML = queue.slice(0, 10).map(p => {
        const st = userStates[p.id] || {};
        const isOverdue = Boolean(st.nextReviewDate && st.nextReviewDate < todayStr);
        const dueBadge = isOverdue
          ? `<span class="badge badge-srs-overdue" style="background:rgba(239,68,68,0.15); color:#f87171; border:1px solid rgba(239,68,68,0.3); font-size:11px; padding:2px 7px; border-radius:4px; font-weight:700;">Overdue</span>`
          : `<span class="badge badge-srs-due" style="font-size:11px; padding:2px 7px;">Due Today</span>`;
        const confBadge = st.confidence
          ? `<span style="font-size:11px; color:#fbbf24; background:rgba(251,191,36,0.1); border:1px solid rgba(251,191,36,0.25); padding:2px 6px; border-radius:4px;">★ ${st.confidence}/5</span>`
          : '';
        const ratingBadge = st.lastRating
          ? `<span style="font-size:11px; color:#cbd5e1; background:rgba(255,255,255,0.04); padding:2px 6px; border-radius:4px;">Last: ${st.lastRating}</span>`
          : '';
        const directUrl = (p.url && p.url.startsWith('http')) ? p.url : null;

        return `
          <div class="dash-problem-row due-row" data-id="${p.id}" id="dash-rev-row-${p.id}">
            <div class="dash-prob-left">
              <div class="dash-prob-info">
                <div class="dash-prob-title-row">
                  ${dueBadge}
                  <a href="${directUrl || '#'}" target="_blank" rel="noopener noreferrer" class="dash-problem-title ${!directUrl ? 'url-disabled' : ''}">
                    ${p.title} <i class="fa-solid fa-arrow-up-right-from-square"></i>
                  </a>
                  <span class="badge badge-prob-id">${p.id}</span>
                  <span class="badge-diff-${(p.difficulty || 'medium').toLowerCase()}">${p.difficulty || 'Medium'}</span>
                  ${confBadge}
                  ${ratingBadge}
                </div>
                <div class="dash-prob-tags">
                  <span class="badge badge-topic" style="background:rgba(255,255,255,0.05); color:#94a3b8; font-size:11px; padding:2px 7px; border-radius:4px;">${p.topic || 'General'}</span>
                  ${p.pattern ? `<span class="badge badge-pattern" style="font-size:11px; padding:2px 7px; border-radius:4px;">${p.pattern}</span>` : ''}
                </div>
              </div>
            </div>
            <div class="dash-prob-actions">
              <button type="button" class="btn btn-sm btn-primary btn-rev-row-revise" data-id="${p.id}" title="Launch Spaced Recall Session">
                <i class="fa-solid fa-rotate"></i> <span>Revise</span>
              </button>
              <a href="${directUrl || '#'}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-secondary btn-rev-row-open ${!directUrl ? 'disabled' : ''}" data-id="${p.id}" title="Open Problem URL">
                <i class="fa-solid fa-arrow-up-right-from-square"></i> <span>Open</span>
              </a>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  function setupDashboardEventListeners() {
    if (_dashListenersWired) return;
    _dashListenersWired = true;

    // Fast Action: Continue Next Unsolved
    const btnNextUnsolved = document.getElementById('btn-dash-continue-next-unsolved');
    if (btnNextUnsolved) {
      btnNextUnsolved.addEventListener('click', () => {
        if (!window.RoadmapEngine) return;
        const todayPlan = (typeof RoadmapEngine.getTodayAuthoritativePlan === 'function')
          ? RoadmapEngine.getTodayAuthoritativePlan(allProblems, userStates)
          : null;
        const plan120 = (typeof RoadmapEngine.get120DayRoadmap === 'function')
          ? RoadmapEngine.get120DayRoadmap(userStates)
          : null;
        const dayNumber = todayPlan?.dayNumber || 1;
        const activeDay = (plan120?.days && plan120.days.length > 0)
          ? (plan120.days.find(d => (d.sequenceIndex || d.dayNumber) === dayNumber) || plan120.days[0])
          : null;

        let candidateIds = [];
        if (todayPlan?.streamA?.problems?.length > 0) {
          candidateIds.push(...todayPlan.streamA.problems.map(p => p.id));
        } else if (todayPlan?.streamA?.problemIds?.length > 0) {
          candidateIds.push(...todayPlan.streamA.problemIds);
        } else if (activeDay?.streams?.current_learning?.problemIds?.length > 0) {
          candidateIds.push(...activeDay.streams.current_learning.problemIds);
        }

        if (todayPlan?.streamB?.problems?.length > 0) {
          candidateIds.push(...todayPlan.streamB.problems.map(p => p.id));
        } else if (todayPlan?.streamB?.problemIds?.length > 0) {
          candidateIds.push(...todayPlan.streamB.problemIds);
        } else if (activeDay?.streams?.foundation_revision?.problemIds?.length > 0) {
          candidateIds.push(...activeDay.streams.foundation_revision.problemIds);
        }

        const nextProbId = candidateIds.find(id => {
          const st = userStates[id];
          return !st || (!st.lastReviewed && !st.solved);
        });

        if (nextProbId) {
          const prob = allProblems.find(p => p.id === nextProbId);
          const rowEl = document.getElementById(`dash-row-${nextProbId}`);
          if (rowEl) {
            rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            rowEl.style.boxShadow = '0 0 0 2px #3b82f6, 0 0 16px rgba(59, 130, 246, 0.4)';
            setTimeout(() => { rowEl.style.boxShadow = ''; }, 3000);
          }
          if (prob && prob.url && prob.url.startsWith('http')) {
            window.open(prob.url, '_blank', 'noopener,noreferrer');
          }
        } else {
          alert("All assigned learning tasks for today are completed! Great work! Check your Revision Queue below or view the full Roadmap.");
        }
      });
    }

    // Direct Navigation Buttons
    const btnOpenRoadmap = document.getElementById('btn-dash-open-roadmap');
    if (btnOpenRoadmap) {
      btnOpenRoadmap.addEventListener('click', () => switchView('roadmaps'));
    }

    const btnEditRoadmap = document.getElementById('btn-dash-edit-roadmap');
    if (btnEditRoadmap) {
      btnEditRoadmap.addEventListener('click', () => {
        const activeId = (window.RoadmapEngine && typeof RoadmapEngine.getActiveRoadmapId === 'function')
          ? RoadmapEngine.getActiveRoadmapId()
          : 'dual_stream_120';
        window.location.hash = `#/roadmaps/${activeId}/edit`;
      });
    }

    const btnViewProblems = document.getElementById('btn-dash-view-all-problems');
    if (btnViewProblems) {
      btnViewProblems.addEventListener('click', () => switchView('problems'));
    }

    const btnViewRevision = document.getElementById('btn-dash-view-revision-center');
    if (btnViewRevision) {
      btnViewRevision.addEventListener('click', () => switchView('revision'));
    }

    const btnViewAllRevision = document.getElementById('btn-dash-view-all-revision');
    if (btnViewAllRevision) {
      btnViewAllRevision.addEventListener('click', () => switchView('revision'));
    }

    const btnEmptyRevCenter = document.getElementById('btn-dash-empty-rev-center');
    if (btnEmptyRevCenter) {
      btnEmptyRevCenter.addEventListener('click', () => switchView('revision'));
    }

    const btnStartRevision = document.getElementById('btn-dash-start-revision');
    if (btnStartRevision) {
      btnStartRevision.addEventListener('click', () => {
        if (typeof launchActiveRecallSession === 'function') {
          launchActiveRecallSession();
        } else {
          switchView('revision');
        }
      });
    }

    const btnDayCta = document.getElementById('btn-day-primary-cta');
    if (btnDayCta) {
      btnDayCta.addEventListener('click', () => {
        const btnContinue = document.getElementById('btn-dashboard-continue-learning');
        if (btnContinue) btnContinue.click();
      });
    }

    const btnDayToggleComplete = document.getElementById('btn-day-toggle-complete');
    if (btnDayToggleComplete) {
      btnDayToggleComplete.addEventListener('click', () => {
        if (!window.RoadmapEngine) return;
        const todayPlan = (typeof RoadmapEngine.getTodayAuthoritativePlan === 'function')
          ? RoadmapEngine.getTodayAuthoritativePlan(allProblems, userStates)
          : null;
        const plan120 = (typeof RoadmapEngine.get120DayRoadmap === 'function')
          ? RoadmapEngine.get120DayRoadmap(userStates)
          : null;
        const dayNumber = todayPlan?.dayNumber || 1;
        const activeDay = (plan120?.days && plan120.days.length > 0)
          ? (plan120.days.find(d => (d.sequenceIndex || d.dayNumber) === dayNumber) || plan120.days[0])
          : null;

        let candidateIds = [];
        if (todayPlan?.streamA?.problemIds) candidateIds.push(...todayPlan.streamA.problemIds);
        else if (activeDay?.streams?.current_learning?.problemIds) candidateIds.push(...activeDay.streams.current_learning.problemIds);
        if (todayPlan?.streamB?.problemIds) candidateIds.push(...todayPlan.streamB.problemIds);
        else if (activeDay?.streams?.foundation_revision?.problemIds) candidateIds.push(...activeDay.streams.foundation_revision.problemIds);

        const areAllSolved = candidateIds.every(id => userStates[id]?.lastReviewed || userStates[id]?.solved);
        const nowIso = new Date().toISOString();

        candidateIds.forEach(id => {
          if (!userStates[id]) userStates[id] = { id };
          if (areAllSolved) {
            userStates[id].lastReviewed = null;
            userStates[id].solved = false;
          } else {
            userStates[id].lastReviewed = nowIso;
            userStates[id].solved = true;
          }
        });

        saveUserStates();
        renderDashboard();
      });
    }

    // Dismiss Session Recovery Banner
    const btnDismissSession = document.getElementById('btn-dash-dismiss-session');
    if (btnDismissSession) {
      btnDismissSession.addEventListener('click', () => {
        const sessionBanner = document.getElementById('dash-session-recovery-banner');
        if (sessionBanner) {
          sessionBanner.style.display = 'none';
          sessionBanner.dataset.dismissed = 'true';
        }
      });
    }

    // Problem Toolbar: Search Input
    const searchInput = document.getElementById('dash-problem-search');
    const clearSearchBtn = document.getElementById('btn-dash-clear-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        dashProblemSearch = (e.target.value || '').trim();
        if (clearSearchBtn) clearSearchBtn.style.display = dashProblemSearch ? 'inline-flex' : 'none';
        renderDashboardProductivity();
      });
    }
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        dashProblemSearch = '';
        clearSearchBtn.style.display = 'none';
        renderDashboardProductivity();
      });
    }

    // Problem Toolbar: Filter Pills
    document.querySelectorAll('#dash-problem-toolbar .dash-filter-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#dash-problem-toolbar .dash-filter-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        dashProblemFilter = btn.dataset.filter || 'all';
        renderDashboardProductivity();
      });
    });

    // Problem Toolbar: Sorting Select
    const sortSelect = document.getElementById('dash-problem-sort');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        dashProblemSort = e.target.value;
        renderDashboardProductivity();
      });
    }

    // Problem Toolbar: Show Completed Checkbox
    const showCompletedChk = document.getElementById('chk-dash-show-completed');
    if (showCompletedChk) {
      showCompletedChk.addEventListener('change', (e) => {
        dashShowCompleted = e.target.checked;
        renderDashboardProductivity();
      });
    }

    // Problem Toolbar: Collapse Toggles
    const btnToggleStreamA = document.getElementById('btn-toggle-stream-a');
    if (btnToggleStreamA) {
      btnToggleStreamA.addEventListener('click', () => {
        dashStreamACollapsed = !dashStreamACollapsed;
        const icon = document.getElementById('icon-toggle-stream-a');
        if (icon) icon.className = dashStreamACollapsed ? 'fa-solid fa-chevron-down' : 'fa-solid fa-chevron-up';
        renderDashboardProductivity();
      });
    }

    const btnToggleStreamB = document.getElementById('btn-toggle-stream-b');
    if (btnToggleStreamB) {
      btnToggleStreamB.addEventListener('click', () => {
        dashStreamBCollapsed = !dashStreamBCollapsed;
        const icon = document.getElementById('icon-toggle-stream-b');
        if (icon) icon.className = dashStreamBCollapsed ? 'fa-solid fa-chevron-down' : 'fa-solid fa-chevron-up';
        renderDashboardProductivity();
      });
    }

    // Problem Toolbar: Clear Filters
    const btnClearFilters = document.getElementById('btn-dash-clear-filters');
    if (btnClearFilters) {
      btnClearFilters.addEventListener('click', () => {
        dashProblemFilter = 'all';
        dashProblemSort = 'assigned';
        dashProblemSearch = '';
        dashShowCompleted = true;
        dashStreamACollapsed = false;
        dashStreamBCollapsed = false;

        if (searchInput) searchInput.value = '';
        if (clearSearchBtn) clearSearchBtn.style.display = 'none';
        if (sortSelect) sortSelect.value = 'assigned';
        if (showCompletedChk) showCompletedChk.checked = true;

        document.querySelectorAll('#dash-problem-toolbar .dash-filter-pill').forEach(b => {
          b.classList.toggle('active', b.dataset.filter === 'all');
        });

        renderDashboardProductivity();
      });
    }

    // Revision Queue: Search Input
    const revSearchInput = document.getElementById('dash-revision-search');
    if (revSearchInput) {
      revSearchInput.addEventListener('input', (e) => {
        dashRevisionSearch = (e.target.value || '').trim();
        let revMetrics = { overdueCount: 0, dueTodayCount: 0, totalDue: 0 };
        if (window.RevisionSessionController && typeof window.RevisionSessionController.getRevisionMetrics === 'function') {
          const raw = window.RevisionSessionController.getRevisionMetrics(allProblems, userStates);
          const totalDue = (typeof raw.dueNowCount === 'number') ? raw.dueNowCount : ((raw.overdueCount || 0) + (raw.dueTodayCount || 0));
          revMetrics = Object.assign({}, raw, { totalDue });
        }
        renderDashboardRevisionQueue(revMetrics);
      });
    }

    // Revision Queue: Filter Pills
    document.querySelectorAll('#dash-revision-toolbar .dash-filter-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#dash-revision-toolbar .dash-filter-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        dashRevisionFilter = btn.dataset.revFilter || 'all';
        let revMetrics = { overdueCount: 0, dueTodayCount: 0, totalDue: 0 };
        if (window.RevisionSessionController && typeof window.RevisionSessionController.getRevisionMetrics === 'function') {
          const raw = window.RevisionSessionController.getRevisionMetrics(allProblems, userStates);
          const totalDue = (typeof raw.dueNowCount === 'number') ? raw.dueNowCount : ((raw.overdueCount || 0) + (raw.dueTodayCount || 0));
          revMetrics = Object.assign({}, raw, { totalDue });
        }
        renderDashboardRevisionQueue(revMetrics);
      });
    });

    // Delegated Clicks in Day-wise Workspace & Revision Queue
    const workspaceContainer = document.getElementById('minimal-daily-workspace');
    if (workspaceContainer) {
      workspaceContainer.addEventListener('click', (e) => {
        // 1. Solve Checkbox Click
        const checkBtn = e.target.closest('.btn-prob-check');
        if (checkBtn) {
          e.preventDefault();
          e.stopPropagation();
          const probId = checkBtn.dataset.id;
          if (!probId) return;

          const st = userStates[probId];
          const isCurrentlySolved = st && (st.lastReviewed || st.solved);

          if (isCurrentlySolved) {
            st.lastReviewed = null;
            st.solved = false;
            st.isMastered = false;
            st.stage = 0;
          } else {
            if (!userStates[probId]) userStates[probId] = { id: probId };
            userStates[probId].lastReviewed = new Date().toISOString();
            userStates[probId].solved = true;
            userStates[probId].stage = Math.max(1, userStates[probId].stage || 1);
          }

          saveUserStates();
          renderDashboard();
          return;
        }

        // 2. Bookmark Button Click
        const bookmarkBtn = e.target.closest('.btn-prob-bookmark');
        if (bookmarkBtn) {
          e.preventDefault();
          e.stopPropagation();
          const probId = bookmarkBtn.dataset.id;
          if (!probId) return;

          if (!userStates[probId]) userStates[probId] = { id: probId };
          const curVal = Boolean(userStates[probId].isBookmarked || userStates[probId].bookmarked);
          userStates[probId].isBookmarked = !curVal;
          userStates[probId].bookmarked = !curVal;

          saveUserStates();
          renderDashboard();
          return;
        }

        // 3. Quick Notes Button Click
        const notesBtn = e.target.closest('.btn-dash-open-notes');
        if (notesBtn) {
          e.preventDefault();
          e.stopPropagation();
          const probId = notesBtn.dataset.id;
          openQuickNotesModal(probId);
          return;
        }

        // 4. Trainer Button Click
        const trainerBtn = e.target.closest('.btn-dash-trainer');
        if (trainerBtn) {
          e.preventDefault();
          e.stopPropagation();
          const probId = trainerBtn.dataset.id;
          if (window.SolutionDiscoveryController && typeof window.SolutionDiscoveryController.openModal === 'function') {
            window.SolutionDiscoveryController.openModal(probId);
          }
          return;
        }

        // 5. Single Item Revise Button Click in Revision Queue
        const singleRevBtn = e.target.closest('.btn-rev-row-revise');
        if (singleRevBtn) {
          e.preventDefault();
          e.stopPropagation();
          const probId = singleRevBtn.dataset.id;
          if (typeof launchActiveRecallSession === 'function') {
            launchActiveRecallSession([probId]);
          }
          return;
        }
      });
    }

    // Quick Notes Modal Setup
    setupQuickNotesModal();
  }

  function openQuickNotesModal(probId) {
    dashActiveNotesProblemId = probId;
    const modal = document.getElementById('modal-dash-quick-notes');
    if (!modal) return;

    const prob = allProblems.find(p => p.id === probId);
    const idBadge = document.getElementById('dash-notes-prob-id');
    const titleEl = document.getElementById('dash-notes-prob-title');
    if (idBadge) idBadge.textContent = probId;
    if (titleEl) titleEl.textContent = prob?.title || probId;

    const st = userStates[probId] || {};
    const qn = st.quickNotes || {};

    const mistakeEl = document.getElementById('dash-notes-mistake');
    const patternEl = document.getElementById('dash-notes-pattern');
    const insightEl = document.getElementById('dash-notes-insight');
    const reminderEl = document.getElementById('dash-notes-reminder');
    const statusEl = document.getElementById('dash-notes-save-status');

    if (mistakeEl) mistakeEl.value = qn.mistake || '';
    if (patternEl) patternEl.value = qn.pattern || '';
    if (insightEl) insightEl.value = qn.keyInsight || (typeof st.notes === 'string' ? st.notes : '');
    if (reminderEl) reminderEl.value = qn.reminder || '';
    if (statusEl) statusEl.textContent = '';

    modal.classList.add('open');
    modal.style.display = 'flex';
  }

  function closeQuickNotesModal() {
    const modal = document.getElementById('modal-dash-quick-notes');
    if (modal) {
      modal.classList.remove('open');
      modal.style.display = 'none';
    }
    dashActiveNotesProblemId = null;
  }

  function setupQuickNotesModal() {
    const modal = document.getElementById('modal-dash-quick-notes');
    if (!modal || modal._wired) return;
    modal._wired = true;

    const btnClose = document.getElementById('btn-dash-close-notes');
    const btnCancel = document.getElementById('btn-dash-cancel-notes');
    const btnSave = document.getElementById('btn-dash-save-notes');

    if (btnClose) btnClose.addEventListener('click', closeQuickNotesModal);
    if (btnCancel) btnCancel.addEventListener('click', closeQuickNotesModal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeQuickNotesModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display === 'flex') {
        closeQuickNotesModal();
      }
    });

    if (btnSave) {
      btnSave.addEventListener('click', () => {
        if (!dashActiveNotesProblemId) return;
        const probId = dashActiveNotesProblemId;

        const mistake = document.getElementById('dash-notes-mistake')?.value || '';
        const pattern = document.getElementById('dash-notes-pattern')?.value || '';
        const keyInsight = document.getElementById('dash-notes-insight')?.value || '';
        const reminder = document.getElementById('dash-notes-reminder')?.value || '';
        const statusEl = document.getElementById('dash-notes-save-status');

        if (!userStates[probId]) userStates[probId] = { id: probId };
        userStates[probId].quickNotes = {
          mistake,
          pattern,
          keyInsight,
          reminder,
          updatedAt: new Date().toISOString()
        };

        // Also compile readable composite notes string for backward compatibility
        const notesParts = [];
        if (mistake.trim()) notesParts.push(`Mistake: ${mistake.trim()}`);
        if (pattern.trim()) notesParts.push(`Pattern: ${pattern.trim()}`);
        if (keyInsight.trim()) notesParts.push(`Insight: ${keyInsight.trim()}`);
        if (reminder.trim()) notesParts.push(`Reminder: ${reminder.trim()}`);
        userStates[probId].notes = notesParts.join('\n\n');

        saveUserStates();

        if (statusEl) {
          statusEl.textContent = 'Notes saved successfully!';
        }

        setTimeout(() => {
          closeQuickNotesModal();
          renderDashboardProductivity();
        }, 400);
      });
    }
  }

  // Wire Continue Learning Button
  function setupDashboardContinueLearning() {
    const btnContinue = document.getElementById('btn-dashboard-continue-learning');
    if (!btnContinue || btnContinue._wired) return;
    btnContinue._wired = true;

    btnContinue.addEventListener('click', () => {
      // 1. If an active trainer session exists, prioritize resuming it
      if (window.SolutionDiscoveryController && typeof window.SolutionDiscoveryController.getActiveSession === 'function') {
        const s = window.SolutionDiscoveryController.getActiveSession();
        if (s && s.status !== 'completed' && s.status !== 'abandoned' && s.problemId) {
          window.SolutionDiscoveryController.openModal(s.problemId);
          return;
        }
      }

      // 2. If an active revision session exists, prioritize resuming it
      if (window.RevisionSessionController && typeof window.RevisionSessionController.getActiveSession === 'function') {
        const s = window.RevisionSessionController.getActiveSession();
        if (s && s.status !== 'completed' && s.status !== 'discarded' && Array.isArray(s.problemIds) && s.problemIds.length > 0) {
          if (typeof renderActiveRecallSessionModal === 'function') {
            activeRecallSessionState = s;
            renderActiveRecallSessionModal();
            return;
          }
        }
      }

      // 3. Otherwise, resolve next eligible uncompleted problem from Stream A -> Stream B -> Stream C
      if (!window.RoadmapEngine) return;
      const todayPlan = (typeof RoadmapEngine.getTodayAuthoritativePlan === 'function')
        ? RoadmapEngine.getTodayAuthoritativePlan(allProblems, userStates)
        : null;

      let nextProbId = null;
      if (todayPlan?.streamA?.problemIds) {
        nextProbId = todayPlan.streamA.problemIds.find(pid => !userStates[pid]?.lastReviewed && !userStates[pid]?.solved);
      } else if (todayPlan?.streamA?.problems) {
        nextProbId = todayPlan.streamA.problems.find(p => !userStates[p.id]?.lastReviewed && !userStates[p.id]?.solved)?.id;
      }
      if (!nextProbId && todayPlan?.streamB?.problemIds) {
        nextProbId = todayPlan.streamB.problemIds.find(pid => !userStates[pid]?.lastReviewed && !userStates[pid]?.solved);
      } else if (!nextProbId && todayPlan?.streamB?.problems) {
        nextProbId = todayPlan.streamB.problems.find(p => !userStates[p.id]?.lastReviewed && !userStates[p.id]?.solved)?.id;
      }
      if (!nextProbId) {
        const plan120 = (typeof RoadmapEngine.get120DayRoadmap === 'function')
          ? RoadmapEngine.get120DayRoadmap(userStates)
          : null;
        const dayNumber = todayPlan?.dayNumber || 1;
        const activeDay = (plan120?.days && plan120.days.length > 0)
          ? (plan120.days.find(d => (d.sequenceIndex || d.dayNumber) === dayNumber) || plan120.days[0])
          : null;
        if (activeDay?.streams?.foundation_revision?.problemIds) {
          nextProbId = activeDay.streams.foundation_revision.problemIds.find(pid => !userStates[pid]?.lastReviewed && !userStates[pid]?.solved);
        }
      }
      if (!nextProbId && todayPlan?.streamC?.dueProblems?.length > 0) {
        nextProbId = todayPlan.streamC.dueProblems[0].id;
      }
      const nextProb = nextProbId ? allProblems.find(p => p.id === nextProbId) : null;

      if (nextProb) {
        const rowEl = document.getElementById(`dash-row-${nextProb.id}`);
        if (rowEl) {
          rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          rowEl.style.boxShadow = '0 0 0 2px #3b82f6, 0 0 16px rgba(59, 130, 246, 0.4)';
          setTimeout(() => { rowEl.style.boxShadow = ''; }, 3000);
        }
        if (nextProb.url && nextProb.url.startsWith('http')) {
          window.open(nextProb.url, '_blank', 'noopener,noreferrer');
        }
      } else {
        // If all tasks completed, check if revisions due
        let dueCount = 0;
        allProblems.forEach(p => { if (SRSEngine.isDue(userStates[p.id])) dueCount++; });
        if (dueCount > 0 && typeof launchActiveRecallSession === 'function') {
          launchActiveRecallSession();
        } else {
          alert('All tasks in today\'s plan are completed! Great job! You can view the full roadmap or practice extra problems.');
        }
      }
    });
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
    setupProblemsLibraryControls();

    const budgetPill = document.getElementById('dsa-plan-budget-pill');
    const headerSummary = document.getElementById('dsa-plan-header-summary');

    const currentMins = (RoadmapEngine.get12WeekTargetMinutes && RoadmapEngine.get12WeekTargetMinutes()) || 120;

    const plan = RoadmapEngine.getDailyDSAPlan(currentMins, allProblems, userStates);

    if (budgetPill && plan.timeAllocation) {
      budgetPill.innerHTML = `<span><i class="fa-solid fa-clock"></i> ${plan.timeAllocation.learnMinutes}m Learn â€¢ ${plan.timeAllocation.topicRevisionMinutes}m Topic Revise â€¢ ${plan.timeAllocation.spacedRevisionMinutes}m Spaced Revise â€¢ ${plan.timeAllocation.recallBufferMinutes}m Active Recall</span>`;
    }

    if (headerSummary) {
      headerSummary.textContent = `Workload-aware learning, topic practice & spaced recall workflow`;
    }

    const curProg = (RoadmapEngine && typeof RoadmapEngine.getCurriculumProgress === 'function') ?
      RoadmapEngine.getCurriculumProgress(userStates) : null;
    if (curProg) {
      const dayTag = document.getElementById('dsa-plan-curriculum-day-tag');
      const topicTag = document.getElementById('dsa-plan-curriculum-topic-tag');
      if (dayTag) dayTag.textContent = `120-Day Roadmap â€¢ Day ${curProg.currentCurriculumDay}`;
      if (topicTag) topicTag.textContent = `${curProg.activeMilestoneTopic}: ${curProg.activeMilestoneSubtopic}`;
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
    // SECTION 2: LEARN â€” NEW QUESTIONS
    // =========================================================================
    const learnTopicTitle = document.getElementById('dsa-plan-learn-topic-title');
    const learnTimeBadge = document.getElementById('dsa-plan-learn-time-badge');
    const learnConceptSub = document.getElementById('dsa-plan-learn-concept-sub');
    const learnList = document.getElementById('dsa-plan-learn-task-list');

    if (learnTopicTitle) learnTopicTitle.textContent = `${plan.learn.topic}`;
    if (learnTimeBadge) learnTimeBadge.textContent = `~${plan.timeAllocation.learnMinutes}m target`;
    if (learnConceptSub) learnConceptSub.textContent = `New questions Â· ${plan.learn.topic} Â· Adaptive difficulty progression`;

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
                <i class="fa-solid fa-bolt"></i> Next Question Available â€” Continue Learning
              </button>
            </div>
          `;
        }
        learnList.innerHTML = cardsHtml;
      }
    }

    // =========================================================================
    // SECTION 3: TOPIC REVISION â€” TOPIC PRACTICE
    // =========================================================================
    const topicRevTitle = document.getElementById('dsa-plan-topic-revise-topic-title') || document.getElementById('dsa-plan-revise-topic-title');
    const topicRevTimeBadge = document.getElementById('dsa-plan-topic-revise-time-badge') || document.getElementById('dsa-plan-revise-time-badge');
    const topicRevConceptSub = document.getElementById('dsa-plan-topic-revise-concept-sub') || document.getElementById('dsa-plan-revise-concept-sub');
    const topicRevList = document.getElementById('dsa-plan-topic-revise-task-list') || document.getElementById('dsa-plan-revise-task-list');

    const topicRevProblems = plan.topicRevision?.problems || [];
    const topicRevTopicName = plan.topicRevision?.topicDisplay || plan.topicRevision?.topic || plan.revise.topicDisplay;

    if (topicRevTitle) topicRevTitle.textContent = `${topicRevTopicName}`;
    if (topicRevTimeBadge) topicRevTimeBadge.textContent = `~${plan.timeAllocation.topicRevisionMinutes}m target`;
    if (topicRevConceptSub) topicRevConceptSub.textContent = `Topic-focused practice Â· ${topicRevTopicName} Â· Adaptive difficulty`;

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
    // SECTION 4: SPACED REVISION â€” TIME-BASED SRS RECALL
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

    // Show immediate concise confirmation & next recommended task with actual calculated SRS date
    const currentMins = (window.RoadmapEngine && RoadmapEngine.get12WeekTargetMinutes) ? RoadmapEngine.get12WeekTargetMinutes() : 120;
    const updatedPlan = RoadmapEngine.getDailyDSAPlan(currentMins, allProblems, userStates);
    const nextTaskObj = findNextPlanTask(updatedPlan);

    const updatedState = userStates[problemId] || {};
    const nextDate = updatedState.nextReviewDate;
    const intervalDays = updatedState.intervalDays || 1;

    let confirmMsg = `âœ“ Recorded "${outcomeLabel}" for "${p.title}".`;
    if (nextDate) {
      confirmMsg += ` Next review: ${nextDate} (${intervalDays}d interval).`;
    }
    if (nextTaskObj) {
      confirmMsg += ` Next task: "${nextTaskObj.task.title}".`;
    } else {
      confirmMsg += ` ðŸŽ‰ Great job! All planned tasks completed.`;
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
            showPlanConfirmation(`âœ“ Resumed task.`);
          } else {
            RoadmapEngine.skipPlanTask(id);
            showPlanConfirmation(`Task skipped for now (stays in session queue). To move it to a future day, use Reschedule in your 120-Day Roadmap.`);
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
          showPlanConfirmation(`âœ“ Added "${res.problem.title}" to session.`);
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
      if (modalSubtitle) modalSubtitle.textContent = 'Due Spaced Recall Â· All Topics';
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

    renderDashboardOverviewCards();
    renderDashboardRightWidgets();
    setupDashboardContinueLearning();
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
      titleEl.textContent = `${rec.problemTitle} (${rec.difficulty} â€¢ ${rec.topic})`;
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

  // --- UNIFIED LEARNING ORCHESTRATOR CONTROLLER ---
  function renderOrchestratorNextActionHero() {
    const heroCard = document.getElementById('orchestrator-next-action-hero');
    if (!heroCard || !window.LearningOrchestrator) return;

    const rec = LearningOrchestrator.getRecommendedNextAction(userStates, allProblems);
    if (!rec) return;

    const urgencyBadge = document.getElementById('orchestrator-hero-urgency-badge');
    const diffBadge = document.getElementById('orchestrator-hero-diff-badge');
    const topicBadge = document.getElementById('orchestrator-hero-topic-badge');
    const sourceBadge = document.getElementById('orchestrator-hero-source-badge');
    const titleEl = document.getElementById('orchestrator-hero-title');
    const reasonEl = document.getElementById('orchestrator-hero-reason');
    const impactText = document.getElementById('orchestrator-hero-impact-text');
    const btnHeroAction = document.getElementById('btn-orchestrator-hero-action');
    const btnHeroText = document.getElementById('btn-orchestrator-hero-text');
    const btnTrainerAction = document.getElementById('btn-orchestrator-trainer-action');

    if (urgencyBadge) {
      urgencyBadge.className = rec.urgency === 'high' ? 'orchestrator-badge-urgent' :
        (rec.urgency === 'medium' ? 'orchestrator-badge-due' : 'orchestrator-badge-learn');
      urgencyBadge.innerHTML = `<i class="fa-solid ${rec.actionIcon || 'fa-bolt'}"></i> <span>${escapeHtml(rec.badgeText || 'RECOMMENDED NEXT ACTION')}</span>`;
    }

    if (diffBadge) {
      if (rec.difficulty && rec.difficulty !== 'Done') {
        diffBadge.style.display = 'inline-flex';
        diffBadge.textContent = rec.difficulty;
        diffBadge.className = `badge badge-${(rec.difficulty || 'medium').toLowerCase()}`;
      } else {
        diffBadge.style.display = 'none';
      }
    }

    if (topicBadge) {
      if (rec.topic && rec.topic !== 'Daily Session Finished') {
        topicBadge.style.display = 'inline-flex';
        topicBadge.textContent = rec.subtopic ? `${rec.topic} â€¢ ${rec.subtopic}` : rec.topic;
      } else {
        topicBadge.style.display = 'none';
      }
    }

    if (sourceBadge) {
      sourceBadge.textContent = rec.source || 'Orchestrator';
    }

    if (titleEl) {
      titleEl.innerHTML = `<i class="fa-solid ${rec.actionIcon || 'fa-play'}" style="color:var(--primary); font-size:16px;"></i> ${escapeHtml(rec.title || '')}`;
    }

    if (reasonEl) {
      reasonEl.textContent = rec.reasonText || '';
    }

    if (impactText) {
      if (rec.type === 'session_complete') {
        impactText.textContent = 'All daily goals achieved. Prepared for tomorrow!';
      } else if (rec.type === 'spaced_review') {
        impactText.textContent = 'Preserves memory retention â€¢ Advances Leitner stage â€¢ +20 XP';
      } else {
        impactText.textContent = 'Advances retention stability â€¢ Updates roadmap progress â€¢ Awards +25 XP';
      }
    }

    if (btnHeroText) {
      btnHeroText.textContent = rec.actionLabel || 'Start Task';
    }

    if (btnTrainerAction) {
      if (rec.problemId) {
        btnTrainerAction.style.display = 'inline-flex';
        btnTrainerAction.onclick = (e) => {
          e.preventDefault();
          if (typeof window.openSolutionDiscoveryModal === 'function') {
            window.openSolutionDiscoveryModal(rec.problemId);
          } else {
            openDetailModal(rec.problemId);
          }
        };
      } else {
        btnTrainerAction.style.display = 'none';
      }
    }

    if (btnHeroAction) {
      btnHeroAction.onclick = (e) => {
        e.preventDefault();
        if (!rec.problemId) {
          switchView(rec.targetView || 'practice');
          return;
        }

        if (rec.targetView === 'revision') {
          switchView('revision', 'queue');
          setTimeout(() => {
            const row = document.querySelector(`tr[data-problem-id="${rec.problemId}"]`);
            if (row) {
              row.scrollIntoView({ behavior: 'smooth', block: 'center' });
              row.classList.add('pulse-focus-card');
              setTimeout(() => row.classList.remove('pulse-focus-card'), 2200);
            }
          }, 150);
          return;
        }

        const cardEl = document.getElementById(`plan-task-${rec.problemId}`);
        if (cardEl) {
          cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          cardEl.classList.add('pulse-focus-card');
          setTimeout(() => cardEl.classList.remove('pulse-focus-card'), 2200);
        }

        if (rec.url) {
          window.open(rec.url, '_blank', 'noopener,noreferrer');
        } else {
          openDetailModal(rec.problemId);
        }
      };
    }
  }

  function setupFeaturePurposeBanners() {
    document.querySelectorAll('.btn-purpose-expand').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        const banner = btn.closest('.feature-purpose-banner');
        if (!banner) return;
        const viewKey = banner.dataset.purposeView || banner.dataset.view;
        const body = document.getElementById(`purpose-body-${viewKey}`);
        if (!body) return;
        const isHidden = body.style.display === 'none' || !body.style.display;
        body.style.display = isHidden ? 'grid' : 'none';
        btn.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
        btn.innerHTML = isHidden
          ? `<i class="fa-solid fa-chevron-up"></i> <span>Hide</span>`
          : `<i class="fa-solid fa-circle-question"></i> <span>Details</span>`;
      };
    });

    const btnOpenHow = document.getElementById('btn-trigger-how-it-works');
    const modalHow = document.getElementById('how-it-works-modal');
    const btnCloseHow = document.getElementById('btn-close-how-it-works-modal');
    const btnCloseDone = document.getElementById('btn-close-how-it-works-done');

    if (btnOpenHow && modalHow) {
      btnOpenHow.onclick = () => {
        modalHow.style.display = 'flex';
      };
    }
    if (btnCloseHow && modalHow) {
      btnCloseHow.onclick = () => {
        modalHow.style.display = 'none';
      };
    }
    if (btnCloseDone && modalHow) {
      btnCloseDone.onclick = () => {
        modalHow.style.display = 'none';
      };
    }
    if (modalHow) {
      modalHow.onclick = (e) => {
        if (e.target === modalHow) modalHow.style.display = 'none';
      };
    }
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
    } catch (_) { }

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
        ? `Provisional (Â±${calib.uncertainty.uncertaintyMargin} pts)`
        : `Empirical (Â±${calib.uncertainty.uncertaintyMargin} pts)`;
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

  // --- VIEW 2: PROBLEM SHEETS EXPLORER & PHASE 3 PROBLEMS LIBRARY ---
  let problemsCurrentPage = 1;
  let problemsPerPage = 50;
  let problemsBookmarkFilterActive = false;
  let activeProblemTopicPill = 'all';

  function getProblemPlatform(p) {
    if (!p || !p.url) return { name: 'Unavailable', badgeClass: 'badge-unavailable', icon: 'fa-link-slash', available: false };
    const u = p.url.toLowerCase();
    if (u.includes('leetcode.com')) return { name: 'LeetCode', badgeClass: 'badge-platform-lc', icon: 'fa-code', available: true };
    if (u.includes('geeksforgeeks.org')) return { name: 'GeeksforGeeks', badgeClass: 'badge-platform-gfg', icon: 'fa-laptop-code', available: true };
    if (u.includes('naukri.com') || u.includes('codingninjas.com')) return { name: 'Coding Ninjas', badgeClass: 'badge-platform-cn', icon: 'fa-terminal', available: true };
    if (u.includes('hackerrank.com')) return { name: 'HackerRank', badgeClass: 'badge-platform-other', icon: 'fa-code', available: true };
    return { name: 'External Platform', badgeClass: 'badge-platform-other', icon: 'fa-arrow-up-right-from-square', available: true };
  }

  function getProblemStatusMeta(p, state) {
    if (state && state.isMastered) {
      return { code: 'mastered', label: 'Mastered', badgeClass: 'badge-status-mastered', icon: 'fa-crown' };
    }
    if (state && SRSEngine.isDue(state)) {
      return { code: 'due', label: 'Due for Review', badgeClass: 'badge-status-due', icon: 'fa-bell' };
    }
    if (state && (state.lastReviewed || state.solved)) {
      return { code: 'solved', label: 'Solved', badgeClass: 'badge-status-solved', icon: 'fa-check' };
    }
    if (state && (state.attemptsCount > 0 || state.lastRating === 'failed' || state.stage === 0)) {
      return { code: 'attempted', label: 'Attempted', badgeClass: 'badge-status-attempted', icon: 'fa-clock-rotate-left' };
    }
    return { code: 'unsolved', label: 'Unsolved', badgeClass: 'badge-status-unsolved', icon: 'fa-circle-notch' };
  }

  function clearAllProblemFilters() {
    const searchInput = document.getElementById('problem-search-input');
    const globalSearch = document.getElementById('global-search-input');
    const clearSearchBtn = document.getElementById('btn-clear-problem-search');
    if (searchInput) searchInput.value = '';
    if (globalSearch) globalSearch.value = '';
    if (clearSearchBtn) clearSearchBtn.style.display = 'none';

    const sheetSelect = document.getElementById('filter-sheet');
    if (sheetSelect) sheetSelect.value = 'all';
    document.querySelectorAll('#sheet-pills-container .sheet-pill').forEach(p => {
      if (p.getAttribute('data-sheet-val') === 'all') p.classList.add('active');
      else p.classList.remove('active');
    });

    const topicSelect = document.getElementById('filter-topic');
    if (topicSelect) topicSelect.value = 'all';

    activeProblemTopicPill = 'all';
    document.querySelectorAll('#problem-topic-pills .topic-pill').forEach(p => {
      if (p.getAttribute('data-topic') === 'all') p.classList.add('active');
      else p.classList.remove('active');
    });

    const subtopicSelect = document.getElementById('filter-subtopic');
    if (subtopicSelect) subtopicSelect.value = 'all';

    const diffSelect = document.getElementById('filter-difficulty');
    if (diffSelect) diffSelect.value = 'all';

    const platformSelect = document.getElementById('filter-platform');
    if (platformSelect) platformSelect.value = 'all';

    const statusSelect = document.getElementById('filter-status');
    if (statusSelect) statusSelect.value = 'all';

    const compSelect = document.getElementById('filter-company');
    if (compSelect) compSelect.value = 'all';

    const sortSelect = document.getElementById('sort-problems');
    if (sortSelect) sortSelect.value = 'order';

    problemsBookmarkFilterActive = false;
    const bmBtn = document.getElementById('btn-filter-bookmarks');
    const bmIcon = document.getElementById('btn-filter-bookmarks-icon');
    if (bmBtn) bmBtn.classList.remove('active');
    if (bmIcon) {
      bmIcon.className = 'fa-regular fa-star';
      bmIcon.style.color = '';
    }

    problemsCurrentPage = 1;
    renderProblemsTable();
  }
  window.clearAllProblemFilters = clearAllProblemFilters;

  function renderProblemsTable() {
    const tbody = document.getElementById('all-problems-tbody');
    if (!tbody) return;

    const sheetFilter = document.getElementById('filter-sheet')?.value || 'all';
    const compFilter = document.getElementById('filter-company')?.value || 'all';
    const topicFilter = activeProblemTopicPill !== 'all' ? activeProblemTopicPill : (document.getElementById('filter-topic')?.value || 'all');
    const subtopicFilter = document.getElementById('filter-subtopic')?.value || 'all';
    const diffFilter = document.getElementById('filter-difficulty')?.value || 'all';
    const platformFilter = document.getElementById('filter-platform')?.value || 'all';
    const statusFilter = document.getElementById('filter-status')?.value || 'all';
    const sortBy = document.getElementById('sort-problems')?.value || 'order';
    const searchVal = (document.getElementById('problem-search-input')?.value || document.getElementById('global-search-input')?.value || '').toLowerCase().trim();
    const isGroupedBySubtopic = document.getElementById('toggle-group-subtopic')?.checked !== false && sortBy === 'order';

    // Synchronize topic select dropdown with active topic pill
    const topicSelect = document.getElementById('filter-topic');
    if (topicSelect && topicSelect.value !== topicFilter) {
      topicSelect.value = topicFilter;
    }

    // Toggle clear search button visibility
    const clearSearchBtn = document.getElementById('btn-clear-problem-search');
    if (clearSearchBtn) {
      clearSearchBtn.style.display = searchVal ? 'block' : 'none';
    }

    // Filter problems
    const filtered = allProblems.filter(p => {
      const state = userStates[p.id];
      const isSolved = state && (state.lastReviewed || state.solved);
      const isMastered = state && state.isMastered;
      const isDue = state && SRSEngine.isDue(state);
      const isBookmarked = state && state.isBookmarked === true;

      // Bookmark filter
      if (problemsBookmarkFilterActive && !isBookmarked) return false;

      // Sheet filter
      if (sheetFilter !== 'all') {
        const problemSheets = p.sheets || (p.sheet ? [p.sheet] : ['Custom']);
        if (!problemSheets.some(s => s.toLowerCase().includes(sheetFilter.toLowerCase()))) return false;
      }

      // Company filter
      if (compFilter !== 'all') {
        const comps = p.companies || [];
        const match = comps.some(c => {
          if (compFilter === 'Meta') return c.toLowerCase() === 'meta' || c.toLowerCase() === 'facebook';
          if (compFilter === 'TCS') return c.toLowerCase() === 'tcs' || c.toLowerCase() === 'infosys' || c.toLowerCase() === 'wipro';
          return c.toLowerCase().includes(compFilter.toLowerCase());
        });
        if (!match) return false;
      }

      // Topic filter
      if (topicFilter !== 'all' && p.topic !== topicFilter) return false;

      // Subtopic filter
      if (subtopicFilter !== 'all' && (p.subtopic || 'General') !== subtopicFilter) return false;

      // Difficulty filter
      if (diffFilter !== 'all' && p.difficulty !== diffFilter) return false;

      // Platform filter
      if (platformFilter !== 'all') {
        const plat = getProblemPlatform(p);
        if (plat.name.toLowerCase() !== platformFilter.toLowerCase()) return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'due' && !isDue) return false;
        if (statusFilter === 'mastered' && !isMastered) return false;
        if (statusFilter === 'solved' && (!isSolved || isMastered)) return false;
        if (statusFilter === 'unsolved' && (isSolved || isMastered)) return false;
        if (statusFilter === 'attempted' && (!state || (!state.attemptsCount && state.stage === undefined && state.lastRating !== 'failed') || isSolved)) return false;
        if (statusFilter === 'in-progress' && (!isSolved || isMastered)) return false;
      }

      // Search text filter
      if (searchVal) {
        const matchTitle = p.title.toLowerCase().includes(searchVal);
        const matchTopic = (p.topic || '').toLowerCase().includes(searchVal);
        const matchSubtopic = (p.subtopic || '').toLowerCase().includes(searchVal);
        const matchPattern = (p.pattern || '').toLowerCase().includes(searchVal);
        const matchNotes = (p.notes || '').toLowerCase().includes(searchVal);
        const matchCompany = (p.companies || []).some(c => c.toLowerCase().includes(searchVal));
        const matchSheet = (p.sheets || [p.sheet || '']).some(s => s.toLowerCase().includes(searchVal));
        if (!matchTitle && !matchTopic && !matchSubtopic && !matchPattern && !matchNotes && !matchCompany && !matchSheet) return false;
      }

      return true;
    });

    // Sort filtered problems
    if (sortBy === 'title-asc') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'title-desc') {
      filtered.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sortBy === 'diff-asc') {
      const diffOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
      filtered.sort((a, b) => (diffOrder[a.difficulty] || 2) - (diffOrder[b.difficulty] || 2));
    } else if (sortBy === 'diff-desc') {
      const diffOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
      filtered.sort((a, b) => (diffOrder[b.difficulty] || 2) - (diffOrder[a.difficulty] || 2));
    } else if (sortBy === 'due-first') {
      filtered.sort((a, b) => {
        const aDue = SRSEngine.isDue(userStates[a.id]) ? 1 : 0;
        const bDue = SRSEngine.isDue(userStates[b.id]) ? 1 : 0;
        return bDue - aDue;
      });
    } else {
      // Default exact pedagogical sequence (#orderIndex)
      filtered.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    }

    // Deduplicated live count metrics
    let filteredSolved = 0;
    let filteredMastered = 0;
    let filteredDue = 0;
    let filteredBookmarked = 0;

    filtered.forEach(p => {
      const s = userStates[p.id];
      if (s && (s.lastReviewed || s.solved)) filteredSolved++;
      if (s && s.isMastered) filteredMastered++;
      if (s && SRSEngine.isDue(s)) filteredDue++;
      if (s && s.isBookmarked) filteredBookmarked++;
    });
    const filteredUnsolved = filtered.length - filteredSolved;

    const expTotalEl = document.getElementById('explorer-filtered-total');
    const expSolvedEl = document.getElementById('explorer-filtered-solved');
    const expMasteredEl = document.getElementById('explorer-filtered-mastered');
    const expUnsolvedEl = document.getElementById('explorer-filtered-unsolved');
    const expDueEl = document.getElementById('explorer-filtered-due');
    const expBookmarkedEl = document.getElementById('explorer-filtered-bookmarked');

    if (expTotalEl) expTotalEl.textContent = filtered.length;
    if (expSolvedEl) expSolvedEl.textContent = filteredSolved;
    if (expMasteredEl) expMasteredEl.textContent = filteredMastered;
    if (expUnsolvedEl) expUnsolvedEl.textContent = filteredUnsolved;
    if (expDueEl) expDueEl.textContent = filteredDue;
    if (expBookmarkedEl) expBookmarkedEl.textContent = filteredBookmarked;

    // Render Active Filters Bar
    const activeFiltersBar = document.getElementById('active-filters-bar');
    const activeFilterChips = document.getElementById('active-filter-chips');
    if (activeFiltersBar && activeFilterChips) {
      const activeFiltersList = [];
      if (searchVal) activeFiltersList.push({ label: `Search: "${searchVal}"`, type: 'search' });
      if (topicFilter !== 'all') activeFiltersList.push({ label: `Topic: ${topicFilter}`, type: 'topic' });
      if (subtopicFilter !== 'all') activeFiltersList.push({ label: `Subtopic: ${subtopicFilter}`, type: 'subtopic' });
      if (diffFilter !== 'all') activeFiltersList.push({ label: `Difficulty: ${diffFilter}`, type: 'diff' });
      if (platformFilter !== 'all') activeFiltersList.push({ label: `Platform: ${platformFilter}`, type: 'platform' });
      if (statusFilter !== 'all') activeFiltersList.push({ label: `Status: ${statusFilter}`, type: 'status' });
      if (compFilter !== 'all') activeFiltersList.push({ label: `Company: ${compFilter}`, type: 'company' });
      if (sheetFilter !== 'all') activeFiltersList.push({ label: `Sheet: ${sheetFilter}`, type: 'sheet' });
      if (problemsBookmarkFilterActive) activeFiltersList.push({ label: '★ Bookmarked Only', type: 'bookmark' });

      if (activeFiltersList.length > 0) {
        activeFiltersBar.style.display = 'flex';
        activeFilterChips.innerHTML = activeFiltersList.map(f => `
          <span class="filter-chip">
            <span>${escapeHtml(f.label)}</span>
            <button type="button" class="chip-remove-btn" data-filter-type="${f.type}" aria-label="Remove filter">&times;</button>
          </span>
        `).join('');
      } else {
        activeFiltersBar.style.display = 'none';
        activeFilterChips.innerHTML = '';
      }
    }

    // Pagination calculations
    const totalProblems = filtered.length;
    const perPageSelect = document.getElementById('problems-per-page');
    const perPageVal = perPageSelect ? perPageSelect.value : '50';
    let pageSize = perPageVal === 'all' ? totalProblems : parseInt(perPageVal, 10);
    if (isNaN(pageSize) || pageSize <= 0) pageSize = 50;

    const totalPages = Math.max(1, Math.ceil(totalProblems / pageSize));
    if (problemsCurrentPage > totalPages) problemsCurrentPage = totalPages;
    if (problemsCurrentPage < 1) problemsCurrentPage = 1;

    const startIndex = (problemsCurrentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalProblems);
    const pageItems = isGroupedBySubtopic ? filtered : filtered.slice(startIndex, endIndex);

    // Update pagination controls
    const pagBar = document.getElementById('problem-pagination-bar');
    const pagInfo = document.getElementById('pagination-info');
    const pageIndicator = document.getElementById('pagination-page-indicator');
    const btnPrev = document.getElementById('pagination-btn-prev');
    const btnNext = document.getElementById('pagination-btn-next');

    if (pagBar) {
      pagBar.style.display = (totalProblems > 0 && !isGroupedBySubtopic) ? 'flex' : (isGroupedBySubtopic ? 'none' : 'none');
    }
    if (pagInfo) {
      pagInfo.textContent = totalProblems === 0
        ? 'No matching problems'
        : `Showing ${startIndex + 1} - ${endIndex} of ${totalProblems} problems`;
    }
    if (pageIndicator) {
      pageIndicator.textContent = `Page ${problemsCurrentPage} of ${totalPages}`;
    }
    if (btnPrev) btnPrev.disabled = problemsCurrentPage <= 1;
    if (btnNext) btnNext.disabled = problemsCurrentPage >= totalPages;

    tbody.innerHTML = '';
    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center; padding:45px 20px;">
            <div style="max-width:380px; margin:0 auto;">
              <i class="fa-solid fa-filter-circle-xmark" style="font-size:36px; color:var(--text-dim); margin-bottom:12px;"></i>
              <h4 style="color:#fff; font-size:16px; margin:0 0 6px;">No Matching Problems Found</h4>
              <p style="font-size:13px; color:var(--text-dim); margin:0 0 16px;">We could not find any problem matching your search criteria or active filters.</p>
              <button type="button" class="btn btn-secondary btn-sm" onclick="clearAllProblemFilters()">
                <i class="fa-solid fa-arrows-rotate"></i> Reset All Filters
              </button>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    const tableFragment = document.createDocumentFragment();
    let currentGroupKey = null;
    let groupIndex = 0;

    // Calculate group stats if grouping is enabled
    const groupStats = new Map();
    if (isGroupedBySubtopic) {
      filtered.forEach(p => {
        const key = `${p.topic}:::${p.subtopic || 'General'}`;
        if (!groupStats.has(key)) {
          groupStats.set(key, { total: 0, solved: 0, topic: p.topic, subtopic: p.subtopic || 'General' });
        }
        const g = groupStats.get(key);
        g.total++;
        if (userStates[p.id]?.lastReviewed || userStates[p.id]?.solved) g.solved++;
      });
    }

    pageItems.forEach((p, idx) => {
      const state = userStates[p.id];
      const isSolved = state && (state.lastReviewed || state.solved);
      const isMastered = state && state.isMastered;
      const isBookmarked = state && state.isBookmarked === true;
      const conf = SRSEngine.getConfidence(state);
      const plat = getProblemPlatform(p);
      const statusMeta = getProblemStatusMeta(p, state);

      // If grouping by subtopic, render subtopic section header when group changes
      if (isGroupedBySubtopic) {
        const groupKey = `${p.topic}:::${p.subtopic || 'General'}`;
        if (groupKey !== currentGroupKey) {
          currentGroupKey = groupKey;
          groupIndex++;
          const gInfo = groupStats.get(groupKey) || { total: 1, solved: 0, topic: p.topic, subtopic: p.subtopic || 'General' };
          const pct = gInfo.total > 0 ? Math.round((gInfo.solved / gInfo.total) * 100) : 0;

          const groupHeaderTr = document.createElement('tr');
          groupHeaderTr.className = 'subtopic-group-header-row';
          groupHeaderTr.innerHTML = `
            <td colspan="8">
              <div class="subtopic-header-bar">
                <div class="subtopic-header-left">
                  <span class="subtopic-order-badge">Part ${groupIndex}</span>
                  <span class="subtopic-group-name"><i class="fa-solid fa-folder-tree" style="color:var(--primary); margin-right:6px;"></i>${escapeHtml(gInfo.subtopic)}</span>
                  <span class="subtopic-group-topic">${escapeHtml(gInfo.topic)}</span>
                </div>
                <div class="subtopic-header-right">
                  <span class="subtopic-group-stats">${gInfo.solved} / ${gInfo.total} Solved (${pct}%)</span>
                  <div class="subtopic-group-bar"><div class="subtopic-group-bar-fill" style="width:${pct}%;"></div></div>
                </div>
              </div>
            </td>
          `;
          tableFragment.appendChild(groupHeaderTr);
        }
      }

      const confBadgeHtml = conf
        ? `<span class="conf-badge conf-${conf}" title="${SRSEngine.getConfidenceMeta(conf).label}">★ ${conf}/5</span>`
        : `<span style="color:var(--text-dim); font-size:12px;">—</span>`;

      const tr = document.createElement('tr');
      if (statusMeta.code === 'due') tr.classList.add('due-row');
      if (isMastered) tr.classList.add('mastered-row');

      tr.innerHTML = `
        <td style="text-align:center;">
          <input type="checkbox" class="prob-checkbox" data-id="${p.id}" ${isSolved ? 'checked' : ''} title="${isSolved ? 'Mark as Unsolved' : 'Mark as Solved'}" style="cursor:pointer; width:16px; height:16px; accent-color:var(--primary);">
        </td>
        <td>
          <div class="problem-title-cell">
            <div style="display:flex; align-items:center; flex-wrap:wrap; gap:6px;">
              <span class="problem-order-pill" title="Curriculum Sequence #${p.orderIndex || (idx + 1)}">#${p.orderIndex || (idx + 1)}</span>
              ${plat.available ? `
                <a href="${p.url}" target="_blank" rel="noopener noreferrer" class="problem-title" title="Direct External Practice Link: Open '${escapeHtml(p.title)}' on ${plat.name}">
                  ${escapeHtml(p.title)}
                  <i class="fa-solid fa-arrow-up-right-from-square external-link-icon"></i>
                </a>
              ` : `
                <span class="problem-title" style="color:var(--text-dim);">${escapeHtml(p.title)}</span>
                <span class="badge badge-unavailable"><i class="fa-solid fa-link-slash"></i> Link Unavailable</span>
              `}
            </div>
            ${p.companies && p.companies.length ? `
              <div class="company-chip-wrap" style="margin-top:4px;">
                ${p.companies.slice(0, 3).map(c => `<span class="company-badge ${c.toLowerCase().replace(/[^a-z]/g, '')}">🏢 ${escapeHtml(c)}</span>`).join('')}
              </div>
            ` : ''}
          </div>
        </td>
        <td>
          <strong>${escapeHtml(p.topic)}</strong>
          <div style="font-size:11.5px; color:var(--primary); font-weight:600; margin-top:2px; display:flex; align-items:center; gap:4px;">
            <i class="fa-solid fa-folder-tree" style="font-size:10px;"></i>
            <span>${escapeHtml(p.subtopic || 'General')}</span>
          </div>
          ${p.pattern ? `<div style="font-size:10.5px; color:var(--text-dim); margin-top:1px;">${escapeHtml(p.pattern)}</div>` : ''}
        </td>
        <td><span class="badge badge-${(p.difficulty || 'medium').toLowerCase()}">${p.difficulty}</span></td>
        <td>
          <span class="badge ${plat.badgeClass}" style="font-size:11px;">
            <i class="fa-solid ${plat.icon}"></i> ${plat.name}
          </span>
        </td>
        <td>
          <div style="display:flex; flex-direction:column; gap:3px;">
            <span class="badge ${statusMeta.badgeClass}" style="font-size:11px; align-self:flex-start;">
              <i class="fa-solid ${statusMeta.icon}"></i> ${statusMeta.label}
            </span>
            <span style="font-size:11px; color:var(--text-dim);">${confBadgeHtml}</span>
          </div>
        </td>
        <td style="text-align:center;">
          <button type="button" class="btn-bookmark ${isBookmarked ? 'active' : ''} btn-action-bookmark" data-id="${p.id}" title="${isBookmarked ? 'Remove Bookmark' : 'Bookmark Problem'}" aria-label="${isBookmarked ? 'Remove Bookmark' : 'Bookmark Problem'}">
            <i class="fa-${isBookmarked ? 'solid' : 'regular'} fa-star"></i>
          </button>
        </td>
        <td>
          <div style="display:flex; gap:6px; align-items:center;">
            ${plat.available ? `
              <a href="${p.url}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm btn-action-open" title="Open '${escapeHtml(p.title)}' directly on ${plat.name}">
                <i class="fa-solid fa-arrow-up-right-from-square"></i> Solve
              </a>
            ` : `
              <button type="button" class="btn btn-secondary btn-sm" disabled title="External link not available">
                <i class="fa-solid fa-link-slash"></i>
              </button>
            `}
            <button type="button" class="btn btn-secondary btn-sm btn-action-toggle-solve" data-id="${p.id}" title="${isSolved ? 'Mark as Unsolved' : 'Mark as Solved'}">
              <i class="fa-solid ${isSolved ? 'fa-xmark' : 'fa-check'}"></i> ${isSolved ? 'Unsolve' : 'Done'}
            </button>
            <button type="button" class="btn btn-secondary btn-sm btn-action-add-revision" data-id="${p.id}" title="Add to Spaced Repetition (SRS) Review Queue">
              <i class="fa-solid fa-rotate-left"></i> Revise
            </button>
          </div>
        </td>
      `;
      tableFragment.appendChild(tr);
    });
    tbody.appendChild(tableFragment);
  }

  // Helper to wire Phase 3 Problem Library controls once
  let problemsControlsWired = false;
  function setupProblemsLibraryControls() {
    if (problemsControlsWired) return;
    problemsControlsWired = true;

    // 1. Topic navigation pills
    document.querySelectorAll('#problem-topic-pills .topic-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('#problem-topic-pills .topic-pill').forEach(p => {
          p.classList.remove('active');
          p.setAttribute('aria-selected', 'false');
        });
        pill.classList.add('active');
        pill.setAttribute('aria-selected', 'true');
        activeProblemTopicPill = pill.getAttribute('data-topic') || 'all';

        // Synchronize filter-topic dropdown
        const topicSelect = document.getElementById('filter-topic');
        if (topicSelect) {
          topicSelect.value = activeProblemTopicPill;
          populateSubtopicsDropdown(activeProblemTopicPill);
        }

        problemsCurrentPage = 1;
        renderProblemsTable();
      });
    });

    // 2. Quick search input in problem library header
    const problemSearchInput = document.getElementById('problem-search-input');
    const clearProblemSearchBtn = document.getElementById('btn-clear-problem-search');

    problemSearchInput?.addEventListener('input', (e) => {
      const val = e.target.value;
      const globalSearch = document.getElementById('global-search-input');
      if (globalSearch && globalSearch.value !== val) globalSearch.value = val;
      if (clearProblemSearchBtn) clearProblemSearchBtn.style.display = val ? 'block' : 'none';
      problemsCurrentPage = 1;
      renderProblemsTable();
    });

    clearProblemSearchBtn?.addEventListener('click', () => {
      if (problemSearchInput) problemSearchInput.value = '';
      const globalSearch = document.getElementById('global-search-input');
      if (globalSearch) globalSearch.value = '';
      clearProblemSearchBtn.style.display = 'none';
      problemsCurrentPage = 1;
      renderProblemsTable();
    });

    // 3. Platform filter dropdown
    document.getElementById('filter-platform')?.addEventListener('change', () => {
      problemsCurrentPage = 1;
      renderProblemsTable();
    });

    // 4. Sort dropdown
    document.getElementById('sort-problems')?.addEventListener('change', () => {
      problemsCurrentPage = 1;
      renderProblemsTable();
    });

    // 5. Bookmark toggle button in filter bar
    const btnBm = document.getElementById('btn-filter-bookmarks');
    const iconBm = document.getElementById('btn-filter-bookmarks-icon');
    btnBm?.addEventListener('click', () => {
      problemsBookmarkFilterActive = !problemsBookmarkFilterActive;
      if (problemsBookmarkFilterActive) {
        btnBm.classList.add('active');
        if (iconBm) {
          iconBm.className = 'fa-solid fa-star';
          iconBm.style.color = '#fbbf24';
        }
      } else {
        btnBm.classList.remove('active');
        if (iconBm) {
          iconBm.className = 'fa-regular fa-star';
          iconBm.style.color = '';
        }
      }
      problemsCurrentPage = 1;
      renderProblemsTable();
    });

    // 6. Pagination controls
    document.getElementById('problems-per-page')?.addEventListener('change', (e) => {
      problemsPerPage = e.target.value;
      problemsCurrentPage = 1;
      renderProblemsTable();
    });

    document.getElementById('pagination-btn-prev')?.addEventListener('click', () => {
      if (problemsCurrentPage > 1) {
        problemsCurrentPage--;
        renderProblemsTable();
      }
    });

    document.getElementById('pagination-btn-next')?.addEventListener('click', () => {
      problemsCurrentPage++;
      renderProblemsTable();
    });

    // 7. Active filter chips remove clicks
    document.getElementById('active-filters-bar')?.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.chip-remove-btn');
      if (removeBtn) {
        const type = removeBtn.dataset.filterType;
        if (type === 'search') {
          const s1 = document.getElementById('problem-search-input');
          const s2 = document.getElementById('global-search-input');
          if (s1) s1.value = '';
          if (s2) s2.value = '';
        } else if (type === 'topic') {
          activeProblemTopicPill = 'all';
          const ts = document.getElementById('filter-topic');
          if (ts) ts.value = 'all';
          document.querySelectorAll('#problem-topic-pills .topic-pill').forEach(p => {
            if (p.getAttribute('data-topic') === 'all') p.classList.add('active');
            else p.classList.remove('active');
          });
        } else if (type === 'subtopic') {
          const ss = document.getElementById('filter-subtopic');
          if (ss) ss.value = 'all';
        } else if (type === 'diff') {
          const ds = document.getElementById('filter-difficulty');
          if (ds) ds.value = 'all';
        } else if (type === 'platform') {
          const ps = document.getElementById('filter-platform');
          if (ps) ps.value = 'all';
        } else if (type === 'status') {
          const st = document.getElementById('filter-status');
          if (st) st.value = 'all';
        } else if (type === 'company') {
          const cs = document.getElementById('filter-company');
          if (cs) cs.value = 'all';
        } else if (type === 'sheet') {
          const sh = document.getElementById('filter-sheet');
          if (sh) sh.value = 'all';
        } else if (type === 'bookmark') {
          problemsBookmarkFilterActive = false;
          const bm = document.getElementById('btn-filter-bookmarks');
          const ic = document.getElementById('btn-filter-bookmarks-icon');
          if (bm) bm.classList.remove('active');
          if (ic) { ic.className = 'fa-regular fa-star'; ic.style.color = ''; }
        }
        problemsCurrentPage = 1;
        renderProblemsTable();
      }
    });

    document.getElementById('btn-clear-all-filters')?.addEventListener('click', () => {
      clearAllProblemFilters();
    });

    // 8. Delegate Problem Actions in table:
    // Bookmark click
    document.body.addEventListener('click', (e) => {
      const bmBtn = e.target.closest('.btn-action-bookmark');
      if (bmBtn) {
        e.preventDefault();
        e.stopPropagation();
        const id = bmBtn.dataset.id;
        if (!userStates[id]) userStates[id] = { id };
        userStates[id].isBookmarked = !userStates[id].isBookmarked;
        saveUserStates();
        renderProblemsTable();
        return;
      }

      // Mark Solved / Unsolve button click
      const solveBtn = e.target.closest('.btn-action-toggle-solve');
      if (solveBtn) {
        e.preventDefault();
        e.stopPropagation();
        const id = solveBtn.dataset.id;
        const st = userStates[id];
        const currentlySolved = st && (st.lastReviewed || st.solved);
        if (currentlySolved) {
          st.lastReviewed = null;
          st.solved = false;
          st.isMastered = false;
          st.stage = 0;
        } else {
          if (!userStates[id]) userStates[id] = { id };
          userStates[id].lastReviewed = new Date().toISOString();
          userStates[id].solved = true;
          userStates[id].stage = Math.max(1, userStates[id].stage || 1);
        }
        saveUserStates();
        renderAll();
        return;
      }

      // Add to Revision click
      const addRevBtn = e.target.closest('.btn-action-add-revision');
      if (addRevBtn) {
        e.preventDefault();
        e.stopPropagation();
        const id = addRevBtn.dataset.id;
        if (!userStates[id]) userStates[id] = { id };
        const todayStr = (function() {
          const d = new Date();
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        })();
        userStates[id].nextReviewDate = todayStr;
        userStates[id].isMastered = false;
        saveUserStates();
        renderAll();
        const prob = allProblems.find(p => p.id === id);
        const msg = `Added "${(prob && prob.title) || id}" to SRS Revision Queue.`;
        if (typeof showPlanConfirmation === 'function') {
          showPlanConfirmation(msg);
        } else {
          alert(msg);
        }
        return;
      }
    });
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
            <p>Topic: <strong>${recProblem.topic}</strong> â€¢ Pattern: <strong>${recProblem.pattern || 'Standard'}</strong> â€¢ Memory Status: <strong>${confStr}</strong></p>
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

  // --- REVISION CENTER STATE & ACTIVE RECALL SESSION CONTROLLER ---
  let currentRevisionFilter = 'due';
  let currentRevisionSearch = '';
  let currentRevisionTopic = 'all';
  let currentRevisionDiff = 'all';
  let currentRevisionSort = 'urgency';
  let activeRecallSessionState = null;

  function renderRevisionQueue() {
    renderRevisionBanner();
    const tbody = document.getElementById('revision-queue-tbody');
    if (!tbody) return;

    const rsc = (typeof window !== 'undefined' && window.RevisionSessionController) ||
      (typeof RevisionSessionController !== 'undefined' ? RevisionSessionController : null);
    if (!rsc) return;

    // 1. Authoritative metrics calculation
    const metrics = rsc.getRevisionMetrics(allProblems, userStates);

    // Update Date Badge
    const dateBadge = document.getElementById('revision-today-date-badge');
    if (dateBadge) {
      const today = new Date();
      dateBadge.textContent = today.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    }

    // 2. Populate 5 Overview Metric Cards
    const overdueVal = document.getElementById('rev-metric-overdue-val');
    const overdueSub = document.getElementById('rev-metric-overdue-sub');
    if (overdueVal) overdueVal.textContent = metrics.overdueCount;
    if (overdueSub) overdueSub.textContent = metrics.overdueCount === 1 ? '1 review past due' : (metrics.overdueCount + ' reviews past due');

    const dueTodayVal = document.getElementById('rev-metric-due-today-val');
    const dueTodaySub = document.getElementById('rev-metric-due-today-sub');
    if (dueTodayVal) dueTodayVal.textContent = metrics.dueTodayCount;
    if (dueTodaySub) dueTodaySub.textContent = metrics.dueTodayCount + ' reviews scheduled today';

    const upcomingVal = document.getElementById('rev-metric-upcoming-val');
    const upcomingSub = document.getElementById('rev-metric-upcoming-sub');
    if (upcomingVal) upcomingVal.textContent = metrics.upcomingCount;
    if (upcomingSub) upcomingSub.textContent = metrics.upcomingCount + ' reviews in next 7 days';

    const weakVal = document.getElementById('rev-metric-weak-val');
    const weakSub = document.getElementById('rev-metric-weak-sub');
    if (weakVal) weakVal.textContent = metrics.weakCount;
    if (weakSub) weakSub.textContent = metrics.topWeakTopic && metrics.topWeakTopic !== 'None' ? ('Top: ' + metrics.topWeakTopic + ' (' + metrics.topWeakTopicCount + ')') : 'Retention stable';

    const completedVal = document.getElementById('rev-metric-completed-val');
    const completedSub = document.getElementById('rev-metric-completed-sub');
    if (completedVal) completedVal.textContent = metrics.completedReviewsToday;
    if (completedSub) completedSub.textContent = metrics.uniqueProblemsCompletedToday + ' unique problem' + (metrics.uniqueProblemsCompletedToday === 1 ? '' : 's');

    // Header CTA counts & active session resume
    const startDueCount = document.getElementById('start-revision-due-count');
    if (startDueCount) startDueCount.textContent = metrics.dueNowCount;

    const resumeBtn = document.getElementById('btn-resume-revision-session');
    const resumeCount = document.getElementById('resume-session-count');
    const activeSession = rsc.getActiveSession();
    if (resumeBtn) {
      if (activeSession && activeSession.status === 'in_progress') {
        const remaining = Math.max(0, activeSession.problemIds.length - activeSession.currentIndex);
        if (resumeCount) resumeCount.textContent = remaining;
        resumeBtn.style.display = 'inline-flex';
      } else {
        resumeBtn.style.display = 'none';
      }
    }

    // Filter tab count badges
    const tabDue = document.getElementById('tab-count-due');
    if (tabDue) tabDue.textContent = metrics.dueNowCount;
    const tabOverdue = document.getElementById('tab-count-overdue');
    if (tabOverdue) tabOverdue.textContent = metrics.overdueCount;
    const tabWeak = document.getElementById('tab-count-weak');
    if (tabWeak) tabWeak.textContent = metrics.weakCount;
    const tabBookmarked = document.getElementById('tab-count-bookmarked');
    if (tabBookmarked) tabBookmarked.textContent = metrics.bookmarkedCount;
    const tabAll = document.getElementById('tab-count-all');
    if (tabAll) {
      const allRevCount = allProblems.filter(p => {
        const s = userStates[p.id];
        return s && (s.nextReviewDate || s.lastReviewed || s.isBookmarked);
      }).length;
      tabAll.textContent = allRevCount;
    }

    // Update active tab visual selection
    document.querySelectorAll('.rev-tab-btn').forEach(btn => {
      const f = btn.getAttribute('data-revision-filter');
      if (f === currentRevisionFilter) {
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
      }
    });

    // Analytics section
    const accEl = document.getElementById('rev-analytics-accuracy');
    if (accEl) accEl.textContent = metrics.recallAccuracyPct !== null ? (metrics.recallAccuracyPct + '%') : '--%';

    const distAgain = document.getElementById('rev-dist-again');
    if (distAgain) distAgain.textContent = metrics.ratingDistribution.again;
    const distHard = document.getElementById('rev-dist-hard');
    if (distHard) distHard.textContent = metrics.ratingDistribution.hard;
    const distGood = document.getElementById('rev-dist-good');
    if (distGood) distGood.textContent = metrics.ratingDistribution.good;
    const distEasy = document.getElementById('rev-dist-easy');
    if (distEasy) distEasy.textContent = metrics.ratingDistribution.easy;

    const weakTopicEl = document.getElementById('rev-analytics-weak-topic');
    if (weakTopicEl) {
      if (metrics.topWeakTopic && metrics.topWeakTopic !== 'None') {
        weakTopicEl.textContent = 'Top Risk: ' + metrics.topWeakTopic + ' (' + metrics.topWeakTopicCount + ')';
        weakTopicEl.style.display = 'inline-block';
      } else {
        weakTopicEl.textContent = 'Retention Healthy';
        weakTopicEl.style.display = 'inline-block';
      }
    }

    // 3. Query filtered & deterministically sorted problems
    const list = rsc.getFilteredQueue(allProblems, userStates, {
      filter: currentRevisionFilter,
      search: currentRevisionSearch,
      topic: currentRevisionTopic,
      difficulty: currentRevisionDiff,
      sort: currentRevisionSort
    });

    tbody.innerHTML = '';
    if (list.length === 0) {
      tbody.innerHTML = '<tr>' +
        '<td colspan="7" style="text-align:center; padding:36px 20px; color:var(--text-dim);">' +
        '<div style="font-size:16px; margin-bottom:6px; color:var(--text-main);"><i class="fa-solid fa-check-circle" style="color:var(--success); margin-right:8px;"></i>No revision items found</div>' +
        '<div style="font-size:12px;">No problems currently match filter criteria (\'' + currentRevisionFilter + '\').</div>' +
        '</td>' +
        '</tr>';
      return;
    }

    const fragment = document.createDocumentFragment();
    list.forEach(p => {
      const state = userStates[p.id] || {};
      const dueInfo = SRSEngine.getDueStatus(state);
      const conf = SRSEngine.getConfidence(state);
      const isBookmarked = Boolean(state.isBookmarked);

      let confStars = '—';
      if (conf) {
        confStars = '<span class="conf-badge conf-' + conf + '" title="' + SRSEngine.getConfidenceMeta(conf).label + '">★ ' + conf + '/5</span>';
      }

      const isOverdue = state.nextReviewDate && state.nextReviewDate < metrics.todayStr && !state.isMastered;
      const isDueToday = state.nextReviewDate && state.nextReviewDate === metrics.todayStr && !state.isMastered;

      let dateBadgeStyle = "font-family:'JetBrains Mono', monospace; font-size:12px;";
      if (isOverdue) {
        dateBadgeStyle += ' color:var(--error); font-weight:700;';
      } else if (isDueToday) {
        dateBadgeStyle += ' color:var(--warning); font-weight:700;';
      } else {
        dateBadgeStyle += ' color:var(--text-dim);';
      }

      const tr = document.createElement('tr');
      tr.innerHTML = '<td><span class="badge badge-srs-' + dueInfo.code + '">' + dueInfo.label + '</span></td>' +
        '<td>' +
        '<a href="' + (p.url || '#') + '" target="_blank" class="problem-title" rel="noopener noreferrer">' + escapeHtml(p.title) + '</a>' +
        '<div style="font-size:11px; color:var(--text-dim); margin-top:2px;">' + escapeHtml(p.pattern || p.subtopic || '') + '</div>' +
        '</td>' +
        '<td><span style="font-size:12.5px;">' + escapeHtml(p.topic || 'General') + '</span></td>' +
        '<td><span class="badge badge-' + (p.difficulty || 'medium').toLowerCase() + '">' + (p.difficulty || 'Medium') + '</span></td>' +
        '<td>' +
        '<div style="display:flex; flex-direction:column; gap:2px;">' +
        '<div>' + confStars + '</div>' +
        '<div style="font-size:11px; color:var(--text-dim);">Stage ' + (state.stage || 1) + ' &bull; ' + (state.lastRating || 'none') + '</div>' +
        '</div>' +
        '</td>' +
        '<td><span style="' + dateBadgeStyle + '">' + (state.nextReviewDate || 'N/A') + '</span></td>' +
        '<td style="text-align:right;">' +
        '<div style="display:inline-flex; align-items:center; gap:6px;">' +
        '<button type="button" class="btn btn-secondary btn-sm btn-rev-bookmark" data-problem-id="' + p.id + '" title="' + (isBookmarked ? 'Remove Bookmark' : 'Bookmark Problem') + '" style="padding:4px 8px; color:' + (isBookmarked ? 'var(--warning)' : 'var(--text-dim)') + ';">' +
        '<i class="fa-' + (isBookmarked ? 'solid' : 'regular') + ' fa-bookmark"></i>' +
        '</button>' +
        '<button type="button" class="btn btn-primary btn-sm btn-rev-start-one" data-problem-id="' + p.id + '" title="Launch Active Recall Session">' +
        '<i class="fa-solid fa-play"></i> Review' +
        '</button>' +
        '<a href="' + (p.url || '#') + '" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" title="Open verified problem page" style="padding:4px 8px;">' +
        '<i class="fa-solid fa-arrow-up-right-from-square"></i>' +
        '</a>' +
        '</div>' +
        '</td>';
      fragment.appendChild(tr);
    });
    tbody.appendChild(fragment);
  }

  // --- ACTIVE RECALL SESSION UI CONTROLLER ---
  function launchActiveRecallSession(problemIds, options = {}) {
    const rsc = window.RevisionSessionController;
    if (!rsc) return;

    if (!problemIds || problemIds.length === 0) {
      const dueList = rsc.getFilteredQueue(allProblems, userStates, { filter: 'due' });
      if (dueList.length > 0) {
        problemIds = dueList.map(p => p.id);
      } else {
        const weakList = rsc.getFilteredQueue(allProblems, userStates, { filter: 'weak' });
        if (weakList.length > 0) {
          problemIds = weakList.map(p => p.id);
        } else {
          const allList = rsc.getFilteredQueue(allProblems, userStates, { filter: 'all' });
          problemIds = allList.slice(0, 10).map(p => p.id);
        }
      }
    }

    if (!problemIds || problemIds.length === 0) {
      alert('No problems available for revision session.');
      return;
    }

    activeRecallSessionState = rsc.startSession(problemIds, options);
    renderActiveRecallSessionModal();
  }

  function resumeActiveRecallSession() {
    const rsc = window.RevisionSessionController;
    if (!rsc) return;
    const session = rsc.getActiveSession();
    if (!session) {
      renderRevisionQueue();
      return;
    }
    activeRecallSessionState = session;
    renderActiveRecallSessionModal();
  }

  function renderActiveRecallSessionModal() {
    const modal = document.getElementById('modal-active-recall-session');
    if (!modal || !activeRecallSessionState) return;

    const session = activeRecallSessionState;
    const activeContainer = document.getElementById('recall-session-active-container');
    const summaryContainer = document.getElementById('recall-session-summary');

    if (session.status === 'completed' || session.currentIndex >= session.problemIds.length) {
      if (activeContainer) activeContainer.style.display = 'none';
      if (summaryContainer) summaryContainer.style.display = 'block';

      const reviewedCount = session.completedReviews ? session.completedReviews.length : 0;
      let retainedCount = 0;
      if (session.completedReviews) {
        session.completedReviews.forEach(r => {
          if (r.rating === 'good' || r.rating === 'easy' || r.rating === 'medium' || r.rating === 'simple') {
            retainedCount++;
          }
        });
      }

      const revEl = document.getElementById('summary-problems-reviewed');
      const retEl = document.getElementById('summary-retained-count');
      const xpEl = document.getElementById('summary-xp-earned');
      if (revEl) revEl.textContent = reviewedCount;
      if (retEl) retEl.textContent = retainedCount;
      if (xpEl) xpEl.textContent = '+' + (reviewedCount * 15);

      modal.style.display = 'flex';
      return;
    }

    if (activeContainer) activeContainer.style.display = 'block';
    if (summaryContainer) summaryContainer.style.display = 'none';

    const currentId = session.problemIds[session.currentIndex];
    const problem = allProblems.find(p => p.id === currentId) || { id: currentId, title: currentId, topic: 'General', difficulty: 'Medium' };

    const stepCounter = document.getElementById('recall-step-counter');
    if (stepCounter) stepCounter.textContent = 'Problem ' + (session.currentIndex + 1) + ' of ' + session.problemIds.length;

    const stepBar = document.getElementById('recall-step-bar-fill');
    if (stepBar) {
      const pct = Math.round(((session.currentIndex) / session.problemIds.length) * 100);
      stepBar.style.width = pct + '%';
    }

    const titleEl = document.getElementById('recall-problem-title');
    if (titleEl) titleEl.textContent = problem.title || currentId;

    const diffEl = document.getElementById('recall-problem-diff');
    if (diffEl) {
      diffEl.textContent = problem.difficulty || 'Medium';
      diffEl.className = 'badge badge-' + (problem.difficulty || 'medium').toLowerCase();
    }

    const topicEl = document.getElementById('recall-problem-topic');
    if (topicEl) topicEl.textContent = problem.topic || 'General';

    const patternEl = document.getElementById('recall-problem-pattern');
    if (patternEl) patternEl.textContent = problem.pattern ? ('Pattern: ' + problem.pattern) : (problem.subtopic ? ('Subtopic: ' + problem.subtopic) : '');

    const extLink = document.getElementById('recall-problem-ext-link');
    if (extLink) extLink.href = problem.url || '#';

    const scratchpad = document.getElementById('recall-scratchpad-input');
    if (scratchpad) scratchpad.value = session.scratchpadNotes || '';

    const hintDisplay = document.getElementById('recall-hint-display');
    const hintText = document.getElementById('recall-hint-text');
    const hintTitle = document.getElementById('recall-hint-level-title');
    const btnHint = document.getElementById('btn-reveal-hint-text');
    if (session.hintsRevealed && session.hintsRevealed > 0) {
      const hintObj = window.RevisionSessionController.getScaffoldingHint(problem, session.hintsRevealed);
      if (hintDisplay) hintDisplay.style.display = 'block';
      if (hintText) hintText.textContent = hintObj.text;
      if (hintTitle) hintTitle.textContent = 'Hint Level ' + hintObj.level + ': ' + hintObj.category;
      if (btnHint) btnHint.textContent = 'Reveal Next Hint (' + Math.min(session.hintsRevealed + 1, 5) + '/5)';
    } else {
      if (hintDisplay) hintDisplay.style.display = 'none';
      if (btnHint) btnHint.textContent = 'Reveal Progressive Hint (1/5)';
    }

    const solutionDisplay = document.getElementById('recall-solution-display');
    const solutionText = document.getElementById('recall-solution-text');
    if (session.solutionRevealed) {
      const sol = window.RevisionSessionController.getSolutionGuidance(problem);
      if (solutionDisplay) solutionDisplay.style.display = 'block';
      if (solutionText) solutionText.textContent = sol.approach + ' (Time: ' + sol.timeComplexity + ', Space: ' + sol.spaceComplexity + ')';
    } else {
      if (solutionDisplay) solutionDisplay.style.display = 'none';
    }

    modal.style.display = 'flex';
  }

  function handleRecallRatingClick(ratingKey) {
    if (!activeRecallSessionState) return;
    const rsc = window.RevisionSessionController;
    if (!rsc) return;

    const session = activeRecallSessionState;
    const currentId = session.problemIds[session.currentIndex];

    const scratchpad = document.getElementById('recall-scratchpad-input');
    const notes = scratchpad ? scratchpad.value : '';

    const res = rsc.submitRecallRating(currentId, ratingKey, 10, notes, {
      hintsUsed: (session.hintsRevealed > 0) || Boolean(session.solutionRevealed),
      hintsRevealed: session.hintsRevealed || 0,
      solutionRevealed: Boolean(session.solutionRevealed),
      userStatesRef: userStates
    });

    if (!res.success) {
      console.warn('Rating submission blocked:', res);
      return;
    }

    // Refresh badges & stats across views
    updateSidebarBadges();
    updateGamificationHeader();
    if (typeof updateDashboardStats === 'function') updateDashboardStats();
    if (typeof renderRoadmapView === 'function') renderRoadmapView();

    activeRecallSessionState = res.session;

    if (res.isSessionComplete) {
      renderActiveRecallSessionModal();
    } else {
      session.hintsRevealed = 0;
      session.solutionRevealed = false;
      session.scratchpadNotes = '';
      renderActiveRecallSessionModal();
    }
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
  let analyticsTopicSearch = '';
  let analyticsTopicFilter = 'all';
  let cachedTopicMasteryList = [];

  function renderAnalytics() {
    // 1. Stage 9 Authoritative Analytics Computation
    if (typeof AnalyticsEngine !== 'undefined') {
      const analytics = AnalyticsEngine.computeComprehensiveAnalytics({
        timeWindow: currentAnalyticsWindow,
        useCache: true
      });

      const ov = analytics.overview || {};
      const act = analytics.activity || {};
      const eff = analytics.effectiveness || {};
      const adh = analytics.adherence || analytics.consistency || {};
      const top = analytics.topicMastery || analytics.topicAnalytics || {};
      const ret = analytics.retention || {};
      const ps = analytics.problemSolving || analytics.performance || {};
      const mock = analytics.mock || {};
      const recs = analytics.recommendations || [];

      // SECTION 1: LEARNING OVERVIEW
      const uniqueSolvedEl = document.getElementById('analytics-unique-solved');
      const catalogTotalEl = document.getElementById('analytics-catalog-total');
      const uniqueAttemptedEl = document.getElementById('analytics-unique-attempted');
      const coverageBadgeEl = document.getElementById('analytics-coverage-badge');
      const attemptedBadgeEl = document.getElementById('analytics-attempted-badge');
      const sessionsInitiatedEl = document.getElementById('analytics-sessions-initiated');
      const verifiedSolvedEl = document.getElementById('analytics-verified-solved');
      const roadmapPctEl = document.getElementById('analytics-roadmap-pct');
      const roadmapCompletedEl = document.getElementById('analytics-roadmap-completed');
      const roadmapTotalEl = document.getElementById('analytics-roadmap-total');
      const roadmapNameEl = document.getElementById('analytics-roadmap-name');
      const currentStreakEl = document.getElementById('analytics-current-streak');
      const learningTimeEl = document.getElementById('analytics-learning-time');
      const timeEventsCountEl = document.getElementById('analytics-time-events-count');

      const totalCatalog = ov.totalCatalogProblems || act.totalCatalogProblems || 479;
      const solvedCount = ov.selfReportedSolvedProblems !== undefined ? ov.selfReportedSolvedProblems : (act.uniqueProblemsSolved || 0);
      const attemptedCount = ov.uniqueProblemsAttempted !== undefined ? ov.uniqueProblemsAttempted : (act.uniqueProblemsAttempted || 0);

      if (uniqueSolvedEl) uniqueSolvedEl.textContent = solvedCount;
      if (catalogTotalEl) catalogTotalEl.textContent = totalCatalog;
      if (coverageBadgeEl) {
        const covPct = totalCatalog > 0 ? Math.round((solvedCount / totalCatalog) * 100) : 0;
        coverageBadgeEl.textContent = `${covPct}% of Catalog`;
      }

      if (uniqueAttemptedEl) uniqueAttemptedEl.textContent = attemptedCount;
      if (attemptedBadgeEl) {
        const attPct = totalCatalog > 0 ? Math.round((attemptedCount / totalCatalog) * 100) : 0;
        attemptedBadgeEl.textContent = `${attPct}% of Catalog`;
      }
      if (sessionsInitiatedEl) sessionsInitiatedEl.textContent = ov.totalPracticeSessions !== undefined ? ov.totalPracticeSessions : (act.totalSessionsInitiated || 0);
      if (verifiedSolvedEl) verifiedSolvedEl.textContent = ov.verifiedSolvedProblems !== undefined ? ov.verifiedSolvedProblems : 0;

      if (roadmapPctEl) roadmapPctEl.textContent = `${ov.roadmapCompletionPercent !== undefined ? ov.roadmapCompletionPercent : 0}%`;
      if (roadmapCompletedEl) roadmapCompletedEl.textContent = ov.completedRoadmapAssignments !== undefined ? ov.completedRoadmapAssignments : 0;
      if (roadmapTotalEl) roadmapTotalEl.textContent = ov.totalRoadmapAssignments !== undefined ? ov.totalRoadmapAssignments : 0;
      if (roadmapNameEl) roadmapNameEl.textContent = ov.activeRoadmapTitle || '120-Day Dual-Stream Roadmap';

      if (currentStreakEl) currentStreakEl.textContent = ov.currentStreak !== undefined ? ov.currentStreak : (adh.currentStreak || 0);

      if (learningTimeEl) {
        const totalMins = (act.timeTracking && act.timeTracking.totalReliableTimeMinutes) || 0;
        const hrs = Math.floor(totalMins / 60);
        const mins = Math.round(totalMins % 60);
        learningTimeEl.textContent = `${hrs}h ${mins}m`;
      }
      if (timeEventsCountEl && act.timeTracking) {
        timeEventsCountEl.textContent = act.timeTracking.recordedTimeEventCount || 0;
      }

      // SECTION 2: ACTIONABLE RECOMMENDATIONS
      const recContainer = document.getElementById('analytics-recommendations-container');
      if (recContainer) {
        recContainer.innerHTML = '';
        if (recs.length === 0) {
          recContainer.innerHTML = `
            <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:8px; padding:20px; text-align:center; color:var(--text-muted); font-size:13px;">
              <i class="fa-solid fa-circle-check" style="color:var(--accent-green); font-size:24px; margin-bottom:8px; display:block;"></i>
              <strong>All recommendations up to date!</strong><br>
              Continue your roadmap schedule or review upcoming flashcards to keep retention optimal.
            </div>
          `;
        } else {
          const recFrag = document.createDocumentFragment();
          recs.forEach(rec => {
            const card = document.createElement('div');
            const priorityClass = rec.priority >= 4 ? 'priority-high' : (rec.priority >= 3 ? 'priority-medium' : 'priority-low');
            const badgeClass = rec.priority >= 4 ? 'badge-hard' : (rec.priority >= 3 ? 'badge-medium' : 'badge-easy');
            const priorityLabel = rec.priority >= 4 ? 'High Priority' : (rec.priority >= 3 ? 'Recommended' : 'Optional');

            card.className = `recommendation-card ${priorityClass}`;
            card.innerHTML = `
              <div class="rec-card-header">
                <div class="rec-badge-title">
                  <span class="badge ${badgeClass}">${escapeHtml(rec.badge || 'Action')}</span>
                  <h4 class="rec-card-title">${escapeHtml(rec.title)}</h4>
                </div>
                <span class="rec-priority-label">${priorityLabel}</span>
              </div>
              <p class="rec-reason">${escapeHtml(rec.reason)}</p>
              <div class="rec-evidence-block">
                <span class="rec-evidence-icon"><i class="fa-solid fa-chart-line"></i></span>
                <span class="rec-evidence-text"><strong>Evidence:</strong> ${escapeHtml(rec.supportingEvidence)}</span>
              </div>
              <div class="rec-action-footer">
                <span class="rec-action-note">${escapeHtml(rec.recommendedAction)}</span>
                <button type="button" class="btn btn-primary btn-sm btn-rec-action" data-destination="${escapeHtml(rec.destination)}">
                  ${escapeHtml(rec.actionLabel || 'Proceed')} <i class="fa-solid fa-arrow-right" style="margin-left:4px;"></i>
                </button>
              </div>
            `;
            recFrag.appendChild(card);
          });
          recContainer.appendChild(recFrag);
        }
      }

      // SECTION 3: TOPIC MASTERY METRICS
      const strengthsEl = document.getElementById('analytics-top-strengths');
      const weaknessesEl = document.getElementById('analytics-top-weaknesses');
      if (strengthsEl) {
        strengthsEl.textContent = top.topStrengths && top.topStrengths.length > 0
          ? top.topStrengths.map(s => `${s.topic} (${s.masteryScore || s.accuracy || 0}%)`).join(', ')
          : 'None recorded yet';
      }
      if (weaknessesEl) {
        weaknessesEl.textContent = top.topWeaknesses && top.topWeaknesses.length > 0
          ? top.topWeaknesses.map(w => `${w.topic} (${w.masteryScore || w.accuracy || 0}%)`).join(', ')
          : 'None recorded yet';
      }

      // Cache topic list for filtering
      if (Array.isArray(top.topics) && top.topics.length > 0) {
        cachedTopicMasteryList = top.topics;
      } else {
        const topicMasteryMap = SRSEngine.calculateTopicMastery(allProblems, userStates);
        cachedTopicMasteryList = Object.values(topicMasteryMap);
      }
      renderTopicMatrixOnly();

      // SECTION 4: RETENTION & REVISION ANALYTICS
      const srsDueEl = document.getElementById('analytics-srs-due');
      const srsOverdueEl = document.getElementById('analytics-srs-overdue');
      const srsCompletedEl = document.getElementById('analytics-srs-completed');
      const srsRecallRateEl = document.getElementById('analytics-srs-recall-rate');

      if (srsDueEl) srsDueEl.textContent = ret.dueReviews !== undefined ? ret.dueReviews : 0;
      if (srsOverdueEl) srsOverdueEl.textContent = ret.overdueReviews !== undefined ? ret.overdueReviews : 0;
      if (srsCompletedEl) srsCompletedEl.textContent = ret.completedReviews !== undefined ? ret.completedReviews : 0;
      if (srsRecallRateEl) srsRecallRateEl.textContent = ret.recallSuccessRate !== null && ret.recallSuccessRate !== undefined ? `${ret.recallSuccessRate}%` : '--%';

      const srsDiff = ret.difficultyDistribution || {};
      const simpleCountEl = document.getElementById('analytics-srs-simple-count');
      const medCountEl = document.getElementById('analytics-srs-medium-count');
      const hardCountEl = document.getElementById('analytics-srs-hard-count');
      const failedCountEl = document.getElementById('analytics-srs-failed-count');
      if (simpleCountEl) simpleCountEl.textContent = srsDiff.simple || 0;
      if (medCountEl) medCountEl.textContent = srsDiff.medium || 0;
      if (hardCountEl) hardCountEl.textContent = srsDiff.hard || 0;
      if (failedCountEl) failedCountEl.textContent = srsDiff.failed || 0;

      const srsStage = ret.stageDistribution || {};
      const st0El = document.getElementById('analytics-stage-0-count');
      const st1El = document.getElementById('analytics-stage-1-count');
      const st2El = document.getElementById('analytics-stage-2-count');
      const st3El = document.getElementById('analytics-stage-3-count');
      const st4El = document.getElementById('analytics-stage-4-count');
      if (st0El) st0El.textContent = srsStage.stage0 || 0;
      if (st1El) st1El.textContent = srsStage.stage1 || 0;
      if (st2El) st2El.textContent = srsStage.stage2 || 0;
      if (st3El) st3El.textContent = srsStage.stage3 || 0;
      if (st4El) st4El.textContent = srsStage.stage4Plus || 0;

      // SECTION 5: PROBLEM-SOLVING PERFORMANCE
      const sampleSizeEl = document.getElementById('analytics-outcome-sample-size');
      if (sampleSizeEl) sampleSizeEl.textContent = `${act.totalTerminalAttempts || 0} evaluated attempts`;

      const indCountEl = document.getElementById('analytics-ind-count');
      const indPctEl = document.getElementById('analytics-ind-pct');
      const astCountEl = document.getElementById('analytics-ast-count');
      const astPctEl = document.getElementById('analytics-ast-pct');
      const revCountEl = document.getElementById('analytics-rev-count');
      const revPctEl = document.getElementById('analytics-rev-pct');
      const failCountEl = document.getElementById('analytics-fail-count');
      const failPctEl = document.getElementById('analytics-fail-pct');

      const outcomes = act.outcomes || { independentSolves: 0, assistedSolves: 0, solutionReveals: 0, failedAttempts: 0 };
      if (indCountEl) indCountEl.textContent = outcomes.independentSolves || 0;
      if (indPctEl) indPctEl.textContent = `${eff.independentSolveRate || 0}%`;
      if (astCountEl) astCountEl.textContent = outcomes.assistedSolves || 0;
      if (astPctEl) astPctEl.textContent = `${eff.assistedSolveRate || 0}%`;
      if (revCountEl) revCountEl.textContent = outcomes.solutionReveals || 0;
      if (revPctEl) revPctEl.textContent = `${eff.solutionRevealRate || 0}%`;
      if (failCountEl) failCountEl.textContent = outcomes.failedAttempts || 0;
      if (failPctEl) failPctEl.textContent = `${eff.failureRate || 0}%`;

      if (window.DSACharts && typeof window.DSACharts.renderOutcomeDoughnut === 'function') {
        window.DSACharts.renderOutcomeDoughnut('analytics-outcome-chart', outcomes);
      }

      const independenceRateEl = document.getElementById('analytics-independence-rate');
      const independenceCaptionEl = document.getElementById('analytics-independence-caption');
      if (independenceRateEl) {
        independenceRateEl.textContent = eff.independentSolveRate !== null && eff.independentSolveRate !== undefined ? `${eff.independentSolveRate}%` : '--%';
      }
      if (independenceCaptionEl) {
        independenceCaptionEl.textContent = eff.insufficientData
          ? 'No terminal evaluations in window'
          : `${outcomes.independentSolves || 0} of ${act.totalTerminalAttempts || 0} solves unassisted`;
      }

      const hintDepEl = document.getElementById('analytics-hint-dependency');
      const adherenceEl = document.getElementById('analytics-adherence-rate');
      const pausedEl = document.getElementById('analytics-paused-count');
      const abandonedEl = document.getElementById('analytics-abandoned-count');
      const draftsEl = document.getElementById('analytics-drafts-count');

      if (hintDepEl) hintDepEl.textContent = eff.hintDependencyIndex !== null && eff.hintDependencyIndex !== undefined ? `${eff.hintDependencyIndex} hints` : 'N/A';
      if (adherenceEl) adherenceEl.textContent = adh.adherenceRate !== null && adh.adherenceRate !== undefined ? `${adh.adherenceRate}%` : 'N/A';
      if (pausedEl) pausedEl.textContent = outcomes.pausedSessions || 0;
      if (abandonedEl) abandonedEl.textContent = outcomes.abandonedSessions || 0;
      if (draftsEl) draftsEl.textContent = outcomes.activeDrafts || 0;

      const diffBreak = ps.difficultyBreakdown || {};
      const diffEasyEl = document.getElementById('analytics-diff-easy-stat');
      const diffMedEl = document.getElementById('analytics-diff-med-stat');
      const diffHardEl = document.getElementById('analytics-diff-hard-stat');
      if (diffEasyEl) diffEasyEl.textContent = `${diffBreak.Easy?.attempts || 0} attempts (${diffBreak.Easy?.solved || 0} solved)`;
      if (diffMedEl) diffMedEl.textContent = `${diffBreak.Medium?.attempts || 0} attempts (${diffBreak.Medium?.solved || 0} solved)`;
      if (diffHardEl) diffHardEl.textContent = `${diffBreak.Hard?.attempts || 0} attempts (${diffBreak.Hard?.solved || 0} solved)`;

      // SECTION 6: MOCK INTERVIEW PERFORMANCE
      const mockCompletedEl = document.getElementById('analytics-mock-completed');
      const mockAbandonedEl = document.getElementById('analytics-mock-abandoned');
      const mockCompRateEl = document.getElementById('analytics-mock-completion-rate');
      const mockAvgScoreEl = document.getElementById('analytics-mock-avg-score');
      const mockBestScoreEl = document.getElementById('analytics-mock-best-score');
      const mockReviewReqEl = document.getElementById('analytics-mock-review-req');
      const mockGradeDistEl = document.getElementById('analytics-mock-grade-distribution');
      const mockTopicsListEl = document.getElementById('analytics-mock-topics-list');

      if (mockCompletedEl) mockCompletedEl.textContent = mock.completedCount || 0;
      if (mockAbandonedEl) mockAbandonedEl.textContent = mock.abandonedCount || 0;
      if (mockCompRateEl) mockCompRateEl.textContent = `${mock.completionRate || 0}%`;
      if (mockAvgScoreEl) mockAvgScoreEl.textContent = mock.averageScore > 0 ? `${Math.round(mock.averageScore)}% (${(mock.averageScore / 5).toFixed(1)}/20)` : 'N/A';
      if (mockBestScoreEl) mockBestScoreEl.textContent = mock.bestScore > 0 ? `${Math.round(mock.bestScore)}% (${(mock.bestScore / 5).toFixed(1)}/20)` : 'N/A';
      if (mockReviewReqEl) mockReviewReqEl.textContent = mock.reviewRequiredCount || 0;

      if (mockGradeDistEl) {
        const gd = mock.gradeDistribution || {};
        mockGradeDistEl.innerHTML = `
          <span class="badge badge-accent" style="font-size:11px;">Strong Hire: ${gd.strongHire || 0}</span>
          <span class="badge badge-easy" style="font-size:11px;">Solid Hire: ${gd.solidHire || 0}</span>
          <span class="badge badge-medium" style="font-size:11px;">Borderline: ${gd.borderline || 0}</span>
          <span class="badge badge-hard" style="font-size:11px;">Needs Practice: ${gd.notReady || 0}</span>
        `;
      }

      if (mockTopicsListEl) {
        if (Array.isArray(mock.topicsPracticed) && mock.topicsPracticed.length > 0) {
          mockTopicsListEl.innerHTML = mock.topicsPracticed.map(tp => `
            <span class="badge badge-secondary" style="font-size:11px; margin-right:4px; margin-bottom:4px;">${escapeHtml(tp)}</span>
          `).join('');
        } else {
          mockTopicsListEl.textContent = 'None recorded yet';
        }
      }

      // SECTION 7: ACTIVITY & CONSISTENCY
      const consistencyEl = document.getElementById('analytics-consistency-score');
      if (consistencyEl) {
        consistencyEl.textContent = `${adh.consistencyScore || 0}% (${adh.activeDaysLast30d || 0}/30d)`;
      }

      const scopeBadgeEl = document.getElementById('analytics-account-scope-badge');
      if (scopeBadgeEl) {
        scopeBadgeEl.textContent = analytics.context && analytics.context.isGuest ? 'Guest Scope' : `User: ${(analytics.context && analytics.context.userId ? analytics.context.userId.substring(0, 8) : 'anon')}...`;
      }
    }

    // Preserved Charts & Radar
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
      if (typeof DSACharts.renderMasteryRadar === 'function') {
        DSACharts.renderMasteryRadar('analytics-radar-chart', topicMasteryMap);
      }
      if (typeof DSACharts.renderDifficultyDoughnut === 'function') {
        DSACharts.renderDifficultyDoughnut('analytics-doughnut-chart', { easySolved, mediumSolved, hardSolved });
      }
    }

    renderMasteryCalibration();
    renderActivityHeatmap();
  }

  function renderTopicMatrixOnly() {
    const container = document.getElementById('topic-matrix-container');
    if (!container) return;

    container.innerHTML = '';
    const matrixFragment = document.createDocumentFragment();

    const filtered = cachedTopicMasteryList.filter(t => {
      // 1. Search text filter
      if (analyticsTopicSearch && !t.topic.toLowerCase().includes(analyticsTopicSearch)) {
        return false;
      }
      // 2. Status filter
      if (analyticsTopicFilter === 'at-risk') {
        return t.isAtRisk === true || t.retentionStatus === 'at-risk' || (t.accuracy !== null && t.accuracy < 50 && (t.attempted || t.solved) >= 3);
      } else if (analyticsTopicFilter === 'proficient') {
        return t.retentionStatus === 'proficient' || (t.accuracy >= 70 && !t.isAtRisk);
      } else if (analyticsTopicFilter === 'mastered') {
        return t.retentionStatus === 'mastered' || (t.mastered > 0 && t.mastered === t.total);
      } else if (analyticsTopicFilter === 'unattempted') {
        return t.retentionStatus === 'unattempted' || (!t.attempted && !t.solved);
      }
      return true;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px;">
          <i class="fa-solid fa-filter" style="font-size: 20px; margin-bottom: 8px; display: block; opacity: 0.5;"></i>
          No topics match the selected search or filter criteria.
        </div>
      `;
      return;
    }

    filtered.forEach(t => {
      const card = document.createElement('div');
      card.className = 'topic-health-card';

      const isUnattempted = (!t.solved && !t.attempted) || t.retentionStatus === 'unattempted';
      const isRisk = t.isAtRisk || t.retentionStatus === 'at-risk';
      const isMastered = t.retentionStatus === 'mastered';
      const isProficient = t.retentionStatus === 'proficient';

      const healthBadge = isUnattempted ? 'badge-srs-unsolved' : (isRisk ? 'badge-hard' : (isMastered ? 'badge-accent' : (isProficient ? 'badge-easy' : 'badge-medium')));
      const healthLabel = isUnattempted ? 'Not Started ⚪' : (isRisk ? 'Needs Attention ⚠️' : (isMastered ? 'Mastered 🏆' : (isProficient ? 'Proficient 🟢' : 'Developing 🟡')));

      const score = t.score !== undefined ? t.score : (t.accuracy !== null && t.accuracy !== undefined ? t.accuracy : 0);
      const solved = t.solved || 0;
      const total = t.total || 0;
      const mastered = t.mastered || 0;
      const weakCount = t.weakProblemsCount || 0;
      const conf = t.avgConfidence ? Number(t.avgConfidence).toFixed(1) : 0;

      card.innerHTML = `
        <div class="topic-card-top">
          <span class="topic-card-title">${escapeHtml(t.topic)}</span>
          <span class="badge ${healthBadge}">${healthLabel}</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:12px; color:var(--text-muted); margin-top:4px;">
          <span>Accuracy: <strong style="color:var(--text-main);">${t.accuracy !== null && t.accuracy !== undefined ? `${t.accuracy}%` : `${score}%`}</strong></span>
          <span>${solved} / ${total} Solved</span>
        </div>
        <div class="mastery-progress-bar" style="margin: 6px 0;">
          <div class="mastery-fill" style="width: ${Math.round((solved / Math.max(1, total)) * 100)}%;"></div>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; color:var(--text-dim);">
          <span>🏆 ${mastered} Mastered</span>
          ${conf > 0 ? `<span class="conf-badge conf-${Math.round(conf)}" style="font-size:10px;">★ ${conf}/5 Conf</span>` : `<span>🔔 ${(t.due || 0) + (t.overdue || 0)} Due</span>`}
        </div>
        ${weakCount > 0 ? `<div style="font-size:11px; color:var(--accent-red); margin-top:4px;"><i class="fa-solid fa-triangle-exclamation"></i> ${weakCount} weak problem${weakCount > 1 ? 's' : ''}</div>` : ''}
        <button type="button" class="btn btn-secondary btn-xs btn-topic-matrix-practice" data-topic="${escapeHtml(t.topic)}" style="margin-top:8px; width:100%; justify-content:center; font-size:11px; padding:5px 8px;">
          <i class="fa-solid fa-play"></i> Practice ${escapeHtml(t.topic)}
        </button>
      `;
      matrixFragment.appendChild(card);
    });

    container.appendChild(matrixFragment);
  }

  function populateMetricRegistryModal() {
    const container = document.getElementById('metric-registry-cards-container');
    if (!container || typeof AnalyticsEngine === 'undefined') return;

    const registry = AnalyticsEngine.METRIC_REGISTRY;
    container.innerHTML = '';
    const fragment = document.createDocumentFragment();

    Object.entries(registry).forEach(([key, item]) => {
      const card = document.createElement('div');
      card.className = 'metric-registry-card';
      card.innerHTML = `
        <div class="metric-registry-header">
          <h4 class="metric-registry-title">${escapeHtml(item.name)}</h4>
          <span class="badge badge-secondary" style="font-family:monospace; font-size:11px;">${escapeHtml(key)}</span>
        </div>
        <p class="metric-registry-definition">${escapeHtml(item.definition)}</p>
        <div class="metric-registry-grid">
          <div class="metric-meta-item">
            <span class="metric-meta-label">Source of Truth</span>
            <span class="metric-meta-val">${escapeHtml(item.sourceOfTruth)}</span>
          </div>
          <div class="metric-meta-item">
            <span class="metric-meta-label">Denominator</span>
            <span class="metric-meta-val">${escapeHtml(item.denominator)}</span>
          </div>
          <div class="metric-meta-item">
            <span class="metric-meta-label">Inclusion Rules</span>
            <span class="metric-meta-val">${escapeHtml(item.inclusionRules)}</span>
          </div>
          <div class="metric-meta-item">
            <span class="metric-meta-label">Exclusion Rules</span>
            <span class="metric-meta-val">${escapeHtml(item.exclusionRules)}</span>
          </div>
          <div class="metric-meta-item">
            <span class="metric-meta-label">Null Handling</span>
            <span class="metric-meta-val">${escapeHtml(item.nullHandling)}</span>
          </div>
          <div class="metric-meta-item">
            <span class="metric-meta-label">Deduplication</span>
            <span class="metric-meta-val">${escapeHtml(item.deduplicationPolicy)}</span>
          </div>
        </div>
        ${item.limitations ? `
          <div class="metric-registry-limitation">
            <i class="fa-solid fa-triangle-exclamation" style="margin-right:6px;"></i>
            <span><strong>Limitation:</strong> ${escapeHtml(item.limitations)}</span>
          </div>
        ` : ''}
      `;
      fragment.appendChild(card);
    });

    container.appendChild(fragment);
  }

  function setupAnalyticsViewListeners() {
    // 1. Metric Registry modal open/close
    const btnOpenRegistry = document.getElementById('btn-open-metric-registry');
    const modalRegistry = document.getElementById('modal-metric-registry');
    const btnCloseRegistry = document.getElementById('btn-close-metric-registry');
    const btnDoneRegistry = document.getElementById('btn-done-metric-registry');

    if (btnOpenRegistry && !btnOpenRegistry.dataset.bound) {
      btnOpenRegistry.dataset.bound = 'true';
      btnOpenRegistry.addEventListener('click', () => {
        populateMetricRegistryModal();
        modalRegistry?.classList.add('open');
      });
    }

    if (btnCloseRegistry && !btnCloseRegistry.dataset.bound) {
      btnCloseRegistry.dataset.bound = 'true';
      btnCloseRegistry.addEventListener('click', () => {
        modalRegistry?.classList.remove('open');
      });
    }

    if (btnDoneRegistry && !btnDoneRegistry.dataset.bound) {
      btnDoneRegistry.dataset.bound = 'true';
      btnDoneRegistry.addEventListener('click', () => {
        modalRegistry?.classList.remove('open');
      });
    }

    if (modalRegistry && !modalRegistry.dataset.bound) {
      modalRegistry.dataset.bound = 'true';
      modalRegistry.addEventListener('click', (e) => {
        if (e.target === modalRegistry) {
          modalRegistry.classList.remove('open');
        }
      });
    }

    // 2. Topic Search & Filter
    const topicSearchInput = document.getElementById('analytics-topic-search');
    if (topicSearchInput && !topicSearchInput.dataset.bound) {
      topicSearchInput.dataset.bound = 'true';
      topicSearchInput.addEventListener('input', (e) => {
        analyticsTopicSearch = (e.target.value || '').trim().toLowerCase();
        renderTopicMatrixOnly();
      });
    }

    const topicFilterSelect = document.getElementById('analytics-topic-filter');
    if (topicFilterSelect && !topicFilterSelect.dataset.bound) {
      topicFilterSelect.dataset.bound = 'true';
      topicFilterSelect.addEventListener('change', (e) => {
        analyticsTopicFilter = e.target.value || 'all';
        renderTopicMatrixOnly();
      });
    }

    // 3. Delegated clicks on Recommendations container
    const recContainer = document.getElementById('analytics-recommendations-container');
    if (recContainer && !recContainer.dataset.bound) {
      recContainer.dataset.bound = 'true';
      recContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-rec-action');
        if (btn && btn.dataset.destination) {
          e.preventDefault();
          const dest = btn.dataset.destination;
          if (dest.startsWith('#/')) {
            window.location.hash = dest;
            const route = dest.replace('#/', '');
            if (typeof switchView === 'function') {
              switchView(route);
            }
          }
        }
      });
    }
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
    const analyticsGridEl = document.getElementById('analytics-heatmap-grid');
    if (!gridEl && !analyticsGridEl) return;

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
    if (gridEl) {
      gridEl.innerHTML = '';
      gridEl.appendChild(heatmapFragment);
    }
    if (analyticsGridEl) {
      analyticsGridEl.innerHTML = '';
      analyticsGridEl.appendChild(heatmapFragment.cloneNode(true));
    }

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
        <span class="company-badge ${c.toLowerCase().replace(/[^a-z]/g, '')}">ðŸ¢ ${c}</span>
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
    document.getElementById('modal-rating-subtitle').textContent = `${p.topic} â€¢ ${p.difficulty} â€¢ ${p.pattern || ''}`;
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

    const updatedState = userStates[activeRatingProblemId] || {};
    const probObj = allProblems.find(item => item.id === activeRatingProblemId);
    const probTitle = probObj ? probObj.title : 'Problem';
    const nextDate = updatedState.nextReviewDate;
    const intervalDays = updatedState.intervalDays || 1;

    let confirmMsg = `âœ“ Review recorded for "${probTitle}".`;
    if (nextDate) {
      confirmMsg += ` Next review: ${nextDate} (${intervalDays}d interval).`;
    }
    showPlanConfirmation(confirmMsg);
  }

  function openDetailModal(problemId) {
    const p = allProblems.find(item => item.id === problemId);
    if (!p) return;

    activeDetailProblemId = problemId;
    const state = userStates[problemId];

    document.getElementById('detail-modal-title').textContent = p.title;
    document.getElementById('detail-modal-meta').textContent = `${p.topic} â€¢ ${p.difficulty}${p.pattern ? ` â€¢ ${p.pattern}` : ''}`;

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
        ? p.companies.map(c => `<span class="company-badge ${c.toLowerCase().replace(/[^a-z]/g, '')}">ðŸ¢ ${c}</span>`).join('')
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
                ${sConf ? `<span class="conf-badge conf-${sConf}" style="font-size:10px;">â­ ${sConf}/5</span>` : (sSolved ? `<span class="badge badge-easy" style="font-size:10px;">Solved</span>` : `<span class="badge badge-srs-unsolved" style="font-size:10px;">Next</span>`)}
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
    } catch (_) { }
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
    alert(`ðŸŽ‰ Assessment Complete!\n\nScore: ${evaluation.percentage}%\nGrade: ${evaluation.grade}\n\n${evaluation.summary}`);
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
      alert(`ðŸŽ‰ Cross-Device Sync Successful!\n\nImported ${importedCount} reviewed questions & test history. All progress is now in sync on this device!`);
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
      if (!window.location.hash || window.location.hash === '#' || window.location.hash === '#/') {
        switchView('dashboard');
        return;
      }
      if (window.location.hash.includes('sync=')) {
        try {
          const hashVal = window.location.hash.split('sync=')[1]?.split('&')[0];
          if (hashVal) {
            setTimeout(() => {
              if (confirm('⚡ A device sync code was detected in this link! Would you like to import all progress onto this device now?')) {
                importSyncCode(decodeURIComponent(hashVal));
                window.location.hash = '#/dashboard';
              }
            }, 300);
          }
        } catch (e) {
          console.error('URL Hash Sync Error:', e);
        }
        return;
      }

      // Deep link routing to canonical views & subroutes
      const cleanHash = window.location.hash.replace(/^#\/?/, '').trim();
      if (!cleanHash) {
        switchView('dashboard');
        return;
      }

      const parts = cleanHash.split('/').filter(Boolean);
      const primary = parts[0]?.toLowerCase();
      const second = parts[1];
      const third = parts[2];

      if (primary === 'roadmaps' || primary === 'roadmap') {
        if (second && third === 'edit') {
          // Route: /roadmaps/:id/edit
          currentRoadmapSubview = 'detail';
          activeRoadmapDetailTab = 'editor';
          activeRoadmap120View = 'topics';
          if (window.RoadmapEngine) {
            RoadmapEngine.setSelectedRoadmapId(second);
          }
          switchView('roadmaps', 'roadmap');
          renderRoadmapDetail(second, 'editor');
        } else if (second) {
          // Route: /roadmaps/:id
          currentRoadmapSubview = 'detail';
          activeRoadmapDetailTab = 'overview';
          if (window.RoadmapEngine) {
            RoadmapEngine.setSelectedRoadmapId(second);
          }
          switchView('roadmaps', 'roadmap');
          renderRoadmapDetail(second, 'overview');
        } else {
          // Route: /roadmaps
          currentRoadmapSubview = 'library';
          switchView('roadmaps', 'roadmap');
          renderRoadmapView();
        }
      } else if (primary === 'problems' || primary === 'practice') {
        switchView('problems', second || 'catalog');
      } else if (primary === 'revision') {
        switchView('revision', second || 'queue');
      } else if (primary === 'mock' || primary === 'mock-interviews') {
        switchView('mock', 'mock');
      } else if (primary === 'progress') {
        switchView('progress', second || 'readiness');
      } else if (primary === 'settings') {
        switchView('settings', second);
      } else if (primary === 'dashboard') {
        switchView('dashboard');
      } else {
        // Fallback for unrecognized routes
        console.warn(`[AlgoRecall Router] Route '#/${cleanHash}' not recognized, falling back to #/dashboard`);
        switchView('dashboard');
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, '', '#/dashboard');
        }
      }
    }

    handleHashRoute();
    window.addEventListener('hashchange', handleHashRoute);
  }

  // --- VIEW 7: 120-DAY EDITABLE DSA ROADMAP & MULTI-STREAM TRACKER (PHASE 4) ---
  let currentRoadmapSubview = 'library'; // 'library' | 'detail'
  let activeRoadmapDetailTab = 'overview'; // 'overview' | 'plan' | 'timeline' | 'topics' | 'buffers' | 'editor' | 'settings'
  let activeRoadmapFilter = 'all'; // 'all' | 'active' | 'not_started' | 'completed' | 'archived'
  let roadmapLibrarySearchQuery = '';
  let roadmapLibrarySortOrder = 'default';
  let editorWorkingRoadmap = null;
  let editorIsDirty = false;

  let activeRoadmap120View = 'list'; // 'list' | 'calendar' | 'topics' | 'legacy_cycle'
  let activeRoadmap120Filter = 'all'; // 'all' | 'today' | 'upcoming' | 'completed' | 'incomplete' | 'buffer' | 'current_learning' | 'foundation_revision'
  let roadmap120SearchQuery = '';
  let selectedRoadmap120Days = new Set();

  // --- ROADMAPS LIBRARY & DETAIL CONTROLLER (PHASE 4) ---

  function renderRoadmapsLibrary() {
    const libView = document.getElementById('roadmaps-library-view');
    const detailView = document.getElementById('roadmap-detail-view');
    if (libView) libView.style.display = 'block';
    if (detailView) detailView.style.display = 'none';

    if (!window.RoadmapEngine) return;
    const catalog = (typeof RoadmapEngine.getRoadmapCatalog === 'function')
      ? RoadmapEngine.getRoadmapCatalog(allProblems, userStates)
      : [];

    const activeId = RoadmapEngine.getActiveRoadmapId ? RoadmapEngine.getActiveRoadmapId() : 'dual_stream_120';
    const grid = document.getElementById('roadmap-library-grid');
    if (!grid) return;

    // Filter by active status filter
    let filtered = catalog.filter(item => {
      if (activeRoadmapFilter === 'all') return !item.isArchived;
      if (activeRoadmapFilter === 'active') return item.isActive && !item.isArchived;
      if (activeRoadmapFilter === 'not_started') return item.status === 'Not Started' && !item.isArchived;
      if (activeRoadmapFilter === 'completed') return (item.status === 'Completed' || item.progressPct >= 100) && !item.isArchived;
      if (activeRoadmapFilter === 'archived') return !!item.isArchived;
      return true;
    });

    // Search query filter
    if (roadmapLibrarySearchQuery) {
      const q = roadmapLibrarySearchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        return (item.title && item.title.toLowerCase().includes(q)) ||
               (item.description && item.description.toLowerCase().includes(q)) ||
               (item.tags && item.tags.some(t => t.toLowerCase().includes(q)));
      });
    }

    // Sort order
    if (roadmapLibrarySortOrder === 'duration-desc') {
      filtered.sort((a, b) => (b.totalDays || 0) - (a.totalDays || 0));
    } else if (roadmapLibrarySortOrder === 'duration-asc') {
      filtered.sort((a, b) => (a.totalDays || 0) - (b.totalDays || 0));
    } else if (roadmapLibrarySortOrder === 'progress-desc') {
      filtered.sort((a, b) => (b.progressPct || 0) - (a.progressPct || 0));
    } else if (roadmapLibrarySortOrder === 'title-asc') {
      filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 40px 20px; text-align: center; background: var(--bg-card); border: 1px dashed var(--border-color); border-radius: var(--radius-lg);">
          <i class="fa-solid fa-map-location" style="font-size: 32px; color: var(--text-dim); margin-bottom: 12px;"></i>
          <h4 style="margin: 0 0 6px 0; color: #f8fafc; font-size: 15px;">No Roadmaps Match Your Filter</h4>
          <p style="margin: 0; font-size: 13px; color: var(--text-muted);">Try adjusting your search query, selecting "All Roadmaps", or creating a custom roadmap.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(item => {
      const isAct = item.isActive;
      const statusBadgeClass = isAct ? 'badge-success' : (item.status === 'Completed' ? 'badge-easy' : (item.status === 'In Progress' ? 'badge-primary' : 'badge-secondary'));

      return `
        <div class="roadmap-card ${isAct ? 'is-active-card' : ''}" data-id="${escapeHtml(item.id)}">
          <div>
            <div class="roadmap-card-header">
              <div class="roadmap-card-title">${escapeHtml(item.title)}</div>
              <span class="badge ${statusBadgeClass}" style="font-size: 10px; padding: 2px 8px; flex-shrink: 0;">
                ${isAct ? '<i class="fa-solid fa-bolt"></i> Active' : escapeHtml(item.status)}
              </span>
            </div>

            <div class="roadmap-card-desc">${escapeHtml(item.description)}</div>

            <div class="roadmap-card-meta">
              <span><i class="fa-solid fa-calendar" style="color:var(--primary-light); margin-right:4px;"></i> ${escapeHtml(item.duration)}</span>
              <span><i class="fa-solid fa-list-check" style="color:#34d399; margin-right:4px;"></i> ${item.completedDays} / ${item.totalDays} Days Done</span>
            </div>

            <div class="roadmap-card-progress">
              <div class="roadmap-card-progress-top">
                <span style="color:var(--text-muted); font-size:11.5px;">Progress</span>
                <span style="color:#f8fafc; font-weight:700; font-size:12px;">${item.progressPct}%</span>
              </div>
              <div class="progress-bar-container" style="height:6px; background:rgba(255,255,255,0.06); border-radius:3px;">
                <div class="progress-bar-fill" style="width:${item.progressPct}%; height:100%; background:linear-gradient(90deg, var(--primary), var(--secondary)); border-radius:3px;"></div>
              </div>
            </div>

            <div style="display:flex; flex-wrap:wrap; gap:5px; margin-bottom:16px;">
              ${(item.tags || []).map(t => `<span class="badge" style="background:rgba(255,255,255,0.04); color:var(--text-dim); font-size:10px; padding:2px 6px;">${escapeHtml(t)}</span>`).join('')}
            </div>
          </div>

          <div class="roadmap-card-actions">
            <button type="button" class="btn btn-secondary btn-sm btn-roadmap-view-detail" data-id="${escapeHtml(item.id)}" style="flex:1;">
              <i class="fa-solid fa-eye"></i> View Details
            </button>
            ${isAct ? `
              <span class="badge badge-success" style="padding:6px 10px; font-size:11px; display:inline-flex; align-items:center; gap:5px;">
                <i class="fa-solid fa-check"></i> Active Roadmap
              </span>
            ` : `
              <button type="button" class="btn btn-primary btn-sm btn-roadmap-set-active" data-id="${escapeHtml(item.id)}" style="flex:1;">
                <i class="fa-solid fa-check"></i> Set as Active
              </button>
            `}
          </div>
        </div>
      `;
    }).join('');
  }

  function renderRoadmapDetail(roadmapId, tab = 'overview') {
    const libView = document.getElementById('roadmaps-library-view');
    const detailView = document.getElementById('roadmap-detail-view');
    if (libView) libView.style.display = 'none';
    if (detailView) detailView.style.display = 'block';

    if (!window.RoadmapEngine) return;
    const targetId = roadmapId || RoadmapEngine.getSelectedRoadmapId() || 'dual_stream_120';
    RoadmapEngine.setSelectedRoadmapId(targetId);
    activeRoadmapDetailTab = tab || activeRoadmapDetailTab || 'overview';

    const activeId = RoadmapEngine.getActiveRoadmapId();
    const isActive = (targetId === activeId);
    const catalog = RoadmapEngine.getRoadmapCatalog ? RoadmapEngine.getRoadmapCatalog(allProblems, userStates) : [];
    const meta = catalog.find(c => c.id === targetId) || {
      id: targetId,
      title: targetId === 'dual_stream_120' ? '120-Day Dual-Stream Roadmap' : (targetId === 'pedagogical_120' ? '120-Day Pedagogical Roadmap' : targetId),
      description: 'Algorithm roadmap curriculum',
      duration: '120 Days',
      progressPct: 0
    };

    // Update Header
    const titleEl = document.getElementById('detail-roadmap-title');
    const subEl = document.getElementById('detail-roadmap-subtitle');
    const statusEl = document.getElementById('detail-roadmap-status-badge');
    const actionsContainer = document.getElementById('detail-roadmap-actions-container');

    if (titleEl) titleEl.textContent = meta.title;
    if (subEl) subEl.textContent = meta.description;
    if (statusEl) {
      statusEl.textContent = isActive ? 'Active' : meta.status;
      statusEl.className = isActive ? 'badge badge-success' : 'badge badge-secondary';
    }

    if (actionsContainer) {
      if (isActive) {
        actionsContainer.innerHTML = `
          <span class="badge badge-success" style="padding:6px 12px; font-size:12px; display:inline-flex; align-items:center; gap:6px;">
            <i class="fa-solid fa-check-circle"></i> Active Learning Roadmap
          </span>
        `;
      } else {
        actionsContainer.innerHTML = `
          <button type="button" class="btn btn-primary btn-sm btn-roadmap-set-active" data-id="${escapeHtml(targetId)}" id="btn-detail-set-active" style="display:inline-flex; align-items:center; gap:6px;">
            <i class="fa-solid fa-check-circle"></i> Set as Active Learning Roadmap
          </button>
        `;
      }
    }

    // Switch Tabs
    document.querySelectorAll('.roadmap-detail-tab-btn').forEach(btn => {
      if (btn.dataset.roadmapTab === activeRoadmapDetailTab) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    document.querySelectorAll('.roadmap-detail-panel').forEach(panel => {
      panel.classList.remove('active');
    });

    const activePanel = document.getElementById('panel-roadmap-' + activeRoadmapDetailTab);
    if (activePanel) activePanel.classList.add('active');

    // Load actual roadmap data
    const roadmap = RoadmapEngine.getRoadmap ? RoadmapEngine.getRoadmap(targetId, userStates) : RoadmapEngine.get120DayRoadmap(userStates);

    if (activeRoadmapDetailTab === 'overview') {
      renderRoadmapOverviewTab(roadmap, meta, userStates);
    } else if (activeRoadmapDetailTab === 'plan') {
      const todayPlan = RoadmapEngine.getTodayAuthoritativePlan(allProblems, userStates);
      render120ListView(roadmap, todayPlan);
    } else if (activeRoadmapDetailTab === 'timeline') {
      renderRoadmapTimelineTab(roadmap, userStates);
    } else if (activeRoadmapDetailTab === 'topics') {
      renderRoadmapTopicsTab(roadmap, userStates);
    } else if (activeRoadmapDetailTab === 'buffers') {
      renderRoadmapBuffersTab(roadmap, userStates);
    } else if (activeRoadmapDetailTab === 'editor') {
      renderRoadmapPlanEditor(roadmap, userStates);
    } else if (activeRoadmapDetailTab === 'settings') {
      renderRoadmapSettingsTab(roadmap, meta, userStates);
    }
  }

  function renderRoadmapOverviewTab(roadmap, meta, userStates) {
    if (!roadmap) return;
    const days = roadmap.days || [];
    const totalDays = days.length;
    const completedDays = days.filter(d => d.isCompleted).length;
    const pct = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

    const durEl = document.getElementById('ov-stat-duration');
    const progEl = document.getElementById('ov-stat-progress');
    const compEl = document.getElementById('ov-stat-completed-days');

    if (durEl) durEl.textContent = totalDays + ' Days';
    if (progEl) progEl.textContent = pct + '%';
    if (compEl) compEl.textContent = `${completedDays} of ${totalDays} Days Completed`;

    // Active milestone / phase
    const curProg = (RoadmapEngine && typeof RoadmapEngine.getCurriculumProgress === 'function')
      ? RoadmapEngine.getCurriculumProgress(userStates)
      : null;

    const phaseNameEl = document.getElementById('ov-phase-name');
    const phaseDescEl = document.getElementById('ov-phase-desc');
    const phaseWindowEl = document.getElementById('ov-phase-window');

    if (curProg && phaseNameEl) {
      phaseNameEl.textContent = `Day ${curProg.currentCurriculumDay}: ${curProg.activeMilestoneTopic}`;
      if (phaseDescEl) phaseDescEl.textContent = curProg.activeObjectives || 'Focus on foundational problems in sequence.';
      if (phaseWindowEl) phaseWindowEl.textContent = `Next problem: ${curProg.nextActionProblemId || 'Completed'}`;
    }
  }

  function renderRoadmapTimelineTab(roadmap, userStates) {
    const container = document.getElementById('roadmap-timeline-grid-container');
    if (!container || !roadmap) return;
    const days = roadmap.days || [];

    container.innerHTML = days.map(d => {
      const dNum = d.dayNumber || d.sequenceIndex;
      const isDone = !!d.isCompleted;
      const isBuf = !!d.isBufferDay || d.dayType === 'buffer';
      const isFin = dNum >= 91;

      let bgColor = 'rgba(99, 102, 241, 0.08)';
      let borderColor = 'rgba(99, 102, 241, 0.2)';
      let tagText = 'Learn';
      if (isBuf) {
        bgColor = 'rgba(245, 158, 11, 0.08)';
        borderColor = 'rgba(245, 158, 11, 0.3)';
        tagText = 'Buffer';
      } else if (isFin) {
        bgColor = 'rgba(139, 92, 246, 0.08)';
        borderColor = 'rgba(139, 92, 246, 0.3)';
        tagText = 'Final';
      }

      const streamA = d.streams?.current_learning || (d.tasks || []).find(t => t.stream === 'current_learning');
      const topic = streamA?.topic || d.topic || (isBuf ? 'Buffer Rest' : 'General');

      return `
        <div style="background:${bgColor}; border:1px solid ${borderColor}; border-radius:6px; padding:8px 10px; font-size:11.5px; position:relative; overflow:hidden;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span style="font-weight:700; color:#f8fafc;">Day ${dNum}</span>
            ${isDone ? '<i class="fa-solid fa-check-circle" style="color:#34d399; font-size:11px;"></i>' : `<span style="font-size:9.5px; color:var(--text-dim);">${tagText}</span>`}
          </div>
          <div style="color:var(--text-muted); font-size:11px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${escapeHtml(topic)}">
            ${escapeHtml(topic)}
          </div>
        </div>
      `;
    }).join('');
  }

  function renderRoadmapTopicsTab(roadmap, userStates) {
    const container = document.getElementById('roadmap-topics-curriculum-container');
    if (!container) return;
    if (typeof renderRoadmapTopicsView === 'function') {
      renderRoadmapTopicsView();
    }
  }

  function renderRoadmapBuffersTab(roadmap, userStates) {
    const container = document.getElementById('roadmap-buffer-cards-container');
    if (!container || !roadmap) return;
    const days = roadmap.days || [];

    const bufferDays = days.filter(d => d.isBufferDay || d.dayType === 'buffer' || ((d.dayNumber || d.sequenceIndex) % 8 === 0 && (d.dayNumber || d.sequenceIndex) <= 90));

    container.innerHTML = bufferDays.map((d, idx) => {
      const dNum = d.dayNumber || d.sequenceIndex;
      const isDone = !!d.isCompleted;
      return `
        <div style="background:var(--bg-card); border:1px solid ${isDone ? '#34d399' : 'rgba(245, 158, 11, 0.3)'}; border-radius:var(--radius-md); padding:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="badge" style="background:rgba(245,158,11,0.15); color:#fbbf24; font-size:11px; font-weight:700;">Buffer #${idx+1}</span>
              <strong style="color:#f8fafc; font-size:14px;">Day ${dNum}</strong>
            </div>
            ${isDone ? '<span class="badge badge-success" style="font-size:10px;">Completed</span>' : '<span class="badge badge-secondary" style="font-size:10px;">Flexible Rest</span>'}
          </div>
          <p style="font-size:12.5px; color:var(--text-muted); margin:0 0 10px 0; line-height:1.4;">
            ${escapeHtml(d.bufferReason || 'Weekly consolidation, reattempt weak problems from SRS, or rest.')}
          </p>
          <div style="font-size:11.5px; color:var(--text-dim); display:flex; justify-content:space-between; align-items:center;">
            <span>Scheduled after Day ${dNum - 1}</span>
            <button type="button" class="btn btn-secondary btn-sm btn-action-mark-day-done" data-day="${dNum}" style="font-size:10.5px; padding:2px 8px;">
              ${isDone ? 'Mark Incomplete' : 'Mark Taken'}
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderRoadmapPlanEditor(roadmap, userStates) {
    const container = document.getElementById('plan-editor-days-container');
    if (!container || !roadmap) return;

    // Working copy initialization
    if (!editorWorkingRoadmap || editorWorkingRoadmap.roadmapId !== roadmap.roadmapId) {
      editorWorkingRoadmap = JSON.parse(JSON.stringify(roadmap));
      editorIsDirty = false;
    }

    const dirtyBadge = document.getElementById('roadmap-editor-dirty-badge');
    if (dirtyBadge) {
      if (editorIsDirty) {
        dirtyBadge.classList.remove('clean');
      } else {
        dirtyBadge.classList.add('clean');
      }
    }

    const filterType = document.getElementById('editor-filter-type')?.value || 'all';
    let days = editorWorkingRoadmap.days || [];

    if (filterType === 'learning') {
      days = days.filter(d => !d.isBufferDay && d.dayType !== 'buffer' && (d.dayNumber || d.sequenceIndex) <= 90);
    } else if (filterType === 'buffer') {
      days = days.filter(d => d.isBufferDay || d.dayType === 'buffer');
    } else if (filterType === 'final_phase') {
      days = days.filter(d => (d.dayNumber || d.sequenceIndex) >= 91);
    } else if (filterType === 'incomplete') {
      days = days.filter(d => !d.isCompleted);
    }

    container.innerHTML = days.map(d => {
      const dNum = d.dayNumber || d.sequenceIndex;
      const isBuf = !!d.isBufferDay || d.dayType === 'buffer';
      const isFin = dNum >= 91;

      const streamA = d.streams?.current_learning || (d.tasks || []).find(t => t.stream === 'current_learning') || {};
      const streamB = d.streams?.foundation_revision || (d.tasks || []).find(t => t.stream === 'foundation_revision') || {};

      const probIdsA = streamA.problemIds || [];
      const probIdsB = streamB.problemIds || [];

      return `
        <div class="plan-editor-day-card ${isBuf ? 'day-buffer' : (isFin ? 'day-final' : '')}" data-day="${dNum}">
          <div class="plan-editor-day-top">
            <div style="display:flex; align-items:center; gap:10px;">
              <strong style="color:#f8fafc; font-size:15px;">Day ${dNum}</strong>
              <select class="filter-select editor-day-type-select" data-day="${dNum}" style="font-size:11.5px; padding:2px 8px;">
                <option value="learning" ${!isBuf && !isFin ? 'selected' : ''}>Learning Day</option>
                <option value="buffer" ${isBuf ? 'selected' : ''}>Buffer Day</option>
                <option value="final_phase" ${isFin ? 'selected' : ''}>Final Phase (Mock/Revision)</option>
              </select>
            </div>

            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:11px; color:var(--text-dim);">Est: ${streamA.estimatedMinutes || 60}m</span>
              <button type="button" class="btn btn-secondary btn-sm btn-editor-shift-day" data-day="${dNum}" data-dir="up" title="Move Up" style="padding:2px 6px; font-size:10px;">▲</button>
              <button type="button" class="btn btn-secondary btn-sm btn-editor-shift-day" data-day="${dNum}" data-dir="down" title="Move Down" style="padding:2px 6px; font-size:10px;">▼</button>
            </div>
          </div>

          ${isBuf ? `
            <div style="padding:8px 0;">
              <label style="font-size:11.5px; color:var(--text-muted); display:block; margin-bottom:4px;">Buffer / Rest Reason:</label>
              <input type="text" class="plan-editor-input-sm editor-buffer-reason-input" data-day="${dNum}" value="${escapeHtml(d.bufferReason || 'Weekly consolidation & recovery')}">
            </div>
          ` : `
            <div class="plan-editor-stream-row">
              <!-- Stream A -->
              <div class="plan-editor-stream-col">
                <span style="font-size:11px; font-weight:700; color:var(--stream-learn-accent); text-transform:uppercase; letter-spacing:0.04em;">Stream A: Deep Learn</span>
                <input type="text" class="plan-editor-input-sm editor-stream-a-topic" data-day="${dNum}" value="${escapeHtml(streamA.topic || streamA.topicId || '')}" placeholder="Topic Name">
                <input type="text" class="plan-editor-input-sm editor-stream-a-subtopic" data-day="${dNum}" value="${escapeHtml(streamA.subtopic || streamA.subtopicId || '')}" placeholder="Subtopic / Focus" style="margin-top:4px;">

                <div class="plan-editor-problem-chips">
                  ${probIdsA.map(pId => `
                    <span class="plan-editor-prob-chip">
                      <span>${escapeHtml(pId)}</span>
                      <button type="button" class="btn-remove-prob" data-day="${dNum}" data-stream="a" data-pid="${escapeHtml(pId)}">&times;</button>
                    </span>
                  `).join('')}
                </div>
              </div>

              <!-- Stream B -->
              <div class="plan-editor-stream-col">
                <span style="font-size:11px; font-weight:700; color:var(--stream-topic-accent); text-transform:uppercase; letter-spacing:0.04em;">Stream B: Topic Revision</span>
                <input type="text" class="plan-editor-input-sm editor-stream-b-topic" data-day="${dNum}" value="${escapeHtml(streamB.topic || streamB.topicId || '')}" placeholder="Revision Topic">
                <input type="text" class="plan-editor-input-sm editor-stream-b-subtopic" data-day="${dNum}" value="${escapeHtml(streamB.subtopic || streamB.subtopicId || '')}" placeholder="Revision Subtopic" style="margin-top:4px;">

                <div class="plan-editor-problem-chips">
                  ${probIdsB.map(pId => `
                    <span class="plan-editor-prob-chip">
                      <span>${escapeHtml(pId)}</span>
                      <button type="button" class="btn-remove-prob" data-day="${dNum}" data-stream="b" data-pid="${escapeHtml(pId)}">&times;</button>
                    </span>
                  `).join('')}
                </div>
              </div>
            </div>
          `}
        </div>
      `;
    }).join('');
  }

  function renderRoadmapSettingsTab(roadmap, meta, userStates) {
    const dailyMinsSelect = document.getElementById('settings-daily-minutes');
    const weeklyDaysSelect = document.getElementById('settings-weekly-days');
    const archiveBtn = document.getElementById('btn-toggle-archive-roadmap');

    if (dailyMinsSelect && roadmap?.settings) {
      dailyMinsSelect.value = String(roadmap.settings.dailyMinutes || 120);
    }
    if (weeklyDaysSelect && roadmap?.settings) {
      weeklyDaysSelect.value = String(roadmap.settings.weeklyStudyDays || 5);
    }
    if (archiveBtn) {
      archiveBtn.innerHTML = meta.isArchived
        ? '<i class="fa-solid fa-box-open"></i> Unarchive Roadmap'
        : '<i class="fa-solid fa-box-archive"></i> Archive Roadmap';
    }
  }

  function renderRoadmapView() {
    if (!window.RoadmapEngine) return;
    if (!RoadmapEngine.progress) {
      RoadmapEngine.initProgress();
    }

    // Toggle subview: library vs detail
    if (currentRoadmapSubview === 'library') {
      renderRoadmapsLibrary();
    } else {
      const selectedId = RoadmapEngine.getSelectedRoadmapId ? RoadmapEngine.getSelectedRoadmapId() : 'dual_stream_120';
      renderRoadmapDetail(selectedId, activeRoadmapDetailTab || 'overview');
    }

    const activeTrack = RoadmapEngine.progress.activeTrack || 'dual_stream_120';
    const plan120 = RoadmapEngine.get120DayRoadmap(userStates);
    const todayPlan = RoadmapEngine.getTodayAuthoritativePlan(allProblems, userStates);
    const isPedagogicalTrack = activeTrack === 'pedagogical_120';

    const trackSelect = document.getElementById('roadmap-track-select');
    if (trackSelect && activeTrack) {
      trackSelect.value = activeTrack;
    }

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

    // 4b. Fetch Active Curriculum Progress
    const curProg = (RoadmapEngine && typeof RoadmapEngine.getCurriculumProgress === 'function') ?
      RoadmapEngine.getCurriculumProgress(userStates) : null;

    // 4. Stream & Focus KPIs
    const kpiTitleA = document.getElementById('roadmap-120-kpi-title-a');
    const kpiTitleB = document.getElementById('roadmap-120-kpi-title-b');
    const statActiveFocusEl = document.getElementById('roadmap-stat-active-focus');
    const kpiSubtopicLearnEl = document.getElementById('roadmap-120-kpi-subtopic-learn');
    const kpiReviseTopicEl = document.getElementById('roadmap-120-kpi-revise-topic');
    const kpiSubtopicReviseEl = document.getElementById('roadmap-120-kpi-subtopic-revise');

    if (isPedagogicalTrack) {
      if (kpiTitleA) kpiTitleA.innerHTML = '<i class="fa-solid fa-compass"></i> Today\'s Topic';
      if (kpiTitleB) kpiTitleB.innerHTML = '<i class="fa-solid fa-layer-group"></i> Active Phase';
      if (statActiveFocusEl) statActiveFocusEl.textContent = (curProg && curProg.activeMilestoneTopic) || todayPlan.streamA?.topic || 'Basics & Math';
      if (kpiSubtopicLearnEl) kpiSubtopicLearnEl.textContent = (curProg && curProg.activeMilestoneSubtopic) || todayPlan.streamA?.subtopic || 'Language Basics & Syntax';
      if (kpiReviseTopicEl) kpiReviseTopicEl.textContent = (curProg && curProg.activePhase) || 'Phase 1: Foundations';
      if (kpiSubtopicReviseEl) kpiSubtopicReviseEl.textContent = `Day ${curProg ? curProg.currentCurriculumDay : 1} of 120`;
    } else {
      if (kpiTitleA) kpiTitleA.innerHTML = '<i class="fa-solid fa-book-open"></i> Stream A: Learn';
      if (kpiTitleB) kpiTitleB.innerHTML = '<i class="fa-solid fa-rotate-left"></i> Stream B: Revision';
      if (statActiveFocusEl) statActiveFocusEl.textContent = todayPlan.streamA?.topic || 'Graphs';
      if (kpiSubtopicLearnEl) kpiSubtopicLearnEl.textContent = todayPlan.streamA?.subtopic || 'BFS & DFS';
      if (kpiReviseTopicEl) kpiReviseTopicEl.textContent = todayPlan.streamB?.topic || 'Maths';
      if (kpiSubtopicReviseEl) kpiSubtopicReviseEl.textContent = todayPlan.streamB?.subtopic || 'Number Theory';
    }

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

    if (curProg) {
      const dayBadgeEl = document.getElementById('roadmap-active-day-badge');
      const headingEl = document.getElementById('roadmap-active-day-heading');
      const objEl = document.getElementById('roadmap-active-day-objectives');
      const countEl = document.getElementById('roadmap-active-day-problem-count');
      const minsEl = document.getElementById('roadmap-active-day-minutes');
      const srsEl = document.getElementById('roadmap-active-day-srs-due');
      const actionBtnText = document.getElementById('btn-roadmap-primary-action-text');

      if (dayBadgeEl) dayBadgeEl.textContent = `Day ${curProg.currentCurriculumDay} of 120`;
      if (headingEl) headingEl.textContent = `Day ${curProg.currentCurriculumDay}: ${curProg.activeMilestoneTopic} â€” ${curProg.activeMilestoneSubtopic}`;
      if (objEl) objEl.textContent = curProg.activeObjectives || 'Complete assigned foundational problems in sequence.';
      if (countEl) countEl.textContent = curProg.activeDay?.streams?.current_learning?.problemIds?.length || 4;
      if (minsEl) minsEl.textContent = curProg.activeDay?.streams?.current_learning?.estimatedMinutes || 60;
      if (srsEl) srsEl.textContent = todayPlan.streamC?.dueCount || 0;
      if (actionBtnText) {
        actionBtnText.textContent = curProg.currentCurriculumDay === 1 ? 'Start Day 1' : `Continue Day ${curProg.currentCurriculumDay}`;
      }
    }

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
          let label = day.isExamDay ? `Day 7: Weekend Test ðŸ†` : day.isReviewDay ? `Day 6: Flashcards âš¡` : `Day ${day.dayNumber} (${dayName})`;

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
      // In dual-stream mode (schemaVersion 8) every day has a Stream B card (even empty ones)
      const isDualStreamMode = plan120.schemaVersion >= 8 || plan120.dualStreamMode === 'connected' || activeTrack === 'dual_stream_120';
      const isPedagogicalMode = !isDualStreamMode && (plan120.track === 'pedagogical_120' || RoadmapEngine.progress?.activeTrack === 'pedagogical_120');

      const pTopic = d.topic || d.streams?.current_learning?.topic || 'Basics & Math';
      const pSubtopic = d.subtopic || d.streams?.current_learning?.subtopic || 'Language Basics & Syntax';
      const pObjectives = d.objectives || d.streams?.current_learning?.learningObjectives || d.streams?.current_learning?.objectives || 'Master foundational algorithmic concepts and patterns in sequence.';
      const pProblemIds = d.streams?.current_learning?.problemIds || [];
      const pEstMins = d.streams?.current_learning?.estimatedMinutes || (d.isBufferDay ? 0 : 60);
      const pPhase = d.phase || (d.dayNumber <= 13 ? 'Phase 1: Foundations & Syntax' : (d.dayNumber <= 50 ? 'Phase 2: Core Linear Structures' : (d.dayNumber <= 85 ? 'Phase 3: Hierarchical & Non-Linear' : 'Phase 4: Advanced Algorithms & Capstone')));

      const totalEstMins = isPedagogicalMode ? pEstMins : ((d.streams?.current_learning?.estimatedMinutes || 0) +
        (d.streams?.foundation_revision?.estimatedMinutes || 0) +
        (d.streams?.srs_due?.estimatedMinutes || 0));

      const allProblemsSolved = pProblemIds.length > 0 && pProblemIds.every(pid => {
        const st = userStates[pid];
        return st && (st.lastReviewed || st.solved || st.stage >= 2);
      });
      const isDayEffectivelyCompleted = d.isCompleted || allProblemsSolved;

      // Sequential problem rows for pedagogical layout
      const probRowsHtml = pProblemIds.map((pid, idx) => {
        const p = allProblems.find(item => item.id === pid) || { id: pid, title: pid, difficulty: 'Easy' };
        const st = userStates[p.id];
        const isSolved = !!(st && (st.lastReviewed || st.solved || st.stage >= 2));
        const diff = (p.difficulty || 'Easy').toLowerCase();
        const diffColor = diff === 'easy' ? '#34d399' : (diff === 'medium' ? '#fbbf24' : '#f87171');
        return `
          <div class="roadmap-pedagogical-prob-row ${isSolved ? 'solved' : ''}" style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:${isSolved ? 'rgba(52,211,153,0.06)' : 'rgba(255,255,255,0.03)'}; border:1px solid ${isSolved ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.08)'}; border-radius:10px; transition:all 0.2s ease; gap:12px; margin-bottom:8px;">
            <div style="display:flex; align-items:center; gap:12px; min-width:0; flex:1;">
              <span style="font-size:12px; font-weight:700; color:${isSolved ? '#34d399' : 'var(--text-dim)'}; width:28px; text-align:center;">
                ${isSolved ? '<i class="fa-solid fa-circle-check" style="font-size:15px;"></i>' : `#${idx + 1}`}
              </span>
              <div style="min-width:0; flex:1;">
                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                  <span style="font-size:13.5px; font-weight:600; color:${isSolved ? '#94a3b8' : '#f8fafc'}; text-decoration:${isSolved ? 'line-through' : 'none'};">
                    ${escapeHtml(p.title)}
                  </span>
                  <span class="badge" style="background:${diffColor}22; color:${diffColor}; border:1px solid ${diffColor}44; font-size:10px; padding:2px 6px;">
                    ${p.difficulty || 'Easy'}
                  </span>
                  ${p.pattern ? `<span class="badge" style="background:rgba(255,255,255,0.06); color:var(--text-dim); font-size:10px; padding:2px 6px;">${escapeHtml(p.pattern)}</span>` : ''}
                </div>
              </div>
            </div>
            
            <div style="display:flex; align-items:center; gap:8px;">
              ${isSolved ? `
                <span class="badge badge-mastered" style="font-size:11px; padding:4px 8px;">
                  <i class="fa-solid fa-check"></i> Solved
                </span>
              ` : ''}
              <button type="button" class="btn ${isSolved ? 'btn-secondary' : 'btn-primary'} btn-sm btn-action-detail" data-id="${p.id}" style="font-size:11.5px; padding:5px 12px; border-radius:6px;" title="Solve ${escapeHtml(p.title)}">
                <i class="fa-solid ${isSolved ? 'fa-book-open' : 'fa-play'}"></i>
                <span>${isSolved ? 'Review' : 'Solve'}</span>
              </button>
              <button type="button" class="btn btn-secondary btn-sm btn-action-trainer" data-id="${p.id}" style="font-size:11px; padding:5px 8px; border-radius:6px;" title="Open Solution Discovery Trainer">
                <i class="fa-solid fa-brain"></i>
              </button>
            </div>
          </div>
        `;
      }).join('');

      html += `
        <div class="roadmap-120-day-card ${isDayEffectivelyCompleted ? 'completed' : ''} ${d.isBufferDay ? 'buffer-day' : ''} ${isToday ? 'today-active' : ''}" data-day-num="${d.dayNumber}">
          <!-- Day Header -->
          <div class="roadmap-120-day-header">
            <div class="day-left">
              <input type="checkbox" class="roadmap-120-day-checkbox" data-day="${d.dayNumber}" ${isSelected ? 'checked' : ''} aria-label="Select Day ${d.dayNumber}">
              <span class="roadmap-120-day-number-badge"><i class="fa-solid fa-calendar-day"></i> Day ${d.dayNumber}</span>
              ${isPedagogicalMode ? `<span class="badge" style="background:rgba(99,102,241,0.18); color:var(--primary-light); border:1px solid rgba(99,102,241,0.3); font-size:11px;">${escapeHtml(pPhase)}</span>` : ''}
              ${isToday ? `<span class="badge" style="background:rgba(139,124,255,0.25); color:#a78bfa; border:1px solid rgba(139,124,255,0.4); font-weight:700;"><i class="fa-solid fa-bullseye"></i> TODAY</span>` : ''}
              ${d.isBufferDay ? `<span class="roadmap-120-buffer-tag"><i class="fa-solid fa-mug-hot"></i> Buffer: ${escapeHtml(d.bufferReason || 'Flex Buffer')}</span>` : ''}
              ${isDayEffectivelyCompleted ? `<span class="badge badge-mastered" style="font-weight:700;"><i class="fa-solid fa-check"></i> Completed</span>` : ''}
              ${!d.isBufferDay ? `<span class="badge" style="background:rgba(255,255,255,0.06); color:var(--text-muted);"><i class="fa-solid fa-clock"></i> ~${totalEstMins}m</span>` : ''}
            </div>

            <div class="day-actions">
              <button type="button" class="btn btn-secondary btn-sm btn-roadmap-toggle-complete" data-day="${d.dayNumber}" title="${isDayEffectivelyCompleted ? 'Mark as Incomplete' : 'Mark as Completed'}">
                <i class="fa-solid ${isDayEffectivelyCompleted ? 'fa-arrow-rotate-left' : 'fa-circle-check'}"></i> <span>${isDayEffectivelyCompleted ? 'Undo' : 'Done'}</span>
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
          ` : isPedagogicalMode ? `
            <!-- Unified Pedagogical Daily Curriculum View (Single Stream, Clear Order) -->
            <div class="roadmap-pedagogical-day-body" style="padding:14px 18px; background:rgba(255,255,255,0.015); border-radius:10px; margin-top:8px;">
              <!-- Topic & Objectives Header -->
              <div style="margin-bottom:14px; padding-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.06);">
                <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
                  <div>
                    <div style="font-size:15px; font-weight:700; color:#f8fafc; display:flex; align-items:center; gap:8px;">
                      <span class="badge" style="background:rgba(99,102,241,0.2); color:var(--primary-light); font-size:11px; padding:3px 8px; border-radius:6px; font-weight:700;">
                        ${escapeHtml(pTopic)}
                      </span>
                      <span>${escapeHtml(pSubtopic)}</span>
                    </div>
                    <p style="font-size:12.5px; color:var(--text-muted); margin:6px 0 0; line-height:1.4;">
                      <i class="fa-solid fa-bullseye" style="color:var(--primary-light); margin-right:4px;"></i>
                      ${escapeHtml(pObjectives)}
                    </p>
                  </div>
                  <div style="display:flex; align-items:center; gap:8px;">
                    <span class="badge" style="background:rgba(255,255,255,0.05); color:var(--text-dim); font-size:11.5px; padding:4px 8px;">
                      <i class="fa-solid fa-clock"></i> ~${pEstMins}m
                    </span>
                    <span class="badge" style="background:rgba(255,255,255,0.05); color:var(--text-dim); font-size:11.5px; padding:4px 8px;">
                      <i class="fa-solid fa-list-check"></i> ${pProblemIds.length} Problems
                    </span>
                  </div>
                </div>
              </div>

              <!-- Sequential Problem Steps (Solve in Order) -->
              <div>
                <div style="font-size:11px; font-weight:700; color:var(--text-dim); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:8px; display:flex; align-items:center; gap:6px;">
                  <i class="fa-solid fa-arrow-down-1-9" style="color:var(--primary-light);"></i>
                  <span>Sequential Problem Practice (Solve in Order)</span>
                </div>
                
                <div style="display:flex; flex-direction:column; gap:6px;">
                  ${probRowsHtml}
                </div>
              </div>

              <!-- Due Spaced Repetition if isToday -->
              ${isToday && todayPlan.streamC?.dueProblems?.length > 0 ? `
                <div style="margin-top:14px; padding:10px 14px; background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.25); border-radius:8px;">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                    <span style="font-size:11.5px; font-weight:700; color:#fbbf24;">
                      <i class="fa-solid fa-clock-rotate-left"></i> Spaced Repetition Due Today (${todayPlan.streamC.dueProblems.length})
                    </span>
                  </div>
                  <div style="display:flex; flex-wrap:wrap; gap:6px;">
                    ${todayPlan.streamC.dueProblems.slice(0, 6).map(p => `
                      <button type="button" class="btn btn-secondary btn-sm btn-action-review" data-id="${p.id}" style="font-size:10.5px; padding:3px 8px;">
                        <i class="fa-solid fa-rotate-left" style="color:#fbbf24;"></i> ${escapeHtml(p.title)}
                      </button>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
          ` : `
            <div class="roadmap-120-streams-grid">
              <!-- Stream A: Current Learning -->
              <div class="roadmap-120-stream-box stream-a">
                <div class="stream-box-header">
                  <span class="stream-box-title" style="color:var(--stream-learn-accent);">
                    <i class="fa-solid fa-book-open"></i> Stream A: Learn
                  </span>
                  <div style="display:inline-flex; align-items:center; gap:6px;">
                    <span style="font-size:11px; color:var(--text-dim);">~${d.streams?.current_learning?.estimatedMinutes || 60}m</span>
                    <div class="quick-topic-shift-btns" title="Adjust '${escapeHtml(d.streams?.current_learning?.topic || '')}' topic order in roadmap">
                      <button type="button" class="btn-quick-topic-shift" data-stream="current_learning" data-topic="${escapeHtml(d.streams?.current_learning?.topic || '')}" data-dir="up" title="Move Topic Up">â–²</button>
                      <button type="button" class="btn-quick-topic-shift" data-stream="current_learning" data-topic="${escapeHtml(d.streams?.current_learning?.topic || '')}" data-dir="down" title="Move Topic Down">â–¼</button>
                    </div>
                  </div>
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
                  <button type="button" class="btn btn-secondary btn-sm btn-roadmap-practice-topic" data-topic="${escapeHtml(d.streams?.current_learning?.topic || '')}" style="font-size:10.5px; padding:3px 7px;">
                    <i class="fa-solid fa-layer-group"></i> Practice Topic
                  </button>
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

              <!-- Stream B: Foundation Revision (Eligibility-Aware v8) -->
              <div class="roadmap-120-stream-box stream-b">
                <div class="stream-box-header">
                  <span class="stream-box-title" style="color:var(--stream-topic-accent);">
                    <i class="fa-solid fa-rotate-left"></i> Stream B: Revision
                    <span style="font-size:9.5px; font-weight:400; color:var(--text-dim); margin-left:4px; background:rgba(66,214,197,0.1); padding:1px 6px; border-radius:4px; border:1px solid rgba(66,214,197,0.2);">Reinforces what you already learned</span>
                  </span>
                  <div style="display:inline-flex; align-items:center; gap:6px;">
                    ${(function() {
                      const revTask = (d.tasks || []).find(t => t.stream === 'foundation_revision');
                      const isEmpty = revTask?.empty || !d.streams?.foundation_revision?.topic;
                      if (isEmpty) return '<span style="font-size:11px; color:var(--text-dim); padding:2px 6px; background:rgba(255,255,255,0.04); border-radius:4px;">No eligible topics yet</span>';
                      return '<span style="font-size:11px; color:var(--text-dim);">~' + (d.streams?.foundation_revision?.estimatedMinutes || 30) + 'm</span>';
                    })()}
                    <div class="quick-topic-shift-btns" title="Adjust revision topic order">
                      <button type="button" class="btn-quick-topic-shift" data-stream="foundation_revision" data-topic="${escapeHtml(d.streams?.foundation_revision?.topic || '')}" data-dir="up" title="Move Topic Up">↑</button>
                      <button type="button" class="btn-quick-topic-shift" data-stream="foundation_revision" data-topic="${escapeHtml(d.streams?.foundation_revision?.topic || '')}" data-dir="down" title="Move Topic Down">↓</button>
                    </div>
                  </div>
                </div>

                ${(function() {
                  const revTask = (d.tasks || []).find(t => t.stream === 'foundation_revision');
                  const streamBData = d.streams?.foundation_revision;
                  const isEmpty = revTask?.empty || (!streamBData?.topic && !revTask?.topicId);
                  const emptyReason = revTask?.emptyReason || streamBData?.emptyReason;
                  const consolidation = revTask?.consolidationSuggestion || streamBData?.consolidationSuggestion;
                  const revisionReason = revTask?.revisionReason || streamBData?.revisionReason;
                  const revTopic = streamBData?.topic || revTask?.topicId || '';
                  const revSubtopic = streamBData?.subtopic || revTask?.subtopicId || '';
                  const revObjectives = streamBData?.revisionObjectives || streamBData?.objectives || revTask?.objectives || '';
                  const revProblemIds = streamBData?.problemIds || revTask?.problemIds || [];
                  const revStatus = streamBData?.status || revTask?.status || 'pending';
                  const isCompleted = revStatus === 'completed';

                  if (isEmpty) {
                    return `
                      <div style="padding:12px; background:rgba(255,255,255,0.025); border-radius:8px; margin-top:6px; border:1px dashed rgba(66,214,197,0.15);">
                        <div style="display:flex; align-items:flex-start; gap:10px;">
                          <i class="fa-solid fa-seedling" style="color:rgba(66,214,197,0.4); font-size:18px; margin-top:2px; flex-shrink:0;"></i>
                          <div>
                            <div style="font-size:12.5px; font-weight:600; color:var(--text-dim); margin-bottom:4px;">Stream B: Not active yet</div>
                            <div style="font-size:11.5px; color:var(--text-muted); line-height:1.5;">${escapeHtml(emptyReason || 'Complete Stream A topics first to unlock revision.')}</div>
                            ${consolidation ? '<div style="margin-top:8px; font-size:11px; color:rgba(99,102,241,0.8); padding:6px 8px; background:rgba(99,102,241,0.08); border-radius:6px; border-left:2px solid rgba(99,102,241,0.3);"><i class="fa-solid fa-lightbulb" style="margin-right:4px;"></i>' + escapeHtml(consolidation) + '</div>' : ''}
                          </div>
                        </div>
                      </div>`;
                  }

                  const probChips = revProblemIds.map(pid => {
                    const p = allProblems.find(item => item.id === pid) || { id: pid, title: pid, difficulty: 'Easy' };
                    const st = userStates[p.id];
                    const isSolved = !!(st && st.lastReviewed);
                    const conf = st?.confidence || (st?.lastRating === 'simple' ? 4 : st?.lastRating === 'failed' ? 1 : 3);
                    const instability = isSolved && conf <= 2;
                    const chipStyle = instability ? 'border-color:rgba(239,68,68,0.4); background:rgba(239,68,68,0.06);' : '';
                    return `<button type="button" class="roadmap-120-prob-pill ${isSolved ? 'solved' : ''} btn-action-detail" data-id="${p.id}" title="${escapeHtml(p.title)}" style="${chipStyle}">
                      <i class="fa-solid ${instability ? 'fa-triangle-exclamation' : isSolved ? 'fa-check' : 'fa-rotate-right'}"></i>
                      <span style="max-width:130px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(p.title)}</span>
                      <span class="badge badge-${(p.difficulty||'easy').toLowerCase()}" style="font-size:9px; padding:1px 4px;">${p.difficulty}</span>
                    </button>`;
                  }).join('');

                  return `
                    <div style="font-size:14px; font-weight:700; color:#f8fafc; margin-top:4px; display:flex; align-items:center; gap:6px;">
                      <span class="badge" style="background:rgba(66,214,197,0.12); color:rgba(66,214,197,0.9); font-size:10.5px; padding:2px 7px; border-radius:5px;">${escapeHtml(revTopic)}</span>
                      ${isCompleted ? '<span class="badge" style="background:rgba(16,185,129,0.15); color:#34d399; font-size:10px; padding:2px 6px; border-radius:4px;"><i class="fa-solid fa-check"></i> Done</span>' : ''}
                    </div>
                    <div style="font-size:12px; color:var(--text-dim); margin-top:2px;">${escapeHtml(revSubtopic)}</div>
                    ${revisionReason ? '<div style="font-size:10.5px; color:rgba(66,214,197,0.6); margin-top:4px; display:flex; align-items:flex-start; gap:4px;"><i class="fa-solid fa-circle-info" style="margin-top:2px; flex-shrink:0;"></i><span>' + escapeHtml(revisionReason) + '</span></div>' : ''}
                    <div style="font-size:11.5px; color:var(--text-muted); margin-top:6px;">
                      <i class="fa-solid fa-arrows-rotate" style="color:var(--stream-topic-accent);"></i> ${escapeHtml(revObjectives)}
                    </div>
                    ${revProblemIds.length > 0 ? `<div class="roadmap-120-prob-chips-container" style="display:flex; flex-wrap:wrap; gap:6px; margin-top:8px;">${probChips}</div>` : '<div style="margin-top:8px; font-size:11px; color:var(--text-dim); font-style:italic;">No specific problems assigned — free recall session.</div>'}
                    <div style="display:flex; gap:6px; margin-top:10px; border-top:1px dashed rgba(66,214,197,0.2); padding-top:8px;">
                      <button type="button" class="btn btn-primary btn-sm" onclick="switchView('practice','catalog')" style="font-size:10.5px; padding:4px 10px; background:rgba(66,214,197,0.15); border-color:rgba(66,214,197,0.4); color:rgba(66,214,197,0.9);">
                        <i class="fa-solid fa-play"></i> Start Revision
                      </button>
                      <button type="button" class="btn btn-secondary btn-sm btn-task-skip" data-day="${d.dayNumber}" data-stream="foundation_revision" style="font-size:10.5px; padding:3px 7px;">
                        <i class="fa-solid fa-forward"></i> Skip
                      </button>
                      <button type="button" class="btn btn-secondary btn-sm btn-task-defer" data-day="${d.dayNumber}" data-stream="foundation_revision" style="font-size:10.5px; padding:3px 7px;">
                        <i class="fa-solid fa-clock"></i> Defer
                      </button>
                    </div>`;
                })()}
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

    const streamATopicsList = window.RoadmapEngine ? RoadmapEngine.getTopicsList('current_learning') : [];
    const streamBTopicsList = window.RoadmapEngine ? RoadmapEngine.getTopicsList('foundation_revision') : [];

    let html = `
      <div style="margin-top:16px; display:flex; flex-direction:column; gap:20px;">
        <!-- Stream A Topic Progression Matrix -->
        <div style="background:var(--bg-elevated); border:1px solid var(--border-color); border-radius:var(--radius-lg); padding:18px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:10px;">
            <div>
              <h3 style="font-size:15px; font-weight:700; color:var(--stream-learn-accent); margin:0; display:flex; align-items:center; gap:8px;">
                <i class="fa-solid fa-book-open"></i> Stream A: Current Learning Topic Progression
              </h3>
              <span style="font-size:12px; color:var(--text-dim);">Sequential topic advance. Adjust topics up/down or drag cards to customize your study path.</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <button type="button" class="btn btn-secondary btn-sm btn-open-topic-reorder-modal" data-stream="current_learning">
                <i class="fa-solid fa-arrows-up-down"></i> Adjust Stream A Topics
              </button>
              <span class="badge" style="background:rgba(139,124,255,0.15); color:var(--stream-learn-accent); font-weight:700;">
                ${streamATopicsList.length} Topic Modules
              </span>
            </div>
          </div>

          <div class="roadmap-120-topic-matrix" id="topic-matrix-stream-a">
            ${streamATopicsList.map((item, idx) => {
      const pct = item.dayCount > 0 ? Math.round((item.completedCount / item.dayCount) * 100) : 0;
      const isFirst = idx === 0;
      const isLast = idx === streamATopicsList.length - 1;
      return `
                <div class="roadmap-120-topic-card" data-stream="current_learning" data-topic="${escapeHtml(item.topic)}" data-index="${idx}" draggable="true" title="Click to filter day list, or use arrows to adjust order">
                  <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div style="display:flex; align-items:center; gap:8px;">
                      <span class="topic-order-badge">#${item.order}</span>
                      <div style="font-size:14px; font-weight:700; color:#f8fafc;">${escapeHtml(item.topic)}</div>
                    </div>
                    <div class="topic-adjust-btn-group">
                      <button type="button" class="btn-topic-move" data-stream="current_learning" data-topic="${escapeHtml(item.topic)}" data-dir="up" ${isFirst ? 'disabled' : ''} title="Move '${escapeHtml(item.topic)}' Up in Roadmap">
                        â–² Up
                      </button>
                      <button type="button" class="btn-topic-move" data-stream="current_learning" data-topic="${escapeHtml(item.topic)}" data-dir="down" ${isLast ? 'disabled' : ''} title="Move '${escapeHtml(item.topic)}' Down in Roadmap">
                        â–¼ Down
                      </button>
                      <span class="topic-drag-handle" title="Drag to reorder topic" style="cursor:grab; font-size:16px; color:var(--text-dim); padding:0 4px;">â‹®â‹®</span>
                    </div>
                  </div>
                  <div style="font-size:12px; color:var(--text-dim); margin-top:4px;">
                    Days ${item.startDay}â€“${item.endDay} (${item.dayCount} Days) â€¢ ${item.problemCount} Curated Problems
                  </div>
                  <div class="progress-bar-wrap" style="height:5px; margin-top:10px; background:rgba(255,255,255,0.06);">
                    <div class="progress-bar-fill" style="width:${pct}%; background:var(--stream-learn-accent);"></div>
                  </div>
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; font-size:11px; color:var(--text-muted);">
                    <span>${item.completedCount} / ${item.dayCount} Days Completed</span>
                    <span style="color:var(--stream-learn-accent); font-weight:600;"><i class="fa-solid fa-filter"></i> Filter Days</span>
                  </div>
                </div>
              `;
    }).join('')}
          </div>
        </div>

        <!-- Stream B Foundation Revision Progression Matrix -->
        <div style="background:var(--bg-elevated); border:1px solid var(--border-color); border-radius:var(--radius-lg); padding:18px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:10px;">
            <div>
              <h3 style="font-size:15px; font-weight:700; color:var(--stream-topic-accent); margin:0; display:flex; align-items:center; gap:8px;">
                <i class="fa-solid fa-rotate-left"></i> Stream B: Foundation Revision Topic Progression
              </h3>
              <span style="font-size:12px; color:var(--text-dim);">Independent foundation revision drills. Customize sequence to align with your weak spots.</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <button type="button" class="btn btn-secondary btn-sm btn-open-topic-reorder-modal" data-stream="foundation_revision">
                <i class="fa-solid fa-arrows-up-down"></i> Adjust Stream B Topics
              </button>
              <span class="badge" style="background:rgba(66,214,197,0.15); color:var(--stream-topic-accent); font-weight:700;">
                ${streamBTopicsList.length} Foundation Units
              </span>
            </div>
          </div>

          <div class="roadmap-120-topic-matrix" id="topic-matrix-stream-b">
            ${streamBTopicsList.map((item, idx) => {
      const pct = item.dayCount > 0 ? Math.round((item.completedCount / item.dayCount) * 100) : 0;
      const isFirst = idx === 0;
      const isLast = idx === streamBTopicsList.length - 1;
      return `
                <div class="roadmap-120-topic-card" data-stream="foundation_revision" data-topic="${escapeHtml(item.topic)}" data-index="${idx}" draggable="true" title="Click to filter day list, or use arrows to adjust order">
                  <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div style="display:flex; align-items:center; gap:8px;">
                      <span class="topic-order-badge stream-b">#${item.order}</span>
                      <div style="font-size:14px; font-weight:700; color:#f8fafc;">${escapeHtml(item.topic)}</div>
                    </div>
                    <div class="topic-adjust-btn-group">
                      <button type="button" class="btn-topic-move" data-stream="foundation_revision" data-topic="${escapeHtml(item.topic)}" data-dir="up" ${isFirst ? 'disabled' : ''} title="Move '${escapeHtml(item.topic)}' Up in Roadmap">
                        â–² Up
                      </button>
                      <button type="button" class="btn-topic-move" data-stream="foundation_revision" data-topic="${escapeHtml(item.topic)}" data-dir="down" ${isLast ? 'disabled' : ''} title="Move '${escapeHtml(item.topic)}' Down in Roadmap">
                        â–¼ Down
                      </button>
                      <span class="topic-drag-handle" title="Drag to reorder topic" style="cursor:grab; font-size:16px; color:var(--text-dim); padding:0 4px;">â‹®â‹®</span>
                    </div>
                  </div>
                  <div style="font-size:12px; color:var(--text-dim); margin-top:4px;">
                    Days ${item.startDay}â€“${item.endDay} (${item.dayCount} Days) â€¢ ${item.problemCount} Drills
                  </div>
                  <div class="progress-bar-wrap" style="height:5px; margin-top:10px; background:rgba(255,255,255,0.06);">
                    <div class="progress-bar-fill" style="width:${pct}%; background:var(--stream-topic-accent);"></div>
                  </div>
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; font-size:11px; color:var(--text-muted);">
                    <span>${item.completedCount} / ${item.dayCount} Days Completed</span>
                    <span style="color:var(--stream-topic-accent); font-weight:600;"><i class="fa-solid fa-filter"></i> Filter Days</span>
                  </div>
                </div>
              `;
    }).join('')}
          </div>
        </div>
      </div>
    `;
    container.innerHTML = html;
    initTopicsMatrixDragAndDrop();
  }

  function initTopicsMatrixDragAndDrop() {
    ['topic-matrix-stream-a', 'topic-matrix-stream-b'].forEach(matrixId => {
      const matrix = document.getElementById(matrixId);
      if (!matrix) return;
      let draggedCard = null;

      matrix.querySelectorAll('.roadmap-120-topic-card').forEach(card => {
        card.addEventListener('dragstart', (e) => {
          draggedCard = card;
          card.classList.add('dragging');
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', card.dataset.topic);
        });

        card.addEventListener('dragend', () => {
          card.classList.remove('dragging');
          matrix.querySelectorAll('.roadmap-120-topic-card').forEach(c => c.classList.remove('drag-over'));
          draggedCard = null;
        });

        card.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          if (card !== draggedCard) {
            card.classList.add('drag-over');
          }
        });

        card.addEventListener('dragleave', () => {
          card.classList.remove('drag-over');
        });

        card.addEventListener('drop', (e) => {
          e.preventDefault();
          card.classList.remove('drag-over');
          if (!draggedCard || draggedCard === card) return;

          const stream = card.dataset.stream;
          const sourceTopic = draggedCard.dataset.topic;
          const targetIndex = parseInt(card.dataset.index, 10);

          if (window.RoadmapEngine && !isNaN(targetIndex)) {
            RoadmapEngine.moveTopic(stream, sourceTopic, targetIndex);
            renderRoadmapView();
          }
        });
      });
    });
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
            <div style="font-size:12px; color:var(--text-dim); margin-top:2px;">${summary.advancedCount} Advanced â€¢ ${summary.optionalCount} Optional Patterns</div>
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
              Curriculum Completeness Audit (Taxonomies Aâ€“N)
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
                      Core: <strong style="color:#34d399;">${coreCovered}/${core.length}</strong> (${corePct}%) â€¢ Total: <strong>${total}</strong> patterns
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

  // --- TOPIC ADJUSTMENT & CUSTOMIZATION MODAL ---
  let activeReorderStream = 'current_learning';

  function openRoadmapAdjustTopicsModal(stream = 'current_learning') {
    activeReorderStream = stream;
    const modal = document.getElementById('roadmap-adjust-topics-modal');
    if (!modal) return;

    const tabA = document.getElementById('btn-adjust-tab-stream-a');
    const tabB = document.getElementById('btn-adjust-tab-stream-b');
    if (tabA && tabB) {
      if (activeReorderStream === 'current_learning') {
        tabA.className = 'btn btn-sm btn-primary btn-adjust-stream-tab';
        tabB.className = 'btn btn-sm btn-secondary btn-adjust-stream-tab';
      } else {
        tabA.className = 'btn btn-sm btn-secondary btn-adjust-stream-tab';
        tabB.className = 'btn btn-sm btn-primary btn-adjust-stream-tab';
      }
    }

    renderRoadmapTopicsReorderList();
    modal.classList.add('open');
  }

  function closeRoadmapAdjustTopicsModal() {
    document.getElementById('roadmap-adjust-topics-modal')?.classList.remove('open');
  }

  function renderRoadmapTopicsReorderList() {
    const container = document.getElementById('roadmap-topics-reorder-container');
    const countBadge = document.getElementById('adjust-topics-count-badge');
    if (!container || !window.RoadmapEngine) return;

    const topicsList = RoadmapEngine.getTopicsList(activeReorderStream);
    if (countBadge) countBadge.textContent = `${topicsList.length} Topics`;

    if (topicsList.length === 0) {
      container.innerHTML = '<div class="empty-state">No topics found in this stream.</div>';
      return;
    }

    const isStreamA = activeReorderStream === 'current_learning';
    let html = '';

    topicsList.forEach((item, idx) => {
      const isFirst = idx === 0;
      const isLast = idx === topicsList.length - 1;
      const dayRangeTxt = item.dayCount > 0 ? `Days ${item.startDay}â€“${item.endDay} (${item.dayCount} Days)` : '0 Days';

      html += `
        <div class="roadmap-topic-reorder-row" data-topic="${escapeHtml(item.topic)}" data-index="${idx}" draggable="true">
          <span class="row-drag-handle" title="Drag to reorder" style="cursor:grab; font-size:16px; color:var(--text-dim); padding:0 4px;">â‹®â‹®</span>
          <span class="topic-order-badge ${isStreamA ? '' : 'stream-b'}">#${item.order}</span>
          <div class="row-topic-details">
            <div class="row-topic-name">${escapeHtml(item.topic)}</div>
            <div class="row-topic-meta">${dayRangeTxt} â€¢ ${item.problemCount} Curated Problems</div>
          </div>
          <div class="row-topic-actions">
            <button type="button" class="btn btn-secondary btn-xs btn-modal-topic-top" data-topic="${escapeHtml(item.topic)}" ${isFirst ? 'disabled' : ''} title="Move to Top">
              <span style="font-size:10px; font-weight:800; line-height:1;">â–²â–²</span>
            </button>
            <button type="button" class="btn btn-secondary btn-xs btn-modal-topic-up" data-topic="${escapeHtml(item.topic)}" ${isFirst ? 'disabled' : ''} title="Move Up">
              <span style="font-size:12px; font-weight:800; line-height:1;">â–²</span>
            </button>
            <button type="button" class="btn btn-secondary btn-xs btn-modal-topic-down" data-topic="${escapeHtml(item.topic)}" ${isLast ? 'disabled' : ''} title="Move Down">
              <span style="font-size:12px; font-weight:800; line-height:1;">â–¼</span>
            </button>
            <button type="button" class="btn btn-secondary btn-xs btn-modal-topic-bottom" data-topic="${escapeHtml(item.topic)}" ${isLast ? 'disabled' : ''} title="Move to Bottom">
              <span style="font-size:10px; font-weight:800; line-height:1;">â–¼â–¼</span>
            </button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    initModalDragAndDrop();
  }

  function initModalDragAndDrop() {
    const container = document.getElementById('roadmap-topics-reorder-container');
    if (!container) return;

    let draggedItem = null;

    container.querySelectorAll('.roadmap-topic-reorder-row').forEach(row => {
      row.addEventListener('dragstart', (e) => {
        draggedItem = row;
        row.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', row.dataset.topic);
      });

      row.addEventListener('dragend', () => {
        row.classList.remove('dragging');
        container.querySelectorAll('.roadmap-topic-reorder-row').forEach(r => r.classList.remove('drag-over'));
        draggedItem = null;
      });

      row.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (row !== draggedItem) {
          row.classList.add('drag-over');
        }
      });

      row.addEventListener('dragleave', () => {
        row.classList.remove('drag-over');
      });

      row.addEventListener('drop', (e) => {
        e.preventDefault();
        row.classList.remove('drag-over');
        if (!draggedItem || draggedItem === row) return;

        const sourceTopic = draggedItem.dataset.topic;
        const targetIndex = parseInt(row.dataset.index, 10);

        if (window.RoadmapEngine && !isNaN(targetIndex)) {
          RoadmapEngine.moveTopic(activeReorderStream, sourceTopic, targetIndex);
          renderRoadmapTopicsReorderList();
          renderRoadmapView();
        }
      });
    });
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
                            ${p.companies.slice(0, 2).map(c => `<span class="company-badge ${c.toLowerCase().replace(/[^a-z]/g, '')}">ðŸ¢ ${c}</span>`).join('')}
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

    // Case 3: Normal Study Day (Days 1 to 5) - Unified Combined Daily Problem Queue (Capped at 2â€“4 total)
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
                          ${p.companies.slice(0, 2).map(c => `<span class="company-badge ${c.toLowerCase().replace(/[^a-z]/g, '')}">ðŸ¢ ${c}</span>`).join('')}
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
                      ${conf ? `<span class="conf-badge conf-${conf}" style="font-size:10px; width:fit-content;">â­ ${conf}/5</span>` : ''}
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

  // --- ESCAPE HTML HELPER (Consolidated with CoreUtils) ---
  const escapeHtml = (typeof CoreUtils !== 'undefined' && CoreUtils.escapeHtml) ||
    (typeof window !== 'undefined' && window.CoreUtils && window.CoreUtils.escapeHtml) ||
    function(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

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
              <p>${p.edgeCases.join(' â€¢ ')}</p>
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
    // 5 Primary Canonical Destinations & Direct 7 Routes
    'dashboard': { destination: 'dashboard' },
    'roadmaps': { destination: 'progress', subtab: 'roadmap' },
    'roadmap': { destination: 'progress', subtab: 'roadmap' },
    'problems': { destination: 'practice', defaultSubtab: 'catalog', subtab: 'catalog' },
    'practice': { destination: 'practice', defaultSubtab: 'catalog' },
    'revision': { destination: 'revision', defaultSubtab: 'queue' },
    'mock': { destination: 'progress', subtab: 'mock' },
    'mock-interviews': { destination: 'progress', subtab: 'mock' },
    'progress': { destination: 'progress', defaultSubtab: 'readiness' },
    'settings': { destination: 'settings' },

    // Legacy Aliases & Deep-Link Targets
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
    'leaderboard': { destination: 'progress', subtab: 'leaderboard' },
    'team': { destination: 'progress', subtab: 'leaderboard' }
  };

  function switchView(requestedView, explicitSubtab) {
    if (!requestedView) return;
    const cleanKey = String(requestedView).toLowerCase().trim();
    const mapping = VIEW_MAP[cleanKey] || { destination: cleanKey };
    const destination = mapping.destination;
    const subtab = explicitSubtab || mapping.subtab || mapping.defaultSubtab;

    // Update Primary Navigation active states and ARIA across all 7 items
    document.querySelectorAll('.nav-item').forEach(n => {
      const viewAttr = n.getAttribute('data-view');
      const routeAttr = (n.getAttribute('data-route') || '').replace(/^\//, '');
      let isMatch = false;

      if (cleanKey === 'roadmaps' || cleanKey === 'roadmap' || (destination === 'progress' && subtab === 'roadmap')) {
        isMatch = (routeAttr === 'roadmaps' || routeAttr === 'roadmap' || viewAttr === 'roadmaps' || viewAttr === 'roadmap');
      } else if (cleanKey === 'mock' || cleanKey === 'mock-interviews' || (destination === 'progress' && subtab === 'mock')) {
        isMatch = (routeAttr === 'mock' || routeAttr === 'mock-interviews' || viewAttr === 'mock');
      } else if (cleanKey === 'problems' || cleanKey === 'practice' || (destination === 'practice' && (subtab === 'catalog' || !subtab))) {
        isMatch = (routeAttr === 'problems' || viewAttr === 'practice');
      } else if (destination === 'progress' && subtab !== 'roadmap' && subtab !== 'mock') {
        isMatch = (routeAttr === 'progress' || (viewAttr === 'progress' && !routeAttr));
      } else {
        isMatch = (routeAttr === destination || viewAttr === destination);
      }

      n.classList.toggle('active', isMatch);
      n.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });

    const roadmapBtn = document.getElementById('nav-item-roadmaps') || document.getElementById('nav-item-roadmap');
    if (roadmapBtn) {
      const isRoadmapActive = (cleanKey === 'roadmaps' || cleanKey === 'roadmap' || (destination === 'progress' && subtab === 'roadmap'));
      roadmapBtn.classList.toggle('active', isRoadmapActive);
      roadmapBtn.setAttribute('aria-selected', isRoadmapActive ? 'true' : 'false');
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
      else if (subtab === 'roadmap') renderRoadmapView();
      else if (subtab === 'mock') renderMockInterviewView();
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

    // Synchronize URL hash for route-aware deep linking & browser history
    if (typeof window !== 'undefined' && window.location) {
      let targetHash = '#/' + cleanKey;
      if (cleanKey === 'roadmaps' || cleanKey === 'roadmap' || subtab === 'roadmap') {
        if (window.location.hash && window.location.hash.startsWith('#/roadmaps/')) {
          targetHash = window.location.hash;
        } else if (cleanKey === 'roadmaps' && explicitSubtab && explicitSubtab !== 'roadmap') {
          targetHash = `#/roadmaps/${explicitSubtab}`;
        } else if (currentRoadmapSubview === 'detail') {
          const sel = (window.RoadmapEngine && RoadmapEngine.getSelectedRoadmapId) ? RoadmapEngine.getSelectedRoadmapId() : 'dual_stream_120';
          targetHash = (activeRoadmapDetailTab === 'editor') ? `#/roadmaps/${sel}/edit` : `#/roadmaps/${sel}`;
        } else {
          targetHash = '#/roadmaps';
        }
      } else if (cleanKey === 'mock' || cleanKey === 'mock-interviews' || subtab === 'mock') {
        targetHash = '#/mock';
      } else if (cleanKey === 'problems' || cleanKey === 'practice') {
        targetHash = (explicitSubtab && explicitSubtab !== 'catalog') ? `#/problems/${explicitSubtab}` : '#/problems';
      } else if (cleanKey === 'progress') {
        targetHash = (explicitSubtab && explicitSubtab !== 'readiness') ? `#/progress/${explicitSubtab}` : '#/progress';
      } else if (cleanKey === 'revision') {
        targetHash = (explicitSubtab && explicitSubtab !== 'queue') ? `#/revision/${explicitSubtab}` : '#/revision';
      } else if (cleanKey === 'dashboard') {
        targetHash = '#/dashboard';
      } else if (cleanKey === 'settings') {
        targetHash = '#/settings';
      }

      if (window.location.hash !== targetHash) {
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, '', targetHash);
        } else {
          window.location.hash = targetHash;
        }
      }
    }

    // Update document title for accessibility & context
    const titles = {
      dashboard: 'Dashboard | AlgoRecall 2.0',
      roadmaps: '120-Day DSA Roadmap & Study Planner | AlgoRecall 2.0',
      roadmap: '120-Day DSA Roadmap & Study Planner | AlgoRecall 2.0',
      problems: 'Problems & Algorithmic Patterns | AlgoRecall 2.0',
      practice: 'Problems & Algorithmic Patterns | AlgoRecall 2.0',
      revision: 'Spaced Revision & Retention | AlgoRecall 2.0',
      mock: 'Mock Interview Simulator | AlgoRecall 2.0',
      progress: 'Readiness & Analytics | AlgoRecall 2.0',
      settings: 'Settings & Data Hub | AlgoRecall 2.0'
    };
    if (subtab === 'roadmap' || cleanKey === 'roadmaps' || cleanKey === 'roadmap') {
      document.title = titles.roadmaps;
    } else if (subtab === 'mock' || cleanKey === 'mock') {
      document.title = titles.mock;
    } else if (cleanKey === 'problems') {
      document.title = titles.problems;
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
          rankBadge = `<span style="font-size:18px; width:24px; text-align:center;" title="1st Place">ðŸ¥‡</span>`;
        } else if (rank === 2) {
          rankBadge = `<span style="font-size:18px; width:24px; text-align:center;" title="2nd Place">ðŸ¥ˆ</span>`;
        } else if (rank === 3) {
          rankBadge = `<span style="font-size:18px; width:24px; text-align:center;" title="3rd Place">ðŸ¥‰</span>`;
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
                  <span>Lvl ${m.level || 1} â€¢ ${escapeHtml(m.tierTitle || 'Novice')}</span>
                  <span>â€¢</span>
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
    window.renderMockInterviewView = renderMockInterviewView;
    window.startActiveMockSession = startActiveMockSession;
    window.showMockReport = showMockReport;
    window.abandonMockInterview = abandonMockInterview;
    window.finishMockInterview = finishMockInterview;
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
  function applyAccessibilityPreferences(settings) {
    if (!settings) return;
    document.documentElement.classList.toggle('reduce-motion', Boolean(settings.reducedMotion));
    document.documentElement.classList.toggle('font-large', settings.fontSize === 'large');
    document.documentElement.classList.toggle('font-dyslexic', settings.fontSize === 'dyslexic');
  }

  function syncSettingsFormValues() {
    if (!window.StorageEngine) return;
    const s = StorageEngine.getSettings();

    // Active User / Identity Badge in Settings View
    const ctx = (window.LearnerRepository && typeof LearnerRepository.getActiveContext === 'function')
      ? LearnerRepository.getActiveContext()
      : { id: 'guest', isGuest: true };

    const userBadge = document.getElementById('settings-current-user');
    if (userBadge) {
      userBadge.textContent = (ctx && ctx.id && ctx.id !== 'guest') ? (ctx.displayName || ctx.id) : 'Guest';
    }

    const cloudStatus = document.getElementById('settings-cloud-status');
    if (cloudStatus) {
      if (ctx && ctx.id && ctx.id !== 'guest') {
        cloudStatus.textContent = 'Cloud Connected';
        cloudStatus.className = 'badge-rev-status status-mastered';
      } else {
        cloudStatus.textContent = 'Local (Guest)';
        cloudStatus.className = 'badge-rev-status status-due';
      }
    }

    const lastSync = document.getElementById('settings-last-sync-text');
    if (lastSync) {
      lastSync.textContent = (ctx && ctx.lastSyncAt) ? new Date(ctx.lastSyncAt).toLocaleTimeString() : 'Just now';
    }

    // Modal elements
    const lightOptBtn = document.getElementById('btn-theme-light-opt');
    const darkOptBtn = document.getElementById('btn-theme-dark-opt');
    const contrastOptBtn = document.getElementById('btn-theme-contrast-opt');
    const aiProviderSelect = document.getElementById('settings-ai-provider');
    const apiKeyWrap = document.getElementById('settings-api-key-wrap');
    const apiKeyInput = document.getElementById('settings-ai-key');

    // Dedicated View elements
    const lightOptViewBtn = document.getElementById('btn-theme-light-opt-view');
    const darkOptViewBtn = document.getElementById('btn-theme-dark-opt-view');
    const aiProviderViewSelect = document.getElementById('settings-ai-provider-view');
    const apiKeyWrapView = document.getElementById('settings-api-key-wrap-view');
    const apiKeyInputView = document.getElementById('settings-ai-key-view');

    // Theme active states (dark | light | high-contrast)
    const currentTheme = s.theme || 'dark';
    lightOptBtn?.classList.toggle('active', currentTheme === 'light');
    darkOptBtn?.classList.toggle('active', currentTheme === 'dark');
    contrastOptBtn?.classList.toggle('active', currentTheme === 'high-contrast');
    lightOptViewBtn?.classList.toggle('active', currentTheme === 'light');
    darkOptViewBtn?.classList.toggle('active', currentTheme === 'dark');

    // Learning Preferences
    const dailyMinsSelect = document.getElementById('settings-daily-minutes');
    if (dailyMinsSelect) dailyMinsSelect.value = String(s.targetDailyMinutes || 45);

    const dailyProbsSelect = document.getElementById('settings-daily-problems');
    if (dailyProbsSelect) dailyProbsSelect.value = String(s.targetDailyProblems || 3);

    const defaultDiffSelect = document.getElementById('settings-default-difficulty');
    if (defaultDiffSelect) defaultDiffSelect.value = s.defaultDifficultyFilter || 'all';

    const preferredRoadmapSelect = document.getElementById('settings-preferred-roadmap');
    if (preferredRoadmapSelect) {
      if (window.RoadmapEngine && typeof RoadmapEngine.getActiveRoadmap === 'function') {
        const activeRm = RoadmapEngine.getActiveRoadmap();
        preferredRoadmapSelect.value = (activeRm && activeRm.id) || s.preferredRoadmap || 'dual_stream_120';
      } else {
        preferredRoadmapSelect.value = s.preferredRoadmap || 'dual_stream_120';
      }
    }

    const cadenceSelect = document.getElementById('settings-study-cadence');
    if (cadenceSelect) cadenceSelect.value = s.studyReminderCadence || 'self_paced';

    const compactCheck = document.getElementById('settings-compact-mode');
    if (compactCheck) compactCheck.checked = Boolean(s.compactMode);

    const insightsCheck = document.getElementById('settings-show-insights');
    if (insightsCheck) insightsCheck.checked = s.showSolutionInsights !== false;

    // Revision Preferences
    const srsOrderSelect = document.getElementById('settings-srs-order');
    if (srsOrderSelect) srsOrderSelect.value = s.srsReviewOrder || 'overdue_first';

    // Appearance & Accessibility
    const reducedMotionCheck = document.getElementById('settings-reduced-motion');
    if (reducedMotionCheck) reducedMotionCheck.checked = Boolean(s.reducedMotion);

    const fontSizeSelect = document.getElementById('settings-font-size');
    if (fontSizeSelect) fontSizeSelect.value = s.fontSize || 'standard';

    // AI Provider values
    const provider = s.aiProvider || 'offline';
    if (aiProviderSelect) aiProviderSelect.value = provider;
    if (aiProviderViewSelect) aiProviderViewSelect.value = provider;

    const showKey = (provider === 'openai' || provider === 'gemini');
    if (apiKeyWrap) apiKeyWrap.style.display = showKey ? 'block' : 'none';
    if (apiKeyWrapView) apiKeyWrapView.style.display = showKey ? 'block' : 'none';

    if (apiKeyInput) apiKeyInput.value = s.aiApiKey || '';
    if (apiKeyInputView) apiKeyInputView.value = s.aiApiKey || '';

    // Apply live accessibility styles
    applyAccessibilityPreferences(s);
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
    const contrastOptBtn = document.getElementById('btn-theme-contrast-opt');
    const aiProviderSelect = document.getElementById('settings-ai-provider');
    const apiKeyWrap = document.getElementById('settings-api-key-wrap');
    const apiKeyInput = document.getElementById('settings-ai-key');
    const saveBtn = document.getElementById('btn-save-settings');

    const btnExportBackup = document.getElementById('btn-settings-export-backup');
    const btnRestoreTrigger = document.getElementById('btn-settings-restore-trigger');
    const btnCopySync = document.getElementById('btn-settings-copy-sync');
    const restoreFileInput = document.getElementById('settings-restore-file-input');

    // Header Theme Toggle button
    themeToggleHeaderBtn?.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
      applyAppTheme(nextTheme);
    });

    // Theme Option Buttons
    darkOptBtn?.addEventListener('click', () => applyAppTheme('dark'));
    lightOptBtn?.addEventListener('click', () => applyAppTheme('light'));
    contrastOptBtn?.addEventListener('click', () => applyAppTheme('high-contrast'));

    // Dedicated View Theme Buttons (if present)
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
      switchView('settings');
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

    // Save Learning Preferences
    document.getElementById('btn-save-learning-prefs')?.addEventListener('click', () => {
      if (!window.StorageEngine) return;
      const dailyMins = parseInt(document.getElementById('settings-daily-minutes')?.value, 10) || 45;
      const dailyProblems = parseInt(document.getElementById('settings-daily-problems')?.value, 10) || 3;
      const diff = document.getElementById('settings-default-difficulty')?.value || 'all';
      const prefRoadmap = document.getElementById('settings-preferred-roadmap')?.value || 'dual_stream_120';
      const cadence = document.getElementById('settings-study-cadence')?.value || 'self_paced';
      const compact = document.getElementById('settings-compact-mode')?.checked || false;
      const insights = document.getElementById('settings-show-insights')?.checked ?? true;

      StorageEngine.saveSettings({
        targetDailyMinutes: dailyMins,
        targetDailyProblems: dailyProblems,
        defaultDifficultyFilter: diff,
        preferredRoadmap: prefRoadmap,
        studyReminderCadence: cadence,
        compactMode: compact,
        showSolutionInsights: insights
      });

      if (window.RoadmapEngine && typeof RoadmapEngine.setActiveRoadmap === 'function') {
        RoadmapEngine.setActiveRoadmap(prefRoadmap);
      }

      syncSettingsFormValues();
      alert('✅ Learning preferences successfully updated!');
    });

    // Save Revision Preferences
    document.getElementById('btn-save-revision-prefs')?.addEventListener('click', () => {
      if (!window.StorageEngine) return;
      const srsOrder = document.getElementById('settings-srs-order')?.value || 'overdue_first';
      StorageEngine.saveSettings({ srsReviewOrder: srsOrder });
      syncSettingsFormValues();
      alert('✅ Revision preferences saved! Spaced repetition intervals and due dates remain unaltered.');
    });

    // Save Appearance & Accessibility Preferences
    document.getElementById('btn-save-appearance-prefs')?.addEventListener('click', () => {
      if (!window.StorageEngine) return;
      const reducedMotion = Boolean(document.getElementById('settings-reduced-motion')?.checked);
      const fontSize = document.getElementById('settings-font-size')?.value || 'standard';
      StorageEngine.saveSettings({
        reducedMotion: reducedMotion,
        fontSize: fontSize
      });
      applyAccessibilityPreferences({ reducedMotion, fontSize });
      syncSettingsFormValues();
      alert('✅ Appearance & accessibility preferences applied!');
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

    // Export / Import / Safe Sync Buttons
    btnExportBackup?.addEventListener('click', exportDataJSON);
    btnRestoreTrigger?.addEventListener('click', () => {
      if (restoreFileInput) {
        restoreFileInput.click();
      } else {
        document.getElementById('import-file-input')?.click();
      }
    });
    restoreFileInput?.addEventListener('change', importDataJSON);

    // Pilot Telemetry Export
    document.getElementById('btn-settings-export-pilot')?.addEventListener('click', () => {
      if (window.PilotValidationEngine && typeof PilotValidationEngine.generatePilotTelemetryBundle === 'function') {
        const bundle = PilotValidationEngine.generatePilotTelemetryBundle();
        const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `algorecall_pilot_telemetry_${bundle.participantId}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert('📋 Pilot telemetry successfully exported! Anonymized JSON bundle downloaded.');
      } else {
        alert('PilotValidationEngine not available.');
      }
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

    // Account Switcher and Sign Out to Guest
    document.getElementById('btn-settings-switch-user')?.addEventListener('click', () => {
      const targetUser = prompt('Enter User ID or email to switch workspace:');
      if (!targetUser || !targetUser.trim()) return;
      if (window.LearnerRepository && typeof LearnerRepository.switchContext === 'function') {
        LearnerRepository.switchContext({ id: targetUser.trim(), isGuest: false });
        loadData();
        syncSettingsFormValues();
        alert(`Switched to user workspace: ${targetUser.trim()}`);
      }
    });

    document.getElementById('btn-settings-signout-guest')?.addEventListener('click', () => {
      if (confirm('Sign out and switch to isolated Guest profile?')) {
        if (window.LearnerRepository && typeof LearnerRepository.switchContext === 'function') {
          LearnerRepository.switchContext({ id: 'guest', isGuest: true });
          loadData();
          syncSettingsFormValues();
          alert('Signed out to Guest workspace.');
        }
      }
    });

    // Destructive Reset 2-Step Confirmation Modal
    const resetModal = document.getElementById('modal-confirm-reset');
    const btnOpenReset = document.getElementById('btn-settings-reset-open');
    const btnCancelReset = document.getElementById('btn-cancel-reset');
    const btnExecReset = document.getElementById('btn-execute-reset');
    const inputReset = document.getElementById('input-confirm-reset-text');

    btnOpenReset?.addEventListener('click', () => {
      if (resetModal) {
        resetModal.classList.add('open');
        if (inputReset) {
          inputReset.value = '';
          inputReset.focus();
        }
        if (btnExecReset) btnExecReset.disabled = true;
      }
    });

    btnCancelReset?.addEventListener('click', () => {
      resetModal?.classList.remove('open');
    });

    inputReset?.addEventListener('input', (e) => {
      if (btnExecReset) {
        btnExecReset.disabled = (e.target.value.trim().toUpperCase() !== 'RESET');
      }
    });

    btnExecReset?.addEventListener('click', () => {
      if (inputReset?.value.trim().toUpperCase() !== 'RESET') return;
      if (!window.LearnerRepository) return;
      LearnerRepository.saveUserStates({});
      LearnerRepository.saveMockHistory([]);
      LearnerRepository.saveExamHistory([]);
      LearnerRepository.saveFailures({});
      LearnerRepository.saveGamification({ xp: 0, streak: 0, badges: [] });
      LearnerRepository.saveRoadmapProgress(null);

      resetModal?.classList.remove('open');
      loadData();
      renderAll();
      alert('⚠️ All learner progress for this account has been cleanly reset.');
    });

    // Initial form sync
    syncSettingsFormValues();
    setupAdaptiveAuditHub();
  }

  function setupGlobalKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Escape closes any open modal or dialogue
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop.open, #settings-modal.open, #modal-confirm-reset.open, #modal-metric-registry.open, #problem-notes-modal.open').forEach(m => {
          m.classList.remove('open');
        });
        return;
      }

      // Check if user is typing in an active text input or editable element
      const activeEl = document.activeElement;
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT' || activeEl.isContentEditable);

      // Alt + D/P/R/M/A/S quick navigation
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const k = e.key.toLowerCase();
        if (k === 'd') { e.preventDefault(); switchView('dashboard'); }
        else if (k === 'p') { e.preventDefault(); switchView('practice'); }
        else if (k === 'r') { e.preventDefault(); switchView('roadmaps'); }
        else if (k === 'm') { e.preventDefault(); switchView('mock'); }
        else if (k === 'a') { e.preventDefault(); switchView('progress'); }
        else if (k === 's') { e.preventDefault(); switchView('settings'); }
        return;
      }

      if (isInput) return;

      // '/' quick focus search
      if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.getElementById('global-search-input') || document.getElementById('search-problems') || document.querySelector('input[type="search"]');
        searchInput?.focus();
        return;
      }

      // '1' - '4' Spaced Repetition flashcard rating in active recall
      const recallModal = document.getElementById('active-recall-modal');
      if (recallModal && recallModal.classList.contains('open')) {
        if (e.key === '1') {
          document.getElementById('btn-rate-again')?.click();
        } else if (e.key === '2') {
          document.getElementById('btn-rate-hard')?.click();
        } else if (e.key === '3') {
          document.getElementById('btn-rate-good')?.click();
        } else if (e.key === '4') {
          document.getElementById('btn-rate-easy')?.click();
        }
      }
    });
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

    if (recTitle) recTitle.textContent = `${activeAuditRec.problemTitle} (${activeAuditRec.difficulty} â€¢ ${activeAuditRec.topic})`;
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
          const hasVio = res.hasViolations ? `âš ï¸ ${res.violations.length} violation(s)` : 'âœ“ Clean';
          log += `â€¢ Scenario "${scName}": ${res.totalSteps} steps executed | Virtual Date: ${res.finalVirtualDate.slice(0, 10)} | ${hasVio}\n`;
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
        const header = `ðŸ›¡ï¸ **Boundary Checklist for "${p.title}"**:\n\n` +
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
            ${isOpt ? 'ðŸŽ¯ Optimal Complexity Analysis!' : 'âš ï¸ Suboptimal Complexity Detected'}
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
        mastered: '<span class="prereq-status-badge" style="background:rgba(16,185,129,0.2); color:#34d399; border:1px solid #10b981;">ðŸ† Mastered</span>',
        proficient: '<span class="prereq-status-badge" style="background:rgba(6,182,212,0.2); color:#38bdf8; border:1px solid #06b6d4;">ðŸ”· Proficient</span>',
        learning: '<span class="prereq-status-badge" style="background:rgba(245,158,11,0.2); color:#fbbf24; border:1px solid #f59e0b;">â³ Learning</span>',
        available: '<span class="prereq-status-badge" style="background:rgba(139,92,246,0.2); color:#c084fc; border:1px solid #8b5cf6;">ðŸš€ Available</span>',
        locked: '<span class="prereq-status-badge" style="background:rgba(100,116,139,0.2); color:#94a3b8; border:1px solid #64748b;">ðŸ”’ Locked</span>'
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
              <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-dim);">Tier ${node.level} â€¢ ${node.topic}</div>
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
  let currentMockHistoryFilter = 'all';

  function updateMockConfigPreview() {
    const trackSelect = document.getElementById('mock-config-track');
    const durSelect = document.getElementById('mock-config-duration');
    const customDurInput = document.getElementById('mock-config-custom-duration');
    const diffSelect = document.getElementById('mock-config-difficulty');
    const countSelect = document.getElementById('mock-config-count');
    const topicSelect = document.getElementById('mock-config-topic');
    const previewEl = document.getElementById('mock-config-preview-text');

    if (!previewEl) return;

    const trackId = trackSelect?.value || 'faang_standard';
    const track = (window.MockEngine && window.MockEngine.TRACKS[trackId]) || { title: 'FAANG Standard', defaultDuration: 45 };
    
    let duration = durSelect?.value === 'custom' 
      ? parseInt(customDurInput?.value || '45', 10) 
      : parseInt(durSelect?.value || '45', 10);
    if (isNaN(duration) || duration < 5) duration = 45;

    const count = parseInt(countSelect?.value || '2', 10);
    const diff = diffSelect?.value || 'Mixed';
    const topic = topicSelect?.value === 'all' ? 'All Topics' : (topicSelect?.value || 'All Topics');

    previewEl.textContent = `${duration} Minutes • ${track.title || trackId} • ${count} Questions (${diff}) • ${topic}`;
  }

  function renderMockInterviewView() {
    // 1. Populate Topics
    const topicSelect = document.getElementById('mock-config-topic');
    if (topicSelect && topicSelect.children.length <= 1) {
      const canonicalTopics = (window.MockEngine && window.MockEngine.CANONICAL_TOPICS) || [];
      const catalogTopics = Array.from(new Set(allProblems.map(p => SRSEngine.canonicalizeTopic(p.topic)))).sort();
      const combined = Array.from(new Set([...canonicalTopics, ...catalogTopics])).sort();
      
      topicSelect.innerHTML = '<option value="all">All Topics (Comprehensive Pool)</option>';
      combined.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        topicSelect.appendChild(opt);
      });
    }

    // 2. Update Stats Summary Grid
    if (window.MockEngine) {
      const stats = MockEngine.getMockStats();
      const elTotal = document.getElementById('mock-stat-total');
      const elCompleted = document.getElementById('mock-stat-completed');
      const elAbandoned = document.getElementById('mock-stat-abandoned');
      const elAvg = document.getElementById('mock-stat-avg-score');

      if (elTotal) elTotal.textContent = stats.totalSessions;
      if (elCompleted) elCompleted.textContent = stats.completedCount;
      if (elAbandoned) elAbandoned.textContent = stats.abandonedCount;
      if (elAvg) elAvg.textContent = stats.completedCount > 0 ? `${stats.averageScore}%` : '-%';
    }

    // 3. Check and update Active Session Resume Card
    const resumeCard = document.getElementById('mock-active-resume-card');
    const active = window.MockEngine ? MockEngine.getActiveSession() : null;
    if (resumeCard) {
      if (active && !active.isExpired) {
        resumeCard.style.display = 'flex';
        const titleEl = document.getElementById('mock-resume-track-title');
        const timeEl = document.getElementById('mock-resume-time-left');
        const countEl = document.getElementById('mock-resume-q-count');

        if (titleEl) titleEl.textContent = active.trackTitle || 'Active Mock Round';
        if (countEl) countEl.textContent = `${active.problems.length} Questions`;
        if (timeEl) {
          const mins = Math.floor(active.remainingSeconds / 60);
          const secs = active.remainingSeconds % 60;
          timeEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }
      } else {
        resumeCard.style.display = 'none';
      }
    }

    // 4. Track Preset Cards Interactions
    document.querySelectorAll('[data-mock-track-preset]').forEach(card => {
      if (!card.dataset.bound) {
        card.dataset.bound = 'true';
        card.addEventListener('click', () => {
          document.querySelectorAll('[data-mock-track-preset]').forEach(c => c.classList.remove('active'));
          card.classList.add('active');
          const presetId = card.getAttribute('data-mock-track-preset');

          const trackSelect = document.getElementById('mock-config-track');
          const durSelect = document.getElementById('mock-config-duration');
          const countSelect = document.getElementById('mock-config-count');
          const diffSelect = document.getElementById('mock-config-difficulty');

          if (trackSelect) trackSelect.value = presetId;

          if (presetId === 'faang_standard') {
            if (durSelect) durSelect.value = '45';
            if (countSelect) countSelect.value = '2';
            if (diffSelect) diffSelect.value = 'Mixed';
          } else if (presetId === 'blind_sprint') {
            if (durSelect) durSelect.value = '45';
            if (countSelect) countSelect.value = '2';
            if (diffSelect) diffSelect.value = 'Mixed';
          } else if (presetId === 'full_interview') {
            if (durSelect) durSelect.value = '60';
            if (countSelect) countSelect.value = '3';
            if (diffSelect) diffSelect.value = 'Mixed';
          } else if (presetId === 'custom') {
            if (durSelect) durSelect.value = 'custom';
            document.getElementById('mock-config-custom-duration').style.display = 'block';
          }

          if (durSelect && durSelect.value !== 'custom') {
            const customInput = document.getElementById('mock-config-custom-duration');
            if (customInput) customInput.style.display = 'none';
          }

          updateMockConfigPreview();
        });
      }
    });

    // 5. Config Controls Change Listeners
    ['mock-config-track', 'mock-config-duration', 'mock-config-custom-duration', 'mock-config-difficulty', 'mock-config-count', 'mock-config-hints', 'mock-config-topic'].forEach(id => {
      const el = document.getElementById(id);
      if (el && !el.dataset.bound) {
        el.dataset.bound = 'true';
        el.addEventListener('change', () => {
          if (id === 'mock-config-duration') {
            const customInput = document.getElementById('mock-config-custom-duration');
            if (customInput) customInput.style.display = el.value === 'custom' ? 'block' : 'none';
          }
          updateMockConfigPreview();
        });
        if (id === 'mock-config-custom-duration') {
          el.addEventListener('input', updateMockConfigPreview);
        }
      }
    });

    updateMockConfigPreview();

    // 6. History Table & Filters
    renderMockHistoryTable();

    // 7. Wire Resume and Abandon Banner Actions
    const btnResumeActive = document.getElementById('btn-resume-active-mock');
    if (btnResumeActive && !btnResumeActive.dataset.bound) {
      btnResumeActive.dataset.bound = 'true';
      btnResumeActive.addEventListener('click', () => {
        const activeSess = window.MockEngine ? MockEngine.getActiveSession() : null;
        if (activeSess && !activeSess.isExpired) {
          startActiveMockSession(activeSess);
        } else {
          alert('No active mock session found or session has expired.');
          renderMockInterviewView();
        }
      });
    }

    const btnAbandonActive = document.getElementById('btn-abandon-active-mock');
    if (btnAbandonActive && !btnAbandonActive.dataset.bound) {
      btnAbandonActive.dataset.bound = 'true';
      btnAbandonActive.addEventListener('click', () => {
        if (confirm('Are you sure you want to abandon the current mock session? It will be logged as abandoned.')) {
          abandonMockInterview();
        }
      });
    }

    // 8. Start Mock Button
    const startBtn = document.getElementById('btn-start-mock-interview');
    if (startBtn && !startBtn.dataset.bound) {
      startBtn.dataset.bound = 'true';
      startBtn.addEventListener('click', () => {
        if (!window.MockEngine) return;

        const activeSess = MockEngine.getActiveSession();
        if (activeSess && !activeSess.isExpired) {
          if (!confirm('You already have an active mock interview in progress. Abandon it and start a new round?')) {
            return;
          }
        }

        const trackId = document.getElementById('mock-config-track')?.value || 'faang_standard';
        const durSelect = document.getElementById('mock-config-duration');
        let duration = durSelect?.value === 'custom' 
          ? parseInt(document.getElementById('mock-config-custom-duration')?.value || '45', 10) 
          : parseInt(durSelect?.value || '45', 10);
        if (isNaN(duration) || duration < 5) duration = 45;

        const hints = document.getElementById('mock-config-hints')?.value || 'penalty';
        const topic = document.getElementById('mock-config-topic')?.value || 'all';
        const diff = document.getElementById('mock-config-difficulty')?.value || 'Mixed';
        const count = parseInt(document.getElementById('mock-config-count')?.value || '2', 10);

        const session = MockEngine.createSession(allProblems, userStates, {
          trackId: trackId,
          durationMinutes: duration,
          hintPolicy: hints,
          topicFilter: topic,
          difficulty: diff,
          questionsCount: count
        });

        startActiveMockSession(session);
      });
    }

    // 9. Report Modal Done/Close
    const btnCloseReport = document.getElementById('btn-close-mock-report');
    if (btnCloseReport && !btnCloseReport.dataset.bound) {
      btnCloseReport.dataset.bound = 'true';
      btnCloseReport.addEventListener('click', () => {
        document.getElementById('mock-report-modal')?.classList.remove('open');
      });
    }

    const btnReportDone = document.getElementById('btn-mock-report-done');
    if (btnReportDone && !btnReportDone.dataset.bound) {
      btnReportDone.dataset.bound = 'true';
      btnReportDone.addEventListener('click', () => {
        document.getElementById('mock-report-modal')?.classList.remove('open');
        renderMockInterviewView();
      });
    }
  }

  function renderMockHistoryTable() {
    const tbody = document.getElementById('mock-history-tbody');
    if (!tbody) return;

    let history = window.MockEngine ? MockEngine.getMockHistory() : [];
    
    // Wire filter tabs
    document.querySelectorAll('#mock-history-filter-tabs button').forEach(tab => {
      if (!tab.dataset.bound) {
        tab.dataset.bound = 'true';
        tab.addEventListener('click', () => {
          document.querySelectorAll('#mock-history-filter-tabs button').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          currentMockHistoryFilter = tab.getAttribute('data-mock-history-filter') || 'all';
          renderMockHistoryTable();
        });
      }
    });

    if (currentMockHistoryFilter === 'completed') {
      history = history.filter(h => h.status !== 'abandoned');
    } else if (currentMockHistoryFilter === 'abandoned') {
      history = history.filter(h => h.status === 'abandoned');
    }

    if (history.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:24px; color:var(--text-dim); font-size:13px;">No matching mock interview rounds found. Start your technical round above!</td></tr>';
      return;
    }

    tbody.innerHTML = history.slice().reverse().map(m => {
      const isAbandoned = m.status === 'abandoned';
      const scoreColor = isAbandoned ? '#94a3b8' : (m.overallPercentage >= 75 ? '#10b981' : (m.overallPercentage >= 60 ? '#38bdf8' : '#f59e0b'));
      const statusBadge = isAbandoned 
        ? '<span class="badge" style="background:rgba(244,63,94,0.15); color:#f87171; border:1px solid rgba(244,63,94,0.3);">Abandoned</span>' 
        : '<span class="badge" style="background:rgba(16,185,129,0.15); color:#34d399; border:1px solid rgba(16,185,129,0.3);">Completed</span>';

      return `
        <tr>
          <td><strong style="color:var(--text-main); font-size:12.5px;">${new Date(m.completedAt || Date.now()).toLocaleDateString()}</strong></td>
          <td><span class="badge badge-srs-upcoming" style="font-size:11px;">${m.trackTitle || 'Mock Session'}</span></td>
          <td>${m.actualMinutes || m.durationMinutes}m / ${m.durationMinutes}m</td>
          <td><strong style="font-size:14px; color:${scoreColor};">${isAbandoned ? '0%' : (m.overallPercentage || 0) + '%'}</strong></td>
          <td><span class="badge ${m.overallPercentage >= 75 ? 'badge-easy' : (m.overallPercentage >= 60 ? 'badge-medium' : 'badge-hard')}">${m.grade}</span></td>
          <td>${statusBadge}</td>
          <td style="text-align:right;">
            <button type="button" class="btn btn-secondary btn-xs btn-review-mock-record" data-session-id="${m.sessionId}" style="padding:4px 8px;">
              <i class="fa-solid fa-file-lines"></i> Review
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Wire Review buttons
    tbody.querySelectorAll('.btn-review-mock-record').forEach(btn => {
      btn.addEventListener('click', () => {
        const sid = btn.dataset.sessionId;
        const allMocks = window.MockEngine ? MockEngine.getMockHistory() : [];
        const match = allMocks.find(h => h.sessionId === sid);
        if (match) {
          showMockReport(match);
        }
      });
    });
  }

  function startActiveMockSession(session) {
    if (!session) return;
    activeMockSession = session;

    const cockpit = document.getElementById('mock-interview-cockpit');
    if (cockpit) {
      cockpit.style.display = 'flex';
      cockpit.classList.add('open');
    }

    const titleEl = document.getElementById('mock-cockpit-title');
    if (titleEl) {
      titleEl.innerHTML = `<i class="fa-solid fa-stopwatch-20" style="color:#f43f5e;"></i> ${session.trackTitle || 'Mock Interview'}`;
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
        alert('⏱️ Mock interview time is up! Submitting evaluation.');
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
    ans.approach = document.getElementById('mock-approach-editor')?.value || '';
    ans.timeComplexity = document.getElementById('mock-input-time')?.value || '';
    ans.spaceComplexity = document.getElementById('mock-input-space')?.value || '';

    // Edge cases
    const edges = [];
    document.querySelectorAll('#mock-edge-cases-container input[type="checkbox"]:checked').forEach(cb => {
      edges.push(cb.getAttribute('data-edge'));
    });
    ans.edgeCases = edges;

    const activeRatingBtn = document.querySelector('#mock-q-rating-options .rating-btn.active');
    ans.rating = activeRatingBtn ? activeRatingBtn.dataset.mockRating : 'medium';

    // Derive status
    let qStatus = 'not_started';
    if (ans.rating === 'simple' || ans.rating === 'medium') {
      qStatus = 'solved';
    } else if (ans.code || ans.approach || ans.timeComplexity || edges.length > 0) {
      qStatus = 'in_progress';
    }
    if (activeMockSession.questionStatuses) {
      activeMockSession.questionStatuses[p.id] = qStatus;
    }

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
      const isMarked = !!(activeMockSession.markedForReview && activeMockSession.markedForReview[p.id]);
      badgesEl.innerHTML = `
        <span class="badge badge-${p.difficulty.toLowerCase()}">${p.difficulty}</span>
        <span class="badge badge-srs-upcoming">${p.topic}</span>
        ${p.pattern ? `<span class="badge badge-srs-unsolved">${p.pattern}</span>` : ''}
        <span class="badge" style="background:rgba(255,255,255,0.06); color:var(--text-dim); font-size:11px;">Self-Reported Evaluation</span>
        ${isMarked ? '<span class="badge" style="background:rgba(234,179,8,0.15); color:#facc15;"><i class="fa-solid fa-flag"></i> Flagged for Review</span>' : ''}
      `;
    }

    const linkEl = document.getElementById('mock-active-link');
    if (linkEl) linkEl.href = p.url || `https://leetcode.com/problemset/all/?search=${encodeURIComponent(p.title)}`;

    // Statement Container
    const stmtContainer = document.getElementById('mock-statement-container');
    if (stmtContainer) {
      stmtContainer.innerHTML = `
        <div><strong style="color:#fff;">Interview Objective:</strong> Implement an optimal algorithmic solution for <strong>${p.title}</strong> (${p.difficulty}).</div>
        <div style="margin-top:6px; color:var(--text-muted); font-size:12px;"><strong>Topic:</strong> ${p.topic} ${p.pattern ? `• <strong>Pattern:</strong> ${p.pattern}` : ''}</div>
        <div style="margin-top:8px; font-size:11.5px; color:#38bdf8; background:rgba(6,182,212,0.06); padding:8px 12px; border-radius:6px; border:1px solid rgba(6,182,212,0.15);">
          <i class="fa-solid fa-circle-info"></i> Open the verified LeetCode link above to review constraints and run test cases on the platform runner. Complete your approach, solution, edge cases, and complexity analysis below for rubric grading.
        </div>
      `;
    }

    const ans = activeMockSession.answers[p.id] || {};
    const codeEl = document.getElementById('mock-code-editor');
    if (codeEl) codeEl.value = ans.code || '';

    const approachEl = document.getElementById('mock-approach-editor');
    if (approachEl) approachEl.value = ans.approach || '';

    const timeEl = document.getElementById('mock-input-time');
    if (timeEl) timeEl.value = ans.timeComplexity || '';

    const spaceEl = document.getElementById('mock-input-space');
    if (spaceEl) spaceEl.value = ans.spaceComplexity || '';

    // Restore Edge Cases
    const currentEdges = Array.isArray(ans.edgeCases) ? ans.edgeCases : [];
    document.querySelectorAll('#mock-edge-cases-container input[type="checkbox"]').forEach(cb => {
      cb.checked = currentEdges.includes(cb.getAttribute('data-edge'));
    });

    // Rating buttons
    document.querySelectorAll('#mock-q-rating-options .rating-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mockRating === (ans.rating || 'medium'));
    });

    // Mark for Review Button state
    const markBtn = document.getElementById('btn-mock-mark-review');
    const isMarked = !!(activeMockSession.markedForReview && activeMockSession.markedForReview[p.id]);
    if (markBtn) {
      markBtn.style.color = isMarked ? '#facc15' : 'var(--text-muted)';
      const label = document.getElementById('mock-mark-review-label');
      if (label) label.textContent = isMarked ? 'Flagged for Review' : 'Mark for Review';
    }

    const hintBanner = document.getElementById('mock-hint-banner');
    if (hintBanner) hintBanner.style.display = 'none';

    // Left Sidebar questions list
    const qList = document.getElementById('mock-question-list');
    if (qList) {
      qList.innerHTML = activeMockSession.problems.map((prob, i) => {
        const pStatus = (activeMockSession.questionStatuses && activeMockSession.questionStatuses[prob.id]) || 'not_started';
        const pMarked = !!(activeMockSession.markedForReview && activeMockSession.markedForReview[prob.id]);
        
        let statusBadge = '<span class="badge" style="font-size:10px; background:rgba(255,255,255,0.06); color:var(--text-dim);">Not Started</span>';
        if (pStatus === 'solved') {
          statusBadge = '<span class="badge" style="font-size:10px; background:rgba(16,185,129,0.15); color:#34d399;">Solved</span>';
        } else if (pStatus === 'in_progress') {
          statusBadge = '<span class="badge" style="font-size:10px; background:rgba(59,130,246,0.15); color:#60a5fa;">In Progress</span>';
        }

        return `
          <div class="test-q-item ${i === idx ? 'active' : ''}" data-mock-idx="${i}">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <strong style="font-size:13px; color:var(--text-main);">Q${i + 1}: ${prob.title}</strong>
              ${pMarked ? '<i class="fa-solid fa-flag" style="color:#facc15; font-size:11px;"></i>' : ''}
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2px;">
              <span class="badge badge-${prob.difficulty.toLowerCase()}" style="font-size:10px;">${prob.difficulty}</span>
              ${statusBadge}
            </div>
          </div>
        `;
      }).join('');

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
      renderMockInterviewView();
    }
  }

  function finishMockInterview() {
    if (!activeMockSession || !window.MockEngine) return;
    saveCurrentMockQuestionState();

    if (mockTimerInterval) clearInterval(mockTimerInterval);

    // SEPARATION INVARIANT: evaluateSession ONLY scores the session & records to mock history.
    // IT DOES NOT MUTATE userStates, advance SRS, or mark roadmap days complete!
    const report = MockEngine.evaluateSession(activeMockSession, userStates);

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
    renderMockInterviewView();
  }

  function abandonMockInterview() {
    if (!activeMockSession && window.MockEngine) {
      activeMockSession = MockEngine.getActiveSession();
    }
    if (!activeMockSession || !window.MockEngine) return;

    saveCurrentMockQuestionState();
    if (mockTimerInterval) clearInterval(mockTimerInterval);

    const report = MockEngine.abandonSession(activeMockSession);

    const cockpit = document.getElementById('mock-interview-cockpit');
    if (cockpit) {
      cockpit.style.display = 'none';
      cockpit.classList.remove('open');
    }
    activeMockSession = null;

    if (report) showMockReport(report);
    renderMockInterviewView();
  }

  function showMockReport(report) {
    if (!report) return;
    const modal = document.getElementById('mock-report-modal');
    if (!modal) return;

    const isAbandoned = report.status === 'abandoned';

    document.getElementById('mock-report-date').textContent = new Date(report.completedAt).toLocaleString();
    const scoreEl = document.getElementById('mock-report-score');
    if (scoreEl) {
      scoreEl.textContent = isAbandoned ? '0%' : `${report.overallPercentage}%`;
      scoreEl.style.color = isAbandoned ? '#f43f5e' : (report.overallPercentage >= 75 ? '#10b981' : '#38bdf8');
    }

    const gradeEl = document.getElementById('mock-report-grade');
    if (gradeEl) gradeEl.textContent = report.grade;

    const trackInfoEl = document.getElementById('mock-report-track-info');
    if (trackInfoEl) {
      trackInfoEl.textContent = `${report.trackTitle} • ${report.actualMinutes || report.durationMinutes} mins elapsed of ${report.durationMinutes}m`;
    }

    const provInfoEl = document.getElementById('mock-report-provenance-info');
    if (provInfoEl) {
      provInfoEl.textContent = `Provenance: Self-reported solution & deterministic rubric scoring (${report.problemsCount} questions evaluated)`;
    }

    const breakdownEl = document.getElementById('mock-report-breakdown');
    if (breakdownEl) {
      breakdownEl.innerHTML = (report.questionResults || []).map(q => {
        const st = userStates[q.problemId] || {};
        const isBookmarked = !!(st.bookmarked || st.isBookmarked);
        const isDue = SRSEngine.isDue(st);

        return `
          <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:14px 16px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px;">
              <div>
                <strong style="font-size:14px; color:var(--text-main);">${q.title}</strong>
                <span style="font-size:11.5px; color:var(--text-dim); display:block; margin-top:2px;">
                  ${q.topic} • ${q.difficulty} • Self-Rating: <strong>${capitalize(q.rating || 'medium')}</strong>
                  ${q.markedForReview ? ' • <span style="color:#facc15;"><i class="fa-solid fa-flag"></i> Flagged for Review</span>' : ''}
                </span>
              </div>
              <div style="text-align:right;">
                <strong style="font-size:16px; color:${q.score >= 70 ? '#10b981' : '#f59e0b'};">${q.score} / 100</strong>
                ${q.hintsUsedCount > 0 ? `<span style="font-size:10.5px; color:#f43f5e; display:block;">-${q.hintsUsedCount * 5} hint penalty</span>` : ''}
              </div>
            </div>

            ${q.approach ? `
              <div style="margin-top:8px; font-size:12px; color:var(--text-muted); background:rgba(0,0,0,0.2); padding:8px 10px; border-radius:4px; font-family:'JetBrains Mono', monospace;">
                Approach: ${q.approach.substring(0, 120)}${q.approach.length > 120 ? '...' : ''}
              </div>
            ` : ''}

            <!-- Actionable Follow-ups -->
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-top:12px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.05);">
              <div style="display:flex; gap:6px; flex-wrap:wrap;">
                <a href="${q.url || `https://leetcode.com/problemset/all/?search=${encodeURIComponent(q.title)}`}" target="_blank" class="btn btn-secondary btn-xs">
                  <i class="fa-solid fa-arrow-up-right-from-square"></i> Open LeetCode
                </a>
                <button type="button" class="btn btn-secondary btn-xs btn-mock-report-bookmark" data-problem-id="${q.problemId}">
                  <i class="fa-${isBookmarked ? 'solid' : 'regular'} fa-bookmark"></i> ${isBookmarked ? 'Bookmarked' : 'Bookmark'}
                </button>
                <button type="button" class="btn btn-secondary btn-xs btn-mock-report-add-srs" data-problem-id="${q.problemId}">
                  <i class="fa-solid fa-clock-rotate-left"></i> ${isDue ? 'Due in SRS' : 'Schedule SRS Revision'}
                </button>
              </div>

              <button type="button" class="btn btn-secondary btn-xs btn-mock-toggle-note-field" data-problem-id="${q.problemId}">
                <i class="fa-solid fa-pen"></i> Add Mistake Note
              </button>
            </div>

            <div class="mock-note-input-container" id="mock-note-area-${q.problemId}" style="display:none; margin-top:10px;">
              <textarea class="code-editor-area" style="min-height:60px; font-size:12px;" placeholder="Document what you missed or what to remember next time..."></textarea>
              <div style="display:flex; justify-content:flex-end; gap:6px; margin-top:6px;">
                <button type="button" class="btn btn-primary btn-xs btn-save-mock-note" data-problem-id="${q.problemId}">Save Note</button>
              </div>
            </div>
          </div>
        `;
      }).join('');

      // Wire Bookmark buttons
      breakdownEl.querySelectorAll('.btn-mock-report-bookmark').forEach(btn => {
        btn.addEventListener('click', () => {
          const pid = btn.dataset.problemId;
          if (!userStates[pid]) userStates[pid] = { id: pid };
          const cur = !!(userStates[pid].bookmarked || userStates[pid].isBookmarked);
          userStates[pid].bookmarked = !cur;
          userStates[pid].isBookmarked = !cur;
          saveUserStates();
          btn.innerHTML = `<i class="fa-${!cur ? 'solid' : 'regular'} fa-bookmark"></i> ${!cur ? 'Bookmarked' : 'Bookmark'}`;
        });
      });

      // Wire Explicit Add-to-Revision buttons
      breakdownEl.querySelectorAll('.btn-mock-report-add-srs').forEach(btn => {
        btn.addEventListener('click', () => {
          const pid = btn.dataset.problemId;
          if (!userStates[pid]) userStates[pid] = { id: pid };
          
          const todayStr = (function() {
            const d = new Date();
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          })();
          userStates[pid].nextReviewDate = todayStr;
          userStates[pid].isMastered = false;
          saveUserStates();

          btn.textContent = '✓ Queued for Revision';
          btn.disabled = true;
          btn.style.color = '#10b981';
          btn.style.borderColor = 'rgba(16,185,129,0.4)';
        });
      });

      // Wire Mistake Note fields
      breakdownEl.querySelectorAll('.btn-mock-toggle-note-field').forEach(btn => {
        btn.addEventListener('click', () => {
          const pid = btn.dataset.problemId;
          const container = document.getElementById(`mock-note-area-${pid}`);
          if (container) {
            container.style.display = container.style.display === 'none' ? 'block' : 'none';
          }
        });
      });

      breakdownEl.querySelectorAll('.btn-save-mock-note').forEach(btn => {
        btn.addEventListener('click', () => {
          const pid = btn.dataset.problemId;
          const container = document.getElementById(`mock-note-area-${pid}`);
          const text = container?.querySelector('textarea')?.value || '';
          if (!userStates[pid]) userStates[pid] = { id: pid };
          userStates[pid].notes = ((userStates[pid].notes ? userStates[pid].notes + '\n\n' : '') + '[Mock Note]: ' + text).trim();
          saveUserStates();
          btn.textContent = 'Saved!';
          btn.disabled = true;
          setTimeout(() => {
            btn.textContent = 'Save Note';
            btn.disabled = false;
            if (container) container.style.display = 'none';
          }, 1500);
        });
      });
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
          alert('ðŸŽ‰ Data restored and merged successfully!');
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
    // Navigation routing across all 7 routes
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const routeAttr = item.getAttribute('data-route');
        const viewName = item.getAttribute('data-view');
        if (routeAttr) {
          const cleanRoute = routeAttr.replace(/^\//, '');
          switchView(cleanRoute);
        } else if (viewName) {
          switchView(viewName);
        }
      });
    });

    const roadmapNavEl = document.getElementById('nav-item-roadmaps') || document.getElementById('nav-item-roadmap');
    roadmapNavEl?.addEventListener('click', () => switchView('roadmaps'));

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
            <span>ðŸ’¡ Mock Hint (${hint.levelTitle})</span>
            <span style="font-size:11px; opacity:0.8;">Hint #${ans.hintsUsedCount}</span>
          </div>
          <div style="white-space:pre-wrap; line-height:1.5;">${hint.content}</div>
        `;
      }
    });

    // Mock Cockpit Abandon
    document.getElementById('btn-cockpit-abandon-mock')?.addEventListener('click', () => {
      if (confirm('Are you sure you want to abandon this mock round? It will be recorded as abandoned in your history.')) {
        abandonMockInterview();
      }
    });

    // Mock Cockpit Mark for Review
    document.getElementById('btn-mock-mark-review')?.addEventListener('click', () => {
      if (!activeMockSession || !activeMockSession.problems[activeMockSession.activeQuestionIndex]) return;
      const p = activeMockSession.problems[activeMockSession.activeQuestionIndex];
      if (!activeMockSession.markedForReview) activeMockSession.markedForReview = {};
      activeMockSession.markedForReview[p.id] = !activeMockSession.markedForReview[p.id];
      renderActiveMockQuestion();
      if (window.MockEngine) MockEngine.saveActiveSession(activeMockSession);
    });

    // Auto-save on inputs in mock workspace
    ['mock-code-editor', 'mock-approach-editor', 'mock-input-time', 'mock-input-space'].forEach(fieldId => {
      document.getElementById(fieldId)?.addEventListener('input', () => {
        saveCurrentMockQuestionState();
      });
    });

    document.querySelectorAll('#mock-edge-cases-container input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        saveCurrentMockQuestionState();
      });
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

    // Contextual Feature Navigation Listeners
    document.addEventListener('click', (e) => {
      const btnMatrixPractice = e.target.closest('.btn-topic-matrix-practice');
      if (btnMatrixPractice && btnMatrixPractice.dataset.topic) {
        e.preventDefault();
        if (window.LearningOrchestrator) {
          window.LearningOrchestrator.navigateToFeature('practice_topic', { topic: btnMatrixPractice.dataset.topic });
        } else {
          switchView('practice', 'catalog');
        }
        return;
      }

      const btnRoadmapPractice = e.target.closest('.btn-roadmap-practice-topic');
      if (btnRoadmapPractice && btnRoadmapPractice.dataset.topic) {
        e.preventDefault();
        if (window.LearningOrchestrator) {
          window.LearningOrchestrator.navigateToFeature('practice_topic', { topic: btnRoadmapPractice.dataset.topic });
        } else {
          switchView('practice', 'catalog');
        }
        return;
      }

      // Stream B: Start Revision — navigate to practice filtered by revision topic
      const btnStreamBRevision = e.target.closest('.btn-stream-b-start-revision');
      if (btnStreamBRevision) {
        e.preventDefault();
        const revTopic = btnStreamBRevision.dataset.topic || '';
        if (window.LearningOrchestrator && revTopic) {
          window.LearningOrchestrator.navigateToFeature('practice_topic', { topic: revTopic, stream: 'foundation_revision' });
        } else {
          switchView('practice', 'catalog');
        }
        return;
      }
    });

    setupFeaturePurposeBanners();

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
    document.getElementById('filter-topic')?.addEventListener('change', (e) => {
      populateSubtopicsDropdown(e.target.value);
      renderProblemsTable();
    });
    document.getElementById('filter-subtopic')?.addEventListener('change', renderProblemsTable);
    document.getElementById('toggle-group-subtopic')?.addEventListener('change', renderProblemsTable);
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

    // Revision Queue Controls & Listeners
    document.body.addEventListener('click', (e) => {
      const revTab = e.target.closest('.rev-tab-btn') || e.target.closest('[data-revision-filter]');
      if (revTab) {
        currentRevisionFilter = revTab.getAttribute('data-revision-filter') || 'due';
        renderRevisionQueue();
        return;
      }

      const revOne = e.target.closest('.btn-rev-start-one');
      if (revOne) {
        launchActiveRecallSession([revOne.dataset.problemId]);
        return;
      }

      const bookmarkBtn = e.target.closest('.btn-rev-bookmark');
      if (bookmarkBtn) {
        const pid = bookmarkBtn.dataset.problemId;
        if (pid) {
          userStates[pid] = userStates[pid] || { id: pid };
          userStates[pid].isBookmarked = !userStates[pid].isBookmarked;
          LearnerRepository.saveUserStates(userStates);
          renderRevisionQueue();
        }
        return;
      }

      const choiceBtn = e.target.closest('.btn-recall-choice');
      if (choiceBtn) {
        const ratingKey = choiceBtn.getAttribute('data-recall-rating');
        handleRecallRatingClick(ratingKey);
        return;
      }

      const hintBtn = e.target.closest('#btn-reveal-hint');
      if (hintBtn && activeRecallSessionState) {
        activeRecallSessionState.hintsRevealed = (activeRecallSessionState.hintsRevealed || 0) + 1;
        renderActiveRecallSessionModal();
        return;
      }

      const solBtn = e.target.closest('#btn-reveal-solution');
      if (solBtn && activeRecallSessionState) {
        activeRecallSessionState.solutionRevealed = true;
        renderActiveRecallSessionModal();
        return;
      }

      const pauseBtn = e.target.closest('#btn-pause-recall-session') || e.target.closest('#btn-close-recall-session');
      if (pauseBtn) {
        const modal = document.getElementById('modal-active-recall-session');
        if (modal) modal.style.display = 'none';
        renderRevisionQueue();
        return;
      }

      const finishBtn = e.target.closest('#btn-finish-recall-session');
      if (finishBtn) {
        const modal = document.getElementById('modal-active-recall-session');
        if (modal) modal.style.display = 'none';
        if (window.RevisionSessionController) {
          window.RevisionSessionController.discardActiveSession();
        }
        activeRecallSessionState = null;
        renderRevisionQueue();
        return;
      }

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

    const revSearch = document.getElementById('revision-search-input');
    if (revSearch) {
      revSearch.addEventListener('input', (e) => {
        currentRevisionSearch = e.target.value;
        renderRevisionQueue();
      });
    }

    const revTopic = document.getElementById('revision-topic-filter');
    if (revTopic) {
      revTopic.addEventListener('change', (e) => {
        currentRevisionTopic = e.target.value;
        renderRevisionQueue();
      });
    }

    const revDiff = document.getElementById('revision-difficulty-filter');
    if (revDiff) {
      revDiff.addEventListener('change', (e) => {
        currentRevisionDiff = e.target.value;
        renderRevisionQueue();
      });
    }

    const revSort = document.getElementById('revision-sort-filter');
    if (revSort) {
      revSort.addEventListener('change', (e) => {
        currentRevisionSort = e.target.value;
        renderRevisionQueue();
      });
    }

    const btnStartRev = document.getElementById('btn-start-revision-session');
    if (btnStartRev) {
      btnStartRev.addEventListener('click', () => {
        launchActiveRecallSession();
      });
    }

    const btnResumeRev = document.getElementById('btn-resume-revision-session');
    if (btnResumeRev) {
      btnResumeRev.addEventListener('click', () => {
        resumeActiveRecallSession();
      });
    }

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
        alert('âœ… 1-Click Sync Code copied to clipboard!\n\nPaste this code into AlgoRecall on your phone or other device to instantly sync all progress.');
      } catch (_) {
        prompt('Copy your sync code:', code);
      }
    });

    document.getElementById('btn-copy-sync-link')?.addEventListener('click', async () => {
      const code = exportSyncCode();
      const directUrl = `${window.location.origin}${window.location.pathname}#sync=${encodeURIComponent(code)}`;
      try {
        await navigator.clipboard.writeText(directUrl);
        alert('âœ… Direct Sync Link copied to clipboard!\n\nOpen this URL on your other device to automatically load all progress.');
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

        alert(`ðŸŽ‰ Loaded ${targetCount} verified problems for ${presetType.toUpperCase()}! Master catalog cleanly synced to ${allProblems.length} unique questions.`);
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
      alert(`âœ¨ Database Synced & Deduplicated!\nBefore: ${beforeCount} items\nNow: ${allProblems.length} pristine questions with all your review history preserved.`);
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
          alert(`ðŸŽ‰ Successfully extracted and imported ${foundProblems.length} problems from URL!`);
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
      alert(`ðŸŽ‰ Successfully added ${addedCount} problems!`);
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
      const trackVal = e.target.value;
      RoadmapEngine.progress.activeTrack = trackVal;
      RoadmapEngine.progress.selectedWeek = 1;
      RoadmapEngine.progress.selectedDay = 1;
      if (trackVal === 'pedagogical_120' && typeof RoadmapEngine.restorePedagogicalRoadmap === 'function') {
        RoadmapEngine.progress.explicitlyChosePedagogicalTrack = true;
        RoadmapEngine.restorePedagogicalRoadmap(userStates);
      } else if (trackVal === 'dual_stream_120' && typeof RoadmapEngine.restoreDualStreamRoadmap === 'function') {
        RoadmapEngine.restoreDualStreamRoadmap(userStates);
      } else if (trackVal === 'striver_hero' && typeof RoadmapEngine.restoreDefaultRoadmap === 'function') {
        RoadmapEngine.progress.explicitlyChoseLegacyTrack = true;
        RoadmapEngine.restoreDefaultRoadmap(userStates);
      }
      RoadmapEngine.saveProgress();
      renderRoadmapView();
    });

    // 1b. Start / Continue Active Curriculum Action
    document.getElementById('btn-roadmap-primary-action')?.addEventListener('click', () => {
      const curProg = (RoadmapEngine && typeof RoadmapEngine.getCurriculumProgress === 'function') ?
        RoadmapEngine.getCurriculumProgress(userStates) : null;
      const targetDay = curProg ? curProg.currentCurriculumDay : 1;

      // In list view: scroll directly to the target day card
      const dayEl = document.querySelector(`.roadmap-120-day-card[data-day-num="${targetDay}"]`);
      if (dayEl) {
        dayEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        dayEl.style.transition = 'box-shadow 0.3s ease';
        dayEl.style.boxShadow = '0 0 0 3px var(--primary), 0 8px 30px rgba(99,102,241,0.4)';
        setTimeout(() => { dayEl.style.boxShadow = ''; }, 2500);
      } else {
        // If not directly visible in list (e.g. filtered), reset filter and re-render
        activeRoadmap120Filter = 'all';
        renderRoadmapView();
        setTimeout(() => {
          const el = document.querySelector(`.roadmap-120-day-card[data-day-num="${targetDay}"]`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.style.boxShadow = '0 0 0 3px var(--primary), 0 8px 30px rgba(99,102,241,0.4)';
            setTimeout(() => { el.style.boxShadow = ''; }, 2500);
          }
        }, 100);
      }
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
    document.getElementById('btn-roadmap-adjust-topics')?.addEventListener('click', () => {
      openRoadmapAdjustTopicsModal('current_learning');
    });

    document.getElementById('btn-close-roadmap-adjust-modal')?.addEventListener('click', closeRoadmapAdjustTopicsModal);
    document.getElementById('btn-close-topic-adjust')?.addEventListener('click', closeRoadmapAdjustTopicsModal);

    document.getElementById('btn-adjust-tab-stream-a')?.addEventListener('click', () => {
      openRoadmapAdjustTopicsModal('current_learning');
    });
    document.getElementById('btn-adjust-tab-stream-b')?.addEventListener('click', () => {
      openRoadmapAdjustTopicsModal('foundation_revision');
    });

    document.getElementById('btn-reset-topic-order')?.addEventListener('click', () => {
      if (!window.RoadmapEngine) return;
      const streamName = activeReorderStream === 'current_learning' ? 'Current Learning' : 'Foundation Revision';
      if (confirm(`Reset ${streamName} topic sequence back to default blueprint?`)) {
        RoadmapEngine.resetTopicOrder(activeReorderStream);
        renderRoadmapTopicsReorderList();
        renderRoadmapView();
      }
    });

    document.getElementById('roadmap-adjust-topics-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'roadmap-adjust-topics-modal') {
        closeRoadmapAdjustTopicsModal();
      }
    });

    document.getElementById('roadmap-topics-reorder-container')?.addEventListener('click', (e) => {
      if (!window.RoadmapEngine) return;

      const topBtn = e.target.closest('.btn-modal-topic-top');
      if (topBtn) {
        const topic = topBtn.dataset.topic;
        RoadmapEngine.moveTopic(activeReorderStream, topic, 0);
        renderRoadmapTopicsReorderList();
        renderRoadmapView();
        return;
      }

      const upBtn = e.target.closest('.btn-modal-topic-up');
      if (upBtn) {
        const topic = upBtn.dataset.topic;
        RoadmapEngine.moveTopic(activeReorderStream, topic, 'up');
        renderRoadmapTopicsReorderList();
        renderRoadmapView();
        return;
      }

      const downBtn = e.target.closest('.btn-modal-topic-down');
      if (downBtn) {
        const topic = downBtn.dataset.topic;
        RoadmapEngine.moveTopic(activeReorderStream, topic, 'down');
        renderRoadmapTopicsReorderList();
        renderRoadmapView();
        return;
      }

      const bottomBtn = e.target.closest('.btn-modal-topic-bottom');
      if (bottomBtn) {
        const topic = bottomBtn.dataset.topic;
        const total = RoadmapEngine.getTopicsList(activeReorderStream).length;
        RoadmapEngine.moveTopic(activeReorderStream, topic, total - 1);
        renderRoadmapTopicsReorderList();
        renderRoadmapView();
        return;
      }
    });

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

      // 12. Topic Up/Down and Quick Shift Controls
      const topicMoveBtn = e.target.closest('.btn-topic-move');
      if (topicMoveBtn) {
        e.stopPropagation();
        const stream = topicMoveBtn.dataset.stream;
        const topic = topicMoveBtn.dataset.topic;
        const dir = topicMoveBtn.dataset.dir;
        if (window.RoadmapEngine) {
          RoadmapEngine.moveTopic(stream, topic, dir);
          renderRoadmapView();
        }
        return;
      }

      const quickTopicBtn = e.target.closest('.btn-quick-topic-shift');
      if (quickTopicBtn) {
        e.stopPropagation();
        const stream = quickTopicBtn.dataset.stream;
        const topic = quickTopicBtn.dataset.topic;
        const dir = quickTopicBtn.dataset.dir;
        if (window.RoadmapEngine && topic) {
          RoadmapEngine.moveTopic(stream, topic, dir);
          renderRoadmapView();
        }
        return;
      }

      const openReorderBtn = e.target.closest('.btn-open-topic-reorder-modal');
      if (openReorderBtn) {
        e.stopPropagation();
        const stream = openReorderBtn.dataset.stream || 'current_learning';
        openRoadmapAdjustTopicsModal(stream);
        return;
      }

      // 13. Topic Progression Card Click (filter list by topic)
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

    setupRoadmapLibraryAndEditorListeners();
  }

  function pushEditorUndoSnapshot() {
    if (!editorWorkingRoadmap) return;
    if (editorUndoStack.length >= 30) editorUndoStack.shift();
    editorUndoStack.push(JSON.stringify(editorWorkingRoadmap));
  }

  function setupRoadmapLibraryAndEditorListeners() {
    // 1. Library Filter Tabs
    document.querySelectorAll('.roadmap-filter-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.roadmap-filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeRoadmapFilter = tab.dataset.filter || 'all';
        renderRoadmapsLibrary();
      });
    });

    // 2. Library Search & Sort Controls
    const searchInput = document.getElementById('roadmap-search-input');
    searchInput?.addEventListener('input', (e) => {
      roadmapLibrarySearchQuery = e.target.value;
      renderRoadmapsLibrary();
    });

    const sortSelect = document.getElementById('roadmap-sort-select');
    sortSelect?.addEventListener('change', (e) => {
      roadmapLibrarySortOrder = e.target.value;
      renderRoadmapsLibrary();
    });

    // 3. Library Grid Event Delegation (Cards, Set as Active, View Details)
    const libraryGrid = document.getElementById('roadmap-library-grid');
    libraryGrid?.addEventListener('click', (e) => {
      const setActiveBtn = e.target.closest('.btn-roadmap-set-active');
      if (setActiveBtn) {
        e.stopPropagation();
        const trackId = setActiveBtn.dataset.id;
        if (window.RoadmapEngine && trackId) {
          const res = RoadmapEngine.setActiveRoadmap(trackId, userStates);
          if (res && res.success) {
            renderRoadmapsLibrary();
            renderRoadmapView();
            if (typeof renderDashboardView === 'function') renderDashboardView();
            if (typeof updateGamificationHeader === 'function') updateGamificationHeader();
          }
        }
        return;
      }

      const viewDetailBtn = e.target.closest('.btn-roadmap-view-detail');
      const card = e.target.closest('.roadmap-card');
      const targetId = (viewDetailBtn && viewDetailBtn.dataset.id) || (card && card.dataset.id);
      if (targetId) {
        if (window.RoadmapEngine) {
          RoadmapEngine.setSelectedRoadmapId(targetId);
        }
        currentRoadmapSubview = 'detail';
        activeRoadmapDetailTab = 'overview';
        window.location.hash = '#/roadmaps/' + targetId;
        renderRoadmapDetail(targetId, 'overview');
      }
    });

    // 4. Detail Navigation Header
    document.getElementById('btn-back-to-roadmaps-library')?.addEventListener('click', () => {
      currentRoadmapSubview = 'library';
      window.location.hash = '#/roadmaps';
      renderRoadmapsLibrary();
    });

    document.getElementById('btn-detail-set-active')?.addEventListener('click', () => {
      const selectedId = RoadmapEngine.getSelectedRoadmapId ? RoadmapEngine.getSelectedRoadmapId() : 'dual_stream_120';
      if (window.RoadmapEngine && selectedId) {
        const res = RoadmapEngine.setActiveRoadmap(selectedId, userStates);
        if (res && res.success) {
          renderRoadmapDetail(selectedId, activeRoadmapDetailTab);
          if (typeof renderDashboardView === 'function') renderDashboardView();
        }
      }
    });

    document.getElementById('btn-detail-edit-plan')?.addEventListener('click', () => {
      activeRoadmapDetailTab = 'editor';
      const selectedId = RoadmapEngine.getSelectedRoadmapId ? RoadmapEngine.getSelectedRoadmapId() : 'dual_stream_120';
      window.location.hash = '#/roadmaps/' + selectedId + '/edit';
      renderRoadmapDetail(selectedId, 'editor');
    });

    // 5. Detail Tab Buttons
    document.querySelectorAll('.roadmap-detail-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        if (!tab) return;
        activeRoadmapDetailTab = tab;
        const selectedId = RoadmapEngine.getSelectedRoadmapId ? RoadmapEngine.getSelectedRoadmapId() : 'dual_stream_120';
        if (tab === 'editor') {
          window.location.hash = '#/roadmaps/' + selectedId + '/edit';
        } else {
          window.location.hash = '#/roadmaps/' + selectedId;
        }
        renderRoadmapDetail(selectedId, tab);
      });
    });

    // 6. Create Roadmap Modal Triggers
    const modalCreate = document.getElementById('modal-create-roadmap');
    const openCreateModal = () => {
      if (modalCreate) {
        modalCreate.classList.add('open');
        modalCreate.setAttribute('aria-hidden', 'false');
      }
    };
    const closeCreateModal = () => {
      if (modalCreate) {
        modalCreate.classList.remove('open');
        modalCreate.setAttribute('aria-hidden', 'true');
      }
    };

    document.getElementById('btn-open-create-roadmap-modal')?.addEventListener('click', openCreateModal);
    document.getElementById('btn-close-create-roadmap')?.addEventListener('click', closeCreateModal);
    document.getElementById('btn-cancel-create-roadmap')?.addEventListener('click', closeCreateModal);
    modalCreate?.addEventListener('click', (e) => {
      if (e.target.id === 'modal-create-roadmap') closeCreateModal();
    });

    document.getElementById('btn-submit-create-roadmap')?.addEventListener('click', () => {
      const titleInput = document.getElementById('create-roadmap-title');
      const descInput = document.getElementById('create-roadmap-description');
      const durationSelect = document.getElementById('create-roadmap-duration');
      const topicInput = document.getElementById('create-roadmap-focus-topic');
      const minsInput = document.getElementById('create-roadmap-daily-mins');

      const title = (titleInput?.value || '').trim();
      if (!title) {
        alert('Please enter a roadmap title.');
        titleInput?.focus();
        return;
      }

      const totalDays = parseInt(durationSelect?.value || '60', 10);
      const desc = (descInput?.value || '').trim();
      const focusTopic = (topicInput?.value || '').trim();
      const dailyMinutes = parseInt(minsInput?.value || '120', 10);

      if (window.RoadmapEngine && typeof RoadmapEngine.createCustomRoadmap === 'function') {
        const res = RoadmapEngine.createCustomRoadmap({
          title,
          description: desc,
          totalDays,
          focusTopic,
          dailyMinutes
        }, userStates);

        if (res && res.success) {
          closeCreateModal();
          if (titleInput) titleInput.value = '';
          if (descInput) descInput.value = '';
          RoadmapEngine.setSelectedRoadmapId(res.roadmapId);
          currentRoadmapSubview = 'detail';
          activeRoadmapDetailTab = 'overview';
          window.location.hash = '#/roadmaps/' + res.roadmapId;
          renderRoadmapDetail(res.roadmapId, 'overview');
        } else {
          alert('Failed to create roadmap: ' + (res?.error || 'Unknown error'));
        }
      }
    });

    // 7. Full Plan Editor Toolbar Actions
    document.getElementById('btn-editor-save')?.addEventListener('click', () => {
      if (!editorWorkingRoadmap || !window.RoadmapEngine) return;
      const selectedId = RoadmapEngine.getSelectedRoadmapId ? RoadmapEngine.getSelectedRoadmapId() : 'dual_stream_120';
      
      const validation = RoadmapEngine.validateRoadmapSchedule(editorWorkingRoadmap);
      if (!validation.valid && validation.conflicts.length > 0) {
        const msg = 'Schedule has ' + validation.conflicts.length + ' warning(s):\n' +
          validation.conflicts.slice(0, 3).map(c => '- ' + c.message).join('\n') +
          '\nDo you still wish to save?';
        if (!confirm(msg)) return;
      }

      const saveRes = RoadmapEngine.saveRoadmap(selectedId, editorWorkingRoadmap);
      if (saveRes && saveRes.success) {
        editorIsDirty = false;
        const dirtyBadge = document.getElementById('roadmap-editor-dirty-badge');
        if (dirtyBadge) dirtyBadge.classList.add('clean');
        alert('✓ Roadmap changes saved successfully!');
        renderRoadmapPlanEditor(editorWorkingRoadmap, userStates);
      }
    });

    document.getElementById('btn-editor-cancel')?.addEventListener('click', () => {
      if (editorIsDirty && !confirm('Discard all unsaved changes and reload?')) return;
      const selectedId = RoadmapEngine.getSelectedRoadmapId ? RoadmapEngine.getSelectedRoadmapId() : 'dual_stream_120';
      const fresh = RoadmapEngine.getRoadmap(selectedId, userStates);
      if (fresh) {
        editorWorkingRoadmap = JSON.parse(JSON.stringify(fresh));
        editorIsDirty = false;
        editorUndoStack = [];
        const dirtyBadge = document.getElementById('roadmap-editor-dirty-badge');
        if (dirtyBadge) dirtyBadge.classList.add('clean');
        renderRoadmapPlanEditor(editorWorkingRoadmap, userStates);
      }
    });

    document.getElementById('btn-editor-undo')?.addEventListener('click', () => {
      if (editorUndoStack.length === 0) {
        alert('Nothing to undo.');
        return;
      }
      const prev = editorUndoStack.pop();
      editorWorkingRoadmap = JSON.parse(prev);
      editorIsDirty = true;
      const dirtyBadge = document.getElementById('roadmap-editor-dirty-badge');
      if (dirtyBadge) dirtyBadge.classList.remove('clean');
      renderRoadmapPlanEditor(editorWorkingRoadmap, userStates);
    });

    document.getElementById('btn-editor-validate')?.addEventListener('click', () => {
      if (!editorWorkingRoadmap || !window.RoadmapEngine) return;
      const validation = RoadmapEngine.validateRoadmapSchedule(editorWorkingRoadmap);
      if (validation.valid) {
        alert('✓ Roadmap Schedule is Valid! Zero duplicate problems and all topics cleanly assigned.');
      } else {
        alert('Validation Warnings:\n' + validation.conflicts.map(c => '• ' + c.message).join('\n'));
      }
    });

    document.getElementById('btn-editor-insert-buffer')?.addEventListener('click', () => {
      if (!editorWorkingRoadmap) return;
      pushEditorUndoSnapshot();
      const total = editorWorkingRoadmap.days.length;
      const newDayNum = total + 1;
      editorWorkingRoadmap.days.push({
        planDayId: 'day_' + newDayNum,
        sequenceIndex: newDayNum,
        dayNumber: newDayNum,
        dayType: 'buffer',
        isBufferDay: true,
        phase: 'Buffer & Consolidation',
        topic: 'Buffer Day',
        subtopic: 'Weekly Consolidation & Recovery',
        bufferReason: 'Inserted buffer day for catch-up',
        tasks: [{
          taskId: 'task_' + newDayNum + '_buffer',
          stream: 'buffer',
          topicId: 'Buffer Day',
          subtopicId: 'Weekly Consolidation & Recovery',
          objectives: 'Catch up on backlog and SRS reviews',
          problemIds: [],
          targetCount: 0,
          estimatedMinutes: 0,
          isBuffer: true,
          status: 'pending'
        }]
      });
      editorIsDirty = true;
      const dirtyBadge = document.getElementById('roadmap-editor-dirty-badge');
      if (dirtyBadge) dirtyBadge.classList.remove('clean');
      renderRoadmapPlanEditor(editorWorkingRoadmap, userStates);
    });

    document.getElementById('editor-filter-type')?.addEventListener('change', () => {
      if (editorWorkingRoadmap) {
        renderRoadmapPlanEditor(editorWorkingRoadmap, userStates);
      }
    });

    // 8. Plan Editor Days Container Inline Delegations
    const editorDaysContainer = document.getElementById('plan-editor-days-container');
    editorDaysContainer?.addEventListener('change', (e) => {
      if (!editorWorkingRoadmap) return;
      const dayCard = e.target.closest('.plan-editor-day-card');
      if (!dayCard) return;
      const dayNum = parseInt(dayCard.dataset.day, 10);
      const day = editorWorkingRoadmap.days.find(d => (d.dayNumber || d.sequenceIndex) === dayNum);
      if (!day) return;

      pushEditorUndoSnapshot();

      if (e.target.classList.contains('editor-day-type-select')) {
        const type = e.target.value;
        day.dayType = type;
        day.isBufferDay = (type === 'buffer');
        editorIsDirty = true;
        renderRoadmapPlanEditor(editorWorkingRoadmap, userStates);
        return;
      }

      if (e.target.classList.contains('editor-stream-a-topic')) {
        const taskA = (day.tasks || []).find(t => t.stream === 'current_learning');
        if (taskA) taskA.topicId = e.target.value;
        day.topic = e.target.value;
        editorIsDirty = true;
      } else if (e.target.classList.contains('editor-stream-a-subtopic')) {
        const taskA = (day.tasks || []).find(t => t.stream === 'current_learning');
        if (taskA) taskA.subtopicId = e.target.value;
        day.subtopic = e.target.value;
        editorIsDirty = true;
      } else if (e.target.classList.contains('editor-stream-b-topic')) {
        const taskB = (day.tasks || []).find(t => t.stream === 'foundation_revision');
        if (taskB) taskB.topicId = e.target.value;
        editorIsDirty = true;
      } else if (e.target.classList.contains('editor-stream-b-subtopic')) {
        const taskB = (day.tasks || []).find(t => t.stream === 'foundation_revision');
        if (taskB) taskB.subtopicId = e.target.value;
        editorIsDirty = true;
      } else if (e.target.classList.contains('editor-buffer-reason-input')) {
        day.bufferReason = e.target.value;
        editorIsDirty = true;
      }

      if (editorIsDirty) {
        const dirtyBadge = document.getElementById('roadmap-editor-dirty-badge');
        if (dirtyBadge) dirtyBadge.classList.remove('clean');
      }
    });

    editorDaysContainer?.addEventListener('click', (e) => {
      if (!editorWorkingRoadmap) return;

      // Remove problem chip
      const removeProbBtn = e.target.closest('.btn-remove-prob');
      if (removeProbBtn) {
        const dayNum = parseInt(removeProbBtn.dataset.day, 10);
        const stream = removeProbBtn.dataset.stream;
        const pid = removeProbBtn.dataset.pid;
        const day = editorWorkingRoadmap.days.find(d => (d.dayNumber || d.sequenceIndex) === dayNum);
        if (day) {
          pushEditorUndoSnapshot();
          const streamName = stream === 'a' ? 'current_learning' : 'foundation_revision';
          const task = (day.tasks || []).find(t => t.stream === streamName);
          if (task && Array.isArray(task.problemIds)) {
            task.problemIds = task.problemIds.filter(id => id !== pid);
            editorIsDirty = true;
            renderRoadmapPlanEditor(editorWorkingRoadmap, userStates);
          }
        }
        return;
      }

      // Shift day up/down
      const shiftBtn = e.target.closest('.btn-editor-shift-day');
      if (shiftBtn) {
        const dayNum = parseInt(shiftBtn.dataset.day, 10);
        const dir = shiftBtn.dataset.dir;
        const idx = editorWorkingRoadmap.days.findIndex(d => (d.dayNumber || d.sequenceIndex) === dayNum);
        if (idx !== -1) {
          const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
          if (targetIdx >= 0 && targetIdx < editorWorkingRoadmap.days.length) {
            pushEditorUndoSnapshot();
            const temp = editorWorkingRoadmap.days[idx];
            editorWorkingRoadmap.days[idx] = editorWorkingRoadmap.days[targetIdx];
            editorWorkingRoadmap.days[targetIdx] = temp;
            editorWorkingRoadmap.days.forEach((d, i) => {
              d.sequenceIndex = i + 1;
              d.dayNumber = i + 1;
              d.planDayId = 'day_' + (i + 1);
            });
            editorIsDirty = true;
            renderRoadmapPlanEditor(editorWorkingRoadmap, userStates);
          }
        }
      }
    });

    // 9. Roadmap Settings Tab Listeners
    document.getElementById('btn-save-roadmap-settings')?.addEventListener('click', () => {
      const selectedId = RoadmapEngine.getSelectedRoadmapId ? RoadmapEngine.getSelectedRoadmapId() : 'dual_stream_120';
      const roadmap = RoadmapEngine.getRoadmap(selectedId, userStates);
      if (roadmap && roadmap.settings) {
        const dailyMins = parseInt(document.getElementById('settings-daily-minutes')?.value || '120', 10);
        const weeklyDays = parseInt(document.getElementById('settings-weekly-days')?.value || '5', 10);
        roadmap.settings.dailyMinutes = dailyMins;
        roadmap.settings.weeklyStudyDays = weeklyDays;
        RoadmapEngine.saveRoadmap(selectedId, roadmap);
        alert('Settings saved successfully!');
      }
    });

    document.getElementById('btn-toggle-archive-roadmap')?.addEventListener('click', () => {
      const selectedId = RoadmapEngine.getSelectedRoadmapId ? RoadmapEngine.getSelectedRoadmapId() : 'dual_stream_120';
      const catalog = RoadmapEngine.getRoadmapCatalog ? RoadmapEngine.getRoadmapCatalog(allProblems, userStates) : [];
      const item = catalog.find(c => c.id === selectedId);
      if (!item) return;

      if (item.isArchived) {
        RoadmapEngine.unarchiveRoadmap(selectedId);
        alert('Roadmap "' + item.title + '" unarchived.');
      } else {
        if (item.isActive) {
          alert('Cannot archive the currently active learning roadmap. Set another roadmap as active first.');
          return;
        }
        if (confirm('Archive "' + item.title + '"? It will be hidden from the active list.')) {
          RoadmapEngine.archiveRoadmap(selectedId);
        }
      }
      currentRoadmapSubview = 'library';
      window.location.hash = '#/roadmaps';
      renderRoadmapsLibrary();
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
      } catch (_) { }
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

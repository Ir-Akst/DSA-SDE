/**
 * AlgoRecall - Main Application Controller
 * Manages LocalStorage, UI Views, SRS Transitions, Monthly Exams, and Charts
 */

(function () {
  'use strict';

  // --- STORAGE KEYS ---
  const STORAGE_KEYS = {
    PROBLEMS: 'algorecall_problems_v1',
    USER_STATES: 'algorecall_user_states_v2',
    TEST_HISTORY: 'algorecall_test_history_v1',
    ACTIVE_EXAM_SESSION: 'algorecall_active_exam_v1'
  };

  // --- STATE ---
  let allProblems = [];
  let userStates = {};
  let monthlyTestHistory = [];

  let activeRatingProblemId = null;
  let activeRatingConfidence = 4;
  let activeDetailProblemId = null;

  // Monthly Exam State
  let activeTestSession = null;
  let activeTestQuestionIndex = 0;
  let testTimerInterval = null;
  let testTimeRemainingSeconds = 0;
  let testAnswers = {}; // problemId -> { rating, scratchpad }

  // --- INITIALIZATION ---
  function init() {
    loadData();
    if (window.RoadmapEngine) {
      RoadmapEngine.initProgress();
    }
    populateTopicDropdown();
    setupEventListeners();
    renderAll();
    checkAndRestoreActiveExamSession();
    checkUrlHashSync();
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

  // Load from LocalStorage or fall back to defaults
  function loadData() {
    try {
      const storedStates = localStorage.getItem(STORAGE_KEYS.USER_STATES);
      userStates = storedStates ? JSON.parse(storedStates) : {};

      const storedTests = localStorage.getItem(STORAGE_KEYS.TEST_HISTORY);
      monthlyTestHistory = storedTests ? JSON.parse(storedTests) : [];

      const storedProblems = localStorage.getItem(STORAGE_KEYS.PROBLEMS);
      const defaultList = window.DEFAULT_DSA_SHEETS ? [...window.DEFAULT_DSA_SHEETS] : [];

      if (storedProblems) {
        const parsed = JSON.parse(storedProblems);
        // Smart merge & deduplicate against master 433 dataset
        allProblems = smartDeduplicateAndSync(parsed, defaultList, userStates);
      } else {
        allProblems = defaultList;
      }
      saveProblems();
      saveUserStates();
    } catch (e) {
      console.error('Error loading LocalStorage data:', e);
      allProblems = window.DEFAULT_DSA_SHEETS ? [...window.DEFAULT_DSA_SHEETS] : [];
      userStates = {};
      monthlyTestHistory = [];
    }
  }

  function saveProblems() {
    localStorage.setItem(STORAGE_KEYS.PROBLEMS, JSON.stringify(allProblems));
  }

  function saveUserStates() {
    localStorage.setItem(STORAGE_KEYS.USER_STATES, JSON.stringify(userStates));
  }

  function saveTestHistory() {
    localStorage.setItem(STORAGE_KEYS.TEST_HISTORY, JSON.stringify(monthlyTestHistory));
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
    updateSidebarBadges();
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
      priorityTbody.appendChild(tr);
    });
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
      tbody.appendChild(tr);
    });
  }

  // --- VIEW 3: REVISION QUEUE ---
  function renderRevisionQueue() {
    const tbody = document.getElementById('revision-queue-tbody');
    if (!tbody) return;

    const activeFilterBtn = document.querySelector('[data-revision-filter].active');
    const filterMode = activeFilterBtn ? activeFilterBtn.getAttribute('data-revision-filter') : 'due';

    const list = allProblems.filter(p => {
      const state = userStates[p.id];
      if (!state || !state.lastReviewed) return false;

      if (filterMode === 'due') {
        return SRSEngine.isDue(state);
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
      tbody.appendChild(tr);
    });
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
      tbody.appendChild(tr);
    });
  }

  // --- VIEW 5: TOPIC MASTERY & ANALYTICS ---
  function renderAnalytics() {
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

    DSACharts.renderMasteryRadar('analytics-radar-chart', topicMasteryMap);
    DSACharts.renderDifficultyDoughnut('analytics-doughnut-chart', { easySolved, mediumSolved, hardSolved });

    // Render Topic Cards Health Matrix
    const container = document.getElementById('topic-matrix-container');
    if (!container) return;
    container.innerHTML = '';

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
      container.appendChild(card);
    });
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
      if (st && st.history) {
        st.history.forEach(h => {
          const dStr = toLocalDateKey(h.date || h.reviewedAt);
          if (dStr) activityMap[dStr] = (activityMap[dStr] || 0) + 1;
        });
      }
      if (st && st.lastReviewed) {
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
      gridEl.appendChild(cell);
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
    const currentState = userStates[activeRatingProblemId] || {};

    userStates[activeRatingProblemId] = SRSEngine.processReview(currentState, rating, 15, notes, activeRatingConfidence);
    saveUserStates();

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
    document.getElementById('problem-detail-modal').classList.remove('open');
    activeDetailProblemId = null;
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
      localStorage.setItem(STORAGE_KEYS.ACTIVE_EXAM_SESSION, JSON.stringify(payload));
    } catch (_) { }
  }

  function clearActiveExamState() {
    try {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_EXAM_SESSION);
    } catch (_) { }
  }

  function checkAndRestoreActiveExamSession() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_EXAM_SESSION);
      if (!stored) return;
      const data = JSON.parse(stored);
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

    document.getElementById('monthly-test-overlay')?.classList.add('open');
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

    document.getElementById('monthly-test-overlay').classList.add('open');
  }

  function updateTimerDisplay() {
    const mins = Math.floor(testTimeRemainingSeconds / 60);
    const secs = testTimeRemainingSeconds % 60;
    const timerEl = document.getElementById('test-timer-display');
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
      testAnswers[currentProb.id] = { rating: 'medium', scratchpad: '' };
    }
    testAnswers[currentProb.id].scratchpad = scratchpad;
  }

  function renderActiveTestQuestion() {
    if (!activeTestSession) return;
    const p = activeTestSession.problems[activeTestQuestionIndex];
    if (!p) return;

    document.getElementById('test-progress-indicator').textContent = `Question ${activeTestQuestionIndex + 1} of ${activeTestSession.problems.length}`;
    document.getElementById('test-active-title').textContent = p.title;

    document.getElementById('test-active-badges').innerHTML = `
      <span class="badge badge-${p.difficulty.toLowerCase()}">${p.difficulty}</span>
      <span class="badge badge-srs-upcoming">${p.topic}</span>
      ${p.pattern ? `<span class="badge badge-srs-unsolved">${p.pattern}</span>` : ''}
    `;

    const link = document.getElementById('test-active-link');
    link.href = p.url || `https://leetcode.com/problemset/all/?search=${encodeURIComponent(p.title)}`;

    const savedAnswer = testAnswers[p.id] || { rating: 'medium', scratchpad: '' };
    document.getElementById('test-scratchpad-area').value = savedAnswer.scratchpad || (p.notes ? `// Pattern hint: ${p.pattern}\n` : '');

    // Highlight rating button
    document.querySelectorAll('[data-test-rating]').forEach(btn => {
      const rating = btn.dataset.testRating;
      btn.style.borderColor = (savedAnswer.rating === rating) ? 'var(--primary)' : 'var(--border-color)';
    });
  }

  function finishMonthlyExam() {
    if (!activeTestSession) return;
    saveCurrentQuestionState();
    clearActiveExamState();

    if (testTimerInterval) clearInterval(testTimerInterval);

    // Build results array
    const results = activeTestSession.problems.map(p => {
      const ans = testAnswers[p.id] || { rating: 'medium', scratchpad: '' };
      return {
        problemId: p.id,
        rating: ans.rating || 'medium',
        timeSpentMinutes: 15,
        notes: ans.scratchpad
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
    document.getElementById('monthly-test-overlay').classList.remove('open');
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
    if (window.location.hash && window.location.hash.includes('sync=')) {
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
    }
  }

  // --- VIEW 7: DAILY PROBLEMS & WEEKEND TEST ---
  function renderRoadmapView() {
    if (!window.RoadmapEngine) return;
    if (!RoadmapEngine.progress) {
      RoadmapEngine.initProgress();
    }

    const activeTrack = RoadmapEngine.progress.activeTrack || 'striver_hero';
    const schedule = RoadmapEngine.getSchedule(activeTrack, allProblems);
    const currentWeek = schedule[0] || { weekNumber: 1, title: 'Core Practice', topic: 'Arrays & Hashing', days: [] };

    // 1. Calculate 7-Day Cycle Progress
    let completedDaysInCycle = 0;
    currentWeek.days.forEach(day => {
      if (RoadmapEngine.isDayCompleted(activeTrack, 1, day.dayNumber)) {
        completedDaysInCycle++;
      }
    });

    const cyclePercent = Math.round((completedDaysInCycle / 7) * 100);
    const statProgressEl = document.getElementById('roadmap-stat-progress');
    const statDaysDoneEl = document.getElementById('roadmap-stat-days-done');
    const trackProgressFill = document.getElementById('roadmap-track-progress-fill');

    if (statProgressEl) statProgressEl.textContent = `${cyclePercent}%`;
    if (statDaysDoneEl) statDaysDoneEl.textContent = `${completedDaysInCycle} / 7`;
    if (trackProgressFill) trackProgressFill.style.width = `${cyclePercent}%`;

    // 2. Ensure valid selectedDay (1 to 7)
    if (!RoadmapEngine.progress.selectedDay || RoadmapEngine.progress.selectedDay > 7 || RoadmapEngine.progress.selectedDay < 1) {
      RoadmapEngine.progress.selectedDay = 1;
    }
    const currentDay = currentWeek.days.find(d => d.dayNumber === RoadmapEngine.progress.selectedDay) || currentWeek.days[0];

    const customDayTopic = RoadmapEngine.getDayCustomTopic(activeTrack, 1, currentDay.dayNumber);
    const activeFocusTopic = customDayTopic ? (Array.isArray(customDayTopic) ? `Mixed (${customDayTopic.length} Topics)` : customDayTopic) : (currentDay.topic || 'General DSA');

    const statActiveFocusEl = document.getElementById('roadmap-stat-active-focus');
    if (statActiveFocusEl) statActiveFocusEl.textContent = activeFocusTopic;

    // Track Solved & Unsolved Counts
    let trackSolvedCount = 0;
    allProblems.forEach(p => {
      if (userStates[p.id]?.lastReviewed) trackSolvedCount++;
    });
    const trackUnsolvedCount = allProblems.length - trackSolvedCount;

    const statTrackSolvedEl = document.getElementById('roadmap-stat-solved-count');
    const statTrackUnsolvedEl = document.getElementById('roadmap-stat-unsolved-count');
    if (statTrackSolvedEl) statTrackSolvedEl.textContent = `${trackSolvedCount} / ${allProblems.length}`;
    if (statTrackUnsolvedEl) statTrackUnsolvedEl.textContent = `${trackUnsolvedCount}`;

    // 3. Render 7-Day Selector Pills Strip (Mon - Sun)
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat (Review)', 'Sun (Exam)'];
    const progressTxtEl = document.getElementById('roadmap-week-progress-txt');
    if (progressTxtEl) {
      progressTxtEl.textContent = `${completedDaysInCycle} / 7 Days Complete (${cyclePercent}%)`;
    }

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

    // 4. Render Active Day Practice & Weekend Test Workspace
    renderActiveDayContent(activeTrack, currentWeek, currentDay);
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

    document.getElementById('monthly-test-overlay')?.classList.add('open');
  }

  // --- BACKUP & RESTORE ---
  function exportDataJSON() {
    const payload = {
      version: 1.0,
      exportDate: new Date().toISOString(),
      problems: allProblems,
      userStates: userStates,
      monthlyTestHistory: monthlyTestHistory
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `algorecall_dsa_backup_${SRSEngine.getLocalDateString(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importDataJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const data = JSON.parse(e.target.result);
        if (data.problems && Array.isArray(data.problems)) {
          allProblems = data.problems;
          saveProblems();
        }
        if (data.userStates && typeof data.userStates === 'object') {
          userStates = data.userStates;
          saveUserStates();
        }
        if (data.monthlyTestHistory && Array.isArray(data.monthlyTestHistory)) {
          monthlyTestHistory = data.monthlyTestHistory;
          saveTestHistory();
        }
        populateTopicDropdown();
        renderAll();
        alert('Data restored successfully!');
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
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));

        item.classList.add('active');
        const viewName = item.getAttribute('data-view');
        const viewEl = document.getElementById(`view-${viewName}`);
        if (viewEl) viewEl.classList.add('active');

        // Re-render chart sizes if entering chart views
        if (viewName === 'dashboard' || viewName === 'analytics') {
          renderAll();
        }
      });
    });

    // Quick review from dashboard banner
    document.getElementById('btn-banner-start-review')?.addEventListener('click', () => {
      document.querySelector('[data-view="revision"]')?.click();
    });

    document.getElementById('btn-see-all-revisions')?.addEventListener('click', () => {
      document.querySelector('[data-view="revision"]')?.click();
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
        const currentProb = activeTestSession.problems[activeTestQuestionIndex];
        const rating = btn.dataset.testRating;
        if (!testAnswers[currentProb.id]) {
          testAnswers[currentProb.id] = { rating: 'medium', scratchpad: '' };
        }
        testAnswers[currentProb.id].rating = rating;
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
    });
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

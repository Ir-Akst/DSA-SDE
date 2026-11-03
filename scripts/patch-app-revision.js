const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, '..', 'js', 'app.js');
let appJs = fs.readFileSync(appJsPath, 'utf8');

// Replacement 1: renderRevisionQueue block
const startMarker = '  function renderRevisionQueue() {';
const endMarker = '  // --- VIEW 4: MONTHLY ASSESSMENT & MOCK EXAMS ---';

const sIdx = appJs.indexOf(startMarker);
const eIdx = appJs.indexOf(endMarker);

if (sIdx === -1 || eIdx === -1) {
  console.error('Marker 1 not found!');
  process.exit(1);
}

const newRenderBlock = `  // --- REVISION CENTER STATE & ACTIVE RECALL SESSION CONTROLLER ---
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
        '<td colspan=\"7\" style=\"text-align:center; padding:36px 20px; color:var(--text-dim);\">' +
        '<div style=\"font-size:16px; margin-bottom:6px; color:var(--text-main);\"><i class=\"fa-solid fa-check-circle\" style=\"color:var(--success); margin-right:8px;\"></i>No revision items found</div>' +
        '<div style=\"font-size:12px;\">No problems currently match filter criteria (\'' + currentRevisionFilter + '\').</div>' +
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
        confStars = '<span class=\"conf-badge conf-' + conf + '\" title=\"' + SRSEngine.getConfidenceMeta(conf).label + '\">★ ' + conf + '/5</span>';
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
      tr.innerHTML = '<td><span class=\"badge badge-srs-' + dueInfo.code + '\">' + dueInfo.label + '</span></td>' +
        '<td>' +
        '<a href=\"' + (p.url || '#') + '\" target=\"_blank\" class=\"problem-title\" rel=\"noopener noreferrer\">' + escapeHtml(p.title) + '</a>' +
        '<div style=\"font-size:11px; color:var(--text-dim); margin-top:2px;\">' + escapeHtml(p.pattern || p.subtopic || '') + '</div>' +
        '</td>' +
        '<td><span style=\"font-size:12.5px;\">' + escapeHtml(p.topic || 'General') + '</span></td>' +
        '<td><span class=\"badge badge-' + (p.difficulty || 'medium').toLowerCase() + '\">' + (p.difficulty || 'Medium') + '</span></td>' +
        '<td>' +
        '<div style=\"display:flex; flex-direction:column; gap:2px;\">' +
        '<div>' + confStars + '</div>' +
        '<div style=\"font-size:11px; color:var(--text-dim);\">Stage ' + (state.stage || 1) + ' &bull; ' + (state.lastRating || 'none') + '</div>' +
        '</div>' +
        '</td>' +
        '<td><span style=\"' + dateBadgeStyle + '\">' + (state.nextReviewDate || 'N/A') + '</span></td>' +
        '<td style=\"text-align:right;\">' +
        '<div style=\"display:inline-flex; align-items:center; gap:6px;\">' +
        '<button type=\"button\" class=\"btn btn-secondary btn-sm btn-rev-bookmark\" data-problem-id=\"' + p.id + '\" title=\"' + (isBookmarked ? 'Remove Bookmark' : 'Bookmark Problem') + '\" style=\"padding:4px 8px; color:' + (isBookmarked ? 'var(--warning)' : 'var(--text-dim)') + ';\">' +
        '<i class=\"fa-' + (isBookmarked ? 'solid' : 'regular') + ' fa-bookmark\"></i>' +
        '</button>' +
        '<button type=\"button\" class=\"btn btn-primary btn-sm btn-rev-start-one\" data-problem-id=\"' + p.id + '\" title=\"Launch Active Recall Session\">' +
        '<i class=\"fa-solid fa-play\"></i> Review' +
        '</button>' +
        '<a href=\"' + (p.url || '#') + '\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"btn btn-secondary btn-sm\" title=\"Open verified problem page\" style=\"padding:4px 8px;\">' +
        '<i class=\"fa-solid fa-arrow-up-right-from-square\"></i>' +
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

`;

appJs = appJs.slice(0, sIdx) + newRenderBlock + appJs.slice(eIdx);

// Replacement 2: Listener wiring
const listenerStartMarker = '    // Revision Queue Sub-tabs';
const listenerEndMarker = '    // Checkbox toggle in problems table';

const lsIdx = appJs.indexOf(listenerStartMarker);
const leIdx = appJs.indexOf(listenerEndMarker);

if (lsIdx === -1 || leIdx === -1) {
  console.error('Marker 2 not found!');
  process.exit(1);
}

const newListenerBlock = `    // Revision Queue Controls & Listeners
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

`;

appJs = appJs.slice(0, lsIdx) + newListenerBlock + appJs.slice(leIdx);

fs.writeFileSync(appJsPath, appJs, 'utf8');
console.log('Successfully patched js/app.js!');

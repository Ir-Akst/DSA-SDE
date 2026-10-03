/**
 * Charting & Visual Analytics Module using Chart.js
 */

window.DSACharts = {
  radarChartInstance: null,
  topicBarChartInstance: null,
  difficultyDoughnutInstance: null,

  // Theme Colors
  colors: {
    emerald: '#10b981',
    emeraldGlow: 'rgba(16, 185, 129, 0.25)',
    blue: '#3b82f6',
    blueGlow: 'rgba(59, 130, 246, 0.25)',
    violet: '#8b5cf6',
    violetGlow: 'rgba(139, 92, 246, 0.25)',
    amber: '#f59e0b',
    amberGlow: 'rgba(245, 158, 11, 0.25)',
    rose: '#f43f5e',
    roseGlow: 'rgba(244, 63, 94, 0.25)',
    cyan: '#06b6d4',
    textMuted: '#94a3b8',
    gridLines: 'rgba(255, 255, 255, 0.08)'
  },

  /**
   * Render or Update the Topic Mastery Radar (Spider) Chart
   */
  renderMasteryRadar(canvasId, topicMasteryMap) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof Chart === 'undefined') return;

    const topics = Object.keys(topicMasteryMap);
    const labels = topics.map(t => t.length > 14 ? t.substring(0, 12) + '...' : t);
    const scores = topics.map(t => topicMasteryMap[t].score || 0);

    if (this.radarChartInstance) {
      this.radarChartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    this.radarChartInstance = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Mastery Level (%)',
          data: scores,
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          borderColor: '#10b981',
          borderWidth: 2.5,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#ffffff',
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: '#10b981',
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            angleLines: { color: this.colors.gridLines },
            grid: { color: this.colors.gridLines },
            pointLabels: {
              color: '#e2e8f0',
              font: { size: 11, family: "'Inter', sans-serif", weight: '500' }
            },
            ticks: {
              display: false,
              stepSize: 20,
              backdropColor: 'transparent'
            },
            suggestedMin: 0,
            suggestedMax: 100
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: '#f8fafc',
            bodyColor: '#38bdf8',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: (context) => ` Mastery: ${context.raw}%`
            }
          }
        }
      }
    });
  },

  /**
   * Render or Update Topic Progress & Health Stacked Bar Chart
   */
  renderTopicBarChart(canvasId, topicMasteryMap) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof Chart === 'undefined') return;

    const topics = Object.keys(topicMasteryMap);
    const labels = topics.map(t => t.length > 13 ? t.substring(0, 11) + '..' : t);
    const masteredData = topics.map(t => topicMasteryMap[t].mastered || 0);
    const inProgressData = topics.map(t => Math.max(0, (topicMasteryMap[t].solved || 0) - (topicMasteryMap[t].mastered || 0)));
    const unstartedData = topics.map(t => Math.max(0, topicMasteryMap[t].total - (topicMasteryMap[t].solved || 0)));

    if (this.topicBarChartInstance) {
      this.topicBarChartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    this.topicBarChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Mastered 🏆',
            data: masteredData,
            backgroundColor: '#10b981',
            borderRadius: 4
          },
          {
            label: 'In Progress 🔄',
            data: inProgressData,
            backgroundColor: '#3b82f6',
            borderRadius: 4
          },
          {
            label: 'Unsolved ⚪',
            data: unstartedData,
            backgroundColor: 'rgba(148, 163, 184, 0.25)',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: {
              color: '#94a3b8',
              font: { size: 10, family: "'Inter', sans-serif" }
            }
          },
          y: {
            stacked: true,
            grid: { color: this.colors.gridLines },
            ticks: {
              color: '#94a3b8',
              stepSize: 2
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: '#cbd5e1',
              boxWidth: 12,
              font: { size: 11, family: "'Inter', sans-serif" }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              title: (items) => topics[items[0].dataIndex] || items[0].label
            }
          }
        }
      }
    });
  },

  /**
   * Render Difficulty Distribution Doughnut
   */
  renderDifficultyDoughnut(canvasId, stats) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof Chart === 'undefined') return;

    if (this.difficultyDoughnutInstance) {
      this.difficultyDoughnutInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    this.difficultyDoughnutInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Easy', 'Medium', 'Hard'],
        datasets: [{
          data: [stats.easySolved || 0, stats.mediumSolved || 0, stats.hardSolved || 0],
          backgroundColor: ['#10b981', '#f59e0b', '#f43f5e'],
          borderColor: '#0f172a',
          borderWidth: 3,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#cbd5e1',
              boxWidth: 12,
              padding: 14,
              font: { size: 11, family: "'Inter', sans-serif" }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1
          }
        }
      }
    });
  }
};

# 🧠 AlgoRecall - Spaced Repetition & DSA Interview Hub

A sleek, modern, serverless web application designed to organize your Data Structures & Algorithms preparation, automate spaced repetition revision based on difficulty ratings, run monthly retention exams, test rapid algorithmic intuition with flashcards, and track your daily preparation streaks.

---

## 📁 Clean Codebase & Directory Structure

```
dsa/
├── index.html                     # Main Web Application & Single-Page Router
├── README.md                      # Architecture & Deployment Documentation
├── css/
│   └── styles.css                 # Dark Glassmorphism Design System & Components
├── js/
│   ├── app.js                     # Application State, Router, Heatmap & Flashcards
│   ├── charts.js                  # Chart.js Visualizations (Radar, Progress, Doughnut)
│   ├── srs-engine.js              # Mathematical Spaced Repetition Engine
│   ├── monthly-test.js            # Monthly Assessment Generator & Grading Sandbox
│   └── data/
│       └── default-sheets.js      # 479 Curated Master DSA Problems
└── scripts/
    ├── build_catalog.py           # Catalog Compiler & ID Normalizer
    └── audit_topics.py            # Topic Balance & Quality Auditor
```

---

## 🌟 Key Features

### 1. 🔄 Scientific Spaced Repetition Engine (SRS)
Whenever you solve or review a problem, rate its recall difficulty to dynamically schedule your next revision:
- **🟢 Simple / Easy**: 7 days ➔ 21 days ➔ 60 days ➔ 120 days ➔ **🏆 Mastered**
- **🟡 Medium / Moderate**: 3 days ➔ 7 days ➔ 21 days ➔ 45 days ➔ **🏆 Mastered**
- **🔴 Hard / Challenging**: 1 day (tomorrow) ➔ 3 days ➔ 7 days ➔ 18 days ➔ 40 days ➔ **🏆 Mastered**
- **⚠️ Failed / Blank**: Resets to Stage 1 (Review within 24 hours)

### 2. 🏢 Target Company Interview Filters
- Verified company tags (**Google, Amazon, Microsoft, Meta, Apple, Bloomberg, Goldman Sachs, Uber, Adobe, Flipkart, TCS/Infosys**).
- 1-Click filter to isolate high-frequency problems when preparing for a specific company interview.

### 3. 🔥 Daily Activity Heatmap & Streak Tracker
- **52-Week × 7-Day Interactive Activity Grid** on the Dashboard.
- Tracks active daily streaks, longest streak records, and review density.

### 4. 🃏 Flashcard Intuition Quiz Mode
- **Speed Revision**: Drill 20–30 problems in 10 minutes without writing full code every time.
- **3D Flip Card**: Front shows problem prompt, difficulty, and company tags; back reveals optimal time/space complexity, editorial approach, and key edge cases.
- **Direct Rating**: Rate recall ease directly on the card to update Spaced Repetition intervals on the fly.

### 5. 🎯 Monthly Revision & Mock Assessment Sandbox
- **Adaptive Topic Sampling**: 60% retention check on solved questions + 40% generalization on unseen patterns.
- **Exam Mode**: Built-in 60-minute countdown timer, per-question scratchpad, and live problem switcher.
- **Grading & Feedback**: Generates an instant grade (A+, A, B, C) and automatically updates SRS intervals for tested problems.

### 6. 📊 Topic Mastery & Visual Analytics
- **Multi-Topic Radar Chart**: Dynamic spider chart showing your retention depth across all 16 core DSA topics.
- **Topic Health & Decay Matrix**: Visual indicator of topic strength vs. overdue decay.
- **Difficulty Doughnut**: Real-time breakdown of Easy / Medium / Hard problems mastered.

### 7. 📚 479 Curated Problems across Top Sheets
- 🚀 **Striver's A2Z DSA Sheet** (Full Step 1 to Step 18 coverage)
- ⚡ **NeetCode 150** (Pattern-based interview preparation)
- 💼 **Striver's SDE Sheet** (Top product-company essentials)
- 💎 **Blind 75** (High-yield core interview problems)

### 8. 💾 Zero-Backend & 100% Client-Side
- Runs entirely on browser `localStorage` for privacy and free hosting.
- **1-Click JSON Backup & Restore**: Download/upload your entire preparation history.

---

## 🚀 How to Host on GitHub Pages (Step-by-Step)

### Step 1: Initialize Git and Commit
```bash
git init
git add .
git commit -m "feat: AlgoRecall DSA Spaced Repetition & Interview Hub"
```

### Step 2: Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/dsa-mastery.git
git branch -M main
git push -u origin main
```

### Step 3: Enable GitHub Pages
1. Go to your repository on GitHub.
2. Click **Settings** ➔ **Pages** (in the left sidebar).
3. Under **Build and deployment** ➔ **Branch**, select `main` and `/ (root)`, then click **Save**.
4. In ~60 seconds, your site will be live at:
   `https://YOUR_USERNAME.github.io/dsa-mastery/`

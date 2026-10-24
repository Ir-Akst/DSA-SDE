/**
 * AlgoRecall 2.0 - Progressive AI Hint & Feedback Engine
 * Implements 5-tier progressive scaffolding with provider abstraction:
 * 1. Offline Heuristic Engine (deterministic, always functional without API keys)
 * 2. OpenAI / OpenRouter compatible API
 * 3. Google Gemini API
 * 4. Local server proxy (/api/ai-hint)
 */

(function () {
  'use strict';

  const _SRSEngine = (typeof window !== 'undefined' && window.SRSEngine) || (typeof require !== 'undefined' ? require('./srs-engine') : null);
  const _DSA_PATTERNS = (typeof window !== 'undefined' && window.DSA_PATTERNS) || (typeof require !== 'undefined' ? require('./data/patterns-data') : []);

  const HINT_LEVELS = [
    { level: 1, title: 'Key Observation', description: 'Core intuition & problem constraints observation without giving away the approach.' },
    { level: 2, title: 'Algorithmic Pattern', description: 'Identifies the canonical pattern and why it applies to this input structure.' },
    { level: 3, title: 'State & Invariant', description: 'Explains the data structure choices, pointer invariants, or recurrence state.' },
    { level: 4, title: 'Pseudocode & Strategy', description: 'Step-by-step logic and pseudo-code without full language implementation.' },
    { level: 5, title: 'Complete Solution & Code', description: 'Full editorial approach and optimal solution code (explicit opt-in).' }
  ];

  const AIEngine = {
    HINT_LEVELS,

    /**
     * Generate progressive hint for a problem at a specific level
     * @param {Object} problem - Problem object from catalog
     * @param {number} level - 1 to 5
     * @param {Object} options - { currentCode: '', currentApproach: '' }
     */
    async getProgressiveHint(problem, level = 1, options = {}) {
      if (!problem) return { success: false, error: 'No problem specified' };

      const settings = window.StorageEngine ? window.StorageEngine.getSettings() : {};
      const provider = settings.aiProvider || 'offline';

      // Record hint usage in user session
      if (options.onHintUsed) {
        options.onHintUsed(level);
      }

      if (provider !== 'offline' && (settings.aiApiKey || provider === 'server_proxy')) {
        try {
          return await this.fetchExternalHint(problem, level, settings, options);
        } catch (err) {
          console.warn('External AI provider failed, falling back to built-in heuristic:', err);
          return this.generateHeuristicHint(problem, level, options);
        }
      }

      // Default: High-quality built-in heuristic provider (Zero external calls)
      return this.generateHeuristicHint(problem, level, options);
    },

    /**
     * Built-in Offline Heuristic Scaffolding Generator
     */
    generateHeuristicHint(problem, level, options = {}) {
      const topic = _SRSEngine ? _SRSEngine.canonicalizeTopic(problem.topic) : problem.topic;
      const pattern = problem.pattern || 'General Problem-Solving';
      const diff = problem.difficulty || 'Medium';

      // Find matching pattern in DSA_PATTERNS handbook if available
      let patternData = null;
      const patternsList = (typeof window !== 'undefined' && window.DSA_PATTERNS) || _DSA_PATTERNS || [];
      if (Array.isArray(patternsList)) {
        patternData = patternsList.find(p =>
          (p.title && p.title.toLowerCase().includes(pattern.toLowerCase())) ||
          (p.canonicalProblems && p.canonicalProblems.some(cp => cp.toLowerCase().includes(problem.title.toLowerCase())))
        );
      }

      let content = '';

      switch (level) {
        case 1:
          content = `💡 **Key Observation for "${problem.title}"**:\n\n` +
            `- **Topic**: ${topic} | **Difficulty**: ${diff}\n` +
            `- Pay attention to the input boundaries and constraints: Can elements be negative or duplicate? Does ordering matter?\n` +
            `- Ask yourself: If you were doing this manually on paper for a small array of 4-5 elements, what is the single piece of information you need to remember as you scan?`;
          break;

        case 2:
          content = `🧩 **Pattern Hint (Level 2)**:\n\n` +
            `- **Optimal Pattern**: **${pattern}**\n` +
            `- **Why this pattern works**: ${patternData ? patternData.summary : `Problems in "${topic}" with these properties benefit from ${pattern} to reduce brute-force time.`}\n` +
            `- **Triggers to spot**: ${patternData && patternData.whenToUse ? patternData.whenToUse.slice(0, 2).map(u => `\n  • ${u}`).join('') : 'Look for contiguous segments, monotonic ordering, or repeated subproblems.'}`;
          break;

        case 3:
          content = `📐 **State & Data Structure Invariant (Level 3)**:\n\n` +
            `- **Target Complexities**: Optimal Time is **${problem.timeComplexity || 'O(N)'}**, Optimal Space is **${problem.spaceComplexity || 'O(1)'}**.\n` +
            `- **Core Invariant**: What condition must stay true throughout your loop iteration? If expanding a window or advancing pointers, what condition dictates when you must adjust or shrink?\n` +
            `- **Recommended Data Structure**: ${topic.includes('Tree') ? 'Queue (BFS) or Call Stack (DFS)' : (topic.includes('Heap') ? 'Min-Heap / Max-Heap' : (topic.includes('Stack') ? 'Monotonic Stack' : 'Hash Map / Two Pointers'))}.`;
          break;

        case 4:
          content = `📝 **Pseudocode Strategy (Level 4)**:\n\n` +
            `\`\`\`text\n` +
            `1. Initialize data structures and edge case guards (empty input, len < 2).\n` +
            `2. Iterate through input elements:\n` +
            `   a. Update running state / frequency map / pointer positions.\n` +
            `   b. While constraint is violated:\n` +
            `        - Contract left boundary or pop from stack until invariant holds.\n` +
            `   c. Record current best candidate answer.\n` +
            `3. Return the optimal computed result.\n` +
            `\`\`\`\n` +
            `*Try coding this in your editor now before opening Level 5!*`;
          break;

        case 5:
          content = `📖 **Full Editorial & Reference Solution (Level 5)**:\n\n` +
            `- **Pattern Reference**: ${patternData ? patternData.title : pattern}\n` +
            (patternData && patternData.templateCode ? `\`\`\`javascript\n${patternData.templateCode}\n\`\`\`\n` : `Refer to the canonical template in the Patterns Handbook.\n`) +
            `- **Key Edge Cases**: ${patternData && patternData.edgeCases ? patternData.edgeCases.join(', ') : 'Empty input, single element, duplicates, negative values.'}`;
          break;

        default:
          content = 'Select a hint level (1 to 5) to reveal targeted guidance.';
      }

      return {
        success: true,
        provider: 'offline_heuristic',
        level: level,
        levelTitle: HINT_LEVELS[level - 1].title,
        content: content
      };
    },

    /**
     * External AI Provider Fetcher (OpenAI / OpenRouter / Custom compatible API)
     */
    async fetchExternalHint(problem, level, settings, options) {
      const endpoint = settings.aiApiEndpoint || 'https://api.openai.com/v1/chat/completions';
      const model = settings.aiModel !== 'default' ? settings.aiModel : 'gpt-4o-mini';

      const systemPrompt = `You are an expert SDE Technical Interview Coach for DSA. 
The user is working on problem: "${problem.title}" (Difficulty: ${problem.difficulty}, Topic: ${problem.topic}, Pattern: ${problem.pattern || 'Unknown'}).
You are providing HINT LEVEL ${level} of 5.
Rules for Level ${level}:
Level 1: Key observation without giving away the pattern or approach.
Level 2: Suggest the pattern and triggers.
Level 3: Explain the data structure choice and loop invariant.
Level 4: Provide pseudocode without full code.
Level 5: Provide full solution with optimal complexity.
Be concise, clear, and encouraging. Never jump ahead to a higher hint level.`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.aiApiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Give me Hint Level ${level} for ${problem.title}.` }
          ],
          temperature: 0.3,
          max_tokens: 450
        })
      });

      if (!response.ok) {
        throw new Error(`AI API HTTP error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || 'No hint generated.';

      return {
        success: true,
        provider: settings.aiProvider,
        level: level,
        levelTitle: HINT_LEVELS[level - 1].title,
        content: text
      };
    },

    /**
     * Generate Edge-Case Checklist for problem
     */
    generateEdgeCases(problem) {
      const topic = _SRSEngine ? _SRSEngine.canonicalizeTopic(problem.topic) : (problem.topic || 'General');
      const commonCases = [
        'Empty input / Array length 0',
        'Single element array / String length 1',
        'All identical elements (e.g. [2, 2, 2, 2])',
        'Strictly increasing or strictly decreasing sorted inputs',
        'Negative numbers and Zero values',
        'Maximum integer bounds (Integer Overflow / 32-bit limits)'
      ];

      if (topic.includes('Tree')) {
        commonCases.push('Null root node', 'Skewed binary tree (linked list structure)', 'Balanced complete tree');
      } else if (topic.includes('Linked List')) {
        commonCases.push('Null head', 'Single node list', 'Cycle with 2 nodes', 'Cycle at head vs cycle in middle');
      } else if (topic.includes('Graph')) {
        commonCases.push('Disconnected components', 'Self-loops and multiple edges', 'Directed cycle (deadlock)');
      }

      return commonCases;
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIEngine;
  }
  if (typeof window !== 'undefined') {
    window.AIEngine = AIEngine;
  }
})();

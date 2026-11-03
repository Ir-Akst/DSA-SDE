/**
 * AlgoRecall 2.0 — Core Shared Utilities
 * 
 * Unified cross-module helpers for string manipulation, date parsing,
 * array calculations, and environment-safe storage access.
 */

(function () {
  'use strict';

  /**
   * Escape raw strings for safe HTML rendering to prevent XSS.
   * @param {*} str 
   * @returns {string}
   */
  function escapeHtml(str) {
    if (typeof str !== 'string') return String(str ?? '');
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Convert date or timestamp to local YYYY-MM-DD string to avoid timezone boundary drift.
   * @param {Date|string|number} dateInput 
   * @returns {string}
   */
  function toLocalDateStr(dateInput) {
    if (!dateInput) return '';
    try {
      const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
      if (isNaN(d.getTime())) return '';
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (_) {
      return '';
    }
  }

  /**
   * Calculate median of numerical array safely.
   * @param {number[]} arr 
   * @returns {number|null}
   */
  function calculateMedian(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const sorted = [...arr].filter(n => typeof n === 'number' && !isNaN(n)).sort((a, b) => a - b);
    if (sorted.length === 0) return null;
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }

  /**
   * Safely access localStorage with try/catch fallback for private browsing or headless runners.
   * @returns {Storage|null}
   */
  function getSafeLocalStorage() {
    try {
      if (typeof localStorage !== 'undefined') {
        const testKey = '__algorecall_probe__';
        localStorage.setItem(testKey, '1');
        localStorage.removeItem(testKey);
        return localStorage;
      }
    } catch (_) {}
    return null;
  }

  /**
   * Clamp a numeric value within [min, max] range.
   * @param {number} val 
   * @param {number} min 
   * @param {number} max 
   * @returns {number}
   */
  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  /**
   * Debounce function execution.
   * @param {Function} fn 
   * @param {number} delayMs 
   * @returns {Function}
   */
  function debounce(fn, delayMs = 250) {
    let timer = null;
    return function (...args) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        fn.apply(this, args);
        timer = null;
      }, delayMs);
    };
  }

  /**
   * Deep clone serializable objects.
   * @param {*} obj 
   * @returns {*}
   */
  function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch (_) {
      return { ...obj };
    }
  }

  const CoreUtils = {
    escapeHtml,
    toLocalDateStr,
    calculateMedian,
    getSafeLocalStorage,
    clamp,
    debounce,
    deepClone
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CoreUtils;
  }
  if (typeof window !== 'undefined') {
    window.CoreUtils = CoreUtils;
  }
})();


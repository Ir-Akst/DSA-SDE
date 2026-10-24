/**
 * AlgoRecall — Application Configuration Module
 * 
 * Manages public configuration settings for Supabase Authentication and environment parameters.
 * Follows the project's zero-dependency, universal module convention (Browser IIFE + CommonJS).
 * 
 * SECURITY RULES:
 * - NEVER commit real API keys, secrets, or service-role keys to version control.
 * - Only publishable / anon keys are safe for client-side inclusion.
 * - Google OAuth client secrets belong exclusively in the Supabase Dashboard, never here.
 * - Credentials must NEVER be logged or printed in errors.
 */

(function(global) {
  'use strict';

  // Allowed deployment and execution environments
  const VALID_ENVIRONMENTS = Object.freeze(['production', 'staging', 'development', 'test']);

  function normalizeUrl(url) {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    return trimmed.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  }

  function isValidHttpUrl(string) {
    if (!string || typeof string !== 'string') return false;
    try {
      const parsed = new URL(string);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch (_) {
      return false;
    }
  }

  /**
   * Deterministically resolves the current application environment.
   * Source precedence:
   * 1. Explicit sources override (if provided)
   * 2. process.env.APP_ENV (Node / container runtime)
   * 3. global.__ENV.APP_ENV (browser runtime injected by server)
   * 4. process.env.NODE_ENV / global.__ENV.NODE_ENV
   * 5. Default to 'development' only if no environment variable was defined.
   * Unknown/invalid values are preserved as-is so validation fails closed.
   * 
   * @param {Object} [sources]
   * @returns {string}
   */
  function resolveAppEnv(sources = {}) {
    const env = sources.processEnv || (typeof process !== 'undefined' && process.env ? process.env : {});
    const winEnv = sources.windowEnv || (global.__ENV || (typeof window !== 'undefined' && window.__ENV ? window.__ENV : {}));

    if (sources.explicitEnv && typeof sources.explicitEnv === 'string') {
      return sources.explicitEnv.trim();
    }
    if (env.APP_ENV && typeof env.APP_ENV === 'string' && env.APP_ENV.trim()) {
      return env.APP_ENV.trim();
    }
    if (winEnv.APP_ENV && typeof winEnv.APP_ENV === 'string' && winEnv.APP_ENV.trim()) {
      return winEnv.APP_ENV.trim();
    }

    // Secondary fallback: map NODE_ENV, preserving non-standard values so validate() rejects them
    const nodeEnv = (env.NODE_ENV && typeof env.NODE_ENV === 'string' && env.NODE_ENV.trim())
      ? env.NODE_ENV.trim()
      : (winEnv.NODE_ENV && typeof winEnv.NODE_ENV === 'string' && winEnv.NODE_ENV.trim() ? winEnv.NODE_ENV.trim() : null);

    if (nodeEnv) {
      if (nodeEnv === 'test') return 'test';
      if (nodeEnv === 'production') return 'production';
      if (nodeEnv === 'staging') return 'staging';
      if (nodeEnv === 'development') return 'development';
      return nodeEnv; // Unknown value preserved for fail-closed validation
    }

    return 'development';
  }

  /**
   * Builds the initial active configuration without hardcoded production fallbacks.
   * In unconfigured environments, credentials remain empty strings ('').
   * @returns {Object}
   */
  function buildInitialConfig() {
    const env = (typeof process !== 'undefined' && process.env) ? process.env : {};
    const winEnv = (global.__ENV || (typeof window !== 'undefined' && window.__ENV ? window.__ENV : {}));

    const resolvedEnv = resolveAppEnv({ processEnv: env, windowEnv: winEnv });

    const rawUrl = env.SUPABASE_URL || winEnv.SUPABASE_URL || '';
    const rawKey = env.SUPABASE_ANON_KEY || winEnv.SUPABASE_ANON_KEY || '';
    const rawRedirect = env.AUTH_REDIRECT_URL || winEnv.AUTH_REDIRECT_URL ||
      (typeof window !== 'undefined' && window.location ? window.location.origin + window.location.pathname : '');

    return {
      APP_ENV: resolvedEnv,
      SUPABASE_URL: normalizeUrl(rawUrl),
      SUPABASE_ANON_KEY: typeof rawKey === 'string' ? rawKey.trim() : '',
      AUTH_REDIRECT_URL: typeof rawRedirect === 'string' ? rawRedirect.trim() : ''
    };
  }

  let activeConfig = buildInitialConfig();

  /**
   * Validates configuration values independently and ensures security safeguards.
   * Fail-closed for incomplete or invalid configurations.
   * Never prints credentials or secret values in error messages.
   * 
   * @param {Object} [cfg]
   * @returns {{ valid: boolean, errors: string[] }}
   */
  function validate(cfg = activeConfig) {
    const errors = [];
    const appEnv = cfg.APP_ENV !== undefined ? cfg.APP_ENV : activeConfig.APP_ENV;

    // 1. Validate APP_ENV
    if (!appEnv || (typeof appEnv === 'string' && appEnv.trim() === '')) {
      errors.push('APP_ENV is missing or empty.');
    } else if (!VALID_ENVIRONMENTS.includes(appEnv)) {
      errors.push(`Invalid APP_ENV: "${appEnv}". Allowed environments: ${VALID_ENVIRONMENTS.join(', ')}.`);
    }

    const isStagingOrProd = appEnv === 'production' || appEnv === 'staging';

    // 2. Validate SUPABASE_URL independently
    if (!cfg.SUPABASE_URL || (typeof cfg.SUPABASE_URL === 'string' && cfg.SUPABASE_URL.trim() === '')) {
      if (isStagingOrProd) {
        errors.push(`SUPABASE_URL is required for ${appEnv} environment.`);
      } else {
        errors.push('SUPABASE_URL is missing or empty.');
      }
    } else if (!isValidHttpUrl(cfg.SUPABASE_URL)) {
      errors.push('SUPABASE_URL must be a valid HTTP/HTTPS URL.');
    } else if (cfg.SUPABASE_URL.includes('YOUR_SUPABASE_PROJECT_URL')) {
      errors.push('SUPABASE_URL is set to placeholder.');
    }

    // 3. Validate SUPABASE_ANON_KEY independently
    if (!cfg.SUPABASE_ANON_KEY || (typeof cfg.SUPABASE_ANON_KEY === 'string' && cfg.SUPABASE_ANON_KEY.trim() === '')) {
      if (isStagingOrProd) {
        errors.push(`SUPABASE_ANON_KEY is required for ${appEnv} environment.`);
      } else {
        errors.push('SUPABASE_ANON_KEY is missing or empty.');
      }
    } else if (typeof cfg.SUPABASE_ANON_KEY !== 'string') {
      errors.push('SUPABASE_ANON_KEY must be a string.');
    } else if (cfg.SUPABASE_ANON_KEY.includes('YOUR_SUPABASE_ANON_KEY')) {
      errors.push('SUPABASE_ANON_KEY is set to placeholder.');
    }

    // 4. Security Check: Guard against accidental service_role key leakage (never print key)
    if (cfg.SUPABASE_ANON_KEY && typeof cfg.SUPABASE_ANON_KEY === 'string') {
      try {
        const parts = cfg.SUPABASE_ANON_KEY.split('.');
        if (parts.length === 3) {
          const payloadStr = (typeof atob === 'function')
            ? atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
            : Buffer.from(parts[1], 'base64').toString('utf8');
          const payload = JSON.parse(payloadStr);
          if (payload && payload.role === 'service_role') {
            errors.push('SECURITY ALERT: The provided key is a Supabase service_role key! Never expose service_role keys to the frontend.');
          }
        }
      } catch (e) {
        // Non-JWT or opaque key format; handled by standard client
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Checks whether Supabase authentication is actively configured and valid.
   * In development/test with empty credentials, returns false (safe Guest Mode).
   * @returns {boolean}
   */
  function isConfigured() {
    return validate(activeConfig).valid;
  }

  /**
   * Helper to determine whether the app is currently operating in safe Guest Mode.
   * @returns {boolean}
   */
  function isGuestMode() {
    return !isConfigured();
  }

  function getAppEnv() {
    return activeConfig.APP_ENV;
  }

  function getConfig() {
    return { ...activeConfig };
  }

  function setConfig(newConfig) {
    const normalized = { ...newConfig };
    if (normalized.SUPABASE_URL !== undefined) {
      normalized.SUPABASE_URL = normalizeUrl(normalized.SUPABASE_URL);
    }
    if (normalized.APP_ENV !== undefined && typeof normalized.APP_ENV === 'string') {
      normalized.APP_ENV = normalized.APP_ENV.trim();
    }
    if (normalized.SUPABASE_ANON_KEY !== undefined && typeof normalized.SUPABASE_ANON_KEY === 'string') {
      normalized.SUPABASE_ANON_KEY = normalized.SUPABASE_ANON_KEY.trim();
    }
    activeConfig = {
      ...activeConfig,
      ...normalized
    };
    return getConfig();
  }

  function resetConfig() {
    activeConfig = buildInitialConfig();
    return getConfig();
  }

  const ConfigModule = {
    getConfig,
    setConfig,
    resetConfig,
    validate,
    isConfigured,
    isGuestMode,
    getAppEnv,
    resolveAppEnv,
    VALID_ENVIRONMENTS
  };

  // Export to browser global and CommonJS
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfigModule;
  }
  if (typeof window !== 'undefined') {
    window.AlgoRecallConfig = ConfigModule;
  }

})(typeof globalThis !== 'undefined' ? globalThis : this);

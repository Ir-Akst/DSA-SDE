/**
 * AlgoRecall — Supabase Authentication Engine
 * 
 * Provides robust authentication services with Google Sign-In, session restoration,
 * guest-mode fallback, and listener lifecycle management.
 * Follows the project's zero-dependency universal module pattern (Browser IIFE + CommonJS).
 * 
 * SECURITY INVARIANTS:
 * - Never log access tokens, refresh tokens, or sensitive payload data.
 * - Graceful degradation to guest mode if Supabase credentials are missing or unconfigured.
 * - Sign out clears auth credentials without touching local learning progress.
 * - Prevent duplicate client initialization and duplicate auth listeners.
 */

(function(global) {
  'use strict';

  // Dependencies (browser globals or Node.js requires)
  const Config = (typeof window !== 'undefined' && window.AlgoRecallConfig)
    ? window.AlgoRecallConfig
    : (typeof require === 'function' ? require('./config') : null);

  // Module state
  let supabaseClient = null;
  let currentSession = null;
  let currentUser = null;
  let isInitialized = false;
  let isInitializing = false;
  let initPromise = null;
  let authSubscription = null;
  const stateChangeListeners = new Set();

  /**
   * Safe logger that strips tokens and sensitive credentials.
   * @param {string} level - 'info' | 'warn' | 'error'
   * @param {string} message
   * @param {Object} [meta]
   */
  function safeLog(level, message, meta) {
    if (typeof console === 'undefined' || !console[level]) return;

    if (!meta) {
      console[level](`[AuthEngine] ${message}`);
      return;
    }

    // Sanitize metadata: remove tokens, keys, and raw secrets
    const sanitizedMeta = { ...meta };
    delete sanitizedMeta.access_token;
    delete sanitizedMeta.refresh_token;
    delete sanitizedMeta.token;
    delete sanitizedMeta.apiKey;
    delete sanitizedMeta.secret;

    console[level](`[AuthEngine] ${message}`, sanitizedMeta);
  }

  /**
   * Resolves the Supabase client factory (from window, require, or injection).
   * @param {Object} [customFactory]
   * @returns {Object|null}
   */
  function resolveSupabaseFactory(customFactory) {
    if (customFactory && typeof customFactory.createClient === 'function') {
      return customFactory;
    }
    if (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function') {
      return window.supabase;
    }
    if (typeof require === 'function') {
      try {
        const pkg = require('@supabase/supabase-js');
        if (pkg && typeof pkg.createClient === 'function') {
          return pkg;
        }
      } catch (e) {
        // Dev dependency not installed or unavailable; handled gracefully
      }
    }
    return null;
  }

  /**
   * Initializes the AuthEngine and attempts session restoration.
   * Resolves safely in guest mode if configuration is missing or invalid.
   * 
   * @param {Object} [options] - Optional custom configuration or injected client for testing.
   * @param {Object} [options.config] - Custom config overrides.
   * @param {Object} [options.client] - Pre-instantiated Supabase client (for mocking/testing).
   * @param {Object} [options.supabaseFactory] - Custom Supabase SDK factory.
   * @returns {Promise<{ status: string, user: Object|null, session: Object|null }>}
   */
  async function initialize(options = {}) {
    // Return existing initialization if already completed and no explicit client injected
    if (isInitialized && !options.client && !options.forceReinit) {
      return {
        status: currentSession ? 'authenticated' : 'guest',
        user: currentUser,
        session: currentSession
      };
    }

    // Return pending promise if currently initializing
    if (isInitializing && initPromise && !options.forceReinit) {
      return initPromise;
    }

    isInitializing = true;
    initPromise = (async () => {
      try {
        const activeConfig = (options.config) 
          ? { ...(Config ? Config.getConfig() : {}), ...options.config }
          : (Config ? Config.getConfig() : {});

        const isCfgValid = Config ? Config.validate(activeConfig).valid : false;

        // If a pre-configured client was explicitly passed (e.g. testing), adopt it directly
        if (options.client) {
          supabaseClient = options.client;
        } else if (isCfgValid) {
          const factory = resolveSupabaseFactory(options.supabaseFactory);
          if (factory) {
            supabaseClient = factory.createClient(activeConfig.SUPABASE_URL, activeConfig.SUPABASE_ANON_KEY, {
              auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true,
                flowType: 'pkce'
              }
            });
          } else {
            safeLog('warn', 'Supabase library not loaded. Falling back to guest mode.');
            supabaseClient = null;
          }
        } else {
          // Unconfigured or invalid credentials
          safeLog('info', 'Supabase credentials not configured. Running in guest mode.');
          supabaseClient = null;
        }

        // If no client available, check embedded session first
        if (!supabaseClient) {
          if (typeof window !== 'undefined' && window.localStorage && typeof fetch === 'function') {
            const storedToken = window.localStorage.getItem('algorecall_auth_token');
            if (storedToken) {
              try {
                const meRes = await fetch('/api/auth/me', {
                  headers: { 'Authorization': 'Bearer ' + storedToken }
                });
                if (meRes.ok) {
                  const meData = await meRes.json();
                  if (meData && meData.success && meData.user) {
                    currentUser = {
                      id: meData.user.id,
                      email: meData.user.username + '@render.local',
                      user_metadata: {
                        full_name: meData.user.displayName,
                        username: meData.user.username
                      }
                    };
                    currentSession = {
                      access_token: storedToken,
                      user: currentUser
                    };
                    isInitialized = true;
                    isInitializing = false;
                    handleAuthStateChange('SIGNED_IN', currentSession);
                    return { status: 'authenticated', user: currentUser, session: currentSession };
                  }
                } else {
                  window.localStorage.removeItem('algorecall_auth_token');
                }
              } catch (_) {}
            }
          }
          currentSession = null;
          currentUser = null;
          isInitialized = true;
          isInitializing = false;
          return { status: 'unconfigured', user: null, session: null };
        }

        // Restore existing session
        try {
          const { data, error } = await supabaseClient.auth.getSession();
          if (error) {
            safeLog('warn', 'Error restoring session:', { error: error.message });
            currentSession = null;
            currentUser = null;
          } else if (data && data.session) {
            currentSession = data.session;
            currentUser = data.session.user || null;
            safeLog('info', 'Active session restored successfully.', {
              userId: currentUser ? currentUser.id : null,
              email: currentUser ? currentUser.email : null
            });
          } else {
            currentSession = null;
            currentUser = null;
          }
        } catch (sessionErr) {
          safeLog('warn', 'Session restoration threw an exception:', { error: sessionErr.message });
          currentSession = null;
          currentUser = null;
        }

        // Attach auth state change listener once
        if (authSubscription) {
          try {
            if (typeof authSubscription.unsubscribe === 'function') {
              authSubscription.unsubscribe();
            } else if (authSubscription.data && typeof authSubscription.data.unsubscribe === 'function') {
              authSubscription.data.unsubscribe();
            }
          } catch (e) {
            // Ignore unsubscribe errors during reinit
          }
          authSubscription = null;
        }

        if (supabaseClient.auth && typeof supabaseClient.auth.onAuthStateChange === 'function') {
          const { data: subData } = supabaseClient.auth.onAuthStateChange(handleAuthStateChange);
          authSubscription = subData;
        }

        isInitialized = true;
        isInitializing = false;

        // Notify subscribers of initial state / restored session
        handleAuthStateChange(currentSession ? 'INITIAL_SESSION' : 'GUEST', currentSession);

        return {
          status: currentSession ? 'authenticated' : 'guest',
          user: currentUser,
          session: currentSession
        };
      } catch (err) {
        safeLog('error', 'Initialization encountered unexpected error:', { error: err.message });
        isInitialized = true;
        isInitializing = false;
        currentSession = null;
        currentUser = null;
        return { status: 'error', error: err.message, user: null, session: null };
      }
    })();

    return initPromise;
  }

  /**
   * Internal handler invoked whenever Supabase emits an authentication event.
   * Updates internal state and notifies subscribers without triggering full app rebuilds.
   * @param {string} event - e.g. 'SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED', 'INITIAL_SESSION'
   * @param {Object|null} session
   */
  function handleAuthStateChange(event, session) {
    safeLog('info', `Auth event received: ${event}`, {
      userId: session && session.user ? session.user.id : null
    });

    currentSession = session || null;
    currentUser = (session && session.user) ? session.user : null;

    // Notify registered subscribers
    stateChangeListeners.forEach(callback => {
      try {
        callback(event, currentSession, currentUser);
      } catch (err) {
        safeLog('error', 'Error in auth state listener callback:', { error: err.message });
      }
    });
  }

  /**
   * Initiates Google Sign-In via OAuth (PKCE Flow).
   * @param {Object} [options]
   * @param {string} [options.redirectTo] - Custom redirect target URL.
   * @param {Object} [options.queryParams] - Additional OAuth query parameters (e.g. prompt: 'select_account').
   * @returns {Promise<{ data: Object|null, error: Object|null }>}
   */
  async function signInWithGoogle(options = {}) {
    if (!supabaseClient) {
      const msg = 'Cannot sign in: Supabase client is not configured or initialized.';
      safeLog('warn', msg);
      return { data: null, error: new Error(msg) };
    }

    const activeConfig = Config ? Config.getConfig() : {};
    const redirectTo = options.redirectTo || activeConfig.AUTH_REDIRECT_URL || (typeof window !== 'undefined' ? window.location.href : '');

    try {
      safeLog('info', 'Initiating Google OAuth flow...');
      const response = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            prompt: 'select_account',
            ...(options.queryParams || {})
          }
        }
      });

      if (response.error) {
        safeLog('error', 'Google Sign-In failed:', { error: response.error.message });
      }

      return response;
    } catch (err) {
      safeLog('error', 'Unexpected error in signInWithGoogle:', { error: err.message });
      return { data: null, error: err };
    }
  }

  /**
   * Signs in with local credentials (up to 5 users).
   */
  async function signInWithCredentials(username, password) {
    if (typeof fetch !== 'function') {
      return { success: false, error: 'Network fetch is not available.' };
    }
    try {
      safeLog('info', `Attempting login for user: ${username}`);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Invalid credentials' };
      }

      const token = data.token;
      const u = data.user;
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('algorecall_auth_token', token);
      }
      currentUser = {
        id: u.id,
        email: u.username + '@render.local',
        user_metadata: {
          full_name: u.displayName,
          username: u.username
        }
      };
      currentSession = {
        access_token: token,
        user: currentUser
      };
      handleAuthStateChange('SIGNED_IN', currentSession);
      return { success: true, user: currentUser, session: currentSession };
    } catch (err) {
      return { success: false, error: err.message || 'Login request failed' };
    }
  }

  /**
   * Registers a new local account (max 5 users).
   */
  async function signUpWithCredentials(username, password, displayName) {
    if (typeof fetch !== 'function') {
      return { success: false, error: 'Network fetch is not available.' };
    }
    try {
      safeLog('info', `Attempting registration for user: ${username}`);
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, displayName })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Registration failed' };
      }

      const token = data.token;
      const u = data.user;
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('algorecall_auth_token', token);
      }
      currentUser = {
        id: u.id,
        email: u.username + '@render.local',
        user_metadata: {
          full_name: u.displayName,
          username: u.username
        }
      };
      currentSession = {
        access_token: token,
        user: currentUser
      };
      handleAuthStateChange('SIGNED_IN', currentSession);
      return { success: true, user: currentUser, session: currentSession };
    } catch (err) {
      return { success: false, error: err.message || 'Registration request failed' };
    }
  }

  /**
   * Signs the user out of Supabase/Embedded store and clears auth session state.
   * Invariant: Does NOT delete or alter localStorage learning progress or guest state.
   * @returns {Promise<{ error: Object|null }>}
   */
  async function signOut() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedToken = window.localStorage.getItem('algorecall_auth_token');
      if (storedToken) {
        window.localStorage.removeItem('algorecall_auth_token');
        if (typeof fetch === 'function') {
          try {
            await fetch('/api/auth/logout', {
              method: 'POST',
              headers: { 'Authorization': 'Bearer ' + storedToken }
            });
          } catch (_) {}
        }
      }
    }

    if (!supabaseClient) {
      currentSession = null;
      currentUser = null;
      handleAuthStateChange('SIGNED_OUT', null);
      return { error: null };
    }

    try {
      safeLog('info', 'Signing out active user...');
      const { error } = await supabaseClient.auth.signOut();
      
      currentSession = null;
      currentUser = null;

      if (error) {
        safeLog('warn', 'Supabase signOut returned an error:', { error: error.message });
        // Still clear local session state
        handleAuthStateChange('SIGNED_OUT', null);
        return { error };
      }

      // Event listener will typically also receive 'SIGNED_OUT' from Supabase
      return { error: null };
    } catch (err) {
      safeLog('error', 'Exception during signOut:', { error: err.message });
      currentSession = null;
      currentUser = null;
      handleAuthStateChange('SIGNED_OUT', null);
      return { error: err };
    }
  }

  /**
   * Retrieves the current Supabase session object (or null).
   * @returns {Object|null}
   */
  function getSession() {
    return currentSession ? { ...currentSession } : null;
  }

  /**
   * Retrieves the current authenticated user object (or null).
   * @returns {Object|null}
   */
  function getUser() {
    return currentUser ? { ...currentUser } : null;
  }

  /**
   * Returns true if there is an active authenticated session.
   * @returns {boolean}
   */
  function isAuthenticated() {
    return Boolean(currentUser && currentSession);
  }

  /**
   * Returns true if Supabase configuration is valid and client is created.
   * @returns {boolean}
   */
  function isConfigured() {
    return Boolean(supabaseClient && (Config ? Config.isConfigured() : true));
  }

  /**
   * Registers a callback for authentication state changes.
   * Returns an object containing an `unsubscribe` method to prevent memory leaks.
   * 
   * @param {Function} callback - (event, session, user) => void
   * @returns {{ unsubscribe: Function }}
   */
  function onAuthStateChange(callback) {
    if (typeof callback !== 'function') {
      throw new Error('AuthEngine.onAuthStateChange requires a function callback.');
    }

    stateChangeListeners.add(callback);

    return {
      unsubscribe: () => {
        stateChangeListeners.delete(callback);
      }
    };
  }

  /**
   * Resets the module state (primarily for isolated test suites).
   */
  function _resetForTesting() {
    if (authSubscription) {
      try {
        if (typeof authSubscription.unsubscribe === 'function') {
          authSubscription.unsubscribe();
        } else if (authSubscription.data && typeof authSubscription.data.unsubscribe === 'function') {
          authSubscription.data.unsubscribe();
        }
      } catch (e) {}
    }
    supabaseClient = null;
    currentSession = null;
    currentUser = null;
    isInitialized = false;
    isInitializing = false;
    initPromise = null;
    authSubscription = null;
    stateChangeListeners.clear();
  }

  const AuthEngineModule = {
    initialize,
    signInWithGoogle,
    signInWithCredentials,
    signUpWithCredentials,
    signOut,
    getSession,
    getUser,
    getClient: () => supabaseClient,
    isAuthenticated,
    isConfigured,
    onAuthStateChange,
    _resetForTesting
  };

  // Export to browser global and CommonJS
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthEngineModule;
  }
  if (typeof window !== 'undefined') {
    window.AuthEngine = AuthEngineModule;
  }

})(typeof globalThis !== 'undefined' ? globalThis : this);

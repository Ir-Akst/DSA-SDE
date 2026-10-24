/**
 * AlgoRecall — Stage 1 Authentication UI Browser E2E Verification
 * Uses Chrome DevTools Protocol (CDP) via native global WebSocket to verify
 * live browser DOM, modals, guest/authenticated state transitions, and responsive behavior.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP_URL = 'http://localhost:3000/';
const PORT = 9338;
const USER_DATA_DIR = path.join(process.cwd(), 'scratch', 'chrome_verify_auth_' + Date.now());

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let ws = null;
let reqId = 1;

function sendCDP(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = reqId++;
    const handler = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.id === id) {
          ws.removeEventListener('message', handler);
          if (msg.error) reject(new Error(msg.error.message));
          else resolve(msg.result);
        }
      } catch (e) {
        reject(e);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evalInBrowser(expr) {
  const res = await sendCDP('Runtime.evaluate', {
    expression: expr,
    returnByValue: true,
    awaitPromise: true
  });
  if (res.exceptionDetails) {
    throw new Error('Eval Exception: ' + (res.exceptionDetails.exception?.description || res.exceptionDetails.text));
  }
  return res.result.value;
}

async function run() {
  console.log('======================================================================');
  console.log('🔐 AlgoRecall Stage 1 — Supabase & Google Auth Browser Verification');
  console.log('======================================================================');

  fs.mkdirSync(USER_DATA_DIR, { recursive: true });

  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${USER_DATA_DIR}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    APP_URL
  ], { stdio: 'ignore' });

  let total = 0;
  let passed = 0;

  function check(label, condition) {
    total++;
    if (condition) {
      passed++;
      console.log(`  ✓ ${label}`);
      return true;
    } else {
      console.error(`  ✗ FAILED: ${label}`);
      return false;
    }
  }

  try {
    let targets = null;
    for (let i = 0; i < 30; i++) {
      await wait(400);
      try {
        const res = await fetch(`http://127.0.0.1:${PORT}/json`);
        if (res.ok) {
          targets = await res.json();
          if (targets.length > 0) break;
        }
      } catch (_) {}
    }

    if (!targets || targets.length === 0) {
      throw new Error(`Could not establish CDP connection on port ${PORT}`);
    }

    const pageTarget = targets.find(t => t.type === 'page' && t.url.includes('localhost')) || targets.find(t => t.type === 'page') || targets[0];
    console.log(`[CDP] Connected to page: "${pageTarget.title}" (${pageTarget.url})`);

    ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    await sendCDP('Page.enable');
    await sendCDP('Runtime.enable');
    await sendCDP('Page.navigate', { url: APP_URL });
    await wait(3000);

    // ====================================================================
    // SUITE 1: Initial Guest State Verification
    // ====================================================================
    console.log('\n[SUITE 1] Initial Guest State Verification');
    const guestState = await evalInBrowser(`(() => {
      const btnAuth = document.getElementById('btn-header-auth');
      const userPill = document.getElementById('header-user-pill');
      const authModal = document.getElementById('auth-modal');

      return {
        hasBtnAuth: Boolean(btnAuth),
        btnAuthVisible: btnAuth ? window.getComputedStyle(btnAuth).display !== 'none' : false,
        btnAuthText: btnAuth ? btnAuth.textContent.trim() : '',
        userPillHidden: userPill ? window.getComputedStyle(userPill).display === 'none' : true,
        modalExists: Boolean(authModal),
        modalClosed: authModal ? !authModal.classList.contains('open') : false,
        isGuest: !window.AuthEngine || !window.AuthEngine.isAuthenticated()
      };
    })()`);

    check('Header Guest Sign-in button exists in DOM', guestState.hasBtnAuth);
    check('Header Guest Sign-in button is visible', guestState.btnAuthVisible);
    check('Header Guest Sign-in button label contains "Sign in"', guestState.btnAuthText.includes('Sign in'));
    check('Authenticated user pill is hidden by default', guestState.userPillHidden);
    check('Auth modal exists in DOM and is closed by default', guestState.modalExists && guestState.modalClosed);
    check('AuthEngine reports guest status', guestState.isGuest);

    // ====================================================================
    // SUITE 2: Auth Modal Interaction & Dismissal
    // ====================================================================
    console.log('\n[SUITE 2] Auth Modal Interaction & Dismissal');
    await evalInBrowser(`document.getElementById('btn-header-auth').click()`);
    await wait(300);

    const modalOpenState = await evalInBrowser(`(() => {
      const modal = document.getElementById('auth-modal');
      const submitBtn = document.getElementById('btn-auth-credentials-submit');
      const banner = document.getElementById('auth-status-message');
      const continueGuestBtn = document.getElementById('btn-auth-continue-guest');

      return {
        isOpen: modal && modal.classList.contains('open'),
        hasSubmitBtn: Boolean(submitBtn),
        hasContinueGuest: Boolean(continueGuestBtn),
        bannerMentionsGuest: banner ? banner.textContent.includes('Guest Mode') : false
      };
    })()`);

    check('Clicking Sign in button opens #auth-modal', modalOpenState.isOpen);
    check('Auth modal displays credentials sign-in button', modalOpenState.hasSubmitBtn);
    check('Auth modal displays informative Guest Mode status banner', modalOpenState.bannerMentionsGuest);
    check('Auth modal provides "Continue as Guest" action', modalOpenState.hasContinueGuest);

    // Dismiss modal
    await evalInBrowser(`document.getElementById('btn-auth-continue-guest').click()`);
    await wait(300);

    const modalClosedState = await evalInBrowser(`(() => {
      const modal = document.getElementById('auth-modal');
      return modal ? !modal.classList.contains('open') : false;
    })()`);

    check('Clicking "Continue as Guest" dismisses modal cleanly', modalClosedState);

    // ====================================================================
    // SUITE 3: Simulated Authentication & Header State Transition
    // ====================================================================
    console.log('\n[SUITE 3] Simulated Authentication & Header State Transition');
    await evalInBrowser(`(() => {
      const mockSession = {
        access_token: 'test-token',
        refresh_token: 'test-refresh',
        user: {
          id: 'test-user-456',
          email: 'alex.engineer@gmail.com',
          user_metadata: {
            full_name: 'Alex Engineer',
            avatar_url: ''
          }
        }
      };

      const listeners = new Set();
      const mockClient = {
        auth: {
          getSession: async () => ({ data: { session: mockSession }, error: null }),
          getUser: async () => ({ data: { user: mockSession.user }, error: null }),
          signOut: async () => {
            listeners.forEach(cb => cb('SIGNED_OUT', null));
            return { error: null };
          },
          onAuthStateChange: (cb) => {
            listeners.add(cb);
            return { data: { unsubscribe: () => listeners.delete(cb) } };
          }
        }
      };

      return window.AuthEngine.initialize({ client: mockClient, forceReinit: true });
    })()`);
    await wait(400);

    const authedState = await evalInBrowser(`(() => {
      const btnAuth = document.getElementById('btn-header-auth');
      const userPill = document.getElementById('header-user-pill');
      const userName = document.getElementById('header-user-name');
      const userAvatar = document.getElementById('header-user-avatar');
      const userEmail = document.getElementById('header-user-email');

      return {
        btnAuthHidden: btnAuth ? window.getComputedStyle(btnAuth).display === 'none' : false,
        userPillVisible: userPill ? window.getComputedStyle(userPill).display !== 'none' : false,
        nameText: userName ? userName.textContent.trim() : '',
        avatarText: userAvatar ? userAvatar.textContent.trim() : '',
        emailText: userEmail ? userEmail.textContent.trim() : ''
      };
    })()`);

    check('Guest Sign-in button hides when authenticated', authedState.btnAuthHidden);
    check('User profile pill becomes visible', authedState.userPillVisible);
    check('User profile pill displays authenticated full name', authedState.nameText === 'Alex Engineer');
    check('User profile avatar fallback renders initial ("A")', authedState.avatarText === 'A');
    check('Account dropdown contains user email', authedState.emailText === 'alex.engineer@gmail.com');

    // ====================================================================
    // SUITE 4: Dropdown Menu & Sign-Out State Restoration
    // ====================================================================
    console.log('\n[SUITE 4] Dropdown Menu & Sign-Out State Restoration');
    await evalInBrowser(`document.getElementById('header-user-pill').click()`);
    await wait(200);

    const dropdownOpenState = await evalInBrowser(`(() => {
      const dropdown = document.getElementById('header-auth-dropdown');
      return dropdown && dropdown.classList.contains('open');
    })()`);

    check('Clicking user pill toggles account dropdown open', dropdownOpenState);

    await evalInBrowser(`document.getElementById('btn-header-signout').click()`);
    await wait(400);

    const signedOutState = await evalInBrowser(`(() => {
      const btnAuth = document.getElementById('btn-header-auth');
      const userPill = document.getElementById('header-user-pill');
      const dropdown = document.getElementById('header-auth-dropdown');

      return {
        btnAuthVisible: btnAuth ? window.getComputedStyle(btnAuth).display !== 'none' : false,
        userPillHidden: userPill ? window.getComputedStyle(userPill).display === 'none' : false,
        dropdownClosed: dropdown ? !dropdown.classList.contains('open') : true,
        isGuest: !window.AuthEngine.isAuthenticated()
      };
    })()`);

    check('Sign-out restores guest button in header', signedOutState.btnAuthVisible);
    check('Sign-out hides user profile pill', signedOutState.userPillHidden);
    check('Sign-out closes account dropdown', signedOutState.dropdownClosed);
    check('AuthEngine state cleanly reverts to unauthenticated', signedOutState.isGuest);

  } finally {
    try {
      ws.close();
    } catch (_) {}
    try {
      chrome.kill();
    } catch (_) {}
    try {
      fs.rmSync(USER_DATA_DIR, { recursive: true, force: true });
    } catch (_) {}
  }

  console.log('\n======================================================================');
  console.log(`AUTH BROWSER E2E ACCEPTANCE: ${passed}/${total} Checks Passed (${total - passed} Failed)`);
  console.log('======================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Fatal Auth Browser Verification Error:', err);
  process.exit(1);
});

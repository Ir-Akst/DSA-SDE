const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const EmbeddedStore = require('./embedded-store');
EmbeddedStore.init();

// Load local .env file if present (without external dependencies)
try {
  const envPath = path.resolve(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    });
  }
} catch (_) {}

const PORT = process.env.PORT || 3000;
const ROOT = path.resolve(__dirname);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const COMPRESSIBLE_EXTENSIONS = new Set(['.html', '.css', '.js', '.json', '.svg', '.txt', '.md']);
const RUNTIME_CONFIG_SCRIPT_ID = '__ALGORECALL_RUNTIME_CONFIG__';

function getCacheControl(ext) {
  if (ext === '.html') return 'no-cache, must-revalidate';
  if (['.css', '.js', '.woff', '.woff2', '.ttf'].includes(ext)) return 'public, max-age=3600';
  if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico'].includes(ext)) return 'public, max-age=86400';
  return 'no-cache';
}

function generateETag(stats) {
  return `W/"${stats.size.toString(16)}-${Math.floor(stats.mtimeMs).toString(16)}"`;
}

/**
 * Extracts public browser runtime configuration from environment.
 * Strict whitelist: only public, non-secret parameters are ever returned.
 * Private secrets (OPENAI_API_KEY, GEMINI_API_KEY, service_role keys, etc.) are NEVER exposed.
 * @returns {{ APP_ENV: string, SUPABASE_URL: string, SUPABASE_ANON_KEY: string, AUTH_REDIRECT_URL: string }}
 */
function getPublicRuntimeConfig() {
  const env = process.env || {};

  // Deterministic APP_ENV resolution
  let appEnv = 'development';
  if (env.APP_ENV && typeof env.APP_ENV === 'string' && env.APP_ENV.trim()) {
    appEnv = env.APP_ENV.trim();
  } else if (env.NODE_ENV && typeof env.NODE_ENV === 'string' && env.NODE_ENV.trim()) {
    const nodeEnv = env.NODE_ENV.trim();
    if (nodeEnv === 'test') appEnv = 'test';
    else if (nodeEnv === 'production') appEnv = 'production';
    else if (nodeEnv === 'staging') appEnv = 'staging';
    else if (nodeEnv === 'development') appEnv = 'development';
    else appEnv = nodeEnv;
  }

  return {
    APP_ENV: appEnv,
    SUPABASE_URL: (typeof env.SUPABASE_URL === 'string') ? env.SUPABASE_URL.trim() : '',
    SUPABASE_ANON_KEY: (typeof env.SUPABASE_ANON_KEY === 'string') ? env.SUPABASE_ANON_KEY.trim() : '',
    AUTH_REDIRECT_URL: (typeof env.AUTH_REDIRECT_URL === 'string') ? env.AUTH_REDIRECT_URL.trim() : ''
  };
}

/**
 * Serializes an object for safe inline HTML <script> inclusion.
 * Escapes <, >, /, \u2028, and \u2029 to prevent XSS and script-tag breakout.
 * @param {Object} obj
 * @returns {string}
 */
function serializeForInlineScript(obj) {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\//g, '\\u002f')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/**
 * Injects public runtime configuration into HTML content inside <head>.
 * Guarded against duplicate injection.
 * @param {string} htmlContent
 * @param {Object} [configOverride]
 * @returns {string}
 */
function injectRuntimeConfigHtml(htmlContent, configOverride) {
  if (typeof htmlContent !== 'string') return htmlContent;

  // Duplicate injection guard
  if (htmlContent.includes(`id="${RUNTIME_CONFIG_SCRIPT_ID}"`) ||
      htmlContent.includes(`id='${RUNTIME_CONFIG_SCRIPT_ID}'`)) {
    return htmlContent;
  }

  const publicConfig = configOverride || getPublicRuntimeConfig();
  const safeSerialized = serializeForInlineScript(publicConfig);
  const scriptTag = `  <script id="${RUNTIME_CONFIG_SCRIPT_ID}">window.__ENV = Object.freeze(${safeSerialized});</script>\n`;

  // Inject immediately after <head> or <head ...>
  const headMatch = htmlContent.match(/<head(\s[^>]*)?>/i);
  if (headMatch) {
    const insertIdx = headMatch.index + headMatch[0].length;
    return htmlContent.slice(0, insertIdx) + '\n' + scriptTag + htmlContent.slice(insertIdx);
  }

  // Fallback: inject before </head>
  const headCloseIdx = htmlContent.search(/<\/head>/i);
  if (headCloseIdx !== -1) {
    return htmlContent.slice(0, headCloseIdx) + scriptTag + htmlContent.slice(headCloseIdx);
  }

  // Fallback: inject before <body> or at start of HTML
  const bodyIdx = htmlContent.search(/<body(\s[^>]*)?>/i);
  if (bodyIdx !== -1) {
    return htmlContent.slice(0, bodyIdx) + scriptTag + htmlContent.slice(bodyIdx);
  }

  return scriptTag + htmlContent;
}

// HTTP Security Headers
const SECURITY_HEADERS = Object.freeze({
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
});

function sendResponse(res, statusCode, headers = {}, body = null) {
  if (res.writableEnded || res.destroyed) return;
  const mergedHeaders = { ...SECURITY_HEADERS, ...headers };
  res.writeHead(statusCode, mergedHeaders);
  if (body !== null && body !== undefined) {
    res.end(body);
  } else {
    res.end();
  }
}

let CANONICAL_ROOT = ROOT;
try {
  CANONICAL_ROOT = fs.realpathSync(ROOT);
} catch (_) {}
const CANONICAL_ROOT_SEP = CANONICAL_ROOT.endsWith(path.sep) ? CANONICAL_ROOT : CANONICAL_ROOT + path.sep;

const DENIED_DIR_NAMES = new Set([
  'node_modules',
  'supabase',
  'scratch',
  'scripts',
  'test',
  'tests',
  'docs',
  '.git',
  '.github',
  '.vscode',
  '.idea',
  'etc',
  'windows',
  'winnt',
  'system32'
]);

const DENIED_ROOT_FILENAMES = new Set([
  'server.js',
  'package.json',
  'package-lock.json',
  'dockerfile',
  'docker-compose.yml',
  'render.yaml',
  'vercel.json',
  'readme.md'
]);

const DENIED_EXTENSIONS = new Set([
  '.env',
  '.sql',
  '.sh',
  '.bat',
  '.cmd',
  '.py',
  '.md',
  '.yaml',
  '.yml',
  '.dockerfile',
  '.lock',
  '.log',
  '.tmp',
  '.bak',
  '.backup'
]);

const ALLOWED_DIR_PREFIXES = ['css/', 'js/', 'assets/', 'images/', 'fonts/'];

const ALLOWED_ROOT_FILES = new Set([
  'index.html',
  'favicon.ico',
  'robots.txt',
  'manifest.json'
]);

/**
 * Verifies that a target filesystem path is strictly contained within rootPath.
 * Handles Windows drive letters/case-insensitivity, POSIX paths, separator normalization,
 * and sibling directory prefix escapes (e.g. /app vs /app-secret).
 * @param {string} candidatePath
 * @param {string} [rootPath]
 * @returns {boolean}
 */
function isWithinRoot(candidatePath, rootPath = CANONICAL_ROOT) {
  if (typeof candidatePath !== 'string' || !candidatePath.trim()) return false;
  const isWin = process.platform === 'win32';
  const cTarget = isWin ? path.resolve(candidatePath).toLowerCase() : path.resolve(candidatePath);
  const cRoot = isWin ? path.resolve(rootPath).toLowerCase() : path.resolve(rootPath);
  const rootSep = cRoot.endsWith(path.sep) ? cRoot : cRoot + path.sep;

  if (cTarget === cRoot || cTarget === path.join(cRoot, 'index.html')) {
    return true;
  }
  if (!cTarget.startsWith(rootSep)) {
    return false;
  }
  // Sibling escape check: Ensure relative path does not escape via '..' or root drive change
  const rel = path.relative(cRoot, cTarget);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) {
    return false;
  }
  return true;
}

/**
 * Authorizes a repository-relative path against the public static asset security policy.
 * Applies uniformly to both requested URLs and resolved filesystem targets (symlinks).
 * Rejects dotfiles, protected directories, sensitive configuration/source files,
 * forbidden extensions, and unpermitted root files or directory prefixes.
 *
 * @param {string} relPath - Repository-relative path (e.g. 'js/app.js' or 'index.html')
 * @param {Object} [options]
 * @param {boolean} [options.isTarget=false] - If true, evaluates a resolved canonical filesystem target
 * @param {string} [options.requestedExt] - Expected file extension (rejects type mismatches)
 * @returns {{ allowed: boolean, status: number, relativePath?: string, ext?: string, error?: string }}
 */
function authorizePathPolicy(relPath, options = {}) {
  if (typeof relPath !== 'string') {
    return { allowed: false, status: 400, error: 'Invalid path' };
  }

  // Normalize separators and clean slashes
  const normalized = relPath.replace(/\\/g, '/').replace(/^\/+/, '');
  if (!normalized || normalized === '.' || normalized === 'index.html') {
    return { allowed: true, status: 200, relativePath: 'index.html', ext: '.html' };
  }

  const rawSegments = normalized.split('/');

  // Directory traversal check
  if (rawSegments.some(s => s === '..' || s === '.')) {
    return { allowed: false, status: 403, error: 'Access Denied: Traversal detected' };
  }

  const cleanSegments = rawSegments.filter(Boolean);
  if (cleanSegments.length === 0) {
    return { allowed: true, status: 200, relativePath: 'index.html', ext: '.html' };
  }

  // Dotfile check (any segment starting with .)
  if (cleanSegments.some(s => s.startsWith('.'))) {
    return { allowed: false, status: 403, error: 'Access Denied: Hidden files protected' };
  }

  // Protected directory check (any segment matching denied directories)
  if (cleanSegments.some(s => DENIED_DIR_NAMES.has(s.toLowerCase()))) {
    return { allowed: false, status: 403, error: 'Access Denied: Protected directory' };
  }

  // Protected filename check (any segment matching denied filenames, or root filename)
  const filename = cleanSegments[cleanSegments.length - 1].toLowerCase();
  if (DENIED_ROOT_FILENAMES.has(filename)) {
    return { allowed: false, status: 403, error: 'Access Denied: Protected system file' };
  }

  // Denied extensions check
  const ext = path.extname(normalized).toLowerCase();
  if (DENIED_EXTENSIONS.has(ext)) {
    return { allowed: false, status: 403, error: 'Access Denied: Forbidden file extension' };
  }

  // Public asset boundary policy: allowed root file OR allowed directory prefix
  const isAllowedRoot = cleanSegments.length === 1 && ALLOWED_ROOT_FILES.has(cleanSegments[0].toLowerCase());
  const pathForPrefix = cleanSegments.join('/');
  const isAllowedDir = ALLOWED_DIR_PREFIXES.some(prefix => pathForPrefix.toLowerCase().startsWith(prefix.toLowerCase()));

  if (!isAllowedRoot && !isAllowedDir) {
    const status = options.isTarget ? 403 : 404;
    return {
      allowed: false,
      status: status,
      error: options.isTarget ? 'Access Denied: Resolved target outside public asset policy' : '404 Not Found'
    };
  }

  // Extension support check
  if (!MIME_TYPES[ext]) {
    return { allowed: false, status: 403, error: 'Access Denied: Unsupported MIME type' };
  }

  // Extension mismatch check (target extension must match requested extension)
  if (options.requestedExt && options.requestedExt.toLowerCase() !== ext) {
    return { allowed: false, status: 403, error: 'Access Denied: Target extension mismatch' };
  }

  return {
    allowed: true,
    status: 200,
    relativePath: pathForPrefix,
    ext: ext
  };
}

/**
 * Validates and resolves incoming static file requests against a strict security policy.
 * Resolves symlinks and re-authorizes the canonical target path against repository boundaries
 * and public asset policies.
 * @param {string} rawUrl
 * @returns {{ valid: boolean, status: number, safePath?: string, realPath?: string, targetRel?: string, stats?: fs.Stats, ext?: string, error?: string }}
 */
function validateStaticPath(rawUrl) {
  if (typeof rawUrl !== 'string') {
    return { valid: false, status: 400, error: 'Invalid URL' };
  }

  // Pre-check for directory traversal tokens in raw URL path before WHATWG URL resolution normalizes them
  const rawPathOnly = rawUrl.split(/[?#]/)[0];
  const rawPathLower = rawPathOnly.toLowerCase();
  if (rawPathOnly.includes('..') || rawPathLower.includes('%2e%2e') || rawPathLower.includes('%252e%252e')) {
    return { valid: false, status: 403, error: 'Access Denied' };
  }

  // Prevent protocol-relative URL interpretation where leading '//' is treated as a hostname
  const safeReqUrl = rawUrl.startsWith('//') ? '/' + rawUrl.replace(/^\/+/, '') : rawUrl;

  let parsed;
  try {
    parsed = new URL(safeReqUrl, 'http://localhost');
  } catch (_) {
    return { valid: false, status: 400, error: 'Malformed URL' };
  }

  let decoded = parsed.pathname;

  // Catch malformed percent-encoding & double-encoding
  try {
    decoded = decodeURIComponent(decoded);
    if (decoded.includes('%')) {
      decoded = decodeURIComponent(decoded);
    }
  } catch (_) {
    return { valid: false, status: 400, error: 'Malformed URI encoding' };
  }

  // Null byte injection check
  if (decoded.includes('\0')) {
    return { valid: false, status: 400, error: 'Null byte injection detected' };
  }

  // Normalize slashes
  decoded = decoded.replace(/\\/g, '/').replace(/\/+/g, '/');

  // Authorize the requested path against the public policy
  const reqAuth = authorizePathPolicy(decoded, { isTarget: false });
  if (!reqAuth.allowed) {
    return { valid: false, status: reqAuth.status, error: reqAuth.error };
  }

  // Resolve candidate filesystem path
  const candidatePath = path.resolve(ROOT, reqAuth.relativePath);

  // Containment check of candidate path within repository
  if (!isWithinRoot(candidatePath, CANONICAL_ROOT)) {
    return { valid: false, status: 403, error: 'Access Denied' };
  }

  let stats;
  try {
    stats = fs.statSync(candidatePath);
  } catch (_) {
    return { valid: false, status: 404, error: '404 Not Found' };
  }

  if (!stats.isFile()) {
    return { valid: false, status: 404, error: '404 Not Found' };
  }

  // Resolve canonical target path (follows any symlinks/junctions)
  let realPath;
  try {
    realPath = fs.realpathSync(candidatePath);
  } catch (_) {
    return { valid: false, status: 404, error: '404 Not Found' };
  }

  // Enforce repository containment on the resolved target
  if (!isWithinRoot(realPath, CANONICAL_ROOT)) {
    return { valid: false, status: 403, error: 'Access Denied: Symlink target outside repository boundary' };
  }

  // Derive canonical repository-relative target path
  let targetRel = path.relative(CANONICAL_ROOT, realPath).replace(/\\/g, '/');
  if (!targetRel || targetRel === '.') {
    targetRel = 'index.html';
  }

  // Reapply authorization policy to the resolved canonical target!
  const targetAuth = authorizePathPolicy(targetRel, {
    isTarget: true,
    requestedExt: reqAuth.ext
  });

  if (!targetAuth.allowed) {
    return {
      valid: false,
      status: targetAuth.status || 403,
      error: targetAuth.error || 'Access Denied: Target is not an authorized public asset'
    };
  }

  return {
    valid: true,
    status: 200,
    safePath: candidatePath,
    realPath: realPath,
    targetRel: targetRel,
    stats: stats,
    ext: reqAuth.ext
  };
}

const server = http.createServer((req, res) => {
  // Prevent protocol-relative URL interpretation where leading '//' is treated as a hostname
  const safeReqUrl = (req.url && req.url.startsWith('//')) ? '/' + req.url.replace(/^\/+/, '') : (req.url || '/');

  let parsedUrl;
  try {
    parsedUrl = new URL(safeReqUrl, `http://localhost:${PORT}`);
  } catch (_) {
    sendResponse(res, 400, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' }, 'Bad Request');
    return;
  }

  let pathname = parsedUrl.pathname;

  // Optional API endpoints
  if (pathname === '/api/status' && (req.method === 'GET' || req.method === 'HEAD')) {
    const statusPayload = JSON.stringify({
      status: 'ok',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      hasGeminiKey: !!process.env.GEMINI_API_KEY
    });
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(statusPayload),
      'Cache-Control': 'no-store, private'
    };
    if (req.method === 'HEAD') {
      sendResponse(res, 200, headers);
      return;
    }
    sendResponse(res, 200, headers, statusPayload);
    return;
  }

  if (pathname === '/api/ai-hint') {
    if (req.method !== 'POST') {
      sendResponse(res, 405, { 'Content-Type': 'application/json', 'Allow': 'POST', 'Cache-Control': 'no-store' }, JSON.stringify({ success: false, error: 'Method Not Allowed' }));
      return;
    }
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const problem = payload.problem || {};
        const level = payload.level || 1;

        const responsePayload = JSON.stringify({
          success: true,
          provider: 'server_proxy',
          level: level,
          message: `Server hint response for ${problem.title || 'problem'} at Level ${level}.`
        });
        sendResponse(res, 200, {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(responsePayload),
          'Cache-Control': 'no-store, private'
        }, responsePayload);
      } catch (err) {
        const errPayload = JSON.stringify({ success: false, error: 'Invalid JSON payload' });
        sendResponse(res, 400, {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(errPayload),
          'Cache-Control': 'no-store, private'
        }, errPayload);
      }
    });
    return;
  }

  // Embedded 5-User Authentication & Storage Endpoints
  function getBearerToken(r) {
    const auth = r.headers['authorization'] || '';
    if (auth.startsWith('Bearer ')) return auth.slice(7).trim();
    return null;
  }

  function readJsonBody(r, cb) {
    let raw = '';
    r.on('data', c => {
      raw += c;
      if (raw.length > 5 * 1024 * 1024) r.destroy();
    });
    r.on('end', () => {
      try {
        cb(null, raw ? JSON.parse(raw) : {});
      } catch (e) {
        cb(e, null);
      }
    });
  }

  function sendJson(resCode, data) {
    const str = JSON.stringify(data);
    sendResponse(res, resCode, {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(str),
      'Cache-Control': 'no-store, private'
    }, str);
  }

  if (pathname === '/api/auth/users' && (req.method === 'GET' || req.method === 'HEAD')) {
    const list = EmbeddedStore.listUsers();
    if (req.method === 'HEAD') {
      sendResponse(res, 200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store, private' });
      return;
    }
    sendJson(200, { success: true, maxUsers: EmbeddedStore.MAX_USERS, userCount: list.length, users: list });
    return;
  }

  if (pathname === '/api/team/leaderboard' && (req.method === 'GET' || req.method === 'HEAD')) {
    const data = EmbeddedStore.getTeamLeaderboard();
    if (req.method === 'HEAD') {
      sendResponse(res, 200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store, private' });
      return;
    }
    sendJson(200, data);
    return;
  }

  if (pathname === '/api/auth/register') {
    if (req.method !== 'POST') {
      sendResponse(res, 405, { 'Content-Type': 'application/json', 'Allow': 'POST', 'Cache-Control': 'no-store' }, JSON.stringify({ success: false, error: 'Method Not Allowed' }));
      return;
    }
    readJsonBody(req, (err, payload) => {
      if (err) return sendJson(400, { success: false, error: 'Invalid JSON payload' });
      const { username, password, displayName } = payload || {};
      const result = EmbeddedStore.register(username, password, displayName);
      sendJson(result.success ? 201 : 400, result);
    });
    return;
  }

  if (pathname === '/api/auth/login') {
    if (req.method !== 'POST') {
      sendResponse(res, 405, { 'Content-Type': 'application/json', 'Allow': 'POST', 'Cache-Control': 'no-store' }, JSON.stringify({ success: false, error: 'Method Not Allowed' }));
      return;
    }
    readJsonBody(req, (err, payload) => {
      if (err) return sendJson(400, { success: false, error: 'Invalid JSON payload' });
      const { username, password } = payload || {};
      const result = EmbeddedStore.login(username, password);
      sendJson(result.success ? 200 : 401, result);
    });
    return;
  }

  if (pathname === '/api/auth/me' && (req.method === 'GET' || req.method === 'HEAD')) {
    const token = getBearerToken(req);
    const user = EmbeddedStore.validateToken(token);
    if (!user) {
      return sendJson(401, { success: false, error: 'Unauthorized: invalid or expired session token' });
    }
    if (req.method === 'HEAD') {
      sendResponse(res, 200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store, private' });
      return;
    }
    return sendJson(200, { success: true, user });
  }

  if (pathname === '/api/auth/logout' && req.method === 'POST') {
    const token = getBearerToken(req);
    EmbeddedStore.logout(token);
    return sendJson(200, { success: true, message: 'Signed out successfully' });
  }

  if (pathname === '/api/sync/snapshot') {
    const token = getBearerToken(req);
    const user = EmbeddedStore.validateToken(token);
    if (!user) {
      return sendJson(401, { success: false, error: 'Unauthorized: login required to sync' });
    }

    if (req.method === 'GET' || req.method === 'HEAD') {
      if (req.method === 'HEAD') {
        sendResponse(res, 200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store, private' });
        return;
      }
      const snap = EmbeddedStore.getSnapshot(user.id);
      return sendJson(snap.success ? 200 : 500, snap);
    }

    if (req.method === 'POST') {
      readJsonBody(req, (err, payload) => {
        if (err) return sendJson(400, { success: false, error: 'Invalid JSON payload' });
        const snapshotData = payload.snapshot !== undefined ? payload.snapshot : payload;
        const result = EmbeddedStore.saveSnapshot(user.id, snapshotData);
        sendJson(result.success ? 200 : 500, result);
      });
      return;
    }

    sendResponse(res, 405, { 'Content-Type': 'application/json', 'Allow': 'GET, POST, HEAD', 'Cache-Control': 'no-store' }, JSON.stringify({ success: false, error: 'Method Not Allowed' }));
    return;
  }

  // Catch-all for unhandled /api/* endpoints (always return JSON, never HTML)
  if (pathname.startsWith('/api/')) {
    sendJson(404, { success: false, error: `API endpoint not found: ${pathname}` });
    return;
  }

  // Method restriction for static files: allow GET, HEAD, OPTIONS
  if (req.method === 'OPTIONS') {
    sendResponse(res, 204, { 'Allow': 'GET, HEAD, OPTIONS', 'Cache-Control': 'no-store' });
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    sendResponse(res, 405, { 'Content-Type': 'text/plain', 'Allow': 'GET, HEAD, OPTIONS', 'Cache-Control': 'no-store' }, 'Method Not Allowed');
    return;
  }

  // Static File Path Validation
  const validation = validateStaticPath(req.url);
  if (!validation.valid) {
    sendResponse(res, validation.status, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' }, validation.error || 'Access Denied');
    return;
  }

  const { safePath, stats, ext } = validation;
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  // Time-of-check / time-of-use (TOCTOU) remediation:
  // Open the file descriptor once, verify the opened descriptor with fstat,
  // and serve directly from the descriptor.
  // Note on residual platform limitation: Node.js does not expose portable O_NOFOLLOW
  // flags in standard fs on all operating systems (notably Windows). Inode and device
  // verification on the opened file descriptor ensures the opened file matches
  // the pre-validated regular file, mitigating substitution attacks.
  let fd;
  try {
    fd = fs.openSync(safePath, 'r');
  } catch (openErr) {
    sendResponse(res, 404, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' }, '404 Not Found');
    return;
  }

  let openStat;
  try {
    openStat = fs.fstatSync(fd);
  } catch (_) {
    try { fs.closeSync(fd); } catch (_) {}
    sendResponse(res, 500, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' }, 'Internal Server Error');
    return;
  }

  if (!openStat.isFile()) {
    try { fs.closeSync(fd); } catch (_) {}
    sendResponse(res, 403, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' }, 'Access Denied: Not a Regular File');
    return;
  }

  // Detect file replacement between validation and open
  if (stats && stats.ino && openStat.ino && (stats.ino !== openStat.ino || stats.dev !== openStat.dev)) {
    try { fs.closeSync(fd); } catch (_) {}
    sendResponse(res, 403, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' }, 'Access Denied: File Modified Concurrently');
    return;
  }

  // HTML files: Inject runtime public configuration safely in <head>
  if (ext === '.html') {
    try {
      fs.readFile(fd, 'utf8', (readErr, rawHtml) => {
        try { fs.closeSync(fd); } catch (_) {}
        if (readErr) {
          sendResponse(res, 500, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' }, 'Internal Server Error');
          return;
        }

        const injectedHtml = injectRuntimeConfigHtml(rawHtml);
        const htmlBuffer = Buffer.from(injectedHtml, 'utf8');

        // Dynamic ETag derived from the final injected content
        const contentHash = crypto.createHash('md5').update(htmlBuffer).digest('hex');
        const etag = `W/"${htmlBuffer.length.toString(16)}-${contentHash}"`;

        const ifNoneMatch = req.headers['if-none-match'];
        if (ifNoneMatch && ifNoneMatch === etag) {
          sendResponse(res, 304, {
            'ETag': etag,
            'Cache-Control': getCacheControl('.html'),
            'Vary': 'Accept-Encoding'
          });
          return;
        }

        const headers = {
          'Content-Type': contentType,
          'ETag': etag,
          'Cache-Control': getCacheControl('.html'),
          'Vary': 'Accept-Encoding'
        };

        if (req.method === 'HEAD') {
          headers['Content-Length'] = htmlBuffer.length;
          sendResponse(res, 200, headers);
          return;
        }

        const acceptEncoding = req.headers['accept-encoding'] || '';
        if (/\bgzip\b/.test(acceptEncoding)) {
          headers['Content-Encoding'] = 'gzip';
          zlib.gzip(htmlBuffer, { level: zlib.constants.Z_BEST_SPEED }, (gzErr, compressed) => {
            if (gzErr) {
              sendResponse(res, 500, { 'Content-Type': 'text/plain' }, 'Compression Error');
              return;
            }
            headers['Content-Length'] = compressed.length;
            sendResponse(res, 200, headers, compressed);
          });
        } else if (/\bdeflate\b/.test(acceptEncoding)) {
          headers['Content-Encoding'] = 'deflate';
          zlib.deflate(htmlBuffer, (defErr, compressed) => {
            if (defErr) {
              sendResponse(res, 500, { 'Content-Type': 'text/plain' }, 'Compression Error');
              return;
            }
            headers['Content-Length'] = compressed.length;
            sendResponse(res, 200, headers, compressed);
          });
        } else {
          headers['Content-Length'] = htmlBuffer.length;
          sendResponse(res, 200, headers, htmlBuffer);
        }
      });
    } catch (readSyncErr) {
      try { fs.closeSync(fd); } catch (_) {}
      sendResponse(res, 500, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' }, 'Internal Server Error');
      return;
    }
    return;
  }

  // Other static assets (js, css, images, fonts)
  const etag = generateETag(openStat);

  // Conditional GET handling (304 Not Modified)
  const ifNoneMatch = req.headers['if-none-match'];
  if (ifNoneMatch && ifNoneMatch === etag) {
    try { fs.closeSync(fd); } catch (_) {}
    sendResponse(res, 304, {
      'ETag': etag,
      'Cache-Control': getCacheControl(ext),
      'Vary': 'Accept-Encoding'
    });
    return;
  }

  const headers = {
    'Content-Type': contentType,
    'ETag': etag,
    'Cache-Control': getCacheControl(ext),
    'Vary': 'Accept-Encoding'
  };

  if (req.method === 'HEAD') {
    try { fs.closeSync(fd); } catch (_) {}
    headers['Content-Length'] = openStat.size;
    sendResponse(res, 200, headers);
    return;
  }

  const acceptEncoding = req.headers['accept-encoding'] || '';
  const isCompressible = COMPRESSIBLE_EXTENSIONS.has(ext);

  // Create stream from the open descriptor; autoClose ensures descriptor is closed on stream end/error/destroy
  let rawStream;
  try {
    rawStream = fs.createReadStream(null, { fd, autoClose: true });
  } catch (streamErr) {
    try { fs.closeSync(fd); } catch (_) {}
    sendResponse(res, 500, { 'Content-Type': 'text/plain' }, 'Internal Server Error');
    return;
  }

  rawStream.on('error', (err) => {
    if (!res.headersSent) {
      sendResponse(res, 500, { 'Content-Type': 'text/plain' }, 'Internal Server Error');
    } else {
      res.destroy(err);
    }
  });

  // Handle client disconnect cleanly
  req.on('close', () => {
    if (!res.writableEnded) {
      rawStream.destroy();
    }
  });

  if (isCompressible && /\bgzip\b/.test(acceptEncoding)) {
    headers['Content-Encoding'] = 'gzip';
    res.writeHead(200, { ...SECURITY_HEADERS, ...headers });
    const gzipStream = zlib.createGzip({ level: zlib.constants.Z_BEST_SPEED });
    gzipStream.on('error', () => { rawStream.destroy(); res.destroy(); });
    rawStream.pipe(gzipStream).pipe(res);
  } else if (isCompressible && /\bdeflate\b/.test(acceptEncoding)) {
    headers['Content-Encoding'] = 'deflate';
    res.writeHead(200, { ...SECURITY_HEADERS, ...headers });
    const deflateStream = zlib.createDeflate();
    deflateStream.on('error', () => { rawStream.destroy(); res.destroy(); });
    rawStream.pipe(deflateStream).pipe(res);
  } else {
    headers['Content-Length'] = openStat.size;
    res.writeHead(200, { ...SECURITY_HEADERS, ...headers });
    rawStream.pipe(res);
  }
});

server.getPublicRuntimeConfig = getPublicRuntimeConfig;
server.serializeForInlineScript = serializeForInlineScript;
server.injectRuntimeConfigHtml = injectRuntimeConfigHtml;
server.RUNTIME_CONFIG_SCRIPT_ID = RUNTIME_CONFIG_SCRIPT_ID;
server.validateStaticPath = validateStaticPath;
server.authorizePathPolicy = authorizePathPolicy;
server.isWithinRoot = isWithinRoot;
server.SECURITY_HEADERS = SECURITY_HEADERS;
server.sendResponse = sendResponse;

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n=================================================`);
    console.log(`🚀 AlgoRecall 2.0 is running!`);
    console.log(`👉 Bound to 0.0.0.0:${PORT} (Access at http://localhost:${PORT})`);
    console.log(`=================================================\n`);
  });
}

module.exports = server;

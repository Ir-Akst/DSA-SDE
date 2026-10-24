/**
 * AlgoRecall — Embedded 5-User File Storage & Authentication Service
 * 
 * Provides lightweight, zero-dependency embedded file storage for small teams/study groups (up to 5 users).
 * Removes all database and cloud setup complexity (no Supabase, PostgreSQL, migrations, or connection strings).
 * 
 * STORAGE:
 * - data/users.json: Hashed user credentials and profiles
 * - data/snapshots/<userId>.json: Learner progress, SRS states, gamification, and dynamic roadmap
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SNAPSHOTS_DIR = path.join(DATA_DIR, 'snapshots');
const MAX_USERS = parseInt(process.env.MAX_USERS, 10) || 5;

// In-memory active session tokens: token -> { user, expiresAt }
const activeSessions = new Map();
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(SNAPSHOTS_DIR)) {
    fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2), 'utf8');
  }
}

function readUsers() {
  ensureDirectories();
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (_) {
    return [];
  }
}

function writeUsers(users) {
  ensureDirectories();
  const tmpFile = `${USERS_FILE}.tmp.${Date.now()}`;
  fs.writeFileSync(tmpFile, JSON.stringify(users, null, 2), 'utf8');
  fs.renameSync(tmpFile, USERS_FILE);
}

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function cleanUser(u) {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName || u.username,
    createdAt: u.createdAt
  };
}

function createSession(user) {
  const token = crypto.randomBytes(32).toString('hex');
  const session = {
    user: cleanUser(user),
    expiresAt: Date.now() + SESSION_TTL_MS
  };
  activeSessions.set(token, session);
  return token;
}

const EmbeddedStore = {
  MAX_USERS,

  init() {
    ensureDirectories();
  },

  listUsers() {
    const users = readUsers();
    return users.map(cleanUser);
  },

  register(username, password, displayName) {
    if (!username || typeof username !== 'string') {
      return { success: false, error: 'Username is required' };
    }
    const cleanUName = username.trim().toLowerCase();
    if (cleanUName.length < 3 || cleanUName.length > 30) {
      return { success: false, error: 'Username must be between 3 and 30 characters' };
    }
    if (!/^[a-z0-9_-]+$/.test(cleanUName)) {
      return { success: false, error: 'Username can only contain letters, numbers, hyphens, and underscores' };
    }

    if (!password || typeof password !== 'string' || password.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters long' };
    }

    const users = readUsers();
    if (users.length >= MAX_USERS) {
      return { success: false, error: `Maximum capacity reached: this app instance is configured for ${MAX_USERS} users.` };
    }

    if (users.some(u => u.username.toLowerCase() === cleanUName)) {
      return { success: false, error: 'Username is already taken' };
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);
    const newUser = {
      id: `usr_${crypto.randomUUID()}`,
      username: cleanUName,
      displayName: (typeof displayName === 'string' && displayName.trim()) ? displayName.trim() : cleanUName,
      salt,
      passwordHash,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    writeUsers(users);

    const token = createSession(newUser);
    return {
      success: true,
      token,
      user: cleanUser(newUser)
    };
  },

  login(username, password) {
    if (!username || !password) {
      return { success: false, error: 'Username and password are required' };
    }
    const cleanUName = username.trim().toLowerCase();
    const users = readUsers();
    const user = users.find(u => u.username.toLowerCase() === cleanUName);

    if (!user) {
      return { success: false, error: 'Invalid username or password' };
    }

    const testHash = hashPassword(password, user.salt);
    const bufA = Buffer.from(testHash, 'hex');
    const bufB = Buffer.from(user.passwordHash, 'hex');

    if (bufA.length !== bufB.length || !crypto.timingSafeEqual(bufA, bufB)) {
      return { success: false, error: 'Invalid username or password' };
    }

    const token = createSession(user);
    return {
      success: true,
      token,
      user: cleanUser(user)
    };
  },

  validateToken(token) {
    if (!token || typeof token !== 'string') return null;
    const session = activeSessions.get(token);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      activeSessions.delete(token);
      return null;
    }
    return session.user;
  },

  logout(token) {
    if (token) {
      activeSessions.delete(token);
    }
    return { success: true };
  },

  getSnapshot(userId) {
    ensureDirectories();
    const snapPath = path.join(SNAPSHOTS_DIR, `${userId}.json`);
    if (!fs.existsSync(snapPath)) {
      return { success: true, exists: false, version: 0, snapshot: null };
    }
    try {
      const content = fs.readFileSync(snapPath, 'utf8');
      const data = JSON.parse(content);
      return {
        success: true,
        exists: true,
        version: data.version || 1,
        updatedAt: data.updatedAt || new Date().toISOString(),
        snapshot: data.snapshot || {}
      };
    } catch (err) {
      return { success: false, exists: false, error: `Failed to read snapshot: ${err.message}` };
    }
  },

  saveSnapshot(userId, snapshotPayload) {
    ensureDirectories();
    const snapPath = path.join(SNAPSHOTS_DIR, `${userId}.json`);
    let currentVersion = 0;
    if (fs.existsSync(snapPath)) {
      try {
        const existing = JSON.parse(fs.readFileSync(snapPath, 'utf8'));
        currentVersion = existing.version || 0;
      } catch (_) {}
    }

    const nextVersion = currentVersion + 1;
    const now = new Date().toISOString();
    const record = {
      userId,
      version: nextVersion,
      updatedAt: now,
      snapshot: snapshotPayload
    };

    const tmpFile = `${snapPath}.tmp.${Date.now()}`;
    fs.writeFileSync(tmpFile, JSON.stringify(record, null, 2), 'utf8');
    fs.renameSync(tmpFile, snapPath);

    return {
      success: true,
      version: nextVersion,
      updatedAt: now
    };
  }
};

module.exports = EmbeddedStore;

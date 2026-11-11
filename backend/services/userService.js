const crypto = require('crypto');

// Stores user accounts and login tokens.
//
// TEMPORARY: like resultService, this lives in memory until the database
// card lands. That card only needs to replace createUser, findByUsername and
// findById with database calls. Tokens can move to the database (or become
// JWTs) the same way.
//
// Passwords are never stored. We keep a salted scrypt hash (built into Node,
// so no extra dependency).

const users = new Map(); // id -> { id, username, passwordHash, createdAt }
const usernameIndex = new Map(); // lowercase username -> id
const tokens = new Map(); // token -> { userId, expiresAt }

const SCRYPT_KEY_LENGTH = 64;
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEY_LENGTH);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

function verifyHash(password, stored) {
  const [saltHex, hashHex] = stored.split(':');
  const expected = Buffer.from(hashHex, 'hex');
  const actual = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

// Used when the username doesn't exist, so a login for an unknown user takes
// about as long as a wrong password and doesn't reveal which usernames exist.
const DUMMY_HASH = hashPassword('not-a-real-password');

// Public view of a user. Never includes the password hash.
function toPublic(user) {
  return { id: user.id, username: user.username };
}

// Returns the new user, or null when the username is already taken
// (usernames are not case sensitive: "Ana" and "ana" are the same).
function createUser(username, password) {
  const key = username.toLowerCase();
  if (usernameIndex.has(key)) return null;

  const user = {
    id: crypto.randomUUID(),
    username,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  users.set(user.id, user);
  usernameIndex.set(key, user.id);
  return user;
}

function findByUsername(username) {
  const id = usernameIndex.get(username.toLowerCase());
  return id ? users.get(id) : null;
}

function findById(id) {
  return users.get(id) || null;
}

// Returns the user when the password is right, otherwise null.
function checkCredentials(username, password) {
  const user = findByUsername(username);
  const ok = verifyHash(password, user ? user.passwordHash : DUMMY_HASH);
  return user && ok ? user : null;
}

function createToken(userId, now = Date.now()) {
  const token = crypto.randomBytes(32).toString('hex');
  tokens.set(token, { userId, expiresAt: now + TOKEN_TTL_MS });
  return token;
}

// Returns the user a token belongs to, or null if it is unknown or expired.
function getUserByToken(token, now = Date.now()) {
  const entry = tokens.get(token);
  if (!entry) return null;
  if (entry.expiresAt <= now) {
    tokens.delete(token);
    return null;
  }
  return findById(entry.userId);
}

module.exports = {
  TOKEN_TTL_MS,
  createUser,
  findByUsername,
  findById,
  checkCredentials,
  createToken,
  getUserByToken,
  toPublic,
};

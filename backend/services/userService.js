const crypto = require('crypto');

const users = new Map();
const usernames = new Map();
const tokens = new Map();

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return salt + ':' + hash;
}

function passwordMatches(password, saved) {
  const [salt, hash] = saved.split(':');
  const newHash = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(newHash, Buffer.from(hash, 'hex'));
}

function toPublic(user) {
  return { id: user.id, username: user.username };
}

function createUser(username, password) {
  if (usernames.has(username.toLowerCase())) return null;

  const user = {
    id: crypto.randomUUID(),
    username,
    passwordHash: hashPassword(password),
  };
  users.set(user.id, user);
  usernames.set(username.toLowerCase(), user.id);
  return user;
}

function findByUsername(username) {
  const id = usernames.get(username.toLowerCase());
  return id ? users.get(id) : null;
}

function checkCredentials(username, password) {
  const user = findByUsername(username);
  if (!user) return null;
  if (!passwordMatches(password, user.passwordHash)) return null;
  return user;
}

function createToken(userId, now = Date.now()) {
  const token = crypto.randomBytes(32).toString('hex');
  tokens.set(token, { userId, expiresAt: now + TOKEN_TTL_MS });
  return token;
}

function getUserByToken(token, now = Date.now()) {
  const saved = tokens.get(token);
  if (!saved) return null;
  if (saved.expiresAt <= now) {
    tokens.delete(token);
    return null;
  }
  return users.get(saved.userId) || null;
}

module.exports = {
  TOKEN_TTL_MS,
  createUser,
  findByUsername,
  checkCredentials,
  createToken,
  getUserByToken,
  toPublic,
};

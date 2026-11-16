const crypto = require('crypto');
const { getSupabase, usingSupabase } = require('../supabase');

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Used when DATA_STORE is not "supabase" (the tests). Lost on restart.
const users = new Map();
const usernames = new Map();
const tokens = new Map();

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

// Only a fingerprint of each login token is stored, never the token itself.
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function fromRow(row) {
  return { id: row.id, username: row.username, passwordHash: row.password_hash };
}

// Returns the new user, or null when the username is already taken.
async function createUser(username, password) {
  if (usingSupabase()) {
    const { data, error } = await getSupabase()
      .from('players')
      .insert({ username, password_hash: hashPassword(password) })
      .select()
      .single();
    if (error) {
      if (error.code === '23505') return null; // unique violation: name taken
      throw new Error(error.message);
    }
    return fromRow(data);
  }

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

async function findByUsername(username) {
  if (usingSupabase()) {
    const { data, error } = await getSupabase()
      .from('players')
      .select('*')
      .eq('username_lower', username.toLowerCase())
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? fromRow(data) : null;
  }

  const id = usernames.get(username.toLowerCase());
  return id ? users.get(id) : null;
}

async function checkCredentials(username, password) {
  const user = await findByUsername(username);
  if (!user) return null;
  if (!passwordMatches(password, user.passwordHash)) return null;
  return user;
}

// Used before a run starts, so a score is never saved for a player that
// doesn't exist.
async function playerExists(id) {
  if (!usingSupabase()) return true;
  if (!UUID.test(id)) return false;

  const { data, error } = await getSupabase()
    .from('players')
    .select('id')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}

async function createToken(userId, now = Date.now()) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = now + TOKEN_TTL_MS;

  if (usingSupabase()) {
    const { error } = await getSupabase().from('auth_tokens').insert({
      token_hash: hashToken(token),
      player_id: userId,
      expires_at: new Date(expiresAt).toISOString(),
    });
    if (error) throw new Error(error.message);
  } else {
    tokens.set(token, { userId, expiresAt });
  }
  return token;
}

async function getUserByToken(token, now = Date.now()) {
  if (typeof token !== 'string') return null;

  if (usingSupabase()) {
    const tokenHash = hashToken(token);
    const { data, error } = await getSupabase()
      .from('auth_tokens')
      .select('expires_at, players(id, username, password_hash)')
      .eq('token_hash', tokenHash)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data || !data.players) return null;

    if (Date.parse(data.expires_at) <= now) {
      await getSupabase().from('auth_tokens').delete().eq('token_hash', tokenHash);
      return null;
    }
    return fromRow(data.players);
  }

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
  playerExists,
  createToken,
  getUserByToken,
  toPublic,
};

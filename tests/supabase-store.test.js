// Checks our Supabase code (players, login tokens, results) against a small
// fake of the Supabase client, so it runs offline and never touches the real
// database. It proves our logic, not Supabase itself, so also try the real
// thing once with DATA_STORE=supabase.
process.env.DATA_STORE = 'supabase';

const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');

// ---- A tiny fake of the parts of supabase-js we use ----------------------
function createFakeSupabase() {
  const tables = { players: [], auth_tokens: [], results: [] };
  let nextResultId = 1;

  function insertRow(table, payload) {
    if (table === 'players') {
      const row = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        username_lower: payload.username.toLowerCase(),
        ...payload,
      };
      if (tables.players.some((p) => p.username_lower === row.username_lower)) {
        return { error: { code: '23505', message: 'duplicate key value' } };
      }
      tables.players.push(row);
      return { row };
    }
    if (table === 'auth_tokens') {
      if (!tables.players.some((p) => p.id === payload.player_id)) {
        return { error: { code: '23503', message: 'foreign key violation' } };
      }
      tables.auth_tokens.push({ ...payload });
      return { row: payload };
    }
    if (table === 'results') {
      if (payload.player_id && !tables.players.some((p) => p.id === payload.player_id)) {
        return { error: { code: '23503', message: 'foreign key violation' } };
      }
      const row = { id: nextResultId++, ...payload, player_id: payload.player_id ?? null };
      tables.results.push(row);
      return { row };
    }
    throw new Error(`unknown table ${table}`);
  }

  function withEmbed(table, row, columns) {
    if (!columns || !columns.includes('players(')) return row;
    const player = tables.players.find((p) => p.id === row.player_id) || null;
    return { ...row, players: player };
  }

  function from(table) {
    const q = { op: 'select', filters: [], orders: [], limit: null, payload: null, columns: null, returning: false, one: null };
    const builder = {
      select(columns) { q.columns = columns; q.returning = true; return builder; },
      insert(payload) { q.op = 'insert'; q.payload = payload; return builder; },
      delete() { q.op = 'delete'; return builder; },
      eq(column, value) { q.filters.push([column, value]); return builder; },
      order(column, { ascending = true } = {}) { q.orders.push([column, ascending]); return builder; },
      limit(n) { q.limit = n; return builder; },
      single() { q.one = 'single'; return builder; },
      maybeSingle() { q.one = 'maybe'; return builder; },
      then(resolve, reject) { return Promise.resolve(run()).then(resolve, reject); },
    };

    function run() {
      if (q.op === 'insert') {
        const { row, error } = insertRow(table, q.payload);
        if (error) return { data: null, error };
        return { data: q.returning ? withEmbed(table, row, q.columns) : null, error: null };
      }
      if (q.op === 'delete') {
        tables[table] = tables[table].filter((r) => !q.filters.every(([c, v]) => r[c] === v));
        return { data: null, error: null };
      }
      let rows = tables[table].filter((r) => q.filters.every(([c, v]) => r[c] === v));
      for (const [column, ascending] of [...q.orders].reverse()) {
        rows = rows.slice().sort((a, b) => {
          const x = a[column]; const y = b[column];
          const cmp = x < y ? -1 : x > y ? 1 : 0;
          return ascending ? cmp : -cmp;
        });
      }
      if (q.limit !== null) rows = rows.slice(0, q.limit);
      rows = rows.map((r) => withEmbed(table, r, q.columns));
      if (q.one === 'maybe') return { data: rows[0] ?? null, error: null };
      if (q.one === 'single') {
        return rows.length === 1
          ? { data: rows[0], error: null }
          : { data: null, error: { message: 'expected one row' } };
      }
      return { data: rows, error: null };
    }
    return builder;
  }

  return { tables, client: { from } };
}

// Put the fake where the services will find it, before they load.
const fake = createFakeSupabase();
const supabasePath = require.resolve('../backend/supabase');
require.cache[supabasePath] = {
  id: supabasePath,
  filename: supabasePath,
  loaded: true,
  exports: { getSupabase: () => fake.client, usingSupabase: () => true },
};

const userService = require('../backend/services/userService');
const resultService = require('../backend/services/resultService');
const sessionService = require('../backend/services/sessionService');

// ---- Players -------------------------------------------------------------
test('a new player is stored, and usernames are unique ignoring capitals', async () => {
  const ana = await userService.createUser('Ana_1', 'secret123');
  assert.match(ana.id, /^[0-9a-f-]{36}$/);
  assert.strictEqual(ana.username, 'Ana_1');
  assert.strictEqual(await userService.createUser('ana_1', 'other-pass-1'), null);
  assert.strictEqual(fake.tables.players.length, 1);
});

test('the password is stored hashed and login checks it', async () => {
  await userService.createUser('Ben', 'secret123');
  assert.ok(!JSON.stringify(fake.tables.players).includes('secret123'));
  assert.ok(await userService.checkCredentials('ben', 'secret123'));
  assert.strictEqual(await userService.checkCredentials('ben', 'wrong-pass'), null);
  assert.strictEqual(await userService.checkCredentials('nobody', 'secret123'), null);
});

test('playerExists only accepts real players', async () => {
  const cai = await userService.createUser('Cai', 'secret123');
  assert.strictEqual(await userService.playerExists(cai.id), true);
  assert.strictEqual(await userService.playerExists(crypto.randomUUID()), false);
  assert.strictEqual(await userService.playerExists('not-a-uuid'), false);
});

// ---- Login tokens --------------------------------------------------------
test('login tokens are stored hashed, work, and expire', async () => {
  const dee = await userService.createUser('Dee', 'secret123');
  const now = Date.now();
  const token = await userService.createToken(dee.id, now);

  assert.ok(!JSON.stringify(fake.tables.auth_tokens).includes(token));
  assert.strictEqual((await userService.getUserByToken(token, now + 1000)).id, dee.id);
  assert.strictEqual(await userService.getUserByToken('wrong', now), null);

  const before = fake.tables.auth_tokens.length;
  assert.strictEqual(await userService.getUserByToken(token, now + userService.TOKEN_TTL_MS + 1), null);
  assert.strictEqual(fake.tables.auth_tokens.length, before - 1); // expired token cleaned up
});

// ---- Results and leaderboard ---------------------------------------------
test('results are ranked and show usernames (null for guests)', async () => {
  const eli = await userService.createUser('Eli', 'secret123');
  const fay = await userService.createUser('Fay', 'secret123');
  const save = (playerId, score, gamesCompleted, date) =>
    resultService.saveResult({ playerId, score, gamesCompleted, bestStreak: gamesCompleted, date });

  await save(eli.id, 500, 5, '2026-11-04T10:00:00.000Z');
  await save(fay.id, 900, 4, '2026-11-04T09:00:00.000Z');
  await save(null, 500, 5, '2026-11-04T08:00:00.000Z'); // ties Eli's run, but earlier
  await save(fay.id, 700, 5, '2026-11-04T11:00:00.000Z');

  const top = await resultService.getTopResults({ limit: 10 });
  assert.deepStrictEqual(top.map((r) => r.username), ['Fay', null, 'Eli', 'Fay']);
  assert.deepStrictEqual(top.map((r) => r.score), [700, 500, 500, 900]);
  assert.strictEqual(typeof top[0].date, 'string');
  assert.ok(!Number.isNaN(Date.parse(top[0].date)));

  assert.strictEqual((await resultService.getTopResults({ limit: 2 })).length, 2);
  const mine = await resultService.getTopResults({ playerId: fay.id });
  assert.deepStrictEqual(mine.map((r) => r.score), [700, 900]);
  assert.deepStrictEqual(await resultService.getTopResults({ playerId: 'not-a-uuid' }), []);
});

test('saving a run for a player that does not exist fails loudly', async () => {
  await assert.rejects(
    resultService.saveResult({
      playerId: crypto.randomUUID(), score: 1, gamesCompleted: 1, bestStreak: 1, date: new Date().toISOString(),
    }),
    /foreign key/,
  );
});

// ---- A whole run ----------------------------------------------------------
test('a finished run is saved once and a failed save is retried', async () => {
  const gus = await userService.createUser('Gus', 'secret123');
  const start = 5_000_000;
  const session = sessionService.createSession({ playerId: gus.id }, start);
  sessionService.applyResult(session, true, start);

  const first = await sessionService.finishSession(session, start + 200_000);
  const second = await sessionService.finishSession(session, start + 200_000);
  assert.strictEqual(first.id, second.id);
  assert.strictEqual(fake.tables.results.filter((r) => r.player_id === gus.id).length, 1);

  // Make the first save attempt fail, then let the expiry check retry.
  const hal = await userService.createUser('Hal', 'secret123');
  const other = sessionService.createSession({ playerId: hal.id }, start);
  const realSave = resultService.saveResult;
  let calls = 0;
  const originalConsoleError = console.error;
  console.error = () => {};
  const failingFrom = fake.client.from;
  fake.client.from = (table) => {
    if (table === 'results' && calls++ === 0) {
      const b = { insert: () => b, select: () => b, single: () => b, then: (res) => Promise.resolve({ data: null, error: { message: 'db down' } }).then(res) };
      return b;
    }
    return failingFrom(table);
  };
  try {
    assert.strictEqual(await sessionService.finishExpiredSessions(start + 200_000), 1);
    assert.strictEqual(fake.tables.results.filter((r) => r.player_id === hal.id).length, 0);
    assert.strictEqual(await sessionService.finishExpiredSessions(start + 205_000), 1);
    assert.strictEqual(fake.tables.results.filter((r) => r.player_id === hal.id).length, 1);
    assert.strictEqual(await sessionService.finishExpiredSessions(start + 210_000), 0);
  } finally {
    fake.client.from = failingFrom;
    console.error = originalConsoleError;
    assert.strictEqual(resultService.saveResult, realSave);
    assert.ok(other.finalResult);
  }
});

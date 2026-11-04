const test = require('node:test');
const assert = require('node:assert');
const app = require('../backend/server');
const resultService = require('../backend/services/resultService');
const sessionService = require('../backend/services/sessionService');

async function withServer(fn) {
  const server = app.listen(0);
  const { port } = server.address();
  try {
    await fn(`http://localhost:${port}`);
  } finally {
    server.close();
  }
}

async function getBoard(base, query = '') {
  const res = await fetch(`${base}/api/leaderboard${query}`);
  return { status: res.status, body: await res.json() };
}

function save(playerId, score, gamesCompleted, date) {
  resultService.saveResult({ playerId, score, gamesCompleted, bestStreak: gamesCompleted, date });
}

test('empty leaderboard returns an empty list', async () => {
  await withServer(async (base) => {
    const { status, body } = await getBoard(base);
    assert.strictEqual(status, 200);
    assert.deepStrictEqual(body, { success: true, leaderboard: [] });
  });
});

test('ranks by games completed, then score, then earliest date', async () => {
  save('ana', 500, 5, '2026-11-04T10:00:00.000Z');
  save('ben', 900, 4, '2026-11-04T09:00:00.000Z');
  save('cai', 500, 5, '2026-11-04T08:00:00.000Z'); // ties ana, but earlier
  save('dee', 700, 5, '2026-11-04T11:00:00.000Z');

  await withServer(async (base) => {
    const { body } = await getBoard(base);
    assert.deepStrictEqual(
      body.leaderboard.map((r) => [r.rank, r.playerId]),
      [[1, 'dee'], [2, 'cai'], [3, 'ana'], [4, 'ben']],
    );
    assert.deepStrictEqual(Object.keys(body.leaderboard[0]).sort(), [
      'bestStreak', 'date', 'gamesCompleted', 'playerId', 'rank', 'score',
    ]);
  });
});

test('shows the Top 10 by default and respects limit', async () => {
  for (let i = 0; i < 12; i += 1) save('bulk', i * 10, 1, `2026-11-03T00:00:${String(i).padStart(2, '0')}.000Z`);
  await withServer(async (base) => {
    assert.strictEqual((await getBoard(base)).body.leaderboard.length, 10);
    assert.strictEqual((await getBoard(base, '?limit=3')).body.leaderboard.length, 3);
  });
});

test('playerId gives one player their own Top 10', async () => {
  save('solo', 100, 1, '2026-11-04T12:00:00.000Z');
  save('solo', 300, 3, '2026-11-04T12:05:00.000Z');
  await withServer(async (base) => {
    const { body } = await getBoard(base, '?playerId=solo');
    assert.deepStrictEqual(body.leaderboard.map((r) => [r.rank, r.score]), [[1, 300], [2, 100]]);
  });
});

test('a finished game shows up on the leaderboard', async () => {
  await withServer(async (base) => {
    const post = (path, b) => fetch(`${base}${path}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b),
    });
    const { sessionId } = await (await post('/api/game/start', { playerId: 'live' })).json();
    await post('/api/game/result', { sessionId, success: true });
    sessionService.getSession(sessionId).endsAt = Date.now() - 1;
    await post('/api/game/end', { sessionId });

    const { body } = await getBoard(base, '?playerId=live');
    assert.strictEqual(body.leaderboard.length, 1);
    assert.strictEqual(body.leaderboard[0].score, 100);
    assert.strictEqual(body.leaderboard[0].gamesCompleted, 1);
  });
});

test('bad query values get a clear 400', async () => {
  await withServer(async (base) => {
    for (const [query, message] of [
      ['?limit=0', 'limit must be between 1 and 50'],
      ['?limit=51', 'limit must be between 1 and 50'],
      ['?limit=abc', 'limit must be a whole number'],
      ['?limit=1&limit=2', 'limit must be a whole number'],
      ['?playerId[]=x', 'playerId must be a string'],
    ]) {
      const { status, body } = await getBoard(base, query);
      assert.strictEqual(status, 400, query);
      assert.deepStrictEqual(body, { success: false, message }, query);
    }
  });
});

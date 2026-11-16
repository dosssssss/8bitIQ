const test = require('node:test');
const assert = require('node:assert');
const app = require('../backend/server');
const sessionService = require('../backend/services/sessionService');
const resultService = require('../backend/services/resultService');

async function withServer(fn) {
  const server = app.listen(0);
  const { port } = server.address();
  try {
    await fn(`http://localhost:${port}`);
  } finally {
    server.close();
  }
}

function post(base, path, body) {
  return fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function savedFor(sessionPlayerId) {
  return (await resultService.listResults()).filter((r) => r.playerId === sessionPlayerId);
}

test('ending a finished game returns the final result and saves it once', async () => {
  await withServer(async (base) => {
    const { sessionId } = await (await post(base, '/api/game/start', { playerId: 'p-end' })).json();
    await post(base, '/api/game/result', { sessionId, success: true });
    await post(base, '/api/game/result', { sessionId, success: true });
    sessionService.getSession(sessionId).endsAt = Date.now() - 1;

    const res = await post(base, '/api/game/end', { sessionId });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.deepStrictEqual(body, {
      success: true,
      gameOver: true,
      sessionId,
      score: 200,
      gamesCompleted: 2,
      bestStreak: 2,
    });

    // A second call returns the same result without saving it again.
    const again = await (await post(base, '/api/game/end', { sessionId })).json();
    assert.strictEqual(again.score, 200);
    const saved = (await savedFor('p-end'));
    assert.strictEqual(saved.length, 1);
    assert.strictEqual(saved[0].score, 200);
    assert.strictEqual(saved[0].gamesCompleted, 2);
    assert.strictEqual(saved[0].bestStreak, 2);
    assert.ok(!Number.isNaN(Date.parse(saved[0].date)));
  });
});

test('a game cannot be ended while time is left', async () => {
  await withServer(async (base) => {
    const { sessionId } = await (await post(base, '/api/game/start', { playerId: 'p-early' })).json();
    const res = await post(base, '/api/game/end', { sessionId });
    assert.strictEqual(res.status, 409);
    const body = await res.json();
    assert.strictEqual(body.message, 'Game is still running');
    assert.ok(body.timeRemaining > 0);
    assert.strictEqual((await savedFor('p-early')).length, 0);
  });
});

test('a wrong answer that runs the clock out saves the run right away', async () => {
  await withServer(async (base) => {
    const { sessionId } = await (await post(base, '/api/game/start', { playerId: 'p-penalty' })).json();
    sessionService.getSession(sessionId).endsAt = Date.now() + 3000; // 3 seconds left
    const body = await (await post(base, '/api/game/result', { sessionId, success: false })).json();
    assert.strictEqual(body.gameOver, true);
    assert.strictEqual(body.timeRemaining, 0);
    assert.strictEqual((await savedFor('p-penalty')).length, 1);
  });
});

test('a result sent after time is up still saves the run', async () => {
  await withServer(async (base) => {
    const { sessionId } = await (await post(base, '/api/game/start', { playerId: 'p-late' })).json();
    sessionService.getSession(sessionId).endsAt = Date.now() - 1;
    const res = await post(base, '/api/game/result', { sessionId, success: true });
    assert.strictEqual(res.status, 409);
    assert.strictEqual((await savedFor('p-late')).length, 1);
  });
});

test('runs nobody ended are saved by the expiry check', async () => {
  const start = 2_000_000;
  const session = sessionService.createSession({ playerId: 'p-abandoned' }, start);
  assert.strictEqual(await sessionService.finishExpiredSessions(start + 60_000), 0);
  await sessionService.finishExpiredSessions(start + 121_000);
  assert.strictEqual(session.finished, true);
  assert.strictEqual((await savedFor('p-abandoned')).length, 1);
  await sessionService.finishExpiredSessions(start + 200_000);
  assert.strictEqual((await savedFor('p-abandoned')).length, 1);
});

test('ending the same run twice at once saves it only once', async () => {
  const start = 3_000_000;
  const session = sessionService.createSession({ playerId: 'p-twice' }, start);
  await Promise.all([
    sessionService.finishSession(session, start + 121_000),
    sessionService.finishSession(session, start + 121_000),
  ]);
  assert.strictEqual((await savedFor('p-twice')).length, 1);
});

test('end needs a valid session', async () => {
  await withServer(async (base) => {
    assert.strictEqual((await post(base, '/api/game/end', {})).status, 400);
    assert.strictEqual((await post(base, '/api/game/end', { sessionId: 'nope' })).status, 404);
  });
});

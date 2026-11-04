const test = require('node:test');
const assert = require('node:assert');
const app = require('../backend/server');
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

function post(base, path, body) {
  return fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

test('a correct answer adds 100 points, 5 seconds and 1 to the streak', async () => {
  await withServer(async (base) => {
    const { sessionId } = await (await post(base, '/api/game/start', {})).json();
    const res = await post(base, '/api/game/result', { sessionId, game: 'wordGuess', success: true });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.score, 100);
    assert.strictEqual(body.gamesCompleted, 1);
    assert.strictEqual(body.streak, 1);
    assert.strictEqual(body.gameOver, false);
    assert.ok(body.timeRemaining > 120 && body.timeRemaining <= 125);
  });
});

test('a wrong answer takes 50 points and 5 seconds and resets the streak', async () => {
  await withServer(async (base) => {
    const { sessionId } = await (await post(base, '/api/game/start', {})).json();
    await post(base, '/api/game/result', { sessionId, success: true });
    await post(base, '/api/game/result', { sessionId, success: true });
    const body = await (await post(base, '/api/game/result', { sessionId, success: false })).json();
    assert.strictEqual(body.score, 150);
    assert.strictEqual(body.gamesCompleted, 2);
    assert.strictEqual(body.streak, 0);
    assert.strictEqual(sessionService.getSession(sessionId).bestStreak, 2);
  });
});

test('score never goes below 0', () => {
  const session = sessionService.createSession();
  sessionService.applyResult(session, false);
  assert.strictEqual(session.score, 0);
});

test('time is computed from the server clock, with bonuses and penalties', () => {
  const start = 1_000_000;
  const session = sessionService.createSession({}, start);
  sessionService.applyResult(session, true, start);
  assert.strictEqual(sessionService.getTimeRemaining(session, start), 125);
  sessionService.applyResult(session, false, start);
  sessionService.applyResult(session, false, start);
  assert.strictEqual(sessionService.getTimeRemaining(session, start), 115);
});

test('a penalty that runs the clock out ends the game', () => {
  const start = 1_000_000;
  const session = sessionService.createSession({}, start);
  const almostDone = start + 117_000; // 3 seconds left
  sessionService.applyResult(session, false, almostDone);
  assert.strictEqual(sessionService.getTimeRemaining(session, almostDone), 0);
  assert.strictEqual(sessionService.isOver(session, almostDone), true);
});

test('results after the game is over are rejected', async () => {
  await withServer(async (base) => {
    const { sessionId } = await (await post(base, '/api/game/start', {})).json();
    sessionService.getSession(sessionId).endsAt = Date.now() - 1;
    const res = await post(base, '/api/game/result', { sessionId, success: true });
    assert.strictEqual(res.status, 409);
    assert.deepStrictEqual(await res.json(), { success: false, message: 'Game is over', gameOver: true });
  });
});

test('bad requests get a clear error', async () => {
  await withServer(async (base) => {
    let res = await post(base, '/api/game/result', { success: true });
    assert.strictEqual(res.status, 400);
    assert.strictEqual((await res.json()).message, 'sessionId is required');

    res = await post(base, '/api/game/result', { sessionId: 'abc', success: 'yes' });
    assert.strictEqual(res.status, 400);

    res = await post(base, '/api/game/result', { sessionId: 'does-not-exist', success: true });
    assert.strictEqual(res.status, 404);
    assert.strictEqual((await res.json()).success, false);
  });
});

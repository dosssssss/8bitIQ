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

test('POST /api/game/start returns a fresh 120s session', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/game/start`, { method: 'POST' });
    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.match(body.sessionId, /^[0-9a-f-]{36}$/);
    assert.strictEqual(body.timeRemaining, 120);
    assert.strictEqual(body.score, 0);
    assert.strictEqual(body.gamesCompleted, 0);
    assert.ok(sessionService.getSession(body.sessionId));
  });
});

test('each start creates a different session', async () => {
  await withServer(async (base) => {
    const a = await (await fetch(`${base}/api/game/start`, { method: 'POST' })).json();
    const b = await (await fetch(`${base}/api/game/start`, { method: 'POST' })).json();
    assert.notStrictEqual(a.sessionId, b.sessionId);
  });
});

test('time remaining counts down and stops at 0', () => {
  const start = 1_000_000;
  const session = sessionService.createSession({}, start);
  assert.strictEqual(sessionService.getTimeRemaining(session, start + 30_000), 90);
  assert.strictEqual(sessionService.getTimeRemaining(session, start + 500_000), 0);
});

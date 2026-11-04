const test = require('node:test');
const assert = require('node:assert');
const app = require('../backend/server');

async function withServer(fn) {
  const server = app.listen(0);
  const { port } = server.address();
  try {
    await fn(`http://localhost:${port}`);
  } finally {
    server.close();
  }
}

function send(base, path, rawBody, method = 'POST') {
  return fetch(`${base}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: rawBody,
  });
}

async function expectError(res, status, message) {
  assert.strictEqual(res.status, status);
  const body = await res.json();
  assert.strictEqual(body.success, false);
  if (message) assert.strictEqual(body.message, message);
  else assert.strictEqual(typeof body.message, 'string');
  return body;
}

test('broken JSON gets a clear 400', async () => {
  await withServer(async (base) => {
    await expectError(await send(base, '/api/game/result', '{bad json'), 400, 'Request body must be valid JSON');
  });
});

test('a JSON array instead of an object is rejected', async () => {
  await withServer(async (base) => {
    await expectError(await send(base, '/api/game/start', '[1,2]'), 400, 'Request body must be a JSON object');
  });
});

test('a body that is too large gets a 413', async () => {
  await withServer(async (base) => {
    const big = JSON.stringify({ sessionId: 'x'.repeat(200_000) });
    await expectError(await send(base, '/api/game/result', big), 413, 'Request body is too large');
  });
});

test('unknown API routes and wrong methods say what was asked for', async () => {
  await withServer(async (base) => {
    await expectError(await fetch(`${base}/api/nope`), 404, 'API route not found: GET /api/nope');
    await expectError(await fetch(`${base}/api/game/start`), 404, 'API route not found: GET /api/game/start');
  });
});

test('field checks on /api/game/result', async () => {
  await withServer(async (base) => {
    const cases = [
      [{ success: true }, 'sessionId is required'],
      [{ sessionId: '   ', success: true }, 'sessionId is required'],
      [{ sessionId: 123, success: true }, 'sessionId must be a string'],
      [{ sessionId: 'x'.repeat(101), success: true }, 'sessionId must be at most 100 characters'],
      [{ sessionId: 'abc' }, 'success is required'],
      [{ sessionId: 'abc', success: 'true' }, 'success must be true or false'],
      [{ sessionId: 'abc', success: true, game: 5 }, 'game must be a string'],
    ];
    for (const [body, message] of cases) {
      await expectError(await send(base, '/api/game/result', JSON.stringify(body)), 400, message);
    }
  });
});

test('playerId on /api/game/start must be a string when given', async () => {
  await withServer(async (base) => {
    await expectError(
      await send(base, '/api/game/start', JSON.stringify({ playerId: { evil: true } })),
      400,
      'playerId must be a string',
    );
    const ok = await send(base, '/api/game/start', JSON.stringify({ playerId: 'p1' }));
    assert.strictEqual(ok.status, 201);
    assert.strictEqual((await ok.json()).success, true);
  });
});

test('/api/game/end checks sessionId', async () => {
  await withServer(async (base) => {
    await expectError(await send(base, '/api/game/end', '{}'), 400, 'sessionId is required');
    await expectError(await send(base, '/api/game/end', JSON.stringify({ sessionId: 'nope' })), 404, 'Game session not found');
  });
});

test('unexpected server errors hide internal details', async () => {
  const express = require('express');
  const { errorHandler } = require('../backend/middleware/errorHandler');
  const broken = express();
  broken.get('/boom', () => {
    throw new Error('secret database password in here');
  });
  broken.use(errorHandler);

  const originalError = console.error;
  console.error = () => {};
  const server = broken.listen(0);
  try {
    const res = await fetch(`http://localhost:${server.address().port}/boom`);
    const body = await expectError(res, 500, 'Something went wrong on the server');
    assert.ok(!JSON.stringify(body).includes('secret'));
  } finally {
    server.close();
    console.error = originalError;
  }
});

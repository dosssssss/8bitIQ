const test = require('node:test');
const assert = require('node:assert');
const app = require('../backend/server');
const userService = require('../backend/services/userService');

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

// Usernames must be unique across tests, since users live in memory.
let counter = 0;
const uniqueName = () => `player_${Date.now().toString(36)}_${counter++}`;

test('POST /api/register creates an account and returns a token', async () => {
  await withServer(async (base) => {
    const username = uniqueName();
    const res = await post(base, '/api/register', { username, password: 'secret123' });
    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.user.username, username);
    assert.match(body.user.id, /^[0-9a-f-]{36}$/);
    assert.match(body.token, /^[0-9a-f]{64}$/);
    assert.strictEqual(userService.getUserByToken(body.token).id, body.user.id);
  });
});

test('the response never includes the password or its hash', async () => {
  await withServer(async (base) => {
    const res = await post(base, '/api/register', { username: uniqueName(), password: 'secret123' });
    const text = JSON.stringify(await res.json());
    assert.ok(!text.includes('secret123'));
    assert.ok(!/passwordHash/i.test(text));
  });
});

test('registering a taken username is rejected, ignoring case', async () => {
  await withServer(async (base) => {
    const username = uniqueName();
    await post(base, '/api/register', { username, password: 'secret123' });
    const res = await post(base, '/api/register', { username: username.toUpperCase(), password: 'other-pass1' });
    assert.strictEqual(res.status, 409);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.match(body.message, /taken/);
  });
});

test('register validates username and password', async () => {
  await withServer(async (base) => {
    const cases = [
      [{}, /username is required/],
      [{ username: 'ab', password: 'secret123' }, /at least 3/],
      [{ username: 'a'.repeat(21), password: 'secret123' }, /at most 20/],
      [{ username: 'bad name!', password: 'secret123' }, /letters, numbers/],
      [{ username: 'valid_name' }, /password is required/],
      [{ username: 'valid_name', password: 'short' }, /at least 8/],
      [{ username: 'valid_name', password: 'x'.repeat(73) }, /at most 72/],
      [{ username: 'valid_name', password: 12345678 }, /must be a string/],
    ];
    for (const [payload, message] of cases) {
      const res = await post(base, '/api/register', payload);
      assert.strictEqual(res.status, 400, JSON.stringify(payload));
      const body = await res.json();
      assert.strictEqual(body.success, false);
      assert.match(body.message, message);
    }
  });
});

test('POST /api/login works with the right password, ignoring username case', async () => {
  await withServer(async (base) => {
    const username = uniqueName();
    const registered = await (await post(base, '/api/register', { username, password: 'secret123' })).json();
    const res = await post(base, '/api/login', { username: username.toUpperCase(), password: 'secret123' });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.user.id, registered.user.id);
    assert.match(body.token, /^[0-9a-f]{64}$/);
    assert.notStrictEqual(body.token, registered.token);
  });
});

test('wrong password and unknown username get the same 401', async () => {
  await withServer(async (base) => {
    const username = uniqueName();
    await post(base, '/api/register', { username, password: 'secret123' });

    const wrongPassword = await post(base, '/api/login', { username, password: 'wrong-pass1' });
    const unknownUser = await post(base, '/api/login', { username: uniqueName(), password: 'secret123' });

    assert.strictEqual(wrongPassword.status, 401);
    assert.strictEqual(unknownUser.status, 401);
    assert.deepStrictEqual(await wrongPassword.json(), await unknownUser.json());
  });
});

test('login requires username and password', async () => {
  await withServer(async (base) => {
    const noUser = await post(base, '/api/login', { password: 'secret123' });
    assert.strictEqual(noUser.status, 400);
    const noPassword = await post(base, '/api/login', { username: 'someone' });
    assert.strictEqual(noPassword.status, 400);
  });
});

test('expired tokens stop working', () => {
  const user = userService.createUser(uniqueName(), 'secret123');
  const now = Date.now();
  const token = userService.createToken(user.id, now);
  assert.ok(userService.getUserByToken(token, now + 1000));
  assert.strictEqual(userService.getUserByToken(token, now + userService.TOKEN_TTL_MS + 1), null);
});

test('a registered user id can be used as the playerId for a game', async () => {
  await withServer(async (base) => {
    const { user } = await (await post(base, '/api/register', { username: uniqueName(), password: 'secret123' })).json();
    const res = await post(base, '/api/game/start', { playerId: user.id });
    assert.strictEqual(res.status, 201);
  });
});

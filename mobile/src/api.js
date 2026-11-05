import Constants from 'expo-constants';

// Where the game server runs.
// 1. If EXPO_PUBLIC_API_URL is set (for example the deployed Render URL), use it.
// 2. Otherwise, during development, use the same computer that runs `npx expo start`,
//    on port 3000. This works on a real phone on the same Wi-Fi with no setup.
function resolveBaseUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  }
  const hostUri = Constants.expoConfig?.hostUri; // e.g. "192.168.1.5:8081"
  const host = hostUri ? hostUri.split(':')[0] : 'localhost';
  return `http://${host}:3000`;
}

export const API_URL = resolveBaseUrl();

// Every server reply has { success }. Errors have { success: false, message }.
async function request(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(`Can't reach the game server at ${API_URL}. Is it running?`);
  }

  const data = await res.json().catch(() => ({}));
  if (!data.success) {
    const error = new Error(data.message || `Server error (${res.status})`);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

export function startGame(playerId) {
  return request('/api/game/start', { method: 'POST', body: playerId ? { playerId } : {} });
}

export function sendResult(sessionId, game, success) {
  return request('/api/game/result', { method: 'POST', body: { sessionId, game, success } });
}

export function endGame(sessionId) {
  return request('/api/game/end', { method: 'POST', body: { sessionId } });
}

export function getLeaderboard({ limit = 10, playerId } = {}) {
  const query = new URLSearchParams({ limit: String(limit) });
  if (playerId) query.set('playerId', playerId);
  return request(`/api/leaderboard?${query.toString()}`);
}

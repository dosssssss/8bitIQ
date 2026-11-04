const crypto = require('crypto');

// Length of one run, in seconds.
const GAME_DURATION_SECONDS = 120;

// Active runs, kept in memory. They are lost when the server restarts;
// only finished runs get saved to the database.
const sessions = new Map();

// Seconds left in a run. The server's clock is the source of truth,
// the countdown on the page is only for display.
function getTimeRemaining(session, now = Date.now()) {
  return Math.max(0, Math.ceil((session.endsAt - now) / 1000));
}

function toPublic(session, now = Date.now()) {
  return {
    sessionId: session.id,
    timeRemaining: getTimeRemaining(session, now),
    score: session.score,
    gamesCompleted: session.gamesCompleted,
  };
}

function createSession({ playerId = null } = {}, now = Date.now()) {
  const session = {
    id: crypto.randomUUID(),
    playerId,
    score: 0,
    gamesCompleted: 0,
    startedAt: now,
    endsAt: now + GAME_DURATION_SECONDS * 1000,
    finished: false,
  };
  sessions.set(session.id, session);
  return session;
}

function getSession(sessionId) {
  return sessions.get(sessionId) || null;
}

module.exports = {
  GAME_DURATION_SECONDS,
  createSession,
  getSession,
  getTimeRemaining,
  toPublic,
};

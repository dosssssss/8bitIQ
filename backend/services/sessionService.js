const crypto = require('crypto');
const resultService = require('./resultService');

// Length of one run, in seconds.
const GAME_DURATION_SECONDS = 120;

// Points and seconds won or lost per mini-game. Change these here if the
// team agrees on different values.
const RULES = {
  success: { points: 100, seconds: 5 },
  failure: { points: -50, seconds: -5 },
};

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
    streak: session.streak,
  };
}

function createSession({ playerId = null } = {}, now = Date.now()) {
  const session = {
    id: crypto.randomUUID(),
    playerId,
    score: 0,
    gamesCompleted: 0,
    streak: 0,
    bestStreak: 0,
    startedAt: now,
    endsAt: now + GAME_DURATION_SECONDS * 1000,
    finished: false,
    finalResult: null,
  };
  sessions.set(session.id, session);
  return session;
}

function getSession(sessionId) {
  return sessions.get(sessionId) || null;
}

function isOver(session, now = Date.now()) {
  return session.finished || getTimeRemaining(session, now) === 0;
}

// Applies one mini-game result to a run.
// success: +points, +time, +1 game completed, streak goes up.
// failure: -points, -time, streak resets. Score never goes below 0.
function applyResult(session, success, now = Date.now()) {
  const rule = success ? RULES.success : RULES.failure;

  session.score = Math.max(0, session.score + rule.points);
  session.endsAt += rule.seconds * 1000;

  if (success) {
    session.gamesCompleted += 1;
    session.streak += 1;
    session.bestStreak = Math.max(session.bestStreak, session.streak);
  } else {
    session.streak = 0;
  }

  if (getTimeRemaining(session, now) === 0) {
    finishSession(session, now);
  }
  return session;
}

// Ends a run and saves it once. Calling it again returns the saved result
// without saving a second copy.
function finishSession(session, now = Date.now()) {
  if (session.finalResult) return session.finalResult;

  session.finished = true;
  session.finalResult = resultService.saveResult({
    playerId: session.playerId,
    score: session.score,
    gamesCompleted: session.gamesCompleted,
    bestStreak: session.bestStreak,
    date: new Date(now).toISOString(),
  });
  return session.finalResult;
}

// Ends every run whose time is up, so a run is still saved when the player
// closes the tab before the game over screen.
function finishExpiredSessions(now = Date.now()) {
  let count = 0;
  for (const session of sessions.values()) {
    if (!session.finalResult && isOver(session, now)) {
      finishSession(session, now);
      count += 1;
    }
  }
  return count;
}

function startExpiryCheck(intervalMs = 5000) {
  const timer = setInterval(() => finishExpiredSessions(), intervalMs);
  timer.unref();
  return timer;
}

module.exports = {
  GAME_DURATION_SECONDS,
  RULES,
  applyResult,
  finishSession,
  finishExpiredSessions,
  startExpiryCheck,
  isOver,
  createSession,
  getSession,
  getTimeRemaining,
  toPublic,
};

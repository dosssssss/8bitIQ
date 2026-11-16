const sessionService = require('../services/sessionService');
const userService = require('../services/userService');
const validate = require('../utils/validate');
const asyncHandler = require('../utils/asyncHandler');
const { badRequest, notFound, conflict } = require('../utils/apiError');

function findSession(sessionId) {
  const session = sessionService.getSession(sessionId);
  if (!session) throw notFound('Game session not found');
  return session;
}

// POST /api/game/start
// Body (optional): { playerId } once login is wired up.
async function startGame(req, res) {
  const input = validate.body(req);
  const playerId = validate.optionalString(input.playerId, 'playerId');
  if (playerId && !(await userService.playerExists(playerId))) {
    throw badRequest('Unknown playerId');
  }

  const session = sessionService.createSession({ playerId });
  res.status(201).json({ success: true, ...sessionService.toPublic(session) });
}

// POST /api/game/result
// Body: { sessionId, game, success }
// "game" is the mini-game's name (for example "wordGuess"). "success" is
// whether the player solved it.
function submitResult(req, res) {
  const input = validate.body(req);
  const sessionId = validate.requiredString(input.sessionId, 'sessionId');
  const success = validate.requiredBoolean(input.success, 'success');
  validate.optionalString(input.game, 'game', { maxLength: 50 });

  const session = findSession(sessionId);
  if (sessionService.isOver(session)) {
    // Saved in the background. If it fails, the 5-second check retries.
    sessionService.finishSession(session).catch(() => {});
    throw conflict('Game is over', { gameOver: true });
  }

  sessionService.applyResult(session, success);
  res.json({ success: true, ...sessionService.toPublic(session), gameOver: session.finished });
}

// POST /api/game/end
// Body: { sessionId }
// The page calls this when its countdown reaches 0. Returns the final
// result for the game over screen. Safe to call more than once.
async function endGame(req, res) {
  const input = validate.body(req);
  const sessionId = validate.requiredString(input.sessionId, 'sessionId');

  const session = findSession(sessionId);
  if (!sessionService.isOver(session)) {
    throw conflict('Game is still running', {
      timeRemaining: sessionService.getTimeRemaining(session),
    });
  }

  const finalResult = await sessionService.finishSession(session);
  res.json({
    success: true,
    gameOver: true,
    sessionId: session.id,
    score: finalResult.score,
    gamesCompleted: finalResult.gamesCompleted,
    bestStreak: finalResult.bestStreak,
  });
}

module.exports = {
  startGame: asyncHandler(startGame),
  submitResult: asyncHandler(submitResult),
  endGame: asyncHandler(endGame),
};

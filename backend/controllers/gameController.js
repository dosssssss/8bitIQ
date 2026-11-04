const sessionService = require('../services/sessionService');

// POST /api/game/start
// Body (optional): { playerId } once login is wired up.
function startGame(req, res) {
  const { playerId } = req.body || {};
  const session = sessionService.createSession({ playerId: playerId ?? null });
  res.status(201).json(sessionService.toPublic(session));
}

// POST /api/game/result
// Body: { sessionId, game, success }
// "game" is the mini-game's name (for example "wordGuess"). "success" is
// whether the player solved it.
function submitResult(req, res) {
  const { sessionId, game, success } = req.body || {};

  if (typeof sessionId !== 'string' || sessionId === '') {
    return res.status(400).json({ success: false, message: 'sessionId is required' });
  }
  if (typeof success !== 'boolean') {
    return res.status(400).json({ success: false, message: 'success must be true or false' });
  }
  if (game !== undefined && typeof game !== 'string') {
    return res.status(400).json({ success: false, message: 'game must be a string' });
  }

  const session = sessionService.getSession(sessionId);
  if (!session) {
    return res.status(404).json({ success: false, message: 'Game session not found' });
  }
  if (sessionService.isOver(session)) {
    sessionService.finishSession(session);
    return res.status(409).json({ success: false, message: 'Game is over', gameOver: true });
  }

  sessionService.applyResult(session, success);
  const result = sessionService.toPublic(session);
  return res.json({ success: true, ...result, gameOver: session.finished });
}

// POST /api/game/end
// Body: { sessionId }
// The page calls this when its countdown reaches 0. Returns the final
// result for the game over screen. Safe to call more than once.
function endGame(req, res) {
  const { sessionId } = req.body || {};

  if (typeof sessionId !== 'string' || sessionId === '') {
    return res.status(400).json({ success: false, message: 'sessionId is required' });
  }

  const session = sessionService.getSession(sessionId);
  if (!session) {
    return res.status(404).json({ success: false, message: 'Game session not found' });
  }
  if (!sessionService.isOver(session)) {
    return res.status(409).json({
      success: false,
      message: 'Game is still running',
      timeRemaining: sessionService.getTimeRemaining(session),
    });
  }

  const finalResult = sessionService.finishSession(session);
  return res.json({
    success: true,
    gameOver: true,
    sessionId: session.id,
    score: finalResult.score,
    gamesCompleted: finalResult.gamesCompleted,
    bestStreak: finalResult.bestStreak,
  });
}

module.exports = { startGame, submitResult, endGame };

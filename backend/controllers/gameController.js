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
    return res.status(409).json({ success: false, message: 'Game is over' });
  }

  sessionService.applyResult(session, success);
  const result = sessionService.toPublic(session);
  return res.json({ success: true, ...result, gameOver: result.timeRemaining === 0 });
}

module.exports = { startGame, submitResult };

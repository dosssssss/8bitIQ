const sessionService = require('../services/sessionService');

// POST /api/game/start
// Body (optional): { playerId } once login is wired up.
function startGame(req, res) {
  const { playerId } = req.body || {};
  const session = sessionService.createSession({ playerId: playerId ?? null });
  res.status(201).json(sessionService.toPublic(session));
}

module.exports = { startGame };

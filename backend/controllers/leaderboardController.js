const resultService = require('../services/resultService');
const validate = require('../utils/validate');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/leaderboard
// Query (optional):
//   limit     how many rows, 1 to 50 (default 10, the Top 10)
//   playerId  only this player's best runs (the player's own Top 10)
// username is null for runs played as a guest.
async function getLeaderboard(req, res) {
  const limit = validate.optionalInt(req.query.limit, 'limit', { min: 1, max: 50, defaultValue: 10 });
  const playerId = validate.optionalString(req.query.playerId, 'playerId');

  const top = await resultService.getTopResults({ limit, playerId });
  const leaderboard = top.map((r, index) => ({
    rank: index + 1,
    playerId: r.playerId,
    username: r.username,
    score: r.score,
    gamesCompleted: r.gamesCompleted,
    bestStreak: r.bestStreak,
    date: r.date,
  }));

  res.json({ success: true, leaderboard });
}

module.exports = { getLeaderboard: asyncHandler(getLeaderboard) };

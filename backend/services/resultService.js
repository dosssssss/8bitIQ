// Stores finished runs.
//
// TEMPORARY: results live in memory until the database card (score/result
// storage) lands. That card only needs to replace saveResult, listResults
// and getTopResults with database calls. Nothing else has to change.

const results = [];
let nextId = 1;

// result: { playerId, score, gamesCompleted, bestStreak, date }
function saveResult(result) {
  const saved = { id: nextId++, ...result };
  results.push(saved);
  return saved;
}

function listResults() {
  return results.slice();
}

// Ranking: most games completed first, then highest score, then the
// earliest date (whoever got there first keeps the higher spot).
// SQL version: ORDER BY games_completed DESC, score DESC, date ASC LIMIT ?
function compareResults(a, b) {
  return (
    b.gamesCompleted - a.gamesCompleted ||
    b.score - a.score ||
    a.date.localeCompare(b.date) ||
    a.id - b.id
  );
}

// Best results overall, or for one player when playerId is given.
function getTopResults({ limit = 10, playerId = null } = {}) {
  return results
    .filter((r) => playerId === null || r.playerId === playerId)
    .sort(compareResults)
    .slice(0, limit);
}

module.exports = { saveResult, listResults, getTopResults };

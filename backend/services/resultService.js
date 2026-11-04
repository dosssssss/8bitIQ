// Stores finished runs.
//
// TEMPORARY: results live in memory until the database card (score/result
// storage) lands. That card only needs to replace saveResult and listResults
// with database calls. Nothing else has to change.

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

module.exports = { saveResult, listResults };

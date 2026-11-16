// Stores finished runs. With DATA_STORE=supabase they go in the Supabase
// "results" table. Otherwise they stay in memory (the tests use that).

const { getSupabase, usingSupabase } = require('../supabase');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const results = [];
let nextId = 1;

// What the rest of the server sees:
// { id, playerId, username, score, gamesCompleted, bestStreak, date }
// username is null for guests.
function fromRow(row) {
  return {
    id: row.id,
    playerId: row.player_id,
    username: row.players ? row.players.username : null,
    score: row.score,
    gamesCompleted: row.games_completed,
    bestStreak: row.best_streak,
    date: new Date(row.played_at).toISOString(),
  };
}

const COLUMNS = 'id, player_id, score, games_completed, best_streak, played_at, players(username)';

// result: { playerId, score, gamesCompleted, bestStreak, date }
async function saveResult(result) {
  if (usingSupabase()) {
    const { data, error } = await getSupabase()
      .from('results')
      .insert({
        player_id: result.playerId || null,
        score: result.score,
        games_completed: result.gamesCompleted,
        best_streak: result.bestStreak,
        played_at: result.date,
      })
      .select(COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    return fromRow(data);
  }

  const saved = { id: nextId++, username: null, ...result };
  results.push(saved);
  return saved;
}

async function listResults() {
  if (usingSupabase()) {
    const { data, error } = await getSupabase()
      .from('results')
      .select(COLUMNS)
      .order('id')
      .limit(1000);
    if (error) throw new Error(error.message);
    return data.map(fromRow);
  }
  return results.slice();
}

// Ranking: most games completed first, then highest score, then the
// earliest date (whoever got there first keeps the higher spot).
function compareResults(a, b) {
  return (
    b.gamesCompleted - a.gamesCompleted ||
    b.score - a.score ||
    a.date.localeCompare(b.date) ||
    a.id - b.id
  );
}

// Best results overall, or for one player when playerId is given.
async function getTopResults({ limit = 10, playerId = null } = {}) {
  if (usingSupabase()) {
    // Player ids are UUIDs. Anything else can't match a player, and would make
    // the database complain about the format instead of returning no rows.
    if (playerId !== null && !UUID.test(playerId)) return [];

    let query = getSupabase()
      .from('results')
      .select(COLUMNS)
      .order('games_completed', { ascending: false })
      .order('score', { ascending: false })
      .order('played_at', { ascending: true })
      .order('id', { ascending: true })
      .limit(limit);
    if (playerId !== null) query = query.eq('player_id', playerId);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data.map(fromRow);
  }

  return results
    .filter((r) => playerId === null || r.playerId === playerId)
    .sort(compareResults)
    .slice(0, limit);
}

module.exports = { saveResult, listResults, getTopResults };

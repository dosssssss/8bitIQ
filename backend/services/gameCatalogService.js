// Reads the mini-game settings from the Supabase "games" table
// (rows quickMath and rememberPattern).

const { getSupabase } = require('../supabase');

// Only send what the app needs, using the same shape as before.
function toPublic(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    order: row.sort_order,
    config: row.config || {},
  };
}

// All enabled games, in order.
async function listGames() {
  const { data, error } = await getSupabase()
    .from('games')
    .select('*')
    .eq('enabled', true)
    .order('sort_order');
  if (error) throw new Error(error.message);
  return data.map(toPublic);
}

// One game by id, or null if it doesn't exist or is switched off.
async function getGame(id) {
  const { data, error } = await getSupabase()
    .from('games')
    .select('*')
    .eq('id', id)
    .eq('enabled', true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toPublic(data) : null;
}

module.exports = { listGames, getGame };
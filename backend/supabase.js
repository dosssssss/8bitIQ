// Connects the server to Supabase. The connection is made the first time
// getSupabase() is called, so the rest of the server (and the tests) can load
// without any Supabase settings.
//
// Settings come from environment variables:
//   SUPABASE_URL                 your project URL
//   SUPABASE_SERVICE_ROLE_KEY    the secret key (server only, never in the app)
// Locally they are read from a .env file in the repo root. On a host such as
// Render, set them in the host's environment settings instead.

let client = null;

function getSupabase() {
  if (client) return client;

  require('dotenv').config();
  const { createClient } = require('@supabase/supabase-js');

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  }

  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

module.exports = { getSupabase };
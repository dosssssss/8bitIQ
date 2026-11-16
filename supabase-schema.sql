-- 8bitIQ players, login tokens and results.
-- Run this once in the Supabase SQL Editor.

create table public.players (
  id             uuid primary key default gen_random_uuid(),
  username       text not null check (username ~ '^[A-Za-z0-9_]{3,20}$'),
  -- Lowercase copy so "Ana" and "ana" count as the same name.
  username_lower text generated always as (lower(username)) stored unique,
  password_hash  text not null,
  created_at     timestamptz not null default now()
);

-- Logins. Only a fingerprint (hash) of each token is stored, never the token.
create table public.auth_tokens (
  token_hash text primary key,
  player_id  uuid not null references public.players(id) on delete cascade,
  expires_at timestamptz not null
);
create index auth_tokens_player_idx  on public.auth_tokens (player_id);
create index auth_tokens_expires_idx on public.auth_tokens (expires_at);

-- One row per finished run. player_id is empty for guest runs, and stays empty
-- (the score stays on the board) if the player's account is ever deleted.
create table public.results (
  id              bigint generated always as identity primary key,
  player_id       uuid references public.players(id) on delete set null,
  score           integer not null check (score >= 0),
  games_completed integer not null check (games_completed >= 0),
  best_streak     integer not null check (best_streak >= 0),
  played_at       timestamptz not null default now()
);

-- Same order as the leaderboard: most games completed, then highest score,
-- then earliest. The second index is for a player's own Top 10.
create index results_ranking_idx
  on public.results (games_completed desc, score desc, played_at asc, id asc);
create index results_player_idx
  on public.results (player_id, games_completed desc, score desc, played_at asc);

-- Lock everything: only the server (using the secret key) can reach these.
alter table public.players     enable row level security;
alter table public.auth_tokens enable row level security;
alter table public.results     enable row level security;

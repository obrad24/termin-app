-- Fantasy phase 1 tables (run in Neon SQL Editor)
-- Does not duplicate players/results — only stores calculated points

CREATE TABLE IF NOT EXISTS fantasy_match_points (
  id BIGSERIAL PRIMARY KEY,
  result_id BIGINT NOT NULL REFERENCES results(id) ON DELETE CASCADE,
  player_id BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  season_id BIGINT REFERENCES seasons(id) ON DELETE SET NULL,
  gameweek INTEGER NOT NULL,
  appearance_points INTEGER NOT NULL DEFAULT 0,
  result_points INTEGER NOT NULL DEFAULT 0,
  goals_points INTEGER NOT NULL DEFAULT 0,
  team_scored_bonus INTEGER NOT NULL DEFAULT 0,
  team_conceded_penalty INTEGER NOT NULL DEFAULT 0,
  voting_points INTEGER NOT NULL DEFAULT 0,
  manual_adjustment INTEGER NOT NULL DEFAULT 0,
  manual_adjustment_reason TEXT,
  total_points INTEGER NOT NULL DEFAULT 0,
  goals_scored INTEGER NOT NULL DEFAULT 0,
  team_type TEXT NOT NULL CHECK (team_type IN ('home', 'away')),
  breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,
  calculated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE (result_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_fantasy_match_points_player_id ON fantasy_match_points(player_id);
CREATE INDEX IF NOT EXISTS idx_fantasy_match_points_season_id ON fantasy_match_points(season_id);
CREATE INDEX IF NOT EXISTS idx_fantasy_match_points_gameweek ON fantasy_match_points(season_id, gameweek);

CREATE TABLE IF NOT EXISTS fantasy_gameweek_locks (
  id BIGSERIAL PRIMARY KEY,
  season_id BIGINT NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  gameweek INTEGER NOT NULL,
  locked BOOLEAN NOT NULL DEFAULT FALSE,
  locked_at TIMESTAMPTZ,
  UNIQUE (season_id, gameweek)
);

CREATE TABLE IF NOT EXISTS fantasy_calc_logs (
  id BIGSERIAL PRIMARY KEY,
  season_id BIGINT REFERENCES seasons(id) ON DELETE SET NULL,
  result_id BIGINT REFERENCES results(id) ON DELETE SET NULL,
  gameweek INTEGER,
  action TEXT NOT NULL,
  message TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fantasy_calc_logs_created_at ON fantasy_calc_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fantasy_calc_logs_season_id ON fantasy_calc_logs(season_id);

-- Fantasy login accounts (player_id NULL = non-footballer manager)
CREATE TABLE IF NOT EXISTS player_accounts (
  id BIGSERIAL PRIMARY KEY,
  player_id BIGINT UNIQUE REFERENCES players(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_player_accounts_nickname ON player_accounts(nickname);

-- Per-manager fantasy squad for a gameweek (exactly 5 picks; max 2 transfers vs previous GW)
CREATE TABLE IF NOT EXISTS fantasy_user_squads (
  id BIGSERIAL PRIMARY KEY,
  account_id BIGINT NOT NULL REFERENCES player_accounts(id) ON DELETE CASCADE,
  season_id BIGINT NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  gameweek INTEGER NOT NULL,
  player_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  captain_player_id BIGINT REFERENCES players(id) ON DELETE SET NULL,
  transfers_used INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE (account_id, season_id, gameweek)
);

-- Existing DBs: ALTER TABLE fantasy_user_squads ADD COLUMN IF NOT EXISTS captain_player_id BIGINT REFERENCES players(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_fantasy_user_squads_account ON fantasy_user_squads(account_id, season_id);

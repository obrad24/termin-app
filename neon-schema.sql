-- ============================================
-- TERMIN APP - kompletan Neon schema
-- Pokreni CIJELU skriptu u Neon SQL Editoru
-- ============================================

CREATE TABLE IF NOT EXISTS seasons (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS teams (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  short_name TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_teams_name ON teams(name);

CREATE TABLE IF NOT EXISTS players (
  id BIGSERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  birth_year INTEGER NOT NULL,
  team TEXT,
  image_url TEXT,
  price NUMERIC(4,1),
  pace INTEGER CHECK (pace IS NULL OR (pace >= 0 AND pace <= 100)),
  shooting INTEGER CHECK (shooting IS NULL OR (shooting >= 0 AND shooting <= 100)),
  passing INTEGER CHECK (passing IS NULL OR (passing >= 0 AND passing <= 100)),
  dribbling INTEGER CHECK (dribbling IS NULL OR (dribbling >= 0 AND dribbling <= 100)),
  defending INTEGER CHECK (defending IS NULL OR (defending >= 0 AND defending <= 100)),
  physical INTEGER CHECK (physical IS NULL OR (physical >= 0 AND physical <= 100)),
  stamina INTEGER CHECK (stamina IS NULL OR (stamina >= 0 AND stamina <= 100)),
  injury BOOLEAN DEFAULT FALSE,
  rating_bonus INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS results (
  id BIGSERIAL PRIMARY KEY,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_score INTEGER NOT NULL,
  away_score INTEGER NOT NULL,
  date DATE NOT NULL,
  season_id BIGINT REFERENCES seasons(id),
  odds_1 DECIMAL(5,2),
  odds_x DECIMAL(5,2),
  odds_2 DECIMAL(5,2),
  summary_comment TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_results_date ON results(date DESC);
CREATE INDEX IF NOT EXISTS idx_results_season_id ON results(season_id);

CREATE TABLE IF NOT EXISTS match_goals (
  id BIGSERIAL PRIMARY KEY,
  result_id BIGINT NOT NULL REFERENCES results(id) ON DELETE CASCADE,
  player_id BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  team_type TEXT NOT NULL CHECK (team_type IN ('home', 'away')),
  goal_minute INTEGER,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_match_goals_result_id ON match_goals(result_id);
CREATE INDEX IF NOT EXISTS idx_match_goals_player_id ON match_goals(player_id);

CREATE TABLE IF NOT EXISTS match_players (
  id BIGSERIAL PRIMARY KEY,
  result_id BIGINT NOT NULL REFERENCES results(id) ON DELETE CASCADE,
  player_id BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  team_type TEXT NOT NULL CHECK (team_type IN ('home', 'away')),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE (result_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_match_players_result_id ON match_players(result_id);
CREATE INDEX IF NOT EXISTS idx_match_players_player_id ON match_players(player_id);

CREATE TABLE IF NOT EXISTS season_teams (
  id BIGSERIAL PRIMARY KEY,
  season_id BIGINT NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE (season_id, team_id)
);

CREATE TABLE IF NOT EXISTS player_season_teams (
  id BIGSERIAL PRIMARY KEY,
  player_id BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  season_id BIGINT NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  team TEXT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE (player_id, season_id)
);

CREATE TABLE IF NOT EXISTS next_match (
  id SERIAL PRIMARY KEY,
  home_team VARCHAR(255) NOT NULL,
  away_team VARCHAR(255) NOT NULL,
  match_date TIMESTAMP,
  odds_1 DECIMAL(5,2),
  odds_x DECIMAL(5,2),
  odds_2 DECIMAL(5,2),
  match_result VARCHAR(1) CHECK (match_result IS NULL OR match_result IN ('1', 'X', '2')),
  home_score INTEGER,
  away_score INTEGER,
  total_goals INTEGER,
  total_goals_odds JSONB,
  player_goals_odds JSONB,
  over_under_odds JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS next_match_players (
  id BIGSERIAL PRIMARY KEY,
  next_match_id INTEGER NOT NULL REFERENCES next_match(id) ON DELETE CASCADE,
  player_id BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  team_type TEXT NOT NULL CHECK (team_type IN ('home', 'away')),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE (next_match_id, player_id)
);

CREATE TABLE IF NOT EXISTS match_player_ratings (
  id BIGSERIAL PRIMARY KEY,
  match_id BIGINT NOT NULL REFERENCES results(id) ON DELETE CASCADE,
  player_id BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  user_ip TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE (match_id, player_id, user_ip)
);

CREATE INDEX IF NOT EXISTS idx_match_player_ratings_match_id ON match_player_ratings(match_id);
CREATE INDEX IF NOT EXISTS idx_match_player_ratings_player_id ON match_player_ratings(player_id);

CREATE TABLE IF NOT EXISTS match_comments (
  id BIGSERIAL PRIMARY KEY,
  match_id BIGINT NOT NULL REFERENCES results(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_match_comments_match_id ON match_comments(match_id);
CREATE INDEX IF NOT EXISTS idx_match_comments_created_at ON match_comments(created_at DESC);

CREATE TABLE IF NOT EXISTS match_comment_likes (
  id BIGSERIAL PRIMARY KEY,
  comment_id BIGINT NOT NULL REFERENCES match_comments(id) ON DELETE CASCADE,
  like_type TEXT NOT NULL CHECK (like_type IN ('like', 'dislike')),
  user_ip TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE (comment_id, user_ip)
);

CREATE INDEX IF NOT EXISTS idx_match_comment_likes_comment_id ON match_comment_likes(comment_id);

CREATE TABLE IF NOT EXISTS termin_news (
  id SERIAL PRIMARY KEY,
  title TEXT,
  content TEXT NOT NULL DEFAULT '',
  top_scorer_id INTEGER,
  top_scorer_comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS player_accounts (
  id BIGSERIAL PRIMARY KEY,
  -- NULL = fantasy-only manager (not a footballer)
  player_id BIGINT UNIQUE REFERENCES players(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_player_accounts_nickname ON player_accounts(nickname);

CREATE TABLE IF NOT EXISTS fantasy_user_squads (
  id BIGSERIAL PRIMARY KEY,
  account_id BIGINT NOT NULL REFERENCES player_accounts(id) ON DELETE CASCADE,
  season_id BIGINT NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  gameweek INTEGER NOT NULL,
  player_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  transfers_used INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE (account_id, season_id, gameweek)
);

CREATE INDEX IF NOT EXISTS idx_fantasy_user_squads_account ON fantasy_user_squads(account_id, season_id);

-- Početna sezona
INSERT INTO seasons (name)
SELECT 'Sezona 1'
WHERE NOT EXISTS (SELECT 1 FROM seasons WHERE name = 'Sezona 1');

-- Početni red za TerminNews
INSERT INTO termin_news (content)
SELECT ''
WHERE NOT EXISTS (SELECT 1 FROM termin_news);

-- SQL skripta za dodavanje tabela za strijelce i igrače koji su igrali
-- Pokrenite ovu skriptu u SQL Editor-u u Supabase dashboard-u

-- Tabela za strijelce (goals)
CREATE TABLE IF NOT EXISTS match_goals (
  id BIGSERIAL PRIMARY KEY,
  result_id BIGINT NOT NULL REFERENCES results(id) ON DELETE CASCADE,
  player_id BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  team_type TEXT NOT NULL CHECK (team_type IN ('home', 'away')),
  goal_minute INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_match_goals_result_id ON match_goals(result_id);
CREATE INDEX IF NOT EXISTS idx_match_goals_player_id ON match_goals(player_id);

-- Tabela za igrače koji su igrali (match players)
CREATE TABLE IF NOT EXISTS match_players (
  id BIGSERIAL PRIMARY KEY,
  result_id BIGINT NOT NULL REFERENCES results(id) ON DELETE CASCADE,
  player_id BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  team_type TEXT NOT NULL CHECK (team_type IN ('home', 'away')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(result_id, player_id) -- Jedan igrač može biti samo jednom u jednoj utakmici
);

CREATE INDEX IF NOT EXISTS idx_match_players_result_id ON match_players(result_id);
CREATE INDEX IF NOT EXISTS idx_match_players_player_id ON match_players(player_id);


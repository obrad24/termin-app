-- ============================================
-- Tim igrača po sezoni
-- Pokreni ovu skriptu u Supabase SQL editoru
-- ============================================

CREATE TABLE IF NOT EXISTS player_season_teams (
  id BIGSERIAL PRIMARY KEY,
  player_id BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  season_id BIGINT NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  team TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE (player_id, season_id)
);

-- Auto update updated_at
CREATE OR REPLACE FUNCTION set_player_season_teams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'player_season_teams'
  ) THEN
    DROP TRIGGER IF EXISTS trg_set_player_season_teams_updated_at ON player_season_teams;
    CREATE TRIGGER trg_set_player_season_teams_updated_at
    BEFORE UPDATE ON player_season_teams
    FOR EACH ROW
    EXECUTE FUNCTION set_player_season_teams_updated_at();
  END IF;
END $$;

-- Inicijalna migracija postojećeg globalnog tima na "Sezona 1" (ako postoji)
INSERT INTO player_season_teams (player_id, season_id, team)
SELECT p.id, s.id, p.team
FROM players p
JOIN seasons s ON s.name = 'Sezona 1'
WHERE p.team IS NOT NULL
ON CONFLICT (player_id, season_id) DO NOTHING;

-- Row Level Security (da ne ostane tabela otvorena)
ALTER TABLE IF EXISTS player_season_teams ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'player_season_teams'
      AND policyname = 'Allow read player_season_teams'
  ) THEN
    CREATE POLICY "Allow read player_season_teams"
    ON player_season_teams
    FOR SELECT
    TO anon, authenticated
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'player_season_teams'
      AND policyname = 'Allow write player_season_teams'
  ) THEN
    CREATE POLICY "Allow write player_season_teams"
    ON player_season_teams
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'player_season_teams'
      AND policyname = 'Allow update player_season_teams'
  ) THEN
    CREATE POLICY "Allow update player_season_teams"
    ON player_season_teams
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- ============================================
-- Klubovi po sezoni
-- Pokreni ovu skriptu u Supabase SQL editoru
-- ============================================

CREATE TABLE IF NOT EXISTS season_teams (
  id BIGSERIAL PRIMARY KEY,
  season_id BIGINT NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE (season_id, team_id)
);

-- Migracija: postojeće timove dodaj u "Sezona 1"
INSERT INTO season_teams (season_id, team_id)
SELECT s.id, t.id
FROM seasons s
CROSS JOIN teams t
WHERE s.name = 'Sezona 1'
ORDER BY t.created_at ASC, t.id ASC
ON CONFLICT (season_id, team_id) DO NOTHING;

ALTER TABLE IF EXISTS season_teams ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'season_teams'
      AND policyname = 'Allow read season_teams'
  ) THEN
    CREATE POLICY "Allow read season_teams"
    ON season_teams
    FOR SELECT
    TO anon, authenticated
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'season_teams'
      AND policyname = 'Allow write season_teams'
  ) THEN
    CREATE POLICY "Allow write season_teams"
    ON season_teams
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);
  END IF;
END $$;

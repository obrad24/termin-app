-- ============================================
-- Tabela za sezone + veza sa rezultatima
-- Pokreni ovu skriptu u Supabase SQL editoru
-- ============================================

-- Kreiraj tabelu za sezone ako ne postoji
CREATE TABLE IF NOT EXISTS seasons (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Dodaj kolonu season_id u results (ako ne postoji)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'results'
      AND column_name = 'season_id'
  ) THEN
    ALTER TABLE results
      ADD COLUMN season_id BIGINT REFERENCES seasons(id);
  END IF;
END $$;

-- Ako nema nijedne sezone, kreiraj početnu "Sezona 1"
INSERT INTO seasons (name)
SELECT 'Sezona 1'
WHERE NOT EXISTS (SELECT 1 FROM seasons);

-- Poveži postojeće rezultate sa "Sezona 1"
UPDATE results
SET season_id = (
  SELECT id FROM seasons WHERE name = 'Sezona 1' LIMIT 1
)
WHERE season_id IS NULL;


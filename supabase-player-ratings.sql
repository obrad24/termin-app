-- SQL skripta za dodavanje polja za ocene igrača (FIFA stil)
-- Pokrenite ovu skriptu u SQL Editor-u u Supabase dashboard-u

-- Dodavanje polja za ocene u players tabelu
ALTER TABLE players
ADD COLUMN IF NOT EXISTS pace INTEGER CHECK (pace >= 0 AND pace <= 100),
ADD COLUMN IF NOT EXISTS shooting INTEGER CHECK (shooting >= 0 AND shooting <= 100),
ADD COLUMN IF NOT EXISTS passing INTEGER CHECK (passing >= 0 AND passing <= 100),
ADD COLUMN IF NOT EXISTS dribbling INTEGER CHECK (dribbling >= 0 AND dribbling <= 100),
ADD COLUMN IF NOT EXISTS defending INTEGER CHECK (defending >= 0 AND defending <= 100),
ADD COLUMN IF NOT EXISTS physical INTEGER CHECK (physical >= 0 AND physical <= 100);

-- Komentar za dokumentaciju
COMMENT ON COLUMN players.pace IS 'Brzina igrača (0-100)';
COMMENT ON COLUMN players.shooting IS 'Šut igrača (0-100)';
COMMENT ON COLUMN players.passing IS 'Dodavanje igrača (0-100)';
COMMENT ON COLUMN players.dribbling IS 'Dribling igrača (0-100)';
COMMENT ON COLUMN players.defending IS 'Odbrana igrača (0-100)';
COMMENT ON COLUMN players.physical IS 'Fizička snaga igrača (0-100)';


-- SQL skripta za dodavanje polja za kvote u results tabelu
-- Pokrenite ovu skriptu u SQL Editor-u u Supabase dashboard-u

-- Dodavanje kolona za kvote
ALTER TABLE results
ADD COLUMN IF NOT EXISTS odds_1 DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS odds_x DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS odds_2 DECIMAL(5,2);

-- Komentar za dokumentaciju
COMMENT ON COLUMN results.odds_1 IS 'Kvota za pobedu domaćeg tima';
COMMENT ON COLUMN results.odds_x IS 'Kvota za nerešeno';
COMMENT ON COLUMN results.odds_2 IS 'Kvota za pobedu gostujućeg tima';


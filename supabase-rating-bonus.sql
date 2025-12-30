-- SQL skripta za dodavanje rating_bonus kolone u players tabelu
-- Pokrenite ovu skriptu u SQL Editor-u u Supabase dashboard-u

-- Dodavanje rating_bonus kolone
ALTER TABLE players
ADD COLUMN IF NOT EXISTS rating_bonus INTEGER DEFAULT 0;

-- Komentar za dokumentaciju
COMMENT ON COLUMN players.rating_bonus IS 'Bonus koji se dodaje na prosječni rating (može biti pozitivan ili negativan)';


-- SQL skripta za kreiranje tabele za ocjene igrača na mečevima
-- Pokrenite ovu skriptu u SQL Editor-u u Supabase dashboard-u

-- Kreiranje tabele za ocjene igrača
CREATE TABLE IF NOT EXISTS match_player_ratings (
  id BIGSERIAL PRIMARY KEY,
  match_id BIGINT NOT NULL REFERENCES results(id) ON DELETE CASCADE,
  player_id BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  user_ip TEXT, -- IP adresa korisnika za ograničavanje višestrukih ocjena
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(match_id, player_id, user_ip) -- Sprečava višestruke ocjene od istog korisnika za istog igrača
);

-- Kreiranje indeksa za brže pretrage
CREATE INDEX IF NOT EXISTS idx_match_player_ratings_match_id ON match_player_ratings(match_id);
CREATE INDEX IF NOT EXISTS idx_match_player_ratings_player_id ON match_player_ratings(player_id);
CREATE INDEX IF NOT EXISTS idx_match_player_ratings_match_player ON match_player_ratings(match_id, player_id);

-- Komentar za dokumentaciju
COMMENT ON TABLE match_player_ratings IS 'Ocjene igrača od strane posjetilaca sajta za određene mečeve (1-5 zvjezdica)';
COMMENT ON COLUMN match_player_ratings.match_id IS 'ID meča (results.id)';
COMMENT ON COLUMN match_player_ratings.player_id IS 'ID igrača (players.id)';
COMMENT ON COLUMN match_player_ratings.rating IS 'Ocjena od 1 do 5';
COMMENT ON COLUMN match_player_ratings.user_ip IS 'IP adresa korisnika koji je dao ocjenu (za ograničavanje)';

-- Omogući javni pristup (bez RLS za jednostavnost)
-- Ako želite RLS, otkomentarišite linije ispod:
-- ALTER TABLE match_player_ratings ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow public read access" ON match_player_ratings FOR SELECT USING (true);
-- CREATE POLICY "Allow public insert access" ON match_player_ratings FOR INSERT WITH CHECK (true);

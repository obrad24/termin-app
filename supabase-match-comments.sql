-- SQL skripta za kreiranje tabele za komentare na utakmicama
-- Pokrenite ovu skriptu u SQL Editor-u u Supabase dashboard-u

-- Kreiranje tabele za komentare
CREATE TABLE IF NOT EXISTS match_comments (
  id BIGSERIAL PRIMARY KEY,
  match_id BIGINT NOT NULL REFERENCES results(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Kreiranje indeksa za brže pretrage
CREATE INDEX IF NOT EXISTS idx_match_comments_match_id ON match_comments(match_id);
CREATE INDEX IF NOT EXISTS idx_match_comments_created_at ON match_comments(created_at DESC);

-- Komentar za dokumentaciju
COMMENT ON TABLE match_comments IS 'Komentari korisnika na utakmicama';
COMMENT ON COLUMN match_comments.match_id IS 'ID utakmice (results.id)';
COMMENT ON COLUMN match_comments.nickname IS 'Nadimak korisnika koji je ostavio komentar';
COMMENT ON COLUMN match_comments.comment IS 'Tekst komentara';

-- Omogući javni pristup (bez RLS za jednostavnost)
-- Ako želite RLS, otkomentarišite linije ispod:
-- ALTER TABLE match_comments ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow public read access" ON match_comments FOR SELECT USING (true);
-- CREATE POLICY "Allow public insert access" ON match_comments FOR INSERT WITH CHECK (true);

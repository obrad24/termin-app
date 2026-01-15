-- SQL skripta za kreiranje tabele za lajkove i dislajkove na komentare
-- Pokrenite ovu skriptu u SQL Editor-u u Supabase dashboard-u

-- Kreiranje tabele za lajkove/dislajkove komentara
CREATE TABLE IF NOT EXISTS match_comment_likes (
  id BIGSERIAL PRIMARY KEY,
  comment_id BIGINT NOT NULL REFERENCES match_comments(id) ON DELETE CASCADE,
  like_type TEXT NOT NULL CHECK (like_type IN ('like', 'dislike')),
  user_ip TEXT, -- IP adresa korisnika za ograničavanje višestrukih lajkova
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(comment_id, user_ip) -- Sprečava višestruke lajkove/dislajkove od istog korisnika za isti komentar
);

-- Kreiranje indeksa za brže pretrage
CREATE INDEX IF NOT EXISTS idx_match_comment_likes_comment_id ON match_comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_match_comment_likes_type ON match_comment_likes(like_type);

-- Komentar za dokumentaciju
COMMENT ON TABLE match_comment_likes IS 'Lajkovi i dislajkovi komentara na utakmicama';
COMMENT ON COLUMN match_comment_likes.comment_id IS 'ID komentara (match_comments.id)';
COMMENT ON COLUMN match_comment_likes.like_type IS 'Tip lajka: like ili dislike';
COMMENT ON COLUMN match_comment_likes.user_ip IS 'IP adresa korisnika koji je lajkovao/dislajkovao (za ograničavanje)';

-- Omogući javni pristup (bez RLS za jednostavnost)
-- Ako želite RLS, otkomentarišite linije ispod:
-- ALTER TABLE match_comment_likes ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow public read access" ON match_comment_likes FOR SELECT USING (true);
-- CREATE POLICY "Allow public insert access" ON match_comment_likes FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow public update access" ON match_comment_likes FOR UPDATE USING (true);
-- CREATE POLICY "Allow public delete access" ON match_comment_likes FOR DELETE USING (true);

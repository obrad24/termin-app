-- SQL skripta za kreiranje tabele za TerminNews
-- Pokrenite ovu skriptu u SQL Editor-u u Supabase dashboard-u

-- Kreiranje tabele za TerminNews
CREATE TABLE IF NOT EXISTS termin_news (
  id SERIAL PRIMARY KEY,
  title TEXT,
  content TEXT NOT NULL DEFAULT '',
  top_scorer_id INTEGER,
  top_scorer_comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Omogući samo jedan red u tabeli (uvijek će biti samo jedan izvještaj)
-- Kreiraj trigger za automatsko ažuriranje updated_at
CREATE OR REPLACE FUNCTION update_termin_news_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Kreiraj trigger samo ako ne postoji
DROP TRIGGER IF EXISTS termin_news_updated_at ON termin_news;
CREATE TRIGGER termin_news_updated_at
  BEFORE UPDATE ON termin_news
  FOR EACH ROW
  EXECUTE FUNCTION update_termin_news_updated_at();

-- Dodaj kolone ako ne postoje (za kompatibilnost sa postojećom tabelom)
DO $$ 
BEGIN
  -- Dodaj title ako ne postoji
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'termin_news' AND column_name = 'title'
  ) THEN
    ALTER TABLE termin_news ADD COLUMN title TEXT;
  END IF;

  -- Dodaj top_scorer_id ako ne postoji
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'termin_news' AND column_name = 'top_scorer_id'
  ) THEN
    ALTER TABLE termin_news ADD COLUMN top_scorer_id INTEGER;
  END IF;

  -- Dodaj top_scorer_comment ako ne postoji
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'termin_news' AND column_name = 'top_scorer_comment'
  ) THEN
    ALTER TABLE termin_news ADD COLUMN top_scorer_comment TEXT;
  END IF;
END $$;

-- Ubaci početni red sa praznim sadržajem samo ako ne postoji
INSERT INTO termin_news (content) 
SELECT '' 
WHERE NOT EXISTS (SELECT 1 FROM termin_news);

-- Komentar za dokumentaciju
COMMENT ON TABLE termin_news IS 'Tabela za čuvanje izvještaja o poslednjem terminu';
COMMENT ON COLUMN termin_news.content IS 'Tekst izvještaja o poslednjem terminu';
COMMENT ON COLUMN termin_news.top_scorer_id IS 'ID najboljeg strijelca sa utakmice';
COMMENT ON COLUMN termin_news.top_scorer_comment IS 'Komentar najboljeg strijelca o utakmici';
-- SQL skripta za kreiranje tabele u Supabase
-- Pokrenite ovu skriptu u SQL Editor-u u Supabase dashboard-u

-- Obriši tabelu ako postoji (OPREZ: ovo će obrisati sve podatke!)
-- Ako već imate podatke, preskočite ovu liniju i koristite ALTER TABLE umesto toga
DROP TABLE IF EXISTS results CASCADE;

CREATE TABLE results (
  id BIGSERIAL PRIMARY KEY,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_score INTEGER NOT NULL,
  away_score INTEGER NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Kreiraj indeks za brže pretrage po datumu
CREATE INDEX idx_results_date ON results(date DESC);

-- Omogući javni pristup (bez RLS za jednostavnost)
-- Ako želite RLS, otkomentarišite linije ispod:
-- ALTER TABLE results ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow public read access" ON results FOR SELECT USING (true);
-- CREATE POLICY "Allow public insert access" ON results FOR INSERT WITH CHECK (true);

-- Test podaci (opciono - možete obrisati ove linije)
-- INSERT INTO results (home_team, away_team, home_score, away_score, date) VALUES
-- ('Real Madrid', 'Barcelona', 3, 2, CURRENT_DATE),
-- ('Manchester United', 'Liverpool', 2, 1, CURRENT_DATE - INTERVAL '1 day');

-- ============================================
-- Tabela za timove
-- (Ovaj deo možete pokrenuti zasebno ako već imate results tabelu)
-- ============================================

CREATE TABLE IF NOT EXISTS teams (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_teams_name ON teams(name);


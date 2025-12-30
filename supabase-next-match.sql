-- SQL skripta za kreiranje tabele za sledeći meč (TerminBet)
-- Pokrenite ovu skriptu u SQL Editor-u u Supabase dashboard-u

-- Kreiranje tabele za sledeći meč
CREATE TABLE IF NOT EXISTS next_match (
  id SERIAL PRIMARY KEY,
  home_team VARCHAR(255) NOT NULL,
  away_team VARCHAR(255) NOT NULL,
  match_date TIMESTAMP,
  odds_1 DECIMAL(5,2),
  odds_x DECIMAL(5,2),
  odds_2 DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Komentar za dokumentaciju
COMMENT ON TABLE next_match IS 'Tabela za čuvanje informacija o sledećem meču i kvotama (TerminBet)';
COMMENT ON COLUMN next_match.home_team IS 'Domaći tim';
COMMENT ON COLUMN next_match.away_team IS 'Gostujući tim';
COMMENT ON COLUMN next_match.match_date IS 'Datum i vrijeme meča';
COMMENT ON COLUMN next_match.odds_1 IS 'Kvota za pobedu domaćeg tima';
COMMENT ON COLUMN next_match.odds_x IS 'Kvota za nerešeno';
COMMENT ON COLUMN next_match.odds_2 IS 'Kvota za pobedu gostujućeg tima';

-- Omogući samo jedan red u tabeli (uvijek će biti samo jedan sledeći meč)
-- Možemo koristiti trigger ili jednostavno brisati stari red pri dodavanju novog


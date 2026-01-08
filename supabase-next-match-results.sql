-- SQL skripta za dodavanje polja za rezultate u next_match tabelu
-- Pokrenite ovu skriptu u SQL Editor-u u Supabase dashboard-u

-- Proveri da li kolone postoje i dodaj ih ako ne postoje
DO $$ 
BEGIN
  -- Proveri da li tabela postoji
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'next_match') THEN
    -- Proveri i dodaj match_result
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'next_match' AND column_name = 'match_result'
    ) THEN
      ALTER TABLE next_match ADD COLUMN match_result VARCHAR(1) CHECK (match_result IN ('1', 'X', '2'));
      RAISE NOTICE 'Kolona match_result je dodata u tabelu next_match';
    ELSE
      RAISE NOTICE 'Kolona match_result već postoji';
    END IF;

    -- Proveri i dodaj home_score
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'next_match' AND column_name = 'home_score'
    ) THEN
      ALTER TABLE next_match ADD COLUMN home_score INTEGER;
      RAISE NOTICE 'Kolona home_score je dodata u tabelu next_match';
    ELSE
      RAISE NOTICE 'Kolona home_score već postoji';
    END IF;

    -- Proveri i dodaj away_score
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'next_match' AND column_name = 'away_score'
    ) THEN
      ALTER TABLE next_match ADD COLUMN away_score INTEGER;
      RAISE NOTICE 'Kolona away_score je dodata u tabelu next_match';
    ELSE
      RAISE NOTICE 'Kolona away_score već postoji';
    END IF;

    -- Proveri i dodaj total_goals
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'next_match' AND column_name = 'total_goals'
    ) THEN
      ALTER TABLE next_match ADD COLUMN total_goals INTEGER;
      RAISE NOTICE 'Kolona total_goals je dodata u tabelu next_match';
    ELSE
      RAISE NOTICE 'Kolona total_goals već postoji';
    END IF;
  ELSE
    RAISE EXCEPTION 'Tabela next_match ne postoji!';
  END IF;
END $$;

-- Komentar za dokumentaciju
COMMENT ON COLUMN next_match.match_result IS 'Ishod meča: 1 (pobeda domaćeg), X (nerešeno), 2 (pobeda gostujućeg)';
COMMENT ON COLUMN next_match.home_score IS 'Broj golova domaćeg tima';
COMMENT ON COLUMN next_match.away_score IS 'Broj golova gostujućeg tima';
COMMENT ON COLUMN next_match.total_goals IS 'Ukupan broj golova u meču';


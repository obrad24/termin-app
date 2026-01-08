-- SQL skripta za dodavanje polja za kvote u results tabelu
-- Pokrenite ovu skriptu u SQL Editor-u u Supabase dashboard-u

-- Proveri da li kolone postoje i dodaj ih ako ne postoje
DO $$ 
BEGIN
  -- Proveri da li tabela postoji
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'results') THEN
    -- Proveri i dodaj odds_1
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'results' AND column_name = 'odds_1'
    ) THEN
      ALTER TABLE results ADD COLUMN odds_1 DECIMAL(5,2);
      RAISE NOTICE 'Kolona odds_1 je dodata u tabelu results';
    ELSE
      RAISE NOTICE 'Kolona odds_1 već postoji';
    END IF;

    -- Proveri i dodaj odds_x
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'results' AND column_name = 'odds_x'
    ) THEN
      ALTER TABLE results ADD COLUMN odds_x DECIMAL(5,2);
      RAISE NOTICE 'Kolona odds_x je dodata u tabelu results';
    ELSE
      RAISE NOTICE 'Kolona odds_x već postoji';
    END IF;

    -- Proveri i dodaj odds_2
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'results' AND column_name = 'odds_2'
    ) THEN
      ALTER TABLE results ADD COLUMN odds_2 DECIMAL(5,2);
      RAISE NOTICE 'Kolona odds_2 je dodata u tabelu results';
    ELSE
      RAISE NOTICE 'Kolona odds_2 već postoji';
    END IF;
  ELSE
    RAISE EXCEPTION 'Tabela results ne postoji!';
  END IF;
END $$;

-- Komentar za dokumentaciju
COMMENT ON COLUMN results.odds_1 IS 'Kvota za pobedu domaćeg tima';
COMMENT ON COLUMN results.odds_x IS 'Kvota za nerešeno';
COMMENT ON COLUMN results.odds_2 IS 'Kvota za pobedu gostujućeg tima';

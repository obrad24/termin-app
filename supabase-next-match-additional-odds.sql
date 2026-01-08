-- SQL skripta za dodavanje polja za dodatne kvote u next_match tabelu
-- Pokrenite ovu skriptu u SQL Editor-u u Supabase dashboard-u

-- Proveri da li kolone postoje i dodaj ih ako ne postoje
DO $$ 
BEGIN
  -- Proveri da li tabela postoji
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'next_match') THEN
    -- Proveri i dodaj total_goals_odds (JSON polje za kvote za broj golova na terminu)
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'next_match' AND column_name = 'total_goals_odds'
    ) THEN
      ALTER TABLE next_match ADD COLUMN total_goals_odds JSONB;
      RAISE NOTICE 'Kolona total_goals_odds je dodata u tabelu next_match';
    ELSE
      RAISE NOTICE 'Kolona total_goals_odds već postoji';
    END IF;

    -- Proveri i dodaj player_goals_odds (JSON polje za kvote za igrača i broj golova)
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'next_match' AND column_name = 'player_goals_odds'
    ) THEN
      ALTER TABLE next_match ADD COLUMN player_goals_odds JSONB;
      RAISE NOTICE 'Kolona player_goals_odds je dodata u tabelu next_match';
    ELSE
      RAISE NOTICE 'Kolona player_goals_odds već postoji';
    END IF;

    -- Proveri i dodaj over_under_odds (JSON polje za kvote preko/ispod broj golova)
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'next_match' AND column_name = 'over_under_odds'
    ) THEN
      ALTER TABLE next_match ADD COLUMN over_under_odds JSONB;
      RAISE NOTICE 'Kolona over_under_odds je dodata u tabelu next_match';
    ELSE
      RAISE NOTICE 'Kolona over_under_odds već postoji';
    END IF;
  ELSE
    RAISE EXCEPTION 'Tabela next_match ne postoji!';
  END IF;
END $$;

-- Komentar za dokumentaciju
COMMENT ON COLUMN next_match.total_goals_odds IS 'JSON niz kvota za broj golova na terminu. Format: [{"goals": 2, "odd": 3.50}, ...]';
COMMENT ON COLUMN next_match.player_goals_odds IS 'JSON niz kvota za igrača i broj golova. Format: [{"player_id": 1, "goals": 2, "odd": 4.20}, ...]';
COMMENT ON COLUMN next_match.over_under_odds IS 'JSON niz kvota za preko/ispod broj golova. Format: [{"goals": 2.5, "over_odd": 1.85, "under_odd": 1.95}, ...]';


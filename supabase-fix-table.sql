-- ALTERNATIVNA SKRIPTA: Ako već imate podatke i ne želite da ih obrišete
-- Ova skripta će dodati kolonu 'date' ako ne postoji

-- Proveri da li kolona postoji i dodaj je ako ne postoji
DO $$ 
BEGIN
  -- Proveri da li tabela postoji
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'results') THEN
    -- Proveri da li kolona 'date' postoji
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'results' AND column_name = 'date'
    ) THEN
      -- Dodaj kolonu 'date'
      ALTER TABLE results ADD COLUMN date DATE;
      
      -- Ako već postoje podaci, postavi default vrednost
      UPDATE results SET date = COALESCE(created_at::DATE, CURRENT_DATE) WHERE date IS NULL;
      
      -- Sada je kolona obavezna
      ALTER TABLE results ALTER COLUMN date SET NOT NULL;
      
      RAISE NOTICE 'Kolona date je dodata u tabelu results';
    ELSE
      RAISE NOTICE 'Kolona date već postoji';
    END IF;
  ELSE
    -- Ako tabela ne postoji, kreiraj je
    CREATE TABLE results (
      id BIGSERIAL PRIMARY KEY,
      home_team TEXT NOT NULL,
      away_team TEXT NOT NULL,
      home_score INTEGER NOT NULL,
      away_score INTEGER NOT NULL,
      date DATE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
    );
    
    CREATE INDEX idx_results_date ON results(date DESC);
    
    RAISE NOTICE 'Tabela results je kreirana';
  END IF;
END $$;


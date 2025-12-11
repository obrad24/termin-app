-- SQL skripta za postavljanje samo dva tima: Murinjo i Lalat
-- Pokrenite ovu skriptu u SQL Editor-u u Supabase dashboard-u

-- Obriši sve postojeće timove
DELETE FROM teams;

-- Dodaj samo dva tima: Murinjo i Lalat
INSERT INTO teams (name, short_name, created_at) VALUES
  ('Murinjo', 'MUR', NOW()),
  ('Lalat', 'LAL', NOW());

-- Ažuriraj sve igrače da budu bez tima (ili možete ručno dodeliti timove)
-- UPDATE players SET team = NULL;

-- Ažuriraj sve rezultate da koriste samo ova dva tima (opciono - možete ručno ažurirati)
-- UPDATE results SET home_team = 'Murinjo' WHERE home_team NOT IN ('Murinjo', 'Lalat');
-- UPDATE results SET away_team = 'Lalat' WHERE away_team NOT IN ('Murinjo', 'Lalat');


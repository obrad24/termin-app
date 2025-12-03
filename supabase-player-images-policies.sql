-- SQL skripta za Storage policies za player-images bucket
-- Pokrenite ovu skriptu u SQL Editor-u u Supabase dashboard-u
-- PRVO: Kreirajte bucket "player-images" u Storage sekciji i postavite ga kao public

-- Obriši postojeće policy-je ako postoje (opciono - preskoči ako nemaš postojeće)
DROP POLICY IF EXISTS "Public read access for player images" ON storage.objects;
DROP POLICY IF EXISTS "Public insert access for player images" ON storage.objects;

-- Dozvoli čitanje slika iz player-images bucketa
CREATE POLICY "Public read access for player images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'player-images');

-- Dozvoli upload slika u player-images bucket
CREATE POLICY "Public insert access for player images"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'player-images');



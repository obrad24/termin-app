-- SQL skripta za Storage policies za team-logos bucket
-- Pokrenite ovu skriptu u SQL Editor-u u Supabase dashboard-u

-- Obriši postojeće policy-je ako postoje (opciono - preskoči ako nemaš postojeće)
DROP POLICY IF EXISTS "Public read access for team logos" ON storage.objects;
DROP POLICY IF EXISTS "Public insert access for team logos" ON storage.objects;

-- Dozvoli čitanje slika iz team-logos bucketa
CREATE POLICY "Public read access for team logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'team-logos');

-- Dozvoli upload slika u team-logos bucket
CREATE POLICY "Public insert access for team logos"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'team-logos');


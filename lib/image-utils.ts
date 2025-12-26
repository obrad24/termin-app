/**
 * Helper funkcija za dobijanje pravilnog URL-a za sliku igrača
 * Ako je URL relativan ili neispravan, vraća fallback
 * Radi i na server i client strani
 */
export function getPlayerImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl || imageUrl.trim() === '') {
    return '/no-image-player.png'
  }

  const trimmedUrl = imageUrl.trim()

  // Ako je već puni URL (http/https), koristi ga direktno
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return trimmedUrl
  }

  // Pokušaj da dobiješ Supabase URL - radi i na server i client strani
  // Next.js automatski injektuje NEXT_PUBLIC_ varijable u client bundle
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!supabaseUrl) {
    // Ako nema Supabase URL-a, vrati fallback
    return '/no-image-player.png'
  }

  const baseUrl = supabaseUrl.replace(/\/$/, '')

  // Ako je relativan put koji već počinje sa /storage/, samo dodaj base URL
  if (trimmedUrl.startsWith('/storage/')) {
    return `${baseUrl}${trimmedUrl}`
  }

  // Ako je relativan put (npr. /storage/...), dodaj Supabase URL
  if (trimmedUrl.startsWith('/')) {
    return `${baseUrl}${trimmedUrl}`
  }

  // Ako je samo putanja (npr. players/filename.jpg ili team-logos/players/filename.jpg), kreiraj puni URL
  if (trimmedUrl.includes('players/') || trimmedUrl.includes('team-logos/')) {
    // Provjeri da li već ima /storage/v1/object/public/ u putanji
    if (trimmedUrl.includes('/storage/v1/object/public/')) {
      return `${baseUrl}/${trimmedUrl}`
    }
    // Ako je samo putanja bez /storage/, dodaj punu putanju
    // Provjeri da li putanja već počinje sa team-logos/
    if (trimmedUrl.startsWith('team-logos/')) {
      return `${baseUrl}/storage/v1/object/public/${trimmedUrl}`
    }
    // Ako je samo players/filename.jpg, dodaj team-logos/ prefix
    return `${baseUrl}/storage/v1/object/public/team-logos/${trimmedUrl}`
  }

  // Ako je samo ime fajla ili nešto što ne odgovara gornjim slučajevima
  // Pretpostavi da je u team-logos bucket-u
  return `${baseUrl}/storage/v1/object/public/team-logos/${trimmedUrl}`
}


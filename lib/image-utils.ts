/**
 * Helper funkcija za dobijanje pravilnog URL-a za sliku igrača
 * Ako je URL relativan ili neispravan, vraća fallback
 */
export function getPlayerImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) {
    return '/no-image-player.png'
  }

  // Ako je već puni URL (http/https), koristi ga direktno
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }

  // Ako je relativan put (npr. /storage/...), dodaj Supabase URL
  if (imageUrl.startsWith('/')) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (supabaseUrl) {
      // Ukloni trailing slash ako postoji
      const baseUrl = supabaseUrl.replace(/\/$/, '')
      return `${baseUrl}${imageUrl}`
    }
  }

  // Ako je samo putanja (npr. players/filename.jpg), kreiraj puni URL
  if (imageUrl.includes('players/') || imageUrl.includes('team-logos/')) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (supabaseUrl) {
      const baseUrl = supabaseUrl.replace(/\/$/, '')
      // Provjeri da li već ima /storage/v1/object/public/
      if (imageUrl.includes('/storage/')) {
        return `${baseUrl}${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`
      }
      return `${baseUrl}/storage/v1/object/public/team-logos/${imageUrl}`
    }
  }

  // Fallback na default sliku
  return '/no-image-player.png'
}


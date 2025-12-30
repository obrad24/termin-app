/**
 * Helper funkcija za dobijanje pravilnog URL-a za sliku igrača
 * Ako je URL relativan ili neispravan, vraća fallback
 * Radi i na server i client strani
 */
export function getPlayerImageUrl(imageUrl: string | null | undefined, addCacheBust: boolean = false): string {
  if (!imageUrl || imageUrl.trim() === '') {
    return '/no-image-player.png'
  }

  const trimmedUrl = imageUrl.trim()
  let finalUrl = ''

  // Pokušaj da dobiješ Supabase URL - radi i na server i client strani
  // Next.js automatski injektuje NEXT_PUBLIC_ varijable u client bundle
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  // Ako je već puni URL (http/https), koristi ga direktno
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    finalUrl = trimmedUrl
  } else if (!supabaseUrl) {
    // Ako nema Supabase URL-a, vrati fallback
    return '/no-image-player.png'
  } else {
    const baseUrl = supabaseUrl.replace(/\/$/, '')

    // Ako je relativan put koji već počinje sa /storage/, samo dodaj base URL
    if (trimmedUrl.startsWith('/storage/')) {
      finalUrl = `${baseUrl}${trimmedUrl}`
    }
    // Ako je relativan put (npr. /storage/...), dodaj Supabase URL
    else if (trimmedUrl.startsWith('/')) {
      finalUrl = `${baseUrl}${trimmedUrl}`
    }
    // Ako je samo putanja (npr. players/filename.jpg ili team-logos/players/filename.jpg), kreiraj puni URL
    else if (trimmedUrl.includes('players/') || trimmedUrl.includes('team-logos/')) {
      // Provjeri da li već ima /storage/v1/object/public/ u putanji
      if (trimmedUrl.includes('/storage/v1/object/public/')) {
        finalUrl = `${baseUrl}/${trimmedUrl}`
      }
      // Ako je samo putanja bez /storage/, dodaj punu putanju
      // Provjeri da li putanja već počinje sa team-logos/
      else if (trimmedUrl.startsWith('team-logos/')) {
        finalUrl = `${baseUrl}/storage/v1/object/public/${trimmedUrl}`
      }
      // Ako je samo players/filename.jpg, dodaj team-logos/ prefix
      else {
        finalUrl = `${baseUrl}/storage/v1/object/public/team-logos/${trimmedUrl}`
      }
    }
    else {
      finalUrl = `${baseUrl}/storage/v1/object/public/team-logos/${trimmedUrl}`
    }
  }

  // Dodaj cache busting query parameter ako je traženo
  if (addCacheBust && finalUrl && !finalUrl.includes('?')) {
    finalUrl += `?t=${Date.now()}`
  }

  return finalUrl
}


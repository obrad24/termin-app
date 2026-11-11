/**
 * Helper funkcija za dobijanje pravilnog URL-a za sliku igrača
 * Podržava lokalne /uploads putanje, pune URL-ove i stare Supabase storage putanje
 */
export function getPlayerImageUrl(imageUrl: string | null | undefined, addCacheBust: boolean = false): string {
  if (!imageUrl || imageUrl.trim() === '') {
    return '/no-image-player.png'
  }

  const trimmedUrl = imageUrl.trim()
  let finalUrl = ''

  // Ako je već puni URL (http/https), koristi ga direktno
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    finalUrl = trimmedUrl
  } else if (trimmedUrl.startsWith('/uploads/')) {
    finalUrl = trimmedUrl
  } else if (trimmedUrl.startsWith('/')) {
    finalUrl = trimmedUrl
  } else if (trimmedUrl.startsWith('uploads/')) {
    finalUrl = `/${trimmedUrl}`
  } else if (trimmedUrl.startsWith('team-logos/') || trimmedUrl.startsWith('players/')) {
    // Lokalni upload format: /uploads/<bucket>/<path>
    finalUrl = trimmedUrl.startsWith('team-logos/')
      ? `/uploads/${trimmedUrl}`
      : `/uploads/team-logos/${trimmedUrl}`
  } else {
    finalUrl = `/uploads/team-logos/${trimmedUrl}`
  }

  if (addCacheBust && finalUrl && !finalUrl.includes('?')) {
    finalUrl += `?t=${Date.now()}`
  }

  return finalUrl
}


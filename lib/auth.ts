import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * Proverava da li je korisnik autentifikovan kao admin
 * Koristi se u API rutama i middleware-u
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const session = cookieStore.get('admin_session')
    return session?.value === 'authenticated'
  } catch (error) {
    console.error('Error checking authentication:', error)
    return false
  }
}

/**
 * Middleware helper za proveru autentifikacije u API rutama
 * Vraća NextResponse sa error statusom ako nije autentifikovan
 */
export async function requireAuth() {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return {
      error: true,
      response: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ),
    }
  }
  return { error: false, response: null }
}


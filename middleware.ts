import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Proveri da li je ruta /admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Preskoči middleware za API rute (one imaju svoju proveru)
    if (request.nextUrl.pathname.startsWith('/api/admin')) {
      return NextResponse.next()
    }

    // Proveri session cookie
    const session = request.cookies.get('admin_session')
    
    if (!session || session.value !== 'authenticated') {
      // Ako nije autentifikovan, dozvoli pristup samo login stranici
      // Login će biti na /admin stranici sa proverom
      // Middleware samo proverava cookie, frontend će prikazati login formu
      return NextResponse.next()
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
  ],
}


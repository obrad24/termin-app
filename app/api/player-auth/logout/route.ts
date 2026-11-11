import { NextResponse } from 'next/server'
import { clearPlayerSession } from '@/lib/player-auth'

export const dynamic = 'force-dynamic'

export async function POST() {
  await clearPlayerSession()
  return NextResponse.json({ success: true })
}

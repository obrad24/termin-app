import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { getPlayerSession } from '@/lib/player-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ authenticated: false })
    }

    const session = await getPlayerSession()
    if (!session) {
      return NextResponse.json({ authenticated: false })
    }

    let player = null
    if (session.playerId > 0) {
      const { data } = await supabase
        .from('players')
        .select('id, first_name, last_name, team, image_url')
        .eq('id', session.playerId)
        .maybeSingle()
      player = data || null
    }

    return NextResponse.json({
      authenticated: true,
      account: {
        id: session.accountId,
        player_id: session.playerId > 0 ? session.playerId : null,
        nickname: session.nickname,
      },
      player,
    })
  } catch (error: any) {
    return NextResponse.json({ authenticated: false, error: error.message })
  }
}

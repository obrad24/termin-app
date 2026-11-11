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

    const { data: player } = await supabase
      .from('players')
      .select('id, first_name, last_name, team, image_url')
      .eq('id', session.playerId)
      .maybeSingle()

    return NextResponse.json({
      authenticated: true,
      account: {
        id: session.accountId,
        player_id: session.playerId,
        nickname: session.nickname,
      },
      player: player || null,
    })
  } catch (error: any) {
    return NextResponse.json({ authenticated: false, error: error.message })
  }
}

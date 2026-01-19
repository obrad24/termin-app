import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

// Generiše naslov na osnovu meča - različiti naslovi u zavisnosti ko pobedi
function generateTitle(
  homeTeam: string,
  awayTeam: string,
  homeScore: number,
  awayScore: number
): string {
  const isHomeWinner = homeScore > awayScore
  const isAwayWinner = awayScore > homeScore
  const winner = isHomeWinner ? homeTeam : isAwayWinner ? awayTeam : null
  const loser = isHomeWinner ? awayTeam : isAwayWinner ? homeTeam : null
  const isDraw = homeScore === awayScore
  const scoreDiff = Math.abs(homeScore - awayScore)
  const maxScore = Math.max(homeScore, awayScore)

  if (isDraw) {
    const titles = [
      `${homeTeam} i ${awayTeam} podelili bodove`,
      `Nerešeno između ${homeTeam}-a i ${awayTeam}-a`,
      `${homeTeam} i ${awayTeam} bez pobednika`,
      `Remi: ${homeTeam} ${homeScore}:${awayScore} ${awayTeam}`,
    ]
    return titles[Math.floor(Math.random() * titles.length)]
  }

  // Različiti naslovi u zavisnosti ko pobedi
  const titles: string[] = []
  
  // Ako pobedi domaći tim
  if (isHomeWinner) {
    // Osnovni naslovi
    titles.push(`${homeTeam} dobio ${awayTeam}`)
    titles.push(`${homeTeam} pobedio ${awayTeam}`)
    
    // Naslovi sa "opet" (za veće razlike)
    if (scoreDiff >= 2) {
      titles.push(`${homeTeam} opet dobio ${awayTeam}`)
      titles.push(`${homeTeam} ponovo pobedio ${awayTeam}`)
      titles.push(`${homeTeam} opet pobedio ${awayTeam}`)
    }
    
    // Naslovi sa rezultatom
    titles.push(`${homeTeam} dobio ${awayTeam} sa ${homeScore}:${awayScore}`)
    titles.push(`${homeTeam} pobedio ${awayTeam} ${homeScore}:${awayScore}`)
    
    // Naslovi za visoke rezultate
    if (maxScore >= 4) {
      titles.push(`${homeTeam} razbio ${awayTeam}-a`)
      titles.push(`${homeTeam} ubedljivo pobedio ${awayTeam}-a`)
      titles.push(`${homeTeam} dominacija protiv ${awayTeam}-a`)
    }
    
    // Naslovi za male razlike
    if (scoreDiff === 1) {
      titles.push(`${homeTeam} pobedio ${awayTeam}-a minimalno`)
      titles.push(`${homeTeam} odneo pobedu protiv ${awayTeam}-a`)
    }
  } 
  // Ako pobedi gostujući tim
  else if (isAwayWinner) {
    // Osnovni naslovi
    titles.push(`${awayTeam} dobio ${homeTeam}`)
    titles.push(`${awayTeam} pobedio ${homeTeam}`)
    
    // Naslovi sa "opet" (za veće razlike)
    if (scoreDiff >= 2) {
      titles.push(`${awayTeam} opet dobio ${homeTeam}`)
      titles.push(`${awayTeam} ponovo pobedio ${homeTeam}`)
      titles.push(`${awayTeam} opet pobedio ${homeTeam}`)
    }
    
    // Naslovi sa rezultatom
    titles.push(`${awayTeam} dobio ${homeTeam} sa ${awayScore}:${homeScore}`)
    titles.push(`${awayTeam} pobedio ${homeTeam} ${awayScore}:${homeScore}`)
    
    // Naslovi za visoke rezultate
    if (maxScore >= 4) {
      titles.push(`${awayTeam} razbio ${homeTeam}-a`)
      titles.push(`${awayTeam} ubedljivo pobedio ${homeTeam}-a`)
      titles.push(`${awayTeam} dominacija protiv ${homeTeam}-a`)
    }
    
    // Naslovi za male razlike
    if (scoreDiff === 1) {
      titles.push(`${awayTeam} pobedio ${homeTeam}-a minimalno`)
      titles.push(`${awayTeam} odneo pobedu protiv ${homeTeam}-a`)
    }
  }

  return titles[Math.floor(Math.random() * titles.length)]
}

// Generiše komentar najboljeg strijelca
function generateTopScorerComment(
  playerName: string,
  goalsCount: number,
  teamName: string,
  isWinner: boolean,
  matchScore: string
): string {
  const comments = [
    `"Bilo je odlično osećanje postići ${goalsCount} ${goalsCount === 1 ? 'gol' : goalsCount < 5 ? 'gola' : 'golova'} u ovoj utakmici. ${isWinner ? 'Pobeda je najvažnija stvar i svi smo radovali zajedno.' : 'Nažalost nismo uspeli da pobedimo, ali ćemo nastaviti da se borimo.'}"`,
    `"${goalsCount === 1 ? 'Gol' : 'Golovi'} koje sam postigao ${isWinner ? 'su pomogli timu da ostvari važnu pobedu' : 'nisu bili dovoljni za pobedu'}. ${isWinner ? 'Radujem se što sam doprineo timu.' : 'Moramo da radimo još više u narednim utakmicama.'}"`,
    `"Osećam se odlično nakon ${goalsCount === 1 ? 'ovog gola' : 'ovih golova'}. ${isWinner ? 'Pobeda je rezultat timskog rada i svi smo zaslužili ovaj uspeh.' : 'Nažalost rezultat nije bio onakav kakav smo želeli, ali nećemo odustati.'}"`,
    `"${goalsCount === 1 ? 'Postizanje gola' : 'Postizanje golova'} u ovoj utakmici ${isWinner ? 'je bilo posebno važno za naš tim. Svi smo radovali zajedno.' : 'je bilo lepo, ali nažalost nije bilo dovoljno za pobedu.'}"`,
  ]
  return comments[Math.floor(Math.random() * comments.length)]
}

// Besplatna opcija - generiše tekst bez AI-a koristeći template
function generateTextFromTemplate(
  matchData: MatchData,
  homeGoals: Array<{ player_name: string; player_id?: number; goal_minute?: number | null }>,
  awayGoals: Array<{ player_name: string; player_id?: number; goal_minute?: number | null }>
): { text: string; paragraphs: string[] } {
  const matchDate = new Date(matchData.date)
  const formattedDate = matchDate.toLocaleDateString('sr-RS', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  })
  
  const winner = matchData.home_score > matchData.away_score 
    ? matchData.home_team 
    : matchData.away_score > matchData.home_score 
    ? matchData.away_team 
    : null

  const isDraw = matchData.home_score === matchData.away_score
  const totalGoals = matchData.home_score + matchData.away_score

  // Grupiši golove po igraču
  const groupGoalsByPlayer = (goals: Array<{ player_name: string; goal_minute?: number | null }>) => {
    const grouped = new Map<string, { count: number; minutes: number[] }>()
    goals.forEach(g => {
      const existing = grouped.get(g.player_name) || { count: 0, minutes: [] }
      existing.count++
      if (g.goal_minute) existing.minutes.push(g.goal_minute)
      grouped.set(g.player_name, existing)
    })
    return Array.from(grouped.entries()).map(([name, data]) => ({
      name,
      count: data.count,
      minutes: data.minutes.sort((a, b) => a - b)
    }))
  }

  const homeScorers = groupGoalsByPlayer(homeGoals)
  const awayScorers = groupGoalsByPlayer(awayGoals)

  const formatScorers = (scorers: typeof homeScorers) => {
    if (scorers.length === 0) return 'nema strijelaca'
    return scorers.map(s => {
      if (s.count === 1) {
        return s.minutes.length > 0 
          ? `${s.name} (${s.minutes[0]}')`
          : s.name
      } else {
        return `${s.name} (${s.count} gola${s.minutes.length > 0 ? ` - ${s.minutes.join(', ')}'` : ''})`
      }
    }).join(', ')
  }

  const homeScorersText = formatScorers(homeScorers)
  const awayScorersText = formatScorers(awayScorers)

  const sentences: string[] = []

  // Rečenica 1: Uvod
  sentences.push(`U utakmici odigranoj ${formattedDate}, ${matchData.home_team} i ${matchData.away_team} su se susreli u zanimljivom duelu.`)

  // Rečenica 2: Rezultat
  if (isDraw) {
    sentences.push(`Utakmica je završena nerešenim rezultatom ${matchData.home_score}:${matchData.away_score}, što je oba tima ostavilo bez bodova.`)
  } else {
    sentences.push(`${winner} je pobedio sa rezultatom ${matchData.home_score}:${matchData.away_score}, ostvarivši važnu pobedu u ovoj utakmici.`)
  }

  // Rečenica 3: Opis utakmice
  if (totalGoals >= 4) {
    sentences.push(`Utakmica je bila izuzetno golmana, sa ukupno ${totalGoals} golova, što je publiku držalo u napetosti tokom čitavog meča.`)
  } else if (totalGoals === 0) {
    sentences.push(`Utakmica je prošla bez golova, što je pokazalo da su oba tima imala dobru odbranu tokom čitavog meča.`)
  } else {
    sentences.push(`Utakmica je donela ${totalGoals} ${totalGoals === 1 ? 'gol' : totalGoals < 5 ? 'gola' : 'golova'}, što je obezbedilo zanimljiv spektakl za gledaoce.`)
  }

  // Rečenica 4: Domaći tim strijelci
  if (homeGoals.length > 0) {
    sentences.push(`Za ${matchData.home_team} su postigli golove: ${homeScorersText}.`)
  } else {
    sentences.push(`${matchData.home_team} nije uspeo da postigne gol u ovoj utakmici.`)
  }

  // Rečenica 5: Gostujući tim strijelci
  if (awayGoals.length > 0) {
    sentences.push(`Za ${matchData.away_team} su postigli golove: ${awayScorersText}.`)
  } else {
    sentences.push(`${matchData.away_team} nije uspeo da postigne gol u ovoj utakmici.`)
  }

  // Rečenica 6: Analiza rezultata
  if (matchData.home_score > matchData.away_score) {
    sentences.push(`${matchData.home_team} je pokazao bolju formu i zasluženo odnosi pobedu pred svojim navijačima.`)
  } else if (matchData.away_score > matchData.home_score) {
    sentences.push(`${matchData.away_team} je uspeo da ostvari važnu pobedu u gostima, što je značajan uspeh za ovaj tim.`)
  } else {
    sentences.push(`Oba tima su pokazala solidnu igru, ali nijedan nije uspeo da odluči utakmicu u svoju korist.`)
  }

  // Rečenica 7: Najbolji strijelac
  const allScorers = [...homeScorers, ...awayScorers]
  if (allScorers.length > 0) {
    const topScorer = allScorers.reduce((prev, current) => 
      (prev.count > current.count) ? prev : current
    )
    if (topScorer.count > 1) {
      sentences.push(`Najefikasniji igrač utakmice bio je ${topScorer.name}, koji je postigao ${topScorer.count} gola.`)
    } else if (allScorers.length === 1) {
      sentences.push(`Jedini strijelac utakmice bio je ${topScorer.name}, koji je odlučio ishod meča.`)
    } else {
      sentences.push(`Golovi su bili raspoređeni između više igrača, što pokazuje kolektivnu igru oba tima.`)
    }
  }

  // Rečenica 8: Utisci
  if (totalGoals >= 4) {
    sentences.push(`Utakmica je pružila odličan spektakl sa mnogo akcije i golova, što je publiku oduševilo.`)
  } else {
    sentences.push(`Utakmica je bila taktički zanimljiva, sa oba tima koja su pokazala dobru organizaciju na terenu.`)
  }

  // Rečenica 9: Zaključak
  if (winner) {
    sentences.push(`Pobeda ${winner}-a je važan korak ka ostvarenju ciljeva u ovoj sezoni.`)
  } else {
    sentences.push(`Nerešen rezultat ostavlja oba tima sa poenom, što može biti važno za dalji tok sezone.`)
  }

  // Rečenica 10: Finalna
  sentences.push(`Ova utakmica je pokazala da oba tima imaju kvalitet i da će se boriti do kraja sezone za najbolje rezultate.`)

  // Podeli u tačno 4 paragrafa
  // Paragraf 1: Uvod i rezultat (rečenice 1-2)
  // Paragraf 2: Opis utakmice i strijelci (rečenice 3-5)
  // Paragraf 3: Analiza i najbolji strijelac (rečenice 6-7)
  // Paragraf 4: Utisci i zaključak (rečenice 8-10)
  
  const paragraph1 = sentences.slice(0, 2).join(' ')
  const paragraph2 = sentences.slice(2, 5).join(' ')
  const paragraph3 = sentences.slice(5, 7).join(' ')
  const paragraph4 = sentences.slice(7, 10).join(' ')

  const paragraphs = [
    paragraph1,
    paragraph2,
    paragraph3,
    paragraph4
  ].filter(p => p.trim())

  const finalText = paragraphs.join('\n\n')
  
  // Debug log
  console.log('Generated paragraphs count:', paragraphs.length)
  console.log('Final text preview:', finalText.substring(0, 200))
  
  return {
    text: finalText,
    paragraphs: paragraphs
  }
}

interface MatchData {
  home_team: string
  away_team: string
  home_score: number
  away_score: number
  date: string
  goals: Array<{
    player_name: string
    player_id?: number
    team_type: 'home' | 'away'
    goal_minute?: number | null
  }>
}

// POST - Generisanje teksta o poslednjem meču koristeći template-based pristup
export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          error: 'Supabase not configured',
          message: 'Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables',
        },
        { status: 503 }
      )
    }

    // Provera autentifikacije
    const authCheck = await requireAuth()
    if (authCheck.error) {
      return authCheck.response
    }

    // Dobijanje poslednjeg meča
    const { data: results, error: resultsError } = await supabase
      .from('results')
      .select('*')
      .order('id', { ascending: false })
      .limit(1)
      .single()

    if (resultsError || !results) {
      return NextResponse.json(
        { error: 'Nema dostupnih mečeva. Dodajte meč prvo.' },
        { status: 404 }
      )
    }

    // Dobijanje strijelaca za poslednji meč
    const { data: goals, error: goalsError } = await supabase
      .from('match_goals')
      .select('player_id, team_type, goal_minute')
      .eq('result_id', results.id)

    let goalsWithPlayers: Array<{
      player_name: string
      player_id?: number
      team_type: 'home' | 'away'
      goal_minute?: number | null
    }> = []

    if (goals && goals.length > 0) {
      const playerIds = [...new Set(goals.map(g => g.player_id))]
      const { data: playersData } = await supabase
        .from('players')
        .select('id, first_name, last_name')
        .in('id', playerIds)

      goalsWithPlayers = goals.map(goal => {
        const player = playersData?.find(p => p.id === goal.player_id)
        return {
          player_name: player 
            ? `${player.first_name} ${player.last_name}`
            : `Igrač #${goal.player_id}`,
          player_id: goal.player_id,
          team_type: goal.team_type,
          goal_minute: goal.goal_minute,
        }
      })
    }

    // Priprema podataka o meču
    const matchData: MatchData = {
      home_team: results.home_team,
      away_team: results.away_team,
      home_score: results.home_score,
      away_score: results.away_score,
      date: results.date,
      goals: goalsWithPlayers,
    }

    // Grupiši golove po timovima
    const homeGoals = goalsWithPlayers.filter(g => g.team_type === 'home')
    const awayGoals = goalsWithPlayers.filter(g => g.team_type === 'away')

    // Pronađi najboljeg strijelca
    const allGoals = [...homeGoals, ...awayGoals]
    const goalsByPlayer = new Map<number, { name: string; count: number; team: string }>()
    
    allGoals.forEach(goal => {
      if (goal.player_id) {
        const existing = goalsByPlayer.get(goal.player_id) || { 
          name: goal.player_name, 
          count: 0, 
          team: goal.team_type === 'home' ? matchData.home_team : matchData.away_team 
        }
        existing.count++
        goalsByPlayer.set(goal.player_id, existing)
      }
    })

    let topScorerId: number | null = null
    let topScorerComment: string | null = null
    let topScorerName: string | null = null
    let topScorerTeam: string | null = null

    if (goalsByPlayer.size > 0) {
      const topScorer = Array.from(goalsByPlayer.entries()).reduce((prev, current) => 
        current[1].count > prev[1].count ? current : prev
      )
      
      topScorerId = topScorer[0]
      topScorerName = topScorer[1].name
      topScorerTeam = topScorer[1].team
      const isWinner = (matchData.home_score > matchData.away_score && topScorer[1].team === matchData.home_team) ||
                       (matchData.away_score > matchData.home_score && topScorer[1].team === matchData.away_team)
      const matchScore = `${matchData.home_score}:${matchData.away_score}`
      
      topScorerComment = generateTopScorerComment(
        topScorerName,
        topScorer[1].count,
        topScorerTeam,
        isWinner,
        matchScore
      )
    }

    // Generiši naslov
    const generatedTitle = generateTitle(
      matchData.home_team,
      matchData.away_team,
      matchData.home_score,
      matchData.away_score
    )
    
    console.log('Generated title:', generatedTitle) // Debug log

    // Generiši tekst koristeći template-based pristup (besplatna opcija)
    const generatedResult = generateTextFromTemplate(matchData, homeGoals, awayGoals)
    const generatedText = generatedResult.text
    
    // Debug log
    console.log('Generated text length:', generatedText.length)
    console.log('Generated text has \\n\\n:', generatedText.includes('\n\n'))
    console.log('Paragraphs count:', generatedResult.paragraphs.length)

    // Čuvanje generisanog teksta u bazu
    const { data: existingData } = await supabase
      .from('termin_news')
      .select('id')
      .limit(1)

    let savedData

    // Ako postoji red, ažuriraj ga
    if (existingData && existingData.length > 0) {
      const { data, error } = await supabase
        .from('termin_news')
        .update({ 
          content: generatedText,
          title: generatedTitle,
          top_scorer_id: topScorerId,
          top_scorer_comment: topScorerComment
        })
        .eq('id', existingData[0].id)
        .select()

      if (error) {
        console.error('Error updating termin news:', error)
        return NextResponse.json(
          { error: 'Greška pri čuvanju teksta', details: error.message },
          { status: 500 }
        )
      }

      savedData = data && data.length > 0 ? data[0] : null
    } else {
      // Kreiraj novi red
      const { data, error } = await supabase
        .from('termin_news')
        .insert({ 
          content: generatedText,
          title: generatedTitle,
          top_scorer_id: topScorerId,
          top_scorer_comment: topScorerComment
        })
        .select()

      if (error) {
        console.error('Error creating termin news:', error)
        return NextResponse.json(
          { error: 'Greška pri čuvanju teksta', details: error.message },
          { status: 500 }
        )
      }

      savedData = data && data.length > 0 ? data[0] : null
    }

    if (!savedData) {
      return NextResponse.json(
        { error: 'Greška pri čuvanju teksta' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        content: generatedText,
        title: generatedTitle,
        match_data: matchData,
        top_scorer: topScorerId ? {
          id: topScorerId,
          name: topScorerName,
          team: topScorerTeam,
          comment: topScorerComment
        } : null,
        success: true 
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// Neon-backed database client (Supabase-compatible API surface used by this app)
export {
  db as supabase,
  isDatabaseConfigured as isSupabaseConfigured,
  isDatabaseConfigured,
  getSql,
} from '@/lib/db'

// Tip za sezonu
export interface Season {
  id: number
  name: string
  created_at?: string
}

// Tipovi za rezultate
export interface Result {
  id: number
  home_team: string
  away_team: string
  home_score: number
  away_score: number
  date: string
  // ID sezone (opciono za starije podatke)
  season_id?: number | null
  odds_1?: number | null
  odds_x?: number | null
  odds_2?: number | null
  created_at?: string
}

// Tipovi za igrače
export interface Player {
  id: number
  first_name: string
  last_name: string
  birth_year: number
  team?: string | null
  image_url?: string | null
  pace?: number | null
  shooting?: number | null
  passing?: number | null
  dribbling?: number | null
  defending?: number | null
  physical?: number | null
  stamina?: number | null
  injury?: boolean | null
  rating_bonus?: number | null
  created_at?: string
}

// Tipovi za timove
export interface Team {
  id: number
  name: string
  short_name?: string | null
  logo_url?: string | null
  created_at?: string
}

// Tipovi za strijelce
export interface MatchGoal {
  id: number
  result_id: number
  player_id: number
  team_type: 'home' | 'away'
  goal_minute?: number | null
  created_at?: string
}

// Tipovi za igrače koji su igrali
export interface MatchPlayer {
  id: number
  result_id: number
  player_id: number
  team_type: 'home' | 'away'
  created_at?: string
}

// Tipovi za komentare na utakmicama
export interface MatchComment {
  id: number
  match_id: number
  nickname: string
  comment: string
  created_at?: string
  likes_count?: number
  dislikes_count?: number
  user_like_type?: 'like' | 'dislike' | null
}

// Tipovi za lajkove/dislajkove komentara
export interface MatchCommentLike {
  id: number
  comment_id: number
  like_type: 'like' | 'dislike'
  user_ip?: string | null
  created_at?: string
}

// Prošireni tip za rezultat sa strijelcima i igračima
export interface ResultWithDetails extends Result {
  goals?: MatchGoal[]
  players?: MatchPlayer[]
}

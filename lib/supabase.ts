import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || ''

// Helper funkcija za proveru da li je Supabase konfigurisan
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && 
           supabaseUrl !== 'your-project.supabase.co' && 
           !supabaseUrl.includes('your-project') &&
           supabaseUrl.startsWith('https://') &&
           supabaseAnonKey.length > 20 &&
           supabaseAnonKey !== 'your-anon-key-here')
}

// Kreiraj klijent - API routes će proveriti pre korišćenja
export const supabase: SupabaseClient = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-key')

// Tipovi za rezultate
export interface Result {
  id: number
  home_team: string
  away_team: string
  home_score: number
  away_score: number
  date: string
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



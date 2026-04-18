import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const isMissing = !supabaseUrl || !supabaseAnonKey

if (isMissing) {
  console.warn(
    '⚠️ Missing Supabase environment variables.\n' +
    'Copy .env.example to .env and add your Supabase project URL and anon key.\n' +
    'The app will render but API calls will fail.'
  )
}

// Use dummy URL that is still a valid URL format to avoid crashing
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder'
)

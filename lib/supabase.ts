import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: {
      getItem: (key: string) => {
        if (typeof window === 'undefined') return null
        return localStorage.getItem(key)
      },
      setItem: (key: string, value: string) => {
        if (typeof window === 'undefined') return
        localStorage.setItem(key, value)
      },
      removeItem: (key: string) => {
        if (typeof window === 'undefined') return
        localStorage.removeItem(key)
      }
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'casa8-web'
    }
  }
})

// Re-export types from database.types.ts
export type {
  Database,
  Profile,
  Property,
  PropertyImage,
  Message,
  Application,
  UserFavorite,
  PropertyVideo,
  PropertyWithDetails,
  MessageWithProfiles,
  ApplicationWithDetails
} from './database.types'

// Re-export type guards
export {
  isProfile,
  isProperty,
  isMessage,
  isApplication
} from './database.types'

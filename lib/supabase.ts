import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database type definitions
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'tenant' | 'landlord'
          phone: string | null
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role: 'tenant' | 'landlord'
          phone?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'tenant' | 'landlord'
          phone?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      properties: {
        Row: {
          id: string
          title: string
          description: string | null
          address: string
          city: string
          state: string
          zip_code: string
          price: number
          bedrooms: number
          bathrooms: number
          square_feet: number | null
          property_type: string
          amenities: string[] | null
          available: boolean
          landlord_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          address: string
          city: string
          state: string
          zip_code: string
          price: number
          bedrooms: number
          bathrooms: number
          square_feet?: number | null
          property_type: string
          amenities?: string[] | null
          available?: boolean
          landlord_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          address?: string
          city?: string
          state?: string
          zip_code?: string
          price?: number
          bedrooms?: number
          bathrooms?: number
          square_feet?: number | null
          property_type?: string
          amenities?: string[] | null
          available?: boolean
          landlord_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      property_images: {
        Row: {
          id: string
          property_id: string
          image_url: string
          alt_text: string | null
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          property_id: string
          image_url: string
          alt_text?: string | null
          order_index: number
          created_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          image_url?: string
          alt_text?: string | null
          order_index?: number
          created_at?: string
        }
      }
      user_favorites: {
        Row: {
          id: string
          user_id: string
          property_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          property_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          property_id?: string
          created_at?: string
        }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Property = Database['public']['Tables']['properties']['Row']
export type PropertyImage = Database['public']['Tables']['property_images']['Row']
export type UserFavorite = Database['public']['Tables']['user_favorites']['Row']

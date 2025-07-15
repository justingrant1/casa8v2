export interface Database {
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
          has_section8: boolean | null
          voucher_bedrooms: string | null
          preferred_city: string | null
          onboarding_completed: boolean
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
          has_section8?: boolean | null
          voucher_bedrooms?: string | null
          preferred_city?: string | null
          onboarding_completed?: boolean
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
          has_section8?: boolean | null
          voucher_bedrooms?: string | null
          preferred_city?: string | null
          onboarding_completed?: boolean
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
          latitude: string | null
          longitude: string | null
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
          latitude?: string | null
          longitude?: string | null
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
          latitude?: string | null
          longitude?: string | null
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
        }
      }
      messages: {
        Row: {
          id: string
          property_id: string
          sender_id: string
          recipient_id: string
          subject: string
          message_text: string
          message_type: 'inquiry' | 'application' | 'general'
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          property_id: string
          sender_id: string
          recipient_id: string
          subject: string
          message_text: string
          message_type: 'inquiry' | 'application' | 'general'
          read?: boolean
          created_at?: string
        }
        Update: {
          read?: boolean
          updated_at?: string
        }
      }
      applications: {
        Row: {
          id: string
          property_id: string
          tenant_id: string
          landlord_id: string
          status: 'pending' | 'approved' | 'rejected'
          move_in_date: string | null
          monthly_income: number | null
          employment_status: string | null
          has_section8: boolean | null
          additional_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id: string
          tenant_id: string
          landlord_id: string
          status?: 'pending' | 'approved' | 'rejected'
          move_in_date?: string | null
          monthly_income?: number | null
          employment_status?: string | null
          has_section8?: boolean | null
          additional_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'pending' | 'approved' | 'rejected'
          move_in_date?: string | null
          monthly_income?: number | null
          employment_status?: string | null
          has_section8?: boolean | null
          additional_notes?: string | null
          updated_at?: string
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
        Update: never
      }
      property_videos: {
        Row: {
          id: string
          property_id: string
          video_url: string
          thumbnail_url: string | null
          title: string | null
          description: string | null
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          property_id: string
          video_url: string
          thumbnail_url?: string | null
          title?: string | null
          description?: string | null
          order_index: number
          created_at?: string
        }
        Update: {
          video_url?: string
          thumbnail_url?: string | null
          title?: string | null
          description?: string | null
          order_index?: number
        }
      }
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]
export type Row<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Insert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Update<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Common types
export type Profile = Row<'profiles'>
export type Property = Row<'properties'>
export type PropertyImage = Row<'property_images'>
export type Message = Row<'messages'>
export type Application = Row<'applications'>
export type UserFavorite = Row<'user_favorites'>
export type PropertyVideo = Row<'property_videos'>

// Extended types for joined queries
export type PropertyWithDetails = Property & {
  profiles?: {
    full_name: string | null
    email: string
    phone: string | null
  }
  property_images?: PropertyImage[]
  property_videos?: PropertyVideo[]
  contact_phone?: string | null
  allow_chat?: boolean
}

export type MessageWithProfiles = Message & {
  sender?: Profile
  recipient?: Profile
  property?: Property
}

export type ApplicationWithDetails = Application & {
  property?: Property
  tenant?: Profile
  landlord?: Profile
}

// Type guards
export function isProfile(obj: any): obj is Profile {
  return obj && typeof obj.id === 'string' && typeof obj.email === 'string'
}

export function isProperty(obj: any): obj is Property {
  return obj && typeof obj.id === 'string' && typeof obj.title === 'string'
}

export function isMessage(obj: any): obj is Message {
  return obj && typeof obj.id === 'string' && typeof obj.message_text === 'string'
}

export function isApplication(obj: any): obj is Application {
  return obj && typeof obj.id === 'string' && typeof obj.tenant_id === 'string'
}

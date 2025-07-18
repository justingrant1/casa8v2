import { supabase } from './supabase'
import type { Property, Database } from './supabase'

export type PropertyWithDetails = Property & {
  profiles?: {
    full_name: string | null
    email: string
    phone: string | null
  }
  property_images?: Array<{
    id: string
    image_url: string
    alt_text: string | null
    order_index: number
  }>
  property_videos?: Array<{
    id: string
    video_url: string
    title: string | null
    order_index: number
    file_size: number | null
  }>
  contact_phone?: string | null
  allow_chat?: boolean
}

// Cache for query results
const queryCache = new Map<string, { data: any, timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Simple retry function for database operations
const retryQuery = async <T>(
  queryFn: () => Promise<T>,
  maxAttempts = 2,
  delay = 1000
): Promise<T> => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await queryFn()
    } catch (error: any) {
      if (attempt === maxAttempts) {
        throw error
      }
      // Only retry on network errors or server errors
      if (error?.code === 'PGRST301' || error?.status >= 500) {
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      throw error
    }
  }
  throw new Error('Retry failed')
}

// Get cached result or execute query
const getCachedResult = async <T>(
  cacheKey: string,
  queryFn: () => Promise<T>
): Promise<T> => {
  const cached = queryCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }
  
  const result = await queryFn()
  queryCache.set(cacheKey, { data: result, timestamp: Date.now() })
  return result
}

// Clear cache when needed
export const clearPropertiesCache = () => {
  queryCache.clear()
}

export async function getProperties(options?: {
  limit?: number
  offset?: number
  city?: string
  minPrice?: number
  maxPrice?: number
  bedrooms?: number
  propertyType?: string
}) {
  // Simplified cache key - user auth status shouldn't affect property data
  const cacheKey = `properties-${JSON.stringify(options || {})}`
  
  return getCachedResult(cacheKey, async () => {
    return retryQuery(async () => {
      console.log('🔍 Fetching properties with options:', options)
      
      // Use lighter query for list view - don't fetch videos unless needed
      let query = supabase
        .from('properties')
        .select(`
          *,
          profiles!landlord_id (
            full_name,
            email,
            phone
          ),
          property_images (
            id,
            image_url,
            alt_text,
            order_index
          )
        `)
        .eq('available', true)
        .order('created_at', { ascending: false })

      // Apply filters
      if (options?.city) {
        query = query.ilike('city', `%${options.city}%`)
      }
      if (options?.minPrice) {
        query = query.gte('price', options.minPrice)
      }
      if (options?.maxPrice) {
        query = query.lte('price', options.maxPrice)
      }
      if (options?.bedrooms !== undefined) {
        query = query.eq('bedrooms', options.bedrooms)
      }
      if (options?.propertyType) {
        query = query.eq('property_type', options.propertyType)
      }

      // Apply pagination
      if (options?.limit) {
        query = query.limit(options.limit)
      }
      if (options?.offset) {
        query = query.range(options.offset, (options.offset + (options.limit || 10)) - 1)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching properties:', error)
        throw error
      }

      console.log('📊 Properties fetched successfully:', data?.length || 0, 'properties')
      return data as PropertyWithDetails[]
    })
  })
}

export async function getPropertyById(id: string) {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        profiles!landlord_id (
          full_name,
          email,
          phone
        ),
        property_images (
          id,
          image_url,
          alt_text,
          order_index
        ),
        property_videos (
          id,
          video_url,
          title,
          order_index,
          file_size
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching property:', error)
      throw error
    }

    return data as PropertyWithDetails
  } catch (error) {
    console.error('Error in getPropertyById:', error)
    throw error
  }
}

export async function searchProperties(searchTerm: string, options?: {
  limit?: number
  offset?: number
}) {
  try {
    let query = supabase
      .from('properties')
      .select(`
        *,
        profiles!landlord_id (
          full_name,
          email,
          phone
        ),
        property_images (
          id,
          image_url,
          alt_text,
          order_index
        )
      `)
      .eq('available', true)

    // Search in title, description, city, address
    if (searchTerm && searchTerm.trim()) {
      query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%`)
    }

    query = query.order('created_at', { ascending: false })

    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit)
    }
    if (options?.offset) {
      query = query.range(options.offset, (options.offset + (options.limit || 10)) - 1)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error searching properties:', error)
      throw error
    }

    return data as PropertyWithDetails[]
  } catch (error) {
    console.error('Error in searchProperties:', error)
    throw error
  }
}

export async function createProperty(propertyData: Database['public']['Tables']['properties']['Insert']) {
  try {
    const { data, error } = await supabase
      .from('properties')
      .insert(propertyData)
      .select()
      .single()

    if (error) {
      console.error('Error creating property:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in createProperty:', error)
    throw error
  }
}

export async function updateProperty(id: string, propertyData: Database['public']['Tables']['properties']['Update']) {
  try {
    const { data, error } = await supabase
      .from('properties')
      .update(propertyData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating property:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in updateProperty:', error)
    throw error
  }
}

export async function deleteProperty(id: string) {
  try {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting property:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('Error in deleteProperty:', error)
    throw error
  }
}

// Convert database property to frontend format for compatibility
export function formatPropertyForFrontend(property: PropertyWithDetails) {
  // Get all images or use placeholder
  const images = property.property_images?.map(img => img.image_url) || ['/placeholder.svg?height=300&width=400']
  const image = images[0] // Keep first image for backward compatibility
  
  // Format full address for display
  const fullAddress = [
    property.address,
    property.city,
    property.state,
    property.zip_code
  ].filter(Boolean).join(', ')
  
  return {
    id: property.id,
    title: property.title,
    price: Number(property.price),
    location: fullAddress || `${property.city}, ${property.state}`, // Fallback to city, state if no address
    bedrooms: property.bedrooms,
    bathrooms: Number(property.bathrooms),
    sqft: property.square_feet || 0,
    image,
    images, // Add all images for carousel
    type: property.property_type,
    landlord: property.profiles?.full_name || property.profiles?.email || 'Property Owner',
    landlord_phone: property.profiles?.phone || null,
    landlord_email: property.profiles?.email || null,
    available: property.available,
    description: property.description,
    address: property.address,
    city: property.city,
    state: property.state,
    zip_code: property.zip_code,
    amenities: property.amenities || [],
    landlord_id: property.landlord_id,
    latitude: property.latitude,
    longitude: property.longitude,
    created_at: property.created_at,
    updated_at: property.updated_at
  }
}

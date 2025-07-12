import { supabase } from './supabase'
import type { Property, Database } from './supabase'

export type PropertyWithDetails = Property & {
  profiles?: {
    full_name: string | null
    email: string
  }
  property_images?: Array<{
    id: string
    image_url: string
    alt_text: string | null
    order_index: number
  }>
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
  try {
    let query = supabase
      .from('properties')
      .select(`
        *,
        profiles!landlord_id (
          full_name,
          email
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
    if (options?.bedrooms) {
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

    return data as PropertyWithDetails[]
  } catch (error) {
    console.error('Error in getProperties:', error)
    throw error
  }
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
          email
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
  // Get the first image or use placeholder
  const image = property.property_images?.[0]?.image_url || '/placeholder.svg?height=300&width=400'
  
  return {
    id: property.id,
    title: property.title,
    price: Number(property.price),
    location: `${property.city}, ${property.state}`,
    bedrooms: property.bedrooms,
    bathrooms: Number(property.bathrooms),
    sqft: property.square_feet || 0,
    image,
    type: property.property_type,
    landlord: property.profiles?.full_name || property.profiles?.email || 'Unknown',
    available: property.available,
    description: property.description,
    address: property.address,
    city: property.city,
    state: property.state,
    zip_code: property.zip_code,
    amenities: property.amenities || [],
    landlord_id: property.landlord_id,
    created_at: property.created_at,
    updated_at: property.updated_at
  }
}

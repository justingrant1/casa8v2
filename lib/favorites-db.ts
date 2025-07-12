import { supabase } from './supabase'
import { getProperties, formatPropertyForFrontend, type PropertyWithDetails } from './properties'

export async function getUserFavorites(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_favorites')
      .select(`
        property_id,
        created_at,
        properties (
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
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user favorites:', error)
      throw error
    }

    // Transform the data to match frontend expectations
    const formattedFavorites = data
      .filter(fav => fav.properties) // Filter out any null properties
      .map(fav => formatPropertyForFrontend(fav.properties as any))

    return formattedFavorites
  } catch (error) {
    console.error('Error in getUserFavorites:', error)
    throw error
  }
}

export async function addToFavorites(userId: string, propertyId: string) {
  try {
    const { data, error } = await supabase
      .from('user_favorites')
      .insert({
        user_id: userId,
        property_id: propertyId
      })
      .select()
      .single()

    if (error) {
      // Handle unique constraint violation (already favorited)
      if (error.code === '23505') {
        return { success: true, message: 'Property already in favorites' }
      }
      console.error('Error adding to favorites:', error)
      throw error
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in addToFavorites:', error)
    throw error
  }
}

export async function removeFromFavorites(userId: string, propertyId: string) {
  try {
    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('property_id', propertyId)

    if (error) {
      console.error('Error removing from favorites:', error)
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error('Error in removeFromFavorites:', error)
    throw error
  }
}

export async function isFavoriteProperty(userId: string, propertyId: string) {
  try {
    const { data, error } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('property_id', propertyId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking if favorite:', error)
      throw error
    }

    return !!data
  } catch (error) {
    console.error('Error in isFavoriteProperty:', error)
    return false
  }
}

export async function getUserFavoriteIds(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_favorites')
      .select('property_id')
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching favorite IDs:', error)
      throw error
    }

    return data.map(fav => fav.property_id)
  } catch (error) {
    console.error('Error in getUserFavoriteIds:', error)
    return []
  }
}

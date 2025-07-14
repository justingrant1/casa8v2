import { supabase } from './supabase'

/**
 * Sync profile updates to all property listings for a landlord
 * This handles cases where property-specific data should reflect profile changes
 */
export async function syncProfileToPropertyListings(userId: string, profileUpdates: {
  full_name?: string
  email?: string
  phone?: string
}) {
  try {
    // Get the user's profile to verify it exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      throw new Error(`Profile not found for user: ${userId}`)
    }

    // Get all properties for this landlord
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('id, contact_phone, allow_chat')
      .eq('landlord_id', userId)

    if (propertiesError) {
      throw new Error(`Error fetching properties: ${propertiesError.message}`)
    }

    if (!properties || properties.length === 0) {
      console.log(`No properties found for landlord: ${userId}`)
      return { success: true, updatedProperties: 0 }
    }

    console.log(`Found ${properties.length} properties for landlord: ${profile.email}`)

    // For properties that don't have a specific contact_phone set,
    // and if the profile phone was updated, we might want to offer it as default
    // But we should be careful not to override landlord's explicit privacy choices

    let updatedCount = 0

    // Note: In most cases, we don't want to automatically update property contact info
    // because landlords may have intentionally set different contact methods per property
    // However, we can create a function that COULD be used if needed

    // If the landlord wants to sync their updated phone to ALL properties
    // that currently don't have a contact phone, they can call this function:
    
    /*
    if (profileUpdates.phone) {
      const propertiesWithoutPhone = properties.filter(p => !p.contact_phone)
      
      for (const property of propertiesWithoutPhone) {
        const { error: updateError } = await supabase
          .from('properties')
          .update({ 
            contact_phone: profileUpdates.phone,
            updated_at: new Date().toISOString()
          })
          .eq('id', property.id)
          .eq('landlord_id', userId)

        if (!updateError) {
          updatedCount++
        }
      }
    }
    */

    return { 
      success: true, 
      profile: profile,
      totalProperties: properties.length,
      updatedProperties: updatedCount,
      message: `Profile updated. ${properties.length} properties found. Property-specific contact info preserved.`
    }

  } catch (error) {
    console.error('Error syncing profile to properties:', error)
    throw error
  }
}

/**
 * Find a landlord by email and return their profile and properties
 */
export async function findLandlordByEmail(email: string) {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        *,
        properties (
          id,
          title,
          contact_phone,
          allow_chat,
          created_at
        )
      `)
      .eq('email', email)
      .eq('role', 'landlord')
      .single()

    if (error) {
      throw new Error(`Landlord not found: ${error.message}`)
    }

    return profile
  } catch (error) {
    console.error('Error finding landlord:', error)
    throw error
  }
}

/**
 * Update property contact preferences for a specific landlord
 * This allows manually updating contact info if needed
 */
export async function updatePropertyContactInfo(
  landlordId: string, 
  propertyId: string, 
  contactUpdates: {
    contact_phone?: string | null
    allow_chat?: boolean
  }
) {
  try {
    const { data, error } = await supabase
      .from('properties')
      .update({
        ...contactUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('id', propertyId)
      .eq('landlord_id', landlordId)
      .select()
      .single()

    if (error) {
      throw new Error(`Error updating property contact info: ${error.message}`)
    }

    return { success: true, property: data }
  } catch (error) {
    console.error('Error updating property contact info:', error)
    throw error
  }
}

/**
 * Bulk update contact preferences for all properties of a landlord
 */
export async function bulkUpdatePropertyContactInfo(
  landlordId: string,
  contactUpdates: {
    contact_phone?: string | null
    allow_chat?: boolean
  }
) {
  try {
    const { data, error } = await supabase
      .from('properties')
      .update({
        ...contactUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('landlord_id', landlordId)
      .select('id, title, contact_phone, allow_chat')

    if (error) {
      throw new Error(`Error bulk updating properties: ${error.message}`)
    }

    return { 
      success: true, 
      updatedProperties: data?.length || 0,
      properties: data 
    }
  } catch (error) {
    console.error('Error bulk updating properties:', error)
    throw error
  }
}

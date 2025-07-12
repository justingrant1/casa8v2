import { supabase } from './supabase'

export interface CreatePropertyData {
  title: string
  description: string
  address: string
  city: string
  state: string
  zip_code: string
  price: number
  bedrooms: number
  bathrooms: number
  square_feet: number | null
  property_type: string
  available_date: string | null
  security_deposit: number | null
  pet_policy: string | null
  amenities: string[]
  landlord_id: string
  contact_phone: string | null
  allow_chat: boolean
}

export async function uploadPropertyImages(propertyId: string, images: File[]) {
  const uploadedImages = []
  
  for (let i = 0; i < images.length; i++) {
    const image = images[i]
    const fileExt = image.name.split('.').pop()
    const fileName = `${propertyId}_${i}_${Date.now()}.${fileExt}`
    const filePath = `properties/${fileName}`

    try {
      // Upload image to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(filePath, image)

      if (uploadError) {
        console.error('Error uploading image:', uploadError)
        continue
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('property-images')
        .getPublicUrl(filePath)

      // Save image record to database
      const { data: imageRecord, error: dbError } = await supabase
        .from('property_images')
        .insert({
          property_id: propertyId,
          image_url: urlData.publicUrl,
          alt_text: `${fileName}`,
          order_index: i
        })
        .select()
        .single()

      if (dbError) {
        console.error('Error saving image record:', dbError)
        continue
      }

      uploadedImages.push(imageRecord)
    } catch (error) {
      console.error('Error processing image:', error)
      continue
    }
  }

  return uploadedImages
}

export async function createPropertyWithImages(propertyData: CreatePropertyData, images: File[] = []) {
  try {
    console.log('Creating property with data:', propertyData)
    
    // First create the property
    const { data: property, error } = await supabase
      .from('properties')
      .insert({
        ...propertyData,
        available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Database error creating property:', error)
      throw new Error(`Failed to create property: ${error.message}`)
    }

    console.log('Property created successfully:', property)

    // Upload images if any
    let uploadedImages = []
    if (images.length > 0) {
      console.log(`Uploading ${images.length} images...`)
      try {
        uploadedImages = await uploadPropertyImages(property.id, images)
        console.log('Images uploaded successfully:', uploadedImages.length)
      } catch (imageError) {
        console.error('Error uploading images (continuing anyway):', imageError)
        // Continue without images rather than failing completely
      }
    }

    return { 
      success: true, 
      property, 
      images: uploadedImages
    }
  } catch (error) {
    console.error('Error creating property:', error)
    throw error
  }
}

export async function createProperty(propertyData: CreatePropertyData) {
  try {
    const { data: property, error } = await supabase
      .from('properties')
      .insert({
        ...propertyData,
        available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, property }
  } catch (error) {
    console.error('Error creating property:', error)
    throw error
  }
}

export async function getLandlordProperties(landlordId: string) {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('landlord_id', landlordId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching properties:', error)
    throw error
  }
}

export async function deleteProperty(propertyId: string, landlordId: string) {
  try {
    // First, delete associated images from storage and database
    const { data: imageRecords } = await supabase
      .from('property_images')
      .select('image_url')
      .eq('property_id', propertyId)

    if (imageRecords && imageRecords.length > 0) {
      // Delete images from storage
      for (const record of imageRecords) {
        const imagePath = record.image_url.split('/').pop()
        if (imagePath) {
          await supabase.storage
            .from('property-images')
            .remove([`properties/${imagePath}`])
        }
      }

      // Delete image records from database
      await supabase
        .from('property_images')
        .delete()
        .eq('property_id', propertyId)
    }

    // Delete the property (ensure only landlord can delete their own property)
    const { data, error } = await supabase
      .from('properties')
      .delete()
      .eq('id', propertyId)
      .eq('landlord_id', landlordId)
      .select()

    if (error) throw error

    return { success: true, deletedProperty: data }
  } catch (error) {
    console.error('Error deleting property:', error)
    throw error
  }
}

export async function updateProperty(propertyId: string, landlordId: string, updates: Partial<CreatePropertyData>) {
  try {
    const { data, error } = await supabase
      .from('properties')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', propertyId)
      .eq('landlord_id', landlordId)
      .select()
      .single()

    if (error) throw error

    return { success: true, property: data }
  } catch (error) {
    console.error('Error updating property:', error)
    throw error
  }
}

export async function updatePropertyStatus(propertyId: string, landlordId: string, available: boolean) {
  try {
    const { data, error } = await supabase
      .from('properties')
      .update({
        available,
        updated_at: new Date().toISOString()
      })
      .eq('id', propertyId)
      .eq('landlord_id', landlordId)
      .select()
      .single()

    if (error) throw error

    return { success: true, property: data }
  } catch (error) {
    console.error('Error updating property status:', error)
    throw error
  }
}

export async function getPropertyForEdit(propertyId: string, landlordId: string) {
  try {
    const { data: property, error } = await supabase
      .from('properties')
      .select(`
        *,
        property_images (
          id,
          image_url,
          alt_text,
          order_index
        )
      `)
      .eq('id', propertyId)
      .eq('landlord_id', landlordId)
      .single()

    if (error) throw error
    return property
  } catch (error) {
    console.error('Error fetching property for edit:', error)
    throw error
  }
}

export async function updatePropertyWithImages(
  propertyId: string, 
  landlordId: string, 
  propertyData: Partial<CreatePropertyData>, 
  images: File[] = [],
  existingImageIds: string[] = []
) {
  try {
    console.log('Updating property with data:', propertyData)
    
    // Update the property
    const { data: property, error } = await supabase
      .from('properties')
      .update({
        ...propertyData,
        updated_at: new Date().toISOString()
      })
      .eq('id', propertyId)
      .eq('landlord_id', landlordId)
      .select()
      .single()

    if (error) {
      console.error('Database error updating property:', error)
      throw new Error(`Failed to update property: ${error.message}`)
    }

    console.log('Property updated successfully:', property)

    // Handle image updates
    let uploadedImages = []
    
    // Delete images that are no longer needed
    const { data: currentImages } = await supabase
      .from('property_images')
      .select('id, image_url')
      .eq('property_id', propertyId)

    if (currentImages) {
      const imagesToDelete = currentImages.filter(img => !existingImageIds.includes(img.id))
      
      for (const imageToDelete of imagesToDelete) {
        // Delete from storage
        const imagePath = imageToDelete.image_url.split('/').pop()
        if (imagePath) {
          await supabase.storage
            .from('property-images')
            .remove([`properties/${imagePath}`])
        }
        
        // Delete from database
        await supabase
          .from('property_images')
          .delete()
          .eq('id', imageToDelete.id)
      }
    }

    // Upload new images if any
    if (images.length > 0) {
      console.log(`Uploading ${images.length} new images...`)
      try {
        const newImages = await uploadPropertyImages(propertyId, images)
        uploadedImages = newImages
        console.log('New images uploaded successfully:', uploadedImages.length)
      } catch (imageError) {
        console.error('Error uploading new images (continuing anyway):', imageError)
      }
    }

    return { 
      success: true, 
      property, 
      images: uploadedImages
    }
  } catch (error) {
    console.error('Error updating property:', error)
    throw error
  }
}

export function formatFormDataForDB(formData: any, landlordId: string): CreatePropertyData {
  return {
    title: formData.title,
    description: formData.description,
    address: formData.address,
    city: formData.city,
    state: formData.state,
    zip_code: formData.zipCode,
    price: parseInt(formData.rent),
    bedrooms: parseInt(formData.bedrooms) || 0,
    bathrooms: parseFloat(formData.bathrooms) || 1,
    square_feet: formData.sqft ? parseInt(formData.sqft) : null,
    property_type: formData.propertyType,
    available_date: formData.availableDate || null,
    security_deposit: formData.deposit ? parseInt(formData.deposit) : null,
    pet_policy: formData.petPolicy || null,
    amenities: formData.amenities || [],
    landlord_id: landlordId,
    contact_phone: formData.includePhoneNumber ? formData.contactPhoneNumber : null,
    allow_chat: formData.allowChat
  }
}

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
  latitude?: number
  longitude?: number
  formatted_address?: string
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

export async function uploadPropertyVideos(propertyId: string, videos: File[]) {
  const uploadedVideos = []
  
  for (let i = 0; i < videos.length; i++) {
    const video = videos[i]
    const fileExt = video.name.split('.').pop()
    const fileName = `${propertyId}_video_${i}_${Date.now()}.${fileExt}`
    const filePath = `videos/${fileName}`

    try {
      // Upload video to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('property-videos')
        .upload(filePath, video)

      if (uploadError) {
        console.error('Error uploading video:', uploadError)
        continue
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('property-videos')
        .getPublicUrl(filePath)

      // Save video record to database
      const { data: videoRecord, error: dbError } = await supabase
        .from('property_videos')
        .insert({
          property_id: propertyId,
          video_url: urlData.publicUrl,
          title: video.name,
          order_index: i,
          file_size: video.size
        })
        .select()
        .single()

      if (dbError) {
        console.error('Error saving video record:', dbError)
        continue
      }

      uploadedVideos.push(videoRecord)
    } catch (error) {
      console.error('Error processing video:', error)
      continue
    }
  }

  return uploadedVideos
}

export async function createPropertyWithImages(propertyData: CreatePropertyData, images: File[] = [], videos: File[] = []) {
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

    // Upload videos if any
    let uploadedVideos = []
    if (videos.length > 0) {
      console.log(`Uploading ${videos.length} videos...`)
      try {
        uploadedVideos = await uploadPropertyVideos(property.id, videos)
        console.log('Videos uploaded successfully:', uploadedVideos.length)
      } catch (videoError) {
        console.error('Error uploading videos (continuing anyway):', videoError)
        // Continue without videos rather than failing completely
      }
    }

    return { 
      success: true, 
      property, 
      images: uploadedImages,
      videos: uploadedVideos
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
        ),
        property_videos (
          id,
          video_url,
          title,
          order_index,
          file_size
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
  existingImageIds: string[] = [],
  videos: File[] = [],
  existingVideoIds: string[] = []
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

    // Handle video updates
    let uploadedVideos = []
    
    // Delete videos that are no longer needed
    const { data: currentVideos } = await supabase
      .from('property_videos')
      .select('id, video_url')
      .eq('property_id', propertyId)

    if (currentVideos) {
      const videosToDelete = currentVideos.filter(video => !existingVideoIds.includes(video.id))
      
      for (const videoToDelete of videosToDelete) {
        // Delete from storage
        const videoPath = videoToDelete.video_url.split('/').pop()
        if (videoPath) {
          await supabase.storage
            .from('property-videos')
            .remove([`videos/${videoPath}`])
        }
        
        // Delete from database
        await supabase
          .from('property_videos')
          .delete()
          .eq('id', videoToDelete.id)
      }
    }

    // Upload new videos if any
    if (videos.length > 0) {
      console.log(`Uploading ${videos.length} new videos...`)
      try {
        const newVideos = await uploadPropertyVideos(propertyId, videos)
        uploadedVideos = newVideos
        console.log('New videos uploaded successfully:', uploadedVideos.length)
      } catch (videoError) {
        console.error('Error uploading new videos (continuing anyway):', videoError)
      }
    }

    return { 
      success: true, 
      property, 
      images: uploadedImages,
      videos: uploadedVideos
    }
  } catch (error) {
    console.error('Error updating property:', error)
    throw error
  }
}

export function formatFormDataForDB(formData: any, landlordId: string, addressData?: any): CreatePropertyData {
  const propertyData: CreatePropertyData = {
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

  // Add coordinate and formatted address data if available
  if (addressData) {
    if (addressData.latitude && addressData.longitude) {
      propertyData.latitude = addressData.latitude
      propertyData.longitude = addressData.longitude
    }
    if (addressData.formatted_address) {
      propertyData.formatted_address = addressData.formatted_address
    }
  }

  return propertyData
}

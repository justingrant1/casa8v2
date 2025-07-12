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

    if (error) throw error

    // Upload images if any
    let uploadedImages = []
    if (images.length > 0) {
      uploadedImages = await uploadPropertyImages(property.id, images)
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

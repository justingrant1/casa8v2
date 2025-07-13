import { supabase } from '../lib/supabase'

// Function to geocode an address using Google's Geocoding API
async function geocodeAddress(address: string, city: string, state: string, zipCode: string): Promise<{lat: number, lng: number} | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    console.error('Google Maps API key not found')
    return null
  }

  const fullAddress = `${address}, ${city}, ${state} ${zipCode}`
  const encodedAddress = encodeURIComponent(fullAddress)
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`

  try {
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location
      return {
        lat: location.lat,
        lng: location.lng
      }
    } else {
      console.error('Geocoding failed for:', fullAddress, data.status)
      return null
    }
  } catch (error) {
    console.error('Error geocoding address:', fullAddress, error)
    return null
  }
}

// Function to update all properties with coordinates
export async function geocodeAllProperties() {
  try {
    // Get all properties without coordinates
    const { data: properties, error } = await supabase
      .from('properties')
      .select('id, address, city, state, zip_code, latitude, longitude')
      .or('latitude.is.null,longitude.is.null')

    if (error) {
      console.error('Error fetching properties:', error)
      return
    }

    if (!properties || properties.length === 0) {
      console.log('No properties found that need geocoding')
      return
    }

    console.log(`Found ${properties.length} properties to geocode`)

    for (const property of properties) {
      if (!property.address || !property.city || !property.state) {
        console.log(`Skipping property ${property.id} - missing address data`)
        continue
      }

      console.log(`Geocoding: ${property.address}, ${property.city}, ${property.state}`)
      
      const coordinates = await geocodeAddress(
        property.address,
        property.city,
        property.state,
        property.zip_code || ''
      )

      if (coordinates) {
        const { error: updateError } = await supabase
          .from('properties')
          .update({
            latitude: coordinates.lat,
            longitude: coordinates.lng
          })
          .eq('id', property.id)

        if (updateError) {
          console.error(`Error updating property ${property.id}:`, updateError)
        } else {
          console.log(`✅ Updated property ${property.id} with coordinates: ${coordinates.lat}, ${coordinates.lng}`)
        }
      } else {
        console.log(`❌ Failed to geocode property ${property.id}`)
      }

      // Add a small delay to avoid hitting rate limits
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    console.log('Geocoding complete!')
  } catch (error) {
    console.error('Error in geocodeAllProperties:', error)
  }
}

// Run the geocoding if this script is executed directly
if (require.main === module) {
  geocodeAllProperties()
}

// IP-based location detection and distance calculations

interface LocationData {
  city: string
  state: string
  country: string
  latitude: number
  longitude: number
  ip: string
}

interface Coordinates {
  lat: number
  lng: number
}

// Function to get user's location based on IP
export async function getUserLocationByIP(): Promise<LocationData | null> {
  try {
    // Using ipapi.co for IP geolocation (free tier available)
    const response = await fetch('https://ipapi.co/json/')
    
    if (!response.ok) {
      throw new Error('Failed to fetch location')
    }
    
    const data = await response.json()
    
    return {
      city: data.city || '',
      state: data.region || '',
      country: data.country_name || '',
      latitude: data.latitude || 0,
      longitude: data.longitude || 0,
      ip: data.ip || ''
    }
  } catch (error) {
    console.error('Error getting location by IP:', error)
    
    // Fallback to browser geolocation if available
    try {
      const position = await getCurrentPosition()
      return {
        city: '',
        state: '',
        country: '',
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        ip: ''
      }
    } catch (geoError) {
      console.error('Geolocation also failed:', geoError)
      return null
    }
  }
}

// Helper function to promisify navigator.geolocation.getCurrentPosition
function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'))
      return
    }
    
    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      { timeout: 10000, enableHighAccuracy: true }
    )
  })
}

// Calculate distance between two coordinates using Haversine formula
export function calculateDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(coord2.lat - coord1.lat)
  const dLon = toRadians(coord2.lng - coord1.lng)
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.lat)) * Math.cos(toRadians(coord2.lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  
  return Math.round(distance * 10) / 10 // Round to 1 decimal place
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

// Convert distance to miles
export function kmToMiles(km: number): number {
  return Math.round(km * 0.621371 * 10) / 10
}

// Get nearby properties based on user location
export function getNearbyProperties(
  properties: any[],
  userLocation: Coordinates,
  maxDistance: number = 50 // kilometers
): any[] {
  return properties
    .map(property => {
      if (!property.coordinates) {
        return { ...property, distance: null }
      }
      
      const distance = calculateDistance(userLocation, property.coordinates)
      return { ...property, distance }
    })
    .filter(property => property.distance === null || property.distance <= maxDistance)
    .sort((a, b) => {
      if (a.distance === null) return 1
      if (b.distance === null) return -1
      return a.distance - b.distance
    })
}

// Note: Geocoding functions will be implemented in components that have access to Google Maps
// For now, we'll focus on IP-based location detection and distance calculations

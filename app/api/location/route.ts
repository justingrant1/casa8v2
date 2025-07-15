import { NextRequest, NextResponse } from 'next/server'

interface LocationData {
  city: string
  state: string
  country: string
  latitude: number
  longitude: number
  ip: string
}

export async function GET(request: NextRequest) {
  try {
    // Get client IP from request headers
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const clientIp = forwarded?.split(',')[0] || realIp || 'unknown'
    
    // Try to get location from IP using ipapi.co (server-side)
    const response = await fetch('https://ipapi.co/json/', {
      headers: {
        'User-Agent': 'Casa8-Location-Service/1.0'
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch location from IP service')
    }
    
    const data = await response.json()
    
    const locationData: LocationData = {
      city: data.city || 'Unknown',
      state: data.region || 'Unknown',
      country: data.country_name || 'Unknown',
      latitude: data.latitude || 0,
      longitude: data.longitude || 0,
      ip: data.ip || clientIp
    }
    
    return NextResponse.json(locationData)
    
  } catch (error) {
    console.error('Location API error:', error)
    
    // Return a fallback response instead of error
    return NextResponse.json({
      city: 'Unknown',
      state: 'Unknown',
      country: 'Unknown',
      latitude: 0,
      longitude: 0,
      ip: 'unknown'
    })
  }
}

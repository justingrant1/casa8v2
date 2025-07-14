"use client"

import { useEffect, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'

interface SimpleMapProps {
  properties: any[]
  className?: string
}

export function SimpleMap({ properties, className = "" }: SimpleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadGoogleMaps = () => {
      // @ts-ignore
      if (window.google && window.google.maps) {
        setIsLoaded(true)
        return
      }

      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      if (!apiKey) {
        setError('Google Maps API key not configured')
        return
      }

      // @ts-ignore
      window.initMap = () => setIsLoaded(true)

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`
      script.async = true
      script.defer = true
      script.onerror = () => setError('Failed to load Google Maps')
      
      document.head.appendChild(script)
    }

    loadGoogleMaps()
  }, [])

  useEffect(() => {
    if (!isLoaded || !mapRef.current || map) return

    try {
      // @ts-ignore
      const googleMap = new window.google.maps.Map(mapRef.current, {
        center: { lat: 40.7128, lng: -74.0060 },
        zoom: 11,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
      })

      setMap(googleMap)
    } catch (err) {
      setError('Error initializing map')
    }
  }, [isLoaded, map])

  useEffect(() => {
    // @ts-ignore
    if (!map || !window.google || !properties.length) return

    // Add carousel functionality to window for InfoWindow
    // @ts-ignore
    window.changeImage = (propertyId: string, direction: number) => {
      const carousel = document.getElementById(`carousel-${propertyId}`)
      if (!carousel) return

      const images = carousel.querySelectorAll('.carousel-image')
      const dots = carousel.parentElement?.querySelectorAll('.carousel-dot')
      
      if (!images.length) return

      // Find current active image
      let currentIndex = 0
      images.forEach((img, index) => {
        if ((img as HTMLElement).style.display === 'block') {
          currentIndex = index
        }
      })

      // Calculate new index
      const newIndex = (currentIndex + direction + images.length) % images.length

      // Update images
      images.forEach((img, index) => {
        (img as HTMLElement).style.display = index === newIndex ? 'block' : 'none'
      })

      // Update dots
      if (dots) {
        dots.forEach((dot, index) => {
          (dot as HTMLElement).style.background = index === newIndex ? 'white' : 'rgba(255,255,255,0.5)'
        })
      }
    }

    // Clear existing markers
    const markers: any[] = []

    properties.forEach(property => {
      // Check if property has valid coordinates
      const lat = property.latitude || property.coordinates?.lat
      const lng = property.longitude || property.coordinates?.lng
      
      if (!lat || !lng) {
        console.warn(`Property ${property.title} missing coordinates`)
        return
      }

      // @ts-ignore
      const marker = new window.google.maps.Marker({
        position: { lat: parseFloat(lat), lng: parseFloat(lng) },
        map,
        title: property.title,
      })

      markers.push(marker)

      const propertyImages = property.images || [property.image || "/placeholder.svg"]
      const hasMultipleImages = propertyImages.length > 1
      
      // Create carousel HTML for multiple images
      const carouselHTML = `
        <div style="position: relative; margin-bottom: 12px; border-radius: 8px; overflow: hidden;">
          <div id="carousel-${property.id}" style="position: relative; width: 100%; height: 140px;">
            ${propertyImages.map((image: string, index: number) => `
              <img 
                src="${image}" 
                alt="${property.title} - Image ${index + 1}"
                style="
                  width: 100%; 
                  height: 140px; 
                  object-fit: cover; 
                  display: ${index === 0 ? 'block' : 'none'};
                  position: absolute;
                  top: 0;
                  left: 0;
                "
                class="carousel-image"
                data-index="${index}"
              />
            `).join('')}
          </div>
          
          ${hasMultipleImages ? `
            <button 
              onclick="changeImage('${property.id}', -1)"
              style="
                position: absolute; 
                left: 8px; 
                top: 50%; 
                transform: translateY(-50%); 
                background: rgba(0,0,0,0.6); 
                color: white; 
                border: none; 
                border-radius: 50%; 
                width: 32px; 
                height: 32px; 
                display: flex; 
                align-items: center; 
                justify-content: center;
                cursor: pointer;
                font-size: 18px;
                z-index: 10;
              "
            >‹</button>
            <button 
              onclick="changeImage('${property.id}', 1)"
              style="
                position: absolute; 
                right: 8px; 
                top: 50%; 
                transform: translateY(-50%); 
                background: rgba(0,0,0,0.6); 
                color: white; 
                border: none; 
                border-radius: 50%; 
                width: 32px; 
                height: 32px; 
                display: flex; 
                align-items: center; 
                justify-content: center;
                cursor: pointer;
                font-size: 18px;
                z-index: 10;
              "
            >›</button>
            
            <div style="
              position: absolute; 
              bottom: 8px; 
              left: 50%; 
              transform: translateX(-50%); 
              display: flex; 
              gap: 4px;
              z-index: 10;
            ">
              ${propertyImages.map((_: string, index: number) => `
                <div 
                  style="
                    width: 8px; 
                    height: 8px; 
                    border-radius: 50%; 
                    background: ${index === 0 ? 'white' : 'rgba(255,255,255,0.5)'};
                    transition: background 0.2s;
                  "
                  class="carousel-dot"
                  data-index="${index}"
                ></div>
              `).join('')}
            </div>
            
            <div style="
              position: absolute; 
              bottom: 8px; 
              right: 8px; 
              background: rgba(0,0,0,0.6); 
              color: white; 
              padding: 4px 8px; 
              border-radius: 4px; 
              font-size: 12px;
              z-index: 10;
            ">
              ${propertyImages.length} photos
            </div>
          ` : ''}
        </div>
      `
      
      // @ts-ignore
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="width: 280px; font-family: system-ui, -apple-system, sans-serif;">
            ${carouselHTML}
            <div style="padding: 4px 0;">
              <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1f2937; line-height: 1.3;">
                ${property.title}
              </h3>
              <div style="margin-bottom: 12px;">
                <span style="font-size: 20px; font-weight: 700; color: #059669;">
                  $${property.price.toLocaleString()}
                </span>
                <span style="font-size: 14px; color: #6b7280; margin-left: 4px;">
                  /month
                </span>
              </div>
              <div style="display: flex; gap: 16px; margin-bottom: 12px; padding: 8px; background: #f9fafb; border-radius: 6px;">
                <div style="display: flex; align-items: center; font-size: 14px;">
                  <span style="font-weight: 600; margin-right: 4px;">${property.bedrooms}</span>
                  <span style="color: #6b7280;">beds</span>
                </div>
                <div style="display: flex; align-items: center; font-size: 14px;">
                  <span style="font-weight: 600; margin-right: 4px;">${property.bathrooms}</span>
                  <span style="color: #6b7280;">baths</span>
                </div>
                <div style="display: flex; align-items: center; font-size: 14px;">
                  <span style="font-weight: 600; margin-right: 4px;">${property.sqft}</span>
                  <span style="color: #6b7280;">sqft</span>
                </div>
              </div>
              <p style="margin: 0 0 12px 0; font-size: 13px; color: #6b7280; line-height: 1.4;">
                📍 ${property.location || property.address}
              </p>
              <a 
                href="/property/${property.id}"
                style="
                  display: block; 
                  text-align: center; 
                  background: #059669; 
                  color: white; 
                  padding: 8px 16px; 
                  border-radius: 6px; 
                  text-decoration: none; 
                  font-weight: 500; 
                  font-size: 14px;
                  transition: background-color 0.2s;
                "
                onmouseover="this.style.background='#047857'"
                onmouseout="this.style.background='#059669'"
              >
                View Details
              </a>
            </div>
          </div>
        `
      })

      marker.addListener('click', () => {
        infoWindow.open(map, marker)
      })
    })

    // Fit map bounds to show all markers
    if (markers.length > 0) {
      // @ts-ignore
      const bounds = new window.google.maps.LatLngBounds()
      markers.forEach(marker => bounds.extend(marker.getPosition()))
      map.fitBounds(bounds)
      
      // Don't zoom in too much for single properties
      if (markers.length === 1) {
        map.setZoom(15)
      }
    }
  }, [map, properties])

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-8 text-center ${className}`}>
        <MapPin className="w-12 h-12 mx-auto mb-4 text-red-400" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">Map Unavailable</h3>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <div ref={mapRef} className="w-full h-[600px] rounded-lg" />
    </div>
  )
}

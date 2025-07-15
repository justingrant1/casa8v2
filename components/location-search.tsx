"use client"

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader } from '@googlemaps/js-api-loader'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { hasGoogleMapsApi } from '@/lib/env'

// Declare Google Maps types
declare global {
  interface Window {
    google: typeof google
  }
}

declare namespace google {
  namespace maps {
    class Map {
      constructor(mapDiv: Element, opts?: any)
    }
    namespace places {
      class Autocomplete {
        constructor(input: HTMLInputElement, opts?: any)
        addListener(eventName: string, handler: () => void): void
        getPlace(): {
          formatted_address?: string
          geometry?: {
            location?: {
              lat(): number
              lng(): number
            }
          }
          address_components?: Array<{
            long_name: string
            short_name: string
            types: string[]
          }>
        }
      }
    }
    namespace event {
      function clearInstanceListeners(instance: any): void
    }
  }
}

interface LocationSearchProps {
  onLocationSelect?: (location: {
    address: string
    city: string
    state: string
    coordinates: { lat: number; lng: number }
  }) => void
  placeholder?: string
  className?: string
}

export function LocationSearch({ 
  onLocationSelect, 
  placeholder = "Enter city, neighborhood, or ZIP code...",
  className = ""
}: LocationSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const initializeAutocomplete = async () => {
      // Check if Google Maps API is available
      if (!hasGoogleMapsApi()) {
        console.log('Google Maps API key not available, using basic input field')
        setIsLoaded(true)
        return
      }

      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        if (!apiKey) {
          console.log('Google Maps API key is empty, using basic input field')
          setIsLoaded(true)
          return
        }

        const loader = new Loader({
          apiKey: apiKey,
          version: 'weekly',
          libraries: ['places']
        })

        await loader.load()
        setIsLoaded(true)

        if (inputRef.current) {
          const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
            types: ['(cities)', 'postal_code'], // Support cities, neighborhoods, and postal codes
            componentRestrictions: { country: 'us' }, // Restrict to US
            fields: ['formatted_address', 'geometry', 'address_components']
          })

          autocompleteRef.current = autocomplete

          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace()

            if (!place.geometry?.location) {
              console.log('No location data available for input')
              return
            }

            // Parse address components
            let city = ''
            let state = ''
            let formattedAddress = place.formatted_address || ''

            if (place.address_components) {
              for (const component of place.address_components) {
                const types = component.types
                
                if (types.includes('locality')) {
                  city = component.long_name
                } else if (types.includes('administrative_area_level_1')) {
                  state = component.short_name
                } else if (types.includes('sublocality') && !city) {
                  city = component.long_name
                }
              }
            }

            const locationData = {
              address: formattedAddress,
              city: city,
              state: state,
              coordinates: {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
              }
            }

            // Call the callback if provided
            if (onLocationSelect) {
              onLocationSelect(locationData)
            }

            // The parent component will handle the navigation
          })
        }
      } catch (error) {
        console.error('Error loading Google Maps:', error)
        // Fall back to basic input field on error
        setIsLoaded(true)
      }
    }

    initializeAutocomplete()

    return () => {
      if (autocompleteRef.current && window.google) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current)
      }
    }
  }, [onLocationSelect, router])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      // If no place was selected from autocomplete, perform a basic search with the input value
      if (inputRef.current?.value) {
        const inputValue = inputRef.current.value.trim()
        
        // Try to parse basic city, state format when Google Maps API is not available
        if (!hasGoogleMapsApi() && onLocationSelect) {
          const parts = inputValue.split(',')
          if (parts.length >= 2) {
            const city = parts[0].trim()
            const state = parts[1].trim()
            
            // Call the callback with basic location data (no coordinates)
            onLocationSelect({
              address: inputValue,
              city: city,
              state: state,
              coordinates: { lat: 0, lng: 0 } // Default coordinates when API is not available
            })
            return
          }
        }
        
        // Fallback to general search
        const searchParams = new URLSearchParams()
        searchParams.append('q', inputValue)
        router.push(`/search?${searchParams.toString()}`)
      }
    }
  }

  return (
    <div className={`relative flex-1 min-w-0 ${className}`}>
      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
      <Input
        ref={inputRef}
        placeholder={placeholder}
        className="pl-12 h-14 text-lg border-0 focus-visible:ring-2 focus-visible:ring-primary/20 bg-gray-50"
        onKeyDown={handleKeyDown}
      />
      {!isLoaded && (
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  )
}

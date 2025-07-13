"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Home, MapPin } from "lucide-react"
import { Loader } from '@googlemaps/js-api-loader'

interface TenantOnboardingProps {
  isOpen: boolean
  onComplete: (data: any) => void
  onSkip?: () => void
}

export function TenantOnboarding({ isOpen, onComplete, onSkip }: TenantOnboardingProps) {
  const [formData, setFormData] = useState({
    hasSection8: '',
    voucherBedrooms: '',
    preferredCity: '',
  })
  const cityInputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const initializeAutocomplete = async () => {
      if (!isOpen) return

      try {
        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
          version: 'weekly',
          libraries: ['places']
        })

        await loader.load()
        setIsLoaded(true)

        if (cityInputRef.current && window.google) {
          const autocomplete = new window.google.maps.places.Autocomplete(cityInputRef.current, {
            types: ['(cities)'],
            componentRestrictions: { country: 'us' },
            fields: ['formatted_address', 'geometry', 'address_components']
          })

          autocompleteRef.current = autocomplete

          // Style the autocomplete dropdown with better mobile support
          const addAutocompleteStyles = () => {
            // Remove any existing styles first
            const existingStyle = document.getElementById('places-autocomplete-styles')
            if (existingStyle) {
              existingStyle.remove()
            }

            const style = document.createElement('style')
            style.id = 'places-autocomplete-styles'
            style.textContent = `
              .pac-container {
                z-index: 99999 !important;
                font-size: 16px !important;
                border-radius: 8px !important;
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
                border: 1px solid #d1d5db !important;
                background: white !important;
                margin-top: 4px !important;
                position: absolute !important;
              }
              .pac-item {
                padding: 16px !important;
                border-bottom: 1px solid #f3f4f6 !important;
                cursor: pointer !important;
                background: white !important;
                position: relative !important;
                -webkit-user-select: none !important;
                -moz-user-select: none !important;
                user-select: none !important;
                -webkit-tap-highlight-color: rgba(0,0,0,0) !important;
                touch-action: manipulation !important;
                font-size: 16px !important;
                line-height: 1.4 !important;
                display: block !important;
                width: 100% !important;
                box-sizing: border-box !important;
              }
              .pac-item:hover,
              .pac-item.pac-item-selected,
              .pac-item:active,
              .pac-item:focus {
                background-color: #f8fafc !important;
                color: #1f2937 !important;
              }
              .pac-item * {
                pointer-events: none !important;
              }
              .pac-item-query {
                font-weight: 600 !important;
                color: #111827 !important;
              }
              .pac-matched {
                font-weight: 700 !important;
                color: #2563eb !important;
              }
              @media (max-width: 768px) {
                .pac-container {
                  font-size: 16px !important;
                  width: 100% !important;
                  min-width: unset !important;
                  left: 0 !important;
                  right: 0 !important;
                  margin: 4px 0 0 0 !important;
                }
                .pac-item {
                  padding: 20px 16px !important;
                  min-height: 56px !important;
                  font-size: 16px !important;
                  border-bottom: 1px solid #e5e7eb !important;
                }
              }
            `
            document.head.appendChild(style)
          }

          // Add styles immediately
          addAutocompleteStyles()

          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace()

            if (!place.geometry?.location) {
              return
            }

            // Parse city and state from address components
            let city = ''
            let state = ''

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

            // Format as "City, State"
            const cityState = state ? `${city}, ${state}` : city
            setFormData(prev => ({ ...prev, preferredCity: cityState }))
          })

          // Add mobile touch event handling
          if (cityInputRef.current) {
            const input = cityInputRef.current
            
            // Prevent zoom on focus for iOS
            input.addEventListener('touchstart', () => {
              if (input.style.fontSize !== '16px') {
                input.style.fontSize = '16px'
              }
            })

            // Add better mobile interaction
            input.addEventListener('focus', () => {
              setTimeout(() => {
                const pacContainer = document.querySelector('.pac-container') as HTMLElement
                if (pacContainer) {
                  pacContainer.style.zIndex = '9999'
                  pacContainer.style.position = 'fixed'
                  
                  // Ensure dropdown is positioned correctly on mobile
                  const inputRect = input.getBoundingClientRect()
                  pacContainer.style.top = `${inputRect.bottom + window.scrollY + 4}px`
                  pacContainer.style.left = `${inputRect.left + window.scrollX}px`
                  pacContainer.style.width = `${inputRect.width}px`
                }
              }, 100)
            })
          }
        }
      } catch (error) {
        console.error('Error loading Google Maps:', error)
      }
    }

    initializeAutocomplete()

    return () => {
      if (autocompleteRef.current && window.google) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current)
      }
    }
  }, [isOpen])

  const handleSubmit = () => {
    onComplete(formData)
  }

  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl">Quick Setup</DialogTitle>
        </DialogHeader>

        <Card className="border-0 shadow-none">
          <CardHeader className="text-center pb-4">
            <Home className="mx-auto w-8 h-8 text-primary mb-2" />
            <CardTitle className="text-lg">Housing Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Do you have a Section 8 voucher?</Label>
              <RadioGroup value={formData.hasSection8} onValueChange={(value) => setFormData(prev => ({ ...prev, hasSection8: value }))}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="yes" />
                  <Label htmlFor="yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="no" />
                  <Label htmlFor="no">No</Label>
                </div>
              </RadioGroup>
            </div>

            {formData.hasSection8 === 'yes' && (
              <div>
                <Label>Voucher bedrooms</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {['Studio', '1 BR', '2 BR', '3 BR', '4 BR', '5+ BR'].map((option) => (
                    <Button
                      key={option}
                      variant={formData.voucherBedrooms === option ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, voucherBedrooms: option }))}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label>Preferred city</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
                <Input
                  ref={cityInputRef}
                  placeholder="Enter city name (e.g., Seattle, WA)"
                  value={formData.preferredCity}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferredCity: e.target.value }))}
                  className="pl-10"
                />
                {!isLoaded && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </div>

            <Button onClick={handleSubmit} className="w-full mt-6">
              Get Started
            </Button>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}

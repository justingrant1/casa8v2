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

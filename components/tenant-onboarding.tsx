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

interface CityPrediction {
  description: string
  place_id: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
}

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
  const [cityQuery, setCityQuery] = useState('')
  const [predictions, setPredictions] = useState<CityPrediction[]>([])
  const [showPredictions, setShowPredictions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const cityInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const autocompleteServiceRef = useRef<any>(null)

  useEffect(() => {
    const initializeGoogleMaps = async () => {
      if (!isOpen) return

      try {
        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
          version: 'weekly',
          libraries: ['places']
        })

        await loader.load()
        
        // Initialize the AutocompleteService
        if ((window as any).google && (window as any).google.maps && (window as any).google.maps.places) {
          autocompleteServiceRef.current = new (window as any).google.maps.places.AutocompleteService()
          setIsLoaded(true)
        }
      } catch (error) {
        console.error('Error loading Google Maps:', error)
      }
    }

    initializeGoogleMaps()
  }, [isOpen])

  // Debounced city search
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (cityQuery.length > 2 && autocompleteServiceRef.current) {
        setIsLoading(true)
        
        try {
          const request = {
            input: cityQuery,
            types: ['(cities)'],
            componentRestrictions: { country: 'us' }
          }

          autocompleteServiceRef.current.getPlacePredictions(
            request,
            (predictions: CityPrediction[] | null, status: any) => {
              setIsLoading(false)
              if (status === 'OK' && predictions) {
                setPredictions(predictions.slice(0, 5)) // Limit to 5 results
                setShowPredictions(true)
              } else {
                setPredictions([])
                setShowPredictions(false)
              }
            }
          )
        } catch (error) {
          console.error('Error fetching predictions:', error)
          setIsLoading(false)
          setPredictions([])
          setShowPredictions(false)
        }
      } else {
        setPredictions([])
        setShowPredictions(false)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [cityQuery])

  // Handle input change
  const handleCityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCityQuery(value)
    setFormData(prev => ({ ...prev, preferredCity: value }))
  }

  // Handle city selection
  const handleCitySelect = (prediction: CityPrediction) => {
    const cityName = prediction.description
    setCityQuery(cityName)
    setFormData(prev => ({ ...prev, preferredCity: cityName }))
    setShowPredictions(false)
    setPredictions([])
    
    // Update input value
    if (cityInputRef.current) {
      cityInputRef.current.value = cityName
    }
  }

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          cityInputRef.current && !cityInputRef.current.contains(event.target as Node)) {
        setShowPredictions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = async () => {
    console.log('🔄 Submitting onboarding form with data:', formData)
    
    // Validate required fields
    if (!formData.hasSection8) {
      console.error('❌ Section 8 selection is required')
      alert('Please select whether you have a Section 8 voucher')
      return
    }
    
    if (formData.hasSection8 === 'yes' && !formData.voucherBedrooms) {
      console.error('❌ Voucher bedrooms selection is required')
      alert('Please select your voucher bedroom size')
      return
    }
    
    if (!formData.preferredCity) {
      console.error('❌ Preferred city is required')
      alert('Please enter your preferred city')
      return
    }
    
    try {
      console.log('✅ All validations passed, calling onComplete...')
      await onComplete(formData)
    } catch (error) {
      console.error('❌ Error in onComplete:', error)
      alert('There was an error saving your preferences. Please try again.')
    }
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
                  onChange={handleCityInputChange}
                  onFocus={() => {
                    if (predictions.length > 0) {
                      setShowPredictions(true)
                    }
                  }}
                  className="pl-10 text-base"
                  style={{ fontSize: '16px' }} // Prevent iOS zoom
                />
                {isLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin"></div>
                  </div>
                )}
                
                {/* Custom dropdown for city predictions */}
                {showPredictions && predictions.length > 0 && (
                  <div
                    ref={dropdownRef}
                    className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
                  >
                    {predictions.map((prediction, index) => (
                      <div
                        key={prediction.place_id}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 active:bg-gray-100 transition-colors duration-150"
                        onClick={() => handleCitySelect(prediction)}
                        onTouchEnd={(e) => {
                          e.preventDefault()
                          handleCitySelect(prediction)
                        }}
                      >
                        <div className="text-sm font-medium text-gray-900">
                          {prediction.structured_formatting.main_text}
                        </div>
                        <div className="text-xs text-gray-500">
                          {prediction.structured_formatting.secondary_text}
                        </div>
                      </div>
                    ))}
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

"use client"

import React, { useEffect, useRef, useState } from "react"
import { Loader } from "@googlemaps/js-api-loader"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { MapPin, Loader2 } from "lucide-react"
import { hasGoogleMapsApi } from "@/lib/env"

export interface AddressData {
  formatted_address: string
  street_number?: string
  route?: string
  locality?: string // city
  administrative_area_level_1?: string // state
  postal_code?: string
  country?: string
  latitude?: number
  longitude?: number
}

interface AddressAutocompleteProps {
  onAddressSelect: (addressData: AddressData) => void
  placeholder?: string
  label?: string
  defaultValue?: string
  showManualToggle?: boolean
  required?: boolean
  className?: string
}

export function AddressAutocomplete({
  onAddressSelect,
  placeholder = "Enter address...",
  label = "Address",
  defaultValue = "",
  showManualToggle = true,
  required = false,
  className = ""
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isManualEntry, setIsManualEntry] = useState(false)
  const [manualAddress, setManualAddress] = useState("")
  const [inputValue, setInputValue] = useState(defaultValue)
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false)

  useEffect(() => {
    const initializeGoogleMaps = async () => {
      // Check if Google Maps API is available
      if (!hasGoogleMapsApi()) {
        console.log("Google Maps API not available, using manual entry mode")
        setIsManualEntry(true)
        setIsGoogleLoaded(false)
        return
      }

      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      if (!apiKey) {
        console.log("Google Maps API key not found, using manual entry mode")
        setIsManualEntry(true)
        setIsGoogleLoaded(false)
        return
      }

      try {
        setIsLoading(true)
        const loader = new Loader({
          apiKey: apiKey,
          version: "weekly",
          libraries: ["places"]
        })

        await loader.load()
        setIsGoogleLoaded(true)
      } catch (error) {
        console.error("Error loading Google Maps:", error)
        setIsManualEntry(true)
        setIsGoogleLoaded(false)
      } finally {
        setIsLoading(false)
      }
    }

    initializeGoogleMaps()
  }, [])

  useEffect(() => {
    if (!isGoogleLoaded || !inputRef.current || isManualEntry) return

    // Initialize autocomplete (keeping the current implementation for now)
    const autocomplete = new (window as any).google.maps.places.Autocomplete(inputRef.current, {
      types: ["address"],
      componentRestrictions: { country: "us" }
    })

    autocompleteRef.current = autocomplete

    // Handle place selection
    const handlePlaceSelect = () => {
      const place = autocomplete.getPlace()
      
      if (!place.geometry || !place.address_components) {
        console.error("No place details available")
        return
      }

      // Parse address components
      const addressData: AddressData = {
        formatted_address: place.formatted_address || "",
        latitude: place.geometry.location?.lat(),
        longitude: place.geometry.location?.lng()
      }

      // Extract address components
      place.address_components.forEach((component: any) => {
        const types = component.types
        if (types.includes("street_number")) {
          addressData.street_number = component.long_name
        } else if (types.includes("route")) {
          addressData.route = component.long_name
        } else if (types.includes("locality")) {
          addressData.locality = component.long_name
        } else if (types.includes("administrative_area_level_1")) {
          addressData.administrative_area_level_1 = component.short_name
        } else if (types.includes("postal_code")) {
          addressData.postal_code = component.long_name
        } else if (types.includes("country")) {
          addressData.country = component.short_name
        }
      })

      setInputValue(place.formatted_address || "")
      onAddressSelect(addressData)
    }

    autocomplete.addListener("place_changed", handlePlaceSelect)

    return () => {
      if (autocompleteRef.current) {
        (window as any).google.maps.event.clearInstanceListeners(autocompleteRef.current)
      }
    }
  }, [isGoogleLoaded, isManualEntry, onAddressSelect])

  const handleManualToggle = (checked: boolean) => {
    setIsManualEntry(checked)
    if (checked) {
      // Clear autocomplete and use manual entry
      setInputValue("")
      setManualAddress("")
    } else {
      // Re-enable autocomplete
      setManualAddress("")
    }
  }

  const handleManualAddressChange = (value: string) => {
    setManualAddress(value)
    setInputValue(value)
    
    // For manual entry, we provide a basic address object
    const addressData: AddressData = {
      formatted_address: value
    }
    onAddressSelect(addressData)
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <Label htmlFor="address-input">{label}</Label>
        {showManualToggle && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="manual-address"
              checked={isManualEntry}
              onCheckedChange={handleManualToggle}
            />
            <Label htmlFor="manual-address" className="text-sm text-muted-foreground">
              Enter manually
            </Label>
          </div>
        )}
      </div>

      <div className="relative">
        <Input
          ref={inputRef}
          id="address-input"
          type="text"
          placeholder={isManualEntry ? "Enter address manually..." : placeholder}
          value={isManualEntry ? manualAddress : inputValue}
          onChange={(e) => {
            if (isManualEntry) {
              handleManualAddressChange(e.target.value)
            } else {
              setInputValue(e.target.value)
            }
          }}
          required={required}
          disabled={isLoading}
          className="pl-10"
        />
        
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <MapPin className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {isLoading && (
        <p className="text-xs text-muted-foreground">Loading Google Maps...</p>
      )}
      
      {!isGoogleLoaded && !isLoading && !hasGoogleMapsApi() && (
        <p className="text-xs text-muted-foreground">Google Maps API not configured. Using manual entry mode.</p>
      )}
      
      {!isGoogleLoaded && !isLoading && hasGoogleMapsApi() && (
        <p className="text-xs text-red-500">Failed to load Google Maps. Please refresh the page.</p>
      )}
    </div>
  )
}

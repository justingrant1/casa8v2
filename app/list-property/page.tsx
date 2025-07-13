"use client"

import React, { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Upload, X, ArrowLeft, Star, Loader2, Play } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { createPropertyWithImages, formatFormDataForDB, getPropertyForEdit, updatePropertyWithImages } from "@/lib/property-management"
import { useToast } from "@/hooks/use-toast"
import { AddressAutocomplete, AddressData } from "@/components/address-autocomplete"

const amenitiesList = [
  "Air conditioning",
  "Heating",
  "Refrigerator",
  "Dishwasher",
  "Washer/Dryer",
  "Parking",
  "Pet friendly",
  "Gym/Fitness center",
  "Swimming pool",
  "Balcony/Patio",
  "Garden/Yard",
  "Storage"
]

export default function ListPropertyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editPropertyId, setEditPropertyId] = useState<string | null>(null)
  const [existingImages, setExistingImages] = useState<any[]>([])
  const [addressData, setAddressData] = useState<AddressData | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isProcessingImages, setIsProcessingImages] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    propertyType: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    bedrooms: "",
    bathrooms: "",
    sqft: "",
    rent: "",
    deposit: "",
    negotiableDeposit: false,
    amenities: [] as string[],
    images: [] as File[],
    videos: [] as File[],
    includePhoneNumber: true,
    allowChat: true,
    contactPhoneNumber: "",
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
      return
    }

    // Check if user is a landlord - only landlords can list properties
    if (!authLoading && user && user.user_metadata?.role !== 'landlord') {
      toast({
        title: "Access Denied",
        description: "Only landlords can list properties",
        variant: "destructive"
      })
      router.push("/")
      return
    }

    // Check if we're editing a property
    const editId = searchParams.get('edit')
    if (editId && user) {
      setIsEditing(true)
      setEditPropertyId(editId)
      loadPropertyForEdit(editId)
    }
  }, [user, authLoading, router, searchParams])

  const loadPropertyForEdit = async (propertyId: string) => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const property = await getPropertyForEdit(propertyId, user.id)
      
      // Populate form with existing data
      setFormData({
        title: property.title || "",
        description: property.description || "",
        propertyType: property.property_type || "",
        address: property.address || "",
        city: property.city || "",
        state: property.state || "",
        zipCode: property.zip_code || "",
        bedrooms: property.bedrooms?.toString() || "",
        bathrooms: property.bathrooms?.toString() || "",
        sqft: property.square_feet?.toString() || "",
        rent: property.price?.toString() || "",
        deposit: property.security_deposit?.toString() || "",
        negotiableDeposit: false,
        amenities: property.amenities || [],
        images: [], // New images to upload
        videos: [],
        includePhoneNumber: !!property.contact_phone,
        allowChat: property.allow_chat || false,
        contactPhoneNumber: property.contact_phone || "",
      })
      
      // Set existing images
      setExistingImages(property.property_images || [])
    } catch (error) {
      console.error('Error loading property for edit:', error)
      toast({
        title: "Error loading property",
        description: "Failed to load property details for editing",
        variant: "destructive"
      })
      router.push('/dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleAddressSelect = (selectedAddress: AddressData) => {
    setAddressData(selectedAddress)
    
    // Update form data with the selected address components
    setFormData((prev) => ({
      ...prev,
      address: selectedAddress.street_number && selectedAddress.route 
        ? `${selectedAddress.street_number} ${selectedAddress.route}`
        : selectedAddress.formatted_address,
      city: selectedAddress.locality || "",
      state: selectedAddress.administrative_area_level_1 || "",
      zipCode: selectedAddress.postal_code || "",
    }))
  }

  const handleAmenityToggle = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }))
  }

  const handleFileUpload = (type: "images" | "videos", files: FileList | null) => {
    if (files) {
      const fileArray = Array.from(files)
      const newCount = formData[type].length + fileArray.length
      
      // Start processing simulation for bulk uploads (10+ images)
      if (type === "images" && newCount >= 10) {
        setIsProcessingImages(true)
        setUploadProgress(0)
        
        // Simulate processing progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 100) {
              clearInterval(progressInterval)
              setIsProcessingImages(false)
              return 100
            }
            return prev + (100 / (newCount * 0.5)) // Slower for more images
          })
        }, 100)
      }
      
      setFormData((prev) => ({
        ...prev,
        [type]: [...prev[type], ...fileArray],
      }))
    }
  }

  const removeFile = (type: "images" | "videos", index: number) => {
    setFormData((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }))
  }

  const removeExistingImage = (imageId: string) => {
    setExistingImages(prev => prev.filter(img => img.id !== imageId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to manage properties",
        variant: "destructive"
      })
      return
    }

    // Basic form validation
    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Property title is required",
        variant: "destructive"
      })
      return
    }

    if (!formData.rent || isNaN(Number(formData.rent))) {
      toast({
        title: "Validation Error", 
        description: "Valid rent amount is required",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Format the form data for database insertion
      const propertyData = formatFormDataForDB(formData, user.id, addressData)
      
      let result
      
      if (isEditing && editPropertyId) {
        const existingImageIds = existingImages.map(img => img.id)
        result = await updatePropertyWithImages(
          editPropertyId, 
          user.id, 
          propertyData, 
          formData.images,
          existingImageIds
        )
      } else {
        result = await createPropertyWithImages(propertyData, formData.images)
      }
      
      if (result.success) {
        const imageCount = result.images?.length || 0
        const action = isEditing ? "updated" : "listed"
        
        toast({
          title: `Property ${action} successfully!`,
          description: isEditing 
            ? `Your property has been updated${imageCount > 0 ? ` with ${imageCount} new image${imageCount !== 1 ? 's' : ''}` : ''}`
            : `Your property has been added with ${imageCount} image${imageCount !== 1 ? 's' : ''}`
        })
        
        // Small delay to ensure toast shows before redirect
        setTimeout(() => {
          router.push("/dashboard")
        }, 1000)
      }
    } catch (error: any) {
      console.error("Error processing property:", error)
      
      // More specific error handling
      let errorMessage = "Something went wrong. Please try again."
      
      if (error.message) {
        errorMessage = error.message
      } else if (error.error_description) {
        errorMessage = error.error_description
      } else if (error.details) {
        errorMessage = error.details
      }
      
      const action = isEditing ? "updating" : "listing"
      toast({
        title: `Error ${action} property`,
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading or redirect while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{isEditing ? 'Edit Property' : 'List New Property'}</h1>
              <p className="text-muted-foreground">{isEditing ? 'Update your property details' : 'Add your property to attract tenants'}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Provide basic details about your property</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Property Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Modern Downtown Apartment"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your property, its features, and what makes it special..."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="propertyType">Property Type</Label>
                  <Select
                    value={formData.propertyType}
                    onValueChange={(value) => setFormData({ ...formData, propertyType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select property type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="house">House</SelectItem>
                      <SelectItem value="condo">Condo</SelectItem>
                      <SelectItem value="townhouse">Townhouse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rent">Monthly Rent ($)</Label>
                  <Input
                    id="rent"
                    type="number"
                    placeholder="2500"
                    value={formData.rent}
                    onChange={(e) => handleInputChange("rent", e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
              <CardDescription>Where is your property located?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <AddressAutocomplete
                onAddressSelect={handleAddressSelect}
                placeholder="Start typing the property address..."
                label="Property Address"
                defaultValue={isEditing ? `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}`.trim() : ""}
                showManualToggle={true}
                required={true}
              />

              {/* Display parsed address components for verification */}
              {(formData.address || formData.city || formData.state || formData.zipCode) && (
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Parsed Address:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Street:</span> {formData.address || "Not specified"}
                    </div>
                    <div>
                      <span className="font-medium">City:</span> {formData.city || "Not specified"}
                    </div>
                    <div>
                      <span className="font-medium">State:</span> {formData.state || "Not specified"}
                    </div>
                    <div>
                      <span className="font-medium">ZIP:</span> {formData.zipCode || "Not specified"}
                    </div>
                    {addressData?.latitude && addressData?.longitude && (
                      <div className="md:col-span-2">
                        <span className="font-medium">Coordinates:</span> {addressData.latitude.toFixed(6)}, {addressData.longitude.toFixed(6)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Property Details */}
          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
              <CardDescription>Specify the size and features of your property</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Select value={formData.bedrooms} onValueChange={(value) => handleInputChange("bedrooms", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Studio</SelectItem>
                      <SelectItem value="1">1 Bedroom</SelectItem>
                      <SelectItem value="2">2 Bedrooms</SelectItem>
                      <SelectItem value="3">3 Bedrooms</SelectItem>
                      <SelectItem value="4">4 Bedrooms</SelectItem>
                      <SelectItem value="5+">5+ Bedrooms</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Select value={formData.bathrooms} onValueChange={(value) => handleInputChange("bathrooms", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Bathroom</SelectItem>
                      <SelectItem value="1.5">1.5 Bathrooms</SelectItem>
                      <SelectItem value="2">2 Bathrooms</SelectItem>
                      <SelectItem value="2.5">2.5 Bathrooms</SelectItem>
                      <SelectItem value="3">3 Bathrooms</SelectItem>
                      <SelectItem value="3.5">3.5 Bathrooms</SelectItem>
                      <SelectItem value="4+">4+ Bathrooms</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sqft">Square Feet</Label>
                  <Input
                    id="sqft"
                    type="number"
                    placeholder="1200"
                    value={formData.sqft}
                    onChange={(e) => handleInputChange("sqft", e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lease Terms */}
          <Card>
            <CardHeader>
              <CardTitle>Lease Terms</CardTitle>
              <CardDescription>Set your rental terms and policies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deposit">Security Deposit ($)</Label>
                <Input
                  id="deposit"
                  type="number"
                  placeholder="2500"
                  value={formData.deposit}
                  onChange={(e) => handleInputChange("deposit", e.target.value)}
                  required
                />
                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox
                    id="negotiableDeposit"
                    checked={formData.negotiableDeposit || false}
                    onCheckedChange={(checked) => handleInputChange("negotiableDeposit", checked as boolean)}
                  />
                  <Label htmlFor="negotiableDeposit" className="text-sm">
                    Negotiable
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Preferences</CardTitle>
              <CardDescription>Choose how tenants can contact you about this property</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includePhoneNumber"
                  checked={formData.includePhoneNumber}
                  onCheckedChange={(checked) => handleInputChange("includePhoneNumber", checked as boolean)}
                />
                <Label htmlFor="includePhoneNumber" className="text-sm font-medium">
                  Include Phone Number
                </Label>
                <div className="ml-auto">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="allowChat" className="text-sm font-medium">
                      Allow chat
                    </Label>
                    <Checkbox
                      id="allowChat"
                      checked={formData.allowChat}
                      onCheckedChange={(checked) => handleInputChange("allowChat", checked as boolean)}
                    />
                  </div>
                </div>
              </div>

              {formData.includePhoneNumber && (
                <div className="space-y-2">
                  <Label htmlFor="contactPhoneNumber">Phone Number</Label>
                  <Input
                    id="contactPhoneNumber"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={formData.contactPhoneNumber}
                    onChange={(e) => handleInputChange("contactPhoneNumber", e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Amenities */}
          <Card>
            <CardHeader>
              <CardTitle>Amenities</CardTitle>
              <CardDescription>Select all amenities that apply to your property</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {amenitiesList.map((amenity) => (
                  <div key={amenity} className="flex items-center space-x-2">
                    <Checkbox
                      id={amenity}
                      checked={formData.amenities.includes(amenity)}
                      onCheckedChange={() => handleAmenityToggle(amenity)}
                    />
                    <Label htmlFor={amenity} className="text-sm">
                      {amenity}
                    </Label>
                  </div>
                ))}
              </div>

              {formData.amenities.length > 0 && (
                <div className="mt-4">
                  <Label className="text-sm font-medium">Selected Amenities:</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.amenities.map((amenity) => (
                      <Badge key={amenity} variant="secondary">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Media Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Photos & Videos</CardTitle>
              <CardDescription>Upload high-quality images and videos of your property</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Existing Images (when editing) */}
              {isEditing && existingImages.length > 0 && (
                <div className="space-y-4">
                  <Label>Current Property Photos</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {existingImages.map((image) => (
                      <div key={image.id} className="relative">
                        <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                          <img 
                            src={image.image_url} 
                            alt={image.alt_text || "Property image"}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={() => removeExistingImage(image.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Image Upload */}
              <div className="space-y-4">
                <Label>{isEditing ? "Add New Photos" : "Property Photos"}</Label>
                <div 
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 transition-colors hover:border-primary/50"
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.currentTarget.classList.add('border-primary', 'bg-primary/5')
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault()
                    e.currentTarget.classList.remove('border-primary', 'bg-primary/5')
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.currentTarget.classList.remove('border-primary', 'bg-primary/5')
                    const files = e.dataTransfer.files
                    if (files) {
                      handleFileUpload("images", files)
                    }
                  }}
                >
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                    <div className="mt-4">
                      <Label htmlFor="images" className="cursor-pointer">
                        <span className="text-primary hover:text-primary/80">Click to upload images</span>
                        <span className="text-muted-foreground"> or drag and drop</span>
                      </Label>
                      <Input
                        id="images"
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload("images", e.target.files)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">PNG, JPG, WebP up to 10MB each</p>
                    <p className="text-xs text-muted-foreground">Maximum 20 images</p>
                  </div>
                </div>

                {formData.images.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">New Images ({formData.images.length})</p>
                      <div className="flex items-center gap-2">
                        {formData.images.length >= 10 && (
                          <Badge variant="secondary">Bulk Upload</Badge>
                        )}
                        {isProcessingImages && (
                          <Badge variant="outline" className="text-xs">
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Processing...
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Upload Progress Bar */}
                    {isProcessingImages && formData.images.length >= 10 && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Processing {formData.images.length} images...</span>
                          <span>{Math.round(uploadProgress)}%</span>
                        </div>
                        <Progress value={uploadProgress} className="w-full" />
                        <p className="text-xs text-muted-foreground">
                          Please wait while we prepare your images for upload
                        </p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {formData.images.map((file, index) => {
                        const imageUrl = URL.createObjectURL(file)
                        const isMainImage = index === 0
                        return (
                          <div 
                            key={`${file.name}-${index}`} 
                            className="relative group cursor-move border-2 border-transparent hover:border-primary/30 rounded-lg transition-colors"
                          >
                            <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                              <img 
                                src={imageUrl}
                                alt={file.name}
                                className="w-full h-full object-cover"
                                onLoad={() => URL.revokeObjectURL(imageUrl)}
                              />
                            </div>
                            
                            {isMainImage && (
                              <Badge className="absolute top-2 left-2 bg-yellow-500 hover:bg-yellow-600 text-yellow-900">
                                <Star className="w-3 h-3 mr-1 fill-current" />
                                Main
                              </Badge>
                            )}
                            
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeFile("images", index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            
                            <div className="absolute bottom-2 right-2">
                              <Badge variant="secondary" className="text-xs h-5">
                                #{index + 1}
                              </Badge>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Video Upload Placeholder */}
              <div className="space-y-4">
                <Label>Property Videos (Coming Soon)</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 bg-muted/30">
                  <div className="text-center">
                    <Play className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground mt-2">Video upload feature coming soon!</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex items-center justify-between">
            <Link href="/dashboard">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (isEditing ? "Updating Property..." : "Listing Property...") : (isEditing ? "Update Property" : "List Property")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

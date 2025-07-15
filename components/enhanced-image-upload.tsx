"use client"

import React, { useState, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, X, Star, Loader2, AlertTriangle, Move } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface EnhancedImageUploadProps {
  images: File[]
  onImagesChange: (images: File[]) => void
  maxImages?: number
  maxFileSize?: number // in MB
  allowedTypes?: string[]
  showMainSelector?: boolean
  mainImageIndex?: number
  onMainImageChange?: (index: number) => void
  isEditing?: boolean
  existingImages?: any[]
}

export function EnhancedImageUpload({ 
  images, 
  onImagesChange,
  maxImages = 20, 
  maxFileSize = 10,
  allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  showMainSelector = true,
  mainImageIndex = 0,
  onMainImageChange,
  isEditing = false,
  existingImages = []
}: EnhancedImageUploadProps) {
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [dragActive, setDragActive] = useState(false)
  const { toast } = useToast()

  // Validation functions
  const validateFile = (file: File): string | null => {
    // Check if file is valid
    if (!file || typeof file !== 'object') {
      return 'Invalid file object'
    }
    
    // Check if file has required properties
    if (file.size === undefined || file.size === null) {
      return 'File is missing required properties'
    }
    
    // Check if file is empty
    if (file.size === 0) {
      return 'File is empty'
    }
    
    // Check file type
    if (!file.type || !allowedTypes.includes(file.type)) {
      return `File type ${file.type || 'unknown'} not supported. Please use JPEG, PNG, or WebP.`
    }
    
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size ${(file.size / (1024 * 1024)).toFixed(1)}MB exceeds limit of ${maxFileSize}MB.`
    }
    
    return null
  }

  const validateImageDimensions = (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      // Check if file is a valid object
      if (!file || typeof file !== 'object') {
        resolve('Invalid file object')
        return
      }
      
      // Check if file has a valid type for image processing
      if (!file.type || !file.type.startsWith('image/')) {
        resolve('File is not a valid image')
        return
      }
      
      // Check if file has required properties
      if (!file.size || typeof file.size !== 'number') {
        resolve('File is missing required properties')
        return
      }
      
      let url: string
      
      try {
        url = URL.createObjectURL(file)
      } catch (error) {
        console.error('Error creating object URL:', error)
        resolve('Failed to process image file - invalid file format')
        return
      }
      
      const img = new Image()
      
      // Set a timeout to prevent hanging
      const timeout = setTimeout(() => {
        URL.revokeObjectURL(url)
        resolve('Image processing timed out.')
      }, 10000) // 10 second timeout
      
      img.onload = () => {
        clearTimeout(timeout)
        URL.revokeObjectURL(url)
        
        // No dimension restrictions - allow all image sizes
        // iPhone photos and high-resolution images are beneficial for property listings
        
        resolve(null)
      }
      
      img.onerror = () => {
        clearTimeout(timeout)
        URL.revokeObjectURL(url)
        resolve('Invalid image file or corrupted data.')
      }
      
      img.src = url
    })
  }

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const currentImageCount = images.length + existingImages.length
    
    // Check total image limit
    if (currentImageCount + fileArray.length > maxImages) {
      toast({
        title: "Too many images",
        description: `Maximum ${maxImages} images allowed. You can add ${maxImages - currentImageCount} more.`,
        variant: "destructive"
      })
      return
    }

    setIsProcessing(true)
    setErrors([])
    
    const validFiles: File[] = []
    const newErrors: string[] = []

    // Process each file directly without creating ImageFile objects
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i]
      
      // Check if file is valid
      if (!file || !(file instanceof File)) {
        newErrors.push(`File ${i + 1}: Invalid file object`)
        continue
      }
      
      const fileName = file.name || `Unknown file ${i + 1}`
      
      const basicError = validateFile(file)
      
      if (basicError) {
        newErrors.push(`${fileName}: ${basicError}`)
        continue
      }

      try {
        // Validate dimensions directly on the original file object
        const dimensionError = await validateImageDimensions(file)
        
        if (dimensionError) {
          newErrors.push(`${fileName}: ${dimensionError}`)
        } else {
          // Only add the original file object to validFiles
          validFiles.push(file)
        }
      } catch (error) {
        console.error('Error processing file:', error)
        let errorMessage = 'Unknown error'
        if (error instanceof Error && error.message) {
          errorMessage = error.message
        } else if (typeof error === 'string') {
          errorMessage = error
        } else if (error && typeof error === 'object' && 'message' in error) {
          errorMessage = String(error.message)
        }
        newErrors.push(`${fileName}: Error processing file - ${errorMessage}`)
      }
    }

    // Show results
    if (newErrors.length > 0) {
      setErrors(newErrors)
    }

    if (validFiles.length > 0) {
      onImagesChange([...images, ...validFiles])
      
      toast({
        title: "Images processed",
        description: `${validFiles.length} image${validFiles.length !== 1 ? 's' : ''} ready for upload${newErrors.length > 0 ? `, ${newErrors.length} failed` : ''}`,
        variant: validFiles.length > 0 ? "default" : "destructive"
      })
    }

    // Reset states
    setIsProcessing(false)
  }

  const handleFileUpload = useCallback((files: FileList | null) => {
    if (files) {
      processFiles(files)
    }
  }, [images, existingImages, maxImages])

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
    
    // Adjust main image index if needed
    if (onMainImageChange && mainImageIndex >= index && mainImageIndex > 0) {
      onMainImageChange(Math.max(0, mainImageIndex - 1))
    }
  }

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return
    
    const newImages = [...images]
    const [movedImage] = newImages.splice(fromIndex, 1)
    newImages.splice(toIndex, 0, movedImage)
    onImagesChange(newImages)
    
    // Update main image index
    if (onMainImageChange) {
      if (fromIndex === mainImageIndex) {
        onMainImageChange(toIndex)
      } else if (fromIndex < mainImageIndex && toIndex >= mainImageIndex) {
        onMainImageChange(mainImageIndex - 1)
      } else if (fromIndex > mainImageIndex && toIndex <= mainImageIndex) {
        onMainImageChange(mainImageIndex + 1)
      }
    }

    toast({
      title: "Image reordered",
      description: `Moved image to position ${toIndex + 1}`,
    })
  }

  const setMainImage = (index: number) => {
    if (onMainImageChange) {
      onMainImageChange(index)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const files = e.dataTransfer.files
    if (files) {
      handleFileUpload(files)
    }
  }

  const totalImages = images.length + existingImages.length

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div 
        className={`border-2 border-dashed rounded-lg p-6 transition-all ${
          dragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
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
              accept={allowedTypes.join(',')}
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
              disabled={isProcessing}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {allowedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')} up to {maxFileSize}MB each
          </p>
          <p className="text-xs text-muted-foreground">
            Maximum {maxImages} images • {totalImages}/{maxImages} uploaded
          </p>
          <p className="text-xs text-muted-foreground">
            All image sizes supported • High-resolution images recommended
          </p>
        </div>
      </div>

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">
              Processing images...
            </span>
          </div>
        </div>
      )}

      {/* Error Messages */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-2">Some images couldn't be processed:</div>
            <ul className="list-disc list-inside text-sm space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {isEditing ? 'New Images' : 'Property Images'} ({images.length})
            </p>
            <div className="flex items-center gap-2">
              {images.length >= 10 && (
                <Badge variant="secondary">Bulk Upload</Badge>
              )}
              {showMainSelector && (
                <Badge variant="outline" className="text-xs">
                  <Star className="w-3 h-3 mr-1" />
                  Tap to set main
                </Badge>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((file, index) => {
              let imageUrl: string
              let hasError = false
              
              try {
                imageUrl = URL.createObjectURL(file)
              } catch (error) {
                console.error('Error creating object URL for display:', error)
                hasError = true
                imageUrl = '' // fallback
              }
              
              const isMain = showMainSelector && index === mainImageIndex
              
              return (
                <div 
                  key={`${file.name}-${index}`} 
                  className={`relative group cursor-pointer border-2 rounded-lg transition-all ${
                    isMain 
                      ? 'border-yellow-400 shadow-lg' 
                      : 'border-transparent hover:border-primary/30'
                  }`}
                  onClick={() => showMainSelector && setMainImage(index)}
                >
                  <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                    {hasError ? (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <AlertTriangle className="w-8 h-8 text-muted-foreground" />
                      </div>
                    ) : (
                      <img 
                        src={imageUrl}
                        alt={file.name}
                        className="w-full h-full object-cover"
                        onLoad={() => {
                          try {
                            URL.revokeObjectURL(imageUrl)
                          } catch (error) {
                            console.error('Error revoking object URL:', error)
                          }
                        }}
                        onError={() => {
                          try {
                            URL.revokeObjectURL(imageUrl)
                          } catch (error) {
                            console.error('Error revoking object URL:', error)
                          }
                        }}
                      />
                    )}
                  </div>
                  
                  {/* Main Image Badge */}
                  {isMain && (
                    <Badge className="absolute top-2 left-2 bg-yellow-500 hover:bg-yellow-600 text-yellow-900">
                      <Star className="w-3 h-3 mr-1 fill-current" />
                      Main
                    </Badge>
                  )}
                  
                  {/* Remove Button */}
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeImage(index)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  
                  {/* Move Handle */}
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Badge variant="secondary" className="text-xs cursor-move">
                      <Move className="w-3 h-3 mr-1" />
                      #{index + 1}
                    </Badge>
                  </div>
                  
                  {/* File Size */}
                  <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Badge variant="secondary" className="text-xs">
                      {(file.size / (1024 * 1024)).toFixed(1)}MB
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Mobile-optimized reorder instructions */}
          <div className="block md:hidden">
            <Alert>
              <AlertDescription className="text-xs">
                <strong>Mobile tip:</strong> Tap any image to set it as the main photo. 
                The main photo appears first in listings and search results.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}
    </div>
  )
}

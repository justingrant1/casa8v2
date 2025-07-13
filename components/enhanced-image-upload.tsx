"use client"

import React, { useState, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, X, Star, Loader2, AlertTriangle, Check, Move } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ImageFile extends File {
  id: string
  isUploading: boolean
  uploadProgress: number
  error?: string
  isMain?: boolean
}

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
  
  const [uploadingFiles, setUploadingFiles] = useState<ImageFile[]>([])
  const [overallProgress, setOverallProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [dragActive, setDragActive] = useState(false)
  const { toast } = useToast()

  // Validation functions
  const validateFile = (file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return `File type ${file.type} not supported. Please use JPEG, PNG, or WebP.`
    }
    
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size ${(file.size / (1024 * 1024)).toFixed(1)}MB exceeds limit of ${maxFileSize}MB.`
    }
    
    return null
  }

  const validateImageDimensions = (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      
      img.onload = () => {
        URL.revokeObjectURL(url)
        
        // Minimum dimensions
        if (img.width < 400 || img.height < 300) {
          resolve(`Image dimensions ${img.width}x${img.height} too small. Minimum 400x300 pixels.`)
          return
        }
        
        // Maximum dimensions
        if (img.width > 4000 || img.height > 4000) {
          resolve(`Image dimensions ${img.width}x${img.height} too large. Maximum 4000x4000 pixels.`)
          return
        }
        
        resolve(null)
      }
      
      img.onerror = () => {
        URL.revokeObjectURL(url)
        resolve('Invalid image file.')
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
    const processedFiles: ImageFile[] = []

    // Initial validation
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i]
      const basicError = validateFile(file)
      
      if (basicError) {
        newErrors.push(`${file.name}: ${basicError}`)
        continue
      }

      const imageFile: ImageFile = {
        ...file,
        id: `${Date.now()}-${i}`,
        isUploading: true,
        uploadProgress: 0
      }
      
      processedFiles.push(imageFile)
    }

    setUploadingFiles(processedFiles)

    // Advanced validation with progress
    for (let i = 0; i < processedFiles.length; i++) {
      const file = processedFiles[i]
      
      try {
        // Simulate processing time and check dimensions
        const dimensionError = await validateImageDimensions(file)
        
        if (dimensionError) {
          newErrors.push(`${file.name}: ${dimensionError}`)
          processedFiles[i].error = dimensionError
        } else {
          validFiles.push(file)
          processedFiles[i].uploadProgress = 100
        }
        
        // Update progress
        const progress = ((i + 1) / processedFiles.length) * 100
        setOverallProgress(progress)
        setUploadingFiles([...processedFiles])
        
        // Simulate processing delay for bulk uploads
        if (processedFiles.length > 5) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
        
      } catch (error) {
        newErrors.push(`${file.name}: Error processing file`)
        processedFiles[i].error = 'Processing error'
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
    setTimeout(() => {
      setUploadingFiles([])
      setOverallProgress(0)
      setIsProcessing(false)
    }, 1000)
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
            Minimum 400x300 pixels • Maximum 4000x4000 pixels
          </p>
        </div>
      </div>

      {/* Processing Progress */}
      {isProcessing && uploadingFiles.length > 0 && (
        <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">
                Processing {uploadingFiles.length} image{uploadingFiles.length !== 1 ? 's' : ''}...
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              {Math.round(overallProgress)}%
            </span>
          </div>
          
          <Progress value={overallProgress} className="w-full" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {uploadingFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-2 bg-background rounded">
                <span className="truncate flex-1 mr-2">{file.name}</span>
                <div className="flex items-center gap-1">
                  {file.error ? (
                    <AlertTriangle className="w-3 h-3 text-destructive" />
                  ) : file.uploadProgress === 100 ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  )}
                  <span className="text-xs">
                    {file.error ? 'Error' : `${file.uploadProgress}%`}
                  </span>
                </div>
              </div>
            ))}
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
              const imageUrl = URL.createObjectURL(file)
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
                    <img 
                      src={imageUrl}
                      alt={file.name}
                      className="w-full h-full object-cover"
                      onLoad={() => URL.revokeObjectURL(imageUrl)}
                    />
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

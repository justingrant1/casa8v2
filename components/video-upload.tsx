"use client"

import React from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Upload, X, Play } from "lucide-react"

interface VideoUploadProps {
  videos: File[]
  onVideosChange: (videos: File[]) => void
  maxVideos?: number
  maxFileSize?: number // in MB
}

export function VideoUpload({ 
  videos, 
  onVideosChange, 
  maxVideos = 5, 
  maxFileSize = 100 
}: VideoUploadProps) {
  
  const handleFileUpload = (files: FileList | null) => {
    if (files) {
      const fileArray = Array.from(files)
      const validFiles: File[] = []
      
      for (const file of fileArray) {
        // Validate file type
        if (!file.type.startsWith('video/')) {
          continue
        }
        
        // Validate file size
        if (file.size > maxFileSize * 1024 * 1024) {
          continue
        }
        
        // Check total count
        if (videos.length + validFiles.length >= maxVideos) {
          break
        }
        
        validFiles.push(file)
      }
      
      onVideosChange([...videos, ...validFiles])
    }
  }

  const removeVideo = (index: number) => {
    const newVideos = videos.filter((_, i) => i !== index)
    onVideosChange(newVideos)
  }

  return (
    <div className="space-y-4">
      <Label>Property Videos (Optional)</Label>
      
      {/* Upload Area */}
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
            handleFileUpload(files)
          }
        }}
      >
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
          <div className="mt-4">
            <Label htmlFor="videos" className="cursor-pointer">
              <span className="text-primary hover:text-primary/80">Click to upload videos</span>
              <span className="text-muted-foreground"> or drag and drop</span>
            </Label>
            <Input
              id="videos"
              type="file"
              multiple
              accept="video/mp4,video/mov,video/avi,video/webm"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">MP4, MOV, AVI, WebM up to {maxFileSize}MB each</p>
          <p className="text-xs text-muted-foreground">Maximum {maxVideos} videos</p>
        </div>
      </div>

      {/* Video Preview Grid */}
      {videos.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Videos ({videos.length})</p>
            <Badge variant="outline" className="text-xs">
              Drag to reorder
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((file, index) => {
              const videoUrl = URL.createObjectURL(file)
              const isMainVideo = index === 0
              
              return (
                <div 
                  key={`${file.name}-${index}`} 
                  className="relative group border-2 border-transparent hover:border-primary/30 rounded-lg transition-colors"
                >
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
                    <video 
                      src={videoUrl}
                      className="w-full h-full object-cover"
                      onLoad={() => URL.revokeObjectURL(videoUrl)}
                      muted
                    >
                      Your browser does not support the video tag.
                    </video>
                    
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-white/90 rounded-full p-3">
                        <Play className="w-6 h-6 text-gray-800 fill-current" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Main Video Badge */}
                  {isMainVideo && (
                    <Badge className="absolute top-2 left-2 bg-blue-500 hover:bg-blue-600 text-white">
                      Main Video
                    </Badge>
                  )}
                  
                  {/* Remove Button */}
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeVideo(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  
                  {/* Video Info */}
                  <div className="absolute bottom-1 left-1 right-1">
                    <p className="text-xs bg-black/50 text-white p-1 rounded truncate">
                      {file.name}
                    </p>
                  </div>
                  
                  {/* File Size */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Badge variant="secondary" className="text-xs">
                      {(file.size / (1024 * 1024)).toFixed(1)}MB
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

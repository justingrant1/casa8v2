"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, LogIn } from "lucide-react"
import { toast } from "sonner"
import { createApplication } from "@/lib/applications"
import { useAuth } from "@/lib/auth"
import Link from "next/link"

interface ApplyPropertyModalProps {
  isOpen: boolean
  onClose: () => void
  property: {
    title: string
    id: string
    landlord_id: string
  }
  landlord?: {
    name: string
    email: string
  }
}

export function ApplyPropertyModal({ isOpen, onClose, property, landlord }: ApplyPropertyModalProps) {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    hasSection8: false,
    message: "",
  })

  // Auto-populate form fields from user profile when modal opens
  useEffect(() => {
    if (isOpen && profile) {
      // Extract first and last name from full_name
      const nameParts = profile.full_name?.split(' ') || []
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''
      
      setFormData({
        firstName: firstName,
        lastName: lastName,
        email: profile.email || user?.email || '',
        phone: profile.phone || '',
        hasSection8: profile.has_section8 || false,
        message: '',
      })
    }
  }, [isOpen, profile, user])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast.error("Authentication required", {
        description: "Please log in to submit applications.",
      })
      return
    }

    setIsLoading(true)

    try {
      const applicationData = {
        property_id: property.id,
        landlord_id: property.landlord_id,
        tenant_name: `${formData.firstName} ${formData.lastName}`,
        tenant_email: formData.email,
        tenant_phone: formData.phone,
        lease_length_months: 12, // Default to 12 months
        has_voucher: formData.hasSection8,
        message: formData.message || undefined,
      }

      await createApplication(applicationData)

      // Temporary alert for debugging
      alert("Application submitted successfully! This is a temporary message.")

      toast.success("Application Submitted!", {
        description: "Your application has been sent to the landlord.",
        action: {
          label: "View My Applications",
          onClick: () => router.push('/dashboard?tab=applications'),
        },
      })
      
      onClose()
    } catch (error: any) {
      console.error('Application submission error:', error)
      // Log the full error object for more details
      console.error('Full error object:', JSON.stringify(error, null, 2))
      
      toast.error("Failed to submit application", {
        description: error.message || "An unexpected error occurred. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md sm:max-w-lg md:max-w-xl mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-semibold">Apply for this Property</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Please fill out the form below to apply for this rental property.
          </p>
        </DialogHeader>

        {!user ? (
          // Show login prompt when user is not authenticated
          <div className="text-center space-y-4 mt-6">
            <div className="p-8 bg-muted rounded-lg">
              <LogIn className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
              <p className="text-muted-foreground mb-4">
                Please log in to submit applications for rental properties.
              </p>
              <Button asChild className="w-full">
                <Link href="/login">
                  <LogIn className="h-4 w-4 mr-2" />
                  Log In
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          // Show application form when user is authenticated
          <form onSubmit={handleSubmit} className="space-y-4 mt-4 px-1">
            <div>
              <h3 className="font-semibold text-lg mb-3">Personal Information</h3>
              <p className="text-sm text-muted-foreground mb-4">Provide your contact details for the application.</p>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  required
                  className="w-full"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
                className="w-full"
                placeholder="Enter your email address"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                required
                className="w-full"
                placeholder="Enter your phone number"
              />
            </div>

            {/* Section 8 */}
            <div className="flex items-start space-x-3 py-2">
              <Checkbox
                id="hasSection8"
                checked={formData.hasSection8}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasSection8: checked as boolean }))}
                className="mt-1"
              />
              <Label htmlFor="hasSection8" className="text-sm font-medium leading-relaxed">
                I have Section 8 voucher
              </Label>
            </div>

            {/* Additional Message */}
            <div className="space-y-2">
              <Label htmlFor="message" className="text-sm font-medium">Additional Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Any additional information you'd like to provide..."
                value={formData.message}
                onChange={(e) => handleInputChange("message", e.target.value)}
                rows={3}
                className="w-full resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                className="w-full bg-black hover:bg-gray-800 text-white py-3 text-base font-medium"
                disabled={isLoading || !formData.firstName || !formData.lastName || !formData.email || !formData.phone}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                {isLoading ? 'Submitting...' : 'Submit Application'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

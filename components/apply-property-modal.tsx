"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { sendApplicationEmail } from "@/lib/email"
import { useAuth } from "@/lib/auth"

interface ApplyPropertyModalProps {
  isOpen: boolean
  onClose: () => void
  property: {
    title: string
    id: number
  }
  landlord?: {
    name: string
    email: string
  }
}

export function ApplyPropertyModal({ isOpen, onClose, property, landlord }: ApplyPropertyModalProps) {
  const { user, profile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    moveInDate: "",
    monthlyIncome: "",
    employmentStatus: "",
    hasSection8: false,
    message: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !landlord) {
      toast({
        title: "Authentication required",
        description: "Please log in to submit applications.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const result = await sendApplicationEmail({
        landlord_name: landlord.name,
        landlord_email: landlord.email,
        tenant_name: `${formData.firstName} ${formData.lastName}`,
        tenant_email: formData.email,
        property_title: property.title,
        move_in_date: formData.moveInDate,
        monthly_income: formData.monthlyIncome,
        employment_status: formData.employmentStatus,
        has_section8: formData.hasSection8,
        additional_notes: formData.message,
      })

      if (result.success) {
        toast({
          title: "Application Submitted!",
          description: "Your rental application has been sent to the landlord.",
        })
        
        // Reset form and close modal
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          moveInDate: "",
          monthlyIncome: "",
          employmentStatus: "",
          hasSection8: false,
          message: "",
        })
        onClose()
      } else {
        throw new Error('Failed to send application')
      }
    } catch (error) {
      toast({
        title: "Failed to submit application",
        description: "Please try again or contact the landlord directly.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Apply for this Property</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Please fill out the form below to apply for this rental property.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <h3 className="font-semibold text-lg mb-3">Personal Information</h3>
            <p className="text-sm text-muted-foreground mb-4">Provide your contact details for the application.</p>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              required
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              required
            />
          </div>

          {/* Move-in Date */}
          <div className="space-y-2">
            <Label htmlFor="moveInDate">Preferred Move-in Date</Label>
            <Input
              id="moveInDate"
              type="date"
              value={formData.moveInDate}
              onChange={(e) => handleInputChange("moveInDate", e.target.value)}
            />
          </div>

          {/* Monthly Income */}
          <div className="space-y-2">
            <Label htmlFor="monthlyIncome">Monthly Income</Label>
            <Input
              id="monthlyIncome"
              type="number"
              placeholder="Enter monthly income"
              value={formData.monthlyIncome}
              onChange={(e) => handleInputChange("monthlyIncome", e.target.value)}
            />
          </div>

          {/* Employment Status */}
          <div className="space-y-2">
            <Label htmlFor="employmentStatus">Employment Status</Label>
            <Select value={formData.employmentStatus} onValueChange={(value) => handleInputChange("employmentStatus", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select employment status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employed">Employed</SelectItem>
                <SelectItem value="self-employed">Self-Employed</SelectItem>
                <SelectItem value="unemployed">Unemployed</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Section 8 */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasSection8"
              checked={formData.hasSection8}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasSection8: checked as boolean }))}
            />
            <Label htmlFor="hasSection8">I have Section 8 voucher</Label>
          </div>

          {/* Additional Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Additional Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Any additional information you'd like to provide..."
              value={formData.message}
              onChange={(e) => handleInputChange("message", e.target.value)}
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-black hover:bg-gray-800 text-white"
            disabled={isLoading || !formData.firstName || !formData.lastName || !formData.email || !formData.phone}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            {isLoading ? 'Submitting...' : 'Submit Application'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

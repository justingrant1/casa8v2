"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowLeft, Upload, FileText } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

export default function ApplicationPage() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.id

  const [formData, setFormData] = useState({
    // Personal Information
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",

    // Employment Information
    employmentStatus: "",
    employer: "",
    jobTitle: "",
    monthlyIncome: "",
    employmentLength: "",

    // Rental History
    currentAddress: "",
    currentLandlord: "",
    currentLandlordPhone: "",
    rentAmount: "",
    moveInDate: "",
    moveOutDate: "",
    reasonForMoving: "",

    // References
    reference1Name: "",
    reference1Phone: "",
    reference1Relationship: "",
    reference2Name: "",
    reference2Phone: "",
    reference2Relationship: "",

    // Additional Information
    pets: "",
    petDetails: "",
    additionalOccupants: "",
    occupantDetails: "",
    backgroundCheck: false,
    creditCheck: false,

    // Documents
    documents: [] as File[],
  })

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleFileUpload = (files: FileList | null) => {
    if (files) {
      const fileArray = Array.from(files)
      setFormData((prev) => ({
        ...prev,
        documents: [...prev.documents, ...fileArray],
      }))
    }
  }

  const removeFile = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Application data:", formData)
    // Handle form submission
    router.push(`/application-submitted/${propertyId}`)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link href={`/property/${propertyId}`}>
              <Button variant="ghost">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Property
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Rental Application</h1>
              <p className="text-muted-foreground">Complete your application to rent this property</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Tell us about yourself</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Employment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Employment Information</CardTitle>
              <CardDescription>Your current employment details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Employment Status</Label>
                <RadioGroup
                  value={formData.employmentStatus}
                  onValueChange={(value) => handleInputChange("employmentStatus", value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="employed" id="employed" />
                    <Label htmlFor="employed">Employed</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="self-employed" id="self-employed" />
                    <Label htmlFor="self-employed">Self-employed</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="student" id="student" />
                    <Label htmlFor="student">Student</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="retired" id="retired" />
                    <Label htmlFor="retired">Retired</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employer">Employer/Company</Label>
                  <Input
                    id="employer"
                    value={formData.employer}
                    onChange={(e) => handleInputChange("employer", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    value={formData.jobTitle}
                    onChange={(e) => handleInputChange("jobTitle", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monthlyIncome">Monthly Income ($)</Label>
                  <Input
                    id="monthlyIncome"
                    type="number"
                    value={formData.monthlyIncome}
                    onChange={(e) => handleInputChange("monthlyIncome", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employmentLength">Length of Employment</Label>
                  <Select
                    value={formData.employmentLength}
                    onValueChange={(value) => handleInputChange("employmentLength", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="less-than-6-months">Less than 6 months</SelectItem>
                      <SelectItem value="6-months-1-year">6 months - 1 year</SelectItem>
                      <SelectItem value="1-2-years">1-2 years</SelectItem>
                      <SelectItem value="2-5-years">2-5 years</SelectItem>
                      <SelectItem value="more-than-5-years">More than 5 years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rental History */}
          <Card>
            <CardHeader>
              <CardTitle>Current/Previous Rental History</CardTitle>
              <CardDescription>Information about your current or most recent rental</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentAddress">Current Address</Label>
                <Input
                  id="currentAddress"
                  value={formData.currentAddress}
                  onChange={(e) => handleInputChange("currentAddress", e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentLandlord">Current Landlord Name</Label>
                  <Input
                    id="currentLandlord"
                    value={formData.currentLandlord}
                    onChange={(e) => handleInputChange("currentLandlord", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentLandlordPhone">Landlord Phone</Label>
                  <Input
                    id="currentLandlordPhone"
                    type="tel"
                    value={formData.currentLandlordPhone}
                    onChange={(e) => handleInputChange("currentLandlordPhone", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rentAmount">Monthly Rent ($)</Label>
                  <Input
                    id="rentAmount"
                    type="number"
                    value={formData.rentAmount}
                    onChange={(e) => handleInputChange("rentAmount", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="moveInDate">Move-in Date</Label>
                  <Input
                    id="moveInDate"
                    type="date"
                    value={formData.moveInDate}
                    onChange={(e) => handleInputChange("moveInDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="moveOutDate">Move-out Date</Label>
                  <Input
                    id="moveOutDate"
                    type="date"
                    value={formData.moveOutDate}
                    onChange={(e) => handleInputChange("moveOutDate", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reasonForMoving">Reason for Moving</Label>
                <Textarea
                  id="reasonForMoving"
                  value={formData.reasonForMoving}
                  onChange={(e) => handleInputChange("reasonForMoving", e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* References */}
          <Card>
            <CardHeader>
              <CardTitle>References</CardTitle>
              <CardDescription>Provide two personal or professional references</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Reference 1</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reference1Name">Full Name</Label>
                    <Input
                      id="reference1Name"
                      value={formData.reference1Name}
                      onChange={(e) => handleInputChange("reference1Name", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reference1Phone">Phone Number</Label>
                    <Input
                      id="reference1Phone"
                      type="tel"
                      value={formData.reference1Phone}
                      onChange={(e) => handleInputChange("reference1Phone", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reference1Relationship">Relationship</Label>
                    <Input
                      id="reference1Relationship"
                      placeholder="e.g., Friend, Colleague"
                      value={formData.reference1Relationship}
                      onChange={(e) => handleInputChange("reference1Relationship", e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Reference 2</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reference2Name">Full Name</Label>
                    <Input
                      id="reference2Name"
                      value={formData.reference2Name}
                      onChange={(e) => handleInputChange("reference2Name", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reference2Phone">Phone Number</Label>
                    <Input
                      id="reference2Phone"
                      type="tel"
                      value={formData.reference2Phone}
                      onChange={(e) => handleInputChange("reference2Phone", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reference2Relationship">Relationship</Label>
                    <Input
                      id="reference2Relationship"
                      placeholder="e.g., Friend, Colleague"
                      value={formData.reference2Relationship}
                      onChange={(e) => handleInputChange("reference2Relationship", e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>Tell us about pets and additional occupants</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Do you have pets?</Label>
                <RadioGroup value={formData.pets} onValueChange={(value) => handleInputChange("pets", value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="pets-yes" />
                    <Label htmlFor="pets-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="pets-no" />
                    <Label htmlFor="pets-no">No</Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.pets === "yes" && (
                <div className="space-y-2">
                  <Label htmlFor="petDetails">Pet Details</Label>
                  <Textarea
                    id="petDetails"
                    placeholder="Please describe your pets (type, breed, age, weight, etc.)"
                    value={formData.petDetails}
                    onChange={(e) => handleInputChange("petDetails", e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Will there be additional occupants?</Label>
                <RadioGroup
                  value={formData.additionalOccupants}
                  onValueChange={(value) => handleInputChange("additionalOccupants", value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="occupants-yes" />
                    <Label htmlFor="occupants-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="occupants-no" />
                    <Label htmlFor="occupants-no">No</Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.additionalOccupants === "yes" && (
                <div className="space-y-2">
                  <Label htmlFor="occupantDetails">Occupant Details</Label>
                  <Textarea
                    id="occupantDetails"
                    placeholder="Please list all additional occupants (names, ages, relationship to you)"
                    value={formData.occupantDetails}
                    onChange={(e) => handleInputChange("occupantDetails", e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Supporting Documents</CardTitle>
              <CardDescription>Upload required documents to support your application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                  <div className="mt-4">
                    <Label htmlFor="documents" className="cursor-pointer">
                      <span className="text-primary hover:text-primary/80">Click to upload documents</span>
                      <span className="text-muted-foreground"> or drag and drop</span>
                    </Label>
                    <Input
                      id="documents"
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e.target.files)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">PDF, DOC, JPG, PNG up to 10MB each</p>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-2">Recommended documents:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Government-issued ID</li>
                  <li>Proof of income (pay stubs, tax returns)</li>
                  <li>Bank statements</li>
                  <li>Previous rental references</li>
                  <li>Employment verification letter</li>
                </ul>
              </div>

              {formData.documents.length > 0 && (
                <div className="space-y-2">
                  <Label>Uploaded Documents:</Label>
                  <div className="space-y-2">
                    {formData.documents.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{file.name}</span>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(index)}>
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Consent */}
          <Card>
            <CardHeader>
              <CardTitle>Consent & Authorization</CardTitle>
              <CardDescription>Please review and agree to the following</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="backgroundCheck"
                  checked={formData.backgroundCheck}
                  onCheckedChange={(checked) => handleInputChange("backgroundCheck", checked as boolean)}
                />
                <Label htmlFor="backgroundCheck" className="text-sm leading-relaxed">
                  I authorize the landlord to conduct a background check, including criminal history and rental history
                  verification.
                </Label>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="creditCheck"
                  checked={formData.creditCheck}
                  onCheckedChange={(checked) => handleInputChange("creditCheck", checked as boolean)}
                />
                <Label htmlFor="creditCheck" className="text-sm leading-relaxed">
                  I authorize the landlord to conduct a credit check and verify my employment and income information.
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex items-center justify-between">
            <Link href={`/property/${propertyId}`}>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" size="lg" disabled={!formData.backgroundCheck || !formData.creditCheck}>
              Submit Application
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, User, Settings } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { syncProfileToPropertyListings } from "@/lib/profile-sync"

export default function ProfilePage() {
  const { user, profile, loading, refreshProfile } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
    voucherBedrooms: "",
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }

    if (profile) {
      // Load existing profile data
      setProfileData({
        firstName: profile.full_name?.split(' ')[0] || "",
        lastName: profile.full_name?.split(' ')[1] || "",
        email: profile.email || "",
        phone: profile.phone || "",
        location: profile.preferred_city || "",
        bio: profile.bio || "",
        voucherBedrooms: profile.voucher_bedrooms || "",
      })
    }
  }, [profile, loading, router])

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    if (!user) return
    
    setIsSaving(true)
    try {
      // Combine first and last name
      const fullName = `${profileData.firstName.trim()} ${profileData.lastName.trim()}`.trim()
      
      // Update the profile in the database
      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName || null,
          phone: profileData.phone.trim() || null,
          bio: profileData.bio.trim() || null,
          preferred_city: profileData.location.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      // If user is a landlord and has updated contact info, sync to properties if needed
      if (user.user_metadata?.role === 'landlord') {
        try {
          const syncResult = await syncProfileToPropertyListings(user.id, {
            full_name: fullName,
            phone: profileData.phone.trim() || undefined
          })
          
          console.log('Profile sync result:', syncResult)
        } catch (syncError) {
          console.error('Error syncing profile to properties:', syncError)
          // Don't fail the whole save if sync fails
        }
      }

      // Refresh profile data from auth context
      if (refreshProfile) {
        await refreshProfile()
      }

      toast({
        title: "Profile updated successfully",
        description: "Your profile information has been saved.",
      })
      setIsEditing(false)
      
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast({
        title: "Error updating profile",
        description: error.message || "Failed to save your profile. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  const userRole = user?.user_metadata?.role || 'tenant'

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <h1 className="text-2xl font-bold">Profile</h1>
              </div>
            </div>
            <Link href="/settings">
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Your personal information as a {userRole}
                </CardDescription>
              </div>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              ) : (
                <div className="space-x-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={profileData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  disabled={!isEditing}
                  placeholder="John"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={profileData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  disabled={!isEditing}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  disabled={true} // Email usually can't be changed
                  placeholder="john.doe@email.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  disabled={!isEditing}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={profileData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  disabled={!isEditing}
                  placeholder="Seattle, WA"
                />
              </div>
              
              {userRole === 'tenant' && (
                <div className="space-y-2">
                  <Label htmlFor="voucherBedrooms">Voucher Bedrooms</Label>
                  <Input
                    id="voucherBedrooms"
                    value={profileData.voucherBedrooms}
                    disabled={true} // This is set during onboarding and shouldn't be editable
                    placeholder="Not set"
                  />
                  <p className="text-sm text-gray-500">
                    Set during initial setup. Contact support to change.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profileData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                disabled={!isEditing}
                placeholder={
                  userRole === 'landlord' 
                    ? "Tell tenants about yourself and your properties..."
                    : "Looking for a comfortable and affordable place to call home. I'm a responsible tenant with excellent references."
                }
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

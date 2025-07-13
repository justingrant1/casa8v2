"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Settings } from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    newPropertyAlerts: true,
    applicationUpdates: true,
    showEmail: false,
    showPhone: false,
    allowMessages: true,
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }
  }, [user, loading, router])

  const handleSwitchChange = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/profile">
              <Button variant="ghost">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <h1 className="text-2xl font-bold">Settings</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Manage your notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Email Notifications</Label>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => handleSwitchChange('emailNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Push Notifications</Label>
              <Switch
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => handleSwitchChange('pushNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>New Property Alerts</Label>
              <Switch
                checked={settings.newPropertyAlerts}
                onCheckedChange={(checked) => handleSwitchChange('newPropertyAlerts', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Application Updates</Label>
              <Switch
                checked={settings.applicationUpdates}
                onCheckedChange={(checked) => handleSwitchChange('applicationUpdates', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Privacy</CardTitle>
            <CardDescription>Control your privacy settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Show Email Address</Label>
              <Switch
                checked={settings.showEmail}
                onCheckedChange={(checked) => handleSwitchChange('showEmail', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Show Phone Number</Label>
              <Switch
                checked={settings.showPhone}
                onCheckedChange={(checked) => handleSwitchChange('showPhone', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Allow Messages</Label>
              <Switch
                checked={settings.allowMessages}
                onCheckedChange={(checked) => handleSwitchChange('allowMessages', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? "Saving..." : "Save All Settings"}
        </Button>
      </div>
    </div>
  )
}

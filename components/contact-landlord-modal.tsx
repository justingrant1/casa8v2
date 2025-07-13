"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageCircle, Mail, Phone, Copy, Send, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { contactLandlord } from "@/lib/messaging"
import { useAuth } from "@/lib/auth"

interface ContactLandlordModalProps {
  isOpen: boolean
  onClose: () => void
  landlord: {
    name: string
    phone: string
    email: string
    id: string
  }
  property: {
    title: string
    id: string
  }
}

export function ContactLandlordModal({ isOpen, onClose, landlord, property }: ContactLandlordModalProps) {
  const { user, profile } = useAuth()
  const [activeTab, setActiveTab] = useState("phone")
  const [isLoading, setIsLoading] = useState(false)
  const [emailForm, setEmailForm] = useState({
    subject: `Inquiry about ${property.title}`,
    message: `Hi ${landlord.name},\n\nI'm interested in your property "${property.title}" and would like to know more details. Could we schedule a viewing?\n\nThank you!`,
  })

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "Phone number copied to clipboard",
    })
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to send messages.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      await contactLandlord({
        property_id: property.id,
        landlord_id: landlord.id,
        subject: emailForm.subject,
        message: emailForm.message,
        tenant_name: profile?.full_name || user.email || 'Anonymous',
        tenant_email: user.email || '',
      })

      toast({
        title: "Message sent!",
        description: "Your message has been sent to the landlord.",
      })
      onClose()
    } catch (error: any) {
      console.error('Contact landlord error:', error)
      toast({
        title: "Failed to send message",
        description: error.message || "Please try again or contact the landlord directly.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const startChat = () => {
    // Handle chat initiation
    toast({
      title: "Chat started!",
      description: "Opening chat with the landlord...",
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">Contact Landlord</DialogTitle>
          <p className="text-center text-muted-foreground">Choose how you'd like to get in touch with</p>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="space-y-4 mt-6">
            <div className="text-center space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Start a Chat</h3>
                <p className="text-muted-foreground">Send an instant message to {landlord.name}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">You'll be connected with:</p>
                <p className="font-medium">{landlord.name}</p>
              </div>
              <Button onClick={startChat} className="w-full">
                <MessageCircle className="h-4 w-4 mr-2" />
                Start Chat
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="email" className="space-y-4 mt-6">
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Send Email</h3>
                <p className="text-muted-foreground text-sm mb-4">Send a message to {landlord.email}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm((prev) => ({ ...prev, subject: e.target.value }))}
                  placeholder="Enter subject"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={emailForm.message}
                  onChange={(e) => setEmailForm((prev) => ({ ...prev, message: e.target.value }))}
                  placeholder="Enter your message"
                  rows={6}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {isLoading ? 'Sending...' : 'Send Email'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="phone" className="space-y-4 mt-6">
            <div>
              <h3 className="text-lg font-semibold">Call</h3>
              <p className="text-muted-foreground">Use the phone number below to call directly</p>
            </div>

            <div className="flex items-center space-x-2">
              <Input value={landlord.phone} readOnly className="flex-1 bg-muted" />
              <Button variant="outline" size="icon" onClick={() => copyToClipboard(landlord.phone)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <Button asChild className="w-full">
                <a href={`tel:${landlord.phone}`}>
                  <Phone className="h-4 w-4 mr-2" />
                  Call {landlord.name}
                </a>
              </Button>
              <p className="text-xs text-muted-foreground text-center">Clicking will open your phone app</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

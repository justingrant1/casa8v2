"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { useRouter, useSearchParams } from 'next/navigation'
import { ConversationsSidebar } from '../../components/conversations-sidebar'
import { MessagePanel } from '../../components/message-panel'
import { Card, CardContent } from '@/components/ui/card'
import { MessageCircle } from 'lucide-react'
import { getMessageThreads } from '@/lib/messaging'

export default function MessagesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(Date.now())
  const [showSidebar, setShowSidebar] = useState(true)

  // Check if user is authenticated
  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
  }, [user, router])

  // Load conversations
  useEffect(() => {
    async function loadConversations() {
      if (!user) return
      
      try {
        setIsLoading(true)
        const threads = await getMessageThreads(user.id)
        console.log('Loaded threads:', threads) // Debug log
        setConversations(threads)
        
        // Auto-select conversation from URL params
        const conversationParam = searchParams.get('conversation')
        const propertyParam = searchParams.get('property')
        
        console.log('URL params:', { conversationParam, propertyParam }) // Debug log
        
        if (conversationParam && threads.length > 0) {
          console.log('Looking for conversation...') // Debug log
          const conversation = threads.find(t => {
            console.log('Thread participants:', t.participants, 'Property:', t.property_id) // Debug log
            return t.participants.includes(conversationParam) || 
                   (propertyParam && t.property_id === propertyParam)
          })
          console.log('Found conversation:', conversation) // Debug log
          if (conversation) {
            setSelectedConversation(conversation)
          }
        }
      } catch (error) {
        console.error('Error loading conversations:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadConversations()
    
    // Auto-refresh conversations every 5 seconds to catch new messages
    const interval = setInterval(loadConversations, 5000)
    return () => clearInterval(interval)
  }, [user, searchParams, lastUpdated])

  // Additional effect to handle URL parameters with retry logic
  useEffect(() => {
    const conversationParam = searchParams.get('conversation')
    const propertyParam = searchParams.get('property')
    
    if (conversationParam && !selectedConversation && conversations.length > 0) {
      console.log('Retrying conversation selection...') // Debug log
      
      // Retry finding the conversation with a delay
      const retryFind = () => {
        const conversation = conversations.find(t => 
          t.participants.includes(conversationParam) || 
          (propertyParam && t.property_id === propertyParam)
        )
        
        if (conversation) {
          console.log('Found conversation on retry:', conversation) // Debug log
          setSelectedConversation(conversation)
        } else {
          console.log('Still no conversation found, will retry on next load') // Debug log
          // Force a refresh to get the latest conversations
          setLastUpdated(Date.now())
        }
      }
      
      // Try again after a short delay
      setTimeout(retryFind, 1000)
    }
  }, [searchParams, selectedConversation, conversations])

  // Handle mobile responsiveness
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Hide sidebar on mobile when conversation is selected
  useEffect(() => {
    if (isMobile && selectedConversation) {
      setShowSidebar(false)
    }
  }, [isMobile, selectedConversation])

  const handleConversationSelect = (conversation: any) => {
    setSelectedConversation(conversation)
    if (isMobile) {
      setShowSidebar(false)
    }
  }

  const handleBackToConversations = () => {
    setSelectedConversation(null)
    setShowSidebar(true)
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className={`${
        isMobile 
          ? (showSidebar ? 'w-full' : 'hidden') 
          : 'w-80 border-r'
      } flex-shrink-0`}>
        <ConversationsSidebar
          conversations={conversations}
          selectedConversation={selectedConversation}
          onConversationSelect={handleConversationSelect}
          isLoading={isLoading}
          currentUserId={user.id}
        />
      </div>

      {/* Main Chat Area */}
      <div className={`${
        isMobile 
          ? (showSidebar ? 'hidden' : 'w-full') 
          : 'flex-1'
      } flex flex-col`}>
        {selectedConversation ? (
          <MessagePanel
            conversation={selectedConversation}
            currentUserId={user.id}
            onBack={isMobile ? handleBackToConversations : undefined}
            onMessageSent={() => setLastUpdated(Date.now())}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <Card className="w-full max-w-md mx-4">
              <CardContent className="p-12 text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-xl font-semibold mb-2">Select a conversation</h2>
                <p className="text-muted-foreground">
                  Choose a conversation from the sidebar to start messaging
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

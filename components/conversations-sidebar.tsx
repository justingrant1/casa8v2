"use client"

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, ArrowLeft, MessageCircle } from 'lucide-react'
import { getPropertyById } from '@/lib/properties'
import { supabase } from '@/lib/supabase'

interface ConversationsSidebarProps {
  conversations: any[]
  selectedConversation: any | null
  onConversationSelect: (conversation: any) => void
  isLoading: boolean
  currentUserId: string
}

export function ConversationsSidebar({
  conversations,
  selectedConversation,
  onConversationSelect,
  isLoading,
  currentUserId
}: ConversationsSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [enrichedConversations, setEnrichedConversations] = useState<any[]>([])

  // Enrich conversations with property and user data
  useEffect(() => {
    async function enrichConversations() {
      if (!conversations.length) {
        setEnrichedConversations([])
        return
      }

      try {
        const enriched = await Promise.all(
          conversations.map(async (conversation) => {
            const otherUserId = conversation.participants.find((p: string) => p !== currentUserId)
            
            // Get other user's profile
            let otherUser = null
            if (otherUserId) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', otherUserId)
                .single()
              
              if (profile) {
                otherUser = {
                  id: otherUserId,
                  name: profile.full_name || profile.email || 'Unknown User',
                  avatar: profile.avatar_url,
                  email: profile.email
                }
              }
            }

            // Get property data if available
            let property = null
            if (conversation.property_id) {
              try {
                const propertyData = await getPropertyById(conversation.property_id)
                if (propertyData) {
                  property = {
                    id: propertyData.id,
                    title: propertyData.title,
                    address: propertyData.address,
                    city: propertyData.city,
                    state: propertyData.state,
                    image: propertyData.property_images?.[0]?.image_url
                  }
                }
              } catch (error) {
                console.error('Error fetching property:', error)
              }
            }

            return {
              ...conversation,
              otherUser,
              property
            }
          })
        )
        
        setEnrichedConversations(enriched)
      } catch (error) {
        console.error('Error enriching conversations:', error)
        setEnrichedConversations(conversations)
      }
    }

    enrichConversations()
  }, [conversations, currentUserId])

  // Filter conversations based on search term
  const filteredConversations = enrichedConversations.filter(conversation => {
    const searchLower = searchTerm.toLowerCase()
    const userName = conversation.otherUser?.name?.toLowerCase() || ''
    const propertyTitle = conversation.property?.title?.toLowerCase() || ''
    const lastMessageContent = conversation.last_message?.message_text?.toLowerCase() || ''
    
    return userName.includes(searchLower) || 
           propertyTitle.includes(searchLower) || 
           lastMessageContent.includes(searchLower)
  })

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInDays === 1) {
      return 'Yesterday'
    } else if (diffInDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Messages</h1>
          <span className="text-2xl font-bold text-primary">casa8</span>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 rounded-lg animate-pulse">
                <div className="h-12 w-12 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium mb-2">No conversations</h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm ? 'No conversations match your search.' : 'Contact a landlord to start chatting!'}
            </p>
          </div>
        ) : (
          <div className="p-2">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => onConversationSelect(conversation)}
                className={`w-full p-3 rounded-lg text-left transition-colors ${
                  selectedConversation?.id === conversation.id
                    ? 'bg-primary/10 border-primary/20'
                    : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    <AvatarImage src={conversation.otherUser?.avatar} />
                    <AvatarFallback>
                      {conversation.otherUser?.name
                        ?.split(' ')
                        .map((n: string) => n[0])
                        .join('')
                        .toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium truncate">
                        {conversation.otherUser?.name || 'Unknown User'}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-muted-foreground">
                          {formatTime(conversation.last_message.created_at)}
                        </span>
                        {conversation.unread_count > 0 && (
                          <Badge variant="default" className="h-5 px-2 text-xs">
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {conversation.property && (
                      <p className="text-sm text-muted-foreground truncate mb-1">
                        📍 {conversation.property.title}
                      </p>
                    )}
                    
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.last_message.sender_id === currentUserId ? 'You: ' : ''}
                      {conversation.last_message.message_text}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

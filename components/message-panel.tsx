"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Send, Circle, Eye, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { 
  getConversation, 
  markMessageAsRead, 
  sendMessage as sendMessageFunction 
} from '@/lib/messaging'
import { 
  realtimeMessaging, 
  formatLastSeen, 
  isRecentlyActive,
  type RealtimeMessage, 
  type TypingIndicator, 
  type OnlineUser 
} from '@/lib/realtime-messaging'

interface MessagePanelProps {
  conversation: any
  currentUserId: string
  onBack?: () => void
}

export function MessagePanel({ conversation, currentUserId, onBack }: MessagePanelProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([])
  const [onlineStatus, setOnlineStatus] = useState<OnlineUser[]>([])
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const otherUser = conversation.otherUser
  const property = conversation.property

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])

  // Load initial messages
  useEffect(() => {
    async function loadMessages() {
      try {
        setIsLoading(true)
        const data = await getConversation(
          currentUserId, 
          otherUser.id, 
          property?.id
        )
        setMessages(data)
        
        // Mark messages as read
        const unreadMessages = data.filter((msg: any) => 
          msg.recipient_id === currentUserId && !msg.read_at
        )
        for (const msg of unreadMessages) {
          await markMessageAsRead(msg.id)
        }
      } catch (error) {
        console.error('Error loading messages:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user?.id && otherUser?.id) {
      loadMessages()
    }
  }, [conversation, currentUserId, otherUser?.id, property?.id, user])

  // Setup real-time subscriptions
  useEffect(() => {
    if (!user || !property?.id) return

    // Setup presence tracking
    const cleanupPresence = realtimeMessaging.setupPresenceTracking()

    // Subscribe to new messages
    const unsubscribeMessages = realtimeMessaging.subscribeToMessages(
      property.id,
      (message) => {
        setMessages(prev => [...prev, message])
        
        // Mark as read if we're the recipient
        if (message.recipient_id === currentUserId) {
          markMessageAsRead(message.id)
        }
        
        scrollToBottom()
      },
      (message) => {
        setMessages(prev => 
          prev.map(msg => msg.id === message.id ? message : msg)
        )
      }
    )

    // Subscribe to typing indicators
    const unsubscribeTyping = realtimeMessaging.subscribeToTypingIndicators(
      property.id,
      (indicators) => {
        // Filter out our own typing indicator
        const otherUsersTyping = indicators.filter(ind => ind.user_id !== currentUserId)
        setTypingUsers(otherUsersTyping)
      }
    )

    // Subscribe to online status
    const unsubscribeOnline = realtimeMessaging.subscribeToOnlineStatus(
      [otherUser.id],
      (users) => {
        setOnlineStatus(users)
      }
    )

    // Load initial online status
    realtimeMessaging.getOnlineStatus([otherUser.id]).then(setOnlineStatus)

    return () => {
      cleanupPresence()
      unsubscribeMessages()
      unsubscribeTyping()
      unsubscribeOnline()
    }
  }, [property?.id, otherUser?.id, currentUserId, user])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Handle typing detection
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setNewMessage(value)

    if (!user || !property?.id) return

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set typing status
    if (value.trim() && !isTyping) {
      setIsTyping(true)
      realtimeMessaging.setTypingStatus(property.id, otherUser.id, true)
    }

    // Clear typing status after 1 second of no typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      realtimeMessaging.setTypingStatus(property.id, otherUser.id, false)
    }, 1000)
  }

  // Handle message send
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim() || !user || isSending) return

    setIsSending(true)
    
    try {
      // Clear typing status immediately
      setIsTyping(false)
      realtimeMessaging.setTypingStatus(property.id, otherUser.id, false)
      
      // Send message through our messaging system
      await sendMessageFunction({
        recipient_id: otherUser.id,
        property_id: property.id,
        subject: `Message about ${property.title}`,
        message_text: newMessage.trim(),
        message_type: 'inquiry'
      })

      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsSending(false)
    }
  }

  // Get participant's online status
  const participantOnline = onlineStatus.find(u => u.user_id === otherUser.id)
  const isParticipantOnline = participantOnline?.is_online
  const lastSeen = participantOnline?.last_seen_at

  // Check if participant is typing
  const participantTyping = typingUsers.some(t => t.user_id === otherUser.id)

  const handleViewProperty = () => {
    if (property?.id) {
      router.push(`/property/${property.id}`)
    }
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherUser?.avatar} />
              <AvatarFallback>
                {otherUser?.name
                  ?.split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold truncate">{otherUser?.name || 'Unknown User'}</h2>
              <div className="flex items-center space-x-2 text-sm">
                <div className="flex items-center space-x-1">
                  <Circle 
                    className={`h-2 w-2 ${
                      isParticipantOnline 
                        ? 'fill-green-500 text-green-500' 
                        : isRecentlyActive(lastSeen || '') 
                          ? 'fill-yellow-500 text-yellow-500'
                          : 'fill-gray-400 text-gray-400'
                    }`} 
                  />
                  <span className="text-muted-foreground">
                    {isParticipantOnline 
                      ? 'Online' 
                      : lastSeen 
                        ? formatLastSeen(lastSeen)
                        : 'Offline'
                    }
                  </span>
                </div>
                {participantTyping && (
                  <Badge variant="secondary" className="text-xs">
                    Typing...
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {property && (
            <Button variant="outline" size="sm" onClick={handleViewProperty}>
              <Eye className="h-4 w-4 mr-2" />
              View Property
            </Button>
          )}
        </div>

        {/* Property Context */}
        {property && (
          <div className="mt-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-sm">{property.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {property.address}, {property.city}, {property.state}
                </p>
              </div>
              {property.image && (
                <div className="w-12 h-12 bg-muted rounded-md overflow-hidden">
                  <img 
                    src={property.image} 
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message: any) => {
              const isOwnMessage = message.sender_id === currentUserId
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-3 py-2 ${
                      isOwnMessage
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{message.message_text}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs opacity-70">
                        {new Date(message.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {isOwnMessage && (
                        <span className="text-xs opacity-70">
                          {message.read_at ? '✓✓' : '✓'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Type a message..."
            disabled={isSending}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={!newMessage.trim() || isSending}
            size="icon"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

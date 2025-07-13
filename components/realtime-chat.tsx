"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Send, Circle, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { getConversation, markMessageAsRead, sendMessage } from "@/lib/messaging"
import { 
  realtimeMessaging, 
  formatLastSeen, 
  isRecentlyActive,
  type RealtimeMessage, 
  type TypingIndicator, 
  type OnlineUser 
} from "@/lib/realtime-messaging"

interface RealtimeChatProps {
  propertyId: string
  participantId: string
  participantName: string
  participantAvatar?: string
  onClose?: () => void
}

export function RealtimeChat({ 
  propertyId, 
  participantId, 
  participantName, 
  participantAvatar,
  onClose 
}: RealtimeChatProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([])
  const [onlineStatus, setOnlineStatus] = useState<OnlineUser[]>([])
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  
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
        const data = await getConversation(user!.id, participantId, propertyId)
        setMessages(data)
        
        // Mark messages as read
        const unreadMessages = data.filter((msg: any) => 
          msg.recipient_id === user?.id && !msg.read_at
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

    if (user?.id) {
      loadMessages()
    }
  }, [propertyId, participantId, user])

  // Setup real-time subscriptions
  useEffect(() => {
    if (!user) return

    // Setup presence tracking
    const cleanupPresence = realtimeMessaging.setupPresenceTracking()

    // Subscribe to new messages
    const unsubscribeMessages = realtimeMessaging.subscribeToMessages(
      propertyId,
      (message) => {
        setMessages(prev => [...prev, message])
        
        // Mark as read if we're the recipient
        if (message.recipient_id === user.id) {
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
      propertyId,
      (indicators) => {
        // Filter out our own typing indicator
        const otherUsersTyping = indicators.filter(ind => ind.user_id !== user.id)
        setTypingUsers(otherUsersTyping)
      }
    )

    // Subscribe to online status
    const unsubscribeOnline = realtimeMessaging.subscribeToOnlineStatus(
      [participantId],
      (users) => {
        setOnlineStatus(users)
      }
    )

    // Load initial online status
    realtimeMessaging.getOnlineStatus([participantId]).then(setOnlineStatus)

    return () => {
      cleanupPresence()
      unsubscribeMessages()
      unsubscribeTyping()
      unsubscribeOnline()
    }
  }, [propertyId, participantId, user])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Handle typing detection
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setNewMessage(value)

    if (!user) return

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set typing status
    if (value.trim() && !isTyping) {
      setIsTyping(true)
      realtimeMessaging.setTypingStatus(propertyId, participantId, true)
    }

    // Clear typing status after 1 second of no typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      realtimeMessaging.setTypingStatus(propertyId, participantId, false)
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
      realtimeMessaging.setTypingStatus(propertyId, participantId, false)
      
      // Send message through our messaging system
      await sendMessage({
        recipient_id: participantId,
        property_id: propertyId,
        subject: `Message about property`,
        message_text: newMessage.trim()
      })

      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsSending(false)
    }
  }

  // Get participant's online status
  const participantOnline = onlineStatus.find(u => u.user_id === participantId)
  const isParticipantOnline = participantOnline?.is_online
  const lastSeen = participantOnline?.last_seen_at

  // Check if participant is typing
  const participantTyping = typingUsers.some(t => t.user_id === participantId)

  if (!user) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <p>Please log in to use chat</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto h-[600px] flex flex-col">
      {/* Chat Header */}
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={participantAvatar} />
              <AvatarFallback>{participantName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{participantName}</h3>
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
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          )}
        </div>
      </CardHeader>

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
              const isOwnMessage = message.sender_id === user?.id
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
    </Card>
  )
}

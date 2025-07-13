"use client"

import { supabase } from './supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface TypingIndicator {
  user_id: string
  property_id: string
  participant_id: string
  is_typing: boolean
  updated_at: string
}

export interface OnlineUser {
  user_id: string
  is_online: boolean
  last_seen_at: string
}

export interface RealtimeMessage {
  id: string
  sender_id: string
  recipient_id: string
  property_id: string
  subject: string
  message: string
  read_at: string | null
  created_at: string
  sender_profile?: {
    full_name: string
    avatar_url: string
  }
}

class RealtimeMessaging {
  private channels: Map<string, RealtimeChannel> = new Map()
  private typingTimers: Map<string, NodeJS.Timeout> = new Map()

  /**
   * Subscribe to real-time messages for a specific property
   */
  subscribeToMessages(
    propertyId: string,
    onMessage: (message: RealtimeMessage) => void,
    onMessageUpdate: (message: RealtimeMessage) => void
  ): () => void {
    const channelName = `messages:${propertyId}`
    
    // Remove existing subscription if any
    this.unsubscribeFromChannel(channelName)

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `property_id=eq.${propertyId}`
        },
        (payload) => {
          console.log('New message received:', payload)
          onMessage(payload.new as RealtimeMessage)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `property_id=eq.${propertyId}`
        },
        (payload) => {
          console.log('Message updated:', payload)
          onMessageUpdate(payload.new as RealtimeMessage)
        }
      )
      .subscribe()

    this.channels.set(channelName, channel)

    return () => this.unsubscribeFromChannel(channelName)
  }

  /**
   * Subscribe to typing indicators for a conversation
   */
  subscribeToTypingIndicators(
    propertyId: string,
    onTypingChange: (indicators: TypingIndicator[]) => void
  ): () => void {
    const channelName = `typing:${propertyId}`
    
    this.unsubscribeFromChannel(channelName)

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `property_id=eq.${propertyId}`
        },
        async () => {
          // Fetch current typing indicators
          const { data } = await supabase
            .from('typing_indicators')
            .select('*')
            .eq('property_id', propertyId)
            .eq('is_typing', true)
            .gte('updated_at', new Date(Date.now() - 10000).toISOString()) // Last 10 seconds

          onTypingChange(data || [])
        }
      )
      .subscribe()

    this.channels.set(channelName, channel)

    return () => this.unsubscribeFromChannel(channelName)
  }

  /**
   * Subscribe to online status updates
   */
  subscribeToOnlineStatus(
    userIds: string[],
    onStatusChange: (users: OnlineUser[]) => void
  ): () => void {
    const channelName = 'online_status'
    
    this.unsubscribeFromChannel(channelName)

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles'
        },
        async () => {
          // Fetch current online status for relevant users
          const { data } = await supabase
            .from('profiles')
            .select('user_id, is_online, last_seen_at')
            .in('user_id', userIds)

          onStatusChange(data || [])
        }
      )
      .subscribe()

    this.channels.set(channelName, channel)

    return () => this.unsubscribeFromChannel(channelName)
  }

  /**
   * Update typing status
   */
  async setTypingStatus(
    propertyId: string,
    participantId: string,
    isTyping: boolean
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc('update_typing_status', {
        p_property_id: propertyId,
        p_participant_id: participantId,
        p_is_typing: isTyping
      })

      if (error) throw error

      // Clear typing indicator after 5 seconds if still typing
      if (isTyping) {
        const timerId = setTimeout(() => {
          this.setTypingStatus(propertyId, participantId, false)
        }, 5000)

        const timerKey = `${propertyId}-${participantId}`
        this.clearTypingTimer(timerKey)
        this.typingTimers.set(timerKey, timerId)
      }
    } catch (error) {
      console.error('Error updating typing status:', error)
    }
  }

  /**
   * Update online status
   */
  async setOnlineStatus(isOnline: boolean = true): Promise<void> {
    try {
      const { error } = await supabase.rpc('update_online_status', {
        p_is_online: isOnline
      })

      if (error) throw error
    } catch (error) {
      console.error('Error updating online status:', error)
    }
  }

  /**
   * Get conversation participants' online status
   */
  async getOnlineStatus(userIds: string[]): Promise<OnlineUser[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, is_online, last_seen_at')
        .in('user_id', userIds)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching online status:', error)
      return []
    }
  }

  /**
   * Get current typing indicators for a property
   */
  async getTypingIndicators(propertyId: string): Promise<TypingIndicator[]> {
    try {
      const { data, error } = await supabase
        .from('typing_indicators')
        .select('*')
        .eq('property_id', propertyId)
        .eq('is_typing', true)
        .gte('updated_at', new Date(Date.now() - 10000).toISOString())

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching typing indicators:', error)
      return []
    }
  }

  /**
   * Clean up typing timer
   */
  private clearTypingTimer(timerKey: string): void {
    const existingTimer = this.typingTimers.get(timerKey)
    if (existingTimer) {
      clearTimeout(existingTimer)
      this.typingTimers.delete(timerKey)
    }
  }

  /**
   * Unsubscribe from a specific channel
   */
  private unsubscribeFromChannel(channelName: string): void {
    const channel = this.channels.get(channelName)
    if (channel) {
      supabase.removeChannel(channel)
      this.channels.delete(channelName)
    }
  }

  /**
   * Clean up all subscriptions
   */
  cleanup(): void {
    // Clear all typing timers
    this.typingTimers.forEach(timer => clearTimeout(timer))
    this.typingTimers.clear()

    // Unsubscribe from all channels
    this.channels.forEach(channel => supabase.removeChannel(channel))
    this.channels.clear()

    // Set user offline
    this.setOnlineStatus(false)
  }

  /**
   * Setup presence tracking for user activity
   */
  setupPresenceTracking(): () => void {
    // Set user online when they become active
    this.setOnlineStatus(true)

    // Update last seen periodically while active
    const activityInterval = setInterval(() => {
      this.setOnlineStatus(true)
    }, 30000) // Every 30 seconds

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        this.setOnlineStatus(false)
      } else {
        this.setOnlineStatus(true)
      }
    }

    // Handle page unload
    const handleBeforeUnload = () => {
      this.setOnlineStatus(false)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    // Cleanup function
    return () => {
      clearInterval(activityInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      this.cleanup()
    }
  }
}

// Export singleton instance
export const realtimeMessaging = new RealtimeMessaging()

// Helper function to format last seen time
export function formatLastSeen(lastSeenAt: string): string {
  const lastSeen = new Date(lastSeenAt)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d ago`
  
  return lastSeen.toLocaleDateString()
}

// Helper function to determine if user is recently active
export function isRecentlyActive(lastSeenAt: string): boolean {
  const lastSeen = new Date(lastSeenAt)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60))
  
  return diffInMinutes < 5 // Active within last 5 minutes
}

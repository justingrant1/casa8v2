import { supabase } from './supabase'
import { sendContactEmail } from './email'

export interface Message {
  id: string
  property_id?: string
  application_id?: string
  sender_id: string
  recipient_id: string
  subject?: string
  message_text: string // Changed from content to message_text to match database schema
  message_type: 'general' | 'application' | 'inquiry' | 'maintenance' | 'system'
  is_read: boolean
  created_at: string
  read_at?: string
  // Optional joined user data
  sender?: {
    email: string
    full_name?: string
  }
  recipient?: {
    email: string
    full_name?: string
  }
  // Optional joined property/application data
  property?: {
    title: string
    address: string
  }
  application?: {
    status: string
    tenant_name: string
  }
}

export interface CreateMessageData {
  property_id?: string
  application_id?: string
  recipient_id: string
  subject?: string
  message_text: string // Changed from content to message_text
  message_type?: 'general' | 'application' | 'inquiry' | 'maintenance' | 'system'
}

export interface MessageThread {
  id: string
  property_id?: string
  application_id?: string
  participants: string[]
  last_message: Message
  unread_count: number
  messages: Message[]
}

export async function sendMessage(data: CreateMessageData) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('You must be logged in to send messages')
    }

    const messageData = {
      property_id: data.property_id,
      application_id: data.application_id,
      recipient_id: data.recipient_id,
      subject: data.subject,
      message_text: data.message_text,
      sender_id: user.id,
      message_type: data.message_type || 'general'
    }

    const { data: message, error } = await supabase
      .from('messages')
      .insert([messageData])
      .select(`
        *,
        sender:sender_id (
          email,
          full_name
        ),
        recipient:recipient_id (
          email,
          full_name
        )
      `)
      .single()

    if (error) throw error

    // Create notification for recipient
    await createMessageNotification(message)

    // Send email notification
    await sendMessageEmail(message)

    return message
  } catch (error) {
    console.error('Error sending message:', error)
    throw error
  }
}

export async function getMessagesForUser(userId: string) {
  try {
    console.log('🔍 Fetching messages for user:', userId)
    
    // Start with just sent messages to test if basic query works
    const { data: sentMessages, error: sentError } = await supabase
      .from('messages')
      .select('*')
      .eq('sender_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (sentError) {
      console.error('❌ Sent messages query error:', sentError)
      return []
    }

    console.log('✅ Sent messages fetched successfully:', sentMessages?.length || 0, 'messages')
    
    // For now, return just sent messages to test
    return sentMessages || []
  } catch (error) {
    console.error('❌ Error fetching messages:', error)
    return []
  }
}

export async function getMessageThreads(userId: string) {
  try {
    console.log('🧵 Starting to group messages into threads...')
    const messages = await getMessagesForUser(userId)
    
    if (messages.length === 0) {
      console.log('📭 No messages found for user')
      return []
    }
    
    // Simple thread creation - just group by property_id for now
    const threadMap = new Map<string, MessageThread>()
    
    messages.forEach((message, index) => {
      const otherParticipant = message.recipient_id // Since we only have sent messages, recipient is the other person
      const threadKey = `property-${message.property_id}-${otherParticipant}`
      
      console.log(`📝 Message ${index + 1}: ThreadKey=${threadKey}, To=${otherParticipant}, Property=${message.property_id}`)
      
      if (!threadMap.has(threadKey)) {
        threadMap.set(threadKey, {
          id: threadKey,
          property_id: message.property_id,
          application_id: message.application_id,
          participants: [userId, otherParticipant],
          last_message: message,
          unread_count: 0,
          messages: []
        })
        console.log(`✨ Created new thread: ${threadKey}`)
      }
      
      const thread = threadMap.get(threadKey)!
      thread.messages.push(message)
      
      // Update last message if this one is newer
      if (new Date(message.created_at) > new Date(thread.last_message.created_at)) {
        thread.last_message = message
      }
    })
    
    const threads = Array.from(threadMap.values()).sort(
      (a, b) => new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime()
    )
    
    console.log(`✅ Created ${threads.length} message threads`)
    
    return threads
  } catch (error) {
    console.error('❌ Error fetching message threads:', error)
    return [] // Return empty array instead of throwing
  }
}

export async function getConversation(userId: string, otherUserId: string, propertyId?: string, applicationId?: string) {
  try {
    let query = supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id (
          email,
          full_name
        ),
        recipient:recipient_id (
          email,
          full_name
        )
      `)
      .or(`and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${userId})`)

    if (propertyId) {
      query = query.eq('property_id', propertyId)
    }
    
    if (applicationId) {
      query = query.eq('application_id', applicationId)
    }

    const { data, error } = await query.order('created_at', { ascending: true })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Error fetching conversation:', error)
    throw error
  }
}

export async function markMessageAsRead(messageId: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('You must be logged in to mark messages as read')
    }

    const { error } = await supabase
      .from('messages')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('id', messageId)
      .eq('recipient_id', user.id) // Only recipient can mark as read

    if (error) throw error

    return true
  } catch (error) {
    console.error('Error marking message as read:', error)
    throw error
  }
}

export async function markAllMessagesAsRead(userId: string, otherUserId: string, propertyId?: string, applicationId?: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user || user.id !== userId) {
      throw new Error('You can only mark your own messages as read')
    }

    let query = supabase
      .from('messages')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('recipient_id', userId)
      .eq('sender_id', otherUserId)
      .eq('is_read', false)

    if (propertyId) {
      query = query.eq('property_id', propertyId)
    }
    
    if (applicationId) {
      query = query.eq('application_id', applicationId)
    }

    const { error } = await query

    if (error) throw error

    return true
  } catch (error) {
    console.error('Error marking all messages as read:', error)
    throw error
  }
}

export async function getUnreadMessageCount(userId: string) {
  try {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('is_read', false)

    if (error) throw error

    return count || 0
  } catch (error) {
    console.error('Error fetching unread message count:', error)
    return 0
  }
}

export async function deleteMessage(messageId: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('You must be logged in to delete messages')
    }

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)
      .eq('sender_id', user.id) // Only sender can delete their own messages

    if (error) throw error

    return true
  } catch (error) {
    console.error('Error deleting message:', error)
    throw error
  }
}

// Helper function to create notification for new message
async function createMessageNotification(message: any) {
  try {
    const subject = message.subject || 'New Message'
    const senderName = message.sender?.full_name || 
                      message.sender?.email || 'Someone'

    console.log('Notification would be created:', {
      title: `New message from ${senderName}`,
      message: `${subject}: ${message.message_text.substring(0, 100)}${message.message_text.length > 100 ? '...' : ''}`,
    })

    // Temporarily disabled due to permission issues
    // await supabase
    //   .from('notifications')
    //   .insert([{
    //     user_id: message.recipient_id,
    //     title: `New message from ${senderName}`,
    //     message: `${subject}: ${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}`,
    //     notification_type: 'message',
    //     related_property_id: message.property_id,
    //     related_application_id: message.application_id,
    //     related_message_id: message.id,
    //     action_url: `/dashboard?tab=messages&conversation=${message.sender_id}`
    //   }])
  } catch (error) {
    console.error('Error creating message notification:', error)
  }
}

// Helper function for email notifications using EmailJS
async function sendMessageEmail(message: any) {
  try {
    // Get additional property information if available
    let propertyTitle = 'Property Inquiry'
    if (message.property_id) {
      try {
        const { data: property } = await supabase
          .from('properties')
          .select('title')
          .eq('id', message.property_id)
          .single()
        
        if (property?.title) {
          propertyTitle = property.title
        }
      } catch (error) {
        console.log('Could not fetch property title for email notification')
      }
    }

    const senderName = message.sender?.full_name || 
                      'Casa8 User'
    
    const recipientName = message.recipient?.full_name || 
                         'User'

    console.log('Email notification would be sent:', {
      to: recipientName,
      from: senderName,
      subject: propertyTitle,
      content: message.message_text.substring(0, 100) + '...'
    })

    // Send email notification via EmailJS
    await sendContactEmail({
      landlord_name: recipientName,
      landlord_email: message.recipient?.email || '',
      tenant_name: senderName,
      tenant_email: message.sender?.email || '',
      property_title: propertyTitle,
      message: message.message_text
    })

    console.log('Email notification sent successfully')
  } catch (error) {
    console.error('Error sending message email notification:', error)
    // Don't throw error to avoid breaking message sending if email fails
  }
}

// Contact landlord - simplified message sending for property inquiries
export async function contactLandlord(data: {
  property_id: string
  landlord_id: string
  subject: string
  message: string
  tenant_name: string
  tenant_email: string
  tenant_phone?: string
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('You must be logged in to send messages')
    }

    const messageData = {
      property_id: data.property_id,
      recipient_id: data.landlord_id,
      subject: data.subject,
      message_text: `From: ${data.tenant_name} (${data.tenant_email}${data.tenant_phone ? `, ${data.tenant_phone}` : ''})\n\n${data.message}`,
      sender_id: user.id,
      message_type: 'inquiry'
    }

    const { data: message, error } = await supabase
      .from('messages')
      .insert([messageData])
      .select(`
        *,
        sender:sender_id (
          email,
          full_name
        ),
        recipient:recipient_id (
          email,
          full_name
        )
      `)
      .single()

    if (error) throw error

    // Create notification for recipient
    await createMessageNotification(message)

    // Send email notification
    await sendMessageEmail(message)

    return message
  } catch (error) {
    console.error('Error contacting landlord:', error)
    throw error
  }
}

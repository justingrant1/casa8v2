import { supabase } from './supabase'
import { sendApplicationEmail as sendApplicationEmailJS } from './email'

export interface Application {
  id: string
  property_id: string
  tenant_id: string
  landlord_id: string
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn'
  tenant_name: string
  tenant_email: string
  tenant_phone?: string
  move_in_date?: string
  lease_length_months: number
  monthly_income?: number
  employment_status?: string
  employer_name?: string
  has_voucher: boolean
  voucher_bedrooms?: number
  voucher_city?: string
  voucher_amount?: number
  message?: string
  previous_rental_history?: string
  ref_text?: string
  created_at: string
  updated_at: string
  // Optional joined properties data
  properties?: {
    title: string
    address: string
    rent_amount: number
    images?: {
      url: string
      is_main: boolean
    }[]
  }
}

export interface CreateApplicationData {
  property_id: string
  landlord_id: string
  tenant_name: string
  tenant_email: string
  tenant_phone?: string
  move_in_date?: string
  lease_length_months?: number
  monthly_income?: number
  employment_status?: string
  employer_name?: string
  has_voucher?: boolean
  voucher_bedrooms?: number
  voucher_city?: string
  voucher_amount?: number
  message?: string
  previous_rental_history?: string
  references?: string
}

export async function createApplication(data: CreateApplicationData) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('You must be logged in to submit an application')
    }

    // Check if user already has an application for this property
    const { data: existingApplication } = await supabase
      .from('applications')
      .select('id')
      .eq('property_id', data.property_id)
      .eq('tenant_id', user.id)
      .single()

    if (existingApplication) {
      throw new Error('You have already submitted an application for this property')
    }

    const applicationData = {
      ...data,
      tenant_id: user.id,
      ref_text: data.references, // Map references to ref_text column
    }

    // Remove the original references field since we mapped it to ref_text
    delete (applicationData as any).references

    const { data: application, error } = await supabase
      .from('applications')
      .insert([applicationData])
      .select(`
        *,
        properties:property_id (
          title,
          address,
          rent_amount
        )
      `)
      .single()

    if (error) throw error

    // Create notification for landlord
    await createApplicationNotification(application)

    // Send email notification to landlord
    await sendApplicationEmail(application)

    return application
  } catch (error) {
    console.error('Error creating application:', error)
    throw error
  }
}

export async function getApplicationsForLandlord(landlordId: string) {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        properties:property_id (
          title,
          address,
          rent_amount,
          images:property_images (
            url,
            is_main
          )
        )
      `)
      .eq('landlord_id', landlordId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Error fetching landlord applications:', error)
    throw error
  }
}

export async function getApplicationsForTenant(tenantId: string) {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        properties:property_id (
          title,
          address,
          rent_amount,
          images:property_images (
            url,
            is_main
          )
        )
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Error fetching tenant applications:', error)
    throw error
  }
}

export async function updateApplicationStatus(
  applicationId: string, 
  status: 'approved' | 'rejected',
  message?: string
) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('You must be logged in to update applications')
    }

    const { data: application, error } = await supabase
      .from('applications')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId)
      .eq('landlord_id', user.id) // Ensure only landlord can update
      .select(`
        *,
        properties:property_id (
          title,
          address
        )
      `)
      .single()

    if (error) throw error

    // Create notification for tenant
    await createStatusUpdateNotification(application, status, message)

    // Send email notification to tenant
    await sendStatusUpdateEmail(application, status, message)

    return application
  } catch (error) {
    console.error('Error updating application status:', error)
    throw error
  }
}

export async function withdrawApplication(applicationId: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('You must be logged in to withdraw applications')
    }

    const { data: application, error } = await supabase
      .from('applications')
      .update({ 
        status: 'withdrawn',
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId)
      .eq('tenant_id', user.id) // Ensure only tenant can withdraw their own application
      .select()
      .single()

    if (error) throw error

    return application
  } catch (error) {
    console.error('Error withdrawing application:', error)
    throw error
  }
}

export async function getApplicationById(applicationId: string) {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        properties:property_id (
          title,
          address,
          rent_amount,
          images:property_images (
            url,
            is_main
          )
        )
      `)
      .eq('id', applicationId)
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error fetching application:', error)
    throw error
  }
}

// Helper function to create notification for new application
async function createApplicationNotification(application: any) {
  try {
    await supabase
      .from('notifications')
      .insert([{
        user_id: application.landlord_id,
        title: 'New Application Received',
        message: `${application.tenant_name} has applied for your property: ${application.properties?.title}`,
        notification_type: 'application',
        related_property_id: application.property_id,
        related_application_id: application.id,
        action_url: `/dashboard?tab=applications&application=${application.id}`
      }])
  } catch (error) {
    console.error('Error creating application notification:', error)
  }
}

// Helper function to create notification for status update
async function createStatusUpdateNotification(application: any, status: string, message?: string) {
  try {
    const statusMessages = {
      approved: 'Your application has been approved!',
      rejected: 'Your application has been reviewed.'
    }

    await supabase
      .from('notifications')
      .insert([{
        user_id: application.tenant_id,
        title: `Application ${status}`,
        message: message || statusMessages[status as keyof typeof statusMessages],
        notification_type: 'application',
        related_property_id: application.property_id,
        related_application_id: application.id,
        action_url: `/dashboard?tab=applications&application=${application.id}`
      }])
  } catch (error) {
    console.error('Error creating status update notification:', error)
  }
}

// Helper functions for email notifications using EmailJS
async function sendApplicationEmail(application: any) {
  try {
    // Only send email notifications in browser environment
    if (typeof window === 'undefined') {
      return
    }

    // Get landlord information
    const { data: landlord } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', application.landlord_id)
      .single()

    if (!landlord?.email) {
      console.log('Could not find landlord email for application notification')
      return
    }

    // Send application email to landlord
    await sendApplicationEmailJS({
      landlord_name: landlord.full_name || 'Landlord',
      landlord_email: landlord.email,
      tenant_name: application.tenant_name,
      tenant_email: application.tenant_email,
      property_title: application.properties?.title || 'Property',
      move_in_date: application.move_in_date,
      monthly_income: application.monthly_income?.toString(),
      employment_status: application.employment_status,
      has_section8: application.has_voucher,
      additional_notes: application.message
    })

    console.log('Application email notification sent successfully')
  } catch (error) {
    console.error('Error sending application email notification:', error)
    // Don't throw error to avoid breaking application submission if email fails
  }
}

async function sendStatusUpdateEmail(application: any, status: string, message?: string) {
  try {
    // Only send email notifications in browser environment
    if (typeof window === 'undefined') {
      return
    }

    // Get landlord information for the "from" field
    const { data: landlord } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', application.landlord_id)
      .single()

    const landlordName = landlord?.full_name || 'Your Landlord'
    const statusMessage = status === 'approved' 
      ? `Great news! Your application for "${application.properties?.title}" has been approved.${message ? `\n\nMessage from landlord: ${message}` : ''}`
      : `Your application for "${application.properties?.title}" has been reviewed.${message ? `\n\nMessage from landlord: ${message}` : ''}`

    // For status updates, we use the contact email template since there's no specific status update template
    await sendApplicationEmailJS({
      landlord_name: landlordName,
      landlord_email: landlord?.email || 'noreply@casa8.com',
      tenant_name: application.tenant_name,
      tenant_email: application.tenant_email,
      property_title: application.properties?.title || 'Property',
      move_in_date: application.move_in_date,
      monthly_income: application.monthly_income?.toString(),
      employment_status: application.employment_status,
      has_section8: application.has_voucher,
      additional_notes: statusMessage
    })

    console.log('Status update email notification sent successfully')
  } catch (error) {
    console.error('Error sending status update email notification:', error)
    // Don't throw error to avoid breaking status update if email fails
  }
}

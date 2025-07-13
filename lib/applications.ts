import { supabase } from './supabase'

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

// Helper functions for email notifications (will integrate with EmailJS)
async function sendApplicationEmail(application: any) {
  try {
    // This will be implemented when we integrate EmailJS
    console.log('Application email notification:', {
      to: 'landlord_email', // Get from landlord profile
      application: application.tenant_name,
      property: application.properties?.title
    })
  } catch (error) {
    console.error('Error sending application email:', error)
  }
}

async function sendStatusUpdateEmail(application: any, status: string, message?: string) {
  try {
    // This will be implemented when we integrate EmailJS
    console.log('Status update email notification:', {
      to: application.tenant_email,
      status,
      message,
      property: application.properties?.title
    })
  } catch (error) {
    console.error('Error sending status update email:', error)
  }
}

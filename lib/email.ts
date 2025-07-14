import emailjs from '@emailjs/browser'

// Initialize EmailJS
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY) {
  emailjs.init({
    publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY,
  })
}

const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || ''

export async function sendContactEmail(data: {
  landlord_name: string
  landlord_email: string
  tenant_name: string
  tenant_email: string
  property_title: string
  message: string
}) {
  try {
    // Debug logging
    console.log('EmailJS configuration:', {
      SERVICE_ID,
      publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY ? 'configured' : 'missing',
      window: typeof window !== 'undefined'
    })

    // Check if EmailJS is properly initialized
    if (!SERVICE_ID || !process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY) {
      console.error('EmailJS not properly configured:', {
        SERVICE_ID: !!SERVICE_ID,
        publicKey: !!process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
      })
      throw new Error('EmailJS not properly configured')
    }

    if (typeof window === 'undefined') {
      console.error('EmailJS can only be used in browser environment')
      throw new Error('EmailJS can only be used in browser environment')
    }

    console.log('Sending email with data:', {
      template: 'template_contact',
      landlord_name: data.landlord_name,
      landlord_email: data.landlord_email,
      tenant_name: data.tenant_name,
      tenant_email: data.tenant_email,
      property_title: data.property_title,
      message: data.message.substring(0, 100) + '...' // Don't log full message
    })

    // Create a comprehensive message that includes landlord contact info
    // Since your template has hardcoded "To Email", we'll include landlord details in the message
    const enhancedMessage = `
LANDLORD CONTACT INFO:
Name: ${data.landlord_name}
Email: ${data.landlord_email}

TENANT INQUIRY:
From: ${data.tenant_name} (${data.tenant_email})
Property: ${data.property_title}

MESSAGE:
${data.message}

---
This inquiry should be forwarded to: ${data.landlord_email}
    `.trim()

    const response = await emailjs.send(SERVICE_ID, 'template_contact', {
      title: data.property_title,
      name: data.tenant_name,
      email: data.tenant_email,
      message: enhancedMessage,
    })
    
    console.log('EmailJS response:', response)
    
    return { success: response.status === 200 }
  } catch (error) {
    console.error('Email error:', error)
    
    // Try fallback method
    try {
      const fallbackResult = await sendFallbackEmail(data)
      if (fallbackResult.success) {
        console.log('Fallback email sent successfully')
        return fallbackResult
      }
    } catch (fallbackError) {
      console.error('Fallback email failed:', fallbackError)
    }
    
    return { success: false, error }
  }
}

export async function sendApplicationEmail(data: {
  landlord_name: string
  landlord_email: string
  tenant_name: string
  tenant_email: string
  property_title: string
  move_in_date?: string
  monthly_income?: string
  employment_status?: string
  has_section8?: boolean
  additional_notes?: string
}) {
  try {
    // Check if EmailJS is properly configured
    if (!SERVICE_ID || !process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY) {
      throw new Error('EmailJS not properly configured')
    }

    const response = await emailjs.send(SERVICE_ID, 'template_application', {
      to_name: data.landlord_name,
      to_email: data.landlord_email,
      applicant_name: data.tenant_name,
      applicant_email: data.tenant_email,
      property_title: data.property_title,
      move_in_date: data.move_in_date || 'Flexible',
      monthly_income: data.monthly_income || 'Not specified',
      employment_status: data.employment_status || 'Not specified',
      has_section8: data.has_section8 ? 'Yes' : 'No',
      additional_notes: data.additional_notes || 'None',
      reply_to: data.tenant_email,
    })
    
    return { success: response.status === 200 }
  } catch (error) {
    console.error('Application email error:', error)
    return { success: false, error }
  }
}

// Fallback email method using a simpler approach
async function sendFallbackEmail(data: {
  landlord_name: string
  landlord_email: string
  tenant_name: string
  tenant_email: string
  property_title: string
  message: string
}) {
  try {
    // Try with a simpler EmailJS configuration
    if (typeof window === 'undefined' || !SERVICE_ID) {
      return { success: false, error: 'No fallback available' }
    }

    // Try with different template names in case the template IDs are different
    const templateVariations = ['template_contact', 'contact_form', 'default_template']
    
    for (const templateId of templateVariations) {
      try {
        console.log(`Trying fallback with template: ${templateId}`)
        
        const response = await emailjs.send(SERVICE_ID, templateId, {
          title: data.property_title,
          name: data.tenant_name,
          email: data.tenant_email,
          message: data.message,
          // Additional fallback variables
          to_name: data.landlord_name,
          to_email: data.landlord_email,
          from_name: data.tenant_name,
          from_email: data.tenant_email,
          property_title: data.property_title,
          reply_to: data.tenant_email,
          user_name: data.tenant_name,
          user_email: data.tenant_email,
          subject: `Casa8 Inquiry: ${data.property_title}`,
          content: data.message
        })
        
        if (response.status === 200) {
          console.log(`Fallback email sent successfully with template: ${templateId}`)
          return { success: true }
        }
      } catch (error) {
        console.log(`Template ${templateId} failed:`, error)
        continue
      }
    }
    
    return { success: false, error: 'All template variations failed' }
  } catch (error) {
    console.error('Fallback email error:', error)
    return { success: false, error }
  }
}

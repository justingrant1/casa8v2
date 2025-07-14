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
    // Check if EmailJS is properly initialized
    if (!SERVICE_ID || !process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY) {
      throw new Error('EmailJS not properly configured')
    }

    const response = await emailjs.send(SERVICE_ID, 'template_contact', {
      to_name: data.landlord_name,
      to_email: data.landlord_email,
      from_name: data.tenant_name,
      from_email: data.tenant_email,
      property_title: data.property_title,
      message: data.message,
      reply_to: data.tenant_email,
    })
    
    return { success: response.status === 200 }
  } catch (error) {
    console.error('Email error:', error)
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

// EmailJS Email Testing Script
// Run this to test email functionality and debug issues

import emailjs from '@emailjs/browser'

// Test EmailJS configuration
const testEmailJS = async () => {
  console.log('🔍 Testing EmailJS Configuration...')
  
  // Check environment variables
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
  const privateKey = process.env.EMAILJS_PRIVATE_KEY
  
  console.log('📋 Environment Variables:')
  console.log('  SERVICE_ID:', serviceId ? '✅ Set' : '❌ Missing')
  console.log('  PUBLIC_KEY:', publicKey ? '✅ Set' : '❌ Missing')
  console.log('  PRIVATE_KEY:', privateKey ? '✅ Set' : '❌ Missing')
  
  if (!serviceId || !publicKey) {
    console.error('❌ EmailJS not properly configured')
    return
  }
  
  // Initialize EmailJS
  try {
    emailjs.init({ publicKey })
    console.log('✅ EmailJS initialized successfully')
  } catch (error) {
    console.error('❌ Failed to initialize EmailJS:', error)
    return
  }
  
  // Test email send
  console.log('\n📧 Testing email send...')
  
  const testEmailData = {
    title: 'Test Property',
    name: 'Test Sender',
    email: 'test@example.com',
    message: 'This is a test message from EmailJS diagnostic script.',
  }
  
  try {
    console.log('📤 Sending test email with data:', testEmailData)
    
    const response = await emailjs.send(serviceId, 'template_contact', testEmailData)
    
    console.log('✅ Email sent successfully!')
    console.log('📊 Response:', response)
    
    // Additional debugging
    console.log('\n🔍 Debugging Information:')
    console.log('  Status:', response.status)
    console.log('  Text:', response.text)
    
    if (response.status === 200) {
      console.log('\n✅ EmailJS reports success!')
      console.log('📋 Next steps to debug delivery:')
      console.log('  1. Check your spam/junk folder')
      console.log('  2. Verify the email address is correct')
      console.log('  3. Check EmailJS dashboard for delivery status')
      console.log('  4. Verify email template exists and has correct variables')
      console.log('  5. Check if email service is properly connected in EmailJS')
    }
    
  } catch (error: any) {
    console.error('❌ Email send failed:', error)
    
    // Detailed error analysis
    if (error.status === 400) {
      console.error('🔍 Bad Request - Check:')
      console.error('  - Template ID exists (template_contact)')
      console.error('  - All required template variables are provided')
      console.error('  - Service ID is correct')
    } else if (error.status === 401) {
      console.error('🔍 Unauthorized - Check:')
      console.error('  - Public key is correct')
      console.error('  - Service is properly configured')
    } else if (error.status === 404) {
      console.error('🔍 Not Found - Check:')
      console.error('  - Service ID exists')
      console.error('  - Template ID exists')
    }
  }
}

// Test template variations
const testTemplateVariations = async () => {
  console.log('\n🔧 Testing different template variations...')
  
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
  
  if (!serviceId || !publicKey) {
    console.error('❌ Missing configuration')
    return
  }
  
  const templateIds = [
    'template_contact',
    'contact_form',
    'default_template',
    'template_default'
  ]
  
  const testData = {
    title: 'Test Property',
    name: 'Test Sender',
    email: 'test@example.com',
    message: 'Template variation test',
    // Additional fallback variables
    to_name: 'Test Recipient',
    to_email: 'jgrant@testacapital.com',
    from_name: 'Test Sender',
    from_email: 'test@example.com',
    property_title: 'Test Property',
    reply_to: 'test@example.com',
    user_name: 'Test Sender',
    user_email: 'test@example.com',
    subject: 'Test Subject',
    content: 'Template variation test'
  }
  
  for (const templateId of templateIds) {
    try {
      console.log(`📤 Testing template: ${templateId}`)
      const response = await emailjs.send(serviceId, templateId, testData)
      
      if (response.status === 200) {
        console.log(`✅ Template ${templateId} works!`)
        return templateId
      }
    } catch (error: any) {
      console.log(`❌ Template ${templateId} failed:`, error.status, error.text)
    }
  }
  
  console.log('❌ No working templates found')
}

// Run tests
const runDiagnostics = async () => {
  console.log('🚀 Starting EmailJS Diagnostics...\n')
  
  await testEmailJS()
  await testTemplateVariations()
  
  console.log('\n📋 Troubleshooting Checklist:')
  console.log('□ EmailJS account is active and verified')
  console.log('□ Email service is connected (Gmail, Outlook, etc.)')
  console.log('□ Template "template_contact" exists with correct variables')
  console.log('□ Email address is correct and not blocked')
  console.log('□ Check spam/junk folder')
  console.log('□ Verify EmailJS service status at https://dashboard.emailjs.com')
  
  console.log('\n🔗 Helpful Links:')
  console.log('  - EmailJS Dashboard: https://dashboard.emailjs.com')
  console.log('  - EmailJS Documentation: https://www.emailjs.com/docs/')
  console.log('  - Template Guide: https://www.emailjs.com/docs/tutorial/creating-email-template/')
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testEmailJS = runDiagnostics
}

export { runDiagnostics as testEmailJS }

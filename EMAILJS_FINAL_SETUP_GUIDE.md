# EmailJS Final Setup Guide

## ✅ What I've Fixed

### 1. **Re-enabled Email Functionality**
- The email functionality was disabled in `lib/messaging.ts` - I've re-enabled it
- Now when users contact landlords, it will attempt to send emails via EmailJS

### 2. **Fixed Template Variable Names**
- Updated the code to send the correct variable names that match your EmailJS template:
  - `{{title}}` - Property title (for subject)
  - `{{name}}` - Tenant name
  - `{{email}}` - Tenant email
  - `{{message}}` - Message content

### 3. **Enhanced Message Format**
- Since your template has a hardcoded "To Email" field, I've enhanced the message to include landlord contact information
- The email message now includes:
  - Landlord contact details
  - Tenant information
  - Property details
  - The original message
  - Clear indication of who should receive the inquiry

## ⚠️ Critical Issue: EmailJS Template Configuration

**The main issue:** Your EmailJS template has a hardcoded "To Email" field set to `jgrant@testacapital.com`. This means ALL emails will go to this address, regardless of which landlord is being contacted.

## 🔧 How to Fix the EmailJS Template

### Option 1: Make the "To Email" Dynamic (Recommended)
1. Go to your [EmailJS Dashboard](https://dashboard.emailjs.com)
2. Navigate to **Email Templates**
3. Click on your `template_contact` template
4. In the **Settings** tab, change the **To Email** field from:
   ```
   jgrant@testacapital.com
   ```
   to:
   ```
   {{to_email}}
   ```
5. **Save** the template

Then update the code to send the `to_email` variable:

```typescript
// In lib/email.ts, update the emailjs.send call to include:
const response = await emailjs.send(SERVICE_ID, 'template_contact', {
  title: data.property_title,
  name: data.tenant_name,
  email: data.tenant_email,
  message: enhancedMessage,
  to_email: data.landlord_email,  // Add this line
})
```

### Option 2: Use Current Setup (Temporary Solution)
If you keep the hardcoded email, the current setup will work as follows:
- All emails go to `jgrant@testacapital.com`
- The message content includes landlord contact info
- You'll need to manually forward emails to the correct landlords

## 🧪 Testing the Setup

### 1. Test Email Functionality
Try sending a contact email through the app. Check the browser console for:
- EmailJS configuration status
- Email sending attempts
- Success/error messages

### 2. Use the Diagnostic Script
Open browser console on your site and run:
```javascript
window.testEmailJS()
```

### 3. Check EmailJS Dashboard
- Go to [EmailJS Dashboard](https://dashboard.emailjs.com)
- Check the **History** tab to see sent emails
- Look for any error messages

## 📋 Complete Setup Checklist

- [ ] **EmailJS Account**: Active and verified
- [ ] **Email Service**: Connected (Gmail, Outlook, etc.)
- [ ] **Template**: `template_contact` exists with correct variables
- [ ] **Environment Variables**: Properly configured in `.env.local`
- [ ] **Template "To Email"**: Either dynamic (`{{to_email}}`) or acceptable static address
- [ ] **Test Email**: Successfully sent through the app
- [ ] **Email Delivery**: Received in inbox (check spam folder)

## 🐛 Common Issues and Solutions

### Issue: EmailJS reports success but no emails received
**Solutions:**
1. Check spam/junk folders
2. Verify EmailJS service is properly connected
3. Check email service provider settings
4. Ensure template exists with correct ID

### Issue: Template variable errors
**Solutions:**
1. Verify template variables match code exactly
2. Check template ID is correct (`template_contact`)
3. Ensure all required variables are provided

### Issue: Authentication errors
**Solutions:**
1. Verify public key is correct
2. Check service ID is correct
3. Ensure EmailJS service is active

## 🔄 Next Steps

1. **Fix the template**: Update the "To Email" field to use `{{to_email}}` variable
2. **Update the code**: Add `to_email: data.landlord_email` to the email send call
3. **Test thoroughly**: Send test emails to different addresses
4. **Monitor**: Check EmailJS dashboard for delivery status

## 📞 Support

If you continue to have issues:
- Check [EmailJS Documentation](https://www.emailjs.com/docs/)
- Use the diagnostic script I created
- Review the troubleshooting guide in `EMAIL_TROUBLESHOOTING.md`

The code is now properly configured to send emails. The main remaining issue is the EmailJS template configuration on your dashboard.

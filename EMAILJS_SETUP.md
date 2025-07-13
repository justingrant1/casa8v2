# EmailJS Integration Setup Guide

## Overview
EmailJS has been integrated into the Casa8 platform to enable email notifications for:
- Contact Landlord messages
- Property application submissions
- Landlord notifications

## Implementation Details

### 1. Package Installation
- EmailJS browser package (`@emailjs/browser`) installed
- Environment variables configured for EmailJS credentials

### 2. Email Service Library
Created `/lib/email.ts` with functions:
- `sendContactEmail()` - For tenant-to-landlord contact messages
- `sendApplicationEmail()` - For property application submissions

### 3. Updated Components
- **Contact Landlord Modal**: Now sends actual emails to landlords
- **Apply Property Modal**: Enhanced with comprehensive form fields and email notifications

## Required EmailJS Setup

### 1. EmailJS Account Setup
1. Go to [EmailJS.com](https://www.emailjs.com/) and create an account
2. Create a new email service (Gmail, Outlook, etc.)
3. Get your Public Key, Private Key, and Service ID

### 2. Environment Variables
Already configured in `.env.local`:
```
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=XbXNtgJUJb96vfqPc
EMAILJS_PRIVATE_KEY=T08HJoMt95KxD87jvB2dR
NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_blp3axq
```

### 3. Required Email Templates
You need to create these templates in your EmailJS dashboard:

#### Template 1: `template_contact` (Contact Landlord)
**Template ID**: `template_contact`
**Variables**:
- `{{to_name}}` - Landlord name
- `{{to_email}}` - Landlord email
- `{{from_name}}` - Tenant name
- `{{from_email}}` - Tenant email
- `{{property_title}}` - Property title
- `{{message}}` - Tenant message
- `{{reply_to}}` - Tenant email for replies

**Sample Template**:
```
Subject: New Inquiry for {{property_title}}

Dear {{to_name}},

You have received a new inquiry about your property "{{property_title}}" from {{from_name}}.

Message:
{{message}}

Contact Information:
- Name: {{from_name}}
- Email: {{from_email}}

You can reply directly to this email to respond to the inquiry.

Best regards,
Casa8 Platform
```

#### Template 2: `template_application` (Property Application)
**Template ID**: `template_application`
**Variables**:
- `{{to_name}}` - Landlord name
- `{{to_email}}` - Landlord email
- `{{applicant_name}}` - Tenant name
- `{{applicant_email}}` - Tenant email
- `{{property_title}}` - Property title
- `{{move_in_date}}` - Preferred move-in date
- `{{monthly_income}}` - Monthly income
- `{{employment_status}}` - Employment status
- `{{has_section8}}` - Section 8 status (Yes/No)
- `{{additional_notes}}` - Additional notes
- `{{reply_to}}` - Tenant email for replies

**Sample Template**:
```
Subject: New Rental Application for {{property_title}}

Dear {{to_name}},

You have received a new rental application for your property "{{property_title}}".

Applicant Information:
- Name: {{applicant_name}}
- Email: {{applicant_email}}
- Preferred Move-in Date: {{move_in_date}}
- Monthly Income: ${{monthly_income}}
- Employment Status: {{employment_status}}
- Section 8 Voucher: {{has_section8}}

Additional Notes:
{{additional_notes}}

Contact Information:
- Email: {{applicant_email}}

You can reply directly to this email to respond to the application.

Best regards,
Casa8 Platform
```

## Features Implemented

### Contact Landlord Modal
- Email tab with message composition
- Loading states during email sending
- Success/error notifications
- Authentication checks

### Apply Property Modal
- Comprehensive application form with:
  - Personal information (name, email, phone)
  - Preferred move-in date
  - Monthly income
  - Employment status dropdown
  - Section 8 voucher checkbox
  - Additional notes
- Email notification to landlord
- Loading states and error handling

## Testing
1. Ensure EmailJS templates are created with correct template IDs
2. Test contact landlord functionality
3. Test property application submission
4. Verify emails are received by landlords

## Next Steps
1. Create the required email templates in EmailJS dashboard
2. Test email functionality in development
3. Consider adding more email templates for:
   - Welcome emails for new users
   - Property listing confirmations
   - Application status updates

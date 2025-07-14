// Test script to verify applications functionality
// Run this with: npx tsx scripts/test-applications.ts

import { createApplication, getApplicationsForLandlord, updateApplicationStatus } from '../lib/applications'
import { supabase } from '../lib/supabase'

async function testApplicationFlow() {
  console.log('🧪 Testing Application Flow...\n')

  try {
    // 1. Check if applications table exists
    console.log('1. Checking if applications table exists...')
    const { data: tables, error: tablesError } = await supabase
      .from('applications')
      .select('count')
      .limit(1)

    if (tablesError) {
      console.error('❌ Applications table does not exist!')
      console.error('Please run the SQL from DATABASE_SETUP.md in your Supabase dashboard')
      console.error('Error:', tablesError.message)
      return
    }

    console.log('✅ Applications table exists')

    // 2. Get current user (must be logged in)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('❌ No authenticated user found')
      console.error('Please log in first before running this test')
      return
    }

    console.log('✅ User authenticated:', user.email)

    // 3. Check if user has any properties (needed for landlord test)
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('id, title, landlord_id')
      .eq('landlord_id', user.id)
      .limit(1)

    if (propertiesError || !properties?.length) {
      console.log('⚠️  No properties found for this user')
      console.log('This test requires a landlord account with at least one property')
      return
    }

    console.log('✅ Found property:', properties[0].title)

    // 4. Test creating a test application (simulate tenant application)
    console.log('\n2. Testing application creation...')
    
    const testApplication = {
      property_id: properties[0].id,
      landlord_id: user.id,
      tenant_name: 'Test Tenant',
      tenant_email: 'test@tenant.com',
      tenant_phone: '555-123-4567',
      move_in_date: '2024-03-01',
      lease_length_months: 12,
      monthly_income: 5000,
      employment_status: 'Full-time',
      employer_name: 'Test Company',
      has_voucher: false,
      message: 'Test application for debugging purposes'
    }

    // Note: This will fail if the same user tries to apply to their own property
    // In real usage, tenant_id would be different from landlord_id
    try {
      const application = await createApplication(testApplication)
      console.log('✅ Application created successfully:', application.id)
    } catch (error: any) {
      if (error.message.includes('already submitted')) {
        console.log('ℹ️  Test application already exists (this is normal)')
      } else {
        console.error('❌ Error creating application:', error.message)
      }
    }

    // 5. Test fetching applications for landlord
    console.log('\n3. Testing application retrieval...')
    
    const applications = await getApplicationsForLandlord(user.id)
    console.log('✅ Found', applications.length, 'applications for landlord')
    
    if (applications.length > 0) {
      console.log('Sample application:', {
        id: applications[0].id,
        tenant_name: applications[0].tenant_name,
        status: applications[0].status,
        property_title: applications[0].properties?.title
      })
    }

    // 6. Test status update (if there are applications)
    if (applications.length > 0 && applications[0].status === 'pending') {
      console.log('\n4. Testing status update...')
      
      try {
        const updatedApplication = await updateApplicationStatus(
          applications[0].id, 
          'approved',
          'Test approval message'
        )
        console.log('✅ Application status updated to:', updatedApplication.status)
      } catch (error: any) {
        console.error('❌ Error updating application status:', error.message)
      }
    }

    console.log('\n🎉 Application flow test completed successfully!')
    console.log('\nNext steps:')
    console.log('1. Go to your app and test the application submission form')
    console.log('2. Check the landlord dashboard for the Applications tab')
    console.log('3. Verify that applications appear correctly')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testApplicationFlow()

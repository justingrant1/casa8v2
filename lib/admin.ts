import { supabase } from './supabase'
import { Profile, Property, Application, PropertyWithDetails, ApplicationWithDetails } from './database.types'

// Admin statistics types
export interface AdminStats {
  totalUsers: number
  totalTenants: number
  totalLandlords: number
  totalProperties: number
  totalApplications: number
  pendingApplications: number
  approvedApplications: number
  rejectedApplications: number
  recentRegistrations: number
  activeProperties: number
}

// Admin user management
export interface AdminUser extends Profile {
  created_at: string
  updated_at: string
  properties_count?: number
  applications_count?: number
  last_login?: string
}

// Check if user is admin
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error checking admin status:', error)
      return false
    }

    return data?.role === 'admin'
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

// Get admin statistics
export async function getAdminStats(): Promise<AdminStats> {
  try {
    const [
      { count: totalUsers },
      { count: totalTenants },
      { count: totalLandlords },
      { count: totalProperties },
      { count: totalApplications },
      { count: pendingApplications },
      { count: approvedApplications },
      { count: rejectedApplications },
      { count: recentRegistrations },
      { count: activeProperties }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'tenant'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'landlord'),
      supabase.from('properties').select('*', { count: 'exact', head: true }),
      supabase.from('applications').select('*', { count: 'exact', head: true }),
      supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      supabase.from('properties').select('*', { count: 'exact', head: true }).eq('available', true)
    ])

    return {
      totalUsers: totalUsers || 0,
      totalTenants: totalTenants || 0,
      totalLandlords: totalLandlords || 0,
      totalProperties: totalProperties || 0,
      totalApplications: totalApplications || 0,
      pendingApplications: pendingApplications || 0,
      approvedApplications: approvedApplications || 0,
      rejectedApplications: rejectedApplications || 0,
      recentRegistrations: recentRegistrations || 0,
      activeProperties: activeProperties || 0
    }
  } catch (error) {
    console.error('Error getting admin stats:', error)
    return {
      totalUsers: 0,
      totalTenants: 0,
      totalLandlords: 0,
      totalProperties: 0,
      totalApplications: 0,
      pendingApplications: 0,
      approvedApplications: 0,
      rejectedApplications: 0,
      recentRegistrations: 0,
      activeProperties: 0
    }
  }
}

// Get all users for admin management
export async function getAllUsers(page: number = 1, limit: number = 20): Promise<{
  users: AdminUser[]
  total: number
  hasMore: boolean
}> {
  try {
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      throw error
    }

    return {
      users: data || [],
      total: count || 0,
      hasMore: (count || 0) > to + 1
    }
  } catch (error) {
    console.error('Error getting all users:', error)
    return {
      users: [],
      total: 0,
      hasMore: false
    }
  }
}

// Get all properties for admin management
export async function getAllProperties(page: number = 1, limit: number = 20): Promise<{
  properties: PropertyWithDetails[]
  total: number
  hasMore: boolean
}> {
  try {
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await supabase
      .from('properties')
      .select(`
        *,
        profiles:landlord_id (
          full_name,
          email,
          phone
        ),
        property_images (
          id,
          image_url,
          alt_text,
          order_index
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      throw error
    }

    return {
      properties: data || [],
      total: count || 0,
      hasMore: (count || 0) > to + 1
    }
  } catch (error) {
    console.error('Error getting all properties:', error)
    return {
      properties: [],
      total: 0,
      hasMore: false
    }
  }
}

// Get all applications for admin management
export async function getAllApplications(page: number = 1, limit: number = 20): Promise<{
  applications: ApplicationWithDetails[]
  total: number
  hasMore: boolean
}> {
  try {
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await supabase
      .from('applications')
      .select(`
        *,
        property:property_id (
          title,
          address,
          city,
          state,
          price
        ),
        tenant:tenant_id (
          full_name,
          email,
          phone
        ),
        landlord:landlord_id (
          full_name,
          email,
          phone
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      throw error
    }

    return {
      applications: data || [],
      total: count || 0,
      hasMore: (count || 0) > to + 1
    }
  } catch (error) {
    console.error('Error getting all applications:', error)
    return {
      applications: [],
      total: 0,
      hasMore: false
    }
  }
}

// Update user role
export async function updateUserRole(userId: string, role: 'tenant' | 'landlord' | 'admin'): Promise<{
  error: Error | null
}> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) {
      throw error
    }

    return { error: null }
  } catch (error) {
    console.error('Error updating user role:', error)
    return { error: error as Error }
  }
}

// Update user profile
export async function updateUserProfile(userId: string, updates: Partial<Profile>): Promise<{
  error: Error | null
}> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) {
      throw error
    }

    return { error: null }
  } catch (error) {
    console.error('Error updating user profile:', error)
    return { error: error as Error }
  }
}

// Delete user (soft delete by setting a flag or hard delete)
export async function deleteUser(userId: string): Promise<{
  error: Error | null
}> {
  try {
    // First, delete related data
    await Promise.all([
      supabase.from('applications').delete().eq('tenant_id', userId),
      supabase.from('applications').delete().eq('landlord_id', userId),
      supabase.from('properties').delete().eq('landlord_id', userId),
      supabase.from('user_favorites').delete().eq('user_id', userId),
      supabase.from('messages').delete().eq('sender_id', userId),
      supabase.from('messages').delete().eq('recipient_id', userId)
    ])

    // Then delete the profile
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (error) {
      throw error
    }

    return { error: null }
  } catch (error) {
    console.error('Error deleting user:', error)
    return { error: error as Error }
  }
}

// Update property
export async function updateProperty(propertyId: string, updates: Partial<Property>): Promise<{
  error: Error | null
}> {
  try {
    const { error } = await supabase
      .from('properties')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', propertyId)

    if (error) {
      throw error
    }

    return { error: null }
  } catch (error) {
    console.error('Error updating property:', error)
    return { error: error as Error }
  }
}

// Delete property
export async function deleteProperty(propertyId: string): Promise<{
  error: Error | null
}> {
  try {
    // First, delete related data
    await Promise.all([
      supabase.from('applications').delete().eq('property_id', propertyId),
      supabase.from('property_images').delete().eq('property_id', propertyId),
      supabase.from('property_videos').delete().eq('property_id', propertyId),
      supabase.from('user_favorites').delete().eq('property_id', propertyId),
      supabase.from('messages').delete().eq('property_id', propertyId)
    ])

    // Then delete the property
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', propertyId)

    if (error) {
      throw error
    }

    return { error: null }
  } catch (error) {
    console.error('Error deleting property:', error)
    return { error: error as Error }
  }
}

// Update application status
export async function updateApplicationStatus(
  applicationId: string, 
  status: 'pending' | 'approved' | 'rejected'
): Promise<{
  error: Error | null
}> {
  try {
    const { error } = await supabase
      .from('applications')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', applicationId)

    if (error) {
      throw error
    }

    return { error: null }
  } catch (error) {
    console.error('Error updating application status:', error)
    return { error: error as Error }
  }
}

// Get registration trends (last 30 days)
export async function getRegistrationTrends(): Promise<{
  date: string
  count: number
}[]> {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    
    const { data, error } = await supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    // Group by date
    const trends: { [key: string]: number } = {}
    data?.forEach(profile => {
      const date = new Date(profile.created_at).toISOString().split('T')[0]
      trends[date] = (trends[date] || 0) + 1
    })

    return Object.entries(trends).map(([date, count]) => ({
      date,
      count
    }))
  } catch (error) {
    console.error('Error getting registration trends:', error)
    return []
  }
}

// Create admin user
export async function createAdminUser(email: string, password: string, fullName: string): Promise<{
  error: Error | null
  user?: any
}> {
  try {
    // Sign up the user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'admin'
        }
      }
    })

    if (error) {
      throw error
    }

    // Create the profile
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: data.user.email!,
          full_name: fullName,
          role: 'admin',
          onboarding_completed: true
        })

      if (profileError) {
        throw profileError
      }
    }

    return { error: null, user: data.user }
  } catch (error) {
    console.error('Error creating admin user:', error)
    return { error: error as Error }
  }
}

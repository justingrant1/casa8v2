import { supabase } from '@/lib/supabase'
import { Profile } from '@/lib/database.types'

export interface TenantSearchFilters {
  searchQuery?: string
  selectedCities?: string[]
  voucherFilter?: 'all' | 'has' | 'no'
  bedroomFilter?: string
  sortBy?: 'lastOnline' | 'joinedDate' | 'name'
  sortOrder?: 'asc' | 'desc'
}

export interface TenantProfile extends Profile {
  lastOnline?: string
  contactPreferences?: string[]
}

export const searchTenants = async (filters: TenantSearchFilters = {}): Promise<TenantProfile[]> => {
  try {
    let query = supabase
      .from('profiles')
      .select('*')
      .eq('role', 'tenant')
      .eq('onboarding_completed', true)

    // Apply search filter
    if (filters.searchQuery) {
      const searchQuery = filters.searchQuery.toLowerCase()
      query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,preferred_city.ilike.%${searchQuery}%`)
    }

    // Apply voucher filter
    if (filters.voucherFilter === 'has') {
      query = query.eq('has_section8', true)
    } else if (filters.voucherFilter === 'no') {
      query = query.eq('has_section8', false)
    }

    // Apply bedroom filter
    if (filters.bedroomFilter && filters.bedroomFilter !== 'all') {
      if (filters.bedroomFilter === 'studio') {
        query = query.eq('voucher_bedrooms', '0')
      } else if (filters.bedroomFilter === '5+') {
        query = query.in('voucher_bedrooms', ['5', '6', '7', '8', '9', '10'])
      } else {
        query = query.eq('voucher_bedrooms', filters.bedroomFilter)
      }
    }

    // Apply city filter
    if (filters.selectedCities && filters.selectedCities.length > 0) {
      query = query.in('preferred_city', filters.selectedCities)
    }

    // Apply sorting
    const sortBy = filters.sortBy || 'updated_at'
    const sortOrder = filters.sortOrder || 'desc'
    
    if (sortBy === 'lastOnline') {
      query = query.order('updated_at', { ascending: sortOrder === 'asc' })
    } else if (sortBy === 'joinedDate') {
      query = query.order('created_at', { ascending: sortOrder === 'asc' })
    } else if (sortBy === 'name') {
      query = query.order('full_name', { ascending: sortOrder === 'asc' })
    }

    const { data, error } = await query

    if (error) {
      console.error('Error searching tenants:', error)
      return []
    }

    // Transform data to include contact preferences
    const tenants: TenantProfile[] = data?.map(tenant => ({
      ...tenant,
      lastOnline: tenant.updated_at,
      contactPreferences: ['email', 'chat'] // Default contact preferences
    })) || []

    return tenants
  } catch (error) {
    console.error('Error in searchTenants:', error)
    return []
  }
}

// Get dynamic cities list from actual tenant data
export const getTenantCities = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('preferred_city')
      .eq('role', 'tenant')
      .eq('onboarding_completed', true)
      .not('preferred_city', 'is', null)

    if (error) {
      console.error('Error getting tenant cities:', error)
      return []
    }

    // Get unique cities and sort them
    const cities = [...new Set(data?.map(item => item.preferred_city).filter(Boolean))]
    return cities.sort()
  } catch (error) {
    console.error('Error in getTenantCities:', error)
    return []
  }
}

// Helper function to get online status indicator
export const getOnlineStatus = (lastOnline: string) => {
  const now = new Date()
  const lastOnlineDate = new Date(lastOnline)
  const diffInMinutes = Math.floor((now.getTime() - lastOnlineDate.getTime()) / (1000 * 60))

  if (diffInMinutes < 5) return { status: "online", color: "bg-green-500" }
  if (diffInMinutes < 30) return { status: "recently", color: "bg-yellow-500" }
  return { status: "offline", color: "bg-gray-400" }
}

// Helper function to format time ago
export const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d ago`
  
  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) return `${diffInWeeks}w ago`
  
  const diffInMonths = Math.floor(diffInDays / 30)
  return `${diffInMonths}mo ago`
}

// Get tenant statistics from live data
export const getTenantStats = async () => {
  try {
    const { data: allTenants, error } = await supabase
      .from('profiles')
      .select('has_section8, updated_at')
      .eq('role', 'tenant')
      .eq('onboarding_completed', true)

    if (error) {
      console.error('Error getting tenant stats:', error)
      return { total: 0, withVouchers: 0, withoutVouchers: 0, recentlyActive: 0 }
    }

    const tenants = allTenants || []
    const withVouchers = tenants.filter(t => t.has_section8)
    const withoutVouchers = tenants.filter(t => !t.has_section8)
    
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentlyActive = tenants.filter(t => {
      const lastOnline = new Date(t.updated_at)
      return lastOnline > dayAgo
    })

    return {
      total: tenants.length,
      withVouchers: withVouchers.length,
      withoutVouchers: withoutVouchers.length,
      recentlyActive: recentlyActive.length
    }
  } catch (error) {
    console.error('Error in getTenantStats:', error)
    return { total: 0, withVouchers: 0, withoutVouchers: 0, recentlyActive: 0 }
  }
}

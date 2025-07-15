'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { User, AuthError } from '@supabase/supabase-js'
import { supabase, Profile } from './supabase'
import { clearPropertiesCache } from './properties'

// Simplified retry function for critical operations only
const simpleRetry = async <T,>(
  fn: () => Promise<T>,
  maxAttempts = 2,
  delay = 1000
): Promise<T> => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      if (attempt === maxAttempts) {
        throw error
      }
      // Only retry on network errors
      if (error?.name === 'NetworkError' || error?.status >= 500) {
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      throw error
    }
  }
  throw new Error('Retry failed')
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signUp: (email: string, password: string, userData: { full_name: string; role: 'tenant' | 'landlord' }) => Promise<{ error: AuthError | null; user?: User | null; session?: any }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signInWithGoogle: () => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>
  completeOnboarding: (data: any) => Promise<{ error: Error | null }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Use refs to track component mounted state and avoid memory leaks
  const mounted = useRef(true)
  const profileCache = useRef<Map<string, { profile: Profile; lastFetched: number }>>(new Map())
  const fetchingProfile = useRef<Set<string>>(new Set())
  const abortController = useRef<AbortController | null>(null)

  // Memoized profile fetcher with caching, deduplication, and retry logic
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    if (!mounted.current) return null
    
    // Check cache first, but with shorter cache duration for role-critical data
    const cached = profileCache.current.get(userId)
    if (cached) {
      const cacheAge = Date.now() - cached.lastFetched
      // Use shorter cache for role-critical data (30 seconds)
      if (cacheAge < 30000) {
        setProfile(cached.profile)
        return cached.profile
      }
    }
    
    // Check if already fetching
    if (fetchingProfile.current.has(userId)) {
      return null
    }
    
    fetchingProfile.current.add(userId)
    
    try {
      console.log('🔍 Fetching fresh profile for user:', userId)
      const result = await simpleRetry(
        async () => {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

          if (error) {
            throw error
          }

          return data
        }
      )

      if (mounted.current && result) {
        // Cache the result with timestamp
        profileCache.current.set(userId, { profile: result, lastFetched: Date.now() })
        
        console.log('👤 Profile fetched successfully:', result.email, 'Role:', result.role)
        setProfile(result)
      }
      
      return result
    } catch (error) {
      console.error('Error fetching profile:', error)
      // Clear cache on error to force fresh fetch next time
      profileCache.current.delete(userId)
      return null
    } finally {
      fetchingProfile.current.delete(userId)
    }
  }, [])

  // Memoized refresh profile function
  const refreshProfile = useCallback(async () => {
    if (!user?.id) return
    
    // Clear cache for this user
    profileCache.current.delete(user.id)
    await fetchProfile(user.id)
  }, [user?.id, fetchProfile])

  useEffect(() => {
    mounted.current = true
    
    // Create abort controller for cleanup
    abortController.current = new AbortController()
    
    const getInitialSession = async () => {
      try {
        console.log('🔄 Getting initial session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ Session error:', error)
          return
        }
        
        if (!mounted.current) return
        
        console.log('📧 Session found:', session?.user?.email || 'No session')
        setUser(session?.user ?? null)
        
        if (session?.user) {
          console.log('👤 Fetching profile for user:', session.user.id)
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
      } catch (error) {
        console.error('❌ Error getting initial session:', error)
        if (mounted.current) {
          setUser(null)
          setProfile(null)
        }
      } finally {
        if (mounted.current) {
          console.log('✅ Auth initialization complete')
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted.current) return
        
        console.log('🔄 Auth state changed:', event, session?.user?.email || 'No session')
        
        try {
          if (event === 'SIGNED_OUT') {
            console.log('🚪 User signed out')
            setUser(null)
            setProfile(null)
            // Clear all caches
            profileCache.current.clear()
            fetchingProfile.current.clear()
            clearPropertiesCache()
          } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            console.log('🔑 User signed in or token refreshed')
            setUser(session?.user ?? null)
            
            if (session?.user) {
              await fetchProfile(session.user.id)
            }
          } else if (event === 'USER_UPDATED') {
            console.log('👤 User updated')
            setUser(session?.user ?? null)
            
            // Refresh profile on user update
            if (session?.user) {
              profileCache.current.delete(session.user.id)
              await fetchProfile(session.user.id)
            }
          }
        } catch (error) {
          console.error('❌ Error in auth state change:', error)
        } finally {
          if (mounted.current) {
            setLoading(false)
          }
        }
      }
    )

    return () => {
      mounted.current = false
      
      // Clean up abort controller
      if (abortController.current) {
        abortController.current.abort()
      }
      
      // Clean up subscription
      subscription.unsubscribe()
      
      // Clear all caches on unmount
      profileCache.current.clear()
      fetchingProfile.current.clear()
    }
  }, [fetchProfile])

  const signUp = async (email: string, password: string, userData: { full_name: string; role: 'tenant' | 'landlord' }) => {
    try {
      const result = await simpleRetry(
        async () => {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: userData,
              emailRedirectTo: undefined // Skip email confirmation
            }
          })

          if (error) {
            throw error
          }

          return data
        }
      )

      // Create profile only if it doesn't already exist
      if (result.user) {
        const { data: existingProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', result.user.id)
          .single()

        if (fetchError && fetchError.code !== 'PGRST116') { // Ignore 'not found' error
          console.error('Error checking for existing profile:', fetchError)
        }

        if (!existingProfile) {
          console.log('No existing profile found, creating a new one...')
          await simpleRetry(
            async () => {
              const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                  id: result.user!.id,
                  email: result.user!.email!,
                  full_name: userData.full_name,
                  role: userData.role
                })

              if (profileError) {
                throw profileError
              }
            }
          )
        } else {
          console.log('Existing profile found, skipping profile creation.')
        }

        // Auto-login the user after successful registration
        if (result.session) {
          setUser(result.session.user)
          await fetchProfile(result.session.user.id)
        }
      }

      return { error: null, user: result.user, session: result.session }
    } catch (error) {
      return { error: error as AuthError }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const result = await simpleRetry(
        async () => {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
          })

          if (error) {
            throw error
          }

          return data
        }
      )

      // Fetch profile but don't redirect here - let the calling component handle it
      if (result.user) {
        await fetchProfile(result.user.id)
        // Clear properties cache when user signs in to ensure fresh data
        clearPropertiesCache()
      }

      return { error: null }
    } catch (error) {
      return { error: error as AuthError }
    }
  }

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      })

      return { error }
    } catch (error) {
      return { error: error as AuthError }
    }
  }

  const signOut = async () => {
    try {
      console.log('🔐 Starting sign out process...')
      
      // Clear local state immediately
      setUser(null)
      setProfile(null)
      setLoading(false)
      
      // Clear Supabase session with scope options
      await supabase.auth.signOut({
        scope: 'global' // Sign out from all sessions
      })
      
      // Clear browser storage
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
        
        // Clear any service worker caches
        if ('caches' in window) {
          const cacheNames = await caches.keys()
          await Promise.all(cacheNames.map(name => caches.delete(name)))
        }
      }
      
      console.log('✅ Sign out completed successfully')
      
      // Use router push with full page reload to ensure clean state
      window.location.href = '/'
    } catch (error) {
      console.error('❌ Error during sign out:', error)
      // Force redirect even if signOut fails
      window.location.href = '/'
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      if (!user) {
        return { error: new Error('No user logged in') }
      }

      await simpleRetry(
        async () => {
          const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id)

          if (error) {
            throw error
          }
        }
      )

      // Update local profile state
      setProfile(prev => prev ? { ...prev, ...updates } : null)
      
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const completeOnboarding = async (data: any): Promise<{ error: Error | null }> => {
    try {
      console.log('🔄 Auth: completeOnboarding called with data:', data)
      
      if (!user) {
        console.error('❌ Auth: No user logged in')
        return { error: new Error('No user logged in') }
      }

      console.log('👤 Auth: Current user ID:', user.id)

      const updates = {
        has_section8: data.hasSection8 === 'yes',
        voucher_bedrooms: data.voucherBedrooms || null,
        preferred_city: data.preferredCity || null,
        onboarding_completed: true
      }

      console.log('📝 Auth: Preparing to update profile with:', updates)

      const result = await simpleRetry(
        async () => {
          const { data: result, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id)
            .select() // Return the updated row for verification

          if (error) {
            throw error
          }

          return result
        }
      )

      console.log('📋 Auth: Supabase update result:', result)

      if (!result || result.length === 0) {
        console.error('❌ Auth: No rows were updated. This might indicate the user profile does not exist.')
        return { error: new Error('Profile update failed: No rows affected. Please contact support.') }
      }

      console.log('✅ Auth: Profile updated successfully:', result[0])

      // Update local profile state
      setProfile(prev => prev ? { ...prev, ...updates } : null)
      
      console.log('✅ Auth: Local profile state updated')
      
      return { error: null }
    } catch (error) {
      console.error('❌ Auth: Exception in completeOnboarding:', error)
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Unknown error during profile update'
      return { error: new Error(`Unexpected error: ${errorMessage}`) }
    }
  }

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile,
    completeOnboarding,
    refreshProfile
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

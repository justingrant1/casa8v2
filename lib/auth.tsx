'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, AuthError } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { Profile } from './supabase'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signUp: (email: string, password: string, userData: { full_name: string; role: 'tenant' | 'landlord' }) => Promise<{ error: AuthError | null; user?: User | null; session?: any }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signInWithGoogle: () => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    
    // Failsafe timeout to ensure loading never gets stuck
    const timeoutId = setTimeout(() => {
      if (mounted) {
        console.log('⚠️ Auth loading timeout - forcing loading to false')
        setLoading(false)
      }
    }, 5000) // 5 second timeout
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔄 Getting initial session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ Session error:', error)
          throw error
        }
        
        if (!mounted) return
        
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
        if (mounted) {
          setUser(null)
          setProfile(null)
        }
      } finally {
        if (mounted) {
          console.log('✅ Auth initialization complete')
          setLoading(false)
          clearTimeout(timeoutId) // Clear timeout since we're done
        }
      }
    }

    getInitialSession()

    // Listen for auth changes with improved error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        
        console.log('🔄 Auth state changed:', event, session?.user?.email || 'No session')
        
        try {
          // Handle different auth events
          if (event === 'SIGNED_OUT') {
            console.log('🚪 User signed out')
            setUser(null)
            setProfile(null)
          } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            console.log('🔑 User signed in or token refreshed')
            setUser(session?.user ?? null)
            
            if (session?.user) {
              await fetchProfile(session.user.id)
            }
          } else if (event === 'USER_UPDATED') {
            console.log('👤 User updated')
            setUser(session?.user ?? null)
          }
        } catch (error) {
          console.error('❌ Error in auth state change:', error)
        } finally {
          if (mounted) {
            setLoading(false)
          }
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
      clearTimeout(timeoutId) // Clean up timeout
    }
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return
      }

      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const signUp = async (email: string, password: string, userData: { full_name: string; role: 'tenant' | 'landlord' }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
          emailRedirectTo: undefined // Skip email confirmation
        }
      })

      if (error) {
        return { error }
      }

      // Create profile after successful signup
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            full_name: userData.full_name,
            role: userData.role
          })

        if (profileError) {
          console.error('Error creating profile:', profileError)
        }

        // Auto-login the user after successful registration
        if (data.session) {
          setUser(data.session.user)
          await fetchProfile(data.session.user.id)
        }
      }

      return { error: null, user: data.user, session: data.session }
    } catch (error) {
      return { error: error as AuthError }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return { error }
      }

      // Fetch profile but don't redirect here - let the calling component handle it
      if (data.user) {
        await fetchProfile(data.user.id)
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

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) {
        return { error }
      }

      // Update local profile state
      setProfile(prev => prev ? { ...prev, ...updates } : null)
      
      return { error: null }
    } catch (error) {
      return { error: error as Error }
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
    updateProfile
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

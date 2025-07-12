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
    // Add timeout to prevent infinite loading in Chrome
    const loadingTimeout = setTimeout(() => {
      console.warn('Auth loading timeout - forcing loading to false')
      setLoading(false)
    }, 10000) // 10 second timeout

    // Get initial session
    const getInitialSession = async () => {
      try {
        // Add timeout to the session call
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Session timeout')), 5000)
        })
        
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any
        
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchProfile(session.user.id)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
        // Even if there's an error, we need to stop loading
        setUser(null)
        setProfile(null)
      } finally {
        clearTimeout(loadingTimeout)
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes with error handling
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          try {
            setUser(session?.user ?? null)
            
            if (session?.user) {
              await fetchProfile(session.user.id)
            } else {
              setProfile(null)
            }
          } catch (error) {
            console.error('Error in auth state change:', error)
          } finally {
            setLoading(false)
          }
        }
      )

      return () => subscription.unsubscribe()
    } catch (error) {
      console.error('Error setting up auth listener:', error)
      setLoading(false)
      return () => {} // Return empty cleanup function
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

      // Auto-redirect based on user role after successful login
      if (data.user) {
        await fetchProfile(data.user.id)
        
        // Get the user's profile to determine role
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()

        // Redirect based on role
        if (profileData?.role === 'landlord') {
          window.location.href = '/dashboard'
        } else {
          window.location.href = '/'
        }
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
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      // Force redirect to home page
      window.location.href = '/'
    } catch (error) {
      console.error('Error signing out:', error)
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

'use client'

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { useAuth } from './auth'
import { getUserFavorites, addToFavorites, removeFromFavorites, getUserFavoriteIds } from './favorites-db'

interface FavoritesContextType {
  favorites: Set<string>
  favoriteProperties: any[]
  toggleFavorite: (propertyId: string) => void
  isFavorite: (propertyId: string) => boolean
  loading: boolean
  refreshFavorites: () => Promise<void>
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [favoriteProperties, setFavoriteProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  // Track mounted state and pending operations
  const mounted = useRef(true)
  const abortController = useRef<AbortController | null>(null)
  const pendingToggles = useRef<Set<string>>(new Set())

  // Optimized load favorites with abort controller
  const loadFavorites = useCallback(async () => {
    if (!user) {
      if (mounted.current) {
        setFavorites(new Set())
        setFavoriteProperties([])
      }
      return
    }

    // Cancel any pending request
    if (abortController.current) {
      abortController.current.abort()
    }
    abortController.current = new AbortController()

    try {
      if (mounted.current) {
        setLoading(true)
      }
      
      // Get favorite IDs
      const favoriteIds = await getUserFavoriteIds(user.id)
      
      if (!mounted.current) return
      
      setFavorites(new Set(favoriteIds))
      
      // Get full favorite properties
      const favoriteProps = await getUserFavorites(user.id)
      
      if (mounted.current) {
        setFavoriteProperties(favoriteProps)
      }
    } catch (error) {
      if (!mounted.current) return
      
      console.error('Error loading favorites:', error)
      // Fallback to localStorage for now
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('casa8-favorites')
        if (saved) {
          try {
            const favIds = JSON.parse(saved)
            setFavorites(new Set(favIds))
          } catch (error) {
            console.error('Error loading favorites from localStorage:', error)
          }
        }
      }
    } finally {
      if (mounted.current) {
        setLoading(false)
      }
    }
  }, [user])

  // Load favorites when user changes
  useEffect(() => {
    loadFavorites()
  }, [loadFavorites])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mounted.current = false
      if (abortController.current) {
        abortController.current.abort()
      }
    }
  }, [])

  // Save to localStorage as backup when favorites change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('casa8-favorites', JSON.stringify(Array.from(favorites)))
    }
  }, [favorites])

  const toggleFavorite = useCallback(async (propertyId: string) => {
    // Prevent duplicate toggles
    if (pendingToggles.current.has(propertyId)) {
      return
    }
    
    pendingToggles.current.add(propertyId)
    
    try {
      if (!user) {
        // If not logged in, just use localStorage
        setFavorites(prev => {
          const newFavorites = new Set(prev)
          if (newFavorites.has(propertyId)) {
            newFavorites.delete(propertyId)
          } else {
            newFavorites.add(propertyId)
          }
          return newFavorites
        })
        return
      }

      const isCurrentlyFavorite = favorites.has(propertyId)
      
      // Optimistic update
      setFavorites(prev => {
        const newFavorites = new Set(prev)
        if (isCurrentlyFavorite) {
          newFavorites.delete(propertyId)
        } else {
          newFavorites.add(propertyId)
        }
        return newFavorites
      })

      if (isCurrentlyFavorite) {
        // Remove from favorites
        await removeFromFavorites(user.id, propertyId)
        if (mounted.current) {
          setFavoriteProperties(prev => prev.filter(prop => prop.id !== propertyId))
        }
      } else {
        // Add to favorites
        await addToFavorites(user.id, propertyId)
        // Note: We don't refresh here to avoid unnecessary API calls
        // The favorites page will refresh when visited
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      // Revert optimistic update on error
      setFavorites(prev => {
        const newFavorites = new Set(prev)
        if (favorites.has(propertyId)) {
          newFavorites.add(propertyId)
        } else {
          newFavorites.delete(propertyId)
        }
        return newFavorites
      })
    } finally {
      pendingToggles.current.delete(propertyId)
    }
  }, [user, favorites])

  const isFavorite = useCallback((propertyId: string) => {
    return favorites.has(propertyId)
  }, [favorites])

  const refreshFavorites = useCallback(async () => {
    await loadFavorites()
  }, [loadFavorites])

  const value: FavoritesContextType = {
    favorites,
    favoriteProperties,
    toggleFavorite,
    isFavorite,
    loading,
    refreshFavorites
  }

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }
  return context
}

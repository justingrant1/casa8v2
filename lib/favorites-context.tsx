'use client'

import { createContext, useContext, useEffect, useState } from 'react'
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

  // Load favorites from database when user logs in
  const loadFavorites = async () => {
    if (!user) {
      setFavorites(new Set())
      setFavoriteProperties([])
      return
    }

    try {
      setLoading(true)
      
      // Get favorite IDs
      const favoriteIds = await getUserFavoriteIds(user.id)
      setFavorites(new Set(favoriteIds))
      
      // Get full favorite properties
      const favoriteProps = await getUserFavorites(user.id)
      setFavoriteProperties(favoriteProps)
    } catch (error) {
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
      setLoading(false)
    }
  }

  // Load favorites when user changes
  useEffect(() => {
    loadFavorites()
  }, [user])

  // Save to localStorage as backup when favorites change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('casa8-favorites', JSON.stringify(Array.from(favorites)))
    }
  }, [favorites])

  const toggleFavorite = async (propertyId: string) => {
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

    try {
      if (favorites.has(propertyId)) {
        // Remove from favorites
        await removeFromFavorites(user.id, propertyId)
        setFavorites(prev => {
          const newFavorites = new Set(prev)
          newFavorites.delete(propertyId)
          return newFavorites
        })
        // Remove from favorite properties list
        setFavoriteProperties(prev => prev.filter(prop => prop.id !== propertyId))
      } else {
        // Add to favorites
        await addToFavorites(user.id, propertyId)
        setFavorites(prev => new Set([...prev, propertyId]))
        // Refresh favorite properties to include the new one
        refreshFavorites()
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      // Fallback to local state only
      setFavorites(prev => {
        const newFavorites = new Set(prev)
        if (newFavorites.has(propertyId)) {
          newFavorites.delete(propertyId)
        } else {
          newFavorites.add(propertyId)
        }
        return newFavorites
      })
    }
  }

  const isFavorite = (propertyId: string) => {
    return favorites.has(propertyId)
  }

  const refreshFavorites = async () => {
    await loadFavorites()
  }

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

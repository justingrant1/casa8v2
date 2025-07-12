'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface FavoritesContextType {
  favorites: Set<number>
  toggleFavorite: (propertyId: number) => void
  isFavorite: (propertyId: number) => boolean
  getFavoriteProperties: () => any[]
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

// Mock data for properties (same as in homepage)
const properties = [
  {
    id: 1,
    title: "Modern Downtown Apartment",
    price: 2500,
    location: "Downtown, Seattle",
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1200,
    image: "/placeholder.svg?height=300&width=400",
    type: "Apartment",
    landlord: "John Smith",
    available: true,
  },
  {
    id: 2,
    title: "Cozy Suburban House",
    price: 3200,
    location: "Bellevue, WA",
    bedrooms: 3,
    bathrooms: 2.5,
    sqft: 1800,
    image: "/placeholder.svg?height=300&width=400",
    type: "House",
    landlord: "Sarah Johnson",
    available: true,
  },
  {
    id: 3,
    title: "Luxury Waterfront Condo",
    price: 4500,
    location: "Waterfront, Seattle",
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1400,
    image: "/placeholder.svg?height=300&width=400",
    type: "Condo",
    landlord: "Mike Davis",
    available: true,
  },
  {
    id: 4,
    title: "Studio in Capitol Hill",
    price: 1800,
    location: "Capitol Hill, Seattle",
    bedrooms: 1,
    bathrooms: 1,
    sqft: 600,
    image: "/placeholder.svg?height=300&width=400",
    type: "Studio",
    landlord: "Emma Wilson",
    available: true,
  },
  {
    id: 5,
    title: "Family Home with Yard",
    price: 2800,
    location: "Redmond, WA",
    bedrooms: 4,
    bathrooms: 3,
    sqft: 2200,
    image: "/placeholder.svg?height=300&width=400",
    type: "House",
    landlord: "David Brown",
    available: true,
  },
  {
    id: 6,
    title: "Penthouse Suite",
    price: 6000,
    location: "Belltown, Seattle",
    bedrooms: 3,
    bathrooms: 3,
    sqft: 2000,
    image: "/placeholder.svg?height=300&width=400",
    type: "Penthouse",
    landlord: "Lisa Anderson",
    available: true,
  },
]

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<Set<number>>(new Set())

  // Load favorites from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('casa8-favorites')
      if (saved) {
        try {
          const favIds = JSON.parse(saved)
          setFavorites(new Set(favIds))
        } catch (error) {
          console.error('Error loading favorites:', error)
        }
      }
    }
  }, [])

  // Save favorites to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('casa8-favorites', JSON.stringify(Array.from(favorites)))
    }
  }, [favorites])

  const toggleFavorite = (propertyId: number) => {
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

  const isFavorite = (propertyId: number) => {
    return favorites.has(propertyId)
  }

  const getFavoriteProperties = () => {
    return properties.filter(property => favorites.has(property.id))
  }

  const value: FavoritesContextType = {
    favorites,
    toggleFavorite,
    isFavorite,
    getFavoriteProperties
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

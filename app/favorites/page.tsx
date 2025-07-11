"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Heart, Filter, Grid, List } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

// Mock data for favorited properties
const favoriteProperties = [
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
    dateAdded: "2024-01-15",
    amenities: ["Gym", "Pool", "Parking", "Pet Friendly"],
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
    dateAdded: "2024-01-12",
    amenities: ["Water View", "Concierge", "Gym", "Parking"],
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
    dateAdded: "2024-01-10",
    amenities: ["Garage", "Garden", "Pet Friendly", "Storage"],
  },
]

export default function FavoritesPage() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("newest")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [contactModal, setContactModal] = useState<{
    isOpen: boolean
    landlord?: { name: string; phone: string; email: string }
    property?: { title: string; id: number }
  }>({
    isOpen: false,
  })

  useEffect(() => {
    // Check if user is logged in - replace with actual auth logic
    const checkAuth = () => {
      const loggedIn = false // This would come from your auth state/context
      setIsLoggedIn(loggedIn)

      if (!loggedIn) {
        // Redirect to login if not authenticated
        router.push("/login")
      }
    }

    checkAuth()
  }, [router])

  const openContactModal = (property: any) => {
    setContactModal({
      isOpen: true,
      landlord: {
        name: property.landlord,
        phone: "(555) 123-4567",
        email: `${property.landlord.toLowerCase().replace(" ", ".")}@email.com`,
      },
      property: {
        title: property.title,
        id: property.id,
      },
    })
  }

  const closeContactModal = () => {
    setContactModal({ isOpen: false })
  }

  const removeFavorite = (propertyId: number) => {
    // Handle removing from favorites
    console.log("Remove from favorites:", propertyId)
  }

  // Filter and sort properties
  const filteredProperties = favoriteProperties.filter(
    (property) =>
      searchQuery === "" ||
      property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.location.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const sortedProperties = [...filteredProperties].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
      case "price-low":
        return a.price - b.price
      case "price-high":
        return b.price - a.price
      case "bedrooms":
        return b.bedrooms - a.bedrooms
      default:
        return 0
    }
  })

  // Show loading or redirect while checking authentication
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Fixed alignment */}
      <header className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-primary-foreground font-bold text-lg">C8</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">Casa8</span>
            </Link>

            <div className="flex items-center justify-center flex-1">
              <nav className="hidden md:flex items-center space-x-8">
                <Link href="/" className="text-gray-600 hover:text-primary transition-colors">
                  Home
                </Link>
                <Link href="/search" className="text-gray-600 hover:text-primary transition-colors">
                  Search
                </Link>
                <Link href="/favorites" className="text-gray-900 font-medium hover:text-primary transition-colors">
                  Favorites
                </Link>
              </nav>
            </div>

            <div className="flex items-center space-x-3">
              <Link href="/login">
                <Button variant="ghost" className="font-medium">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button className="font-medium">Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-red-600 fill-red-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">My Favorites</h1>
              <p className="text-gray-600">Properties you've saved for later</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-lg border p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search your favorites..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 border-gray-200 focus:border-primary focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Sort:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Recently Added</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="bedrooms">Most Bedrooms</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center border rounded-lg">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <p className="text-gray-600">
              <span className="font-semibold text-primary">{sortedProperties.length}</span> favorite properties
            </p>
            {sortedProperties.length > 0 && (
              <Link href="/search">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Find More Properties
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Properties Grid/List */}
        {sortedProperties.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No favorites yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start exploring properties and save your favorites to see them here. Click the heart icon on any property
              to add it to your favorites.
            </p>
            <Link href="/search">
              <Button size="lg">
                <Search className="h-5 w-5 mr-2" />
                Browse Properties
              </Button>
            </Link>
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8" : "space-y-6"}>
            {sortedProperties.map((property) => (
              <Card
                key={property.id}
                className={
                  viewMode === "grid"
                    ? "bg-white border shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
                    : "bg-white border shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group flex flex-row"
                }
              >
                <div className={viewMode === "grid" ? "relative" : "relative w-1/3"}>
                  <img
                    src={property.image}
                    alt={property.title}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 right-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFavorite(property.id)}
                      className="bg-white/90 hover:bg-white text-red-600 hover:text-red-700 shadow-md"
                    >
                      <Heart className="h-4 w-4 fill-red-600" />
                    </Button>
                  </div>
                </div>
                <div className={viewMode === "grid" ? "p-6" : "p-6 flex-1"}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{property.title}</h3>
                      <p className="text-gray-600">{property.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-primary">${property.price}</p>
                      <p className="text-sm text-gray-500">/month</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 mb-4 text-sm text-gray-600">
                    <span>{property.bedrooms} bed</span>
                    <span>{property.bathrooms} bath</span>
                    <span>{property.sqft} sqft</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Link href={`/property/${property.id}`}>
                        <Button size="sm">View Details</Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openContactModal(property)}
                      >
                        Contact
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Added {new Date(property.dateAdded).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Contact Modal */}
      {contactModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Contact Landlord</h2>
                <Button variant="ghost" size="sm" onClick={closeContactModal}>
                  ×
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">{contactModal.property?.title}</h3>
                  <p className="text-gray-600">Property ID: {contactModal.property?.id}</p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Landlord Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Name:</strong> {contactModal.landlord?.name}</p>
                    <p><strong>Phone:</strong> {contactModal.landlord?.phone}</p>
                    <p><strong>Email:</strong> {contactModal.landlord?.email}</p>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={() => window.open(`tel:${contactModal.landlord?.phone}`)}
                    className="flex-1"
                  >
                    Call
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => window.open(`mailto:${contactModal.landlord?.email}`)}
                    className="flex-1"
                  >
                    Email
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

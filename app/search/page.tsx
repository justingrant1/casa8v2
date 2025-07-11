"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, MapPin, Bed, Bath, Square, Heart, SlidersHorizontal, X } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { ContactLandlordModal } from "@/components/contact-landlord-modal"

// Mock data for properties (expanded list)
const allProperties = [
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
    amenities: ["Gym", "Pool", "Parking", "Pet Friendly"],
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
    amenities: ["Garage", "Garden", "Fireplace"],
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
    amenities: ["Water View", "Concierge", "Gym", "Parking"],
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
    amenities: ["Laundry", "Internet"],
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
    amenities: ["Garage", "Garden", "Pet Friendly", "Storage"],
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
    amenities: ["City View", "Balcony", "Concierge", "Gym"],
  },
  {
    id: 7,
    title: "Charming Townhouse",
    price: 2900,
    location: "Kirkland, WA",
    bedrooms: 3,
    bathrooms: 2.5,
    sqft: 1600,
    image: "/placeholder.svg?height=300&width=400",
    type: "Townhouse",
    landlord: "Robert Wilson",
    available: true,
    amenities: ["Garage", "Patio", "Storage"],
  },
  {
    id: 8,
    title: "Loft in Pioneer Square",
    price: 2200,
    location: "Pioneer Square, Seattle",
    bedrooms: 1,
    bathrooms: 1,
    sqft: 900,
    image: "/placeholder.svg?height=300&width=400",
    type: "Loft",
    landlord: "Jennifer Lee",
    available: false,
    amenities: ["High Ceilings", "Exposed Brick", "Laundry"],
  },
]

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [priceRange, setPriceRange] = useState([1000, 5000])
  const [bedrooms, setBedrooms] = useState("any")
  const [bathrooms, setBathrooms] = useState("any")
  const [propertyType, setPropertyType] = useState("any")
  const [sortBy, setSortBy] = useState("newest")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])

  const [contactModal, setContactModal] = useState<{
    isOpen: boolean
    landlord?: { name: string; phone: string; email: string }
    property?: { title: string; id: number }
  }>({
    isOpen: false,
  })

  const amenitiesList = [
    "Gym",
    "Pool",
    "Parking",
    "Pet Friendly",
    "Garage",
    "Garden",
    "Fireplace",
    "Water View",
    "Concierge",
    "Laundry",
    "Internet",
    "Storage",
    "City View",
    "Balcony",
    "Patio",
    "High Ceilings",
    "Exposed Brick",
  ]

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

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) => (prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]))
  }

  const clearAllFilters = () => {
    setSearchQuery("")
    setPriceRange([1000, 5000])
    setBedrooms("any")
    setBathrooms("any")
    setPropertyType("any")
    setSelectedAmenities([])
  }

  // Filter properties based on search criteria
  const filteredProperties = allProperties.filter((property) => {
    const matchesSearch =
      searchQuery === "" ||
      property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.type.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesPrice = property.price >= priceRange[0] && property.price <= priceRange[1]

    const matchesBedrooms =
      bedrooms === "any" ||
      (bedrooms === "studio" && property.bedrooms === 0) ||
      (bedrooms === "5+" && property.bedrooms >= 5) ||
      property.bedrooms.toString() === bedrooms

    const matchesBathrooms =
      bathrooms === "any" ||
      (bathrooms === "3+" && property.bathrooms >= 3) ||
      property.bathrooms.toString() === bathrooms

    const matchesType = propertyType === "any" || property.type === propertyType

    const matchesAmenities =
      selectedAmenities.length === 0 || selectedAmenities.every((amenity) => property.amenities.includes(amenity))

    return matchesSearch && matchesPrice && matchesBedrooms && matchesBathrooms && matchesType && matchesAmenities
  })

  // Sort properties
  const sortedProperties = [...filteredProperties].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return b.id - a.id
      case "price-low":
        return a.price - b.price
      case "price-high":
        return b.price - a.price
      case "bedrooms":
        return b.bedrooms - a.bedrooms
      case "sqft":
        return b.sqft - a.sqft
      default:
        return 0
    }
  })

  const hasActiveFilters =
    searchQuery ||
    priceRange[0] !== 1000 ||
    priceRange[1] !== 5000 ||
    bedrooms !== "any" ||
    bathrooms !== "any" ||
    propertyType !== "any" ||
    selectedAmenities.length > 0

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
                <Link href="/search" className="text-gray-900 font-medium hover:text-primary transition-colors">
                  Search
                </Link>
                <Link href="/favorites" className="text-gray-600 hover:text-primary transition-colors">
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
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Enhanced Filters Sidebar */}
          <div className="lg:w-80">
            <div className="sticky top-24">
              <div className="bg-white rounded-2xl shadow-lg border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Filters</h2>
                  <div className="flex items-center gap-2">
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="text-primary hover:text-primary/80"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Clear
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="lg:hidden"
                      onClick={() => setShowFilters(!showFilters)}
                    >
                      <SlidersHorizontal className="w-4 h-4 mr-2" />
                      {showFilters ? "Hide" : "Show"}
                    </Button>
                  </div>
                </div>

                <div className={`space-y-8 ${showFilters ? "block" : "hidden lg:block"}`}>
                  {/* Search */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-gray-900">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <Input
                        placeholder="Location, property type..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-12 border-gray-200 focus:border-primary focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  {/* Price Range */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold text-gray-900">Price Range</Label>
                    <div className="px-3">
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        max={8000}
                        min={500}
                        step={100}
                        className="w-full"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="bg-gray-100 px-3 py-2 rounded-lg">
                        <span className="font-semibold">${priceRange[0].toLocaleString()}</span>
                      </div>
                      <span className="text-gray-400">to</span>
                      <div className="bg-gray-100 px-3 py-2 rounded-lg">
                        <span className="font-semibold">${priceRange[1].toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bedrooms & Bathrooms */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label className="text-base font-semibold text-gray-900">Bedrooms</Label>
                      <Select value={bedrooms} onValueChange={setBedrooms}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Any" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any</SelectItem>
                          <SelectItem value="studio">Studio</SelectItem>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="4">4</SelectItem>
                          <SelectItem value="5+">5+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-base font-semibold text-gray-900">Bathrooms</Label>
                      <Select value={bathrooms} onValueChange={setBathrooms}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Any" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any</SelectItem>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="1.5">1.5</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="2.5">2.5</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="3+">3+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Property Type */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-gray-900">Property Type</Label>
                    <Select value={propertyType} onValueChange={setPropertyType}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Any type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any type</SelectItem>
                        <SelectItem value="Apartment">Apartment</SelectItem>
                        <SelectItem value="House">House</SelectItem>
                        <SelectItem value="Condo">Condo</SelectItem>
                        <SelectItem value="Studio">Studio</SelectItem>
                        <SelectItem value="Townhouse">Townhouse</SelectItem>
                        <SelectItem value="Loft">Loft</SelectItem>
                        <SelectItem value="Penthouse">Penthouse</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Amenities */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold text-gray-900">Amenities</Label>
                    <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto">
                      {amenitiesList.map((amenity) => (
                        <div key={amenity} className="flex items-center space-x-3">
                          <Checkbox
                            id={amenity}
                            checked={selectedAmenities.includes(amenity)}
                            onCheckedChange={() => toggleAmenity(amenity)}
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <Label htmlFor={amenity} className="text-sm font-medium cursor-pointer">
                            {amenity}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1">
            {/* Enhanced Results Header */}
            <div className="bg-white rounded-2xl shadow-lg border p-6 mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Results</h1>
                  <p className="text-gray-600">
                    <span className="font-semibold text-primary">{sortedProperties.length}</span> properties found
                    {hasActiveFilters && " with your filters"}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Label htmlFor="sort" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    Sort by:
                  </Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48 h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="bedrooms">Most Bedrooms</SelectItem>
                      <SelectItem value="sqft">Largest Space</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Property Grid */}
            {sortedProperties.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg border p-12 text-center">
                <Search className="w-16 h-16 mx-auto mb-6 text-gray-300" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">No properties found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your search criteria or filters</p>
                <Button onClick={clearAllFilters} variant="outline" size="lg">
                  Clear All Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {sortedProperties.map((property) => (
                  <Card
                    key={property.id}
                    className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 shadow-lg group bg-white"
                  >
                    <div className="relative overflow-hidden">
                      <Image
                        src={property.image || "/placeholder.svg"}
                        alt={property.title}
                        width={400}
                        height={280}
                        className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute top-4 right-4 h-10 w-10 bg-white/90 hover:bg-white shadow-lg"
                      >
                        <Heart className="h-5 w-5" />
                      </Button>
                      <Badge className="absolute top-4 left-4 bg-white/95 text-gray-900 font-medium px-3 py-1">
                        {property.type}
                      </Badge>

                      {!property.available && (
                        <Badge variant="destructive" className="absolute bottom-4 left-4 font-medium px-3 py-1">
                          Not Available
                        </Badge>
                      )}
                    </div>

                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-xl font-bold mb-2 line-clamp-2">{property.title}</CardTitle>
                          <div className="flex items-center text-gray-600 mb-2">
                            <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="text-sm">{property.location}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-2xl font-bold text-primary">${property.price.toLocaleString()}</div>
                          <div className="text-sm text-gray-500 font-medium">per month</div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 mb-4">
                        <div className="flex items-center text-center">
                          <Bed className="h-5 w-5 mr-2 text-primary" />
                          <div>
                            <div className="font-bold text-lg">{property.bedrooms}</div>
                            <div className="text-xs text-gray-600 uppercase tracking-wide">Beds</div>
                          </div>
                        </div>
                        <div className="w-px h-8 bg-gray-300"></div>
                        <div className="flex items-center text-center">
                          <Bath className="h-5 w-5 mr-2 text-primary" />
                          <div>
                            <div className="font-bold text-lg">{property.bathrooms}</div>
                            <div className="text-xs text-gray-600 uppercase tracking-wide">Baths</div>
                          </div>
                        </div>
                        <div className="w-px h-8 bg-gray-300"></div>
                        <div className="flex items-center text-center">
                          <Square className="h-5 w-5 mr-2 text-primary" />
                          <div>
                            <div className="font-bold text-lg">{property.sqft}</div>
                            <div className="text-xs text-gray-600 uppercase tracking-wide">Sqft</div>
                          </div>
                        </div>
                      </div>

                      {/* Amenities */}
                      <div className="flex flex-wrap gap-2">
                        {property.amenities.slice(0, 3).map((amenity) => (
                          <Badge key={amenity} variant="secondary" className="text-xs font-medium">
                            {amenity}
                          </Badge>
                        ))}
                        {property.amenities.length > 3 && (
                          <Badge variant="secondary" className="text-xs font-medium">
                            +{property.amenities.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </CardContent>

                    <CardFooter className="flex gap-3 pt-0">
                      <Link href={`/property/${property.id}`} className="flex-1">
                        <Button variant="outline" className="w-full font-medium h-12 bg-transparent">
                          View Details
                        </Button>
                      </Link>
                      <Button
                        className="flex-1 font-medium h-12"
                        onClick={() => openContactModal(property)}
                        disabled={!property.available}
                      >
                        Contact Now
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {contactModal.isOpen && contactModal.landlord && contactModal.property && (
        <ContactLandlordModal
          isOpen={contactModal.isOpen}
          onClose={closeContactModal}
          landlord={contactModal.landlord}
          property={contactModal.property}
        />
      )}
    </div>
  )
}

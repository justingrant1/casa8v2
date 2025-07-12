"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, Bed, Bath, Square, Heart, Share2, Phone, Car, Wifi, Dumbbell, Shield, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { ApplyPropertyModal } from "@/components/apply-property-modal"

// Mock property data
const propertyData = {
  1: {
    id: 1,
    title: "Modern Downtown Apartment",
    price: 2500,
    location: "Downtown, Seattle",
    fullAddress: "123 Pine Street, Seattle, WA 98101",
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1200,
    type: "Apartment",
    landlord: {
      name: "John Smith",
      avatar: "/placeholder.svg?height=100&width=100",
      phone: "(555) 123-4567",
      email: "john.smith@email.com",
      rating: 4.8,
      properties: 12,
    },
    images: [
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
    ],
    description:
      "Beautiful modern apartment in the heart of downtown Seattle. This stunning 2-bedroom, 2-bathroom unit features floor-to-ceiling windows, hardwood floors, and a gourmet kitchen with stainless steel appliances. The building offers luxury amenities including a fitness center, rooftop deck, and concierge service. Located just steps away from Pike Place Market, waterfront, and major tech companies.",
    amenities: [
      "In-unit laundry",
      "Dishwasher",
      "Air conditioning",
      "Hardwood floors",
      "Balcony",
      "Gym access",
      "Rooftop deck",
      "Concierge",
      "Pet friendly",
      "High-speed internet",
      "Parking included",
      "Storage unit",
    ],
    features: [
      { icon: Car, label: "Parking", value: "1 space included" },
      { icon: Wifi, label: "Internet", value: "High-speed included" },
      { icon: Dumbbell, label: "Gym", value: "24/7 access" },
      { icon: Shield, label: "Security", value: "24/7 concierge" },
    ],
    available: true,
    availableDate: "2024-02-01",
    leaseTerms: "12 months minimum",
    deposit: 2500,
    petPolicy: "Cats and dogs allowed with deposit",
    yearBuilt: 2020,
    floorPlan: "/placeholder.svg?height=400&width=600",
    virtualTour: "https://example.com/virtual-tour",
    neighborhood: {
      walkScore: 95,
      transitScore: 88,
      bikeScore: 78,
      nearbyPlaces: [
        { name: "Pike Place Market", distance: "0.3 miles", type: "Shopping" },
        { name: "Seattle Art Museum", distance: "0.5 miles", type: "Culture" },
        { name: "Whole Foods", distance: "0.2 miles", type: "Grocery" },
        { name: "Seattle Central Library", distance: "0.4 miles", type: "Library" },
        { name: "Westlake Park", distance: "0.1 miles", type: "Park" },
      ],
    },
  },
  2: {
    id: 2,
    title: "Cozy Suburban House",
    price: 3200,
    location: "Bellevue, WA",
    fullAddress: "456 Oak Avenue, Bellevue, WA 98004",
    bedrooms: 3,
    bathrooms: 2.5,
    sqft: 1800,
    type: "House",
    landlord: {
      name: "Sarah Johnson",
      avatar: "/placeholder.svg?height=100&width=100",
      phone: "(555) 234-5678",
      email: "sarah.johnson@email.com",
      rating: 4.9,
      properties: 8,
    },
    images: [
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
    ],
    description:
      "Charming 3-bedroom house in quiet Bellevue neighborhood. Features include updated kitchen, spacious living areas, private backyard, and attached garage. Perfect for families with excellent schools nearby. Recently renovated with modern fixtures while maintaining classic charm.",
    amenities: [
      "Attached garage",
      "Private backyard",
      "Updated kitchen",
      "Hardwood floors",
      "Central heating",
      "Washer/dryer hookups",
      "Storage shed",
      "Garden space",
      "Fireplace",
    ],
    features: [
      { icon: Car, label: "Garage", value: "2-car attached" },
      { icon: Wifi, label: "Internet", value: "Fiber ready" },
      { icon: Shield, label: "Security", value: "Alarm system" },
    ],
    available: false,
    availableDate: "2024-03-15",
    leaseTerms: "12 months minimum",
    deposit: 3200,
    petPolicy: "Small pets allowed with deposit",
    yearBuilt: 1995,
    floorPlan: "/placeholder.svg?height=400&width=600",
    virtualTour: "https://example.com/virtual-tour-2",
    neighborhood: {
      walkScore: 72,
      transitScore: 65,
      bikeScore: 68,
      nearbyPlaces: [
        { name: "Bellevue Square", distance: "1.2 miles", type: "Shopping" },
        { name: "Bellevue Botanical Garden", distance: "0.8 miles", type: "Park" },
        { name: "QFC", distance: "0.5 miles", type: "Grocery" },
        { name: "Bellevue Library", distance: "1.0 miles", type: "Library" },
        { name: "Crossroads Park", distance: "0.6 miles", type: "Park" },
      ],
    },
  },
  3: {
    id: 3,
    title: "Luxury Waterfront Condo",
    price: 4500,
    location: "Waterfront, Seattle",
    fullAddress: "789 Water Street, Seattle, WA 98101",
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1400,
    type: "Condo",
    landlord: {
      name: "Mike Davis",
      avatar: "/placeholder.svg?height=100&width=100",
      phone: "(555) 345-6789",
      email: "mike.davis@email.com",
      rating: 4.7,
      properties: 15,
    },
    images: [
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
    ],
    description:
      "Stunning waterfront condominium with panoramic views of Elliott Bay and the Olympic Mountains. This luxury unit features floor-to-ceiling windows, premium finishes, and a private balcony. Building amenities include concierge, fitness center, and rooftop terrace.",
    amenities: [
      "Water views",
      "Private balcony",
      "Concierge service",
      "Fitness center",
      "Rooftop terrace",
      "In-unit laundry",
      "Premium appliances",
      "Hardwood floors",
      "Central air",
      "Parking included",
    ],
    features: [
      { icon: Car, label: "Parking", value: "Assigned space" },
      { icon: Wifi, label: "Internet", value: "High-speed included" },
      { icon: Dumbbell, label: "Gym", value: "Premium fitness center" },
      { icon: Shield, label: "Security", value: "24/7 doorman" },
    ],
    available: true,
    availableDate: "2024-02-15",
    leaseTerms: "12 months minimum",
    deposit: 4500,
    petPolicy: "No pets allowed",
    yearBuilt: 2018,
    floorPlan: "/placeholder.svg?height=400&width=600",
    virtualTour: "https://example.com/virtual-tour-3",
    neighborhood: {
      walkScore: 98,
      transitScore: 92,
      bikeScore: 85,
      nearbyPlaces: [
        { name: "Seattle Aquarium", distance: "0.2 miles", type: "Attraction" },
        { name: "Pike Place Market", distance: "0.4 miles", type: "Shopping" },
        { name: "Waterfront Park", distance: "0.1 miles", type: "Park" },
        { name: "Ferry Terminal", distance: "0.3 miles", type: "Transit" },
        { name: "Seattle Great Wheel", distance: "0.2 miles", type: "Attraction" },
      ],
    },
  },
}

export default function PropertyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const propertyId = Number.parseInt(params.id as string)
  const property = propertyData[propertyId as keyof typeof propertyData]

  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFavorited, setIsFavorited] = useState(false)
  const [applyModal, setApplyModal] = useState(false)

  const openApplyModal = () => setApplyModal(true)
  const closeApplyModal = () => setApplyModal(false)

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Property Not Found</h1>
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="icon" onClick={() => setIsFavorited(!isFavorited)}>
                <Heart className={`w-4 h-4 ${isFavorited ? "fill-red-500 text-red-500" : ""}`} />
              </Button>
              <Button variant="outline" size="icon">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="relative">
                <Image
                  src={property.images[currentImageIndex] || "/placeholder.svg"}
                  alt={property.title}
                  width={600}
                  height={400}
                  className="w-full h-96 object-cover rounded-lg"
                />
                <Badge className="absolute top-4 left-4">{property.type}</Badge>
                {!property.available && (
                  <Badge variant="destructive" className="absolute top-4 right-4">
                    Not Available
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2">
                {property.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative rounded-lg overflow-hidden ${
                      currentImageIndex === index ? "ring-2 ring-primary" : ""
                    }`}
                  >
                    <Image
                      src={image || "/placeholder.svg"}
                      alt={`Property image ${index + 1}`}
                      width={150}
                      height={100}
                      className="w-full h-20 object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Property Info */}
            <div className="space-y-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
                <div className="flex items-center text-muted-foreground mb-4">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{property.fullAddress}</span>
                </div>

                <div className="flex items-center space-x-8 text-lg font-medium mb-4">
                  <div className="flex items-center">
                    <Bed className="w-6 h-6 mr-2" />
                    <span>{property.bedrooms} bedrooms</span>
                  </div>
                  <div className="flex items-center">
                    <Bath className="w-6 h-6 mr-2" />
                    <span>{property.bathrooms} bathrooms</span>
                  </div>
                  <div className="flex items-center">
                    <Square className="w-6 h-6 mr-2" />
                    <span>{property.sqft} sqft</span>
                  </div>
                </div>
                <div className="text-muted-foreground mb-4">Built in {property.yearBuilt}</div>

                <div className="text-3xl font-bold text-primary mb-2">
                  ${property.price.toLocaleString()}
                  <span className="text-lg text-muted-foreground">/month</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h2 className="text-xl font-semibold mb-3">Description</h2>
                <p className="text-muted-foreground leading-relaxed">{property.description}</p>
              </div>

              <Separator />

              {/* Amenities */}
              <div>
                <h2 className="text-xl font-semibold mb-3">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {property.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <span className="text-sm">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Lease Details */}
              <div>
                <h2 className="text-xl font-semibold mb-3">Lease Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="font-medium">Available Date</div>
                    <div className="text-muted-foreground">{property.availableDate}</div>
                  </div>
                  <div>
                    <div className="font-medium">Lease Terms</div>
                    <div className="text-muted-foreground">{property.leaseTerms}</div>
                  </div>
                  <div>
                    <div className="font-medium">Security Deposit</div>
                    <div className="text-muted-foreground">${property.deposit.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="font-medium">Pet Policy</div>
                    <div className="text-muted-foreground">{property.petPolicy}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-primary">${property.price.toLocaleString()}</div>
                    <div className="text-muted-foreground">per month</div>
                  </div>
                  <Badge variant={property.available ? "secondary" : "destructive"}>
                    {property.available ? "Available" : "Not Available"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" size="lg" disabled={!property.available} onClick={openApplyModal}>
                  {property.available ? "Apply Now" : "Join Waitlist"}
                </Button>
              </CardContent>
            </Card>

            {/* Landlord Card */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Landlord</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={property.landlord.avatar || "/placeholder.svg"} />
                    <AvatarFallback>
                      {property.landlord.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{property.landlord.name}</div>
                    <div className="text-sm text-muted-foreground">
                      ⭐ {property.landlord.rating} • {property.landlord.properties} properties
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Phone className="w-4 h-4 mr-2" />
                    {property.landlord.phone}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      <ApplyPropertyModal
        isOpen={applyModal}
        onClose={closeApplyModal}
        property={{
          title: property.title,
          id: property.id,
        }}
      />

      {/* Footer */}
      <footer className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="md:col-span-1">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">C8</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">Casa8</span>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Your trusted partner in finding the perfect rental property. Making renting simple and secure.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-6 text-lg">For Tenants</h3>
              <ul className="space-y-4 text-gray-600">
                <li>
                  <Link href="/search" className="hover:text-primary transition-colors">
                    Search Properties
                  </Link>
                </li>
                <li>
                  <Link href="/saved" className="hover:text-primary transition-colors">
                    Saved Properties
                  </Link>
                </li>
                <li>
                  <Link href="/applications" className="hover:text-primary transition-colors">
                    My Applications
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-6 text-lg">For Landlords</h3>
              <ul className="space-y-4 text-gray-600">
                <li>
                  <Link href="/dashboard" className="hover:text-primary transition-colors">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/list-property" className="hover:text-primary transition-colors">
                    List Property
                  </Link>
                </li>
                <li>
                  <Link href="/applications" className="hover:text-primary transition-colors">
                    Applications
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-6 text-lg">Support</h3>
              <ul className="space-y-4 text-gray-600">
                <li>
                  <Link href="/help" className="hover:text-primary transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-primary transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-primary transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-primary transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-12 pt-8 text-center text-gray-600">
            <p>&copy; 2024 Casa8. All rights reserved. Made with ❤️ for renters everywhere.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

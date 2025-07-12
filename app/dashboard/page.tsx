"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Edit, Trash2, MessageSquare, FileText } from "lucide-react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth"
import { getLandlordProperties } from "@/lib/property-management"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

// Mock data for landlord dashboard
const dashboardData = {
  stats: {
    totalProperties: 5,
    totalTenants: 12,
    monthlyRevenue: 14500,
    occupancyRate: 92,
  },
  properties: [
    {
      id: 1,
      title: "Modern Downtown Apartment",
      address: "123 Pine Street, Seattle",
      rent: 2500,
      status: "occupied",
      tenant: "Sarah Johnson",
      image: "/placeholder.svg?height=100&width=150",
    },
    {
      id: 2,
      title: "Cozy Suburban House",
      address: "456 Oak Avenue, Bellevue",
      rent: 3200,
      status: "vacant",
      tenant: null,
      image: "/placeholder.svg?height=100&width=150",
    },
    {
      id: 3,
      title: "Luxury Waterfront Condo",
      address: "789 Water Street, Seattle",
      rent: 4500,
      status: "occupied",
      tenant: "Mike Davis",
      image: "/placeholder.svg?height=100&width=150",
    },
  ],
  applications: [
    {
      id: 1,
      propertyTitle: "Cozy Suburban House",
      applicantName: "Emma Wilson",
      applicationDate: "2024-01-15",
      status: "pending",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 2,
      propertyTitle: "Modern Downtown Apartment",
      applicantName: "David Brown",
      applicationDate: "2024-01-14",
      status: "approved",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 3,
      propertyTitle: "Luxury Waterfront Condo",
      applicantName: "Lisa Anderson",
      applicationDate: "2024-01-13",
      status: "rejected",
      avatar: "/placeholder.svg?height=40&width=40",
    },
  ],
  messages: [
    {
      id: 1,
      from: "Sarah Johnson",
      property: "Modern Downtown Apartment",
      message: "The heating system seems to be making noise...",
      time: "2 hours ago",
      unread: true,
    },
    {
      id: 2,
      from: "Mike Davis",
      property: "Luxury Waterfront Condo",
      message: "Thank you for fixing the plumbing issue!",
      time: "1 day ago",
      unread: false,
    },
  ],
}

// Mock data for landlord properties
const properties = [
  {
    id: 1,
    title: "Cozy Downtown Apartment",
    address: "123 Main St, Cityville",
    price: 1200,
    status: "active",
  },
  {
    id: 2,
    title: "Spacious Suburban House",
    address: "456 Oak Ave, Townsville",
    price: 2000,
    status: "active",
  },
  {
    id: 3,
    title: "Modern Studio Loft",
    address: "789 Pine Ln, Metropolis",
    price: 950,
    status: "inactive",
  },
  {
    id: 4,
    title: "Luxury Waterfront Condo",
    address: "321 Water St, Seattle",
    price: 3500,
    status: "active",
  },
  {
    id: 5,
    title: "Family Home with Yard",
    address: "654 Elm Dr, Redmond",
    price: 2800,
    status: "active",
  },
]

export default function LandlordDashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("properties")
  const [landlordProperties, setLandlordProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [propertyStatuses, setPropertyStatuses] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
      return
    }

    if (user) {
      fetchLandlordProperties()
    }
  }, [user, authLoading, router])

  const fetchLandlordProperties = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const properties = await getLandlordProperties(user.id)
      setLandlordProperties(properties)
      
      // Initialize property statuses
      const statuses = properties.reduce((acc: any, property: any) => {
        acc[property.id] = property.available ? 'active' : 'inactive'
        return acc
      }, {})
      setPropertyStatuses(statuses)
    } catch (error) {
      console.error('Error fetching properties:', error)
      toast({
        title: "Error loading properties",
        description: "Failed to load your properties. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "occupied":
        return "bg-green-100 text-green-800"
      case "vacant":
        return "bg-yellow-100 text-yellow-800"
      case "pending":
        return "bg-blue-100 text-blue-800"
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleStatusChange = (propertyId: number, newStatus: string) => {
    setPropertyStatuses((prev) => ({
      ...prev,
      [propertyId]: newStatus,
    }))
  }

  const handleEdit = (propertyId: number) => {
    console.log("Edit property:", propertyId)
    // Handle edit functionality
  }

  const handleDelete = (propertyId: number) => {
    console.log("Delete property:", propertyId)
    // Handle delete functionality
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold">C8</span>
              </div>
              <span className="text-xl font-bold">Casa8</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline">Back to Home</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Landlord Dashboard</h1>
          <p className="text-muted-foreground">Manage your rental properties</p>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="properties" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">My Properties</h2>
              <Link href="/list-property">
                <Button className="w-full bg-black hover:bg-gray-800 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Property
                </Button>
              </Link>
            </div>

            {/* Properties Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-4 px-6 font-medium text-gray-600">Title</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-600">Address</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-600">Price</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-600">Status</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        Loading your properties...
                      </td>
                    </tr>
                  ) : landlordProperties.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-muted-foreground">
                        No properties listed yet. <Link href="/list-property" className="text-primary hover:underline">Add your first property</Link>
                      </td>
                    </tr>
                  ) : (
                    landlordProperties.map((property) => (
                      <tr key={property.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <span className="font-medium text-gray-900">{property.title}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-gray-600">
                            {property.address}, {property.city}, {property.state}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-gray-900">${property.price}/month</span>
                        </td>
                        <td className="py-4 px-6">
                          <Select
                            value={propertyStatuses[property.id]}
                            onValueChange={(value) => handleStatusChange(property.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-600 hover:text-gray-900"
                              onClick={() => handleEdit(property.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(property.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="applications" className="space-y-6">
            <h2 className="text-2xl font-bold">Rental Applications</h2>

            <div className="space-y-4">
              {dashboardData.applications.map((application) => (
                <Card key={application.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage src={application.avatar || "/placeholder.svg"} />
                          <AvatarFallback>
                            {application.applicantName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold">{application.applicantName}</div>
                          <div className="text-sm text-muted-foreground">Applied for: {application.propertyTitle}</div>
                          <div className="text-xs text-muted-foreground">Applied on: {application.applicationDate}</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <Badge className={getStatusColor(application.status)}>{application.status}</Badge>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <FileText className="w-4 h-4 mr-1" />
                            View Application
                          </Button>
                          {application.status === "pending" && (
                            <>
                              <Button size="sm" variant="default">
                                Approve
                              </Button>
                              <Button size="sm" variant="destructive">
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <h2 className="text-2xl font-bold">Messages</h2>

            <div className="space-y-4">
              {dashboardData.messages.map((message) => (
                <Card key={message.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="font-semibold">{message.from}</div>
                          {message.unread && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                        </div>
                        <div className="text-sm text-muted-foreground">Property: {message.property}</div>
                        <div className="text-sm">{message.message}</div>
                        <div className="text-xs text-muted-foreground">{message.time}</div>
                      </div>

                      <Button size="sm">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Reply
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

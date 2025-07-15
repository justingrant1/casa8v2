"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Search,
  Filter,
  MessageCircle,
  Mail,
  MapPin,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  ArrowUpDown,
  SlidersHorizontal,
  DollarSign,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth"
import { Navbar } from "@/components/navbar"
import { 
  searchTenants, 
  getTenantCities, 
  getOnlineStatus, 
  formatTimeAgo, 
  getTenantStats,
  type TenantProfile,
  type TenantSearchFilters 
} from "@/lib/tenant-search"

export default function TenantFinderPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, profile, loading: authLoading } = useAuth()
  
  const [tenants, setTenants] = useState<TenantProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [voucherFilter, setVoucherFilter] = useState<'all' | 'has' | 'no'>('all')
  const [bedroomFilter, setBedroomFilter] = useState("all")
  const [sortBy, setSortBy] = useState<'lastOnline' | 'joinedDate' | 'name'>('lastOnline')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [stats, setStats] = useState({ total: 0, withVouchers: 0, withoutVouchers: 0, recentlyActive: 0 })
  const [cities, setCities] = useState<string[]>([])

  // Check authentication and authorization
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
      return
    }

    if (!authLoading && user && profile?.role !== 'landlord') {
      toast({
        title: "Access Denied",
        description: "This page is only available to landlords",
        variant: "destructive"
      })
      router.push("/")
      return
    }
  }, [user, profile, authLoading, router])

  // Load tenants and stats
  useEffect(() => {
    if (user && profile?.role === 'landlord') {
      loadTenants()
      loadStats()
      loadCities()
    }
  }, [user, profile])

  const loadTenants = async () => {
    try {
      setLoading(true)
      const filters: TenantSearchFilters = {
        searchQuery,
        selectedCities,
        voucherFilter,
        bedroomFilter,
        sortBy,
        sortOrder
      }
      const results = await searchTenants(filters)
      setTenants(results)
    } catch (error) {
      console.error('Error loading tenants:', error)
      toast({
        title: "Error loading tenants",
        description: "Failed to load tenant data. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const tenantStats = await getTenantStats()
      setStats(tenantStats)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const loadCities = async () => {
    try {
      const tenantCities = await getTenantCities()
      setCities(tenantCities)
    } catch (error) {
      console.error('Error loading cities:', error)
    }
  }

  // Update results when filters change
  useEffect(() => {
    if (user && profile?.role === 'landlord') {
      loadTenants()
    }
  }, [searchQuery, selectedCities, voucherFilter, bedroomFilter, sortBy, sortOrder])

  const handleCityToggle = (city: string) => {
    setSelectedCities(prev => 
      prev.includes(city) 
        ? prev.filter(c => c !== city)
        : [...prev, city]
    )
  }

  const handleStartChat = (tenant: TenantProfile) => {
    // In production, this would create a chat session
    router.push("/messages")
    toast({
      title: "Chat started!",
      description: `Opening chat with ${tenant.full_name}...`,
    })
  }

  const handleSendEmail = (tenant: TenantProfile) => {
    const subject = encodeURIComponent("Rental Opportunity - Casa8")
    const body = encodeURIComponent(
      `Hi ${tenant.full_name},\n\nI saw your profile on Casa8 and I have a property that might interest you. Would you like to learn more?\n\nBest regards`
    )
    window.location.href = `mailto:${tenant.email}?subject=${subject}&body=${body}`
    toast({
      title: "Email opened!",
      description: `Opening email to ${tenant.full_name}...`,
    })
  }

  const clearAllFilters = () => {
    setSearchQuery("")
    setSelectedCities([])
    setVoucherFilter("all")
    setBedroomFilter("all")
  }

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated or not a landlord
  if (!user || profile?.role !== 'landlord') {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowFilters(!showFilters)} 
                  className="lg:hidden"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className={`space-y-6 ${showFilters ? "block" : "hidden lg:block"}`}>
              {/* Search */}
              <div className="space-y-2">
                <Label>Search Tenants</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Name, email, or city..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Section 8 Voucher Filter */}
              <div className="space-y-3">
                <Label>Section 8 Voucher</Label>
                <Select value={voucherFilter} onValueChange={(value: 'all' | 'has' | 'no') => setVoucherFilter(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tenants</SelectItem>
                    <SelectItem value="has">Has Voucher</SelectItem>
                    <SelectItem value="no">No Voucher</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bedroom Filter */}
              <div className="space-y-3">
                <Label>Voucher Bedroom Size</Label>
                <Select value={bedroomFilter} onValueChange={setBedroomFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Size</SelectItem>
                    <SelectItem value="studio">Studio</SelectItem>
                    <SelectItem value="1">1 Bedroom</SelectItem>
                    <SelectItem value="2">2 Bedrooms</SelectItem>
                    <SelectItem value="3">3 Bedrooms</SelectItem>
                    <SelectItem value="4">4 Bedrooms</SelectItem>
                    <SelectItem value="5+">5+ Bedrooms</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Cities Filter */}
              <div className="space-y-3">
                <Label>Preferred Cities</Label>
                <ScrollArea className="h-48 border rounded-md p-2">
                  <div className="space-y-2">
                    {cities.map((city) => (
                      <div key={city} className="flex items-center space-x-2">
                        <Checkbox
                          id={city}
                          checked={selectedCities.includes(city)}
                          onCheckedChange={() => handleCityToggle(city)}
                        />
                        <Label htmlFor={city} className="text-sm font-normal cursor-pointer">
                          {city}
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Clear Filters */}
              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={clearAllFilters}
              >
                Clear All Filters
              </Button>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-4">
            {/* Header with Stats */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <h1 className="text-2xl font-bold">Find Tenants</h1>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {stats.total} Total
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm">Sort by:</Label>
                    <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lastOnline">Last Online</SelectItem>
                        <SelectItem value="joinedDate">Join Date</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                      <ArrowUpDown className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-600">{tenants.length}</div>
                    <div className="text-sm text-blue-600">Found</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-600">{stats.withVouchers}</div>
                    <div className="text-sm text-green-600">With Vouchers</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-purple-600">{stats.withoutVouchers}</div>
                    <div className="text-sm text-purple-600">Without Vouchers</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-orange-600">{stats.recentlyActive}</div>
                    <div className="text-sm text-orange-600">Recently Active</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading tenants...</p>
              </div>
            )}

            {/* Tenants List */}
            {!loading && (
              <div className="space-y-4">
                {tenants.map((tenant) => {
                  const onlineStatus = getOnlineStatus(tenant.lastOnline || tenant.updated_at)
                  
                  return (
                    <Card key={tenant.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4 flex-1">
                            <div className="relative">
                              <Avatar className="w-16 h-16">
                                <AvatarImage src={tenant.avatar_url || "/placeholder-user.jpg"} alt={tenant.full_name || ''} />
                                <AvatarFallback className="text-lg">
                                  {tenant.full_name?.split(" ").map(n => n[0]).join("") || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${onlineStatus.color} border-2 border-white rounded-full`} />
                            </div>

                            <div className="flex-1 space-y-2">
                              <div className="flex items-center space-x-2">
                                <h3 className="text-lg font-semibold">{tenant.full_name}</h3>
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Verified
                                </Badge>
                              </div>

                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  Last online {formatTimeAgo(tenant.lastOnline || tenant.updated_at)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  Joined {formatTimeAgo(tenant.created_at)}
                                </span>
                              </div>

                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                  {tenant.has_section8 ? (
                                    <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                                      <CheckCircle className="w-3 h-3" />
                                      Section 8 - {tenant.voucher_bedrooms} BR
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="flex items-center gap-1">
                                      <XCircle className="w-3 h-3" />
                                      No Voucher
                                    </Badge>
                                  )}
                                </div>

                                <div className="flex items-center space-x-1">
                                  <MapPin className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">
                                    {tenant.preferred_city || 'Not specified'}
                                  </span>
                                </div>
                              </div>

                              {tenant.bio && (
                                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                                  {tenant.bio}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col space-y-2 ml-4">
                            <Button
                              onClick={() => handleStartChat(tenant)}
                              className="flex items-center gap-2"
                              disabled={!tenant.contactPreferences?.includes("chat")}
                            >
                              <MessageCircle className="w-4 h-4" />
                              Start Chat
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleSendEmail(tenant)}
                              className="flex items-center gap-2"
                              disabled={!tenant.contactPreferences?.includes("email")}
                            >
                              <Mail className="w-4 h-4" />
                              Send Email
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}

                {/* Empty State */}
                {tenants.length === 0 && (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">No tenants found</h3>
                      <p className="text-muted-foreground mb-4">
                        Try adjusting your filters or search criteria to find more tenants.
                      </p>
                      <Button variant="outline" onClick={clearAllFilters}>
                        Clear All Filters
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { getAllProperties, updateProperty, deleteProperty } from '@/lib/admin'
import { PropertyWithDetails } from '@/lib/database.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { 
  Home, 
  Edit2, 
  Trash2, 
  Search, 
  MapPin,
  DollarSign,
  Bed,
  Bath,
  Square,
  Eye,
  EyeOff
} from 'lucide-react'
import { toast } from 'sonner'
import { ListLoading } from '@/components/loading-states/list-loading'

interface AdminPropertiesTabProps {
  onRefresh: () => void
}

export default function AdminPropertiesTab({ onRefresh }: AdminPropertiesTabProps) {
  const [properties, setProperties] = useState<PropertyWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'unavailable'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<PropertyWithDetails | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    price: 0,
    bedrooms: 1,
    bathrooms: 1,
    square_feet: 0,
    available: true
  })

  useEffect(() => {
    loadProperties()
  }, [currentPage, availabilityFilter])

  const loadProperties = async () => {
    try {
      setLoading(true)
      const result = await getAllProperties(currentPage, 20)
      setProperties(result.properties)
      setHasMore(result.hasMore)
    } catch (error) {
      console.error('Error loading properties:', error)
      toast.error('Error loading properties')
    } finally {
      setLoading(false)
    }
  }

  const handleEditProperty = (property: PropertyWithDetails) => {
    setSelectedProperty(property)
    setEditForm({
      title: property.title,
      description: property.description || '',
      price: property.price,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      square_feet: property.square_feet || 0,
      available: property.available
    })
    setEditDialogOpen(true)
  }

  const handleUpdateProperty = async () => {
    if (!selectedProperty) return

    try {
      const { error } = await updateProperty(selectedProperty.id, {
        title: editForm.title,
        description: editForm.description,
        price: editForm.price,
        bedrooms: editForm.bedrooms,
        bathrooms: editForm.bathrooms,
        square_feet: editForm.square_feet,
        available: editForm.available
      })

      if (error) {
        throw error
      }

      toast.success('Property updated successfully')
      setEditDialogOpen(false)
      loadProperties()
      onRefresh()
    } catch (error) {
      console.error('Error updating property:', error)
      toast.error('Error updating property')
    }
  }

  const handleDeleteProperty = async (propertyId: string) => {
    try {
      const { error } = await deleteProperty(propertyId)
      if (error) {
        throw error
      }

      toast.success('Property deleted successfully')
      loadProperties()
      onRefresh()
    } catch (error) {
      console.error('Error deleting property:', error)
      toast.error('Error deleting property')
    }
  }

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.city.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesAvailability = availabilityFilter === 'all' || 
                               (availabilityFilter === 'available' && property.available) ||
                               (availabilityFilter === 'unavailable' && !property.available)
    return matchesSearch && matchesAvailability
  })

  const getAvailabilityBadge = (available: boolean) => {
    return available ? 
      <Badge variant="secondary"><Eye className="h-3 w-3 mr-1" />Available</Badge> :
      <Badge variant="outline"><EyeOff className="h-3 w-3 mr-1" />Unavailable</Badge>
  }

  if (loading) {
    return <ListLoading />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="h-5 w-5" />
          Property Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Label htmlFor="search">Search Properties</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by title, address, or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="availability-filter">Filter by Availability</Label>
            <Select value={availabilityFilter} onValueChange={(value: any) => setAvailabilityFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Properties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="unavailable">Unavailable</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Properties Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Landlord</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProperties.map((property) => (
                <TableRow key={property.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{property.title}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {property.address}, {property.city}, {property.state}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{property.profiles?.full_name || 'N/A'}</div>
                      <div className="text-sm text-muted-foreground">{property.profiles?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {property.price.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Bed className="h-3 w-3" />
                        {property.bedrooms}
                      </div>
                      <div className="flex items-center gap-1">
                        <Bath className="h-3 w-3" />
                        {property.bathrooms}
                      </div>
                      {property.square_feet && (
                        <div className="flex items-center gap-1">
                          <Square className="h-3 w-3" />
                          {property.square_feet.toLocaleString()} sq ft
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getAvailabilityBadge(property.available)}</TableCell>
                  <TableCell>
                    {new Date(property.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditProperty(property)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Property</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this property? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteProperty(property.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {filteredProperties.length} of {properties.length} properties
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={!hasMore}
            >
              Next
            </Button>
          </div>
        </div>

        {/* Edit Property Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Property</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    value={editForm.price}
                    onChange={(e) => setEditForm(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="square_feet">Square Feet</Label>
                  <Input
                    id="square_feet"
                    type="number"
                    value={editForm.square_feet}
                    onChange={(e) => setEditForm(prev => ({ ...prev, square_feet: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    value={editForm.bedrooms}
                    onChange={(e) => setEditForm(prev => ({ ...prev, bedrooms: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    value={editForm.bathrooms}
                    onChange={(e) => setEditForm(prev => ({ ...prev, bathrooms: parseInt(e.target.value) || 1 }))}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="available"
                  checked={editForm.available}
                  onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, available: checked }))}
                />
                <Label htmlFor="available">Available for rent</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateProperty}>
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

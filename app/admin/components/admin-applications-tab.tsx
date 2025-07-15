'use client'

import { useState, useEffect } from 'react'
import { getAllApplications, updateApplicationStatus } from '@/lib/admin'
import { ApplicationWithDetails } from '@/lib/database.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  FileText, 
  Search, 
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  User,
  Home,
  Calendar,
  Phone,
  Mail
} from 'lucide-react'
import { toast } from 'sonner'
import { ListLoading } from '@/components/loading-states/list-loading'

interface AdminApplicationsTabProps {
  onRefresh: () => void
}

export default function AdminApplicationsTab({ onRefresh }: AdminApplicationsTabProps) {
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => {
    loadApplications()
  }, [currentPage, statusFilter])

  const loadApplications = async () => {
    try {
      setLoading(true)
      const result = await getAllApplications(currentPage, 20)
      setApplications(result.applications)
      setHasMore(result.hasMore)
    } catch (error) {
      console.error('Error loading applications:', error)
      toast.error('Error loading applications')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (applicationId: string, status: 'pending' | 'approved' | 'rejected') => {
    try {
      const { error } = await updateApplicationStatus(applicationId, status)
      if (error) {
        throw error
      }

      toast.success(`Application ${status} successfully`)
      loadApplications()
      onRefresh()
    } catch (error) {
      console.error('Error updating application status:', error)
      toast.error('Error updating application status')
    }
  }

  const filteredApplications = applications.filter(application => {
    const matchesSearch = application.tenant?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         application.tenant?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         application.property?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         application.property?.address?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || application.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return <ListLoading />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Application Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Label htmlFor="search">Search Applications</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by tenant name, email, or property..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="status-filter">Filter by Status</Label>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Applications Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Landlord</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {application.tenant?.full_name || 'N/A'}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {application.tenant?.email}
                      </div>
                      {application.tenant?.phone && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {application.tenant.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        {application.property?.title || 'N/A'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {application.property?.address}, {application.property?.city}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        ${application.property?.price?.toLocaleString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{application.landlord?.full_name || 'N/A'}</div>
                      <div className="text-sm text-muted-foreground">{application.landlord?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {application.move_in_date && (
                        <div className="flex items-center gap-1 mb-1">
                          <Calendar className="h-3 w-3" />
                          Move-in: {new Date(application.move_in_date).toLocaleDateString()}
                        </div>
                      )}
                      {application.monthly_income && (
                        <div className="flex items-center gap-1 mb-1">
                          <DollarSign className="h-3 w-3" />
                          Income: ${application.monthly_income.toLocaleString()}
                        </div>
                      )}
                      {application.employment_status && (
                        <div className="text-muted-foreground">
                          {application.employment_status}
                        </div>
                      )}
                      {application.has_section8 && (
                        <div className="text-blue-600 text-xs">
                          Section 8 voucher
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(application.status)}</TableCell>
                  <TableCell>
                    {new Date(application.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {application.status === 'pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(application.id, 'approved')}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(application.id, 'rejected')}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      {application.status === 'approved' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateStatus(application.id, 'pending')}
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          Revert
                        </Button>
                      )}
                      {application.status === 'rejected' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateStatus(application.id, 'pending')}
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          Revert
                        </Button>
                      )}
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
            Showing {filteredApplications.length} of {applications.length} applications
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
      </CardContent>
    </Card>
  )
}

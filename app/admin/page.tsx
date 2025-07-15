'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { isAdmin, getAdminStats, getRegistrationTrends, AdminStats } from '@/lib/admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Home, 
  FileText, 
  TrendingUp, 
  UserPlus,
  Shield,
  Settings,
  BarChart3,
  Activity
} from 'lucide-react'
import { toast } from 'sonner'
import { PageLoading } from '@/components/loading-states/page-loading'
import AdminUsersTab from './components/admin-users-tab'
import AdminPropertiesTab from './components/admin-properties-tab'
import AdminApplicationsTab from './components/admin-applications-tab'
import AdminAnalyticsTab from './components/admin-analytics-tab'

export default function AdminDashboard() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [adminLoading, setAdminLoading] = useState(true)
  const [isUserAdmin, setIsUserAdmin] = useState(false)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [trends, setTrends] = useState<{ date: string; count: number }[]>([])

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (loading) return

      if (!user) {
        router.push('/login')
        return
      }

      try {
        const adminStatus = await isAdmin(user.id)
        
        if (!adminStatus) {
          toast.error('Access denied. Admin privileges required.')
          router.push('/dashboard')
          return
        }

        setIsUserAdmin(true)
        
        // Load admin data
        const [statsData, trendsData] = await Promise.all([
          getAdminStats(),
          getRegistrationTrends()
        ])
        
        setStats(statsData)
        setTrends(trendsData)
        
      } catch (error) {
        console.error('Error checking admin access:', error)
        toast.error('Error accessing admin dashboard')
        router.push('/dashboard')
      } finally {
        setAdminLoading(false)
      }
    }

    checkAdminAccess()
  }, [user, loading, router])

  const refreshStats = async () => {
    try {
      const [statsData, trendsData] = await Promise.all([
        getAdminStats(),
        getRegistrationTrends()
      ])
      
      setStats(statsData)
      setTrends(trendsData)
    } catch (error) {
      console.error('Error refreshing stats:', error)
      toast.error('Error refreshing statistics')
    }
  }

  if (loading || adminLoading) {
    return <PageLoading />
  }

  if (!isUserAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don't have admin privileges.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Manage users, properties, and applications</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                <Shield className="h-4 w-4 mr-1" />
                Admin
              </Badge>
              <Button variant="outline" onClick={refreshStats}>
                <Activity className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.totalTenants || 0} tenants, {stats?.totalLandlords || 0} landlords
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Properties</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalProperties || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.activeProperties || 0} active listings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Applications</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalApplications || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.pendingApplications || 0} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New This Week</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.recentRegistrations || 0}</div>
              <p className="text-xs text-muted-foreground">
                User registrations
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="properties" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Properties
            </TabsTrigger>
            <TabsTrigger value="applications" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Applications
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <AdminUsersTab onRefresh={refreshStats} />
          </TabsContent>

          <TabsContent value="properties">
            <AdminPropertiesTab onRefresh={refreshStats} />
          </TabsContent>

          <TabsContent value="applications">
            <AdminApplicationsTab onRefresh={refreshStats} />
          </TabsContent>

          <TabsContent value="analytics">
            <AdminAnalyticsTab stats={stats} trends={trends} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

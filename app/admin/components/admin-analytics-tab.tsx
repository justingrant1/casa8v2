'use client'

import { AdminStats } from '@/lib/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users,
  Home,
  FileText,
  Calendar,
  Activity,
  DollarSign
} from 'lucide-react'

interface AdminAnalyticsTabProps {
  stats: AdminStats | null
  trends: { date: string; count: number }[]
}

export default function AdminAnalyticsTab({ stats, trends }: AdminAnalyticsTabProps) {
  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analytics & Reporting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getSuccessRate = () => {
    const total = stats.totalApplications
    if (total === 0) return 0
    return ((stats.approvedApplications / total) * 100).toFixed(1)
  }

  const getRecentTrend = () => {
    if (trends.length < 2) return null
    const recent = trends.slice(-7).reduce((sum, day) => sum + day.count, 0)
    const previous = trends.slice(-14, -7).reduce((sum, day) => sum + day.count, 0)
    return recent - previous
  }

  const recentTrend = getRecentTrend()
  const successRate = getSuccessRate()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Analytics & Reporting
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* User Analytics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Users</span>
                <Badge variant="outline">{stats.totalUsers}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Tenants</span>
                <Badge variant="secondary">{stats.totalTenants}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Landlords</span>
                <Badge variant="secondary">{stats.totalLandlords}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">New This Week</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{stats.recentRegistrations}</Badge>
                  {recentTrend !== null && (
                    <div className="flex items-center gap-1">
                      {recentTrend > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : recentTrend < 0 ? (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      ) : null}
                      <span className={`text-xs ${recentTrend > 0 ? 'text-green-600' : recentTrend < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                        {recentTrend > 0 ? '+' : ''}{recentTrend}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Property Analytics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Home className="h-5 w-5" />
                Property Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Properties</span>
                <Badge variant="outline">{stats.totalProperties}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Active Listings</span>
                <Badge variant="secondary">{stats.activeProperties}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Unavailable</span>
                <Badge variant="outline">{stats.totalProperties - stats.activeProperties}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Availability Rate</span>
                <Badge variant="outline">
                  {stats.totalProperties > 0 ? 
                    `${((stats.activeProperties / stats.totalProperties) * 100).toFixed(1)}%` : 
                    '0%'
                  }
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Application Analytics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Application Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Applications</span>
                <Badge variant="outline">{stats.totalApplications}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Pending</span>
                <Badge variant="secondary">{stats.pendingApplications}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Approved</span>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-200">{stats.approvedApplications}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Rejected</span>
                <Badge variant="destructive">{stats.rejectedApplications}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Success Rate</span>
                <Badge variant="outline">{successRate}%</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Registration Trends */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Registration Trends (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trends.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-7 gap-2">
                  {trends.slice(-7).map((day, index) => (
                    <div key={index} className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">
                        {new Date(day.date).toLocaleDateString('en-US', { 
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="bg-blue-100 text-blue-800 rounded px-2 py-1 text-sm font-medium">
                        {day.count}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>
                    Total registrations in the last 7 days: {trends.slice(-7).reduce((sum, day) => sum + day.count, 0)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No registration data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Key Metrics Summary */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Key Metrics Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">User Growth</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">{stats.recentRegistrations}</div>
                <div className="text-xs text-blue-600">New users this week</div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Home className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Properties</span>
                </div>
                <div className="text-2xl font-bold text-green-600">{stats.activeProperties}</div>
                <div className="text-xs text-green-600">Active listings</div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">Applications</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">{stats.pendingApplications}</div>
                <div className="text-xs text-purple-600">Pending review</div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-900">Success Rate</span>
                </div>
                <div className="text-2xl font-bold text-orange-600">{successRate}%</div>
                <div className="text-xs text-orange-600">Application approval</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}

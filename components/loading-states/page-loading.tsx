import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface PageLoadingProps {
  showHeader?: boolean
  showSidebar?: boolean
  showFooter?: boolean
  className?: string
}

export function PageLoading({ 
  showHeader = true, 
  showSidebar = false, 
  showFooter = false,
  className = ''
}: PageLoadingProps) {
  return (
    <div className={`min-h-screen bg-background ${className}`}>
      {/* Header Loading */}
      {showHeader && (
        <div className="border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
              </div>
              <div className="flex items-center space-x-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Sidebar Loading */}
        {showSidebar && (
          <div className="w-64 border-r border-border bg-background/50 p-4">
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content Loading */}
        <div className="flex-1 p-6">
          <div className="mx-auto max-w-7xl">
            {/* Page Title and Actions */}
            <div className="mb-8 flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
              </div>
              <div className="flex space-x-2">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-24" />
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex justify-between pt-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination Loading */}
            <div className="mt-8 flex justify-center">
              <div className="flex space-x-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-8" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Loading */}
      {showFooter && (
        <div className="border-t border-border bg-background/50 mt-auto">
          <div className="container mx-auto px-4 py-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

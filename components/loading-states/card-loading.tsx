import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface CardLoadingProps {
  count?: number
  showImage?: boolean
  showActions?: boolean
  className?: string
}

export function CardLoading({ 
  count = 1, 
  showImage = false, 
  showActions = false,
  className = ''
}: CardLoadingProps) {
  return (
    <div className={`grid gap-4 ${className}`}>
      {[...Array(count)].map((_, i) => (
        <Card key={i} className="overflow-hidden">
          {showImage && (
            <div className="aspect-video bg-muted">
              <Skeleton className="h-full w-full" />
            </div>
          )}
          
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          </CardHeader>
          
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
            
            {showActions && (
              <div className="flex gap-2 pt-4">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-24" />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

interface PropertyCardLoadingProps {
  count?: number
  className?: string
}

export function PropertyCardLoading({ count = 1, className = '' }: PropertyCardLoadingProps) {
  return (
    <div className={`grid gap-6 ${className}`}>
      {[...Array(count)].map((_, i) => (
        <Card key={i} className="overflow-hidden">
          {/* Property Image */}
          <div className="aspect-video bg-muted relative">
            <Skeleton className="h-full w-full" />
            <div className="absolute top-2 right-2">
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            <div className="absolute bottom-2 left-2">
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
          
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Property Details */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <Skeleton className="h-4 w-8 mx-auto mb-1" />
                <Skeleton className="h-3 w-12 mx-auto" />
              </div>
              <div className="text-center">
                <Skeleton className="h-4 w-8 mx-auto mb-1" />
                <Skeleton className="h-3 w-12 mx-auto" />
              </div>
              <div className="text-center">
                <Skeleton className="h-4 w-8 mx-auto mb-1" />
                <Skeleton className="h-3 w-12 mx-auto" />
              </div>
            </div>
            
            {/* Description */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

interface ProfileCardLoadingProps {
  showAvatar?: boolean
  showStats?: boolean
  className?: string
}

export function ProfileCardLoading({ 
  showAvatar = true, 
  showStats = true,
  className = ''
}: ProfileCardLoadingProps) {
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-4">
          {showAvatar && (
            <Skeleton className="h-16 w-16 rounded-full" />
          )}
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Bio */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        
        {/* Stats */}
        {showStats && (
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <Skeleton className="h-6 w-8 mx-auto mb-1" />
              <Skeleton className="h-3 w-12 mx-auto" />
            </div>
            <div className="text-center">
              <Skeleton className="h-6 w-8 mx-auto mb-1" />
              <Skeleton className="h-3 w-12 mx-auto" />
            </div>
            <div className="text-center">
              <Skeleton className="h-6 w-8 mx-auto mb-1" />
              <Skeleton className="h-3 w-12 mx-auto" />
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      </CardContent>
    </Card>
  )
}

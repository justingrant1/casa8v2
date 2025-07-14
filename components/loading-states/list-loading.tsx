import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

interface ListLoadingProps {
  count?: number
  showAvatar?: boolean
  showActions?: boolean
  className?: string
}

export function ListLoading({ 
  count = 5, 
  showAvatar = false, 
  showActions = false,
  className = ''
}: ListLoadingProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {[...Array(count)].map((_, i) => (
        <Card key={i} className="p-4">
          <div className="flex items-center space-x-4">
            {showAvatar && (
              <Skeleton className="h-10 w-10 rounded-full" />
            )}
            
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            
            {showActions && (
              <div className="flex space-x-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-8" />
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}

interface TableLoadingProps {
  columns?: number
  rows?: number
  showHeader?: boolean
  className?: string
}

export function TableLoading({ 
  columns = 4, 
  rows = 8, 
  showHeader = true,
  className = ''
}: TableLoadingProps) {
  return (
    <div className={`overflow-hidden rounded-lg border ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          {showHeader && (
            <thead className="bg-muted/50">
              <tr>
                {[...Array(columns)].map((_, i) => (
                  <th key={i} className="px-4 py-3 text-left">
                    <Skeleton className="h-4 w-24" />
                  </th>
                ))}
              </tr>
            </thead>
          )}
          
          <tbody>
            {[...Array(rows)].map((_, rowIndex) => (
              <tr key={rowIndex} className="border-t">
                {[...Array(columns)].map((_, colIndex) => (
                  <td key={colIndex} className="px-4 py-3">
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface MessageListLoadingProps {
  count?: number
  showAvatar?: boolean
  className?: string
}

export function MessageListLoading({ 
  count = 6, 
  showAvatar = true,
  className = ''
}: MessageListLoadingProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex space-x-3">
          {showAvatar && (
            <Skeleton className="h-8 w-8 rounded-full" />
          )}
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            
            <div className="space-y-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
          
          <Skeleton className="h-6 w-6" />
        </div>
      ))}
    </div>
  )
}

interface NotificationListLoadingProps {
  count?: number
  className?: string
}

export function NotificationListLoading({ 
  count = 5,
  className = ''
}: NotificationListLoadingProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex items-start space-x-3 p-3 border rounded-lg">
          <Skeleton className="h-2 w-2 rounded-full mt-2" />
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-12" />
            </div>
            
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

interface PropertyListLoadingProps {
  count?: number
  layout?: 'grid' | 'list'
  className?: string
}

export function PropertyListLoading({ 
  count = 6, 
  layout = 'grid',
  className = ''
}: PropertyListLoadingProps) {
  if (layout === 'list') {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(count)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex space-x-4">
              <div className="w-32 h-24 bg-muted rounded-lg">
                <Skeleton className="h-full w-full" />
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-6 w-20" />
                </div>
                
                <Skeleton className="h-4 w-32" />
                
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                </div>
                
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className={`grid gap-6 md:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {[...Array(count)].map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <div className="aspect-video bg-muted">
            <Skeleton className="h-full w-full" />
          </div>
          
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-6 w-16" />
            </div>
            
            <Skeleton className="h-4 w-24" />
            
            <div className="flex items-center space-x-4">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
            </div>
            
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

interface CommentListLoadingProps {
  count?: number
  showReplies?: boolean
  className?: string
}

export function CommentListLoading({ 
  count = 4, 
  showReplies = false,
  className = ''
}: CommentListLoadingProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="space-y-4">
          <div className="flex space-x-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
              
              <div className="space-y-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              
              <div className="flex items-center space-x-4">
                <Skeleton className="h-3 w-8" />
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-10" />
              </div>
            </div>
          </div>
          
          {showReplies && (
            <div className="ml-11 space-y-3">
              {[...Array(2)].map((_, replyIndex) => (
                <div key={replyIndex} className="flex space-x-3">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                    
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

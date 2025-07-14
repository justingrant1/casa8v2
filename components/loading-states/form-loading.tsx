import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface FormLoadingProps {
  showHeader?: boolean
  fields?: number
  showActions?: boolean
  className?: string
}

export function FormLoading({ 
  showHeader = true, 
  fields = 6, 
  showActions = true,
  className = ''
}: FormLoadingProps) {
  return (
    <Card className={`w-full max-w-2xl mx-auto ${className}`}>
      {showHeader && (
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
      )}
      
      <CardContent className="space-y-6">
        {[...Array(fields)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        
        {showActions && (
          <div className="flex justify-end space-x-2 pt-4">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-24" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface LoginFormLoadingProps {
  showLogo?: boolean
  showRememberMe?: boolean
  showForgotPassword?: boolean
  className?: string
}

export function LoginFormLoading({ 
  showLogo = true, 
  showRememberMe = true,
  showForgotPassword = true,
  className = ''
}: LoginFormLoadingProps) {
  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader className="text-center">
        {showLogo && (
          <Skeleton className="h-12 w-32 mx-auto mb-4" />
        )}
        <Skeleton className="h-6 w-24 mx-auto" />
        <Skeleton className="h-4 w-48 mx-auto" />
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Email field */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-10 w-full" />
        </div>
        
        {/* Password field */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full" />
        </div>
        
        {/* Remember me and forgot password */}
        <div className="flex items-center justify-between">
          {showRememberMe && (
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-24" />
            </div>
          )}
          
          {showForgotPassword && (
            <Skeleton className="h-4 w-32" />
          )}
        </div>
        
        {/* Login button */}
        <Skeleton className="h-10 w-full" />
        
        {/* Sign up link */}
        <div className="text-center">
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </CardContent>
    </Card>
  )
}

interface SearchFormLoadingProps {
  showFilters?: boolean
  filterCount?: number
  className?: string
}

export function SearchFormLoading({ 
  showFilters = true, 
  filterCount = 4,
  className = ''
}: SearchFormLoadingProps) {
  return (
    <Card className={`w-full ${className}`}>
      <CardContent className="p-6">
        {/* Main search bar */}
        <div className="space-y-2 mb-6">
          <Skeleton className="h-4 w-20" />
          <div className="flex space-x-2">
            <Skeleton className="h-12 flex-1" />
            <Skeleton className="h-12 w-24" />
          </div>
        </div>
        
        {/* Filters */}
        {showFilters && (
          <div className="space-y-4">
            <Skeleton className="h-5 w-16" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(filterCount)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
            
            <div className="flex justify-between items-center pt-4">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface ContactFormLoadingProps {
  showSubject?: boolean
  showAttachment?: boolean
  className?: string
}

export function ContactFormLoading({ 
  showSubject = true, 
  showAttachment = false,
  className = ''
}: ContactFormLoadingProps) {
  return (
    <Card className={`w-full max-w-2xl mx-auto ${className}`}>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-full" />
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Name and Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        
        {/* Subject */}
        {showSubject && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}
        
        {/* Message */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-32 w-full" />
        </div>
        
        {/* Attachment */}
        {showAttachment && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}
        
        {/* Submit button */}
        <div className="flex justify-end">
          <Skeleton className="h-10 w-32" />
        </div>
      </CardContent>
    </Card>
  )
}

interface PropertyFormLoadingProps {
  showImages?: boolean
  showAdvanced?: boolean
  className?: string
}

export function PropertyFormLoading({ 
  showImages = true, 
  showAdvanced = false,
  className = ''
}: PropertyFormLoadingProps) {
  return (
    <div className={`space-y-8 ${className}`}>
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-32 w-full" />
          </div>
          
          {/* Price and Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          
          {/* Bed/Bath/Area */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Location */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          
          <div className="h-64 bg-muted rounded-lg">
            <Skeleton className="h-full w-full" />
          </div>
        </CardContent>
      </Card>
      
      {/* Images */}
      {showImages && (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-square bg-muted rounded-lg">
                  <Skeleton className="h-full w-full" />
                </div>
              ))}
            </div>
            
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      )}
      
      {/* Advanced Settings */}
      {showAdvanced && (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          
          <CardContent className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-48" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      
      {/* Actions */}
      <div className="flex justify-end space-x-2">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  )
}

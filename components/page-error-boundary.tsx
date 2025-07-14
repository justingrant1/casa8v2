'use client'

import ErrorBoundary from './error-boundary'
import { useRouter } from 'next/navigation'
import { Button } from './ui/button'
import { Home, ArrowLeft } from 'lucide-react'

interface PageErrorFallbackProps {
  error: Error
  retry: () => void
}

function PageErrorFallback({ error, retry }: PageErrorFallbackProps) {
  const router = useRouter()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Page Error</h1>
        <p className="text-gray-600 mb-8">
          This page encountered an error. You can try refreshing or go back to the homepage.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={retry} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button onClick={() => router.push('/')}>
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    </div>
  )
}

export function PageErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary fallback={PageErrorFallback}>
      {children}
    </ErrorBoundary>
  )
}

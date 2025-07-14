'use client'

import React from 'react'
import { Button } from './ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo })
    
    // Log error to monitoring service
    console.error('Error Boundary caught an error:', error, errorInfo)
    
    // Handle error reporting internally
    try {
      // Import and use error reporter
      import('@/lib/error-reporting').then(({ ErrorReporter }) => {
        ErrorReporter.report(error, { errorInfo })
      })
    } catch (reportError) {
      console.error('Failed to report error:', reportError)
    }
  }

  retry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback
      
      if (FallbackComponent) {
        return <FallbackComponent error={this.state.error!} retry={this.retry} />
      }

      return <DefaultErrorFallback error={this.state.error!} retry={this.retry} />
    }

    return this.props.children
  }
}

function DefaultErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
      <p className="text-gray-600 mb-6 text-center max-w-md">
        We're sorry, but something unexpected happened. Please try again.
      </p>
      <Button onClick={retry} className="flex items-center gap-2">
        <RefreshCw className="w-4 h-4" />
        Try Again
      </Button>
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-4 p-4 bg-gray-100 rounded-lg max-w-2xl">
          <summary className="cursor-pointer font-mono text-sm">Error Details</summary>
          <pre className="mt-2 text-xs overflow-auto">{error.message}</pre>
        </details>
      )}
    </div>
  )
}

export default ErrorBoundary

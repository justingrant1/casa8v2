'use client'

import { useCallback, useRef, useState } from 'react'
import { errorHandler, ErrorHandlerOptions } from '@/lib/error-handler'
import { AppError } from '@/lib/errors'

export interface UseErrorHandlerReturn {
  error: AppError | null
  clearError: () => void
  handleError: (error: any, options?: ErrorHandlerOptions) => AppError
  handleApiError: (error: any, action: string) => AppError
  handleFormError: (error: any, formName: string) => AppError
  handleAsyncError: (error: any, operation: string) => AppError
  handleSilentError: (error: any, context?: Record<string, any>) => AppError
  handleCriticalError: (error: any, context?: Record<string, any>) => AppError
}

/**
 * React hook for centralized error handling
 * Provides a consistent interface for error handling across components
 */
export function useErrorHandler(): UseErrorHandlerReturn {
  const [error, setError] = useState<AppError | null>(null)
  const mounted = useRef(true)

  // Clear error state
  const clearError = useCallback(() => {
    if (mounted.current) {
      setError(null)
    }
  }, [])

  // Main error handler
  const handleError = useCallback((error: any, options?: ErrorHandlerOptions): AppError => {
    if (!mounted.current) return error

    const appError = errorHandler.handleError(error, options)
    setError(appError)
    return appError
  }, [])

  // API error handler
  const handleApiError = useCallback((error: any, action: string): AppError => {
    if (!mounted.current) return error

    const appError = errorHandler.handleApiError(error, action)
    setError(appError)
    return appError
  }, [])

  // Form error handler
  const handleFormError = useCallback((error: any, formName: string): AppError => {
    if (!mounted.current) return error

    const appError = errorHandler.handleFormError(error, formName)
    setError(appError)
    return appError
  }, [])

  // Async operation error handler
  const handleAsyncError = useCallback((error: any, operation: string): AppError => {
    if (!mounted.current) return error

    const appError = errorHandler.handleAsyncError(error, operation)
    setError(appError)
    return appError
  }, [])

  // Silent error handler (no toast)
  const handleSilentError = useCallback((error: any, context?: Record<string, any>): AppError => {
    if (!mounted.current) return error

    const appError = errorHandler.handleSilentError(error, context)
    setError(appError)
    return appError
  }, [])

  // Critical error handler
  const handleCriticalError = useCallback((error: any, context?: Record<string, any>): AppError => {
    if (!mounted.current) return error

    const appError = errorHandler.handleCriticalError(error, context)
    setError(appError)
    return appError
  }, [])

  return {
    error,
    clearError,
    handleError,
    handleApiError,
    handleFormError,
    handleAsyncError,
    handleSilentError,
    handleCriticalError
  }
}

export interface UseAsyncErrorReturn<T> {
  data: T | null
  error: AppError | null
  loading: boolean
  execute: (...args: any[]) => Promise<T | null>
  clearError: () => void
  retry: () => Promise<T | null>
}

/**
 * Hook for handling async operations with error handling
 * Provides loading states, error handling, and retry functionality
 */
export function useAsyncError<T>(
  asyncFn: (...args: any[]) => Promise<T>,
  options?: {
    showToast?: boolean
    logError?: boolean
    context?: Record<string, any>
  }
): UseAsyncErrorReturn<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<AppError | null>(null)
  const [loading, setLoading] = useState(false)
  const mounted = useRef(true)
  const lastArgs = useRef<any[]>([])

  const clearError = useCallback(() => {
    if (mounted.current) {
      setError(null)
    }
  }, [])

  const execute = useCallback(async (...args: any[]): Promise<T | null> => {
    if (!mounted.current) return null

    setLoading(true)
    setError(null)
    lastArgs.current = args

    try {
      const result = await asyncFn(...args)
      
      if (mounted.current) {
        setData(result)
        setLoading(false)
      }
      
      return result
    } catch (err) {
      if (mounted.current) {
        const appError = errorHandler.handleError(err as Error, {
          showToast: options?.showToast ?? true,
          logError: options?.logError ?? true,
          context: options?.context
        })
        
        setError(appError)
        setLoading(false)
      }
      
      return null
    }
  }, [asyncFn, options])

  const retry = useCallback(async (): Promise<T | null> => {
    return execute(...lastArgs.current)
  }, [execute])

  return {
    data,
    error,
    loading,
    execute,
    clearError,
    retry
  }
}

export interface UseFormErrorReturn {
  errors: Record<string, string>
  hasErrors: boolean
  setFieldError: (field: string, message: string) => void
  clearFieldError: (field: string) => void
  clearAllErrors: () => void
  handleFormError: (error: any, formName: string) => void
}

/**
 * Hook for handling form-specific errors
 * Provides field-level error management
 */
export function useFormError(): UseFormErrorReturn {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const mounted = useRef(true)

  const setFieldError = useCallback((field: string, message: string) => {
    if (mounted.current) {
      setErrors(prev => ({ ...prev, [field]: message }))
    }
  }, [])

  const clearFieldError = useCallback((field: string) => {
    if (mounted.current) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }, [])

  const clearAllErrors = useCallback(() => {
    if (mounted.current) {
      setErrors({})
    }
  }, [])

  const handleFormError = useCallback((error: any, formName: string) => {
    if (!mounted.current) return

    const appError = errorHandler.handleFormError(error, formName)
    
    // If the error contains field-specific information, extract it
    if (appError.context?.metadata?.fields) {
      const fieldErrors = appError.context.metadata.fields as Record<string, string>
      setErrors(prev => ({ ...prev, ...fieldErrors }))
    }
  }, [])

  return {
    errors,
    hasErrors: Object.keys(errors).length > 0,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    handleFormError
  }
}

export interface UseRetryReturn {
  retryCount: number
  isRetrying: boolean
  canRetry: boolean
  retry: () => Promise<void>
  reset: () => void
}

/**
 * Hook for handling retry logic with exponential backoff
 * Useful for network operations that might fail temporarily
 */
export function useRetry(
  operation: () => Promise<void>,
  options: {
    maxRetries?: number
    baseDelay?: number
    maxDelay?: number
    multiplier?: number
  } = {}
): UseRetryReturn {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    multiplier = 2
  } = options

  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  const mounted = useRef(true)

  const retry = useCallback(async (): Promise<void> => {
    if (!mounted.current || retryCount >= maxRetries) return

    setIsRetrying(true)
    
    try {
      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(multiplier, retryCount),
        maxDelay
      )
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay))
      
      // Execute the operation
      await operation()
      
      // Reset retry count on success
      if (mounted.current) {
        setRetryCount(0)
        setIsRetrying(false)
      }
    } catch (error) {
      if (mounted.current) {
        setRetryCount(prev => prev + 1)
        setIsRetrying(false)
        
        // Handle the error
        errorHandler.handleError(error as Error, {
          showToast: retryCount >= maxRetries - 1,
          logError: true,
          context: { retryCount, maxRetries }
        })
      }
    }
  }, [operation, retryCount, maxRetries, baseDelay, maxDelay, multiplier])

  const reset = useCallback(() => {
    if (mounted.current) {
      setRetryCount(0)
      setIsRetrying(false)
    }
  }, [])

  return {
    retryCount,
    isRetrying,
    canRetry: retryCount < maxRetries,
    retry,
    reset
  }
}

import { toast } from 'sonner'
import { ErrorReporter } from './error-reporting'
import { AppError, ErrorCode, createError } from './errors'
import { AuthError, PostgrestError } from '@supabase/supabase-js'

export interface ErrorHandlerOptions {
  showToast?: boolean
  logError?: boolean
  fallbackMessage?: string
  context?: Record<string, any>
}

export class ErrorHandler {
  private static instance: ErrorHandler
  private isInitialized = false

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  public initialize() {
    if (this.isInitialized) return

    // Global error event listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('error', this.handleGlobalError.bind(this))
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this))
    }

    this.isInitialized = true
  }

  private handleGlobalError(event: ErrorEvent) {
    const error = createError(
      'unknown',
      event.message,
      'An unexpected error occurred',
      {
        route: window.location.pathname,
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      }
    )

    this.handleError(error, { showToast: true, logError: true })
  }

  private handleUnhandledRejection(event: PromiseRejectionEvent) {
    const error = createError(
      'unknown',
      event.reason?.message || 'Unhandled promise rejection',
      'An unexpected error occurred',
      {
        route: window.location.pathname,
        metadata: { reason: event.reason }
      }
    )

    this.handleError(error, { showToast: true, logError: true })
  }

  public handleError(
    error: Error | AppError | AuthError | PostgrestError,
    options: ErrorHandlerOptions = {}
  ): AppError {
    const {
      showToast = true,
      logError = true,
      fallbackMessage = 'An unexpected error occurred',
      context = {}
    } = options

    // Convert to AppError if it's not already
    const appError = this.convertToAppError(error, context)

    // Log the error
    if (logError) {
      this.logError(appError)
    }

    // Show toast notification
    if (showToast) {
      this.showErrorToast(appError)
    }

    return appError
  }

  private convertToAppError(error: Error | AppError | AuthError | PostgrestError, context: Record<string, any> = {}): AppError {
    // If it's already an AppError, return it
    if (error instanceof AppError) {
      return error
    }

    // Handle Supabase Auth errors
    if (this.isAuthError(error)) {
      return this.convertAuthError(error, context)
    }

    // Handle Supabase Database errors
    if (this.isPostgrestError(error)) {
      return this.convertPostgrestError(error, context)
    }

    // Handle network errors
    if (this.isNetworkError(error)) {
      return this.convertNetworkError(error, context)
    }

    // Handle validation errors
    if (this.isValidationError(error)) {
      return this.convertValidationError(error, context)
    }

    // Default to unknown error
    return createError('unknown', error.message, undefined, {
      route: typeof window !== 'undefined' ? window.location.pathname : undefined,
      metadata: { originalError: error.name, ...context }
    })
  }

  private isAuthError(error: any): error is AuthError {
    return error && typeof error === 'object' && 'status' in error && 'message' in error
  }

  private isPostgrestError(error: any): error is PostgrestError {
    return error && typeof error === 'object' && 'code' in error && 'details' in error
  }

  private isNetworkError(error: Error): boolean {
    return error.name === 'NetworkError' || 
           error.message.includes('fetch') || 
           error.message.includes('network') ||
           error.message.includes('timeout')
  }

  private isValidationError(error: Error): boolean {
    return error.name === 'ValidationError' ||
           error.message.includes('validation') ||
           error.message.includes('required') ||
           error.message.includes('invalid')
  }

  private convertAuthError(error: AuthError, context: Record<string, any>): AppError {
    const route = typeof window !== 'undefined' ? window.location.pathname : undefined

    switch (error.message) {
      case 'Invalid login credentials':
        return createError('auth', error.message, 'Invalid email or password', {
          route,
          action: 'login',
          metadata: { status: error.status, ...context }
        })
      case 'User not found':
        return createError('auth', error.message, 'User not found', {
          route,
          action: 'user_lookup',
          metadata: { status: error.status, ...context }
        })
      case 'Email not confirmed':
        return createError('auth', error.message, 'Please confirm your email address', {
          route,
          action: 'email_verification',
          metadata: { status: error.status, ...context }
        })
      case 'Token has expired':
        return createError('auth', error.message, 'Your session has expired. Please log in again.', {
          route,
          action: 'token_refresh',
          metadata: { status: error.status, ...context }
        })
      default:
        return createError('auth', error.message, 'Authentication failed', {
          route,
          action: 'auth_unknown',
          metadata: { status: error.status, ...context }
        })
    }
  }

  private convertPostgrestError(error: PostgrestError, context: Record<string, any>): AppError {
    const route = typeof window !== 'undefined' ? window.location.pathname : undefined

    switch (error.code) {
      case '23505': // unique_violation
        return createError('database', error.message, 'This item already exists', {
          route,
          action: 'database_insert',
          metadata: { code: error.code, details: error.details, ...context }
        })
      case '23503': // foreign_key_violation
        return createError('database', error.message, 'Referenced item does not exist', {
          route,
          action: 'database_reference',
          metadata: { code: error.code, details: error.details, ...context }
        })
      case '42703': // undefined_column
        return createError('database', error.message, 'Database schema error', {
          route,
          action: 'database_query',
          metadata: { code: error.code, details: error.details, ...context }
        })
      case 'PGRST116': // not found
        return createError('database', error.message, 'Item not found', {
          route,
          action: 'database_select',
          metadata: { code: error.code, details: error.details, ...context }
        })
      default:
        return createError('database', error.message, 'Database error occurred', {
          route,
          action: 'database_unknown',
          metadata: { code: error.code, details: error.details, ...context }
        })
    }
  }

  private convertNetworkError(error: Error, context: Record<string, any>): AppError {
    const route = typeof window !== 'undefined' ? window.location.pathname : undefined

    if (error.message.includes('timeout')) {
      return createError('network', error.message, 'Request timed out. Please try again.', {
        route,
        action: 'network_request',
        metadata: { type: 'timeout', ...context }
      })
    }

    if (error.message.includes('fetch')) {
      return createError('network', error.message, 'Network error. Please check your connection.', {
        route,
        action: 'network_request',
        metadata: { type: 'fetch', ...context }
      })
    }

    return createError('network', error.message, 'Network error occurred', {
      route,
      action: 'network_request',
      metadata: { type: 'unknown', ...context }
    })
  }

  private convertValidationError(error: Error, context: Record<string, any>): AppError {
    const route = typeof window !== 'undefined' ? window.location.pathname : undefined

    return createError('validation', error.message, 'Please check your input and try again', {
      route,
      action: 'validation',
      metadata: { ...context }
    })
  }

  private logError(error: AppError) {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error [${error.code}]`)
      console.error('Message:', error.message)
      console.error('User Message:', error.userMessage)
      console.error('Context:', error.context)
      console.error('Stack:', error.stack)
      console.groupEnd()
    }

    // Report to error reporting service
    ErrorReporter.report(error, error.context)
  }

  private showErrorToast(error: AppError) {
    const toastId = `error-${Date.now()}`
    
    // Use different toast types based on error severity
    if (error.statusCode >= 500) {
      toast.error(error.userMessage, {
        id: toastId,
        description: 'Please try again later or contact support if the problem persists.',
        duration: 5000
      })
    } else if (error.statusCode >= 400) {
      toast.error(error.userMessage, {
        id: toastId,
        duration: 4000
      })
    } else {
      toast.warning(error.userMessage, {
        id: toastId,
        duration: 3000
      })
    }
  }

  // Utility methods for common error patterns
  public handleApiError(error: any, action: string): AppError {
    return this.handleError(error, {
      showToast: true,
      logError: true,
      context: { action }
    })
  }

  public handleFormError(error: any, formName: string): AppError {
    return this.handleError(error, {
      showToast: true,
      logError: true,
      context: { formName, type: 'form_validation' }
    })
  }

  public handleAsyncError(error: any, operation: string): AppError {
    return this.handleError(error, {
      showToast: true,
      logError: true,
      context: { operation, type: 'async_operation' }
    })
  }

  // Silent error handling (no toast)
  public handleSilentError(error: any, context: Record<string, any> = {}): AppError {
    return this.handleError(error, {
      showToast: false,
      logError: true,
      context
    })
  }

  // Critical error handling (always show toast and log)
  public handleCriticalError(error: any, context: Record<string, any> = {}): AppError {
    return this.handleError(error, {
      showToast: true,
      logError: true,
      fallbackMessage: 'A critical error occurred. Please contact support.',
      context
    })
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance()

// Initialize error handler
if (typeof window !== 'undefined') {
  errorHandler.initialize()
}

// Utility function for handling errors in components
export function handleError(error: any, options?: ErrorHandlerOptions): AppError {
  return errorHandler.handleError(error, options)
}

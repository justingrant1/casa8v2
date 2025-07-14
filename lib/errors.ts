// Error types and constants for centralized error handling

export enum ErrorCode {
  // Authentication errors
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_USER_NOT_FOUND = 'AUTH_USER_NOT_FOUND',
  AUTH_SESSION_EXPIRED = 'AUTH_SESSION_EXPIRED',
  AUTH_UNAUTHORIZED = 'AUTH_UNAUTHORIZED',
  
  // Database errors
  DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR',
  DATABASE_QUERY_ERROR = 'DATABASE_QUERY_ERROR',
  DATABASE_CONSTRAINT_ERROR = 'DATABASE_CONSTRAINT_ERROR',
  DATABASE_NOT_FOUND = 'DATABASE_NOT_FOUND',
  
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  NETWORK_UNAUTHORIZED = 'NETWORK_UNAUTHORIZED',
  NETWORK_FORBIDDEN = 'NETWORK_FORBIDDEN',
  NETWORK_NOT_FOUND = 'NETWORK_NOT_FOUND',
  NETWORK_SERVER_ERROR = 'NETWORK_SERVER_ERROR',
  
  // Validation errors
  VALIDATION_REQUIRED_FIELD = 'VALIDATION_REQUIRED_FIELD',
  VALIDATION_INVALID_EMAIL = 'VALIDATION_INVALID_EMAIL',
  VALIDATION_INVALID_PHONE = 'VALIDATION_INVALID_PHONE',
  VALIDATION_INVALID_FORMAT = 'VALIDATION_INVALID_FORMAT',
  VALIDATION_TOO_LONG = 'VALIDATION_TOO_LONG',
  VALIDATION_TOO_SHORT = 'VALIDATION_TOO_SHORT',
  
  // Business logic errors
  BUSINESS_PROPERTY_NOT_AVAILABLE = 'BUSINESS_PROPERTY_NOT_AVAILABLE',
  BUSINESS_APPLICATION_EXISTS = 'BUSINESS_APPLICATION_EXISTS',
  BUSINESS_UNAUTHORIZED_ACTION = 'BUSINESS_UNAUTHORIZED_ACTION',
  BUSINESS_INVALID_OPERATION = 'BUSINESS_INVALID_OPERATION',
  
  // File/Upload errors
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  FILE_INVALID_TYPE = 'FILE_INVALID_TYPE',
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',
  
  // Generic errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  OPERATION_FAILED = 'OPERATION_FAILED'
}

export interface ErrorContext {
  timestamp: string
  userId?: string
  route?: string
  action?: string
  metadata?: Record<string, any>
}

export abstract class AppError extends Error {
  public abstract readonly code: ErrorCode
  public abstract readonly statusCode: number
  public abstract readonly isOperational: boolean
  public readonly context: ErrorContext
  public readonly userMessage: string

  constructor(
    message: string,
    userMessage?: string,
    context: Partial<ErrorContext> = {}
  ) {
    super(message)
    this.name = this.constructor.name
    this.userMessage = userMessage || this.getDefaultUserMessage()
    this.context = {
      timestamp: new Date().toISOString(),
      ...context
    }

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  protected abstract getDefaultUserMessage(): string

  public toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      statusCode: this.statusCode,
      context: this.context,
      stack: this.stack
    }
  }
}

// Authentication Errors
export class AuthenticationError extends AppError {
  public readonly code = ErrorCode.AUTH_INVALID_CREDENTIALS
  public readonly statusCode = 401
  public readonly isOperational = true

  protected getDefaultUserMessage(): string {
    return 'Authentication failed. Please check your credentials.'
  }
}

export class AuthorizationError extends AppError {
  public readonly code = ErrorCode.AUTH_UNAUTHORIZED
  public readonly statusCode = 403
  public readonly isOperational = true

  protected getDefaultUserMessage(): string {
    return 'You are not authorized to perform this action.'
  }
}

export class SessionExpiredError extends AppError {
  public readonly code = ErrorCode.AUTH_SESSION_EXPIRED
  public readonly statusCode = 401
  public readonly isOperational = true

  protected getDefaultUserMessage(): string {
    return 'Your session has expired. Please log in again.'
  }
}

// Database Errors
export class DatabaseError extends AppError {
  public readonly code = ErrorCode.DATABASE_QUERY_ERROR
  public readonly statusCode = 500
  public readonly isOperational = true

  protected getDefaultUserMessage(): string {
    return 'A database error occurred. Please try again later.'
  }
}

export class NotFoundError extends AppError {
  public readonly code = ErrorCode.DATABASE_NOT_FOUND
  public readonly statusCode = 404
  public readonly isOperational = true

  protected getDefaultUserMessage(): string {
    return 'The requested resource was not found.'
  }
}

// Network Errors
export class NetworkError extends AppError {
  public readonly code = ErrorCode.NETWORK_ERROR
  public readonly statusCode = 500
  public readonly isOperational = true

  protected getDefaultUserMessage(): string {
    return 'Network error occurred. Please check your connection and try again.'
  }
}

export class TimeoutError extends AppError {
  public readonly code = ErrorCode.NETWORK_TIMEOUT
  public readonly statusCode = 408
  public readonly isOperational = true

  protected getDefaultUserMessage(): string {
    return 'Request timed out. Please try again.'
  }
}

// Validation Errors
export class ValidationError extends AppError {
  public readonly code = ErrorCode.VALIDATION_INVALID_FORMAT
  public readonly statusCode = 400
  public readonly isOperational = true

  protected getDefaultUserMessage(): string {
    return 'Invalid input provided. Please check your data and try again.'
  }
}

// Business Logic Errors
export class BusinessLogicError extends AppError {
  public readonly code = ErrorCode.BUSINESS_INVALID_OPERATION
  public readonly statusCode = 422
  public readonly isOperational = true

  protected getDefaultUserMessage(): string {
    return 'This operation cannot be completed at this time.'
  }
}

export class PropertyNotAvailableError extends AppError {
  public readonly code = ErrorCode.BUSINESS_PROPERTY_NOT_AVAILABLE
  public readonly statusCode = 422
  public readonly isOperational = true

  protected getDefaultUserMessage(): string {
    return 'This property is no longer available.'
  }
}

export class ApplicationExistsError extends AppError {
  public readonly code = ErrorCode.BUSINESS_APPLICATION_EXISTS
  public readonly statusCode = 422
  public readonly isOperational = true

  protected getDefaultUserMessage(): string {
    return 'You have already submitted an application for this property.'
  }
}

// File Upload Errors
export class FileUploadError extends AppError {
  public readonly code = ErrorCode.FILE_UPLOAD_FAILED
  public readonly statusCode = 400
  public readonly isOperational = true

  protected getDefaultUserMessage(): string {
    return 'File upload failed. Please try again.'
  }
}

export class FileTooLargeError extends AppError {
  public readonly code = ErrorCode.FILE_TOO_LARGE
  public readonly statusCode = 400
  public readonly isOperational = true

  protected getDefaultUserMessage(): string {
    return 'File is too large. Please select a smaller file.'
  }
}

export class InvalidFileTypeError extends AppError {
  public readonly code = ErrorCode.FILE_INVALID_TYPE
  public readonly statusCode = 400
  public readonly isOperational = true

  protected getDefaultUserMessage(): string {
    return 'Invalid file type. Please select a supported file format.'
  }
}

// Generic Errors
export class UnknownError extends AppError {
  public readonly code = ErrorCode.UNKNOWN_ERROR
  public readonly statusCode = 500
  public readonly isOperational = false

  protected getDefaultUserMessage(): string {
    return 'An unexpected error occurred. Please try again later.'
  }
}

// Error factory function
export function createError(
  type: 'auth' | 'database' | 'network' | 'validation' | 'business' | 'file' | 'unknown',
  message: string,
  userMessage?: string,
  context?: Partial<ErrorContext>
): AppError {
  switch (type) {
    case 'auth':
      return new AuthenticationError(message, userMessage, context)
    case 'database':
      return new DatabaseError(message, userMessage, context)
    case 'network':
      return new NetworkError(message, userMessage, context)
    case 'validation':
      return new ValidationError(message, userMessage, context)
    case 'business':
      return new BusinessLogicError(message, userMessage, context)
    case 'file':
      return new FileUploadError(message, userMessage, context)
    default:
      return new UnknownError(message, userMessage, context)
  }
}

// Error message mappings
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: 'Invalid email or password.',
  [ErrorCode.AUTH_USER_NOT_FOUND]: 'User not found.',
  [ErrorCode.AUTH_SESSION_EXPIRED]: 'Your session has expired. Please log in again.',
  [ErrorCode.AUTH_UNAUTHORIZED]: 'You are not authorized to perform this action.',
  
  [ErrorCode.DATABASE_CONNECTION_ERROR]: 'Database connection failed.',
  [ErrorCode.DATABASE_QUERY_ERROR]: 'Database query failed.',
  [ErrorCode.DATABASE_CONSTRAINT_ERROR]: 'Database constraint violation.',
  [ErrorCode.DATABASE_NOT_FOUND]: 'Resource not found.',
  
  [ErrorCode.NETWORK_ERROR]: 'Network error occurred.',
  [ErrorCode.NETWORK_TIMEOUT]: 'Request timed out.',
  [ErrorCode.NETWORK_UNAUTHORIZED]: 'Unauthorized access.',
  [ErrorCode.NETWORK_FORBIDDEN]: 'Access forbidden.',
  [ErrorCode.NETWORK_NOT_FOUND]: 'Resource not found.',
  [ErrorCode.NETWORK_SERVER_ERROR]: 'Server error occurred.',
  
  [ErrorCode.VALIDATION_REQUIRED_FIELD]: 'This field is required.',
  [ErrorCode.VALIDATION_INVALID_EMAIL]: 'Please enter a valid email address.',
  [ErrorCode.VALIDATION_INVALID_PHONE]: 'Please enter a valid phone number.',
  [ErrorCode.VALIDATION_INVALID_FORMAT]: 'Invalid format.',
  [ErrorCode.VALIDATION_TOO_LONG]: 'Input is too long.',
  [ErrorCode.VALIDATION_TOO_SHORT]: 'Input is too short.',
  
  [ErrorCode.BUSINESS_PROPERTY_NOT_AVAILABLE]: 'This property is no longer available.',
  [ErrorCode.BUSINESS_APPLICATION_EXISTS]: 'You have already applied for this property.',
  [ErrorCode.BUSINESS_UNAUTHORIZED_ACTION]: 'You are not authorized to perform this action.',
  [ErrorCode.BUSINESS_INVALID_OPERATION]: 'This operation cannot be completed.',
  
  [ErrorCode.FILE_TOO_LARGE]: 'File is too large.',
  [ErrorCode.FILE_INVALID_TYPE]: 'Invalid file type.',
  [ErrorCode.FILE_UPLOAD_FAILED]: 'File upload failed.',
  
  [ErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred.',
  [ErrorCode.OPERATION_FAILED]: 'Operation failed.'
}

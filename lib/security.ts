import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

// Rate limiting
interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

class RateLimiter {
  private requests = new Map<string, number[]>()
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
  }

  isRateLimited(identifier: string): boolean {
    const now = Date.now()
    const requests = this.requests.get(identifier) || []
    
    // Remove old requests outside the window
    const validRequests = requests.filter(
      timestamp => now - timestamp < this.config.windowMs
    )
    
    // Check if limit exceeded
    if (validRequests.length >= this.config.maxRequests) {
      return true
    }
    
    // Add current request
    validRequests.push(now)
    this.requests.set(identifier, validRequests)
    
    return false
  }

  getRemainingRequests(identifier: string): number {
    const requests = this.requests.get(identifier) || []
    const validRequests = requests.filter(
      timestamp => Date.now() - timestamp < this.config.windowMs
    )
    return Math.max(0, this.config.maxRequests - validRequests.length)
  }

  getResetTime(identifier: string): number {
    const requests = this.requests.get(identifier) || []
    if (requests.length === 0) return 0
    
    const oldestRequest = Math.min(...requests)
    return oldestRequest + this.config.windowMs
  }
}

// Global rate limiters
export const authRateLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 15 * 60 * 1000 // 15 minutes
})

export const apiRateLimiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 15 * 60 * 1000 // 15 minutes
})

export const contactRateLimiter = new RateLimiter({
  maxRequests: 3,
  windowMs: 60 * 60 * 1000 // 1 hour
})

// Input sanitization
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/\s+/g, ' ') // Normalize whitespace
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim().replace(/[^\w@.\-]/g, '')
}

export function sanitizePhone(phone: string): string {
  return phone.replace(/[^\d\+\-\(\)\s]/g, '')
}

export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url)
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return ''
    }
    return parsed.toString()
  } catch {
    return ''
  }
}

// Content Security Policy
export function getCSPHeader(): string {
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "media-src 'self' https: blob:",
    "connect-src 'self' https: wss: ws:",
    "frame-src 'self' https:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ]
  
  return cspDirectives.join('; ')
}

// Security headers middleware
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // CSP
  response.headers.set('Content-Security-Policy', getCSPHeader())
  
  // HSTS
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  )
  
  // X-Frame-Options
  response.headers.set('X-Frame-Options', 'DENY')
  
  // X-Content-Type-Options
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  // X-XSS-Protection
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Permissions Policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  )
  
  return response
}

// Authentication middleware
export async function authenticateRequest(request: NextRequest): Promise<{
  user: any | null
  error: string | null
}> {
  try {
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      return { user: null, error: error.message }
    }

    return { user, error: null }
  } catch (error) {
    return { user: null, error: 'Authentication failed' }
  }
}

// Role-based access control
export enum UserRole {
  TENANT = 'tenant',
  LANDLORD = 'landlord',
  ADMIN = 'admin'
}

export function hasRole(user: any, requiredRole: UserRole): boolean {
  if (!user) return false
  
  const userRole = user.user_metadata?.role || user.role
  
  switch (requiredRole) {
    case UserRole.ADMIN:
      return userRole === UserRole.ADMIN
    case UserRole.LANDLORD:
      return userRole === UserRole.LANDLORD || userRole === UserRole.ADMIN
    case UserRole.TENANT:
      return [UserRole.TENANT, UserRole.LANDLORD, UserRole.ADMIN].includes(userRole)
    default:
      return false
  }
}

export function requireRole(user: any, requiredRole: UserRole): boolean {
  if (!hasRole(user, requiredRole)) {
    throw new Error(`Access denied. Required role: ${requiredRole}`)
  }
  return true
}

// Request validation
export function validateRequestMethod(
  request: NextRequest,
  allowedMethods: string[]
): boolean {
  return allowedMethods.includes(request.method)
}

export function validateContentType(
  request: NextRequest,
  expectedType: string
): boolean {
  const contentType = request.headers.get('content-type') || ''
  return contentType.includes(expectedType)
}

export function validateReferer(request: NextRequest, allowedOrigins: string[]): boolean {
  const referer = request.headers.get('referer')
  if (!referer) return false
  
  try {
    const refererUrl = new URL(referer)
    return allowedOrigins.some(origin => refererUrl.origin === origin)
  } catch {
    return false
  }
}

// API key validation
export function validateApiKey(request: NextRequest, validApiKeys: string[]): boolean {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!apiKey) return false
  
  return validApiKeys.includes(apiKey)
}

// Environment validation
export function validateEnvironment(): void {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ]
  
  const missingVars = requiredEnvVars.filter(
    varName => !process.env[varName]
  )
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`)
  }
}

// CSRF protection
export function generateCSRFToken(): string {
  return crypto.randomUUID()
}

export function validateCSRFToken(token: string, expectedToken: string): boolean {
  return token === expectedToken
}

// Password strength validation
export function validatePasswordStrength(password: string): {
  isValid: boolean
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0
  
  // Length check
  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters long')
  } else if (password.length >= 12) {
    score += 2
  } else {
    score += 1
  }
  
  // Character variety
  if (!/[a-z]/.test(password)) {
    feedback.push('Password must contain at least one lowercase letter')
  } else {
    score += 1
  }
  
  if (!/[A-Z]/.test(password)) {
    feedback.push('Password must contain at least one uppercase letter')
  } else {
    score += 1
  }
  
  if (!/\d/.test(password)) {
    feedback.push('Password must contain at least one number')
  } else {
    score += 1
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    feedback.push('Password must contain at least one special character')
  } else {
    score += 1
  }
  
  // Common patterns
  if (/(.)\1{2,}/.test(password)) {
    feedback.push('Password should not contain repeated characters')
    score -= 1
  }
  
  if (/^(?:password|123456|qwerty|abc123|admin|guest)$/i.test(password)) {
    feedback.push('Password is too common')
    score -= 2
  }
  
  const isValid = feedback.length === 0 && score >= 4
  
  return {
    isValid,
    score: Math.max(0, Math.min(5, score)),
    feedback
  }
}

// File upload security
export function validateFileUpload(file: File, options: {
  maxSize: number
  allowedTypes: string[]
  allowedExtensions: string[]
}): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  // Size validation
  if (file.size > options.maxSize) {
    errors.push(`File size exceeds maximum allowed size of ${options.maxSize} bytes`)
  }
  
  // Type validation
  if (!options.allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed`)
  }
  
  // Extension validation
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!extension || !options.allowedExtensions.includes(extension)) {
    errors.push(`File extension .${extension} is not allowed`)
  }
  
  // Filename validation
  if (!/^[a-zA-Z0-9._-]+$/.test(file.name)) {
    errors.push('Filename contains invalid characters')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// SQL injection prevention
export function validateSQLQuery(query: string): boolean {
  const dangerousPatterns = [
    /(\b(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|TRUNCATE|REPLACE)\b)/gi,
    /(--|\/\*|\*\/|xp_|sp_)/gi,
    /(\bUNION\b.*\bSELECT\b)/gi,
    /(\bSELECT\b.*\bFROM\b.*\bINFORMATION_SCHEMA\b)/gi
  ]
  
  return !dangerousPatterns.some(pattern => pattern.test(query))
}

// XSS prevention
export function sanitizeHTML(html: string): string {
  const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li']
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g
  
  return html.replace(tagRegex, (match, tagName) => {
    if (allowedTags.includes(tagName.toLowerCase())) {
      return match
    }
    return ''
  })
}

// Request logging for security monitoring
export function logSecurityEvent(event: {
  type: 'auth_failure' | 'rate_limit' | 'suspicious_activity' | 'access_denied'
  ip: string
  userAgent: string
  details: Record<string, any>
}): void {
  if (process.env.NODE_ENV === 'production') {
    // In production, this would send to a security monitoring service
    console.log('[SECURITY]', {
      timestamp: new Date().toISOString(),
      ...event
    })
  }
}

// Security middleware factory
export function createSecurityMiddleware(options: {
  rateLimit?: RateLimitConfig
  requireAuth?: boolean
  requireRole?: UserRole
  validateCSRF?: boolean
}) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    try {
      // Rate limiting
      if (options.rateLimit) {
        const rateLimiter = new RateLimiter(options.rateLimit)
        if (rateLimiter.isRateLimited(ip)) {
          logSecurityEvent({
            type: 'rate_limit',
            ip,
            userAgent,
            details: { path: request.nextUrl.pathname }
          })
          return new NextResponse('Rate limit exceeded', { status: 429 })
        }
      }
      
      // Authentication
      if (options.requireAuth) {
        const { user, error } = await authenticateRequest(request)
        if (!user) {
          logSecurityEvent({
            type: 'auth_failure',
            ip,
            userAgent,
            details: { error, path: request.nextUrl.pathname }
          })
          return new NextResponse('Authentication required', { status: 401 })
        }
        
        // Role validation
        if (options.requireRole && !hasRole(user, options.requireRole)) {
          logSecurityEvent({
            type: 'access_denied',
            ip,
            userAgent,
            details: { requiredRole: options.requireRole, path: request.nextUrl.pathname }
          })
          return new NextResponse('Insufficient permissions', { status: 403 })
        }
      }
      
      // CSRF validation
      if (options.validateCSRF && ['POST', 'PUT', 'DELETE'].includes(request.method)) {
        const csrfToken = request.headers.get('x-csrf-token')
        const expectedToken = request.cookies.get('csrf-token')?.value
        
        if (!csrfToken || !expectedToken || !validateCSRFToken(csrfToken, expectedToken)) {
          logSecurityEvent({
            type: 'suspicious_activity',
            ip,
            userAgent,
            details: { reason: 'CSRF token mismatch', path: request.nextUrl.pathname }
          })
          return new NextResponse('CSRF token validation failed', { status: 403 })
        }
      }
      
      return null // Continue to next middleware
    } catch (error) {
      logSecurityEvent({
        type: 'suspicious_activity',
        ip,
        userAgent,
        details: { error: error instanceof Error ? error.message : 'Unknown error', path: request.nextUrl.pathname }
      })
      return new NextResponse('Security validation failed', { status: 500 })
    }
  }
}

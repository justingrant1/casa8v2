import { z } from 'zod'

// Define the environment schema
const envSchema = z.object({
  // Required Supabase configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  
  // Optional EmailJS configuration
  NEXT_PUBLIC_EMAILJS_SERVICE_ID: z.string().optional(),
  NEXT_PUBLIC_EMAILJS_TEMPLATE_ID: z.string().optional(),
  NEXT_PUBLIC_EMAILJS_PUBLIC_KEY: z.string().optional(),
  
  // Optional Google Maps API key
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional(),
  
  // Optional OpenAI API key
  OPENAI_API_KEY: z.string().optional(),
  
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Optional Vercel environment variables
  VERCEL_URL: z.string().optional(),
  VERCEL_ENV: z.enum(['development', 'preview', 'production']).optional(),
  
  // Optional error reporting
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  
  // Optional analytics
  NEXT_PUBLIC_GA_ID: z.string().optional(),
  
  // Optional feature flags
  NEXT_PUBLIC_ENABLE_ANALYTICS: z.string().transform(val => val === 'true').default('false'),
  NEXT_PUBLIC_ENABLE_ERROR_REPORTING: z.string().transform(val => val === 'true').default('false'),
  NEXT_PUBLIC_ENABLE_DEBUG_MODE: z.string().transform(val => val === 'true').default('false'),
  
  // Database configuration (server-side only)
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  
  // Email configuration (server-side only)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(val => val ? parseInt(val, 10) : undefined).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  
  // Security configuration
  NEXTAUTH_SECRET: z.string().optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  
  // Rate limiting
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
})

// Type inference from the schema
export type Environment = z.infer<typeof envSchema>

// Validate environment variables
function validateEnv(): Environment {
  try {
    // Get all environment variables
    const env = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_EMAILJS_SERVICE_ID: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
      NEXT_PUBLIC_EMAILJS_TEMPLATE_ID: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
      NEXT_PUBLIC_EMAILJS_PUBLIC_KEY: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY,
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
      NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
      NEXT_PUBLIC_ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS,
      NEXT_PUBLIC_ENABLE_ERROR_REPORTING: process.env.NEXT_PUBLIC_ENABLE_ERROR_REPORTING,
      NEXT_PUBLIC_ENABLE_DEBUG_MODE: process.env.NEXT_PUBLIC_ENABLE_DEBUG_MODE,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      DATABASE_URL: process.env.DATABASE_URL,
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASSWORD: process.env.SMTP_PASSWORD,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    }

    // Validate against schema
    return envSchema.parse(env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => {
        const path = err.path.join('.')
        return `${path}: ${err.message}`
      })

      console.error('❌ Environment validation failed:')
      errorMessages.forEach(msg => console.error(`  - ${msg}`))
      
      throw new Error(
        `Environment validation failed:\n${errorMessages.join('\n')}`
      )
    }
    
    throw error
  }
}

// Validate and export the environment
export const env = validateEnv()

// Utility functions for environment checks
export const isProduction = () => env.NODE_ENV === 'production'
export const isDevelopment = () => env.NODE_ENV === 'development'
export const isTest = () => env.NODE_ENV === 'test'

// Check if running on Vercel
export const isVercel = () => !!env.VERCEL_URL
export const isVercelProduction = () => env.VERCEL_ENV === 'production'
export const isVercelPreview = () => env.VERCEL_ENV === 'preview'

// Feature flag checks
export const isAnalyticsEnabled = () => env.NEXT_PUBLIC_ENABLE_ANALYTICS
export const isErrorReportingEnabled = () => env.NEXT_PUBLIC_ENABLE_ERROR_REPORTING
export const isDebugModeEnabled = () => env.NEXT_PUBLIC_ENABLE_DEBUG_MODE

// Service availability checks
export const hasGoogleMapsApi = () => !!env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
export const hasEmailJsConfig = () => !!(env.NEXT_PUBLIC_EMAILJS_SERVICE_ID && env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID && env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY)
export const hasOpenAiApi = () => !!env.OPENAI_API_KEY
export const hasSentryDsn = () => !!env.NEXT_PUBLIC_SENTRY_DSN
export const hasGoogleAnalytics = () => !!env.NEXT_PUBLIC_GA_ID
export const hasSupabaseServiceKey = () => !!env.SUPABASE_SERVICE_ROLE_KEY
export const hasSmtpConfig = () => !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD)
export const hasRedisConfig = () => !!(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN)

// Get the current URL for the application
export const getAppUrl = () => {
  if (isVercel() && env.VERCEL_URL) {
    return `https://${env.VERCEL_URL}`
  }
  
  if (env.NEXTAUTH_URL) {
    return env.NEXTAUTH_URL
  }
  
  if (isProduction()) {
    return 'https://your-app.com' // Replace with your production URL
  }
  
  return 'http://localhost:3000'
}

// Utility to safely access environment variables in client-side code
export const getClientEnv = () => ({
  NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_EMAILJS_SERVICE_ID: env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
  NEXT_PUBLIC_EMAILJS_TEMPLATE_ID: env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
  NEXT_PUBLIC_EMAILJS_PUBLIC_KEY: env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY,
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  NEXT_PUBLIC_SENTRY_DSN: env.NEXT_PUBLIC_SENTRY_DSN,
  NEXT_PUBLIC_GA_ID: env.NEXT_PUBLIC_GA_ID,
  NEXT_PUBLIC_ENABLE_ANALYTICS: env.NEXT_PUBLIC_ENABLE_ANALYTICS,
  NEXT_PUBLIC_ENABLE_ERROR_REPORTING: env.NEXT_PUBLIC_ENABLE_ERROR_REPORTING,
  NEXT_PUBLIC_ENABLE_DEBUG_MODE: env.NEXT_PUBLIC_ENABLE_DEBUG_MODE,
  NODE_ENV: env.NODE_ENV,
})

// Utility to safely access environment variables in server-side code
export const getServerEnv = () => env

// Development helper to log environment status
export const logEnvironmentStatus = () => {
  if (!isDevelopment()) return

  console.log('🌍 Environment Status:')
  console.log(`  • NODE_ENV: ${env.NODE_ENV}`)
  console.log(`  • Vercel: ${isVercel() ? '✅' : '❌'}`)
  console.log(`  • Supabase: ✅`)
  console.log(`  • EmailJS: ${hasEmailJsConfig() ? '✅' : '❌'}`)
  console.log(`  • Google Maps: ${hasGoogleMapsApi() ? '✅' : '❌'}`)
  console.log(`  • OpenAI: ${hasOpenAiApi() ? '✅' : '❌'}`)
  console.log(`  • Sentry: ${hasSentryDsn() ? '✅' : '❌'}`)
  console.log(`  • Analytics: ${hasGoogleAnalytics() ? '✅' : '❌'}`)
  console.log(`  • SMTP: ${hasSmtpConfig() ? '✅' : '❌'}`)
  console.log(`  • Redis: ${hasRedisConfig() ? '✅' : '❌'}`)
  console.log(`  • App URL: ${getAppUrl()}`)
}

// Initialize environment validation on import
if (isDevelopment()) {
  logEnvironmentStatus()
}

import { 
  env, 
  isProduction, 
  isDevelopment, 
  getAppUrl,
  hasGoogleMapsApi,
  hasOpenAiApi,
  hasSentryDsn,
  hasGoogleAnalytics,
  hasSupabaseServiceKey,
  hasSmtpConfig,
  hasRedisConfig,
  isAnalyticsEnabled,
  isErrorReportingEnabled,
  isDebugModeEnabled
} from './env'

// Supabase Configuration
export const supabaseConfig = {
  url: env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: 'public',
  },
  realtime: {
    enabled: true,
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'x-my-custom-header': 'casa8-app',
    },
  },
} as const

// EmailJS Configuration
export const emailConfig = {
  serviceId: env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
  templateId: env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
  publicKey: env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY,
  options: {
    publicKey: env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY,
    blockHeadless: true,
    blockList: {
      watchVariable: 'userAgent',
    },
    limitRate: {
      throttle: 10000, // 10 seconds
    },
  },
} as const

// Google Maps Configuration
export const mapsConfig = {
  apiKey: env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  enabled: hasGoogleMapsApi(),
  defaultCenter: {
    lat: 40.7128, // New York City
    lng: -74.0060,
  },
  defaultZoom: 13,
  libraries: ['places', 'geometry'] as const,
  mapOptions: {
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    scaleControl: true,
    streetViewControl: false,
    rotateControl: false,
    fullscreenControl: true,
  },
} as const

// OpenAI Configuration
export const openAiConfig = {
  apiKey: env.OPENAI_API_KEY,
  enabled: hasOpenAiApi(),
  model: 'gpt-4' as const,
  maxTokens: 1000,
  temperature: 0.7,
  timeout: 30000, // 30 seconds
  retries: 3,
} as const

// Error Reporting Configuration
export const errorReportingConfig = {
  sentry: {
    dsn: env.NEXT_PUBLIC_SENTRY_DSN,
    enabled: hasSentryDsn() && isErrorReportingEnabled(),
    environment: env.NODE_ENV,
    debug: isDevelopment(),
    tracesSampleRate: isProduction() ? 0.1 : 1.0,
    replaysSessionSampleRate: isProduction() ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,
  },
  logLevel: isDevelopment() ? 'debug' : 'error',
  enableConsoleLogging: isDevelopment(),
} as const

// Analytics Configuration
export const analyticsConfig = {
  googleAnalytics: {
    id: env.NEXT_PUBLIC_GA_ID,
    enabled: hasGoogleAnalytics() && isAnalyticsEnabled(),
    cookieConsent: true,
    anonymizeIp: true,
    respectDNT: true,
  },
  customEvents: {
    enabled: isAnalyticsEnabled(),
    trackPageViews: true,
    trackErrors: true,
    trackUserInteractions: true,
  },
} as const

// Application Configuration
export const appConfig = {
  name: 'Casa8',
  description: 'Find your next home with Casa8',
  url: getAppUrl(),
  version: '1.0.0',
  locale: 'en-US',
  timezone: 'America/New_York',
  currency: 'USD',
  
  // Feature flags
  features: {
    analytics: isAnalyticsEnabled(),
    errorReporting: isErrorReportingEnabled(),
    debugMode: isDebugModeEnabled(),
    googleMaps: hasGoogleMapsApi(),
    openAi: hasOpenAiApi(),
    redis: hasRedisConfig(),
    smtp: hasSmtpConfig(),
  },
  
  // UI Configuration
  ui: {
    theme: {
      default: 'light',
      allowToggle: true,
    },
    navigation: {
      showBreadcrumbs: true,
      showSearchBar: true,
    },
    pagination: {
      defaultLimit: 20,
      maxLimit: 100,
    },
  },
  
  // API Configuration
  api: {
    timeout: 30000, // 30 seconds
    retries: 3,
    baseUrl: getAppUrl(),
    version: 'v1',
  },
  
  // Security Configuration
  security: {
    corsOrigins: isProduction() 
      ? [getAppUrl()] 
      : ['http://localhost:3000', 'http://localhost:3001'],
    rateLimiting: {
      enabled: hasRedisConfig(),
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    },
    csrf: {
      enabled: isProduction(),
    },
  },
  
  // File Upload Configuration
  uploads: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'video/mp4',
      'video/webm',
      'application/pdf',
    ],
    storage: {
      provider: 'supabase',
      bucket: 'property-media',
    },
  },
  
  // Database Configuration
  database: {
    poolSize: isProduction() ? 20 : 5,
    timeout: 30000,
    retries: 3,
    ssl: isProduction(),
  },
  
  // Caching Configuration
  cache: {
    enabled: isProduction(),
    ttl: 300, // 5 minutes
    maxSize: 100, // Max 100 items in memory cache
  },
  
  // Email Configuration
  email: {
    from: {
      name: 'Casa8 Team',
      email: 'noreply@casa8.com',
    },
    smtp: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      user: env.SMTP_USER,
      password: env.SMTP_PASSWORD,
      enabled: hasSmtpConfig(),
    },
    templates: {
      welcome: 'welcome-template',
      verification: 'verification-template',
      passwordReset: 'password-reset-template',
      inquiry: 'inquiry-template',
    },
  },
} as const

// Environment-specific configurations
export const developmentConfig = {
  logging: {
    level: 'debug',
    enableConsole: true,
    enableFile: false,
  },
  hot: {
    enabled: true,
    port: 3001,
  },
  devTools: {
    enabled: true,
    showReduxDevTools: true,
    showReactDevTools: true,
  },
} as const

export const productionConfig = {
  logging: {
    level: 'error',
    enableConsole: false,
    enableFile: true,
  },
  minification: {
    enabled: true,
    removeComments: true,
    removeConsole: true,
  },
  optimization: {
    bundleAnalyzer: false,
    splitChunks: true,
    treeShaking: true,
  },
} as const

// Get environment-specific configuration
export const getEnvConfig = () => {
  if (isDevelopment()) return developmentConfig
  if (isProduction()) return productionConfig
  return {}
}

// Utility function to check if a feature is enabled
export const isFeatureEnabled = (feature: keyof typeof appConfig.features): boolean => {
  return appConfig.features[feature] === true
}

// Utility function to get API endpoint URL
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = appConfig.api.baseUrl
  const version = appConfig.api.version
  return `${baseUrl}/api/${version}/${endpoint.replace(/^\//, '')}`
}

// Utility function to get upload configuration
export const getUploadConfig = () => ({
  maxFileSize: appConfig.uploads.maxFileSize,
  allowedTypes: appConfig.uploads.allowedFileTypes,
  bucket: appConfig.uploads.storage.bucket,
})

// Utility function to get pagination configuration
export const getPaginationConfig = () => ({
  defaultLimit: appConfig.ui.pagination.defaultLimit,
  maxLimit: appConfig.ui.pagination.maxLimit,
})

// Utility function to get security configuration
export const getSecurityConfig = () => ({
  corsOrigins: appConfig.security.corsOrigins,
  rateLimiting: appConfig.security.rateLimiting,
  csrf: appConfig.security.csrf,
})

// Export all configurations
export const config = {
  app: appConfig,
  supabase: supabaseConfig,
  email: emailConfig,
  maps: mapsConfig,
  openAi: openAiConfig,
  errorReporting: errorReportingConfig,
  analytics: analyticsConfig,
  env: getEnvConfig(),
} as const

// Type exports
export type AppConfig = typeof appConfig
export type SupabaseConfig = typeof supabaseConfig
export type EmailConfig = typeof emailConfig
export type MapsConfig = typeof mapsConfig
export type OpenAiConfig = typeof openAiConfig
export type ErrorReportingConfig = typeof errorReportingConfig
export type AnalyticsConfig = typeof analyticsConfig
export type Config = typeof config

// Development helper to log configuration status
export const logConfigurationStatus = () => {
  if (!isDevelopment()) return

  console.log('⚙️  Configuration Status:')
  console.log(`  • App Name: ${appConfig.name}`)
  console.log(`  • Version: ${appConfig.version}`)
  console.log(`  • Environment: ${env.NODE_ENV}`)
  console.log(`  • URL: ${appConfig.url}`)
  console.log(`  • Features:`)
  Object.entries(appConfig.features).forEach(([key, enabled]) => {
    console.log(`    - ${key}: ${enabled ? '✅' : '❌'}`)
  })
}

// Initialize configuration logging on import
if (isDevelopment()) {
  logConfigurationStatus()
}

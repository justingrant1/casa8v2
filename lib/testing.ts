// Testing utilities for Casa8 application
// This file provides testing helpers without external dependencies

export interface MockUser {
  id: string
  email: string
  user_metadata: {
    firstName: string
    lastName: string
    role: string
  }
  created_at: string
  updated_at: string
}

export interface MockProperty {
  id: string
  title: string
  description: string
  price: number
  bedrooms: number
  bathrooms: number
  square_footage: number
  property_type: string
  address: string
  city: string
  province: string
  postal_code: string
  available_date: string
  pet_policy: string
  smoking_policy: string
  furnished: boolean
  utilities: Record<string, boolean>
  amenities: string[]
  images: string[]
  landlord_id: string
  created_at: string
  updated_at: string
}

export interface MockApplication {
  id: string
  property_id: string
  tenant_id: string
  status: string
  first_name: string
  last_name: string
  email: string
  phone: string
  current_address: string
  employment_status: string
  employer: string
  annual_income: number
  preferred_move_in_date: string
  references: Array<{
    name: string
    relationship: string
    phone: string
    email: string
  }>
  additional_info: string
  documents: string[]
  created_at: string
  updated_at: string
}

export interface MockMessage {
  id: string
  sender_id: string
  recipient_id: string
  property_id: string
  subject: string
  content: string
  message_type: string
  read: boolean
  created_at: string
  updated_at: string
}

// Test data factories
export const testDataFactory = {
  user: (overrides: Partial<MockUser> = {}): MockUser => ({
    id: 'user-123',
    email: 'test@example.com',
    user_metadata: {
      firstName: 'Test',
      lastName: 'User',
      role: 'tenant'
    },
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    ...overrides
  }),

  property: (overrides: Partial<MockProperty> = {}): MockProperty => ({
    id: 'prop-123',
    title: 'Test Property',
    description: 'A beautiful test property',
    price: 2000,
    bedrooms: 2,
    bathrooms: 1,
    square_footage: 1000,
    property_type: 'apartment',
    address: '123 Test St',
    city: 'Toronto',
    province: 'ON',
    postal_code: 'M5V 3L9',
    available_date: '2024-02-01',
    pet_policy: 'allowed',
    smoking_policy: 'not_allowed',
    furnished: false,
    utilities: {
      heat: true,
      electricity: false,
      water: true,
      internet: false,
      parking: true
    },
    amenities: ['gym', 'pool'],
    images: ['image1.jpg', 'image2.jpg'],
    landlord_id: 'landlord-123',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    ...overrides
  }),

  application: (overrides: Partial<MockApplication> = {}): MockApplication => ({
    id: 'app-123',
    property_id: 'prop-123',
    tenant_id: 'user-123',
    status: 'pending',
    first_name: 'Test',
    last_name: 'User',
    email: 'test@example.com',
    phone: '+1234567890',
    current_address: '456 Current St',
    employment_status: 'employed',
    employer: 'Test Company',
    annual_income: 60000,
    preferred_move_in_date: '2024-02-01',
    references: [
      {
        name: 'Reference One',
        relationship: 'Previous Landlord',
        phone: '+1234567890',
        email: 'ref1@example.com'
      }
    ],
    additional_info: 'Additional information',
    documents: ['doc1.pdf'],
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    ...overrides
  }),

  message: (overrides: Partial<MockMessage> = {}): MockMessage => ({
    id: 'msg-123',
    sender_id: 'user-123',
    recipient_id: 'landlord-123',
    property_id: 'prop-123',
    subject: 'Test Message',
    content: 'This is a test message',
    message_type: 'inquiry',
    read: false,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    ...overrides
  })
}

// Test utilities
export const testUtils = {
  // Wait for async operations
  waitForAsync: async (fn: () => boolean, timeout: number = 5000): Promise<void> => {
    const startTime = Date.now()
    while (!fn() && Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    if (!fn()) {
      throw new Error(`Timeout waiting for condition after ${timeout}ms`)
    }
  },

  // Mock local storage
  mockLocalStorage: (): Record<string, string> => {
    const store: Record<string, string> = {}
    
    if (typeof window !== 'undefined') {
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: (key: string) => store[key] || null,
          setItem: (key: string, value: string) => {
            store[key] = value
          },
          removeItem: (key: string) => {
            delete store[key]
          },
          clear: () => {
            Object.keys(store).forEach(key => delete store[key])
          }
        },
        writable: true
      })
    }
    
    return store
  },

  // Mock session storage
  mockSessionStorage: (): Record<string, string> => {
    const store: Record<string, string> = {}
    
    if (typeof window !== 'undefined') {
      Object.defineProperty(window, 'sessionStorage', {
        value: {
          getItem: (key: string) => store[key] || null,
          setItem: (key: string, value: string) => {
            store[key] = value
          },
          removeItem: (key: string) => {
            delete store[key]
          },
          clear: () => {
            Object.keys(store).forEach(key => delete store[key])
          }
        },
        writable: true
      })
    }
    
    return store
  },

  // Mock geolocation
  mockGeolocation: () => {
    const mockGeolocation = {
      getCurrentPosition: (success: (position: any) => void, error?: (error: any) => void) => {
        setTimeout(() => {
          success({
            coords: {
              latitude: 43.6532,
              longitude: -79.3832,
              accuracy: 10
            }
          })
        }, 100)
      },
      watchPosition: (success: (position: any) => void, error?: (error: any) => void) => {
        return 1
      },
      clearWatch: (id: number) => {}
    }
    
    if (typeof global !== 'undefined' && global.navigator) {
      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true
      })
    }
    
    return mockGeolocation
  },

  // Mock file
  createMockFile: (name: string, type: string, content: string = ''): File => {
    const blob = new Blob([content], { type })
    const file = new File([blob], name, { type })
    return file
  },

  // Mock fetch
  mockFetch: (mockResponse: any) => {
    const originalFetch = global.fetch
    
    global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
        blob: async () => new Blob([JSON.stringify(mockResponse)]),
        arrayBuffer: async () => new ArrayBuffer(0),
        headers: new Headers(),
        redirected: false,
        statusText: 'OK',
        type: 'basic' as ResponseType,
        url: typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url,
        clone: function() { return this }
      } as Response)
    }
    
    return () => {
      global.fetch = originalFetch
    }
  },

  // Performance measurement
  measurePerformance: (name: string, fn: () => void): number => {
    const start = performance.now()
    fn()
    const end = performance.now()
    const duration = end - start
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${name} took ${duration.toFixed(2)}ms`)
    }
    
    return duration
  },

  // Async performance measurement
  measureAsyncPerformance: async <T>(name: string, fn: () => Promise<T>): Promise<{ result: T; duration: number }> => {
    const start = performance.now()
    const result = await fn()
    const end = performance.now()
    const duration = end - start
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${name} took ${duration.toFixed(2)}ms`)
    }
    
    return { result, duration }
  },

  // Simple assertion helper
  assert: (condition: boolean, message: string): void => {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`)
    }
  },

  // Deep equality check
  deepEqual: (a: any, b: any): boolean => {
    if (a === b) return true
    
    if (a == null || b == null) return false
    
    if (typeof a !== typeof b) return false
    
    if (typeof a !== 'object') return false
    
    const keysA = Object.keys(a)
    const keysB = Object.keys(b)
    
    if (keysA.length !== keysB.length) return false
    
    for (const key of keysA) {
      if (!keysB.includes(key)) return false
      if (!testUtils.deepEqual(a[key], b[key])) return false
    }
    
    return true
  }
}

// Test scenarios
export const testScenarios = {
  // Mock successful API response
  successfulAPIResponse: (data: any) => {
    return testUtils.mockFetch(data)
  },

  // Mock failed API response
  failedAPIResponse: (error: string, status: number = 500) => {
    const originalFetch = global.fetch
    
    global.fetch = async () => {
      return Promise.resolve({
        ok: false,
        status,
        json: async () => ({ error }),
        text: async () => JSON.stringify({ error }),
        statusText: 'Error',
        headers: new Headers(),
        redirected: false,
        type: 'basic' as ResponseType,
        url: '',
        blob: async () => new Blob([JSON.stringify({ error })]),
        arrayBuffer: async () => new ArrayBuffer(0),
        clone: function() { return this }
      } as Response)
    }
    
    return () => {
      global.fetch = originalFetch
    }
  },

  // Mock authentication states
  authenticatedUser: (user: MockUser = testDataFactory.user()) => {
    return {
      isAuthenticated: true,
      user,
      session: {
        access_token: 'mock-token',
        user
      }
    }
  },

  unauthenticatedUser: () => {
    return {
      isAuthenticated: false,
      user: null,
      session: null
    }
  }
}

// Test cleanup utilities
export const testCleanup = {
  // Clean up DOM if in browser environment
  cleanupDOM: () => {
    if (typeof document !== 'undefined') {
      document.body.innerHTML = ''
    }
  },

  // Clean up timers
  cleanupTimers: () => {
    if (typeof global !== 'undefined' && typeof global.clearTimeout === 'function') {
      // Clear any pending timers by getting the highest timeout ID
      const id = setTimeout(() => {}, 0)
      const numericId = typeof id === 'number' ? id : parseInt(id as any)
      for (let i = 1; i <= numericId; i++) {
        clearTimeout(i)
      }
    }
  },

  // Reset mocks
  resetMocks: () => {
    // Reset fetch to original if it exists
    if (typeof global !== 'undefined' && 'fetch' in global) {
      delete (global as any).fetch
    }
  },

  // Full cleanup
  fullCleanup: () => {
    testCleanup.cleanupDOM()
    testCleanup.cleanupTimers()
    testCleanup.resetMocks()
  }
}

// Validation helpers
export const testValidation = {
  // Validate email format
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  // Validate phone format
  isValidPhone: (phone: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))
  },

  // Validate postal code (Canadian)
  isValidPostalCode: (postalCode: string): boolean => {
    const canadianPostalRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/
    return canadianPostalRegex.test(postalCode)
  },

  // Validate required fields
  hasRequiredFields: (obj: Record<string, any>, requiredFields: string[]): boolean => {
    return requiredFields.every(field => obj[field] !== undefined && obj[field] !== null && obj[field] !== '')
  }
}

// Performance testing
export const performanceTests = {
  // Test component render performance
  testRenderPerformance: (renderFn: () => void, maxDuration: number = 100): boolean => {
    const duration = testUtils.measurePerformance('Component Render', renderFn)
    return duration <= maxDuration
  },

  // Test API response time
  testAPIPerformance: async (apiCall: () => Promise<any>, maxDuration: number = 1000): Promise<boolean> => {
    const { duration } = await testUtils.measureAsyncPerformance('API Call', apiCall)
    return duration <= maxDuration
  },

  // Memory usage simulation
  simulateMemoryUsage: (iterations: number = 1000): number => {
    const startTime = performance.now()
    const objects = []
    
    for (let i = 0; i < iterations; i++) {
      objects.push({
        id: i,
        data: new Array(100).fill(i),
        timestamp: Date.now()
      })
    }
    
    const endTime = performance.now()
    return endTime - startTime
  }
}

// Export everything
export default {
  testDataFactory,
  testUtils,
  testScenarios,
  testCleanup,
  testValidation,
  performanceTests
}

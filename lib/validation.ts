import { z } from 'zod'

// Common validation schemas
export const emailSchema = z.string().email('Please enter a valid email address')
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters')
export const phoneSchema = z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number')
export const nameSchema = z.string().min(2, 'Name must be at least 2 characters')
export const postalCodeSchema = z.string().regex(/^[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d$/, 'Please enter a valid postal code')
export const priceSchema = z.number().min(0, 'Price must be a positive number')
export const urlSchema = z.string().url('Please enter a valid URL')

// Auth validation schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
})

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})

export const forgotPasswordSchema = z.object({
  email: emailSchema
})

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})

// Profile validation schemas
export const profileSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: phoneSchema.optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  dateOfBirth: z.string().optional(),
  profileImage: z.string().optional()
})

export const tenantOnboardingSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  phone: phoneSchema,
  currentAddress: z.string().min(10, 'Please enter a complete address'),
  employmentStatus: z.enum(['employed', 'self-employed', 'student', 'unemployed', 'retired']),
  annualIncome: z.number().min(0, 'Annual income must be a positive number'),
  preferredMoveInDate: z.string().min(1, 'Please select a move-in date'),
  additionalInfo: z.string().max(1000, 'Additional info must be less than 1000 characters').optional()
})

// Property validation schemas
export const propertySchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000, 'Description must be less than 2000 characters'),
  price: priceSchema,
  bedrooms: z.number().min(0, 'Bedrooms must be 0 or more').max(10, 'Bedrooms must be 10 or less'),
  bathrooms: z.number().min(0, 'Bathrooms must be 0 or more').max(10, 'Bathrooms must be 10 or less'),
  squareFootage: z.number().min(100, 'Square footage must be at least 100').max(10000, 'Square footage must be less than 10000').optional(),
  propertyType: z.enum(['apartment', 'house', 'condo', 'townhouse', 'studio', 'room']),
  address: z.string().min(10, 'Please enter a complete address'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  province: z.string().min(2, 'Province must be at least 2 characters'),
  postalCode: postalCodeSchema,
  availableDate: z.string().min(1, 'Please select an available date'),
  petPolicy: z.enum(['allowed', 'not_allowed', 'cats_only', 'dogs_only', 'case_by_case']),
  smokingPolicy: z.enum(['allowed', 'not_allowed', 'outside_only']),
  furnished: z.boolean(),
  utilities: z.object({
    heat: z.boolean(),
    electricity: z.boolean(),
    water: z.boolean(),
    internet: z.boolean(),
    parking: z.boolean()
  }),
  amenities: z.array(z.string()).optional(),
  images: z.array(z.string()).min(1, 'At least one image is required').max(20, 'Maximum 20 images allowed'),
  videos: z.array(z.string()).max(5, 'Maximum 5 videos allowed').optional()
})

export const propertyUpdateSchema = propertySchema.partial()

// Application validation schemas
export const applicationSchema = z.object({
  propertyId: z.string().uuid('Invalid property ID'),
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  currentAddress: z.string().min(10, 'Please enter a complete address'),
  employmentStatus: z.enum(['employed', 'self-employed', 'student', 'unemployed', 'retired']),
  employer: z.string().min(2, 'Employer name must be at least 2 characters').optional(),
  annualIncome: z.number().min(0, 'Annual income must be a positive number'),
  preferredMoveInDate: z.string().min(1, 'Please select a move-in date'),
  references: z.array(z.object({
    name: nameSchema,
    relationship: z.string().min(2, 'Relationship must be at least 2 characters'),
    phone: phoneSchema,
    email: emailSchema.optional()
  })).min(1, 'At least one reference is required').max(3, 'Maximum 3 references allowed'),
  additionalInfo: z.string().max(1000, 'Additional info must be less than 1000 characters').optional(),
  documents: z.array(z.string()).optional()
})

// Message validation schemas
export const messageSchema = z.object({
  recipientId: z.string().uuid('Invalid recipient ID'),
  propertyId: z.string().uuid('Invalid property ID').optional(),
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(100, 'Subject must be less than 100 characters'),
  content: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message must be less than 2000 characters'),
  messageType: z.enum(['inquiry', 'application', 'general', 'support'])
})

export const contactLandlordSchema = z.object({
  propertyId: z.string().uuid('Invalid property ID'),
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(100, 'Subject must be less than 100 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message must be less than 2000 characters')
})

// Search validation schemas
export const searchSchema = z.object({
  query: z.string().optional(),
  location: z.string().optional(),
  minPrice: z.number().min(0, 'Minimum price must be positive').optional(),
  maxPrice: z.number().min(0, 'Maximum price must be positive').optional(),
  bedrooms: z.number().min(0, 'Bedrooms must be 0 or more').max(10, 'Bedrooms must be 10 or less').optional(),
  bathrooms: z.number().min(0, 'Bathrooms must be 0 or more').max(10, 'Bathrooms must be 10 or less').optional(),
  propertyType: z.enum(['apartment', 'house', 'condo', 'townhouse', 'studio', 'room']).optional(),
  petPolicy: z.enum(['allowed', 'not_allowed', 'cats_only', 'dogs_only', 'case_by_case']).optional(),
  furnished: z.boolean().optional(),
  sortBy: z.enum(['price_asc', 'price_desc', 'date_asc', 'date_desc', 'relevance']).optional(),
  page: z.number().min(1, 'Page must be at least 1').optional(),
  limit: z.number().min(1, 'Limit must be at least 1').max(100, 'Limit must be 100 or less').optional()
}).refine((data) => {
  if (data.minPrice && data.maxPrice) {
    return data.minPrice <= data.maxPrice
  }
  return true
}, {
  message: 'Minimum price must be less than or equal to maximum price',
  path: ['maxPrice']
})

// File upload validation schemas
export const fileUploadSchema = z.object({
  file: z.instanceof(File).refine((file) => file instanceof File, 'Please select a file'),
  type: z.enum(['image', 'video', 'document']),
  maxSize: z.number().optional()
}).refine((data) => {
  if (data.maxSize && data.file.size > data.maxSize) {
    return false
  }
  return true
}, {
  message: 'File size exceeds maximum allowed size',
  path: ['file']
})

export const imageUploadSchema = z.object({
  file: z.instanceof(File).refine((file) => file instanceof File, 'Please select an image'),
  maxSize: z.number().default(5 * 1024 * 1024), // 5MB default
  allowedTypes: z.array(z.string()).default(['image/jpeg', 'image/png', 'image/webp'])
}).refine((data) => {
  return data.file.size <= data.maxSize
}, {
  message: 'Image size exceeds maximum allowed size',
  path: ['file']
}).refine((data) => {
  return data.allowedTypes.includes(data.file.type)
}, {
  message: 'Invalid image type. Please upload JPEG, PNG, or WebP images',
  path: ['file']
})

export const videoUploadSchema = z.object({
  file: z.instanceof(File).refine((file) => file instanceof File, 'Please select a video'),
  maxSize: z.number().default(50 * 1024 * 1024), // 50MB default
  allowedTypes: z.array(z.string()).default(['video/mp4', 'video/webm', 'video/ogg'])
}).refine((data) => {
  return data.file.size <= data.maxSize
}, {
  message: 'Video size exceeds maximum allowed size',
  path: ['file']
}).refine((data) => {
  return data.allowedTypes.includes(data.file.type)
}, {
  message: 'Invalid video type. Please upload MP4, WebM, or OGG videos',
  path: ['file']
})

// Utility functions for validation
export function validateEmail(email: string): boolean {
  return emailSchema.safeParse(email).success
}

export function validatePassword(password: string): boolean {
  return passwordSchema.safeParse(password).success
}

export function validatePhone(phone: string): boolean {
  return phoneSchema.safeParse(phone).success
}

export function validatePostalCode(postalCode: string): boolean {
  return postalCodeSchema.safeParse(postalCode).success
}

export function validateUrl(url: string): boolean {
  return urlSchema.safeParse(url).success
}

// Form validation helper
export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean
  data?: T
  errors?: Record<string, string>
} {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return {
      success: true,
      data: result.data
    }
  }
  
  const errors: Record<string, string> = {}
  result.error.errors.forEach((error) => {
    const path = error.path.join('.')
    errors[path] = error.message
  })
  
  return {
    success: false,
    errors
  }
}

// Sanitization functions
export function sanitizeString(str: string): string {
  return str.trim().replace(/[<>]/g, '')
}

export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function sanitizePhone(phone: string): string {
  return phone.replace(/[^\d\+\-\(\)\s]/g, '')
}

export function sanitizePostalCode(postalCode: string): string {
  return postalCode.replace(/[^A-Za-z0-9\s]/g, '').toUpperCase()
}

export function sanitizePrice(price: string): number {
  const numericValue = price.replace(/[^\d\.]/g, '')
  return parseFloat(numericValue) || 0
}

// Type exports
export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type ProfileFormData = z.infer<typeof profileSchema>
export type TenantOnboardingFormData = z.infer<typeof tenantOnboardingSchema>
export type PropertyFormData = z.infer<typeof propertySchema>
export type ApplicationFormData = z.infer<typeof applicationSchema>
export type MessageFormData = z.infer<typeof messageSchema>
export type ContactLandlordFormData = z.infer<typeof contactLandlordSchema>
export type SearchFormData = z.infer<typeof searchSchema>
export type ImageUploadFormData = z.infer<typeof imageUploadSchema>
export type VideoUploadFormData = z.infer<typeof videoUploadSchema>

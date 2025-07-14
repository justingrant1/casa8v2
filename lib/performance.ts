// Performance optimization utilities

// Image compression and optimization
export interface ImageCompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp'
  maxSizeKB?: number
}

export async function compressImage(
  file: File,
  options: ImageCompressionOptions = {}
): Promise<File> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    format = 'jpeg',
    maxSizeKB = 500
  } = options

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      try {
        // Calculate new dimensions
        let { width, height } = img
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.floor(width * ratio)
          height = Math.floor(height * ratio)
        }

        canvas.width = width
        canvas.height = height

        // Draw and compress
        ctx!.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'))
              return
            }

            // Check if size is within limits
            if (blob.size > maxSizeKB * 1024) {
              // Recursively compress with lower quality
              const newQuality = Math.max(0.1, quality - 0.1)
              if (newQuality < quality) {
                compressImage(file, { ...options, quality: newQuality })
                  .then(resolve)
                  .catch(reject)
                return
              }
            }

            const compressedFile = new File([blob], file.name, {
              type: `image/${format}`,
              lastModified: Date.now()
            })

            resolve(compressedFile)
          },
          `image/${format}`,
          quality
        )
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    img.src = URL.createObjectURL(file)
  })
}

// Lazy loading utility
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  }

  return new IntersectionObserver(callback, defaultOptions)
}

// Debouncing utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), wait)
  }
}

// Throttling utility
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Memory management
export class MemoryManager {
  private static instance: MemoryManager
  private cache = new Map<string, any>()
  private maxSize = 50 // Maximum number of items to cache
  private accessOrder: string[] = []

  private constructor() {}

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager()
    }
    return MemoryManager.instance
  }

  set(key: string, value: any): void {
    // Remove if already exists to update access order
    if (this.cache.has(key)) {
      this.accessOrder = this.accessOrder.filter(k => k !== key)
    }

    // Add to cache and access order
    this.cache.set(key, value)
    this.accessOrder.push(key)

    // Remove oldest if cache is full
    if (this.cache.size > this.maxSize) {
      const oldest = this.accessOrder.shift()!
      this.cache.delete(oldest)
    }
  }

  get(key: string): any {
    if (this.cache.has(key)) {
      // Update access order
      this.accessOrder = this.accessOrder.filter(k => k !== key)
      this.accessOrder.push(key)
      return this.cache.get(key)
    }
    return undefined
  }

  has(key: string): boolean {
    return this.cache.has(key)
  }

  delete(key: string): void {
    this.cache.delete(key)
    this.accessOrder = this.accessOrder.filter(k => k !== key)
  }

  clear(): void {
    this.cache.clear()
    this.accessOrder = []
  }

  size(): number {
    return this.cache.size
  }
}

// Resource preloading
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}

export function preloadImages(srcs: string[]): Promise<void[]> {
  return Promise.all(srcs.map(preloadImage))
}

// Bundle analysis helpers
export function measurePerformance(name: string, fn: () => void): void {
  const start = performance.now()
  fn()
  const end = performance.now()
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`${name} took ${end - start} milliseconds`)
  }
}

export async function measureAsyncPerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now()
  const result = await fn()
  const end = performance.now()
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`${name} took ${end - start} milliseconds`)
  }
  
  return result
}

// Batch operations
export class BatchProcessor<T> {
  private batch: T[] = []
  private batchSize: number
  private flushInterval: number
  private processor: (batch: T[]) => Promise<void>
  private timer: ReturnType<typeof setTimeout> | null = null

  constructor(
    processor: (batch: T[]) => Promise<void>,
    batchSize = 10,
    flushInterval = 1000
  ) {
    this.processor = processor
    this.batchSize = batchSize
    this.flushInterval = flushInterval
  }

  add(item: T): void {
    this.batch.push(item)

    if (this.batch.length >= this.batchSize) {
      this.flush()
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.flushInterval)
    }
  }

  async flush(): Promise<void> {
    if (this.batch.length === 0) return

    const currentBatch = [...this.batch]
    this.batch = []

    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }

    try {
      await this.processor(currentBatch)
    } catch (error) {
      console.error('Batch processing error:', error)
    }
  }
}

// Virtual scrolling utilities
export interface VirtualScrollOptions {
  itemHeight: number
  containerHeight: number
  overscan?: number
}

export function calculateVirtualScrollItems(
  scrollTop: number,
  totalItems: number,
  options: VirtualScrollOptions
) {
  const { itemHeight, containerHeight, overscan = 5 } = options
  
  const visibleItemsCount = Math.ceil(containerHeight / itemHeight)
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    totalItems - 1,
    startIndex + visibleItemsCount + overscan * 2
  )

  return {
    startIndex,
    endIndex,
    visibleItemsCount,
    totalHeight: totalItems * itemHeight,
    offsetY: startIndex * itemHeight
  }
}

// Network optimization
export class NetworkOptimizer {
  private static instance: NetworkOptimizer
  private pendingRequests = new Map<string, Promise<any>>()
  private retryCount = new Map<string, number>()
  private maxRetries = 3
  private retryDelay = 1000

  private constructor() {}

  static getInstance(): NetworkOptimizer {
    if (!NetworkOptimizer.instance) {
      NetworkOptimizer.instance = new NetworkOptimizer()
    }
    return NetworkOptimizer.instance
  }

  async request<T>(
    key: string,
    requestFn: () => Promise<T>,
    options: { cache?: boolean; maxRetries?: number } = {}
  ): Promise<T> {
    const { cache = true, maxRetries = this.maxRetries } = options

    // Return cached request if pending
    if (cache && this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!
    }

    const request = this.executeWithRetry(key, requestFn, maxRetries)
    
    if (cache) {
      this.pendingRequests.set(key, request)
    }

    try {
      const result = await request
      return result
    } finally {
      if (cache) {
        this.pendingRequests.delete(key)
      }
      this.retryCount.delete(key)
    }
  }

  private async executeWithRetry<T>(
    key: string,
    requestFn: () => Promise<T>,
    maxRetries: number
  ): Promise<T> {
    const currentRetry = this.retryCount.get(key) || 0

    try {
      return await requestFn()
    } catch (error) {
      if (currentRetry < maxRetries) {
        this.retryCount.set(key, currentRetry + 1)
        await new Promise(resolve => 
          setTimeout(resolve, this.retryDelay * (currentRetry + 1))
        )
        return this.executeWithRetry(key, requestFn, maxRetries)
      }
      throw error
    }
  }
}

// Browser storage optimization
export class StorageOptimizer {
  private static readonly PREFIX = 'casa8_'
  private static readonly MAX_STORAGE_SIZE = 5 * 1024 * 1024 // 5MB

  static setItem(key: string, value: any, ttl?: number): boolean {
    try {
      const item = {
        value,
        timestamp: Date.now(),
        ttl: ttl ? Date.now() + ttl : undefined
      }

      const serialized = JSON.stringify(item)
      
      // Check storage size
      if (serialized.length > this.MAX_STORAGE_SIZE) {
        console.warn(`Item ${key} exceeds maximum storage size`)
        return false
      }

      localStorage.setItem(this.PREFIX + key, serialized)
      return true
    } catch (error) {
      console.error('Storage error:', error)
      return false
    }
  }

  static getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.PREFIX + key)
      if (!item) return null

      const parsed = JSON.parse(item)
      
      // Check TTL
      if (parsed.ttl && Date.now() > parsed.ttl) {
        this.removeItem(key)
        return null
      }

      return parsed.value
    } catch (error) {
      console.error('Storage retrieval error:', error)
      return null
    }
  }

  static removeItem(key: string): void {
    localStorage.removeItem(this.PREFIX + key)
  }

  static clear(): void {
    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith(this.PREFIX)
    )
    keys.forEach(key => localStorage.removeItem(key))
  }

  static getStorageSize(): number {
    let totalSize = 0
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(this.PREFIX)) {
        totalSize += localStorage.getItem(key)?.length || 0
      }
    })
    return totalSize
  }
}

// Export singleton instances
export const memoryManager = MemoryManager.getInstance()
export const networkOptimizer = NetworkOptimizer.getInstance()

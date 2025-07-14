import { useState, useCallback, useRef, useEffect } from 'react'
import { useLoading as useLoadingContext } from '@/lib/loading-context'

export interface LoadingState {
  isLoading: boolean
  error: Error | null
  data: any
  startTime: number | null
  duration: number | null
}

export interface LoadingOptions {
  timeout?: number
  retries?: number
  retryDelay?: number
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
  onFinally?: () => void
  showGlobalLoader?: boolean
  loadingMessage?: string
  errorMessage?: string
  successMessage?: string
}

export interface UseLoadingReturn<T = any> {
  loading: boolean
  error: Error | null
  data: T | null
  execute: (asyncFn: () => Promise<T>) => Promise<T>
  reset: () => void
  retry: () => void
  cancel: () => void
  isTimedOut: boolean
  duration: number | null
  retryCount: number
  canRetry: boolean
}

export function useLoading<T = any>(
  options: LoadingOptions = {}
): UseLoadingReturn<T> {
  const {
    timeout = 30000,
    retries = 0,
    retryDelay = 1000,
    onSuccess,
    onError,
    onFinally,
    showGlobalLoader = false,
    loadingMessage,
    errorMessage,
    successMessage,
  } = options

  const { setLoading: setGlobalLoading } = useLoadingContext()

  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    error: null,
    data: null,
    startTime: null,
    duration: null,
  })

  const [retryCount, setRetryCount] = useState(0)
  const [isTimedOut, setIsTimedOut] = useState(false)
  const [lastAsyncFn, setLastAsyncFn] = useState<(() => Promise<T>) | null>(null)
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const cancelRef = useRef<(() => void) | null>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
    if (showGlobalLoader) {
      setGlobalLoading('loading.operation', false)
    }
  }, [showGlobalLoader, setGlobalLoading])

  const execute = useCallback(async (asyncFn: () => Promise<T>): Promise<T> => {
    // Cancel any previous operation
    if (cancelRef.current) {
      cancelRef.current()
    }

    // Reset timeout state
    setIsTimedOut(false)
    
    // Store the function for retries
    setLastAsyncFn(() => asyncFn)

    // Set loading state
    const startTime = Date.now()
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      data: null,
      startTime,
      duration: null,
    }))

    // Set global loading if enabled
    if (showGlobalLoader) {
      setGlobalLoading('loading.operation', true)
    }

    let isCancelled = false
    cancelRef.current = () => {
      isCancelled = true
    }

    // Set timeout if specified
    if (timeout > 0) {
      timeoutRef.current = setTimeout(() => {
        if (!isCancelled) {
          setIsTimedOut(true)
          const timeoutError = new Error(`Operation timed out after ${timeout}ms`)
          timeoutError.name = 'TimeoutError'
          
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: timeoutError,
            duration: Date.now() - startTime,
          }))

          if (onError) {
            onError(timeoutError)
          }
          
          cleanup()
        }
      }, timeout)
    }

    try {
      const result = await asyncFn()
      
      if (isCancelled) {
        return result
      }

      const endTime = Date.now()
      const duration = endTime - startTime

      setState(prev => ({
        ...prev,
        isLoading: false,
        data: result,
        duration,
      }))

      // Reset retry count on success
      setRetryCount(0)

      if (onSuccess) {
        onSuccess(result)
      }

      // Success message handling would go here if needed

      return result
    } catch (error) {
      if (isCancelled) {
        throw error
      }

      const endTime = Date.now()
      const duration = endTime - startTime
      const errorObj = error instanceof Error ? error : new Error(String(error))

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorObj,
        duration,
      }))

      if (onError) {
        onError(errorObj)
      }

      // Error message handling would go here if needed

      throw errorObj
    } finally {
      cleanup()
      
      if (onFinally) {
        onFinally()
      }
    }
  }, [
    timeout,
    showGlobalLoader,
    loadingMessage,
    errorMessage,
    successMessage,
    onSuccess,
    onError,
    onFinally,
    setGlobalLoading,
    cleanup,
  ])

  const retry = useCallback(async () => {
    if (!lastAsyncFn || retryCount >= retries) {
      return
    }

    setRetryCount(prev => prev + 1)
    
    if (retryDelay > 0) {
      retryTimeoutRef.current = setTimeout(() => {
        execute(lastAsyncFn)
      }, retryDelay)
    } else {
      await execute(lastAsyncFn)
    }
  }, [lastAsyncFn, retryCount, retries, retryDelay, execute])

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      data: null,
      startTime: null,
      duration: null,
    })
    setRetryCount(0)
    setIsTimedOut(false)
    setLastAsyncFn(null)
    cleanup()
  }, [cleanup])

  const cancel = useCallback(() => {
    if (cancelRef.current) {
      cancelRef.current()
    }
    setState(prev => ({
      ...prev,
      isLoading: false,
      duration: prev.startTime ? Date.now() - prev.startTime : null,
    }))
    cleanup()
  }, [cleanup])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return {
    loading: state.isLoading,
    error: state.error,
    data: state.data,
    execute,
    reset,
    retry,
    cancel,
    isTimedOut,
    duration: state.duration,
    retryCount,
    canRetry: retryCount < retries && !state.isLoading,
  }
}

// Specialized hooks for common use cases
export function useApiLoading<T = any>(options: LoadingOptions = {}) {
  return useLoading<T>({
    timeout: 30000,
    retries: 3,
    retryDelay: 1000,
    showGlobalLoader: true,
    ...options,
  })
}

export function useFormLoading<T = any>(options: LoadingOptions = {}) {
  return useLoading<T>({
    timeout: 15000,
    retries: 1,
    retryDelay: 500,
    showGlobalLoader: false,
    ...options,
  })
}

export function useImageLoading<T = any>(options: LoadingOptions = {}) {
  return useLoading<T>({
    timeout: 60000,
    retries: 2,
    retryDelay: 2000,
    showGlobalLoader: false,
    ...options,
  })
}

export function useSearchLoading<T = any>(options: LoadingOptions = {}) {
  return useLoading<T>({
    timeout: 10000,
    retries: 1,
    retryDelay: 300,
    showGlobalLoader: false,
    ...options,
  })
}

// Utility hook for multiple loading states
export function useMultipleLoading(keys: string[]) {
  const loadingStates = keys.reduce((acc, key) => {
    acc[key] = useLoading()
    return acc
  }, {} as Record<string, UseLoadingReturn>)

  const isAnyLoading = Object.values(loadingStates).some(state => state.loading)
  const hasAnyError = Object.values(loadingStates).some(state => state.error)
  const errors = Object.entries(loadingStates)
    .filter(([, state]) => state.error)
    .reduce((acc, [key, state]) => {
      if (state.error) {
        acc[key] = state.error
      }
      return acc
    }, {} as Record<string, Error>)

  const resetAll = () => {
    Object.values(loadingStates).forEach(state => state.reset())
  }

  const cancelAll = () => {
    Object.values(loadingStates).forEach(state => state.cancel())
  }

  return {
    states: loadingStates,
    isAnyLoading,
    hasAnyError,
    errors,
    resetAll,
    cancelAll,
  }
}

// Hook for sequential loading operations
export function useSequentialLoading<T = any>() {
  const [queue, setQueue] = useState<(() => Promise<T>)[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<T[]>([])
  const [errors, setErrors] = useState<(Error | null)[]>([])
  
  const { loading, error, execute, reset } = useLoading<T>()

  const addToQueue = useCallback((asyncFn: () => Promise<T>) => {
    setQueue(prev => [...prev, asyncFn])
  }, [])

  const executeQueue = useCallback(async () => {
    if (queue.length === 0) return []

    const newResults: T[] = []
    const newErrors: (Error | null)[] = []

    for (let i = 0; i < queue.length; i++) {
      setCurrentIndex(i)
      
      try {
        const result = await execute(queue[i])
        newResults.push(result)
        newErrors.push(null)
      } catch (error) {
        newResults.push(null as T)
        newErrors.push(error as Error)
      }
    }

    setResults(newResults)
    setErrors(newErrors)
    return newResults
  }, [queue, execute])

  const resetQueue = useCallback(() => {
    setQueue([])
    setCurrentIndex(0)
    setResults([])
    setErrors([])
    reset()
  }, [reset])

  const progress = queue.length > 0 ? (currentIndex / queue.length) * 100 : 0

  return {
    loading,
    error,
    queue,
    currentIndex,
    results,
    errors,
    progress,
    addToQueue,
    executeQueue,
    resetQueue,
  }
}

// Hook for parallel loading operations
export function useParallelLoading<T = any>() {
  const [operations, setOperations] = useState<(() => Promise<T>)[]>([])
  const [results, setResults] = useState<(T | null)[]>([])
  const [errors, setErrors] = useState<(Error | null)[]>([])
  const [loading, setLoading] = useState(false)
  
  const executeAll = useCallback(async () => {
    if (operations.length === 0) return []

    setLoading(true)
    setResults(new Array(operations.length).fill(null))
    setErrors(new Array(operations.length).fill(null))

    try {
      const promises = operations.map(async (operation, index) => {
        try {
          const result = await operation()
          setResults(prev => {
            const newResults = [...prev]
            newResults[index] = result
            return newResults
          })
          return result
        } catch (error) {
          setErrors(prev => {
            const newErrors = [...prev]
            newErrors[index] = error as Error
            return newErrors
          })
          throw error
        }
      })

      const results = await Promise.allSettled(promises)
      return results.map((result, index) => 
        result.status === 'fulfilled' ? result.value : null
      )
    } finally {
      setLoading(false)
    }
  }, [operations])

  const addOperation = useCallback((operation: () => Promise<T>) => {
    setOperations(prev => [...prev, operation])
  }, [])

  const reset = useCallback(() => {
    setOperations([])
    setResults([])
    setErrors([])
    setLoading(false)
  }, [])

  const completedCount = results.filter(result => result !== null).length
  const errorCount = errors.filter(error => error !== null).length
  const progress = operations.length > 0 ? (completedCount / operations.length) * 100 : 0

  return {
    loading,
    operations,
    results,
    errors,
    completedCount,
    errorCount,
    progress,
    addOperation,
    executeAll,
    reset,
  }
}

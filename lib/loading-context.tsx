'use client'

import { createContext, useContext, useCallback, useReducer, ReactNode } from 'react'

interface LoadingState {
  [key: string]: boolean
}

interface LoadingContextType {
  loading: LoadingState
  setLoading: (key: string, isLoading: boolean) => void
  isLoading: (key: string) => boolean
  isAnyLoading: () => boolean
  clearLoading: () => void
  withLoading: <T>(key: string, fn: () => Promise<T>) => Promise<T>
}

type LoadingAction = 
  | { type: 'SET_LOADING'; key: string; isLoading: boolean }
  | { type: 'CLEAR_LOADING' }

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

function loadingReducer(state: LoadingState, action: LoadingAction): LoadingState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        [action.key]: action.isLoading
      }
    case 'CLEAR_LOADING':
      return {}
    default:
      return state
  }
}

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [loading, dispatch] = useReducer(loadingReducer, {})

  const setLoading = useCallback((key: string, isLoading: boolean) => {
    dispatch({ type: 'SET_LOADING', key, isLoading })
  }, [])

  const isLoading = useCallback((key: string) => {
    return loading[key] || false
  }, [loading])

  const isAnyLoading = useCallback(() => {
    return Object.values(loading).some(isLoading => isLoading)
  }, [loading])

  const clearLoading = useCallback(() => {
    dispatch({ type: 'CLEAR_LOADING' })
  }, [])

  const withLoading = useCallback(
    async function <T>(key: string, fn: () => Promise<T>): Promise<T> {
      try {
        setLoading(key, true)
        const result = await fn()
        return result
      } finally {
        setLoading(key, false)
      }
    },
    [setLoading]
  )

  const value: LoadingContextType = {
    loading,
    setLoading,
    isLoading,
    isAnyLoading,
    clearLoading,
    withLoading
  }

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  const context = useContext(LoadingContext)
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}

// Common loading keys for consistency
export const LOADING_KEYS = {
  // Auth
  AUTH_LOGIN: 'auth.login',
  AUTH_SIGNUP: 'auth.signup',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_PROFILE: 'auth.profile',
  AUTH_ONBOARDING: 'auth.onboarding',
  
  // Properties
  PROPERTIES_FETCH: 'properties.fetch',
  PROPERTIES_SEARCH: 'properties.search',
  PROPERTY_FETCH: 'property.fetch',
  PROPERTY_CREATE: 'property.create',
  PROPERTY_UPDATE: 'property.update',
  PROPERTY_DELETE: 'property.delete',
  
  // Applications
  APPLICATION_SUBMIT: 'application.submit',
  APPLICATION_FETCH: 'application.fetch',
  APPLICATION_UPDATE: 'application.update',
  
  // Messages
  MESSAGE_SEND: 'message.send',
  MESSAGE_FETCH: 'message.fetch',
  MESSAGE_MARK_READ: 'message.markRead',
  
  // Favorites
  FAVORITE_ADD: 'favorite.add',
  FAVORITE_REMOVE: 'favorite.remove',
  FAVORITE_FETCH: 'favorite.fetch',
  
  // File uploads
  FILE_UPLOAD: 'file.upload',
  IMAGE_UPLOAD: 'image.upload',
  VIDEO_UPLOAD: 'video.upload',
  
  // Location
  LOCATION_SEARCH: 'location.search',
  LOCATION_GEOCODE: 'location.geocode',
  
  // General
  INITIAL_LOAD: 'initial.load',
  FORM_SUBMIT: 'form.submit',
  DATA_REFRESH: 'data.refresh'
} as const

// Hook for specific loading operations
export function useLoadingOperation(key: string) {
  const { isLoading, setLoading, withLoading } = useLoading()
  
  return {
    isLoading: isLoading(key),
    setLoading: (loading: boolean) => setLoading(key, loading),
    withLoading: function <T>(fn: () => Promise<T>) {
      return withLoading(key, fn)
    }
  }
}

// Hook for auth loading states
export function useAuthLoading() {
  const { isLoading } = useLoading()
  
  return {
    isLoginLoading: isLoading(LOADING_KEYS.AUTH_LOGIN),
    isSignupLoading: isLoading(LOADING_KEYS.AUTH_SIGNUP),
    isLogoutLoading: isLoading(LOADING_KEYS.AUTH_LOGOUT),
    isProfileLoading: isLoading(LOADING_KEYS.AUTH_PROFILE),
    isOnboardingLoading: isLoading(LOADING_KEYS.AUTH_ONBOARDING)
  }
}

// Hook for property loading states
export function usePropertyLoading() {
  const { isLoading } = useLoading()
  
  return {
    isPropertiesLoading: isLoading(LOADING_KEYS.PROPERTIES_FETCH),
    isSearchLoading: isLoading(LOADING_KEYS.PROPERTIES_SEARCH),
    isPropertyLoading: isLoading(LOADING_KEYS.PROPERTY_FETCH),
    isCreateLoading: isLoading(LOADING_KEYS.PROPERTY_CREATE),
    isUpdateLoading: isLoading(LOADING_KEYS.PROPERTY_UPDATE),
    isDeleteLoading: isLoading(LOADING_KEYS.PROPERTY_DELETE)
  }
}

// Hook for application loading states
export function useApplicationLoading() {
  const { isLoading } = useLoading()
  
  return {
    isSubmitLoading: isLoading(LOADING_KEYS.APPLICATION_SUBMIT),
    isFetchLoading: isLoading(LOADING_KEYS.APPLICATION_FETCH),
    isUpdateLoading: isLoading(LOADING_KEYS.APPLICATION_UPDATE)
  }
}

// Hook for message loading states
export function useMessageLoading() {
  const { isLoading } = useLoading()
  
  return {
    isSendLoading: isLoading(LOADING_KEYS.MESSAGE_SEND),
    isFetchLoading: isLoading(LOADING_KEYS.MESSAGE_FETCH),
    isMarkReadLoading: isLoading(LOADING_KEYS.MESSAGE_MARK_READ)
  }
}

// Hook for favorite loading states
export function useFavoriteLoading() {
  const { isLoading } = useLoading()
  
  return {
    isAddLoading: isLoading(LOADING_KEYS.FAVORITE_ADD),
    isRemoveLoading: isLoading(LOADING_KEYS.FAVORITE_REMOVE),
    isFetchLoading: isLoading(LOADING_KEYS.FAVORITE_FETCH)
  }
}

// Hook for file upload loading states
export function useFileUploadLoading() {
  const { isLoading } = useLoading()
  
  return {
    isFileUploadLoading: isLoading(LOADING_KEYS.FILE_UPLOAD),
    isImageUploadLoading: isLoading(LOADING_KEYS.IMAGE_UPLOAD),
    isVideoUploadLoading: isLoading(LOADING_KEYS.VIDEO_UPLOAD)
  }
}

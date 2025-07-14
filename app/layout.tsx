import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth'
import { FavoritesProvider } from '@/lib/favorites-context'
import { LoadingProvider } from '@/lib/loading-context'
import { Toaster } from '@/components/ui/sonner'
import ErrorBoundary from '@/components/error-boundary'
import { ErrorReporter } from '@/lib/error-reporting'

export const metadata: Metadata = {
  title: 'Casa8 - Find Your Perfect Home',
  description: 'Discover amazing properties for rent. Whether you\'re a tenant looking for your next home or a landlord wanting to list your property, we\'ve got you covered.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary onError={(error, errorInfo) => ErrorReporter.report(error, { errorInfo })}>
          <AuthProvider>
            <LoadingProvider>
              <FavoritesProvider>
                {children}
                <Toaster />
              </FavoritesProvider>
            </LoadingProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}

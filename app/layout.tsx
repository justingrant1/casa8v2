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
      <head>
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-00VLD4SBYF"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-00VLD4SBYF');
            `,
          }}
        />
      </head>
      <body>
        <ErrorBoundary>
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

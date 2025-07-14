import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth'
import { FavoritesProvider } from '@/lib/favorites-context'
import { LoadingProvider } from '@/lib/loading-context'
import { Toaster } from '@/components/ui/sonner'
import ErrorBoundary from '@/components/error-boundary'
import { ErrorReporter } from '@/lib/error-reporting'

export const metadata: Metadata = {
  title: 'Casa8 - Section 8 Housing & Affordable Rentals | Find HUD Approved Properties',
  description: 'Find Section 8 approved rentals, affordable housing, and HUD properties near you. Over 10,000 verified listings nationwide. Search by city, bedrooms, and voucher acceptance.',
  keywords: 'Section 8 housing, affordable rentals, HUD approved properties, housing vouchers, low income housing, subsidized housing, rental assistance, affordable apartments',
  authors: [{ name: 'Casa8 Team' }],
  creator: 'Casa8',
  publisher: 'Casa8',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://casa8.vercel.app',
    siteName: 'Casa8',
    title: 'Casa8 - Section 8 Housing & Affordable Rentals',
    description: 'Find Section 8 approved rentals and affordable housing nationwide. Over 10,000 verified properties that accept housing vouchers.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Casa8 - Find Section 8 Housing and Affordable Rentals',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Casa8 - Section 8 Housing & Affordable Rentals',
    description: 'Find Section 8 approved rentals and affordable housing nationwide. Over 10,000 verified properties.',
    images: ['/og-image.jpg'],
    creator: '@casa8rentals',
  },
  verification: {
    google: 'your-google-verification-code',
  },
  alternates: {
    canonical: 'https://casa8.vercel.app',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        {/* Essential Meta Tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#3b82f6" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />

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

        {/* Structured Data for Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Casa8',
              url: 'https://casa8.vercel.app',
              logo: 'https://casa8.vercel.app/logo.png',
              description: 'Section 8 housing and affordable rental marketplace connecting tenants with HUD approved properties',
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'customer service',
                url: 'https://casa8.vercel.app/contact'
              },
              sameAs: [
                'https://facebook.com/casa8rentals',
                'https://twitter.com/casa8rentals',
                'https://instagram.com/casa8rentals'
              ]
            })
          }}
        />

        {/* Structured Data for Website */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Casa8',
              url: 'https://casa8.vercel.app',
              description: 'Find Section 8 approved rentals and affordable housing nationwide',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://casa8.vercel.app/search?q={search_term_string}',
                'query-input': 'required name=search_term_string'
              }
            })
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

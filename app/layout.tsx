import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth'
import { Toaster } from '@/components/ui/sonner'

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
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}

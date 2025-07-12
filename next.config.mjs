/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Prevent auth state caching issues
  serverExternalPackages: ['@supabase/supabase-js'],
  // Disable caching for auth-related routes
  async headers() {
    return [
      {
        source: '/(dashboard|login|register|favorites)/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
        ],
      },
    ]
  },
}

export default nextConfig

import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://casa8.vercel.app'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/profile',
          '/settings', 
          '/favorites',
          '/login',
          '/forgot-password',
          '/apply/',
          '/api/',
          '/*?sort=*',
          '/*?page=*',
          '/*&sort=*',
          '/*&page=*',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/dashboard',
          '/profile', 
          '/settings',
          '/favorites',
          '/login',
          '/forgot-password',
          '/apply/',
          '/api/',
        ],
        crawlDelay: 0,
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: [
          '/dashboard',
          '/profile',
          '/settings',
          '/favorites', 
          '/login',
          '/forgot-password',
          '/apply/',
          '/api/',
        ],
        crawlDelay: 1,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}

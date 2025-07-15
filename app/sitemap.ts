import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.casa8.com'
  const lastModified = new Date()

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/search`,
      lastModified,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/register`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/list-property`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified,
      changeFrequency: 'yearly' as const,
      priority: 0.4,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified,
      changeFrequency: 'yearly' as const,
      priority: 0.4,
    },
  ]

  // Location-based search pages for major cities
  const majorCities = [
    { city: 'New York', state: 'NY' },
    { city: 'Los Angeles', state: 'CA' },
    { city: 'Chicago', state: 'IL' },
    { city: 'Houston', state: 'TX' },
    { city: 'Phoenix', state: 'AZ' },
    { city: 'Philadelphia', state: 'PA' },
    { city: 'San Antonio', state: 'TX' },
    { city: 'San Diego', state: 'CA' },
    { city: 'Dallas', state: 'TX' },
    { city: 'San Jose', state: 'CA' },
    { city: 'Austin', state: 'TX' },
    { city: 'Jacksonville', state: 'FL' },
    { city: 'Fort Worth', state: 'TX' },
    { city: 'Columbus', state: 'OH' },
    { city: 'Charlotte', state: 'NC' },
    { city: 'San Francisco', state: 'CA' },
    { city: 'Indianapolis', state: 'IN' },
    { city: 'Seattle', state: 'WA' },
    { city: 'Denver', state: 'CO' },
    { city: 'Washington', state: 'DC' },
    { city: 'Boston', state: 'MA' },
    { city: 'El Paso', state: 'TX' },
    { city: 'Detroit', state: 'MI' },
    { city: 'Nashville', state: 'TN' },
    { city: 'Portland', state: 'OR' },
    { city: 'Memphis', state: 'TN' },
    { city: 'Oklahoma City', state: 'OK' },
    { city: 'Las Vegas', state: 'NV' },
    { city: 'Louisville', state: 'KY' },
    { city: 'Baltimore', state: 'MD' },
    { city: 'Milwaukee', state: 'WI' },
    { city: 'Albuquerque', state: 'NM' },
    { city: 'Tucson', state: 'AZ' },
    { city: 'Fresno', state: 'CA' },
    { city: 'Sacramento', state: 'CA' },
    { city: 'Kansas City', state: 'MO' },
    { city: 'Long Beach', state: 'CA' },
    { city: 'Mesa', state: 'AZ' },
    { city: 'Atlanta', state: 'GA' },
    { city: 'Colorado Springs', state: 'CO' },
    { city: 'Virginia Beach', state: 'VA' },
    { city: 'Raleigh', state: 'NC' },
    { city: 'Omaha', state: 'NE' },
    { city: 'Miami', state: 'FL' },
    { city: 'Oakland', state: 'CA' },
    { city: 'Minneapolis', state: 'MN' },
    { city: 'Tulsa', state: 'OK' },
    { city: 'Cleveland', state: 'OH' },
    { city: 'Wichita', state: 'KS' },
    { city: 'Arlington', state: 'TX' },
  ]

  const cityPages = majorCities.map(({ city, state }) => ({
    url: `${baseUrl}/search?location=${encodeURIComponent(`${city}, ${state}`)}`,
    lastModified,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  // Bedroom-specific search pages
  const bedroomPages = [
    {
      url: `${baseUrl}/search?bedrooms=studio`,
      lastModified,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/search?bedrooms=1`,
      lastModified,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/search?bedrooms=2`,
      lastModified,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/search?bedrooms=3`,
      lastModified,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/search?bedrooms=4`,
      lastModified,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/search?bedrooms=5-plus`,
      lastModified,
      changeFrequency: 'daily' as const,
      priority: 0.6,
    },
  ]

  // Combine all pages
  return [...staticPages, ...cityPages, ...bedroomPages]
}

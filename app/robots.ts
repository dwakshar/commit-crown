import type { MetadataRoute } from 'next'

import { getAppUrl } from '@/src/lib/appUrl'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getAppUrl()

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/*', '/auth/*'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}

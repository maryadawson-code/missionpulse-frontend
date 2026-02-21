/**
 * robots.txt — Allow public pages, block dashboard and API routes.
 */
import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://missionpulse.io'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/plans', '/8a-toolkit', '/login', '/signup'],
        disallow: [
          '/api/',
          '/pipeline/',
          '/settings/',
          '/admin/',
          '/war-room/',
          '/ai-chat/',
          '/documents/',
          '/proposals/',
          '/compliance/',
          '/pricing/',
          '/strategy/',
          '/workflow/',
          '/playbook/',
          '/integrations/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}

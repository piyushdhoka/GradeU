import { MetadataRoute } from 'next';
import { siteConfig } from '@lib/metaConfig';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: [
        '/',
        '/courses',
        '/labs',
        '/community',
        '/videos',
        '/about',
        '/contact',
        '/privacy',
        '/terms',
        '/disclaimer',
        '/logo.png',
        '/og.png',
        '/favicon.ico',
      ],
      disallow: ['/dashboard/', '/api/', '/verify/', '/onboarding/', '/profile/'],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}

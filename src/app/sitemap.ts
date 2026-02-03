import { MetadataRoute } from 'next';
import { siteConfig } from '@lib/metaConfig';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.url;
  const lastModified = new Date();

  return [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/courses`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/labs`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/community`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/videos`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];
}

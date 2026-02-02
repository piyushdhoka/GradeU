import { MetadataRoute } from 'next'
import { siteConfig } from '@lib/metaConfig'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = siteConfig.url
    const lastModified = new Date()

    return [
        {
            url: baseUrl,
            lastModified,
            changeFrequency: 'always',
            priority: 1,
        },
        {
            url: `${baseUrl}/login`,
            lastModified,
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/register`,
            lastModified,
            changeFrequency: 'monthly',
            priority: 0.8,
        },
    ]
}

import { MetadataRoute } from 'next'
import { siteConfig } from '@lib/metaConfig'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/dashboard/', '/api/'],
        },
        sitemap: `${siteConfig.url}/sitemap.xml`,
    }
}

import { MetadataRoute } from 'next'
import { siteConfig } from '@lib/metaConfig'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: ['/', '/opengraph-image.png', '/twitter-image.png'],
            disallow: ['/dashboard/', '/api/', '/verify/'],
        },
        sitemap: `${siteConfig.url}/sitemap.xml`,
    }
}

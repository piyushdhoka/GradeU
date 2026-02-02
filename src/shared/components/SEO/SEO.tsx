import React, { useEffect } from 'react';
import { siteConfig } from '../../lib/metaConfig';

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string[];
    ogImage?: string;
    ogType?: string;
    canonicalUrl?: string;
}

export const SEO: React.FC<SEOProps> = ({
    title,
    description,
    keywords,
    ogImage,
    ogType,
    canonicalUrl,
}) => {
    const fullTitle = !title || title.toLowerCase() === siteConfig.name.toLowerCase()
        ? siteConfig.name
        : `${title} | ${siteConfig.name}`;
    const metaDescription = description || siteConfig.description;
    const metaKeywords = keywords ? `${siteConfig.keywords.join(', ')}, ${keywords.join(', ')}` : siteConfig.keywords.join(', ');
    const metaOgImage = ogImage || siteConfig.ogImage;
    const metaOgType = ogType || 'website';

    useEffect(() => {
        // Update Title
        document.title = fullTitle;

        // Helper to update or create meta tags
        const updateMetaTag = (name: string, content: string, property: boolean = false) => {
            let el = document.querySelector(property ? `meta[property="${name}"]` : `meta[name="${name}"]`);
            if (el) {
                el.setAttribute('content', content);
            } else {
                const newMeta = document.createElement('meta');
                if (property) {
                    newMeta.setAttribute('property', name);
                } else {
                    newMeta.setAttribute('name', name);
                }
                newMeta.setAttribute('content', content);
                document.head.appendChild(newMeta);
            }
        };

        const updateLinkTag = (rel: string, href: string) => {
            let el = document.querySelector(`link[rel="${rel}"]`);
            if (el) {
                el.setAttribute('href', href);
            } else {
                const newLink = document.createElement('link');
                newLink.setAttribute('rel', rel);
                newLink.setAttribute('href', href);
                document.head.appendChild(newLink);
            }
        };

        // Standard Meta Tags
        updateMetaTag('description', metaDescription);
        updateMetaTag('keywords', metaKeywords);
        updateMetaTag('author', siteConfig.author.name);

        // Open Graph Tags
        updateMetaTag('og:title', fullTitle, true);
        updateMetaTag('og:description', metaDescription, true);
        updateMetaTag('og:type', metaOgType, true);
        updateMetaTag('og:image', metaOgImage, true);
        updateMetaTag('og:url', canonicalUrl || window.location.href, true);
        updateMetaTag('og:site_name', siteConfig.name, true);

        // Twitter Tags
        updateMetaTag('twitter:card', 'summary_large_image');
        updateMetaTag('twitter:title', fullTitle);
        updateMetaTag('twitter:description', metaDescription);
        updateMetaTag('twitter:image', metaOgImage);

        // Canonical Link
        if (canonicalUrl) {
            updateLinkTag('canonical', canonicalUrl);
        }

    }, [fullTitle, metaDescription, metaKeywords, metaOgImage, metaOgType, canonicalUrl]);

    return null; // This component doesn't render anything to the DOM
};

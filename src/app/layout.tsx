import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { AuthProvider } from "@context/AuthContext";
import { OnboardingGuard } from "@components/auth/OnboardingGuard";
import "./globals.css";

const inter = Inter({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-space",
});

export const viewport = {
    themeColor: "#6EDB80",
};

import { siteConfig } from "@lib/metaConfig";

export const metadata: Metadata = {
    metadataBase: new URL(siteConfig.url),
    title: {
        default: siteConfig.title,
        template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
    keywords: siteConfig.keywords,
    authors: [siteConfig.author],
    creator: siteConfig.creator,
    icons: {
        icon: [
            { url: "/favicon.ico" },
            { url: "/logo.png", sizes: "192x192", type: "image/png" },
        ],
        apple: "/logo.png",
    },
    openGraph: {
        title: siteConfig.title,
        description: siteConfig.description,
        url: siteConfig.url,
        siteName: siteConfig.name,
        locale: 'en_US',
        type: 'website',
        images: [
            {
                url: `${siteConfig.url}/og.png`,
                width: 1200,
                height: 630,
                alt: 'GradeU - Master Any Subject With Hands-on Labs',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: siteConfig.title,
        description: siteConfig.description,
        creator: '@gradeu',
        images: [`${siteConfig.url}/og.png`],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
};

import Script from "next/script";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`dark ${inter.variable} ${spaceGrotesk.variable}`}>
            <body className={`${inter.className} antialiased bg-[#0F1115] text-white`}>
                <AuthProvider>
                    <OnboardingGuard />
                    {children}
                </AuthProvider>
                
                {/* Umami Analytics */}
                {process.env.NEXT_PUBLIC_UMAMI_SRC && process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
                    <Script
                        src={process.env.NEXT_PUBLIC_UMAMI_SRC}
                        data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
                        strategy="lazyOnload"
                    />
                )}
            </body>
        </html>
    );
}

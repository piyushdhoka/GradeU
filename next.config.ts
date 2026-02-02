import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: 'drive.google.com',
            },
            {
                protocol: 'https',
                hostname: 'plus.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: 'ik.imagekit.io',
            }
        ],
    },
    // Proxies for backend
    async rewrites() {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;


        const target = backendUrl || 'http://localhost:4000';


        if (process.env.NODE_ENV === 'production' && !backendUrl) {
            return [];
        }

        return [
            {
                source: '/api/:path*',
                destination: `${target}/api/:path*`,
            },
            {
                source: '/proxy/:path*',
                destination: `${target}/proxy/:path*`,
            },
            {
                source: '/proctor-logs/:path*',
                destination: `${target}/proctor-logs/:path*`,
            },
            {
                source: '/test-models/:path*',
                destination: `${target}/test-models/:path*`,
            },
        ];
    },
};

export default nextConfig;

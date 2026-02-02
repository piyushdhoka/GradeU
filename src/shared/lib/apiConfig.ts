
export function getBackendUrl(): string {
    
    const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        process.env.VITE_API_URL ||
        '';

    return backendUrl;
}

/**
 * Get the full API URL for a given path.
 * @param path - API path starting with /api (e.g., '/api/student/courses')
 * @returns Full URL or relative path
 */
export function getApiUrl(path: string): string {
    const baseUrl = getBackendUrl();

    // If no base URL, use relative path (works with Next.js rewrites)
    if (!baseUrl) {
        return path;
    }

    // Ensure no double slashes
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    return `${cleanBase}${cleanPath}`;
}


export function isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
}

/**
 * Check if backend URL is configured
 */
export function hasBackendUrl(): boolean {
    return Boolean(process.env.NEXT_PUBLIC_BACKEND_URL || process.env.VITE_API_URL);
}

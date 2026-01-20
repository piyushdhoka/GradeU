/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly NEXT_PUBLIC_SUPABASE_URL: string
    readonly NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: string
    readonly VITE_SUPABASE_SERVICE_ROLE_KEY: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

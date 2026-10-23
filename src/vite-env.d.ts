/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly NEXT_PUBLIC_SUPABASE_URL: string
    readonly NEXT_PUBLIC_SUPABASE_ANON_KEY: string
    readonly VITE_APP_ENV: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

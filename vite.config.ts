import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    return {
        root: rootDir,
        plugins: [react(), tailwindcss()],
        define: {
            __APP_ENV__: JSON.stringify(env.APP_ENV),
        },
        server: {
            port: 5174,  // Different port for admin
            proxy: {
                '/api': {
                    target: 'http://localhost:4000',
                    changeOrigin: true,
                },
            },
        },
        build: {
            outDir: 'dist-admin',
            sourcemap: true,
        },
        resolve: {
            alias: {
                // Specific UI component paths must come first
                '@components/ui': resolve(rootDir, 'src/shared/components/ui'),
                '@components/auth': resolve(rootDir, 'src/shared/components/auth'),
                '@components/layout': resolve(rootDir, 'src/shared/components/layout'),
                // Then general paths
                '@components': resolve(rootDir, 'src/components'),
                '@services': resolve(rootDir, 'src/services'),
                '@context': resolve(rootDir, 'src/shared/context'),
                '@lib': resolve(rootDir, 'src/shared/lib'),
                '@types': resolve(rootDir, 'src/shared/types'),
                '@utils': resolve(rootDir, 'src/shared/utils'),
                '@': resolve(rootDir, 'src'),
            },
        },
    };
});

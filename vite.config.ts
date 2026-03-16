import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    server: {
      host: '0.0.0.0',
      port: Number(env.VITE_PORT) || 3000,
      allowedHosts: true,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    },

    build: {
      outDir: 'dist',
      sourcemap: true,
    },

    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './test/vitest.setup.ts',
      include: ['test/**/*.{test,spec}.{ts,tsx}'],

      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov', 'clover'],   // ⭐ important
        reportsDirectory: './coverage',
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['test/**']
      }
    },
  };
});

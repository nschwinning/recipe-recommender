import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Backend target for the dev proxy. Defaults to the Docker Compose service name.
// When running the dev server OUTSIDE Docker, override with
// VITE_PROXY_TARGET=http://localhost:8003 (the backend's host port).
const proxyTarget = process.env.VITE_PROXY_TARGET || 'http://backend:8000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: proxyTarget, changeOrigin: true },
      '/health': { target: proxyTarget, changeOrigin: true },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    css: true,
  },
});

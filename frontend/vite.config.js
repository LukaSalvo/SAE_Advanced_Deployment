import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  cacheDir: '/tmp/vite-cache', // Use a writable temporary directory
  server: {
    host: '0.0.0.0', // Ensure Vite listens on all interfaces in Docker
    port: 3000,
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
  },
});


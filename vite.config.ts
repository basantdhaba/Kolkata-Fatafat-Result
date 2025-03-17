import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import envCompatible from 'vite-plugin-env-compatible';

export default defineConfig({
  base: './', // or '/' for Vercel
  plugins: [react(), envCompatible()],
  server: {
    port: 3000, // Ensure local dev runs on 3000
    open: true,
  },
  build: {
    outDir: 'dist', // Make sure output directory is correctly set
    sourcemap: true, // Helps in debugging errors in Vercel
  },
});

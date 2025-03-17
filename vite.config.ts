import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import envCompatible from 'vite-plugin-env-compatible';

export default defineConfig({
  base: './', // Ensure proper relative paths for deployment
  plugins: [
    react(),
    envCompatible()
  ]
});

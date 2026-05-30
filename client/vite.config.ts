/**
 * vite.config.ts
 * ---------------------------------------------------------------------------
 * Vite configuration for the pixstory React SPA. Enables the React plugin
 * and the new TailwindCSS v4 Vite plugin so `@import "tailwindcss"` in
 * index.css just works without a separate PostCSS config.
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
  },
});

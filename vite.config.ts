import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { TRIP_CONFIG } from './src/trip.config';

// Served from a GitHub Pages sub-path in production; set this to your repo name.
// Local dev stays at "/".
// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/shit/' : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icons/icon-180.png'],
      manifest: {
        name: TRIP_CONFIG.name,
        short_name: TRIP_CONFIG.shortName,
        description: TRIP_CONFIG.tagline,
        theme_color: '#0f172a',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // App shell works offline; live wait fetches just fall back to static data.
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{js,css,html,png,svg,ico,webmanifest}'],
      },
    }),
  ],
  test: {
    environment: 'node',
    // Unit tests only; the Playwright e2e specs (e2e/*.spec.ts) run separately.
    include: ['src/**/*.test.{ts,tsx}'],
  },
}));

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Project is deployed to GitHub Pages at https://<user>.github.io/shit/, so the
// production build is served from the "/shit/" sub-path. Local dev stays at "/".
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
        name: 'Walt Disney World Trip Planner',
        short_name: 'WDW Planner',
        description:
          'Collaboratively plan Magic Kingdom & EPCOT days — tag rides, build routes, and estimate your time.',
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

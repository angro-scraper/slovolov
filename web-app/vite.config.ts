import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg'],
      manifest: {
        name: 'Slovolov — učimo srpska slova',
        short_name: 'Slovolov',
        description: 'Vesela offline škola srpskih slova za decu.',
        theme_color: '#4f46e5',
        background_color: '#fffaf0',
        display: 'standalone',
        orientation: 'portrait',
        icons: [{ src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,json,woff2}'],
        navigateFallback: '/index.html'
      }
    })
  ],
  build: { sourcemap: true }
});

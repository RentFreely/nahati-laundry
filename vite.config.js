import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * `/` — root host (e.g. www.nahatilaundry.online or Namecheap static hosting).
 * `/nahati-laundry/` — GitHub Pages project URL (RentFreely.github.io/nahati-laundry/).
 * CI sets `VITE_BASE_PATH` in `.github/workflows/deploy.yml`.
 */
function normalizeBase(value) {
  if (!value || value === '/') return '/'
  const withLeading = value.startsWith('/') ? value : `/${value}`
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`
}

const BASE = normalizeBase(process.env.VITE_BASE_PATH)

const SITE_ORIGIN = (process.env.VITE_SITE_ORIGIN || 'https://www.nahatilaundry.online').replace(/\/$/, '')

const pathNoTrail = BASE === '/' ? '' : BASE.replace(/\/$/, '')

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Regex-only: Workbox copies urlPattern into sw.js; closures must not reference vite-only vars like pathNoTrail. */
const assetsPathPattern = BASE === '/' ? /^\/assets\// : new RegExp(`^${escapeRegExp(pathNoTrail)}/assets/`)

/** Public site URL for meta / JSON-LD (always apex of live domain, not the GitHub Pages path). */
const CANONICAL = `${SITE_ORIGIN}/`
const OG_IMAGE = `${SITE_ORIGIN}/android-chrome-512x512.png`

const navigateFallback = BASE === '/' ? '/index.html' : `${pathNoTrail}/index.html`

function asset(path) {
  const p = path.replace(/^\//, '')
  if (BASE === '/') return `/${p}`
  return `${pathNoTrail}/${p}`
}

function htmlMetaInject() {
  return {
    name: 'nahati-html-meta',
    transformIndexHtml(html) {
      return html
        .replaceAll('__CANONICAL__', CANONICAL)
        .replaceAll('__OG_IMAGE__', OG_IMAGE)
        .replaceAll('__JSONLD_IMAGE__', OG_IMAGE)
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  base: BASE,
  plugins: [
    htmlMetaInject(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'android-chrome-192x192.png', 'android-chrome-512x512.png'],
      manifest: {
        name: 'Nahati Anytime Laundry',
        short_name: 'Nahati Laundry',
        description: '24/7 professional laundry pickup and delivery in Kampala. Fast, reliable garment care.',
        theme_color: '#0f172a',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: BASE,
        start_url: BASE,
        icons: [
          { src: asset('android-chrome-192x192.png'), sizes: '192x192', type: 'image/png' },
          { src: asset('android-chrome-512x512.png'), sizes: '512x512', type: 'image/png' },
          { src: asset('apple-touch-icon.png'), sizes: '180x180', type: 'image/png', purpose: 'any' },
        ],
      },
      workbox: {
        navigateFallback,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: { cacheName: 'images-cache', expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 } },
          },
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'app-cache' },
          },
          {
            urlPattern: assetsPathPattern,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'app-cache' },
          },
        ],
      },
    }),
  ],
})

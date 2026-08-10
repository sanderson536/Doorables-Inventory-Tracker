const CACHE_NAME = 'steves-doorable-shell-v9'
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/app-icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/maskable-icon-192.png',
  '/maskable-icon-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(precacheAppShell().then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request

  if (request.method !== 'GET') {
    return
  }

  const url = new URL(request.url)

  if (url.origin !== self.location.origin) {
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, '/index.html'))
    return
  }

  event.respondWith(cacheFirst(request))
})

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request)

  if (cachedResponse) {
    return cachedResponse
  }

  const response = await fetch(request)

  if (response.ok) {
    const cache = await caches.open(CACHE_NAME)
    cache.put(request, response.clone())
  }

  return response
}

async function networkFirst(request, fallbackUrl) {
  try {
    const response = await fetch(request)

    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }

    return response
  } catch {
    return (await caches.match(request)) ?? caches.match(fallbackUrl)
  }
}

async function precacheAppShell() {
  const cache = await caches.open(CACHE_NAME)
  await cache.addAll(APP_SHELL)

  const indexResponse = await fetch('/index.html', { cache: 'reload' })

  if (!indexResponse.ok) {
    return
  }

  const indexText = await indexResponse.clone().text()
  await Promise.all([cache.put('/', indexResponse.clone()), cache.put('/index.html', indexResponse)])

  const assetUrls = [...indexText.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((match) => new URL(match[1], self.location.origin))
    .filter((url) => url.origin === self.location.origin)
    .map((url) => url.pathname)
    .filter((pathname) => pathname.startsWith('/assets/'))

  await Promise.all(
    [...new Set(assetUrls)].map(async (assetUrl) => {
      const response = await fetch(assetUrl, { cache: 'reload' })

      if (response.ok) {
        await cache.put(assetUrl, response)
      }
    }),
  )
}

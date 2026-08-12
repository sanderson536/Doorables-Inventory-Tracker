const CACHE_NAME = 'steves-doorable-shell-rc1-hotfix1'
const SCOPE_URL = self.registration.scope
const SCOPE_PATH = new URL(SCOPE_URL).pathname
const APP_SHELL = [
  '',
  'index.html',
  'manifest.webmanifest',
  'favicon.svg',
  'app-icon.svg',
  'icon-192.png',
  'icon-512.png',
  'maskable-icon-192.png',
  'maskable-icon-512.png',
].map((path) => new URL(path, SCOPE_URL).href)

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

  if (url.origin !== self.location.origin || !url.pathname.startsWith(SCOPE_PATH)) {
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, new URL('index.html', SCOPE_URL).href))
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

  const indexUrl = new URL('index.html', SCOPE_URL)
  const indexResponse = await fetch(indexUrl, { cache: 'reload' })

  if (!indexResponse.ok) {
    return
  }

  const indexText = await indexResponse.clone().text()
  await Promise.all([
    cache.put(SCOPE_URL, indexResponse.clone()),
    cache.put(indexUrl.href, indexResponse),
  ])

  const assetUrls = [...indexText.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((match) => new URL(match[1], SCOPE_URL))
    .filter((url) => url.origin === self.location.origin)
    .filter((url) => url.pathname.startsWith(`${SCOPE_PATH}assets/`))
    .map((url) => url.href)

  await Promise.all(
    [...new Set(assetUrls)].map(async (assetUrl) => {
      const response = await fetch(assetUrl, { cache: 'reload' })

      if (response.ok) {
        await cache.put(assetUrl, response)
      }
    }),
  )
}

const CACHE_NAME = "ziva-v1";

// Core assets to cache immediately on install
const PRECACHE_ASSETS = [
    "/",
    "/Ziva-Logo-02.svg",
    "/Ziva_Logo.svg",
    "/icon-192x192.png",
    "/icon-512x512.png",
    "/whatsapp.svg",
];

// Install: precache core assets
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
    );
    self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch: network-first for navigations and API calls, cache-first for static assets
self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== "GET") return;

    // Skip API routes and auth — always go to network
    if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;

    // Navigation requests: network-first with offline fallback
    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    return response;
                })
                .catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
        );
        return;
    }

    // Static assets (images, fonts, CSS, JS): cache-first
    if (
        url.pathname.startsWith("/product-images/") ||
        url.pathname.startsWith("/_next/static/") ||
        url.pathname.match(/\.(png|jpg|jpeg|webp|svg|ico|css|js|woff2?)$/)
    ) {
        event.respondWith(
            caches.match(request).then(
                (cached) =>
                    cached ||
                    fetch(request).then((response) => {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                        return response;
                    })
            )
        );
        return;
    }

    // Everything else: network-first
    event.respondWith(
        fetch(request)
            .then((response) => {
                const clone = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                return response;
            })
            .catch(() => caches.match(request))
    );
});

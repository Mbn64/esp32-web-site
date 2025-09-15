// Service Worker for MBN13 ESP32 Management Platform
// static/sw.js

const CACHE_NAME = 'mbn13-esp32-v1.0.0';
const STATIC_CACHE_NAME = 'mbn13-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'mbn13-dynamic-v1.0.0';

// Assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/dashboard/',
    '/static/css/modern.css',
    '/static/js/modern.js',
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/daisyui@4.4.0/dist/full.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800;900&display=swap',
    'https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js',
    'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js',
    'https://cdn.jsdelivr.net/npm/gsap@3.12.0/dist/gsap.min.js',
    'https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.js',
    'https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.css'
];

// Assets that should be cached dynamically
const DYNAMIC_CACHE_PATTERNS = [
    /^https:\/\/fonts\.googleapis\.com/,
    /^https:\/\/fonts\.gstatic\.com/,
    /^https:\/\/cdnjs\.cloudflare\.com/,
    /^https:\/\/cdn\.jsdelivr\.net/
];

// Assets that should never be cached
const NEVER_CACHE_PATTERNS = [
    /\/admin\//,
    /\/api\/realtime/,
    /\/websocket/,
    /\.json$/
];

// Install event - cache static assets
self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        Promise.all([
            // Cache static assets
            caches.open(STATIC_CACHE_NAME).then(cache => {
                console.log('Service Worker: Caching static assets');
                return cache.addAll(STATIC_ASSETS.map(url => new Request(url, {
                    mode: 'cors',
                    credentials: 'omit'
                })));
            }),
            
            // Skip waiting to activate immediately
            self.skipWaiting()
        ])
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        Promise.all([
            // Clean up old caches
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE_NAME && 
                            cacheName !== DYNAMIC_CACHE_NAME) {
                            console.log('Service Worker: Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            
            // Claim clients to control pages immediately
            self.clients.claim()
        ])
    );
});

// Fetch event - serve from cache when possible
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Skip caching for certain patterns
    if (NEVER_CACHE_PATTERNS.some(pattern => pattern.test(request.url))) {
        return;
    }
    
    // Handle different types of requests
    if (request.method === 'GET') {
        event.respondWith(handleGetRequest(request));
    }
});

async function handleGetRequest(request) {
    const url = new URL(request.url);
    
    // For navigation requests (HTML pages)
    if (request.mode === 'navigate') {
        return handleNavigationRequest(request);
    }
    
    // For static assets
    if (isStaticAsset(request.url)) {
        return handleStaticAssetRequest(request);
    }
    
    // For API requests
    if (url.pathname.startsWith('/api/')) {
        return handleApiRequest(request);
    }
    
    // For external resources
    if (url.origin !== location.origin) {
        return handleExternalRequest(request);
    }
    
    // Default handling
    return fetch(request);
}

async function handleNavigationRequest(request) {
    try {
        // Try network first for navigation
        const networkResponse = await fetch(request);
        
        // If successful, cache the response
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('Failed to fetch external resource:', request.url);
        return new Response('', { status: 404 });
    }
}

function isStaticAsset(url) {
    const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf'];
    return staticExtensions.some(ext => url.includes(ext)) || url.includes('/static/');
}

async function getOfflinePage() {
    try {
        const cache = await caches.open(STATIC_CACHE_NAME);
        const cachedPage = await cache.match('/');
        if (cachedPage) {
            return cachedPage;
        }
    } catch (error) {
        console.log('No offline page available');
    }
    
    // Return a basic offline page
    return new Response(`
        <!DOCTYPE html>
        <html lang="fa" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>آفلاین - MBN13</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    padding: 2rem;
                }
                .container {
                    max-width: 500px;
                    background: rgba(255,255,255,0.1);
                    padding: 3rem;
                    border-radius: 20px;
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255,255,255,0.2);
                }
                .icon {
                    font-size: 4rem;
                    margin-bottom: 1rem;
                    opacity: 0.8;
                }
                h1 { font-size: 2rem; margin-bottom: 1rem; }
                p { opacity: 0.9; line-height: 1.6; margin-bottom: 2rem; }
                .retry-btn {
                    background: rgba(255,255,255,0.2);
                    border: 2px solid rgba(255,255,255,0.3);
                    color: white;
                    padding: 0.75rem 2rem;
                    border-radius: 25px;
                    cursor: pointer;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                }
                .retry-btn:hover {
                    background: rgba(255,255,255,0.3);
                    transform: translateY(-2px);
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="icon">📡</div>
                <h1>اتصال اینترنت برقرار نیست</h1>
                <p>
                    متأسفانه در حال حاضر اتصال اینترنت شما برقرار نیست. 
                    لطفاً اتصال خود را بررسی کرده و دوباره تلاش کنید.
                </p>
                <button class="retry-btn" onclick="window.location.reload()">
                    تلاش مجدد
                </button>
            </div>
        </body>
        </html>
    `, {
        headers: {
            'Content-Type': 'text/html',
            'X-Service-Worker': 'offline-page'
        }
    });
}

async function getFallbackAsset(request) {
    const url = new URL(request.url);
    
    // Return fallbacks for different asset types
    if (url.pathname.endsWith('.css')) {
        return new Response('/* Fallback CSS */', {
            headers: { 'Content-Type': 'text/css' }
        });
    }
    
    if (url.pathname.endsWith('.js')) {
        return new Response('console.log("Fallback JS loaded");', {
            headers: { 'Content-Type': 'application/javascript' }
        });
    }
    
    if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg)$/)) {
        // Return a 1x1 transparent pixel as fallback
        const pixel = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        return fetch(pixel);
    }
    
    return new Response('', { status: 404 });
}

// Background sync for form submissions
self.addEventListener('sync', event => {
    console.log('Service Worker: Background sync triggered:', event.tag);
    
    if (event.tag === 'device-data-sync') {
        event.waitUntil(syncDeviceData());
    } else if (event.tag === 'form-submission-sync') {
        event.waitUntil(syncFormSubmissions());
    }
});

async function syncDeviceData() {
    try {
        // Get pending device data from IndexedDB
        const pendingData = await getPendingDeviceData();
        
        for (const data of pendingData) {
            try {
                const response = await fetch('/api/devices/sync/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': data.csrfToken
                    },
                    body: JSON.stringify(data.payload)
                });
                
                if (response.ok) {
                    await removePendingDeviceData(data.id);
                    console.log('Device data synced successfully');
                } else {
                    console.error('Failed to sync device data:', response.status);
                }
            } catch (error) {
                console.error('Sync error for device data:', error);
            }
        }
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

async function syncFormSubmissions() {
    try {
        const pendingSubmissions = await getPendingFormSubmissions();
        
        for (const submission of pendingSubmissions) {
            try {
                const response = await fetch(submission.url, {
                    method: submission.method,
                    headers: submission.headers,
                    body: submission.body
                });
                
                if (response.ok) {
                    await removePendingFormSubmission(submission.id);
                    
                    // Notify the client about successful sync
                    self.clients.matchAll().then(clients => {
                        clients.forEach(client => {
                            client.postMessage({
                                type: 'SYNC_SUCCESS',
                                data: { submissionId: submission.id }
                            });
                        });
                    });
                }
            } catch (error) {
                console.error('Form submission sync error:', error);
            }
        }
    } catch (error) {
        console.error('Form submission background sync failed:', error);
    }
}

// Push notifications
self.addEventListener('push', event => {
    console.log('Service Worker: Push notification received');
    
    let data = {};
    if (event.data) {
        data = event.data.json();
    }
    
    const options = {
        title: data.title || 'MBN13 ESP32 Management',
        body: data.body || 'شما یک اعلان جدید دارید',
        icon: '/static/images/icon-192x192.png',
        badge: '/static/images/badge-72x72.png',
        image: data.image,
        data: data.data || {},
        actions: [
            {
                action: 'view',
                title: 'مشاهده',
                icon: '/static/images/view-icon.png'
            },
            {
                action: 'dismiss',
                title: 'رد کردن',
                icon: '/static/images/dismiss-icon.png'
            }
        ],
        requireInteraction: data.requireInteraction || false,
        silent: data.silent || false,
        vibrate: data.vibrate || [200, 100, 200],
        timestamp: Date.now(),
        renotify: true,
        tag: data.tag || 'default'
    };
    
    event.waitUntil(
        self.registration.showNotification(options.title, options)
    );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
    console.log('Service Worker: Notification clicked');
    
    event.notification.close();
    
    const action = event.action;
    const data = event.notification.data;
    
    if (action === 'view' || !action) {
        // Open the app or navigate to specific page
        const urlToOpen = data.url || '/dashboard/';
        
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then(clientList => {
                // Check if app is already open
                for (const client of clientList) {
                    if (client.url.includes(urlToOpen) && 'focus' in client) {
                        return client.focus();
                    }
                }
                
                // Open new window if app is not open
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
        );
    } else if (action === 'dismiss') {
        // Just close the notification (already closed above)
        console.log('Notification dismissed');
    }
});

// Message handling from main thread
self.addEventListener('message', event => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'CACHE_URLS':
            event.waitUntil(cacheUrls(data.urls));
            break;
            
        case 'CLEAR_CACHE':
            event.waitUntil(clearCache(data.cacheName));
            break;
            
        case 'GET_CACHE_SIZE':
            event.waitUntil(getCacheSize().then(size => {
                event.ports[0].postMessage({ cacheSize: size });
            }));
            break;
            
        default:
            console.log('Unknown message type:', type);
    }
});

async function cacheUrls(urls) {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    return cache.addAll(urls);
}

async function clearCache(cacheName) {
    if (cacheName) {
        return caches.delete(cacheName);
    } else {
        const cacheNames = await caches.keys();
        return Promise.all(cacheNames.map(name => caches.delete(name)));
    }
}

async function getCacheSize() {
    const cacheNames = await caches.keys();
    let totalSize = 0;
    
    for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        for (const request of requests) {
            const response = await cache.match(request);
            if (response) {
                const blob = await response.blob();
                totalSize += blob.size;
            }
        }
    }
    
    return totalSize;
}

// IndexedDB helper functions for offline storage
async function getPendingDeviceData() {
    // Implementation would depend on your IndexedDB setup
    return [];
}

async function removePendingDeviceData(id) {
    // Implementation would depend on your IndexedDB setup
    console.log('Removing pending device data:', id);
}

async function getPendingFormSubmissions() {
    // Implementation would depend on your IndexedDB setup
    return [];
}

async function removePendingFormSubmission(id) {
    // Implementation would depend on your IndexedDB setup
    console.log('Removing pending form submission:', id);
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', event => {
    if (event.tag === 'device-status-check') {
        event.waitUntil(checkDeviceStatus());
    }
});

async function checkDeviceStatus() {
    try {
        const response = await fetch('/api/devices/status/', {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        if (response.ok) {
            const devices = await response.json();
            
            // Check for devices that went offline
            const offlineDevices = devices.filter(device => 
                device.status === 'offline' && device.wasOnline
            );
            
            // Send notifications for offline devices
            for (const device of offlineDevices) {
                self.registration.showNotification('دستگاه آفلاین شد', {
                    body: `دستگاه ${device.name} از شبکه قطع شده است`,
                    icon: '/static/images/icon-192x192.png',
                    tag: `device-offline-${device.id}`,
                    data: { deviceId: device.id, url: `/devices/${device.id}/` }
                });
            }
        }
    } catch (error) {
        console.error('Device status check failed:', error);
    }
}

console.log('Service Worker: Loaded successfully');
        }
        
        return networkResponse;
    } catch (error) {
        // If network fails, try cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // If both fail, return offline page
        return getOfflinePage();
    }
}

async function handleStaticAssetRequest(request) {
    // Cache first strategy for static assets
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('Failed to fetch static asset:', request.url);
        // Return a fallback for critical assets
        return getFallbackAsset(request);
    }
}

async function handleApiRequest(request) {
    try {
        // Network first for API requests
        const networkResponse = await fetch(request);
        
        // Cache successful GET requests that aren't real-time
        if (networkResponse.ok && 
            request.method === 'GET' && 
            !request.url.includes('realtime')) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // For GET requests, try cache as fallback
        if (request.method === 'GET') {
            const cachedResponse = await caches.match(request);
            if (cachedResponse) {
                // Add a header to indicate this is from cache
                const response = cachedResponse.clone();
                response.headers.set('X-From-Cache', 'true');
                return response;
            }
        }
        
        // Return error response for failed API requests
        return new Response(
            JSON.stringify({
                error: 'Network unavailable',
                message: 'این درخواست در حالت آفلاین قابل دسترسی نیست',
                cached: false
            }),
            {
                status: 503,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Service-Worker': 'true'
                }
            }
        );
    }
}

async function handleExternalRequest(request) {
    // Check if this external resource should be cached
    const shouldCache = DYNAMIC_CACHE_PATTERNS.some(pattern => 
        pattern.test(request.url)
    );
    
    if (!shouldCache) {
        return fetch(request);
    }
    
    // Cache first for external resources like fonts and CDN assets
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request, {
            mode: 'cors',
            credentials: 'omit'
        });
        
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(

// Service Worker for Flow PWA
// Handles offline caching, background sync, and push notifications

const CACHE_NAME = 'flow-pwa-v1';
const STATIC_CACHE = 'flow-static-v1';
const DYNAMIC_CACHE = 'flow-dynamic-v1';
const IMAGES_CACHE = 'flow-images-v1';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/auth/index.html',
  '/auth/register.html',
  '/auth/forgot-password.html',
  '/assets/css/base.css',
  '/assets/css/home.css',
  '/assets/js/firebase-config.js',
  '/assets/js/firebase-auth.js',
  '/assets/js/firebase-data.js',
  '/assets/js/firebase-realtime.js',
  '/assets/js/firebase-offline.js',
  '/assets/js/main.js',
  '/assets/js/i18n.js',
  '/assets/img/logo.png',
  '/manifest.json'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Caching static files...');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('✅ Static files cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Failed to cache static files:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🔧 Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== IMAGES_CACHE) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle network requests with caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Skip Firebase API requests (let them handle their own caching)
  if (url.hostname.includes('firebase') || 
      url.hostname.includes('googleapis') ||
      url.hostname.includes('gstatic')) {
    return;
  }

  event.respondWith(handleRequest(request));
});

// Handle different types of requests with appropriate caching strategies
async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Static files - Cache First strategy
    if (isStaticFile(url.pathname)) {
      return await cacheFirst(request, STATIC_CACHE);
    }
    
    // Images - Cache First with fallback
    if (isImageRequest(request)) {
      return await cacheFirst(request, IMAGES_CACHE);
    }
    
    // API requests - Network First strategy
    if (isApiRequest(url)) {
      return await networkFirst(request, DYNAMIC_CACHE);
    }
    
    // HTML pages - Stale While Revalidate
    if (isHTMLRequest(request)) {
      return await staleWhileRevalidate(request, DYNAMIC_CACHE);
    }
    
    // Default - Network First
    return await networkFirst(request, DYNAMIC_CACHE);
    
  } catch (error) {
    console.error('❌ Request handling failed:', error);
    return await handleRequestError(request, error);
  }
}

// Cache First strategy - serve from cache, fallback to network
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('📦 Serving from cache:', request.url);
      return cachedResponse;
    }
    
    console.log('🌐 Cache miss, fetching:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
      console.log('📦 Cached response:', request.url);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('❌ Cache First failed:', error);
    throw error;
  }
}

// Network First strategy - try network first, fallback to cache
async function networkFirst(request, cacheName) {
  try {
    console.log('🌐 Network First, fetching:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
      console.log('📦 Cached network response:', request.url);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('📴 Network failed, trying cache:', request.url);
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('📦 Serving from cache (network failed):', request.url);
      return cachedResponse;
    }
    
    throw error;
  }
}

// Stale While Revalidate - serve from cache immediately, update cache in background
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Fetch from network in background
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        const responseClone = networkResponse.clone();
        cache.put(request, responseClone);
        console.log('📦 Background cache update:', request.url);
      }
      return networkResponse;
    })
    .catch((error) => {
      console.log('📴 Background fetch failed:', request.url, error);
    });
  
  // Return cached version immediately if available
  if (cachedResponse) {
    console.log('📦 Serving stale cache:', request.url);
    return cachedResponse;
  }
  
  // Wait for network if no cache
  console.log('🌐 No cache, waiting for network:', request.url);
  return await fetchPromise;
}

// Handle request errors with appropriate fallbacks
async function handleRequestError(request, error) {
  const url = new URL(request.url);
  
  // For HTML requests, serve offline page
  if (isHTMLRequest(request)) {
    const cache = await caches.open(STATIC_CACHE);
    const offlinePage = await cache.match('/offline.html');
    if (offlinePage) {
      return offlinePage;
    }
  }
  
  // For images, serve placeholder
  if (isImageRequest(request)) {
    const cache = await caches.open(STATIC_CACHE);
    const placeholder = await cache.match('/assets/img/placeholder.png');
    if (placeholder) {
      return placeholder;
    }
  }
  
  // Default error response
  return new Response(
    JSON.stringify({
      error: 'Network request failed',
      message: 'Please check your internet connection',
      offline: true
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json',
        'X-Offline-Error': 'true'
      }
    }
  );
}

// Background Sync event - handle offline queue processing
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync event:', event.tag);
  
  if (event.tag === 'process-offline-queue') {
    event.waitUntil(processOfflineQueue());
  }
  
  if (event.tag === 'sync-user-data') {
    event.waitUntil(syncUserData());
  }
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('🔔 Push notification received');
  
  const options = {
    body: 'You have a new notification',
    icon: '/assets/img/icon-192x192.png',
    badge: '/assets/img/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };
  
  if (event.data) {
    try {
      const payload = event.data.json();
      options.title = payload.title || 'Flow Notification';
      options.body = payload.body || options.body;
      options.icon = payload.icon || options.icon;
      options.data = { ...options.data, ...payload.data };
    } catch (error) {
      console.error('❌ Error parsing push payload:', error);
      options.title = 'Flow Notification';
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(options.title || 'Flow', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  // Default action - open app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url.includes(self.registration.scope)) {
            return client.focus();
          }
        }
        
        // Open new window
        return clients.openWindow('/');
      })
  );
});

// Message event - communication with main thread
self.addEventListener('message', (event) => {
  console.log('💬 Message received in SW:', event.data);
  
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_UPDATE':
      event.waitUntil(updateCache(payload));
      break;
      
    case 'CLEAR_CACHE':
      event.waitUntil(clearCache(payload.cacheName));
      break;
      
    case 'GET_CACHE_STATUS':
      event.waitUntil(sendCacheStatus());
      break;
      
    default:
      console.log('Unknown message type:', type);
  }
});

// Process offline queue
async function processOfflineQueue() {
  try {
    console.log('🔄 Processing offline queue in background...');
    
    // Get offline queue from IndexedDB or localStorage
    const offlineData = await getOfflineData();
    
    if (offlineData && offlineData.length > 0) {
      // Send message to main thread to process queue
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'PROCESS_OFFLINE_QUEUE',
          payload: { queueLength: offlineData.length }
        });
      });
    }
    
    console.log('✅ Background sync completed');
    
  } catch (error) {
    console.error('❌ Background sync failed:', error);
  }
}

// Sync user data
async function syncUserData() {
  try {
    console.log('🔄 Syncing user data in background...');
    
    // Send message to main thread to sync data
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_USER_DATA',
        payload: { timestamp: Date.now() }
      });
    });
    
    console.log('✅ User data sync completed');
    
  } catch (error) {
    console.error('❌ User data sync failed:', error);
  }
}

// Update cache with new data
async function updateCache(payload) {
  try {
    const { cacheName, url, data } = payload;
    const cache = await caches.open(cacheName);
    
    const response = new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
    
    await cache.put(url, response);
    console.log('📦 Cache updated:', url);
    
  } catch (error) {
    console.error('❌ Cache update failed:', error);
  }
}

// Clear specific cache
async function clearCache(cacheName) {
  try {
    if (cacheName) {
      await caches.delete(cacheName);
      console.log('🗑️ Cache cleared:', cacheName);
    } else {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(name => caches.delete(name))
      );
      console.log('🗑️ All caches cleared');
    }
  } catch (error) {
    console.error('❌ Cache clear failed:', error);
  }
}

// Send cache status to main thread
async function sendCacheStatus() {
  try {
    const cacheNames = await caches.keys();
    const status = {};
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      status[cacheName] = keys.length;
    }
    
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'CACHE_STATUS',
        payload: status
      });
    });
    
  } catch (error) {
    console.error('❌ Cache status failed:', error);
  }
}

// Get offline data from storage
async function getOfflineData() {
  // This would typically read from IndexedDB
  // For now, return empty array
  return [];
}

// Utility functions
function isStaticFile(pathname) {
  return STATIC_FILES.some(file => 
    pathname === file || pathname.endsWith('.css') || pathname.endsWith('.js')
  );
}

function isImageRequest(request) {
  return request.destination === 'image' || 
         /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(request.url);
}

function isHTMLRequest(request) {
  return request.headers.get('accept')?.includes('text/html') ||
         request.url.endsWith('.html') ||
         (request.url.includes('/') && !request.url.includes('.'));
}

function isApiRequest(url) {
  return url.pathname.startsWith('/api/') ||
         url.hostname.includes('firebase') ||
         url.hostname.includes('googleapis');
}

console.log('🔧 Service Worker loaded successfully');
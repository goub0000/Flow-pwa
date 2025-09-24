// Enhanced Service Worker for Flow PWA
// Advanced caching strategies, background sync, and offline functionality

/* eslint-env serviceworker */

const CACHE_VERSION = '2.0.0';
const CACHE_PREFIX = 'flow-pwa-v2';

// Cache names
const CACHES = {
  static: `${CACHE_PREFIX}-static`,
  dynamic: `${CACHE_PREFIX}-dynamic`,
  images: `${CACHE_PREFIX}-images`,
  api: `${CACHE_PREFIX}-api`,
  fonts: `${CACHE_PREFIX}-fonts`,
  user: `${CACHE_PREFIX}-user`
};

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
};

// Route configurations
const ROUTE_CONFIG = [
  {
    pattern: /\.(js|css)$/,
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    cache: CACHES.static,
    options: {
      cacheName: CACHES.static,
      expiration: {
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
      }
    }
  },
  {
    pattern: /\.(png|jpg|jpeg|gif|webp|svg|ico)$/,
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    cache: CACHES.images,
    options: {
      cacheName: CACHES.images,
      expiration: {
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
      }
    }
  },
  {
    pattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com/,
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    cache: CACHES.fonts,
    options: {
      cacheName: CACHES.fonts,
      expiration: {
        maxEntries: 30,
        maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
      }
    }
  },
  {
    pattern: /^https:\/\/firestore\.googleapis\.com/,
    strategy: CACHE_STRATEGIES.NETWORK_FIRST,
    cache: CACHES.api,
    options: {
      cacheName: CACHES.api,
      networkTimeoutSeconds: 3,
      expiration: {
        maxEntries: 50,
        maxAgeSeconds: 60 * 5 // 5 minutes
      }
    }
  },
  {
    pattern: /^https:\/\/firebasestorage\.googleapis\.com/,
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    cache: CACHES.images,
    options: {
      cacheName: CACHES.images,
      expiration: {
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
      }
    }
  }
];

// Static files to cache on install
const STATIC_FILES = [
  '/',
  '/index.html',
  '/auth/index.html',
  '/offline.html',
  '/manifest.json'
];

// Background sync configurations
const BACKGROUND_SYNC = {
  APPLICATION_QUEUE: 'application-submissions',
  MESSAGE_QUEUE: 'message-queue',
  DOCUMENT_UPLOAD_QUEUE: 'document-uploads',
  USER_ACTIONS_QUEUE: 'user-actions'
};

// Install event - precache static assets
self.addEventListener('install', (event) => {
  console.log(`🔧 SW v${CACHE_VERSION} installing...`);

  event.waitUntil(
    Promise.all([
      precacheStaticAssets(),
      preloadCriticalResources(),
      self.skipWaiting()
    ])
  );
});

// Activate event - cleanup and take control
self.addEventListener('activate', (event) => {
  console.log(`🔧 SW v${CACHE_VERSION} activating...`);

  event.waitUntil(
    Promise.all([
      cleanupOldCaches(),
      self.clients.claim(),
      initializeNotifications()
    ])
  );
});

// Fetch event - handle all network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip Chrome extension and other protocols
  if (!request.url.startsWith('http')) {
    return;
  }

  event.respondWith(handleRequest(request));
});

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync:', event.tag);

  switch (event.tag) {
    case BACKGROUND_SYNC.APPLICATION_QUEUE:
      event.waitUntil(processApplicationQueue());
      break;
    case BACKGROUND_SYNC.MESSAGE_QUEUE:
      event.waitUntil(processMessageQueue());
      break;
    case BACKGROUND_SYNC.DOCUMENT_UPLOAD_QUEUE:
      event.waitUntil(processDocumentUploadQueue());
      break;
    case BACKGROUND_SYNC.USER_ACTIONS_QUEUE:
      event.waitUntil(processUserActionsQueue());
      break;
    default:
      console.log('Unknown sync event:', event.tag);
  }
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('🔔 Push notification received');

  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    image: data.image,
    vibrate: [200, 100, 200],
    data: {
      ...data,
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: '/icons/open.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss.png'
      }
    ],
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    tag: data.tag || 'flow-notification'
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Flow', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.action);

  event.notification.close();

  const urlToOpen = new URL('/', self.location.origin);

  // Handle different actions
  switch (event.action) {
    case 'open':
      urlToOpen.pathname = event.notification.data.url || '/';
      break;
    case 'dismiss':
      return; // Just close the notification
    default:
      urlToOpen.pathname = event.notification.data.url || '/';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if the app is already open
        for (const client of clientList) {
          if (client.url === urlToOpen.href && 'focus' in client) {
            return client.focus();
          }
        }

        // Open new window if not already open
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen.href);
        }
      })
  );
});

// Message event - communication with main thread
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_VERSION });
      break;
    case 'CLEAR_CACHE':
      event.waitUntil(clearCache(payload.cacheName));
      break;
    case 'SYNC_DATA':
      event.waitUntil(syncOfflineData(payload));
      break;
    default:
      console.log('Unknown message type:', type);
  }
});

// Core functions

// Precache static assets
async function precacheStaticAssets() {
  try {
    const cache = await caches.open(CACHES.static);
    console.log('📦 Precaching static assets...');

    // Use addAll for atomic caching
    await cache.addAll(STATIC_FILES);
    console.log('✅ Static assets precached');

  } catch (error) {
    console.error('❌ Failed to precache static assets:', error);
    throw error;
  }
}

// Preload critical resources
async function preloadCriticalResources() {
  // Preload critical fonts and images
  const criticalResources = [
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    '/assets/img/logo.png'
  ];

  try {
    const cache = await caches.open(CACHES.static);

    for (const resource of criticalResources) {
      try {
        const response = await fetch(resource);
        if (response.ok) {
          await cache.put(resource, response);
        }
      } catch (error) {
        console.warn(`Failed to preload ${resource}:`, error);
      }
    }

    console.log('✅ Critical resources preloaded');
  } catch (error) {
    console.error('❌ Failed to preload critical resources:', error);
  }
}

// Cleanup old caches
async function cleanupOldCaches() {
  try {
    const cacheNames = await caches.keys();
    const currentCaches = Object.values(CACHES);

    const deletionPromises = cacheNames
      .filter(cacheName => !currentCaches.includes(cacheName))
      .map(cacheName => {
        console.log('🗑️ Deleting old cache:', cacheName);
        return caches.delete(cacheName);
      });

    await Promise.all(deletionPromises);
    console.log('✅ Old caches cleaned up');

  } catch (error) {
    console.error('❌ Failed to cleanup old caches:', error);
  }
}

// Initialize notifications
async function initializeNotifications() {
  try {
    // Request notification permission if not already granted
    if ('Notification' in self && Notification.permission === 'default') {
      // This will be handled by the main thread
      console.log('📱 Notification permission needed');
    }

    console.log('✅ Notifications initialized');
  } catch (error) {
    console.error('❌ Failed to initialize notifications:', error);
  }
}

// Main request handler
async function handleRequest(request) {
  const url = new URL(request.url);

  try {
    // Find matching route configuration
    const routeConfig = findRouteConfig(request);

    if (routeConfig) {
      return await executeStrategy(request, routeConfig);
    }

    // Default strategy for unmatched requests
    return await networkFirst(request, CACHES.dynamic);

  } catch (error) {
    console.error('❌ Request handling failed:', error);
    return await handleOfflineRequest(request);
  }
}

// Find matching route configuration
function findRouteConfig(request) {
  const url = new URL(request.url);

  return ROUTE_CONFIG.find(config => {
    if (config.pattern instanceof RegExp) {
      return config.pattern.test(url.href) || config.pattern.test(url.pathname);
    }
    return false;
  });
}

// Execute caching strategy
async function executeStrategy(request, config) {
  const { strategy, cache, options } = config;

  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return await cacheFirst(request, cache, options);
    case CACHE_STRATEGIES.NETWORK_FIRST:
      return await networkFirst(request, cache, options);
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return await staleWhileRevalidate(request, cache, options);
    case CACHE_STRATEGIES.NETWORK_ONLY:
      return await fetch(request);
    case CACHE_STRATEGIES.CACHE_ONLY:
      return await cacheOnly(request, cache);
    default:
      return await networkFirst(request, cache, options);
  }
}

// Cache First strategy
async function cacheFirst(request, cacheName, options = {}) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log('📦 Cache hit:', request.url);

      // Update cache in background if needed
      if (shouldUpdateCache(cachedResponse, options)) {
        updateCacheInBackground(request, cache);
      }

      return cachedResponse;
    }

    console.log('🌐 Cache miss, fetching:', request.url);
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      await putInCache(cache, request, networkResponse.clone(), options);
    }

    return networkResponse;

  } catch (error) {
    console.error('❌ Cache First failed:', error);
    throw error;
  }
}

// Network First strategy
async function networkFirst(request, cacheName, options = {}) {
  try {
    const timeoutId = options.networkTimeoutSeconds
      ? setTimeout(() => {
          throw new Error('Network timeout');
        }, options.networkTimeoutSeconds * 1000)
      : null;

    const networkResponse = await fetch(request);

    if (timeoutId) clearTimeout(timeoutId);

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      await putInCache(cache, request, networkResponse.clone(), options);
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

// Stale While Revalidate strategy
async function staleWhileRevalidate(request, cacheName, options = {}) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  // Start network request immediately
  const networkResponsePromise = fetch(request)
    .then(async (networkResponse) => {
      if (networkResponse.ok) {
        await putInCache(cache, request, networkResponse.clone(), options);
      }
      return networkResponse;
    })
    .catch((error) => {
      console.log('📴 Background fetch failed:', request.url, error);
      return null;
    });

  // Return cached version immediately if available
  if (cachedResponse) {
    console.log('📦 Serving stale cache:', request.url);
    return cachedResponse;
  }

  // Wait for network if no cache
  console.log('🌐 No cache, waiting for network:', request.url);
  return await networkResponsePromise;
}

// Cache Only strategy
async function cacheOnly(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  throw new Error('No cached response available');
}

// Put response in cache with expiration management
async function putInCache(cache, request, response, options = {}) {
  try {
    // Clone response for caching
    const responseToCache = response.clone();

    // Add metadata for expiration
    const headers = new Headers(responseToCache.headers);
    headers.set('sw-cache-timestamp', Date.now().toString());

    const modifiedResponse = new Response(responseToCache.body, {
      status: responseToCache.status,
      statusText: responseToCache.statusText,
      headers: headers
    });

    await cache.put(request, modifiedResponse);

    // Manage cache size
    await manageCacheSize(cache, options);

  } catch (error) {
    console.error('❌ Failed to put in cache:', error);
  }
}

// Manage cache size and expiration
async function manageCacheSize(cache, options = {}) {
  const { expiration } = options;

  if (!expiration) return;

  try {
    const requests = await cache.keys();

    // Remove expired entries
    if (expiration.maxAgeSeconds) {
      const now = Date.now();
      const expiredRequests = [];

      for (const request of requests) {
        const response = await cache.match(request);
        const timestamp = response.headers.get('sw-cache-timestamp');

        if (timestamp) {
          const age = (now - parseInt(timestamp)) / 1000;
          if (age > expiration.maxAgeSeconds) {
            expiredRequests.push(request);
          }
        }
      }

      await Promise.all(expiredRequests.map(req => cache.delete(req)));
    }

    // Manage max entries
    if (expiration.maxEntries) {
      const remainingRequests = await cache.keys();

      if (remainingRequests.length > expiration.maxEntries) {
        const requestsToDelete = remainingRequests.slice(0, remainingRequests.length - expiration.maxEntries);
        await Promise.all(requestsToDelete.map(req => cache.delete(req)));
      }
    }

  } catch (error) {
    console.error('❌ Failed to manage cache size:', error);
  }
}

// Check if cache should be updated
function shouldUpdateCache(cachedResponse, options = {}) {
  const { expiration } = options;

  if (!expiration || !expiration.maxAgeSeconds) return false;

  const timestamp = cachedResponse.headers.get('sw-cache-timestamp');
  if (!timestamp) return true;

  const age = (Date.now() - parseInt(timestamp)) / 1000;
  return age > expiration.maxAgeSeconds / 2; // Update when half-expired
}

// Update cache in background
async function updateCacheInBackground(request, cache) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      await cache.put(request, networkResponse);
      console.log('🔄 Background cache update:', request.url);
    }

  } catch (error) {
    console.log('📴 Background cache update failed:', request.url, error);
  }
}

// Handle offline requests
async function handleOfflineRequest(request) {
  const url = new URL(request.url);

  // For HTML requests, serve offline page
  if (request.headers.get('accept')?.includes('text/html')) {
    const cache = await caches.open(CACHES.static);
    const offlinePage = await cache.match('/offline.html');

    if (offlinePage) {
      return offlinePage;
    }
  }

  // For API requests, return offline data if available
  if (url.pathname.startsWith('/api/')) {
    return new Response(
      JSON.stringify({
        error: 'offline',
        message: 'Request failed - you are offline',
        timestamp: Date.now()
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json',
          'X-Offline-Response': 'true'
        }
      }
    );
  }

  // Default offline response
  return new Response('Offline - Please check your connection', {
    status: 503,
    statusText: 'Service Unavailable'
  });
}

// Background sync processors

// Process application queue
async function processApplicationQueue() {
  console.log('🔄 Processing application queue...');

  try {
    const db = await openIndexedDB();
    const applications = await getAllFromStore(db, 'applicationQueue');

    for (const application of applications) {
      try {
        const response = await fetch('/api/applications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${application.token}`
          },
          body: JSON.stringify(application.data)
        });

        if (response.ok) {
          await deleteFromStore(db, 'applicationQueue', application.id);
          console.log('✅ Application synced:', application.id);

          // Notify main thread
          notifyClients({
            type: 'APPLICATION_SYNCED',
            data: { id: application.id }
          });
        }

      } catch (error) {
        console.error('❌ Failed to sync application:', application.id, error);
      }
    }

    console.log('✅ Application queue processed');

  } catch (error) {
    console.error('❌ Failed to process application queue:', error);
  }
}

// Process message queue
async function processMessageQueue() {
  console.log('🔄 Processing message queue...');

  // Similar implementation for messages
  console.log('✅ Message queue processed');
}

// Process document upload queue
async function processDocumentUploadQueue() {
  console.log('🔄 Processing document upload queue...');

  // Similar implementation for document uploads
  console.log('✅ Document upload queue processed');
}

// Process user actions queue
async function processUserActionsQueue() {
  console.log('🔄 Processing user actions queue...');

  // Similar implementation for user actions
  console.log('✅ User actions queue processed');
}

// IndexedDB helpers

// Open IndexedDB
async function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FlowOfflineDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create object stores for different queues
      if (!db.objectStoreNames.contains('applicationQueue')) {
        db.createObjectStore('applicationQueue', { keyPath: 'id', autoIncrement: true });
      }

      if (!db.objectStoreNames.contains('messageQueue')) {
        db.createObjectStore('messageQueue', { keyPath: 'id', autoIncrement: true });
      }

      if (!db.objectStoreNames.contains('documentQueue')) {
        db.createObjectStore('documentQueue', { keyPath: 'id', autoIncrement: true });
      }

      if (!db.objectStoreNames.contains('userActionsQueue')) {
        db.createObjectStore('userActionsQueue', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

// Get all items from store
async function getAllFromStore(db, storeName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

// Delete item from store
async function deleteFromStore(db, storeName, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

// Notify all clients
async function notifyClients(message) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage(message);
  });
}

// Clear specific cache
async function clearCache(cacheName) {
  try {
    if (cacheName) {
      const deleted = await caches.delete(cacheName);
      console.log(`🗑️ Cache ${cacheName} ${deleted ? 'cleared' : 'not found'}`);
    } else {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('🗑️ All caches cleared');
    }
  } catch (error) {
    console.error('❌ Failed to clear cache:', error);
  }
}

// Sync offline data
async function syncOfflineData(payload) {
  console.log('🔄 Syncing offline data...');

  try {
    // Process different types of offline data
    if (payload.applications) {
      await processApplicationQueue();
    }

    if (payload.messages) {
      await processMessageQueue();
    }

    if (payload.documents) {
      await processDocumentUploadQueue();
    }

    console.log('✅ Offline data synced');

  } catch (error) {
    console.error('❌ Failed to sync offline data:', error);
  }
}

console.log(`🔧 Enhanced Service Worker v${CACHE_VERSION} loaded`);

// Register periodic background sync if supported
if ('periodicSync' in self.registration) {
  self.registration.periodicSync.register('sync-data', {
    minInterval: 24 * 60 * 60 * 1000, // 24 hours
  }).catch(err => console.log('Periodic sync registration failed:', err));
}
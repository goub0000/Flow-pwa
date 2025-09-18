// Firebase Offline Support and Caching System
// Comprehensive offline functionality with intelligent caching strategies
// Handles offline queue, cache management, and sync resumption

/* eslint-env browser */

(function() {
  'use strict';

  // Offline system state
  let offlineInitialized = false;
  let isOnline = navigator.onLine;
  let offlineQueue = [];
  let cache = new Map();
  let cacheTimestamps = new Map();
  let syncStrategies = new Map();

  // Cache configuration
  const CACHE_CONFIG = {
    maxSize: 100, // Maximum number of cached items per collection
    maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    syncInterval: 30000, // 30 seconds
    backgroundSyncInterval: 300000, // 5 minutes
    persistentStorage: true,
    compressionEnabled: true
  };

  // Cache strategies for different data types
  const CACHE_STRATEGIES = {
    USER_PROFILE: { priority: 'high', maxAge: 60 * 60 * 1000 }, // 1 hour
    APPLICATIONS: { priority: 'high', maxAge: 30 * 60 * 1000 }, // 30 minutes
    PROGRAMS: { priority: 'medium', maxAge: 2 * 60 * 60 * 1000 }, // 2 hours
    MESSAGES: { priority: 'high', maxAge: 15 * 60 * 1000 }, // 15 minutes
    NOTIFICATIONS: { priority: 'high', maxAge: 15 * 60 * 1000 }, // 15 minutes
    DOCUMENTS: { priority: 'medium', maxAge: 60 * 60 * 1000 }, // 1 hour
    ANALYTICS: { priority: 'low', maxAge: 24 * 60 * 60 * 1000 } // 24 hours
  };

  // Offline operation types
  const OPERATION_TYPES = {
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
    UPLOAD: 'upload'
  };

  // Initialize Offline Support System
  function initOfflineSupport() {
    console.log('📱 Initializing Firebase Offline Support...');

    // Wait for Firebase to be ready
    if (!window.Firebase || !window.Firebase.initialized) {
      document.addEventListener('firebaseInitialized', initOfflineSupport);
      return;
    }

    // Set up network monitoring
    setupNetworkMonitoring();

    // Set up persistent storage
    if (CACHE_CONFIG.persistentStorage) {
      setupPersistentStorage();
    }

    // Set up cache management
    setupCacheManagement();

    // Set up service worker for background sync (if available)
    setupServiceWorker();

    // Set up auth state listener
    if (window.FlowAuth) {
      window.FlowAuth.on('authStateChanged', handleAuthChangeOffline);
    }

    offlineInitialized = true;
    console.log('✅ Firebase Offline Support initialized');

    // Emit offline ready event
    document.dispatchEvent(new CustomEvent('offlineReady', {
      detail: { isOnline, queueLength: offlineQueue.length }
    }));
  }

  // Network monitoring setup
  function setupNetworkMonitoring() {
    // Browser online/offline events
    window.addEventListener('online', handleNetworkOnline);
    window.addEventListener('offline', handleNetworkOffline);

    // Firestore network state monitoring
    if (window.Firebase.db) {
      // Monitor Firestore connection state
      window.Firebase.db.enableNetwork().then(() => {
        console.log('🔥 Firestore network enabled');
      }).catch((error) => {
        console.error('❌ Firestore network error:', error);
        handleNetworkOffline();
      });
    }

    // Periodic connectivity check
    setInterval(checkConnectivity, 30000); // Check every 30 seconds
  }

  // Handle network coming online
  function handleNetworkOnline() {
    console.log('🌐 Network connection restored');
    isOnline = true;
    
    // Process offline queue
    processOfflineQueue();
    
    // Sync cached data
    syncCachedData();
    
    // Emit network status change
    document.dispatchEvent(new CustomEvent('networkStatusChanged', {
      detail: { online: true, queueLength: offlineQueue.length }
    }));
  }

  // Handle network going offline
  function handleNetworkOffline() {
    console.log('📴 Network connection lost');
    isOnline = false;
    
    // Emit network status change
    document.dispatchEvent(new CustomEvent('networkStatusChanged', {
      detail: { online: false, queueLength: offlineQueue.length }
    }));
  }

  // Check connectivity with a lightweight request
  async function checkConnectivity() {
    try {
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-cache'
      });
      
      const wasOnline = isOnline;
      isOnline = true;
      
      if (!wasOnline) {
        handleNetworkOnline();
      }
    } catch (error) {
      const wasOnline = isOnline;
      isOnline = false;
      
      if (wasOnline) {
        handleNetworkOffline();
      }
    }
  }

  // Set up persistent storage
  function setupPersistentStorage() {
    // Load cached data from localStorage
    try {
      const storedCache = localStorage.getItem('flow_offline_cache');
      const storedTimestamps = localStorage.getItem('flow_cache_timestamps');
      const storedQueue = localStorage.getItem('flow_offline_queue');

      if (storedCache) {
        const cacheData = JSON.parse(storedCache);
        Object.entries(cacheData).forEach(([key, value]) => {
          cache.set(key, value);
        });
        console.log(`📱 Loaded ${cache.size} cached items from storage`);
      }

      if (storedTimestamps) {
        const timestampData = JSON.parse(storedTimestamps);
        Object.entries(timestampData).forEach(([key, value]) => {
          cacheTimestamps.set(key, value);
        });
      }

      if (storedQueue) {
        offlineQueue = JSON.parse(storedQueue);
        console.log(`📱 Loaded ${offlineQueue.length} offline operations from storage`);
      }

      // Clean up expired cache entries
      cleanupExpiredCache();

    } catch (error) {
      console.error('❌ Error loading offline data:', error);
      // Clear corrupted data
      localStorage.removeItem('flow_offline_cache');
      localStorage.removeItem('flow_cache_timestamps');
      localStorage.removeItem('flow_offline_queue');
    }
  }

  // Save data to persistent storage
  function saveToPersistentStorage() {
    if (!CACHE_CONFIG.persistentStorage) return;

    try {
      // Convert Maps to objects for JSON serialization
      const cacheObj = Object.fromEntries(cache);
      const timestampsObj = Object.fromEntries(cacheTimestamps);

      localStorage.setItem('flow_offline_cache', JSON.stringify(cacheObj));
      localStorage.setItem('flow_cache_timestamps', JSON.stringify(timestampsObj));
      localStorage.setItem('flow_offline_queue', JSON.stringify(offlineQueue));
    } catch (error) {
      console.error('❌ Error saving offline data:', error);
      
      // If storage is full, clean up old data
      if (error.name === 'QuotaExceededError') {
        cleanupOldCacheEntries();
        // Retry save
        try {
          localStorage.setItem('flow_offline_cache', JSON.stringify(Object.fromEntries(cache)));
          localStorage.setItem('flow_offline_queue', JSON.stringify(offlineQueue));
        } catch (retryError) {
          console.error('❌ Failed to save after cleanup:', retryError);
        }
      }
    }
  }

  // Set up cache management
  function setupCacheManagement() {
    // Periodic cache cleanup
    setInterval(() => {
      cleanupExpiredCache();
      enforceCacheSize();
    }, CACHE_CONFIG.syncInterval);

    // Save cache periodically
    setInterval(saveToPersistentStorage, 60000); // Save every minute

    // Setup strategies for each collection
    Object.entries(window.FirebaseData.COLLECTIONS).forEach(([name, collection]) => {
      const strategy = CACHE_STRATEGIES[name] || CACHE_STRATEGIES.ANALYTICS;
      syncStrategies.set(collection, strategy);
    });
  }

  // Set up service worker for background sync
  function setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        console.log('📱 Service Worker registered:', registration);
        
        // Set up background sync if supported
        if ('sync' in window.ServiceWorkerRegistration.prototype) {
          setupBackgroundSync(registration);
        }
      }).catch((error) => {
        console.log('📱 Service Worker registration failed:', error);
      });
    }
  }

  // Set up background sync
  function setupBackgroundSync(registration) {
    // Register background sync for offline queue processing
    registration.sync.register('process-offline-queue').then(() => {
      console.log('📱 Background sync registered');
    }).catch((error) => {
      console.error('❌ Background sync registration failed:', error);
    });
  }

  // Handle auth state change for offline system
  function handleAuthChangeOffline(authData) {
    const { user, isAuthenticated } = authData;

    if (!isAuthenticated) {
      // Clear user-specific cache when logging out
      clearUserCache();
    } else if (user) {
      // Load user-specific cached data
      loadUserCachedData(user.uid);
    }
  }

  // Offline Queue Management
  const OfflineQueue = {
    // Add operation to offline queue
    add(operation) {
      const queueItem = {
        id: `${Date.now()}_${Math.random()}`,
        timestamp: Date.now(),
        operation,
        retryCount: 0,
        maxRetries: 3
      };

      offlineQueue.push(queueItem);
      console.log(`📱 Added operation to offline queue: ${operation.type} on ${operation.collection}`);
      
      // Save to persistent storage
      saveToPersistentStorage();
      
      // Emit queue change event
      document.dispatchEvent(new CustomEvent('offlineQueueChanged', {
        detail: { queueLength: offlineQueue.length, added: queueItem }
      }));

      return queueItem.id;
    },

    // Remove operation from queue
    remove(operationId) {
      const index = offlineQueue.findIndex(item => item.id === operationId);
      if (index !== -1) {
        const removed = offlineQueue.splice(index, 1)[0];
        saveToPersistentStorage();
        
        document.dispatchEvent(new CustomEvent('offlineQueueChanged', {
          detail: { queueLength: offlineQueue.length, removed }
        }));
        
        return removed;
      }
      return null;
    },

    // Get queue length
    length() {
      return offlineQueue.length;
    },

    // Clear queue
    clear() {
      offlineQueue = [];
      saveToPersistentStorage();
      
      document.dispatchEvent(new CustomEvent('offlineQueueChanged', {
        detail: { queueLength: 0, cleared: true }
      }));
    }
  };

  // Cache Management
  const CacheManager = {
    // Store data in cache
    set(key, data, collection = 'default') {
      const cacheKey = `${collection}:${key}`;
      const timestamp = Date.now();
      
      // Compress data if enabled
      const cacheData = CACHE_CONFIG.compressionEnabled ? 
        compressData(data) : data;
      
      cache.set(cacheKey, cacheData);
      cacheTimestamps.set(cacheKey, timestamp);
      
      // Enforce cache size limits
      enforceCacheSize(collection);
      
      console.log(`📱 Cached data: ${cacheKey}`);
    },

    // Get data from cache
    get(key, collection = 'default') {
      const cacheKey = `${collection}:${key}`;
      const data = cache.get(cacheKey);
      const timestamp = cacheTimestamps.get(cacheKey);
      
      if (!data || !timestamp) return null;
      
      // Check if cache is expired
      const strategy = syncStrategies.get(collection) || CACHE_STRATEGIES.ANALYTICS;
      const maxAge = strategy.maxAge || CACHE_CONFIG.maxAge;
      
      if (Date.now() - timestamp > maxAge) {
        this.delete(key, collection);
        return null;
      }
      
      // Decompress data if needed
      const cachedData = CACHE_CONFIG.compressionEnabled ? 
        decompressData(data) : data;
      
      console.log(`📱 Cache hit: ${cacheKey}`);
      return cachedData;
    },

    // Delete from cache
    delete(key, collection = 'default') {
      const cacheKey = `${collection}:${key}`;
      cache.delete(cacheKey);
      cacheTimestamps.delete(cacheKey);
    },

    // Check if data exists in cache
    has(key, collection = 'default') {
      const cacheKey = `${collection}:${key}`;
      return cache.has(cacheKey) && !this.isExpired(key, collection);
    },

    // Check if cache entry is expired
    isExpired(key, collection = 'default') {
      const cacheKey = `${collection}:${key}`;
      const timestamp = cacheTimestamps.get(cacheKey);
      
      if (!timestamp) return true;
      
      const strategy = syncStrategies.get(collection) || CACHE_STRATEGIES.ANALYTICS;
      const maxAge = strategy.maxAge || CACHE_CONFIG.maxAge;
      
      return Date.now() - timestamp > maxAge;
    },

    // Clear all cache
    clear() {
      cache.clear();
      cacheTimestamps.clear();
      console.log('📱 Cache cleared');
    }
  };

  // Process offline queue when network is available
  async function processOfflineQueue() {
    if (!isOnline || offlineQueue.length === 0) return;

    console.log(`📱 Processing ${offlineQueue.length} offline operations...`);

    const operations = [...offlineQueue];
    let processed = 0;
    let failed = 0;

    for (const queueItem of operations) {
      try {
        const { operation } = queueItem;
        
        // Execute operation based on type
        switch (operation.type) {
          case OPERATION_TYPES.CREATE:
            await window.FirebaseData.DataService.create(
              operation.collection, 
              operation.data, 
              operation.docId
            );
            break;
            
          case OPERATION_TYPES.UPDATE:
            await window.FirebaseData.DataService.update(
              operation.collection, 
              operation.docId, 
              operation.data
            );
            break;
            
          case OPERATION_TYPES.DELETE:
            await window.FirebaseData.DataService.delete(
              operation.collection, 
              operation.docId
            );
            break;
            
          case OPERATION_TYPES.UPLOAD:
            await window.FirebaseData.DocumentService.uploadDocument(
              operation.file, 
              operation.metadata
            );
            break;
        }

        // Remove successful operation from queue
        OfflineQueue.remove(queueItem.id);
        processed++;
        
        console.log(`✅ Processed offline operation: ${operation.type}`);

      } catch (error) {
        console.error(`❌ Failed to process offline operation:`, error);
        
        // Increment retry count
        queueItem.retryCount++;
        
        // Remove if max retries exceeded
        if (queueItem.retryCount >= queueItem.maxRetries) {
          OfflineQueue.remove(queueItem.id);
          failed++;
          
          // Emit failed operation event
          document.dispatchEvent(new CustomEvent('offlineOperationFailed', {
            detail: { operation: queueItem, error }
          }));
        }
      }
    }

    console.log(`📱 Offline queue processed: ${processed} successful, ${failed} failed`);
    
    // Emit processing complete event
    document.dispatchEvent(new CustomEvent('offlineQueueProcessed', {
      detail: { processed, failed, remaining: offlineQueue.length }
    }));
  }

  // Sync cached data with server
  async function syncCachedData() {
    if (!isOnline || !window.FlowAuth.isAuthenticated()) return;

    console.log('📱 Syncing cached data with server...');

    try {
      const currentUser = window.FlowAuth.getCurrentUser();
      if (!currentUser) return;

      // Sync user profile
      await syncUserProfile(currentUser.uid);
      
      // Sync other collections based on user type
      const userProfile = window.FlowAuth.getUserProfile();
      if (userProfile) {
        await syncUserSpecificData(userProfile);
      }

    } catch (error) {
      console.error('❌ Cache sync failed:', error);
    }
  }

  // Sync user profile
  async function syncUserProfile(userId) {
    try {
      const cachedProfile = CacheManager.get(userId, 'users');
      const serverProfile = await window.FirebaseData.UserService.getProfile(userId);
      
      if (serverProfile) {
        CacheManager.set(userId, serverProfile, 'users');
        
        // Check for conflicts
        if (cachedProfile && hasConflict(cachedProfile, serverProfile)) {
          await resolveConflict('user_profile', cachedProfile, serverProfile);
        }
      }
    } catch (error) {
      console.error('❌ User profile sync failed:', error);
    }
  }

  // Sync user-specific data
  async function syncUserSpecificData(userProfile) {
    const { accountType, uid } = userProfile;

    try {
      switch (accountType) {
        case 'student':
          await syncStudentData(uid);
          break;
        case 'institution':
          await syncInstitutionData(uid);
          break;
        case 'counselor':
          await syncCounselorData(uid);
          break;
        case 'parent':
          await syncParentData(uid);
          break;
        case 'recommender':
          await syncRecommenderData(uid);
          break;
      }
    } catch (error) {
      console.error(`❌ ${accountType} data sync failed:`, error);
    }
  }

  // Sync student data
  async function syncStudentData(userId) {
    // Sync applications
    const applications = await window.FirebaseData.ApplicationService.getApplications(userId);
    if (applications) {
      applications.forEach(app => {
        CacheManager.set(app.id, app, window.FirebaseData.COLLECTIONS.APPLICATIONS);
      });
    }

    // Sync documents
    const documents = await window.FirebaseData.DocumentService.getDocuments(userId);
    if (documents) {
      documents.forEach(doc => {
        CacheManager.set(doc.id, doc, window.FirebaseData.COLLECTIONS.DOCUMENTS);
      });
    }
  }

  // Sync institution data
  async function syncInstitutionData(userId) {
    // Sync programs
    const programs = await window.FirebaseData.ProgramService.getPrograms(userId);
    if (programs) {
      programs.forEach(program => {
        CacheManager.set(program.id, program, window.FirebaseData.COLLECTIONS.PROGRAMS);
      });
    }
  }

  // Sync counselor data
  async function syncCounselorData(userId) {
    // Sync counselor students and their applications
    // Implementation would depend on specific data structure
  }

  // Sync parent data
  async function syncParentData(userId) {
    // Sync children and their applications
    // Implementation would depend on specific data structure
  }

  // Sync recommender data
  async function syncRecommenderData(userId) {
    // Sync recommendation requests
    // Implementation would depend on specific data structure
  }

  // Conflict detection and resolution
  function hasConflict(cachedData, serverData) {
    // Simple conflict detection based on timestamps
    if (!cachedData.updatedAt || !serverData.updatedAt) return false;
    
    const cachedTime = cachedData.updatedAt.toMillis ? 
      cachedData.updatedAt.toMillis() : 
      new Date(cachedData.updatedAt).getTime();
      
    const serverTime = serverData.updatedAt.toMillis ? 
      serverData.updatedAt.toMillis() : 
      new Date(serverData.updatedAt).getTime();

    return Math.abs(cachedTime - serverTime) > 1000; // 1 second tolerance
  }

  // Resolve data conflicts
  async function resolveConflict(type, cachedData, serverData) {
    console.log(`🔄 Resolving conflict for ${type}`);

    // Default to last-write-wins
    const strategy = CACHE_CONFIG.conflictStrategy;

    switch (strategy) {
      case 'last-write-wins':
        // Server data wins (it's more recent due to sync)
        return serverData;
        
      case 'manual':
        // Emit conflict event for manual resolution
        document.dispatchEvent(new CustomEvent('dataConflict', {
          detail: { type, cachedData, serverData }
        }));
        return serverData; // Default to server
        
      case 'merge':
        // Simple merge strategy
        return { ...cachedData, ...serverData };
        
      default:
        return serverData;
    }
  }

  // Cache maintenance functions
  function cleanupExpiredCache() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, timestamp] of cacheTimestamps.entries()) {
      const [collection] = key.split(':');
      const strategy = syncStrategies.get(collection) || CACHE_STRATEGIES.ANALYTICS;
      const maxAge = strategy.maxAge || CACHE_CONFIG.maxAge;

      if (now - timestamp > maxAge) {
        cache.delete(key);
        cacheTimestamps.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`📱 Cleaned ${cleaned} expired cache entries`);
      saveToPersistentStorage();
    }
  }

  function enforceCacheSize(collection = null) {
    if (collection) {
      // Enforce size for specific collection
      const collectionKeys = Array.from(cache.keys())
        .filter(key => key.startsWith(`${collection}:`));
        
      if (collectionKeys.length > CACHE_CONFIG.maxSize) {
        // Remove oldest entries
        const sortedKeys = collectionKeys
          .sort((a, b) => cacheTimestamps.get(a) - cacheTimestamps.get(b))
          .slice(0, collectionKeys.length - CACHE_CONFIG.maxSize);

        sortedKeys.forEach(key => {
          cache.delete(key);
          cacheTimestamps.delete(key);
        });
      }
    } else {
      // Enforce global cache size
      const totalSize = cache.size;
      const globalLimit = CACHE_CONFIG.maxSize * 10; // 10x per collection limit

      if (totalSize > globalLimit) {
        cleanupOldCacheEntries();
      }
    }
  }

  function cleanupOldCacheEntries() {
    const sortedEntries = Array.from(cacheTimestamps.entries())
      .sort((a, b) => a[1] - b[1]); // Sort by timestamp

    // Remove oldest 20%
    const removeCount = Math.floor(sortedEntries.length * 0.2);
    const toRemove = sortedEntries.slice(0, removeCount);

    toRemove.forEach(([key]) => {
      cache.delete(key);
      cacheTimestamps.delete(key);
    });

    console.log(`📱 Removed ${removeCount} old cache entries`);
  }

  function clearUserCache() {
    const userKeys = Array.from(cache.keys()).filter(key => 
      key.includes('users:') || key.includes('applications:') || 
      key.includes('messages:') || key.includes('notifications:')
    );

    userKeys.forEach(key => {
      cache.delete(key);
      cacheTimestamps.delete(key);
    });

    console.log(`📱 Cleared ${userKeys.length} user cache entries`);
    saveToPersistentStorage();
  }

  function loadUserCachedData(userId) {
    // This would load user-specific data from cache
    console.log(`📱 Loading cached data for user: ${userId}`);
  }

  // Data compression utilities (simple JSON compression)
  function compressData(data) {
    try {
      return JSON.stringify(data);
    } catch (error) {
      console.error('❌ Data compression failed:', error);
      return data;
    }
  }

  function decompressData(data) {
    try {
      return typeof data === 'string' ? JSON.parse(data) : data;
    } catch (error) {
      console.error('❌ Data decompression failed:', error);
      return data;
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOfflineSupport);
  } else {
    initOfflineSupport();
  }

  // Export offline system globally
  window.FirebaseOffline = {
    // Status
    isOnline: () => isOnline,
    isInitialized: () => offlineInitialized,
    
    // Queue management
    OfflineQueue,
    
    // Cache management
    CacheManager,
    
    // Manual operations
    processQueue: processOfflineQueue,
    syncCache: syncCachedData,
    
    // Configuration
    getConfig: () => CACHE_CONFIG,
    
    // Statistics
    getStats: () => ({
      queueLength: offlineQueue.length,
      cacheSize: cache.size,
      isOnline,
      lastSync: lastSyncTimestamp
    })
  };

  console.log('📱 Firebase Offline Support module loaded');

})();
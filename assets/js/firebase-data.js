// Firebase Data Layer
// Comprehensive data management service for Firestore operations
// Handles all database operations, real-time updates, and offline support

/* eslint-env browser */

(function() {
  'use strict';

  // Data service state
  let firebaseReady = false;
  let db = null;
  let auth = null;
  let realtimeListeners = new Map();
  let offlineQueue = [];
  let isOnline = navigator.onLine;

  // Data Models and Collections
  const COLLECTIONS = {
    USERS: 'users',
    STUDENTS: 'students',
    INSTITUTIONS: 'institutions',
    APPLICATIONS: 'applications',
    PROGRAMS: 'programs',
    MESSAGES: 'messages',
    NOTIFICATIONS: 'notifications',
    DOCUMENTS: 'documents',
    ANALYTICS: 'analytics'
  };

  // Initialize Firebase Data Layer
  function initFirebaseData() {
    console.log('📊 Initializing Firebase Data Layer...');

    // Wait for Firebase to be ready
    if (!window.Firebase || !window.Firebase.initialized) {
      document.addEventListener('firebaseInitialized', initFirebaseData);
      return;
    }

    firebaseReady = true;
    db = window.Firebase.db;
    auth = window.Firebase.auth;

    // Set up network monitoring
    setupNetworkMonitoring();

    // Process offline queue when coming back online
    document.addEventListener('networkStatusChanged', handleNetworkChange);

    console.log('✅ Firebase Data Layer initialized');
  }

  // Network monitoring setup
  function setupNetworkMonitoring() {
    window.addEventListener('online', () => {
      isOnline = true;
      processOfflineQueue();
    });

    window.addEventListener('offline', () => {
      isOnline = false;
    });
  }

  // Handle network status changes
  function handleNetworkChange(event) {
    const { online } = event.detail;
    isOnline = online;
    
    if (online) {
      processOfflineQueue();
    }
  }

  // Process queued offline operations
  async function processOfflineQueue() {
    if (!isOnline || offlineQueue.length === 0) return;

    console.log(`📡 Processing ${offlineQueue.length} offline operations...`);
    
    const operations = [...offlineQueue];
    offlineQueue = [];

    for (const operation of operations) {
      try {
        await operation();
      } catch (error) {
        console.error('❌ Offline operation failed:', error);
        // Re-queue failed operations
        offlineQueue.push(operation);
      }
    }
  }

  // Generic CRUD Operations
  const DataService = {
    // Create document
    async create(collection, data, docId = null) {
      try {
        const timestamp = window.FirebaseUtils.getTimestamp();
        const docData = {
          ...data,
          createdAt: timestamp,
          updatedAt: timestamp,
          createdBy: auth?.currentUser?.uid || null
        };

        let docRef;
        if (docId) {
          docRef = db.collection(collection).doc(docId);
          await docRef.set(docData);
        } else {
          docRef = await db.collection(collection).add(docData);
        }

        console.log(`✅ Document created in ${collection}:`, docRef.id);
        return { id: docRef.id, ...docData };
      } catch (error) {
        console.error(`❌ Create failed in ${collection}:`, error);
        
        if (!isOnline) {
          offlineQueue.push(() => this.create(collection, data, docId));
          return { offline: true, error: 'Queued for when online' };
        }
        
        throw error;
      }
    },

    // Read document by ID
    async read(collection, docId) {
      try {
        const doc = await db.collection(collection).doc(docId).get();
        
        if (doc.exists) {
          return { id: doc.id, ...doc.data() };
        } else {
          return null;
        }
      } catch (error) {
        console.error(`❌ Read failed in ${collection}/${docId}:`, error);
        throw error;
      }
    },

    // Update document
    async update(collection, docId, updates) {
      try {
        const updateData = {
          ...updates,
          updatedAt: window.FirebaseUtils.getTimestamp(),
          updatedBy: auth?.currentUser?.uid || null
        };

        await db.collection(collection).doc(docId).update(updateData);
        
        console.log(`✅ Document updated in ${collection}/${docId}`);
        return updateData;
      } catch (error) {
        console.error(`❌ Update failed in ${collection}/${docId}:`, error);
        
        if (!isOnline) {
          offlineQueue.push(() => this.update(collection, docId, updates));
          return { offline: true, error: 'Queued for when online' };
        }
        
        throw error;
      }
    },

    // Delete document
    async delete(collection, docId) {
      try {
        await db.collection(collection).doc(docId).delete();
        console.log(`✅ Document deleted from ${collection}/${docId}`);
        return true;
      } catch (error) {
        console.error(`❌ Delete failed in ${collection}/${docId}:`, error);
        
        if (!isOnline) {
          offlineQueue.push(() => this.delete(collection, docId));
          return { offline: true, error: 'Queued for when online' };
        }
        
        throw error;
      }
    },

    // Query documents
    async query(collection, filters = [], orderBy = null, limit = null) {
      try {
        let query = db.collection(collection);

        // Apply filters
        filters.forEach(filter => {
          const [field, operator, value] = filter;
          query = query.where(field, operator, value);
        });

        // Apply ordering
        if (orderBy) {
          const [field, direction = 'asc'] = Array.isArray(orderBy) ? orderBy : [orderBy];
          query = query.orderBy(field, direction);
        }

        // Apply limit
        if (limit) {
          query = query.limit(limit);
        }

        const snapshot = await query.get();
        const documents = [];
        
        snapshot.forEach(doc => {
          documents.push({ id: doc.id, ...doc.data() });
        });

        return documents;
      } catch (error) {
        console.error(`❌ Query failed in ${collection}:`, error);
        throw error;
      }
    },

    // Real-time listener
    onSnapshot(collection, callback, filters = [], orderBy = null) {
      try {
        let query = db.collection(collection);

        // Apply filters
        filters.forEach(filter => {
          const [field, operator, value] = filter;
          query = query.where(field, operator, value);
        });

        // Apply ordering
        if (orderBy) {
          const [field, direction = 'asc'] = Array.isArray(orderBy) ? orderBy : [orderBy];
          query = query.orderBy(field, direction);
        }

        const unsubscribe = query.onSnapshot(
          (snapshot) => {
            const documents = [];
            const changes = [];

            snapshot.docChanges().forEach(change => {
              const doc = { id: change.doc.id, ...change.doc.data() };
              
              changes.push({
                type: change.type,
                doc: doc,
                oldIndex: change.oldIndex,
                newIndex: change.newIndex
              });
            });

            snapshot.forEach(doc => {
              documents.push({ id: doc.id, ...doc.data() });
            });

            callback({
              documents,
              changes,
              metadata: snapshot.metadata
            });
          },
          (error) => {
            console.error(`❌ Snapshot listener error in ${collection}:`, error);
            callback({ error });
          }
        );

        // Store listener for cleanup
        const listenerId = `${collection}_${Date.now()}`;
        realtimeListeners.set(listenerId, unsubscribe);

        return listenerId;
      } catch (error) {
        console.error(`❌ Snapshot setup failed in ${collection}:`, error);
        throw error;
      }
    },

    // Remove real-time listener
    offSnapshot(listenerId) {
      const unsubscribe = realtimeListeners.get(listenerId);
      if (unsubscribe) {
        unsubscribe();
        realtimeListeners.delete(listenerId);
        console.log(`✅ Listener removed: ${listenerId}`);
      }
    },

    // Batch operations
    async batch(operations) {
      try {
        const batch = window.FirebaseUtils.createBatch();
        const timestamp = window.FirebaseUtils.getTimestamp();

        operations.forEach(op => {
          const { type, collection, docId, data } = op;
          const docRef = db.collection(collection).doc(docId || db.collection(collection).doc().id);

          switch (type) {
            case 'set':
              batch.set(docRef, { ...data, createdAt: timestamp, updatedAt: timestamp });
              break;
            case 'update':
              batch.update(docRef, { ...data, updatedAt: timestamp });
              break;
            case 'delete':
              batch.delete(docRef);
              break;
          }
        });

        await batch.commit();
        console.log(`✅ Batch operation completed with ${operations.length} operations`);
        return true;
      } catch (error) {
        console.error('❌ Batch operation failed:', error);
        
        if (!isOnline) {
          offlineQueue.push(() => this.batch(operations));
          return { offline: true, error: 'Queued for when online' };
        }
        
        throw error;
      }
    },

    // Transaction
    async transaction(updateFunction) {
      try {
        return await window.FirebaseUtils.runTransaction(updateFunction);
      } catch (error) {
        console.error('❌ Transaction failed:', error);
        throw error;
      }
    }
  };

  // Specialized Data Services for each entity type

  // User Management
  const UserService = {
    async createProfile(uid, profileData) {
      return await DataService.create(COLLECTIONS.USERS, profileData, uid);
    },

    async getProfile(uid) {
      return await DataService.read(COLLECTIONS.USERS, uid);
    },

    async updateProfile(uid, updates) {
      return await DataService.update(COLLECTIONS.USERS, uid, updates);
    },

    async deleteProfile(uid) {
      return await DataService.delete(COLLECTIONS.USERS, uid);
    },

    onProfileChanges(uid, callback) {
      return db.collection(COLLECTIONS.USERS).doc(uid).onSnapshot(
        (doc) => {
          if (doc.exists) {
            callback({ id: doc.id, ...doc.data() });
          } else {
            callback(null);
          }
        },
        (error) => callback({ error })
      );
    }
  };

  // Student Application Management
  const ApplicationService = {
    async createApplication(applicationData) {
      return await DataService.create(COLLECTIONS.APPLICATIONS, {
        ...applicationData,
        status: 'draft',
        studentId: auth?.currentUser?.uid
      });
    },

    async getApplications(studentId = null) {
      const userId = studentId || auth?.currentUser?.uid;
      return await DataService.query(COLLECTIONS.APPLICATIONS, [
        ['studentId', '==', userId]
      ], ['updatedAt', 'desc']);
    },

    async updateApplication(applicationId, updates) {
      return await DataService.update(COLLECTIONS.APPLICATIONS, applicationId, updates);
    },

    async submitApplication(applicationId) {
      return await DataService.update(COLLECTIONS.APPLICATIONS, applicationId, {
        status: 'submitted',
        submittedAt: window.FirebaseUtils.getTimestamp()
      });
    },

    onApplicationChanges(callback, studentId = null) {
      const userId = studentId || auth?.currentUser?.uid;
      return DataService.onSnapshot(COLLECTIONS.APPLICATIONS, callback, [
        ['studentId', '==', userId]
      ], ['updatedAt', 'desc']);
    }
  };

  // Program Management
  const ProgramService = {
    async getPrograms(institutionId = null, filters = []) {
      const programFilters = institutionId ? 
        [['institutionId', '==', institutionId], ...filters] : 
        filters;

      return await DataService.query(COLLECTIONS.PROGRAMS, programFilters, ['name', 'asc']);
    },

    async getProgram(programId) {
      return await DataService.read(COLLECTIONS.PROGRAMS, programId);
    },

    async createProgram(programData) {
      return await DataService.create(COLLECTIONS.PROGRAMS, {
        ...programData,
        institutionId: auth?.currentUser?.uid,
        isActive: true
      });
    },

    async updateProgram(programId, updates) {
      return await DataService.update(COLLECTIONS.PROGRAMS, programId, updates);
    },

    onProgramChanges(callback, institutionId = null) {
      const filters = institutionId ? [['institutionId', '==', institutionId]] : [];
      return DataService.onSnapshot(COLLECTIONS.PROGRAMS, callback, filters, ['name', 'asc']);
    }
  };

  // Message System
  const MessageService = {
    async sendMessage(recipientId, content, type = 'text') {
      return await DataService.create(COLLECTIONS.MESSAGES, {
        senderId: auth?.currentUser?.uid,
        recipientId,
        content,
        type,
        read: false,
        readAt: null
      });
    },

    async getConversation(otherUserId, limit = 50) {
      const currentUserId = auth?.currentUser?.uid;
      return await DataService.query(COLLECTIONS.MESSAGES, [
        ['participants', 'array-contains', currentUserId]
      ], ['createdAt', 'desc'], limit);
    },

    async markAsRead(messageId) {
      return await DataService.update(COLLECTIONS.MESSAGES, messageId, {
        read: true,
        readAt: window.FirebaseUtils.getTimestamp()
      });
    },

    onMessageChanges(callback, otherUserId) {
      const currentUserId = auth?.currentUser?.uid;
      return DataService.onSnapshot(COLLECTIONS.MESSAGES, callback, [
        ['participants', 'array-contains', currentUserId]
      ], ['createdAt', 'desc']);
    }
  };

  // Notification System
  const NotificationService = {
    async createNotification(userId, notificationData) {
      return await DataService.create(COLLECTIONS.NOTIFICATIONS, {
        ...notificationData,
        userId,
        read: false,
        readAt: null
      });
    },

    async getNotifications(userId = null, unreadOnly = false) {
      const targetUserId = userId || auth?.currentUser?.uid;
      const filters = [['userId', '==', targetUserId]];
      
      if (unreadOnly) {
        filters.push(['read', '==', false]);
      }

      return await DataService.query(COLLECTIONS.NOTIFICATIONS, filters, ['createdAt', 'desc'], 50);
    },

    async markAsRead(notificationId) {
      return await DataService.update(COLLECTIONS.NOTIFICATIONS, notificationId, {
        read: true,
        readAt: window.FirebaseUtils.getTimestamp()
      });
    },

    async markAllAsRead(userId = null) {
      const targetUserId = userId || auth?.currentUser?.uid;
      const notifications = await this.getNotifications(targetUserId, true);
      
      const batchOps = notifications.map(notification => ({
        type: 'update',
        collection: COLLECTIONS.NOTIFICATIONS,
        docId: notification.id,
        data: {
          read: true,
          readAt: window.FirebaseUtils.getTimestamp()
        }
      }));

      return await DataService.batch(batchOps);
    },

    onNotificationChanges(callback, userId = null) {
      const targetUserId = userId || auth?.currentUser?.uid;
      return DataService.onSnapshot(COLLECTIONS.NOTIFICATIONS, callback, [
        ['userId', '==', targetUserId]
      ], ['createdAt', 'desc']);
    }
  };

  // Document Management
  const DocumentService = {
    async uploadDocument(file, metadata = {}) {
      try {
        const userId = auth?.currentUser?.uid;
        const timestamp = Date.now();
        const fileName = `${userId}/${timestamp}_${file.name}`;
        
        // Upload to Firebase Storage
        const result = await window.FirebaseUtils.uploadFile(file, `documents/${fileName}`, {
          customMetadata: {
            uploadedBy: userId,
            originalName: file.name,
            ...metadata
          }
        });

        // Save document record to Firestore
        const documentData = {
          userId,
          fileName: file.name,
          storagePath: `documents/${fileName}`,
          downloadURL: result.downloadURL,
          size: file.size,
          type: file.type,
          metadata: {
            ...metadata,
            uploadedAt: window.FirebaseUtils.getTimestamp()
          }
        };

        const doc = await DataService.create(COLLECTIONS.DOCUMENTS, documentData);
        return { ...doc, downloadURL: result.downloadURL };

      } catch (error) {
        console.error('❌ Document upload failed:', error);
        throw error;
      }
    },

    async getDocuments(userId = null, filters = []) {
      const targetUserId = userId || auth?.currentUser?.uid;
      return await DataService.query(COLLECTIONS.DOCUMENTS, [
        ['userId', '==', targetUserId],
        ...filters
      ], ['createdAt', 'desc']);
    },

    async deleteDocument(documentId) {
      const doc = await DataService.read(COLLECTIONS.DOCUMENTS, documentId);
      if (doc && doc.storagePath) {
        // Delete from Storage
        await window.FirebaseUtils.deleteFile(doc.storagePath);
      }
      
      // Delete from Firestore
      return await DataService.delete(COLLECTIONS.DOCUMENTS, documentId);
    }
  };

  // Analytics Service
  const AnalyticsService = {
    async trackEvent(eventName, eventData = {}) {
      // Send to Firebase Analytics
      if (window.Firebase.analytics) {
        window.Firebase.analytics.logEvent(eventName, eventData);
      }

      // Also store in Firestore for custom analytics
      return await DataService.create(COLLECTIONS.ANALYTICS, {
        userId: auth?.currentUser?.uid,
        eventName,
        eventData,
        userAgent: navigator.userAgent,
        timestamp: window.FirebaseUtils.getTimestamp()
      });
    },

    async getAnalytics(filters = [], dateRange = null) {
      let analyticsFilters = [...filters];
      
      if (dateRange && dateRange.start && dateRange.end) {
        analyticsFilters.push(['timestamp', '>=', dateRange.start]);
        analyticsFilters.push(['timestamp', '<=', dateRange.end]);
      }

      return await DataService.query(COLLECTIONS.ANALYTICS, analyticsFilters, ['timestamp', 'desc']);
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFirebaseData);
  } else {
    initFirebaseData();
  }

  // Export all services globally
  window.FirebaseData = {
    // Core data service
    DataService,
    
    // Specialized services
    UserService,
    ApplicationService,
    ProgramService,
    MessageService,
    NotificationService,
    DocumentService,
    AnalyticsService,
    
    // Collections reference
    COLLECTIONS,
    
    // Utility methods
    isOnline: () => isOnline,
    getOfflineQueueLength: () => offlineQueue.length,
    
    // Real-time listener management
    cleanupListeners() {
      realtimeListeners.forEach((unsubscribe) => {
        unsubscribe();
      });
      realtimeListeners.clear();
      console.log('✅ All real-time listeners cleaned up');
    }
  };

  console.log('📊 Firebase Data Layer module loaded');

})();
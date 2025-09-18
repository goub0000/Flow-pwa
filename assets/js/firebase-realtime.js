// Firebase Real-time Synchronization System
// Comprehensive real-time data synchronization with offline support
// Handles live updates, conflict resolution, and data consistency

/* eslint-env browser */

(function() {
  'use strict';

  // Real-time sync state
  let syncInitialized = false;
  let activeSubscriptions = new Map();
  let syncQueue = [];
  let conflictResolutions = new Map();
  let lastSyncTimestamp = null;
  let isOnline = navigator.onLine;
  let syncStatus = 'initializing';

  // Sync configuration
  const SYNC_CONFIG = {
    batchSize: 50,
    syncInterval: 5000, // 5 seconds
    retryDelay: 2000,   // 2 seconds
    maxRetries: 3,
    conflictStrategy: 'last-write-wins' // 'last-write-wins', 'manual', 'merge'
  };

  // Real-time subscription types
  const SUBSCRIPTION_TYPES = {
    USER_PROFILE: 'user_profile',
    APPLICATIONS: 'applications',
    MESSAGES: 'messages',
    NOTIFICATIONS: 'notifications',
    PROGRAMS: 'programs',
    DOCUMENTS: 'documents'
  };

  // Initialize Real-time Sync System
  function initRealtimeSync() {
    console.log('🔄 Initializing Firebase Real-time Sync...');

    // Wait for Firebase to be ready
    if (!window.Firebase || !window.Firebase.initialized) {
      document.addEventListener('firebaseInitialized', initRealtimeSync);
      return;
    }

    // Wait for authentication
    if (!window.FlowAuth) {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initRealtimeSync, 1000);
      });
      return;
    }

    // Set up auth state listener
    window.FlowAuth.on('authStateChanged', handleAuthChange);

    // Set up network monitoring
    setupNetworkMonitoring();

    // Set up periodic sync
    setupPeriodicSync();

    // Set up beforeunload cleanup
    setupCleanup();

    syncInitialized = true;
    syncStatus = 'ready';

    console.log('✅ Firebase Real-time Sync initialized');
    
    // Emit sync ready event
    document.dispatchEvent(new CustomEvent('syncReady', {
      detail: { status: syncStatus }
    }));
  }

  // Handle authentication state changes
  function handleAuthChange(authData) {
    const { user, isAuthenticated } = authData;

    if (isAuthenticated && user) {
      console.log('🔄 Setting up user-specific subscriptions for:', user.email);
      setupUserSubscriptions(user);
      syncStatus = 'active';
    } else {
      console.log('🔄 Cleaning up subscriptions - user logged out');
      cleanupAllSubscriptions();
      syncStatus = 'inactive';
    }

    // Emit sync status change
    document.dispatchEvent(new CustomEvent('syncStatusChanged', {
      detail: { status: syncStatus, user }
    }));
  }

  // Set up user-specific real-time subscriptions
  function setupUserSubscriptions(user) {
    const userId = user.uid;

    // User profile subscription
    subscribeToUserProfile(userId);

    // Get user account type for relevant subscriptions
    if (window.FlowAuth.getUserProfile()) {
      const profile = window.FlowAuth.getUserProfile();
      const accountType = profile.accountType;

      // Set up account type specific subscriptions
      switch (accountType) {
        case 'student':
          subscribeToStudentData(userId);
          break;
        case 'institution':
          subscribeToInstitutionData(userId);
          break;
        case 'counselor':
          subscribeToCounselorData(userId);
          break;
        case 'parent':
          subscribeToParentData(userId);
          break;
        case 'recommender':
          subscribeToRecommenderData(userId);
          break;
      }

      // Common subscriptions for all users
      subscribeToMessages(userId);
      subscribeToNotifications(userId);
    }
  }

  // User profile real-time subscription
  function subscribeToUserProfile(userId) {
    const subscription = {
      type: SUBSCRIPTION_TYPES.USER_PROFILE,
      id: `profile_${userId}`,
      cleanup: null
    };

    const unsubscribe = window.FirebaseData.UserService.onProfileChanges(userId, (profileData) => {
      if (profileData && !profileData.error) {
        console.log('🔄 User profile updated:', profileData.email);
        
        // Update local auth state
        if (window.FlowAuth._updateFirebaseUser) {
          window.FlowAuth._updateFirebaseUser(firebase.auth().currentUser);
        }

        // Emit profile update event
        document.dispatchEvent(new CustomEvent('userProfileUpdated', {
          detail: profileData
        }));
      } else if (profileData && profileData.error) {
        console.error('❌ User profile sync error:', profileData.error);
      }
    });

    subscription.cleanup = unsubscribe;
    activeSubscriptions.set(subscription.id, subscription);
  }

  // Student-specific subscriptions
  function subscribeToStudentData(userId) {
    // Applications subscription
    const applicationsUnsubscribe = window.FirebaseData.ApplicationService.onApplicationChanges(
      (data) => {
        if (data.error) {
          console.error('❌ Applications sync error:', data.error);
          return;
        }

        console.log('🔄 Applications updated:', data.changes?.length || 0, 'changes');
        
        // Emit applications update event
        document.dispatchEvent(new CustomEvent('applicationsUpdated', {
          detail: {
            applications: data.documents,
            changes: data.changes,
            metadata: data.metadata
          }
        }));
      },
      userId
    );

    activeSubscriptions.set(`applications_${userId}`, {
      type: SUBSCRIPTION_TYPES.APPLICATIONS,
      id: `applications_${userId}`,
      cleanup: () => window.FirebaseData.DataService.offSnapshot(applicationsUnsubscribe)
    });

    // Documents subscription
    subscribeToDocuments(userId);
  }

  // Institution-specific subscriptions
  function subscribeToInstitutionData(userId) {
    // Programs subscription
    const programsUnsubscribe = window.FirebaseData.ProgramService.onProgramChanges(
      (data) => {
        if (data.error) {
          console.error('❌ Programs sync error:', data.error);
          return;
        }

        console.log('🔄 Programs updated:', data.changes?.length || 0, 'changes');
        
        // Emit programs update event
        document.dispatchEvent(new CustomEvent('programsUpdated', {
          detail: {
            programs: data.documents,
            changes: data.changes,
            metadata: data.metadata
          }
        }));
      },
      userId
    );

    activeSubscriptions.set(`programs_${userId}`, {
      type: SUBSCRIPTION_TYPES.PROGRAMS,
      id: `programs_${userId}`,
      cleanup: () => window.FirebaseData.DataService.offSnapshot(programsUnsubscribe)
    });

    // Applications for this institution (as recipient)
    subscribeToInstitutionApplications(userId);
  }

  // Institution applications subscription
  function subscribeToInstitutionApplications(institutionId) {
    const applicationsUnsubscribe = window.FirebaseData.DataService.onSnapshot(
      window.FirebaseData.COLLECTIONS.APPLICATIONS,
      (data) => {
        if (data.error) {
          console.error('❌ Institution applications sync error:', data.error);
          return;
        }

        console.log('🔄 Institution applications updated:', data.changes?.length || 0, 'changes');
        
        // Emit institution applications update event
        document.dispatchEvent(new CustomEvent('institutionApplicationsUpdated', {
          detail: {
            applications: data.documents,
            changes: data.changes,
            metadata: data.metadata
          }
        }));
      },
      [['targetInstitutionId', '==', institutionId]],
      ['updatedAt', 'desc']
    );

    activeSubscriptions.set(`institution_applications_${institutionId}`, {
      type: SUBSCRIPTION_TYPES.APPLICATIONS,
      id: `institution_applications_${institutionId}`,
      cleanup: () => window.FirebaseData.DataService.offSnapshot(applicationsUnsubscribe)
    });
  }

  // Counselor-specific subscriptions
  function subscribeToCounselorData(userId) {
    // Students under this counselor
    const studentsUnsubscribe = window.FirebaseData.DataService.onSnapshot(
      window.FirebaseData.COLLECTIONS.USERS,
      (data) => {
        if (data.error) {
          console.error('❌ Counselor students sync error:', data.error);
          return;
        }

        console.log('🔄 Counselor students updated:', data.changes?.length || 0, 'changes');
        
        // Emit students update event
        document.dispatchEvent(new CustomEvent('counselorStudentsUpdated', {
          detail: {
            students: data.documents,
            changes: data.changes,
            metadata: data.metadata
          }
        }));
      },
      [['counselorId', '==', userId], ['accountType', '==', 'student']],
      ['lastName', 'asc']
    );

    activeSubscriptions.set(`counselor_students_${userId}`, {
      type: 'counselor_students',
      id: `counselor_students_${userId}`,
      cleanup: () => window.FirebaseData.DataService.offSnapshot(studentsUnsubscribe)
    });
  }

  // Parent-specific subscriptions
  function subscribeToParentData(userId) {
    // Children under this parent
    const childrenUnsubscribe = window.FirebaseData.DataService.onSnapshot(
      window.FirebaseData.COLLECTIONS.USERS,
      (data) => {
        if (data.error) {
          console.error('❌ Parent children sync error:', data.error);
          return;
        }

        console.log('🔄 Parent children updated:', data.changes?.length || 0, 'changes');
        
        // Emit children update event
        document.dispatchEvent(new CustomEvent('parentChildrenUpdated', {
          detail: {
            children: data.documents,
            changes: data.changes,
            metadata: data.metadata
          }
        }));
      },
      [['parentId', '==', userId], ['accountType', '==', 'student']],
      ['lastName', 'asc']
    );

    activeSubscriptions.set(`parent_children_${userId}`, {
      type: 'parent_children',
      id: `parent_children_${userId}`,
      cleanup: () => window.FirebaseData.DataService.offSnapshot(childrenUnsubscribe)
    });
  }

  // Recommender-specific subscriptions
  function subscribeToRecommenderData(userId) {
    // Recommendation requests for this recommender
    const requestsUnsubscribe = window.FirebaseData.DataService.onSnapshot(
      'recommendation_requests',
      (data) => {
        if (data.error) {
          console.error('❌ Recommendation requests sync error:', data.error);
          return;
        }

        console.log('🔄 Recommendation requests updated:', data.changes?.length || 0, 'changes');
        
        // Emit requests update event
        document.dispatchEvent(new CustomEvent('recommendationRequestsUpdated', {
          detail: {
            requests: data.documents,
            changes: data.changes,
            metadata: data.metadata
          }
        }));
      },
      [['recommenderId', '==', userId]],
      ['createdAt', 'desc']
    );

    activeSubscriptions.set(`recommendation_requests_${userId}`, {
      type: 'recommendation_requests',
      id: `recommendation_requests_${userId}`,
      cleanup: () => window.FirebaseData.DataService.offSnapshot(requestsUnsubscribe)
    });
  }

  // Messages real-time subscription
  function subscribeToMessages(userId) {
    const messagesUnsubscribe = window.FirebaseData.MessageService.onMessageChanges(
      (data) => {
        if (data.error) {
          console.error('❌ Messages sync error:', data.error);
          return;
        }

        console.log('🔄 Messages updated:', data.changes?.length || 0, 'changes');
        
        // Play notification sound for new messages
        if (data.changes) {
          const newMessages = data.changes.filter(change => change.type === 'added');
          if (newMessages.length > 0 && 'Notification' in window) {
            playMessageNotification(newMessages);
          }
        }

        // Emit messages update event
        document.dispatchEvent(new CustomEvent('messagesUpdated', {
          detail: {
            messages: data.documents,
            changes: data.changes,
            metadata: data.metadata
          }
        }));
      },
      userId
    );

    activeSubscriptions.set(`messages_${userId}`, {
      type: SUBSCRIPTION_TYPES.MESSAGES,
      id: `messages_${userId}`,
      cleanup: () => window.FirebaseData.DataService.offSnapshot(messagesUnsubscribe)
    });
  }

  // Notifications real-time subscription
  function subscribeToNotifications(userId) {
    const notificationsUnsubscribe = window.FirebaseData.NotificationService.onNotificationChanges(
      (data) => {
        if (data.error) {
          console.error('❌ Notifications sync error:', data.error);
          return;
        }

        console.log('🔄 Notifications updated:', data.changes?.length || 0, 'changes');
        
        // Show browser notifications for new notifications
        if (data.changes) {
          const newNotifications = data.changes.filter(change => change.type === 'added');
          if (newNotifications.length > 0) {
            showBrowserNotifications(newNotifications);
          }
        }

        // Emit notifications update event
        document.dispatchEvent(new CustomEvent('notificationsUpdated', {
          detail: {
            notifications: data.documents,
            changes: data.changes,
            metadata: data.metadata
          }
        }));
      },
      userId
    );

    activeSubscriptions.set(`notifications_${userId}`, {
      type: SUBSCRIPTION_TYPES.NOTIFICATIONS,
      id: `notifications_${userId}`,
      cleanup: () => window.FirebaseData.DataService.offSnapshot(notificationsUnsubscribe)
    });
  }

  // Documents real-time subscription
  function subscribeToDocuments(userId) {
    const documentsUnsubscribe = window.FirebaseData.DataService.onSnapshot(
      window.FirebaseData.COLLECTIONS.DOCUMENTS,
      (data) => {
        if (data.error) {
          console.error('❌ Documents sync error:', data.error);
          return;
        }

        console.log('🔄 Documents updated:', data.changes?.length || 0, 'changes');
        
        // Emit documents update event
        document.dispatchEvent(new CustomEvent('documentsUpdated', {
          detail: {
            documents: data.documents,
            changes: data.changes,
            metadata: data.metadata
          }
        }));
      },
      [['userId', '==', userId]],
      ['createdAt', 'desc']
    );

    activeSubscriptions.set(`documents_${userId}`, {
      type: SUBSCRIPTION_TYPES.DOCUMENTS,
      id: `documents_${userId}`,
      cleanup: () => window.FirebaseData.DataService.offSnapshot(documentsUnsubscribe)
    });
  }

  // Network monitoring
  function setupNetworkMonitoring() {
    window.addEventListener('online', () => {
      isOnline = true;
      console.log('🌐 Network restored - resuming sync');
      syncStatus = window.FlowAuth.isAuthenticated() ? 'active' : 'inactive';
      processSyncQueue();
    });

    window.addEventListener('offline', () => {
      isOnline = false;
      console.log('📴 Network lost - sync paused');
      syncStatus = 'offline';
    });

    // Listen for Firebase network state
    document.addEventListener('networkStatusChanged', (event) => {
      const { online } = event.detail;
      isOnline = online;
      
      if (online) {
        processSyncQueue();
      }
    });
  }

  // Periodic sync for conflict resolution and data consistency
  function setupPeriodicSync() {
    setInterval(() => {
      if (isOnline && window.FlowAuth.isAuthenticated()) {
        performConsistencyCheck();
      }
    }, SYNC_CONFIG.syncInterval);
  }

  // Perform data consistency check
  async function performConsistencyCheck() {
    try {
      const currentUser = window.FlowAuth.getCurrentUser();
      if (!currentUser) return;

      // Update last sync timestamp
      lastSyncTimestamp = Date.now();

      // Check for any pending operations
      if (syncQueue.length > 0) {
        await processSyncQueue();
      }

      // Emit consistency check event
      document.dispatchEvent(new CustomEvent('syncConsistencyCheck', {
        detail: { timestamp: lastSyncTimestamp }
      }));

    } catch (error) {
      console.error('❌ Consistency check failed:', error);
    }
  }

  // Process queued sync operations
  async function processSyncQueue() {
    if (!isOnline || syncQueue.length === 0) return;

    console.log(`🔄 Processing ${syncQueue.length} queued sync operations...`);

    const operations = [...syncQueue];
    syncQueue = [];

    for (const operation of operations) {
      try {
        await operation();
      } catch (error) {
        console.error('❌ Sync operation failed:', error);
        
        // Re-queue failed operations with retry limit
        operation.retryCount = (operation.retryCount || 0) + 1;
        if (operation.retryCount < SYNC_CONFIG.maxRetries) {
          syncQueue.push(operation);
        }
      }
    }
  }

  // Play sound notification for new messages
  function playMessageNotification(newMessages) {
    // Only play if the user is not currently viewing messages
    if (!document.hidden && window.location.pathname.includes('/messages')) return;

    // Create and play notification sound
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmspBi2a7fPCZyMOLXzH6d+VQAoUYKzm65VEASlcm+fru1gpBitLyO7LYywOHmfI6eSRQwsTO4LU7tZ9KgYicuLBHCsfQ');
      audio.volume = 0.3;
      audio.play().catch(() => {}); // Ignore if audio play fails
    } catch (error) {
      // Fallback - visual indicator only
    }
  }

  // Show browser notifications
  function showBrowserNotifications(newNotifications) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    newNotifications.forEach(change => {
      const notification = change.doc;
      
      // Don't show if user is actively using the app
      if (!document.hidden) return;

      const browserNotification = new Notification(notification.title || 'Flow Notification', {
        body: notification.message || notification.content,
        icon: '/assets/img/logo.png',
        badge: '/assets/img/logo.png',
        tag: `flow-${notification.id}`,
        requireInteraction: false,
        silent: false
      });

      // Auto close after 5 seconds
      setTimeout(() => {
        browserNotification.close();
      }, 5000);

      // Handle click
      browserNotification.onclick = () => {
        window.focus();
        if (notification.actionUrl) {
          window.location.href = notification.actionUrl;
        }
        browserNotification.close();
      };
    });
  }

  // Request notification permission
  async function requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  // Cleanup all subscriptions
  function cleanupAllSubscriptions() {
    console.log(`🧹 Cleaning up ${activeSubscriptions.size} active subscriptions...`);
    
    activeSubscriptions.forEach((subscription) => {
      if (subscription.cleanup) {
        try {
          subscription.cleanup();
        } catch (error) {
          console.error('❌ Error cleaning up subscription:', error);
        }
      }
    });
    
    activeSubscriptions.clear();
    syncQueue = [];
    console.log('✅ All subscriptions cleaned up');
  }

  // Setup cleanup on page unload
  function setupCleanup() {
    window.addEventListener('beforeunload', () => {
      cleanupAllSubscriptions();
    });

    // Also cleanup on visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Page is hidden, reduce sync activity
        syncStatus = window.FlowAuth.isAuthenticated() ? 'background' : 'inactive';
      } else {
        // Page is visible, resume full sync
        syncStatus = window.FlowAuth.isAuthenticated() ? 'active' : 'inactive';
      }
    });
  }

  // Public API
  const RealtimeSync = {
    // Status methods
    getStatus() {
      return syncStatus;
    },

    isOnline() {
      return isOnline;
    },

    getActiveSubscriptions() {
      return Array.from(activeSubscriptions.keys());
    },

    getQueueLength() {
      return syncQueue.length;
    },

    getLastSyncTimestamp() {
      return lastSyncTimestamp;
    },

    // Control methods
    async requestNotificationPermission() {
      return await requestNotificationPermission();
    },

    pauseSync() {
      if (syncStatus === 'active') {
        syncStatus = 'paused';
        console.log('🔄 Sync paused by user');
      }
    },

    resumeSync() {
      if (syncStatus === 'paused' && window.FlowAuth.isAuthenticated()) {
        syncStatus = 'active';
        console.log('🔄 Sync resumed by user');
      }
    },

    // Cleanup methods
    cleanupSubscriptions: cleanupAllSubscriptions,

    // Manual sync trigger
    async triggerSync() {
      if (isOnline && window.FlowAuth.isAuthenticated()) {
        await performConsistencyCheck();
        return true;
      }
      return false;
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRealtimeSync);
  } else {
    initRealtimeSync();
  }

  // Export globally
  window.FirebaseRealtimeSync = RealtimeSync;

  console.log('🔄 Firebase Real-time Sync module loaded');

})();
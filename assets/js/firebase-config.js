// Firebase Configuration and Initialization
// This file manages Firebase setup and provides centralized access to Firebase services

/* eslint-env browser */

(function() {
  'use strict';

  // Development/Demo detection
  const isDevelopment = window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.includes('localhost') ||
                       window.location.search.includes('demo=true');

  // Firebase configuration for flow-pwa project
  const firebaseConfig = {
    apiKey: "AIzaSyAJ7QV35ydmmIxIwe9rCPHzD3AT8I6yiCY",
    authDomain: "flow-pwa.firebaseapp.com",
    projectId: "flow-pwa",
    storageBucket: "flow-pwa.firebasestorage.app",
    messagingSenderId: "940039973517",
    appId: "1:940039973517:web:4cee57759b916cb34850c4",
    measurementId: "G-8K4RD31KW0"
  };

  // Initialize Firebase app
  let app;
  let auth;
  let db;
  let storage;
  let analytics;
  let messaging;

  // Firebase service instances
  const FirebaseServices = {
    app: null,
    auth: null,
    db: null,
    storage: null,
    analytics: null,
    messaging: null,
    initialized: false
  };

  // Initialize Firebase services
  async function initializeFirebase() {
    // Prevent multiple initializations
    if (FirebaseServices.initialized) {
      console.log('🔥 Firebase already initialized, skipping...');
      return FirebaseServices;
    }

    try {
      console.log('🔥 Initializing Firebase...');

      // Check if Firebase SDK is loaded
      if (typeof firebase === 'undefined') {
        console.warn('⚠️ Firebase SDK not loaded. Running in mock mode for development.');
        initializeMockFirebase();
        return;
      }

      // Check if we have placeholder configuration (should use mock instead)
      if (firebaseConfig.apiKey === 'your-api-key-here' ||
          firebaseConfig.projectId === 'your-project-id' ||
          isDevelopment && window.location.search.includes('mock=true')) {
        console.warn('⚠️ Placeholder Firebase config detected or mock mode requested. Running in mock mode for development.');
        initializeMockFirebase();
        return;
      }

      // Initialize Firebase app
      if (!firebase.apps.length) {
        app = firebase.initializeApp(firebaseConfig);
        console.log('✅ Firebase app initialized');
      } else {
        app = firebase.app();
        console.log('✅ Firebase app already initialized');
      }

      // Initialize Authentication
      console.log('🔍 Creating Firebase Auth instance...');
      auth = firebase.auth();
      console.log('🔍 Setting device language...');
      auth.useDeviceLanguage();

      // Configure auth persistence (skip timeout that might cause issues)
      console.log('🔍 Setting auth persistence...');
      try {
        await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        console.log('✅ Firebase Auth persistence configured');
      } catch (error) {
        console.warn('⚠️ Auth persistence setup failed, continuing without persistence:', error.message);
      }
      console.log('✅ Firebase Auth initialized');

      // Initialize Firestore with settings configured before first use
      console.log('🔍 Creating Firestore instance...');
      db = firebase.firestore();
      console.log('🔍 Firestore instance created');

      // Configure Firestore settings before enabling persistence
      try {
        db.settings({
          cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
        });
      } catch (err) {
        console.log('⚠️ Firestore settings already configured');
      }

      // Enable Firestore offline persistence (with timeout to prevent hanging)
      try {
        console.log('🔍 Enabling Firestore persistence...');

        await Promise.race([
          (async () => {
            // Try modern persistence API first
            if (db.enableMultiTabIndexedDbPersistence) {
              await db.enableMultiTabIndexedDbPersistence();
              console.log('✅ Firestore multi-tab persistence enabled');
            } else {
              // Fallback to regular persistence
              console.log('🔍 Using fallback persistence...');
              await db.enablePersistence({
                synchronizeTabs: true
              });
              console.log('✅ Firestore offline persistence enabled');
            }
          })(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Firestore persistence timeout')), 5000)
          )
        ]);
      } catch (err) {
        if (err.code === 'failed-precondition') {
          console.log('⚠️ Firestore persistence failed: Multiple tabs open or already enabled');
        } else if (err.code === 'unimplemented') {
          console.log('⚠️ Firestore persistence not supported in this browser');
        } else {
          console.log('⚠️ Firestore persistence setup failed:', err.message);
        }
      }

      // Initialize Cloud Storage (optional)
      if (firebase.storage) {
        try {
          storage = firebase.storage();
          console.log('✅ Firebase Storage initialized');
        } catch (error) {
          console.warn('⚠️ Firebase Storage initialization failed:', error.message);
        }
      } else {
        console.log('💾 Firebase Storage SDK not loaded, skipping...');
      }

      // Initialize Analytics (optional) - skip in development to avoid noise
      if (firebase.analytics && !isDevelopment) {
        try {
          analytics = firebase.analytics();
          console.log('✅ Firebase Analytics initialized');
        } catch (error) {
          console.warn('⚠️ Firebase Analytics initialization failed:', error.message);
        }
      } else {
        console.log('📊 Firebase Analytics skipped (development mode or SDK not loaded)');
      }

      // Initialize Cloud Messaging (optional) - only in production with valid config
      if (firebase.messaging && firebase.messaging.isSupported && firebase.messaging.isSupported() && !isDevelopment) {
        try {
          messaging = firebase.messaging();
          console.log('✅ Firebase Messaging initialized');
        } catch (error) {
          console.warn('⚠️ Firebase Messaging initialization failed:', error.message);
        }
      } else {
        console.log('📱 Firebase Messaging skipped (development mode, not supported, or SDK not loaded)');
      }

      // Store service instances
      FirebaseServices.app = app;
      FirebaseServices.auth = auth;
      FirebaseServices.db = db;
      FirebaseServices.storage = storage;
      FirebaseServices.analytics = analytics;
      FirebaseServices.messaging = messaging;
      FirebaseServices.initialized = true;

      // Update global reference immediately
      window.Firebase = FirebaseServices;

      // Set up auth state listener
      setupAuthStateListener();

      // Set up network state monitoring
      setupNetworkMonitoring();

      console.log('🎉 Firebase initialization complete');
      console.log('🔍 Firebase.auth available:', !!FirebaseServices.auth);
      console.log('🔍 Firebase.db available:', !!FirebaseServices.db);

      // Emit initialization event
      document.dispatchEvent(new CustomEvent('firebaseInitialized', {
        detail: FirebaseServices
      }));

      return FirebaseServices;

    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
      throw error;
    }
  }

  // Set up authentication state listener
  function setupAuthStateListener() {
    auth.onAuthStateChanged((user) => {
      console.log('🔐 Auth state changed:', user ? user.email : 'No user');
      
      // Update global auth state
      if (window.FlowAuth) {
        window.FlowAuth._updateFirebaseUser(user);
      }

      // Emit auth state change event
      document.dispatchEvent(new CustomEvent('authStateChanged', {
        detail: { user, isAuthenticated: !!user }
      }));
    });

    // Listen for auth errors
    auth.onIdTokenChanged(async (user) => {
      if (user) {
        try {
          // Refresh token to ensure it's valid
          await user.getIdToken(true);
        } catch (error) {
          console.error('❌ Token refresh failed:', error);
          // Handle token refresh failure
          if (window.FlowAuth) {
            window.FlowAuth._handleAuthError(error);
          }
        }
      }
    });
  }

  // Set up network state monitoring
  function setupNetworkMonitoring() {
    // Track network state
    let isOnline = navigator.onLine;
    let firestoreConnected = false;

    // Monitor online/offline status
    window.addEventListener('online', () => {
      console.log('🌐 Network connection restored');
      isOnline = true;

      // Re-enable Firestore network
      if (db && !firestoreConnected) {
        console.log('🔄 Attempting to re-enable Firestore...');
        db.enableNetwork().then(() => {
          console.log('✅ Firestore network re-enabled');
          firestoreConnected = true;
        }).catch((error) => {
          console.error('❌ Failed to re-enable Firestore:', error);
        });
      }

      document.dispatchEvent(new CustomEvent('networkStatusChanged', {
        detail: { online: true, firestoreConnected }
      }));
    });

    window.addEventListener('offline', () => {
      console.log('📴 Network connection lost');
      isOnline = false;
      firestoreConnected = false;

      document.dispatchEvent(new CustomEvent('networkStatusChanged', {
        detail: { online: false, firestoreConnected: false }
      }));
    });

    // Monitor Firestore connection state with retry logic
    if (db) {
      let retryCount = 0;
      const maxRetries = 3;

      async function enableFirestoreNetwork() {
        try {
          await db.enableNetwork();
          console.log('✅ Firestore network enabled');
          firestoreConnected = true;
          retryCount = 0; // Reset on success
        } catch (error) {
          console.error('❌ Firestore network error:', error);
          firestoreConnected = false;

          if (retryCount < maxRetries && isOnline) {
            retryCount++;
            console.log(`🔄 Retrying Firestore connection... (${retryCount}/${maxRetries})`);
            setTimeout(enableFirestoreNetwork, 2000 * retryCount);
          }
        }
      }

      enableFirestoreNetwork();
    }

    // Expose network status globally
    window.NetworkStatus = {
      isOnline: () => isOnline,
      isFirestoreConnected: () => firestoreConnected,
      retry: () => {
        if (db && isOnline && !firestoreConnected) {
          console.log('🔄 Manual Firestore retry requested');
          db.enableNetwork().then(() => {
            console.log('✅ Firestore network manually re-enabled');
            firestoreConnected = true;
          }).catch((error) => {
            console.error('❌ Manual Firestore retry failed:', error);
          });
        }
      }
    };
  }

  // Utility functions for Firebase operations
  const FirebaseUtils = {
    // Get current user
    getCurrentUser() {
      return auth ? auth.currentUser : null;
    },

    // Check if user is authenticated
    isAuthenticated() {
      return !!(auth && auth.currentUser);
    },

    // Get user's ID token
    async getIdToken(forceRefresh = false) {
      if (!auth || !auth.currentUser) {
        throw new Error('No authenticated user');
      }
      return await auth.currentUser.getIdToken(forceRefresh);
    },

    // Get Firestore timestamp
    getTimestamp() {
      return firebase.firestore.FieldValue.serverTimestamp();
    },

    // Get Firestore increment
    increment(value = 1) {
      return firebase.firestore.FieldValue.increment(value);
    },

    // Get Firestore array union
    arrayUnion(...elements) {
      return firebase.firestore.FieldValue.arrayUnion(...elements);
    },

    // Get Firestore array remove
    arrayRemove(...elements) {
      return firebase.firestore.FieldValue.arrayRemove(...elements);
    },

    // Create batch operation
    createBatch() {
      return db.batch();
    },

    // Create transaction
    runTransaction(updateFunction) {
      return db.runTransaction(updateFunction);
    },

    // Upload file to Storage
    async uploadFile(file, path, metadata = {}) {
      const storageRef = storage.ref(path);
      const uploadTask = storageRef.put(file, metadata);
      
      return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            document.dispatchEvent(new CustomEvent('uploadProgress', {
              detail: { progress, snapshot }
            }));
          },
          (error) => reject(error),
          async () => {
            const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
            resolve({ downloadURL, snapshot: uploadTask.snapshot });
          }
        );
      });
    },

    // Delete file from Storage
    async deleteFile(path) {
      const storageRef = storage.ref(path);
      return await storageRef.delete();
    },

    // Send push notification token to server
    async saveFCMToken() {
      if (!messaging) return null;
      
      try {
        const token = await messaging.getToken();
        if (token && auth.currentUser) {
          await db.collection('users').doc(auth.currentUser.uid).update({
            fcmTokens: firebase.firestore.FieldValue.arrayUnion(token),
            lastTokenUpdate: firebase.firestore.FieldValue.serverTimestamp()
          });
        }
        return token;
      } catch (error) {
        console.error('❌ FCM token error:', error);
        return null;
      }
    }
  };

  // Error handling utilities
  const FirebaseErrorHandler = {
    // Handle Firebase Auth errors
    handleAuthError(error) {
      const errorMessages = {
        'auth/user-not-found': 'No account found with this email address.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/weak-password': 'Password should be at least 6 characters long.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/user-disabled': 'This account has been disabled.',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Please check your connection.',
        'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
        'auth/cancelled-popup-request': 'Sign-in was cancelled.',
        'auth/popup-blocked': 'Sign-in popup was blocked by your browser.'
      };

      return errorMessages[error.code] || error.message;
    },

    // Handle Firestore errors
    handleFirestoreError(error) {
      const errorMessages = {
        'permission-denied': 'You don\'t have permission to access this data.',
        'unavailable': 'Service is currently unavailable. Please try again.',
        'not-found': 'The requested document was not found.',
        'already-exists': 'This document already exists.',
        'resource-exhausted': 'Quota exceeded. Please try again later.',
        'failed-precondition': 'The operation was rejected due to invalid state.',
        'aborted': 'The operation was aborted due to a conflict.',
        'out-of-range': 'The requested data is out of range.',
        'unimplemented': 'This operation is not supported.',
        'internal': 'An internal error occurred.',
        'deadline-exceeded': 'The operation took too long to complete.'
      };

      return errorMessages[error.code] || error.message;
    },

    // Handle Storage errors
    handleStorageError(error) {
      const errorMessages = {
        'storage/object-not-found': 'The file you\'re looking for doesn\'t exist.',
        'storage/bucket-not-found': 'Storage bucket not found.',
        'storage/project-not-found': 'Project not found.',
        'storage/quota-exceeded': 'Storage quota exceeded.',
        'storage/unauthenticated': 'Please sign in to access this file.',
        'storage/unauthorized': 'You don\'t have permission to access this file.',
        'storage/retry-limit-exceeded': 'Maximum retry limit exceeded.',
        'storage/invalid-checksum': 'File upload failed due to checksum mismatch.',
        'storage/canceled': 'File operation was cancelled.',
        'storage/invalid-event-name': 'Invalid event name provided.',
        'storage/invalid-url': 'Invalid storage URL provided.',
        'storage/invalid-argument': 'Invalid argument provided.',
        'storage/no-default-bucket': 'No default storage bucket found.',
        'storage/cannot-slice-blob': 'File operation failed.',
        'storage/server-file-wrong-size': 'File size mismatch on server.'
      };

      return errorMessages[error.code] || error.message;
    }
  };

  // Mock Firebase for development when SDK is not available
  function initializeMockFirebase() {
    // Prevent multiple mock initializations
    if (FirebaseServices.initialized) {
      console.log('🎭 Mock Firebase already initialized, skipping...');
      return FirebaseServices;
    }

    console.log('🎭 Initializing mock Firebase for development...');

    // Create mock Firebase services
    const mockAuth = {
      currentUser: null,
      onAuthStateChanged: (callback) => {
        // Simulate no user initially
        setTimeout(() => callback(null), 100);
        return () => {}; // unsubscribe function
      },
      onIdTokenChanged: (callback) => {
        // Mock token change listener
        setTimeout(() => callback(null), 100);
        return () => {}; // unsubscribe function
      },
      createUserWithEmailAndPassword: async (email, password) => {
        console.log('🎭 Mock createUserWithEmailAndPassword called - use test bypass instead');
        throw new Error('Mock Firebase: Use test bypass for authentication in development mode');
      },
      signInWithEmailAndPassword: async (email, password) => {
        console.log('🎭 Mock signInWithEmailAndPassword called - use test bypass instead');
        throw new Error('Mock Firebase: Use test bypass for authentication in development mode');
      },
      signInWithPopup: async (provider) => {
        console.log('🎭 Mock signInWithPopup called - use test bypass instead');
        throw new Error('Mock Firebase: Use test bypass for authentication in development mode');
      },
      signOut: async () => {
        console.log('🎭 Mock signOut');
        return Promise.resolve();
      },
      setPersistence: async () => {
        console.log('🎭 Mock setPersistence');
        return Promise.resolve();
      },
      useDeviceLanguage: () => {
        console.log('🎭 Mock useDeviceLanguage');
      }
    };

    const mockDb = {
      collection: (name) => ({
        doc: (id) => ({
          get: () => Promise.resolve({ exists: false, data: () => ({}) }),
          set: () => Promise.resolve(),
          update: () => Promise.resolve(),
          delete: () => Promise.resolve()
        }),
        where: () => ({
          limit: () => ({
            get: () => Promise.resolve({ empty: true, docs: [] })
          })
        })
      }),
      settings: () => {
        console.log('🎭 Mock Firestore settings');
      },
      enablePersistence: () => {
        console.log('🎭 Mock enablePersistence');
        return Promise.resolve();
      },
      enableNetwork: () => {
        console.log('🎭 Mock enableNetwork');
        return Promise.resolve();
      }
    };

    const mockStorage = {
      ref: (path) => ({
        put: () => ({
          on: (event, progress, error, complete) => {
            setTimeout(complete, 100);
          },
          snapshot: { ref: { getDownloadURL: () => Promise.resolve('mock-url') } }
        }),
        delete: () => Promise.resolve()
      })
    };

    // Store mock services
    FirebaseServices.auth = mockAuth;
    FirebaseServices.db = mockDb;
    FirebaseServices.storage = mockStorage;
    FirebaseServices.analytics = null; // No analytics in mock mode
    FirebaseServices.messaging = null; // No messaging in mock mode
    FirebaseServices.initialized = true;

    // Emit initialization event
    document.dispatchEvent(new CustomEvent('firebaseInitialized', {
      detail: FirebaseServices
    }));

    console.log('🎭 Mock Firebase initialized');
    return FirebaseServices;
  }

  // Wait for DOM and Firebase SDK to be ready, then initialize Firebase
  function waitForFirebaseSDK() {
    if (typeof firebase !== 'undefined') {
      initializeFirebase();
    } else {
      console.log('⏳ Waiting for Firebase SDK to load...');
      setTimeout(waitForFirebaseSDK, 100);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForFirebaseSDK);
  } else {
    waitForFirebaseSDK();
  }

  // Export Firebase services and utilities globally
  window.Firebase = FirebaseServices;
  window.FirebaseUtils = FirebaseUtils;
  window.FirebaseErrorHandler = FirebaseErrorHandler;

  // Also make individual services available
  window.firebaseApp = () => FirebaseServices.app;
  window.firebaseAuth = () => FirebaseServices.auth;
  window.firebaseDb = () => FirebaseServices.db;
  window.firebaseStorage = () => FirebaseServices.storage;
  window.firebaseAnalytics = () => FirebaseServices.analytics;
  window.firebaseMessaging = () => FirebaseServices.messaging;

  console.log('🔥 Firebase configuration module loaded');

})();
// Firebase Configuration and Initialization
// This file manages Firebase setup and provides centralized access to Firebase services

/* eslint-env browser */

(function() {
  'use strict';

  // Firebase configuration - Replace with your actual Firebase config
  const firebaseConfig = {
    apiKey: "your-api-key-here",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456",
    measurementId: "G-ABCDEFGHIJ"
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
    try {
      console.log('🔥 Initializing Firebase...');

      // Check if Firebase SDK is loaded
      if (typeof firebase === 'undefined') {
        throw new Error('Firebase SDK not loaded. Please include Firebase scripts.');
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
      auth = firebase.auth();
      auth.useDeviceLanguage();
      
      // Configure auth persistence
      await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
      console.log('✅ Firebase Auth initialized with local persistence');

      // Initialize Firestore
      db = firebase.firestore();
      
      // Enable Firestore offline persistence
      try {
        await db.enablePersistence({
          synchronizeTabs: true
        });
        console.log('✅ Firestore offline persistence enabled');
      } catch (err) {
        if (err.code === 'failed-precondition') {
          console.log('⚠️ Firestore persistence failed: Multiple tabs open');
        } else if (err.code === 'unimplemented') {
          console.log('⚠️ Firestore persistence not supported in this browser');
        }
      }

      // Configure Firestore settings
      db.settings({
        cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
      });

      // Initialize Cloud Storage
      storage = firebase.storage();
      console.log('✅ Firebase Storage initialized');

      // Initialize Analytics (optional)
      if (firebase.analytics) {
        analytics = firebase.analytics();
        console.log('✅ Firebase Analytics initialized');
      }

      // Initialize Cloud Messaging (optional)
      if (firebase.messaging && firebase.messaging.isSupported()) {
        messaging = firebase.messaging();
        console.log('✅ Firebase Messaging initialized');
      }

      // Store service instances
      FirebaseServices.app = app;
      FirebaseServices.auth = auth;
      FirebaseServices.db = db;
      FirebaseServices.storage = storage;
      FirebaseServices.analytics = analytics;
      FirebaseServices.messaging = messaging;
      FirebaseServices.initialized = true;

      // Set up auth state listener
      setupAuthStateListener();

      // Set up network state monitoring
      setupNetworkMonitoring();

      console.log('🎉 Firebase initialization complete');
      
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
    // Monitor online/offline status
    window.addEventListener('online', () => {
      console.log('🌐 Network connection restored');
      document.dispatchEvent(new CustomEvent('networkStatusChanged', {
        detail: { online: true }
      }));
    });

    window.addEventListener('offline', () => {
      console.log('📴 Network connection lost');
      document.dispatchEvent(new CustomEvent('networkStatusChanged', {
        detail: { online: false }
      }));
    });

    // Monitor Firestore connection state
    if (db) {
      db.enableNetwork().then(() => {
        console.log('✅ Firestore network enabled');
      }).catch((error) => {
        console.error('❌ Firestore network error:', error);
      });
    }
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

  // Wait for DOM to be ready, then initialize Firebase
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFirebase);
  } else {
    initializeFirebase();
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
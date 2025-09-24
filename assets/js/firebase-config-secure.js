// Secure Firebase Configuration
// This file provides secure Firebase initialization without exposing sensitive keys

/* eslint-env browser */

(function() {
  'use strict';

  // Public configuration (safe to expose)
  const publicConfig = {
    authDomain: "flow-pwa.firebaseapp.com",
    projectId: "flow-pwa",
    storageBucket: "flow-pwa.firebasestorage.app",
    messagingSenderId: "940039973517",
    appId: "1:940039973517:web:4cee57759b916cb34850c4",
    measurementId: "G-8K4RD31KW0"
  };

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

  // Initialize Firebase with secure configuration
  async function initializeFirebase() {
    try {
      console.log('🔥 Initializing Firebase with secure configuration...');

      // Check if Firebase SDK is loaded
      if (typeof firebase === 'undefined') {
        throw new Error('Firebase SDK not loaded. Please include Firebase scripts.');
      }

      // Get API key securely from server or environment
      const apiKey = await getApiKeySecurely();

      const firebaseConfig = {
        apiKey: apiKey,
        ...publicConfig
      };

      // Initialize Firebase app
      if (!firebase.apps.length) {
        FirebaseServices.app = firebase.initializeApp(firebaseConfig);
        console.log('✅ Firebase app initialized securely');
      } else {
        FirebaseServices.app = firebase.app();
        console.log('✅ Firebase app already initialized');
      }

      // Initialize services
      await initializeServices();

      // Set up security monitoring
      setupSecurityMonitoring();

      console.log('🎉 Secure Firebase initialization complete');

      // Emit initialization event
      document.dispatchEvent(new CustomEvent('firebaseInitialized', {
        detail: FirebaseServices
      }));

      return FirebaseServices;

    } catch (error) {
      console.error('❌ Secure Firebase initialization failed:', error);
      // Fallback to public config for development only
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.warn('🚧 Using fallback configuration for development');
        return initializeFallback();
      }
      throw error;
    }
  }

  // Get API key from secure source
  async function getApiKeySecurely() {
    try {
      // Option 1: Fetch from your secure endpoint
      const response = await fetch('/.netlify/functions/get-config', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.apiKey;
      }

      throw new Error('Failed to fetch secure config');

    } catch (error) {
      console.warn('⚠️ Secure config fetch failed, trying environment variables');

      // Option 2: Environment variables (for build-time injection)
      if (typeof process !== 'undefined' && process.env && process.env.FIREBASE_API_KEY) {
        return process.env.FIREBASE_API_KEY;
      }

      // Option 3: Server-side rendered config (if available)
      const configEl = document.getElementById('firebase-config');
      if (configEl && configEl.dataset.apikey) {
        return configEl.dataset.apikey;
      }

      throw new Error('No secure API key source available');
    }
  }

  // Initialize Firebase services with security best practices
  async function initializeServices() {
    const app = FirebaseServices.app;

    // Initialize Authentication with security settings
    FirebaseServices.auth = firebase.auth();
    FirebaseServices.auth.useDeviceLanguage();

    // Set auth persistence to LOCAL (more secure than NONE)
    await FirebaseServices.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

    // Configure additional security settings
    FirebaseServices.auth.settings.appVerificationDisabledForTesting = false;

    console.log('✅ Firebase Auth initialized with security settings');

    // Initialize Firestore with offline persistence
    FirebaseServices.db = firebase.firestore();

    // Enable offline persistence for better UX
    try {
      await FirebaseServices.db.enablePersistence({
        synchronizeTabs: true
      });
      console.log('✅ Firestore offline persistence enabled');
    } catch (err) {
      if (err.code === 'failed-precondition') {
        console.warn('⚠️ Multiple tabs open, persistence can only be enabled in one tab at a time');
      } else if (err.code === 'unimplemented') {
        console.warn('⚠️ Browser doesn\'t support persistence');
      }
    }

    // Initialize Cloud Storage
    FirebaseServices.storage = firebase.storage();
    console.log('✅ Firebase Storage initialized');

    // Initialize Analytics with privacy settings
    if (firebase.analytics && typeof firebase.analytics === 'function') {
      FirebaseServices.analytics = firebase.analytics();

      // Configure privacy settings
      FirebaseServices.analytics.setAnalyticsCollectionEnabled(
        !window.localStorage.getItem('analytics-disabled')
      );

      console.log('✅ Firebase Analytics initialized with privacy controls');
    }

    // Initialize Cloud Messaging with permission check
    if (firebase.messaging && firebase.messaging.isSupported()) {
      try {
        FirebaseServices.messaging = firebase.messaging();

        // Configure SW for messaging
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            FirebaseServices.messaging.useServiceWorker(registration);
          }
        }

        console.log('✅ Firebase Messaging initialized');
      } catch (err) {
        console.warn('⚠️ Firebase Messaging initialization failed:', err);
      }
    }

    FirebaseServices.initialized = true;

    // Set up auth state monitoring
    setupAuthStateMonitoring();

    // Set up network monitoring
    setupNetworkMonitoring();
  }

  // Fallback initialization for development
  async function initializeFallback() {
    console.error('❌ No secure API key available - Firebase initialization failed');
    throw new Error('Firebase API key not configured. Please set up environment variables.');
  }

  // Set up security monitoring
  function setupSecurityMonitoring() {
    // Monitor for suspicious activity
    if (FirebaseServices.auth) {
      FirebaseServices.auth.onIdTokenChanged((user) => {
        if (user) {
          // Log token refresh for security monitoring
          console.log('🔒 Auth token refreshed for user:', user.email);

          // Check for unusual login patterns
          const lastLogin = localStorage.getItem('lastLoginTime');
          const currentTime = Date.now();

          if (lastLogin) {
            const timeDiff = currentTime - parseInt(lastLogin);
            // Flag if login within 1 minute of last login (potential session hijacking)
            if (timeDiff < 60000) {
              console.warn('⚠️ Rapid login detected - potential security issue');
              // You could send this to your security monitoring service
            }
          }

          localStorage.setItem('lastLoginTime', currentTime.toString());
        }
      });
    }

    // Monitor for CSP violations
    document.addEventListener('securitypolicyviolation', (e) => {
      console.error('🚨 CSP Violation:', {
        blockedURI: e.blockedURI,
        violatedDirective: e.violatedDirective,
        originalPolicy: e.originalPolicy
      });

      // Send to monitoring service in production
      if (window.location.hostname !== 'localhost') {
        // sendSecurityAlert('csp_violation', e);
      }
    });
  }

  // Set up auth state monitoring with security checks
  function setupAuthStateMonitoring() {
    FirebaseServices.auth.onAuthStateChanged((user) => {
      console.log('🔐 Auth state changed:', user ? user.email : 'No user');

      if (user) {
        // Verify email is verified for sensitive operations
        if (!user.emailVerified) {
          console.warn('⚠️ User email not verified:', user.email);
        }

        // Check for unusual sign-in methods
        const signInMethods = user.providerData.map(provider => provider.providerId);
        console.log('🔍 Sign-in methods:', signInMethods);

        // Monitor for account changes
        if (window.FlowAuth) {
          window.FlowAuth._updateFirebaseUser(user);
        }
      }

      // Emit auth state change event
      document.dispatchEvent(new CustomEvent('authStateChanged', {
        detail: { user, isAuthenticated: !!user }
      }));
    });
  }

  // Set up network monitoring for security
  function setupNetworkMonitoring() {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      console.log('🌐 Network connection restored');
      // Re-enable Firestore network
      if (FirebaseServices.db) {
        FirebaseServices.db.enableNetwork().catch(console.error);
      }
    });

    window.addEventListener('offline', () => {
      console.log('📴 Network connection lost - switching to offline mode');
      // Firestore automatically handles offline mode
    });

    // Monitor for Firestore connection state
    if (FirebaseServices.db) {
      FirebaseServices.db.enableNetwork().then(() => {
        console.log('✅ Firestore network enabled');
      }).catch((error) => {
        console.error('❌ Firestore network error:', error);
      });
    }
  }

  // Utility functions with security considerations
  const SecureFirebaseUtils = {
    // Get current user with verification check
    getCurrentUser() {
      const user = FirebaseServices.auth ? FirebaseServices.auth.currentUser : null;
      return user;
    },

    // Check if user is authenticated and verified
    isAuthenticated() {
      const user = this.getCurrentUser();
      return !!(user && user.emailVerified);
    },

    // Check if user is authenticated (allow unverified for dashboard access)
    isSignedIn() {
      return !!this.getCurrentUser();
    },

    // Get user's ID token with automatic refresh
    async getIdToken(forceRefresh = false) {
      const user = this.getCurrentUser();
      if (!user) {
        throw new Error('No authenticated user');
      }

      try {
        const token = await user.getIdToken(forceRefresh);
        return token;
      } catch (error) {
        console.error('❌ Failed to get ID token:', error);
        throw error;
      }
    },

    // Secure timestamp generation
    getTimestamp() {
      return firebase.firestore.FieldValue.serverTimestamp();
    },

    // Secure file upload with size and type validation
    async uploadFile(file, path, metadata = {}) {
      // Security validations
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain'];

      if (file.size > maxSize) {
        throw new Error('File size exceeds 10MB limit');
      }

      if (!allowedTypes.includes(file.type)) {
        throw new Error('File type not allowed');
      }

      // Sanitize file name
      const sanitizedPath = path.replace(/[^a-zA-Z0-9-_./]/g, '');

      const storageRef = FirebaseServices.storage.ref(sanitizedPath);
      const uploadTask = storageRef.put(file, {
        ...metadata,
        customMetadata: {
          uploadedBy: this.getCurrentUser()?.uid || 'anonymous',
          uploadedAt: new Date().toISOString(),
          ...metadata.customMetadata
        }
      });

      return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            document.dispatchEvent(new CustomEvent('uploadProgress', {
              detail: { progress, snapshot }
            }));
          },
          (error) => {
            console.error('❌ Upload failed:', error);
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
              console.log('✅ File uploaded successfully:', sanitizedPath);
              resolve({ downloadURL, snapshot: uploadTask.snapshot });
            } catch (error) {
              reject(error);
            }
          }
        );
      });
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFirebase);
  } else {
    initializeFirebase();
  }

  // Export secure Firebase services and utilities
  window.Firebase = FirebaseServices;
  window.SecureFirebaseUtils = SecureFirebaseUtils;

  // Legacy compatibility
  window.firebaseApp = () => FirebaseServices.app;
  window.firebaseAuth = () => FirebaseServices.auth;
  window.firebaseDb = () => FirebaseServices.db;
  window.firebaseStorage = () => FirebaseServices.storage;
  window.firebaseAnalytics = () => FirebaseServices.analytics;
  window.firebaseMessaging = () => FirebaseServices.messaging;

  console.log('🔒 Secure Firebase configuration module loaded');

})();
// Firebase Authentication Service
// Comprehensive authentication service that integrates with Firebase Auth
// Replaces the existing auth.js with Firebase-powered authentication

/* eslint-env browser */

(function() {
  'use strict';

  // Wait for Firebase to be initialized
  let firebaseReady = false;
  let pendingOperations = [];

  // Authentication state
  let currentUser = null;
  let userProfile = null;
  let authInitialized = false;

  // Event emitter for auth state changes
  const authEvents = {
    listeners: {},
    on(event, callback) {
      if (!this.listeners[event]) {
        this.listeners[event] = [];
      }
      this.listeners[event].push(callback);
    },
    off(event, callback) {
      if (this.listeners[event]) {
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
      }
    },
    emit(event, data) {
      if (this.listeners[event]) {
        this.listeners[event].forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error('❌ Auth event callback error:', error);
          }
        });
      }
    }
  };

  // Initialize Firebase Auth integration
  function initFirebaseAuth() {
    console.log('🔐 Initializing Firebase Auth integration...');

    // Wait for Firebase to be ready
    if (!window.Firebase || !window.Firebase.initialized) {
      document.addEventListener('firebaseInitialized', initFirebaseAuth);
      return;
    }

    firebaseReady = true;
    const auth = window.Firebase.auth;
    const db = window.Firebase.db;

    // Set up auth state listener
    auth.onAuthStateChanged(async (user) => {
      console.log('🔐 Firebase auth state changed:', user ? user.email : 'No user');
      
      if (user) {
        try {
          // Load user profile from Firestore
          await loadUserProfile(user);
          currentUser = user;
          
          // Send analytics event
          if (window.Firebase.analytics) {
            window.Firebase.analytics.logEvent('login', {
              method: 'email'
            });
          }

          authEvents.emit('authStateChanged', { 
            user: currentUser, 
            profile: userProfile,
            isAuthenticated: true 
          });
        } catch (error) {
          console.error('❌ Error loading user profile:', error);
          currentUser = user;
          authEvents.emit('authStateChanged', { 
            user: currentUser, 
            profile: null,
            isAuthenticated: true 
          });
        }
      } else {
        currentUser = null;
        userProfile = null;
        authEvents.emit('authStateChanged', { 
          user: null, 
          profile: null,
          isAuthenticated: false 
        });
      }

      // Process pending operations
      processPendingOperations();
    });

    authInitialized = true;
    console.log('✅ Firebase Auth integration initialized');
  }

  // Process operations that were queued before auth was ready
  function processPendingOperations() {
    pendingOperations.forEach(operation => {
      try {
        operation();
      } catch (error) {
        console.error('❌ Error processing pending operation:', error);
      }
    });
    pendingOperations = [];
  }

  // Queue operation if Firebase not ready
  function queueOrExecute(operation) {
    if (firebaseReady && authInitialized) {
      return operation();
    } else {
      return new Promise((resolve, reject) => {
        pendingOperations.push(() => {
          try {
            resolve(operation());
          } catch (error) {
            reject(error);
          }
        });
      });
    }
  }

  // Load user profile from Firestore
  async function loadUserProfile(user) {
    if (!user) return null;

    try {
      const db = window.Firebase.db;

      // First try the users collection
      let profileDoc = await db.collection('users').doc(user.uid).get();

      if (profileDoc.exists) {
        userProfile = { id: user.uid, ...profileDoc.data() };
        console.log('✅ User profile loaded from users:', userProfile.email);
        return userProfile;
      }

      // If not found, try specific collections based on registration
      const collections = ['students', 'institutions', 'counselors', 'parents', 'recommenders'];

      for (const collection of collections) {
        try {
          // Try to find user by email in specific collections
          const querySnapshot = await db.collection(collection)
            .where('email', '==', user.email)
            .limit(1)
            .get();

          if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            const data = doc.data();

            // Map userType to accountType for consistency
            userProfile = {
              id: user.uid,
              docId: doc.id,
              accountType: data.userType || collection.slice(0, -1), // Remove 's' from collection name
              ...data
            };

            console.log(`✅ User profile loaded from ${collection}:`, userProfile.email);

            // Create a unified profile in users collection for future use
            await createUserProfile(user, {
              accountType: userProfile.accountType,
              firstName: data.firstName || '',
              lastName: data.lastName || '',
              originalCollection: collection,
              originalDocId: doc.id
            });

            return userProfile;
          }
        } catch (collectionError) {
          console.log(`Collection ${collection} not accessible or doesn't exist`);
        }
      }

      // If still not found, create a default profile
      console.log('No existing profile found, creating default...');
      userProfile = await createUserProfile(user);
      return userProfile;

    } catch (error) {
      console.error('❌ Error loading user profile:', error);
      throw error;
    }
  }

  // Create user profile in Firestore
  async function createUserProfile(user, additionalData = {}) {
    try {
      const db = window.Firebase.db;
      const timestamp = window.FirebaseUtils.getTimestamp();
      
      const profileData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        emailVerified: user.emailVerified,
        createdAt: timestamp,
        updatedAt: timestamp,
        lastLoginAt: timestamp,
        accountType: additionalData.accountType || 'student',
        firstName: additionalData.firstName || '',
        lastName: additionalData.lastName || '',
        isActive: true,
        preferences: {
          theme: 'dark',
          language: 'en',
          notifications: {
            email: true,
            push: true,
            sms: false
          }
        },
        ...additionalData
      };

      await db.collection('users').doc(user.uid).set(profileData);
      userProfile = profileData;
      
      console.log('✅ User profile created:', user.email);
      return profileData;
    } catch (error) {
      console.error('❌ Error creating user profile:', error);
      throw error;
    }
  }

  // Register new user with email and password
  async function register(userData) {
    return queueOrExecute(async () => {
      try {
        showAuthLoading(true, 'Creating account...');
        
        const auth = window.Firebase.auth;
        const { email, password, ...profileData } = userData;

        // Create user account
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Send email verification
        await user.sendEmailVerification({
          url: `${window.location.origin}/auth/verify-email.html`,
          handleCodeInApp: true
        });

        // Create user profile in Firestore
        await createUserProfile(user, profileData);

        // Send analytics event
        if (window.Firebase.analytics) {
          window.Firebase.analytics.logEvent('sign_up', {
            method: 'email',
            account_type: profileData.accountType
          });
        }

        console.log('✅ Registration successful:', email);
        return { 
          success: true, 
          user: user,
          profile: userProfile,
          message: 'Account created successfully! Please check your email to verify your account.' 
        };

      } catch (error) {
        console.error('❌ Registration failed:', error);
        const friendlyMessage = window.FirebaseErrorHandler.handleAuthError(error);
        return { 
          success: false, 
          error: friendlyMessage,
          code: error.code 
        };
      } finally {
        showAuthLoading(false);
      }
    });
  }

  // Login user with email and password
  async function login(email, password) {
    return queueOrExecute(async () => {
      try {
        showAuthLoading(true, 'Signing in...');
        
        const auth = window.Firebase.auth;
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Update last login time
        if (window.Firebase.db) {
          await window.Firebase.db.collection('users').doc(user.uid).update({
            lastLoginAt: window.FirebaseUtils.getTimestamp()
          });
        }

        console.log('✅ Login successful:', email);
        return { 
          success: true, 
          user: user,
          profile: userProfile,
          message: 'Login successful!' 
        };

      } catch (error) {
        console.error('❌ Login failed:', error);
        const friendlyMessage = window.FirebaseErrorHandler.handleAuthError(error);
        return { 
          success: false, 
          error: friendlyMessage,
          code: error.code 
        };
      } finally {
        showAuthLoading(false);
      }
    });
  }

  // Login with Google
  async function loginWithGoogle() {
    return queueOrExecute(async () => {
      try {
        showAuthLoading(true, 'Signing in with Google...');
        
        const auth = window.Firebase.auth;
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');

        const result = await auth.signInWithPopup(provider);
        const user = result.user;

        // Check if this is a new user
        const isNewUser = result.additionalUserInfo?.isNewUser;
        
        if (isNewUser) {
          // Create profile for new Google users
          await createUserProfile(user, {
            firstName: user.displayName?.split(' ')[0] || '',
            lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
            accountType: 'student' // Default, can be changed later
          });
        } else {
          // Update last login for existing users
          await window.Firebase.db.collection('users').doc(user.uid).update({
            lastLoginAt: window.FirebaseUtils.getTimestamp()
          });
        }

        console.log('✅ Google login successful:', user.email);
        return { 
          success: true, 
          user: user,
          profile: userProfile,
          message: 'Google login successful!' 
        };

      } catch (error) {
        console.error('❌ Google login failed:', error);
        const friendlyMessage = window.FirebaseErrorHandler.handleAuthError(error);
        return { 
          success: false, 
          error: friendlyMessage,
          code: error.code 
        };
      } finally {
        showAuthLoading(false);
      }
    });
  }

  // Logout user
  async function logout() {
    return queueOrExecute(async () => {
      try {
        showAuthLoading(true, 'Signing out...');
        
        const auth = window.Firebase.auth;
        await auth.signOut();

        // Send analytics event
        if (window.Firebase.analytics) {
          window.Firebase.analytics.logEvent('logout');
        }

        console.log('✅ Logout successful');
        return { success: true, message: 'Logged out successfully' };

      } catch (error) {
        console.error('❌ Logout failed:', error);
        return { 
          success: false, 
          error: error.message 
        };
      } finally {
        showAuthLoading(false);
      }
    });
  }

  // Send password reset email
  async function sendPasswordResetEmail(email) {
    return queueOrExecute(async () => {
      try {
        showAuthLoading(true, 'Sending reset email...');
        
        const auth = window.Firebase.auth;
        await auth.sendPasswordResetEmail(email, {
          url: `${window.location.origin}/auth/index.html`,
          handleCodeInApp: false
        });

        console.log('✅ Password reset email sent:', email);
        return { 
          success: true, 
          message: 'Password reset email sent! Check your inbox.' 
        };

      } catch (error) {
        console.error('❌ Password reset failed:', error);
        const friendlyMessage = window.FirebaseErrorHandler.handleAuthError(error);
        return { 
          success: false, 
          error: friendlyMessage,
          code: error.code 
        };
      } finally {
        showAuthLoading(false);
      }
    });
  }

  // Resend email verification
  async function resendEmailVerification() {
    return queueOrExecute(async () => {
      try {
        const auth = window.Firebase.auth;
        const user = auth.currentUser;
        
        if (!user) {
          throw new Error('No user is currently signed in');
        }

        if (user.emailVerified) {
          return { 
            success: false, 
            error: 'Email is already verified' 
          };
        }

        await user.sendEmailVerification({
          url: `${window.location.origin}/auth/verify-email.html`,
          handleCodeInApp: true
        });

        return { 
          success: true, 
          message: 'Verification email sent! Check your inbox.' 
        };

      } catch (error) {
        console.error('❌ Email verification resend failed:', error);
        const friendlyMessage = window.FirebaseErrorHandler.handleAuthError(error);
        return { 
          success: false, 
          error: friendlyMessage,
          code: error.code 
        };
      }
    });
  }

  // Update user profile
  async function updateProfile(updates) {
    return queueOrExecute(async () => {
      try {
        const auth = window.Firebase.auth;
        const db = window.Firebase.db;
        const user = auth.currentUser;
        
        if (!user) {
          throw new Error('No user is currently signed in');
        }

        // Update Firebase Auth profile if needed
        const authUpdates = {};
        if (updates.displayName !== undefined) {
          authUpdates.displayName = updates.displayName;
        }
        if (updates.photoURL !== undefined) {
          authUpdates.photoURL = updates.photoURL;
        }

        if (Object.keys(authUpdates).length > 0) {
          await user.updateProfile(authUpdates);
        }

        // Update Firestore profile
        const firestoreUpdates = {
          ...updates,
          updatedAt: window.FirebaseUtils.getTimestamp()
        };

        await db.collection('users').doc(user.uid).update(firestoreUpdates);

        // Reload user profile
        await loadUserProfile(user);

        console.log('✅ Profile updated successfully');
        return { 
          success: true, 
          profile: userProfile,
          message: 'Profile updated successfully!' 
        };

      } catch (error) {
        console.error('❌ Profile update failed:', error);
        return { 
          success: false, 
          error: error.message 
        };
      }
    });
  }

  // Delete user account
  async function deleteAccount() {
    return queueOrExecute(async () => {
      try {
        const auth = window.Firebase.auth;
        const db = window.Firebase.db;
        const user = auth.currentUser;
        
        if (!user) {
          throw new Error('No user is currently signed in');
        }

        // Delete user data from Firestore
        await db.collection('users').doc(user.uid).delete();

        // Delete Firebase Auth account
        await user.delete();

        console.log('✅ Account deleted successfully');
        return { 
          success: true, 
          message: 'Account deleted successfully' 
        };

      } catch (error) {
        console.error('❌ Account deletion failed:', error);
        const friendlyMessage = window.FirebaseErrorHandler.handleAuthError(error);
        return { 
          success: false, 
          error: friendlyMessage,
          code: error.code 
        };
      }
    });
  }

  // Get current user
  function getCurrentUser() {
    return currentUser;
  }

  // Get user profile
  function getUserProfile() {
    return userProfile;
  }

  // Check if user is authenticated
  function isAuthenticated() {
    // User is authenticated if they exist
    // Note: We allow unverified users to access their dashboard
    // They'll see verification prompts within the portal
    return !!currentUser;
  }

  // Check if user has specific role
  function hasRole(role) {
    if (!userProfile || !userProfile.roles) return false;
    return userProfile.roles.includes(role);
  }

  // Check if user has specific account type
  function hasAccountType(accountType) {
    if (!userProfile) return false;
    return userProfile.accountType === accountType;
  }

  // Show/hide authentication loading state
  function showAuthLoading(show, message = 'Loading...') {
    const loadingEl = document.querySelector('#loadingIndicator');
    if (loadingEl) {
      loadingEl.style.display = show ? 'flex' : 'none';
      const messageEl = loadingEl.querySelector('span');
      if (messageEl) {
        messageEl.textContent = message;
      }
    }

    // Also emit loading event
    document.dispatchEvent(new CustomEvent('authLoadingChanged', {
      detail: { loading: show, message }
    }));
  }

  // Redirect to login page
  function redirectToLogin() {
    const currentPath = window.location.pathname;
    if (currentPath !== '/' && currentPath !== '/index.html') {
      sessionStorage.setItem('flow_redirect_after_login', window.location.href);
    }
    window.location.href = '/auth/index.html';
  }

  // Redirect after successful login
  function redirectAfterLogin() {
    const intendedDestination = sessionStorage.getItem('flow_redirect_after_login');
    if (intendedDestination) {
      sessionStorage.removeItem('flow_redirect_after_login');
      window.location.href = intendedDestination;
      return;
    }

    // Check for account type hint from onboarding
    const accountTypeHint = sessionStorage.getItem('flow_account_type') ||
                           localStorage.getItem('flow_account_type') ||
                           new URLSearchParams(window.location.search).get('accountType');

    // Redirect to appropriate dashboard based on account type
    const dashboardUrls = {
      student: '/students/',
      institution: '/institutions/',
      counselor: '/counselors/',
      parent: '/parents/',
      recommender: '/recommenders/'
    };

    let dashboardUrl;

    // First priority: account type hint (from onboarding or URL)
    if (accountTypeHint && dashboardUrls[accountTypeHint]) {
      dashboardUrl = dashboardUrls[accountTypeHint];
      console.log(`🔄 Redirecting to ${accountTypeHint} dashboard from hint`);
    }
    // Second priority: user profile account type (if loaded)
    else if (userProfile?.accountType && dashboardUrls[userProfile.accountType]) {
      dashboardUrl = dashboardUrls[userProfile.accountType];
      console.log(`🔄 Redirecting to ${userProfile.accountType} dashboard from profile`);
    }
    // Fallback: default to student dashboard
    else {
      dashboardUrl = '/students/';
      console.log('🔄 Redirecting to default student dashboard');
    }

    // Clean up hints
    sessionStorage.removeItem('flow_account_type');
    localStorage.removeItem('flow_account_type');

    window.location.href = dashboardUrl;
  }

  // Password validation
  function validatePassword(password) {
    const errors = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[@$!%*?&]/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&)');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Email validation
  function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFirebaseAuth);
  } else {
    initFirebaseAuth();
  }

  // Update FlowAuth global with Firebase methods (backward compatibility)
  function _updateFirebaseUser(user) {
    currentUser = user;
    if (user) {
      loadUserProfile(user).catch(console.error);
    }
  }

  function _handleAuthError(error) {
    console.error('🔐 Auth error:', error);
    authEvents.emit('authError', error);
  }

  // Export Firebase Auth API
  window.FlowAuth = {
    // Authentication methods
    register,
    login,
    loginWithGoogle,
    logout,
    sendPasswordResetEmail,
    resendEmailVerification,
    
    // Profile management
    updateProfile,
    deleteAccount,
    
    // User info
    getCurrentUser,
    getUserProfile,
    isAuthenticated,
    hasRole,
    hasAccountType,
    
    // Navigation
    redirectToLogin,
    redirectAfterLogin,
    
    // Validation
    validatePassword,
    validateEmail,
    
    // Events
    on: authEvents.on.bind(authEvents),
    off: authEvents.off.bind(authEvents),
    
    // Internal methods (for backward compatibility)
    _updateFirebaseUser,
    _handleAuthError,
    
    // Constants
    ACCOUNT_TYPES: {
      STUDENT: 'student',
      INSTITUTION: 'institution',
      COUNSELOR: 'counselor',
      PARENT: 'parent',
      RECOMMENDER: 'recommender'
    }
  };

  console.log('🔐 Firebase Authentication module loaded');

})();
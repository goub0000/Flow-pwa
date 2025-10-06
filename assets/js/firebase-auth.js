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
  let usingTestAuth = false; // Flag to track if we're using test authentication
  let lastAuthState = null; // Track last auth state to prevent duplicate emissions

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

  // Safe auth state emission to prevent duplicates
  function safeEmitAuthState(authState) {
    const stateKey = `${authState.isAuthenticated}-${authState.user?.uid || 'none'}-${authState.profile?.accountType || 'none'}`;

    if (lastAuthState === stateKey) {
      console.log('🔍 Skipping duplicate auth state emission');
      return;
    }

    lastAuthState = stateKey;
    console.log('🔄 Emitting auth state change:', stateKey);
    authEvents.emit('authStateChanged', authState);
  }

  // Test accounts for development/mock mode
  const testAccounts = {
    'test@student.edu': {
      password: 'TestStudent123!',
      profile: {
        uid: 'test-student-uid',
        email: 'test@student.edu',
        displayName: 'Test Student',
        accountType: 'student',
        firstName: 'Test',
        lastName: 'Student',
        isVerified: true
      }
    },
    'test@university.edu': {
      password: 'TestUniversity123!',
      profile: {
        uid: 'test-institution-uid',
        email: 'test@university.edu',
        displayName: 'Test University',
        accountType: 'institution',
        institutionName: 'Test University',
        isVerified: true
      }
    },
    'test@counselor.edu': {
      password: 'TestCounselor123!',
      profile: {
        uid: 'test-counselor-uid',
        email: 'test@counselor.edu',
        displayName: 'Test Counselor',
        accountType: 'counselor',
        firstName: 'Test',
        lastName: 'Counselor',
        isVerified: true
      }
    },
    'test@parent.com': {
      password: 'TestParent123!',
      profile: {
        uid: 'test-parent-uid',
        email: 'test@parent.com',
        displayName: 'Test Parent',
        accountType: 'parent',
        firstName: 'Test',
        lastName: 'Parent',
        isVerified: true
      }
    },
    'test@recommender.edu': {
      password: 'TestRecommender123!',
      profile: {
        uid: 'test-recommender-uid',
        email: 'test@recommender.edu',
        displayName: 'Test Recommender',
        accountType: 'recommender',
        firstName: 'Test',
        lastName: 'Recommender',
        isVerified: true
      }
    }
  };

  // Handle test login for development/mock mode
  function handleTestLogin(email, password) {
    console.log('🧪 Processing test login for:', email);

    const testAccount = testAccounts[email];
    // Check if login should succeed with correct password
    const loginValid = testAccount && testAccount.password === password;

    if (loginValid) {
      console.log('🧪 Valid test credentials provided');

      // Create mock user object
      const mockUser = {
        uid: testAccount.profile.uid,
        email: testAccount.profile.email,
        displayName: testAccount.profile.displayName,
        emailVerified: true
      };

      // Set user profile
      userProfile = testAccount.profile;
      currentUser = mockUser;
      usingTestAuth = true; // Mark that we're using test authentication

      // Persist test authentication state
      localStorage.setItem('test_auth_user', JSON.stringify({
        ...mockUser,
        profile: testAccount.profile
      }));
      localStorage.setItem('test_auth_active', 'true');

      // Store account type for redirect
      if (testAccount.profile.accountType) {
        sessionStorage.setItem('flow_account_type', testAccount.profile.accountType);
        console.log('🔄 Stored account type for redirect:', testAccount.profile.accountType);
      }

      console.log('✅ Test login successful:', email);

      // Trigger auth state change event for test login
      safeEmitAuthState({
        user: mockUser,
        profile: testAccount.profile,
        isAuthenticated: true
      });

      // NO REDIRECT - let user navigate manually or page handle it

      return {
        success: true,
        user: mockUser,
        profile: testAccount.profile,
        message: 'Test login successful!'
      };
    } else {
      console.log('❌ Invalid test credentials');
      return {
        success: false,
        error: 'Invalid test credentials. Use one of the pre-filled test accounts.'
      };
    }
  }

  // REMOVED: checkHomePageRedirect function - no automatic redirects

  // Initialize Firebase Auth integration
  function initFirebaseAuth() {
    console.log('🔐 Initializing Firebase Auth integration...');

    // Debug what Firebase services are available
    console.log('🔍 Firebase available:', !!window.Firebase);
    console.log('🔍 Firebase.auth available:', !!(window.Firebase && window.Firebase.auth));
    console.log('🔍 Firebase.initialized flag:', window.Firebase?.initialized);
    console.log('🔍 Available Firebase properties:', window.Firebase ? Object.keys(window.Firebase) : 'none');

    // Check if Firebase Auth is available even if initialized flag isn't set
    if (window.Firebase && window.Firebase.auth) {
      console.log('🔍 Firebase Auth detected, proceeding with initialization');
      continueFirebaseAuthInit();
      return;
    }

    // Wait for Firebase to be ready
    if (!window.Firebase || !window.Firebase.initialized) {
      console.log('🔍 Firebase not ready, waiting for firebaseInitialized event...');
      document.addEventListener('firebaseInitialized', initFirebaseAuth);

      // Add fallback timeout in case the event never fires
      setTimeout(() => {
        console.log('🔍 Timeout reached - debugging Firebase state:');
        console.log('🔍 window.Firebase exists:', !!window.Firebase);
        console.log('🔍 window.Firebase.auth exists:', !!(window.Firebase && window.Firebase.auth));
        console.log('🔍 firebaseReady flag:', firebaseReady);

        if (!firebaseReady && window.Firebase && window.Firebase.auth) {
          console.log('⚠️ firebaseInitialized event timeout, proceeding with available Firebase');
          continueFirebaseAuthInit();
        } else if (!firebaseReady) {
          console.log('❌ Firebase Auth still not available after timeout');
          console.log('🔍 Available Firebase services:', window.Firebase ? Object.keys(window.Firebase) : 'none');
        }
      }, 2000); // Reduced to 2 seconds
      return;
    }

    continueFirebaseAuthInit();
  }

  // Continue Firebase Auth initialization
  function continueFirebaseAuthInit() {
    if (firebaseReady) {
      console.log('🔍 Firebase Auth already initialized, skipping...');
      return;
    }

    console.log('🔍 Continuing Firebase Auth initialization...');
    firebaseReady = true;
    const auth = window.Firebase.auth;
    const db = window.Firebase.db;

    // Set up auth state listener
    auth.onAuthStateChanged(async (user) => {
      console.log('🔐 Firebase auth state changed:', user ? user.email : 'No user');

      // Check for test authentication in localStorage
      const testAuthUser = localStorage.getItem('test_auth_user');
      const testAuthActive = localStorage.getItem('test_auth_active');

      // Don't override test authentication
      if (usingTestAuth || (testAuthUser && testAuthActive === 'true')) {
        console.log('🧪 Using test authentication, ignoring Firebase auth state change');

        // If we have test auth data but no current user, restore it
        if (testAuthUser && !currentUser) {
          try {
            const testUser = JSON.parse(testAuthUser);
            currentUser = testUser;
            userProfile = testUser.profile || testUser;
            console.log('🧪 Restored test authentication for:', testUser.email);

            safeEmitAuthState({
              user: currentUser,
              profile: userProfile,
              isAuthenticated: true
            });
          } catch (error) {
            console.error('❌ Error restoring test auth:', error);
          }
        }
        return;
      }

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

          safeEmitAuthState({
            user: currentUser,
            profile: userProfile,
            isAuthenticated: true
          });

          // COMPLETELY DISABLED AUTO-REDIRECT to stop loops
          const currentPath = window.location.pathname;
          console.log('🔄 Auth state changed, current path:', currentPath);
          console.log('🔄 Profile loaded, ALL automatic redirects disabled');
        } catch (error) {
          console.error('❌ Error loading user profile:', error);
          currentUser = user;
          safeEmitAuthState({
            user: currentUser,
            profile: null,
            isAuthenticated: true
          });
        }
      } else {
        currentUser = null;
        userProfile = null;

        // Reset redirect flags when user logs out
        window.homePageRedirectDone = false;
        window.redirectInProgress = false;

        safeEmitAuthState({
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

    // EMERGENCY DISABLE: Stop redirect loop
    // checkHomePageRedirect();
  }

  // Process operations that were queued before auth was ready
  function processPendingOperations() {
    console.log('🔍 Processing', pendingOperations.length, 'pending operations');
    pendingOperations.forEach((operation, index) => {
      try {
        console.log('🔍 Executing pending operation', index + 1);
        operation();
      } catch (error) {
        console.error('❌ Error processing pending operation:', error);
      }
    });
    pendingOperations = [];
    console.log('✅ All pending operations processed');
  }

  // Queue operation if Firebase not ready, with timeout
  function queueOrExecute(operation) {
    console.log('🔍 queueOrExecute called - firebaseReady:', firebaseReady, 'authInitialized:', authInitialized);

    if (firebaseReady && authInitialized) {
      console.log('🔍 Firebase ready, executing operation immediately');
      return operation();
    } else {
      console.log('🔍 Firebase not ready, queueing operation with timeout');
      return new Promise((resolve, reject) => {
        // Add timeout for queued operations
        const timeoutId = setTimeout(() => {
          console.error('❌ Queued operation timed out waiting for Firebase initialization');
          reject(new Error('Firebase initialization timeout'));
        }, 30000); // 30 second timeout

        pendingOperations.push(() => {
          clearTimeout(timeoutId);
          try {
            console.log('🔍 Executing queued operation');
            resolve(operation());
          } catch (error) {
            reject(error);
          }
        });
      });
    }
  }

  // Load user profile from Firestore with retry logic
  async function loadUserProfile(user) {
    if (!user) return null;

    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount <= maxRetries) {
      try {
        const db = window.Firebase.db;
        if (!db) {
          console.warn('⚠️ Firestore not available, creating minimal profile');
          userProfile = createMinimalProfile(user);
          return userProfile;
        }

        const profileDoc = await db.collection('users').doc(user.uid).get();

        if (profileDoc.exists) {
          userProfile = { id: user.uid, ...profileDoc.data() };
          console.log('✅ User profile loaded:', userProfile.email);
        } else {
          // Create profile if it doesn't exist
          try {
            userProfile = await createUserProfile(user);
          } catch (createError) {
            console.warn('⚠️ Failed to create profile, using minimal profile:', createError.message);
            userProfile = createMinimalProfile(user);
          }
        }

        return userProfile;
      } catch (error) {
        if (isNetworkError(error) && retryCount < maxRetries) {
          console.log(`🔄 Profile loading failed, retrying... (${retryCount + 1}/${maxRetries})`);
          retryCount++;
          await sleep(1000 * retryCount);
          continue;
        }

        console.error('❌ Error loading user profile after retries:', error);

        // Create minimal profile as fallback
        console.log('🔄 Creating minimal profile as fallback');
        userProfile = createMinimalProfile(user);
        return userProfile;
      }
    }
  }

  // Create minimal profile when Firestore is unavailable
  function createMinimalProfile(user) {
    return {
      id: user.uid,
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      emailVerified: user.emailVerified,
      accountType: determineAccountTypeFromEmail(user.email),
      isActive: true,
      createdAt: new Date().toISOString(),
      preferences: {
        theme: 'dark',
        language: 'en'
      }
    };
  }

  // Determine account type from email domain
  function determineAccountTypeFromEmail(email) {
    if (!email) return 'student';

    const domain = email.split('@')[1]?.toLowerCase() || '';

    if (domain.includes('university') || domain.includes('college') || domain.includes('edu')) {
      // Could be student or institution - default to student for safety
      return 'student';
    }

    return 'student'; // Default fallback
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

  // Login user with email and password - waits for Firebase to be ready
  async function login(email, password) {
    // Check if this is a test account first - NO QUEUEING for test accounts
    if (testAccounts[email]) {
      console.log('🧪 Test account detected, handling immediately without queueing');
      showAuthLoading(true, 'Signing in...');
      showAuthLoading(false);
      return handleTestLogin(email, password);
    }

    return queueOrExecute(async () => {
      try {
        showAuthLoading(true, 'Signing in...');

        const auth = window.Firebase.auth;
        if (!auth) {
          throw new Error('Firebase Auth not available');
        }

        // Firebase authentication with extended timeout
        console.log('🔍 Attempting Firebase signInWithEmailAndPassword...');
        const userCredential = await Promise.race([
          auth.signInWithEmailAndPassword(email, password),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Login timeout - please check your internet connection and try again')), 20000)
          )
        ]);
        console.log('🔍 Firebase signInWithEmailAndPassword completed');

        const user = userCredential.user;
        console.log('✅ Login successful:', email);

        // Wait for user profile to load before returning
        console.log('🔍 Waiting for user profile to load...');
        await loadUserProfile(user);
        console.log('✅ User profile loaded:', userProfile);

        showAuthLoading(false);

        return {
          success: true,
          user: user,
          profile: userProfile,
          message: 'Login successful!'
        };

      } catch (error) {
        showAuthLoading(false);
        console.error('❌ Login failed:', error);

        const friendlyMessage = window.FirebaseErrorHandler?.handleAuthError
          ? window.FirebaseErrorHandler.handleAuthError(error)
          : error.message;

        return {
          success: false,
          error: friendlyMessage,
          code: error.code
        };
      }
    });
  }

  // Google login - waits for Firebase to be ready
  async function loginWithGoogle() {
    return queueOrExecute(async () => {
      try {
        showAuthLoading(true, 'Signing in with Google...');

        const auth = window.Firebase.auth;
        if (!auth) {
          throw new Error('Firebase Auth not available');
        }

        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');

        const result = await auth.signInWithPopup(provider);
        const user = result.user;

        console.log('✅ Google login successful:', user.email);
        showAuthLoading(false);

        // NO REDIRECT - let user navigate manually or page handle it

        return {
          success: true,
          user: user,
          message: 'Google login successful!'
        };

      } catch (error) {
        showAuthLoading(false);
        console.error('❌ Google login failed:', error);

        // Handle test mode
        if (error.message && error.message.includes('Mock Firebase')) {
          console.log('🧪 Mock Firebase detected for Google sign-in, using test bypass');
          return handleTestLogin('test@student.edu', 'TestStudent123!');
        }

        const friendlyMessage = window.FirebaseErrorHandler?.handleAuthError
          ? window.FirebaseErrorHandler.handleAuthError(error)
          : error.message;

        return {
          success: false,
          error: friendlyMessage,
          code: error.code
        };
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

        // Reset redirect flags on logout
        window.homePageRedirectDone = false;
        window.redirectInProgress = false;
        usingTestAuth = false; // Reset test auth flag

        // Clear test authentication state
        localStorage.removeItem('test_auth_user');
        localStorage.removeItem('test_auth_active');

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
    // Check test authentication first
    const testAuthActive = localStorage.getItem('test_auth_active');
    if (testAuthActive === 'true' && currentUser) {
      console.log('🔍 isAuthenticated check - test auth active:', true);
      return true;
    }

    const isAuth = !!(currentUser && authInitialized);
    console.log('🔍 isAuthenticated check - currentUser:', !!currentUser);
    console.log('🔍 isAuthenticated check - authInitialized:', authInitialized);
    console.log('🔍 isAuthenticated check - result:', isAuth);
    return isAuth;
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
    console.log('🔄 showAuthLoading called:', show, message);

    const loadingEl = document.querySelector('#loadingIndicator');
    const loginButton = document.querySelector('#loginButton');

    if (loadingEl) {
      loadingEl.style.display = show ? 'flex' : 'none';
      const messageEl = loadingEl.querySelector('span');
      if (messageEl) {
        messageEl.textContent = message;
      }
    }

    // Update login button state
    if (loginButton) {
      loginButton.disabled = show;
      loginButton.textContent = show ? message : 'Sign In';
    }

    // Also emit loading event
    document.dispatchEvent(new CustomEvent('authLoadingChanged', {
      detail: { loading: show, message }
    }));

    console.log('🔄 Loading state updated - show:', show, 'button disabled:', loginButton?.disabled);
  }

  // Redirect to login page
  function redirectToLogin() {
    const currentPath = window.location.pathname;
    if (currentPath !== '/' && currentPath !== '/index.html') {
      sessionStorage.setItem('flow_redirect_after_login', window.location.href);
    }
    window.location.href = '/auth/index.html';
  }

  // Redirect after successful login based on account type
  function redirectAfterLogin() {
    console.log('🔄 redirectAfterLogin called');

    // Check for intended destination first
    const intendedDestination = sessionStorage.getItem('flow_redirect_after_login');
    if (intendedDestination) {
      sessionStorage.removeItem('flow_redirect_after_login');
      console.log('🔄 Redirecting to intended destination:', intendedDestination);
      window.location.href = intendedDestination;
      return;
    }

    // Get user profile to determine account type
    const profile = getUserProfile();
    const user = getCurrentUser();

    console.log('🔄 User profile:', profile);
    console.log('🔄 Current user:', user);

    // Determine account type from multiple sources
    const accountType = profile?.accountType ||
                       user?.accountType ||
                       profile?.userType ||
                       profile?.type;

    console.log('🔄 Determined account type:', accountType);

    // Route configuration for each account type
    const dashboardRoutes = {
      student: '/students/',
      institution: '/institutions/',
      counselor: '/counselors/',
      parent: '/parents/',
      recommender: '/recommenders/'
    };

    // Get the appropriate dashboard for the user's account type
    const dashboardPath = dashboardRoutes[accountType] || '/students/';

    console.log('🔄 Redirecting to dashboard:', dashboardPath);
    window.location.href = dashboardPath;
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

  // Utility functions

  // Check if error is network-related
  function isNetworkError(error) {
    const networkErrorCodes = [
      'auth/network-request-failed',
      'auth/timeout',
      'unavailable',
      'deadline-exceeded',
      'internal'
    ];
    return networkErrorCodes.includes(error.code) ||
           error.message?.includes('network') ||
           error.message?.includes('timeout') ||
           error.message?.includes('fetch');
  }

  // Sleep utility for retry delays
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Check for existing test authentication on page load
  function checkExistingTestAuth() {
    const testAuthUser = localStorage.getItem('test_auth_user');
    const testAuthActive = localStorage.getItem('test_auth_active');

    if (testAuthUser && testAuthActive === 'true') {
      try {
        const testUser = JSON.parse(testAuthUser);
        currentUser = testUser;
        userProfile = testUser.profile || testUser;
        usingTestAuth = true;

        console.log('🧪 Restored test authentication on page load for:', testUser.email);

        // Emit auth state change to update UI
        safeEmitAuthState({
          user: currentUser,
          profile: userProfile,
          isAuthenticated: true
        });
      } catch (error) {
        console.error('❌ Error restoring test auth on page load:', error);
        localStorage.removeItem('test_auth_user');
        localStorage.removeItem('test_auth_active');
      }
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      checkExistingTestAuth();
      initFirebaseAuth();
    });
  } else {
    checkExistingTestAuth();
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

  // Check and redirect authenticated users on page load
  // REMOVED: checkAndRedirectIfAuthenticated function to prevent automatic redirects
  // Redirects now only happen on explicit login success

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
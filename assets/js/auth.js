// Authentication client for Flow PWA
// Handles login, logout, token management, and user session
//
// This module provides a complete authentication system that works with
// the backend API and manages user sessions securely on the frontend.

/* eslint-env browser */

(function() {
  'use strict';

  // Configuration
  const API_BASE_URL = 'http://localhost:3001'; // Change for production
  const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry
  const DEMO_MODE = false; // Disable demo mode for production
  
  // Storage keys
  const STORAGE_KEYS = {
    USER: 'flow_user',
    ACCESS_TOKEN: 'flow_access_token',
    REFRESH_TOKEN: 'flow_refresh_token',
    TOKEN_EXPIRY: 'flow_token_expiry'
  };

  // Authentication state
  let currentUser = null;
  let accessToken = null;
  let refreshToken = null;
  let tokenExpiryTime = null;
  let refreshTimer = null;

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
        this.listeners[event].forEach(callback => callback(data));
      }
    }
  };

  // Initialize authentication on page load
  function init() {
    loadStoredAuth();
    setupTokenRefresh();
    
    // Listen for storage events (for multi-tab sync)
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for page visibility changes to refresh tokens
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    console.log('🔐 Flow Auth initialized');
  }

  // Load stored authentication data
  function loadStoredAuth() {
    try {
      // Demo mode: auto-create demo user based on portal type
      if (DEMO_MODE) {
        let demoUser = null;
        const currentPath = window.location.pathname;
        
        if (currentPath.includes('/institutions/')) {
          demoUser = {
            id: 'demo-institution-1',
            email: 'demo@university.edu',
            fullName: 'Demo University',
            accountType: 'institution',
            profile: {
              institutionName: 'Demo University',
              institutionType: 'University',
              country: 'Demo Country',
              website: 'https://demo.university.edu'
            },
            roles: ['institution'],
            isVerified: true,
            createdAt: new Date().toISOString()
          };
        } else if (currentPath.includes('/students/')) {
          demoUser = {
            id: 'demo-student-1',
            email: 'demo@student.edu',
            fullName: 'Demo Student',
            accountType: 'student',
            profile: {
              firstName: 'Demo',
              lastName: 'Student',
              dateOfBirth: '2000-01-01',
              country: 'Demo Country'
            },
            roles: ['student'],
            isVerified: true,
            createdAt: new Date().toISOString()
          };
        } else if (currentPath.includes('/counselors/')) {
          demoUser = {
            id: 'demo-counselor-1',
            email: 'demo@counselor.edu',
            fullName: 'Demo Counselor',
            accountType: 'counselor',
            profile: {
              firstName: 'Demo',
              lastName: 'Counselor',
              organization: 'Demo Counseling Service',
              country: 'Demo Country'
            },
            roles: ['counselor'],
            isVerified: true,
            createdAt: new Date().toISOString()
          };
        } else if (currentPath.includes('/parents/')) {
          demoUser = {
            id: 'demo-parent-1',
            email: 'demo@parent.com',
            fullName: 'Demo Parent',
            accountType: 'parent',
            profile: {
              firstName: 'Demo',
              lastName: 'Parent',
              country: 'Demo Country'
            },
            roles: ['parent'],
            isVerified: true,
            createdAt: new Date().toISOString()
          };
        } else if (currentPath.includes('/recommenders/')) {
          demoUser = {
            id: 'demo-recommender-1',
            email: 'demo@recommender.edu',
            fullName: 'Demo Recommender',
            accountType: 'recommender',
            profile: {
              firstName: 'Demo',
              lastName: 'Recommender',
              title: 'Professor',
              organization: 'Demo University',
              country: 'Demo Country'
            },
            roles: ['recommender'],
            isVerified: true,
            createdAt: new Date().toISOString()
          };
        }
        
        if (demoUser) {
          const demoTokens = {
            accessToken: 'demo-access-token',
            refreshToken: 'demo-refresh-token'
          };
          
          // Clear any existing auth data first
          clearStoredAuth();
          
          // Set demo auth data
          currentUser = demoUser;
          accessToken = demoTokens.accessToken;
          refreshToken = demoTokens.refreshToken;
          tokenExpiryTime = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
          
          // Store demo auth for consistency
          storeAuth(demoUser, demoTokens);
          
          console.log(`🎭 Demo mode activated - ${demoUser.accountType} portal access granted for ${demoUser.fullName}`);
          authEvents.emit('authStateChanged', { user: currentUser, isAuthenticated: true });
          return;
        }
      }
      
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      const storedAccessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const storedRefreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      const storedExpiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);

      if (storedUser && storedAccessToken && storedRefreshToken && storedExpiry) {
        currentUser = JSON.parse(storedUser);
        accessToken = storedAccessToken;
        refreshToken = storedRefreshToken;
        tokenExpiryTime = parseInt(storedExpiry);

        // Check if token is expired
        if (Date.now() >= tokenExpiryTime) {
          console.log('🔐 Stored token expired, attempting refresh...');
          refreshTokens();
        } else {
          console.log('🔐 Restored user session:', currentUser.email);
          authEvents.emit('authStateChanged', { user: currentUser, isAuthenticated: true });
        }
      }
    } catch (error) {
      console.error('❌ Error loading stored auth:', error);
      clearStoredAuth();
    }
  }

  // Store authentication data
  function storeAuth(user, tokens) {
    try {
      // Calculate token expiry (JWT tokens are typically 15 minutes)
      const expiryTime = Date.now() + 15 * 60 * 1000; // 15 minutes from now
      
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
      localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
      
      currentUser = user;
      accessToken = tokens.accessToken;
      refreshToken = tokens.refreshToken;
      tokenExpiryTime = expiryTime;
      
      setupTokenRefresh();
      console.log('🔐 Auth data stored successfully');
    } catch (error) {
      console.error('❌ Error storing auth data:', error);
    }
  }

  // Clear stored authentication data
  function clearStoredAuth() {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
      
      currentUser = null;
      accessToken = null;
      refreshToken = null;
      tokenExpiryTime = null;
      
      clearTimeout(refreshTimer);
      console.log('🔐 Auth data cleared');
    } catch (error) {
      console.error('❌ Error clearing auth data:', error);
    }
  }

  // Setup automatic token refresh
  function setupTokenRefresh() {
    clearTimeout(refreshTimer);
    
    if (tokenExpiryTime) {
      const timeUntilRefresh = tokenExpiryTime - Date.now() - TOKEN_REFRESH_THRESHOLD;
      
      if (timeUntilRefresh > 0) {
        refreshTimer = setTimeout(() => {
          console.log('🔄 Auto-refreshing token...');
          refreshTokens();
        }, timeUntilRefresh);
      } else {
        // Token needs immediate refresh
        refreshTokens();
      }
    }
  }

  // Make authenticated API request
  async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json'
    };

    // Add authorization header if we have a token
    if (accessToken) {
      defaultHeaders.Authorization = `Bearer ${accessToken}`;
    }

    const requestOptions = {
      credentials: 'include', // Include cookies
      headers: {
        ...defaultHeaders,
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, requestOptions);
      const data = await response.json();

      // Handle token expiry
      if (response.status === 401 && data.code === 'TOKEN_EXPIRED') {
        console.log('🔄 Token expired, attempting refresh...');
        const refreshed = await refreshTokens();
        
        if (refreshed) {
          // Retry the original request with new token
          requestOptions.headers.Authorization = `Bearer ${accessToken}`;
          const retryResponse = await fetch(url, requestOptions);
          return await retryResponse.json();
        } else {
          // Refresh failed, redirect to login
          handleAuthFailure();
          throw new Error('Authentication failed');
        }
      }

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`❌ API request failed (${endpoint}):`, error);
      throw error;
    }
  }

  // Register new user
  async function register(userData) {
    try {
      showAuthLoading(true, 'Creating account...');
      
      const response = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });

      storeAuth(response.user, response.tokens);
      authEvents.emit('authStateChanged', { user: response.user, isAuthenticated: true });
      
      console.log('✅ Registration successful:', response.user.email);
      return { success: true, user: response.user, message: response.message };
    } catch (error) {
      console.error('❌ Registration failed:', error);
      return { success: false, error: error.message };
    } finally {
      showAuthLoading(false);
    }
  }

  // Login user
  async function login(email, password) {
    try {
      showAuthLoading(true, 'Signing in...');
      
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      storeAuth(response.user, response.tokens);
      authEvents.emit('authStateChanged', { user: response.user, isAuthenticated: true });
      
      console.log('✅ Login successful:', response.user.email);
      return { success: true, user: response.user, message: response.message };
    } catch (error) {
      console.error('❌ Login failed:', error);
      return { success: false, error: error.message };
    } finally {
      showAuthLoading(false);
    }
  }

  // Logout user
  async function logout() {
    try {
      showAuthLoading(true, 'Signing out...');
      
      // Call logout endpoint if we have a token
      if (accessToken) {
        await apiRequest('/auth/logout', {
          method: 'POST'
        });
      }
    } catch (error) {
      console.error('❌ Logout API call failed:', error);
      // Continue with local logout even if API call fails
    } finally {
      clearStoredAuth();
      authEvents.emit('authStateChanged', { user: null, isAuthenticated: false });
      showAuthLoading(false);
      console.log('✅ Logout successful');
    }
  }

  // Refresh tokens
  async function refreshTokens() {
    if (!refreshToken) {
      console.log('❌ No refresh token available');
      handleAuthFailure();
      return false;
    }

    try {
      const response = await apiRequest('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken })
      });

      storeAuth(currentUser, response.tokens);
      console.log('✅ Tokens refreshed successfully');
      return true;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      handleAuthFailure();
      return false;
    }
  }

  // Handle authentication failure
  function handleAuthFailure() {
    clearStoredAuth();
    authEvents.emit('authStateChanged', { user: null, isAuthenticated: false });
    
    // Show toast notification
    if (window.toast) {
      window.toast.show('Session expired. Please sign in again.', 'info', 5000);
    }
  }

  // Get current user
  function getCurrentUser() {
    return currentUser;
  }

  // Check if user is authenticated
  function isAuthenticated() {
    return !!(currentUser && accessToken && tokenExpiryTime > Date.now());
  }

  // Check if user has specific role
  function hasRole(role) {
    if (!currentUser || !currentUser.roles) return false;
    return currentUser.roles.includes(role) || currentUser.accountType === role;
  }

  // Check if user has specific account type
  function hasAccountType(accountType) {
    if (!currentUser) return false;
    return currentUser.accountType === accountType;
  }

  // Handle storage changes (multi-tab sync)
  function handleStorageChange(event) {
    if (Object.values(STORAGE_KEYS).includes(event.key)) {
      console.log('🔄 Auth state changed in another tab, reloading...');
      loadStoredAuth();
    }
  }

  // Handle page visibility changes
  function handleVisibilityChange() {
    if (!document.hidden && isAuthenticated()) {
      // Check if token needs refresh when tab becomes visible
      const timeUntilExpiry = tokenExpiryTime - Date.now();
      if (timeUntilExpiry < TOKEN_REFRESH_THRESHOLD) {
        console.log('🔄 Token close to expiry, refreshing...');
        refreshTokens();
      }
    }
  }

  // Show/hide authentication loading state
  function showAuthLoading(show, message = 'Loading...') {
    const loadingEl = document.querySelector('.auth-loading');
    if (loadingEl) {
      loadingEl.style.display = show ? 'flex' : 'none';
      const messageEl = loadingEl.querySelector('.auth-loading__message');
      if (messageEl) {
        messageEl.textContent = message;
      }
    }
  }

  // Redirect to login page
  function redirectToLogin() {
    const currentPath = window.location.pathname;
    if (currentPath !== '/' && currentPath !== '/index.html') {
      // Store intended destination
      sessionStorage.setItem('flow_redirect_after_login', window.location.href);
    }
    window.location.href = '/';
  }

  // Redirect after successful login
  function redirectAfterLogin() {
    const intendedDestination = sessionStorage.getItem('flow_redirect_after_login');
    if (intendedDestination) {
      sessionStorage.removeItem('flow_redirect_after_login');
      window.location.href = intendedDestination;
    } else {
      // Redirect to appropriate dashboard based on account type
      const dashboardUrls = {
        student: '/students/',
        institution: '/institutions/',
        counselor: '/counselors/',
        parent: '/parents/',
        recommender: '/recommenders/'
      };
      
      const dashboardUrl = dashboardUrls[currentUser?.accountType] || '/students/';
      window.location.href = dashboardUrl;
    }
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
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    return emailRegex.test(email);
  }

  // Initialize authentication immediately and when DOM is ready
  init();
  document.addEventListener('DOMContentLoaded', init);

  // Export public API
  window.FlowAuth = {
    // Authentication methods
    register,
    login,
    logout,
    refreshTokens,
    
    // User info
    getCurrentUser,
    isAuthenticated,
    hasRole,
    hasAccountType,
    
    // Navigation
    redirectToLogin,
    redirectAfterLogin,
    
    // Validation
    validatePassword,
    validateEmail,
    
    // API requests
    apiRequest,
    
    // Events
    on: authEvents.on.bind(authEvents),
    off: authEvents.off.bind(authEvents),
    
    // Constants
    ACCOUNT_TYPES: {
      STUDENT: 'student',
      INSTITUTION: 'institution',
      COUNSELOR: 'counselor',
      PARENT: 'parent',
      RECOMMENDER: 'recommender'
    }
  };

  console.log('🔐 Flow Authentication module loaded');

})();
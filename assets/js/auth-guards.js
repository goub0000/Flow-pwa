// Authentication guards for Flow PWA portal pages
// Protects routes and ensures users have appropriate permissions
//
// This module provides route protection and access control for different
// portal types, ensuring users can only access areas they're authorized for.

/* eslint-env browser */

(function() {
  'use strict';

  // Route configurations for each account type
  const ROUTE_CONFIG = {
    student: {
      allowedPaths: ['/students/', '/messages/', '/get-started/'],
      dashboardPath: '/students/',
      requiredAccountType: 'student'
    },
    institution: {
      allowedPaths: ['/institutions/', '/messages/', '/get-started/'],
      dashboardPath: '/institutions/',
      requiredAccountType: 'institution'
    },
    counselor: {
      allowedPaths: ['/counselors/', '/messages/', '/get-started/'],
      dashboardPath: '/counselors/',
      requiredAccountType: 'counselor'
    },
    parent: {
      allowedPaths: ['/parents/', '/messages/', '/get-started/'],
      dashboardPath: '/parents/',
      requiredAccountType: 'parent'
    },
    recommender: {
      allowedPaths: ['/recommenders/', '/messages/', '/get-started/'],
      dashboardPath: '/recommenders/',
      requiredAccountType: 'recommender'
    }
  };

  // Public routes that don't require authentication
  const PUBLIC_ROUTES = [
    '/',
    '/index.html',
    '/legal/',
    '/examples/',
    '/auth/'
  ];

  // Admin routes that require admin role
  const ADMIN_ROUTES = [
    '/admin/',
    '/committee/'
  ];

  // Initialize auth guards
  function init() {
    console.log('🛡️ [Auth Guards] Initializing auth guards...');

    // Wait for authentication system to be ready before checking
    waitForAuthSystem();

    // Listen for auth state changes
    if (window.FlowAuth) {
      console.log('🛡️ [Auth Guards] FlowAuth found, setting up listener');
      window.FlowAuth.on('authStateChanged', handleAuthStateChange);
    } else {
      console.log('🛡️ [Auth Guards] FlowAuth not found yet');
    }

    // Protect navigation
    protectNavigation();

    console.log('🛡️ Auth guards initialized');
  }

  // Wait for auth system to be ready
  let authWaitAttempts = 0;
  const maxAuthWaitAttempts = 50; // 5 seconds max (50 * 100ms)

  function waitForAuthSystem() {
    if (window.FlowAuth && window.Firebase && window.Firebase.initialized) {
      console.log('🛡️ Auth system ready');
      authWaitAttempts = 0; // Reset counter

      const currentPath = window.location.pathname;

      // NEVER protect auth pages - they handle their own authentication flow
      if (currentPath.includes('/auth/') || currentPath.includes('/login')) {
        console.log('🛡️ On auth page, auth guards will NOT interfere:', currentPath);
        return;
      }

      // Only protect specific dashboard pages, not public pages
      if (currentPath.startsWith('/students/') ||
          currentPath.startsWith('/institutions/') ||
          currentPath.startsWith('/counselors/') ||
          currentPath.startsWith('/parents/') ||
          currentPath.startsWith('/recommenders/')) {

        console.log('🛡️ On protected dashboard page, checking authentication...');

        // Check authentication immediately instead of waiting 5 seconds
        console.log('🛡️ Checking authentication state...');
        console.log('🛡️ FlowAuth available:', !!window.FlowAuth);
        console.log('🛡️ isAuthenticated result:', window.FlowAuth?.isAuthenticated());

        if (!window.FlowAuth || !window.FlowAuth.isAuthenticated()) {
          console.log('🛡️ User not authenticated for protected page, redirecting...');
          redirectToAuth(currentPath);
        } else {
          console.log('🛡️ User authenticated, allowing access to:', currentPath);
        }
      } else {
        console.log('🛡️ On public page, no auth check needed:', currentPath);
      }
    } else {
      authWaitAttempts++;
      if (authWaitAttempts >= maxAuthWaitAttempts) {
        console.log('❌ Auth system failed to initialize after', maxAuthWaitAttempts, 'attempts');
        // Stop waiting and proceed without auth checks for non-protected pages
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/auth/') && !currentPath.includes('/login')) {
          console.log('⚠️ Proceeding without auth system for:', currentPath);
        }
        return;
      }
      console.log('⏳ Waiting for auth system to be ready... attempt', authWaitAttempts, '/', maxAuthWaitAttempts);
      setTimeout(waitForAuthSystem, 100);
    }
  }

  // Check if current route requires authentication
  function checkAuthentication() {
    const currentPath = window.location.pathname;

    console.log('🛡️ Auth guard checking route:', currentPath);

    // Skip check for public routes
    if (isPublicRoute(currentPath)) {
      console.log('🌍 Public route, no auth required:', currentPath);
      return;
    }

    // STRICT: Check if user is authenticated - NO FALLBACK
    if (!window.FlowAuth) {
      console.log('❌ FlowAuth system not available, redirecting to home');
      redirectToAuth(currentPath);
      return;
    }

    const isAuth = window.FlowAuth.isAuthenticated();
    console.log('🔍 Authentication check result:', isAuth);

    if (!isAuth) {
      console.log('🔒 Authentication required for:', currentPath);
      redirectToAuth(currentPath);
      return;
    }

    console.log('✅ User is authenticated, allowing access to:', currentPath);
    
    // Check account type permissions
    const user = window.FlowAuth.getCurrentUser();
    const userProfile = window.FlowAuth.getUserProfile();
    if (!checkAccountTypePermission(currentPath, user, userProfile)) {
      const accountType = user?.accountType || userProfile?.accountType || userProfile?.userType || 'unknown';
      console.log('🚫 Access denied for account type:', accountType, 'to path:', currentPath);
      console.log('🚫 User object:', user);
      console.log('🚫 User profile:', userProfile);
      redirectToAuthorizedArea(user, userProfile);
      return;
    }
    
    // Check admin permissions
    if (isAdminRoute(currentPath) && !window.FlowAuth.hasRole('admin')) {
      console.log('🚫 Admin access required for:', currentPath);
      redirectToAuthorizedArea(user);
      return;
    }
    
    console.log('✅ Access granted to:', currentPath);
  }

  // Handle authentication state changes
  function handleAuthStateChange(authState) {
    console.log('🛡️ [Auth Guards] handleAuthStateChange called with:', authState);
    const { user, profile, isAuthenticated } = authState;

    if (!isAuthenticated) {
      console.log('🔓 User logged out, checking current route...');
      checkAuthentication();
    } else {
      console.log('🔐 User logged in:', profile?.accountType || user?.accountType);

      // NEVER interfere with login pages - let them handle their own redirects
      const currentPath = window.location.pathname;
      if (currentPath === '/' ||
          currentPath === '/index.html' ||
          currentPath.includes('/auth/') ||
          currentPath.includes('/login')) {
        console.log('🔄 [Auth Guards] User on public/auth page - auth guards will NOT interfere');
        // Don't interfere with any auth-related pages
        return;
      }

      // For other pages, check if user has permission to be there
      checkAuthentication();
    }
  }

  // Check if route is public
  function isPublicRoute(path) {
    return PUBLIC_ROUTES.some(route => path.startsWith(route));
  }

  // Check if route requires admin access
  function isAdminRoute(path) {
    return ADMIN_ROUTES.some(route => path.startsWith(route));
  }

  // Check account type permission for path
  function checkAccountTypePermission(path, user, userProfile) {
    // Get account type from multiple sources
    const accountType = user?.accountType ||
                       userProfile?.accountType ||
                       userProfile?.userType ||
                       userProfile?.type ||
                       userProfile?.role;

    console.log('🔍 Permission check - path:', path, 'accountType:', accountType);

    if (!accountType) {
      console.log('❌ No account type found in user or profile');
      // For students path, assume student if no account type is found
      if (path.startsWith('/students/')) {
        console.log('✅ Allowing access to students path as default');
        return true;
      }
      return false;
    }

    const userConfig = ROUTE_CONFIG[accountType];
    if (!userConfig) {
      console.log('❌ No route config found for account type:', accountType);
      return false;
    }

    // Check if path is in user's allowed paths
    const hasAccess = userConfig.allowedPaths.some(allowedPath => path.startsWith(allowedPath));
    console.log('🔍 Access check result:', hasAccess, 'for', accountType, 'to', path);
    return hasAccess;
  }

  // Redirect to authentication
  function redirectToAuth(intendedPath) {
    console.log('🔄 [Auth Guards] redirectToAuth called for path:', intendedPath);

    // Check if redirect is already in progress to prevent loops
    if (window.redirectInProgress) {
      console.log('🔄 [Auth Guards] Redirect already in progress, skipping auth redirect...');
      return;
    }

    // Store intended destination
    if (intendedPath !== '/' && intendedPath !== '/index.html') {
      sessionStorage.setItem('flow_redirect_after_login', window.location.href);
      console.log('🔄 [Auth Guards] Stored redirect destination:', window.location.href);
    }

    // Don't redirect to home if user is already authenticated - this might be causing the loop
    if (window.FlowAuth && window.FlowAuth.isAuthenticated()) {
      console.log('🔄 [Auth Guards] User is authenticated, not redirecting to auth page');
      return;
    }

    // Redirect to unified login page (auto-detects user type after login)
    const loginPage = '/auth/index.html';

    console.log('🔄 [Auth Guards] Redirecting to appropriate login page:', loginPage);
    window.redirectInProgress = true;
    window.location.href = loginPage;
  }

  // Redirect to user's authorized area
  function redirectToAuthorizedArea(user, userProfile) {
    // Check if redirect is already in progress to prevent loops
    if (window.redirectInProgress) {
      console.log('🔄 [Auth Guards] Redirect already in progress, skipping...');
      return;
    }

    // Get account type from multiple sources
    const accountType = user?.accountType ||
                       userProfile?.accountType ||
                       userProfile?.userType ||
                       userProfile?.type ||
                       userProfile?.role;

    console.log('🔄 [Auth Guards] Redirecting to authorized area for account type:', accountType);

    if (accountType) {
      const userConfig = ROUTE_CONFIG[accountType];
      if (userConfig) {
        console.log('🔄 [Auth Guards] Redirecting to dashboard:', userConfig.dashboardPath);
        window.redirectInProgress = true;
        window.location.href = userConfig.dashboardPath;
        return;
      }
    }

    // Default to student dashboard instead of home page
    console.log('🔄 [Auth Guards] No account type found, defaulting to student dashboard');
    window.redirectInProgress = true;
    window.location.href = '/students/';
  }

  // Show authentication modal
  function showAuthModal() {
    if (window.flowHelpers && window.flowHelpers.openModal) {
      window.flowHelpers.openModal('signupModal');
    }
  }

  // Protect navigation links
  function protectNavigation() {
    // Add click handlers to navigation links
    const navLinks = document.querySelectorAll('a[href]');
    
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      
      // Skip external links and anchors
      if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) {
        return;
      }
      
      // Add auth check for protected routes
      if (!isPublicRoute(href)) {
        link.addEventListener('click', function(event) {
          // Check if user is authenticated
          if (!window.FlowAuth || !window.FlowAuth.isAuthenticated()) {
            event.preventDefault();
            console.log('🔒 Authentication required for navigation to:', href);
            redirectToAuth(href);
            return;
          }
          
          // Check permissions
          const user = window.FlowAuth.getCurrentUser();
          if (!checkAccountTypePermission(href, user)) {
            event.preventDefault();
            console.log('🚫 Access denied for navigation to:', href);
            
            // Show error message
            if (window.toast) {
              window.toast.show('Access denied. You don\'t have permission to access this area.', 'error', 5000);
            }
            return;
          }
        });
      }
    });
  }

  // Create protected area wrapper - STRICT ENFORCEMENT
  function createProtectedArea(accountTypes, requiredRoles = []) {
    return function(callback) {
      // STRICT: Check if auth is available - NO FALLBACK
      if (!window.FlowAuth) {
        console.error('❌ FlowAuth not available - ACCESS DENIED');
        document.body.innerHTML = '<div style="padding: 2rem; text-align: center; font-family: Arial, sans-serif;"><h1>🔒 Access Denied</h1><p>Authentication system is required to access this page.</p><a href="/" style="color: #5a5bb8;">Return to Home</a></div>';
        return;
      }
      
      // STRICT: Check authentication - NO FALLBACK
      if (!window.FlowAuth.isAuthenticated()) {
        console.log('🔒 Authentication required - BLOCKING ACCESS');
        redirectToAuth(window.location.pathname);
        return;
      }
      
      const user = window.FlowAuth.getCurrentUser();
      if (!user) {
        console.error('❌ User data not available - ACCESS DENIED');
        redirectToAuth(window.location.pathname);
        return;
      }
      
      // Check account type
      if (accountTypes && !accountTypes.includes(user.accountType)) {
        console.log('🚫 Account type not authorized:', user.accountType, 'Required:', accountTypes);
        redirectToAuthorizedArea(user);
        return;
      }
      
      // Check roles
      if (requiredRoles.length > 0) {
        const hasRequiredRole = requiredRoles.some(role => window.FlowAuth.hasRole(role));
        if (!hasRequiredRole) {
          console.log('🚫 Required roles not met:', requiredRoles);
          redirectToAuthorizedArea(user);
          return;
        }
      }
      
      // All checks passed, execute callback
      console.log('✅ Access granted to', user.accountType, 'user:', user.fullName);
      callback(user);
    };
  }

  // Specific guards for each portal type
  const studentGuard = createProtectedArea(['student']);
  const institutionGuard = createProtectedArea(['institution']);
  const counselorGuard = createProtectedArea(['counselor']);
  const parentGuard = createProtectedArea(['parent']);
  const recommenderGuard = createProtectedArea(['recommender']);
  const adminGuard = createProtectedArea(null, ['admin']);

  // Multi-role guards
  const educatorGuard = createProtectedArea(['institution', 'counselor']);
  const parentalGuard = createProtectedArea(['parent', 'counselor']);

  // Utility functions for templates
  function showIfAuthenticated(element) {
    if (window.FlowAuth && window.FlowAuth.isAuthenticated()) {
      element.style.display = '';
    } else {
      element.style.display = 'none';
    }
  }

  function showIfNotAuthenticated(element) {
    if (!window.FlowAuth || !window.FlowAuth.isAuthenticated()) {
      element.style.display = '';
    } else {
      element.style.display = 'none';
    }
  }

  function showIfAccountType(element, accountTypes) {
    if (!Array.isArray(accountTypes)) {
      accountTypes = [accountTypes];
    }
    
    if (window.FlowAuth && window.FlowAuth.isAuthenticated()) {
      const user = window.FlowAuth.getCurrentUser();
      if (accountTypes.includes(user.accountType)) {
        element.style.display = '';
        return;
      }
    }
    element.style.display = 'none';
  }

  function showIfRole(element, roles) {
    if (!Array.isArray(roles)) {
      roles = [roles];
    }
    
    if (window.FlowAuth && window.FlowAuth.isAuthenticated()) {
      const hasRole = roles.some(role => window.FlowAuth.hasRole(role));
      if (hasRole) {
        element.style.display = '';
        return;
      }
    }
    element.style.display = 'none';
  }

  // Apply conditional display based on auth state
  function applyConditionalDisplay() {
    // Show/hide elements based on authentication state
    document.querySelectorAll('[data-show-if-auth]').forEach(showIfAuthenticated);
    document.querySelectorAll('[data-hide-if-auth]').forEach(showIfNotAuthenticated);
    
    // Show/hide elements based on account type
    document.querySelectorAll('[data-show-if-account-type]').forEach(el => {
      const accountTypes = el.getAttribute('data-show-if-account-type').split(',');
      showIfAccountType(el, accountTypes);
    });
    
    // Show/hide elements based on roles
    document.querySelectorAll('[data-show-if-role]').forEach(el => {
      const roles = el.getAttribute('data-show-if-role').split(',');
      showIfRole(el, roles);
    });
  }

  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    // Wait for FlowAuth to be available
    if (window.FlowAuth) {
      init();
      applyConditionalDisplay();
    } else {
      // Wait for FlowAuth to load
      setTimeout(() => {
        if (window.FlowAuth) {
          init();
          applyConditionalDisplay();
        }
      }, 100);
    }
  });

  // Listen for auth state changes and update display
  document.addEventListener('DOMContentLoaded', function() {
    if (window.FlowAuth) {
      window.FlowAuth.on('authStateChanged', applyConditionalDisplay);
    }
  });

  // Export public API
  window.FlowAuthGuards = {
    // Guard functions
    studentGuard,
    institutionGuard,
    counselorGuard,
    parentGuard,
    recommenderGuard,
    adminGuard,
    educatorGuard,
    parentalGuard,
    
    // Utility functions
    createProtectedArea,
    checkAuthentication,
    isPublicRoute,
    isAdminRoute,
    
    // Display utilities
    showIfAuthenticated,
    showIfNotAuthenticated,
    showIfAccountType,
    showIfRole,
    applyConditionalDisplay,
    
    // Navigation
    redirectToAuth,
    redirectToAuthorizedArea
  };

  console.log('🛡️ Auth Guards module loaded');

})();
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
    // Check authentication on page load
    checkAuthentication();
    
    // Listen for auth state changes
    if (window.FlowAuth) {
      window.FlowAuth.on('authStateChanged', handleAuthStateChange);
    }
    
    // Protect navigation
    protectNavigation();
    
    console.log('🛡️ Auth guards initialized');
  }

  // Check if current route requires authentication
  function checkAuthentication() {
    const currentPath = window.location.pathname;

    // Skip check for public routes
    if (isPublicRoute(currentPath)) {
      console.log('🌍 Public route, no auth required:', currentPath);
      return;
    }

    // Check if FlowAuth is available
    if (!window.FlowAuth) {
      console.log('⏳ FlowAuth system not yet available, waiting...');
      // Give it more time to load, then redirect if still not available
      setTimeout(() => {
        if (!window.FlowAuth) {
          console.log('❌ FlowAuth system not available after wait, redirecting to home');
          redirectToAuth(currentPath);
        } else {
          checkAuthentication(); // Retry the check
        }
      }, 1000);
      return;
    }

    if (!window.FlowAuth.isAuthenticated()) {
      console.log('🔒 Authentication required for:', currentPath);
      redirectToAuth(currentPath);
      return;
    }

    // Check account type permissions
    const user = window.FlowAuth.getCurrentUser();
    const profile = window.FlowAuth.getUserProfile();

    // Use profile data if available, fallback to user data
    const userForCheck = profile || user;

    if (!checkAccountTypePermission(currentPath, userForCheck)) {
      console.log('🚫 Access denied for account type:', userForCheck?.accountType, 'to path:', currentPath);

      // If user profile is still loading, wait a bit longer before redirecting
      if (!userForCheck?.accountType) {
        console.log('⏳ User profile still loading, waiting before redirect...');
        setTimeout(() => {
          const updatedProfile = window.FlowAuth.getUserProfile();
          const updatedUser = updatedProfile || window.FlowAuth.getCurrentUser();
          if (!checkAccountTypePermission(currentPath, updatedUser)) {
            redirectToAuthorizedArea(updatedUser);
          }
        }, 2000);
        return;
      }

      redirectToAuthorizedArea(userForCheck);
      return;
    }

    // Check admin permissions
    if (isAdminRoute(currentPath) && !window.FlowAuth.hasRole('admin')) {
      console.log('🚫 Admin access required for:', currentPath);
      redirectToAuthorizedArea(userForCheck);
      return;
    }

    console.log('✅ Access granted to:', currentPath);
  }

  // Handle authentication state changes
  function handleAuthStateChange(authState) {
    const { user, isAuthenticated } = authState;
    
    if (!isAuthenticated) {
      console.log('🔓 User logged out, checking current route...');
      checkAuthentication();
    } else {
      console.log('🔐 User logged in:', user.accountType);
      
      // If user is on home page after login, redirect to dashboard
      const currentPath = window.location.pathname;
      if (currentPath === '/' || currentPath === '/index.html') {
        if (window.FlowAuth) {
          window.FlowAuth.redirectAfterLogin();
        }
      }
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
  function checkAccountTypePermission(path, user) {
    if (!user) return false;

    // If user profile is still loading, allow access temporarily
    // The auth system will re-check once profile loads
    if (!user.accountType) {
      console.log('⏳ User profile loading, temporarily allowing access to:', path);
      return true;
    }

    const userConfig = ROUTE_CONFIG[user.accountType];
    if (!userConfig) {
      console.log('❌ No route config for account type:', user.accountType);
      return false;
    }

    // Check if path is in user's allowed paths
    const hasAccess = userConfig.allowedPaths.some(allowedPath => path.startsWith(allowedPath));
    console.log('🔍 Access check for', user.accountType, 'to', path, ':', hasAccess);
    return hasAccess;
  }

  // Redirect to authentication
  function redirectToAuth(intendedPath) {
    // Store intended destination
    if (intendedPath !== '/' && intendedPath !== '/index.html') {
      sessionStorage.setItem('flow_redirect_after_login', window.location.href);
    }
    
    // Show auth modal if on home page, otherwise redirect
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
      showAuthModal();
    } else {
      window.location.href = '/';
    }
  }

  // Redirect to user's authorized area
  function redirectToAuthorizedArea(user) {
    if (user && user.accountType) {
      const userConfig = ROUTE_CONFIG[user.accountType];
      if (userConfig) {
        window.location.href = userConfig.dashboardPath;
        return;
      }
    }
    
    // Fallback to home page
    window.location.href = '/';
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
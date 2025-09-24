// Global Error Handler and Logging System
// Standardized error handling, reporting, and user feedback

/* eslint-env browser */

class ErrorHandler {
  constructor() {
    this.errorQueue = [];
    this.retryAttempts = new Map();
    this.maxRetryAttempts = 3;
    this.retryDelay = 1000; // Start with 1 second
    this.isOnline = navigator.onLine;

    this.init();
  }

  init() {
    console.log('🛡️ Initializing Error Handler...');

    this.setupGlobalErrorHandling();
    this.setupUnhandledRejectionHandling();
    this.setupNetworkErrorHandling();
    this.setupConsoleInterception();
    this.monitorConnectivity();

    console.log('✅ Error Handler initialized');
  }

  // Setup global error handling
  setupGlobalErrorHandling() {
    window.addEventListener('error', (event) => {
      const error = {
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        stack: event.error?.stack,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: this.getCurrentUserId()
      };

      this.handleError(error);
    });
  }

  // Setup unhandled promise rejection handling
  setupUnhandledRejectionHandling() {
    window.addEventListener('unhandledrejection', (event) => {
      const error = {
        type: 'promise',
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        reason: event.reason,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: this.getCurrentUserId()
      };

      this.handleError(error);
    });
  }

  // Setup network error handling
  setupNetworkErrorHandling() {
    // Intercept fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);

        if (!response.ok) {
          const error = {
            type: 'network',
            message: `HTTP ${response.status}: ${response.statusText}`,
            status: response.status,
            statusText: response.statusText,
            url: response.url,
            timestamp: Date.now(),
            userId: this.getCurrentUserId()
          };

          this.handleNetworkError(error, args);
        }

        return response;
      } catch (fetchError) {
        const error = {
          type: 'network',
          message: fetchError.message,
          stack: fetchError.stack,
          url: args[0],
          timestamp: Date.now(),
          userId: this.getCurrentUserId()
        };

        this.handleNetworkError(error, args);
        throw fetchError;
      }
    };
  }

  // Intercept console errors for additional logging
  setupConsoleInterception() {
    const originalError = console.error;
    console.error = (...args) => {
      // Call original console.error
      originalError.apply(console, args);

      // Log to our error system
      const error = {
        type: 'console',
        message: args.join(' '),
        args: args,
        timestamp: Date.now(),
        stack: new Error().stack,
        url: window.location.href,
        userId: this.getCurrentUserId()
      };

      this.logError(error);
    };
  }

  // Monitor network connectivity
  monitorConnectivity() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('🌐 Connection restored');
      this.processErrorQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('📴 Connection lost');
    });
  }

  // Main error handling function
  async handleError(error) {
    console.error('🚨 Error caught by handler:', error);

    // Log error locally
    this.logError(error);

    // Show user-friendly message
    this.showUserError(error);

    // Try to report error
    if (this.shouldReportError(error)) {
      await this.reportError(error);
    }

    // Handle specific error types
    this.handleSpecificError(error);
  }

  // Handle network-specific errors
  async handleNetworkError(error, originalArgs) {
    console.error('🌐 Network error:', error);

    this.logError(error);

    // Attempt retry for retryable requests
    if (this.isRetryableRequest(originalArgs[0])) {
      const retryKey = `${originalArgs[0]}-${JSON.stringify(originalArgs[1] || {})}`;
      const currentAttempts = this.retryAttempts.get(retryKey) || 0;

      if (currentAttempts < this.maxRetryAttempts) {
        this.retryAttempts.set(retryKey, currentAttempts + 1);

        const delay = this.calculateRetryDelay(currentAttempts);
        console.log(`🔄 Retrying request in ${delay}ms (attempt ${currentAttempts + 1})`);

        setTimeout(async () => {
          try {
            await fetch(...originalArgs);
            this.retryAttempts.delete(retryKey);
            console.log('✅ Retry successful');
          } catch (retryError) {
            console.error('❌ Retry failed:', retryError);
          }
        }, delay);
      } else {
        this.retryAttempts.delete(retryKey);
        this.showUserError({
          ...error,
          message: 'Request failed after multiple attempts. Please check your connection and try again.'
        });
      }
    } else {
      this.showUserError(error);
    }
  }

  // Log error locally
  logError(error) {
    try {
      // Store in local storage for offline access
      const errorLog = JSON.parse(localStorage.getItem('flow_error_log') || '[]');
      errorLog.push(error);

      // Keep only last 50 errors
      if (errorLog.length > 50) {
        errorLog.splice(0, errorLog.length - 50);
      }

      localStorage.setItem('flow_error_log', JSON.stringify(errorLog));

      // Store in IndexedDB for larger capacity
      this.storeInIndexedDB(error);

    } catch (storageError) {
      console.error('Failed to log error locally:', storageError);
    }
  }

  // Store error in IndexedDB
  async storeInIndexedDB(error) {
    try {
      const db = await this.openErrorDB();
      const transaction = db.transaction(['errors'], 'readwrite');
      const store = transaction.objectStore('errors');

      await store.add({
        ...error,
        id: `${error.timestamp}-${Math.random().toString(36).substr(2, 9)}`
      });

    } catch (dbError) {
      console.error('Failed to store error in IndexedDB:', dbError);
    }
  }

  // Open IndexedDB for error storage
  openErrorDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('FlowErrorDB', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('errors')) {
          const store = db.createObjectStore('errors', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('type', 'type');
        }
      };
    });
  }

  // Show user-friendly error message
  showUserError(error) {
    const userMessage = this.getUserFriendlyMessage(error);

    // Use toast notification if available
    if (window.toast) {
      const errorType = this.getErrorSeverity(error);
      window.toast.show(userMessage, errorType, 8000);
    } else {
      // Fallback to custom notification
      this.showCustomNotification(userMessage, 'error');
    }

    // For critical errors, also show modal
    if (this.isCriticalError(error)) {
      this.showErrorModal(error, userMessage);
    }
  }

  // Get user-friendly error message
  getUserFriendlyMessage(error) {
    const errorMessages = {
      // Network errors
      'Failed to fetch': 'Unable to connect to the server. Please check your internet connection.',
      'NetworkError': 'Network connection failed. Please check your internet connection.',
      'net::ERR_INTERNET_DISCONNECTED': 'No internet connection. Please check your network settings.',
      'net::ERR_NETWORK_CHANGED': 'Network connection changed. Please refresh the page.',

      // Firebase errors
      'Firebase: Error (auth/user-not-found)': 'No account found with this email address.',
      'Firebase: Error (auth/wrong-password)': 'Incorrect password. Please try again.',
      'Firebase: Error (auth/too-many-requests)': 'Too many failed attempts. Please try again later.',
      'Firebase: Error (auth/email-already-in-use)': 'An account with this email already exists.',
      'Firebase: Error (auth/weak-password)': 'Please choose a stronger password.',

      // Permission errors
      'permission-denied': 'You don\'t have permission to access this resource.',
      'unauthenticated': 'Please sign in to continue.',

      // Validation errors
      'ValidationError': 'Please check your input and try again.',
      'Required field': 'Please fill in all required fields.',

      // Default messages by error type
      javascript: 'An unexpected error occurred. Please refresh the page and try again.',
      network: 'Connection problem. Please check your internet and try again.',
      promise: 'An operation failed to complete. Please try again.',
      console: 'A system error was detected. Our team has been notified.'
    };

    // Check for specific error messages first
    for (const [key, message] of Object.entries(errorMessages)) {
      if (error.message && error.message.includes(key)) {
        return message;
      }
    }

    // Fall back to error type message
    return errorMessages[error.type] || 'An unexpected error occurred. Please try again or contact support if the problem persists.';
  }

  // Get error severity level
  getErrorSeverity(error) {
    if (this.isCriticalError(error)) {
      return 'error';
    }

    if (error.type === 'network' || error.type === 'promise') {
      return 'warning';
    }

    return 'info';
  }

  // Check if error is critical
  isCriticalError(error) {
    const criticalPatterns = [
      /auth.*failed/i,
      /payment.*failed/i,
      /security.*violation/i,
      /unauthorized.*access/i,
      /data.*corruption/i,
      /server.*error/i
    ];

    return criticalPatterns.some(pattern =>
      pattern.test(error.message || '')
    ) || error.status >= 500;
  }

  // Show custom notification
  showCustomNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `error-notification error-notification--${type}`;
    notification.innerHTML = `
      <div class="error-notification__content">
        <span class="error-notification__message">${message}</span>
        <button class="error-notification__close" aria-label="Close">×</button>
      </div>
    `;

    // Add styles if not already present
    this.addNotificationStyles();

    // Add to DOM
    const container = document.querySelector('.error-notifications') || this.createNotificationContainer();
    container.appendChild(notification);

    // Auto-remove after 8 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 8000);

    // Handle close button
    notification.querySelector('.error-notification__close').addEventListener('click', () => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    });
  }

  // Create notification container
  createNotificationContainer() {
    const container = document.createElement('div');
    container.className = 'error-notifications';
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
    return container;
  }

  // Show error modal for critical errors
  showErrorModal(error, userMessage) {
    const modal = document.createElement('div');
    modal.className = 'error-modal';
    modal.setAttribute('role', 'alertdialog');
    modal.setAttribute('aria-labelledby', 'error-modal-title');
    modal.setAttribute('aria-describedby', 'error-modal-desc');

    modal.innerHTML = `
      <div class="error-modal__overlay">
        <div class="error-modal__dialog">
          <div class="error-modal__header">
            <h2 id="error-modal-title" class="error-modal__title">
              <span class="error-modal__icon">⚠️</span>
              System Error
            </h2>
          </div>
          <div class="error-modal__body">
            <p id="error-modal-desc" class="error-modal__message">${userMessage}</p>
            <details class="error-modal__details">
              <summary>Technical Details</summary>
              <pre class="error-modal__stack">${error.stack || error.message}</pre>
            </details>
          </div>
          <div class="error-modal__footer">
            <button class="error-modal__button error-modal__button--primary" onclick="location.reload()">
              Refresh Page
            </button>
            <button class="error-modal__button error-modal__button--secondary" data-close="true">
              Continue
            </button>
          </div>
        </div>
      </div>
    `;

    // Add modal styles
    this.addModalStyles();

    // Add to DOM
    document.body.appendChild(modal);

    // Focus first button
    modal.querySelector('button').focus();

    // Handle close
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.closest('.error-modal__overlay') || e.target.hasAttribute('data-close')) {
        document.body.removeChild(modal);
      }
    });
  }

  // Report error to monitoring service
  async reportError(error) {
    if (!this.isOnline) {
      this.errorQueue.push(error);
      return;
    }

    try {
      // Send to your error reporting service
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(error)
      });

      console.log('✅ Error reported successfully');

    } catch (reportError) {
      console.error('❌ Failed to report error:', reportError);
      this.errorQueue.push(error);
    }
  }

  // Process error queue when back online
  async processErrorQueue() {
    if (this.errorQueue.length === 0) return;

    console.log(`📤 Processing ${this.errorQueue.length} queued errors...`);

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    for (const error of errors) {
      try {
        await this.reportError(error);
      } catch (reportError) {
        // Put back in queue if still failing
        this.errorQueue.push(error);
      }
    }
  }

  // Check if error should be reported
  shouldReportError(error) {
    // Don't report network errors when offline
    if (!this.isOnline && error.type === 'network') {
      return false;
    }

    // Don't report console.log messages
    if (error.type === 'console' && !error.message.includes('Error')) {
      return false;
    }

    // Don't report extension errors
    if (error.filename && error.filename.includes('extension://')) {
      return false;
    }

    return true;
  }

  // Handle specific error types
  handleSpecificError(error) {
    switch (error.type) {
      case 'network':
        this.handleNetworkSpecificError(error);
        break;
      case 'javascript':
        this.handleJavaScriptError(error);
        break;
      case 'promise':
        this.handlePromiseRejection(error);
        break;
    }
  }

  // Handle network-specific errors
  handleNetworkSpecificError(error) {
    // Enable offline mode if needed
    if (error.message.includes('Failed to fetch')) {
      this.enableOfflineMode();
    }

    // Clear auth tokens on 401
    if (error.status === 401) {
      this.handleAuthError();
    }
  }

  // Handle JavaScript errors
  handleJavaScriptError(error) {
    // Log component stack if available
    if (error.componentStack) {
      console.error('Component stack:', error.componentStack);
    }

    // Attempt recovery for recoverable errors
    if (this.isRecoverableError(error)) {
      this.attemptErrorRecovery(error);
    }
  }

  // Handle promise rejections
  handlePromiseRejection(error) {
    // Log additional context
    if (error.reason && typeof error.reason === 'object') {
      console.error('Promise rejection context:', error.reason);
    }
  }

  // Enable offline mode
  enableOfflineMode() {
    document.body.classList.add('offline-mode');

    if (window.toast) {
      window.toast.show('Working offline - changes will sync when reconnected', 'info', 5000);
    }
  }

  // Handle authentication errors
  handleAuthError() {
    // Clear stored tokens
    localStorage.removeItem('authToken');
    sessionStorage.clear();

    // Redirect to login if needed
    if (window.FlowAuth && typeof window.FlowAuth.redirectToLogin === 'function') {
      setTimeout(() => {
        window.FlowAuth.redirectToLogin();
      }, 2000);
    }
  }

  // Check if error is recoverable
  isRecoverableError(error) {
    const recoverablePatterns = [
      /module.*not.*found/i,
      /script.*error/i,
      /network.*error/i
    ];

    return recoverablePatterns.some(pattern =>
      pattern.test(error.message || '')
    );
  }

  // Attempt error recovery
  attemptErrorRecovery(error) {
    // Reload modules if module error
    if (error.message.includes('module')) {
      console.log('🔄 Attempting module recovery...');
      // Implementation for module reloading
    }

    // Retry network requests
    if (error.message.includes('network')) {
      console.log('🔄 Attempting network recovery...');
      // Implementation for network retry
    }
  }

  // Calculate retry delay with exponential backoff
  calculateRetryDelay(attemptNumber) {
    return Math.min(this.retryDelay * Math.pow(2, attemptNumber), 30000);
  }

  // Check if request is retryable
  isRetryableRequest(url) {
    // Don't retry authentication requests
    if (url.includes('/auth/')) {
      return false;
    }

    // Don't retry POST requests (unless specifically designed for idempotency)
    // This is a simple check - in practice you'd check the method
    return true;
  }

  // Get current user ID for error context
  getCurrentUserId() {
    try {
      if (window.FlowAuth && typeof window.FlowAuth.getCurrentUser === 'function') {
        const user = window.FlowAuth.getCurrentUser();
        return user ? user.uid : 'anonymous';
      }
      return 'anonymous';
    } catch (error) {
      return 'unknown';
    }
  }

  // Add notification styles
  addNotificationStyles() {
    if (document.getElementById('error-notification-styles')) return;

    const styles = `
      .error-notifications {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
      }

      .error-notification {
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        margin-bottom: 12px;
        animation: slideIn 0.3s ease-out;
      }

      .error-notification--error {
        background: #fee;
        border-color: #fcc;
        color: #721c24;
      }

      .error-notification--warning {
        background: #fff3cd;
        border-color: #ffecb3;
        color: #856404;
      }

      .error-notification--info {
        background: #d1ecf1;
        border-color: #b3e5fc;
        color: #0c5460;
      }

      .error-notification__content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px;
      }

      .error-notification__message {
        flex: 1;
        margin-right: 12px;
        font-size: 14px;
        line-height: 1.4;
      }

      .error-notification__close {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        opacity: 0.7;
      }

      .error-notification__close:hover {
        opacity: 1;
        background: rgba(0, 0, 0, 0.1);
      }

      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.id = 'error-notification-styles';
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }

  // Add modal styles
  addModalStyles() {
    if (document.getElementById('error-modal-styles')) return;

    const styles = `
      .error-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .error-modal__overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
      }

      .error-modal__dialog {
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow: hidden;
        position: relative;
        z-index: 1;
      }

      .error-modal__header {
        padding: 24px 24px 16px;
        border-bottom: 1px solid #eee;
      }

      .error-modal__title {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: #d32f2f;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .error-modal__icon {
        font-size: 24px;
      }

      .error-modal__body {
        padding: 24px;
        overflow-y: auto;
        max-height: 300px;
      }

      .error-modal__message {
        margin: 0 0 16px;
        font-size: 16px;
        line-height: 1.5;
        color: #333;
      }

      .error-modal__details {
        margin-top: 16px;
      }

      .error-modal__details summary {
        cursor: pointer;
        font-weight: 500;
        color: #666;
        margin-bottom: 8px;
      }

      .error-modal__stack {
        background: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 12px;
        font-size: 12px;
        overflow-x: auto;
        margin: 8px 0 0;
        color: #666;
      }

      .error-modal__footer {
        padding: 16px 24px 24px;
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }

      .error-modal__button {
        padding: 8px 16px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .error-modal__button--primary {
        background: #d32f2f;
        border-color: #d32f2f;
        color: white;
      }

      .error-modal__button--primary:hover {
        background: #b71c1c;
        border-color: #b71c1c;
      }

      .error-modal__button--secondary {
        background: white;
        color: #666;
      }

      .error-modal__button--secondary:hover {
        background: #f5f5f5;
      }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.id = 'error-modal-styles';
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }

  // Public API methods

  // Report a custom error
  reportCustomError(message, context = {}) {
    const error = {
      type: 'custom',
      message: message,
      context: context,
      stack: new Error().stack,
      timestamp: Date.now(),
      url: window.location.href,
      userId: this.getCurrentUserId()
    };

    this.handleError(error);
  }

  // Clear error logs
  clearErrorLogs() {
    try {
      localStorage.removeItem('flow_error_log');

      // Clear IndexedDB
      this.clearIndexedDBErrors();

      console.log('✅ Error logs cleared');
    } catch (error) {
      console.error('Failed to clear error logs:', error);
    }
  }

  // Clear IndexedDB errors
  async clearIndexedDBErrors() {
    try {
      const db = await this.openErrorDB();
      const transaction = db.transaction(['errors'], 'readwrite');
      const store = transaction.objectStore('errors');
      await store.clear();
    } catch (error) {
      console.error('Failed to clear IndexedDB errors:', error);
    }
  }

  // Get error logs
  getErrorLogs() {
    try {
      return JSON.parse(localStorage.getItem('flow_error_log') || '[]');
    } catch (error) {
      console.error('Failed to get error logs:', error);
      return [];
    }
  }

  // Export error logs
  exportErrorLogs() {
    const logs = this.getErrorLogs();
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `flow-error-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Initialize global error handler
const globalErrorHandler = new ErrorHandler();

// Export for use in other modules
window.ErrorHandler = ErrorHandler;
window.errorHandler = globalErrorHandler;

// Add global method for custom error reporting
window.reportError = (message, context) => {
  globalErrorHandler.reportCustomError(message, context);
};

export default ErrorHandler;
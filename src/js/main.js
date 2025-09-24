// Main bundle - Home page and common functionality
import '../styles/main.css';

// Core utilities
import '@/js/firebase-config-secure';
import '@/js/input-validation';

// Main page functionality
import '@assets/js/main';

// Initialize analytics if enabled
if (process.env.ENABLE_ANALYTICS === 'true' && window.gtag) {
  window.gtag('config', 'G-8K4RD31KW0');
}

// Initialize error tracking
if (window.Sentry && process.env.NODE_ENV === 'production') {
  window.Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV
  });
}

console.log('🚀 Flow PWA Main Bundle Loaded');
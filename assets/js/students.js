/* Minimal Students Portal - No Navigation/Redirect Logic */
(function () {
  'use strict';

  // Basic auth check without complex guards
  if (!window.FlowAuth) {
    console.log('❌ Auth system not available');
    return;
  }

  // Only proceed if authenticated - no callbacks, no guards
  if (!window.FlowAuth.isAuthenticated()) {
    console.log('❌ User not authenticated');
    return;
  }

  console.log('✅ Minimal students portal loaded');

  // Basic utilities only
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  // Minimal namespace
  window.Flow = window.Flow || {};
  Flow.store = Flow.store || {
    get(k, d = null) {
      try {
        const v = localStorage.getItem(k);
        return v ? JSON.parse(v) : d;
      } catch {
        return d;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(k, JSON.stringify(v));
      } catch {}
    }
  };

  // Basic language support without events
  Flow.i18n = Flow.i18n || {
    lang: 'en',
    t(k) { return k; } // Return key as fallback
  };

  // Basic toast without navigation
  const toast = {
    container: $('#toast-container'),
    show(message, type = 'info', duration = 3000) {
      if (!this.container) return;
      const el = document.createElement('div');
      el.className = `toast toast--${type}`;
      el.textContent = message;
      this.container.appendChild(el);
      setTimeout(() => el.remove(), duration);
    }
  };

  // Basic currency functionality (safe - no events)
  Flow.currency = Flow.currency || {
    code: Flow.store.get('flow.currency', 'USD'),
    fx: { USD: 1, EUR: 0.92, GBP: 0.78, KES: 129, NGN: 1600, GHS: 15.5, TZS: 2600, UGX: 3800, ZAR: 18.4 },
    set(code) {
      if (this.fx[code]) {
        this.code = code;
        Flow.store.set('flow.currency', code);
        this.apply();
      }
    },
    to(usd) { return (+usd || 0) * (this.fx[this.code] || 1); },
    fmt(usd) {
      try {
        return new Intl.NumberFormat(document.documentElement.lang || 'en', {
          style: 'currency',
          currency: this.code
        }).format(this.to(usd));
      } catch {
        return `${this.code} ${this.to(usd).toFixed(2)}`;
      }
    },
    apply() {
      $$('[data-amount-usd]').forEach(el => el.textContent = this.fmt(el.getAttribute('data-amount-usd')));
    }
  };

  // Basic language support with actual translations (safe - no complex events)
  Flow.i18n = {
    lang: Flow.store.get('flow.lang', 'en'),
    dict: {
      en: {
        welcome: 'Welcome to Flow!',
        banner_dismissed: 'Banner dismissed',
        synced: 'Data synced',
        offline_note: 'You are offline. Changes will sync when online.',
        autosave: 'Changes saved automatically'
      },
      fr: {
        welcome: 'Bienvenue sur Flow !',
        banner_dismissed: 'Bannière fermée',
        synced: 'Données synchronisées',
        offline_note: 'Vous êtes hors ligne. Les modifications se synchroniseront en ligne.',
        autosave: 'Modifications enregistrées automatiquement'
      }
    },
    t(key) {
      const lang = this.lang in this.dict ? this.lang : 'en';
      return this.dict[lang][key] || key;
    },
    set(lang) {
      this.lang = lang;
      Flow.store.set('flow.lang', lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }
  };

  // Initialize year display (safe)
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Apply currency formatting on load (safe)
  Flow.currency.apply();

  // Basic connection status (safe - no complex handlers)
  const connectionStatus = {
    indicator: $('.connection-status__indicator'),
    text: $('.connection-status__text'),
    isOnline: navigator.onLine,

    updateStatus() {
      if (this.indicator) {
        this.indicator.className = `connection-status__indicator ${this.isOnline ? 'connection-status__indicator--online' : 'connection-status__indicator--offline'}`;
      }
      if (this.text) {
        this.text.textContent = this.isOnline ? 'Online' : 'Offline';
      }
    }
  };

  connectionStatus.updateStatus();

  // Safe banner dismissal (no navigation)
  const dismissBtn = $('#dismissBanner');
  const banner = $('#onboardingBanner');
  if (dismissBtn && banner) {
    dismissBtn.addEventListener('click', () => {
      banner.style.display = 'none';
      toast.show(Flow.i18n.t('banner_dismissed'), 'info', 2000);
    });
  }

  // Safe language switcher (no complex navigation)
  const languageSwitcher = {
    select: $('#lang'),
    init() {
      if (!this.select) return;
      this.select.value = Flow.i18n.lang;
      this.select.addEventListener('change', (e) => {
        const newLang = e.target.value;
        Flow.i18n.set(newLang);
        toast.show('Language updated', 'success', 1500);
      });
    }
  };

  // Safe currency selector (no navigation)
  const currencySel = $('#currency');
  if (currencySel) {
    currencySel.value = Flow.currency.code;
    currencySel.addEventListener('change', e => {
      Flow.currency.set(e.target.value);
      toast.show('Currency updated', 'success', 1500);
    });
  }

  // Safe refresh button (no actual navigation - just UI feedback)
  const refreshBtn = document.querySelector('[data-refresh="dashboard"]');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      refreshBtn.classList.add('btn--loading');
      setTimeout(() => {
        refreshBtn.classList.remove('btn--loading');
        toast.show(Flow.i18n.t('synced'), 'success', 2000);
      }, 900);
    });
  }

  // Safe auto-save simulation (no navigation)
  const autoSave = {
    debounce(fn, wait) {
      let t;
      return (...a) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...a), wait);
      };
    },
    init() {
      $$('input, textarea, select').forEach(field => {
        field.addEventListener('input', this.debounce(() => {
          if (connectionStatus.isOnline) {
            toast.show(Flow.i18n.t('autosave'), 'success', 1200);
          } else {
            toast.show(Flow.i18n.t('offline_note'), 'info', 2000);
          }
        }, 900));
      });
    }
  };

  // Initialize safe components
  languageSwitcher.init();
  autoSave.init();

  // Welcome message for first-time users (safe)
  if (!Flow.store.get('flow.visited')) {
    setTimeout(() => toast.show(Flow.i18n.t('welcome'), 'info', 5000), 800);
    Flow.store.set('flow.visited', true);
  }

  // Expose API
  window.toast = toast;
  window.Flow = Flow;

  console.log('✅ Enhanced students portal with safe interactions initialized');
})();
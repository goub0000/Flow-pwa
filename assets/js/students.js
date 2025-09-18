/*
 * Flow Students Portal Script — CLEAN (no messaging in this bundle)
 * - i18n (EN/FR/AR/SW) + RTL
 * - Currency selector w/ seeded FX; formats [data-amount-usd]
 * - Connection status + autosave toasts
 * - Mobile nav & language persistence
 * - Dashboard interactions (onboarding banner, quick actions, tasks)
 * - Settings drawer (preferences/profile/security)
 * - 3D tilt/glow on cards
 * - Background particles (respects motion preference)
 */

(function () {
  'use strict';
  
  // STRICT Authentication Guard - Students only, no fallback
  if (!window.FlowAuthGuards) {
    console.error('❌ Auth system required for students portal');
    document.body.innerHTML = '<div style="padding: 2rem; text-align: center; font-family: Arial, sans-serif;"><h1>🔒 Students Portal</h1><p>Please log in to access the students portal.</p><a href="/" style="color: #5a5bb8;">Return to Home</a></div>';
    return;
  }

  window.FlowAuthGuards.studentGuard(function(user) {
    console.log('✅ Student access granted:', user.fullName);
    initStudentsPortal();
  });

  function initStudentsPortal() {
    const $ = (selector, context = document) => context.querySelector(selector);
    const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

  // Namespace / Store / i18n
  window.Flow = window.Flow || {};
  Flow.store = Flow.store || {
    get(k, d = null) {
      try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; }
    },
    set(k, v) {
      try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
    }
  };

  Flow.i18n = Flow.i18n || {
    lang: Flow.store.get('flow.lang') || (localStorage.getItem('flow-language') || 'en'),
    dirFor: l => l === 'ar' ? 'rtl' : 'ltr',
    dict: {
      en: {
        online: 'Online', offline: 'Offline',
        conn_back: 'Connection restored - syncing your data',
        offline_note: 'Working offline - changes will sync when reconnected',
        synced: 'All changes synced successfully',
        lang_switched: n => `Language switched to ${n}`,
        banner_dismissed: 'Onboarding reminder hidden',
        open_upload: 'Opening document upload...',
        open_rec: 'Opening recommender invitation...',
        open_int: 'Opening interview scheduler...',
        open_app: 'Opening application details...',
        start_task: t => `Starting task: ${t}`,
        autosave: 'Changes saved automatically',
        localsave: 'Changes saved locally - will sync when online',
        welcome: 'Welcome to Flow! Complete your onboarding to get started.',
        refreshed: 'Dashboard data refreshed',
        profile_saved: 'Profile saved',
        mic_denied: 'Microphone permission denied'
      },
      fr: {
        online: 'En ligne', offline: 'Hors ligne',
        conn_back: 'Connexion rétablie – synchronisation de vos données',
        offline_note: 'Mode hors ligne – les modifications se synchroniseront plus tard',
        synced: 'Toutes les modifications ont été synchronisées',
        lang_switched: n => `Langue changée en ${n}`,
        banner_dismissed: 'Rappel d’onboarding masqué',
        open_upload: 'Ouverture du téléversement de documents…',
        open_rec: 'Ouverture de l’invitation du recommandataire…',
        open_int: 'Ouverture du planificateur d’entretien…',
        open_app: 'Ouverture des détails de la candidature…',
        start_task: t => `Démarrage de la tâche : ${t}`,
        autosave: 'Modifications enregistrées automatiquement',
        localsave: 'Modifications enregistrées localement – synchronisation ultérieure',
        welcome: 'Bienvenue sur Flow ! Terminez votre onboarding pour commencer.',
        refreshed: 'Tableau de bord actualisé',
        profile_saved: 'Profil enregistré',
        mic_denied: 'Autorisation micro refusée'
      },
      ar: {
        online: 'متصل', offline: 'غير متصل',
        conn_back: 'تمت استعادة الاتصال – جارية مزامنة بياناتك',
        offline_note: 'تعمل دون اتصال – ستتم المزامنة عند الاتصال',
        synced: 'تمت مزامنة جميع التغييرات بنجاح',
        lang_switched: n => `تم تغيير اللغة إلى ${n}`,
        banner_dismissed: 'تم إخفاء تذكير البدء',
        open_upload: 'جارٍ فتح رفع المستندات…',
        open_rec: 'جارٍ فتح دعوة الموصي…',
        open_int: 'جارٍ فتح مجدول المقابلة…',
        open_app: 'جارٍ فتح تفاصيل الطلب…',
        start_task: t => `بدء المهمة: ${t}`,
        autosave: 'تم حفظ التغييرات تلقائيًا',
        localsave: 'حُفظت التغييرات محليًا – ستُزامن عند الاتصال',
        welcome: 'مرحبًا بك في Flow! أكمل الإعداد للبدء.',
        refreshed: 'تم تحديث لوحة المعلومات',
        profile_saved: 'تم حفظ الملف الشخصي',
        mic_denied: 'تم رفض إذن الميكروفون'
      },
      sw: {
        online: 'Mtandaoni', offline: 'Nje ya mtandao',
        conn_back: 'Muunganisho umerejea – tunaunganisha data yako',
        offline_note: 'Unafanya kazi nje ya mtandao – mabadiliko yatasawazishwa utakaporejea mtandaoni',
        synced: 'Mabadiliko yote yamesawazishwa',
        lang_switched: n => `Lugha imebadilishwa kuwa ${n}`,
        banner_dismissed: 'Kumbusho la onboarding limefichwa',
        open_upload: 'Inafungua upakiaji wa hati…',
        open_rec: 'Inafungua mwaliko wa mpendekeza…',
        open_int: 'Inafungua upangaji wa usaili…',
        open_app: 'Inafungua maelezo ya ombi…',
        start_task: t => `Kuanza jukumu: ${t}`,
        autosave: 'Mabadiliko yamehifadhiwa kiotomatiki',
        localsave: 'Mabadiliko yamehifadhiwa ndani – yatasawazishwa ukiwa mtandaoni',
        welcome: 'Karibu Flow! Kamilisha onboarding uanze.',
        refreshed: 'Dashibodi imesasishwa',
        profile_saved: 'Wasifu umehifadhiwa',
        mic_denied: 'Ruhusa ya kipaza sauti imekataliwa'
      }
    },
    t(k, p) {
      const L = this.lang in this.dict ? this.lang : 'en';
      const v = this.dict[L][k];
      return typeof v === 'function' ? v(p) : v;
    },
    set(l) {
      this.lang = l;
      Flow.store.set('flow.lang', l);
      document.documentElement.lang = l;
      document.documentElement.dir = this.dirFor(l);
    }
  };
  Flow.i18n.set(Flow.i18n.lang);

  // Currency (seeded)
  Flow.currency = Flow.currency || {
    code: Flow.store.get('flow.currency', 'USD'),
    fx: { USD: 1, EUR: 0.92, GBP: 0.78, KES: 129, NGN: 1600, GHS: 15.5, TZS: 2600, UGX: 3800, ZAR: 18.4 },
    set(code) { if (this.fx[code]) { this.code = code; Flow.store.set('flow.currency', code); this.apply(); } },
    to(amountUSD) { return (+amountUSD || 0) * (this.fx[this.code] || 1); },
    fmt(amountUSD) {
      try { return new Intl.NumberFormat(Flow.i18n.lang, { style: 'currency', currency: this.code }).format(this.to(amountUSD)); }
      catch { return `${this.code} ${this.to(amountUSD).toFixed(2)}`; }
    },
    apply() { $$('[data-amount-usd]').forEach(el => { el.textContent = this.fmt(el.getAttribute('data-amount-usd')); }); }
  };
  Flow.currency.apply();

  // Toasts
  const toast = {
    container: $('#toast-container'),
    show(message, type = 'info', duration = 5000) {
      if (!this.container) return;
      const variant = (type === 'success' || type === 'warning' || type === 'error') ? ` toast--${type}` : '';
      const el = document.createElement('div');
      el.className = `toast${variant}`;
      el.setAttribute('role', 'alert');
      el.innerHTML = `<div class="toast__content"><span class="toast__message">${message}</span><button class="toast__close" aria-label="Close">×</button></div>`;
      this.container.appendChild(el);
      requestAnimationFrame(() => el.classList.add('toast--visible'));
      const remove = () => { el.classList.remove('toast--visible'); setTimeout(() => el.remove(), 300); };
      $('.toast__close', el)?.addEventListener('click', remove);
      if (duration > 0) setTimeout(remove, duration);
    }
  };

  // Connection status
  const connectionStatus = {
    indicator: $('.connection-status__indicator'),
    text: $('.connection-status__text'),
    isOnline: navigator.onLine,
    init() {
      this.updateStatus();
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
    },
    updateStatus() {
      if (this.indicator && this.text) {
        this.indicator.className = `connection-status__indicator${this.isOnline ? '' : ' connection-status__indicator--offline'}`;
        this.text.textContent = this.isOnline ? Flow.i18n.t('online') : Flow.i18n.t('offline');
      }
    },
    handleOnline() {
      this.isOnline = true; this.updateStatus();
      toast.show(Flow.i18n.t('conn_back'), 'success', 3000);
      this.syncData();
    },
    handleOffline() {
      this.isOnline = false; this.updateStatus();
      toast.show(Flow.i18n.t('offline_note'), 'info', 5000);
    },
    syncData() { setTimeout(() => { if (this.isOnline) toast.show(Flow.i18n.t('synced'), 'success', 2000); }, 1500); }
  };

  // Mobile nav
  const navigation = {
    toggle: $('.nav__toggle'),
    menu: $('#navMenu'),
    init() {
      if (!this.toggle || !this.menu) return;
      this.toggle.addEventListener('click', () => this.toggleMenu());
      $$('.nav__list a', this.menu).forEach(link => link.addEventListener('click', () => { if (window.innerWidth <= 768) this.closeMenu(); }));
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.isMenuOpen()) this.closeMenu(); });
      // Header blur on scroll
      const header = document.querySelector('.header');
      const onScroll = () => header && header.classList.toggle('header--scrolled', window.scrollY > 10);
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    },
    toggleMenu() { this.isMenuOpen() ? this.closeMenu() : this.openMenu(); },
    openMenu() { this.menu.setAttribute('data-open', 'true'); this.toggle.setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden'; },
    closeMenu() { this.menu.setAttribute('data-open', 'false'); this.toggle.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; },
    isMenuOpen() { return this.menu.getAttribute('data-open') === 'true'; }
  };

  // Language & currency selectors
  const languageSwitcher = {
    select: $('#lang'),
    init() {
      if (!this.select) return;
      this.select.value = Flow.i18n.lang;
      this.select.addEventListener('change', (e) => {
        const newLang = e.target.value;
        Flow.i18n.set(newLang);
        toast.show(Flow.i18n.t('lang_switched', this.select.options[this.select.selectedIndex].text), 'success', 2000);
      });
    }
  };
  const currencySel = $('#currency'); // in settings drawer
  if (currencySel) { currencySel.value = Flow.currency.code; currencySel.addEventListener('change', e => Flow.currency.set(e.target.value)); }

  // Dashboard interactions
  const dashboard = {
    init() {
      this.initOnboardingBanner();
      this.initQuickActions();
      this.initApplicationItems();
      this.initTaskItems();
      this.initUploads(); // optional and safe-guarded
    },
    initOnboardingBanner() {
      const dismissBtn = $('#dismissBanner');
      const banner = $('#onboardingBanner');
      if (dismissBtn && banner) {
        dismissBtn.addEventListener('click', () => {
          banner.style.display = 'none';
          toast.show(Flow.i18n.t('banner_dismissed'), 'info', 2000);
          Flow.store.set('flow.onboarding.dismissed', true);
        });
        if (Flow.store.get('flow.onboarding.dismissed')) banner.style.display = 'none';
      }
    },
    initQuickActions() {
      $$('[data-action]').forEach(button => {
        button.addEventListener('click', () => {
          const action = button.getAttribute('data-action');
          const actions = {
            'search-programs': () => { window.location.href = '/students/programs.html'; },
            'upload-document': () => { toast.show(Flow.i18n.t('open_upload'), 'info', 2000); setTimeout(() => { window.location.href = '/students/profile.html#documents'; }, 500); },
            'invite-recommender': () => { toast.show(Flow.i18n.t('open_rec'), 'info', 2000); setTimeout(() => { window.location.href = '/students/applications.html#recommenders'; }, 500); },
            'schedule-interview': () => { toast.show(Flow.i18n.t('open_int'), 'info', 2000); setTimeout(() => { window.location.href = '/students/applications.html#interviews'; }, 500); }
          };
          if (actions[action]) actions[action]();
        });
      });
    },
    initApplicationItems() {
      $$('.application-item__action').forEach(button => {
        button.addEventListener('click', () => {
          toast.show(Flow.i18n.t('open_app'), 'info', 1500);
          setTimeout(() => window.location.href = '/students/applications.html', 500);
        });
      });
    },
    initTaskItems() {
      $$('.task-item__action').forEach(button => {
        button.addEventListener('click', () => {
          const taskTitle = button.closest('.task-item')?.querySelector('.task-item__title')?.textContent || '';
          toast.show(Flow.i18n.t('start_task', taskTitle), 'info', 2000);
        });
      });
    },
    // Optional: individual uploads with cap (only if DOM exists)
    initUploads() {
      const area = $('#docUploadArea'); const input = $('#docUploadInput'); const list = $('#docUploadList'); const count = $('#docUploadCount');
      if (!area && !input) return;
      const KEY = 'flow.student.uploads.v1';
      const files = Flow.store.get(KEY, []);
      const render = () => {
        if (list) {
          list.innerHTML = '';
          files.forEach((n, i) => {
            const li = document.createElement('li'); li.textContent = n;
            const x = document.createElement('button'); x.className = 'btn btn--ghost btn--sm'; x.textContent = '×';
            x.addEventListener('click', () => { files.splice(i, 1); Flow.store.set(KEY, files); render(); });
            li.appendChild(x); list.appendChild(li);
          });
        }
        if (count) count.textContent = String(files.length);
      };
      render();
      const add = (fileList) => {
        for (const f of fileList) {
          if (files.length >= 10) { alert('Max 10 files.'); break; }
          if (f.size > 5 * 1024 * 1024) { alert('File > 5MB'); continue; }
          const ok = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'].includes(f.type);
          if (!ok) { alert('PDF or image only'); continue; }
          files.push(f.name);
        }
        Flow.store.set(KEY, files); render();
      };
      input?.addEventListener('change', e => add(e.target.files || []));
      area?.addEventListener('dragover', e => { e.preventDefault(); area.classList.add('drag'); });
      area?.addEventListener('dragleave', () => area.classList.remove('drag'));
      area?.addEventListener('drop', e => { e.preventDefault(); area.classList.remove('drag'); add(e.dataTransfer.files || []); });
    }
  };

  // Smooth scroll for in-page anchors
  const smoothScroll = {
    init() {
      $$('a[href^="#"]').forEach(link => link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href !== '#') {
          const target = $(href);
          if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        }
      }));
    }
  };

  // Auto-save (demo)
  const autoSave = {
    init() {
      $$('input, textarea, select').forEach(field => {
        field.addEventListener('input', this.debounce(() => {
          if (connectionStatus.isOnline) this.saveData(); else this.saveLocally();
        }, 900));
      });
    },
    saveData() { toast.show(Flow.i18n.t('autosave'), 'success', 1200); },
    saveLocally() { toast.show(Flow.i18n.t('localsave'), 'info', 1800); },
    debounce(fn, wait) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), wait); }; }
  };

  // 3D tilt/glow
  function enableTiltOnCards() {
    const targets = $$('.dashboard-card, .stat-card');
    targets.forEach(card => {
      card.classList.add('card--interactive');
      if (!$('.card__glow', card)) {
        const glow = document.createElement('span');
        glow.className = 'card__glow';
        card.appendChild(glow);
      }
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const mx = ((e.clientX - r.left) / r.width) * 100;
        const my = ((e.clientY - r.top) / r.height) * 100;
        card.style.setProperty('--mx', mx + '%');
        card.style.setProperty('--my', my + '%');
        const glow = $('.card__glow', card);
        if (glow) glow.style.opacity = '1';
      });
      card.addEventListener('mouseleave', () => {
        const glow = $('.card__glow', card);
        if (glow) glow.style.opacity = '0';
      });
    });
  }

  // Settings drawer
  const Settings = (() => {
    const els = {
      openBtn: $('#openSettings'),
      overlay: $('#settingsOverlay'),
      drawer: $('#settingsDrawer'),
      closeBtn: $('#closeSettings'),
      tabs: $$('.settings-tab'),
      panels: $$('.settings-panel'),
      prefTheme: $('#prefTheme'),
      prefDensity: $('#prefDensity'),
      prefMotion: $('#prefMotion'),
      currency: $('#currency'),
      profileName: $('#profileName'),
      profileInterest: $('#profileInterest'),
      profileGPA: $('#profileGPA'),
      profileAvatar: $('#profileAvatar'),
      saveProfile: $('#saveProfile'),
      setup2fa: $('#setup2fa'),
      logoutAll: $('#logoutAll')
    };

    const state = {
      theme: Flow.store.get('flow.pref.theme', 'auto'),
      density: Flow.store.get('flow.pref.density', 'comfortable'),
      motion: Flow.store.get('flow.pref.motion', 'full'),
      profile: Flow.store.get('flow.profile', { name: '', interest: '', gpa: '', avatar: null })
    };

    function applyTheme() {
      const html = document.documentElement;
      html.removeAttribute('data-theme');
      if (state.theme !== 'auto') html.setAttribute('data-theme', state.theme);
    }
    function applyDensity() { document.documentElement.setAttribute('data-density', state.density); }
    function applyMotion() { document.documentElement.setAttribute('data-motion', state.motion === 'reduced' ? 'reduced' : 'full'); }

    function open() { els.drawer?.classList.add('settings-drawer--open'); els.drawer?.setAttribute('aria-hidden', 'false'); els.overlay?.classList.add('settings-overlay--open'); els.overlay?.removeAttribute('hidden'); }
    function close() { els.drawer?.classList.remove('settings-drawer--open'); els.drawer?.setAttribute('aria-hidden', 'true'); els.overlay?.classList.remove('settings-overlay--open'); els.overlay?.setAttribute('hidden', ''); }

    function initTabs() {
      els.tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          const to = tab.getAttribute('data-tab');
          els.tabs.forEach(t => t.classList.toggle('settings-tab--active', t === tab));
          els.panels.forEach(p => {
            const is = p.id === `tab-${to}`;
            p.toggleAttribute('hidden', !is);
            p.classList.toggle('settings-panel--active', is);
          });
        });
      });
    }

    function init() {
      if (!els.drawer) return;

      if (els.prefTheme) els.prefTheme.value = state.theme;
      if (els.prefDensity) els.prefDensity.value = state.density;
      if (els.prefMotion) els.prefMotion.value = state.motion;
      if (els.currency) els.currency.value = Flow.currency.code;

      if (els.profileName) els.profileName.value = state.profile.name || '';
      if (els.profileInterest) els.profileInterest.value = state.profile.interest || '';
      if (els.profileGPA) els.profileGPA.value = state.profile.gpa || '';

      applyTheme(); applyDensity(); applyMotion();

      els.openBtn?.addEventListener('click', open);
      els.closeBtn?.addEventListener('click', close);
      els.overlay?.addEventListener('click', close);
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

      els.prefTheme?.addEventListener('change', e => { state.theme = e.target.value; Flow.store.set('flow.pref.theme', state.theme); applyTheme(); });
      els.prefDensity?.addEventListener('change', e => { state.density = e.target.value; Flow.store.set('flow.pref.density', state.density); applyDensity(); });
      els.prefMotion?.addEventListener('change', e => { state.motion = e.target.value; Flow.store.set('flow.pref.motion', state.motion); applyMotion(); });

      els.currency?.addEventListener('change', e => Flow.currency.set(e.target.value));

      els.saveProfile?.addEventListener('click', () => {
        state.profile.name = els.profileName?.value || '';
        state.profile.interest = els.profileInterest?.value || '';
        state.profile.gpa = els.profileGPA?.value || '';
        Flow.store.set('flow.profile', state.profile);

        // Update dashboard greeting (best-effort)
        const dashTitle = $('#dashTitle');
        if (dashTitle && state.profile.name) {
          dashTitle.textContent = `Welcome back, ${state.profile.name}!`;
        }
        toast.show(Flow.i18n.t('profile_saved'), 'success', 2000);
      });

      els.profileAvatar?.addEventListener('change', () => {
        toast.show('Avatar selected (preview only)', 'info', 1500);
      });

      els.setup2fa?.addEventListener('click', () => toast.show('2FA setup coming soon', 'info', 2000));
      els.logoutAll?.addEventListener('click', () => toast.show('Signed out of all sessions (demo)', 'success', 2000));

      initTabs();
    }

    return { init };
  })();

  // Background particles
  const Particles = (() => {
    const canvas = $('#particleCanvas');
    if (!canvas) return { init: () => {} };
    const ctx = canvas.getContext('2d');
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0, rafId = 0;
    const N = 64;
    const particles = [];
    let reduced = false;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      w = Math.floor(rect.width * dpr);
      h = Math.floor(rect.height * dpr);
      canvas.width = w; canvas.height = h;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
    }

    function seed() {
      particles.length = 0;
      for (let i = 0; i < N; i++) {
        particles.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
          r: Math.random() * 1.5 + 0.5
        });
      }
    }

    function step() {
      if (reduced) return;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        a.x += a.vx; a.y += a.vy;
        if (a.x < 0 || a.x > w) a.vx *= -1;
        if (a.y < 0 || a.y > h) a.vy *= -1;

        // points
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(120, 130, 155, 0.45)';
        ctx.fill();

        // links
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 130 * dpr) {
            ctx.globalAlpha = (1 - dist / (130 * dpr)) * 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = 'rgba(120, 130, 155, 0.35)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }
      rafId = requestAnimationFrame(step);
    }

    function setMotionMode() {
      reduced = document.documentElement.getAttribute('data-motion') === 'reduced';
      if (reduced) cancelAnimationFrame(rafId);
      else { cancelAnimationFrame(rafId); rafId = requestAnimationFrame(step); }
    }

    function init() {
      resize(); seed(); setMotionMode();
      window.addEventListener('resize', () => { resize(); seed(); });
      const observer = new MutationObserver(setMotionMode);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
    }

    return { init };
  })();

  function init() {
    const yearEl = $('#year'); if (yearEl) yearEl.textContent = new Date().getFullYear();
    connectionStatus.init();
    navigation.init();
    languageSwitcher.init();
    dashboard.init();
    smoothScroll.init();
    autoSave.init();

    // Welcome for first-time
    if (!Flow.store.get('flow.visited')) {
      setTimeout(() => toast.show(Flow.i18n.t('welcome'), 'info', 5000), 800);
      Flow.store.set('flow.visited', true);
    }

    // Optional refresh button
    const refreshBtn = document.querySelector('[data-refresh="dashboard"]');
    refreshBtn?.addEventListener('click', () => {
      refreshBtn.classList.add('btn--loading');
      setTimeout(() => { refreshBtn.classList.remove('btn--loading'); console.log(Flow.i18n.t('refreshed')); }, 900);
    });

    // Currency re-apply on load
    Flow.currency.apply();

    enableTiltOnCards();
    Settings.init();
    Particles.init();

    console.log('Student portal (clean) initialized');
  }

  } // End of initStudentsPortal function
})();

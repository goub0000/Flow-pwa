// Main client-side logic for the Flow home page.
//
// This file consolidates the previously inline scripts from the
// home page into a single module. It is responsible for wiring up
// modal interactions, handling navigation toggles, providing toast
// notifications, managing language preferences, monitoring
// connectivity and enabling smooth scrolling. Keeping this logic
// external from the HTML keeps the markup clean and facilitates
// future maintenance.

/* eslint-env browser */

// -----------------------------------------------------------------------------
// Generic helpers and modal management
// -----------------------------------------------------------------------------
(function(){
  // Set the current year on the footer once the DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    try {
      var yearEl = document.getElementById('year');
      if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
      }
    } catch (e) {
      // Fail silently if element is missing
    }

    // Wire up modal triggers and closer buttons once DOM has loaded
    qsa('[data-open]').forEach(function(btn){
      btn.addEventListener('click', function(){
        openModal(btn.getAttribute('data-open'));
      });
    });

    qsa('[data-close]').forEach(function(btn){
      btn.addEventListener('click', function(){
        closeModal(btn.getAttribute('data-close'));
      });
    });

    // Close modal on ESC
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape') {
        closeModal('signupModal');
        closeModal('loginPortalsModal');
      }
    });

    // Handle clicks for all modals
    var modalIds = ['signupModal', 'loginPortalsModal'];
    modalIds.forEach(function(modalId) {
      var dialog = qs('#' + modalId + ' .modal__dialog');
      if (dialog) {
        dialog.addEventListener('click', function(e){ e.stopPropagation(); });
      }
      var overlay = qs('#' + modalId + ' .modal__overlay');
      if (overlay) {
        overlay.addEventListener('click', function(){ closeModal(modalId); });
      }
    });

    // Sign In button now uses data-open="loginPortalsModal" so no custom handler needed

    // Handle back button from login portals
    var backToGetStarted = document.getElementById('backToGetStarted');
    if (backToGetStarted) {
      backToGetStarted.addEventListener('click', function(){
        closeModal('loginPortalsModal');
      });
    }

    // Handle Sign Up modal - integrate with auth system
    var continueToOnboarding = document.getElementById('continueToOnboarding');
    console.log('continueToOnboarding button found:', continueToOnboarding);
    if (continueToOnboarding) {
      continueToOnboarding.addEventListener('click', function(){
        console.log('Start Onboarding clicked');
        var sel = qs('input[name="acctType"]:checked');
        var val = sel ? sel.value : 'student';
        console.log('Selected account type:', val);
        
        // Redirect to registration page with selected account type
        var url = '/auth/register.html?type=' + encodeURIComponent(val);
        console.log('Redirecting to:', url);
        window.location.href = url;
      });
    } else {
      console.log('continueToOnboarding button not found!');
    }

    // Initialize authentication integration
    initAuthIntegration();
  });

  // Helper to select a single element
  function qs(sel, ctx){ return (ctx || document).querySelector(sel); }
  // Helper to select multiple elements and convert NodeList to an Array
  function qsa(sel, ctx){ return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  // Open a modal by ID
  function openModal(id){
    var m = document.getElementById(id);
    if (!m) return;
    m.removeAttribute('aria-hidden');
    m.classList.add('is-open');
    // focus first radio or input
    var first = qs('input[name="acctType"]', m);
    if (first) first.focus();
    document.body.style.overflow = 'hidden';
    
    // Update modal content with translations when opened (if i18n system is loaded)
    if (window.FlowI18n) {
      window.FlowI18n.updateTranslations();
    }
  }
  // Close a modal by ID
  function closeModal(id){
    var m = document.getElementById(id);
    if (!m) return;
    m.setAttribute('aria-hidden', 'true');
    m.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  // Expose helpers to other closures if necessary (not strictly exported)
  window.flowHelpers = { qs: qs, qsa: qsa, openModal: openModal, closeModal: closeModal };
})();

// -----------------------------------------------------------------------------
// Enhanced features: toast notifications, navigation, language, connectivity
// -----------------------------------------------------------------------------
(function(){
  'use strict';

  /**
   * Simple toast notification utility. Creates toasts inside a
   * dedicated container and handles auto-dismissal.
   */
  var toast = {
    container: null,
    show: function(message, type, duration) {
      // Lazily locate the container if not already cached
      if (!this.container) {
        this.container = document.getElementById('toast-container');
      }
      if (!this.container) return;
      // Only recognise success, error and warning variants; default is plain toast
      var variant = '';
      if (type === 'success' || type === 'error' || type === 'warning' || type === 'info') {
        variant = ' toast--' + type;
      }
      duration = typeof duration === 'number' ? duration : 5000;

      var toastEl = document.createElement('div');
      toastEl.className = 'toast' + variant;
      toastEl.setAttribute('role', 'alert');
      toastEl.innerHTML = '<div class="toast__content"><span class="toast__message">' + message + '</span><button class="toast__close" aria-label="Close">×</button></div>';

      this.container.appendChild(toastEl);
      // Animate in after a tiny delay so transitions apply
      requestAnimationFrame(function() {
        toastEl.classList.add('toast--visible');
      });

      // Remove function shared by auto-close and manual close
      var removeToast = function() {
        toastEl.classList.remove('toast--visible');
        setTimeout(function() {
          if (toastEl.parentNode) {
            toastEl.parentNode.removeChild(toastEl);
          }
        }, 300);
      };

      // Manual close button handler
      var closeBtn = toastEl.querySelector('.toast__close');
      if (closeBtn) {
        closeBtn.addEventListener('click', removeToast);
      }

      // Auto-dismiss after the specified duration
      if (duration > 0) {
        setTimeout(removeToast, duration);
      }
    }
  };

  /**
   * Setup the responsive navigation: toggles the navigation menu on small
   * screens and locks body scrolling when open. Also closes the menu
   * automatically when a navigation link is clicked on mobile.
   */
  function initNavigation() {
    var navToggle = document.querySelector('.nav__toggle');
    var navMenu = document.querySelector('.nav__list');
    if (!navToggle || !navMenu) return;

    navToggle.addEventListener('click', function() {
      var isOpen = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', (!isOpen).toString());
      // Use data attribute for styling (matches the provided CSS)
      navMenu.setAttribute('data-open', (!isOpen).toString());
      document.body.style.overflow = isOpen ? '' : 'hidden';
    });

    // Close menu when any link is clicked on small screens
    var links = navMenu.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function() {
        if (window.innerWidth <= 768) {
          navToggle.setAttribute('aria-expanded', 'false');
          navMenu.setAttribute('data-open', 'false');
          document.body.style.overflow = '';
        }
      });
    }
  }

  /**
   * Initialize the language selector: show a toast when the user changes
   * language and persist their selection to localStorage.
   * 
   * NOTE: Language switching functionality is now handled by the i18n system
   * in assets/js/i18n.js. This function maintains compatibility but defers to i18n system.
   */
  function initLanguageSwitcher() {
    var langSelect = document.getElementById('lang');
    if (!langSelect) return;
    
    // If i18n system is not loaded, provide fallback functionality
    if (!window.FlowI18n) {
      try {
        var savedLang = localStorage.getItem('flow-language');
        if (savedLang) {
          langSelect.value = savedLang;
        }
      } catch (e) {
        // ignore storage errors
      }
      
      // Listen for changes (will be overridden by i18n system if it loads)
      langSelect.addEventListener('change', function(e) {
        var newLang = e.target.value;
        var text = e.target.options[e.target.selectedIndex].text;
        toast.show('Language switched to ' + text, 'success', 3000);
        // Persist selection
        try {
          localStorage.setItem('flow-language', newLang);
        } catch (e2) {
          // ignore storage errors
        }
      });
    }
  }

  /**
   * Display offline/online notifications to the user using the toast
   * system when connectivity changes.
   */
  function initConnectionStatus() {
    // Show initial state if offline
    if (!navigator.onLine) {
      var offlineMsg = window.FlowI18n ? 
        window.FlowI18n.t('msg.offline') : 
        'Working offline - changes will sync when reconnected';
      toast.show(offlineMsg, 'info', 5000);
    }
    // Listen for online/offline events
    window.addEventListener('online', function() {
      var onlineMsg = window.FlowI18n ? 
        window.FlowI18n.t('msg.online') : 
        'Connection restored';
      toast.show(onlineMsg, 'success', 3000);
    });
    window.addEventListener('offline', function() {
      var offlineMsg = window.FlowI18n ? 
        window.FlowI18n.t('msg.offline') : 
        'Working offline - changes will sync when reconnected';
      toast.show(offlineMsg, 'info', 5000);
    });
  }

  /**
   * Enhance all same-page anchor links with smooth scrolling. Prevents default
   * jump behaviour and scrolls to the section smoothly.
   */
  function initSmoothScrolling() {
    var links = document.querySelectorAll('a[href^="#"]');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function(e) {
        var href = this.getAttribute('href');
        if (href && href !== '#') {
          var target = document.querySelector(href);
          if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      });
    }
  }

  // Kick off all enhancements when the DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initLanguageSwitcher();
    initConnectionStatus();
    initSmoothScrolling();
    
    // Update translations after other systems are initialized (if i18n system is loaded)
    setTimeout(function() {
      if (window.FlowI18n) {
        window.FlowI18n.updateTranslations();
      }
    }, 100);
  });

  // Expose toast globally so i18n system can use it
  window.toast = toast;
})();


// -----------------------------------------------------------------------------
// Visual / 3D enhancements + safe fallbacks (no changes to existing features)
// -----------------------------------------------------------------------------
(function(){
  'use strict';

  var qs = (window.flowHelpers && window.flowHelpers.qs) || function(sel, ctx){ return (ctx||document).querySelector(sel); };
  var qsa = (window.flowHelpers && window.flowHelpers.qsa) || function(sel, ctx){ return Array.prototype.slice.call((ctx||document).querySelectorAll(sel)); };

  // 1) AOS init with graceful fallback so content is visible even if AOS is absent
  function initAOSWithFallback() {
    var html = document.documentElement;
    if (window.AOS && typeof window.AOS.init === 'function') {
      html.classList.add('aos-enabled');
      window.AOS.init({
        once: true,
        duration: 600,
        easing: 'ease-out',
        offset: 100
      });
      return;
    }
    // Fallback: ensure [data-aos] elements are visible
    qsa('[data-aos]').forEach(function(el){
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.style.transition = 'none';
    });
  }

  // 2) Background particle canvas (lightweight, respects reduced motion)
  function initParticles() {
    var canvas = /** @type {HTMLCanvasElement|null} */(qs('#particleCanvas'));
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    var reduce = mediaQuery.matches;

    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    var particles = [];
    var width = 0, height = 0, running = true;

    function rand(min, max){ return Math.random() * (max - min) + min; }

    function resize(){
      width = canvas.clientWidth || window.innerWidth;
      height = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.floor(width * DPR);
      canvas.height = Math.floor(height * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    function spawn(count){
      particles.length = 0;
      for (var i=0; i<count; i++){
        particles.push({
          x: rand(0, width),
          y: rand(0, height),
          vx: rand(-0.2, 0.2),
          vy: rand(-0.15, 0.15),
          r: rand(0.6, 1.8),
          a: rand(0.05, 0.2)
        });
      }
    }

    function step(){
      if (!running) return;
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';
      for (var i=0; i<particles.length; i++){
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 8);
        g.addColorStop(0, 'rgba(150,150,255,' + p.a + ')');
        g.addColorStop(1, 'rgba(150,150,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 8, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(step);
    }

    // Respect reduced motion
    function start(){
      resize();
      spawn(reduce ? 25 : 70);
      running = !reduce;
      if (running) step();
      // Keep canvas non-interactive and behind content
      var bg = qs('.bg-animation');
      if (bg) {
        bg.style.pointerEvents = 'none';
      }
      canvas.style.pointerEvents = 'none';
    }

    window.addEventListener('resize', function(){
      resize();
      // re-spawn to fill new space
      spawn(reduce ? 25 : 70);
    });

    mediaQuery.addEventListener && mediaQuery.addEventListener('change', function(e){
      reduce = e.matches;
      if (reduce) {
        running = false;
      } else {
        running = true;
        step();
      }
    });

    start();
  }

  // 3) 3D tilt for interactive cards
  function initCardTilt() {
    var cards = qsa('.card--interactive');
    if (!cards.length) return;

    var maxTilt = 8;      // degrees
    var perspective = 800; // px

    cards.forEach(function(card){
      var inner = qs('.card__inner', card) || card;
      var glow = qs('.card__glow', card);

      function onMove(e){
        var rect = card.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width;
        var py = (e.clientY - rect.top) / rect.height;
        var rx = (py - 0.5) * -2 * maxTilt;
        var ry = (px - 0.5) *  2 * maxTilt;

        inner.style.transform = 'perspective(' + perspective + 'px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translateZ(0)';
        if (glow) {
          glow.style.transform = 'scaleX(' + (0.9 + px * 0.2) + ')';
          glow.style.opacity = '1';
        }
      }

      function onLeave(){
        inner.style.transform = 'perspective(' + perspective + 'px) rotateX(0deg) rotateY(0deg) translateZ(0)';
        if (glow) {
          glow.style.transform = 'scaleX(0)';
          glow.style.opacity = '';
        }
      }

      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', onLeave);
      // touch: small press animation
      card.addEventListener('touchstart', function(){ inner.style.transform = 'scale(0.98)'; }, {passive:true});
      card.addEventListener('touchend', function(){ inner.style.transform = ''; }, {passive:true});
    });
  }

  // 4) Subtle parallax for hero media / grid
  function initHeroParallax() {
    var wrap = qs('.hero__media-wrapper');
    var content = qs('.hero__content');
    var grid = qs('.hero__bg-grid');
    if (!wrap && !content && !grid) return;

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    // mouse parallax
    document.addEventListener('mousemove', function(e){
      var cx = window.innerWidth / 2;
      var cy = window.innerHeight / 2;
      var dx = (e.clientX - cx) / cx; // -1..1
      var dy = (e.clientY - cy) / cy; // -1..1

      if (wrap) wrap.style.transform = 'translate3d(' + (dx * 12) + 'px,' + (dy * 10) + 'px,0)';
      if (content) content.style.transform = 'translate3d(' + (dx * -6) + 'px,' + (dy * -5) + 'px,0)';
    });

    // scroll parallax
    window.addEventListener('scroll', function(){
      var y = window.scrollY || 0;
      if (grid) grid.style.transform = 'translateY(' + (y * 0.08) + 'px)';
      if (wrap) wrap.style.transform += ' translateY(' + (y * 0.04) + 'px)';
    }, {passive:true});
  }

  // 5) Sticky header subtle blur on scroll (keeps existing header styles)
  function initHeaderEffects() {
    var header = qs('.header');
    if (!header) return;
    var last = 0;

    window.addEventListener('scroll', function(){
      var y = window.scrollY || 0;
      var scrolled = y > 8;
      header.classList.toggle('header--scrolled', scrolled);
      // Hide-on-scroll-down / show-on-scroll-up (subtle)
      header.classList.toggle('header--hide', y > last && y > 140);
      last = y;
    }, {passive:true});
  }

  // Initialize visuals after DOM is ready (keeps existing features untouched)
  document.addEventListener('DOMContentLoaded', function(){
    initAOSWithFallback();
    initParticles();
    initCardTilt();
    initHeroParallax();
    initHeaderEffects();
    initPortalNavigation();
    initPortalSignupButtons();

    // Ensure background wrapper can't capture events
    var bg = qs('.bg-animation');
    if (bg) bg.style.pointerEvents = 'none';
  });

  // Portal Navigation: Smooth scroll to portal sections when nav links are clicked
  function initPortalNavigation() {
    var navLinks = qsa('.nav__link');
    
    navLinks.forEach(function(link) {
      var href = link.getAttribute('href');
      
      // Check if this is a portal navigation link (#students, #institutions, etc.)
      if (href && href.startsWith('#') && href.length > 1) {
        var sectionId = href.substring(1); // Remove the #
        var portalSection = qs('#' + sectionId + '.portal-section');
        
        if (portalSection) {
          link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Smooth scroll to the portal section
            portalSection.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start' 
            });
            
            // Add a subtle highlight effect
            portalSection.style.background = 'linear-gradient(135deg, rgba(90, 91, 184, 0.1) 0%, rgba(20, 20, 35, 0.4) 100%)';
            setTimeout(function() {
              portalSection.style.background = '';
            }, 2000);
          });
        }
      }
    });
  }

  // Portal Signup Buttons: Open signup modal with pre-selected account type
  function initPortalSignupButtons() {
    var signupButtons = qsa('.portal-signup');
    console.log('Found portal signup buttons:', signupButtons.length);
    
    // Use the global openModal function
    var openModal = window.flowHelpers ? window.flowHelpers.openModal : function(id) {
      console.log('Fallback openModal called with:', id);
      var modal = document.getElementById(id);
      if (modal) {
        modal.removeAttribute('aria-hidden');
        modal.classList.add('is-open');
        document.body.style.overflow = 'hidden';
      }
    };
    
    signupButtons.forEach(function(button) {
      var portalType = button.getAttribute('data-portal');
      console.log('Setting up button for portal type:', portalType);
      
      if (portalType) {
        button.addEventListener('click', function(e) {
          e.preventDefault();
          console.log('Portal signup button clicked for:', portalType);
          
          // Open the signup modal
          openModal('signupModal');
          
          // Pre-select the appropriate account type
          setTimeout(function() {
            var radioButton = qs('input[name="acctType"][value="' + portalType + '"]');
            console.log('Looking for radio button with value:', portalType, 'Found:', radioButton);
            
            if (radioButton) {
              radioButton.checked = true;
              
              // Add visual feedback
              var label = radioButton.closest('.choice__label');
              if (label) {
                label.style.borderColor = 'rgba(90, 91, 184, 0.6)';
                label.style.background = 'rgba(90, 91, 184, 0.1)';
              }
              
              console.log('Successfully pre-selected:', portalType);
            } else {
              console.log('Radio button not found for:', portalType);
            }
          }, 100);
        });
      }
    });
  }

  // Authentication Integration Functions
  function initAuthIntegration() {
    console.log('🔗 Initializing auth integration...');
    
    // Wait for FlowAuth to be available
    if (window.FlowAuth) {
      setupAuthListeners();
    } else {
      // Retry after a short delay
      setTimeout(() => {
        if (window.FlowAuth) {
          setupAuthListeners();
        }
      }, 500);
    }
  }

  function setupAuthListeners() {
    // Listen for auth state changes
    window.FlowAuth.on('authStateChanged', function(authState) {
      if (authState.isAuthenticated) {
        console.log('✅ User authenticated:', authState.user.email);
        handleAuthenticatedUser(authState.user);
      } else {
        console.log('🔓 User not authenticated');
        handleUnauthenticatedUser();
      }
    });
    
    // Setup login form if it exists
    setupLoginForm();
    
    // Setup registration form if it exists
    setupRegistrationForm();
  }

  function setupLoginForm() {
    // This would be implemented when you have a dedicated login form
    // For now, the login happens through the existing modal system
    console.log('📝 Login form setup placeholder');
  }

  function setupRegistrationForm() {
    // This would be implemented when you have a dedicated registration form
    // For now, the registration happens through the account type selection
    console.log('📝 Registration form setup placeholder');
  }

  function showRegistrationForm(accountType) {
    // Close the current modal
    closeModal('signupModal');
    
    // For now, create a simple registration modal
    createRegistrationModal(accountType);
  }

  function createRegistrationModal(accountType) {
    // Create registration modal HTML
    var modalHTML = `
      <div class="modal" id="registrationModal" aria-hidden="true" role="dialog" aria-labelledby="registrationTitle">
        <div class="modal__overlay">
          <div class="modal__dialog">
            <header class="modal__header">
              <h2 class="modal__title" id="registrationTitle">Create Your ${accountType.charAt(0).toUpperCase() + accountType.slice(1)} Account</h2>
              <button type="button" class="modal__close" data-close="registrationModal" aria-label="Close registration modal">×</button>
            </header>
            
            <div class="modal__content">
              <div class="auth-loading" style="display: none;">
                <div class="spinner"></div>
                <span class="auth-loading__message">Creating account...</span>
              </div>
              
              <form id="registrationForm" class="form">
                <div class="form__group">
                  <label for="regEmail" class="form__label">Email Address</label>
                  <input type="email" id="regEmail" name="email" class="form__input" required>
                </div>
                
                <div class="form__group">
                  <label for="regFirstName" class="form__label">First Name</label>
                  <input type="text" id="regFirstName" name="firstName" class="form__input" required>
                </div>
                
                <div class="form__group">
                  <label for="regLastName" class="form__label">Last Name</label>
                  <input type="text" id="regLastName" name="lastName" class="form__input" required>
                </div>
                
                <div class="form__group">
                  <label for="regPassword" class="form__label">Password</label>
                  <input type="password" id="regPassword" name="password" class="form__input" required>
                  <small class="form__help">Must contain at least 8 characters with uppercase, lowercase, number, and special character</small>
                </div>
                
                <div class="form__group">
                  <label for="regPasswordConfirm" class="form__label">Confirm Password</label>
                  <input type="password" id="regPasswordConfirm" name="passwordConfirm" class="form__input" required>
                </div>
                
                <input type="hidden" name="accountType" value="${accountType}">
              </form>
            </div>
            
            <footer class="modal__footer">
              <button type="button" class="btn btn--ghost" data-close="registrationModal">Cancel</button>
              <button type="submit" form="registrationForm" class="btn btn--primary">Create Account</button>
            </footer>
          </div>
        </div>
      </div>
    `;
    
    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Setup modal functionality
    var modal = document.getElementById('registrationModal');
    var form = document.getElementById('registrationForm');
    
    // Setup close handlers
    modal.querySelector('[data-close]').addEventListener('click', function() {
      closeModal('registrationModal');
      document.body.removeChild(modal);
    });
    
    modal.querySelector('.modal__overlay').addEventListener('click', function() {
      closeModal('registrationModal');
      document.body.removeChild(modal);
    });
    
    // Setup form submission
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      handleRegistration(new FormData(form), modal);
    });
    
    // Open modal
    openModal('registrationModal');
  }

  function handleRegistration(formData, modal) {
    if (!window.FlowAuth) {
      console.error('❌ FlowAuth not available');
      return;
    }
    
    // Validate passwords match
    const password = formData.get('password');
    const passwordConfirm = formData.get('passwordConfirm');
    
    if (password !== passwordConfirm) {
      showAuthError('Passwords do not match');
      return;
    }
    
    // Validate password strength
    const passwordValidation = window.FlowAuth.validatePassword(password);
    if (!passwordValidation.isValid) {
      showAuthError(passwordValidation.errors.join('<br>'));
      return;
    }
    
    // Validate email
    const email = formData.get('email');
    if (!window.FlowAuth.validateEmail(email)) {
      showAuthError('Please enter a valid email address');
      return;
    }
    
    // Prepare registration data
    const registrationData = {
      email: email,
      password: password,
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      accountType: formData.get('accountType')
    };
    
    // Attempt registration
    window.FlowAuth.register(registrationData).then(function(result) {
      if (result.success) {
        console.log('✅ Registration successful');
        
        // Close modal
        closeModal('registrationModal');
        document.body.removeChild(modal);
        
        // Show success message
        if (window.toast) {
          window.toast.show('Account created successfully! Welcome to Flow.', 'success', 5000);
        }
        
        // Redirect to dashboard
        window.FlowAuth.redirectAfterLogin();
      } else {
        console.error('❌ Registration failed:', result.error);
        showAuthError(result.error);
      }
    });
  }

  function handleAuthenticatedUser(user) {
    // Hide auth-related elements
    var signUpBtns = document.querySelectorAll('[data-open="signupModal"]');
    var loginBtns = document.querySelectorAll('[data-open="loginPortalsModal"]');
    
    signUpBtns.forEach(function(btn) {
      btn.style.display = 'none';
    });
    
    loginBtns.forEach(function(btn) {
      btn.textContent = 'Dashboard';
      btn.onclick = function() {
        window.FlowAuth.redirectAfterLogin();
      };
    });
    
    // Show user info if there's a placeholder
    var userInfo = document.querySelector('.user-info');
    if (userInfo) {
      userInfo.innerHTML = '<span>Welcome, ' + user.fullName + '</span>';
      userInfo.style.display = 'block';
    }
  }

  function handleUnauthenticatedUser() {
    // Show auth-related elements
    var signUpBtns = document.querySelectorAll('[data-open="signupModal"]');
    var loginBtns = document.querySelectorAll('[data-open="loginPortalsModal"]');
    
    signUpBtns.forEach(function(btn) {
      btn.style.display = '';
    });
    
    loginBtns.forEach(function(btn) {
      btn.textContent = 'Sign In';
      btn.onclick = null;
    });
    
    // Hide user info
    var userInfo = document.querySelector('.user-info');
    if (userInfo) {
      userInfo.style.display = 'none';
    }
  }

  function showAuthError(message) {
    if (window.toast) {
      window.toast.show(message, 'error', 5000);
    } else {
      alert('Error: ' + message);
    }
  }

  // Initialize language selector
  function initLanguageSelector() {
    // Simple language selector since i18n.js handles translation automatically
    const mainSelector = document.getElementById('mainLanguageSelector');
    if (mainSelector) {
      mainSelector.innerHTML = `
        <select id="lang" class="language-select">
          <option value="en">🇺🇸 English</option>
          <option value="fr">🇫🇷 Français</option>
          <option value="ar">🇸🇦 العربية</option>
          <option value="sw">🇹🇿 Kiswahili</option>
        </select>
      `;
    }
    
    // Set the current language in the selector and ensure it's properly initialized
    if (window.FlowI18n) {
      const currentLang = window.FlowI18n.getCurrentLanguage();
      const selector = document.getElementById('lang');
      if (selector) {
        selector.value = currentLang;
        
        // Add manual event listener as backup
        selector.addEventListener('change', function(e) {
          console.log('Language changed to:', e.target.value);
          window.FlowI18n.setLanguage(e.target.value);
        });
      }
      
      window.FlowI18n.updateTranslations();
    }
  }

  // Initialize language selector when DOM is ready and i18n system is loaded
  function waitForI18nAndInit() {
    if (window.FlowI18n) {
      initLanguageSelector();
    } else {
      // Wait a bit more for i18n.js to load
      setTimeout(waitForI18nAndInit, 100);
    }
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForI18nAndInit);
  } else {
    waitForI18nAndInit();
  }
})();

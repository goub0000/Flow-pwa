/* Institution Portal JavaScript */
/* Clean, professional functionality for educational institutions */

(function(){
  'use strict';
  
  // TEMPORARILY DISABLED Authentication Guard for testing
  // if (!window.FlowAuthGuards) {
  //   console.error('❌ Auth system required for institutions portal');
  //   document.body.innerHTML = '<div style="padding: 2rem; text-align: center; font-family: Arial, sans-serif;"><h1>🔒 Institutions Portal</h1><p>Please log in to access the institutions portal.</p><a href="/" style="color: #5a5bb8;">Return to Home</a></div>';
  //   return;
  // }

  // window.FlowAuthGuards.institutionGuard(function(user) {
  //   console.log('✅ Institution access granted:', user.fullName || user.profile?.institutionName);
  //   initInstitutionsPortal();
  // });

  // Skip auth for testing and initialize directly
  console.log('🚧 Testing mode - bypassing authentication');
  initInstitutionsPortal();

  function initInstitutionsPortal() {
    const $  = (s, c=document) => c.querySelector(s);
    const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));

    // Simple localStorage wrapper
    const store = {
      get(k, d=null) { try { const v=localStorage.getItem(k); return v?JSON.parse(v):d; } catch(_) { return d; } },
      set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch(_) {} }
    };

    // Connection status
    const conn = {
      ind: $('.connection-status__indicator'),
      txt: $('.connection-status__text'),
      online: navigator.onLine,
      update() { 
        if (this.ind && this.txt) { 
          this.ind.classList.toggle('connection-status__indicator--offline', !this.online); 
          this.txt.textContent = this.online ? 'Online' : 'Offline'; 
        } 
      }
    };
    
    window.addEventListener('online', () => { 
      conn.online = true; 
      conn.update(); 
      showToast('Connection restored', 'success'); 
    });
    
    window.addEventListener('offline', () => { 
      conn.online = false; 
      conn.update(); 
      showToast('Working offline', 'info'); 
    });
    
    conn.update();

    // Toast notifications
    function showToast(message, type = 'info', duration = 3000) {
      const container = $('#toast-container');
      if (!container) return;
      
      const toast = document.createElement('div');
      toast.className = `toast toast--${type}`;
      toast.innerHTML = `
        <div class="toast__content">
          <span class="toast__message">${message}</span>
          <button class="toast__close" aria-label="Close">×</button>
        </div>
      `;
      
      container.appendChild(toast);
      
      // Animate in
      requestAnimationFrame(() => {
        toast.classList.add('toast--visible');
      });
      
      // Close functionality
      const close = () => {
        toast.classList.remove('toast--visible');
        setTimeout(() => toast.remove(), 300);
      };
      
      toast.querySelector('.toast__close').addEventListener('click', close);
      
      if (duration > 0) {
        setTimeout(close, duration);
      }
    }

    // Header navigation
    const navToggle = $('.nav__toggle');
    const navList = $('#navMenu');
    
    if (navToggle && navList) {
      navToggle.addEventListener('click', () => {
        const isOpen = navList.getAttribute('data-open') === 'true';
        navList.setAttribute('data-open', !isOpen);
        navToggle.setAttribute('aria-expanded', !isOpen);
        document.body.style.overflow = isOpen ? '' : 'hidden';
      });
      
      // Close nav on link click (mobile)
      $$('#navMenu a').forEach(link => {
        link.addEventListener('click', () => {
          if (window.innerWidth < 940) {
            navList.setAttribute('data-open', 'false');
            navToggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
          }
        });
      });
    }

    // Language selector
    const langSelect = $('#lang');
    if (langSelect) {
      const savedLang = store.get('flow.lang') || 'en';
      langSelect.value = savedLang;
      
      langSelect.addEventListener('change', (e) => {
        const lang = e.target.value;
        store.set('flow.lang', lang);
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        showToast(`Language switched to ${langSelect.options[langSelect.selectedIndex].text}`, 'success');
      });
    }

    // Subnav active states
    function updateSubnav() {
      const hash = location.hash || '#dashboard';
      $$('.subnav__link').forEach(link => {
        link.classList.toggle('subnav__link--active', link.getAttribute('href') === hash);
      });
      
      if (hash === '#settings') {
        openSettings();
      }
    }
    
    window.addEventListener('hashchange', updateSubnav);
    updateSubnav();

    // Applicants data
    const applicantsData = [
      {
        id: 1,
        name: 'Sarah Johnson',
        email: 'sarah.johnson@email.com',
        program: 'Computer Science, Master\'s',
        applicationDate: '2024-08-15',
        status: 'new',
        score: 85
      },
      {
        id: 2,
        name: 'Michael Chen',
        email: 'michael.chen@email.com',
        program: 'Business Administration, MBA',
        applicationDate: '2024-08-12',
        status: 'review',
        score: 92
      },
      {
        id: 3,
        name: 'Emily Rodriguez',
        email: 'emily.rodriguez@email.com',
        program: 'Medicine, Doctor of Medicine',
        applicationDate: '2024-08-10',
        status: 'interview',
        score: 88
      },
      {
        id: 4,
        name: 'James Wilson',
        email: 'james.wilson@email.com',
        program: 'Engineering, Bachelor\'s',
        applicationDate: '2024-08-08',
        status: 'accepted',
        score: 94
      },
      {
        id: 5,
        name: 'Anna Thompson',
        email: 'anna.thompson@email.com',
        program: 'Psychology, Master\'s',
        applicationDate: '2024-08-05',
        status: 'rejected',
        score: 76
      }
    ];

    let filteredApplicants = [...applicantsData];
    let selectedApplicants = new Set();

    // Render applicants table
    function renderApplicantsTable() {
      const tbody = $('#applicantsTableBody');
      if (!tbody) return;

      if (filteredApplicants.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
              No applicants found
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = filteredApplicants.map(applicant => `
        <tr>
          <td>
            <input type="checkbox" ${selectedApplicants.has(applicant.id) ? 'checked' : ''} 
                   onchange="toggleApplicantSelection(${applicant.id})">
          </td>
          <td>
            <div class="applicant-info">
              <div class="applicant-avatar">${applicant.name.split(' ').map(n => n[0]).join('')}</div>
              <div>
                <div class="applicant-name">${applicant.name}</div>
                <div class="applicant-email">${applicant.email}</div>
              </div>
            </div>
          </td>
          <td>${applicant.program}</td>
          <td>${new Date(applicant.applicationDate).toLocaleDateString()}</td>
          <td>
            <span class="application-item__status application-item__status--${applicant.status}">
              ${applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
            </span>
          </td>
          <td>${applicant.score}%</td>
          <td>
            <button class="btn btn--ghost btn--sm" onclick="viewApplicant(${applicant.id})">View</button>
            <button class="btn btn--ghost btn--sm" onclick="editApplicant(${applicant.id})">Edit</button>
          </td>
        </tr>
      `).join('');

      updateBulkActions();
    }

    // Toggle applicant selection
    window.toggleApplicantSelection = function(id) {
      if (selectedApplicants.has(id)) {
        selectedApplicants.delete(id);
      } else {
        selectedApplicants.add(id);
      }
      renderApplicantsTable();
    };

    // Update bulk actions
    function updateBulkActions() {
      const bulkActions = $('#bulkActions');
      const bulkCount = $('.bulk-actions__count');
      
      if (bulkActions) {
        bulkActions.style.display = selectedApplicants.size > 0 ? 'flex' : 'none';
      }
      
      if (bulkCount) {
        bulkCount.textContent = `${selectedApplicants.size} selected`;
      }

      // Update select all checkbox
      const selectAll = $('#selectAll');
      if (selectAll) {
        const totalItems = filteredApplicants.length;
        const selectedCount = selectedApplicants.size;
        
        selectAll.checked = selectedCount === totalItems && totalItems > 0;
        selectAll.indeterminate = selectedCount > 0 && selectedCount < totalItems;
      }
    }

    // Select all functionality
    const selectAll = $('#selectAll');
    if (selectAll) {
      selectAll.addEventListener('change', function() {
        if (this.checked) {
          filteredApplicants.forEach(applicant => selectedApplicants.add(applicant.id));
        } else {
          selectedApplicants.clear();
        }
        renderApplicantsTable();
      });
    }

    // Filter functionality
    function applyFilters() {
      const statusFilter = $('#statusFilter')?.value || '';
      const programFilter = $('#programFilter')?.value || '';
      const searchFilter = $('#searchFilter')?.value?.toLowerCase() || '';

      filteredApplicants = applicantsData.filter(applicant => {
        if (statusFilter && applicant.status !== statusFilter) return false;
        if (programFilter && !applicant.program.toLowerCase().includes(programFilter)) return false;
        if (searchFilter && !applicant.name.toLowerCase().includes(searchFilter) && 
            !applicant.email.toLowerCase().includes(searchFilter)) return false;
        return true;
      });

      selectedApplicants.clear();
      renderApplicantsTable();
    }

    // Filter event listeners
    $('#statusFilter')?.addEventListener('change', applyFilters);
    $('#programFilter')?.addEventListener('change', applyFilters);
    $('#searchFilter')?.addEventListener('input', applyFilters);

    // View/Edit applicant functions
    window.viewApplicant = function(id) {
      const applicant = applicantsData.find(a => a.id === id);
      if (applicant) {
        showToast(`Viewing ${applicant.name}`, 'info');
      }
    };

    window.editApplicant = function(id) {
      const applicant = applicantsData.find(a => a.id === id);
      if (applicant) {
        showToast(`Editing ${applicant.name}`, 'info');
      }
    };

    // Settings functionality
    const settingsOverlay = $('#settingsOverlay');
    const floatingSettingsBtn = $('#floatingSettingsBtn');
    const settingsCloseBtn = $('.settings-modal__close');

    function openSettings() {
      if (settingsOverlay) {
        settingsOverlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
      }
    }

    function closeSettings() {
      if (settingsOverlay) {
        settingsOverlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }
      
      // Reset hash if on settings
      if (location.hash === '#settings') {
        history.pushState(null, null, '#dashboard');
        updateSubnav();
      }
    }

    // Settings event listeners
    if (floatingSettingsBtn) {
      floatingSettingsBtn.addEventListener('click', openSettings);
    }

    if (settingsCloseBtn) {
      settingsCloseBtn.addEventListener('click', closeSettings);
    }

    // Close settings on overlay click
    if (settingsOverlay) {
      settingsOverlay.addEventListener('click', (e) => {
        if (e.target === settingsOverlay) {
          closeSettings();
        }
      });
    }

    // Close settings on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && settingsOverlay?.getAttribute('aria-hidden') === 'false') {
        closeSettings();
      }
    });

    // Save settings
    $('#saveSettings')?.addEventListener('click', () => {
      // Collect all settings
      const settings = {
        // Appearance
        theme: $('#themeSelect')?.value || 'auto',
        density: $('#densitySelect')?.value || 'comfortable',
        fontSize: $('#fontSizeSelect')?.value || 'medium',
        
        // Notifications
        emailNotifications: $('#emailNotifications')?.checked || false,
        pushNotifications: $('#pushNotifications')?.checked || false,
        smsNotifications: $('#smsNotifications')?.checked || false,
        soundAlerts: $('#soundAlerts')?.checked || false,
        notificationFrequency: $('#notificationFrequency')?.value || 'daily',
        
        // Institution Profile
        institutionName: $('#institutionName')?.value || '',
        institutionType: $('#institutionType')?.value || 'university',
        contactEmail: $('#contactEmail')?.value || '',
        timeZone: $('#timeZone')?.value || 'UTC-5',
        
        // Application Management
        autoAssignReviewers: $('#autoAssignReviewers')?.checked || false,
        allowUploads: $('#allowUploads')?.checked || false,
        bulkActions: $('#bulkActions')?.checked || false,
        applicationsPerPage: $('#applicationsPerPage')?.value || '25',
        defaultStatus: $('#defaultStatus')?.value || 'pending',
        
        // Security
        twoFactorAuth: $('#twoFactorAuth')?.checked || false,
        auditLogging: $('#auditLogging')?.checked || false,
        ipWhitelisting: $('#ipWhitelisting')?.checked || false,
        sessionTimeout: $('#sessionTimeout')?.value || '60',
        passwordPolicy: $('#passwordPolicy')?.value || 'standard',
        
        // Data & Backup
        autoSave: $('#autoSave')?.checked || false,
        autoBackup: $('#autoBackup')?.checked || false,
        dataCompression: $('#dataCompression')?.checked || false,
        backupFrequency: $('#backupFrequency')?.value || 'daily',
        dataRetention: $('#dataRetention')?.value || '2'
      };

      // Save to localStorage
      Object.entries(settings).forEach(([key, value]) => {
        store.set(`institution_${key}`, value);
      });

      // Apply theme immediately
      applyTheme(settings.theme);
      applyDensity(settings.density);
      applyFontSize(settings.fontSize);

      closeSettings();
      showToast('Settings saved successfully! 🎉', 'success');
    });

    // Cancel settings
    $('#cancelSettings')?.addEventListener('click', closeSettings);

    // Reset settings
    $('#resetSettings')?.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
        // Clear all settings from localStorage
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('institution_')) {
            localStorage.removeItem(key);
          }
        });

        // Reset form values to defaults
        if ($('#themeSelect')) $('#themeSelect').value = 'auto';
        if ($('#densitySelect')) $('#densitySelect').value = 'comfortable';
        if ($('#fontSizeSelect')) $('#fontSizeSelect').value = 'medium';
        if ($('#emailNotifications')) $('#emailNotifications').checked = true;
        if ($('#pushNotifications')) $('#pushNotifications').checked = false;
        if ($('#smsNotifications')) $('#smsNotifications').checked = false;
        if ($('#soundAlerts')) $('#soundAlerts').checked = true;
        if ($('#notificationFrequency')) $('#notificationFrequency').value = 'daily';
        if ($('#institutionName')) $('#institutionName').value = 'University of Excellence';
        if ($('#institutionType')) $('#institutionType').value = 'university';
        if ($('#contactEmail')) $('#contactEmail').value = 'admin@universityexcellence.edu';
        if ($('#timeZone')) $('#timeZone').value = 'UTC-5';
        if ($('#autoAssignReviewers')) $('#autoAssignReviewers').checked = true;
        if ($('#allowUploads')) $('#allowUploads').checked = true;
        if ($('#bulkActions')) $('#bulkActions').checked = true;
        if ($('#applicationsPerPage')) $('#applicationsPerPage').value = '25';
        if ($('#defaultStatus')) $('#defaultStatus').value = 'pending';
        if ($('#twoFactorAuth')) $('#twoFactorAuth').checked = false;
        if ($('#auditLogging')) $('#auditLogging').checked = true;
        if ($('#ipWhitelisting')) $('#ipWhitelisting').checked = false;
        if ($('#sessionTimeout')) $('#sessionTimeout').value = '60';
        if ($('#passwordPolicy')) $('#passwordPolicy').value = 'standard';
        if ($('#autoSave')) $('#autoSave').checked = true;
        if ($('#autoBackup')) $('#autoBackup').checked = true;
        if ($('#dataCompression')) $('#dataCompression').checked = false;
        if ($('#backupFrequency')) $('#backupFrequency').value = 'daily';
        if ($('#dataRetention')) $('#dataRetention').value = '2';

        // Apply default theme
        applyTheme('auto');
        applyDensity('comfortable');
        applyFontSize('medium');

        showToast('Settings reset to defaults! 🔄', 'success');
      }
    });

    // Theme application functions
    function applyTheme(theme) {
      const html = document.documentElement;
      html.removeAttribute('data-theme');
      if (theme !== 'auto') {
        html.setAttribute('data-theme', theme);
      }
    }

    function applyDensity(density) {
      const html = document.documentElement;
      html.setAttribute('data-density', density);
    }

    function applyFontSize(fontSize) {
      const html = document.documentElement;
      html.setAttribute('data-font-size', fontSize);
    }

    // Load saved settings on initialization
    function loadSettings() {
      const savedSettings = {};
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('institution_')) {
          const settingKey = key.replace('institution_', '');
          savedSettings[settingKey] = store.get(key);
        }
      });

      // Apply saved values to form elements
      if (savedSettings.theme && $('#themeSelect')) $('#themeSelect').value = savedSettings.theme;
      if (savedSettings.density && $('#densitySelect')) $('#densitySelect').value = savedSettings.density;
      if (savedSettings.fontSize && $('#fontSizeSelect')) $('#fontSizeSelect').value = savedSettings.fontSize;
      if (savedSettings.emailNotifications !== undefined && $('#emailNotifications')) $('#emailNotifications').checked = savedSettings.emailNotifications;
      if (savedSettings.pushNotifications !== undefined && $('#pushNotifications')) $('#pushNotifications').checked = savedSettings.pushNotifications;
      if (savedSettings.smsNotifications !== undefined && $('#smsNotifications')) $('#smsNotifications').checked = savedSettings.smsNotifications;
      if (savedSettings.soundAlerts !== undefined && $('#soundAlerts')) $('#soundAlerts').checked = savedSettings.soundAlerts;
      if (savedSettings.notificationFrequency && $('#notificationFrequency')) $('#notificationFrequency').value = savedSettings.notificationFrequency;
      if (savedSettings.institutionName && $('#institutionName')) $('#institutionName').value = savedSettings.institutionName;
      if (savedSettings.institutionType && $('#institutionType')) $('#institutionType').value = savedSettings.institutionType;
      if (savedSettings.contactEmail && $('#contactEmail')) $('#contactEmail').value = savedSettings.contactEmail;
      if (savedSettings.timeZone && $('#timeZone')) $('#timeZone').value = savedSettings.timeZone;
      if (savedSettings.autoAssignReviewers !== undefined && $('#autoAssignReviewers')) $('#autoAssignReviewers').checked = savedSettings.autoAssignReviewers;
      if (savedSettings.allowUploads !== undefined && $('#allowUploads')) $('#allowUploads').checked = savedSettings.allowUploads;
      if (savedSettings.bulkActions !== undefined && $('#bulkActions')) $('#bulkActions').checked = savedSettings.bulkActions;
      if (savedSettings.applicationsPerPage && $('#applicationsPerPage')) $('#applicationsPerPage').value = savedSettings.applicationsPerPage;
      if (savedSettings.defaultStatus && $('#defaultStatus')) $('#defaultStatus').value = savedSettings.defaultStatus;
      if (savedSettings.twoFactorAuth !== undefined && $('#twoFactorAuth')) $('#twoFactorAuth').checked = savedSettings.twoFactorAuth;
      if (savedSettings.auditLogging !== undefined && $('#auditLogging')) $('#auditLogging').checked = savedSettings.auditLogging;
      if (savedSettings.ipWhitelisting !== undefined && $('#ipWhitelisting')) $('#ipWhitelisting').checked = savedSettings.ipWhitelisting;
      if (savedSettings.sessionTimeout && $('#sessionTimeout')) $('#sessionTimeout').value = savedSettings.sessionTimeout;
      if (savedSettings.passwordPolicy && $('#passwordPolicy')) $('#passwordPolicy').value = savedSettings.passwordPolicy;
      if (savedSettings.autoSave !== undefined && $('#autoSave')) $('#autoSave').checked = savedSettings.autoSave;
      if (savedSettings.autoBackup !== undefined && $('#autoBackup')) $('#autoBackup').checked = savedSettings.autoBackup;
      if (savedSettings.dataCompression !== undefined && $('#dataCompression')) $('#dataCompression').checked = savedSettings.dataCompression;
      if (savedSettings.backupFrequency && $('#backupFrequency')) $('#backupFrequency').value = savedSettings.backupFrequency;
      if (savedSettings.dataRetention && $('#dataRetention')) $('#dataRetention').value = savedSettings.dataRetention;

      // Apply saved theme settings
      applyTheme(savedSettings.theme || 'auto');
      applyDensity(savedSettings.density || 'comfortable');
      applyFontSize(savedSettings.fontSize || 'medium');
    }

    // Action buttons functionality
    $$('.action-item').forEach(button => {
      button.addEventListener('click', function() {
        const text = this.textContent.trim();
        showToast(`${text} feature coming soon`, 'info');
      });
    });

    // Quick actions in dashboard cards
    $$('.dashboard-card__action').forEach(link => {
      link.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href.startsWith('#')) {
          e.preventDefault();
          location.hash = href;
        }
      });
    });

    // Initialize table
    renderApplicantsTable();

    // Load saved settings
    loadSettings();

    // Header dropdown functionality
    const headerDropdowns = {
      search: {
        trigger: $('#searchTrigger'),
        dropdown: $('#searchDropdown'),
        input: $('#globalSearch')
      },
      notifications: {
        trigger: $('#notificationsTrigger'),
        dropdown: $('#notificationsDropdown')
      },
      messages: {
        trigger: $('#messagesTrigger'),
        dropdown: $('#messagesDropdown')
      },
      profile: {
        trigger: $('#profileTrigger'),
        dropdown: $('#profileDropdown')
      }
    };

    // Mobile navigation overlay
    const mobileMenuToggle = $('#mobileMenuToggle');
    const navOverlay = $('#navOverlay');

    // Toggle dropdown function
    function toggleDropdown(dropdownName) {
      const dropdown = headerDropdowns[dropdownName];
      if (!dropdown || !dropdown.trigger || !dropdown.dropdown) return;

      const isOpen = dropdown.dropdown.getAttribute('aria-hidden') === 'false';
      
      // Close all dropdowns first
      Object.values(headerDropdowns).forEach(d => {
        if (d.dropdown && d.trigger) {
          d.dropdown.setAttribute('aria-hidden', 'true');
          d.trigger.setAttribute('aria-expanded', 'false');
        }
      });

      // Toggle current dropdown
      if (!isOpen) {
        dropdown.dropdown.setAttribute('aria-hidden', 'false');
        dropdown.trigger.setAttribute('aria-expanded', 'true');
        
        // Focus search input if search dropdown
        if (dropdownName === 'search' && dropdown.input) {
          setTimeout(() => dropdown.input.focus(), 100);
        }
      }
    }

    // Add event listeners for header dropdowns
    Object.entries(headerDropdowns).forEach(([name, dropdown]) => {
      if (dropdown.trigger) {
        dropdown.trigger.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleDropdown(name);
        });
      }
    });

    // Mobile menu toggle
    if (mobileMenuToggle && navOverlay) {
      mobileMenuToggle.addEventListener('click', (e) => {
        e.preventDefault();
        const isOpen = navOverlay.getAttribute('aria-hidden') === 'false';
        navOverlay.setAttribute('aria-hidden', !isOpen);
        mobileMenuToggle.setAttribute('aria-expanded', !isOpen);
        document.body.style.overflow = isOpen ? '' : 'hidden';
      });
    }

    // Search functionality
    if (headerDropdowns.search.input) {
      headerDropdowns.search.input.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const suggestions = $('#searchSuggestions');
        
        if (suggestions && query.length > 0) {
          const mockSuggestions = [
            'Applications for Computer Science',
            'Student Sarah Johnson',
            'MBA Program Requirements',
            'Application Status Update',
            'Institution Settings'
          ].filter(item => item.toLowerCase().includes(query));
          
          suggestions.innerHTML = mockSuggestions.map(item => 
            `<button class="search-suggestion" onclick="selectSearchSuggestion('${item}')">${item}</button>`
          ).join('');
        }
      });
    }

    // Search suggestion selection
    window.selectSearchSuggestion = function(suggestion) {
      if (headerDropdowns.search.input) {
        headerDropdowns.search.input.value = suggestion;
        toggleDropdown('search');
        showToast(`Searching for: ${suggestion}`, 'info');
      }
    };

    // Notification actions
    window.dismissNotification = function(notificationId) {
      const notification = $(`.notification-item[data-id="${notificationId}"]`);
      if (notification) {
        notification.style.opacity = '0';
        setTimeout(() => {
          notification.remove();
          updateNotificationBadge();
        }, 300);
      }
    };

    window.markAllNotificationsRead = function() {
      $$('.notification-item').forEach(item => {
        item.classList.remove('notification-item--unread');
      });
      updateNotificationBadge();
      showToast('All notifications marked as read', 'success');
    };

    // Message actions
    window.markMessageRead = function(messageId) {
      const message = $(`.message-item[data-id="${messageId}"]`);
      if (message) {
        message.classList.remove('message-item--unread');
        updateMessageBadge();
      }
    };

    window.composeMessage = function() {
      toggleDropdown('messages');
      showToast('Compose message feature coming soon', 'info');
    };

    // Update notification badge
    function updateNotificationBadge() {
      const badge = $('.header-notifications__badge');
      const unreadCount = $$('.notification-item--unread').length;
      
      if (badge) {
        if (unreadCount === 0) {
          badge.style.display = 'none';
        } else {
          badge.textContent = unreadCount;
          badge.style.display = 'block';
        }
      }
    }

    // Update message badge
    function updateMessageBadge() {
      const badge = $('.header-messages__badge');
      const unreadCount = $$('.message-item--unread').length;
      
      if (badge) {
        if (unreadCount === 0) {
          badge.style.display = 'none';
        } else {
          badge.textContent = unreadCount;
          badge.style.display = 'block';
        }
      }
    }

    // Profile actions
    window.signOut = function() {
      if (confirm('Are you sure you want to sign out?')) {
        showToast('Signing out...', 'info');
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      }
    };

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
      const isHeaderClick = e.target.closest('.header-tools');
      if (!isHeaderClick) {
        Object.values(headerDropdowns).forEach(dropdown => {
          if (dropdown.dropdown && dropdown.trigger) {
            dropdown.dropdown.setAttribute('aria-hidden', 'true');
            dropdown.trigger.setAttribute('aria-expanded', 'false');
          }
        });
      }
    });

    // Close mobile menu when clicking outside or on links
    document.addEventListener('click', (e) => {
      if (navOverlay && navOverlay.getAttribute('aria-hidden') === 'false') {
        const isNavClick = e.target.closest('#navOverlay .nav-overlay__content');
        const isToggleClick = e.target.closest('#mobileMenuToggle');
        
        if (!isNavClick && !isToggleClick) {
          navOverlay.setAttribute('aria-hidden', 'true');
          if (mobileMenuToggle) {
            mobileMenuToggle.setAttribute('aria-expanded', 'false');
          }
          document.body.style.overflow = '';
        }
      }
    });

    // Enhanced language switcher with flags
    const langSwitcher = $('.header-lang');
    if (langSwitcher) {
      const langTrigger = langSwitcher.querySelector('.header-lang__trigger');
      const langDropdown = langSwitcher.querySelector('.header-lang__dropdown');
      
      if (langTrigger && langDropdown) {
        langTrigger.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const isOpen = langDropdown.getAttribute('aria-hidden') === 'false';
          langDropdown.setAttribute('aria-hidden', !isOpen);
          langTrigger.setAttribute('aria-expanded', !isOpen);
        });

        // Language selection
        langDropdown.addEventListener('click', (e) => {
          if (e.target.closest('.lang-option')) {
            const option = e.target.closest('.lang-option');
            const langCode = option.getAttribute('data-lang');
            const langName = option.textContent.trim();
            
            // Update trigger text
            const triggerText = langTrigger.querySelector('.header-lang__text');
            if (triggerText) {
              triggerText.textContent = langCode.toUpperCase();
            }
            
            // Close dropdown
            langDropdown.setAttribute('aria-hidden', 'true');
            langTrigger.setAttribute('aria-expanded', 'false');
            
            // Save and apply language
            store.set('flow.lang', langCode);
            document.documentElement.lang = langCode;
            document.documentElement.dir = langCode === 'ar' ? 'rtl' : 'ltr';
            
            showToast(`Language switched to ${langName}`, 'success');
          }
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
          if (!e.target.closest('.header-lang')) {
            langDropdown.setAttribute('aria-hidden', 'true');
            langTrigger.setAttribute('aria-expanded', 'false');
          }
        });
      }
    }

    // Keyboard navigation for dropdowns
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // Close all dropdowns
        Object.values(headerDropdowns).forEach(dropdown => {
          if (dropdown.dropdown && dropdown.trigger) {
            dropdown.dropdown.setAttribute('aria-hidden', 'true');
            dropdown.trigger.setAttribute('aria-expanded', 'false');
          }
        });
        
        // Close mobile menu
        if (navOverlay && navOverlay.getAttribute('aria-hidden') === 'false') {
          navOverlay.setAttribute('aria-hidden', 'true');
          if (mobileMenuToggle) {
            mobileMenuToggle.setAttribute('aria-expanded', 'false');
          }
          document.body.style.overflow = '';
        }
      }
    });

    // Messaging functionality
    const messageRecipient = $('#messageRecipient');
    const individualRecipientField = $('#individualRecipientField');

    // Show/hide individual recipient field
    if (messageRecipient && individualRecipientField) {
      messageRecipient.addEventListener('change', (e) => {
        if (e.target.value === 'individual') {
          individualRecipientField.style.display = 'block';
        } else {
          individualRecipientField.style.display = 'none';
        }
      });
    }

    // Message functions
    window.sendMessage = function() {
      const recipient = $('#messageRecipient')?.value;
      const subject = $('#messageSubject')?.value;
      const content = $('#messageContent')?.value;

      if (!recipient || !subject || !content) {
        showToast('Please fill in all required fields', 'error');
        return;
      }

      // Simulate sending message
      showToast('Message sent successfully! 📧', 'success');
      
      // Clear form
      if ($('#messageRecipient')) $('#messageRecipient').value = '';
      if ($('#messageSubject')) $('#messageSubject').value = '';
      if ($('#messageContent')) $('#messageContent').value = '';
      if (individualRecipientField) individualRecipientField.style.display = 'none';
    };

    window.saveDraft = function() {
      const subject = $('#messageSubject')?.value || 'Untitled';
      showToast(`Draft saved: "${subject}" 💾`, 'info');
    };

    window.refreshConversations = function() {
      showToast('Conversations refreshed 🔄', 'info');
      
      // Simulate refresh with slight animation
      const conversationsList = $('#conversationsList');
      if (conversationsList) {
        conversationsList.style.opacity = '0.5';
        setTimeout(() => {
          conversationsList.style.opacity = '1';
        }, 300);
      }
    };

    window.openConversation = function(conversationId) {
      showToast(`Opening conversation ${conversationId} 💬`, 'info');
      
      // Mark conversation as read
      const conversation = $(`.conversation-item[onclick*="${conversationId}"]`);
      if (conversation) {
        conversation.classList.remove('conversation-item--unread');
        const status = conversation.querySelector('.conversation-status');
        if (status) {
          status.classList.remove('conversation-status--unread');
        }
      }
    };

    // Template functions
    window.useTemplate = function(templateType) {
      const templates = {
        welcome: {
          subject: 'Welcome to University of Excellence',
          content: 'Dear [Student Name],\n\nWelcome to University of Excellence! We are excited to have you join our community of learners and innovators.\n\nBest regards,\nAdmissions Team'
        },
        interview: {
          subject: 'Interview Invitation - University of Excellence',
          content: 'Dear [Student Name],\n\nWe would like to invite you for an interview as part of your application process. Please reply with your availability.\n\nBest regards,\nAdmissions Team'
        },
        acceptance: {
          subject: 'Congratulations! Acceptance to University of Excellence',
          content: 'Dear [Student Name],\n\nCongratulations! We are pleased to offer you admission to University of Excellence for the [Program Name] program.\n\nBest regards,\nAdmissions Team'
        },
        followup: {
          subject: 'Additional Information Required - Application Follow-up',
          content: 'Dear [Student Name],\n\nWe need additional information to complete your application review. Please provide the following documents:\n\n- [Document 1]\n- [Document 2]\n\nBest regards,\nAdmissions Team'
        }
      };

      const template = templates[templateType];
      if (template) {
        if ($('#messageSubject')) $('#messageSubject').value = template.subject;
        if ($('#messageContent')) $('#messageContent').value = template.content;
        showToast(`Template "${templateType}" loaded 📋`, 'success');
      }
    };

    window.editTemplate = function(templateType, event) {
      event.stopPropagation();
      showToast(`Editing template "${templateType}" ✏️`, 'info');
    };

    window.createTemplate = function() {
      showToast('Create template feature coming soon 📝', 'info');
    };

    // Initialize with welcome message
    showToast('Welcome to Institution Portal', 'success', 2000);
  }
})();
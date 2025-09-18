/*
 * Flow Parent Portal JavaScript (Messaging-enabled)
 * - Mobile nav + user menu safety
 * - Minimal i18n (EN/FR/AR/SW) + dir switch
 * - Messaging drawer (threads + conversation + composer, localStorage-backed)
 */

(() => {
  'use strict';

  // STRICT Authentication Guard - Parents only, no fallback
  if (!window.FlowAuthGuards) {
    console.error('❌ Auth system required for parents portal');
    document.body.innerHTML = '<div style="padding: 2rem; text-align: center; font-family: Arial, sans-serif;"><h1>🔒 Parents Portal</h1><p>Please log in to access the parents portal.</p><a href="/" style="color: #5a5bb8;">Return to Home</a></div>';
    return;
  }

  window.FlowAuthGuards.parentGuard(function(user) {
    console.log('✅ Parent access granted:', user.fullName);
    initParentPortal();
  });

  function initParentPortal() {

  const $ = (s, c=document) => c.querySelector(s);
  const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));

  // Namespace + storage + i18n
  window.Flow = window.Flow || {};
  Flow.store = Flow.store || {
    get(k, d=null){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):d; } catch(_){ return d; } },
    set(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); } catch(_){} }
  };
  Flow.i18n = Flow.i18n || {
    lang: Flow.store.get('flow.lang', 'en'),
    dirFor(l){ return l === 'ar' ? 'rtl' : 'ltr'; },
    dict: {
      en:{ msg_title:'Messages', msg_type:'Type a message…', msg_send:'Send', msg_new:'New', msg_search:'Search', msg_me:'You',
           file_big:'File is larger than 5MB', files_max:'You can attach up to 10 files', refreshed:'Dashboard data refreshed'
      },
      fr:{ msg_title:'Messages', msg_type:'Écrire un message…', msg_send:'Envoyer', msg_new:'Nouveau', msg_search:'Rechercher', msg_me:'Vous',
           file_big:'Le fichier dépasse 5 Mo', files_max:'Vous pouvez joindre au plus 10 fichiers', refreshed:'Tableau de bord actualisé'
      },
      ar:{ msg_title:'الرسائل', msg_type:'اكتب رسالة…', msg_send:'إرسال', msg_new:'جديد', msg_search:'بحث', msg_me:'أنت',
           file_big:'الملف أكبر من 5 ميجابايت', files_max:'يمكنك إرفاق 10 ملفات كحد أقصى', refreshed:'تم تحديث لوحة المعلومات'
      },
      sw:{ msg_title:'Ujumbe', msg_type:'Andika ujumbe…', msg_send:'Tuma', msg_new:'Mpya', msg_search:'Tafuta', msg_me:'Wewe',
           file_big:'Faili ni kubwa kuliko 5MB', files_max:'Unaweza kuambatisha faili 10 pekee', refreshed:'Dashibodi imesasishwa'
      }
    },
    t(k){ const l=this.lang in this.dict?this.lang:'en'; return this.dict[l][k]; },
    set(l){ this.lang=l; Flow.store.set('flow.lang', l); document.documentElement.lang=l; document.documentElement.dir=this.dirFor(l); }
  };

  // Year
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Language switch
  const langSel = $('#lang');
  if (langSel) {
    const saved = Flow.store.get('flow.lang', 'en');
    langSel.value = saved;
    Flow.i18n.set(saved);
    langSel.addEventListener('change', e => Flow.i18n.set(e.target.value));
  }

  // Mobile nav toggle
  const navToggle = $('.nav__toggle');
  const navMenu = $('#navMenu');
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', (!isExpanded).toString());
      navMenu.classList.toggle('nav__list--active');
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        navToggle.setAttribute('aria-expanded', 'false');
        navMenu.classList.remove('nav__list--active');
      }
    });
  }

  // User menu dropdown
  const userMenuTrigger = $('.user-menu__trigger');
  const userMenuDropdown = $('.user-menu__dropdown');
  if (userMenuTrigger && userMenuDropdown) {
    userMenuTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      const isExpanded = userMenuTrigger.getAttribute('aria-expanded') === 'true';
      userMenuTrigger.setAttribute('aria-expanded', (!isExpanded).toString());
      userMenuDropdown.classList.toggle('user-menu__dropdown--active');
    });
    document.addEventListener('click', (e) => {
      if (!userMenuTrigger.contains(e.target)) {
        userMenuTrigger.setAttribute('aria-expanded', 'false');
        userMenuDropdown.classList.remove('user-menu__dropdown--active');
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        userMenuTrigger.setAttribute('aria-expanded', 'false');
        userMenuDropdown.classList.remove('user-menu__dropdown--active');
      }
    });
  }

  // Student Selector Dropdown
  const studentSelector = $('.student-selector__trigger');
  const studentDropdown = $('.student-selector__dropdown');
  if (studentSelector && studentDropdown) {
    studentSelector.addEventListener('click', (e) => {
      e.preventDefault();
      const isExpanded = studentSelector.getAttribute('aria-expanded') === 'true';
      studentSelector.setAttribute('aria-expanded', (!isExpanded).toString());
      studentDropdown.setAttribute('aria-expanded', (!isExpanded).toString());
    });
    document.addEventListener('click', (e) => {
      if (!studentSelector.contains(e.target) && !studentDropdown.contains(e.target)) {
        studentSelector.setAttribute('aria-expanded', 'false');
        studentDropdown.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        studentSelector.setAttribute('aria-expanded', 'false');
        studentDropdown.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Student Selection Handler
  const studentOptions = $$('.student-selector__option');
  studentOptions.forEach(option => {
    option.addEventListener('click', (e) => {
      e.preventDefault();
      const studentName = option.querySelector('.student-selector__option-name')?.textContent;
      const studentStatus = option.querySelector('.student-selector__option-status')?.textContent;
      const studentAvatar = option.querySelector('img')?.src;
      
      // Update current selection display
      const currentName = $('.student-selector__name');
      const currentStatus = $('.student-selector__status');
      const currentAvatar = $('.student-selector__avatar');
      
      if (currentName) currentName.textContent = studentName;
      if (currentStatus) currentStatus.textContent = studentStatus;
      if (currentAvatar && studentAvatar) currentAvatar.src = studentAvatar;
      
      // Close dropdown
      studentSelector.setAttribute('aria-expanded', 'false');
      studentDropdown.setAttribute('aria-expanded', 'false');
      
      // Update active state
      studentOptions.forEach(opt => opt.classList.remove('student-selector__option--active'));
      option.classList.add('student-selector__option--active');
      
      console.log(`Switched to student: ${studentName}`);
    });
  });

  // Profile Menu Dropdown
  const profileMenuTrigger = $('.profile-menu__trigger');
  const profileMenuDropdown = $('.profile-menu__dropdown');
  if (profileMenuTrigger && profileMenuDropdown) {
    profileMenuTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      const isExpanded = profileMenuTrigger.getAttribute('aria-expanded') === 'true';
      profileMenuTrigger.setAttribute('aria-expanded', (!isExpanded).toString());
      profileMenuDropdown.setAttribute('aria-expanded', (!isExpanded).toString());
    });
    document.addEventListener('click', (e) => {
      if (!profileMenuTrigger.contains(e.target) && !profileMenuDropdown.contains(e.target)) {
        profileMenuTrigger.setAttribute('aria-expanded', 'false');
        profileMenuDropdown.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        profileMenuTrigger.setAttribute('aria-expanded', 'false');
        profileMenuDropdown.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Navigation Tab Switching
  const navTabs = $$('.nav-tab');
  const sections = $$('.section[data-section]');
  
  function showSection(sectionName) {
    // Hide all sections
    sections.forEach(section => {
      section.classList.remove('active');
      section.style.display = 'none';
    });
    
    // Show target section
    const targetSection = $(`[data-section="${sectionName}"]`);
    if (targetSection) {
      targetSection.classList.add('active');
      targetSection.style.display = 'block';
    }
    
    // Update nav tab states
    navTabs.forEach(tab => {
      tab.classList.remove('nav-tab--active');
      if (tab.getAttribute('data-section') === sectionName) {
        tab.classList.add('nav-tab--active');
      }
    });
    
    // Update URL hash
    history.replaceState(null, '', `#${sectionName}`);
  }
  
  navTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const sectionName = tab.getAttribute('data-section');
      if (sectionName) {
        showSection(sectionName);
      }
    });
  });

  // Profile Menu Actions
  const profileMenuOptions = $$('.profile-menu__option');
  profileMenuOptions.forEach(option => {
    option.addEventListener('click', (e) => {
      e.preventDefault();
      const action = option.getAttribute('data-action');
      
      // Close dropdown first
      if (profileMenuTrigger) profileMenuTrigger.setAttribute('aria-expanded', 'false');
      if (profileMenuDropdown) profileMenuDropdown.setAttribute('aria-expanded', 'false');
      
      switch(action) {
        case 'show-profile':
          showSection('profile');
          break;
        case 'show-financial':
          showSection('finance');
          break;
        case 'link-student':
          console.log('Opening link student dialog...');
          break;
        case 'help':
          showSection('help');
          break;
        case 'logout':
          if (confirm('Are you sure you want to sign out?')) {
            console.log('Logging out...');
          }
          break;
      }
    });
  });

  // Control Buttons (Notifications, Messages, Settings)
  const controlButtons = $$('.control-button');
  controlButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const action = button.getAttribute('data-action');
      
      switch(action) {
        case 'open-messages':
          console.log('📨 Opening messages via data-action');
          window.location.href = 'messages.html';
          break;
        case 'toggle-settings':
          showSection('profile');
          break;
        default:
          console.log('Control button clicked:', button.title || 'Unknown');
      }
    });
  });

  // Search functionality
  const searchInput = $('.search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      console.log('Searching for:', query);
    });
    
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const query = e.target.value.toLowerCase().trim();
        if (query) {
          console.log('Executing search for:', query);
        }
      }
    });
  }

  // Refresh button demo
  const refreshBtn = $('[data-refresh="dashboard"]');
  refreshBtn?.addEventListener('click', ()=>{
    refreshBtn.classList.add('btn--loading');
    setTimeout(()=>{ refreshBtn.classList.remove('btn--loading'); console.log(Flow.i18n.t('refreshed')); }, 1000);
  });

  // Initialize with correct section based on hash
  const hash = location.hash.substring(1);
  if (hash && $(`[data-section="${hash}"]`)) {
    showSection(hash);
  } else {
    showSection('dashboard');
  }

  // ----------------------------
  // Messaging (drawer) for parents
  // ----------------------------
  window.messaging = (() => {
    const KEY='flow.parent.messages.threads.v1';
    const PARENT = document.body.getAttribute('data-parent-id') || 'parent-demo';
    const STUDENT = document.body.getAttribute('data-student-id') || 'student-demo';

    const els = {
      overlay: $('#parentMessagesOverlay'),
      drawer: $('#parentMessagesDrawer'),
      openers: $$('a[href="#communication"], a[href="#messages"], [data-action="message-student"], a[href="/parents/messages.html"]'),
      closeBtn: $('#closeParentMessages'),
      newBtn: $('#newParentThread'),
      threadSearch: $('#parentThreadSearch'),
      threads: $('#parentThreadsList'),
      convTitle: $('#parentConvTitle'),
      conv: $('#parentConversation'),
      form: $('#parentComposer'),
      attachBtn: $('#parentAttachBtn'),
      attachInput: $('#parentAttachInput'),
      textarea: $('#parentMessageText'),
      sendBtn: $('#parentSendMessage'),
      titleLabel: $('#parentMessagesTitle'),
    };

    const state = { threads: [], activeId: null, attachments: [] };

    const save = () => Flow.store.set(KEY, state.threads);
    const load = () => { state.threads = Flow.store.get(KEY, []); };

    const seedIfNeeded = () => {
      const existing = Flow.store.get(KEY, null);
      if (existing && Array.isArray(existing) && existing.length) return;
      const now = Date.now();
      const threads = [
        {
          id:'t-admissions',
          name:'Admissions Office',
          participants:[PARENT,'inst-accra'],
          unread:true,
          messages:[
            {from:'inst-accra', text:'Please confirm Jane’s interview slot for next week. We have available times on Wed/Thu.', ts: now-2*60*60*1000, attachments:[]}
          ]
        },
        {
          id:'t-counselor',
          name:'Counselor Sarah',
          participants:[PARENT,'coun-sarah'],
          unread:false,
          messages:[
            {from:'coun-sarah', text:'Shared three scholarship options that may fit Jane’s profile. Let me know if you want intros.', ts: now-26*60*60*1000, attachments:[]}
          ]
        },
        {
          id:'t-jane',
          name:'Jane Doe',
          participants:[PARENT,STUDENT],
          unread:false,
          messages:[
            {from:STUDENT, text:'Hi! Can you review my essay this weekend?', ts: now-2*24*60*60*1000, attachments:[]}
          ]
        }
      ];
      Flow.store.set(KEY, threads);
    };

    const fmtTime = ts => {
      try { return new Intl.DateTimeFormat(Flow.i18n.lang, { dateStyle:'medium', timeStyle:'short' }).format(new Date(ts)); }
      catch { return new Date(ts).toLocaleString(); }
    };

    const open = (idToOpen=null) => {
      if (els.titleLabel) els.titleLabel.textContent = Flow.i18n.t('msg_title');
      if (els.textarea) els.textarea.placeholder = Flow.i18n.t('msg_type');
      if (els.sendBtn) els.sendBtn.textContent = Flow.i18n.t('msg_send');
      if (els.newBtn) els.newBtn.textContent = Flow.i18n.t('msg_new');
      if (els.threadSearch) els.threadSearch.placeholder = Flow.i18n.t('msg_search');

      els.drawer?.setAttribute('aria-hidden','false');
      els.overlay?.classList.add('messages-overlay--open');
      els.overlay?.removeAttribute('hidden');
      els.drawer?.classList.add('messages-drawer--open');
      render();
      if (idToOpen) selectThread(idToOpen);
      if (state.activeId) els.textarea?.focus();
    };

    const close = () => {
      els.drawer?.setAttribute('aria-hidden','true');
      els.drawer?.classList.remove('messages-drawer--open');
      els.overlay?.classList.remove('messages-overlay--open');
      els.overlay?.setAttribute('hidden','');
    };

    const render = () => { load(); renderThreads(); renderConversation(); };

    const selectThread = (id) => {
      state.activeId = id;
      state.attachments = [];
      renderThreads();
      renderConversation();
    };

    const renderThreads = () => {
      if (!els.threads) return;
      const term = (els.threadSearch?.value || '').trim().toLowerCase();
      els.threads.innerHTML = '';
      state.threads
        .filter(t => !term || t.name.toLowerCase().includes(term))
        .forEach(t=>{
          const li = document.createElement('li');
          li.className = 'threads__item' + (t.id===state.activeId?' threads__item--active':'');
          li.tabIndex = 0;
          li.setAttribute('role','button');
          li.dataset.threadId = t.id;
          const last = t.messages[t.messages.length-1];
          li.innerHTML = `
            <span class="threads__name">${t.name}${t.unread ? ' •' : ''}</span>
            <span class="threads__preview">${last?.text ? last.text.slice(0,60) : ''}</span>
          `;
          li.addEventListener('click', ()=> selectThread(t.id));
          li.addEventListener('keydown', (e)=>{ if (e.key==='Enter' || e.key===' ') { e.preventDefault(); selectThread(t.id);} });
          els.threads.appendChild(li);
        });
    };

    const renderConversation = () => {
      if (!els.conv || !els.convTitle) return;
      const t = state.threads.find(x=>x.id===state.activeId);
      if (!t) {
        els.convTitle.textContent = 'Select a conversation';
        els.conv.innerHTML = '';
        return;
      }
      els.convTitle.textContent = t.name;
      els.conv.innerHTML = '';
      t.unread = false;
      t.messages.forEach(m=>{
        const div = document.createElement('div');
        const isMe = m.from===PARENT;
        div.className = 'message' + (isMe ? ' message--me' : '');
        const sender = (isMe? Flow.i18n.t('msg_me'): t.name);
        const files = (m.attachments && m.attachments.length)
          ? `<div class="message__files">${m.attachments.map(a=>`📎 ${a}`).join('<br/>')}</div>` : '';
        div.innerHTML = `<div class="message__text"><strong>${sender}:</strong> ${m.text||''}</div>${files}<time datetime="${new Date(m.ts).toISOString()}">${fmtTime(m.ts)}</time>`;
        els.conv.appendChild(div);
      });
      els.conv.scrollTop = els.conv.scrollHeight;
      save();
    };

    const send = (text, files=[]) => {
      const t = state.threads.find(x=>x.id===state.activeId);
      if (!t) return;
      const msg = { from: PARENT, text: (text||'').trim(), ts: Date.now(), attachments: (files||[]).slice(0,10) };
      if (!msg.text && msg.attachments.length===0) return;
      t.messages.push(msg);
      save();
      renderConversation();
      els.textarea.value = '';
      state.attachments = [];
    };

    const createNewThread = () => {
      // Quick demo: create a fresh "New Message" thread to Admissions
      const id = `t-new-${Date.now()}`;
      const newThread = { id, name:'New Message', participants:[PARENT,'inst-accra'], unread:false, messages:[] };
      state.threads.unshift(newThread);
      save();
      selectThread(id);
      els.textarea?.focus();
    };

    const interceptLegacyLinks = () => {
      document.addEventListener('click', (e)=>{
        const a = e.target.closest('a');
        if (!a) return;
        const href = a.getAttribute('href') || '';
        if (href === '/parents/messages.html') {
          e.preventDefault();
          open();
        }
      });
    };

    const init = () => {
      seedIfNeeded();
      interceptLegacyLinks();

      // Openers: Messages tab, "Message" button in profile, etc.
      els.openers.forEach(el => el.addEventListener('click', (e)=>{ e.preventDefault(); open(); }));

      // Close handlers
      els.closeBtn?.addEventListener('click', close);
      els.overlay?.addEventListener('click', close);
      document.addEventListener('keydown', (e)=>{ if (e.key==='Escape') close(); });

      // Search
      els.threadSearch?.addEventListener('input', renderThreads);

      // New thread
      els.newBtn?.addEventListener('click', createNewThread);

      // Attachments
      els.attachBtn?.addEventListener('click', ()=> els.attachInput?.click());
      els.attachInput?.addEventListener('change', (e)=>{
        const files = Array.from(e.target.files || []);
        if (files.length + state.attachments.length > 10) {
          console.log(Flow.i18n.t('files_max'));
          return;
        }
        for (const f of files) {
          if (f.size > 5*1024*1024) { console.log(Flow.i18n.t('file_big')); continue; }
          state.attachments.push(f.name);
        }
      });

      // Enhanced message input - make textarea bigger and add auto-resize
      if (els.textarea) {
        els.textarea.style.minHeight = '120px';
        els.textarea.style.maxHeight = '300px';
        els.textarea.style.resize = 'vertical';
        els.textarea.style.fontSize = '16px';
        els.textarea.style.lineHeight = '1.5';
        els.textarea.style.padding = '16px';
        els.textarea.rows = 6;
        
        // Auto-resize functionality
        const autoResize = () => {
          els.textarea.style.height = 'auto';
          els.textarea.style.height = Math.min(els.textarea.scrollHeight, 300) + 'px';
        };
        
        els.textarea.addEventListener('input', autoResize);
        els.textarea.addEventListener('keydown', (e) => {
          // Send on Ctrl+Enter or Cmd+Enter
          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            send(els.textarea?.value || '', state.attachments);
          }
        });
        
        // Initial resize
        setTimeout(autoResize, 100);
      }
      
      // Send form
      els.form?.addEventListener('submit', (e)=>{
        e.preventDefault();
        send(els.textarea?.value || '', state.attachments);
      });

      // Payment approval demo
      document.querySelector('[data-action="approve-payment"]')?.addEventListener('click', ()=> console.log('Payment approved'));
      document.querySelector('[data-action="reject-payment"]')?.addEventListener('click', ()=> console.log('Payment rejected'));

      // Add Contribution functionality - Simple test first
      document.addEventListener('click', (e) => {
        if (e.target.closest('[data-action="add-contribution"]')) {
          e.preventDefault();
          console.log('Add contribution button clicked');
          alert('Add Contribution clicked - Modal would open here');
          // openAddContributionModal();
        }
        if (e.target.closest('a[href="/parents/getting-started"]')) {
          e.preventDefault();
          console.log('Get Started button clicked');
          alert('Get Started clicked - Modal would open here');
          // openGetStartedModal();
        }
      });

      // Deep link
      if (location.hash === '#communication' || location.hash === '#messages') open();
    };

    return { init, open, close, createNewThread, selectThread };
  })();

  // Add Contribution Modal
  function openAddContributionModal() {
    console.log('Opening Add Contribution Modal');
    
    const modalHTML = `
      <div id="addContributionModal" class="modal-overlay" onclick="closeAddContributionModal()">
        <div class="modal" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3>Add Contribution</h3>
            <button class="modal-close" onclick="closeAddContributionModal()" type="button">&times;</button>
          </div>
          <div class="modal-body">
            <form id="contributionForm">
              <div class="form-group">
                <label for="contributionAmount">Amount (USD)</label>
                <input type="number" id="contributionAmount" name="amount" placeholder="500" step="0.01" required>
              </div>
              
              <div class="form-group">
                <label for="contributionMethod">Payment Method</label>
                <select id="contributionMethod" name="method" required>
                  <option value="">Select payment method</option>
                  <option value="mpesa">M-Pesa (+221 77 *** 1234)</option>
                  <option value="bank">Bank Transfer (Ecobank *** 4567)</option>
                  <option value="card">Credit/Debit Card</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="contributionFrequency">Frequency</label>
                <select id="contributionFrequency" name="frequency" required>
                  <option value="one-time">One-time contribution</option>
                  <option value="monthly">Monthly recurring</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annually">Annually</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="contributionNote">Note (Optional)</label>
                <textarea id="contributionNote" name="note" placeholder="Add a note about this contribution..." rows="3"></textarea>
              </div>
              
              <div class="form-actions">
                <button type="button" class="btn btn--ghost" onclick="closeAddContributionModal()">Cancel</button>
                <button type="submit" class="btn btn--primary">Add Contribution</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const form = document.getElementById('contributionForm');
    if (form) {
      form.addEventListener('submit', handleContributionSubmit);
    }
  }

  function closeAddContributionModal() {
    document.getElementById('addContributionModal')?.remove();
  }

  function handleContributionSubmit(e) {
    e.preventDefault();
    console.log('Form submitted');
    
    const formData = new FormData(e.target);
    const amount = formData.get('amount');
    const method = formData.get('method');
    const frequency = formData.get('frequency');
    
    if (!amount || !method || !frequency) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Simulate processing
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.textContent = 'Processing...';
      submitBtn.disabled = true;
    }
    
    setTimeout(() => {
      alert('Contribution added successfully! Amount: $' + amount);
      closeAddContributionModal();
      
      // Update the savings amount in the UI
      try {
        const currentSavings = document.querySelector('.finance-card__amount');
        if (currentSavings) {
          const current = parseFloat(currentSavings.textContent.replace('$', '').replace(',', ''));
          const newAmount = current + parseFloat(amount);
          currentSavings.textContent = '$' + newAmount.toLocaleString();
          
          // Update progress bar
          const progressBar = document.querySelector('.progress');
          if (progressBar) {
            const newPercentage = Math.min((newAmount / 12500) * 100, 100);
            progressBar.style.width = newPercentage + '%';
          }
        }
      } catch (error) {
        console.log('Error updating UI:', error);
      }
    }, 1000);
  }

  // Get Started Modal
  function openGetStartedModal() {
    console.log('Opening Get Started Modal');
    
    const modalHTML = `
      <div id="getStartedModal" class="modal-overlay" onclick="closeGetStartedModal()">
        <div class="modal modal--large" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3>Welcome to Flow Parent Portal</h3>
            <button class="modal-close" onclick="closeGetStartedModal()" type="button">&times;</button>
          </div>
          <div class="modal-body">
            <div class="getting-started-content">
              <div class="getting-started-intro">
                <h4>Get started with supporting your child's university journey</h4>
                <p>Flow helps you stay connected and involved in your child's education applications. Here's how to get the most out of the platform:</p>
              </div>
              
              <div class="getting-started-steps">
                <div class="step-card">
                  <div class="step-number">1</div>
                  <div class="step-content">
                    <h5>Link Your Student</h5>
                    <p>Connect with your child's account to see their application progress and provide approvals when needed.</p>
                    <button class="btn btn--ghost btn--sm" onclick="closeGetStartedModal(); showSection('profile');">Link Student Account</button>
                  </div>
                </div>
                
                <div class="step-card">
                  <div class="step-number">2</div>
                  <div class="step-content">
                    <h5>Set Up Payment Methods</h5>
                    <p>Add your preferred payment methods for application fees and tuition contributions.</p>
                    <button class="btn btn--ghost btn--sm" onclick="closeGetStartedModal(); showSection('finance');">Add Payment Method</button>
                  </div>
                </div>
                
                <div class="step-card">
                  <div class="step-number">3</div>
                  <div class="step-content">
                    <h5>Configure Notifications</h5>
                    <p>Choose how you want to be notified about deadlines, approvals, and important updates.</p>
                    <button class="btn btn--ghost btn--sm" onclick="closeGetStartedModal(); showSection('profile');">Notification Settings</button>
                  </div>
                </div>
                
                <div class="step-card">
                  <div class="step-number">4</div>
                  <div class="step-content">
                    <h5>Review & Approve</h5>
                    <p>Check the approvals section regularly for items that need your attention.</p>
                    <button class="btn btn--ghost btn--sm" onclick="closeGetStartedModal(); showSection('approvals');">View Pending Approvals</button>
                  </div>
                </div>
              </div>
              
              <div class="getting-started-actions">
                <button class="btn btn--primary" onclick="startOnboarding()">Start Complete Onboarding</button>
                <button class="btn btn--ghost" onclick="closeGetStartedModal()">I'll explore on my own</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  function closeGetStartedModal() {
    document.getElementById('getStartedModal')?.remove();
  }

  function startOnboarding() {
    closeGetStartedModal();
    alert('Complete onboarding page is under development. For now, you can explore the available sections.');
  }

  // Make functions globally accessible
  window.openAddContributionModal = openAddContributionModal;
  window.closeAddContributionModal = closeAddContributionModal;
  window.openGetStartedModal = openGetStartedModal;
  window.closeGetStartedModal = closeGetStartedModal;
  window.startOnboarding = startOnboarding;

  // Init all
  const init = () => {
    messaging.init();
    console.log('Parent portal initialised successfully');
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  } // End of initParentPortal function

})();

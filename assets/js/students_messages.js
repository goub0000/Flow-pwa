/* Flow — Messages page with Conversations + Notifications */
(function () {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  // Namespace / storage
  const Flow = (window.Flow = window.Flow || {});
  Flow.store = Flow.store || {
    get(k, d = null) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };
  Flow.i18n = Flow.i18n || { lang: document.documentElement.lang || 'en', t: (k) => k };

  // Toasts
  const toast = {
    el: $('#toast-container'),
    show(msg, type = 'info', dur = 2200) {
      if (!this.el) return;
      const div = document.createElement('div');
      div.className = `toast${type === 'success' ? ' toast--success' : type === 'warning' ? ' toast--warning' : type === 'error' ? ' toast--error' : ''}`;
      div.innerHTML = `<div class="toast__content"><span class="toast__message">${msg}</span><button class="toast__close" aria-label="Close">×</button></div>`;
      this.el.appendChild(div);
      requestAnimationFrame(() => div.classList.add('toast--visible'));
      const close = () => { div.classList.remove('toast--visible'); setTimeout(() => div.remove(), 280); };
      $('.toast__close', div).addEventListener('click', close);
      if (dur > 0) setTimeout(close, dur);
    },
  };

  // Header behavior
  (function header() {
    const toggle = $('.nav__toggle'), menu = $('#navMenu'), header = $('.header');
    if (toggle && menu) {
      toggle.addEventListener('click', () => {
        const open = menu.getAttribute('data-open') === 'true';
        menu.setAttribute('data-open', String(!open));
        toggle.setAttribute('aria-expanded', String(!open));
        document.body.style.overflow = !open ? 'hidden' : '';
      });
      $$('.nav__list a', menu).forEach(a => a.addEventListener('click', () => {
        if (window.innerWidth <= 768) { menu.setAttribute('data-open', 'false'); toggle.setAttribute('aria-expanded', 'false'); document.body.style.overflow=''; }
      }));
    }
    const onScroll = () => header && header.classList.toggle('header--scrolled', window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  })();

  // Year
  const yearEl = $('#year'); if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Elements
  const els = {
    // tabs & badges
    tabBtns: $$('.messages-tab'),
    notifBadge: $('#notifBadge'),
    subnavBadge: $('#messagesBadge'),

    // toolbars
    convToolbar: $('#convToolbar'),
    notifToolbar: $('#notifToolbar'),

    // lists
    threads: $('#msgThreads'),
    notifList: $('#notifList'),

    // conversation panel
    convPanel: $('#convPanel'),
    convTitle: $('#convTitle'),
    conv: $('#convMessages'),
    form: $('#msgComposer'),
    textarea: $('#msgText'),
    attachBtn: $('#msgAttachBtn'),
    attachInput: $('#msgAttachInput'),
    micBtn: $('#msgMicBtn'),
    sendBtn: $('#msgSend'),
    search: $('#msgSearch'),
    newBtn: $('#msgNew'),

    // notification detail panel
    notifDetail: $('#notifDetail'),
    notifTitle: $('#notifTitle'),
    notifBody: $('#notifBody'),
    notifType: $('#notifType'),
    notifTime: $('#notifTime'),
    notifCTA: $('#notifCTA'),
    notifMarkUnread: $('#notifMarkUnread'),

    // notif toolbar actions
    notifMarkAll: $('#notifMarkAll'),
    notifClear: $('#notifClear'),
  };

  // Stores & user
  const KEY_THREADS = 'flow.messages.threads.v1';
  const KEY_NOTIFS  = 'flow.notifications.v1';
  const USER = document.body.getAttribute('data-user-id') || 'u-student-demo';

  // Seed threads if empty
  (function seedThreads() {
    const existing = Flow.store.get(KEY_THREADS, null);
    if (existing && Array.isArray(existing) && existing.length) return;
    const now = Date.now();
    const threads = [
      {
        id: 't-accra',
        name: 'Admissions Office',
        participants: [USER, 'inst-accra-adm'],
        unread: true,
        messages: [
          { from: 'inst-accra-adm', text: 'Please confirm your interview slot for next week. We have available times on Tue/Wed.', ts: now - 2 * 60 * 60 * 1000, attachments: [] },
        ],
      },
      {
        id: 't-counselor',
        name: 'Counselor Sarah',
        participants: [USER, 'counselor-sarah'],
        unread: false,
        messages: [
          { from: 'counselor-sarah', text: 'I shared some scholarship opportunities that might interest you.', ts: now - 24 * 60 * 60 * 1000, attachments: [] },
        ],
      },
    ];
    Flow.store.set(KEY_THREADS, threads);
  })();

  // Seed notifications if empty
  (function seedNotifs() {
    const existing = Flow.store.get(KEY_NOTIFS, null);
    if (existing && Array.isArray(existing) && existing.length) return;
    const now = Date.now();
    const notifs = [
      { id: 'n-mobile-money', title: 'Mobile Money Ready', body: 'Pay fees instantly with M-Pesa, MTN MoMo, or Airtel Money.', ts: now - 60 * 60 * 1000, type: 'system', read: false, cta: { label: 'Open Finance', href: '/students/finance.html' } },
      { id: 'n-task-due',     title: 'Task due: Essay Draft', body: 'Your essay for Abuja Tech Institute is due Sept 1.', ts: now - 2 * 60 * 60 * 1000, type: 'task',   read: false, cta: { label: 'View Tasks', href: '/students/' } },
      { id: 'n-app-update',   title: 'Application updated', body: 'University of Accra application status: Under Review.', ts: now - 3 * 24 * 60 * 60 * 1000, type: 'application', read: true, cta: { label: 'Open Applications', href: '/students/applications.html' } },
    ];
    Flow.store.set(KEY_NOTIFS, notifs);
  })();

  // State
  const state = {
    threads: Flow.store.get(KEY_THREADS, []),
    activeThreadId: null,
    attachments: [],
    // notifications
    notifs: Flow.store.get(KEY_NOTIFS, []),
    activeNotifId: null,
    notifFilter: 'all', // 'all' | 'unread'
    activeTab: 'conversations', // or 'notifications'
  };

  // Helpers
  const saveThreads = () => Flow.store.set(KEY_THREADS, state.threads);
  const saveNotifs  = () => Flow.store.set(KEY_NOTIFS,  state.notifs);
  const fmtTime = (ts) => {
    try { return new Intl.DateTimeFormat(Flow.i18n.lang, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(ts)); }
    catch { return new Date(ts).toLocaleString(); }
  };
  const unreadThreadCount = () => state.threads.filter(t => t.unread).length;
  const unreadNotifCount  = () => state.notifs.filter(n => !n.read).length;

  function updateBadges() {
    const nNotifs = unreadNotifCount();
    if (els.notifBadge) {
      if (nNotifs > 0) { els.notifBadge.textContent = String(nNotifs); els.notifBadge.hidden = false; }
      else els.notifBadge.hidden = true;
    }
    const total = unreadThreadCount() + nNotifs;
    if (els.subnavBadge) {
      if (total > 0) { els.subnavBadge.textContent = String(total); els.subnavBadge.hidden = false; }
      else els.subnavBadge.hidden = true;
    }
  }

  // ---------- Conversations ----------
  function renderThreads() {
    if (!els.threads) return;
    const term = (els.search?.value || '').trim().toLowerCase();
    els.threads.innerHTML = '';
    state.threads
      .filter(t => !term || t.name.toLowerCase().includes(term) || (t.messages[t.messages.length - 1]?.text || '').toLowerCase().includes(term))
      .sort((a, b) => (b.messages[b.messages.length - 1]?.ts || 0) - (a.messages[a.messages.length - 1]?.ts || 0))
      .forEach(t => {
        const li = document.createElement('li');
        li.className = 'threads__item' + (t.id === state.activeThreadId ? ' threads__item--active' : '');
        li.tabIndex = 0; li.setAttribute('role', 'button'); li.dataset.threadId = t.id;
        const last = t.messages[t.messages.length - 1];
        li.innerHTML = `
          <span class="threads__name">${t.name}${t.unread ? ' •' : ''}</span>
          <span class="threads__preview">${last?.text ? last.text.slice(0, 72) : ''}</span>
        `;
        li.addEventListener('click', () => selectThread(t.id));
        li.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectThread(t.id); } });
        els.threads.appendChild(li);
      });
    updateBadges();
  }

  function renderConversation() {
    if (!els.conv || !els.convTitle) return;
    const t = state.threads.find(x => x.id === state.activeThreadId);
    if (!t) {
      els.convTitle.textContent = 'Select a conversation';
      els.conv.innerHTML = '';
      return;
    }
    els.convTitle.textContent = t.name;
    els.conv.innerHTML = '';
    t.unread = false;

    t.messages.forEach(m => {
      const wrap = document.createElement('div');
      wrap.className = 'message' + (m.from === USER ? ' message--me' : '');
      const sender = (m.from === USER ? 'You' : t.name);
      const files = (m.attachments && m.attachments.length)
        ? `<div class="message__files">${m.attachments.map(a => `📎 ${a}`).join('<br/>')}</div>` : '';
      wrap.innerHTML = `
        <div class="message__text"><strong>${sender}:</strong> ${m.text || ''}</div>
        ${files}
        <time datetime="${new Date(m.ts).toISOString()}">${fmtTime(m.ts)}</time>
      `;
      els.conv.appendChild(wrap);
    });

    // Reaction buttons
    els.conv.querySelectorAll('.message').forEach((node) => {
      if (node.nextElementSibling?.classList?.contains('message__actions')) return;
      const actions = document.createElement('div');
      actions.className = 'message__actions';
      actions.innerHTML = `
        <button class="reaction" data-r="👍" type="button">👍</button>
        <button class="reaction" data-r="🎉" type="button">🎉</button>
        <button class="reaction" data-r="❤️" type="button">❤️</button>
      `;
      node.after(actions);
    });
    els.conv.addEventListener('click', (e) => {
      const btn = e.target.closest('.reaction');
      if (!btn) return;
      toast.show(`Reacted ${btn.getAttribute('data-r')}`, 'success', 1200);
    });

    els.conv.scrollTop = els.conv.scrollHeight;
    saveThreads(); updateBadges();
  }

  function selectThread(id) {
    state.activeThreadId = id;
    state.attachments = [];
    renderThreads();
    showTab('conversations');
    renderConversation();
    els.textarea?.focus();
  }

  function send(text, files = []) {
    const t = state.threads.find(x => x.id === state.activeThreadId);
    if (!t) return;
    const msg = { from: USER, text: (text || '').trim(), ts: Date.now(), attachments: (files || []).slice(0, 10) };
    if (!msg.text && msg.attachments.length === 0) return;
    t.messages.push(msg);
    saveThreads();
    renderConversation();
    els.textarea.value = '';
    state.attachments = [];

    // playful auto-reply (marks thread read if currently active)
    setTimeout(() => {
      const reply = { from: t.participants.find(p => p !== USER) || 'inst', text: 'Thanks! We’ll follow up shortly.', ts: Date.now(), attachments: [] };
      t.messages.push(reply);
      if (state.activeThreadId !== t.id) t.unread = true;
      renderThreads();
      renderConversation();
    }, 1200);
  }

  // typing indicator for auto-reply UX
  (function micAndTyping() {
    let rec = null, chunks = [], recording = false;
    async function toggleMic() {
      if (!recording) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          rec = new MediaRecorder(stream); chunks = [];
          rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
          rec.onstop = () => {
            const url = URL.createObjectURL(new Blob(chunks, { type: 'audio/webm' }));
            const t = state.threads.find(x => x.id === state.activeThreadId); if (!t) return;
            t.messages.push({ from: USER, text: '🎤 Voice note', ts: Date.now(), attachments: [] });
            renderConversation();
            const me = els.conv.querySelectorAll('.message.message--me'); const node = me[me.length - 1];
            const audio = document.createElement('audio'); audio.controls = true; audio.src = url; node.appendChild(audio);
          };
          rec.start(); recording = true; els.micBtn.classList.add('btn--secondary'); els.micBtn.textContent = '⏺';
          toast.show('Recording… click again to stop', 'warning', 1600);
        } catch { toast.show('Microphone permission denied', 'error'); }
      } else {
        rec?.stop(); recording = false; els.micBtn.classList.remove('btn--secondary'); els.micBtn.textContent = '🎤';
      }
    }
    els.micBtn?.addEventListener('click', toggleMic);
    els.form?.addEventListener('submit', () => { if (recording) { rec?.stop(); recording = false; els.micBtn.classList.remove('btn--secondary'); els.micBtn.textContent = '🎤'; } });
  })();

  // attachments
  els.attachBtn?.addEventListener('click', () => els.attachInput?.click());
  els.attachInput?.addEventListener('change', (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length + state.attachments.length > 10) { toast.show('You can only attach up to 10 files', 'warning'); return; }
    for (const f of files) {
      if (f.size > 5 * 1024 * 1024) { toast.show('File is larger than 5MB', 'warning'); continue; }
      state.attachments.push(f.name);
    }
  });

  // Enhanced textarea with auto-resize
  if (els.textarea) {
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

  els.form?.addEventListener('submit', (e) => { e.preventDefault(); send(els.textarea?.value || '', state.attachments); });
  els.newBtn?.addEventListener('click', () => {
    const name = prompt('Start a new conversation with:', 'Admissions');
    if (!name) return;
    const id = `t-${Date.now()}`;
    state.threads.unshift({ id, name, participants: [USER, name.toLowerCase().replace(/\s+/g, '-')], unread: false, messages: [] });
    saveThreads(); renderThreads(); selectThread(id);
  });
  els.search?.addEventListener('input', renderThreads);

  // ---------- Notifications ----------
  function renderNotifList() {
    if (!els.notifList) return;
    els.notifList.innerHTML = '';
    state.notifs
      .filter(n => state.notifFilter === 'all' || !n.read)
      .sort((a, b) => b.ts - a.ts)
      .forEach(n => {
        const li = document.createElement('li');
        li.className = 'threads__item' + (n.id === state.activeNotifId ? ' threads__item--active' : '');
        li.tabIndex = 0; li.setAttribute('role', 'button'); li.dataset.id = n.id;
        li.innerHTML = `
          <span class="threads__name">${n.title}${!n.read ? ' •' : ''}</span>
          <span class="threads__preview">${n.body.slice(0, 90)}</span>
        `;
        li.addEventListener('click', () => selectNotif(n.id));
        li.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectNotif(n.id); } });
        els.notifList.appendChild(li);
      });
    updateBadges();
  }

  function selectNotif(id) {
    state.activeNotifId = id;
    const n = state.notifs.find(x => x.id === id);
    if (!n) { showNotifPlaceholder(); return; }

    // mark read on open
    if (!n.read) { n.read = true; saveNotifs(); }

    // fill detail panel
    els.notifTitle.textContent = n.title;
    els.notifBody.textContent = n.body;
    els.notifType.textContent = (n.type || 'info').replace(/^\w/, c => c.toUpperCase());
    els.notifTime.textContent = fmtTime(n.ts);

    if (n.cta?.href) {
      els.notifCTA.href = n.cta.href;
      els.notifCTA.textContent = n.cta.label || 'Open';
      els.notifCTA.hidden = false;
    } else {
      els.notifCTA.hidden = true;
    }
    els.notifMarkUnread.hidden = false;
    renderNotifList();
    showTab('notifications'); // ensure detail panel visible
  }

  function showNotifPlaceholder() {
    els.notifTitle.textContent = 'Notification';
    els.notifBody.textContent = 'Select a notification to see details.';
    els.notifTime.textContent = '';
    els.notifType.textContent = 'Info';
    els.notifCTA.hidden = true;
    els.notifMarkUnread.hidden = true;
  }

  // notif filters & actions
  $$('.notif-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.notif-filter').forEach(b => b.classList.remove('notif-filter--active'));
      btn.classList.add('notif-filter--active');
      state.notifFilter = btn.getAttribute('data-filter') || 'all';
      renderNotifList();
      showNotifPlaceholder();
    });
  });

  els.notifMarkAll?.addEventListener('click', () => {
    let changed = false;
    state.notifs.forEach(n => { if (!n.read) { n.read = true; changed = true; } });
    if (changed) { saveNotifs(); renderNotifList(); updateBadges(); toast.show('All notifications marked as read', 'success'); }
  });

  els.notifClear?.addEventListener('click', () => {
    if (!state.notifs.length) return;
    if (!confirm('Clear all notifications?')) return;
    state.notifs = []; saveNotifs(); renderNotifList(); showNotifPlaceholder(); updateBadges();
    toast.show('Notifications cleared', 'success');
  });

  els.notifMarkUnread?.addEventListener('click', () => {
    const n = state.notifs.find(x => x.id === state.activeNotifId);
    if (!n) return;
    n.read = false; saveNotifs(); renderNotifList(); updateBadges(); toast.show('Marked unread', 'success');
  });

  // ---------- Tabs ----------
  function showTab(tab) {
    state.activeTab = tab;

    const onConvo = tab === 'conversations';
    els.convToolbar.hidden = !onConvo;
    els.notifToolbar.hidden = onConvo;

    els.threads.hidden = !onConvo;
    els.notifList.hidden = onConvo;

    els.convPanel.hidden = !onConvo;
    els.notifDetail.hidden = onConvo;

    els.tabBtns.forEach(b => {
      const is = b.getAttribute('data-tab') === tab;
      b.classList.toggle('messages-tab--active', is);
      b.setAttribute('aria-selected', String(is));
    });

    updateBadges();
  }

  // ---------- Particles ----------
  (function particles() {
    const canvas = $('#particleCanvas'); if (!canvas) return;
    const ctx = canvas.getContext('2d'); let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0, raf = 0; const N = 56; const parts = []; let reduced = false;
    function resize(){ const r = canvas.getBoundingClientRect(); w = Math.floor(r.width * dpr); h = Math.floor(r.height * dpr); canvas.width = w; canvas.height = h; canvas.style.width = r.width + 'px'; canvas.style.height = r.height + 'px'; }
    function seed(){ parts.length = 0; for (let i=0;i<N;i++) parts.push({x: Math.random()*w, y: Math.random()*h, vx:(Math.random()-0.5)*0.3, vy:(Math.random()-0.5)*0.3, r: Math.random()*1.5+0.5}); }
    function step(){ if (reduced) return; ctx.clearRect(0,0,w,h); for (let i=0;i<parts.length;i++){ const a=parts[i]; a.x+=a.vx; a.y+=a.vy; if(a.x<0||a.x>w)a.vx*=-1; if(a.y<0||a.y>h)a.vy*=-1; ctx.beginPath(); ctx.arc(a.x,a.y,a.r,0,Math.PI*2); ctx.fillStyle='rgba(120,130,155,.45)'; ctx.fill(); for(let j=i+1;j<parts.length;j++){ const b=parts[j]; const dx=a.x-b.x, dy=a.y-b.y, dist=Math.hypot(dx,dy); if(dist<130*dpr){ ctx.globalAlpha=(1-dist/(130*dpr))*.55; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.strokeStyle='rgba(120,130,155,.35)'; ctx.lineWidth=1; ctx.stroke(); ctx.globalAlpha=1; }}} raf=requestAnimationFrame(step); }
    function setMotion(){ reduced=document.documentElement.getAttribute('data-motion')==='reduced'; cancelAnimationFrame(raf); if(!reduced) raf=requestAnimationFrame(step); }
    resize(); seed(); setMotion(); window.addEventListener('resize', ()=>{ resize(); seed(); });
    new MutationObserver(setMotion).observe(document.documentElement,{attributes:true,attributeFilter:['data-motion']});
  })();

  // ---------- Init ----------
  renderThreads();
  renderNotifList();
  showNotifPlaceholder();
  updateBadges();

  // default: select first thread
  if (state.threads.length) selectThread(state.threads[0].id);

  // tab buttons
  els.tabBtns.forEach(btn => btn.addEventListener('click', () => showTab(btn.getAttribute('data-tab') || 'conversations')));
})();

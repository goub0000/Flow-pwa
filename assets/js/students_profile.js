/* Flow — Profile page logic (avatar crop, forms, uploads, prefs) */
(function () {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  // Minimal Flow namespace (re-use if exists)
  const Flow = (window.Flow = window.Flow || {});
  Flow.store = Flow.store || {
    get(k, d = null) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };
  Flow.i18n = Flow.i18n || { lang: document.documentElement.lang || 'en', t: (k) => k };
  Flow.currency = Flow.currency || {
    code: Flow.store.get('flow.currency', 'USD'),
    fx: { USD: 1, EUR: 0.92, GBP: 0.78, KES: 129, NGN: 1600, GHS: 15.5, TZS: 2600, UGX: 3800, ZAR: 18.4 },
    set(code) { if (this.fx[code]) { this.code = code; Flow.store.set('flow.currency', code); } },
  };

  // Toasts
  const toast = {
    el: $('#toast-container'),
    show(msg, type = 'info', dur = 2500) {
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

  // Header behavior (scroll blur + mobile menu)
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

  // Messages unread badge (from threads localStorage)
  (function unreadBadge() {
    const badge = $('#messagesBadge'); if (!badge) return;
    const threads = Flow.store.get('flow.messages.threads.v1', []);
    const count = threads.filter(t => t.unread).length;
    if (count > 0) { badge.textContent = String(count); badge.hidden = false; } else { badge.hidden = true; }
  })();

  // Year
  const yearEl = $('#year'); if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Language switcher persistence (optional)
  (function lang() {
    const sel = $('#lang'); if (!sel) return;
    sel.value = Flow.i18n.lang || 'en';
    sel.addEventListener('change', () => {
      Flow.i18n.lang = sel.value;
      localStorage.setItem('flow.lang', JSON.stringify(sel.value));
      toast.show('Language preference saved', 'success', 1400);
      // (avoid reloading to keep the demo smooth)
    });
  })();

  // Settings drawer (re-uses the component styles)
  (function settings() {
    const openBtn = $('#openSettings'), overlay = $('#settingsOverlay'), drawer = $('#settingsDrawer'), closeBtn = $('#closeSettings');
    const tabs = $$('.settings-tab'), panels = $$('.settings-panel');
    function open() { drawer.classList.add('settings-drawer--open'); drawer.setAttribute('aria-hidden', 'false'); overlay.classList.add('settings-overlay--open'); overlay.removeAttribute('hidden'); }
    function close() { drawer.classList.remove('settings-drawer--open'); drawer.setAttribute('aria-hidden', 'true'); overlay.classList.remove('settings-overlay--open'); overlay.setAttribute('hidden', ''); }
    openBtn?.addEventListener('click', open); closeBtn?.addEventListener('click', close); overlay?.addEventListener('click', close);
    document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') close(); });

    tabs.forEach(tab => tab.addEventListener('click', () => {
      const to = tab.getAttribute('data-tab');
      tabs.forEach(t => t.classList.toggle('settings-tab--active', t === tab));
      panels.forEach(p => {
        const is = p.id === `tab-${to}`;
        p.toggleAttribute('hidden', !is);
        p.classList.toggle('settings-panel--active', is);
      });
    }));

    // Persist some prefs
    $('#prefTheme')?.addEventListener('change', e => localStorage.setItem('flow.pref.theme', JSON.stringify(e.target.value)));
    $('#prefDensity')?.addEventListener('change', e => localStorage.setItem('flow.pref.density', JSON.stringify(e.target.value)));
    $('#prefMotion')?.addEventListener('change', e => localStorage.setItem('flow.pref.motion', JSON.stringify(e.target.value)));
    $('#currency')?.addEventListener('change', e => Flow.currency.set(e.target.value));
    $('#saveProfile')?.addEventListener('click', ()=> toast.show('Settings saved', 'success', 1200));
  })();

  // ---------- Avatar Crop (basic: zoom + drag inside a circle) ----------
  const avatar = (() => {
    const input = $('#avatarInput');
    const zoom = $('#avatarZoom');
    const crop = $('#avatarCrop');
    const saveBtn = $('#avatarSave');
    let img = new Image(), loaded = false;
    let scale = 1, pos = { x: 0, y: 0 }; // px offsets in crop box
    let start = null;

    // restore saved avatar
    const saved = Flow.store.get('flow.profile.avatar', null);
    if (saved) {
      crop.style.backgroundImage = `url(${saved})`;
      loaded = true;
    }

    function setBG() {
      if (!loaded) return;
      crop.style.backgroundSize = `${scale * 100}% auto`;
      crop.style.backgroundPosition = `calc(50% + ${pos.x}px) calc(50% + ${pos.y}px)`;
    }

    input?.addEventListener('change', (e) => {
      const f = e.target.files?.[0];
      if (!f) return;
      const url = URL.createObjectURL(f);
      img = new Image();
      img.onload = () => {
        loaded = true; scale = 1; pos = { x: 0, y: 0 };
        crop.style.backgroundImage = `url(${url})`;
        setBG();
      };
      img.src = url;
    });

    zoom?.addEventListener('input', (e) => { scale = parseFloat(e.target.value || '1'); setBG(); });

    crop?.addEventListener('mousedown', (e) => {
      if (!loaded) return;
      start = { x: e.clientX, y: e.clientY, ox: pos.x, oy: pos.y };
      document.body.style.userSelect = 'none';
    });
    window.addEventListener('mousemove', (e) => {
      if (!start) return;
      pos.x = start.ox + (e.clientX - start.x);
      pos.y = start.oy + (e.clientY - start.y);
      setBG();
    });
    window.addEventListener('mouseup', () => { start = null; document.body.style.userSelect = ''; });

    saveBtn?.addEventListener('click', () => {
      if (!loaded) { toast.show('Choose a photo first', 'warning'); return; }
      // Draw to canvas (256x256 square crop)
      const box = crop.getBoundingClientRect();
      const C = 256;
      const canvas = document.createElement('canvas');
      canvas.width = C; canvas.height = C;
      const ctx = canvas.getContext('2d');

      // compute displayed size inside crop box
      const dispW = img.width * scale;
      const dispH = img.height * scale;
      const topLeftX = (box.width - dispW) / 2 + pos.x;
      const topLeftY = (box.height - dispH) / 2 + pos.y;

      // map crop square -> source rect on image
      const sx = Math.max(0, (-topLeftX) * (img.width / dispW));
      const sy = Math.max(0, (-topLeftY) * (img.height / dispH));
      const sw = Math.min(img.width - sx, (box.width) * (img.width / dispW));
      const sh = Math.min(img.height - sy, (box.height) * (img.height / dispH));

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, C, C);

      // make it round visually by masking later; save square PNG
      const data = canvas.toDataURL('image/png');
      Flow.store.set('flow.profile.avatar', data);
      crop.style.backgroundImage = `url(${data})`;
      toast.show('Avatar saved', 'success', 1400);
    });

    // Default placeholder bg
    if (!saved) {
      crop.style.backgroundImage = 'url(/assets/img/avatar-placeholder.png), radial-gradient(1200px 1200px at 50% 0,#eef2ff,#ffffff00)';
      crop.style.backgroundBlendMode = 'normal';
    }
  })();

  // ---------- Personal / Academic forms ----------
  (function forms() {
    const PKEY = 'flow.profile.data.v1';
    const data = Flow.store.get(PKEY, { name: '', dob: '', phone: '', country: '', interest: '', gpa: '', grad: '', scores: '' });

    // bind
    const map = {
      pfName: 'name', pfDob: 'dob', pfPhone: 'phone', pfCountry: 'country',
      pfInterest: 'interest', pfGpa: 'gpa', pfGrad: 'grad', pfScores: 'scores'
    };
    Object.entries(map).forEach(([id, k]) => { const el = $('#' + id); if (el) el.value = data[k] || ''; });

    $('#savePersonal')?.addEventListener('click', () => {
      data.name = $('#pfName')?.value || '';
      data.dob = $('#pfDob')?.value || '';
      data.phone = $('#pfPhone')?.value || '';
      data.country = $('#pfCountry')?.value || '';
      Flow.store.set(PKEY, data);
      toast.show('Personal details saved', 'success', 1200);
    });

    $('#saveAcademic')?.addEventListener('click', () => {
      data.interest = $('#pfInterest')?.value || '';
      data.gpa = $('#pfGpa')?.value || '';
      data.grad = $('#pfGrad')?.value || '';
      data.scores = $('#pfScores')?.value || '';
      Flow.store.set(PKEY, data);
      toast.show('Academic info saved', 'success', 1200);
    });
  })();

  // ---------- Documents upload (max 10, <=5MB, pdf/jpg/png) ----------
  (function uploads() {
    const area = $('#docUploadArea'); const input = $('#docUploadInput'); const list = $('#docUploadList'); const count = $('#docUploadCount'); const btn = $('#docUploadBtn');
    const KEY = 'flow.student.uploads.v1';
    const files = Flow.store.get(KEY, []);

    const render = () => {
      list.innerHTML = '';
      files.forEach((n, i) => {
        const li = document.createElement('li');
        li.className = 'file-list__item';
        li.innerHTML = `<span class="file-list__name">📄 ${n}</span><button class="btn btn--ghost btn--sm" type="button" aria-label="Remove">×</button>`;
        $('.btn', li).addEventListener('click', () => { files.splice(i, 1); Flow.store.set(KEY, files); render(); });
        list.appendChild(li);
      });
      count.textContent = String(files.length);
    };
    render();

    const add = (fileList) => {
      for (const f of fileList) {
        if (files.length >= 10) { toast.show('Max 10 files', 'warning'); break; }
        if (f.size > 5 * 1024 * 1024) { toast.show('File > 5MB', 'warning'); continue; }
        const ok = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'].includes(f.type);
        if (!ok) { toast.show('PDF or image only', 'warning'); continue; }
        files.push(f.name);
      }
      Flow.store.set(KEY, files); render();
    };

    btn?.addEventListener('click', () => input?.click());
    input?.addEventListener('change', (e) => add(e.target.files || []));
    area?.addEventListener('dragover', (e) => { e.preventDefault(); area.classList.add('drag'); });
    area?.addEventListener('dragleave', () => area.classList.remove('drag'));
    area?.addEventListener('drop', (e) => { e.preventDefault(); area.classList.remove('drag'); add(e.dataTransfer.files || []); });
  })();

  // Background particles (respect reduced motion)
  (function particles() {
    const canvas = $('#particleCanvas'); if (!canvas) return;
    const ctx = canvas.getContext('2d'); let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0, raf = 0; const N = 48; const parts = []; let reduced = false;
    function resize(){ const r = canvas.getBoundingClientRect(); w = Math.floor(r.width * dpr); h = Math.floor(r.height * dpr); canvas.width = w; canvas.height = h; canvas.style.width = r.width + 'px'; canvas.style.height = r.height + 'px'; }
    function seed(){ parts.length = 0; for (let i=0;i<N;i++) parts.push({x: Math.random()*w, y: Math.random()*h, vx:(Math.random()-0.5)*0.3, vy:(Math.random()-0.5)*0.3, r: Math.random()*1.5+0.5}); }
    function step(){ if (reduced) return; ctx.clearRect(0,0,w,h); for (let i=0;i<parts.length;i++){ const a=parts[i]; a.x+=a.vx; a.y+=a.vy; if(a.x<0||a.x>w)a.vx*=-1; if(a.y<0||a.y>h)a.vy*=-1; ctx.beginPath(); ctx.arc(a.x,a.y,a.r,0,Math.PI*2); ctx.fillStyle='rgba(120,130,155,.45)'; ctx.fill(); for(let j=i+1;j<parts.length;j++){ const b=parts[j]; const dx=a.x-b.x, dy=a.y-b.y, dist=Math.hypot(dx,dy); if(dist<120*dpr){ ctx.globalAlpha=(1-dist/(120*dpr))*.5; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.strokeStyle='rgba(120,130,155,.35)'; ctx.lineWidth=1; ctx.stroke(); ctx.globalAlpha=1; }}} raf=requestAnimationFrame(step); }
    function setMotion(){ reduced=document.documentElement.getAttribute('data-motion')==='reduced'; cancelAnimationFrame(raf); if(!reduced) raf=requestAnimationFrame(step); }
    resize(); seed(); setMotion(); window.addEventListener('resize', ()=>{ resize(); seed(); });
    new MutationObserver(setMotion).observe(document.documentElement,{attributes:true,attributeFilter:['data-motion']});
  })();
})();

/* Flow — Applications page logic (filters, list/detail, badge) */
(function () {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  // Flow namespace (reuse if present)
  const Flow = (window.Flow = window.Flow || {});
  Flow.store = Flow.store || {
    get(k, d = null) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };
  Flow.i18n = Flow.i18n || { lang: document.documentElement.lang || 'en', t: (k) => k };
  Flow.currency = Flow.currency || {
    code: Flow.store.get('flow.currency', 'USD'),
    fx: { USD: 1, EUR: 0.92, GBP: 0.78, KES: 129, NGN: 1600, GHS: 15.5, TZS: 2600, UGX: 3800, ZAR: 18.4 },
    to(usd){ return (+usd||0) * (this.fx[this.code]||1); },
    fmt(usd){ try{ return new Intl.NumberFormat(Flow.i18n.lang,{style:'currency',currency:this.code}).format(this.to(usd)); }catch{ return `${this.code} ${this.to(usd).toFixed(2)}`; } }
  };

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

  // Header basics
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

  // Unread badge
  (function unreadBadge() {
    const badge = $('#messagesBadge'); if (!badge) return;
    const threads = Flow.store.get('flow.messages.threads.v1', []);
    const count = threads.filter(t => t.unread).length;
    if (count > 0) { badge.textContent = String(count); badge.hidden = false; } else { badge.hidden = true; }
  })();

  // ---------- Data from Firestore ----------
  // Data will be loaded from Firestore via DataService
  // No hardcoded sample applications
  const APPKEY = 'flow.apps.v1';
  const seedIfNeeded = () => {
    const curr = Flow.store.get(APPKEY, null);
    if (curr && Array.isArray(curr) && curr.length) return;
    // Initialize with empty array - real data comes from Firestore
    Flow.store.set(APPKEY, []);
  };
  seedIfNeeded();

  // ---------- Rendering ----------
  const listEl = $('#appsList'), countEl = $('#appsCount'), detail = $('#appDetail'), detailBody = $('#appDetailBody'), detailActions = $('#appDetailActions');
  const searchEl = $('#appSearch'), sortEl = $('#sortBy'); const chips = $$('.chip');

  let state = { status:'all', term:'', sort:'updated', selected:null };

  function statusBadge(s){
    if (s==='draft') return '<span class="status-badge status-badge--draft">Draft</span>';
    if (s==='review') return '<span class="status-badge status-badge--warning">Under Review</span>';
    if (s==='submitted') return '<span class="status-badge status-badge--success">Submitted</span>';
    return '';
  }
  function fmtDate(ts){ try{ return new Intl.DateTimeFormat(Flow.i18n.lang,{dateStyle:'medium'}).format(new Date(ts)); } catch { return new Date(ts).toLocaleDateString(); } }

  function filtered(){
    const apps = Flow.store.get(APPKEY, []);
    let res = apps.filter(a => state.status==='all' ? true : a.status===state.status);
    if (state.term) {
      const t = state.term.toLowerCase();
      res = res.filter(a => (a.uni+a.program).toLowerCase().includes(t));
    }
    if (state.sort==='name') res.sort((a,b)=> a.uni.localeCompare(b.uni));
    else res.sort((a,b)=> b.updated - a.updated);
    return res;
  }

  function renderList(){
    const apps = filtered();
    listEl.innerHTML = '';
    apps.forEach(a=>{
      const item = document.createElement('div');
      item.className = 'application-item';
      item.dataset.id = a.id;
      item.innerHTML = `
        <div class="application-item__status ${a.status==='review'?'application-item__status--review':a.status==='submitted'?'application-item__status--submitted':'application-item__status--draft'}"></div>
        <div class="application-item__content">
          <h3 class="application-item__title">${a.uni}</h3>
          <p class="application-item__program">${a.program}</p>
          <div class="application-item__progress">
            ${statusBadge(a.status)}
            <time class="application-item__date">Updated ${fmtDate(a.updated)}</time>
          </div>
        </div>
        <button class="application-item__action" aria-label="Open ${a.uni}">
          <svg width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/></svg>
        </button>
      `;
      item.addEventListener('click', ()=> openDetail(a.id));
      listEl.appendChild(item);
    });
    countEl.textContent = `${apps.length} application${apps.length===1?'':'s'}`;
  }

  function openDetail(id){
    const apps = Flow.store.get(APPKEY, []);
    const a = apps.find(x=>x.id===id); if (!a) return;
    state.selected = id; detail.hidden = false;
    detailBody.innerHTML = `
      <div class="app-detail__row">
        <div>
          <h3 class="app-detail__title">${a.uni}</h3>
          <p class="muted">${a.program}</p>
          <div class="chip-row" style="margin-top:.25rem">${statusBadge(a.status)}</div>
        </div>
        <div class="app-detail__meta">
          <div><strong>Fees due:</strong> ${Flow.currency.fmt(a.feesUSD)}</div>
          <div><strong>Last update:</strong> ${fmtDate(a.updated)}</div>
        </div>
      </div>
      <div class="app-detail__section">
        <h4>Pending tasks</h4>
        ${
          (a.tasks && a.tasks.length)
          ? `<ul class="list">${a.tasks.map(t=>`<li>${t}</li>`).join('')}</ul>`
          : '<p class="muted">No pending tasks.</p>'
        }
      </div>
      <div class="app-detail__section">
        <h4>Notes</h4>
        <textarea id="appNotes" class="form-textarea" rows="3" placeholder="Add a note…"></textarea>
      </div>
    `;
    $('#appNotes').value = a.notes || '';
    detailActions.innerHTML = `
      ${a.status==='draft'
        ? '<button id="continueBtn" class="btn btn--primary">Continue</button>'
        : '<button id="viewBtn" class="btn btn--ghost">View</button>'
      }
      <button id="withdrawBtn" class="btn btn--ghost">Withdraw</button>
    `;

    $('#continueBtn')?.addEventListener('click', ()=> toast.show('Opening application…', 'info'));
    $('#viewBtn')?.addEventListener('click', ()=> toast.show('Opening application…', 'info'));
    $('#withdrawBtn')?.addEventListener('click', ()=> {
      if (!confirm('Withdraw this application?')) return;
      const idx = apps.findIndex(x=>x.id===id);
      if (idx>-1) { apps.splice(idx,1); Flow.store.set(APPKEY, apps); toast.show('Application withdrawn', 'success'); renderList(); detail.hidden = true; }
    });
    $('#appNotes')?.addEventListener('input', (e)=>{ a.notes = e.target.value; Flow.store.set(APPKEY, apps); });
  }

  // Filters
  chips.forEach(ch => ch.addEventListener('click', ()=>{
    chips.forEach(c=> c.classList.remove('chip--active'));
    ch.classList.add('chip--active');
    state.status = ch.getAttribute('data-status');
    renderList(); detail.hidden = true;
  }));
  searchEl?.addEventListener('input', ()=>{ state.term = searchEl.value.trim(); renderList(); detail.hidden = true; });
  sortEl?.addEventListener('change', ()=>{ state.sort = sortEl.value; renderList(); });

  renderList();

  // Background particles
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

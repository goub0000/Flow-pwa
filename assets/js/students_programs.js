/* Flow Students — Programs page logic (search, filters, save, apply, currency, details modal, compare) */
(function () {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  // Shared store & currency (fallbacks if students.js hasn't initialized yet)
  window.Flow = window.Flow || {};
  Flow.store = Flow.store || {
    get(k, d=null){ try { const v = localStorage.getItem(k); return v?JSON.parse(v):d; } catch { return d; } },
    set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };
  Flow.currency = Flow.currency || {
    code: Flow.store.get('flow.currency', 'USD'),
    fx: { USD:1, EUR:0.92, GBP:0.78, KES:129, NGN:1600, GHS:15.5, TZS:2600, UGX:3800, ZAR:18.4 },
    set(code){ if(this.fx[code]){ this.code=code; Flow.store.set('flow.currency', code); this.apply(); } },
    to(usd){ return (+usd||0) * (this.fx[this.code]||1); },
    fmt(usd){ try { return new Intl.NumberFormat(document.documentElement.lang||'en', { style:'currency', currency:this.code }).format(this.to(usd)); } catch { return `${this.code} ${this.to(usd).toFixed(2)}`; } },
    apply(){ $$('[data-amount-usd]').forEach(el => el.textContent = this.fmt(el.getAttribute('data-amount-usd'))); }
  };

  const toast = {
    container: $('#toast-container'),
    show(msg, type='info', duration=3000){
      if (!this.container) return;
      const el = document.createElement('div');
      el.className = 'toast' + (['success','warning','error'].includes(type) ? ` toast--${type}` : '');
      el.innerHTML = `<div class="toast__content"><span class="toast__message">${msg}</span><button class="toast__close" aria-label="Close">×</button></div>`;
      this.container.appendChild(el);
      requestAnimationFrame(()=> el.classList.add('toast--visible'));
      const remove=()=>{ el.classList.remove('toast--visible'); setTimeout(()=> el.remove(), 300); };
      $('.toast__close', el)?.addEventListener('click', remove);
      if (duration>0) setTimeout(remove, duration);
      return el;
    }
  };

  // Keys
  const CATALOG_KEY = 'flow.programs.catalog.v2'; // bumped to v2 for details fields
  const SAVED_KEY   = 'flow.programs.saved.v1';
  const FILTERS_KEY = 'flow.programs.filters.v1';
  const DRAFTS_KEY  = 'flow.applications.drafts.v1';
  const COMPARE_KEY = 'flow.programs.compare.v1';

  // Data will be loaded from Firestore via DataService
  // No hardcoded sample data - all programs come from the database
  function seedCatalog(){
    // Removed hardcoded sample programs
    // Programs should be loaded from Firestore instead
    if (Flow.store.get(CATALOG_KEY)) return;
    Flow.store.set(CATALOG_KEY, []);
  }

  // State
  const state = {
    all: [],
    filtered: [],
    page: 1,
    pageSize: 8,
    saved: new Set(Flow.store.get(SAVED_KEY, [])),
    filters: Flow.store.get(FILTERS_KEY, {
      q:'', country:'', level:'', field:'', mode:'', scholar:false, maxUSD:10000, sort:'match'
    }),
    compare: new Set(Flow.store.get(COMPARE_KEY, [])), // up to 4
    compareLimit: 4
  };

  // Helpers
  const fmtDeadline = d => {
    try { return new Intl.DateTimeFormat(document.documentElement.lang||'en', { dateStyle:'medium' }).format(new Date(d)); }
    catch { return d; }
  };
  const badge = (txt, cls='') => `<span class="status-badge ${cls}">${txt}</span>`;

  function renderChips(){
    const wrap = $('#activeFilters'); if (!wrap) return;
    const chips = [];
    const { q, country, level, field, mode, scholar, maxUSD } = state.filters;
    if (q)       chips.push(`<button class="chip" data-k="q">${q} ×</button>`);
    if (country) chips.push(`<button class="chip" data-k="country">${country} ×</button>`);
    if (level)   chips.push(`<button class="chip" data-k="level">${level} ×</button>`);
    if (field)   chips.push(`<button class="chip" data-k="field">${field} ×</button>`);
    if (mode)    chips.push(`<button class="chip" data-k="mode">${mode==='campus'?'On-campus':'Online'} ×</button>`);
    if (scholar) chips.push(`<button class="chip" data-k="scholar">Scholarships ×</button>`);
    if (maxUSD < 10000) chips.push(`<button class="chip" data-k="maxUSD">≤ ${Flow.currency.fmt(maxUSD)} ×</button>`);
    wrap.innerHTML = chips.join('');
    wrap.toggleAttribute('hidden', chips.length===0);
    wrap.querySelectorAll('.chip').forEach(btn => btn.addEventListener('click', ()=>{
      const k = btn.getAttribute('data-k');
      if (k==='scholar') state.filters.scholar=false;
      else if (k==='maxUSD') state.filters.maxUSD=10000;
      else state.filters[k]='';
      saveFilters();
      syncControls();
      applyFilters(true);
    }));
  }

  function buildCard(p){
    const saved = state.saved.has(p.id);
    const inCompare = state.compare.has(p.id);
    const price = `<div class="program-card__price"><span class="muted">Tuition / year</span> <strong data-amount-usd="${p.tuitionUSD}">$${p.tuitionUSD.toLocaleString()}</strong></div>`;
    const schol = p.scholarship ? badge('Scholarship', 'status-badge--accent') : '';
    const deadline = badge('Deadline: ' + fmtDeadline(p.deadline), 'status-badge--draft');
    const match = `<div class="match"><span class="match__dot"></span>${p.match}% match</div>`;
    const mode = p.mode==='online' ? badge('Online', 'status-badge--success') : badge('On-campus', 'status-badge--primary');

    return `
      <article class="program-card card--interactive" data-id="${p.id}">
        <span class="card__glow"></span>

        <button class="compare-toggle ${inCompare?'compare-toggle--on':''}" data-compare="${p.id}" aria-pressed="${inCompare?'true':'false'}" title="Add to compare">
          ⇄
        </button>

        <div class="program-card__body">
          <header class="program-card__header">
            <div class="program-card__eyebrow">${p.uni} • ${p.country}</div>
            <h3 class="program-card__title">${p.title}</h3>
          </header>

          <div class="program-card__meta">
            ${mode} ${schol} ${deadline}
          </div>

          <div class="program-card__footer">
            ${price}
            <div class="program-card__right">
              ${match}
              <div class="btn-group">
                <button class="btn btn--ghost btn-details" data-id="${p.id}">Details</button>
                <button class="btn btn--ghost btn-save" data-id="${p.id}" aria-pressed="${saved ? 'true':'false'}">${saved ? 'Saved' : 'Save'}</button>
                <button class="btn btn--primary btn-apply" data-id="${p.id}">Apply</button>
              </div>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  function renderGrid(reset=false){
    const grid = $('#programGrid'); const countEl = $('#resultCount');
    if (!grid) return;
    if (reset) state.page = 1;

    const end = state.page * state.pageSize;
    const slice = state.filtered.slice(0, end);

    grid.innerHTML = slice.map(buildCard).join('');
    $('#loadMore')?.toggleAttribute('hidden', end >= state.filtered.length);
    $('#emptyState')?.toggleAttribute('hidden', state.filtered.length !== 0);
    countEl && (countEl.textContent = String(state.filtered.length));

    // Re-apply currency formatting
    Flow.currency.apply();

    // Bind card buttons
    grid.querySelectorAll('.btn-save').forEach(b=>{
      b.addEventListener('click', ()=>{
        const id = b.getAttribute('data-id');
        if (state.saved.has(id)) {
          state.saved.delete(id);
          b.textContent = 'Save';
          b.setAttribute('aria-pressed','false');
          toast.show('Removed from saved', 'warning', 1500);
        } else {
          state.saved.add(id);
          b.textContent = 'Saved';
          b.setAttribute('aria-pressed','true');
          toast.show('Saved program', 'success', 1500);
        }
        persistSaved();
        renderSaved();
      });
    });

    grid.querySelectorAll('.btn-apply').forEach(b=>{
      b.addEventListener('click', ()=> createDraftAndToast(b.getAttribute('data-id')));
    });

    grid.querySelectorAll('.btn-details').forEach(b=>{
      b.addEventListener('click', ()=> openProgramModal(b.getAttribute('data-id')));
    });

    grid.querySelectorAll('[data-compare]').forEach(t=>{
      t.addEventListener('click', ()=>{
        const id = t.getAttribute('data-compare');
        toggleCompare(id);
      });
    });

    // Subtle interactive glow hover
    enableTiltOnCards();
  }

  function enableTiltOnCards(){
    $$('.program-card').forEach(card=>{
      card.addEventListener('mousemove', (e)=>{
        const r = card.getBoundingClientRect();
        const mx = ((e.clientX - r.left) / r.width) * 100;
        const my = ((e.clientY - r.top) / r.height) * 100;
        card.style.setProperty('--mx', mx + '%');
        card.style.setProperty('--my', my + '%');
      });
      card.addEventListener('mouseleave', ()=>{ card.style.removeProperty('--mx'); card.style.removeProperty('--my'); });
    });
  }

  function applyFilters(reset=false){
    const f = state.filters;
    const q = f.q.trim().toLowerCase();
    state.filtered = state.all.filter(p=>{
      if (q) {
        const hay = (p.title + ' ' + p.uni + ' ' + p.field + ' ' + p.country).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (f.country && p.country !== f.country) return false;
      if (f.level   && p.level   !== f.level)   return false;
      if (f.field   && p.field   !== f.field)   return false;
      if (f.mode    && p.mode    !== f.mode)    return false;
      if (f.scholar && !p.scholarship)          return false;
      if (p.tuitionUSD > f.maxUSD)              return false;
      return true;
    });

    // Sort
    const sort = f.sort || 'match';
    state.filtered.sort((a,b)=>{
      if (sort==='tuitionAsc')   return a.tuitionUSD - b.tuitionUSD;
      if (sort==='deadlineAsc')  return +new Date(a.deadline) - +new Date(b.deadline);
      if (sort==='nameAsc')      return a.title.localeCompare(b.title);
      return b.match - a.match; // default: best match
    });

    renderChips();
    renderGrid(reset);
  }

  // Saved drawer
  function renderSaved(){
    const ul = $('#savedList'); const c = $('#savedCount');
    if (!ul) return;
    const ids = Array.from(state.saved);
    const items = state.all.filter(p=> ids.includes(p.id));
    c && (c.textContent = String(items.length));
    ul.innerHTML = items.length ? items.map(p=>`
      <li class="saved-item">
        <div>
          <div class="saved-item__title">${p.title}</div>
          <div class="muted">${p.uni} • ${p.country}</div>
        </div>
        <div class="saved-item__actions">
          <button class="btn btn--ghost" data-unsave="${p.id}">Remove</button>
          <button class="btn btn--primary btn-apply" data-id="${p.id}">Apply</button>
        </div>
      </li>
    `).join('') : '<li class="muted">No saved programs yet.</li>';

    // Bind remove/apply
    ul.querySelectorAll('[data-unsave]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const id = btn.getAttribute('data-unsave');
        state.saved.delete(id);
        persistSaved();
        renderSaved();
        applyFilters(); // update grid buttons
      });
    });
    ul.querySelectorAll('.btn-apply').forEach(b=>{
      b.addEventListener('click', ()=> createDraftAndToast(b.getAttribute('data-id')));
    });
  }

  // Details modal
  function openProgramModal(id){
    const p = state.all.find(x=>x.id===id);
    if (!p) return;
    const modal = $('#programModal');
    $('#programModalTitle').textContent = `${p.title} — ${p.uni}`;
    const price = `<strong data-amount-usd="${p.tuitionUSD}">$${p.tuitionUSD.toLocaleString()}</strong>`;
    $('#programModalBody').innerHTML = `
      <div class="program-detail">
        <div class="program-detail__row">
          <div><span class="muted">University</span><div>${p.uni}</div></div>
          <div><span class="muted">Location</span><div>${p.city || '-'}, ${p.country}</div></div>
          <div><span class="muted">Level</span><div>${p.level}</div></div>
          <div><span class="muted">Field</span><div>${p.field}</div></div>
        </div>
        <div class="program-detail__row">
          <div><span class="muted">Mode</span><div>${p.mode==='online'?'Online':'On-campus'}</div></div>
          <div><span class="muted">Duration</span><div>${p.duration || '-'}</div></div>
          <div><span class="muted">Deadline</span><div>${fmtDeadline(p.deadline)}</div></div>
          <div><span class="muted">Tuition / year</span><div data-amount-usd="${p.tuitionUSD}">${price}</div></div>
        </div>
        <div class="program-detail__badges">
          ${p.scholarship ? '<span class="status-badge status-badge--accent">Scholarship</span>' : ''}
          <span class="status-badge status-badge--primary">${p.accreditation || 'Accredited'}</span>
          <span class="status-badge status-badge--success">${p.match}% match</span>
        </div>
        <div class="program-detail__overview">
          <h4>Overview</h4>
          <p>${p.overview || 'Program overview coming soon.'}</p>
        </div>
        <div class="program-detail__cols">
          <div>
            <h4>Top Courses</h4>
            <ul class="list-chips">
              ${(p.courses||[]).map(c=>`<li class="chip">${c}</li>`).join('')}
            </ul>
          </div>
          <div>
            <h4>Requirements</h4>
            <ul class="list-bullets">
              ${(p.requirements||[]).map(r=>`<li>${r}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;
    // buttons
    const modalSave = $('#modalSave');
    const modalApply = $('#modalApply');
    modalSave.onclick = ()=>{
      if (state.saved.has(p.id)) {
        state.saved.delete(p.id);
        toast.show('Removed from saved', 'warning', 1200);
      } else {
        state.saved.add(p.id);
        toast.show('Saved program', 'success', 1200);
      }
      persistSaved(); renderSaved(); applyFilters();
      closeModal('programModal'); // or keep open? UX choice; we’ll keep it open:
      openProgramModal(p.id);
    };
    modalApply.onclick = (e)=>{ e.preventDefault(); createDraftAndToast(p.id); };

    Flow.currency.apply();
    openModal('programModal');
  }

  // Compare tray + modal
  function toggleCompare(id){
    if (state.compare.has(id)) {
      state.compare.delete(id);
    } else {
      if (state.compare.size >= state.compareLimit) {
        toast.show(`You can compare up to ${state.compareLimit} programs`, 'warning', 2200);
        return;
      }
      state.compare.add(id);
    }
    persistCompare();
    renderCompareTray();
    applyFilters(); // refresh compare toggles on cards
  }

  function renderCompareTray(){
    const tray = $('#compareTray'); const list = $('#compareList'); const count = $('#compareCount');
    const ids = Array.from(state.compare);
    tray.toggleAttribute('hidden', ids.length === 0);
    count.textContent = String(ids.length);

    const items = state.all.filter(p=> ids.includes(p.id));
    list.innerHTML = items.map(p=>`
      <div class="compare-pill" title="${p.title}">
        <span class="compare-pill__label">${p.uni.split(' ')[0]} • ${p.title.split(' ')[0]}</span>
        <button class="compare-pill__remove" data-uncompare="${p.id}" aria-label="Remove ${p.title}">×</button>
      </div>
    `).join('');

    list.querySelectorAll('[data-uncompare]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const id = btn.getAttribute('data-uncompare');
        state.compare.delete(id);
        persistCompare();
        renderCompareTray();
        applyFilters();
      });
    });
  }

  function buildCompareTable(){
    const ids = Array.from(state.compare);
    const items = state.all.filter(p=> ids.includes(p.id));
    if (!items.length) {
      $('#compareTable').innerHTML = '<div class="empty"><h4>No programs selected</h4><p>Add some with the ⇄ button.</p></div>';
      return;
    }
    const fields = [
      { key:'title', label:'Program' },
      { key:'uni', label:'University' },
      { key:'level', label:'Level' },
      { key:'field', label:'Field' },
      { key:'mode', label:'Mode', map:v=> v==='online'?'Online':'On-campus' },
      { key:'country', label:'Country' },
      { key:'city', label:'City' },
      { key:'tuitionUSD', label:'Tuition / year', map:v=> `<span data-amount-usd="${v}">${Flow.currency.fmt(v)}</span>` },
      { key:'deadline', label:'Deadline', map:fmtDeadline },
      { key:'scholarship', label:'Scholarship', map:v=> v? 'Yes' : '—' },
      { key:'duration', label:'Duration' },
      { key:'accreditation', label:'Accreditation' },
      { key:'match', label:'Match', map:v=> v + '%' },
      { key:'courses', label:'Top courses', map:v=> (v||[]).slice(0,4).map(c=>`<span class="chip">${c}</span>`).join(' ') },
      { key:'requirements', label:'Key requirements', map:v=> (v||[]).slice(0,3).map(r=>`<li>${r}</li>`).join('') }
    ];

    let html = `<div class="compare-scroll"><table class="table-compare"><thead><tr><th>Attribute</th>${items.map(p=>`<th>${p.title}<div class="muted">${p.uni}</div></th>`).join('')}</tr></thead><tbody>`;
    fields.forEach(f=>{
      html += `<tr><th>${f.label}</th>${items.map(p=>{
        const val = p[f.key];
        if (f.key==='requirements') return `<td><ul class="list-bullets">${f.map(val)}</ul></td>`;
        return `<td>${f.map ? f.map(val) : (val ?? '—')}</td>`;
      }).join('')}</tr>`;
    });
    html += `</tbody></table></div>`;
    $('#compareTable').innerHTML = html;
    Flow.currency.apply();
  }

  // Draft helper
  function createDraftAndToast(id){
    const p = state.all.find(x=>x.id===id);
    if (!p) return;
    const drafts = Flow.store.get(DRAFTS_KEY, []);
    if (!drafts.find(d=>d.programId===p.id)) {
      drafts.push({ programId:p.id, uni:p.uni, title:p.title, status:'Draft', createdAt:Date.now() });
      Flow.store.set(DRAFTS_KEY, drafts);
    }
    toast.show('Draft created — go to Applications to continue.', 'success', 2200);
  }

  // Controls
  function syncControls(){
    $('#programSearch').value = state.filters.q || '';
    $('#filterCountry').value = state.filters.country || '';
    $('#filterLevel').value = state.filters.level || '';
    $('#filterField').value = state.filters.field || '';
    $('#filterMode').value = state.filters.mode || '';
    $('#filterScholar').checked = !!state.filters.scholar;
    $('#filterTuition').value = state.filters.maxUSD;
    const tl = $('#tuitionLabel'); tl && (tl.setAttribute('data-amount-usd', state.filters.maxUSD), tl.textContent = Flow.currency.fmt(state.filters.maxUSD));
  }
  function saveFilters(){ Flow.store.set(FILTERS_KEY, state.filters); }
  function persistSaved(){ Flow.store.set(SAVED_KEY, Array.from(state.saved)); }
  function persistCompare(){ Flow.store.set(COMPARE_KEY, Array.from(state.compare)); }

  function bindUI(){
    // Inputs
    $('#programSearch')?.addEventListener('input', e=>{ state.filters.q = e.target.value; saveFilters(); applyFilters(true); });
    $('#filterCountry')?.addEventListener('change', e=>{ state.filters.country = e.target.value; saveFilters(); applyFilters(true); });
    $('#filterLevel')?.addEventListener('change', e=>{ state.filters.level = e.target.value; saveFilters(); applyFilters(true); });
    $('#filterField')?.addEventListener('change', e=>{ state.filters.field = e.target.value; saveFilters(); applyFilters(true); });
    $('#filterMode')?.addEventListener('change', e=>{ state.filters.mode = e.target.value; saveFilters(); applyFilters(true); });
    $('#filterScholar')?.addEventListener('change', e=>{ state.filters.scholar = !!e.target.checked; saveFilters(); applyFilters(true); });
    $('#filterTuition')?.addEventListener('input', e=>{
      state.filters.maxUSD = parseInt(e.target.value,10) || 10000;
      const tl = $('#tuitionLabel'); tl && (tl.setAttribute('data-amount-usd', state.filters.maxUSD), tl.textContent = Flow.currency.fmt(state.filters.maxUSD));
      saveFilters(); applyFilters(true);
    });
    $('#sortBy')?.addEventListener('change', e=>{ state.filters.sort = e.target.value; saveFilters(); applyFilters(true); });

    $('#resetFilters')?.addEventListener('click', ()=>{
      state.filters = { q:'', country:'', level:'', field:'', mode:'', scholar:false, maxUSD:10000, sort:'match' };
      saveFilters();
      syncControls();
      applyFilters(true);
      toast.show('Filters reset', 'success', 1200);
    });

    $('#loadMore')?.addEventListener('click', ()=>{
      state.page += 1;
      renderGrid(false);
    });

    // Compare tray actions
    $('#openCompare')?.addEventListener('click', ()=>{
      buildCompareTable();
      openModal('compareModal');
    });
    $('#clearCompare')?.addEventListener('click', ()=>{
      state.compare.clear();
      persistCompare();
      renderCompareTray();
      applyFilters();
    });
    $('#compareApplyAll')?.addEventListener('click', ()=>{
      Array.from(state.compare).forEach(id => createDraftAndToast(id));
      toast.show('Drafts created for selected programs.', 'success', 1800);
    });

    // Modals close (backdrops + close buttons + Esc)
    $('[data-close="programModal"]')?.addEventListener('click', ()=> closeModal('programModal'));
    $('[data-close="compareModal"]')?.addEventListener('click', ()=> closeModal('compareModal'));
    $('#closeProgramModal')?.addEventListener('click', ()=> closeModal('programModal'));
    $('#closeCompareModal')?.addEventListener('click', ()=> closeModal('compareModal'));
    document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape'){ closeModal('programModal'); closeModal('compareModal'); } });

    // Re-apply currency when language or theme changes (visual consistency)
    const obs = new MutationObserver(()=> Flow.currency.apply());
    obs.observe(document.documentElement, { attributes:true, attributeFilter:['lang','data-theme'] });
  }

  function openModal(id){
    const m = document.getElementById(id);
    if (!m) return;
    m.setAttribute('aria-hidden', 'false');
    m.classList.add('modal--open');
    // lock scroll
    document.body.style.overflow = 'hidden';
  }
  function closeModal(id){
    const m = document.getElementById(id);
    if (!m) return;
    m.setAttribute('aria-hidden', 'true');
    m.classList.remove('modal--open');
    document.body.style.overflow = '';
  }

  function deepLink(){
    const params = new URLSearchParams(location.search);
    if (params.get('view') === 'recommended') {
      state.filters.sort = 'match';
      saveFilters(); syncControls();
    }
    const q = params.get('q'); if (q){ state.filters.q = q; saveFilters(); syncControls(); }
    const id = params.get('id'); if (id) setTimeout(()=> openProgramModal(id), 100);
  }

  function init(){
    seedCatalog();
    state.all = Flow.store.get(CATALOG_KEY, []);
    syncControls();
    bindUI();
    deepLink();
    applyFilters(true);
    renderSaved();
    renderCompareTray();
    Flow.currency.apply();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

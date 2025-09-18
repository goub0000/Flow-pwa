/*
 * Flow • Counselor Onboarding JavaScript (Upgraded)
 * - Full i18n (EN/FR/AR/SW) incl. RTL
 * - Language persistence
 * - Stepper highlight on hash
 * - A11y polish
 */

(() => {
  'use strict';
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // Shared namespace (idempotent)
  window.Flow = window.Flow || {};
  Flow.store = Flow.store || {
    get(k, d=null) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch(_) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch(_) {} }
  };
  Flow.i18n = Flow.i18n || {
    lang: Flow.store.get('flow.lang', 'en'),
    dirFor(l){ return l === 'ar' ? 'rtl' : 'ltr'; },
    dict: {
      en: { ui_menu:'Menu' },
      fr: { ui_menu:'Menu' },
      ar: { ui_menu:'القائمة' },
      sw: { ui_menu:'Menyu' }
    },
    t(k){ const l=this.lang in this.dict?this.lang:'en'; return this.dict[l][k]; },
    set(lang){ this.lang=lang; Flow.store.set('flow.lang', lang); document.documentElement.lang=lang; document.documentElement.dir=this.dirFor(lang); }
  };

  function setYear() {
    const yearEl = $('#year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  function initNav() {
    const toggle = $('.nav__toggle');
    const menu = $('#navMenu');
    if (!toggle || !menu) return;
    toggle.setAttribute('aria-label', Flow.i18n.t('ui_menu'));
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', (!expanded).toString());
      menu.classList.toggle('nav__list--active');
    });
    $$('a', menu).forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          menu.classList.remove('nav__list--active');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  function initLang() {
    const select = $('#lang');
    if (!select) return;
    const saved = Flow.store.get('flow.lang', 'en');
    select.value = saved;
    Flow.i18n.set(saved);
    select.addEventListener('change', e => Flow.i18n.set(e.target.value));
  }

  // Update progress rail based on URL hash
  function updateSteps() {
    const hash = window.location.hash || '#step-account';
    const steps = $$('.steps .step');
    let currentIndex = 0;
    steps.forEach((step, idx) => {
      const link = step.querySelector('.step__label');
      const href = link ? link.getAttribute('href') : '';
      if (href === hash) currentIndex = idx;
    });
    steps.forEach((step, idx) => {
      step.classList.remove('step--current', 'step--done');
      if (idx < currentIndex) step.classList.add('step--done');
      else if (idx === currentIndex) step.classList.add('step--current');
    });
  }

  function initSteps() {
    updateSteps();
    window.addEventListener('hashchange', updateSteps);
    $$('.steps .step__label').forEach(link => {
      link.addEventListener('click', () => setTimeout(updateSteps, 10));
    });
  }

  // -------- Draft persistence --------
  const DRAFT_KEY = 'flow.counselor.onboarding.v1';
  function collectFields(){
    const scope = $('.onboarding');
    if (!scope) return [];
    // Include inputs/selects/textareas within cards (steps)
    return Array.from(scope.querySelectorAll('section.card input, section.card select, section.card textarea'));
  }
  function fieldKey(el, idx){
    // Generate a stable-ish key: nearest section id + tag + index within section
    const section = el.closest('section');
    const secId = section ? section.id : 'root';
    return `${secId}::${el.tagName.toLowerCase()}::${idx}`;
  }
  function readDraft(){
    try { return JSON.parse(localStorage.getItem(DRAFT_KEY)) || {}; } catch(_) { return {}; }
  }
  function writeDraft(obj){
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(obj)); } catch(_) {}
  }
  function saveDraft(showToast=true){
    const draft = readDraft();
    const fields = collectFields();
    fields.forEach((el, i)=>{
      const key = fieldKey(el, i);
      if (el.type === 'checkbox' || el.type === 'radio') draft[key] = !!el.checked;
      else if (el.type === 'file') { /* ignore files in draft */ }
      else draft[key] = el.value;
    });
    draft._ts = Date.now();
    draft._hash = window.location.hash || '#step-account';
    writeDraft(draft);
    if (showToast) showSavedToast();
  }
  function loadDraft(){
    const draft = readDraft();
    if (!draft || !Object.keys(draft).length) return;
    const fields = collectFields();
    fields.forEach((el, i)=>{
      const key = fieldKey(el, i);
      if (!(key in draft)) return;
      if (el.type === 'checkbox' || el.type === 'radio') el.checked = !!draft[key];
      else if (el.type === 'file') { /* cannot restore files */ }
      else el.value = draft[key] || '';
    });
    if (draft._hash) {
      try { window.location.hash = draft._hash; } catch(_) {}
    }
  }
  function showSavedToast(){
    const toast = $('#toast');
    if (!toast) return;
    toast.style.display = 'block';
    toast.setAttribute('aria-live','polite');
    clearTimeout(showSavedToast._t);
    showSavedToast._t = setTimeout(()=>{ toast.style.display = 'none'; }, 1800);
  }
  function initDraftPersistence(){
    loadDraft();
    // Debounced autosave
    let t = null;
    const handler = () => { clearTimeout(t); t = setTimeout(()=> saveDraft(false), 400); };
    collectFields().forEach(el => {
      el.addEventListener('input', handler);
      el.addEventListener('change', handler);
    });
    // Wire all "Save" / "Save draft" buttons in steps
    $$('.section__actions .btn').forEach(btn => {
      if (btn.getAttribute('aria-disabled') === 'true'){
        btn.addEventListener('click', (e)=>{ e.preventDefault(); saveDraft(true); });
      }
    });
  }

  function init() {
    setYear();
    initNav();
    initLang();
    initSteps();
    initDraftPersistence();
    console.log('Counselor onboarding JS initialised');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

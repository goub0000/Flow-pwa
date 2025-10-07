/*
 * Flow Recommender Portal JS
 * - Mobile nav + language persistence (dir switch for AR)
 * - Smooth subnav + active state
 * - Pending "Upload" prefill (request + student + program)
 * - Upload form validation (required fields, email, PDF only, <=5MB)
 * - Faux upload + localStorage-backed history + receipt modal
 * - Messaging UI (threads + feed + composer) with localStorage + unread badge
 * - NEW: File attachments in messages (composer + modal)
 * - NEW: Recipient picker for new threads and editing existing thread recipients
 */

(() => {
  'use strict';

  // STRICT Authentication Guard - Recommenders only, no fallback
  if (!window.FlowAuthGuards) {
    console.error('❌ Auth system required for recommenders portal');
    document.body.innerHTML = '<div style="padding: 2rem; text-align: center; font-family: Arial, sans-serif;"><h1>🔒 Recommenders Portal</h1><p>Please log in to access the recommenders portal.</p><a href="/" style="color: #5a5bb8;">Return to Home</a></div>';
    return;
  }

  window.FlowAuthGuards.recommenderGuard(function(user) {
    console.log('✅ Recommender access granted:', user.fullName);
    initRecommenderPortal();
  });

  function initRecommenderPortal() {
    // Tiny helpers
  const $ = (s, c=document) => c.querySelector(s);
  const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));
  const esc = (str='') => str.replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
  const fmtTime = (ts) => new Date(ts).toLocaleString();
  const fmtRel = (ts) => {
    const diff = Date.now() - ts;
    const m = Math.floor(diff/60000), h = Math.floor(m/60), d = Math.floor(h/24);
    if (m<1) return 'now';
    if (m<60) return `${m}m ago`;
    if (h<24) return `${h}h ago`;
    return `${d}d ago`;
  };
  const fmtBytes = (n)=> n<1024?`${n} B`:n<1048576?`${(n/1024).toFixed(1)} KB`:`${(n/1048576).toFixed(2)} MB`;

  // Namespace + storage
  window.Flow = window.Flow || {};
  Flow.store = Flow.store || {
    get(k, d=null){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):d; } catch(_){ return d; } },
    set(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); } catch(_){} }
  };

  // i18n-lite (only language+dir persistence so UI keeps consistent with other portals)
  const I18N_KEY = 'flow.lang';
  const i18n = {
    lang: Flow.store.get(I18N_KEY, 'en'),
    dirFor(l){ return l === 'ar' ? 'rtl' : 'ltr'; },
    set(l){ this.lang = l; Flow.store.set(I18N_KEY, l); document.documentElement.lang = l; document.documentElement.dir = this.dirFor(l); }
  };

  // Year
  $('#year')?.textContent = new Date().getFullYear();

  // Language switch
  const langSel = $('#lang');
  if (langSel) {
    const saved = Flow.store.get(I18N_KEY, 'en');
    langSel.value = saved;
    i18n.set(saved);
    langSel.addEventListener('change', e => i18n.set(e.target.value));
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

  // Subnav smooth scroll + active state
  const subnavLinks = $$('.subnav a[href^="#"]');
  const sections = subnavLinks.map(a => $(a.getAttribute('href'))).filter(Boolean);
  const setActiveLink = (hash) => subnavLinks.forEach(a => a.classList.toggle('subnav__link--active', a.getAttribute('href') === hash));
  subnavLinks.forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (href === '#') return;
      const target = $(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior:'smooth', block:'start' });
        history.pushState(null, '', href);
        setActiveLink(href);
      }
    });
  });
  const onScrollSpy = () => {
    const fromTop = window.scrollY + 120;
    let current = null;
    for (const sec of sections) if (sec.offsetTop <= fromTop) current = sec;
    if (current) setActiveLink('#' + current.id);
  };
  window.addEventListener('scroll', onScrollSpy, { passive:true });

  // Toasts
  const toastBox = $('#toast-container');
  function toast(msg, timeout=2500){ if(!toastBox) return;
    const t = document.createElement('div'); t.className='toast'; t.textContent = msg; toastBox.appendChild(t);
    setTimeout(()=>{ t.remove(); }, timeout);
  }

  // Receipt modal (for upload receipts)
  const receiptModal = {
    overlay: $('#receiptOverlay'),
    box: $('#receiptModal'),
    body: $('#receiptBody'),
    btnClose: $('#receiptClose'),
    btnOk: $('#receiptOk'),
    btnCopy: $('#receiptCopy'),
    open(html){
      if (this.body) this.body.innerHTML = html;
      this.overlay?.classList.add('modal-overlay--open');
      this.overlay?.removeAttribute('hidden');
      this.box?.classList.add('modal--open');
      this.box?.removeAttribute('hidden');
    },
    close(){
      this.box?.classList.remove('modal--open');
      this.box?.setAttribute('hidden','');
      this.overlay?.classList.remove('modal-overlay--open');
      this.overlay?.setAttribute('hidden','');
    }
  };
  receiptModal.btnClose?.addEventListener('click', ()=> receiptModal.close());
  receiptModal.btnOk?.addEventListener('click', ()=> receiptModal.close());
  receiptModal.overlay?.addEventListener('click', ()=> receiptModal.close());
  document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') receiptModal.close(); });
  receiptModal.btnCopy?.addEventListener('click', ()=>{
    const tmp = document.createElement('div'); tmp.innerHTML = receiptModal.body?.innerHTML || '';
    const text = tmp.textContent || '';
    navigator.clipboard?.writeText(text).then(()=> toast('Receipt copied'));
  });

  // Upload prefill (from Pending Requests)
  const prefillFromRow = (row) => {
    const req = row.getAttribute('data-req-id') || '';
    const student = row.getAttribute('data-student') || '';
    const program = row.getAttribute('data-program') || '';
    $('#reqId').value = req;
    $('#studentName').value = student;
    $('#program').value = program;
    $('#upload')?.scrollIntoView({ behavior:'smooth', block:'start' });
    $('#letterFile')?.focus();
  };
  $$('.pending-row .link-upload').forEach(link => {
    link.addEventListener('click', (e)=>{
      e.preventDefault();
      const row = link.closest('.pending-row');
      if (row) prefillFromRow(row);
      history.pushState(null,'','#upload');
      setActiveLink('#upload');
    });
  });

  // Upload form handling
  const form = $('#uploadForm');
  const submitBtn = $('#submitBtn');
  const statusEl = $('#formStatus');
  function setBusy(b){
    if (b) { submitBtn?.classList.add('btn--loading'); submitBtn.disabled = true; }
    else { submitBtn?.classList.remove('btn--loading'); submitBtn.disabled = false; }
  }
  const validEmail = (v)=> /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  form?.addEventListener('submit', (e)=>{
    e.preventDefault();
    if (!form) return;

    const reqId = $('#reqId').value.trim();
    const student = $('#studentName').value.trim();
    const recName = $('#recName').value.trim();
    const recEmail = $('#recEmail').value.trim();
    const relationship = $('#relationship').value.trim();
    const program = $('#program').value.trim();
    const file = $('#letterFile').files?.[0];
    const confidential = $('#confidential').value;
    const note = $('#note').value.trim();

    // Validation
    const errors = [];
    if (!reqId) errors.push('Request ID is required.');
    if (!student) errors.push('Student name is required.');
    if (!recName) errors.push('Your full name is required.');
    if (!recEmail || !validEmail(recEmail)) errors.push('A valid email is required.');
    if (!relationship) errors.push('Please select your relationship to the student.');
    if (!program) errors.push('Institution / Program is required.');
    if (!file) errors.push('Please attach a PDF file (max 5MB).');
    if (file) {
      const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
      if (!isPdf) errors.push('Only PDF files are accepted.');
      if (file.size > 5*1024*1024) errors.push('File is larger than 5MB.');
    }
    if (!confidential) errors.push('Please choose a confidentiality option.');

    if (errors.length){
      statusEl.textContent = errors.join(' ');
      toast(errors[0]);
      return;
    }

    // Faux upload
    setBusy(true);
    statusEl.textContent = 'Uploading…';
    setTimeout(()=>{
      const entry = {
        id: 'SUB-' + Math.random().toString(36).slice(2,8).toUpperCase(),
        reqId, student, program,
        recName, recEmail, relationship,
        fileName: file.name, fileSize: file.size,
        confidential, note, ts: Date.now()
      };
      const list = getHistory();
      const idx = list.findIndex(x => x.reqId === reqId && x.program === program);
      if (idx >= 0) list[idx] = entry; else list.push(entry);
      setHistory(list);

      setBusy(false);
      form.reset();
      statusEl.textContent = 'Uploaded.';
      toast('Letter submitted successfully');
      renderHistory();

      const html = `
        <p>Thank you! Your letter has been received.</p>
        <dl class="grid" style="grid-template-columns: 1fr 2fr; gap:.5rem 1rem">
          <dt><strong>Submission ID</strong></dt><dd>${esc(entry.id)}</dd>
          <dt><strong>Request ID</strong></dt><dd>${esc(entry.reqId)}</dd>
          <dt><strong>Student</strong></dt><dd>${esc(entry.student)}</dd>
          <dt><strong>Program</strong></dt><dd>${esc(entry.program)}</dd>
          <dt><strong>File</strong></dt><dd>${esc(entry.fileName)} (${fmtBytes(entry.fileSize)})</dd>
          <dt><strong>Confidential</strong></dt><dd>${entry.confidential === 'confidential' ? 'Yes' : 'No'}</dd>
          <dt><strong>Timestamp</strong></dt><dd>${fmtTime(entry.ts)}</dd>
        </dl>
      `;
      receiptModal.open(html);
    }, 900);
  });

  // History
  const HISTORY_KEY = 'flow.recommender.submissions.v1';
  const getHistory = ()=> Flow.store.get(HISTORY_KEY, []);
  const setHistory = (list)=> Flow.store.set(HISTORY_KEY, list);
  function renderHistory(){
    const box = $('#historyList');
    if (!box) return;
    const items = getHistory().sort((a,b)=> b.ts - a.ts);
    box.innerHTML = '';
    if (!items.length){
      const empty = document.createElement('p');
      empty.textContent = box.getAttribute('data-empty-text') || 'No submissions yet.';
      empty.className = 'text--muted';
      box.appendChild(empty);
      return;
    }
    items.forEach((it, idx)=>{
      const card = document.createElement('article');
      card.className = 'card';
      card.setAttribute('aria-labelledby', 'h'+idx);
      const when = fmtTime(it.ts);
      const conf = it.confidential === 'confidential' ? 'Yes' : 'No';
      card.innerHTML = `
        <h3 id="h${idx}">${esc(it.student)} — ${esc(it.program)}</h3>
        <p>Status: <span class="badge">Submitted</span> • <time>${when}</time></p>
        <p>Confidential: ${conf} • File: <em>${esc(it.fileName)}</em></p>
        <div class="wrap" style="gap:.5rem">
          <button class="btn btn--ghost btn--sm view-receipt" type="button" data-id="${it.id}">View receipt</button>
          <button class="btn btn--ghost btn--sm reupload" type="button" data-id="${it.id}">Replace</button>
        </div>
      `;
      box.appendChild(card);
    });

    $$('.view-receipt', box).forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const id = btn.getAttribute('data-id');
        const it = getHistory().find(x=> x.id === id);
        if (!it) return;
        const html = `
          <dl class="grid" style="grid-template-columns: 1fr 2fr; gap:.5rem 1rem">
            <dt><strong>Submission ID</strong></dt><dd>${esc(it.id)}</dd>
            <dt><strong>Request ID</strong></dt><dd>${esc(it.reqId)}</dd>
            <dt><strong>Student</strong></dt><dd>${esc(it.student)}</dd>
            <dt><strong>Program</strong></dt><dd>${esc(it.program)}</dd>
            <dt><strong>Recommender</strong></dt><dd>${esc(it.recName)} &lt;${esc(it.recEmail)}&gt;</dd>
            <dt><strong>Confidential</strong></dt><dd>${it.confidential === 'confidential' ? 'Yes' : 'No'}</dd>
            <dt><strong>File</strong></dt><dd>${esc(it.fileName)} (${fmtBytes(it.fileSize)})</dd>
            <dt><strong>Submitted</strong></dt><dd>${fmtTime(it.ts)}</dd>
            ${it.note ? `<dt><strong>Note</strong></dt><dd>${esc(it.note)}</dd>` : ''}
          </dl>
        `;
        receiptModal.open(html);
      });
    });
    $$('.reupload', box).forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const id = btn.getAttribute('data-id');
        const it = getHistory().find(x=> x.id === id);
        if (!it) return;
        $('#reqId').value = it.reqId;
        $('#studentName').value = it.student;
        $('#program').value = it.program;
        $('#upload')?.scrollIntoView({ behavior:'smooth', block:'start' });
        $('#letterFile')?.focus();
        toast('Prefilled from previous submission');
      });
    });
  }

  // ---------- Messaging ----------
  const MSG_KEY = 'flow.recommender.messages.v2'; // bump key to include recipients + attachments

  // Data will be loaded from Firestore via DataService
  // No hardcoded recipients
  const RECIPIENTS = [];
  // Real recipients will be loaded from Firestore

  // Data will be loaded from Firestore via DataService
  // No hardcoded sample threads
  function seedThreadsIfEmpty(){
    if (Flow.store.get(MSG_KEY)) return;
    // Initialize with empty array - real data comes from Firestore
    Flow.store.set(MSG_KEY, []);
  }
  function getThreads(){ return Flow.store.get(MSG_KEY, []); }
  function setThreads(list){ Flow.store.set(MSG_KEY, list); }

  // Title helpers
  function recipientsToChips(ids){
    const frag = document.createDocumentFragment();
    ids.map(id => RECIPIENTS.find(r=> r.id===id))
       .filter(Boolean)
       .forEach(r=>{
         const span = document.createElement('span');
         span.className = 'recipient-chip';
         span.textContent = r.name;
         frag.appendChild(span);
       });
    return frag;
  }
  function threadTitle(t){
    const first = RECIPIENTS.find(r=> r.id === (t.recipients[0] || ''));
    return (first ? first.name : 'Conversation') + (t.subject ? ` — ${t.subject}` : '');
  }
  function peersText(t){
    const names = t.recipients.map(id => (RECIPIENTS.find(r=> r.id===id)?.name || ''));
    return names.filter(Boolean).join(', ');
  }

  const threadListEl = $('#threadList');
  const feedEl = $('#messageFeed');
  const titleEl = $('#threadTitle');
  const metaEl = $('#threadMeta');
  const composer = $('#composer');
  const composerEmpty = $('#composerEmpty');
  const composerInput = $('#composerInput');
  const composerAttach = $('#composerAttach');
  const composerFile = $('#composerFile');
  const composerFiles = $('#composerFiles');
  const msgBadge = $('#msgBadge');
  const msgSearch = $('#msgSearch');
  const msgNew = $('#msgNew');
  const editRecipientsBtn = $('#editRecipients');

  // Modal for new/edit message
  const msgModal = {
    overlay: $('#msgOverlay'),
    box: $('#msgModal'),
    title: $('#msgModalTitle'),
    form: $('#msgForm'),
    list: $('#recipientList'),
    subject: $('#msgSubject'),
    text: $('#msgText'),
    status: $('#msgStatus'),
    btnClose: $('#msgClose'),
    btnCancel: $('#msgCancel'),
    btnSend: $('#msgSend'),
    attachBtn: $('#msgAttach'),
    fileInput: $('#msgFile'),
    filesWrap: $('#msgFiles'),
    attachments: [],
    mode: 'new', // 'new' | 'edit'
    threadId: null,
    open(mode='new', thread=null){
      this.mode = mode;
      this.threadId = thread?.id || null;
      this.title.textContent = mode === 'edit' ? 'Edit Recipients' : 'New Message';
      this.subject.parentElement.style.display = (mode === 'edit') ? 'none' : '';
      this.text.parentElement.style.display = (mode === 'edit') ? 'none' : '';
      this.attachBtn.style.display = (mode === 'edit') ? 'none' : '';
      this.filesWrap.innerHTML = '';
      this.attachments = [];

      // Build recipients list
      this.list.innerHTML = '';
      RECIPIENTS.forEach(r=>{
        const id = `r-${r.id}`;
        const label = document.createElement('label');
        label.className = 'chip';
        label.innerHTML = `<input type="checkbox" id="${id}" value="${r.id}"> ${esc(r.name)}`;
        this.list.appendChild(label);
      });
      // Preselect
      if (mode === 'edit' && thread){
        thread.recipients.forEach(id=>{
          const cb = this.list.querySelector(`input[value="${id}"]`);
          if (cb) cb.checked = true;
        });
      }

      // Show
      this.overlay?.classList.add('modal-overlay--open');
      this.overlay?.removeAttribute('hidden');
      this.box?.classList.add('modal--open');
      this.box?.removeAttribute('hidden');
    },
    close(){
      this.box?.classList.remove('modal--open');
      this.box?.setAttribute('hidden','');
      this.overlay?.classList.remove('modal-overlay--open');
      this.overlay?.setAttribute('hidden','');
    }
  };
  msgModal.btnClose?.addEventListener('click', ()=> msgModal.close());
  msgModal.btnCancel?.addEventListener('click', ()=> msgModal.close());
  msgModal.overlay?.addEventListener('click', (e)=>{ if(e.target===msgModal.overlay) msgModal.close(); });
  document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') msgModal.close(); });

  // Attachments helpers (shared logic)
  function validateFiles(fileList, maxCount=5, maxSize=10*1024*1024){
    const out = [];
    for (const f of fileList){
      if (out.length >= maxCount) break;
      if (f.size > maxSize){ toast(`"${f.name}" is larger than 10MB`); continue; }
      out.push({ name: f.name, size: f.size, type: f.type });
    }
    return out;
  }
  function pillHtml(att){
    return `
      <span class="attach-pill" title="${esc(att.name)} (${fmtBytes(att.size)})">
        <svg width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M9.5 2.672a.5.5 0 1 0 1 0V.843a.5.5 0 0 0-1 0v1.829zM3.5 6a3.5 3.5 0 0 1 7 0v5a2.5 2.5 0 0 1-5 0V6a1.5 1.5 0 0 1 3 0v4.5a.5.5 0 0 1-1 0V6a.5.5 0 0 0-1 0v4.5a2.5 2.5 0 1 0 5 0V6a2.5 2.5 0 1 0-5 0v5a.5.5 0 0 0 1 0V6z"/></svg>
        <span>${esc(att.name)}</span>
        <span style="opacity:.65">(${fmtBytes(att.size)})</span>
      </span>
    `;
  }

  // Data + UI state
  let currentThreadId = null;
  let composerAttachments = [];

  function totalUnread(){
    return getThreads().reduce((n,t)=> n + (t.unread||0), 0);
  }
  function updateUnreadBadge(){
    const n = totalUnread();
    if (!msgBadge) return;
    if (n>0){ msgBadge.textContent = String(n); msgBadge.style.display = 'inline-block'; }
    else { msgBadge.style.display = 'none'; }
  }

  function renderThreadList(filter=''){
    const threads = getThreads()
      .slice()
      .sort((a,b)=> (b.updated||0) - (a.updated||0))
      .filter(t=>{
        if (!filter) return true;
        const last = t.messages.at(-1);
        const hay = (threadTitle(t) + ' ' + (last?.text || '')).toLowerCase();
        return hay.includes(filter.toLowerCase());
      });

    threadListEl.innerHTML = '';
    if (!threads.length){
      const p = document.createElement('p');
      p.className = 'text--muted';
      p.style.padding = '.75rem';
      p.textContent = 'No conversations';
      threadListEl.appendChild(p);
      return;
    }

    threads.forEach(t=>{
      const last = t.messages.at(-1);
      const btn = document.createElement('button');
      btn.className = 'thread-item' + (t.id === currentThreadId ? ' thread-item--active':'');
      btn.setAttribute('type','button');
      btn.setAttribute('role','option');
      btn.setAttribute('data-id', t.id);
      btn.innerHTML = `
        <div style="flex:1">
          <div class="thread-item__meta">
            <span class="thread-item__title">${esc(threadTitle(t))}</span>
            <span class="thread-item__time">${last ? esc(fmtRel(last.ts)) : ''}</span>
          </div>
          <div class="thread-item__preview">${last ? esc(last.text) : 'No messages yet'}</div>
        </div>
        ${t.unread ? `<span class="thread-item__unread">${t.unread}</span>` : ''}
      `;
      btn.addEventListener('click', ()=> selectThread(t.id));
      threadListEl.appendChild(btn);
    });
  }

  function renderFeed(thread){
    feedEl.innerHTML = '';
    if (!thread){
      titleEl.textContent = 'Select a conversation';
      metaEl.textContent = '';
      metaEl.innerHTML = '';
      editRecipientsBtn.hidden = true;
      composer.hidden = true;
      composerEmpty.hidden = false;
      return;
    }
    titleEl.textContent = threadTitle(thread);
    metaEl.innerHTML = '';
    const recipientsWrap = document.createElement('div');
    recipientsWrap.className = 'recipients-badge';
    recipientsWrap.appendChild(recipientsToChips(thread.recipients));
    metaEl.appendChild(recipientsWrap);
    editRecipientsBtn.hidden = false;

    composer.hidden = false;
    composerEmpty.hidden = true;

    thread.messages.forEach(m=>{
      const bubble = document.createElement('div');
      bubble.className = 'msg' + (m.me ? ' msg--me' : '');
      let inner = `${esc(m.text)}<span class="msg__meta">${esc(m.author)} • ${esc(new Date(m.ts).toLocaleTimeString())}</span>`;
      if (m.attachments && m.attachments.length){
        inner += `<div class="msg__attachments">${m.attachments.map(pillHtml).join('')}</div>`;
      }
      bubble.innerHTML = inner;
      feedEl.appendChild(bubble);
    });
    // scroll to bottom
    feedEl.scrollTop = feedEl.scrollHeight;
    // focus composer
    composerInput?.focus();
  }

  function selectThread(id){
    currentThreadId = id;
    const list = getThreads();
    const t = list.find(x=> x.id === id);
    if (!t) return;
    // mark read
    if (t.unread) { t.unread = 0; setThreads(list); }
    renderThreadList(msgSearch.value.trim());
    renderFeed(t);
    updateUnreadBadge();
    // clear composer attachments
    composerAttachments = [];
    composerFiles.innerHTML = '';
  }

  // Composer attach
  composerAttach?.addEventListener('click', ()=> composerFile?.click());
  composerFile?.addEventListener('change', (e)=>{
    const files = validateFiles(e.target.files || [], 5 - composerAttachments.length);
    composerAttachments = composerAttachments.concat(files);
    renderComposerFiles();
    composerFile.value = '';
  });
  function renderComposerFiles(){
    composerFiles.innerHTML = '';
    composerAttachments.forEach((att, idx)=>{
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.innerHTML = `${esc(att.name)} <span style="opacity:.65">(${fmtBytes(att.size)})</span> <button class="chip__x" type="button" aria-label="Remove">×</button>`;
      chip.querySelector('.chip__x').addEventListener('click', ()=>{
        composerAttachments.splice(idx,1);
        renderComposerFiles();
      });
      composerFiles.appendChild(chip);
    });
  }

  // Composer submit
  const composerForm = $('#composer');
  composerForm?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const txt = composerInput.value.trim();
    if ((!txt && composerAttachments.length===0) || !currentThreadId) return;

    const list = getThreads();
    const t = list.find(x=> x.id === currentThreadId);
    if (!t) return;

    const m = {
      id:'m-'+Math.random().toString(36).slice(2,8),
      me:true, author:'You', text:txt || '(no message)',
      ts:Date.now(),
      attachments: composerAttachments.slice()
    };
    t.messages.push(m);
    t.updated = m.ts;
    setThreads(list);
    composerInput.value = '';
    composerAttachments = [];
    renderComposerFiles();
    renderFeed(t);
    renderThreadList(msgSearch.value.trim());
    toast('Message sent');

    // Optional: simulate reply
    setTimeout(()=>{
      const reply = { id:'m-'+Math.random().toString(36).slice(2,8), me:false, author:peersText(t), text:'Thanks for your message. We will get back shortly.', ts:Date.now(), attachments:[] };
      const list2 = getThreads();
      const t2 = list2.find(x=> x.id === t.id);
      if (!t2) return;
      t2.messages.push(reply);
      t2.updated = reply.ts;
      // If not viewing this thread, mark unread
      if (currentThreadId !== t2.id) { t2.unread = (t2.unread||0) + 1; }
      setThreads(list2);
      if (currentThreadId === t2.id) renderFeed(t2);
      renderThreadList(msgSearch.value.trim());
      updateUnreadBadge();
    }, 900);
  });

  // Search filter
  msgSearch?.addEventListener('input', (e)=> renderThreadList(e.target.value));

  // New message modal — open
  msgNew?.addEventListener('click', ()=> msgModal.open('new'));
  // Attach in modal
  msgModal.attachBtn?.addEventListener('click', ()=> msgModal.fileInput?.click());
  msgModal.fileInput?.addEventListener('change', (e)=>{
    const files = validateFiles(e.target.files || []);
    msgModal.attachments = msgModal.attachments.concat(files).slice(0,5);
    renderMsgModalFiles();
    msgModal.fileInput.value = '';
  });
  function renderMsgModalFiles(){
    msgModal.filesWrap.innerHTML = '';
    msgModal.attachments.forEach((att, idx)=>{
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.innerHTML = `${esc(att.name)} <span style="opacity:.65">(${fmtBytes(att.size)})</span> <button class="chip__x" type="button" aria-label="Remove">×</button>`;
      chip.querySelector('.chip__x').addEventListener('click', ()=>{
        msgModal.attachments.splice(idx,1);
        renderMsgModalFiles();
      });
      msgModal.filesWrap.appendChild(chip);
    });
  }

  // Send from modal
  msgModal.btnSend?.addEventListener('click', ()=>{
    if (msgModal.mode === 'edit'){
      // Save recipients only
      const selected = Array.from(msgModal.list.querySelectorAll('input[type="checkbox"]:checked')).map(cb=> cb.value);
      if (selected.length === 0){ toast('Choose at least one recipient'); return; }
      const threads = getThreads();
      const t = threads.find(x=> x.id === msgModal.threadId);
      if (!t) return;
      t.recipients = selected;
      setThreads(threads);
      if (currentThreadId === t.id) renderFeed(t);
      renderThreadList(msgSearch.value.trim());
      msgModal.close();
      toast('Recipients updated');
      return;
    }

    // New message
    const selected = Array.from(msgModal.list.querySelectorAll('input[type="checkbox"]:checked')).map(cb=> cb.value);
    const subject = msgModal.subject.value.trim();
    const text = msgModal.text.value.trim();
    if (selected.length === 0){ msgModal.status.textContent = 'Choose at least one recipient.'; toast('Choose at least one recipient'); return; }
    if (!text && msgModal.attachments.length===0){ msgModal.status.textContent = 'Write a message or attach files.'; toast('Write a message or attach files'); return; }

    const id = 't-'+Math.random().toString(36).slice(2,8);
    const now = Date.now();
    const t = {
      id, subject, recipients:selected, unread:0, updated: now,
      messages: [{ id:'m-'+Math.random().toString(36).slice(2,8), me:true, author:'You', text: text || '(no message)', ts:now, attachments: msgModal.attachments.slice() }]
    };
    const list = getThreads();
    list.unshift(t);
    setThreads(list);
    renderThreadList(msgSearch.value.trim());
    selectThread(id);
    msgModal.close();
    msgModal.subject.value = '';
    msgModal.text.value = '';
    msgModal.attachments = [];
    msgModal.filesWrap.innerHTML = '';
    toast('Message sent');
  });

  // Edit recipients from thread header
  editRecipientsBtn?.addEventListener('click', ()=>{
    const t = getThreads().find(x=> x.id === currentThreadId);
    if (!t) return;
    msgModal.open('edit', t);
  });

  function initMessaging(){
    seedThreadsIfEmpty();
    renderThreadList();
    updateUnreadBadge();
    // Deep link: ?thread=ID or #messages selects first thread
    const params = new URLSearchParams(location.search);
    const wanted = params.get('thread');
    if (wanted && getThreads().some(t=> t.id===wanted)){
      selectThread(wanted);
    } else if (location.hash === '#messages'){
      const first = getThreads()[0];
      if (first) selectThread(first.id);
    }
  }

  // Render history on load
  renderHistory();

  // Init messaging on load
  initMessaging();

  // Deep link subnav
  if (location.hash) setActiveLink(location.hash);

  console.log('Recommender portal initialised successfully');

  // ---------- Advanced Dashboard Features ----------
  
  // Enhanced search functionality
  const searchInput = $('.search-input');
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        const query = e.target.value.toLowerCase().trim();
        // Simulate search results
        if (query) {
          toast(`Searching for "${query}"...`);
        }
      }, 300);
    });

    // Expand search on focus
    searchInput.addEventListener('focus', () => {
      searchInput.style.width = '280px';
    });
    
    searchInput.addEventListener('blur', () => {
      if (!searchInput.value) {
        searchInput.style.width = '200px';
      }
    });
  }

  // Quick action buttons
  const quickActionBtns = $$('.quick-action-btn');
  quickActionBtns.forEach((btn, index) => {
    btn.addEventListener('click', () => {
      const actions = ['Upload Letter', 'Send Message', 'Check Deadlines', 'View Profile'];
      const action = actions[index] || 'Action';
      toast(`${action} clicked`);
      
      // Add visual feedback
      btn.style.transform = 'scale(1.15)';
      setTimeout(() => {
        btn.style.transform = '';
      }, 200);

      // Navigate to relevant sections
      const targets = ['#upload', '#messages', '#requests', '#profile'];
      if (targets[index]) {
        const section = $(targets[index]);
        if (section) {
          section.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  // View toggle buttons
  const viewToggleBtns = $$('.view-toggle button');
  viewToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      viewToggleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const isGrid = btn.title === 'Grid View';
      toast(isGrid ? 'Grid view enabled' : 'List view enabled');
    });
  });

  // Filter dropdowns
  const filterSelects = $$('.filter-select');
  filterSelects.forEach(select => {
    select.addEventListener('change', (e) => {
      const filter = e.target.value;
      toast(`Filter applied: ${filter}`);
      
      // Add visual feedback to filtered items
      const pendingRows = $$('.pending-row');
      pendingRows.forEach(row => {
        row.style.opacity = '1';
        row.style.display = '';
        
        if (filter === 'Urgent') {
          const deadline = row.querySelector('time');
          if (deadline) {
            const deadlineDate = new Date(deadline.getAttribute('datetime'));
            const daysDiff = (deadlineDate - new Date()) / (1000 * 60 * 60 * 24);
            if (daysDiff > 7) {
              row.style.opacity = '0.5';
            }
          }
        } else if (filter === 'Due Soon') {
          const deadline = row.querySelector('time');
          if (deadline) {
            const deadlineDate = new Date(deadline.getAttribute('datetime'));
            const daysDiff = (deadlineDate - new Date()) / (1000 * 60 * 60 * 24);
            if (daysDiff > 14) {
              row.style.opacity = '0.5';
            }
          }
        }
      });
    });
  });

  // Animate stat cards on load
  const statCards = $$('.stat-card');
  statCards.forEach((card, index) => {
    setTimeout(() => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      setTimeout(() => {
        card.style.transition = 'all 0.6s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, 100);
    }, index * 150);
  });

  // Control button interactions
  const controlButtons = $$('.control-button');
  controlButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const title = btn.getAttribute('title');
      toast(`${title} panel opened`);
      
      // Animate badge if present
      const badge = btn.querySelector('.badge');
      if (badge) {
        badge.style.animation = 'none';
        setTimeout(() => {
          badge.style.animation = 'pulse 2s infinite';
        }, 100);
      }
    });
  });

  // Subnav badge interactions
  const subnnavBadges = $$('.subnav-nav .badge');
  subnnavBadges.forEach(badge => {
    badge.addEventListener('click', (e) => {
      e.preventDefault();
      const href = badge.getAttribute('href');
      const section = $(href);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
        
        // Update active badge
        subnnavBadges.forEach(b => b.classList.remove('active'));
        badge.classList.add('active');
      }
    });
  });

  // Enhanced keyboard navigation
  document.addEventListener('keydown', (e) => {
    // Alt + S for search
    if (e.altKey && e.key === 's') {
      e.preventDefault();
      searchInput?.focus();
    }
    
    // Alt + U for upload
    if (e.altKey && e.key === 'u') {
      e.preventDefault();
      const uploadSection = $('#upload');
      if (uploadSection) {
        uploadSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
    
    // Alt + 1-4 for quick actions
    if (e.altKey && e.key >= '1' && e.key <= '4') {
      e.preventDefault();
      const index = parseInt(e.key) - 1;
      quickActionBtns[index]?.click();
    }
  });

  // Enhanced pending row interactions
  const pendingRows = $$('.pending-row');
  pendingRows.forEach(row => {
    // Add hover effects
    row.addEventListener('mouseenter', () => {
      row.style.transform = 'translateX(4px)';
      row.style.backgroundColor = 'var(--surface-solid)';
    });
    
    row.addEventListener('mouseleave', () => {
      row.style.transform = '';
      row.style.backgroundColor = '';
    });

    // Add click to prefill functionality
    row.addEventListener('click', () => {
      const studentName = row.getAttribute('data-student');
      const program = row.getAttribute('data-program');
      const reqId = row.getAttribute('data-req-id');
      
      // Prefill upload form
      const studentNameField = $('#studentName');
      const programField = $('#program');
      const reqIdField = $('#reqId');
      
      if (studentNameField) studentNameField.value = studentName;
      if (programField) programField.value = program;
      if (reqIdField) reqIdField.value = reqId;
      
      // Scroll to upload section
      const uploadSection = $('#upload');
      if (uploadSection) {
        uploadSection.scrollIntoView({ behavior: 'smooth' });
      }
      
      toast(`Form prefilled for ${studentName}`);
    });
  });

  // Add smooth scrolling to all internal links
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = $(link.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  } // End of initRecommenderPortal function

})();

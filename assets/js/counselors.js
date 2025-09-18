/* Flow | counselors.js
 * Enhances Counselor Messaging with:
 * - Multi-recipient selection (chips UI)
 * - File attachments (<=5 files, <=10MB each)
 * - Thread list, message feed, previews, unread counts
 * - Canned templates picker
 * - LocalStorage persistence (no backend)
 */

(() => {
  // STRICT Authentication Guard - Counselors only, no fallback
  if (!window.FlowAuthGuards) {
    console.error('❌ Auth system required for counselors portal');
    document.body.innerHTML = '<div style="padding: 2rem; text-align: center; font-family: Arial, sans-serif;"><h1>🔒 Counselors Portal</h1><p>Please log in to access the counselors portal.</p><a href="/" style="color: #5a5bb8;">Return to Home</a></div>';
    return;
  }

  window.FlowAuthGuards.counselorGuard(function(user) {
    console.log('✅ Counselor access granted:', user.fullName);
    initCounselorPortal();
  });

  function initCounselorPortal() {
  'use strict';

  // ---------- tiny helpers ----------
  const $ = (s, c=document) => c.querySelector(s);
  const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));
  const esc = (str='') => str.replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
  const fmtBytes = n => n<1024?`${n} B`:n<1048576?`${(n/1024).toFixed(1)} KB`:`${(n/1048576).toFixed(2)} MB`;
  const relTime = (ts) => {
    const diff = Date.now() - ts;
    const m = Math.floor(diff/60000), h = Math.floor(m/60), d = Math.floor(h/24);
    if (m<1) return 'now';
    if (m<60) return `${m}m ago`;
    if (h<24) return `${h}h ago`;
    return `${d}d ago`;
  };

  // ---------- light styles (chips, feed, pills, menu) ----------
  const style = document.createElement('style');
  style.textContent = `
    .msg-feed{border:1px solid #e5e7eb;border-radius:.75rem;padding:.6rem;max-height:48vh;overflow:auto;background:#fafafa}
    .msg{max-width:78%;margin:.4rem 0;padding:.45rem .6rem;border:1px solid #e5e7eb;border-radius:.75rem;background:#fff}
    .msg--me{margin-left:auto;background:#4f46e5;color:#fff;border-color:#4f46e5}
    .msg__meta{display:block;margin-top:.2rem;font-size:.75rem;opacity:.85}
    .msg__attachments{display:flex;gap:.3rem;flex-wrap:wrap;margin-top:.35rem}
    .pill{display:inline-flex;align-items:center;gap:.35rem;border:1px solid #e5e7eb;border-radius:999px;padding:.1rem .45rem;background:#fff;font-size:.82rem}
    .chips{display:flex;gap:.35rem;flex-wrap:wrap;margin-top:.35rem}
    .chip{display:inline-flex;align-items:center;gap:.35rem;background:#eef2ff;border:1px solid #e5e7eb;border-radius:999px;padding:.1rem .5rem;font-size:.82rem}
    .chip__x{background:none;border:none;cursor:pointer;line-height:1;font-weight:700}
    .thread{display:flex;justify-content:space-between;gap:.5rem;padding:.5rem .6rem;border-bottom:1px solid #f3f4f6;cursor:pointer}
    .thread:hover{background:#f9fafb}
    .thread--active{background:#eef2ff}
    .thread__title{font-weight:600}
    .thread__preview{color:#6b7280;font-size:.9rem}
    .thread__time{color:#6b7280;font-size:.75rem;white-space:nowrap}
    .thread__unread{background:#ef4444;color:#fff;border-radius:999px;padding:0 .35rem;font-size:.72rem;align-self:flex-start}
    .row{display:flex;gap:.5rem;align-items:center;flex-wrap:wrap}
    .menu{position:absolute;background:#fff;border:1px solid #e5e7eb;border-radius:.5rem;box-shadow:0 10px 30px rgba(0,0,0,.12);padding:.35rem;z-index:50}
    .menu button{display:block;width:100%;text-align:left;background:none;border:none;padding:.4rem .55rem;border-radius:.35rem;cursor:pointer}
    .menu button:hover{background:#f3f4f6}
  `;
  document.head.appendChild(style);

  // ---------- storage ----------
  const STORE_KEY = 'flow.counselor.threads.v1';
  const store = {
    get(){ try{ return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch{ return []; } },
    set(v){ try{ localStorage.setItem(STORE_KEY, JSON.stringify(v)); } catch{} },
  };

  // ---------- recipients directory ----------
  const DIRECTORY = [
    { id:'stu-jane',  name:'Jane Doe', role:'student' },
    { id:'stu-sam',   name:'Samuel Okoro', role:'student' },
    { id:'stu-adjoa', name:'Adjoa Mensah', role:'student' },
    { id:'adm-accra', name:'Admissions — University of Accra', role:'admissions' },
    { id:'adm-ati',   name:'Admissions — Abuja Tech Institute', role:'admissions' },
  ];

  const TEMPLATES = [
    'Quick check-in: how are you doing on this week’s tasks?',
    'Reminder: upcoming deadline next week — do you need any support?',
    'Great progress! Here are the next steps…',
    'Interview prep tips attached — schedule time if you want to rehearse.'
  ];

  // ---------- seed sample threads ----------
  function seedIfEmpty(){
    if (store.get().length) return;
    const now = Date.now();
    store.set([
      {
        id:'t-accra',
        recipients:['adm-accra'],
        subject:'Interview times for Jane Doe',
        unread:1,
        updated: now - 45*60*1000,
        messages:[
          { id:'m1', me:false, author:'Admissions — University of Accra', text:'Interview slots posted for next week (Tue/Wed).', ts: now - 2*60*60*1000, attachments:[] },
          { id:'m2', me:true, author:'You', text:'Thanks! Wednesday 2pm works for Jane.', ts: now - 45*60*1000, attachments:[] },
        ]
      },
      {
        id:'t-adjoa',
        recipients:['stu-adjoa'],
        subject:'Transcript upload',
        unread:0,
        updated: now - 20*60*1000,
        messages:[
          { id:'m3', me:false, author:'Adjoa Mensah', text:'I’ll upload the transcript tonight.', ts: now - 20*60*1000, attachments:[] }
        ]
      }
    ]);
  }

  // ---------- DOM grab ----------
  const threadsCard = $('#messageThreads')?.closest('.card'); // left card
  const threadsList = $('#messageThreads');
  const form = $('#messageForm');
  const select = $('#recipientSelect');
  const text = $('#messageText');
  const sendBtn = $('#sendMessage');
  const templateBtn = $('#useTemplate');
  const studentsTable = $('#studentsTable');
  const studentFilter = $('#studentFilter');
  const exportCsvBtn = $('#exportCsv');

  if (!threadsList || !form || !select || !text || !sendBtn) {
    console.warn('counselors.js: Messaging DOM not found. Nothing to do.');
    return;
  }

  // enrich UI: multi-select, chips, attach button, file input, chips area, feed area
  select.setAttribute('multiple', 'multiple');
  const helpSmall = document.createElement('small');
  helpSmall.className = 'text--muted';
  helpSmall.textContent = 'Tip: Select multiple recipients (Ctrl/Cmd + click).';
  select.parentElement.appendChild(helpSmall);

  // replace select options from DIRECTORY to keep consistent
  select.innerHTML = DIRECTORY
    .filter(r=> r.role !== 'admissions' || true) // include all
    .map(r=> `<option value="${esc(r.id)}">${esc(r.name)}</option>`).join('');

  // chips line for selected recipients
  const chips = document.createElement('div');
  chips.className = 'chips';
  select.parentElement.appendChild(chips);

  // file widgets
  const attachBtn = document.createElement('button');
  attachBtn.type = 'button';
  attachBtn.className = 'btn btn--ghost';
  attachBtn.id = 'attachFiles';
  attachBtn.textContent = 'Attach files';
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.multiple = true;
  fileInput.accept = 'application/pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  fileInput.style.display = 'none';
  const fileChips = document.createElement('div');
  fileChips.className = 'chips';
  fileChips.style.marginTop = '.35rem';
  // insert next to existing buttons row
  const buttonsRow = form.querySelector('.mt-4');
  buttonsRow.insertBefore(attachBtn, templateBtn);
  form.appendChild(fileInput);
  buttonsRow.insertAdjacentElement('afterend', fileChips);
  const filesNote = document.createElement('div');
  filesNote.className = 'text--muted';
  filesNote.style.fontSize = '.8rem';
  filesNote.textContent = 'Max 5 files, up to 10MB each.';
  fileChips.insertAdjacentElement('afterend', filesNote);

  // conversation feed container (below the Threads list)
  const feedWrap = document.createElement('div');
  const feedTitle = document.createElement('h3');
  feedTitle.textContent = 'Conversation';
  const feed = document.createElement('div');
  feed.className = 'msg-feed';
  feed.id = 'messageFeed';
  feedWrap.appendChild(feedTitle);
  feedWrap.appendChild(feed);
  threadsCard.appendChild(feedWrap);

  // ---------- state ----------
  let currentThreadId = null;
  let draftFiles = []; // {name,size,type}
  function getThreads(){ return store.get(); }
  function setThreads(v){ store.set(v); }

  // ---------- chips UI for recipients ----------
  function updateRecipientChips(){
    chips.innerHTML = '';
    const selected = Array.from(select.selectedOptions).map(o=> o.value);
    selected.forEach(id=>{
      const r = DIRECTORY.find(x=> x.id === id);
      if (!r) return;
      const c = document.createElement('span');
      c.className = 'chip';
      c.innerHTML = `${esc(r.name)} <button class="chip__x" type="button" aria-label="Remove">×</button>`;
      c.querySelector('button').addEventListener('click', ()=>{
        // unselect this recipient
        Array.from(select.options).forEach(o=> { if (o.value === id) o.selected = false; });
        updateRecipientChips();
      });
      chips.appendChild(c);
    });
  }
  select.addEventListener('change', updateRecipientChips);
  // pick Jane by default for convenience
  Array.from(select.options).forEach(o=> { if (o.value === 'stu-jane') o.selected = true; });
  updateRecipientChips();

  // ---------- attachments ----------
  function validateFiles(list, maxCountLeft){
    const out = [];
    for (const f of list){
      if (out.length >= maxCountLeft) break;
      if (f.size > 10*1024*1024){ toast(`"${f.name}" is larger than 10MB`); continue; }
      out.push({ name:f.name, size:f.size, type:f.type });
    }
    return out;
  }
  function renderFileChips(){
    fileChips.innerHTML = '';
    draftFiles.forEach((att, idx)=>{
      const c = document.createElement('span');
      c.className = 'chip';
      c.innerHTML = `${esc(att.name)} <span style="opacity:.65">(${fmtBytes(att.size)})</span> <button class="chip__x" aria-label="Remove" type="button">×</button>`;
      c.querySelector('button').addEventListener('click', ()=>{
        draftFiles.splice(idx,1);
        renderFileChips();
      });
      fileChips.appendChild(c);
    });
  }
  attachBtn.addEventListener('click', ()=> fileInput.click());
  fileInput.addEventListener('change', (e)=>{
    const files = validateFiles(e.target.files || [], 5 - draftFiles.length);
    draftFiles = draftFiles.concat(files);
    renderFileChips();
    fileInput.value = '';
  });

  // ---------- toasts ----------
  const toastBox = document.createElement('div');
  toastBox.style.cssText = 'position:fixed;top:1rem;right:1rem;display:flex;flex-direction:column;gap:.5rem;z-index:9999';
  document.body.appendChild(toastBox);
  function toast(msg, t=2200){
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = 'background:#111827;color:#fff;padding:.45rem .6rem;border-radius:.5rem;box-shadow:0 6px 20px rgba(0,0,0,.2);font-size:.9rem';
    toastBox.appendChild(el);
    setTimeout(()=> el.remove(), t);
  }

  // ---------- threads list + feed ----------
  function threadTitle(t){
    const names = t.recipients.map(id => DIRECTORY.find(r=> r.id===id)?.name || '').filter(Boolean);
    return (t.subject ? `${t.subject}` : names.join(', ') || 'Conversation');
  }
  function lastMsg(t){ return t.messages[t.messages.length-1]; }
  function renderThreads(){
    const list = getThreads().slice().sort((a,b)=> (b.updated||0) - (a.updated||0));
    threadsList.innerHTML = '';
    if (!list.length){
      const li = document.createElement('li');
      li.className = 'text--muted';
      li.textContent = 'No conversations yet';
      threadsList.appendChild(li);
      return;
    }
    list.forEach(t=>{
      const li = document.createElement('li');
      li.className = 'thread' + (t.id===currentThreadId ? ' thread--active':'');
      li.dataset.id = t.id;
      const last = lastMsg(t);
      li.innerHTML = `
        <div style="flex:1;min-width:0">
          <div class="row" style="justify-content:space-between">
            <span class="thread__title" title="${esc(threadTitle(t))}">${esc(threadTitle(t))}</span>
            <span class="thread__time">${last ? esc(relTime(last.ts)) : ''}</span>
          </div>
          <div class="thread__preview">${last ? esc(last.text) : ''}</div>
        </div>
        ${t.unread ? `<span class="thread__unread">${t.unread}</span>` : ''}
      `;
      li.addEventListener('click', ()=> selectThread(t.id));
      threadsList.appendChild(li);
    });
  }
  function pill(att){
    return `<span class="pill" title="${esc(att.name)} (${fmtBytes(att.size)})">
      <svg width="12" height="12" aria-hidden="true" fill="currentColor"><path d="M9.5 2.7a.5.5 0 1 0 1 0V.8a.5.5 0 0 0-1 0v1.9zM3.5 6a3.5 3.5 0 0 1 7 0v5a2.5 2.5 0 0 1-5 0V6a1.5 1.5 0 0 1 3 0v4.5a.5.5 0 0 1-1 0V6a.5.5 0 0 0-1 0v4.5a2.5 2.5 0 1 0 5 0V6a2.5 2.5 0 1 0-5 0v5a.5.5 0 0 0 1 0V6z"/></svg>
      <span>${esc(att.name)}</span><span style="opacity:.65">(${fmtBytes(att.size)})</span>
    </span>`;
  }
  function renderFeed(t){
    feed.innerHTML = '';
    if (!t){ feedTitle.textContent = 'Conversation'; return; }
    feedTitle.textContent = threadTitle(t);
    t.messages.forEach(m=>{
      const div = document.createElement('div');
      div.className = 'msg' + (m.me ? ' msg--me':'');
      div.innerHTML = `
        <div>${esc(m.text)}</div>
        ${m.attachments?.length ? `<div class="msg__attachments">${m.attachments.map(pill).join('')}</div>` : ''}
        <span class="msg__meta">${esc(m.author)} • ${new Date(m.ts).toLocaleTimeString()}</span>
      `;
      feed.appendChild(div);
    });
    feed.scrollTop = feed.scrollHeight;
  }
  function selectThread(id){
    const threads = getThreads();
    const t = threads.find(x=> x.id===id);
    if (!t) return;
    currentThreadId = id;
    // mark read
    if (t.unread) { t.unread = 0; setThreads(threads); }
    renderThreads();
    renderFeed(t);
    // sync compose recipients with thread participants
    Array.from(select.options).forEach(o=> o.selected = t.recipients.includes(o.value));
    updateRecipientChips();
    text.focus();
  }

  // ---------- compose send ----------
  function normalizeSet(ids){ return ids.slice().sort().join('|'); }

  sendBtn.addEventListener('click', (e)=>{
    e.preventDefault();
    const recipients = Array.from(select.selectedOptions).map(o=> o.value);
    const body = text.value.trim();
    if (!recipients.length){ toast('Choose at least one recipient'); return; }
    if (!body && draftFiles.length===0){ toast('Write a message or attach files'); return; }

    // find existing thread by recipients set; else create new
    const threads = getThreads();
    const key = normalizeSet(recipients);
    let t = threads.find(x=> normalizeSet(x.recipients) === key);
    const now = Date.now();
    const msg = { id:'m-'+Math.random().toString(36).slice(2,8), me:true, author:'You', text: body || '(no message)', ts: now, attachments: draftFiles.slice() };

    if (!t){
      t = { id:'t-'+Math.random().toString(36).slice(2,8), recipients: recipients.slice(), subject:'', unread:0, updated: now, messages:[msg] };
      threads.unshift(t);
    } else {
      t.messages.push(msg);
      t.updated = now;
    }
    setThreads(threads);
    renderThreads();
    renderFeed(t);
    currentThreadId = t.id;

    // reset draft
    text.value = '';
    draftFiles = [];
    renderFileChips();
    toast('Message sent');

    // demo auto-reply
    setTimeout(()=>{
      const nameList = t.recipients.map(id => DIRECTORY.find(r=> r.id===id)?.name || '').filter(Boolean).join(', ');
      const reply = { id:'m-'+Math.random().toString(36).slice(2,8), me:false, author:nameList || 'Recipient', text:'Thanks! Noted.', ts: Date.now(), attachments:[] };
      const list2 = getThreads();
      const t2 = list2.find(x=> x.id === t.id);
      if (!t2) return;
      t2.messages.push(reply);
      t2.updated = reply.ts;
      if (currentThreadId !== t2.id){ t2.unread = (t2.unread||0) + 1; }
      setThreads(list2);
      if (currentThreadId === t2.id) renderFeed(t2);
      renderThreads();
    }, 1000);
  });

  // ---------- templates menu ----------
  let menuEl = null;
  function closeMenu(){ if(menuEl){ menuEl.remove(); menuEl=null; } }
  templateBtn.addEventListener('click', (e)=>{
    e.preventDefault();
    if (menuEl) return closeMenu();
    menuEl = document.createElement('div');
    menuEl.className = 'menu';
    TEMPLATES.forEach(t=>{
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = t;
      b.addEventListener('click', ()=>{
        // insert template (append if text already present)
        text.value = text.value ? (text.value.trim() + '\n\n' + t) : t;
        text.focus();
        closeMenu();
      });
      menuEl.appendChild(b);
    });
    // position near button
    const r = templateBtn.getBoundingClientRect();
    menuEl.style.top = `${r.bottom + window.scrollY + 6}px`;
    menuEl.style.left = `${r.left + window.scrollX}px`;
    document.body.appendChild(menuEl);
  });
  document.addEventListener('click', (e)=>{
    if (menuEl && !menuEl.contains(e.target) && e.target !== templateBtn) closeMenu();
  });
  document.addEventListener('keydown', (e)=> { if (e.key === 'Escape') closeMenu(); });

  // ---------- init ----------
  function init(){
    // current year for footer
    $('#year')?.textContent = new Date().getFullYear();
    seedIfEmpty();
    renderThreads();
    renderFeed(null);

    // Students quick filter
    if (studentsTable && studentFilter){
      const rows = Array.from(studentsTable.querySelectorAll('[role="row"]')).slice(1); // skip header
      function applyFilter(){
        const q = (studentFilter.value || '').toLowerCase().trim();
        rows.forEach(r => {
          const text = r.textContent.toLowerCase();
          r.style.display = !q || text.includes(q) ? '' : 'none';
        });
      }
      studentFilter.addEventListener('input', applyFilter);
    }

    // Export CSV of visible students
    if (studentsTable && exportCsvBtn){
      exportCsvBtn.addEventListener('click', ()=>{
        const rows = Array.from(studentsTable.querySelectorAll('[role="row"]'));
        const header = rows[0];
        const bodyRows = rows.slice(1).filter(r => r.style.display !== 'none');
        function cellsText(row){
          return Array.from(row.querySelectorAll('[role="cell"], [role="columnheader"]')).map(c=>{
            // Prefer text from badges/time
            const time = c.querySelector('time');
            if (time) return time.getAttribute('datetime') || time.textContent.trim();
            return c.textContent.replace(/\s+/g,' ').trim();
          });
        }
        const data = [cellsText(header), ...bodyRows.map(cellsText)]
          .map(cols => cols.slice(0,4) // exclude Action column
            .map(v => '"' + v.replace(/"/g,'""') + '"').join(','))
          .join('\n');
        const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'counselor-students.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast('CSV exported');
      });
    }
  }
  init();

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
      const actions = ['Add Student', 'Send Message', 'Schedule Meeting', 'Export Report'];
      const action = actions[index] || 'Action';
      toast(`${action} clicked`);
      
      // Add visual feedback
      btn.style.transform = 'scale(1.2)';
      setTimeout(() => {
        btn.style.transform = '';
      }, 200);
    });
  });

  // View toggle buttons
  const viewToggleBtns = $$('.view-toggle button');
  viewToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      viewToggleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const isGrid = btn.title === 'Grid View';
      const studentsTable = $('#studentsTable');
      if (studentsTable) {
        studentsTable.style.display = isGrid ? 'grid' : 'block';
        toast(isGrid ? 'Grid view enabled' : 'List view enabled');
      }
    });
  });

  // Filter dropdowns
  const filterSelects = $$('.filter-select');
  filterSelects.forEach(select => {
    select.addEventListener('change', (e) => {
      const filter = e.target.value;
      toast(`Filter applied: ${filter}`);
      
      // Add visual feedback to filtered items
      const rows = Array.from(studentsTable?.querySelectorAll('[role="row"]') || []).slice(1);
      rows.forEach(row => {
        row.style.opacity = '1';
        if (filter === 'At Risk' && !row.querySelector('.badge.red')) {
          row.style.opacity = '0.5';
        } else if (filter === 'Action Needed' && !row.querySelector('.badge.yellow')) {
          row.style.opacity = '0.5';
        } else if (filter === 'Overdue') {
          const dateCell = row.querySelector('time');
          if (dateCell && new Date(dateCell.getAttribute('datetime')) > new Date()) {
            row.style.opacity = '0.5';
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

  // Status list hover effects
  const statusItems = $$('.status-list li');
  statusItems.forEach(item => {
    item.addEventListener('mouseenter', () => {
      const badge = item.querySelector('.badge');
      if (badge) {
        badge.style.transform = 'scale(1.1)';
      }
    });
    
    item.addEventListener('mouseleave', () => {
      const badge = item.querySelector('.badge');
      if (badge) {
        badge.style.transform = 'scale(1)';
      }
    });
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
    
    // Alt + 1-4 for quick actions
    if (e.altKey && e.key >= '1' && e.key <= '4') {
      e.preventDefault();
      const index = parseInt(e.key) - 1;
      quickActionBtns[index]?.click();
    }
  });

  // ---------- Profile and Settings Functionality ----------
  
  // Profile form handling
  const saveProfileBtn = $('#saveProfile');
  const cancelProfileBtn = $('#cancelProfile');
  const profileForm = $('#profileForm');
  
  if (saveProfileBtn && profileForm) {
    saveProfileBtn.addEventListener('click', () => {
      const formData = new FormData(profileForm);
      const profileData = Object.fromEntries(formData);
      
      // Simulate saving to backend
      toast('Profile updated successfully');
      
      // Update user avatar in header if name changed
      const fullName = $('#fullName')?.value;
      if (fullName) {
        const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase();
        const userAvatar = $('.user-avatar');
        if (userAvatar) {
          userAvatar.textContent = initials;
        }
      }
    });
    
    cancelProfileBtn?.addEventListener('click', () => {
      profileForm.reset();
      toast('Changes cancelled');
    });
  }

  // Profile picture upload
  const uploadPictureBtn = $('#uploadPicture');
  const profilePictureInput = $('#profilePicture');
  const removePictureBtn = $('#removePicture');
  
  if (uploadPictureBtn && profilePictureInput) {
    uploadPictureBtn.addEventListener('click', () => {
      profilePictureInput.click();
    });
    
    profilePictureInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          toast('File size must be less than 5MB');
          return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
          const profileAvatar = $('.profile-avatar.large');
          if (profileAvatar) {
            profileAvatar.style.backgroundImage = `url(${e.target.result})`;
            profileAvatar.style.backgroundSize = 'cover';
            profileAvatar.style.backgroundPosition = 'center';
            profileAvatar.textContent = '';
          }
          toast('Profile picture updated');
        };
        reader.readAsDataURL(file);
      }
    });
    
    removePictureBtn?.addEventListener('click', () => {
      const profileAvatar = $('.profile-avatar.large');
      if (profileAvatar) {
        profileAvatar.style.backgroundImage = '';
        profileAvatar.textContent = 'JD';
      }
      profilePictureInput.value = '';
      toast('Profile picture removed');
    });
  }

  // Bio form handling
  const saveBioBtn = $('#saveBio');
  if (saveBioBtn) {
    saveBioBtn.addEventListener('click', () => {
      toast('Bio and expertise updated');
    });
  }

  // Settings forms handling
  const saveNotificationsBtn = $('#saveNotifications');
  const savePrivacyBtn = $('#savePrivacy');
  const savePreferencesBtn = $('#savePreferences');
  const resetPreferencesBtn = $('#resetPreferences');
  
  if (saveNotificationsBtn) {
    saveNotificationsBtn.addEventListener('click', () => {
      toast('Notification preferences saved');
    });
  }
  
  if (savePrivacyBtn) {
    savePrivacyBtn.addEventListener('click', () => {
      toast('Privacy settings updated');
    });
  }
  
  if (savePreferencesBtn) {
    savePreferencesBtn.addEventListener('click', () => {
      const language = $('#dashboardLanguage')?.value;
      const timeZone = $('#timeZone')?.value;
      
      // Apply preferences immediately
      if (language && language !== 'en') {
        toast(`Language changed to ${language.toUpperCase()}`);
      }
      
      toast('Preferences saved successfully');
    });
  }
  
  if (resetPreferencesBtn) {
    resetPreferencesBtn.addEventListener('click', () => {
      if (confirm('Reset all preferences to default values?')) {
        // Reset form values
        $('#dashboardLanguage').value = 'en';
        $('#timeZone').value = 'UTC';
        $('#pageSize').value = '25';
        $('#darkMode').checked = false;
        $('#compactMode').checked = false;
        $('#autoSave').checked = true;
        
        toast('Preferences reset to default');
      }
    });
  }

  // Password strength checker
  const newPasswordInput = $('#newPassword');
  const strengthFill = $('.strength-fill');
  const strengthLevel = $('#strengthLevel');
  
  if (newPasswordInput && strengthFill && strengthLevel) {
    newPasswordInput.addEventListener('input', (e) => {
      const password = e.target.value;
      const strength = calculatePasswordStrength(password);
      
      // Remove all strength classes
      strengthFill.className = 'strength-fill';
      
      if (password.length === 0) {
        strengthLevel.textContent = '-';
        return;
      }
      
      if (strength < 2) {
        strengthFill.classList.add('weak');
        strengthLevel.textContent = 'Weak';
        strengthLevel.style.color = 'var(--error-red)';
      } else if (strength < 3) {
        strengthFill.classList.add('medium');
        strengthLevel.textContent = 'Medium';
        strengthLevel.style.color = 'var(--warning-yellow)';
      } else if (strength < 4) {
        strengthFill.classList.add('strong');
        strengthLevel.textContent = 'Strong';
        strengthLevel.style.color = 'var(--accent-blue)';
      } else {
        strengthFill.classList.add('very-strong');
        strengthLevel.textContent = 'Very Strong';
        strengthLevel.style.color = 'var(--success-green)';
      }
    });
  }

  function calculatePasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.match(/[a-z]/)) score++;
    if (password.match(/[A-Z]/)) score++;
    if (password.match(/[0-9]/)) score++;
    if (password.match(/[^a-zA-Z0-9]/)) score++;
    return score;
  }

  // Change password functionality
  const changePasswordBtn = $('#changePassword');
  const currentPasswordInput = $('#currentPassword');
  const confirmPasswordInput = $('#confirmPassword');
  
  if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', () => {
      const currentPassword = currentPasswordInput?.value;
      const newPassword = newPasswordInput?.value;
      const confirmPassword = confirmPasswordInput?.value;
      
      if (!currentPassword || !newPassword || !confirmPassword) {
        toast('Please fill in all password fields');
        return;
      }
      
      if (newPassword !== confirmPassword) {
        toast('New passwords do not match');
        return;
      }
      
      if (calculatePasswordStrength(newPassword) < 2) {
        toast('Password is too weak');
        return;
      }
      
      // Simulate password change
      toast('Password changed successfully');
      
      // Clear form
      currentPasswordInput.value = '';
      newPasswordInput.value = '';
      confirmPasswordInput.value = '';
      
      // Reset strength meter
      strengthFill.className = 'strength-fill';
      strengthLevel.textContent = '-';
    });
  }

  // Download data functionality
  const downloadDataBtn = $('#downloadData');
  if (downloadDataBtn) {
    downloadDataBtn.addEventListener('click', () => {
      // Simulate data export
      const data = {
        profile: {
          name: $('#fullName')?.value,
          email: $('#email')?.value,
          phone: $('#phone')?.value,
          institution: $('#institution')?.value,
          department: $('#department')?.value,
          position: $('#position')?.value
        },
        settings: {
          notifications: {
            email: $('#emailNotifications')?.checked,
            tasks: $('#taskReminders')?.checked,
            updates: $('#studentUpdates')?.checked,
            reports: $('#weeklyReports')?.checked
          }
        },
        exportDate: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'my-flow-data.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      
      toast('Data export downloaded');
    });
  }

  // Dark mode toggle (simple implementation)
  const darkModeToggle = $('#darkMode');
  if (darkModeToggle) {
    darkModeToggle.addEventListener('change', (e) => {
      if (e.target.checked) {
        document.body.classList.add('dark-mode');
        toast('Dark mode enabled');
      } else {
        document.body.classList.remove('dark-mode');
        toast('Dark mode disabled');
      }
    });
  }

  } // End of initCounselorPortal function

})();

/* Flow Students — Help Center page logic */
(function () {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  window.Flow = window.Flow || {};
  Flow.store = Flow.store || {
    get(k, d=null){ try { const v = localStorage.getItem(k); return v?JSON.parse(v):d; } catch { return d; } },
    set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
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
      const remove = ()=>{ el.classList.remove('toast--visible'); setTimeout(()=> el.remove(), 300); };
      $('.toast__close', el)?.addEventListener('click', remove);
      if (duration>0) setTimeout(remove, duration);
      return el;
    }
  };

  // FAQ search + highlight
  function bindSearch(){
    const input = $('#helpSearch'); const list = $('#faqList');
    if (!input || !list) return;
    input.addEventListener('input', ()=>{
      const term = input.value.trim().toLowerCase();
      $$('.accordion__item', list).forEach(item=>{
        const sum = $('.accordion__summary', item);
        const content = $('.accordion__content', item);
        const text = (sum.textContent + ' ' + content.textContent).toLowerCase();
        const match = !term || text.includes(term);
        item.style.display = match ? '' : 'none';
        // naive highlight in summary only
        const raw = sum.textContent;
        if (!term) { sum.innerHTML = raw; return; }
        sum.innerHTML = raw.replace(new RegExp(`(${term})`, 'ig'), '<mark>$1</mark>');
      });
    });
  }

  // Tickets
  const KEY = 'flow.help.tickets.v1';
  function renderTickets(){
    const ul = $('#ticketsList'); if (!ul) return;
    const tickets = Flow.store.get(KEY, []) || [];
    ul.innerHTML = '';
    if (!tickets.length) {
      const li = document.createElement('li');
      li.className = 'muted';
      li.textContent = 'No tickets yet.';
      ul.appendChild(li);
      return;
    }
    tickets.sort((a,b)=> b.ts - a.ts).slice(0,6).forEach(t=>{
      const li = document.createElement('li');
      li.className = 'ticket';
      li.innerHTML = `
        <strong>#${t.id}</strong> • ${t.topic} • <span class="status-badge ${t.status==='Open'?'status-badge--warning':'status-badge--success'}">${t.status}</span>
        <div class="muted">${new Date(t.ts).toLocaleString()} — ${t.name} (${t.email})</div>
        <div>${t.msg.replace(/</g,'&lt;')}</div>
      `;
      ul.appendChild(li);
    });
  }

  function bindSupportForm(){
    const form = $('#supportForm'); if (!form) return;
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const name = $('#sfName')?.value.trim();
      const email = $('#sfEmail')?.value.trim();
      const topic = $('#sfTopic')?.value || 'General';
      const urgency = $('#sfUrgency')?.value || 'normal';
      const msg = $('#sfMsg')?.value.trim();
      if (!name || !email || !msg) { toast.show('Please fill in your name, email, and message.', 'warning'); return; }
      const id = Math.floor(100000 + Math.random()*899999);
      const tickets = Flow.store.get(KEY, []) || [];
      tickets.push({ id, ts: Date.now(), name, email, topic, urgency, msg, status: 'Open' });
      Flow.store.set(KEY, tickets);
      renderTickets();
      (e.target).reset();
      toast.show(`Ticket #${id} created — we’ll email you soon.`, 'success', 3500);
    });

    $('#copySupportEmail')?.addEventListener('click', async ()=>{
      try {
        await navigator.clipboard.writeText('support@flow.example');
        toast.show('support@flow.example copied to clipboard', 'success');
      } catch {
        toast.show('Could not copy. Email: support@flow.example', 'warning');
      }
    });
  }

  function init(){
    bindSearch();
    bindSupportForm();
    renderTickets();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

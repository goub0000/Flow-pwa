/* Flow Students — Finance page logic */
(function () {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  // Ensure shared Flow helpers exist (from students.js)
  window.Flow = window.Flow || {};
  Flow.store = Flow.store || {
    get(k, d = null) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };

  const toast = {
    container: $('#toast-container'),
    show(msg, type = 'info', duration = 3000) {
      if (!this.container) return;
      const el = document.createElement('div');
      el.className = 'toast' + (['success','warning','error'].includes(type) ? ` toast--${type}` : '');
      el.innerHTML = `<div class="toast__content"><span class="toast__message">${msg}</span><button class="toast__close" aria-label="Close">×</button></div>`;
      this.container.appendChild(el);
      requestAnimationFrame(() => el.classList.add('toast--visible'));
      const remove = () => { el.classList.remove('toast--visible'); setTimeout(() => el.remove(), 300); };
      $('.toast__close', el)?.addEventListener('click', remove);
      if (duration > 0) setTimeout(remove, duration);
      return el;
    }
  };

  // Currency from shared config
  Flow.currency = Flow.currency || {
    code: Flow.store.get('flow.currency', 'USD'),
    fx: { USD:1, EUR:0.92, GBP:0.78, KES:129, NGN:1600, GHS:15.5, TZS:2600, UGX:3800, ZAR:18.4 },
    set(code){ if(this.fx[code]){ this.code=code; Flow.store.set('flow.currency', code); this.apply(); } },
    to(amountUSD){ return (+amountUSD||0) * (this.fx[this.code]||1); },
    fmt(amountUSD){
      try { return new Intl.NumberFormat(document.documentElement.lang||'en',{style:'currency',currency:this.code}).format(this.to(amountUSD)); }
      catch { return `${this.code} ${this.to(amountUSD).toFixed(2)}`; }
    },
    apply(){ $$('[data-amount-usd]').forEach(el=> el.textContent = this.fmt(el.getAttribute('data-amount-usd'))); }
  };

  // Data will be loaded from Firestore via DataService
  // No hardcoded sample transactions
  const KEY = 'flow.finance.tx.v1';
  const seed = () => {
    if (Flow.store.get(KEY)) return;
    // Initialize with empty array - real data comes from Firestore
    Flow.store.set(KEY, []);
  };

  function fmtDate(ts){
    try { return new Intl.DateTimeFormat(document.documentElement.lang||'en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(ts)); }
    catch { return new Date(ts).toLocaleString(); }
  }

  function renderTable(){
    const tbody = $('#txTbody'); const empty = $('#txEmpty');
    const tx = Flow.store.get(KEY, []) || [];
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!tx.length) { empty?.removeAttribute('hidden'); return; }
    empty?.setAttribute('hidden','');

    tx.sort((a,b)=> b.ts - a.ts).forEach(row=>{
      const tr = document.createElement('tr');
      const amount = Flow.currency.fmt(row.usd);
      tr.innerHTML = `
        <td>${fmtDate(row.ts)}</td>
        <td>${row.desc}</td>
        <td class="ta-right">${amount}</td>
        <td>${row.method}</td>
        <td><span class="status-badge ${row.status==='Success'?'status-badge--success': row.status==='Pending'?'status-badge--warning':'status-badge--draft'}">${row.status}</span></td>
      `;
      tbody.appendChild(tr);
    });
  }

  function exportCSV(){
    const tx = Flow.store.get(KEY, []) || [];
    const rows = [['ID','Date','Description','Amount(USD)','Method','Status']]
      .concat(tx.map(t=>[t.id, new Date(t.ts).toISOString(), t.desc, t.usd, t.method, t.status]));
    const csv = rows.map(r=>r.map(f=>String(f).replace(/"/g,'""')).map(f=>`"${f}"`).join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'flow-transactions.csv';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  function simulatePayment(desc, usd){
    // Simulate Mobile Money sheet
    const method = 'Mobile Money';
    const id = 'TX-' + Math.floor(100000 + Math.random()*899999);
    const tx = Flow.store.get(KEY, []) || [];
    tx.push({ id, ts: Date.now(), desc, usd: +usd, method, status: 'Success' });
    Flow.store.set(KEY, tx);
    renderTable();
    toast.show('Payment successful ✔', 'success', 2500);
  }

  function bind(){
    // Currency apply on load & when settings change in shared UI
    Flow.currency.apply();
    const obs = new MutationObserver(()=> Flow.currency.apply());
    obs.observe(document.documentElement, { attributes:true, attributeFilter:['data-theme','data-motion','lang'] }); // re-apply on lang changes too

    $$('.pay-now').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const usd = btn.getAttribute('data-usd');
        const desc = btn.getAttribute('data-desc') || 'Payment';
        toast.show('Opening Mobile Money…', 'info', 1000);
        setTimeout(()=> simulatePayment(desc, usd), 900);
      });
    });

    $('#openPaySheet')?.addEventListener('click', ()=>{
      toast.show('Select an item to pay above, then choose a method.', 'info', 2500);
    });

    $('#exportTx')?.addEventListener('click', exportCSV);
  }

  function init(){
    seed();
    renderTable();
    bind();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

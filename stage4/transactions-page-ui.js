/* Income / Expenses page UI adapter */
(function(){
  const enhance=()=>{
    const root=document.getElementById('content'); if(!root||!root.querySelector('.summary-grid')) return;
    const head=root.querySelector('.page-head'), totals=root.querySelector('.summary-grid'), cards=[...root.children].filter(x=>x.classList.contains('card'));
    const add=cards.find(x=>x.querySelector('button[onclick*="openTransactionModal"]'));
    const tools=root.querySelector('.toolbar'), list=root.querySelector('.table-card');
    if(!totals||!add||!tools||!list) return;
    root.classList.add('tx-page');
    totals.classList.add('tx-total'); add.classList.add('tx-add'); tools.classList.add('tx-tools'); list.classList.add('tx-list');
    const title=add.querySelector('strong'); const sub=add.querySelector('strong')?.parentElement?.querySelector('div');
    if(title) title.classList.add('tx-add-title'); if(sub) sub.classList.add('tx-add-sub');
    const actions=add.querySelector('strong')?.parentElement?.nextElementSibling; if(actions) actions.classList.add('tx-add-actions');
    // Desired order: page heading, add transaction, totals, filters, transactions.
    [head,add,totals,tools,list].forEach(el=>{if(el) root.appendChild(el)});
  };
  const hook=()=>{ if(typeof window.renderTransactions!=='function') return setTimeout(hook,80); const original=window.renderTransactions; window.renderTransactions=function(){original.apply(this,arguments);setTimeout(enhance,0)}; if(window.state?.page==='transactions') setTimeout(enhance,0); };
  hook();
})();

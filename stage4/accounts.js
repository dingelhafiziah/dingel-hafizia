/* Stage 4 — Accounts summary (frontend only, Firebase-ready data layer) */
(function(){
  const money4=n=>'₹'+Number(n||0).toLocaleString('en-IN');
  const esc4=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  window.renderAccounts=function(){
    pageTitle.textContent='Accounts Overview';
    const income=state.transactions.filter(x=>x.type==='Income').reduce((a,x)=>a+Number(x.amount||0),0);
    const expense=state.transactions.filter(x=>x.type==='Expense').reduce((a,x)=>a+Number(x.amount||0),0);
    const due=state.fees.reduce((a,x)=>a+Number(x.due||0),0);
    content.innerHTML=`<div class="page-head"><div><h2>Accounts Overview</h2><p>Complete income, expense and outstanding fee summary.</p></div><button class="btn btn-primary" onclick="navigate('transactions')">+ New Entry</button></div><div class="summary-grid"><div class="card summary-card"><div class="stat-label">Total Income</div><div class="big">${money4(income)}</div></div><div class="card summary-card"><div class="stat-label">Total Expenses</div><div class="big">${money4(expense)}</div></div><div class="card summary-card"><div class="stat-label">Net Balance</div><div class="big">${money4(income-expense)}</div></div><div class="card summary-card"><div class="stat-label">Student Fee Due</div><div class="big">${money4(due)}</div></div></div><h2 class="section-title">All Transactions</h2><div class="card table-card"><div class="table-wrap"><table><thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Description</th><th>Amount</th></tr></thead><tbody>${state.transactions.length?state.transactions.map(x=>`<tr><td>${esc4(x.date)}</td><td><span class="badge ${x.type.toLowerCase()}">${esc4(x.type)}</span></td><td>${esc4(x.category)}</td><td>${esc4(x.description)||'—'}</td><td><strong>${money4(x.amount)}</strong></td></tr>`).join(''):`<tr><td colspan="5"><div class="empty"><strong>No transactions found</strong>Add an income or expense entry to begin.</div></td></tr>`}</tbody></table></div></div>`;
  };
  const originalRender=window.render;
  window.render=function(){if(state.page==='accounts') return renderAccounts(); return originalRender();};
  window.navigateAccounts=function(){navigate('accounts')};
})();

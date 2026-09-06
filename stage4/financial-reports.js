/* Dingel Hafizia App — Financial Reports */
(function(){
  const money=n=>{let c='₹';try{c=getAppSettings().currency||'₹'}catch(e){}return c+Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:0,maximumFractionDigits:2})};
  const monthKey=d=>String(d||'').slice(0,7);
  const escx=s=>typeof esc==='function'?esc(String(s??'')):String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  window.renderFinancialReports=function(){
    if(typeof canAccess==='function'&&!canAccess('transactions')){content.innerHTML='<div class="card empty"><strong>Access denied</strong><span>You do not have permission to view financial reports.</span></div>';return}
    const tx=Array.isArray(state.transactions)?state.transactions:[], now=new Date(), key=now.toISOString().slice(0,7), cur=tx.filter(x=>monthKey(x.date)===key);
    const sum=(arr,t)=>arr.filter(x=>x.type===t).reduce((s,x)=>s+Number(x.amount||0),0), inc=sum(cur,'Income'), exp=sum(cur,'Expense'), bal=inc-exp;
    const cats={};cur.forEach(x=>{const k=x.category||'Other';cats[k]=(cats[k]||0)+Number(x.amount||0)});
    const top=Object.entries(cats).sort((a,b)=>b[1]-a[1]).slice(0,8);
    content.innerHTML=`<div class="page-head"><div><h2>Financial Reports</h2><p>Income, expense and category-wise financial summary.</p></div></div><div class="summary-grid fr-summary"><div class="card summary-card"><div class="stat-label">MONTHLY INCOME</div><div class="big">${money(inc)}</div></div><div class="card summary-card"><div class="stat-label">MONTHLY EXPENSE</div><div class="big">${money(exp)}</div></div><div class="card summary-card"><div class="stat-label">NET BALANCE</div><div class="big">${money(bal)}</div></div></div><div class="card fr-card"><div class="fr-head"><div><strong>Category Summary</strong><small>Current month</small></div></div><div class="fr-list">${top.length?top.map(([name,v])=>`<div class="fr-row"><span>${escx(name)}</span><strong>${money(v)}</strong></div>`).join(''):'<div class="empty"><strong>No data yet</strong><span>Add income or expense transactions to generate the report.</span></div>'}</div></div><div class="card fr-card"><div class="fr-head"><div><strong>Transaction Overview</strong><small>${cur.length} transaction${cur.length===1?'':'s'} this month</small></div></div><div class="fr-actions"><button class="btn btn-light" onclick="renderTransactions()">View Transactions</button><button class="btn btn-primary" onclick="openTransactionModal('','Income')">＋ Add Income</button><button class="btn btn-light" onclick="openTransactionModal('','Expense')">− Add Expense</button></div></div>`;
  };
})();

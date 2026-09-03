/* Stage 4 — Module integration layer. Keeps the current frontend modules connected without Firebase. */
(function(){
  const moneyI=n=>'₹'+Number(n||0).toLocaleString('en-IN');
  const originalRender=window.render;
  window.render=function(){
    if(state.page==='dashboard') return renderIntegratedDashboard();
    return originalRender();
  };

  function renderIntegratedDashboard(){
    const income=state.transactions.filter(x=>x.type==='Income').reduce((a,x)=>a+Number(x.amount||0),0);
    const expense=state.transactions.filter(x=>x.type==='Expense').reduce((a,x)=>a+Number(x.amount||0),0);
    const due=state.fees.reduce((a,x)=>a+Number(x.due||0),0);
    const teachers=Array.isArray(state.teachers)?state.teachers.filter(x=>(x.status||'Active')==='Active').length:0;
    const s=typeof getAppSettings==='function'?getAppSettings():{};
    const name=s.madrasaName||'Dingel Hafizia Madrasa';
    content.innerHTML=`<div class="hero"><div><span class="eyebrow">${esc(name).toUpperCase()}</span><h2>Welcome to ${esc(name)}</h2><p>Management overview — all current frontend data is connected through the shared local data layer.</p></div><div class="hero-mark">DH</div></div><h2 class="section-title">Overview</h2><div class="grid"><div class="card"><div class="stat-label">Total Income</div><div class="stat-value">${moneyI(income)}</div><div class="stat-note">All recorded income</div></div><div class="card"><div class="stat-label">Total Expenses</div><div class="stat-value">${moneyI(expense)}</div><div class="stat-note">All recorded expenses</div></div><div class="card"><div class="stat-label">Students</div><div class="stat-value">${state.students.length}</div><div class="stat-note">Student profiles</div></div><div class="card"><div class="stat-label">Fee Due</div><div class="stat-value">${moneyI(due)}</div><div class="stat-note">Outstanding amount</div></div><div class="card"><div class="stat-label">Active Teachers</div><div class="stat-value">${teachers}</div><div class="stat-note">Current teacher records</div></div><div class="card"><div class="stat-label">Net Balance</div><div class="stat-value">${moneyI(income-expense)}</div><div class="stat-note">Income minus expenses</div></div></div><h2 class="section-title">Quick Access</h2><div class="module-grid"><button class="card module-card" onclick="navigate('students')"><div><h3>Students</h3><p>Profiles and student information</p></div><div class="module-icon">♙</div></button><button class="card module-card" onclick="navigate('fees')"><div><h3>Student Fees</h3><p>Payments, dues and receipts</p></div><div class="module-icon">▤</div></button><button class="card module-card" onclick="navigate('accounts')"><div><h3>Accounts</h3><p>Income, expenses and balance</p></div><div class="module-icon">৳</div></button><button class="card module-card" onclick="navigate('teachers')"><div><h3>Teachers</h3><p>Teacher records and status</p></div><div class="module-icon">♟</div></button><button class="card module-card" onclick="navigate('settings')"><div><h3>Settings</h3><p>Edit app and madrasa information</p></div><div class="module-icon">⚙</div></button></div>`;
  }
})();

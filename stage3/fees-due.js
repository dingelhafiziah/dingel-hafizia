/* Stage 3 — Fees, Due Management and Fee Receipt (frontend only) */
(function(){
  const esc3=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const money3=n=>'₹'+Number(n||0).toLocaleString('en-IN');
  const persist3=()=>{localStorage.setItem('dh_transactions',JSON.stringify(state.transactions));localStorage.setItem('dh_students',JSON.stringify(state.students));localStorage.setItem('dh_fees',JSON.stringify(state.fees))};
  const feeRows=()=>state.fees.map((f,i)=>{const s=state.students.find(x=>x.id===f.studentId);return {...f,studentName:s?.name||f.student||'Unknown',className:s?.className||'' ,roll:s?.roll||'' ,index:i}});

  window.renderFees=function(){
    content.innerHTML=`<div class="page-head"><div><h2>Student Fees</h2><p>Record payments, manage dues and issue fee receipts.</p></div><button class="btn btn-primary" onclick="openFeeModal()">+ Record Fee</button></div>
    <div class="toolbar"><input class="input" id="feeSearch" placeholder="Search student, roll, class or month..." oninput="filterFees()"><select class="select" id="feeStatus" onchange="filterFees()"><option>All</option><option>Paid</option><option>Due</option></select></div>
    <div class="card table-card"><div class="table-wrap"><table><thead><tr><th>Student</th><th>Class</th><th>Month</th><th>Fee</th><th>Paid</th><th>Due</th><th>Status</th><th>Action</th></tr></thead><tbody id="feeRows"></tbody></table></div></div>`;
    filterFees();
  };

  window.filterFees=function(){
    const q=(document.getElementById('feeSearch')?.value||'').toLowerCase(), s=document.getElementById('feeStatus')?.value||'All';
    const rows=feeRows().filter(x=>{const text=`${x.studentName} ${x.roll} ${x.className} ${x.month}`.toLowerCase();return (!q||text.includes(q))&&(s==='All'||(s==='Paid'?Number(x.due)===0:Number(x.due)>0));});
    document.getElementById('feeRows').innerHTML=rows.length?rows.map(x=>`<tr><td><strong>${esc3(x.studentName)}</strong></td><td>${esc3(x.className)||'—'}</td><td>${esc3(x.month)}</td><td>${money3(x.fee)}</td><td>${money3(x.paid)}</td><td><strong>${money3(x.due)}</strong></td><td><span class="badge ${Number(x.due)>0?'due':'paid'}">${Number(x.due)>0?'Due':'Paid'}</span></td><td><button class="table-action" onclick="viewFeeReceipt('${x.id}')">Receipt</button><button class="table-action" onclick="editFee('${x.id}')">Edit</button><button class="table-action danger" onclick="deleteFee('${x.id}')">Delete</button></td></tr>`).join(''):`<tr><td colspan="8"><div class="empty"><strong>No fee records found</strong>Record a fee or change the filters.</div></td></tr>`;
  };

  window.openFeeModal=function(id){
    if(!state.students.length){alert('Please add a student first.');return;}
    const old=state.fees.find(a=>a.id===id)||{studentId:state.students[0].id,month:'',fee:'',paid:''};
    const options=state.students.map(s=>`<option value="${esc3(s.id)}" ${s.id===old.studentId?'selected':''}>${esc3(s.name)} — ${esc3(s.className)}${s.roll?` — Roll ${esc3(s.roll)}`:''}</option>`).join('');
    openModal(`<div class="modal-head"><h3>${id?'Edit':'Record'} Student Fee</h3><button class="close" onclick="closeModal()">×</button></div><form onsubmit="saveFee(event,'${id||''}')"><div class="form-grid"><div class="field full"><label>Student</label><select class="select" name="studentId" required>${options}</select></div><div class="field"><label>Month</label><input class="input" name="month" value="${esc3(old.month)}" placeholder="September 2026" required></div><div class="field"><label>Total Fee</label><input class="input" type="number" min="0" step="0.01" name="fee" value="${old.fee}" required></div><div class="field full"><label>Paid Amount</label><input class="input" type="number" min="0" step="0.01" name="paid" value="${old.paid}" required></div></div><div class="modal-actions"><button type="button" class="btn btn-light" onclick="closeModal()">Cancel</button><button class="btn btn-primary">Save Fee</button></div></form>`);
  };

  window.saveFee=function(e,id){
    e.preventDefault();const x=Object.fromEntries(new FormData(e.target));x.fee=Number(x.fee);x.paid=Number(x.paid);
    if(x.fee<0||x.paid<0||x.paid>x.fee){alert('Paid amount cannot be greater than total fee.');return;}
    x.due=x.fee-x.paid;const student=state.students.find(s=>s.id===x.studentId);x.student=student?student.name:'';
    if(id){const i=state.fees.findIndex(a=>a.id===id);if(i<0)return;state.fees[i]={...state.fees[i],...x};}else state.fees.unshift({id:uid(),...x});
    persist3();closeModal();render();
  };

  window.viewFeeReceipt=function(id){
    const f=state.fees.find(x=>x.id===id);if(!f)return;const s=state.students.find(x=>x.id===f.studentId);if(!s)return;
    openModal(`<div class="modal-head"><h3>Fee Receipt</h3><button class="close" onclick="closeModal()">×</button></div><div id="feeReceipt" style="padding:18px;background:#fff;border:1px solid #e6eaf0;border-radius:14px"><div style="text-align:center"><h2 style="margin:0">Dingel Hafizia Madrasa</h2><p style="margin:6px 0 18px">Student Fee Receipt</p></div><div class="profile"><div><b>Student</b><span>${esc3(s.name)}</span></div><div><b>Roll</b><span>${esc3(s.roll)||'—'}</span></div><div><b>Class</b><span>${esc3(s.className)}</span></div><div><b>Guardian</b><span>${esc3(s.guardian)||'—'}</span></div><div><b>Month</b><span>${esc3(f.month)}</span></div><div><b>Total Fee</b><span>${money3(f.fee)}</span></div><div><b>Paid</b><span>${money3(f.paid)}</span></div><div><b>Due</b><span>${money3(f.due)}</span></div></div></div><div class="modal-actions"><button class="btn btn-light" onclick="closeModal()">Close</button><button class="btn btn-primary" onclick="printFeeReceipt('${id}')">Print Receipt</button></div>`);
  };

  window.printFeeReceipt=function(id){
    const f=state.fees.find(x=>x.id===id),s=f&&state.students.find(x=>x.id===f.studentId);if(!f||!s)return;
    const w=window.open('','_blank','width=700,height=800');if(!w){alert('Please allow pop-ups to print the receipt.');return;}
    w.document.write(`<!doctype html><html><head><title>Fee Receipt</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:Arial,sans-serif;padding:30px;color:#172033}h1{text-align:center;margin:0}h2{text-align:center;font-weight:500}.receipt{max-width:620px;margin:auto;border:1px solid #ddd;padding:24px;border-radius:12px}.row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #eee}.total{font-weight:bold}@media print{body{padding:0}.receipt{border:0}}</style></head><body><div class="receipt"><h1>Dingel Hafizia Madrasa</h1><h2>Student Fee Receipt</h2><div class="row"><b>Student</b><span>${esc3(s.name)}</span></div><div class="row"><b>Roll</b><span>${esc3(s.roll)||'—'}</span></div><div class="row"><b>Class</b><span>${esc3(s.className)}</span></div><div class="row"><b>Guardian</b><span>${esc3(s.guardian)||'—'}</span></div><div class="row"><b>Month</b><span>${esc3(f.month)}</span></div><div class="row"><b>Total Fee</b><span>${money3(f.fee)}</span></div><div class="row"><b>Paid</b><span>${money3(f.paid)}</span></div><div class="row total"><b>Due</b><span>${money3(f.due)}</span></div></div><script>window.onload=()=>window.print()<\/script></body></html>`);w.document.close();
  };
})();

// Dingel Hafizia App - Firestore data layer.
(function(){
  let db=null,currentUser=null;
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
  const money=v=>Number(v||0).toFixed(2);
  const currentMonth=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`};
  const monthKey=v=>/^\d{4}-\d{2}$/.test(String(v))?String(v):String(v||'');
  const studentCol=()=>db.collection('students');
  const paymentCol=()=>db.collection('payments');
  const studentRef=id=>studentCol().doc(String(id));
  const paymentRef=id=>paymentCol().doc(String(id));
  const accountCol=()=>db.collection('accounts');
  let accounts=[];
  let students=[],payments=[];

  function setState(){window.dhStudents=students;window.dhPayments=payments}
  function firestoreError(e){console.error(e);return `Firestore connection failed: ${e?.code||'unknown-error'}`}
  function requireRole(roles){if(!roles.includes(window.dhRole)){alert('You do not have permission to perform this action.');return false}return true}
  function feeForMonth(s){return ['Atim','Poor-Free'].includes(s.type||s.category)?0:Number(s.monthlyFees||0)}
  function paidForMonth(id,m){return payments.filter(p=>String(p.studentId)===String(id)&&monthKey(p.month)===m).reduce((a,p)=>a+Number(p.amount||0),0)}

  async function load(){
    const [ss,ps,as]=await Promise.all([studentCol().get(),paymentCol().get(),accountCol().get()]);
    students=ss.docs.map(d=>({id:d.id,...d.data()}));
    payments=ps.docs.map(d=>({id:d.id,...d.data()}));
    accounts=as.docs.map(d=>({id:d.id,...d.data()}));
    setState(); renderStudents(); renderFees(); renderAccounts(); renderDashboard();
  }



  function paymentsForStudent(id,m){return payments.filter(p=>String(p.studentId)===String(id)&&(!m||monthKey(p.month)===m)).sort((a,b)=>String(b.paymentDate||'').localeCompare(String(a.paymentDate||'')))}
  function accountTotals(m){const rows=accounts.filter(a=>!m||String(a.date||'').slice(0,7)===m);return {income:rows.filter(a=>a.type==='Income').reduce((x,a)=>x+Number(a.amount||0),0),expense:rows.filter(a=>a.type==='Expense').reduce((x,a)=>x+Number(a.amount||0),0)}}

  window.renderReports=function(){
    const m=$('#reportMonth')?.value||currentMonth(), status=$('#reportStatus')?.value||'Active', q=($('#reportSearch')?.value||'').trim().toLowerCase();
    const rows=students.filter(s=>{const searchable=[s.admissionId,s.name,s.guardianName,s.phone,s.className,s.type].join(' ').toLowerCase();return (!status||(s.status||'Active')===status)&&(!q||searchable.includes(q))}).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||'')));
    let monthly=0,paid=0,due=0;
    const tbody=$('#reportRows');
    if(tbody)tbody.innerHTML=rows.map(s=>{const fm=feeForMonth(s),fp=paidForMonth(s.id,m),fd=Math.max(fm-fp,0);monthly+=fm;paid+=fp;due+=fd;const ps=paymentsForStudent(s.id,m);const last=ps[0];return `<tr><td>${esc(s.admissionId||s.roll||'—')}</td><td><b>${esc(s.name)}</b></td><td>${esc(s.className||'—')}</td><td>${esc(s.type||s.category||'Normal')}</td><td>₹${money(fm)}</td><td>₹${money(fp)}</td><td>₹${money(fd)}</td><td>${esc(s.status||'Active')}</td><td>${last?`<button onclick="printPaymentReceipt('${esc(last.id)}')">Print</button>`: '—'}</td></tr>`}).join('')||'<tr><td colspan="9" class="empty">No report records found</td></tr>';
    const at=accountTotals(m); const income=at.income+paid, expense=at.expense;
    const vals={reportStudents:rows.length,reportMonthly:money(monthly),reportPaid:money(paid),reportDue:money(due),reportIncome:money(income),reportExpense:money(expense),reportBalance:money(income-expense)};
    Object.entries(vals).forEach(([id,v])=>{const el=$('#'+id);if(el)el.textContent=v});
  };

  window.showPaymentHistory=function(studentId){
    const s=students.find(x=>String(x.id)===String(studentId));if(!s)return;
    const rows=paymentsForStudent(studentId,''); const box=$('#paymentHistoryContent');if(!box)return;
    const total=rows.reduce((x,p)=>x+Number(p.amount||0),0);
    box.innerHTML=`<h3>${esc(s.name)}</h3><p>Admission ID: ${esc(s.admissionId||s.roll||'—')}</p><div class="table-wrap"><table><thead><tr><th>Date</th><th>Month</th><th>Amount</th><th>Note</th><th>Receipt</th></tr></thead><tbody>${rows.map(p=>`<tr><td>${esc(p.paymentDate||'—')}</td><td>${esc(p.month||'—')}</td><td>₹${money(p.amount)}</td><td>${esc(p.note||'—')}</td><td><button onclick="printPaymentReceipt('${esc(p.id)}')">Print</button></td></tr>`).join('')||'<tr><td colspan="5">No payments found</td></tr>'}</tbody></table></div><p><b>Total paid:</b> ₹${money(total)}</p>`;
    $('#paymentHistoryModal').showModal();
  };

  window.printPaymentReceipt=function(paymentId){
    const p=payments.find(x=>String(x.id)===String(paymentId));if(!p)return;
    const s=students.find(x=>String(x.id)===String(p.studentId));
    const receiptNo='DHA-'+String(p.id).slice(-8).toUpperCase();
    const html=`<!doctype html><html><head><meta charset="utf-8"><title>Fee Receipt - ${esc(receiptNo)}</title><style>body{font-family:Arial,sans-serif;margin:0;padding:30px;color:#172b3a} .receipt{max-width:720px;margin:auto;border:1px solid #ddd;padding:28px;border-radius:12px}h1{text-align:center;margin:0 0 5px}h2{text-align:center;margin:0 0 25px;font-size:16px;font-weight:400}.row{display:flex;justify-content:space-between;border-bottom:1px solid #eee;padding:10px 0}.amount{font-size:22px;font-weight:700;margin-top:20px}.foot{margin-top:35px;text-align:center;font-size:12px;color:#666}</style></head><body><div class="receipt"><h1>DINGEL HAFIZIA MADRASAH</h1><h2>Fee Payment Receipt</h2><div class="row"><b>Receipt No.</b><span>${esc(receiptNo)}</span></div><div class="row"><b>Student</b><span>${esc(s?.name||p.studentName||'—')}</span></div><div class="row"><b>Admission ID</b><span>${esc(s?.admissionId||p.admissionId||'—')}</span></div><div class="row"><b>Payment Month</b><span>${esc(p.month||'—')}</span></div><div class="row"><b>Payment Date</b><span>${esc(p.paymentDate||'—')}</span></div><div class="row"><b>Note</b><span>${esc(p.note||'—')}</span></div><div class="amount">Paid: ₹${money(p.amount)}</div><div class="foot">This is a computer-generated receipt.</div></div><script>window.onload=()=>window.print()<\/script></body></html>`;
    const w=window.open('','_blank','width=800,height=700');if(!w)return alert('Please allow pop-ups to print the receipt.');w.document.write(html);w.document.close();
  };

  window.printMonthlyReport=function(){
    const m=$('#reportMonth')?.value||currentMonth(),status=$('#reportStatus')?.value||'Active';
    const rows=students.filter(s=>!status||(s.status||'Active')===status).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||'')));
    const body=rows.map(s=>{const fm=feeForMonth(s),fp=paidForMonth(s.id,m),fd=Math.max(fm-fp,0);return `<tr><td>${esc(s.admissionId||s.roll||'—')}</td><td>${esc(s.name)}</td><td>${esc(s.className||'—')}</td><td>₹${money(fm)}</td><td>₹${money(fp)}</td><td>₹${money(fd)}</td></tr>`}).join('');
    const html=`<!doctype html><html><head><meta charset="utf-8"><title>Monthly Report ${esc(m)}</title><style>body{font-family:Arial;margin:25px}h1,h2{text-align:center}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f3f3f3}</style></head><body><h1>DINGEL HAFIZIA MADRASAH</h1><h2>Monthly Fee Report — ${esc(m)}</h2><table><thead><tr><th>Admission ID</th><th>Student</th><th>Class</th><th>Monthly</th><th>Paid</th><th>Due</th></tr></thead><tbody>${body}</tbody></table><script>window.onload=()=>window.print()<\/script></body></html>`;
    const w=window.open('','_blank','width=1000,height=800');if(!w)return alert('Please allow pop-ups to print the report.');w.document.write(html);w.document.close();
  };

  window.renderDashboard=function(){
    const month=currentMonth(), active=students.filter(s=>(s.status||'Active')==='Active');
    const monthly=active.reduce((a,s)=>a+feeForMonth(s),0), paid=active.reduce((a,s)=>a+paidForMonth(s.id,month),0), due=Math.max(monthly-paid,0);
    const income=accounts.filter(a=>a.type==='Income').reduce((x,a)=>x+Number(a.amount||0),0)+payments.reduce((x,p)=>x+Number(p.amount||0),0);
    const expense=accounts.filter(a=>a.type==='Expense').reduce((x,a)=>x+Number(a.amount||0),0);
    const vals={dashStudents:active.length,dashMonthly:'₹'+money(monthly),dashPaid:'₹'+money(paid),dashDue:'₹'+money(due),dashIncome:'₹'+money(income),dashExpense:'₹'+money(expense),dashBalance:'₹'+money(income-expense)};
    Object.entries(vals).forEach(([id,v])=>{const el=$('#'+id);if(el)el.textContent=v});
  };

  window.renderAccounts=function(){
    const type=$('#accountType')?.value||'',q=($('#accountSearch')?.value||'').toLowerCase();
    const rows=accounts.filter(a=>(!type||a.type===type)&&(!q||String(a.description||'').toLowerCase().includes(q)||String(a.note||'').toLowerCase().includes(q))).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
    const income=accounts.filter(a=>a.type==='Income').reduce((x,a)=>x+Number(a.amount||0),0),expense=accounts.filter(a=>a.type==='Expense').reduce((x,a)=>x+Number(a.amount||0),0);
    $('#accountIncome')&&($('#accountIncome').textContent=money(income)); $('#accountExpense')&&($('#accountExpense').textContent=money(expense)); $('#accountBalance')&&($('#accountBalance').textContent=money(income-expense));
    const tbody=$('#accountRows');if(tbody)tbody.innerHTML=rows.map(a=>`<tr><td>${esc(a.date||'—')}</td><td>${esc(a.type)}</td><td>${esc(a.description)}</td><td>₹${money(a.amount)}</td><td><button class="danger" onclick="deleteAccountEntry('${esc(a.id)}')">Delete</button></td></tr>`).join('')||'<tr><td colspan="5" class="empty">No account entries found</td></tr>';
  };

  window.addAccountEntry=function(){
    if(!requireRole(['Admin']))return;const m=$('#accountModal'),f=$('#accountForm');if(!m||!f)return;f.reset();f.querySelector('[name="date"]').value=new Date().toISOString().slice(0,10);m.showModal()};
  window.deleteAccountEntry=async function(id){
    if(!requireRole(['Admin']))return;if(!confirm('Delete this account entry?'))return;try{await accountCol().doc(String(id)).delete();accounts=accounts.filter(a=>String(a.id)!==String(id));renderAccounts();renderDashboard()}catch(e){alert(firestoreError(e))}};

  window.renderStudents=function(){
    const q=($('#studentSearch')?.value||'').trim().toLowerCase();
    const classFilter=$('#studentClassFilter')?.value||'';
    const typeFilter=$('#studentTypeFilter')?.value||'';
    const statusFilter=$('#studentStatusFilter')?.value||'Active';
    const month=currentMonth();
    let rows=students.filter(s=>{
      const searchable=[s.admissionId,s.roll,s.name,s.guardianName,s.father,s.guardianPhone,s.phone,s.className,s.type,s.category].join(' ').toLowerCase();
      if(q&&!searchable.includes(q))return false;
      if(classFilter&&s.className!==classFilter)return false;
      if(typeFilter&&(s.type||s.category)!==typeFilter)return false;
      if(statusFilter&&((s.status||'Active')!==statusFilter))return false;
      return true;
    });
    rows.sort((a,b)=>String(a.name||'').localeCompare(String(b.name||'')));
    const tbody=$('#studentRows');
    if(!tbody)return;
    tbody.innerHTML=rows.map(s=>{
      const id=s.admissionId||s.roll||s.id, type=s.type||s.category||'Normal', fee=feeForMonth(s), paid=paidForMonth(s.id,month), due=Math.max(fee-paid,0);
      const dueMark=due>0?' • Due':'';
      return `<tr><td><b>${esc(id)}</b></td><td><button class="table-link" onclick="viewStudent('${esc(s.id)}')">${esc(s.name)}</button></td><td>${esc(s.guardianName||s.father||'—')}</td><td>${esc(s.guardianPhone||s.phone||'—')}</td><td>${esc(s.className||'—')}</td><td>${esc(type)}</td><td>₹${money(fee)}${dueMark}</td><td><span class="status-badge ${String(s.status||'Active').toLowerCase()}">${esc(s.status||'Active')}</span></td><td><button onclick="studentMenu('${esc(s.id)}')">⋮</button></td></tr>`;
    }).join('')||'<tr><td colspan="9" class="empty">No students found</td></tr>';
    const active=students.filter(s=>(s.status||'Active')==='Active').length;
    const totalDue=students.filter(s=>(s.status||'Active')==='Active').reduce((sum,s)=>sum+Math.max(feeForMonth(s)-paidForMonth(s.id,month),0),0);
    const summary=$('#studentSummary'); if(summary)summary.innerHTML=`<span>Total: <b>${active}</b></span><span>Showing: <b>${rows.length}</b></span><span>Current Due: <b>₹${money(totalDue)}</b></span>`;
  };

  window.saveStudent=async function(fd){
    if(!requireRole(['Admin','Teacher']))return;
    if(!db)return alert('Database is not ready.');
    const id=window.__dhCurrentStudentId;
    const type=fd.get('studentType')||'Normal';
    const admissionId=String(fd.get('admissionId')||'').trim();
    const name=String(fd.get('studentName')||'').trim();
    const guardianName=String(fd.get('guardianName')||'').trim();
    if(!admissionId||!name||!guardianName)return alert('Admission ID, Student Name and Guardian Name are required.');
    const duplicate=students.find(s=>String(s.admissionId||s.roll||'').toLowerCase()===admissionId.toLowerCase()&&String(s.id)!==String(id||''));
    if(duplicate)return alert('This Admission ID is already in use.');
    const data={
      admissionId,name,dob:fd.get('dob')||'',studentAadhaar:fd.get('studentAadhaar')||'',
      guardianName,guardianPhone:fd.get('guardianPhone')||'',guardianAadhaar:fd.get('guardianAadhaar')||'',
      phone:fd.get('phone')||'',address:fd.get('address')||'',className:fd.get('studentClass')||'Maktab',
      type,monthlyFees:['Atim','Poor-Free'].includes(type)?0:Number(fd.get('monthlyFees')||0),
      admissionDate:fd.get('admissionDate')||'',status:fd.get('studentStatus')||'Active',
      updatedAt:firebase.firestore.FieldValue.serverTimestamp(),updatedBy:currentUser?.uid||''
    };
    try{
      if(id){await studentRef(id).update(data);students=students.map(s=>String(s.id)===String(id)?{...s,...data}:s)}
      else{data.createdAt=firebase.firestore.FieldValue.serverTimestamp();data.createdBy=currentUser?.uid||'';const ref=await studentCol().add(data);students.push({id:ref.id,...data})}
      setState();$('#studentModal')?.close();renderStudents();renderFees();alert(id?'Student updated successfully.':'Student admitted successfully.');
    }catch(e){alert(firestoreError(e))}
  };

  window.studentMenu=function(id){
    const s=students.find(x=>String(x.id)===String(id));if(!s)return;
    const m=$('#studentActionModal');if(!m)return;
    m.innerHTML=`<div class="modal-body"><h2>${esc(s.name)}</h2><p>Admission ID: ${esc(s.admissionId||s.roll||'—')}</p><div class="modal-actions"><button onclick="$('#studentActionModal').close();viewStudent('${esc(s.id)}')">Profile</button><button onclick="$('#studentActionModal').close();editStudent('${esc(s.id)}')">Edit</button><button class="danger" onclick="archiveStudent('${esc(s.id)}')">Archive</button></div></div>`;
    m.showModal();
  };

  window.archiveStudent=async function(id){
    if(!requireRole(['Admin','Teacher']))return;
    const s=students.find(x=>String(x.id)===String(id));if(!s)return;
    if(!confirm(`“${s.name}” student record archive করতে চান?`))return;
    try{await studentRef(id).update({status:'Archived',updatedAt:firebase.firestore.FieldValue.serverTimestamp(),updatedBy:currentUser?.uid||''});students=students.map(x=>String(x.id)===String(id)?{...x,status:'Archived'}:x);setState();$('#studentActionModal')?.close();$('#detailsModal')?.close();renderStudents();renderFees();alert('Student archived successfully.')}catch(e){alert(firestoreError(e))}
  };
  window.deleteStudent=window.archiveStudent;

  window.viewStudent=function(id){
    const s=students.find(x=>String(x.id)===String(id));if(!s)return;
    const paid=paidForMonth(id,currentMonth()),monthly=feeForMonth(s),due=Math.max(monthly-paid,0),type=s.type||s.category||'Normal';
    const details=$('#details');if(!details)return;
    details.innerHTML=`<div class="details-header"><div><h2>${esc(s.name)}</h2><p>Admission ID: ${esc(s.admissionId||s.roll||'—')}</p></div></div><div class="detail-grid">${[['Admission ID',s.admissionId||s.roll],['Student Name',s.name],['Date of Birth',s.dob],['Student Aadhaar',s.studentAadhaar],['Guardian Name',s.guardianName||s.father],['Guardian Phone',s.guardianPhone],['Guardian Aadhaar',s.guardianAadhaar||s.fatherAadhaar],['Student Phone',s.phone],['Address',s.address],['Class',s.className],['Type',type],['Monthly Fee','₹'+money(monthly)],['Current Month Paid','₹'+money(paid)],['Current Month Due','₹'+money(due)],['Admission Date',s.admissionDate],['Status',s.status||'Active']].map(([a,b])=>`<div><b>${a}</b><span>${esc(b||'—')}</span></div>`).join('')}</div><div class="modal-actions"><button onclick="$('#detailsModal').close()">Close</button><button onclick="$('#detailsModal').close();editStudent('${esc(s.id)}')">Edit</button><button class="danger" onclick="archiveStudent('${esc(s.id)}')">Archive</button></div>`;
    $('#detailsModal').showModal();
  };

  window.renderFees=function(){
    const m=$('#feeMonth')?.value||currentMonth(),q=($('#feeSearch')?.value||'').toLowerCase();
    const rows=students.filter(s=>(s.status||'Active')==='Active'&&(!q||[s.admissionId,s.name,s.guardianName,s.phone].join(' ').toLowerCase().includes(q)));
    let tm=0,tp=0,td=0;
    if($('#feeRows'))$('#feeRows').innerHTML=rows.map(s=>{const monthly=feeForMonth(s),paid=paidForMonth(s.id,m),due=Math.max(monthly-paid,0);tm+=monthly;tp+=paid;td+=due;return `<tr><td>${esc(s.admissionId||s.roll||'—')}</td><td>${esc(s.name)}</td><td>${money(monthly)}</td><td>${money(paid)}</td><td>${money(due)}</td><td><button onclick="addPaymentFor('${esc(s.id)}','${m}')">Add Payment</button></td></tr>`}).join('')||'<tr><td colspan="6" class="empty">No students found</td></tr>';
    if($('#feeTotalStudents'))$('#feeTotalStudents').textContent=rows.length;if($('#feeTotalMonthly'))$('#feeTotalMonthly').textContent=money(tm);if($('#feeTotalPaid'))$('#feeTotalPaid').textContent=money(tp);if($('#feeTotalDue'))$('#feeTotalDue').textContent=money(td);
  };

  window.addPayment=function(){
    if(!requireRole(['Admin','Teacher']))return;
    const form=$('#paymentForm'), modal=$('#paymentModal'), select=$('#paymentStudent');
    if(!form||!modal||!select)return;
    const active=students.filter(s=>(s.status||'Active')==='Active').sort((a,b)=>String(a.name||'').localeCompare(String(b.name||'')));
    select.innerHTML=active.map(s=>'<option value="'+esc(s.id)+'">'+esc((s.admissionId||s.roll||'—')+' — '+(s.name||''))+'</option>').join('');
    form.reset();
    $('#paymentMonth').value=currentMonth();
    const d=new Date(); $('#paymentForm [name="paymentDate"]').value=d.toISOString().slice(0,10);
    modal.showModal();
  };

  window.addPaymentFor=function(studentId,month){
    window.addPayment();
    if($('#paymentStudent'))$('#paymentStudent').value=String(studentId);
    if($('#paymentMonth'))$('#paymentMonth').value=month||currentMonth();
  };

  document.addEventListener('DOMContentLoaded',function(){
    $('#paymentForm')?.addEventListener('submit',async function(e){
      e.preventDefault();
      if(!db)return alert('Database is not ready.');
      const fd=new FormData(this), studentId=String(fd.get('paymentStudent')||''), month=monthKey(fd.get('paymentMonth'));
      const amount=Number(fd.get('amount')||0), paymentDate=String(fd.get('paymentDate')||'');
      if(!studentId||!month||amount<=0||!paymentDate)return alert('Student, month, valid paid amount and payment date are required.');
      const student=students.find(s=>String(s.id)===studentId); if(!student)return alert('Student not found.');
      const monthly=feeForMonth(student), alreadyPaid=paidForMonth(studentId,month);
      if(monthly===0)return alert('This student has no monthly fee.');
      if(alreadyPaid+amount>monthly)return alert('Payment cannot exceed the monthly fee. Current paid: ₹'+money(alreadyPaid)+'.');
      const data={studentId,studentName:student.name||'',admissionId:student.admissionId||student.roll||'',month,amount,paymentDate,note:fd.get('note')||'',createdAt:firebase.firestore.FieldValue.serverTimestamp(),createdBy:currentUser?.uid||''};
      try{
        const ref=await paymentCol().add(data); payments.push({id:ref.id,...data}); setState(); this.reset(); $('#paymentModal')?.close(); renderFees(); renderStudents(); renderDashboard(); renderReports(); alert('Payment saved successfully.');
      }catch(err){alert(firestoreError(err))}
    });
  });


  document.addEventListener('DOMContentLoaded',function(){
    $('#accountForm')?.addEventListener('submit',async function(e){e.preventDefault();const fd=new FormData(this),type=String(fd.get('type')||''),amount=Number(fd.get('amount')||0),description=String(fd.get('description')||'').trim(),date=String(fd.get('date')||'');if(!['Income','Expense'].includes(type)||amount<=0||!description||!date)return alert('Type, date, description and valid amount are required.');try{const data={type,amount,description,date,note:String(fd.get('note')||''),createdAt:firebase.firestore.FieldValue.serverTimestamp(),createdBy:currentUser?.uid||''};const ref=await accountCol().add(data);accounts.push({id:ref.id,...data});this.reset();$('#accountModal')?.close();renderAccounts();renderDashboard();alert('Account entry saved successfully.')}catch(err){alert(firestoreError(err))}});
  });

  document.addEventListener('DOMContentLoaded',function(){
    dhAuth.onAuthStateChanged(async user=>{currentUser=user;if(!user)return;try{db=firebase.firestore();await load()}catch(e){alert(firestoreError(e))}});
  });
})();

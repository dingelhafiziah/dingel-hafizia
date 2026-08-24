// Fee correction/delete controls. Loaded after app-firestore.js.
(function(){
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
  const money=v=>Number(v||0).toFixed(2);
  const monthKey=v=>/^\d{4}-\d{2}$/.test(String(v))?String(v):String(v||'');
  const currentMonth=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`};
  const feeForMonth=s=>['Atim','Poor-Free'].includes(s.type||s.category)?0:Number(s.monthlyFees||0);
  const paidForMonth=(id,m)=>(window.dhPayments||[]).filter(p=>String(p.studentId)===String(id)&&monthKey(p.month)===m).reduce((a,p)=>a+Number(p.amount||0),0);
  const requireRole=()=>['Admin','Teacher'].includes(window.dhRole);

  window.deleteFeePayment=async function(id){
    if(!requireRole()){alert('You do not have permission to delete payments.');return}
    const payments=window.dhPayments||[];const p=payments.find(x=>String(x.id)===String(id));if(!p)return;
    if(!confirm(`Delete this fee payment of ₹${money(p.amount)} for ${p.studentName||'student'} (${p.month||''})?\n\nThis action cannot be undone.`))return;
    try{
      await firebase.firestore().collection('payments').doc(String(id)).delete();
      window.dhPayments=payments.filter(x=>String(x.id)!==String(id));
      if(window.showPaymentHistory&&p.studentId)window.showPaymentHistory(p.studentId);else $('#paymentHistoryModal')?.close();
      window.renderFees?.();window.renderStudents?.();window.renderDashboard?.();window.renderReports?.();
      alert('Fee payment deleted successfully.');
    }catch(e){console.error(e);alert(`Could not delete payment: ${e?.message||e}`)}
  };

  window.showPaymentHistory=function(studentId){
    const students=window.dhStudents||[],payments=window.dhPayments||[];const s=students.find(x=>String(x.id)===String(studentId));if(!s)return;
    const rows=payments.filter(p=>String(p.studentId)===String(studentId)).sort((a,b)=>String(b.paymentDate||'').localeCompare(String(a.paymentDate||'')));
    const box=$('#paymentHistoryContent');if(!box)return;
    const total=rows.reduce((x,p)=>x+Number(p.amount||0),0);
    box.innerHTML=`<h3>${esc(s.name)}</h3><p>Admission ID: ${esc(s.admissionId||s.roll||'—')}</p><div class="table-wrap"><table><thead><tr><th>Date</th><th>Month</th><th>Amount</th><th>Note</th><th>Receipt</th><th>Delete</th></tr></thead><tbody>${rows.map(p=>`<tr><td>${esc(p.paymentDate||'—')}</td><td>${esc(p.month||'—')}</td><td>₹${money(p.amount)}</td><td>${esc(p.note||'—')}</td><td><button onclick="printPaymentReceipt('${esc(p.id)}')">Print</button></td><td><button class="danger" onclick="deleteFeePayment('${esc(p.id)}')">Delete</button></td></tr>`).join('')||'<tr><td colspan="6" class="empty">No payments found</td></tr>'}</tbody></table></div><p><b>Total paid:</b> ₹${money(total)}</p>`;
    $('#paymentHistoryModal')?.showModal();
  };

  window.renderFees=function(){
    const m=$('#feeMonth')?.value||currentMonth(),q=($('#feeSearch')?.value||'').toLowerCase();
    const students=(window.dhStudents||[]).filter(s=>(s.status||'Active')==='Active'&&(!q||[s.admissionId,s.name,s.guardianName,s.phone].join(' ').toLowerCase().includes(q)));
    let tm=0,tp=0,td=0;
    const tbody=$('#feeRows');if(!tbody)return;
    tbody.innerHTML=students.map(s=>{const monthly=feeForMonth(s),paid=paidForMonth(s.id,m),due=Math.max(monthly-paid,0);tm+=monthly;tp+=paid;td+=due;return `<tr><td>${esc(s.admissionId||s.roll||'—')}</td><td>${esc(s.name)}</td><td>${money(monthly)}</td><td>${money(paid)}</td><td>${money(due)}</td><td><button onclick="addPaymentFor('${esc(s.id)}','${m}')">Add Payment</button>${paid>0?` <button onclick="showPaymentHistory('${esc(s.id)}')">History</button>`:''}</td></tr>`}).join('')||'<tr><td colspan="6" class="empty">No students found</td></tr>';
    if($('#feeTotalStudents'))$('#feeTotalStudents').textContent=students.length;if($('#feeTotalMonthly'))$('#feeTotalMonthly').textContent=money(tm);if($('#feeTotalPaid'))$('#feeTotalPaid').textContent=money(tp);if($('#feeTotalDue'))$('#feeTotalDue').textContent=money(td);
  };
})();

// Dingel Hafizia App - UI shell and Students form helpers.
(function(){
  const $=s=>document.querySelector(s);
  function todayISO(){const d=new Date();const y=d.getFullYear();const m=String(d.getMonth()+1).padStart(2,'0');const day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`}
  function nextAdmissionId(){const students=window.dhStudents||[];let max=0;students.forEach(s=>{const value=String(s.admissionId||s.roll||'').trim();const match=value.match(/^DH-(\d+)$/i);if(match)max=Math.max(max,Number(match[1]))});return `DH-${String(max+1).padStart(3,'0')}`}
  function setStudentFeeState(){const type=$('#studentType'),fee=$('#monthlyFees');if(!type||!fee)return;const free=['Atim','Poor-Free'].includes(type.value);fee.disabled=free;if(free)fee.value='0'}
  window.toggleMenu=function(force){const sidebar=$('#sidebar'),overlay=$('#menuOverlay'),btn=$('#menuBtn');if(!sidebar||!overlay||!btn)return;const open=typeof force==='boolean'?force:!sidebar.classList.contains('menu-open');sidebar.classList.toggle('menu-open',open);overlay.classList.toggle('show',open);btn.setAttribute('aria-expanded',String(open));btn.textContent=open?'×':'⋮'};
  window.show=function(page){document.querySelectorAll('.page').forEach(x=>x.classList.add('hidden'));const target=$(`#page-${page}`);if(target)target.classList.remove('hidden');document.querySelectorAll('.nav-btn').forEach(x=>x.classList.toggle('active',x.dataset.page===page));if(page==='students'&&window.renderStudents)window.renderStudents();if(page==='fees'&&window.renderFees)window.renderFees();if(page==='accounts'&&window.renderAccounts)window.renderAccounts();if(page==='reports'&&window.renderReports)window.renderReports();if(page==='dashboard'&&window.renderDashboard)window.renderDashboard();if(window.innerWidth<=900)window.toggleMenu(false)};
  window.addStudent=function(){window.__dhCurrentStudentId=null;const modal=$('#studentModal'),form=$('#studentForm');if(!modal||!form)return;$('#studentModalTitle').textContent='Add Student';form.reset();$('#studentAdmissionId').value=nextAdmissionId();$('#studentAdmissionId').readOnly=true;$('#studentStatus').value='Active';$('#studentType').value='Normal';$('#studentClass').value='Maktab';$('#admissionDate').value=todayISO();$('#admissionDate').readOnly=true;setStudentFeeState();modal.showModal()};
  window.editStudent=function(id){const s=(window.dhStudents||[]).find(x=>String(x.id)===String(id));if(!s)return;window.__dhCurrentStudentId=s.id;const modal=$('#studentModal'),f=$('#studentForm');if(!modal||!f)return;$('#studentModalTitle').textContent='Edit Student';$('#studentAdmissionId').value=s.admissionId||s.roll||'';$('#studentAdmissionId').readOnly=true;$('#studentName').value=s.name||'';$('#studentDob').value=s.dob||'';$('#studentAadhaar').value=s.studentAadhaar||'';$('#guardianName').value=s.guardianName||s.father||'';$('#guardianPhone').value=s.guardianPhone||'';$('#guardianAadhaar').value=s.guardianAadhaar||s.fatherAadhaar||'';if($('#phone'))$('#phone').value=s.phone||'';$('#address').value=s.address||'';$('#studentClass').value=s.className||'Maktab';$('#studentType').value=s.type||s.category||'Normal';$('#monthlyFees').value=s.monthlyFees??0;$('#admissionDate').value=s.admissionDate||'';$('#admissionDate').readOnly=true;$('#studentStatus').value=s.status||'Active';$('#studentPhoto').value='';setStudentFeeState();modal.showModal()};
  document.addEventListener('DOMContentLoaded',function(){
    $('#studentSearch')?.addEventListener('input',()=>window.renderStudents&&window.renderStudents());$('#studentClassFilter')?.addEventListener('change',()=>window.renderStudents&&window.renderStudents());$('#studentTypeFilter')?.addEventListener('change',()=>window.renderStudents&&window.renderStudents());$('#studentStatusFilter')?.addEventListener('change',()=>window.renderStudents&&window.renderStudents());$('#studentType')?.addEventListener('change',setStudentFeeState);$('#studentForm')?.addEventListener('submit',function(e){e.preventDefault();window.saveStudent&&window.saveStudent(new FormData(this))});$('#feeSearch')?.addEventListener('input',()=>window.renderFees&&window.renderFees());$('#feeMonth')?.addEventListener('change',()=>window.renderFees&&window.renderFees());$('#accountType')?.addEventListener('change',()=>window.renderAccounts&&window.renderAccounts());$('#accountSearch')?.addEventListener('input',()=>window.renderAccounts&&window.renderAccounts());$('#reportMonth')?.addEventListener('change',()=>window.renderReports&&window.renderReports());$('#reportStatus')?.addEventListener('change',()=>window.renderReports&&window.renderReports());$('#reportSearch')?.addEventListener('input',()=>window.renderReports&&window.renderReports());
    // Defense-in-depth: validate fee payments before the Firestore submit handler runs.
    $('#paymentForm')?.addEventListener('submit',function(e){const role=String(window.dhRole||'');if(!['Admin','Teacher'].includes(role)){e.preventDefault();e.stopImmediatePropagation();alert('You do not have permission to record fee payments.');return}const studentId=String($('#paymentStudent')?.value||'');const amount=Number(this.elements?.amount?.value||0);const month=String($('#paymentMonth')?.value||'');const students=window.dhStudents||[],payments=window.dhPayments||[];const student=students.find(s=>String(s.id)===studentId);if(!student||!/^\d{4}-\d{2}$/.test(month)||amount<=0)return;const monthly=['Atim','Poor-Free'].includes(student.type||student.category)?0:Number(student.monthlyFees||0);const paid=payments.filter(p=>String(p.studentId)===studentId&&String(p.month||'')===month).reduce((sum,p)=>sum+Number(p.amount||0),0);if(monthly<=0||paid+amount>monthly){e.preventDefault();e.stopImmediatePropagation();alert(monthly<=0?'This student has no monthly fee.':'Payment cannot exceed the remaining monthly due. Current paid: ₹'+paid.toFixed(2)+'.')}},true);
    window.addEventListener('resize',()=>{if(window.innerWidth>900)window.toggleMenu(false)});
  });
  // Logo upload hardening: replace the earlier handler after all app scripts are initialized.
  window.setTimeout(function(){
    window.uploadMadrasaLogo=async function(){
      if(window.dhRole!=='Admin'){alert('Only Admin can change the logo.');return}
      const input=document.querySelector('#madrasaLogo'),file=input?.files?.[0],btn=document.querySelector('#logoUploadBtn');
      if(!file){alert('Please select a logo image first.');return}
      if(!/^image\/(png|jpeg|webp)$/.test(file.type)){alert('Please select a PNG, JPG or WEBP image.');return}
      if(file.size>5*1024*1024){alert('Logo must be smaller than 5 MB.');return}
      if(btn){btn.disabled=true;btn.textContent='Uploading...'}
      const failAfter=(promise,ms)=>Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error('Upload timed out. Please check Firebase Storage/bucket access and try again.')),ms))]);
      try{
        if(!firebase.storage){await failAfter(new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://www.gstatic.com/firebasejs/10.12.5/firebase-storage-compat.js';s.onload=resolve;s.onerror=()=>reject(new Error('Firebase Storage SDK could not be loaded.'));document.head.appendChild(s)}),10000)}
        if(!firebase.storage)throw new Error('Firebase Storage is not available.');
        const storage=firebase.storage();
        const ref=storage.ref().child('studentPhotos/_settings/madrasa-logo');
        await failAfter(ref.put(file,{contentType:file.type,cacheControl:'public,max-age=3600'}),30000);
        const url=await failAfter(ref.getDownloadURL(),15000);
        const user=dhAuth.currentUser;if(!user)throw new Error('Your login session expired. Please login again.');
        await failAfter(firebase.firestore().collection('users').doc(user.uid).set({logoUrl:url,logoUpdatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true}),15000);
        document.querySelectorAll('[data-madrasa-logo]').forEach(img=>{img.src=url;img.style.display='block'});
        if(input)input.value='';
        alert('Madrasa logo updated successfully.');
      }catch(e){console.error('Logo upload failed:',e);alert((e&&e.code?e.code+': ':'')+(e?.message||'Logo upload failed.'))}
      finally{if(btn){btn.disabled=false;btn.textContent='Upload Logo'}}
    };
  },1500);
})();

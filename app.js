// Dingel Hafizia App - UI shell and Students form helpers.
(function(){
  const $=s=>document.querySelector(s);

  window.toggleMenu=function(force){
    const sidebar=$('#sidebar'),overlay=$('#menuOverlay'),btn=$('#menuBtn');
    if(!sidebar||!overlay||!btn)return;
    const open=typeof force==='boolean'?force:!sidebar.classList.contains('menu-open');
    sidebar.classList.toggle('menu-open',open); overlay.classList.toggle('show',open);
    btn.setAttribute('aria-expanded',String(open)); btn.textContent=open?'×':'⋮';
  };

  window.show=function(page){
    document.querySelectorAll('.page').forEach(x=>x.classList.add('hidden'));
    const target=$(`#page-${page}`); if(target)target.classList.remove('hidden');
    document.querySelectorAll('.nav-btn').forEach(x=>x.classList.toggle('active',x.dataset.page===page));
    if(page==='students'&&window.renderStudents)window.renderStudents();
    if(page==='fees'&&window.renderFees)window.renderFees();
    if(window.innerWidth<=900)window.toggleMenu(false);
  };

  window.addStudent=function(){
    window.__dhCurrentStudentId=null;
    const modal=$('#studentModal'),form=$('#studentForm'); if(!modal||!form)return;
    $('#studentModalTitle').textContent='Add Student'; form.reset();
    $('#studentStatus').value='Active'; $('#studentType').value='Normal'; $('#studentClass').value='Maktab';
    $('#monthlyFees').disabled=false; modal.showModal();
  };

  window.editStudent=function(id){
    const s=(window.dhStudents||[]).find(x=>String(x.id)===String(id)); if(!s)return;
    window.__dhCurrentStudentId=s.id;
    const f=$('#studentForm'); if(!f)return;
    $('#studentModalTitle').textContent='Edit Student';
    $('#studentAdmissionId').value=s.admissionId||s.roll||''; $('#studentName').value=s.name||'';
    $('#studentDob').value=s.dob||''; $('#studentAadhaar').value=s.studentAadhaar||'';
    $('#guardianName').value=s.guardianName||s.father||''; $('#guardianPhone').value=s.guardianPhone||'';
    $('#guardianAadhaar').value=s.guardianAadhaar||s.fatherAadhaar||''; $('#phone').value=s.phone||'';
    $('#address').value=s.address||''; $('#studentClass').value=s.className||'Maktab';
    $('#studentType').value=s.type||s.category||'Normal'; $('#monthlyFees').value=s.monthlyFees??0;
    $('#admissionDate').value=s.admissionDate||''; $('#studentStatus').value=s.status||'Active';
    $('#studentPhoto').value=''; $('#monthlyFees').disabled=['Atim','Poor-Free'].includes($('#studentType').value);
    modal.showModal();
  };

  document.addEventListener('DOMContentLoaded',function(){
    $('#studentSearch')?.addEventListener('input',()=>window.renderStudents&&window.renderStudents());
    $('#studentClassFilter')?.addEventListener('change',()=>window.renderStudents&&window.renderStudents());
    $('#studentTypeFilter')?.addEventListener('change',()=>window.renderStudents&&window.renderStudents());
    $('#studentStatusFilter')?.addEventListener('change',()=>window.renderStudents&&window.renderStudents());
    $('#studentType')?.addEventListener('change',function(){
      const free=['Atim','Poor-Free'].includes(this.value); $('#monthlyFees').disabled=free; if(free)$('#monthlyFees').value='0';
    });
    $('#studentForm')?.addEventListener('submit',function(e){e.preventDefault();window.saveStudent&&window.saveStudent(new FormData(this));});
    $('#feeSearch')?.addEventListener('input',()=>window.renderFees&&window.renderFees());
    $('#feeMonth')?.addEventListener('change',()=>window.renderFees&&window.renderFees());
    window.addEventListener('resize',()=>{if(window.innerWidth>900)window.toggleMenu(false)});
  });
})();

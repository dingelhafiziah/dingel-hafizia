// UI shell only. Firebase Auth + Firestore are handled by firebase-auth.js and app-firestore.js.
(function(){
  const $=s=>document.querySelector(s);

  window.toggleMenu=function(force){
    const sidebar=$('#sidebar'),overlay=$('#menuOverlay'),btn=$('#menuBtn');
    if(!sidebar||!overlay||!btn)return;
    const open=typeof force==='boolean'?force:!sidebar.classList.contains('menu-open');
    sidebar.classList.toggle('menu-open',open);
    overlay.classList.toggle('show',open);
    btn.setAttribute('aria-expanded',String(open));
    btn.textContent=open?'×':'⋮';
  };

  window.show=function(page){
    document.querySelectorAll('.page').forEach(x=>x.classList.add('hidden'));
    const target=$(`#page-${page}`);
    if(target)target.classList.remove('hidden');
    document.querySelectorAll('.nav-btn').forEach(x=>x.classList.toggle('active',x.dataset.page===page));
    if(page==='students'&&window.renderStudents)window.renderStudents();
    if(page==='fees'&&window.renderFees)window.renderFees();
    if(window.innerWidth<=900)window.toggleMenu(false);
  };

  window.addStudent=function(){
    window.__dhCurrentStudentId=null;
    const modal=$('#studentModal'),form=$('#studentForm');
    if(!modal||!form)return;
    $('#studentModalTitle').textContent='Add Student';
    form.reset();
    if($('#studentCategory'))$('#studentCategory').value='Paid';
    if($('#studentClass'))$('#studentClass').value='Maktab';
    if($('#studentStatus'))$('#studentStatus').value='Active';
    modal.showModal();
  };

  document.addEventListener('DOMContentLoaded',function(){
    $('#studentSearch')?.addEventListener('input',()=>window.renderStudents&&window.renderStudents());
    $('#studentFilter')?.addEventListener('change',()=>window.renderStudents&&window.renderStudents());
    $('#feeSearch')?.addEventListener('input',()=>window.renderFees&&window.renderFees());
    $('#feeMonth')?.addEventListener('change',()=>window.renderFees&&window.renderFees());
    window.addEventListener('resize',()=>{if(window.innerWidth>900)window.toggleMenu(false)});
  });
})();

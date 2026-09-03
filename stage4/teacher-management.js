/* Stage 4 — Teacher Management (frontend only, Firebase-ready data layer) */
(function(){
  const KEY='dh_teachers';
  const load=()=>{try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v:[]}catch(e){return[]}};
  if(!Array.isArray(state.teachers)) state.teachers=load();
  const save=()=>localStorage.setItem(KEY,JSON.stringify(state.teachers));
  const escT=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const uidT=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);

  window.renderTeachers=function(){
    content.innerHTML=`<div class="page-head"><div><h2>Teacher Management</h2><p>Add, edit, search and manage teacher profiles.</p></div><button class="btn btn-primary" onclick="openTeacherModal()">+ Add Teacher</button></div><div class="toolbar"><input class="input" id="teacherSearch" placeholder="Search name, subject, phone..." oninput="filterTeachers()"><select class="select" id="teacherStatus" onchange="filterTeachers()"><option value="All">All</option><option value="Active">Active</option><option value="Inactive">Inactive</option></select></div><div class="card table-card"><div class="table-wrap"><table><thead><tr><th>Name</th><th>Subject</th><th>Phone</th><th>Join Date</th><th>Status</th><th>Action</th></tr></thead><tbody id="teacherRows"></tbody></table></div></div>`;
    filterTeachers();
  };

  window.filterTeachers=function(){
    const q=($("teacherSearch")?.value||'').toLowerCase(), s=$("teacherStatus")?.value||'All';
    const rows=state.teachers.filter(t=>(s==='All'||(t.status||'Active')===s)&&`${t.name} ${t.subject} ${t.phone}`.toLowerCase().includes(q));
    $("teacherRows").innerHTML=rows.length?rows.map(t=>`<tr><td><strong>${escT(t.name)}</strong></td><td>${escT(t.subject)||'—'}</td><td>${escT(t.phone)||'—'}</td><td>${escT(t.joinDate)||'—'}</td><td><span class="badge ${(t.status||'Active').toLowerCase()}">${escT(t.status||'Active')}</span></td><td><button class="table-action" onclick="openTeacherModal('${t.id}')">Edit</button><button class="table-action danger" onclick="deleteTeacher('${t.id}')">Delete</button></td></tr>`).join(''):`<tr><td colspan="6"><div class="empty"><strong>No teachers found</strong>Add a teacher profile to begin.</div></td></tr>`;
  };

  window.openTeacherModal=function(id){
    const t=state.teachers.find(x=>x.id===id)||{name:'',subject:'',phone:'',joinDate:'',status:'Active',address:'',notes:''};
    openModal(`<div class="modal-head"><h3>${id?'Edit':'Add'} Teacher</h3><button class="close" onclick="closeModal()">×</button></div><form onsubmit="saveTeacher(event,'${id||''}')"><div class="form-grid"><div class="field full"><label>Teacher Name</label><input class="input" name="name" value="${escT(t.name)}" required></div><div class="field"><label>Subject</label><input class="input" name="subject" value="${escT(t.subject)}"></div><div class="field"><label>Phone</label><input class="input" name="phone" value="${escT(t.phone)}" inputmode="tel"></div><div class="field"><label>Join Date</label><input class="input" type="date" name="joinDate" value="${escT(t.joinDate)}"></div><div class="field"><label>Status</label><select class="select" name="status"><option ${t.status==='Active'?'selected':''}>Active</option><option ${t.status==='Inactive'?'selected':''}>Inactive</option></select></div><div class="field full"><label>Address</label><input class="input" name="address" value="${escT(t.address)}"></div><div class="field full"><label>Notes</label><input class="input" name="notes" value="${escT(t.notes)}"></div></div><div class="modal-actions"><button type="button" class="btn btn-light" onclick="closeModal()">Cancel</button><button class="btn btn-primary">Save Teacher</button></div></form>`);
  };

  window.saveTeacher=function(e,id){
    e.preventDefault(); const x=Object.fromEntries(new FormData(e.target));
    if(id){const i=state.teachers.findIndex(t=>t.id===id); if(i>=0) state.teachers[i]={...state.teachers[i],...x};}
    else state.teachers.unshift({id:uidT(),...x});
    save(); closeModal(); render();
  };

  window.deleteTeacher=function(id){
    if(confirm('Delete this teacher?')){state.teachers=state.teachers.filter(t=>t.id!==id);save();render();}
  };

  const originalRender=window.render;
  window.render=function(){if(state.page==='teachers') return renderTeachers(); return originalRender();};
})();

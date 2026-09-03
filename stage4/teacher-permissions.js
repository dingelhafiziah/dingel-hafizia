/* Stage 4 — Admin / Teacher roles and permissions (frontend only) */
(function(){
  const KEY='dh_current_user';
  const defaultUser={name:'Admin',role:'Admin'};
  const permissions={
    Admin:{dashboard:true,transactions:true,students:true,fees:true,accounts:true,teachers:true,settings:true},
    Teacher:{dashboard:true,transactions:false,students:true,fees:false,accounts:false,teachers:false,settings:false}
  };
  const readUser=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null')||defaultUser}catch{return defaultUser}};
  const saveUser=u=>localStorage.setItem(KEY,JSON.stringify(u));
  const can=p=>!!permissions[readUser().role]?.[p];
  window.getCurrentUser=readUser;
  window.canAccess=can;
  window.setCurrentUser=function(role,name){if(!permissions[role])return false;saveUser({name:name||role,role});render();return true};
  window.logoutUser=function(){saveUser(defaultUser);render()};

  const originalRender=window.render;
  window.render=function(){
    const u=readUser();
    document.querySelectorAll('.nav-item[data-permission]').forEach(b=>b.style.display=can(b.dataset.permission)?'':'none');
    if(state.page && !can(state.page)){state.page='dashboard';}
    originalRender();
    const host=document.querySelector('.top-actions');
    if(host&&!document.getElementById('roleBadge')){const s=document.createElement('span');s.id='roleBadge';s.className='frontend-badge';host.appendChild(s)}
    const badge=document.getElementById('roleBadge');if(badge)badge.textContent=u.role;
  };

  window.renderPermissions=function(){
    const u=readUser();
    content.innerHTML=`<div class="page-head"><div><h2>Admin / Teacher Access</h2><p>Control the active frontend role and review available access.</p></div></div><div class="summary-grid"><div class="card summary-card"><div class="stat-label">Current User</div><div class="big">${esc(u.name)}</div><div class="stat-note">Role: ${esc(u.role)}</div></div></div><h2 class="section-title">Switch Role</h2><div class="card" style="padding:20px"><div class="form-grid"><div class="field"><label>Name</label><input class="input" id="roleName" value="${esc(u.name)}"></div><div class="field"><label>Role</label><select class="select" id="roleSelect"><option ${u.role==='Admin'?'selected':''}>Admin</option><option ${u.role==='Teacher'?'selected':''}>Teacher</option></select></div></div><div class="modal-actions"><button class="btn btn-primary" onclick="setCurrentUser(document.getElementById('roleSelect').value,document.getElementById('roleName').value)">Save Role</button><button class="btn btn-light" onclick="logoutUser()">Reset to Admin</button></div></div><h2 class="section-title">Permission Matrix</h2><div class="card table-card"><div class="table-wrap"><table><thead><tr><th>Module</th><th>Admin</th><th>Teacher</th></tr></thead><tbody>${['dashboard','transactions','students','fees','accounts','teachers','settings'].map(p=>`<tr><td>${p}</td><td>${permissions.Admin[p]?'Allowed':'—'}</td><td>${permissions.Teacher[p]?'Allowed':'—'}</td></tr>`).join('')}</tbody></table></div></div>`;
  };
})();

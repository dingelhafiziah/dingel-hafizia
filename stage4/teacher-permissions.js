/* Stage 4 — Admin / Teacher roles and permissions (frontend only) */
(function(){
  const KEY='dh_current_user';
  const defaultUser={name:'Admin',role:'Admin'};
  const permissions={
    Admin:{dashboard:true,transactions:true,daily:true,students:true,fees:true,accounts:true,teachers:true,settings:true,permissions:true},
    Teacher:{dashboard:true,transactions:false,daily:false,students:true,fees:true,accounts:false,teachers:false,settings:false,permissions:false}
  };
  const readUser=()=>{try{const u=JSON.parse(localStorage.getItem(KEY)||'null');return permissions[u?.role]?{...defaultUser,...u}:defaultUser}catch(e){return defaultUser}};
  const saveUser=u=>localStorage.setItem(KEY,JSON.stringify(u));
  const can=p=>!!permissions[readUser().role]?.[p];
  const labels={dashboard:'Dashboard',transactions:'Income / Expenses',daily:"Today's Total",students:'Students Data',fees:'Student Fees',accounts:'Accounts Overview',teachers:'Teacher Management',permissions:'Role & Permissions',settings:'Settings'};
  window.getCurrentUser=readUser; window.canAccess=can;
  window.setCurrentUser=function(role,name){if(!permissions[role])return false;saveUser({name:(name||role).trim()||role,role});render();return true};
  window.logoutUser=function(){saveUser(defaultUser);render()};
  const originalNavigate=window.navigate;
  window.navigate=function(page){if(!can(page)){openModal(`<div class="modal-head"><h3>Access Restricted</h3><button class="close" onclick="closeModal()">×</button></div><div class="empty"><strong>Admin access required</strong>This section is not available for the current role.</div><div class="modal-actions"><button class="btn btn-light" onclick="closeModal()">Close</button></div>`);return}return originalNavigate(page)};
  const originalRender=window.render;
  window.render=function(){
    const u=readUser();
    document.querySelectorAll('.nav-item[data-permission]').forEach(b=>b.style.display=can(b.dataset.permission)?'':'none');
    if(state.page&&!can(state.page))state.page='dashboard';
    if(state.page==='permissions')renderPermissions();else originalRender();
    const host=document.querySelector('.top-actions');if(host&&!document.getElementById('roleBadge')){const s=document.createElement('span');s.id='roleBadge';s.className='frontend-badge';host.appendChild(s)}
    const badge=document.getElementById('roleBadge');if(badge)badge.textContent=u.role;
  };
  window.renderPermissions=function(){
    const u=readUser();
    content.innerHTML=`<div class="page-head"><div><h2>Admin / Teacher Access</h2><p>Manage the active frontend role and review module access.</p></div></div><div class="summary-grid"><div class="card summary-card"><div class="stat-label">Current User</div><div class="big">${esc(u.name)}</div><div class="stat-note">Role: ${esc(u.role)}</div></div></div><h2 class="section-title">Switch Role</h2><div class="card" style="padding:20px"><div class="form-grid"><div class="field"><label>Name</label><input class="input" id="roleName" value="${esc(u.name)}"></div><div class="field"><label>Role</label><select class="select" id="roleSelect"><option ${u.role==='Admin'?'selected':''}>Admin</option><option ${u.role==='Teacher'?'selected':''}>Teacher</option></select></div></div><div class="modal-actions"><button class="btn btn-primary" onclick="setCurrentUser(document.getElementById('roleSelect').value,document.getElementById('roleName').value)">Save Role</button><button class="btn btn-light" onclick="logoutUser()">Reset to Admin</button></div></div><h2 class="section-title">Permission Matrix</h2><div class="card table-card"><div class="table-wrap"><table><thead><tr><th>Module</th><th>Admin</th><th>Teacher</th></tr></thead><tbody>${Object.keys(labels).map(p=>`<tr><td>${labels[p]}</td><td>${permissions.Admin[p]?'Allowed':'—'}</td><td>${permissions.Teacher[p]?'Allowed':'—'}</td></tr>`).join('')}</tbody></table></div></div>`;
  };
})();

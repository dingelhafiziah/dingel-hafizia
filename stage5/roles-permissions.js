/* Stage 5 — Admin / Teacher roles and frontend permission layer (Firebase-ready) */
(function(){
  const ROLE_KEY='dh_current_role';
  const permissions={
    Admin:['dashboard','transactions','daily','students','fees','accounts','teachers','settings'],
    Teacher:['dashboard','students','fees']
  };
  const role=()=>localStorage.getItem(ROLE_KEY)||'Admin';
  const can=page=>permissions[role()]?.includes(page)===true;
  window.getCurrentRole=role;
  window.canAccess=can;
  window.setCurrentRole=function(next){
    if(!permissions[next]) return false;
    localStorage.setItem(ROLE_KEY,next);
    if(typeof render==='function') render();
    return true;
  };
  window.requireAccess=function(page){
    if(can(page)) return true;
    if(typeof openModal==='function') openModal(`<div class="modal-head"><h3>Access Restricted</h3><button class="close" onclick="closeModal()">×</button></div><div class="empty"><strong>Teacher access is limited</strong>This section is available to Admin only.</div><div class="modal-actions"><button class="btn btn-light" onclick="closeModal()">Close</button></div>`);
    return false;
  };
  window.renderRoleSwitcher=function(){
    return `<div class="card" style="margin-bottom:16px"><div class="stat-label">Current Role</div><div style="display:flex;gap:8px;align-items:center;margin-top:8px"><strong>${role()}</strong><select class="select" onchange="setCurrentRole(this.value)"><option ${role()==='Admin'?'selected':''}>Admin</option><option ${role()==='Teacher'?'selected':''}>Teacher</option></select></div><div class="stat-note">Frontend role simulation; Firebase Authentication will provide real account security later.</div></div>`;
  };
  const originalNavigate=window.navigate;
  window.navigate=function(page){
    if(!can(page)) return requireAccess(page);
    return originalNavigate(page);
  };
})();

/* Stage 4 — Settings / App Configuration (frontend only, Firebase-ready) */
(function(){
  const KEY='dh_settings';
  const defaults={
    madrasaName:'Dingel Hafizia Madrasa',
    appName:'Dingel Hafizia App',
    subtitle:'Management App',
    address:'',
    phone:'',
    email:'',
    language:'Bangla',
    currency:'₹',
    logo:'',
    receiptFooter:'Thank you',
    dateFormat:'DD/MM/YYYY'
  };
  const load=()=>{try{const x=JSON.parse(localStorage.getItem(KEY)||'null');return {...defaults,...(x&&typeof x==='object'?x:{})}}catch{return {...defaults}}};
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const save=s=>localStorage.setItem(KEY,JSON.stringify(s));
  window.getAppSettings=load;
  window.renderSettings=function(){
    const s=load();
    content.innerHTML=`<div class="page-head"><div><h2>Settings</h2><p>Edit the madrasa and app information used throughout the frontend.</p></div><button class="btn btn-light" onclick="resetAppSettings()">Reset Defaults</button></div>
    <form class="card" style="padding:20px" onsubmit="saveAppSettings(event)">
      <h3>Institution & App</h3><div class="form-grid">
      <div class="field full"><label>Madrasa Name</label><input class="input" name="madrasaName" value="${esc(s.madrasaName)}" required></div>
      <div class="field"><label>App Name</label><input class="input" name="appName" value="${esc(s.appName)}" required></div>
      <div class="field"><label>Subtitle</label><input class="input" name="subtitle" value="${esc(s.subtitle)}"></div>
      <div class="field full"><label>Address</label><input class="input" name="address" value="${esc(s.address)}"></div>
      <div class="field"><label>Phone</label><input class="input" name="phone" value="${esc(s.phone)}" inputmode="tel"></div>
      <div class="field"><label>Email</label><input class="input" type="email" name="email" value="${esc(s.email)}"></div>
      <div class="field"><label>Language</label><select class="select" name="language"><option ${s.language==='Bangla'?'selected':''}>Bangla</option><option ${s.language==='English'?'selected':''}>English</option></select></div>
      <div class="field"><label>Currency</label><select class="select" name="currency"><option ${s.currency==='₹'?'selected':''}>₹</option><option ${s.currency==='$'?'selected':''}>$</option><option ${s.currency==='৳'?'selected':''}>৳</option></select></div>
      <div class="field"><label>Date Format</label><select class="select" name="dateFormat"><option ${s.dateFormat==='DD/MM/YYYY'?'selected':''}>DD/MM/YYYY</option><option ${s.dateFormat==='MM/DD/YYYY'?'selected':''}>MM/DD/YYYY</option><option ${s.dateFormat==='YYYY-MM-DD'?'selected':''}>YYYY-MM-DD</option></select></div>
      <div class="field full"><label>Receipt Footer</label><input class="input" name="receiptFooter" value="${esc(s.receiptFooter)}"></div>
      <div class="field full"><label>Logo</label><input class="input" id="settingsLogo" type="file" accept="image/png,image/jpeg,image/webp" onchange="previewSettingsLogo(event)"><div id="logoPreview" style="margin-top:10px">${s.logo?`<img src="${s.logo}" alt="Logo" style="max-width:120px;max-height:80px;border-radius:8px">`:''}</div></div>
      </div><div class="modal-actions"><button type="submit" class="btn btn-primary">Save Settings</button></div></form>`;
  };
  window.previewSettingsLogo=function(e){const f=e.target.files?.[0];if(!f)return;if(f.size>500000){alert('Logo must be 500 KB or smaller.');e.target.value='';return}const r=new FileReader();r.onload=()=>document.getElementById('logoPreview').innerHTML=`<img src="${r.result}" alt="Logo" style="max-width:120px;max-height:80px;border-radius:8px">`;r.readAsDataURL(f)};
  window.saveAppSettings=function(e){e.preventDefault();const s={...load(),...Object.fromEntries(new FormData(e.target))};const file=document.getElementById('settingsLogo')?.files?.[0];if(file){const r=new FileReader();r.onload=()=>{s.logo=r.result;save(s);applySettings(s);renderSettings()};r.readAsDataURL(file)}else{save(s);applySettings(s);renderSettings()}};
  window.resetAppSettings=function(){if(confirm('Reset app settings to defaults?')){save({...defaults});applySettings(defaults);renderSettings()}};
  window.applySettings=function(s){document.title=s.appName||defaults.appName;const brand=document.querySelector('.brand strong');if(brand)brand.textContent=(s.madrasaName||defaults.madrasaName).replace(/\s+Madrasa$/,'');const foot=document.querySelector('.sidebar-footer');if(foot)foot.textContent=`${s.appName||defaults.appName} • Offline`};
  const originalRender=window.render;
  window.render=function(){if(state.page==='settings')return renderSettings();return originalRender()};
  const oldRender=window.render; window.render=function(){applySettings(load());return oldRender()};
  applySettings(load());
})();

// Firebase Authentication integration.
(function(){
  const LOGIN_ERROR={'auth/invalid-email':'Invalid email address.','auth/user-disabled':'This account has been disabled.','auth/user-not-found':'No account found with this email.','auth/wrong-password':'Incorrect password.','auth/invalid-credential':'Email or password is incorrect.','auth/too-many-requests':'Too many attempts. Please try again later.','auth/network-request-failed':'Network connection failed. Please try again.'};
  function setLoading(loading){const b=document.querySelector('#loginForm button[type="submit"]');if(b){b.disabled=loading;b.textContent=loading?'SIGNING IN...':'LOGIN';}}
  window.login=async function(){const email=document.querySelector('#username').value.trim(),password=document.querySelector('#password').value;if(!email||!password)return;setLoading(true);try{await dhAuth.signInWithEmailAndPassword(email,password)}catch(e){alert(LOGIN_ERROR[e.code]||e.message||'Login failed. Please try again.')}finally{setLoading(false)}};
  window.logout=async function(){try{await dhAuth.signOut()}catch(e){alert(e.message||'Logout failed. Please try again.')}};
  window.boot=function(){};
  function showPage(page){document.querySelectorAll('.page').forEach(x=>x.classList.add('hidden'));const target=document.querySelector('#page-'+page);if(target)target.classList.remove('hidden');document.querySelectorAll('.nav-btn').forEach(x=>x.classList.toggle('active',x.dataset.page===page));if(page==='students'&&window.renderStudents)window.renderStudents();if(page==='fees'&&window.renderFees)window.renderFees();if(window.innerWidth<=900&&window.toggleMenu)window.toggleMenu(false)}
  document.addEventListener('DOMContentLoaded',function(){
    const login=document.querySelector('#login'),app=document.querySelector('#app'),form=document.querySelector('#loginForm');
    login.classList.add('hidden');app.classList.add('hidden');
    if(form)form.addEventListener('submit',function(e){e.preventDefault();e.stopImmediatePropagation();window.login()},true);
    document.querySelectorAll('.nav-btn[data-page]').forEach(btn=>btn.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();showPage(btn.dataset.page)},true));
    const username=document.querySelector('#username'),label=username?.closest('.field')?.querySelector('label');if(label)label.textContent='Email';if(username){username.type='email';username.autocomplete='email';username.placeholder='admin@example.com'}
    let resolved=false;
    dhAuth.onAuthStateChanged(function(user){
      resolved=true;
      document.body.classList.remove('auth-loading');
      document.body.classList.add('auth-ready');
      if(user){
        login.classList.add('hidden');
        app.classList.remove('hidden');
        showPage('dashboard');
        const su=document.querySelector('#signedInUser');if(su)su.textContent='Signed in: '+(user.email||'');
      }else{
        app.classList.add('hidden');
        login.classList.remove('hidden');
        const p=document.querySelector('#password');if(p)p.value='';
      }
    });
    setTimeout(function(){if(!resolved){document.body.classList.remove('auth-loading');document.body.classList.add('auth-ready');app.classList.add('hidden');login.classList.remove('hidden')}},5000);
  });
})();

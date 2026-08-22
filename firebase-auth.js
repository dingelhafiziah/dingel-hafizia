// Firebase Authentication integration.
(function () {
  const LOGIN_ERROR = {
    'auth/invalid-email':'Invalid email address.','auth/user-disabled':'This account has been disabled.','auth/user-not-found':'No account found with this email.','auth/wrong-password':'Incorrect password.','auth/invalid-credential':'Email or password is incorrect.','auth/too-many-requests':'Too many attempts. Please try again later.'
  };
  function setLoading(loading){const b=document.querySelector('#loginForm button[type="submit"]');if(b){b.disabled=loading;b.textContent=loading?'SIGNING IN...':'LOGIN';}}
  window.login=async function(){const email=document.querySelector('#username').value.trim(),password=document.querySelector('#password').value;if(!email||!password)return;setLoading(true);try{await dhAuth.signInWithEmailAndPassword(email,password);}catch(e){alert(LOGIN_ERROR[e.code]||'Login failed. Please try again.');}finally{setLoading(false);}};
  window.logout=async function(){try{await dhAuth.signOut();}catch(e){alert('Logout failed. Please try again.');}};
  window.boot=function(){};
  document.addEventListener('DOMContentLoaded',function(){
    const login=document.querySelector('#login'),app=document.querySelector('#app');
    login.classList.add('hidden');app.classList.add('hidden');
    const username=document.querySelector('#username'),label=username?.closest('.field')?.querySelector('label');
    if(label)label.textContent='Email';
    if(username){username.type='email';username.autocomplete='email';username.placeholder='admin@example.com';}
    dhAuth.onAuthStateChanged(function(user){
      document.body.classList.add('auth-ready');
      if(user){login.classList.add('hidden');app.classList.remove('hidden');if(typeof show==='function')show('dashboard');}
      else{app.classList.add('hidden');login.classList.remove('hidden');document.querySelector('#password').value='';}
    });
  });
})();
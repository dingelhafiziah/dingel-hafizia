// Firebase Authentication integration.
// Email/password provider must be enabled in Firebase Console.
(function () {
  const LOGIN_ERROR = {
    "auth/invalid-email": "Invalid email address.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/too-many-requests": "Too many attempts. Please try again later."
  };

  function setLoading(loading) {
    const button = document.querySelector('#loginForm button[type="submit"]');
    if (button) {
      button.disabled = loading;
      button.textContent = loading ? 'SIGNING IN...' : 'LOGIN';
    }
  }

  window.login = async function loginWithFirebase() {
    const email = document.querySelector('#username').value.trim();
    const password = document.querySelector('#password').value;
    if (!email || !password) return;

    setLoading(true);
    try {
      await dhAuth.signInWithEmailAndPassword(email, password);
    } catch (error) {
      alert(LOGIN_ERROR[error.code] || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  window.logout = async function logoutFromFirebase() {
    try {
      await dhAuth.signOut();
    } catch (error) {
      alert('Logout failed. Please try again.');
    }
  };

  window.boot = function firebaseBoot() {
    // Auth state observer below controls access. Never trust the old local login flag.
    sessionStorage.removeItem('dh_login');
    sessionStorage.removeItem('dh_user');
  };

  document.addEventListener('DOMContentLoaded', function () {
    const username = document.querySelector('#username');
    const label = username?.closest('.field')?.querySelector('label');
    if (label) label.textContent = 'Email';
    if (username) {
      username.type = 'email';
      username.autocomplete = 'email';
      username.placeholder = 'admin@example.com';
    }

    dhAuth.onAuthStateChanged(function (user) {
      const login = document.querySelector('#login');
      const app = document.querySelector('#app');
      if (user) {
        login.classList.add('hidden');
        app.classList.remove('hidden');
        if (typeof show === 'function') show('dashboard');
      } else {
        app.classList.add('hidden');
        login.classList.remove('hidden');
        document.querySelector('#password').value = '';
      }
    });
  });
})();

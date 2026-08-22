// Firebase Web configuration for Dingel Hafizia App.
// This is a client-side Firebase config; Firebase Security Rules must protect data.
const firebaseConfig = {
  apiKey: "AIzaSyBMQ_Broxck0FgMyxaf5IoSE0KDlgs-Gxo",
  authDomain: "dingel-hafizia-web-app.firebaseapp.com",
  projectId: "dingel-hafizia-web-app",
  storageBucket: "dingel-hafizia-web-app.firebasestorage.app",
  messagingSenderId: "628673453299",
  appId: "1:628673453299:web:41a55fb9d2d374cd036b86",
  measurementId: "G-C0HLEQ6R3G"
};

firebase.initializeApp(firebaseConfig);
const dhAuth = firebase.auth();

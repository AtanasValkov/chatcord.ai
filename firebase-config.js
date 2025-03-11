// Import Firebase SDK
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyAcAhVtamAVbcaWkKhaL4C6G5NI43eVQPY",
    authDomain: "chatcord-b85dc.firebaseapp.com",
    projectId: "chatcord-b85dc",
    storageBucket: "chatcord-b85dc.firebasestorage.app",
    messagingSenderId: "977257496426",
    appId: "1:977257496426:web:3bdbd935f2e15be7ab6f13",
    measurementId: "G-7NC3ZLRRFG"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);

// Export the database instance so other scripts can use it
export { db };

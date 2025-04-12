import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyBOfDkjLIvfWp0g_CNwWynvWyqW2ghg9KQ",
  authDomain: "personal-app-63d1c.firebaseapp.com",
  projectId: "personal-app-63d1c",
  storageBucket: "personal-app-63d1c.firebasestorage.app",
  messagingSenderId: "558580629507",
  appId: "1:558580629507:web:db944c0322f4be37b94e36",
  measurementId: "G-D2XQCRXVW1"
};

const app = initializeApp(firebaseConfig);
getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);

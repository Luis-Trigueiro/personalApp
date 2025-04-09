import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

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

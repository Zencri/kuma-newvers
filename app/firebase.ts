// app/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  // Corrected Key from your screenshot
  apiKey: "AIzaSyDaZJzc7cRvqs8TSvkRGSM8MsTNu4OcZCY",
  authDomain: "kuma-study.firebaseapp.com",
  projectId: "kuma-study",
  storageBucket: "kuma-study.firebasestorage.app",
  messagingSenderId: "999289452126",
  appId: "1:999289452126:web:68f6d7dc5a01692e0aa6cf"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the tools
export const auth = getAuth(app);
export const db = getFirestore(app);
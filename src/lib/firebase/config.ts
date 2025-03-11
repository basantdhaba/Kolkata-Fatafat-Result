import { initializeApp } from "firebase/app";
import { getAuth, browserLocalPersistence, setPersistence, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB_vEBMO97LCbtm9-uJg2bcC87uoLDohGw",
  authDomain: "number-quest-winner.firebaseapp.com",
  projectId: "number-quest-winner",
  storageBucket: "number-quest-winner.firebasestorage.app",
  messagingSenderId: "668581172709",
  appId: "1:668581172709:web:6c2265980ea54a77630b0c"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Set persistence to LOCAL to keep user logged in
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Error setting auth persistence:", error);
});

// Configure Google provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

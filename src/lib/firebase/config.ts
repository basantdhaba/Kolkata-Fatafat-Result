// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDorK9Drh--JI-PVLp3yKnXwEAshpBNd2Q",
  authDomain: "kolkata-fatafat-result-1st.firebaseapp.com",
  projectId: "kolkata-fatafat-result-1st",
  storageBucket: "kolkata-fatafat-result-1st.firebasestorage.app",
  messagingSenderId: "1064544927762",
  appId: "1:1064544927762:web:8de0a6261f3fcca95a98cb",
  measurementId: "G-X9722PX3KQ"
};

// Initialize Firebase
import { initializeApp } from "firebase/app";
import { getAuth, browserLocalPersistence, setPersistence, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Set persistence to LOCAL to keep user logged in
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Error setting auth persistence:", error);
});

// Configure Google provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Export for use in other files
export { app, auth, db, storage, googleProvider };

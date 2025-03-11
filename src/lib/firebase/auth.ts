import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User, 
  signInWithPopup 
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "./config";
import axios from 'axios';  // Import axios for making HTTP requests to Neon

// Helper function to check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!auth.currentUser;
};

// Helper function to get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Create user profile if it doesn't exist
    const userRef = doc(db, "profiles", user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        id: user.uid,
        name: user.displayName || 'User',
        email: user.email,
        is_admin: user.email === 'bazi.coin.bazar@gmail.com',
        wallet_balance: 0,
        created_at: new Date()
      });
    }
    
    console.log("User Signed In:", user);
    return { user };
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
};

// Auth functions
export const signIn = async (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signUp = async (email: string, password: string, userData: any) => {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  
  // Create user profile
  await setDoc(doc(db, "profiles", user.uid), {
    id: user.uid,
    email: email,
    ...userData,
    wallet_balance: 0,
    is_admin: email === 'bazi.coin.bazar@gmail.com', // Set is_admin true for the admin email
    created_at: new Date()
  });
  
  return { user };
};

export const logOut = async () => {
  return signOut(auth);
};

// For listening to auth state changes
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Function to store game data in Neon
export const storeGameDataInNeon = async (userId: string, gameData: any) => {
  try {
    // Send data to your Neon database via API (assuming you have a backend API for Neon)
    await axios.post('YOUR_SERVER_ENDPOINT_HERE', { 
      user_id: userId, 
      game_data: gameData 
    });

    console.log('Game data successfully stored in Neon!');
  } catch (error) {
    console.error('Error storing game data in Neon:', error);
  }
};

// Example: Use this inside onAuthStateChanged or another relevant place
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userId = user.uid;
    const gameData = {
      game_name: 'Kolkata Fatafat',
      round: 3,
      bet_type: 'Single',
      played_number: '5',
      bet_amount: 50.00,
    };

    // Store game data in Neon after authentication
    await storeGameDataInNeon(userId, gameData);
  }
});
    

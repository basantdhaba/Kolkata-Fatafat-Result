
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from "firebase/auth";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "./config";

// Helper function to check if user is admin
export const isAdmin = async (): Promise<boolean> => {
  try {
    const user = auth.currentUser;
    if (!user) return false;

    // Check if admin by email address first (for initial admin access)
    if (user.email === 'bazi.coin.bazar@gmail.com') {
      return true;
    }

    // As fallback, check the profiles collection
    const userRef = doc(db, "profiles", user.uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data().is_admin === true;
    }
    
    return false;
  } catch (error) {
    console.error('Admin check error:', error);
    // If there are permission errors, fall back to email check
    const user = auth.currentUser;
    return user?.email === 'bazi.coin.bazar@gmail.com' || false;
  }
};

// Helper function to initialize admin account
export const initializeAdminAccount = async (): Promise<boolean> => {
  try {
    // Check if admin exists
    const adminEmail = 'bazi.coin.bazar@gmail.com';
    const adminPassword = 'Admin@1980';

    try {
      // Check if admin email exists
      const methods = await fetchSignInMethodsForEmail(auth, adminEmail);
      
      if (methods.length > 0) {
        // Admin exists, try to sign in
        await signInWithEmailAndPassword(auth, adminEmail, adminPassword)
          .then(async (userCredential) => {
            const user = userCredential.user;
            
            // Create or update admin profile
            try {
              const profileRef = doc(db, "profiles", user.uid);
              await setDoc(profileRef, {
                id: user.uid,
                name: 'Admin',
                email: adminEmail,
                is_admin: true,
                wallet_balance: 0
              }, { merge: true }); // Use merge to update existing document
            } catch (profileError) {
              console.error("Error updating admin profile:", profileError);
            }
          })
          .catch((error) => {
            console.log("Admin login failed, but account exists:", error.message);
          });
      } else {
        // Admin doesn't exist, create the account
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
          const user = userCredential.user;
          
          // Create admin profile
          await setDoc(doc(db, "profiles", user.uid), {
            id: user.uid,
            name: 'Admin',
            email: adminEmail,
            is_admin: true,
            wallet_balance: 0
          });
        } catch (createError: any) {
          console.error("Error creating admin account:", createError.message);
          // If email already in use, it's ok - we tried our best
          if (createError.code !== "auth/email-already-in-use") {
            throw createError;
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Error initializing admin account:', error);
      return false;
    }
  } catch (error) {
    console.error('Error initializing admin account:', error);
    return false;
  }
};

// Get all users in the system (admin only)
export const getAllUsers = async () => {
  try {
    const adminStatus = await isAdmin();
    if (!adminStatus) {
      throw new Error("Only admins can access user data");
    }
    
    const usersRef = collection(db, "profiles");
    const querySnapshot = await getDocs(usersRef);
    
    return querySnapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
};

// Get all bets for a specific game and round (admin only)
export const getGameRoundBets = async (gameId: string, roundNumber: number) => {
  try {
    const adminStatus = await isAdmin();
    if (!adminStatus) {
      throw new Error("Only admins can access bet data");
    }
    
    const betsRef = collection(db, "bets");
    const q = query(
      betsRef,
      where("game_id", "==", gameId),
      where("round_number", "==", roundNumber)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting game round bets:', error);
    return [];
  }
};

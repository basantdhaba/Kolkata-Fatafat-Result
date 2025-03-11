
import { 
  doc, 
  getDoc, 
  updateDoc,
} from "firebase/firestore";
import { db } from "./config";

// User profile functions
export const getUserProfile = async (userId: string) => {
  const docRef = doc(db, "profiles", userId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data();
  }
  
  return null;
};

// Wallet functions
export const updateUserWallet = async (userId: string, amount: number) => {
  try {
    const userRef = doc(db, "profiles", userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const currentBalance = userData.wallet_balance || 0;
      await updateDoc(userRef, {
        wallet_balance: currentBalance + amount
      });
      console.log(`Updated wallet for user ${userId}: ${currentBalance} + ${amount} = ${currentBalance + amount}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error updating user wallet:', error);
    return false;
  }
};

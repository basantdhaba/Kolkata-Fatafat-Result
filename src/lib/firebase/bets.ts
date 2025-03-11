
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  addDoc,
  doc,
  getDoc,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "./config";
import { updateUserWallet } from "./profile";
import { getGames } from "./games";

// Game history functions
export const getUserGameHistory = async (userId: string) => {
  try {
    const betsRef = collection(db, "bets");
    const q = query(
      betsRef,
      where("user_id", "==", userId),
      orderBy("played_at", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching user game history:', error);
    return [];
  }
};

// Place bet function
export const placeBet = async (betData: any) => {
  try {
    // Add bet to Firestore
    const betRef = collection(db, "bets");
    const newBet = {
      ...betData,
      status: "Pending",
      played_at: serverTimestamp()
    };
    
    const docRef = await addDoc(betRef, newBet);
    console.log(`Placed bet with ID: ${docRef.id}`);
    
    // Deduct amount from user wallet
    if (betData.user_id && betData.amount) {
      const userRef = doc(db, "profiles", betData.user_id);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const currentBalance = userData.wallet_balance || 0;
        
        // Make sure they have enough balance
        if (currentBalance >= betData.amount) {
          await updateUserWallet(betData.user_id, -betData.amount);
          return { success: true, betId: docRef.id };
        } else {
          // Not enough balance
          return { success: false, error: "Insufficient wallet balance" };
        }
      }
    }
    
    return { success: true, betId: docRef.id };
  } catch (error) {
    console.error('Error placing bet:', error);
    return { success: false, error: error };
  }
};

// Export game data to Excel
export const exportGameData = async (gameId: string, roundNumber: number) => {
  try {
    console.log(`Exporting data for game ${gameId}, round ${roundNumber}`);
    const betsRef = collection(db, "bets");
    const q = query(
      betsRef,
      where("game_id", "==", gameId),
      where("round_number", "==", roundNumber)
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`Found ${querySnapshot.docs.length} bets to export`);
    
    // Get game name (for better reporting)
    const gamesData = await getGames();
    const game = gamesData.find((g: any) => g.id.toString() === gameId.toString());
    const gameName = game ? game.name : `Game ${gameId}`;
    
    // Enhance the data with game name for better reporting
    const betsData = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        game_name: gameName,
        date: data.played_at ? new Date(typeof data.played_at === 'string' ? data.played_at : data.played_at.toDate()).toLocaleDateString() : new Date().toLocaleDateString(),
        ...data
      };
    });
    
    return betsData;
  } catch (error) {
    console.error('Error exporting game data:', error);
    return [];
  }
};

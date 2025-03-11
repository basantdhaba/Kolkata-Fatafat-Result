
import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  writeBatch,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../config";
import { updateUserWallet } from "../profile";

// Process bets for a game result
export const processBetsForResult = async (gameId: string, roundNumber: number, result: string) => {
  try {
    console.log(`Processing bets for game ${gameId}, round ${roundNumber}, result ${result}`);
    
    const betsRef = collection(db, "bets");
    const q = query(
      betsRef,
      where("game_id", "==", gameId),
      where("round_number", "==", roundNumber),
      where("status", "==", "Pending")
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`Found ${querySnapshot.docs.length} pending bets to process`);
    
    const batch = writeBatch(db);
    
    // Track users who need wallet updates
    const walletUpdates: Record<string, number> = {};
    
    // Process each bet
    for (const betDoc of querySnapshot.docs) {
      const bet = betDoc.data();
      let won = false;
      let winAmount = 0;
      
      // Calculate if bet won based on bet type
      if (bet.type === 'single' && bet.number === result[result.length - 1]) {
        won = true;
        winAmount = Number(bet.amount) * (bet.win_rate || 9);
      } else if (bet.type === 'patti' && bet.number === result) {
        won = true;
        winAmount = Number(bet.amount) * (bet.win_rate || 90);
      } else if (bet.type === 'juri') {
        // Fix juri result calculation
        const [first, second] = (bet.combination || bet.number || '').split('-');
        const lastDigit = result[result.length - 1];
        
        if (first === lastDigit || second === lastDigit) {
          won = true;
          winAmount = Number(bet.amount) * (bet.win_rate || 9);
        }
      }
      
      console.log(`Bet ${betDoc.id}: type=${bet.type}, number=${bet.number || bet.combination}, result=${result}, won=${won}, winAmount=${winAmount}`);
      
      // Update the bet document
      const betRef = doc(db, "bets", betDoc.id);
      batch.update(betRef, {
        status: won ? 'Won' : 'Lost',
        result: result,
        win_amount: won ? winAmount : 0,
        is_winner: won,
        processed_at: serverTimestamp()
      });
      
      // Track wallet updates for winners
      if (won && bet.user_id) {
        if (!walletUpdates[bet.user_id]) {
          walletUpdates[bet.user_id] = 0;
        }
        walletUpdates[bet.user_id] += winAmount;
      }
    }
    
    // Commit the batch update
    await batch.commit();
    console.log(`Batch update committed for ${querySnapshot.docs.length} bets`);
    
    // Process wallet updates for winners
    console.log(`Processing wallet updates for ${Object.keys(walletUpdates).length} users`);
    for (const userId in walletUpdates) {
      await updateUserWallet(userId, walletUpdates[userId]);
    }
    
    return true;
  } catch (error) {
    console.error('Error processing bets:', error);
    throw error;
  }
};

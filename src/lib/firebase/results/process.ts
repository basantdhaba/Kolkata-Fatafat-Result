import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  writeBatch,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { db } from "../config";
import { updateUserWallet } from "../profile";

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
    const walletUpdates: Record<string, number> = {};
    let processedBets = 0;
    
    // Process each bet
    for (const betDoc of querySnapshot.docs) {
      try {
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
          const [first, second] = (bet.combination || bet.number || '').split('-');
          const lastDigit = result[result.length - 1];
          
          if (first === lastDigit || second === lastDigit) {
            won = true;
            winAmount = Number(bet.amount) * (bet.win_rate || 9);
          }
        }
        
        // Update the bet document
        const betRef = doc(db, "bets", betDoc.id);
        batch.update(betRef, {
          status: won ? 'Won' : 'Lost',
          result: result,
          win_amount: won ? winAmount : 0,
          is_winner: won,
          processed_at: serverTimestamp(),
          utc_processed: Timestamp.fromDate(new Date()),
          ist_processed: Timestamp.fromDate(new Date(Date.now() + (5.5 * 60 * 60 * 1000)))
        });
        
        // Track wallet updates for winners
        if (won && bet.user_id) {
          if (!walletUpdates[bet.user_id]) {
            walletUpdates[bet.user_id] = 0;
          }
          walletUpdates[bet.user_id] += winAmount;
        }
        
        processedBets++;
      } catch (betError) {
        console.error(`Error processing bet ${betDoc.id}:`, betError);
        continue;
      }
    }
    
    // Commit the batch update
    if (processedBets > 0) {
      await batch.commit();
      console.log(`Batch update committed for ${processedBets} bets`);
    }
    
    // Process wallet updates for winners
    let updatedWallets = 0;
    for (const userId in walletUpdates) {
      try {
        await updateUserWallet(userId, walletUpdates[userId]);
        updatedWallets++;
      } catch (walletError) {
        console.error(`Error updating wallet for user ${userId}:`, walletError);
        continue;
      }
    }
    
    console.log(`Updated ${updatedWallets} user wallets`);
    return true;
  } catch (error) {
    console.error('Error processing bets:', error);
    throw error;
  }
};


import { 
  doc, 
  setDoc,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../config";
import { processBetsForResult } from "./process";
import { createResultBackup } from "./backup";

// Result management functions
export const updateGameResult = async (gameId: string, roundNumber: number, result: string) => {
  try {
    console.log(`Updating result for game ${gameId}, round ${roundNumber} with result ${result}`);
    
    // Create a backup of current state before updating
    await createResultBackup(gameId, roundNumber);
    
    const today = new Date().toISOString().split('T')[0];
    const resultId = `${gameId}_${today}_${roundNumber}`;
    const resultRef = doc(db, "game_results", resultId);
    
    // Save the result exactly as entered without sorting or changing
    await setDoc(resultRef, {
      game_id: gameId,
      date: today,
      round_number: roundNumber,
      result: result, // Store exactly as entered
      timestamp: serverTimestamp()
    }, { merge: true });
    
    // Process bets for this game and round
    await processBetsForResult(gameId, roundNumber, result);
    
    return true;
  } catch (error) {
    console.error('Error updating game result:', error);
    return false;
  }
};

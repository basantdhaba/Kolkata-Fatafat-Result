import { 
  doc, 
  setDoc,
  serverTimestamp,
  Timestamp,
  getDoc
} from "firebase/firestore";
import { db } from "../config";
import { processBetsForResult } from "./process";
import { createResultBackup } from "./backup";

const verifyResultUpdate = async (gameId: string, roundNumber: number, result: string) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const resultId = `${gameId}_${today}_${roundNumber}`;
    const resultRef = doc(db, "game_results", resultId);
    const resultDoc = await getDoc(resultRef);
    
    if (!resultDoc.exists()) {
      console.error('Result document not found after update');
      return false;
    }
    
    const data = resultDoc.data();
    return data.result === result && data.update_status === 'completed';
  } catch (error) {
    console.error('Error verifying result update:', error);
    return false;
  }
};

export const updateGameResult = async (gameId: string, roundNumber: number, result: string) => {
  try {
    console.log(`Starting result update for game ${gameId}, round ${roundNumber} with result ${result}`);
    
    // Create backup
    const backupCreated = await createResultBackup(gameId, roundNumber);
    if (!backupCreated) {
      console.error('Backup creation failed');
      throw new Error('Backup creation failed');
    }
    
    const today = new Date().toISOString().split('T')[0];
    const resultId = `${gameId}_${today}_${roundNumber}`;
    const resultRef = doc(db, "game_results", resultId);
    
    // Save initial result
    await setDoc(resultRef, {
      game_id: gameId,
      date: today,
      round_number: roundNumber,
      result: result,
      timestamp: serverTimestamp(),
      update_status: 'pending',
      last_updated: new Date().toISOString(),
      update_attempt: 1
    }, { merge: true });
    
    // Process bets
    const betsProcessed = await processBetsForResult(gameId, roundNumber, result);
    if (!betsProcessed) {
      throw new Error('Failed to process bets');
    }
    
    // Mark as completed
    await setDoc(resultRef, {
      update_status: 'completed',
      completed_at: serverTimestamp()
    }, { merge: true });
    
    // Verify the update
    const isVerified = await verifyResultUpdate(gameId, roundNumber, result);
    if (!isVerified) {
      throw new Error('Result verification failed');
    }
    
    console.log(`Result update completed successfully for game ${gameId}, round ${roundNumber}`);
    return true;
  } catch (error) {
    console.error('Error in updateGameResult:', error);
    
    // Try to mark the update as failed
    try {
      const resultId = `${gameId}_${new Date().toISOString().split('T')[0]}_${roundNumber}`;
      const resultRef = doc(db, "game_results", resultId);
      await setDoc(resultRef, {
        update_status: 'failed',
        error_message: error.message,
        failed_at: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.error('Failed to mark update as failed:', e);
    }
    
    return false;
  }
};

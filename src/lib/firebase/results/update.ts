import { 
  doc, 
  setDoc,
  serverTimestamp,
  Timestamp,
  getDoc,
  runTransaction
} from "firebase/firestore";
import { db } from "../config";
import { processBetsForResult } from "./process";
import { createResultBackup } from "./backup";

// Helper function to get IST date
const getISTDate = () => {
  // IST is UTC+5:30
  const now = new Date();
  const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  return istTime.toISOString().split('T')[0];
};

// Helper function to get IST time
const getISTTime = () => {
  const now = new Date();
  const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  return istTime.toISOString();
};

// Helper function to check if result already exists
const checkExistingResult = async (gameId: string, roundNumber: number) => {
  try {
    const today = getISTDate();
    const resultId = `${gameId}_${today}_${roundNumber}`;
    const resultRef = doc(db, "game_results", resultId);
    const resultDoc = await getDoc(resultRef);
    return resultDoc.exists();
  } catch (error) {
    console.error('Error checking existing result:', error);
    return false;
  }
};

const verifyResultUpdate = async (gameId: string, roundNumber: number, result: string) => {
  try {
    const today = getISTDate();
    const resultId = `${gameId}_${today}_${roundNumber}`;
    const resultRef = doc(db, "game_results", resultId);
    const resultDoc = await getDoc(resultRef);
    
    if (!resultDoc.exists()) {
      console.error('Result document not found after update');
      return false;
    }
    
    const data = resultDoc.data();
    return data.result === result;
  } catch (error) {
    console.error('Error verifying result update:', error);
    return false;
  }
};

export const updateGameResult = async (gameId: string, roundNumber: number, result: string) => {
  if (!gameId || !roundNumber || !result) {
    console.error('Missing required parameters');
    return {
      success: false,
      error: 'Missing required parameters'
    };
  }

  try {
    console.log(`Starting result update for game ${gameId}, round ${roundNumber} with result ${result}`);
    
    // Check if result already exists
    const exists = await checkExistingResult(gameId, roundNumber);
    if (exists) {
      console.log('Result already exists, updating...');
    }
    
    // Use transaction for atomic updates
    await runTransaction(db, async (transaction) => {
      const today = getISTDate();
      const resultId = `${gameId}_${today}_${roundNumber}`;
      const resultRef = doc(db, "game_results", resultId);
      
      // Create backup first
      await createResultBackup(gameId, roundNumber);
      
      const istTimestamp = Timestamp.fromDate(new Date(Date.now() + (5.5 * 60 * 60 * 1000)));
      
      // Save the result
      transaction.set(resultRef, {
        game_id: gameId,
        date: today,
        round_number: roundNumber,
        result: result,
        timestamp: serverTimestamp(),
        ist_timestamp: istTimestamp,
        ist_time: getISTTime(),
        update_status: 'pending',
        last_updated: new Date().toISOString()
      }, { merge: true });
      
      // Also save to history collection
      const historyRef = doc(db, "result_history", `${gameId}_${today}_${roundNumber}`);
      transaction.set(historyRef, {
        game_id: gameId,
        date: today,
        round_number: roundNumber,
        result: result,
        timestamp: serverTimestamp(),
        ist_timestamp: istTimestamp,
        ist_time: getISTTime()
      }, { merge: true });
    });
    
    // Process bets
    await processBetsForResult(gameId, roundNumber, result);
    
    // Mark as completed
    const today = getISTDate();
    const resultId = `${gameId}_${today}_${roundNumber}`;
    const resultRef = doc(db, "game_results", resultId);
    
    await setDoc(resultRef, {
      update_status: 'completed',
      completed_at: serverTimestamp()
    }, { merge: true });
    
    // Final verification
    const isVerified = await verifyResultUpdate(gameId, roundNumber, result);
    if (!isVerified) {
      throw new Error('Result verification failed');
    }
    
    console.log(`Result update completed successfully for game ${gameId}, round ${roundNumber}`);
    return {
      success: true,
      message: 'Result updated successfully'
    };
  } catch (error) {
    console.error('Error in updateGameResult:', error);
    
    // Log the error details
    try {
      const today = getISTDate();
      const resultId = `${gameId}_${today}_${roundNumber}`;
      const resultRef = doc(db, "game_results", resultId);
      await setDoc(resultRef, {
        update_status: 'failed',
        error_message: error.message,
        failed_at: serverTimestamp(),
        error_details: JSON.stringify(error)
      }, { merge: true });
      
      // Also log to errors collection for tracking
      const errorRef = doc(db, "result_errors", `${gameId}_${today}_${roundNumber}`);
      await setDoc(errorRef, {
        game_id: gameId,
        round_number: roundNumber,
        error: error.message,
        timestamp: serverTimestamp(),
        ist_timestamp: Timestamp.fromDate(new Date(Date.now() + (5.5 * 60 * 60 * 1000))),
        stack: error.stack
      });
    } catch (e) {
      console.error('Failed to log error:', e);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
};

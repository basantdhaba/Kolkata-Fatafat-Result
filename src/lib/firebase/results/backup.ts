
import { 
  doc, 
  collection,
  query,
  where,
  getDocs, 
  setDoc, 
  serverTimestamp,
  orderBy
} from "firebase/firestore";
import { db } from "../config";
import { getUserProfile } from "../profile";

// Create a backup before updating results
export const createResultBackup = async (gameId: string, roundNumber: number) => {
  try {
    console.log(`Creating backup for game ${gameId}, round ${roundNumber}`);
    
    // Get all pending bets for this game and round
    const betsRef = collection(db, "bets");
    const q = query(
      betsRef,
      where("game_id", "==", gameId),
      where("round_number", "==", roundNumber),
      where("status", "==", "Pending")
    );
    
    const querySnapshot = await getDocs(q);
    const betsToBackup = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`Found ${betsToBackup.length} bets to backup`);
    
    // Get all user profiles that have placed bets
    const userIds = [...new Set(betsToBackup.map((bet: any) => bet.user_id))];
    const userProfiles: Record<string, any> = {};
    
    for (const userId of userIds) {
      const profile = await getUserProfile(userId);
      if (profile) {
        userProfiles[userId] = profile;
      }
    }
    
    console.log(`Backing up profiles for ${Object.keys(userProfiles).length} users`);
    
    // Create backup document
    const backupId = `${gameId}_${roundNumber}_${new Date().getTime()}`;
    const backupRef = doc(db, "result_backups", backupId);
    
    await setDoc(backupRef, {
      game_id: gameId,
      round_number: roundNumber,
      timestamp: serverTimestamp(),
      bets: betsToBackup,
      user_profiles: userProfiles
    });
    
    return backupId;
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
};

// Get available backups for a game
export const getResultBackups = async (gameId: string, roundNumber: number) => {
  try {
    console.log(`Getting backups for game ${gameId}, round ${roundNumber}`);
    const backupsRef = collection(db, "result_backups");
    const q = query(
      backupsRef,
      where("game_id", "==", gameId),
      where("round_number", "==", roundNumber),
      orderBy("timestamp", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`Found ${querySnapshot.docs.length} backups`);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting backups:', error);
    return [];
  }
};

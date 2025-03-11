
import { 
  doc, 
  getDoc, 
  writeBatch,
  updateDoc
} from "firebase/firestore";
import { db } from "../config";

// Restore from backup if needed
export const restoreFromBackup = async (backupId: string) => {
  try {
    console.log(`Restoring from backup ${backupId}`);
    const backupRef = doc(db, "result_backups", backupId);
    const backupDoc = await getDoc(backupRef);
    
    if (!backupDoc.exists()) {
      throw new Error("Backup not found");
    }
    
    const backup = backupDoc.data();
    const batch = writeBatch(db);
    
    // Restore bets to their previous state
    for (const bet of backup.bets || []) {
      const betRef = doc(db, "bets", bet.id);
      batch.update(betRef, {
        status: "Pending",
        result: null,
        win_amount: 0,
        is_winner: false,
        processed_at: null
      });
    }
    
    // Commit the bet updates
    await batch.commit();
    console.log(`Restored ${backup.bets?.length || 0} bets to pending status`);
    
    // Restore user wallet balances
    for (const userId in backup.user_profiles || {}) {
      const userRef = doc(db, "profiles", userId);
      const profile = backup.user_profiles[userId];
      
      await updateDoc(userRef, {
        wallet_balance: profile.wallet_balance || 0
      });
      console.log(`Restored wallet balance for user ${userId} to ${profile.wallet_balance || 0}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error restoring from backup:', error);
    return false;
  }
};

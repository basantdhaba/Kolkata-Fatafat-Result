
import { 
  doc, 
  getDoc, 
  setDoc,
} from "firebase/firestore";
import { db } from "./config";

// Game functions
export const saveGames = async (games: any[]) => {
  try {
    const gamesRef = doc(db, "settings", "games");
    await setDoc(gamesRef, { games: games });
    return true;
  } catch (error) {
    console.error('Error saving games:', error);
    return false;
  }
};

export const getGames = async () => {
  try {
    const gamesRef = doc(db, "settings", "games");
    const docSnap = await getDoc(gamesRef);
    
    if (docSnap.exists()) {
      return docSnap.data().games;
    }
    
    return [];
  } catch (error) {
    console.error('Error getting games:', error);
    return [];
  }
};

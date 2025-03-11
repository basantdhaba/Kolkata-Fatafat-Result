
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./config";

// Upload Excel file to Firebase Storage
export const uploadExcelFile = async (file: File, gameId: string, roundNumber: number) => {
  try {
    console.log(`Uploading Excel file for game ${gameId}, round ${roundNumber}`);
    const storageRef = ref(storage, `reports/${gameId}_${roundNumber}_${new Date().getTime()}.xlsx`);
    await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(storageRef);
    console.log(`File uploaded, URL: ${downloadUrl}`);
    return downloadUrl;
  } catch (error) {
    console.error('Error uploading Excel file:', error);
    throw error;
  }
};

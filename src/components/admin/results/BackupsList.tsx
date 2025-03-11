
import React from "react";
import { Button } from "@/components/ui/button";
import { Timestamp } from "firebase/firestore";
import { restoreFromBackup } from "@/lib/firebase";
import { toast } from "sonner";

interface BackupsListProps {
  backups: any[];
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const BackupsList = ({ backups, loading, setLoading }: BackupsListProps) => {
  const handleRestoreBackup = async (backupId: string) => {
    try {
      setLoading(true);
      const success = await restoreFromBackup(backupId);
      
      if (success) {
        toast.success("Successfully restored from backup");
      } else {
        toast.error("Failed to restore from backup");
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
      toast.error("Error restoring backup");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    if (timestamp instanceof Timestamp) {
      return new Date(timestamp.toMillis()).toLocaleString();
    } 
    
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return new Date(timestamp.toDate()).toLocaleString();
    }
    
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleString();
    }
    
    return new Date(timestamp).toLocaleString();
  };

  if (backups.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <h3 className="text-lg font-medium mb-2">Available Backups</h3>
      <div className="border rounded-md p-4 space-y-2">
        {backups.map((backup) => (
          <div key={backup.id} className="flex justify-between items-center border-b pb-2">
            <div>
              <p className="font-medium">
                Backup from {formatDate(backup.timestamp)}
              </p>
              <p className="text-sm text-gray-500">
                {backup.bets?.length || 0} bets, {Object.keys(backup.user_profiles || {}).length} users
              </p>
            </div>
            <Button 
              onClick={() => handleRestoreBackup(backup.id)} 
              variant="destructive"
              size="sm"
              disabled={loading}
            >
              Restore
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BackupsList;

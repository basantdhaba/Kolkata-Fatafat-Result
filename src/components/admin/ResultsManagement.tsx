
import React, { useState } from "react";
import { Game } from "@/types/game";
import { getResultBackups } from "@/lib/firebase";
import { toast } from "sonner";
import ResultForm from "./results/ResultForm";
import BackupsList from "./results/BackupsList";

interface ResultsManagementProps {
  games: Game[];
}

const ResultsManagement = ({ games }: ResultsManagementProps) => {
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleResultUpdated = async (gameId: string, roundNumber: number) => {
    if (!gameId || !roundNumber) {
      toast.error("Please select game and round");
      return;
    }

    try {
      setLoading(true);
      const roundBackups = await getResultBackups(gameId, roundNumber);
      setBackups(roundBackups);
      
      if (roundBackups.length === 0) {
        toast.info("No backups found for this game and round");
      }
    } catch (error) {
      console.error('Error loading backups:', error);
      toast.error("Error loading backups");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <ResultForm 
        games={games} 
        onResultUpdated={handleResultUpdated} 
        setLoading={setLoading} 
        loading={loading}
      />
      
      <BackupsList 
        backups={backups} 
        loading={loading} 
        setLoading={setLoading} 
      />
    </div>
  );
};

export default ResultsManagement;

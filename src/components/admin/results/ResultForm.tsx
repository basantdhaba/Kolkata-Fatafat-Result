
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Game } from "@/types/game";
import { updateGameResult } from "@/lib/firebase";

interface ResultFormProps {
  games: Game[];
  onResultUpdated: (gameId: string, roundNumber: number) => void;
  setLoading: (loading: boolean) => void;
  loading: boolean;
}

const ResultForm = ({ games, onResultUpdated, setLoading, loading }: ResultFormProps) => {
  const [selectedGame, setSelectedGame] = useState("");
  const [selectedRound, setSelectedRound] = useState("");
  const [result, setResult] = useState("");

  const handleResultUpdate = async () => {
    if (!selectedGame || !selectedRound || !result) {
      toast.error("Please fill all fields");
      return;
    }

    if (result.length !== 3) {
      toast.error("Result must be 3 digits");
      return;
    }

    try {
      setLoading(true);
      console.log("Updating result for game:", selectedGame, "round:", selectedRound, "result:", result);
      
      // Pass the result exactly as entered - don't sort or modify
      const success = await updateGameResult(selectedGame, parseInt(selectedRound), result);
      
      if (success) {
        toast.success("Result updated and winnings processed");
        setResult("");
        
        // Notify parent to load backups
        onResultUpdated(selectedGame, parseInt(selectedRound));
      } else {
        toast.error("Failed to update result");
      }
    } catch (error) {
      console.error('Error in handleResultUpdate:', error);
      toast.error("Error updating result: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Select Game</Label>
          <select 
            className="w-full border rounded-md p-2"
            value={selectedGame}
            onChange={(e) => setSelectedGame(e.target.value)}
          >
            <option value="">Select game</option>
            {games.map((game) => (
              <option key={game.id} value={game.id}>
                {game.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Select Round</Label>
          <select
            className="w-full border rounded-md p-2"
            value={selectedRound}
            onChange={(e) => setSelectedRound(e.target.value)}
          >
            <option value="">Select round</option>
            {selectedGame && 
              games
                .find((g) => g.id.toString() === selectedGame)
                ?.roundTimings.map((round) => (
                  <option key={round.roundNumber} value={round.roundNumber}>
                    Round {round.roundNumber}
                  </option>
                ))}
          </select>
        </div>
        <div>
          <Label>Result (3 digits)</Label>
          <Input
            type="text"
            value={result}
            onChange={(e) => setResult(e.target.value)}
            maxLength={3}
            placeholder="Enter result"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button 
          onClick={handleResultUpdate} 
          className="w-full"
          disabled={loading}
        >
          {loading ? "Processing..." : "Update Result & Process Winnings"}
        </Button>
        <Button 
          onClick={() => onResultUpdated(selectedGame, parseInt(selectedRound))} 
          variant="outline"
          disabled={loading || !selectedGame || !selectedRound}
        >
          View Backups
        </Button>
      </div>
    </div>
  );
};

export default ResultForm;

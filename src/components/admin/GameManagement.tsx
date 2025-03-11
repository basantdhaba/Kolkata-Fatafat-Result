import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { Game, RoundTiming, GameRate } from "@/types/game";
import GameRates from "./GameRates";
import { saveGames } from "@/lib/firebase";

interface GameManagementProps {
  games: Game[];
  setGames: React.Dispatch<React.SetStateAction<Game[]>>;
}

const GameManagement = ({ games, setGames }: GameManagementProps) => {
  const [newGame, setNewGame] = useState({
    name: "",
    rounds: "",
  });

  const [editingGame, setEditingGame] = useState<Game | null>(null);

  const generateInitialRates = (): GameRate[] => [
    { type: "single", winningRate: 90 },
    { type: "patti", winningRate: 900 },
    { type: "juri", winningRate: 100 }
  ];

  const generateRoundTimings = (rounds: number): RoundTiming[] => {
    const timings: RoundTiming[] = [];
    let currentHour = 10;

    for (let i = 0; i < rounds; i++) {
      timings.push({
        roundNumber: i + 1,
        openTime: `${String(currentHour).padStart(2, '0')}:00`,
        closeTime: `${String(currentHour + 1).padStart(2, '0')}:00`
      });
      currentHour = (currentHour + 1) % 24;
    }
    return timings;
  };

  const handleAddGame = () => {
    if (!newGame.name || !newGame.rounds) {
      toast.error("Please fill all fields");
      return;
    }

    const roundsNumber = Number(newGame.rounds);
    if (roundsNumber <= 0 || roundsNumber > 8) {
      toast.error("Number of rounds must be between 1 and 8");
      return;
    }

    try {
      const newGameData: Game = {
        id: Date.now(), // Use timestamp as temporary ID
        name: newGame.name,
        rounds: roundsNumber,
        roundTimings: generateRoundTimings(roundsNumber),
        rates: generateInitialRates()
      };

      const updatedGames = [...games, newGameData];
      setGames(updatedGames);
      saveGames(updatedGames)
        .then(() => toast.success("Game added successfully"))
        .catch(err => {
          console.error("Error saving game:", err);
          toast.error("Failed to save game");
        });
      
      setNewGame({ name: "", rounds: "" });
    } catch (error) {
      console.error('Error adding game:', error);
      toast.error('Failed to add game');
    }
  };

  const handleRemoveGame = (id: number) => {
    try {
      const updatedGames = games.filter(game => game.id !== id);
      setGames(updatedGames);
      saveGames(updatedGames)
        .then(() => toast.success("Game removed successfully"))
        .catch(err => {
          console.error("Error removing game:", err);
          toast.error("Failed to remove game");
        });
    } catch (error) {
      console.error('Error removing game:', error);
      toast.error('Failed to remove game');
    }
  };

  const handleUpdateTimings = (gameId: number, roundNumber: number, field: 'openTime' | 'closeTime', value: string) => {
    try {
      const updatedGames = games.map(game => {
        if (game.id === gameId) {
          const updatedTimings = game.roundTimings.map(timing => 
            timing.roundNumber === roundNumber
              ? { ...timing, [field]: value }
              : timing
          );
          return { ...game, roundTimings: updatedTimings };
        }
        return game;
      });

      setGames(updatedGames);
      saveGames(updatedGames)
        .then(() => toast.success(`Round ${roundNumber} timing updated`))
        .catch(err => {
          console.error("Error updating timing:", err);
          toast.error("Failed to update timing");
        });
    } catch (error) {
      console.error('Error updating timings:', error);
      toast.error('Failed to update timing');
    }
  };

  const handleUpdateRates = (gameId: number, newRates: GameRate[]) => {
    try {
      const updatedGames = games.map(game => 
        game.id === gameId
          ? { ...game, rates: newRates }
          : game
      );

      setGames(updatedGames);
      saveGames(updatedGames)
        .then(() => toast.success("Game rates updated successfully"))
        .catch(err => {
          console.error("Error updating rates:", err);
          toast.error("Failed to update rates");
        });
    } catch (error) {
      console.error('Error updating rates:', error);
      toast.error('Failed to update rates');
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Game Name</Label>
          <Input
            value={newGame.name}
            onChange={(e) => setNewGame({ ...newGame, name: e.target.value })}
            placeholder="Enter game name"
          />
        </div>
        <div>
          <Label>Total Rounds</Label>
          <Input
            type="number"
            value={newGame.rounds}
            onChange={(e) => setNewGame({ ...newGame, rounds: e.target.value })}
            placeholder="Number of rounds"
            min="1"
            max="8"
          />
        </div>
      </div>
      <Button onClick={handleAddGame} className="w-full">
        <Plus className="mr-2 h-4 w-4" /> Add Game
      </Button>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Game Name</TableHead>
            <TableHead>Rounds</TableHead>
            <TableHead>Round Timings</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {games.map((game) => (
            <React.Fragment key={game.id}>
              <TableRow>
                <TableCell>{game.name}</TableCell>
                <TableCell>{game.rounds}</TableCell>
                <TableCell>
                  <div className="text-sm space-y-1">
                    {game.roundTimings.map((timing) => (
                      <div key={timing.roundNumber} className="flex items-center gap-2">
                        <span>Round {timing.roundNumber}:</span>
                        <Input
                          type="time"
                          value={timing.openTime}
                          onChange={(e) => handleUpdateTimings(game.id, timing.roundNumber, 'openTime', e.target.value)}
                          className="w-32"
                        />
                        <span>-</span>
                        <Input
                          type="time"
                          value={timing.closeTime}
                          onChange={(e) => handleUpdateTimings(game.id, timing.roundNumber, 'closeTime', e.target.value)}
                          className="w-32"
                        />
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingGame(editingGame?.id === game.id ? null : game)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveGame(game.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              {editingGame?.id === game.id && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <GameRates game={game} onUpdateRates={handleUpdateRates} />
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default GameManagement;


import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Download } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import { Game } from "@/types/game";
import { exportGameData } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";

interface GameHistoryItem {
  id: string;
  user_id: string;
  game_id: string;
  round_number: number;
  type: string;
  number?: string;
  combination?: string;
  amount: number;
  status: string;
  played_at: any;
  result?: string;
  win_amount?: number;
  is_winner?: boolean;
  game_name?: string;
  date?: string;
}

interface GameExportProps {
  games: Game[];
}

const GameExport = ({ games }: GameExportProps) => {
  const [selectedGame, setSelectedGame] = useState("");
  const [selectedRound, setSelectedRound] = useState("");
  const [bets, setBets] = useState<GameHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBets = async () => {
      if (selectedGame && selectedRound) {
        setLoading(true);
        try {
          console.log("Fetching bets for export:", selectedGame, selectedRound);
          const fetchedBets = await exportGameData(selectedGame, parseInt(selectedRound));
          console.log("Fetched bets for export:", fetchedBets?.length || 0);
          setBets(fetchedBets as GameHistoryItem[]);
        } catch (error) {
          console.error("Error fetching bets:", error);
          toast.error("Failed to fetch bets data");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchBets();
  }, [selectedGame, selectedRound]);

  const generateExcel = async () => {
    if (!selectedGame || !selectedRound) {
      toast.error("Please select game and round");
      return;
    }

    if (bets.length === 0) {
      toast.error("No data available for export");
      return;
    }

    try {
      setLoading(true);
      console.log("Generating Excel with", bets.length, "records");
      
      const game = games.find(g => g.id.toString() === selectedGame);
      if (!game) {
        toast.error("Game not found");
        return;
      }

      // Prepare data for Excel
      const worksheetData = [
        ['User ID', 'Game', 'Round', 'Type', 'Number/Combination', 'Amount', 'Status', 'Result', 'Win Amount', 'Date Played'],
        ...bets.map(bet => {
          // Format date correctly
          let playedDate = "";
          if (bet.played_at) {
            if (bet.played_at.toDate) {
              playedDate = new Date(bet.played_at.toDate()).toLocaleDateString();
            } else if (bet.played_at.seconds) {
              playedDate = new Date(bet.played_at.seconds * 1000).toLocaleDateString();
            } else {
              playedDate = new Date(bet.played_at).toLocaleDateString();
            }
          }
          
          return [
            bet.user_id,
            bet.game_name || `Game ${bet.game_id}`,
            bet.round_number,
            bet.type,
            bet.number || bet.combination || '',
            bet.amount,
            bet.status || 'Pending',
            bet.result || '',
            bet.win_amount || 0,
            bet.date || playedDate
          ];
        })
      ];

      // Create workbook and worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Game Report');

      // Set column widths
      const colWidths = [15, 15, 10, 10, 15, 10, 10, 10, 10, 15];
      worksheet['!cols'] = colWidths.map(width => ({ width }));

      // Generate Excel file
      const fileName = `${game.name}_Round${selectedRound}_Report.xlsx`;
      XLSX.writeFile(workbook, fileName, { bookType: 'xlsx' });
      
      toast.success(`Report downloaded with ${bets.length} records`);
    } catch (error) {
      console.error("Error generating Excel:", error);
      toast.error("Failed to generate Excel report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Select Game</Label>
          <Select value={selectedGame} onValueChange={setSelectedGame}>
            <SelectTrigger>
              <SelectValue placeholder="Select game" />
            </SelectTrigger>
            <SelectContent>
              {games.map((game) => (
                <SelectItem key={game.id} value={game.id.toString()}>
                  {game.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Select Round</Label>
          <Select value={selectedRound} onValueChange={setSelectedRound}>
            <SelectTrigger>
              <SelectValue placeholder="Select round" />
            </SelectTrigger>
            <SelectContent>
              {selectedGame && games.find(g => g.id.toString() === selectedGame)?.roundTimings.map((round) => (
                <SelectItem key={round.roundNumber} value={round.roundNumber.toString()}>
                  Round {round.roundNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="mt-4">
        {loading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <>
            {bets.length > 0 && (
              <p className="text-sm text-gray-500 mb-2">
                Found {bets.length} records for export
              </p>
            )}
            <Button 
              onClick={generateExcel} 
              className="w-full"
              disabled={loading || bets.length === 0}
            >
              <Download className="mr-2 h-4 w-4" /> Download Excel Report
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default GameExport;

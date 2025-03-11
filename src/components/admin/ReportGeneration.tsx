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

interface ReportGenerationProps {
  games: Game[];
}

const ReportGeneration = ({ games }: ReportGenerationProps) => {
  const [selectedGame, setSelectedGame] = useState("");
  const [selectedRound, setSelectedRound] = useState("");
  const [bets, setBets] = useState([]);

  useEffect(() => {
    const fetchBets = async () => {
      if (selectedGame && selectedRound) {
        const response = await fetch(`/api/bets?gameId=${selectedGame}&roundNumber=${selectedRound}`);
        const data = await response.json();
        setBets(data);
      }
    };

    fetchBets();
  }, [selectedGame, selectedRound]);

  const generateReport = async () => {
    if (!selectedGame || !selectedRound) {
      toast.error("Please select game and round");
      return;
    }

    const game = games.find(g => g.id.toString() === selectedGame);
    if (!game) return;

    const roundNumber = parseInt(selectedRound);
    const round = game.roundTimings.find(r => r.roundNumber === roundNumber);
    if (!round) return;

    const filteredBets = bets.filter((bet: any) => 
      bet.gameId === selectedGame && 
      bet.roundNumber === roundNumber
    );

    const reportData = [
      ['User ID', 'Game Name', 'Round', 'Bet Type', 'Number/Combination', 'Amount', 'Status', 'Played At', 'Win Rate', 'Result', 'Win Amount'],
      ...filteredBets.map((bet: any) => [
        bet.userId,
        game.name,
        roundNumber,
        bet.type,
        bet.number || bet.combination,
        bet.amount,
        bet.status || 'Pending',
        new Date(bet.playedAt).toLocaleString(),
        game.rates.find(r => r.type === bet.type)?.winningRate || '-',
        bet.result || 'Pending',
        bet.winAmount || 0
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');

    const colWidths = [15, 20, 10, 15, 20, 10, 15, 20, 10, 15, 15];
    ws['!cols'] = colWidths.map(width => ({ width }));

    const fileName = `${game.name}_Round${roundNumber}_Report.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    toast.success("Report downloaded successfully");

    // Call the wallet update endpoint
    await fetch('/api/updateWallet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gameId: selectedGame, roundNumber }),
    });
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
      <Button onClick={generateReport} className="w-full">
        <Download className="mr-2 h-4 w-4" /> Download Report
      </Button>
    </div>
  );
};

export default ReportGeneration;

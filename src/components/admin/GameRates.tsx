import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Game, GameRate } from "@/types/game";

interface GameRatesProps {
  game: Game;
  onUpdateRates: (gameId: number, newRates: GameRate[]) => void;
}

const GameRates = ({ game, onUpdateRates }: GameRatesProps) => {
  const handleRateChange = (type: GameRate['type'], value: string) => {
    const numValue = Number(value);
    if (isNaN(numValue)) return;

    const newRates = game.rates.map(rate => 
      rate.type === type ? { ...rate, winningRate: numValue } : rate
    );
    
    onUpdateRates(game.id, newRates);
    toast.success(`${type} rate updated successfully`);
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Game Type</TableHead>
            <TableHead>Winning Rate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {game.rates.map((rate) => (
            <TableRow key={rate.type}>
              <TableCell className="capitalize">{rate.type}</TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={rate.winningRate}
                  onChange={(e) => handleRateChange(rate.type, e.target.value)}
                  className="w-32"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default GameRates;
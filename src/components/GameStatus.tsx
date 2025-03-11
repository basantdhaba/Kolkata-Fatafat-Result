import React from "react";
import { Check, X, ArrowUp, ArrowDown } from "lucide-react";

interface GameStatusProps {
  attempts: number;
  lastGuess: number | null;
  targetNumber: number;
  isGameWon: boolean;
}

const GameStatus = ({ attempts, lastGuess, targetNumber, isGameWon }: GameStatusProps) => {
  if (!lastGuess) return null;

  return (
    <div className="mt-6 text-center">
      <div className="flex items-center justify-center gap-2 text-xl font-semibold">
        {isGameWon ? (
          <div className="flex items-center text-accent">
            <Check className="mr-2 h-6 w-6" />
            Correct!
          </div>
        ) : lastGuess > targetNumber ? (
          <div className="flex items-center text-destructive">
            <ArrowDown className="mr-2 h-6 w-6" />
            Too High!
          </div>
        ) : (
          <div className="flex items-center text-secondary">
            <ArrowUp className="mr-2 h-6 w-6" />
            Too Low!
          </div>
        )}
      </div>
      <p className="mt-2 text-muted-foreground">
        Attempts: {attempts}
      </p>
    </div>
  );
};

export default GameStatus;
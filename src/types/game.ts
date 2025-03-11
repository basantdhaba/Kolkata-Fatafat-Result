
export interface RoundTiming {
  roundNumber: number;
  openTime: string;
  closeTime: string;
}

export interface GameRate {
  type: "single" | "patti" | "juri";
  winningRate: number;
}

export interface Game {
  id: number;
  name: string;
  rounds: number;
  roundTimings: RoundTiming[];
  rates: GameRate[];
}

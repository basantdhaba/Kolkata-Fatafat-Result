
import { Timestamp } from "firebase/firestore";

export interface Bet {
  id: string;
  user_id: string;
  game_id: string;
  round_number: number;
  type: 'single' | 'patti' | 'juri';
  number: string;
  amount: number;
  win_rate?: number;
  result?: string | null;
  win_amount?: number;
  status: 'Pending' | 'Won' | 'Lost';
  is_winner?: boolean;
  played_at: Timestamp | Date;
  processed_at?: Timestamp | null;
}

export interface GameHistoryItem extends Bet {
  game_name?: string;
  date?: string;
}

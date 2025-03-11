
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../src/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { gameId, roundNumber } = req.body;

  if (!gameId || !roundNumber) {
    res.status(400).json({ error: 'Missing gameId or roundNumber' });
    return;
  }

  try {
    // Fetch all bets for the game
    const { data: bets, error: betsError } = await supabase
      .from('bets')
      .select('*')
      .eq('game_id', gameId)
      .eq('round_number', roundNumber);

    if (betsError) {
      throw betsError;
    }

    if (!bets || bets.length === 0) {
      res.status(400).json({ error: "No bets found for this game round." });
      return;
    }

    const updatePromises = bets.map(async (bet) => {
      if (bet.result === 'win') {
        const winAmount = bet.amount * (bet.winRate || 9);
        console.log(`Updating wallet for User ID: ${bet.userId} with amount: ${winAmount}`);

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            wallet_balance: supabase.rpc('increment_wallet', { increment_amount: winAmount })
          })
          .eq('id', bet.userId);

        if (updateError) {
          throw updateError;
        }
      }
    });

    await Promise.all(updatePromises);
    res.status(200).json({ message: 'Wallets updated successfully' });
  } catch (error) {
    console.error('Error updating wallets:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

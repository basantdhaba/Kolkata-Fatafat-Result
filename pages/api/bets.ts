import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../src/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { gameId, roundNumber } = req.query;

  if (!gameId || !roundNumber) {
    res.status(400).json({ error: 'Missing gameId or roundNumber' });
    return;
  }

  try {
    const bets = await query(
      'SELECT * FROM bets WHERE game_id = $1 AND round_number = $2',
      [gameId, roundNumber]
    );

    if (bets.rows.length === 0) {
      res.status(200).json({ message: "No game history found for this game." });
      return;
    }

    res.status(200).json(bets.rows);
  } catch (error) {
    console.error('Error fetching bets:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}


import React, { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/firebase";
import { Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { onSnapshot, collection, query, where, orderBy } from "firebase/firestore";
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
  played_at: Timestamp;
  result?: string;
  win_amount?: number;
  is_winner?: boolean;
}

const GameHistory = () => {
  const [bets, setBets] = useState<GameHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBets = async () => {
      try {
        const user = getCurrentUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Set up real-time listener for bets
        const betsRef = collection(db, "bets");
        const q = query(
          betsRef,
          where("user_id", "==", user.uid),
          orderBy("played_at", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const fetchedBets = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as GameHistoryItem[];
          
          console.log("Real-time bets update:", fetchedBets.length, "bets found");
          setBets(fetchedBets);
          setLoading(false);
        }, (error) => {
          console.error("Error in bets listener:", error);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching bets:", error);
        setLoading(false);
      }
    };

    fetchBets();
  }, []);

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "";
    
    try {
      // Handle Firestore timestamp
      if (timestamp instanceof Timestamp || timestamp.toDate) {
        return new Date(timestamp.toDate?.() || timestamp.seconds * 1000).toLocaleString();
      }
      
      // Handle regular Date or timestamp in milliseconds
      return new Date(timestamp).toLocaleString();
    } catch (error) {
      console.error("Error formatting timestamp:", error, timestamp);
      return String(timestamp);
    }
  };

  if (loading) {
    return (
      <Card className="p-4">
        <h2 className="text-xl font-bold mb-4">Game History</h2>
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h2 className="text-xl font-bold mb-4">Game History</h2>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Game</TableHead>
              <TableHead>Round</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Number/Combination</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Result</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Win Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4">No game history found</TableCell>
              </TableRow>
            ) : (
              bets.map((bet: GameHistoryItem) => (
                <TableRow key={bet.id}>
                  <TableCell>{formatTimestamp(bet.played_at)}</TableCell>
                  <TableCell>{bet.game_id}</TableCell>
                  <TableCell>{bet.round_number}</TableCell>
                  <TableCell className="capitalize">{bet.type}</TableCell>
                  <TableCell>{bet.number || bet.combination}</TableCell>
                  <TableCell>₹{bet.amount}</TableCell>
                  <TableCell className="font-bold text-black">{bet.result || "-"}</TableCell>
                  <TableCell>
                    <span className={bet.status === "Won" ? "text-green-600 font-bold" : 
                                   bet.status === "Lost" ? "text-red-600" : "text-amber-600"}>
                      {bet.status}
                    </span>
                  </TableCell>
                  <TableCell className={bet.win_amount ? "text-green-600 font-bold" : ""}>
                    {bet.win_amount ? `₹${bet.win_amount}` : "₹0"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

export default GameHistory;

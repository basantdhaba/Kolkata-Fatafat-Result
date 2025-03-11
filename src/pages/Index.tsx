
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import AuthButtons from "@/components/AuthButtons";
import AuthModal from "@/components/AuthModal";
import Wallet from "@/components/Wallet";
import NumberSelector from "@/components/NumberSelector";
import PattiSelector from "@/components/PattiSelector";
import JuriSelector from "@/components/JuriSelector";
import GameHistory from "@/components/GameHistory";
import { Game, GameRate } from "@/types/game";
import { getGames, db, onAuthStateChange } from "@/lib/firebase";
import { doc, getDoc, onSnapshot, collection, query, orderBy, limit, getDocs } from "firebase/firestore";

const Index = () => {
  const [selectedGame, setSelectedGame] = useState("");
  const [activeTab, setActiveTab] = useState<"single" | "patti" | "juri">("single");
  const [showAuth, setShowAuth] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showNumberSelector, setShowNumberSelector] = useState(false);
  const [showPattiSelector, setShowPattiSelector] = useState(false);
  const [showJuriSelector, setShowJuriSelector] = useState(false);
  const [games, setGames] = useState<Game[]>([]);
  const [gameResults, setGameResults] = useState<any>({});

  useEffect(() => {
    // Check authentication status
    const unsubscribe = onAuthStateChange((user) => {
      setIsAuthenticated(!!user);
      // Reset selectors when auth state changes
      if (!user) {
        setShowNumberSelector(false);
        setShowPattiSelector(false);
        setShowJuriSelector(false);
      }
    });

    // Fetch games from Firestore
    const fetchGames = async () => {
      try {
        const gamesData = await getGames();
        
        if (gamesData.length > 0) {
          setGames(gamesData);
          if (!selectedGame) {
            setSelectedGame(String(gamesData[0].id));
          }
        } else {
          // Initialize default games if none exist
          const defaultGames: Game[] = [
            {
              id: 1,
              name: "Kolkata Fatafat",
              rounds: 8,
              roundTimings: generateDefaultTimings(8),
              rates: generateDefaultRates()
            },
            {
              id: 2,
              name: "GM Matka",
              rounds: 8,
              roundTimings: generateDefaultTimings(8),
              rates: generateDefaultRates()
            },
            {
              id: 3,
              name: "Main Bazar",
              rounds: 2,
              roundTimings: generateDefaultTimings(2),
              rates: generateDefaultRates()
            }
          ];
          setGames(defaultGames);
          if (!selectedGame) {
            setSelectedGame(String(defaultGames[0].id));
          }
        }
      } catch (error) {
        console.error("Error fetching games:", error);
        toast.error("Error loading games");
      }
    };

    // Fetch game results
    const fetchGameResults = async () => {
      try {
        const resultsRef = collection(db, "game_results");
        const q = query(resultsRef, orderBy("date", "desc"), limit(10));
        
        const resultsSnapshot = await getDocs(q);
        const resultsData: any = {};
        
        resultsSnapshot.forEach(doc => {
          const data = doc.data();
          const gameId = data.game_id;
          const date = data.date;
          const roundNumber = data.round_number;
          const result = data.result;
          
          if (!resultsData[gameId]) {
            resultsData[gameId] = [];
          }
          
          // Find existing date entry or create a new one
          let dateEntry = resultsData[gameId].find((entry: any) => entry.date === date);
          
          if (!dateEntry) {
            dateEntry = { date, results: Array(8).fill("") };
            resultsData[gameId].push(dateEntry);
          }
          
          // Update the result for the specific round
          if (roundNumber > 0 && roundNumber <= 8) {
            dateEntry.results[roundNumber - 1] = result;
          }
        });
        
        setGameResults(resultsData);
      } catch (error) {
        console.error("Error fetching game results:", error);
      }
    };

    fetchGames();
    fetchGameResults();

    // Set up a listener for game results
    const resultsListener = onSnapshot(
      collection(db, "game_results"),
      (snapshot) => {
        fetchGameResults();
      },
      (error) => {
        console.error("Error listening to game results:", error);
      }
    );

    return () => {
      unsubscribe();
      resultsListener();
    };
  }, []);

  const generateDefaultTimings = (rounds: number) => {
    const timings = [];
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

  const generateDefaultRates = (): GameRate[] => {
    return [
      { type: "single" as const, winningRate: 90 },
      { type: "patti" as const, winningRate: 900 },
      { type: "juri" as const, winningRate: 100 }
    ];
  };

  const handleTabClick = (tab: string) => {
    if (!isAuthenticated) {
      setShowAuth(true);
      return;
    }
    
    setActiveTab(tab as "single" | "patti" | "juri");
    if (tab === "single") {
      setShowNumberSelector(true);
      setShowPattiSelector(false);
      setShowJuriSelector(false);
    } else if (tab === "patti") {
      setShowPattiSelector(true);
      setShowNumberSelector(false);
      setShowJuriSelector(false);
    } else if (tab === "juri") {
      setShowJuriSelector(true);
      setShowNumberSelector(false);
      setShowPattiSelector(false);
    }
  };

  const formatNumber = (num: string) => {
    // Return the number exactly as it was entered for display
    // Last digit calculation still sums the digits for game logic
    const digits = num.split('');
    const sum = digits.reduce((acc, curr) => acc + Number(curr), 0);
    return {
      displayNumber: num, // Keep the original number for display
      lastDigit: String(sum).slice(-1)
    };
  };

  const currentGameResults = gameResults[selectedGame] || [];

  return (
    <div className="min-h-screen bg-background p-2 md:p-4">
      <Card className="w-full mx-auto">
        <CardContent className="p-2 md:p-6">
          <div className="bg-white z-10 pb-2 md:pb-4">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 md:gap-4 mb-4">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4">
                <Select value={selectedGame} onValueChange={setSelectedGame}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Select game" />
                  </SelectTrigger>
                  <SelectContent>
                    {games.map((game) => (
                      <SelectItem key={game.id} value={String(game.id)}>
                        {game.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => handleTabClick(activeTab)} className="w-full md:w-auto">Play</Button>
              </div>
              <div className="flex items-center gap-2 md:gap-4">
                {isAuthenticated && <Wallet />}
                <AuthButtons />
              </div>
            </div>

            {isAuthenticated && (
              <div className="flex justify-center gap-2 md:gap-4 mb-4">
                {["single", "patti", "juri"].map((tab) => (
                  <Button
                    key={tab}
                    variant={activeTab === tab ? "default" : "outline"}
                    onClick={() => handleTabClick(tab)}
                    className="px-2 md:px-4 py-1 md:py-2 text-sm md:text-base capitalize"
                  >
                    {tab}
                  </Button>
                ))}
              </div>
            )}

            {showNumberSelector && isAuthenticated && activeTab === "single" && (
              <div className="mb-4">
                <NumberSelector onClose={() => setShowNumberSelector(false)} />
              </div>
            )}

            {showPattiSelector && isAuthenticated && activeTab === "patti" && (
              <div className="mb-4">
                <PattiSelector onClose={() => setShowPattiSelector(false)} />
              </div>
            )}

            {showJuriSelector && isAuthenticated && activeTab === "juri" && (
              <div className="mb-4">
                <JuriSelector onClose={() => setShowJuriSelector(false)} />
              </div>
            )}
          </div>

          <div className="results-grid">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-800 text-white">
                  <TableHead className="text-white text-xs md:text-sm sticky left-0 bg-slate-800">Date</TableHead>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <TableHead key={num} className="text-white text-center text-xs md:text-sm p-1 md:p-2">
                      {num}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentGameResults.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium bg-slate-800 text-white text-xs md:text-sm sticky left-0">
                      {row.date}
                    </TableCell>
                    {row.results.map((result, idx) => {
                      const formattedResult = result ? formatNumber(result) : { displayNumber: '', lastDigit: '' };
                      return (
                        <TableCell key={idx} className="text-center p-1 md:p-2">
                          {formattedResult.displayNumber && (
                            <>
                              <span className="font-bold text-black text-xs md:text-sm">
                                {formattedResult.displayNumber}
                              </span>
                              <span className="block text-xs text-gray-500">
                                {formattedResult.lastDigit}
                              </span>
                            </>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {isAuthenticated && (
            <div className="mt-4">
              <GameHistory />
            </div>
          )}
        </CardContent>
      </Card>
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
};

export default Index;

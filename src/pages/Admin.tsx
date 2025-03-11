
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GameManagement from "@/components/admin/GameManagement";
import ReportGeneration from "@/components/admin/ReportGeneration";
import ResultsManagement from "@/components/admin/ResultsManagement";
import GameExport from "@/components/admin/GameExport";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { logOut, db, getGames, saveGames } from "@/lib/firebase";
import { LogOut } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState<any[]>([]);

  const handleLogout = async () => {
    try {
      await logOut();
      localStorage.removeItem("isAdmin");
      toast.success("Logged out successfully");
      navigate("/admin");
    } catch (error: any) {
      toast.error(error.message || "Logout failed");
    }
  };

  useEffect(() => {
    // Load games from Firestore
    const loadGames = async () => {
      try {
        const gamesData = await getGames();
        
        if (gamesData && gamesData.length > 0) {
          setGames(gamesData);
        } else {
          // If no games in Firestore, check localStorage
          const savedGames = localStorage.getItem("games");
          if (savedGames) {
            try {
              const parsedGames = JSON.parse(savedGames);
              setGames(parsedGames);
              
              // Save to Firestore for future use
              await saveGames(parsedGames);
            } catch (error) {
              console.error("Error parsing games from localStorage:", error);
              setDefaultGames();
            }
          } else {
            setDefaultGames();
          }
        }
      } catch (error) {
        console.error("Error loading games:", error);
        setDefaultGames();
      }
    };
    
    loadGames();
  }, []);

  const setDefaultGames = async () => {
    const defaultGames = [
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
    
    // Save to localStorage and Firestore
    localStorage.setItem("games", JSON.stringify(defaultGames));
    await saveGames(defaultGames);
  };

  useEffect(() => {
    // Save games to localStorage and Firestore when they change
    if (games.length > 0) {
      localStorage.setItem("games", JSON.stringify(games));
      saveGames(games);
    }
  }, [games]);

  const generateDefaultTimings = (rounds: number) => {
    let timings = [];
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

  const generateDefaultRates = () => [
    { type: "single", winningRate: 90 },
    { type: "patti", winningRate: 900 },
    { type: "juri", winningRate: 100 }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>

      <Tabs defaultValue="games" className="space-y-4">
        <TabsList>
          <TabsTrigger value="games">Game Management</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="exports">Excel Export</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="games">
          <Card>
            <CardHeader>
              <CardTitle>Game Management</CardTitle>
              <CardDescription>Add or remove games and manage round timings</CardDescription>
            </CardHeader>
            <CardContent>
              <GameManagement games={games} setGames={setGames} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Update Results</CardTitle>
              <CardDescription>Update game results and process winnings</CardDescription>
            </CardHeader>
            <CardContent>
              <ResultsManagement games={games} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Reports</CardTitle>
              <CardDescription>Download game reports and user details</CardDescription>
            </CardHeader>
            <CardContent>
              <ReportGeneration games={games} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exports">
          <Card>
            <CardHeader>
              <CardTitle>Excel Export</CardTitle>
              <CardDescription>Export game data to Excel</CardDescription>
            </CardHeader>
            <CardContent>
              <GameExport games={games} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>Manage UPI and other settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <UPISettings />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const UPISettings: React.FC = () => {
  const [upiId, setUpiId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpiId = async () => {
      try {
        setLoading(true);
        // Try to get UPI from Firestore first
        const settingsRef = doc(db, "settings", "upi");
        const settingsDoc = await getDoc(settingsRef);
        
        if (settingsDoc.exists()) {
          setUpiId(settingsDoc.data().upiId || "");
        } else {
          // Fallback to localStorage if not in Firestore
          setUpiId(localStorage.getItem("upiId") || "");
        }
      } catch (error) {
        console.error("Error fetching UPI settings:", error);
        // Fallback to localStorage
        setUpiId(localStorage.getItem("upiId") || "");
      } finally {
        setLoading(false);
      }
    };

    fetchUpiId();
  }, []);

  const handleUpiUpdate = async () => {
    if (!upiId) {
      toast.error("Please enter UPI ID");
      return;
    }
    
    try {
      // Store in Firestore
      const settingsRef = doc(db, "settings", "upi");
      await setDoc(settingsRef, { upiId }, { merge: true });
      
      // Also update localStorage as fallback
      localStorage.setItem("upiId", upiId);
      toast.success("UPI ID updated successfully");
    } catch (error) {
      console.error("Error updating UPI:", error);
      toast.error("Failed to update UPI ID in database. Local copy saved.");
      // Still update localStorage even if Firestore fails
      localStorage.setItem("upiId", upiId);
    }
  };

  if (loading) {
    return <div className="text-center">Loading settings...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">UPI ID</label>
        <input
          type="text"
          className="w-full border rounded-md p-2"
          value={upiId}
          onChange={(e) => setUpiId(e.target.value)}
          placeholder="Enter UPI ID"
        />
      </div>
      <Button onClick={handleUpiUpdate} className="w-full">
        Update UPI ID
      </Button>
    </div>
  );
};

export default Admin;

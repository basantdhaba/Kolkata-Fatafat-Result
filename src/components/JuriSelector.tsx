import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { allowedDigits, generatePattiGroups } from "@/utils/gameUtils";
import { db, getCurrentUser, updateUserWallet } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

interface JuriSelectorProps {
  onClose: () => void;
}

const JuriSelector = ({ onClose }: JuriSelectorProps) => {
  const [activeMode, setActiveMode] = useState("juri");
  const [amount, setAmount] = useState("");
  const [showPattiPopup, setShowPattiPopup] = useState(false);
  const [selectedDigit, setSelectedDigit] = useState("");
  const [activeRow, setActiveRow] = useState("");
  const [storedCombinations, setStoredCombinations] = useState<string[]>([]);
  const minAmount = 10;
  const pattiGroups = generatePattiGroups();

  // State for each mode
  const [juriFirstSelections, setJuriFirstSelections] = useState<string[]>([]);
  const [juriSecondSelections, setJuriSecondSelections] = useState<string[]>([]);
  const [figPattiFirstSelections, setFigPattiFirstSelections] = useState<string[]>([]);
  const [figPattiSecondSelections, setFigPattiSecondSelections] = useState<string[]>([]);
  const [pattiPattiFirstSelections, setPattiPattiFirstSelections] = useState<string[]>([]);
  const [pattiPattiSecondSelections, setPattiPattiSecondSelections] = useState<string[]>([]);
  const [pattiFigureFirstSelections, setPattiFigureFirstSelections] = useState<string[]>([]);
  const [pattiFigureSecondSelections, setPattiFigureSecondSelections] = useState<string[]>([]);

  const handleNumberClick = (num: string, row: string) => {
    if (activeMode === "juri") {
      const setter = row === "First" ? setJuriFirstSelections : setJuriSecondSelections;
      setter(prev => {
        if (prev.includes(num)) {
          return prev.filter(n => n !== num);
        }
        return [...prev, num];
      });

      // Add combinations to stored area for Juri mode
      if (row === "Second" && juriFirstSelections.length > 0) {
        juriFirstSelections.forEach(first => {
          const combination = `${first}-${num}`;
          if (!storedCombinations.includes(combination)) {
            setStoredCombinations(prev => [...prev, combination]);
          }
        });
      }
    } else if (activeMode === "figPatti" && row === "First") {
      setFigPattiFirstSelections(prev => {
        if (prev.includes(num)) {
          return prev.filter(n => n !== num);
        }
        return [...prev, num];
      });
    } else if (activeMode === "pattiFigure" && row === "Second") {
      setPattiFigureSecondSelections(prev => {
        if (prev.includes(num)) {
          return prev.filter(n => n !== num);
        }
        return [...prev, num];
      });
    } else {
      setSelectedDigit(num);
      setActiveRow(row);
      setShowPattiPopup(true);
    }
  };

  const handlePattiSelect = (pattiNum: string) => {
    const setters: { [key: string]: React.Dispatch<React.SetStateAction<string[]>> } = {
      figPattiSecond: setFigPattiSecondSelections,
      pattiPattiFirst: setPattiPattiFirstSelections,
      pattiPattiSecond: setPattiPattiSecondSelections,
      pattiFigureFirst: setPattiFigureFirstSelections,
    };

    const currentSetter = setters[`${activeMode}${activeRow}`];
    if (currentSetter) {
      currentSetter(prev => {
        if (!prev.includes(pattiNum)) {
          // Add to stored combinations based on mode
          if (activeMode === "figPatti" && activeRow === "Second" && figPattiFirstSelections.length > 0) {
            figPattiFirstSelections.forEach(first => {
              const combination = `${first}-${pattiNum}`;
              if (!storedCombinations.includes(combination)) {
                setStoredCombinations(prev => [...prev, combination]);
              }
            });
          } else if (activeMode === "pattiPatti" && activeRow === "Second" && pattiPattiFirstSelections.length > 0) {
            pattiPattiFirstSelections.forEach(first => {
              const combination = `${first}-${pattiNum}`;
              if (!storedCombinations.includes(combination)) {
                setStoredCombinations(prev => [...prev, combination]);
              }
            });
          } else if (activeMode === "pattiFigure" && activeRow === "First") {
            pattiFigureSecondSelections.forEach(second => {
              const combination = `${pattiNum}-${second}`;
              if (!storedCombinations.includes(combination)) {
                setStoredCombinations(prev => [...prev, combination]);
              }
            });
          }
          return [...prev, pattiNum];
        }
        return prev;
      });
    }
    setShowPattiPopup(false);
  };

  const handleSubmit = async () => {
    if (!amount || Number(amount) < minAmount) {
      toast.error(`Minimum amount is ₹${minAmount}`);
      return;
    }

    if (storedCombinations.length === 0) {
      toast.error("No combinations selected");
      return;
    }

    // Fix: Calculate total correctly - one amount per combination
    const totalAmount = Number(amount) * storedCombinations.length;
    
    try {
      const user = getCurrentUser();
      if (!user) {
        toast.error("You must be logged in to place bets");
        return;
      }

      // Get current wallet balance from Firestore
      const userProfileRef = doc(db, "profiles", user.uid);
      const userProfile = await getDoc(userProfileRef);
      
      if (!userProfile.exists()) {
        toast.error("User profile not found");
        return;
      }
      
      const currentBalance = userProfile.data().wallet_balance || 0;

      if (totalAmount > currentBalance) {
        toast.error("Insufficient balance");
        return;
      }

      const confirmBet = window.confirm(
        `₹${totalAmount} will be deducted from your wallet. Do you want to continue?`
      );

      if (confirmBet) {
        // Update user's wallet balance
        await updateUserWallet(user.uid, -totalAmount);
        
        // Place bets for each combination
        for (const combination of storedCombinations) {
          const betId = `${user.uid}_${Date.now()}_${combination}`;
          await setDoc(doc(db, "bets", betId), {
            user_id: user.uid,
            game_id: "1", // Default game ID
            round_number: 1, // Default round
            type: "juri",
            combination: combination,
            amount: Number(amount), // Each combination has its own amount
            played_at: new Date().toISOString(),
            status: "Pending"
          });
        }
        
        toast.success("Bet placed successfully!");
        setStoredCombinations([]);
        onClose();
      }
    } catch (error) {
      console.error("Error placing bet:", error);
      toast.error("Failed to place bet");
    }
  };

  const handleBackspace = () => {
    if (storedCombinations.length > 0) {
      // Remove only the last combination
      setStoredCombinations(prev => prev.slice(0, -1));
      
      // Clear selections based on the last combination that was removed
      const lastCombination = storedCombinations[storedCombinations.length - 1];
      const [first, second] = lastCombination.split('-');
      
      switch (activeMode) {
        case "juri":
          if (!storedCombinations.some(combo => combo.startsWith(first))) {
            setJuriFirstSelections(prev => prev.filter(n => n !== first));
          }
          if (!storedCombinations.some(combo => combo.endsWith(second))) {
            setJuriSecondSelections(prev => prev.filter(n => n !== second));
          }
          break;
        case "figPatti":
          if (!storedCombinations.some(combo => combo.startsWith(first))) {
            setFigPattiFirstSelections(prev => prev.filter(n => n !== first));
          }
          if (!storedCombinations.some(combo => combo.endsWith(second))) {
            setFigPattiSecondSelections(prev => prev.filter(n => n !== second));
          }
          break;
        case "pattiPatti":
          if (!storedCombinations.some(combo => combo.startsWith(first))) {
            setPattiPattiFirstSelections(prev => prev.filter(n => n !== first));
          }
          if (!storedCombinations.some(combo => combo.endsWith(second))) {
            setPattiPattiSecondSelections(prev => prev.filter(n => n !== second));
          }
          break;
        case "pattiFigure":
          if (!storedCombinations.some(combo => combo.startsWith(first))) {
            setPattiFigureFirstSelections(prev => prev.filter(n => n !== first));
          }
          if (!storedCombinations.some(combo => combo.endsWith(second))) {
            setPattiFigureSecondSelections(prev => prev.filter(n => n !== second));
          }
          break;
      }
    }
  };

  return (
    <Card className="p-6 relative">
      <Tabs defaultValue="juri" onValueChange={setActiveMode}>
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="juri">Juri</TabsTrigger>
          <TabsTrigger value="figPatti">Figures Patti</TabsTrigger>
          <TabsTrigger value="pattiPatti">Patti se Patti</TabsTrigger>
          <TabsTrigger value="pattiFigure">Patti se Figure</TabsTrigger>
        </TabsList>

        {["juri", "figPatti", "pattiPatti", "pattiFigure"].map((mode) => (
          <TabsContent key={mode} value={mode}>
            <div className="space-y-4">
              <div className="grid grid-cols-5 gap-2">
                {allowedDigits.map((num) => (
                  <Button
                    key={`first-${num}`}
                    variant="outline"
                    onClick={() => handleNumberClick(num, "First")}
                    className={cn(
                      "h-12 w-12 text-lg font-bold",
                      {
                        "bg-primary text-primary-foreground": 
                          (mode === "juri" && juriFirstSelections.includes(num)) ||
                          (mode === "figPatti" && figPattiFirstSelections.includes(num))
                      }
                    )}
                  >
                    {num}
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-5 gap-2">
                {allowedDigits.map((num) => (
                  <Button
                    key={`second-${num}`}
                    variant="outline"
                    onClick={() => handleNumberClick(num, "Second")}
                    className={cn(
                      "h-12 w-12 text-lg font-bold",
                      {
                        "bg-primary text-primary-foreground": 
                          (mode === "juri" && juriSecondSelections.includes(num)) ||
                          (mode === "pattiFigure" && pattiFigureSecondSelections.includes(num))
                      }
                    )}
                  >
                    {num}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>
        ))}

        {showPattiPopup && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded-lg shadow-lg border z-50">
            <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
              {pattiGroups[selectedDigit]?.map((pattiNum) => (
                <Button
                  key={pattiNum}
                  variant="outline"
                  onClick={() => handlePattiSelect(pattiNum)}
                  className="h-10 w-16 text-sm font-mono"
                >
                  {pattiNum}
                </Button>
              ))}
            </div>
            <Button 
              className="mt-4 w-full"
              variant="outline"
              onClick={() => setShowPattiPopup(false)}
            >
              Close
            </Button>
          </div>
        )}

        <div className="mt-6 space-y-4">
          {storedCombinations.length > 0 && (
            <div className="text-sm bg-gray-50 p-3 rounded-md">
              <div className="font-medium mb-1">Stored Combinations:</div>
              <div className="flex flex-wrap gap-2">
                {storedCombinations.map((combo, index) => (
                  <span key={index} className="bg-primary/10 px-2 py-1 rounded text-primary">
                    {combo}
                  </span>
                ))}
              </div>
              <div className="mt-2 text-right text-gray-500">
                Total: {storedCombinations.length} combinations
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Amount per combination (₹)</label>
            <Input
              type="number"
              min={minAmount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Minimum ₹${minAmount}`}
            />
          </div>

          <div className="flex justify-between gap-4">
            <Button onClick={handleBackspace} variant="outline">
              Backspace
            </Button>
            <Button onClick={handleSubmit} disabled={!amount}>
              Submit
            </Button>
          </div>
        </div>
      </Tabs>
    </Card>
  );
};

export default JuriSelector;

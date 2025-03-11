
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { db, getCurrentUser, updateUserWallet } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

interface PattiSelectorProps {
  onClose: () => void;
}

const PattiSelector = ({ onClose }: PattiSelectorProps) => {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [cpSelectedNumbers, setCpSelectedNumbers] = useState<number[]>([]);
  const [storedPattis, setStoredPattis] = useState<string[]>([]);
  const [amount, setAmount] = useState("");
  const [isCPMode, setIsCPMode] = useState(false);
  const minAmount = 10;

  const numbers = Array.from({ length: 10 }, (_, i) => (i + 1) % 10);

  const handleNumberClick = (num: number) => {
    if (isCPMode) {
      if (!cpSelectedNumbers.includes(num)) {
        setCpSelectedNumbers([...cpSelectedNumbers, num]);
      }
    } else {
      if (selectedNumbers.length < 3) {
        const newNumbers = [...selectedNumbers, num];
        setSelectedNumbers(newNumbers);
        
        if (newNumbers.length === 3) {
          const sorted = [...newNumbers].sort((a, b) => a - b);
          if (JSON.stringify(newNumbers) === JSON.stringify(sorted)) {
            // Fixed: Preserve zeros in patti numbers, don't replace "10" with "0"
            const patti = newNumbers.map(n => n === 10 ? 0 : n).join("");
            setStoredPattis([...storedPattis, patti]);
            setSelectedNumbers([]);
          } else {
            toast.error("Invalid Patti! Numbers should be in ascending order.");
            setSelectedNumbers([]);
          }
        }
      }
    }
  };

  const generateUniqueCombinations = (numbers: number[]) => {
    const combos: string[] = [];
    const n = numbers.length;
    for (let i = 0; i < n - 2; i++) {
      for (let j = i + 1; j < n - 1; j++) {
        for (let k = j + 1; k < n; k++) {
          const arr = [numbers[i], numbers[j], numbers[k]].sort((a, b) => a - b);
          // Fixed: Preserve zeros in patti numbers
          const combo = arr.map(n => n === 10 ? 0 : n).join("");
          if (!combos.includes(combo)) {
            combos.push(combo);
          }
        }
      }
    }
    return combos;
  };

  const handleCPOk = () => {
    if (cpSelectedNumbers.length < 4) {
      toast.error("Select at least 4 numbers for CP mode.");
      return;
    }
    const combinations = generateUniqueCombinations(cpSelectedNumbers);
    const newPattis = [...storedPattis];
    combinations.forEach(combo => {
      if (!newPattis.includes(combo)) {
        newPattis.push(combo);
      }
    });
    setStoredPattis(newPattis);
    setCpSelectedNumbers([]);
  };

  const handleSubmit = async () => {
    if (!amount || Number(amount) < minAmount) {
      toast.error(`Minimum amount is ₹${minAmount}`);
      return;
    }

    const totalAmount = Number(amount) * storedPattis.length;
    
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
        
        // Place bets
        for (const patti of storedPattis) {
          const betId = `${user.uid}_${Date.now()}_${patti}`;
          await setDoc(doc(db, "bets", betId), {
            user_id: user.uid,
            game_id: "1", // Default game ID
            round_number: 1, // Default round
            type: "patti",
            number: patti,
            amount: Number(amount),
            played_at: new Date().toISOString(),
            status: "Pending"
          });
        }
        
        toast.success("Bet placed successfully!");
        setStoredPattis([]);
        onClose();
      }
    } catch (error) {
      console.error("Error placing bet:", error);
      toast.error("Failed to place bet");
    }
  };

  const clearLastPatti = () => {
    if (storedPattis.length > 0) {
      setStoredPattis(storedPattis.slice(0, -1));
    } else {
      toast.error("No Patti to clear!");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-5 gap-2">
        {numbers.map((num) => (
          <Button
            key={num}
            variant="outline"
            onClick={() => handleNumberClick(num === 0 ? 10 : num)}
            className={cn(
              "h-12 w-12 text-lg font-bold",
              selectedNumbers.includes(num) && "bg-primary text-primary-foreground"
            )}
          >
            {num}
          </Button>
        ))}
      </div>

      <div className="flex gap-2">
        <Button
          variant={isCPMode ? "default" : "outline"}
          onClick={() => {
            setIsCPMode(!isCPMode);
            setCpSelectedNumbers([]);
          }}
          className="w-24"
        >
          CP
        </Button>
        {isCPMode && (
          <Button onClick={handleCPOk} variant="outline" className="w-24">
            CP OK
          </Button>
        )}
      </div>

      {isCPMode && cpSelectedNumbers.length > 0 && (
        <div className="text-sm">
          CP Selected Numbers: {cpSelectedNumbers.map(n => n === 10 ? "0" : n).join(", ")}
        </div>
      )}

      {storedPattis.length > 0 && (
        <div className="text-sm">
          Stored Pattis: {storedPattis.join(", ")}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Amount per patti (₹)</label>
        <Input
          type="number"
          min={minAmount}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={`Minimum ₹${minAmount}`}
        />
      </div>

      <div className="flex justify-between items-center gap-4">
        <Button onClick={clearLastPatti} variant="outline">
          Clear Last
        </Button>
        <div className="flex-1 text-right">
          <p className="text-sm text-gray-500">
            Total: ₹{Number(amount || 0) * storedPattis.length}
          </p>
        </div>
        <Button onClick={handleSubmit} disabled={!storedPattis.length || !amount}>
          Submit
        </Button>
      </div>
    </div>
  );
};

export default PattiSelector;

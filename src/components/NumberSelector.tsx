
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { db, getCurrentUser, updateUserWallet } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

interface NumberSelectorProps {
  onClose: () => void;
}

const NumberSelector = ({ onClose }: NumberSelectorProps) => {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [amount, setAmount] = useState("");
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
  const minAmount = 10;

  const handleNumberClick = (num: number) => {
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter((n) => n !== num));
    } else {
      setSelectedNumbers([...selectedNumbers, num]);
    }
  };

  const handleSubmit = async () => {
    if (!amount || Number(amount) < minAmount) {
      toast.error(`Minimum amount is ₹${minAmount}`);
      return;
    }

    const totalAmount = Number(amount) * selectedNumbers.length;
    
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
        for (const number of selectedNumbers) {
          const betId = `${user.uid}_${Date.now()}_${number}`;
          await setDoc(doc(db, "bets", betId), {
            user_id: user.uid,
            game_id: "1", // Default game ID
            round_number: 1, // Default round
            type: "single",
            number: String(number),
            amount: Number(amount),
            played_at: new Date().toISOString(),
            status: "Pending"
          });
        }
        
        toast.success("Bet placed successfully!");
        onClose();
      }
    } catch (error) {
      console.error("Error placing bet:", error);
      toast.error("Failed to place bet");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-5 gap-2">
        {numbers.map((num) => (
          <Button
            key={num}
            variant={selectedNumbers.includes(num) ? "default" : "outline"}
            onClick={() => handleNumberClick(num)}
            className="h-12 w-12 text-lg font-bold"
          >
            {num}
          </Button>
        ))}
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Amount per number (₹)</label>
        <Input
          type="number"
          min={minAmount}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={`Minimum ₹${minAmount}`}
        />
      </div>
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">
          Total: ₹{Number(amount || 0) * selectedNumbers.length}
        </p>
        <Button onClick={handleSubmit} disabled={!selectedNumbers.length || !amount}>
          Submit
        </Button>
      </div>
    </div>
  );
};

export default NumberSelector;

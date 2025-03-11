
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { getCurrentUser, getUserProfile, updateUserWallet, db } from "@/lib/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

const Wallet = () => {
  const [addMoneyOpen, setAddMoneyOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [upiApp, setUpiApp] = useState("");
  const [balance, setBalance] = useState("0");
  const [upiId, setUpiId] = useState("demoUPI@ybl");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setUserId(user.uid);
      
      // Set up real-time listener for wallet balance
      const userRef = doc(db, "profiles", user.uid);
      const unsubscribe = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          const profile = doc.data();
          setBalance((profile.wallet_balance || 0).toString());
        }
      }, (error) => {
        console.error("Error getting wallet updates:", error);
      });

      return () => unsubscribe();
    } else {
      // If not logged in, set balance to 0
      setBalance("0");
    }
  }, []);

  useEffect(() => {
    const fetchUpiId = async () => {
      try {
        // Get UPI from Firestore
        const settingsRef = doc(db, "settings", "upi");
        const settingsDoc = await getDoc(settingsRef);
        
        if (settingsDoc.exists() && settingsDoc.data().upiId) {
          setUpiId(settingsDoc.data().upiId);
        } else {
          // Fallback to localStorage
          const storedUpiId = localStorage.getItem("upiId");
          if (storedUpiId) {
            setUpiId(storedUpiId);
          }
        }
      } catch (error) {
        console.error("Error fetching UPI ID:", error);
        // Fallback to localStorage
        const storedUpiId = localStorage.getItem("upiId");
        if (storedUpiId) {
          setUpiId(storedUpiId);
        }
      }
    };

    fetchUpiId();
  }, []);

  const handleAddMoney = () => {
    if (!amount || !upiApp) {
      toast.error("Please fill all fields");
      return;
    }

    const upiHandlers: { [key: string]: string } = {
      gpay: "tez://upi/pay",
      paytm: "paytmmp://pay",
      phonepe: "phonepe://pay",
    };

    const handler = upiHandlers[upiApp];
    if (!handler) {
      toast.error("Invalid UPI app selected");
      return;
    }

    console.log("Using UPI ID:", upiId);
    const upiParams = new URLSearchParams({
      pa: upiId, // UPI ID from settings
      pn: "Number Quest Winner",
      am: amount,
      cu: "INR",
      tn: "Add money to wallet"
    });

    // For development/testing, show which app would be opened
    toast.success(`Opening ${upiApp.toUpperCase()} with amount ₹${amount}`);

    // In production, this would open the actual UPI app
    window.location.href = `${handler}?${upiParams.toString()}`;
    setAddMoneyOpen(false);
  };

  const handleWithdraw = async () => {
    if (!amount) {
      toast.error("Please enter amount");
      return;
    }

    if (!userId) {
      toast.error("You must be logged in to withdraw");
      return;
    }

    const currentBalance = parseFloat(balance);
    const withdrawAmount = parseFloat(amount);

    if (withdrawAmount > currentBalance) {
      toast.error("Insufficient balance");
      return;
    }

    try {
      await updateUserWallet(userId, -withdrawAmount);
      toast.success("Withdrawal request submitted");
      setAmount("");
      setWithdrawOpen(false);
    } catch (error) {
      console.error("Withdrawal error:", error);
      toast.error("Failed to process withdrawal");
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="bg-white rounded-lg px-4 py-2 shadow-md">
        <p className="text-sm text-gray-600">Balance</p>
        <p className="font-bold">₹{balance}</p>
      </div>
      <Button onClick={() => setAddMoneyOpen(true)} variant="secondary">
        Add Money
      </Button>
      <Button onClick={() => setWithdrawOpen(true)} variant="outline">
        Withdraw
      </Button>

      <Sheet open={addMoneyOpen} onOpenChange={setAddMoneyOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Add Money</SheetTitle>
            <SheetDescription>Add money using UPI</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>
            <div className="space-y-2">
              <Label>UPI App</Label>
              <Select value={upiApp} onValueChange={setUpiApp}>
                <SelectTrigger>
                  <SelectValue placeholder="Select UPI app" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpay">Google Pay</SelectItem>
                  <SelectItem value="paytm">Paytm</SelectItem>
                  <SelectItem value="phonepe">PhonePe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddMoney} className="w-full">
              Proceed to Pay
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Withdraw Money</SheetTitle>
            <SheetDescription>Withdraw to your UPI ID</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>
            <Button onClick={handleWithdraw} className="w-full">
              Submit Withdrawal
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Wallet;

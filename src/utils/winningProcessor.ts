export const processWinnings = (result: string, gameId: string, roundNumber: number, rates: any[]) => {
  try {
    // Get all bets from localStorage
    const bets = JSON.parse(localStorage.getItem("bets") || "[]");
    
    // Log the start of processing
    console.log(`Processing winnings for Game ${gameId}, Round ${roundNumber}, Result ${result}`);

    const currentBets = bets.filter((bet: any) => 
      bet.gameId === gameId && 
      bet.roundNumber === roundNumber &&
      bet.status === "Pending"
    );

    console.log(`Found ${currentBets.length} pending bets to process`);

    // First, revert any previous winnings for this round if it exists
    const existingProcessedBets = bets.filter((bet: any) => 
      bet.gameId === gameId && 
      bet.roundNumber === roundNumber &&
      bet.status !== "Pending"
    );

    // Revert previous winnings from wallet
    existingProcessedBets.forEach(bet => {
      if (bet.status === "Won") {
        const currentBalance = parseFloat(localStorage.getItem("walletBalance") || "0");
        const revertedBalance = currentBalance - bet.winAmount;
        localStorage.setItem("walletBalance", revertedBalance.toString());
        console.log(`Reverted wallet balance: ${revertedBalance} after removing win ${bet.winAmount}`);
      }
    });

    // Process each bet
    const processedBets = currentBets.map((bet: any) => {
      let isWinner = false;
      let winAmount = 0;

      switch (bet.type) {
        case "single":
          isWinner = result.slice(-1) === bet.number;
          if (isWinner) {
            const rate = rates.find(r => r.type === "single")?.winningRate || 90;
            winAmount = bet.amount * (rate / 10);
          }
          break;
        case "patti":
          const sortedResult = result.split('').sort().join('');
          const sortedBet = bet.number.split('').sort().join('');
          isWinner = sortedResult === sortedBet;
          if (isWinner) {
            const rate = rates.find(r => r.type === "patti")?.winningRate || 900;
            winAmount = bet.amount * (rate / 10);
          }
          break;
        case "juri":
          const [first, second] = bet.combination.split("-");
          isWinner = result.slice(-1) === second && result.slice(-2, -1) === first;
          if (isWinner) {
            const rate = rates.find(r => r.type === "juri")?.winningRate || 100;
            winAmount = bet.amount * (rate / 10);
          }
          break;
      }

      const processedBet = {
        ...bet,
        status: isWinner ? "Won" : "Lost",
        result: result,
        winAmount: winAmount,
        processedAt: new Date().toISOString()
      };

      console.log(`Processed bet ${bet.id}: ${processedBet.status}, Win Amount: ${processedBet.winAmount}`);
      return processedBet;
    });

    // Update bets in localStorage
    const updatedBets = bets.map(bet => {
      const processedBet = processedBets.find(pb => pb.id === bet.id);
      const existingProcessedBet = existingProcessedBets.find(epb => epb.id === bet.id);
      
      if (processedBet) return processedBet;
      if (existingProcessedBet) {
        return {
          ...existingProcessedBet,
          status: "Pending",
          result: null,
          winAmount: 0,
          processedAt: null
        };
      }
      return bet;
    });

    localStorage.setItem("bets", JSON.stringify(updatedBets));

    // Update wallet balance
    const totalWinAmount = processedBets.reduce((acc, bet) => acc + (bet.winAmount || 0), 0);
    const currentBalance = parseFloat(localStorage.getItem("walletBalance") || "0");
    const newBalance = currentBalance + totalWinAmount;
    localStorage.setItem("walletBalance", newBalance.toString());
    console.log(`Updated wallet balance: ${newBalance}`);
    
  } catch (error) {
    console.error("Error processing winnings:", error);
  }
};

import React, { useEffect } from "react";
import { Award } from "lucide-react";

const WinAnimation = () => {
  useEffect(() => {
    const confetti = async () => {
      const { default: confetti } = await import("canvas-confetti");
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    };
    confetti();
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="bounce-animation">
        <Award className="h-24 w-24 text-accent" />
      </div>
    </div>
  );
};

export default WinAnimation;
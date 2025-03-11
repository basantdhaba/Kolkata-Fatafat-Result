import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown } from "lucide-react";

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  onSubmit: () => void;
}

const NumberInput = ({ value, onChange, onSubmit }: NumberInputProps) => {
  const handleIncrement = () => onChange(Math.min(value + 1, 100));
  const handleDecrement = () => onChange(Math.max(value - 1, 1));

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={handleDecrement}
        className="scale-animation"
      >
        <ArrowDown className="h-4 w-4" />
      </Button>
      <Input
        type="number"
        min={1}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-24 text-center text-xl font-bold"
      />
      <Button
        variant="outline"
        size="icon"
        onClick={handleIncrement}
        className="scale-animation"
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
      <Button onClick={onSubmit} className="scale-animation">
        Guess!
      </Button>
    </div>
  );
};

export default NumberInput;

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const navigate = useNavigate();

  const handleAuthClick = () => {
    onClose();
    navigate('/auth');
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Authentication</SheetTitle>
          <SheetDescription>
            Please log in or register to continue
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <p className="text-center mb-4">
            You need to be logged in to play games
          </p>
          <Button onClick={handleAuthClick} className="w-full">
            Go to Login/Register Page
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AuthModal;

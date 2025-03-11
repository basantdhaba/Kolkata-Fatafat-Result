
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { auth, logOut } from '@/lib/firebase'; // Changed signOut to logOut
import { toast } from 'sonner';

const AuthButtons = () => {
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";

  const handleAuthClick = () => {
    navigate('/auth');
  };

  const handleLogout = async () => {
    try {
      await logOut(); // Changed from signOut to logOut
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("userEmail");
      toast.success("Logged out successfully!");
      window.location.reload();
    } catch (error: any) {
      toast.error(`Logout failed: ${error.message}`);
    }
  };

  return (
    <div className="flex space-x-2">
      {isAuthenticated ? (
        <div className="flex items-center space-x-2">
          <span className="text-sm">{localStorage.getItem("userEmail")}</span>
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
        </div>
      ) : (
        <Button onClick={handleAuthClick}>Login/Register</Button>
      )}
    </div>
  );
};

export default AuthButtons;

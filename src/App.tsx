import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import React, { useEffect, useState } from 'react';
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import AdminLogin from "./components/admin/AdminLogin";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { initializeAdminAccount, onAuthStateChange, isAdmin, getCurrentUser } from "@/lib/firebase";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// Protected Route component
const ProtectedAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);
  
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        // First check if user is logged in
        const user = getCurrentUser();
        if (!user) {
          setIsAdminUser(false);
          setLoading(false);
          return;
        }
        
        // Check admin status directly by email as a fallback
        if (user.email === 'bazi.coin.bazar@gmail.com') {
          setIsAdminUser(true);
          setLoading(false);
          return;
        }

        // Then try the normal admin check
        const adminStatus = await isAdmin();
        setIsAdminUser(adminStatus);
      } catch (error) {
        console.error("Error checking admin status:", error);
        
        // Fallback to local storage check
        setIsAdminUser(localStorage.getItem("isAdmin") === "true");
      } finally {
        setLoading(false);
      }
    };
    
    checkAdminStatus();
  }, []);
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!isAdminUser) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

const App = () => {
  useEffect(() => {
    // Initialize admin account when app starts
    initializeAdminAccount();
    
    // Set up auth state listener
    const unsubscribe = onAuthStateChange(async (user) => {
      if (user) {
        // If user email is admin email, set admin flag directly
        if (user.email === 'bazi.coin.bazar@gmail.com') {
          localStorage.setItem("isAdmin", "true");
        } else {
          try {
            const adminStatus = await isAdmin();
            localStorage.setItem("isAdmin", adminStatus ? "true" : "false");
          } catch (error) {
            console.error("Error checking admin status:", error);
          }
        }
      } else {
        localStorage.removeItem("isAdmin");
      }
    });
    
    return () => unsubscribe();
  }, []);

  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/admin" element={<AdminLogin />} />
              <Route path="/auth" element={<Auth />} />
              <Route 
                path="/admin/dashboard" 
                element={
                  <ProtectedAdminRoute>
                    <Admin />
                  </ProtectedAdminRoute>
                } 
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;

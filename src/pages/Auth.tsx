
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { signInWithGoogle } from '@/lib/firebase';
import { toast } from 'sonner';

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
    if (isAuthenticated) {
      navigate('/');
    }

    // Create an iframe to load the Firebase auth page
    const iframe = document.createElement('iframe');
    iframe.src = '/firebase-auth.html';
    iframe.style.width = '100%';
    iframe.style.height = '100vh';
    iframe.style.border = 'none';
    
    // Listen for messages from the iframe
    window.addEventListener('message', (event) => {
      if (event.data === 'authenticated') {
        navigate('/');
      }
    });

    // Append the iframe to the auth-container
    const container = document.getElementById('auth-container');
    if (container) {
      container.appendChild(iframe);
    }

    return () => {
      // Clean up
      window.removeEventListener('message', () => {});
      if (container && container.contains(iframe)) {
        container.removeChild(iframe);
      }
    };
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      localStorage.setItem("isAuthenticated", "true");
      toast.success("Signed in with Google successfully!");
      navigate('/');
    } catch (error: any) {
      toast.error(`Google sign-in failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full h-screen">
      <div id="auth-container" className="w-full h-screen">
        {/* The iframe will be loaded here */}
      </div>
      <div className="absolute top-4 right-4 z-10">
        <Button 
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="bg-red-500 hover:bg-red-600 text-white"
        >
          {loading ? "Signing in..." : "Sign in with Google"}
        </Button>
      </div>
    </div>
  );
};

export default Auth;

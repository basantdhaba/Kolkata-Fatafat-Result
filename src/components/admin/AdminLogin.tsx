
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { signIn, isAdmin, initializeAdminAccount, getCurrentUser } from "@/lib/firebase";

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState("bazi.coin.bazar@gmail.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize admin account if it doesn't exist
    initializeAdminAccount();
    
    // Check if already logged in as admin
    const checkAdmin = async () => {
      try {
        const user = getCurrentUser();
        if (user) {
          const adminStatus = await isAdmin();
          if (adminStatus) {
            localStorage.setItem("isAdmin", "true");
            navigate("/admin/dashboard");
          }
        }
      } catch (error) {
        console.error("Admin check error:", error);
      }
    };
    
    checkAdmin();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Sign in the user
      await signIn(email, password);
      
      // Check if user is admin
      const adminStatus = await isAdmin();
      
      if (adminStatus) {
        localStorage.setItem("isAdmin", "true");
        toast.success("Admin login successful");
        navigate("/admin/dashboard");
      } else {
        toast.error("You do not have admin privileges");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Admin login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
          <CardDescription>Enter your credentials to access the admin dashboard.</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default AdminLogin;

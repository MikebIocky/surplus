// src/app/log-in/page.tsx
"use client";

import React, { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils"; // Import cn if needed for styling links/buttons when loading
import { useAuth } from '@/context/AuthContext'; // Import the hook for context access

// --- UI Imports ---
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle } from "lucide-react"; // Icons for loading and errors

export default function LoginPage() {
  const { login } = useAuth(); // Get the login function from AuthContext
  const router = useRouter();

  // --- State ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- Handle Form Submission ---
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null); // Clear previous errors
    setIsLoading(true); // Start loading state

    try {
      // --- Call Login API ---
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }), // Send credentials
      });

      const data = await response.json(); // Parse the response body

      // --- Handle API Errors ---
      if (!response.ok) {
        // Use error message from API if available, otherwise use generic message
        throw new Error(data.error || `Login failed: ${response.statusText}`);
      }

      // --- Handle API Success ---
      console.log("Login API Successful:", data);

      // Check if user data is present in the response
      if (data.user) {
        // --- Update Client State via AuthContext ---
        // Pass ONLY the user data object to the context's login function.
        // The HttpOnly cookie was set by the API route.
        // AuthContext will save this user data to localStorage for hydration.
        login(data.user);
        console.log("Login Page: AuthContext login function called.");

        // --- Redirect User ---
        // Redirect to the main profile page. Middleware will handle
        // redirecting to the specific /profile/[id] if needed.
        router.push('/profile');

      } else {
        // This indicates an issue with the API response structure
        console.error("Login Page: API response OK but missing user data.");
        throw new Error("Login failed: Server response incomplete.");
      }

    } catch (err: any) {
      console.error("Login Page Error:", err);
      setError(err.message || "An unknown error occurred during login.");
      setIsLoading(false); // Stop loading ONLY on error
    }
    // Do not set isLoading to false on success because we redirect
  };

  // --- Render Component ---
  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Log In</CardTitle>
          <CardDescription>
            Enter your email below to log in to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleSubmit} className="grid gap-4">
            {/* Email Input */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading} // Disable input when loading
              />
            </div>
            {/* Password Input */}
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder='******'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading} // Disable input when loading
              />
            </div>

            {/* Error Message Display */}
            {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/30">
                   <AlertCircle className="h-5 w-5 flex-shrink-0" />
                   <span className="flex-grow">{error}</span>
                    <button type="button" onClick={() => setError(null)} className="text-destructive hover:text-destructive/80">×</button>
                </div>
            )}

            {/* Submit Button */}
            <Button type="submit" className="w-full mt-2" disabled={isLoading}>
               {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
               {isLoading ? "Logging In..." : "Log In"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
           {/* Optional: Forgot Password Link */}
          {/* <Link href="/forgot-password" className="text-sm underline underline-offset-4 hover:text-primary">
             Forgot your password?
          </Link> */}
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/sign-up" className={cn( // Use cn if disabling link while loading
                "font-medium underline underline-offset-4 hover:text-primary",
                isLoading && "pointer-events-none opacity-50" // Example: Disable link when loading
            )}>
              Sign Up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
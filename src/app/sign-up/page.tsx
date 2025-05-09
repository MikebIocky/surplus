// src/app/(dashboard)/sign-up/page.tsx (or appropriate path)
"use client";

import React, { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Ensure useRouter is imported
import { cn } from "@/lib/utils";
// ... (other imports: Button, Card, Input, Label, icons, etc.)
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle } from 'lucide-react';


export default function SignUpPage() {
  const router = useRouter(); // Initialize router

  // ... (form state: name, email, password, confirmPassword) ...
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // ... (loading/error state: isLoading, error, success message state) ...
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null); // For user feedback

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // --- Frontend Validation ---
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    // Add email format validation if desired

    setIsLoading(true); // Start loading

    try {
      // --- API Call ---
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password }),
      });

      const data = await response.json(); // Always parse JSON to get potential error messages

      if (!response.ok) {
        // Use error from API response if available, otherwise use status text
        throw new Error(data.error || `Signup failed: ${response.statusText}`);
      }

      // --- Handle Success ---
      console.log("Sign Up Successful:", data);
      setSuccessMessage("Account created! Redirecting to your profile...");

      // ** Extract User ID from Response **
      const userId = data?.user?.id;

      if (userId) {
        // ** Redirect to the dynamic profile page **
        setTimeout(() => {
          // Use replace to avoid the signup page being in the browser history
          router.replace(`/profile/${userId}`);
        }, 1500); // 1.5 second delay to show success message
      } else {
        // Fallback if ID is missing (should indicate an API issue)
        console.error("Signup response successful but missing user ID:", data);
        setError("Account created, but redirect failed. Please log in.");
        setIsLoading(false); // Stop loading if redirect fails here
        // Optionally redirect to login after a longer delay
        // setTimeout(() => router.push('/log-in'), 3000);
      }

    } catch (err: any) {
      console.error("Sign Up Error:", err);
      setError(err.message || "An unknown error occurred during sign up.");
      setIsLoading(false); // Stop loading on error
      setSuccessMessage(null);
    }
    // Don't set isLoading=false if redirecting, let the page change handle it
  };

  // --- Render JSX ---
  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
          <CardDescription>
            Enter your details below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleSubmit} className="grid gap-4">
            {/* Name Input */}
            <div className="space-y-1.5">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" type="text" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} required disabled={isLoading} />
            </div>
            {/* Email Input */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
            </div>
            {/* Password Input */}
            <div className="space-y-1.5">
              <Label htmlFor="password">Password *</Label>
              <Input id="password" type="password" placeholder='****** (min. 6 chars)' value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} disabled={isLoading} />
            </div>
            {/* Confirm Password Input */}
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirm Password *</Label>
              <Input id="confirm-password" type="password" placeholder='******' value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={isLoading} />
            </div>

            {/* Error Message Display */}
            {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/30">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span className="flex-grow">{error}</span>
                    <button type="button" onClick={() => setError(null)} className="text-destructive hover:text-destructive/80">×</button>
                </div>
            )}
            {/* Success Message Display */}
            {successMessage && !error && ( // Only show success if no error
                 <div className="flex items-center gap-2 text-sm text-green-700 bg-green-100 p-3 rounded-md border border-green-200">
                    <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin"/> {/* Show spinner with success */}
                    <span className="flex-grow">{successMessage}</span>
                 </div>
             )}

            {/* Submit Button */}
            <Button type="submit" className="w-full mt-2" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/log-in" className={cn("font-medium underline underline-offset-4 hover:text-primary", isLoading && "pointer-events-none opacity-50")}>
              Log In
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
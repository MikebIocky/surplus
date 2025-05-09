// src/context/AuthContext.tsx
"use client";

import React, {
  createContext, useState, useEffect, useContext, ReactNode, useCallback, useRef
} from 'react';
import { useRouter } from 'next/navigation';

// Define UserData shape - what the client UI needs
interface UserData {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  description?: string;
  rating?: number;
}

// Define Context value shape
interface AuthContextType {
  user: UserData | null;       // Current user data
  isLoading: boolean;          // Tracks initial auth check
  checkAuthState: () => Promise<void>; // Function to manually re-check auth if needed
  login: (userData: UserData) => void;  // Function to update state immediately after API login
  logout: () => Promise<void>;  // Function to clear state and call logout API
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// No longer need localStorage keys here

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start loading
  const router = useRouter();
  const initialCheckPerformed = useRef(false); // Prevent effect running multiple times in StrictMode

  // --- Function to check auth status via API ---
  const checkAuthState = useCallback(async (isInitialLoad = false) => {
    if (!isInitialLoad) setIsLoading(true); // Show loading for manual checks if needed
    console.log("[AuthContext CHECK] Calling /api/auth/status...");
    try {
      const response = await fetch('/api/auth/status'); // Call the new API route
      const data = await response.json();

      if (response.ok && data.isAuthenticated && data.user) {
        console.log("[AuthContext CHECK] Status OK, User authenticated:", data.user);
        setUser(data.user);
      } else {
        console.log("[AuthContext CHECK] Status indicates not authenticated or error.");
        setUser(null);
        // Don't necessarily clear cookie here, API route or middleware might have done it
      }
    } catch (error) {
      console.error("[AuthContext CHECK] Error fetching auth status:", error);
      setUser(null); // Assume not logged in on fetch error
    } finally {
      setIsLoading(false); // Finished check
      console.log("[AuthContext CHECK] Finished. isLoading:", false, "User:", user ? user.id : null);
    }
  }, [/* no dependencies needed here unless endpoint changes */]); // Ensure stable function reference


  // --- Effect to check auth state on initial client mount ---
  useEffect(() => {
     // In React 18 StrictMode, effects run twice in dev. Use ref to run check only once.
     if (!initialCheckPerformed.current) {
          initialCheckPerformed.current = true;
          console.log("[AuthContext MOUNT] Performing initial auth state check.");
          checkAuthState(true); // Pass flag indicating it's the initial load
     }
  }, [checkAuthState]); // Depend on the stable checkAuthState function


  // --- Login Action (Client-side state update ONLY) ---
  // Called by Login Page immediately after successful API login response
  const login = useCallback((userData: UserData) => {
    if (!userData?.id || !userData?.name) {
        console.error("[AuthContext LOGIN ACTION] Invalid userData provided:", userData);
        return;
    }
    console.log("[AuthContext LOGIN ACTION] Setting user state immediately:", userData);
    setUser(userData);
    // No need to save to localStorage anymore
    // No need to set token state anymore
    // Set isLoading false just in case it was somehow true
    setIsLoading(false);
  }, []);


  // --- Logout Action ---
  const logout = useCallback(async () => {
    console.log("[AuthContext LOGOUT ACTION] Starting...");
    setUser(null); // Clear user state immediately for UI responsiveness
    // No localStorage to clear

    try {
      console.log("[AuthContext LOGOUT ACTION] Calling /api/auth/logout...");
      await fetch('/api/auth/logout', { method: 'POST' });
      console.log("[AuthContext LOGOUT ACTION] Logout API call finished.");
    } catch (error) {
      console.error("[AuthContext LOGOUT ACTION] Logout API call failed:", error);
    }
    // Redirect after clearing state and attempting API call
    router.push('/log-in');
  }, [router, user]);


  // --- Provide Context Value ---
  const value: AuthContextType = {
    user,
    isLoading,
    checkAuthState, // Expose check function if needed manually elsewhere
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// --- useAuth Hook ---
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) { throw new Error('useAuth must be used within an AuthProvider'); }
  return context;
};
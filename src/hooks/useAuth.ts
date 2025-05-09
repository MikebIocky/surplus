// Example: hooks/useAuth.ts (or wherever your auth context hook is)
import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext'; // Adjust path

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  // Assume context provides: user { id, name, email, avatar?, ... }, token, isLoading, login, logout
  return context;
};
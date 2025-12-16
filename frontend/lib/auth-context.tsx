'use client';

import { tokenManager } from "@lib/token-manager";
import { createContext, useContext, useState, ReactNode, useEffect } from "react";

type AuthContextType = {
  token: string | null;
  setToken: (token: string | null) => void;
  isSignedIn: boolean;
  setIsSignedIn: (val: boolean) => void;
};


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [token, setTokenState] = useState<string | null>(null);

  useEffect(() =>
  {
    const stored = localStorage.getItem('token');
    if (stored)
    {
      tokenManager.set(stored);
      setTokenState(stored);
    }
  }, []);

  const setToken = (token: string | null) => {
    if (token) tokenManager.set(token);
    else tokenManager.clear();

    setTokenState(token);
  }

  return (
    <AuthContext.Provider value={{  setIsSignedIn, token, setToken, isSignedIn:!!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
/**
 * @file AuthContext.tsx
 * @description Provides authentication state management using Cognito.
 * Manages the global authentication status and triggers initial synchronization.
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { CognitoUserSession } from "amazon-cognito-identity-js";
import { UserPool } from "../UserPool";
import { syncService } from "../utils/syncService";

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  setIsAuthenticated: (_value: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // E2E Bypass
    if (localStorage.getItem("isAuthenticated") === "true") {
      setIsAuthenticated(true);
      setLoading(false);
      return;
    }

    const user = UserPool.getCurrentUser();
    if (user) {
      user.getSession(
        (err: Error | null, session: CognitoUserSession | null) => {
          setTimeout(() => {
            if (err || !session || !session.isValid()) {
              setIsAuthenticated(false);
            } else {
              setIsAuthenticated(true);
              syncService.pullAll();
            }
            setLoading(false);
          }, 0);
        },
      );
    } else {
      setTimeout(() => {
        setIsAuthenticated(false);
        setLoading(false);
      }, 0);
    }
  }, []);

  const logout = () => {
    const user = UserPool.getCurrentUser();
    if (user) {
      user.signOut();
    }
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, loading, setIsAuthenticated, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export { AuthProvider, useAuth };

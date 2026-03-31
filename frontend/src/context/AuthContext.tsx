/**
 * @file AuthContext.tsx
 * @description Provides authentication state management using Cognito.
 * Manages the global authentication status and triggers initial synchronization.
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { CognitoUserSession } from "amazon-cognito-identity-js";
import { UserPool } from "../UserPool";
import { syncService } from "../utils/syncService";

/**
 * Interface representing the structure of the authentication context.
 */
interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  setIsAuthenticated: (_value: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider component that wraps the application and provides auth state.
 * Automatically checks for existing sessions on mount.
 *
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - Child components.
 * @returns {React.ReactElement}
 */
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock authentication for preview/testing environments
    if (localStorage.getItem("isAuthenticated") === "true") {
      setIsAuthenticated(true);
      setLoading(false);
      syncService.pullAll();
      return;
    }

    // Check for an existing Cognito user session on component mount
    const user = UserPool.getCurrentUser();
    if (user) {
      user.getSession(
        (err: Error | null, session: CognitoUserSession | null) => {
          setTimeout(() => {
            if (err || !session || !session.isValid()) {
              setIsAuthenticated(false);
              localStorage.removeItem("isAuthenticated");
            } else {
              setIsAuthenticated(true);
              // Trigger an initial full pull synchronization if a session exists
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
      localStorage.removeItem("isAuthenticated");
    }
  }, []);

  /**
   * Signs out the current user and clears local session data.
   */
  const logout = () => {
    const user = UserPool.getCurrentUser();
    if (user) {
      user.signOut();
    }
    setIsAuthenticated(false);
    localStorage.removeItem("isAuthenticated");
    // We no longer call localStorage.clear() to allow ETags to persist across sessions
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, loading, setIsAuthenticated, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to access authentication context.
 * @returns {AuthContextType}
 * @throws {Error} if used outside of an AuthProvider.
 */
const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export { AuthProvider, useAuth };

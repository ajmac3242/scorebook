/**
 * @file AuthContext.tsx
 * @description Provides authentication state management using Cognito.
 * Manages the global authentication status and triggers initial synchronization.
 */

import React, { useState, useEffect } from "react";
import { CognitoUserSession } from "amazon-cognito-identity-js";
import { UserPool } from "../UserPool";
import { syncService } from "../utils/syncService";
import { AuthContext } from "./AuthContextTypes";

/**
 * AuthProvider component that wraps the application and provides auth state.
 * Automatically checks for existing sessions on mount.
 *
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - Child components.
 * @returns {React.ReactElement}
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("isAuthenticated") === "true";
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If already authenticated via localStorage, we still want to verify session
    // but we can skip the immediate redirect if any.

    // Check for an existing Cognito user session on component mount
    const user = UserPool.getCurrentUser();
    if (user) {
      user.getSession(
        (err: Error | null, session: CognitoUserSession | null) => {
          const isValid = !err && session && session.isValid();

          if (!isValid) {
            setIsAuthenticated((prev) => {
              if (prev) {
                localStorage.removeItem("isAuthenticated");
                return false;
              }
              return prev;
            });
          } else {
            setIsAuthenticated(true);
            localStorage.setItem("isAuthenticated", "true");
            // Trigger an initial full pull synchronization if a session exists
            syncService.pullAll();
          }
          setLoading(false);
        },
      );
    } else {
      setTimeout(() => {
        setIsAuthenticated((prev) => {
          if (prev) {
            localStorage.removeItem("isAuthenticated");
            return false;
          }
          return prev;
        });
        setLoading(false);
      }, 0);
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


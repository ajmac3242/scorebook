import React, { createContext, useContext, useState, useEffect } from "react";
import { CognitoUserSession } from "amazon-cognito-identity-js";
import { UserPool } from "../UserPool";

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  setIsAuthenticated: (value: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 *
 * @param root0
 * @param root0.children
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = UserPool.getCurrentUser();
    if (user) {
      user.getSession(
        (err: Error | null, session: CognitoUserSession | null) => {
          if (err || !session || !session.isValid()) {
            localStorage.removeItem("isAuthenticated");
            setIsAuthenticated(false);
          } else {
            setIsAuthenticated(true);
          }
          setLoading(false);
        },
      );
    } else {
      localStorage.removeItem("isAuthenticated");
      setIsAuthenticated(false);
      setLoading(false);
    }
  }, []);

  const logout = () => {
    const user = UserPool.getCurrentUser();
    if (user) {
      user.signOut();
    }
    setIsAuthenticated(false);
    localStorage.removeItem("isAuthenticated");
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
 *
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

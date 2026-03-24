import { createContext } from "react";

/**
 * Interface representing the structure of the authentication context.
 */
export interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  setIsAuthenticated: (value: boolean) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

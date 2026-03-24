import { useContext } from "react";
import { AuthContext } from "../context/AuthContextTypes";

/**
 * Hook to access authentication context.
 * @returns {AuthContextType}
 * @throws {Error} if used outside of an AuthProvider.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

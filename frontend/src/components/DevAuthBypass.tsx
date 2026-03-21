import React, { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

/**
 * Development helper component to bypass authentication.
 */
const DevAuthBypass: React.FC = () => {
  const { setIsAuthenticated } = useAuth();

  useEffect(() => {
    if (import.meta.env.MODE === "development") {
      setIsAuthenticated(true);
      localStorage.setItem("isAuthenticated", "true");
    }
  }, [setIsAuthenticated]);

  return null;
};

export default DevAuthBypass;

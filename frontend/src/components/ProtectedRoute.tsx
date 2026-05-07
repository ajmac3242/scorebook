import React from "react";
import { Box, Typography } from "@mui/material";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Higher-order component to protect routes that require authentication.
 * Redirects to the login page if the user is not authenticated.
 *
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - Child components to render if authenticated.
 * @returns {React.ReactElement}
 */
export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

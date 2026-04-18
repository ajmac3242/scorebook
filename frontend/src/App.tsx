/**
 * @file App.tsx
 * @description Main application entry point for the React frontend.
 * Configures the theme, routing, authentication provider, and layout.
 */

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import {
  ThemeProvider,
  CssBaseline,
  Typography,
  Container,
  Box,
} from "@mui/material";
import theme from "./theme";
import GameMode from "./pages/GameMode";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Players from "./pages/Players";
import PlayerStats from "./pages/PlayerStats";
import GameStats from "./pages/GameStats";
import Teams from "./pages/Teams";
import TeamStats from "./pages/TeamStats";
import Settings from "./pages/Settings";
import Navigation from "./components/Navigation";
import { Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import DevAuthBypass from "./components/DevAuthBypass";

/**
 * Higher-order component to protect routes that require authentication.
 * Redirects to the login page if the user is not authenticated.
 *
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - Child components to render if authenticated.
 * @returns {React.ReactElement}
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
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

/**
 * Main layout component containing the navigation and routed page content.
 * Handles the display of the sidebar based on authentication state.
 *
 * @returns {React.ReactElement}
 */
const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Box
        component="a"
        href="#main-content"
        sx={{
          position: "absolute",
          left: "-10000px",
          top: "auto",
          width: "1px",
          height: "1px",
          overflow: "hidden",
          "&:focus": {
            position: "fixed",
            top: 16,
            left: 16,
            width: "auto",
            height: "auto",
            bgcolor: "primary.main",
            color: "white",
            p: 2,
            borderRadius: 1,
            zIndex: 10000,
          },
        }}
      >
        Skip to main content
      </Box>
      {/* Show navigation bar only for authenticated users */}
      {isAuthenticated && <Navigation />}

      <Box
        id="main-content"
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 3 },
          pt: {
            xs: isAuthenticated ? "80px" : 2,
            sm: isAuthenticated ? "104px" : 3,
          },
          pb: { xs: 2, sm: 3 },
          width: "100%",
          overflowX: "hidden",
        }}
      >
        <Container
          maxWidth="xl"
          sx={{
            px: { xs: 1, sm: 2 },
          }}
        >
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teams/:teamId"
              element={
                <ProtectedRoute>
                  <TeamStats />
                </ProtectedRoute>
              }
            />
            <Route
              path="/game/stats"
              element={
                <ProtectedRoute>
                  <GameStats />
                </ProtectedRoute>
              }
            />
            <Route
              path="/players/:playerId"
              element={
                <ProtectedRoute>
                  <PlayerStats />
                </ProtectedRoute>
              }
            />
            <Route
              path="/players"
              element={
                <ProtectedRoute>
                  <Players />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teams"
              element={
                <ProtectedRoute>
                  <Teams />
                </ProtectedRoute>
              }
            />
            <Route
              path="/game"
              element={
                <ProtectedRoute>
                  <GameMode />
                </ProtectedRoute>
              }
            />
            {/* Catch-all route to redirect to home */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Container>
      </Box>
    </Box>
  );
};

/**
 * Root App component providing global providers (Theme, Auth, Router).
 *
 * @returns {React.ReactElement}
 */
const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <DevAuthBypass />
          <AppContent />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;

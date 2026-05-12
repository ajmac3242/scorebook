/**
 * @file App.tsx
 * @description Main application entry point for the React frontend.
 * Configures the theme, routing, authentication provider, and layout.
 */
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Typography, Container, Box } from "@mui/material";
import { CourtSightThemeProvider, ThemePreset } from "./theme/ThemeContext";
import GameMode from "./pages/GameMode";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Players from "./pages/Players";
import PlayerStats from "./pages/PlayerStats";
import GameStats from "./pages/GameStats";
import Teams from "./pages/Teams";
import TeamStats from "./pages/TeamStats";
import Opponents from "./pages/Opponents";
import OpponentScoutingReport from "./pages/OpponentScoutingReport";
import Settings from "./pages/Settings";
import Navigation from "./components/Navigation";
import { Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import DevAuthBypass from "./components/DevAuthBypass";

/**
 * Theme presets available to the user via the Settings page.
 * The first entry ("default") is applied on first load unless a
 * persisted preference is found in localStorage.
 */
const THEME_PRESETS: ThemePreset[] = [
  {
    id: "default",
    label: "CourtSight Classic",
    previewColor: "#4fc3f7",
    mode: "dark",
    palette: {
      primary: { main: "#4fc3f7" },
      secondary: { main: "#1a3a5c" },
      background: { default: "#0d1b2a", paper: "#1a3a5c" },
    },
  },
  {
    id: "light",
    label: "Daybreak",
    previewColor: "#1565c0",
    mode: "light",
    palette: {
      primary: { main: "#1565c0" },
      secondary: { main: "#e3f2fd" },
      background: { default: "#f5f5f5", paper: "#ffffff" },
    },
  },
  {
    id: "forest",
    label: "Forest",
    previewColor: "#66bb6a",
    mode: "dark",
    palette: {
      primary: { main: "#66bb6a" },
      secondary: { main: "#1b5e20" },
      background: { default: "#0a1f0a", paper: "#1b5e20" },
    },
  },
  {
    id: "sunset",
    label: "Sunset",
    previewColor: "#ff7043",
    mode: "dark",
    palette: {
      primary: { main: "#ff7043" },
      secondary: { main: "#bf360c" },
      background: { default: "#1a0a00", paper: "#bf360c" },
    },
  },
];

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
            bgcolor: "primary.dark",
            color: "white",
            p: "12px 24px",
            borderRadius: "32px",
            zIndex: 10000,
            textDecoration: "none",
            fontWeight: 800,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            border: "2px solid white",
          },
        }}
      >
        Skip to main content
      </Box>
      {isAuthenticated && <Navigation />}
      <Box
        id="main-content"
        component="main"
        tabIndex={-1}
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
        <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2 } }}>
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
              path="/opponents"
              element={
                <ProtectedRoute>
                  <Opponents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/opponents/:opponentId/scouting"
              element={
                <ProtectedRoute>
                  <OpponentScoutingReport />
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
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Container>
      </Box>
    </Box>
  );
};

/**
 * Root App component providing global providers (Theme, Auth, Router).
 * CourtSightThemeProvider owns ThemeProvider + CssBaseline internally,
 * so those are not duplicated here.
 *
 * @returns {React.ReactElement}
 */
const App: React.FC = () => {
  return (
    <CourtSightThemeProvider presets={THEME_PRESETS} defaultPresetId="default">
      <Router>
        <AuthProvider>
          <DevAuthBypass />
          <AppContent />
        </AuthProvider>
      </Router>
    </CourtSightThemeProvider>
  );
};

export default App;

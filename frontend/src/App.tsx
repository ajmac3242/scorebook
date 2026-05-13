/**
 * @file App.tsx
 * @description Main application entry point for the React frontend.
 * Configures the theme, routing, authentication provider, and layout.
 */
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { CourtSightThemeProvider, ThemePreset } from "./theme/ThemeContext";
import GameMode from "./pages/GameMode";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Players from "./pages/Players";
import PlayerStats from "./pages/PlayerStats";
import GameStats from "./pages/GameStats";
import Teams from "./pages/Teams";
import TeamStats from "./pages/TeamStats";
import Games from "./pages/Games";
import Reports from "./pages/Reports";
import Opponents from "./pages/Opponents";
import OpponentScoutingReport from "./pages/OpponentScoutingReport";
import Settings from "./pages/Settings";
import { AuthProvider, useAuth } from "./context/AuthContext";
import DevAuthBypass from "./components/DevAuthBypass";
import AppShell from "./components/layout/AppShell";
import SideNav from "./components/layout/SideNav";
import BottomNav from "./components/layout/BottomNav";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";

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
      text: { primary: "#f5f9ff", secondary: "#b8c7da" },
    },
  },
  {
    id: "gametime",
    label: "Gametime",
    previewColor: "#1565c0",
    mode: "light",
    palette: {
      primary: { main: "#1565c0" },
      secondary: { main: "#e8f1fb" },
      background: { default: "#f7f8fa", paper: "#ffffff" },
      text: { primary: "#101828", secondary: "#667085" },
    },
  },
  {
    id: "hardwood",
    label: "Hardwood",
    previewColor: "#c58a3d",
    mode: "light",
    palette: {
      primary: { main: "#c58a3d" },
      secondary: { main: "#ead8bf" },
      background: { default: "#f6efe6", paper: "#fff9f2" },
      text: { primary: "#3d2a1a", secondary: "#7a5a3a" },
    },
  },
  {
    id: "leather",
    label: "Leather",
    previewColor: "#c96a2b",
    mode: "dark",
    palette: {
      primary: { main: "#c96a2b" },
      secondary: { main: "#5a3420" },
      background: { default: "#1a120d", paper: "#3b2418" },
      text: { primary: "#f8efe8", secondary: "#d0b3a1" },
    },
  },
  {
    id: "blacktop",
    label: "Blacktop",
    previewColor: "#f59e0b",
    mode: "dark",
    palette: {
      primary: { main: "#f59e0b" },
      secondary: { main: "#24292f" },
      background: { default: "#111315", paper: "#1b1f24" },
      text: { primary: "#f7f7f7", secondary: "#b5bcc6" },
    },
  },
];

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const liveGame = useLiveQuery(
    () => db.games.where("completed").equals(0).first(),
    [],
  );

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <AppShell
      drawerSlot={
        <SideNav
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
          isLive={!!liveGame}
          onSearchOpen={() => {
            // Hook OmniSearch here when ready.
          }}
        />
      }
      topBarSlot={null}
      bottomSlot={<BottomNav isLive={!!liveGame} />}
    >
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

      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/games"
          element={
            <ProtectedRoute>
              <Games />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
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
          path="/teams"
          element={
            <ProtectedRoute>
              <Teams />
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
          path="/game/:gameId"
          element={
            <ProtectedRoute>
              <GameStats />
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
    </AppShell>
  );
};

const App: React.FC = () => {
  return (
    <CourtSightThemeProvider presets={THEME_PRESETS}>
      <AuthProvider>
        <Router>
          <DevAuthBypass />
          <AppContent />
        </Router>
      </AuthProvider>
    </CourtSightThemeProvider>
  );
};

export default App;

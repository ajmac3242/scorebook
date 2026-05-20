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
import { CourtSightThemeProvider } from "./theme/ThemeContext";
import { PRESETS, DEFAULT_PRESET_ID } from "./theme/presets";
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
import { db, type Game } from "./db";

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
  const liveGame = useLiveQuery<Game | undefined>(
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
          isLive={!!(liveGame as unknown)}
          onSearchOpen={() => {
            // Hook OmniSearch here when ready.
          }}
        />
      }
      topBarSlot={null}
      bottomSlot={<BottomNav isLive={!!(liveGame as unknown)} />}
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
    <CourtSightThemeProvider
      presets={PRESETS}
      defaultPresetId={DEFAULT_PRESET_ID}
    >
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

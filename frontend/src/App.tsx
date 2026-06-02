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
import { Box, CircularProgress, IconButton, useMediaQuery, useTheme } from "@mui/material";
import { Menu as MenuIcon } from "@mui/icons-material";
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
import DevAuthBypass from "./dev/DevAuthBypass";
import AppShell from "./components/layout/AppShell";
import SideNav from "./components/layout/SideNav";
import CourtSightLogo from "./components/CourtSightLogo";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";

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

/**
 * Slim mobile top bar — only visible on phone (<768px).
 * Contains: CourtSight logo mark + hamburger to open the nav drawer.
 * This is intentionally minimal — it is not a full app bar.
 */
const MobileTopBar: React.FC<{ onMenuOpen: () => void }> = ({ onMenuOpen }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      px: 2,
      height: 52,
      bgcolor: "var(--cs-semantic-color-background-default)",
      borderBottom: "1px solid var(--cs-semantic-color-border-subtle)",
      flexShrink: 0,
    }}
  >
    <CourtSightLogo width={120} />
    <IconButton
      onClick={onMenuOpen}
      aria-label="Open navigation menu"
      size="small"
      sx={{ color: "var(--cs-semantic-color-text-secondary)" }}
    >
      <MenuIcon />
    </IconButton>
  </Box>
);

const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

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
      topBarSlot={
        isMobile ? (
          <MobileTopBar onMenuOpen={() => setMobileOpen(true)} />
        ) : null
      }
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

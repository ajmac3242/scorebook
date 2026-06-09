import React, { useMemo } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import Dashboard from "./pages/Dashboard";
import Teams from "./pages/Teams";
import Team from "./pages/Team";
import TeamStats from "./pages/TeamStats";
import Players from "./pages/Players";
import PlayerStats from "./pages/PlayerStats";
import GameMode from "./pages/GameMode";
import GameStats from "./pages/GameStats";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ConfirmSignup from "./pages/ConfirmSignup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Reports from "./pages/Reports";
import Opponents from "./pages/Opponents";
import OpponentScoutingReport from "./pages/OpponentScoutingReport";
import Settings from "./pages/Settings";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AppShell from "./components/layout/AppShell";
import SideNav from "./components/layout/SideNav";
import CourtSightLogo from "./components/CourtSightLogo";
import { useTokens } from "./theme/useTokens";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";
import { ThemePreset, CourtSightThemeProvider } from "./theme";

const PRESETS: ThemePreset[] = [];
const DEFAULT_PRESET_ID = "default";

const LoadingScreen = () => {
  const tokens = useTokens();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
      }}
    >
      <CircularProgress
        size={40}
        sx={{ color: tokens.semantic.color.brand.primary.main }}
      />
    </Box>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppContent = () => {
  const tokens = useTokens();
  const hasTeams =
    useLiveQuery(() => db.teams.count().then((c) => c > 0), []) ?? false;

  const nav = useMemo(
    () => (
      <SideNav
        logo={<CourtSightLogo />}
        items={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Teams", to: "/teams" },
          { label: "Players", to: "/players" },
          { label: "Opponents", to: "/opponents" },
          { label: "Reports", to: "/reports" },
          { label: "Settings", to: "/settings" },
        ]}
      />
    ),
    [],
  );

  return (
    <AppShell
      navigation={nav}
      contentMaxWidth={tokens.component.pageSurface.pageMaxWidth}
    >
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/confirm-signup" element={<ConfirmSignup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
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
          path="/team/:teamId"
          element={
            <ProtectedRoute>
              <Team />
            </ProtectedRoute>
          }
        />
        <Route
          path="/team/:teamId/stats"
          element={
            <ProtectedRoute>
              <TeamStats />
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
          path="/players/:playerId"
          element={
            <ProtectedRoute>
              <PlayerStats />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/:gameId"
          element={
            <ProtectedRoute>
              <GameMode />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/:gameId/stats"
          element={
            <ProtectedRoute>
              <GameStats />
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
          path="/opponents/:opponentId"
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
          path="*"
          element={<Navigate to={hasTeams ? "/dashboard" : "/teams"} replace />}
        />
      </Routes>
    </AppShell>
  );
};

const App = () => {
  return (
    <CourtSightThemeProvider
      presets={PRESETS}
      defaultPresetId={DEFAULT_PRESET_ID}
    >
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </CourtSightThemeProvider>
  );
};

export default App;

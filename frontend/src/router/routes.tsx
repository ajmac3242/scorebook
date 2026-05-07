import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Opponents from "../pages/Opponents";
import OpponentScoutingReport from "../pages/OpponentScoutingReport";
import Settings from "../pages/Settings";
import TeamStats from "../pages/TeamStats";
import GameStats from "../pages/GameStats";
import PlayerStats from "../pages/PlayerStats";
import Players from "../pages/Players";
import Teams from "../pages/Teams";
import GameMode from "../pages/GameMode";

export const AppRoutes: React.FC = () => {
  return (
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
      {/* Catch-all route to redirect to home */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

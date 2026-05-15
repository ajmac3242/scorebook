import React from "react";
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Box,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  SportsBasketball as GamesIcon,
  FlashOn as LiveIcon,
  People as PlayersIcon,
  Groups as TeamsIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";

interface BottomNavProps {
  /** Whether a game is in progress (to show the animated dot) */
  isLive?: boolean;
}

const NAV_ITEMS = [
  { label: "Dash", path: "/", icon: <DashboardIcon /> },
  { label: "Games", path: "/games", icon: <GamesIcon /> },
  { label: "Live", path: "/game", icon: <LiveIcon />, isLiveTrigger: true },
  { label: "Opps", path: "/opponents", icon: <GamesIcon /> },
  { label: "Players", path: "/players", icon: <PlayersIcon /> },
  { label: "Teams", path: "/teams", icon: <TeamsIcon /> },
];

/**
 * BottomNav — Thumb-accessible navigation for mobile screens (< 768px).
 */
const BottomNav: React.FC<BottomNavProps> = ({ isLive = false }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Paper
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        borderRadius: 0,
        bgcolor: "background.paper",
      }}
      elevation={3}
    >
      <BottomNavigation
        showLabels
        value={location.pathname}
        onChange={(_, newValue) => {
          navigate(newValue);
        }}
        sx={{
          height: 56,
          "& .MuiBottomNavigationAction-root": {
            minWidth: 0,
            padding: "6px 0",
            color: "text.secondary",
            "&.Mui-selected": {
              color: "primary.main",
            },
          },
        }}
      >
        {NAV_ITEMS.map((item) => (
          <BottomNavigationAction
            key={item.label}
            label={item.label}
            value={item.path}
            icon={
              <Box sx={{ position: "relative", display: "flex" }}>
                {item.icon}
                {item.isLiveTrigger && isLive && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: -2,
                      right: -2,
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      bgcolor: "#FF6B1A",
                    }}
                  />
                )}
              </Box>
            }
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
};

export default BottomNav;

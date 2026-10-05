import React from "react";
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Box,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  SportsBasketball as GamesIcon,
  FlashOn as LiveIcon,
  People as PlayersIcon,
  Groups as TeamsIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useTokens } from "../../theme/useTokens";

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
 * BottomNav — Thumb-accessible navigation for mobile screens.
 */
const BottomNav: React.FC<BottomNavProps> = ({ isLive = false }) => {
  const tokens = useTokens();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  if (!isMobile) {
    return null;
  }

  return (
    <Paper
      elevation={3}
      component="nav"
      aria-label="Mobile navigation"
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: theme.zIndex.appBar,
        borderRadius: `${tokens.semantic.shape.radius.none}px`,
        bgcolor: tokens.semantic.color.background.paper,
        borderTop: `${tokens.semantic.focus.width}px solid ${tokens.semantic.color.border.subtle}`,
        display: { xs: "block", md: "none" },
      }}
    >
      <BottomNavigation
        showLabels
        value={location.pathname}
        onChange={(_, newValue) => {
          navigate(newValue);
        }}
        sx={{
          height: `${tokens.touch.targetComfortable + 12}px`,
          bgcolor: "transparent",
          "& .MuiBottomNavigationAction-root": {
            minWidth: `${tokens.touch.targetComfortable}px`,
            minHeight: `${tokens.touch.targetComfortable}px`,
            py: tokens.semantic.spacing.xs / 8,
            color: tokens.semantic.color.text.secondary,
            transition: `all ${tokens.motion.duration.normal} ${tokens.motion.easing.productive}`,
            "&.Mui-selected": {
              color: tokens.semantic.color.brand.primary.main,
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
                    aria-label="Live game active indicator"
                    sx={{
                      position: "absolute",
                      top: `${tokens.semantic.focus.width * -1}px`,
                      right: `${tokens.semantic.focus.width * -1}px`,
                      width: `${tokens.semantic.spacing.xs}px`,
                      height: `${tokens.semantic.spacing.xs}px`,
                      borderRadius: `${tokens.semantic.shape.radius.full}px`,
                      bgcolor: tokens.semantic.color.feedback.warning.main,
                      border: `${tokens.semantic.focus.width}px solid ${tokens.semantic.color.background.paper}`,
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

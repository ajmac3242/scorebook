/**
 * @file BottomNav.tsx
 * @description CourtSight Bottom Navigation bar — mobile only (< 768px).
 * Five items: Dashboard, Games, Live, Players, Teams.
 * Shows animated live indicator dot on the Live item when a game is in progress.
 */
import React from 'react';
import {
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  SportsBasketball as LiveIcon,
  VideogameAsset as GamesIcon,
  People as PlayersIcon,
  Groups as TeamsIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';

const BOTTOM_NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: <DashboardIcon /> },
  { label: 'Games', path: '/games', icon: <GamesIcon /> },
  { label: 'Live', path: '/game', icon: <LiveIcon /> },
  { label: 'Players', path: '/players', icon: <PlayersIcon /> },
  { label: 'Teams', path: '/teams', icon: <TeamsIcon /> },
] as const;

interface BottomNavProps {
  /** Whether a game is currently in progress — shows orange dot on Live item */
  gameInProgress?: boolean;
}

/**
 * BottomNav — mobile-only (< 768px) bottom navigation.
 * Hidden on tablet+ using CSS. Rendered at fixed bottom of AppShell's bottom slot.
 */
const BottomNav: React.FC<BottomNavProps> = ({ gameInProgress = false }) => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isTablet = useMediaQuery(theme.breakpoints.up('md'));

  // Do not render on tablet+ (AppShell hides the slot, but guard here too)
  if (isTablet) return null;

  const currentPath = location.pathname;
  const activeIndex = BOTTOM_NAV_ITEMS.findIndex(
    (item) => item.path === currentPath
  );

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: theme.zIndex.appBar,
        // Safe area inset for notched phones
        pb: 'env(safe-area-inset-bottom)',
        bgcolor: 'background.paper',
      }}
    >
      <BottomNavigation
        value={activeIndex === -1 ? false : activeIndex}
        onChange={(_, newIndex) => {
          navigate(BOTTOM_NAV_ITEMS[newIndex].path);
        }}
        sx={{
          bgcolor: 'background.paper',
          height: 56,
          '& .Mui-selected': {
            color: 'primary.main',
          },
          '& .MuiBottomNavigationAction-root': {
            color: 'text.secondary',
            minWidth: 0,
            padding: '6px 0',
          },
          '& .Mui-selected .MuiBottomNavigationAction-label': {
            fontSize: '0.6875rem',
            fontWeight: 600,
          },
        }}
      >
        {BOTTOM_NAV_ITEMS.map((item, index) => {
          const isLive = item.label === 'Live';
          return (
            <BottomNavigationAction
              key={item.label}
              label={item.label}
              icon={
                isLive && gameInProgress ? (
                  <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                    {item.icon}
                    {/* Animated live dot */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -2,
                        right: -4,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        animation: 'courtSightPulse 1.4s ease-in-out infinite',
                        '@keyframes courtSightPulse': {
                          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                          '50%': { opacity: 0.4, transform: 'scale(0.7)' },
                        },
                      }}
                    />
                  </Box>
                ) : (
                  item.icon
                )
              }
            />
          );
        })}
      </BottomNavigation>
    </Paper>
  );
};

export default BottomNav;

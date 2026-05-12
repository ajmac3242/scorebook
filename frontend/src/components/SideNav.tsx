/**
 * @file SideNav.tsx
 * @description CourtSight Side Navigation Drawer.
 * Permanent on tablet+ (>= 768px), temporary (overlay) on mobile.
 * Includes nav items, live game indicator, and coach profile pill.
 */
import React from 'react';
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Typography,
    useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  SportsBasketball as LiveIcon,
  VideogameAsset as GamesIcon,
  People as PlayersIcon,
  Groups as TeamsIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';

const DRAWER_WIDTH = 240;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: <DashboardIcon /> },
  { label: 'Games', path: '/games', icon: <GamesIcon /> },
  { label: 'Live', path: '/game', icon: <LiveIcon /> },
  { label: 'Players', path: '/players', icon: <PlayersIcon /> },
  { label: 'Teams', path: '/teams', icon: <TeamsIcon /> },
  { label: 'Reports', path: '/reports', icon: <ReportsIcon /> },
];

interface SideNavProps {
  /** Whether the temporary (mobile) drawer is open */
  mobileOpen?: boolean;
  /** Callback to close the mobile drawer */
  onMobileClose?: () => void;
  /** Whether a game is currently in progress — shows animated live dot on Live item */
  gameInProgress?: boolean;
  /** Coach display name shown in the profile pill */
  coachName?: string;
  /** Coach initials for the avatar */
  coachInitials?: string;
}

/** Animated orange dot indicator for the Live nav item */
const LiveDot: React.FC = () => (
  <Box
    component="span"
    sx={{
      display: 'inline-block',
      width: 8,
      height: 8,
      borderRadius: '50%',
      bgcolor: 'primary.main',
      ml: 0.5,
      animation: 'courtSightPulse 1.4s ease-in-out infinite',
      '@keyframes courtSightPulse': {
        '0%, 100%': { opacity: 1, transform: 'scale(1)' },
        '50%': { opacity: 0.4, transform: 'scale(0.7)' },
      },
    }}
  />
);

/** Inner drawer content — used in both permanent and temporary variants */
const DrawerContent: React.FC<Pick<SideNavProps, 'gameInProgress' | 'coachName' | 'coachInitials'>> = ({
  gameInProgress = false,
  coachName = 'Coach',
  coachInitials = 'C',
}) => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: 'background.paper',
        borderRight: `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* Logo header area */}
      <Box sx={{ height: 64, display: 'flex', alignItems: 'center', px: 2 }}>
        {/* CourtSightLogo will be wired here in DESIGN-004 */}
        <Typography
          variant="h6"
          sx={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: 700,
            color: 'primary.main',
            letterSpacing: '-0.5px',
          }}
        >
          CourtSight
        </Typography>
      </Box>

      {/* Nav items */}
      <List component="nav" disablePadding sx={{ px: 1, flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          const isLive = item.label === 'Live';

          return (
            <ListItemButton
              key={item.label}
              onClick={() => navigate(item.path)}
              selected={isActive}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'action.selected',
                  color: 'primary.main',
                  '& .MuiListItemIcon-root': {
                    color: 'primary.main',
                  },
                },
                '&.Mui-selected:hover': {
                  bgcolor: 'action.selected',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: isActive ? 'primary.main' : 'text.secondary' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {item.label}
                    {isLive && gameInProgress && <LiveDot />}
                  </Box>
                }
                primaryTypographyProps={{
                  variant: 'body2',
                  fontWeight: isActive ? 600 : 400,
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      {/* Settings item + coach profile pill at bottom */}
      <Box sx={{ px: 1, pb: 2 }}>
        <ListItemButton
          onClick={() => navigate('/settings')}
          selected={location.pathname === '/settings'}
          sx={{
            borderRadius: 2,
            mb: 1,
            '&.Mui-selected': {
              bgcolor: 'action.selected',
              color: 'primary.main',
              '& .MuiListItemIcon-root': { color: 'primary.main' },
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: location.pathname === '/settings' ? 'primary.main' : 'text.secondary' }}>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText
            primary="Settings"
            primaryTypographyProps={{ variant: 'body2' }}
          />
        </ListItemButton>

        {/* Coach profile pill */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 1.5,
            py: 1,
            borderRadius: 2,
            bgcolor: 'action.hover',
          }}
        >
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: 'primary.main',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            {coachInitials}
          </Avatar>
          <Typography variant="body2" fontWeight={600} noWrap>
            {coachName}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

/**
 * SideNav — MUI Drawer permanent on tablet+, temporary on mobile.
 * Accepts gameInProgress prop to show animated live badge.
 */
const SideNav: React.FC<SideNavProps> = ({
  mobileOpen = false,
  onMobileClose,
  gameInProgress = false,
  coachName = 'Coach',
  coachInitials = 'C',
}) => {
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.up('md'));

  const contentProps = { gameInProgress, coachName, coachInitials };

  if (isTablet) {
    // Permanent variant for tablet+
    return (
      <Drawer
        variant="permanent"
        open
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            border: 'none',
            position: 'relative',
            height: '100%',
          },
        }}
      >
        <DrawerContent {...contentProps} />
      </Drawer>
    );
  }

  // Temporary (overlay) variant for mobile
  return (
    <Drawer
      variant="temporary"
      open={mobileOpen}
      onClose={onMobileClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
        },
      }}
    >
      <DrawerContent {...contentProps} />
    </Drawer>
  );
};

export default SideNav;

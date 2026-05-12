import React from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Avatar,
  Chip,
} from '@mui/material';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import SearchIcon from '@mui/icons-material/Search';
import CourtSightLogo from '../CourtSightLogo';
import SyncBadge from './SyncBadge';

export interface AppTopBarProps {
  /** Name of the currently starred / active team */
  teamName?: string;
  /** Whether a live game sync is active */
  isLive?: boolean;
  /** Called when the OmniSearch trigger is pressed */
  onSearchOpen?: () => void;
}

const AppTopBar: React.FC<AppTopBarProps> = ({
  teamName = 'My Team',
  isLive = false,
  onSearchOpen,
}) => {
  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        height: { xs: 56, sm: 64 },
        justifyContent: 'center',
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          px: { xs: 1.5, sm: 2 },
          minHeight: 'unset !important',
          gap: 1,
        }}
      >
        {/* Left: Logo + team switcher chip */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          <CourtSightLogo size={32} />
          <Chip
            label={teamName}
            size="small"
            variant="outlined"
            sx={{
              fontWeight: 600,
              fontSize: '0.75rem',
              borderColor: 'divider',
              color: 'text.primary',
              cursor: 'pointer',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          />
        </Box>

        {/* Spacer */}
        <Box sx={{ flex: 1 }} />

        {/* Center: OmniSearch trigger */}
        <IconButton
          onClick={onSearchOpen}
          aria-label="Open search"
          size="small"
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            px: 1.5,
            gap: 0.5,
            color: 'text.secondary',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <SearchIcon fontSize="small" />
        </IconButton>

        {/* Spacer */}
        <Box sx={{ flex: 1 }} />

        {/* Right: SyncBadge + notifications + avatar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
          <SyncBadge isLive={isLive} />
          <IconButton size="small" aria-label="Notifications" sx={{ color: 'text.secondary' }}>
            <NotificationsNoneOutlinedIcon fontSize="small" />
          </IconButton>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: 'primary.main',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            C
          </Avatar>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default AppTopBar;

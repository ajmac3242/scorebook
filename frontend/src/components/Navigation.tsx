/**
 * @file Navigation.tsx
 * @description Main navigation component.
 * Handles application routing,
 * system connectivity status (online/offline), and logout with data safety checks.
 */

import React, { useState, useEffect } from "react";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Divider,
  Tooltip,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Stack,
} from "@mui/material";
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Dashboard as DashboardIcon,
  People as PlayersIcon,
  Groups as TeamsIcon,
  SportsBasketball as GamesIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  SportsBasketball as BasketballIcon,
  Wifi as OnlineIcon,
  WifiOff as OfflineIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { syncService } from "../utils/syncService";
import { Refresh as SyncingIcon, CloudSync } from "@mui/icons-material";

/**
 * Navigation item component that expands on hover or when selected.
 * @param root0
 * @param root0.item
 * @param root0.isSelected
 * @param root0.onClick
 */
const NavItem: React.FC<{
  item: { text: string; icon: React.ReactNode; path: string };
  isSelected: boolean;
  onClick?: () => void;
}> = ({ item, isSelected, onClick }) => {
  return (
    <ListItemButton
      component={Link}
      to={item.path}
      onClick={onClick}
      sx={{
        minHeight: 44,
        width: "auto",
        px: isSelected ? 2 : 1.25,
        py: 1,
        borderRadius: "24px",
        bgcolor: isSelected ? "rgba(255,255,255,0.15)" : "transparent",
        color: isSelected ? "secondary.main" : "rgba(255,255,255,0.7)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        "&:hover": {
          bgcolor: isSelected
            ? "rgba(255,255,255,0.25)"
            : "rgba(255,255,255,0.1)",
          color: "white",
        },
      }}
    >
      <ListItemIcon
        sx={{
          minWidth: 0,
          mr: isSelected ? 1 : 0,
          justifyContent: "center",
          color: "inherit",
        }}
      >
        {item.icon}
      </ListItemIcon>
      {isSelected && (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 700,
            fontFamily: "var(--serif)",
            whiteSpace: "nowrap",
            fontSize: "0.875rem",
          }}
        >
          {item.text}
        </Typography>
      )}
    </ListItemButton>
  );
};

/**
 * Navigation component that provides links and system status indicators.
 * Now functions as a Top Navigation bar on desktop and a bottom floating pill on mobile.
 *
 * @returns {React.ReactElement}
 */
const Navigation: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { logout } = useAuth();
  const location = useLocation();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    /**
     * Handles the browser coming back online.
     * Triggers immediate synchronization.
     */
    const handleOnline = () => {
      syncService.pushUpdates();
      syncService.pullAll();
    };

    window.addEventListener("online", handleOnline);

    // Poll for the current synchronization status from the sync service
    const interval = setInterval(() => {
      setIsSyncing(syncService.getSyncingStatus());
    }, 1000);

    return () => {
      window.removeEventListener("online", handleOnline);
      clearInterval(interval);
    };
  }, []);

  /**
   * Handles the logout button click.
   * If there are unsynced changes, a warning dialog is shown.
   */
  const handleLogoutClick = async () => {
    const hasUnsynced = await syncService.hasUnsyncedChanges();
    if (hasUnsynced) {
      setLogoutDialogOpen(true);
    } else {
      logout();
    }
  };

  /**
   * Confirms and executes the logout action from the dialog.
   */
  const confirmLogout = () => {
    setLogoutDialogOpen(false);
    logout();
  };

  // Configuration for main navigation items
  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/" },
    { text: "Teams", icon: <TeamsIcon />, path: "/teams" },
    { text: "Players", icon: <PlayersIcon />, path: "/players" },
    { text: "Games", icon: <GamesIcon />, path: "/games" },
  ];

  const mobileMenuItems = [
    ...menuItems,
    { text: "Settings", icon: <SettingsIcon />, path: "/settings" },
  ];

  const desktopContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        color: "text.primary",
        px: 4,
        width: "100%",
        justifyContent: "space-between",
        maxWidth: "1400px",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          width: "200px",
        }}
      >
        <Box component="img" src="/logo.svg" sx={{ width: 32, height: 32 }} />
        <Typography
          variant="h6"
          noWrap
          sx={{
            fontFamily: "var(--serif)",
            color: "primary.dark",
            fontWeight: 700,
          }}
        >
          Scorebook
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          bgcolor: "#121212",
          borderRadius: "32px",
          px: 0.75,
          py: 0.5,
          gap: 0.5,
          boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
        }}
      >
        {menuItems.map((item) => (
          <NavItem
            key={item.text}
            item={item}
            isSelected={location.pathname === item.path}
          />
        ))}
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          width: "200px",
          gap: 1,
        }}
      >
        <IconButton
          component={Link}
          to="/settings"
          sx={{
            color:
              location.pathname === "/settings"
                ? "secondary.main"
                : "primary.main",
            bgcolor:
              location.pathname === "/settings"
                ? "primary.dark"
                : "transparent",
            "&:hover": {
              bgcolor:
                location.pathname === "/settings"
                  ? "primary.dark"
                  : "rgba(0,0,0,0.05)",
            },
          }}
        >
          <SettingsIcon />
        </IconButton>
        <IconButton
          onClick={handleLogoutClick}
          sx={{
            color: "error.main",
            "&:hover": {
              bgcolor: "rgba(166, 68, 68, 0.08)",
            },
          }}
        >
          <LogoutIcon />
        </IconButton>
      </Box>
    </Box>
  );

  const logoutDialog = (
    <Dialog open={logoutDialogOpen} onClose={() => setLogoutDialogOpen(false)}>
      <DialogTitle sx={{ fontFamily: "var(--serif)" }}>
        Unsynced Changes
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          You have data that hasn't been synced to the server yet. If you logout
          now, these changes may be lost. Are you sure you want to logout?
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={() => setLogoutDialogOpen(false)} color="inherit">
          Cancel
        </Button>
        <Button onClick={confirmLogout} color="error" variant="contained">
          Logout Anyway
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <>
      {isSyncing && !isMobile && (
        <Box
          sx={{
            position: "fixed",
            top: 80,
            right: 16,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: 1,
            bgcolor: "secondary.main",
            color: "secondary.contrastText",
            px: 2,
            py: 1,
            borderRadius: 20,
            boxShadow: 3,
            animation: "slideIn 0.3s ease-out, pulse 2s infinite",
            "@keyframes slideIn": {
              from: { transform: "translateX(100%)", opacity: 0 },
              to: { transform: "translateX(0)", opacity: 1 },
            },
          }}
        >
          <BasketballIcon className="spin" />
          <Typography variant="caption" sx={{ fontWeight: "bold" }}>
            SYNCING DATA
          </Typography>
        </Box>
      )}

      {!isMobile && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: 72,
            bgcolor: "transparent",
            zIndex: theme.zIndex.appBar,
            display: "flex",
            justifyContent: "center",
          }}
        >
          {desktopContent}
        </Box>
      )}

      {isMobile && (
        <Box
          sx={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            height: 60,
            bgcolor: "#121212",
            zIndex: theme.zIndex.appBar,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            px: 0.75,
            borderRadius: "32px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            width: "auto",
            maxWidth: "95vw",
            gap: 0.25,
          }}
        >
          {mobileMenuItems.map((item) => (
            <NavItem
              key={item.text}
              item={item}
              isSelected={location.pathname === item.path}
            />
          ))}
          <IconButton
            onClick={handleLogoutClick}
            sx={{
              color: "error.light",
              ml: 0.5,
              "&:hover": {
                bgcolor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
      {logoutDialog}
    </>
  );
};

export default Navigation;

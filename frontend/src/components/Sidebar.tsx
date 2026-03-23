/**
 * @file Sidebar.tsx
 * @description Main navigation sidebar component.
 * Handles application routing, drawer state (expanded/collapsed),
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
 */
const NavItem: React.FC<{
  item: { text: string; icon: React.ReactNode; path: string };
  isSelected: boolean;
  onClick?: () => void;
}> = ({ item, isSelected, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const expanded = isHovered || isSelected;

  return (
    <ListItemButton
      component={Link}
      to={item.path}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        minHeight: 40,
        px: expanded ? 2 : 1.5,
        borderRadius: "20px",
        bgcolor: isSelected ? "rgba(255,255,255,0.15)" : "transparent",
        color: isSelected ? "secondary.main" : "rgba(255,255,255,0.7)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        mx: 0.5,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        "&:hover": {
          bgcolor: isSelected ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)",
          color: "white",
        },
      }}
    >
      <ListItemIcon
        sx={{
          minWidth: 0,
          mr: expanded ? 1.5 : 0,
          justifyContent: "center",
          color: "inherit",
          transition: "margin 0.3s ease-in-out",
        }}
      >
        {item.icon}
      </ListItemIcon>
      <Box
        sx={{
          width: expanded ? "auto" : 0,
          maxWidth: expanded ? 200 : 0,
          opacity: expanded ? 1 : 0,
          overflow: "hidden",
          transition: "all 0.3s ease-in-out",
          whiteSpace: "nowrap",
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontWeight: isSelected ? 700 : 500,
            fontFamily: "var(--serif)",
          }}
        >
          {item.text}
        </Typography>
      </Box>
    </ListItemButton>
  );
};

const drawerWidth = 240;
const collapsedDrawerWidth = 72;

/**
 * Sidebar component that provides navigation links and system status indicators.
 * Adapts to mobile screens by transforming into a bottom drawer.
 * Now functions as a Top Navigation bar on desktop.
 *
 * @returns {React.ReactElement}
 */
const Sidebar: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(!isMobile);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    /**
     * Handles the browser coming back online.
     * Triggers immediate synchronization.
     */
    const handleOnline = () => {
      setIsOnline(true);
      syncService.pushUpdates();
      syncService.pullAll();
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Poll for the current synchronization status from the sync service
    const interval = setInterval(() => {
      setIsSyncing(syncService.getSyncingStatus());
    }, 1000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  /**
   * Toggles the expanded/collapsed state of the drawer.
   */
  const toggleDrawer = () => {
    setOpen(!open);
  };

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

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: "center",
        bgcolor: "primary.dark",
        color: "primary.contrastText",
        px: { xs: 2, md: 4 },
        width: "100%",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          p: isMobile ? 2 : 0,
          width: isMobile ? "100%" : "200px",
          justifyContent: isMobile ? "center" : "flex-start",
        }}
      >
        <Box component="img" src="/logo.svg" sx={{ width: 32, height: 32 }} />
        <Typography
          variant="h6"
          noWrap
          sx={{ fontFamily: "var(--serif)", color: "inherit", fontWeight: 700 }}
        >
          Scorebook
        </Typography>
      </Box>

      {isMobile && <Divider sx={{ width: "100%", bgcolor: "rgba(255,255,255,0.1)" }} />}

      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          width: isMobile ? "100%" : "auto",
          justifyContent: "center",
          p: isMobile ? 1 : 0,
        }}
      >
        {(isMobile ? mobileMenuItems : menuItems).map((item) =>
          isMobile ? (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                to={item.path}
                onClick={() => setOpen(false)}
                sx={{
                  borderRadius: 1,
                  bgcolor:
                    location.pathname === item.path
                      ? "rgba(255,255,255,0.1)"
                      : "transparent",
                }}
              >
                <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ) : (
            <NavItem
              key={item.text}
              item={item}
              isSelected={location.pathname === item.path}
            />
          ),
        )}
      </Box>

      {!isMobile && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", width: "200px" }}>
          <NavItem
            item={{ text: "Settings", icon: <SettingsIcon />, path: "/settings" }}
            isSelected={location.pathname === "/settings"}
          />
        </Box>
      )}
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
            bgcolor: "primary.dark",
            zIndex: theme.zIndex.appBar,
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            display: "flex",
            justifyContent: "center",
          }}
        >
          {drawerContent}
        </Box>
      )}

      {isMobile && (
        <Box
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            height: "calc(64px + env(safe-area-inset-bottom))",
            bgcolor: "primary.dark",
            zIndex: theme.zIndex.appBar,
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
            pb: "env(safe-area-inset-bottom)",
            boxShadow: "0 -4px 20px rgba(0,0,0,0.2)",
          }}
        >
          {mobileMenuItems.map((item) => (
            <IconButton
              key={item.text}
              component={Link}
              to={item.path}
              sx={{
                color: location.pathname === item.path ? "secondary.main" : "rgba(255,255,255,0.6)",
                flexDirection: "column",
                gap: 0.5,
                borderRadius: 2,
                "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
              }}
            >
              {item.icon}
              <Typography variant="caption" sx={{ fontSize: "0.6rem" }}>{item.text}</Typography>
            </IconButton>
          ))}
        </Box>
      )}
      {logoutDialog}
    </>
  );
};

export default Sidebar;

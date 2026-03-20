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
} from "@mui/material";
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Dashboard as DashboardIcon,
  EventNote as SeasonsIcon,
  People as PlayersIcon,
  Groups as TeamsIcon,
  SportsBasketball as GamesIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  SportsBasketball as BasketballIcon,
  Wifi as OnlineIcon,
  WifiOff as OfflineIcon,
} from "@mui/icons-material";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { syncService } from "../utils/syncService";
import { Refresh as SyncingIcon } from "@mui/icons-material";

const drawerWidth = 240;
const collapsedDrawerWidth = 72;

/**
 * Sidebar component that provides navigation links and system status indicators.
 * Adapts to mobile screens by transforming into a bottom drawer.
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
    { text: "Seasons", icon: <SeasonsIcon />, path: "/seasons" },
    { text: "Players", icon: <PlayersIcon />, path: "/players" },
    { text: "Teams", icon: <TeamsIcon />, path: "/teams" },
    { text: "Games", icon: <GamesIcon />, path: "/games" },
  ];

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "primary.main",
        color: "primary.contrastText",
      }}
    >
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: open ? "space-between" : "center",
          minHeight: 64,
        }}
      >
        {open && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <BasketballIcon sx={{ color: "secondary.main" }} />
            <Typography variant="h6" noWrap sx={{ fontFamily: "var(--serif)" }}>
              Stats
            </Typography>
          </Box>
        )}
        {!open && <BasketballIcon sx={{ color: "secondary.main" }} />}
        {open && !isMobile && (
          <IconButton onClick={toggleDrawer} sx={{ color: "inherit" }}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>

      <Divider sx={{ bgcolor: "rgba(255,255,255,0.1)" }} />

      <List sx={{ flexGrow: 1, px: 1 }}>
        {menuItems.map((item) => (
          <ListItem
            key={item.text}
            disablePadding
            sx={{ display: "block", mb: 0.5 }}
          >
            <Tooltip title={!open ? item.text : ""} placement="right">
              <ListItemButton
                component={Link}
                to={item.path}
                sx={{
                  minHeight: 48,
                  justifyContent: open ? "initial" : "center",
                  px: 2.5,
                  borderRadius: 1,
                  bgcolor:
                    location.pathname === item.path
                      ? "rgba(255,255,255,0.1)"
                      : "transparent",
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,0.2)",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 3 : "auto",
                    justifyContent: "center",
                    color:
                      location.pathname === item.path
                        ? "secondary.main"
                        : "inherit",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {open && (
                  <ListItemText primary={item.text} sx={{ opacity: 1 }} />
                )}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ bgcolor: "rgba(255,255,255,0.1)" }} />

      <List sx={{ px: 1 }}>
        <ListItem disablePadding sx={{ display: "block", mb: 0.5 }}>
          <Tooltip
            title={!open ? (isOnline ? "Online" : "Offline") : ""}
            placement="right"
          >
            <ListItemButton
              sx={{
                minHeight: 48,
                justifyContent: open ? "initial" : "center",
                px: 2.5,
                borderRadius: 1,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : "auto",
                  justifyContent: "center",
                  color: isSyncing
                    ? "secondary.main"
                    : isOnline
                      ? "success.light"
                      : "error.light",
                }}
              >
                {isSyncing ? (
                  <SyncingIcon className="spin" />
                ) : isOnline ? (
                  <OnlineIcon className="hover-grow" />
                ) : (
                  <OfflineIcon className="sync-pulse" />
                )}
              </ListItemIcon>
              {open && (
                <ListItemText
                  primary={
                    isSyncing ? "Syncing..." : isOnline ? "Online" : "Offline"
                  }
                  secondary={open ? "System Status" : ""}
                  secondaryTypographyProps={{
                    sx: { color: "rgba(255,255,255,0.5)", fontSize: "0.7rem" },
                  }}
                />
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>
        <ListItem disablePadding sx={{ display: "block", mb: 0.5 }}>
          <ListItemButton
            sx={{
              minHeight: 48,
              justifyContent: open ? "initial" : "center",
              px: 2.5,
              borderRadius: 1,
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: open ? 3 : "auto",
                justifyContent: "center",
                color: "inherit",
              }}
            >
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primary="Profile" />}
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding sx={{ display: "block" }}>
          <ListItemButton
            onClick={handleLogoutClick}
            sx={{
              minHeight: 48,
              justifyContent: open ? "initial" : "center",
              px: 2.5,
              borderRadius: 1,
              "&:hover": {
                bgcolor: "error.main",
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: open ? 3 : "auto",
                justifyContent: "center",
                color: "inherit",
              }}
            >
              <LogoutIcon />
            </ListItemIcon>
            {open && <ListItemText primary="Logout" />}
          </ListItemButton>
        </ListItem>
      </List>

      {!open && !isMobile && (
        <IconButton
          onClick={toggleDrawer}
          sx={{
            color: "inherit",
            alignSelf: "center",
            mb: 2,
            bgcolor: "rgba(255,255,255,0.05)",
          }}
        >
          <MenuIcon />
        </IconButton>
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

  if (isMobile) {
    return (
      <>
        <IconButton
          onClick={toggleDrawer}
          sx={{
            position: "fixed",
            bottom: 16,
            left: 16,
            zIndex: theme.zIndex.drawer + 1,
            bgcolor: "primary.main",
            color: "white",
            "&:hover": { bgcolor: "primary.dark" },
          }}
        >
          <MenuIcon />
        </IconButton>
        <Drawer
          anchor="bottom"
          open={open}
          onClose={toggleDrawer}
          PaperProps={{
            sx: {
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              height: "auto",
              maxHeight: "80%",
            },
          }}
        >
          {drawerContent}
        </Drawer>
        {logoutDialog}
      </>
    );
  }

  return (
    <>
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          width: open ? drawerWidth : collapsedDrawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: open ? drawerWidth : collapsedDrawerWidth,
            boxSizing: "border-box",
            transition: theme.transitions.create("width", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: "hidden",
            border: "none",
          },
        }}
      >
        {drawerContent}
      </Drawer>
      {logoutDialog}
    </>
  );
};

export default Sidebar;

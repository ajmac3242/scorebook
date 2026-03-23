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
  const location = useLocation();
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
          bgcolor: "primary.main",
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
      </Box>
    </Box>
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
        <>
          {/* Mobile Top Branding */}
          <Box
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              height: 56,
              bgcolor: "transparent",
              zIndex: theme.zIndex.appBar,
              display: "flex",
              alignItems: "center",
              px: 2,
            }}
          >
            <Box
              component="img"
              src="/logo.svg"
              sx={{ width: 28, height: 28, mr: 1 }}
            />
            <Typography
              variant="h6"
              sx={{
                fontFamily: "var(--serif)",
                color: "primary.dark",
                fontWeight: 700,
                fontSize: "1.1rem",
              }}
            >
              Scorebook
            </Typography>
          </Box>

          {/* Mobile Bottom Navigation Pill */}
          <Box
            sx={{
              position: "fixed",
              bottom: 24,
              left: "50%",
              transform: "translateX(-50%)",
              height: 60,
              bgcolor: "primary.main",
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
          </Box>
        </>
      )}
    </>
  );
};

export default Navigation;

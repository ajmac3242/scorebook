/**
 * @file Navigation.tsx
 * @description Main navigation component.
 * Handles application routing,
 * system connectivity status (online/offline), and logout with data safety checks.
 */

import React, { useState, useEffect } from "react";
import {
  Box,
  ListItemButton,
  ListItemIcon,
  Typography,
  useMediaQuery,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  People as PlayersIcon,
  Groups as TeamsIcon,
  SportsBasketball as BasketballIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { Tooltip } from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import { useTokens } from "../../theme";
import { syncService } from "../../utils/syncService";

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
  const tokens = useTokens();

  return (
    <Tooltip title={item.text} placement="bottom">
      <ListItemButton
        component={Link}
        to={item.path}
        onClick={onClick}
        aria-label={`Navigate to ${item.text}`}
        aria-current={isSelected ? "page" : undefined}
        sx={{
          minHeight: tokens.touch.targetComfortable,
          width: "auto",
          px: isSelected ? `${tokens.semantic.spacing.md}px` : `${tokens.semantic.spacing.xs + 2}px`,
          py: `${tokens.semantic.spacing.xs}px`,
          borderRadius: `${tokens.semantic.shape.radius.full}px`,
          bgcolor: isSelected
            ? tokens.semantic.color.action.selected
            : "transparent",
          color: isSelected
            ? tokens.semantic.color.text.inverse
            : tokens.semantic.color.text.disabled,
          transition: `all ${tokens.motion.duration.normal}ms ${tokens.motion.easing.productive}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          "&:hover": {
            bgcolor: tokens.semantic.color.action.hover,
            color: tokens.semantic.color.text.inverse,
          },
          "&:focus-visible": {
            outline: `${tokens.semantic.focus.width} solid ${tokens.semantic.color.action.focusRing}`,
            outlineOffset: tokens.semantic.focus.offset,
          },
          "&::after": isSelected
            ? {
                content: '""',
                position: "absolute",
                bottom: "4px",
                left: "20%",
                right: "20%",
                height: "2px",
                bgcolor: "white",
                borderRadius: "2px",
                opacity: 0.8,
              }
            : {},
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 0,
            mr: isSelected ? 1 : 0,
            justifyContent: "center",
            color: "inherit",
            "& svg": {
              fontSize: "1.25rem",
            },
          }}
        >
          {item.icon}
        </ListItemIcon>
        {isSelected && (
          <Typography
            variant="body2"
            sx={{
              fontWeight: tokens.typography.fontWeight.bold,
              fontFamily: tokens.typography.fontFamily.accent,
              whiteSpace: "nowrap",
              fontSize: tokens.typography.fontSize.xs,
            }}
          >
            {item.text}
          </Typography>
        )}
      </ListItemButton>
    </Tooltip>
  );
};

/**
 * Navigation component that provides links and system status indicators.
 * Functions as a unified top navigation bar with a blurred background.
 *
 * @returns {React.ReactElement}
 */
const Navigation: React.FC = () => {
  const tokens = useTokens();
  const isMobile = useMediaQuery("(max-width:600px)");
  const location = useLocation();
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    /**
     * Handles the browser coming back online.
     * Triggers immediate synchronization.
     */
    const handleOnline = async () => {
      await syncService.pushUpdates();
      await syncService.pullAll();
    };

    window.addEventListener("online", handleOnline);

    // Optimization: Use a listener pattern instead of polling for synchronization status.
    const unsubscribe = syncService.subscribe((status) => {
      setIsSyncing(status);
    });

    return () => {
      window.removeEventListener("online", handleOnline);
      unsubscribe();
    };
  }, []);

  // Configuration for main navigation items
  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/" },
    { text: "Teams", icon: <TeamsIcon />, path: "/teams" },
    { text: "Opponents", icon: <BasketballIcon />, path: "/opponents" },
    { text: "Players", icon: <PlayersIcon />, path: "/players" },
    { text: "Settings", icon: <SettingsIcon />, path: "/settings" },
  ];

  return (
    <>
      {isSyncing && (
        <Box
          role="status"
          aria-live="polite"
          aria-busy="true"
          aria-label="Synchronizing data with the server"
          sx={{
            position: "fixed",
            top: 80,
            right: 16,
            zIndex: tokens.semantic.elevation.zIndex.tooltip,
            display: "flex",
            alignItems: "center",
            gap: `${tokens.semantic.spacing.xs}px`,
            bgcolor: tokens.semantic.color.brand.primary.main,
            color: tokens.semantic.color.text.inverse,
            px: `${tokens.semantic.spacing.md}px`,
            py: `${tokens.semantic.spacing.xs}px`,
            borderRadius: `${tokens.semantic.shape.radius.full}px`,
            boxShadow: tokens.semantic.elevation.shadow.card,
            animation: "slideIn 0.3s ease-out, pulse 2s infinite",
            "@keyframes slideIn": {
              from: { transform: "translateX(100%)", opacity: 0 },
              to: { transform: "translateX(0)", opacity: 1 },
            },
          }}
        >
          <BasketballIcon className="spin" aria-hidden="true" />
          <Typography variant="caption" sx={{ fontWeight: "bold" }}>
            SYNCING DATA
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: `${tokens.semantic.spacing.appBarHeight}px`,
          bgcolor: tokens.semantic.color.background.overlay,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "none",
          zIndex: tokens.semantic.elevation.zIndex.fixed,
          display: "flex",
          alignItems: "center",
          px: isMobile ? 1.5 : 4,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            width: "100%",
            justifyContent: "space-between",
            maxWidth: "1400px",
            margin: "0 auto",
            position: "relative",
          }}
        >
          {/* Logo Section */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              minWidth: isMobile ? "40px" : "200px",
            }}
          >
            {!isMobile && (
              <Tooltip title="Back to Home Dashboard">
                <Typography
                  variant="h6"
                  noWrap
                  component={Link}
                  to="/"
                  sx={{
                    fontFamily: tokens.typography.fontFamily.accent,
                    color: tokens.semantic.color.brand.primary.dark,
                    fontWeight: tokens.typography.fontWeight.bold,
                    fontSize: tokens.typography.fontSize.lg,
                    letterSpacing: "0.02em",
                    textDecoration: "none",
                    "&:hover": {
                      opacity: 0.8,
                    },
                    "&:focus-visible": {
                      outline: `${tokens.semantic.focus.width} solid ${tokens.semantic.color.brand.primary.dark}`,
                      outlineOffset: tokens.semantic.focus.offset,
                      borderRadius: `${tokens.semantic.shape.radius.xs}px`,
                    },
                  }}
                >
                  CourtSight
                </Typography>
              </Tooltip>
            )}
          </Box>

          {/* Central Navigation Pill Container */}
          <Box
            component="nav"
            aria-label="Main Navigation Pill"
            sx={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              justifyContent: "center",
              zIndex: 1,
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                bgcolor: tokens.semantic.color.brand.primary.dark,
                borderRadius: `${tokens.semantic.shape.radius.full}px`,
                px: 0.75,
                py: 0.5,
                gap: 0.25,
                boxShadow: tokens.semantic.elevation.shadow.dialog,
                border: `1px solid ${tokens.semantic.color.border.subtle}`,
                width: isMobile ? "100%" : "auto",
                justifyContent: isMobile ? "space-between" : "center",
                maxWidth: isMobile ? "320px" : "none",
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
          </Box>

          {/* Spacer Section to maintain space for the absolute pill on desktop */}
          {!isMobile && (
            <Box
              sx={{
                width: "200px",
                display: "flex",
                justifyContent: "flex-end",
              }}
            />
          )}
        </Box>
      </Box>
    </>
  );
};

export default Navigation;

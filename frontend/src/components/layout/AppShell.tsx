import React from "react";
import { Box, useMediaQuery } from "@mui/material";

interface AppShellProps {
  /** Slot for the side navigation drawer (visible on desktop) */
  drawerSlot?: React.ReactNode;
  /** Slot for the top app bar */
  topBarSlot?: React.ReactNode;
  /** Slot for the bottom navigation (visible on mobile) */
  bottomSlot?: React.ReactNode;
  /** Primary content to render in the main scrollable area */
  children: React.ReactNode;
}

/**
 * Central layout tokens for the app shell.
 * Change these values in one place to update gutters app-wide.
 */
export const APP_SHELL_LAYOUT = {
  drawerWidth: 224,
  contentMaxWidth: "none",
  gutterX: {
    xs: 1,
    sm: 1.25,
    md: 1.25,
    lg: 1.5,
  },
  gutterY: {
    xs: 0.75,
    sm: 1,
    md: 1.5,
  },
} as const;

/**
 * AppShell — The core layout wrapper for CourtSight.
 * Desktop (>= 768px): left-pinned rail + right content column
 * Mobile (< 768px): top bar + content + bottom nav
 */
const AppShell: React.FC<AppShellProps> = ({
  drawerSlot,
  topBarSlot,
  bottomSlot,
  children,
}) => {
  const isDesktop = useMediaQuery("(min-width:768px)");

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: isDesktop
          ? `${APP_SHELL_LAYOUT.drawerWidth}px minmax(0, 1fr)`
          : "minmax(0, 1fr)",
        gridTemplateRows: "auto minmax(0, 1fr) auto",
        height: "100dvh",
        width: "100%",
        minWidth: 0,
        overflow: "hidden",
        bgcolor: "background.default",
      }}
    >
      {isDesktop && (
        <Box
          component="aside"
          sx={{
            gridColumn: "1 / 2",
            gridRow: "1 / 4",
            width: APP_SHELL_LAYOUT.drawerWidth,
            minWidth: APP_SHELL_LAYOUT.drawerWidth,
            maxWidth: APP_SHELL_LAYOUT.drawerWidth,
            borderRight: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            overflow: "hidden",
            justifySelf: "start",
            alignSelf: "stretch",
          }}
        >
          {drawerSlot}
        </Box>
      )}

      <Box
        sx={{
          gridColumn: isDesktop ? "2 / 3" : "1 / 2",
          gridRow: "1 / 2",
          minWidth: 0,
          zIndex: 1100,
        }}
      >
        {topBarSlot}
      </Box>

      <Box
        component="main"
        id="main-content"
        sx={{
          gridColumn: isDesktop ? "2 / 3" : "1 / 2",
          gridRow: "2 / 3",
          minWidth: 0,
          width: "100%",
          overflowY: "auto",
          overflowX: "hidden",
          px: APP_SHELL_LAYOUT.gutterX,
          py: APP_SHELL_LAYOUT.gutterY,
          position: "relative",
          outline: "none",
          WebkitOverflowScrolling: "touch",
        }}
        tabIndex={-1}
      >
        {children}
      </Box>

      {!isDesktop && (
        <Box
          sx={{
            gridColumn: "1 / 2",
            gridRow: "3 / 4",
            height: 56,
            borderTop: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            zIndex: 1100,
          }}
        >
          {bottomSlot}
        </Box>
      )}
    </Box>
  );
};

export default AppShell;

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
  contentMaxWidth: 1440,
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
 * Defines the responsive grid:
 * - Desktop (>= 768px): [Drawer] [TopBar + Main Content]
 * - Mobile (< 768px): [TopBar] [Main Content] [BottomNav (56px)]
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
          ? `${APP_SHELL_LAYOUT.drawerWidth}px 1fr`
          : "1fr",
        gridTemplateRows: "auto 1fr auto",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        bgcolor: "background.default",
        "--app-content-max-width": `${APP_SHELL_LAYOUT.contentMaxWidth}px`,
      }}
    >
      {/* Drawer Slot (Desktop Only) */}
      {isDesktop && (
        <Box
          sx={{
            gridColumn: "1 / 2",
            gridRow: "1 / 4",
            borderRight: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            overflow: "hidden",
            minWidth: 0,
          }}
        >
          {drawerSlot}
        </Box>
      )}

      {/* Top Bar Slot */}
      <Box
        sx={{
          gridColumn: isDesktop ? "2 / 3" : "1 / 2",
          gridRow: "1 / 2",
          position: "sticky",
          top: 0,
          zIndex: 1100,
          minWidth: 0,
        }}
      >
        {topBarSlot}
      </Box>

      {/* Main Content Area */}
      <Box
        component="main"
        id="main-content"
        sx={{
          gridColumn: isDesktop ? "2 / 3" : "1 / 2",
          gridRow: "2 / 3",
          overflowY: "auto",
          width: "100%",
          minWidth: 0,
          px: APP_SHELL_LAYOUT.gutterX,
          py: APP_SHELL_LAYOUT.gutterY,
          position: "relative",
          outline: "none",
          "--page-gutter-x-xs": `${APP_SHELL_LAYOUT.gutterX.xs * 8}px`,
          "--page-gutter-x-sm": `${APP_SHELL_LAYOUT.gutterX.sm * 8}px`,
          "--page-gutter-x-md": `${APP_SHELL_LAYOUT.gutterX.md * 8}px`,
          "--page-gutter-x-lg": `${APP_SHELL_LAYOUT.gutterX.lg * 8}px`,
          "--page-gutter-y-xs": `${APP_SHELL_LAYOUT.gutterY.xs * 8}px`,
          "--page-gutter-y-sm": `${APP_SHELL_LAYOUT.gutterY.sm * 8}px`,
          "--page-gutter-y-md": `${APP_SHELL_LAYOUT.gutterY.md * 8}px`,
        }}
        tabIndex={-1}
      >
        {children}
      </Box>

      {/* Bottom Slot (Mobile Only) */}
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

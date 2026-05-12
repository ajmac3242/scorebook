/**
 * @file AppShell.tsx
 * @description CourtSight App Shell — full-viewport layout wrapper.
 * Provides CSS-grid layout with a side drawer slot (tablet+) and bottom slot (mobile).
 * No nav content, icons, or route links are defined here (see DESIGN-003-B/C).
 */
import React from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";

interface AppShellProps {
  /** Rendered inside the main content area */
  children: React.ReactNode;
  /** Slot for the side navigation drawer (tablet+ only) */
  drawerSlot?: React.ReactNode;
  /** Slot for the top app bar */
  topBarSlot?: React.ReactNode;
  /** Slot for the bottom navigation (mobile only) */
  bottomNavSlot?: React.ReactNode;
}

/**
 * AppShell — full-viewport layout wrapper.
 *
 * Layout:
 *   ≥ 768px: [drawer 240px] | [top bar + main content]
 *   < 768px: [top bar + main content] / [bottom nav 56px]
 *
 * Children are rendered inside the main content area (scrollable).
 */
const AppShell: React.FC<AppShellProps> = ({
  children,
  drawerSlot,
  topBarSlot,
  bottomNavSlot,
}) => {
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.up("md")); // md = 768px in MUI default

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        height: "100dvh",
        width: "100%",
        overflow: "hidden",
        bgcolor: "background.default",
      }}
    >
      {/* Side drawer slot — 240px wide, tablet+ only */}
      {isTablet && drawerSlot && (
        <Box
          component="aside"
          sx={{
            width: 240,
            flexShrink: 0,
            height: "100%",
            overflow: "hidden",
          }}
        >
          {drawerSlot}
        </Box>
      )}

      {/* Right-hand column: top bar + main content + optional bottom nav */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        {/* Top app bar slot */}
        {topBarSlot}

        {/* Main scrollable content area */}
        <Box
          component="main"
          sx={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {children}
        </Box>

        {/* Bottom navigation slot — 56px tall, mobile only */}
        {!isTablet && bottomNavSlot && (
          <Box
            sx={{
              height: 56,
              flexShrink: 0,
            }}
          >
            {bottomNavSlot}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default AppShell;

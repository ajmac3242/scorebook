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
 * AppShell — The core layout wrapper for CourtSight.
 * Defines the responsive grid:
 * - Desktop (>= 768px): [Drawer (240px)] [TopBar + Main Content]
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
        gridTemplateColumns: isDesktop ? "240px 1fr" : "1fr",
        gridTemplateRows: "auto 1fr auto",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        bgcolor: "background.default",
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
          p: { xs: 1, sm: 3 },
          position: "relative",
          outline: "none",
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

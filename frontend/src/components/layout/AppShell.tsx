import React from "react";
import { Box, useMediaQuery } from "@mui/material";

interface AppShellProps {
  drawerSlot?: React.ReactNode;
  topBarSlot?: React.ReactNode;
  bottomSlot?: React.ReactNode;
  children: React.ReactNode;
}

export const APP_SHELL_LAYOUT = {
  drawerWidth: 240,
  gutterX: {
    xs: 1,
    sm: 1.25,
    md: 1.5,
    lg: 2,
  },
  gutterY: {
    xs: 0.75,
    sm: 1,
    md: 1,
  },
} as const;

const AppShell: React.FC<AppShellProps> = ({
  drawerSlot,
  topBarSlot,
  bottomSlot,
  children,
}) => {
  const isDesktop = useMediaQuery("(min-width:768px)");

  if (!isDesktop) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100dvh",
          width: "100%",
          minWidth: 0,
          overflow: "hidden",
          bgcolor: "background.default",
        }}
      >
        {topBarSlot ? (
          <Box sx={{ flexShrink: 0, minWidth: 0, zIndex: 1100 }}>
            {topBarSlot}
          </Box>
        ) : null}

        <Box
          component="main"
          id="main-content"
          sx={{
            flex: 1,
            minHeight: 0,
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

        {bottomSlot ? (
          <Box
            sx={{
              flexShrink: 0,
              height: 56,
              borderTop: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              zIndex: 1100,
            }}
          >
            {bottomSlot}
          </Box>
        ) : null}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        height: "100dvh",
        width: "100%",
        minWidth: 0,
        overflow: "hidden",
        bgcolor: "background.default",
      }}
    >
      <Box
        component="aside"
        sx={{
          width: APP_SHELL_LAYOUT.drawerWidth,
          minWidth: APP_SHELL_LAYOUT.drawerWidth,
          maxWidth: APP_SHELL_LAYOUT.drawerWidth,
          height: "100%",
          flexShrink: 0,
          borderRight: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          overflow: "hidden",
        }}
      >
        {drawerSlot}
      </Box>

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          bgcolor: "background.default",
        }}
      >
        {topBarSlot ? (
          <Box sx={{ flexShrink: 0, minWidth: 0, zIndex: 1100 }}>
            {topBarSlot}
          </Box>
        ) : null}

        <Box
          component="main"
          id="main-content"
          sx={{
            flex: 1,
            minHeight: 0,
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
      </Box>
    </Box>
  );
};

export default AppShell;

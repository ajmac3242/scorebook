import React from "react";
import { Box, useMediaQuery } from "@mui/material";

interface AppShellProps {
  drawerSlot?: React.ReactNode;
  topBarSlot?: React.ReactNode;
  bottomSlot?: React.ReactNode;
  children: React.ReactNode;
}

export const APP_SHELL_LAYOUT = {
  drawerWidth: 260,
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
          bgcolor: "var(--cs-semantic-color-background-default)",
        }}
      >
        {topBarSlot ? (
          <Box
            sx={{
              flexShrink: 0,
              minWidth: 0,
              zIndex: "var(--cs-semantic-elevation-zIndex-appBar)",
            }}
          >
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
            bgcolor: "var(--cs-semantic-color-background-default)",
            position: "relative",
            outline: "none",
            WebkitOverflowScrolling: "touch",
            display: "flex",
            flexDirection: "column",
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
              borderTop: "1px solid var(--cs-semantic-color-border-subtle)",
              bgcolor: "var(--cs-semantic-color-background-paper)",
              zIndex: "var(--cs-semantic-elevation-zIndex-appBar)",
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
        height: "100dvh",
        width: "100%",
        overflow: "hidden",
        bgcolor: "var(--cs-semantic-color-background-default)",
        p: "var(--cs-semantic-spacing-md)",
        boxSizing: "border-box",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          gap: "var(--cs-semantic-spacing-md)",
          height: "100%",
          width: "100%",
          minWidth: 0,
          overflow: "hidden",
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
            bgcolor: "var(--cs-semantic-color-background-paper)",
            overflow: "hidden",
            borderRadius: "var(--cs-semantic-shape-radius-lg)",
            border: "1px solid var(--cs-semantic-color-border-subtle)",
            boxShadow: "var(--cs-semantic-elevation-shadow-card)",
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
            borderRadius: "var(--cs-semantic-shape-radius-lg)",
            border: "1px solid var(--cs-semantic-color-border-subtle)",
            bgcolor: "var(--cs-semantic-color-background-paper)",
            boxShadow: "var(--cs-semantic-elevation-shadow-card)",
          }}
        >
          {topBarSlot ? (
            <Box
              sx={{
                flexShrink: 0,
                minWidth: 0,
                zIndex: "var(--cs-semantic-elevation-zIndex-appBar)",
              }}
            >
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
              position: "relative",
              outline: "none",
              WebkitOverflowScrolling: "touch",
              display: "flex",
              flexDirection: "column",
            }}
            tabIndex={-1}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default AppShell;

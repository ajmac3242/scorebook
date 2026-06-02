import React from "react";
import { Box, Paper, useMediaQuery, useTheme } from "@mui/material";
import SideNav from "./SideNav";
import { useTokens } from "../../theme/useTokens";

interface AppShellProps {
  children: React.ReactNode;
  drawerSlot?: React.ReactNode;
  topBarSlot?: React.ReactNode;
  /** @deprecated No longer used — bottom nav has been removed in favour of the rail/drawer nav model. */
  bottomSlot?: React.ReactNode;
  onMenuOpen?: () => void;
}

const AppShell: React.FC<AppShellProps> = ({
  children,
  drawerSlot,
  topBarSlot,
}) => {
  const theme = useTheme();
  const tokens = useTokens();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const appFrame = tokens.layout.appFrame;
  const pageSurface = tokens.layout.pageSurface;

  const gutter = appFrame.gutter ?? 16;
  const desktopGutter = Math.max(8, Math.round(gutter / 2));
  const mobileGutter = gutter;

  const shellBackground =
    appFrame.background ?? "var(--cs-semantic-color-background-default)";
  const workspaceBackground =
    pageSurface?.background ?? "var(--cs-semantic-color-background-paper)";

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        bgcolor: shellBackground,
        display: "flex",
        alignItems: "stretch",
      }}
    >
      {/*
       * Rail / Drawer navigation — always rendered on all breakpoints.
       * SideNav internally handles:
       *   - desktop (≥768px): permanent drawer (full sidebar or collapsible rail)
       *   - mobile (<768px):  temporary drawer triggered via mobileOpen prop
       */}
      {drawerSlot ?? <SideNav />}

      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: appFrame.contentMinWidth ?? 0,
          display: "flex",
          flexDirection: "column",
          bgcolor: shellBackground,
          pt: { xs: `${mobileGutter}px`, md: `${desktopGutter}px` },
          pr: { xs: `${mobileGutter}px`, md: `${desktopGutter}px` },
          pb: { xs: `${mobileGutter}px`, md: `${desktopGutter}px` },
          pl: { xs: `${mobileGutter}px`, md: 0 },
          gap: topBarSlot ? { xs: 1.5, md: 1 } : 0,
        }}
      >
        {topBarSlot}

        <Paper
          elevation={0}
          sx={{
            flex: 1,
            width: "100%",
            maxWidth: "none",
            mx: 0,
            borderRadius: {
              xs: 0,
              md: `${pageSurface?.radius ?? 20}px`,
            },
            bgcolor: workspaceBackground,
            border: pageSurface?.border ?? "none",
            borderColor:
              pageSurface?.border && pageSurface.border !== "none"
                ? undefined
                : "transparent",
            boxShadow: pageSurface?.shadow ?? "none",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          {children}
        </Paper>
      </Box>
    </Box>
  );
};

export default AppShell;

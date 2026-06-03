import React from "react";
import { Box, Paper } from "@mui/material";
import SideNav from "./SideNav";
import { useTokens } from "../../theme/useTokens";

interface AppShellProps {
  children: React.ReactNode;
  drawerSlot?: React.ReactNode;
  topBarSlot?: React.ReactNode;
  /** @deprecated BottomNav removed — rail/drawer model replaces bottom navigation. */
  bottomSlot?: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({
  children,
  drawerSlot,
  topBarSlot,
}) => {
  const tokens = useTokens();
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
        height: "100dvh",
        overflow: "hidden",
        bgcolor: shellBackground,
        display: "flex",
        alignItems: "stretch",
      }}
    >
      {/*
       * SideNav handles all three breakpoints internally:
       *   ≥1024px — permanent sidebar (collapsible to icon rail)
       *   768–1023px — permanent icon rail + temporary overlay drawer
       *   <768px — temporary drawer only (triggered via mobileOpen prop)
       */}
      {drawerSlot ?? <SideNav />}

      <Box
        component="main"
        id="main-content"
        sx={{
          flex: 1,
          minWidth: appFrame.contentMinWidth ?? 0,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          bgcolor: shellBackground,
          // On mobile, topBarSlot provides the top boundary; pt collapses so
          // the top bar sits flush above the Paper with no gap.
          pt: topBarSlot
            ? 0
            : { xs: `${mobileGutter}px`, md: `${desktopGutter}px` },
          pr: { xs: `${mobileGutter}px`, md: `${desktopGutter}px` },
          pb: { xs: `${mobileGutter}px`, md: `${desktopGutter}px` },
          pl: { xs: `${mobileGutter}px`, md: 0 },
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
            borderRadius: (() => {
              const r = pageSurface?.radius ?? 20;
              return {
                xs: `${Math.round(r * 0.6)}px`,
                sm: `${Math.round(r * 0.8)}px`,
                md: `${r}px`,
              };
            })(),
            bgcolor: workspaceBackground,
            border: pageSurface?.border ?? "none",
            borderColor:
              pageSurface?.border && pageSurface.border !== "none"
                ? undefined
                : "transparent",
            boxShadow: pageSurface?.shadow ?? "none",
            overflow: "auto",
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

import React, { useState, useEffect } from "react";
import { Box, Paper, useMediaQuery, useTheme, IconButton } from "@mui/material";
import { Menu as MenuIcon } from "@mui/icons-material";
import SideNav from "./SideNav";
import AppTopBar from "./AppTopBar";
import { useTokens } from "../../theme/useTokens";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db";

interface AppShellProps {
  children: React.ReactNode;
  drawerSlot?: React.ReactNode;
  topBarSlot?: React.ReactNode;
  bottomSlot?: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({
  children,
  drawerSlot,
}) => {
  const theme = useTheme();
  const tokens = useTokens();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isTablet = useMediaQuery(theme.breakpoints.between("md", "lg"));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(isTablet);

  // Sync collapsed state with tablet breakpoint by default
  useEffect(() => {
    if (isTablet) {
      setCollapsed(true);
    } else if (!isMobile) {
      setCollapsed(false);
    }
  }, [isTablet, isMobile]);

  const liveGame = useLiveQuery(
    () => db.games.where("completed").equals(0).first(),
    [],
  );

  const appFrame = tokens.layout.appFrame;
  const pageSurface = tokens.layout.pageSurface;

  const gutter = appFrame.gutter ?? 16;
  const desktopGutter = Math.max(8, Math.round(gutter / 2));
  const mobileGutter = gutter;

  const shellBackground =
    appFrame.background ?? "var(--cs-semantic-color-background-default)";
  const workspaceBackground =
    pageSurface?.background ?? "var(--cs-semantic-color-background-paper)";

  const sideNav = drawerSlot ?? (
    <SideNav
      mobileOpen={isMobile ? mobileOpen : undefined}
      onMobileClose={() => setMobileOpen(false)}
      isLive={!!liveGame}
      collapsed={!isMobile && collapsed}
    />
  );

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        bgcolor: shellBackground,
        display: "flex",
        alignItems: "stretch",
      }}
    >
      {!isMobile && sideNav}

      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          bgcolor: shellBackground,
          pt: { xs: `${mobileGutter}px`, md: `${desktopGutter}px` },
          pr: { xs: `${mobileGutter}px`, md: `${desktopGutter}px` },
          pb: { xs: `${mobileGutter}px`, md: `${desktopGutter}px` },
          pl: { xs: `${mobileGutter}px`, md: 0 },
          gap: 1,
          position: "relative",
        }}
      >
        {/* Universal Top Bar with Menu Toggle */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 0.5,
            px: isMobile ? 0 : 1,
          }}
        >
          <IconButton
            color="inherit"
            aria-label={isMobile ? "open drawer" : "toggle sidebar"}
            edge="start"
            onClick={() => (isMobile ? setMobileOpen(true) : setCollapsed(!collapsed))}
            sx={{
              color: "var(--cs-semantic-color-text-primary)",
              bgcolor: "var(--cs-semantic-color-background-paper)",
              border: "1px solid var(--cs-semantic-color-border-subtle)",
              borderRadius: "var(--cs-semantic-shape-radius-md)",
              flexShrink: 0,
              "&:hover": {
                bgcolor: "var(--cs-semantic-color-action-hover)",
              },
            }}
          >
            <MenuIcon />
          </IconButton>
          <AppTopBar isLive={!!liveGame} />
        </Box>

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

      {/* Mobile Drawer */}
      {isMobile && sideNav}
    </Box>
  );
};

export default AppShell;

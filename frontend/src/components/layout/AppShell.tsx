import React from "react";
import { Box, Paper, useMediaQuery, useTheme } from "@mui/material";
import SideNav from "./SideNav";
import BottomNav from "./BottomNav";
import { useTokens } from "../../theme/useTokens";

interface AppShellProps {
  children: React.ReactNode;
  drawerSlot?: React.ReactNode;
  topBarSlot?: React.ReactNode;
  bottomSlot?: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({
  children,
  drawerSlot,
  topBarSlot,
  bottomSlot,
}) => {
  const theme = useTheme();
  const tokens = useTokens();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const appFrame = tokens.layout.appFrame;
  const pageSurface = tokens.layout.pageSurface;

  const gutter = appFrame.gutter ?? 16;
  const desktopGutter = Math.max(8, Math.round(gutter / 2));
  const mobileGutter = gutter;
  const mobileBottomNavOffset = 72;

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
      {!isMobile && (drawerSlot ?? <SideNav />)}

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
          pb: {
            xs: `calc(${mobileGutter}px + ${mobileBottomNavOffset}px)`,
            md: `${desktopGutter}px`,
          },
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
            borderRadius: `${pageSurface?.radius ?? 20}px`,
            bgcolor: workspaceBackground,
            border: pageSurface?.border ?? "1px solid",
            borderColor:
              pageSurface?.border === undefined ? "divider" : undefined,
            boxShadow: pageSurface?.shadow ?? "none",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          {children}
        </Paper>

        {bottomSlot}
      </Box>

      {isMobile ? (
        <Box
          sx={{
            display: { xs: "block", md: "none" },
          }}
        >
          <BottomNav />
        </Box>
      ) : null}
    </Box>
  );
};

export default AppShell;
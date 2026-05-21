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

  const desktopGutter =
    appFrame?.desktopGutter ?? "var(--cs-semantic-spacing-xs)";
  const mobileGutter =
    appFrame?.mobileGutter ?? "var(--cs-semantic-spacing-sm)";
  const mobileBottomNavOffset =
    appFrame?.mobileBottomNavOffset ?? "72px";

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        bgcolor: appFrame?.background ?? "background.default",
        display: "flex",
        alignItems: "stretch",
      }}
    >
      {!isMobile && (drawerSlot ?? <SideNav />)}

      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: appFrame?.contentMinWidth ?? 0,
          display: "flex",
          flexDirection: "column",
          pt: { xs: mobileGutter, md: desktopGutter },
          pr: { xs: mobileGutter, md: desktopGutter },
          pb: {
            xs: `calc(${mobileGutter} + ${mobileBottomNavOffset})`,
            md: desktopGutter,
          },
          pl: { xs: mobileGutter, md: 0 },
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
              xs: `${pageSurface?.radius ?? 20}px`,
              md: `0 ${pageSurface?.radius ?? 20}px ${pageSurface?.radius ?? 20}px 0`,
            },
            bgcolor: pageSurface?.background ?? "background.paper",
            border: pageSurface?.border ?? "1px solid",
            borderColor:
              pageSurface?.border === undefined ? "divider" : undefined,
            borderLeft: {
              xs: pageSurface?.border ?? "1px solid",
              md: "none",
            },
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

      {isMobile && (
        <Box
          sx={{
            display: { xs: "block", md: "none" },
          }}
        >
          <BottomNav />
        </Box>
      )}
    </Box>
  );
};

export default AppShell;
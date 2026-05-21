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
  const gutter = "var(--cs-semantic-spacing-lg)";

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        bgcolor: appFrame?.background ?? "background.default",
        display: "flex",
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
          p: gutter,
          pb: {
            xs: `calc(${gutter} + 72px)`,
            md: gutter,
          },
        }}
      >
        {topBarSlot}

        <Paper
          elevation={0}
          sx={{
            flex: 1,
            width: "100%",
            maxWidth: pageSurface?.maxWidth ?? 1280,
            mx: "auto",
            borderRadius: `${pageSurface?.radius ?? 20}px`,
            bgcolor: pageSurface?.background ?? "background.paper",
            border: pageSurface?.border ?? "1px solid",
            borderColor:
              pageSurface?.border === undefined ? "divider" : undefined,
            boxShadow: pageSurface?.shadow ?? "none",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {children}
        </Paper>

        {bottomSlot}
      </Box>

      {isMobile && <BottomNav />}
    </Box>
  );
};

export default AppShell;
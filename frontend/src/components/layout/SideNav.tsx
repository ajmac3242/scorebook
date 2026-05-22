import React from "react";
import {
  Avatar,
  Box,
  ButtonBase,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  Assessment as ReportsIcon,
  Dashboard as DashboardIcon,
  FlashOn as LiveIcon,
  Groups as TeamsIcon,
  People as PlayersIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  SportsBasketball as GamesIcon,
} from "@mui/icons-material";
import { NavLink, useLocation } from "react-router-dom";
import CourtSightLogo from "../CourtSightLogo";
import { useTokens } from "../../theme/useTokens";

interface SideNavProps {
  isLive?: boolean;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  coachName?: string;
  onSearchOpen?: () => void;
}

const NAV_ITEMS = [
  { label: "Dashboard", path: "/", icon: <DashboardIcon /> },
  { label: "Games", path: "/games", icon: <GamesIcon /> },
  { label: "Live", path: "/game", icon: <LiveIcon />, isLiveTrigger: true },
  { label: "Opponents", path: "/opponents", icon: <GamesIcon /> },
  { label: "Players", path: "/players", icon: <PlayersIcon /> },
  { label: "Teams", path: "/teams", icon: <TeamsIcon /> },
  { label: "Reports", path: "/reports", icon: <ReportsIcon /> },
];

const isRouteActive = (pathname: string, path: string) => {
  if (path === "/") return pathname === "/";
  return pathname === path || pathname.startsWith(`${path}/`);
};

const SideNav: React.FC<SideNavProps> = ({
  isLive = false,
  mobileOpen = false,
  onMobileClose,
  coachName = "Coach",
  onSearchOpen,
}) => {
  const isDesktop = useMediaQuery("(min-width:768px)");
  const location = useLocation();
  const tokens = useTokens();

  const drawerWidth = tokens.layout.appFrame.sidebarWidth ?? 220;
  const shellBackground = tokens.layout.appFrame.background;
  const isSettingsActive = isRouteActive(location.pathname, "/settings");

  const navButtonSx = (isActive: boolean) => ({
    minHeight: 50,
    px: 1.75,
    borderRadius: "12px",
    justifyContent: "flex-start",
    bgcolor: isActive
      ? "var(--cs-semantic-color-action-selected)"
      : "transparent",
    color: isActive
      ? "var(--cs-semantic-color-text-primary)"
      : "var(--cs-semantic-color-text-secondary)",
    transition:
      "background-color var(--cs-motion-duration-normal) var(--cs-motion-easing-productive), color var(--cs-motion-duration-normal) var(--cs-motion-easing-productive), box-shadow var(--cs-motion-duration-normal) var(--cs-motion-easing-productive)",
    "&:hover": {
      bgcolor: isActive
        ? "var(--cs-semantic-color-action-selected)"
        : "var(--cs-semantic-color-action-hover)",
      color: "var(--cs-semantic-color-text-primary)",
    },
    "& .MuiListItemIcon-root": {
      color: "inherit",
      minWidth: 38,
    },
    "& .MuiListItemText-primary": {
      fontWeight: isActive ? 600 : 500,
      fontSize: "1rem",
      lineHeight: 1.2,
      letterSpacing: 0,
    },
    "&:focus-visible": {
      outline:
        "var(--cs-semantic-focus-width) solid var(--cs-semantic-color-action-focusRing)",
      outlineOffset: "var(--cs-semantic-focus-offset)",
    },
  });

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: shellBackground,
      }}
    >
      <Box
        sx={{
          px: 3,
          pt: 3,
          pb: 1.75,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
        }}
      >
        <CourtSightLogo width={156} />
      </Box>

      <Box sx={{ px: 2, pb: 2.5 }}>
        <ButtonBase
          onClick={onSearchOpen}
          aria-label="Open search"
          sx={{
            width: "100%",
            height: 44,
            px: 1.75,
            borderRadius: "10px",
            border: "1px solid var(--cs-semantic-color-border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: 1.25,
            color: "var(--cs-semantic-color-text-secondary)",
            bgcolor:
              tokens.semantic.color.background?.paper ??
              "var(--cs-semantic-color-background-paper)",
            boxShadow: `inset 0 1px 0 ${alpha("#ffffff", 0.02)}`,
            transition:
              "background-color var(--cs-motion-duration-normal) var(--cs-motion-easing-productive), border-color var(--cs-motion-duration-normal) var(--cs-motion-easing-productive), color var(--cs-motion-duration-normal) var(--cs-motion-easing-productive)",
            "&:hover": {
              borderColor: "var(--cs-semantic-color-border-default)",
              bgcolor: alpha("#ffffff", 0.02),
              color: "var(--cs-semantic-color-text-primary)",
            },
          }}
        >
          <SearchIcon sx={{ fontSize: 18 }} />
          <Typography
            sx={{
              fontSize: "0.9375rem",
              fontWeight: 500,
              color: "inherit",
            }}
          >
            Search
          </Typography>
        </ButtonBase>
      </Box>

      <List sx={{ flexGrow: 1, px: 1.25, py: 0.5 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = isRouteActive(location.pathname, item.path);

          return (
            <ListItem key={item.label} disablePadding sx={{ mb: 0.75 }}>
              <ListItemButton
                component={NavLink}
                to={item.path}
                onClick={onMobileClose}
                sx={navButtonSx(isActive)}
              >
                <ListItemIcon>
                  <Box sx={{ position: "relative", display: "flex" }}>
                    {item.icon}
                    {item.isLiveTrigger && isLive && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: -2,
                          right: -2,
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          bgcolor: "warning.main",
                          border: "2px solid",
                          borderColor: shellBackground,
                        }}
                      />
                    )}
                  </Box>
                </ListItemIcon>

                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ px: 1.25, pb: 1.5, pt: 2.25, mt: "auto" }}>
        <ListItem disablePadding sx={{ mb: 1.25 }}>
          <ListItemButton
            component={NavLink}
            to="/settings"
            onClick={onMobileClose}
            sx={{
              ...navButtonSx(isSettingsActive),
              minHeight: 52,
              bgcolor: isSettingsActive
                ? alpha("#12B5CB", 0.12)
                : alpha("#ffffff", 0.01),
              boxShadow: isSettingsActive
                ? `inset 0 0 0 1px ${alpha("#12B5CB", 0.18)}`
                : "none",
              "&:hover": {
                bgcolor: isSettingsActive
                  ? alpha("#12B5CB", 0.16)
                  : "var(--cs-semantic-color-action-hover)",
                color: "var(--cs-semantic-color-text-primary)",
              },
            }}
          >
            <ListItemIcon sx={{ position: "relative", display: "flex" }}>
              <SettingsIcon sx={{ fontSize: 18 }} />
            </ListItemIcon>

            <ListItemText primary="Settings" />
          </ListItemButton>
        </ListItem>

        <Box
          sx={{
            px: 0.25,
            mb: 1.25,
          }}
        >
          <Box
            sx={{
              width: "100%",
              height: 1,
              bgcolor: "var(--cs-semantic-color-border-subtle)",
              opacity: 0.55,
            }}
          />
        </Box>

        <Box
          sx={{
            px: 1.5,
            py: 1.375,
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            borderRadius: "12px",
            color: "var(--cs-semantic-color-text-primary)",
            bgcolor: alpha("#ffffff", 0.015),
            transition:
              "background-color var(--cs-motion-duration-normal) var(--cs-motion-easing-productive)",
            "&:hover": {
              bgcolor: "var(--cs-semantic-color-action-hover)",
            },
          }}
        >
          <Avatar
            sx={{
              width: 34,
              height: 34,
              bgcolor: "var(--cs-semantic-color-brand-primary-main)",
              fontSize: "0.875rem",
              fontWeight: 700,
              boxShadow: `0 2px 8px ${alpha("#000", 0.16)}`,
            }}
          >
            {coachName[0]}
          </Avatar>

          <Box sx={{ ml: 1.5, minWidth: 0 }}>
            <Typography
              variant="subtitle2"
              sx={{
                color: "var(--cs-semantic-color-text-primary)",
                fontWeight: 600,
                lineHeight: 1.2,
              }}
              noWrap
            >
              {coachName}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  if (!isDesktop) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
            left: 0,
            bgcolor: shellBackground,
            borderRight: "none",
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          bgcolor: shellBackground,
          borderRight: "none",
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default SideNav;
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
  Tooltip,
  Typography,
  IconButton,
  useTheme,
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
  collapsed?: boolean;
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
  collapsed = false,
}) => {
  const theme = useTheme();
  const location = useLocation();
  const tokens = useTokens();

  const drawerWidth = tokens.layout.appFrame.sidebarWidth ?? 236;
  const railWidth = 72;
  const currentWidth = collapsed ? railWidth : drawerWidth;

  const shellBackground = tokens.layout.appFrame.background;
  const isSettingsActive = isRouteActive(location.pathname, "/settings");

  const navButtonSx = (isActive: boolean) => ({
    minHeight: 50,
    px: collapsed ? 0 : 1.75,
    borderRadius: "12px",
    justifyContent: collapsed ? "center" : "flex-start",
    bgcolor: isActive
      ? "var(--cs-semantic-color-action-selected)"
      : "transparent",
    color: isActive
      ? "var(--cs-semantic-color-text-primary)"
      : "var(--cs-semantic-color-text-secondary)",
    transition:
      "all var(--cs-motion-duration-normal) var(--cs-motion-easing-productive)",
    "&:hover": {
      bgcolor: isActive
        ? "var(--cs-semantic-color-action-selected)"
        : "var(--cs-semantic-color-action-hover)",
      color: "var(--cs-semantic-color-text-primary)",
    },
    "& .MuiListItemIcon-root": {
      color: "inherit",
      minWidth: collapsed ? 0 : 38,
      justifyContent: "center",
    },
    "& .MuiListItemText-primary": {
      fontWeight: isActive ? 600 : 500,
      fontSize: "0.9375rem",
      lineHeight: 1.2,
      letterSpacing: 0,
      display: collapsed ? "none" : "block",
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
        overflowX: "hidden",
        width: "100%",
      }}
    >
      <Box
        sx={{
          px: collapsed ? 1.5 : 3,
          pt: 3,
          pb: 1.75,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
        }}
      >
        <CourtSightLogo width={collapsed ? 32 : 156} showText={!collapsed} />
      </Box>

      <Box sx={{ px: collapsed ? 1.5 : 2, pb: 2.5 }}>
        {collapsed ? (
          <Tooltip title="Search" placement="right">
            <IconButton
              onClick={onSearchOpen}
              sx={{
                width: 44,
                height: 44,
                borderRadius: "10px",
                border: "1px solid var(--cs-semantic-color-border-subtle)",
                color: "var(--cs-semantic-color-text-secondary)",
                bgcolor: "var(--cs-semantic-color-background-paper)",
                "&:hover": {
                  borderColor: "var(--cs-semantic-color-border-default)",
                  bgcolor: alpha("#ffffff", 0.02),
                  color: "var(--cs-semantic-color-text-primary)",
                },
              }}
            >
              <SearchIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        ) : (
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
              bgcolor: "var(--cs-semantic-color-background-paper)",
              boxShadow: `inset 0 1px 0 ${alpha("#ffffff", 0.02)}`,
              transition: "all var(--cs-motion-duration-normal) var(--cs-motion-easing-productive)",
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
        )}
      </Box>

      <List sx={{ flexGrow: 1, px: collapsed ? 1 : 1.25, py: 0.5 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = isRouteActive(location.pathname, item.path);
          const itemButton = (
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

              {!collapsed && <ListItemText primary={item.label} />}
            </ListItemButton>
          );

          return (
            <ListItem key={item.label} disablePadding sx={{ mb: 0.75 }}>
              {collapsed ? (
                <Tooltip title={item.label} placement="right">
                  {itemButton}
                </Tooltip>
              ) : (
                itemButton
              )}
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ px: collapsed ? 1 : 1.25, pb: 1.5, pt: 2.25, mt: "auto" }}>
        <ListItem disablePadding sx={{ mb: 1.25 }}>
          {collapsed ? (
            <Tooltip title="Settings" placement="right">
              <ListItemButton
                component={NavLink}
                to="/settings"
                onClick={onMobileClose}
                sx={{
                  ...navButtonSx(isSettingsActive),
                  minHeight: 52,
                }}
              >
                <ListItemIcon>
                  <SettingsIcon sx={{ fontSize: 20 }} />
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
          ) : (
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
              <ListItemIcon>
                <SettingsIcon sx={{ fontSize: 18 }} />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </ListItemButton>
          )}
        </ListItem>

        <Box sx={{ px: 0.25, mb: 1.25 }}>
          <Box
            sx={{
              width: "100%",
              height: 1,
              bgcolor: "var(--cs-semantic-color-border-subtle)",
              opacity: 0.55,
            }}
          />
        </Box>

        {collapsed ? (
          <Tooltip title={coachName} placement="right">
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                py: 1,
              }}
            >
              <Avatar
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: "var(--cs-semantic-color-brand-primary-main)",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {coachName[0]}
              </Avatar>
            </Box>
          </Tooltip>
        ) : (
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
              transition: "all var(--cs-motion-duration-normal) var(--cs-motion-easing-productive)",
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
        )}
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={mobileOpen !== undefined ? "temporary" : "permanent"}
      open={mobileOpen}
      onClose={onMobileClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        width: currentWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: currentWidth,
          boxSizing: "border-box",
          bgcolor: shellBackground,
          borderRight: "1px solid var(--cs-semantic-color-border-subtle)",
          transition: "width var(--cs-motion-duration-normal) var(--cs-motion-easing-productive)",
          overflowX: "hidden",
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default SideNav;

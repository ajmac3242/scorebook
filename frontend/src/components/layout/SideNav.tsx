import React from "react";
import {
  Avatar,
  Box,
  ButtonBase,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  Assessment as ReportsIcon,
  ChevronLeft as CollapseIcon,
  ChevronRight as ExpandIcon,
  Dashboard as DashboardIcon,
  FlashOn as LiveIcon,
  Groups as TeamsIcon,
  People as PlayersIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  SportsBasketball as GamesIcon,
  SportsSoccer as OpponentsIcon,
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
  { label: "Opponents", path: "/opponents", icon: <OpponentsIcon /> },
  { label: "Players", path: "/players", icon: <PlayersIcon /> },
  { label: "Teams", path: "/teams", icon: <TeamsIcon /> },
  { label: "Reports", path: "/reports", icon: <ReportsIcon /> },
];

/** Widths */
const DRAWER_WIDTH = 220;
const RAIL_WIDTH = 64;

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
  const isDesktop = useMediaQuery("(min-width:1024px)");
  const isTablet = useMediaQuery("(min-width:768px) and (max-width:1023px)");
  const isMobile = useMediaQuery("(max-width:767px)");
  const location = useLocation();
  const tokens = useTokens();

  /**
   * Rail/collapsed state:
   *   - Desktop: starts expanded, user can collapse to rail
   *   - Tablet (iPad): starts collapsed (rail), user can expand via drawer
   *   - Mobile: no persistent nav; uses temporary drawer via mobileOpen prop
   */
  const [collapsed, setCollapsed] = React.useState<boolean>(!isDesktop);

  // Sync collapsed state when breakpoint changes
  React.useEffect(() => {
    if (isDesktop) {
      // Desktop: keep whatever user chose, default to expanded on first mount
      // We don't force-expand here so user preference persists within session
    } else if (isTablet) {
      setCollapsed(true);
    }
  }, [isDesktop, isTablet]);

  const shellBackground = tokens.layout.appFrame.background;
  const isSettingsActive = isRouteActive(location.pathname, "/settings");

  // ─── Shared button style ──────────────────────────────────────────────────
  const navButtonSx = (isActive: boolean, railMode: boolean) => ({
    minHeight: 44,
    px: railMode ? 0 : 1.75,
    borderRadius: "10px",
    justifyContent: railMode ? "center" : "flex-start",
    bgcolor: isActive
      ? "var(--cs-semantic-color-action-selected)"
      : "transparent",
    color: isActive
      ? "var(--cs-semantic-color-text-primary)"
      : "var(--cs-semantic-color-text-secondary)",
    transition:
      "background-color var(--cs-motion-duration-normal) var(--cs-motion-easing-productive), color var(--cs-motion-duration-normal) var(--cs-motion-easing-productive)",
    "&:hover": {
      bgcolor: isActive
        ? "var(--cs-semantic-color-action-selected)"
        : "var(--cs-semantic-color-action-hover)",
      color: "var(--cs-semantic-color-text-primary)",
    },
    "& .MuiListItemIcon-root": {
      color: "inherit",
      minWidth: railMode ? "unset" : 38,
    },
    "& .MuiListItemText-primary": {
      fontWeight: isActive ? 600 : 500,
      fontSize: "0.9375rem",
      lineHeight: 1.2,
    },
    "&:focus-visible": {
      outline:
        "var(--cs-semantic-focus-width) solid var(--cs-semantic-color-action-focusRing)",
      outlineOffset: "var(--cs-semantic-focus-offset)",
    },
  });

  // ─── Drawer content (full expanded view) ─────────────────────────────────
  const fullDrawerContent = (onClose?: () => void) => (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: shellBackground,
      }}
    >
      {/* Logo + collapse button */}
      <Box
        sx={{
          px: 3,
          pt: 3,
          pb: 1.75,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <CourtSightLogo width={148} />
        {!isMobile && (
          <Tooltip title="Collapse" placement="right">
            <IconButton
              size="small"
              onClick={() => setCollapsed(true)}
              aria-label="Collapse navigation"
              sx={{ color: "var(--cs-semantic-color-text-secondary)" }}
            >
              <CollapseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Search */}
      <Box sx={{ px: 2, pb: 2.5 }}>
        <ButtonBase
          onClick={() => {
            onSearchOpen?.();
            onClose?.();
          }}
          aria-label="Open search"
          sx={{
            width: "100%",
            height: 40,
            px: 1.75,
            borderRadius: "10px",
            border: "1px solid var(--cs-semantic-color-border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: 1.25,
            color: "var(--cs-semantic-color-text-secondary)",
            bgcolor: "var(--cs-semantic-color-background-paper)",
            transition:
              "background-color var(--cs-motion-duration-normal) var(--cs-motion-easing-productive), border-color var(--cs-motion-duration-normal) var(--cs-motion-easing-productive)",
            "&:hover": {
              borderColor: "var(--cs-semantic-color-border-default)",
              color: "var(--cs-semantic-color-text-primary)",
            },
          }}
        >
          <SearchIcon sx={{ fontSize: 17 }} />
          <Typography sx={{ fontSize: "0.875rem", fontWeight: 500, color: "inherit" }}>
            Search
          </Typography>
        </ButtonBase>
      </Box>

      {/* Nav items */}
      <List sx={{ flexGrow: 1, px: 1.25, py: 0.5 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = isRouteActive(location.pathname, item.path);
          return (
            <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={NavLink}
                to={item.path}
                onClick={onClose}
                sx={navButtonSx(isActive, false)}
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

      {/* Settings + User */}
      <Box sx={{ px: 1.25, pb: 1.5, pt: 2, mt: "auto" }}>
        <ListItem disablePadding sx={{ mb: 1 }}>
          <ListItemButton
            component={NavLink}
            to="/settings"
            onClick={onClose}
            sx={navButtonSx(isSettingsActive, false)}
          >
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </ListItem>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 1.75,
            py: 1,
            borderRadius: "10px",
            bgcolor: "var(--cs-semantic-color-action-hover)",
          }}
        >
          <Avatar
            sx={{
              width: 32,
              height: 32,
              fontSize: "0.8125rem",
              fontWeight: 700,
              bgcolor: "primary.main",
              color: "primary.contrastText",
            }}
          >
            {coachName.charAt(0).toUpperCase()}
          </Avatar>
          <Typography
            sx={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "var(--cs-semantic-color-text-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {coachName}
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  // ─── Rail content (icon-only collapsed view) ──────────────────────────────
  const railContent = (
    <Box
      sx={{
        height: "100%",
        width: RAIL_WIDTH,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        bgcolor: shellBackground,
        py: 2,
        gap: 0.5,
      }}
    >
      {/* Expand toggle */}
      <Tooltip title="Expand navigation" placement="right">
        <IconButton
          size="small"
          onClick={() => setCollapsed(false)}
          aria-label="Expand navigation"
          sx={{
            mb: 1.5,
            color: "var(--cs-semantic-color-text-secondary)",
            "&:hover": { color: "var(--cs-semantic-color-text-primary)" },
          }}
        >
          <ExpandIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {/* Nav icons */}
      <List sx={{ px: 0, py: 0, width: "100%" }}>
        {NAV_ITEMS.map((item) => {
          const isActive = isRouteActive(location.pathname, item.path);
          return (
            <ListItem key={item.label} disablePadding sx={{ mb: 0.25, px: 0.75 }}>
              <Tooltip title={item.label} placement="right" arrow>
                <ListItemButton
                  component={NavLink}
                  to={item.path}
                  sx={navButtonSx(isActive, true)}
                >
                  <Box sx={{ position: "relative", display: "flex" }}>
                    {item.icon}
                    {item.isLiveTrigger && isLive && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: -2,
                          right: -2,
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          bgcolor: "warning.main",
                          border: "2px solid",
                          borderColor: shellBackground,
                        }}
                      />
                    )}
                  </Box>
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>

      {/* Settings icon at bottom */}
      <Box sx={{ mt: "auto", px: 0.75, width: "100%" }}>
        <Tooltip title="Settings" placement="right" arrow>
          <ListItemButton
            component={NavLink}
            to="/settings"
            sx={navButtonSx(isSettingsActive, true)}
          >
            <SettingsIcon />
          </ListItemButton>
        </Tooltip>

        {/* User avatar */}
        <Tooltip title={coachName} placement="right" arrow>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mt: 1,
              pb: 0.5,
            }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                fontSize: "0.8125rem",
                fontWeight: 700,
                bgcolor: "primary.main",
                color: "primary.contrastText",
                cursor: "default",
              }}
            >
              {coachName.charAt(0).toUpperCase()}
            </Avatar>
          </Box>
        </Tooltip>
      </Box>
    </Box>
  );

  // ─── Mobile: temporary drawer ─────────────────────────────────────────────
  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            bgcolor: shellBackground,
            border: "none",
          },
        }}
      >
        {fullDrawerContent(onMobileClose)}
      </Drawer>
    );
  }

  // ─── Tablet (iPad): permanent rail + temporary overlay drawer ─────────────
  if (isTablet) {
    return (
      <>
        {/* Permanent rail */}
        <Box
          sx={{
            width: RAIL_WIDTH,
            flexShrink: 0,
            bgcolor: shellBackground,
            borderRight: "1px solid var(--cs-semantic-color-border-subtle)",
          }}
        >
          {railContent}
        </Box>

        {/* Temporary full drawer that overlays when rail is tapped to expand */}
        <Drawer
          variant="temporary"
          open={!collapsed}
          onClose={() => setCollapsed(true)}
          ModalProps={{ keepMounted: true }}
          sx={{
            "& .MuiDrawer-paper": {
              width: DRAWER_WIDTH,
              boxSizing: "border-box",
              bgcolor: shellBackground,
              border: "none",
            },
          }}
        >
          {fullDrawerContent(() => setCollapsed(true))}
        </Drawer>
      </>
    );
  }

  // ─── Desktop: permanent drawer, collapsible to rail ───────────────────────
  return (
    <Box
      sx={{
        width: collapsed ? RAIL_WIDTH : DRAWER_WIDTH,
        flexShrink: 0,
        transition: "width 200ms cubic-bezier(0.4, 0, 0.2, 1)",
        bgcolor: shellBackground,
        borderRight: "1px solid var(--cs-semantic-color-border-subtle)",
        overflow: "hidden",
      }}
    >
      {collapsed ? railContent : fullDrawerContent()}
    </Box>
  );
};

export default SideNav;

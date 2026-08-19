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

export interface SideNavProps {
  isLive?: boolean;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  coachName?: string;
  onSearchOpen?: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactElement;
  isLiveTrigger?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/", icon: <DashboardIcon /> },
  { label: "Games", path: "/games", icon: <GamesIcon /> },
  { label: "Live", path: "/game", icon: <LiveIcon />, isLiveTrigger: true },
  { label: "Opponents", path: "/opponents", icon: <OpponentsIcon /> },
  { label: "Players", path: "/players", icon: <PlayersIcon /> },
  { label: "Teams", path: "/teams", icon: <TeamsIcon /> },
  { label: "Reports", path: "/reports", icon: <ReportsIcon /> },
];

const DRAWER_WIDTH = 220;
const RAIL_WIDTH = 64;

const isRouteActive = (pathname: string, path: string): boolean => {
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
   * collapsed state drives both desktop sidebar ↔ rail toggle
   * and iPad rail ↔ temporary overlay drawer toggle.
   *
   * Desktop: starts expanded; user can collapse to rail.
   * Tablet:  starts collapsed (rail only); expand icon opens overlay drawer.
   * Mobile:  no persistent nav; driven entirely by mobileOpen prop.
   */
  const [collapsed, setCollapsed] = React.useState<boolean>(!isDesktop);

  React.useEffect(() => {
    // When viewport resizes into tablet range, always reset to rail
    if (isTablet) setCollapsed(true);
    // Desktop: preserve user preference within session — no forced change
  }, [isTablet]);

  const bg = tokens.layout.appFrame.background;
  const isSettingsActive = isRouteActive(location.pathname, "/settings");

  // ── Shared nav button style ────────────────────────────────────────────────
  const navButtonSx = (active: boolean, rail: boolean) => ({
    minHeight: tokens.touch.targetComfortable,
    px: rail ? 0 : tokens.semantic.spacing.md / 8,
    borderRadius: `${tokens.semantic.shape.radius.md}px`,
    justifyContent: rail ? "center" : "flex-start",
    bgcolor: active
      ? tokens.semantic.color.action.selected
      : "transparent",
    color: active
      ? tokens.semantic.color.text.primary
      : tokens.semantic.color.text.secondary,
    transition: [
      `background-color ${tokens.motion.duration.normal} ${tokens.motion.easing.productive}`,
      `color ${tokens.motion.duration.normal} ${tokens.motion.easing.productive}`,
    ].join(", "),
    "&:hover": {
      bgcolor: active
        ? tokens.semantic.color.action.selected
        : tokens.semantic.color.action.hover,
      color: tokens.semantic.color.text.primary,
    },
    "& .MuiListItemIcon-root": {
      color: "inherit",
      minWidth: rail ? "unset" : 38,
    },
    "& .MuiListItemText-primary": {
      fontWeight: active
        ? tokens.typography.fontWeight.semibold
        : tokens.typography.fontWeight.medium,
      fontSize: tokens.typography.fontSize.sm,
      lineHeight: 1.2,
    },
    "&:focus-visible": {
      outline: `${tokens.semantic.focus.width} solid ${tokens.semantic.color.action.focusRing}`,
      outlineOffset: tokens.semantic.focus.offset,
    },
  });

  // ── Full expanded drawer content ───────────────────────────────────────────
  const fullDrawerContent = (onClose?: () => void) => (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: bg,
      }}
    >
      {/* Logo row */}
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
        {/* Collapse button — not shown inside mobile temporary drawer */}
        {!isMobile && (
          <Tooltip title="Collapse sidebar" placement="right">
            <IconButton
              size="small"
              onClick={() => {
                setCollapsed(true);
                onClose?.();
              }}
              aria-label="Collapse navigation"
              sx={{
                color: tokens.semantic.color.text.secondary,
                "&:hover": { color: tokens.semantic.color.text.primary },
              }}
            >
              <CollapseIcon
                sx={{ fontSize: tokens.semantic.component.iconSize.xs }}
              />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Search button */}
      <Box
        sx={{
          px: tokens.semantic.spacing.md / 8,
          pb: tokens.semantic.spacing.md / 8,
        }}
      >
        <ButtonBase
          onClick={() => {
            onSearchOpen?.();
            onClose?.();
          }}
          aria-label="Open search"
          sx={{
            width: "100%",
            height: 40,
            px: tokens.semantic.spacing.md / 8,
            borderRadius: `${tokens.semantic.shape.radius.md}px`,
            border: `1px solid ${tokens.semantic.color.border.subtle}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: tokens.semantic.spacing.xs / 8,
            color: tokens.semantic.color.text.secondary,
            bgcolor: tokens.semantic.color.background.paper,
            transition: [
              `background-color ${tokens.motion.duration.normal} ${tokens.motion.easing.productive}`,
              `border-color ${tokens.motion.duration.normal} ${tokens.motion.easing.productive}`,
              `color ${tokens.motion.duration.normal} ${tokens.motion.easing.productive}`,
            ].join(", "),
            "&:hover": {
              borderColor: tokens.semantic.color.border.default,
              color: tokens.semantic.color.text.primary,
            },
          }}
        >
          <SearchIcon
            sx={{ fontSize: tokens.semantic.component.iconSize.xs }}
          />
          <Typography
            sx={{
              fontSize: tokens.typography.fontSize.xs,
              fontWeight: tokens.typography.fontWeight.medium,
              color: "inherit",
            }}
          >
            Search
          </Typography>
        </ButtonBase>
      </Box>

      {/* Nav items */}
      <List sx={{ flexGrow: 1, px: 1.25, py: 0.5, overflowY: "auto" }}>
        {NAV_ITEMS.map((item) => {
          const active = isRouteActive(location.pathname, item.path);
          return (
            <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={NavLink}
                to={item.path}
                onClick={onClose}
                sx={navButtonSx(active, false)}
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
                          borderColor: bg,
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

      {/* Settings + user footer */}
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
            gap: tokens.semantic.spacing.xs / 8,
            px: tokens.semantic.spacing.md / 8,
            py: tokens.semantic.spacing.xs / 8,
            borderRadius: `${tokens.semantic.shape.radius.md}px`,
            bgcolor: tokens.semantic.color.action.hover,
          }}
        >
          <Avatar
            sx={{
              width: 32,
              height: 32,
              fontSize: tokens.typography.fontSize.xs,
              fontWeight: tokens.typography.fontWeight.bold,
              bgcolor: tokens.semantic.color.brand.primary.main,
              color: tokens.semantic.color.brand.primary.contrastText,
              flexShrink: 0,
            }}
          >
            {coachName.charAt(0).toUpperCase()}
          </Avatar>
          <Typography
            sx={{
              fontSize: tokens.typography.fontSize.xs,
              fontWeight: tokens.typography.fontWeight.semibold,
              color: tokens.semantic.color.text.primary,
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

  // ── Rail (icon-only) content ───────────────────────────────────────────────
  const railContent = (
    <Box
      sx={{
        height: "100%",
        width: RAIL_WIDTH,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        bgcolor: bg,
        py: 2,
      }}
    >
      {/* Expand toggle */}
      <Tooltip title="Expand sidebar" placement="right">
        <IconButton
          size="small"
          onClick={() => setCollapsed(false)}
          aria-label="Expand navigation"
          sx={{
            mb: 1.5,
            color: tokens.semantic.color.text.secondary,
            "&:hover": { color: tokens.semantic.color.text.primary },
          }}
        >
          <ExpandIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {/* Nav icons */}
      <List sx={{ px: 0, py: 0, width: "100%" }}>
        {NAV_ITEMS.map((item) => {
          const active = isRouteActive(location.pathname, item.path);
          return (
            <ListItem
              key={item.label}
              disablePadding
              sx={{ mb: 0.25, px: 0.75 }}
            >
              <Tooltip title={item.label} placement="right" arrow>
                <ListItemButton
                  component={NavLink}
                  to={item.path}
                  sx={navButtonSx(active, true)}
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
                          borderColor: bg,
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

      {/* Settings + user at bottom of rail */}
      <Box sx={{ mt: "auto", px: 0.75, width: "100%" }}>
        <Tooltip title="Settings" placement="right" arrow>
          <ListItemButton
            component={NavLink}
            to="/settings"
            sx={{ ...navButtonSx(isSettingsActive, true), mb: 0.5 }}
          >
            <SettingsIcon />
          </ListItemButton>
        </Tooltip>

        <Tooltip title={coachName} placement="right" arrow>
          <Box sx={{ display: "flex", justifyContent: "center", pb: 0.5 }}>
            <Avatar
              sx={{
                width: tokens.semantic.spacing.xl,
                height: tokens.semantic.spacing.xl,
                fontSize: tokens.typography.fontSize.xs,
                fontWeight: tokens.typography.fontWeight.bold,
                bgcolor: tokens.semantic.color.brand.primary.main,
                color: tokens.semantic.color.brand.primary.contrastText,
              }}
            >
              {coachName.charAt(0).toUpperCase()}
            </Avatar>
          </Box>
        </Tooltip>
      </Box>
    </Box>
  );

  // ── Render: Mobile ─────────────────────────────────────────────────────────
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
            bgcolor: bg,
            border: "none",
          },
        }}
      >
        {fullDrawerContent(onMobileClose)}
      </Drawer>
    );
  }

  // ── Render: Tablet (iPad) ──────────────────────────────────────────────────
  if (isTablet) {
    return (
      <>
        {/* Permanent icon rail — sticky so it stays put while content scrolls */}
        <Box
          sx={{
            width: RAIL_WIDTH,
            flexShrink: 0,
            bgcolor: bg,
            position: "sticky",
            top: 0,
            height: "100dvh",
            alignSelf: "flex-start",
          }}
        >
          {railContent}
        </Box>

        {/* Temporary overlay drawer — triggered by expand icon in rail */}
        <Drawer
          variant="temporary"
          open={!collapsed}
          onClose={() => setCollapsed(true)}
          ModalProps={{ keepMounted: true }}
          sx={{
            "& .MuiDrawer-paper": {
              width: DRAWER_WIDTH,
              boxSizing: "border-box",
              bgcolor: bg,
              border: "none",
            },
          }}
        >
          {fullDrawerContent(() => setCollapsed(true))}
        </Drawer>
      </>
    );
  }

  // ── Render: Desktop ────────────────────────────────────────────────────────
  return (
    <Box
      sx={{
        width: collapsed ? RAIL_WIDTH : DRAWER_WIDTH,
        flexShrink: 0,
        transition: `width ${tokens.motion.duration.normal} ${tokens.motion.easing.productive}`,
        bgcolor: bg,
        overflow: "hidden",
      }}
    >
      {collapsed ? railContent : fullDrawerContent()}
    </Box>
  );
};

export default SideNav;

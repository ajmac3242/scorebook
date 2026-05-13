import React from "react";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  useMediaQuery,
  IconButton,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  SportsBasketball as GamesIcon,
  FlashOn as LiveIcon,
  People as PlayersIcon,
  Groups as TeamsIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { NavLink, useLocation } from "react-router-dom";
import CourtSightLogo from "../CourtSightLogo";

interface SideNavProps {
  /** Whether the game is currently live (to show the animated dot) */
  isLive?: boolean;
  /** Mobile open state */
  mobileOpen?: boolean;
  /** Mobile close handler */
  onMobileClose?: () => void;
  /** Coach display name for the bottom pill */
  coachName?: string;
  /** Search trigger */
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

/**
 * SideNav — The vertical navigation drawer for CourtSight.
 * Permanent on tablet/desktop (>= 768px), temporary on mobile.
 */
const SideNav: React.FC<SideNavProps> = ({
  isLive = false,
  mobileOpen = false,
  onMobileClose,
  coachName = "Coach",
  onSearchOpen,
}) => {
  const isDesktop = useMediaQuery("(min-width:768px)");
  const location = useLocation();

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.paper",
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          px: 2.5,
          pt: 2.5,
          pb: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
        }}
      >
        <CourtSightLogo width={152} />
      </Box>

      {/* Search */}
      <Box
        sx={{
          px: 2,
          pb: 1.5,
        }}
      >
        <IconButton
          onClick={onSearchOpen}
          aria-label="Open search"
          sx={{
            width: "100%",
            height: 40,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            justifyContent: "flex-start",
            px: 1.5,
            gap: 1,
            color: "text.secondary",
            bgcolor: "background.paper",
            "&:hover": {
              bgcolor: "action.hover",
            },
          }}
        >
          <SearchIcon fontSize="small" />
          <Typography
            sx={{
              fontSize: "0.875rem",
              color: "text.secondary",
              fontWeight: 500,
            }}
          >
            Search
          </Typography>
        </IconButton>
      </Box>

      {/* Navigation Links */}
      <List sx={{ flexGrow: 1, px: 2 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={NavLink}
                to={item.path}
                onClick={onMobileClose}
                sx={{
                  minHeight: 44,
                  borderRadius: 2,
                  bgcolor: isActive ? "primary.container" : "transparent",
                  color: isActive ? "primary.main" : "text.secondary",
                  "&:hover": {
                    bgcolor: isActive ? "primary.container" : "action.hover",
                    color: isActive ? "primary.main" : "text.primary",
                  },
                  "& .MuiListItemIcon-root": {
                    color: "inherit",
                    minWidth: 40,
                  },
                }}
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
                          bgcolor: "#FF6B1A",
                          border: "2px solid",
                          borderColor: "background.paper",
                        }}
                      />
                    )}
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 700 : 500,
                    fontSize: "0.9rem",
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Settings & Profile Pill */}
      <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}>
        <ListItem disablePadding sx={{ mb: 1 }}>
          <ListItemButton
            component={NavLink}
            to="/settings"
            onClick={onMobileClose}
            sx={{
              minHeight: 44,
              borderRadius: 2,
              bgcolor:
                location.pathname === "/settings"
                  ? "primary.container"
                  : "transparent",
              color:
                location.pathname === "/settings"
                  ? "primary.main"
                  : "text.secondary",
              "&:hover": {
                bgcolor:
                  location.pathname === "/settings"
                    ? "primary.container"
                    : "action.hover",
                color:
                  location.pathname === "/settings"
                    ? "primary.main"
                    : "text.primary",
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText
              primary="Settings"
              primaryTypographyProps={{ fontSize: "0.9rem", fontWeight: 500 }}
            />
          </ListItemButton>
        </ListItem>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            p: 1.5,
            borderRadius: 3,
            bgcolor: "action.hover",
          }}
        >
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: "primary.main",
              fontSize: "0.85rem",
              fontWeight: 700,
            }}
          >
            {coachName[0]}
          </Avatar>
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, color: "text.primary" }}
          >
            {coachName}
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { md: 240 }, flexShrink: { md: 0 } }}>
      {!isDesktop && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={onMobileClose}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: 240 },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {isDesktop && (
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: 240,
              position: "relative",
              height: "100%",
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      )}
    </Box>
  );
};

export default SideNav;

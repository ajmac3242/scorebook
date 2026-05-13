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
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  SportsBasketball as GamesIcon,
  FlashOn as LiveIcon,
  People as PlayersIcon,
  Groups as TeamsIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
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
      {/* Logo Section */}
      <Box sx={{ p: 3, display: "flex", justifyContent: "center" }}>
        <CourtSightLogo width={160} />
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
              borderRadius: 2,
              color: location.pathname === "/settings" ? "primary.main" : "text.secondary",
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
      {/* Mobile Drawer */}
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

      {/* Desktop Drawer */}
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

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
import { APP_SHELL_LAYOUT } from "./AppShell";

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

      <Box sx={{ px: 2, pb: 1.5 }}>
        <ButtonBase
          onClick={onSearchOpen}
          aria-label="Open search"
          sx={{
            width: "100%",
            height: 40,
            px: 1.5,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: 1,
            color: "text.secondary",
            bgcolor: "background.paper",
            "&:hover": {
              bgcolor: "action.hover",
            },
          }}
        >
          <SearchIcon sx={{ fontSize: 18 }} />
          <Typography
            sx={{
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "text.secondary",
            }}
          >
            Search
          </Typography>
        </ButtonBase>
      </Box>

      <List sx={{ flexGrow: 1, px: 1.5 }}>
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
                  px: 1.5,
                  borderRadius: 2,
                  justifyContent: "flex-start",
                  bgcolor: isActive ? "action.selected" : "transparent",
                  color: isActive ? "primary.main" : "text.secondary",
                  "&:hover": {
                    bgcolor: isActive ? "action.selected" : "action.hover",
                    color: isActive ? "primary.main" : "text.primary",
                  },
                  "& .MuiListItemIcon-root": {
                    color: "inherit",
                    minWidth: 36,
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
                          bgcolor: "warning.main",
                          border: "2px solid",
                          borderColor: "background.paper",
                        }}
                      />
                    )}
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  slotProps={{
              primary: {
                sx: {
                  fontWeight: isActive ? 700 : 500,        
                  fontSize: "0.9rem",              
                                },
            },
          }}
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ p: 1.5, mt: "auto" }}>
        <ListItem disablePadding sx={{ mb: 1 }}>
          <ListItemButton
            component={NavLink}
            to="/settings"
            onClick={onMobileClose}
            sx={{
              minHeight: 44,
              px: 1.5,
              borderRadius: 2,
              justifyContent: "flex-start",
              bgcolor:
                location.pathname === "/settings"
                  ? "action.selected"
                  : "transparent",
              color:
                location.pathname === "/settings"
                  ? "primary.main"
                  : "text.secondary",
              "&:hover": {
                bgcolor:
                  location.pathname === "/settings"
                    ? "action.selected"
                    : "action.hover",
                color:
                  location.pathname === "/settings"
                    ? "primary.main"
                    : "text.primary",
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText
              primary="Settings"
              slotProps={{
                primary: {
                                  sx: {
                  fontSize: "0.9rem",
                  fontWeight: 500,
                                                    },
                },
              }}
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
              color: "primary.contrastText",
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

  if (!isDesktop) {
    return (
      <Drawer
        anchor="left"
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        slotProps={{ modal: { keepMounted: true  }}}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: APP_SHELL_LAYOUT.drawerWidth,
            left: 0,
            bgcolor: "background.paper",
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Box
      component="nav"
      sx={{
        width: "100%",
        height: "100%",
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.paper",
      }}
    >
      {drawerContent}
    </Box>
  );
};

export default SideNav;

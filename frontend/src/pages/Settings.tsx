import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Divider,
  Stack,
  Avatar,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  Logout as LogoutIcon,
  Wifi as OnlineIcon,
  WifiOff as OfflineIcon,
  Refresh as SyncingIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { useAuth } from "../hooks/useAuth";
import { syncService } from "../utils/syncService";
import EntityBanner from "../components/EntityBanner";

/**
 * Settings page component.
 * Displays system status and provides account management options.
 */
const Settings: React.FC = () => {
  const { logout } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const interval = setInterval(() => {
      setIsSyncing(syncService.getSyncingStatus());
    }, 1000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  /**
   * Handles the logout button click.
   * If there are unsynced changes, a warning dialog is shown.
   */
  const handleLogoutClick = async () => {
    const hasUnsynced = await syncService.hasUnsyncedChanges();
    if (hasUnsynced) {
      setLogoutDialogOpen(true);
    } else {
      logout();
    }
  };

  /**
   * Confirms and executes the logout action from the dialog.
   */
  const confirmLogout = () => {
    setLogoutDialogOpen(false);
    logout();
  };

  const logoutDialog = (
    <Dialog open={logoutDialogOpen} onClose={() => setLogoutDialogOpen(false)}>
      <DialogTitle sx={{ fontFamily: "var(--serif)" }}>
        Unsynced Changes
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          You have data that hasn't been synced to the server yet. If you logout
          now, these changes may be lost. Are you sure you want to logout?
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={() => setLogoutDialogOpen(false)} color="inherit">
          Cancel
        </Button>
        <Button onClick={confirmLogout} color="error" variant="contained">
          Logout Anyway
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box sx={{ pb: 8 }}>
      <EntityBanner
        title="Settings"
        icon={<SettingsIcon />}
        subtitle="Manage your application and view system status"
        backTo="/"
      />

      <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            maxWidth: 500,
            width: "100%",
            borderRadius: 4,
            border: "1px solid rgba(0,0,0,0.05)",
            textAlign: "center",
          }}
        >
          <Avatar
            sx={{
              width: 100,
              height: 100,
              bgcolor: "primary.main",
              mx: "auto",
              mb: 3,
              fontSize: "3rem",
            }}
          >
            <SettingsIcon fontSize="inherit" />
          </Avatar>

          <Typography variant="h4" sx={{ mb: 1, fontFamily: "var(--serif)" }}>
            Application Settings
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            System Configuration
          </Typography>

          <Divider sx={{ mb: 4 }} />

          <Typography
            variant="subtitle1"
            gutterBottom
            align="left"
            sx={{ fontWeight: 600 }}
          >
            System Status
          </Typography>

          <Stack spacing={2} sx={{ mb: 4 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                p: 2,
                bgcolor: "background.default",
                borderRadius: 2,
              }}
            >
              <Typography variant="body2">Network Connection</Typography>
              <Chip
                icon={isOnline ? <OnlineIcon /> : <OfflineIcon />}
                label={isOnline ? "Online" : "Offline"}
                color={isOnline ? "success" : "error"}
                size="small"
              />
            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                p: 2,
                bgcolor: "background.default",
                borderRadius: 2,
              }}
            >
              <Typography variant="body2">Synchronization Status</Typography>
              <Chip
                icon={<SyncingIcon className={isSyncing ? "spin" : ""} />}
                label={isSyncing ? "Syncing..." : "Up to date"}
                color={isSyncing ? "secondary" : "default"}
                size="small"
              />
            </Box>
          </Stack>

          <Button
            variant="contained"
            color="error"
            fullWidth
            size="large"
            startIcon={<LogoutIcon />}
            onClick={handleLogoutClick}
            sx={{ borderRadius: 2 }}
          >
            Logout
          </Button>
        </Paper>
      </Box>
      {logoutDialog}
    </Box>
  );
};

export default Settings;

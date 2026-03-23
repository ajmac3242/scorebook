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
} from "@mui/material";
import {
  Logout as LogoutIcon,
  Wifi as OnlineIcon,
  WifiOff as OfflineIcon,
  Refresh as SyncingIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
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

          <Typography variant="subtitle1" gutterBottom align="left" sx={{ fontWeight: 600 }}>
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
            onClick={logout}
            sx={{ borderRadius: 2 }}
          >
            Logout
          </Button>
        </Paper>
      </Box>
    </Box>
  );
};

export default Settings;
